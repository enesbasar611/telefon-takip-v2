import crypto from "crypto";
import http2, { type ClientHttp2Session } from "http2";
import https from "https";
import {
  applyImeiAutoComplete,
  buildAppleExtendedSpecs,
  classifyBtkStatus,
  isValidImeiLuhn,
  normalizeImeiDigits,
  parseBrandAndModel,
  type BtkOfficialDetails,
  type ImeiLookupResult,
} from "./imei-utils";
import { lookupTacWithLocalDb, recordLearnedTacMapping } from "./tac-store";

const BTK_ORIGIN = "https://www.turkiye.gov.tr";
const BTK_URL = `${BTK_ORIGIN}/imei-sorgulama`;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8500;
const MAX_FRESH_SESSION_ATTEMPTS = 2;

interface PendingBtkChallenge {
  cookies: Record<string, string>;
  actionUrl: string;
  hiddenFields: Record<string, string>;
  imeiFieldName: string;
  captchaFieldName: string;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __btkCaptchaChallenges: Map<string, PendingBtkChallenge> | undefined;
}

function getChallengeStore(): Map<string, PendingBtkChallenge> {
  if (!globalThis.__btkCaptchaChallenges) {
    globalThis.__btkCaptchaChallenges = new Map();
  }
  const store = globalThis.__btkCaptchaChallenges;
  const now = Date.now();
  for (const [id, item] of Array.from(store.entries())) {
    if (now - item.createdAt > CHALLENGE_TTL_MS) {
      store.delete(id);
    }
  }
  return store;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSetCookies(
  setCookieHeaders: string[] | string | undefined,
  jar: Record<string, string>
) {
  const rawList: string[] = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];

  for (const raw of rawList) {
    const firstPart = raw.split(";")[0]?.trim();
    if (!firstPart) continue;
    const eqIdx = firstPart.indexOf("=");
    if (eqIdx > 0) {
      const k = firstPart.slice(0, eqIdx).trim();
      const v = firstPart.slice(eqIdx + 1).trim();
      jar[k] = v;
    }
  }
}

function serializeCookieJar(jar: Record<string, string>): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface HttpRawResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
  text: () => string;
}

interface BtkTransport {
  h2Session: ClientHttp2Session | null;
  h2Disabled: boolean;
}

function createBtkTransport(): BtkTransport {
  return { h2Session: null, h2Disabled: false };
}

function closeBtkTransport(transport: BtkTransport) {
  if (transport.h2Session) {
    try {
      transport.h2Session.close();
    } catch {
      // ignore close errors
    }
    transport.h2Session = null;
  }
}

function ensureHttp2Session(transport: BtkTransport): Promise<ClientHttp2Session> {
  if (transport.h2Session && !transport.h2Session.closed && !transport.h2Session.destroyed) {
    return Promise.resolve(transport.h2Session);
  }

  return new Promise((resolve, reject) => {
    const client = http2.connect(BTK_ORIGIN);
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          client.destroy();
        } catch {}
        reject(new Error("HTTP/2 bağlantı zaman aşımı"));
      }
    }, REQUEST_TIMEOUT_MS);

    client.once("connect", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        transport.h2Session = client;
        resolve(client);
      }
    });

    client.once("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
      if (transport.h2Session === client) {
        transport.h2Session = null;
      }
    });

    client.once("close", () => {
      if (transport.h2Session === client) {
        transport.h2Session = null;
      }
    });
  });
}

async function sendHttp2Request(
  transport: BtkTransport,
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<HttpRawResponse> {
  const urlObj = new URL(targetUrl);
  if (urlObj.origin !== BTK_ORIGIN) {
    return sendFreshHttpsRequest(targetUrl, method, headers, body);
  }

  const session = await ensureHttp2Session(transport);

  return new Promise((resolve, reject) => {
    const h2Headers: http2.OutgoingHttpHeaders = {
      ":method": method,
      ":path": `${urlObj.pathname}${urlObj.search}`,
      ":authority": urlObj.host,
      ":scheme": "https",
      "user-agent": headers["User-Agent"] || DEFAULT_UA,
      "accept-language": headers["Accept-Language"] || "tr-TR,tr;q=0.9,en;q=0.8",
    };

    for (const [key, val] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (
        lower === "host" ||
        lower === "connection" ||
        lower === "content-length" ||
        lower === "user-agent" ||
        lower === "accept-language"
      ) {
        continue;
      }
      h2Headers[lower] = val;
    }

    if (body !== undefined) {
      h2Headers["content-length"] = String(Buffer.byteLength(body, "utf8"));
    }

    const stream = session.request(h2Headers);
    stream.setTimeout(REQUEST_TIMEOUT_MS, () => {
      stream.close();
      reject(new Error("e-Devlet HTTP/2 yanıtı zaman aşımına uğradı."));
    });

    let respHeaders: Record<string, string | string[] | undefined> = {};
    const chunks: Buffer[] = [];

    stream.on("response", (h) => {
      respHeaders = h as Record<string, string | string[] | undefined>;
    });
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => {
      const buf = Buffer.concat(chunks);
      const status = Number(respHeaders[":status"] || 0);
      resolve({
        status,
        ok: status >= 200 && status < 300,
        headers: respHeaders,
        body: buf,
        text: () => buf.toString("utf8"),
      });
    });
    stream.on("error", reject);

    if (body !== undefined) {
      stream.write(body, "utf8");
    }
    stream.end();
  });
}

function sendFreshHttpsRequest(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<HttpRawResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const reqHeaders: Record<string, string> = {
      ...headers,
      "User-Agent": headers["User-Agent"] || DEFAULT_UA,
      "Accept-Language": headers["Accept-Language"] || "tr-TR,tr;q=0.9,en;q=0.8",
      Connection: "close",
    };
    if (body !== undefined) {
      reqHeaders["Content-Length"] = String(Buffer.byteLength(body, "utf8"));
    }

    const req = https.request(
      {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: `${urlObj.pathname}${urlObj.search}`,
        method,
        family: 4,
        agent: false,
        timeout: REQUEST_TIMEOUT_MS,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const status = res.statusCode || 0;
          resolve({
            status,
            ok: status >= 200 && status < 300,
            headers: res.headers as Record<string, string | string[] | undefined>,
            body: buf,
            text: () => buf.toString("utf8"),
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("e-Devlet isteği zaman aşımına uğradı."));
    });
    req.on("error", reject);

    if (body !== undefined) {
      req.write(body, "utf8");
    }
    req.end();
  });
}

function isRetryableTransportError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = String((err as { code?: unknown }).code || "");
  const msg = String((err as { message?: unknown }).message || "");
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EPIPE" ||
    code === "ERR_HTTP2_GOAWAY_SESSION" ||
    code === "ERR_HTTP2_SESSION_ERROR" ||
    msg.includes("ECONNRESET") ||
    msg.includes("socket hang up") ||
    msg.includes("GOAWAY")
  );
}

async function performHttpRequest(
  transport: BtkTransport,
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<HttpRawResponse> {
  if (!transport.h2Disabled && targetUrl.startsWith(BTK_ORIGIN)) {
    try {
      return await sendHttp2Request(transport, targetUrl, method, headers, body);
    } catch (err) {
      closeBtkTransport(transport);
      if (!isRetryableTransportError(err)) {
        transport.h2Disabled = true;
      }
      // Fallback / retry once on HTTP/2 or IPv4 HTTPS
      try {
        if (!transport.h2Disabled) {
          return await sendHttp2Request(transport, targetUrl, method, headers, body);
        }
      } catch {
        transport.h2Disabled = true;
      }
    }
  }
  return sendFreshHttpsRequest(targetUrl, method, headers, body);
}

async function fetchWithRedirectsAndCookies(
  initialUrl: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
  jar: Record<string, string>,
  transport: BtkTransport,
  maxRedirects = 5
): Promise<HttpRawResponse> {
  let currentUrl = initialUrl;
  let currentMethod = init.method || "GET";
  let currentHeaders: Record<string, string> = { ...(init.headers || {}) };
  let currentBody = init.body;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let res: HttpRawResponse | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const headersWithCookie: Record<string, string> = { ...currentHeaders };
      const cookieHeader = serializeCookieJar(jar);
      if (cookieHeader) headersWithCookie.Cookie = cookieHeader;

      try {
        res = await performHttpRequest(
          transport,
          currentUrl,
          currentMethod,
          headersWithCookie,
          currentBody
        );
        break;
      } catch (err) {
        if (attempt === 1 || !isRetryableTransportError(err)) throw err;
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    if (!res) throw new Error("e-Devlet yanıtı alınamadı.");

    extractSetCookies(res.headers["set-cookie"], jar);

    if (res.status >= 300 && res.status < 400) {
      const rawLoc = res.headers.location;
      const location = Array.isArray(rawLoc) ? rawLoc[0] : rawLoc;
      if (!location) return res;

      currentUrl = new URL(location, currentUrl).toString();
      const keepMethod = res.status === 307 || res.status === 308;
      currentMethod = keepMethod ? currentMethod : "GET";
      if (!keepMethod) currentBody = undefined;
      currentHeaders = {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: BTK_URL,
      };
      continue;
    }

    return res;
  }

  throw new Error("e-Devlet yönlendirme limiti aşıldı.");
}

function parseBtkFormMetadata(html: string) {
  const allForms = Array.from(
    html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)
  );
  const serviceForm =
    allForms.find(
      (m) =>
        /imei-sorgulama|mainForm|serviceForm/i.test(m[1]) ||
        /txtImei|captcha/i.test(m[2])
    ) || allForms.find((m) => /method=["']post["']/i.test(m[1]));

  const formAttrs = serviceForm?.[1] || "";
  const actionMatch = formAttrs.match(/action=["']([^"']*)["']/i);
  const rawAction = actionMatch?.[1] || "/imei-sorgulama?submit";
  const actionUrl = rawAction.startsWith("http")
    ? rawAction
    : new URL(decodeHtmlEntities(rawAction), BTK_URL).toString();
  const formHtml = serviceForm?.[2] || html;

  const hiddenFields: Record<string, string> = {};
  const inputRegex = /<input\b[^>]*>/gi;
  let imeiFieldName = "txtImei";
  let captchaFieldName = "captcha_name";

  const inputs = formHtml.match(inputRegex) || [];
  for (const tag of inputs) {
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const nameMatch = tag.match(/name=["']([^"']+)["']/i);
    const valueMatch = tag.match(/value=["']([^"']*)["']/i);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const type = (typeMatch?.[1] || "text").toLowerCase();
    const val = valueMatch?.[1] ? decodeHtmlEntities(valueMatch[1]) : "";

    if (type === "hidden") {
      hiddenFields[name] = val;
    } else if (/imei/i.test(name)) {
      imeiFieldName = name;
    } else if (/captcha|guvenlik|security/i.test(name)) {
      captchaFieldName = name;
    }
  }

  const captchaImgMatch =
    formHtml.match(/<img[^>]*class=["'][^"']*captchaImage[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
    formHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*captchaImage[^"']*["']/i) ||
    html.match(/<img[^>]*class=["'][^"']*captchaImage[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*captchaImage[^"']*["']/i);

  const captchaSrc = captchaImgMatch?.[1]
    ? new URL(decodeHtmlEntities(captchaImgMatch[1]), BTK_URL).toString()
    : null;

  return { actionUrl, hiddenFields, imeiFieldName, captchaFieldName, captchaSrc };
}

function parseBtkPageError(html: string): string | null {
  const fieldErr = html.match(/<div[^>]*class=["'][^"']*fieldError[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (fieldErr?.[1]) {
    const txt = decodeHtmlEntities(fieldErr[1]);
    if (txt) return txt;
  }
  const errBox = html.match(
    /<div[^>]*class=["'][^"']*(?:errorContainer|warningContainer)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  );
  if (errBox?.[1]) {
    const txt = decodeHtmlEntities(errBox[1]);
    if (txt) return txt;
  }
  return null;
}

function isTransientBtkPageError(msg: string | null | undefined): boolean {
  if (!msg) return false;
  const lower = msg.toLocaleLowerCase("tr-TR");
  return (
    lower.includes("teknik aksaklık") ||
    lower.includes("aksaklık") ||
    lower.includes("oturum") ||
    lower.includes("zaman aşım") ||
    lower.includes("geçici") ||
    lower.includes("daha sonra") ||
    lower.includes("hata oluştu") ||
    lower.includes("tamamlanamadı")
  );
}

function isWrongCaptchaError(msg: string | null | undefined): boolean {
  if (!msg) return false;
  const lower = msg.toLocaleLowerCase("tr-TR");
  return (
    lower.includes("güvenlik") ||
    lower.includes("resim") ||
    lower.includes("doğrulama") ||
    lower.includes("yanlış") ||
    lower.includes("hatalı")
  );
}

function parseBtkResultContainer(html: string, queriedImei: string): BtkOfficialDetails | null {
  // Always inspect <dl class="compact"> first — div.resultContainer can wrap nested <div> tags
  // that would prematurely terminate a naive </div> regex match.
  const dlMatch = html.match(/<dl[^>]*class=["'][^"']*compact[^"']*["'][^>]*>([\s\S]*?)<\/dl>/i);
  let scope = dlMatch?.[1] || "";

  if (!scope) {
    const rcIdx = html.search(/class=["'][^"']*resultContainer[^"']*["']/i);
    if (rcIdx >= 0) {
      const afterRc = html.slice(rcIdx);
      const innerDl = afterRc.match(/<dl[^>]*>([\s\S]*?)<\/dl>/i);
      scope = innerDl?.[1] || afterRc.slice(0, 6000);
    }
  }

  if (!scope) return null;

  const ddMatches = Array.from(scope.matchAll(/<dd[^>]*>([\s\S]*?)<\/dd>/gi));
  if (ddMatches.length < 2) return null;

  const dtMatches = Array.from(scope.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/gi));
  const values = ddMatches.map((m) => decodeHtmlEntities(m[1]));

  let imei = values[0] || queriedImei;
  let durum = values[1] || "";
  let kaynak = values[2] || "Bilgi Teknolojileri ve İletişim Kurumu";
  let sorguTarihi = values[3] || new Date().toLocaleDateString("tr-TR");
  let markaModel = values[4] || "";

  if (dtMatches.length === ddMatches.length) {
    for (let i = 0; i < dtMatches.length; i++) {
      const label = decodeHtmlEntities(dtMatches[i][1]).toLocaleLowerCase("tr-TR");
      const val = values[i];
      if (!val) continue;
      if (label.includes("imei")) imei = val;
      else if (label.includes("durum")) durum = val;
      else if (label.includes("kaynak")) kaynak = val;
      else if (label.includes("tarih")) sorguTarihi = val;
      else if (label.includes("marka") || label.includes("model")) markaModel = val;
    }
  }

  if (!durum) return null;

  return {
    imei,
    durum,
    kaynak,
    sorguTarihi,
    markaModel,
    classification: classifyBtkStatus(durum),
  };
}

async function fetchCaptchaImageAsDataUrl(
  captchaUrl: string,
  jar: Record<string, string>,
  transport: BtkTransport
): Promise<string | null> {
  const res = await fetchWithRedirectsAndCookies(
    captchaUrl,
    {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: BTK_URL,
      },
    },
    jar,
    transport
  );
  if (!res.ok) return null;
  const rawCt = res.headers["content-type"];
  const mime = (Array.isArray(rawCt) ? rawCt[0] : rawCt) || "image/png";
  return `data:${mime};base64,${res.body.toString("base64")}`;
}

function buildFinalBtkResult(
  baseResult: ImeiLookupResult,
  btk: BtkOfficialDetails
): ImeiLookupResult {
  const parsed = parseBrandAndModel(btk.markaModel, baseResult.brand, baseResult.model);
  const resolvedBrand = parsed.brand;
  const resolvedModel = parsed.model;
  const appleSpecs =
    resolvedBrand?.toLowerCase() === "apple"
      ? buildAppleExtendedSpecs(resolvedModel || btk.markaModel, baseResult.tacMatch?.modelCode)
      : baseResult.appleSpecs;

  return {
    ...baseResult,
    brand: resolvedBrand,
    model: resolvedModel,
    appleSpecs,
    btk,
    btkPendingCaptcha: false,
    btkError: null,
    cached: false,
    checkedAt: new Date().toISOString(),
  };
}

export interface LookupImeiParams {
  rawImei: string;
  challengeId?: string;
  captchaCode?: string;
  skipCache?: boolean;
  shopId?: string | null;
}

/**
 * Resolves 14+1 IMEI Luhn validity, TAC brand/model metadata, Apple extended device info,
 * and live official e-Devlet BTK status (zero caching so copied/cloned changes are always detected).
 */
export async function lookupSingleImei(params: LookupImeiParams): Promise<ImeiLookupResult> {
  const normalized = normalizeImeiDigits(params.rawImei);
  const completed =
    normalized.length === 14
      ? applyImeiAutoComplete("", normalized)
      : { value: normalized, autoCompleted: false };

  const imei = completed.value;
  const luhnValid = isValidImeiLuhn(imei);
  const tac = imei.slice(0, 8);
  const tacMatch = await lookupTacWithLocalDb(imei);

  const brand = tacMatch?.brand || null;
  const model = tacMatch?.model || null;
  const appleSpecs = tacMatch?.appleSpecs || null;

  const baseResult: ImeiLookupResult = {
    imei,
    luhnValid,
    autoCompleted15thDigit: completed.autoCompleted,
    tac,
    brand,
    model,
    tacMatch,
    appleSpecs,
    btk: null,
    btkError: null,
    cached: false,
    checkedAt: new Date().toISOString(),
  };

  if (imei.length !== 15 || !luhnValid) {
    return {
      ...baseResult,
      btkError:
        imei.length < 14
          ? "Sorgulama için en az 14 haneli IMEI numarası girilmelidir."
          : "IMEI Luhn kontrol hanesi (15. hane) geçersiz görünüyor.",
    };
  }

  const challengeStore = getChallengeStore();
  const transport = createBtkTransport();

  try {
    // 1. If user supplied a human-entered CAPTCHA code for an active challenge, submit it
    if (params.challengeId && params.captchaCode?.trim()) {
      const pending = challengeStore.get(params.challengeId);
      if (!pending) {
        return await startFreshBtkSession(
          baseResult,
          imei,
          transport,
          "Güvenlik kodu oturumu zaman aşımına uğradı. Lütfen yeni kodu girin.",
          params.shopId
        );
      }

      const formBody = new URLSearchParams();
      for (const [k, v] of Object.entries(pending.hiddenFields)) {
        formBody.set(k, v);
      }
      formBody.set(pending.imeiFieldName, imei);
      formBody.set(pending.captchaFieldName, params.captchaCode.trim());

      const postRes = await fetchWithRedirectsAndCookies(
        pending.actionUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: BTK_ORIGIN,
            Referer: BTK_URL,
          },
          body: formBody.toString(),
        },
        pending.cookies,
        transport
      );
      challengeStore.delete(params.challengeId);

      const html = postRes.text();
      const btk = parseBtkResultContainer(html, imei);

      if (btk) {
        const finalRes = buildFinalBtkResult(baseResult, btk);
        void recordLearnedTacMapping({
          imeiOrTac: imei,
          brand: finalRes.brand,
          model: finalRes.model,
          shopId: params.shopId,
        });
        return finalRes;
      }

      const pageErr = parseBtkPageError(html);
      const nextForm = parseBtkFormMetadata(html);
      if (nextForm.captchaSrc && (!isTransientBtkPageError(pageErr) || isWrongCaptchaError(pageErr))) {
        const imageDataUrl = await fetchCaptchaImageAsDataUrl(
          nextForm.captchaSrc,
          pending.cookies,
          transport
        );
        if (imageDataUrl) {
          const newChallengeId = crypto.randomUUID();
          challengeStore.set(newChallengeId, {
            cookies: pending.cookies,
            actionUrl: nextForm.actionUrl,
            hiddenFields: nextForm.hiddenFields,
            imeiFieldName: nextForm.imeiFieldName,
            captchaFieldName: nextForm.captchaFieldName,
            createdAt: Date.now(),
          });
          return {
            ...baseResult,
            btkPendingCaptcha: true,
            captchaImageDataUrl: imageDataUrl,
            challengeId: newChallengeId,
            btkError:
              pageErr || "Güvenlik kodu doğrulanamadı. Lütfen görseldeki yeni kodu yazın.",
          };
        }
      }

      // If e-Devlet dropped/hiccupped after CAPTCHA submission without rejecting the code,
      // automatically run a clean fresh session attempt right away so the user doesn't have to re-query manually.
      closeBtkTransport(transport);
      return await startFreshBtkSession(
        baseResult,
        imei,
        transport,
        pageErr && isWrongCaptchaError(pageErr) ? pageErr : undefined,
        params.shopId
      );
    }

    // 2. Fresh live request to turkiye.gov.tr/imei-sorgulama (auto-retries transient hiccups once)
    return await startFreshBtkSession(baseResult, imei, transport, undefined, params.shopId);
  } catch (error) {
    console.error("BTK lookup error:", error);
    return {
      ...baseResult,
      btkError:
        "e-Devlet BTK servisine şu an doğrudan ulaşılamadı. Cihaz TAC bilgisi gösteriliyor; BTK doğrulaması için tekrar deneyebilir veya e-Devlet bağlantısını kullanabilirsiniz.",
    };
  } finally {
    closeBtkTransport(transport);
  }
}

async function startFreshBtkSession(
  baseResult: ImeiLookupResult,
  imei: string,
  transport: BtkTransport,
  initialWarning?: string,
  shopId?: string | null
): Promise<ImeiLookupResult> {
  const challengeStore = getChallengeStore();
  let lastErrorMessage: string | null = null;

  for (let sessionAttempt = 0; sessionAttempt < MAX_FRESH_SESSION_ATTEMPTS; sessionAttempt++) {
    if (sessionAttempt > 0) {
      closeBtkTransport(transport);
      await new Promise((r) => setTimeout(r, 150));
    }

    try {
      const jar: Record<string, string> = {};
      const getRes = await fetchWithRedirectsAndCookies(
        BTK_URL,
        {
          method: "GET",
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        },
        jar,
        transport
      );

      if (!getRes.ok) {
        lastErrorMessage = `e-Devlet servisi HTTP ${getRes.status} yanıtı döndürdü. Resmi e-Devlet sayfasından doğrulayabilirsiniz.`;
        continue;
      }

      const html = getRes.text();
      const formMeta = parseBtkFormMetadata(html);

      // When e-Devlet presents a CAPTCHA image, present it cleanly to the human user
      if (formMeta.captchaSrc) {
        const imageDataUrl = await fetchCaptchaImageAsDataUrl(formMeta.captchaSrc, jar, transport);
        if (imageDataUrl) {
          const challengeId = crypto.randomUUID();
          challengeStore.set(challengeId, {
            cookies: jar,
            actionUrl: formMeta.actionUrl,
            hiddenFields: formMeta.hiddenFields,
            imeiFieldName: formMeta.imeiFieldName,
            captchaFieldName: formMeta.captchaFieldName,
            createdAt: Date.now(),
          });

          return {
            ...baseResult,
            btkPendingCaptcha: true,
            captchaImageDataUrl: imageDataUrl,
            challengeId,
            btkError: initialWarning || null,
          };
        }
      }

      // If no CAPTCHA challenge is present on this session, submit query directly
      const formBody = new URLSearchParams();
      for (const [k, v] of Object.entries(formMeta.hiddenFields)) {
        formBody.set(k, v);
      }
      formBody.set(formMeta.imeiFieldName, imei);

      const postRes = await fetchWithRedirectsAndCookies(
        formMeta.actionUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: BTK_ORIGIN,
            Referer: BTK_URL,
          },
          body: formBody.toString(),
        },
        jar,
        transport
      );

      const postHtml = postRes.text();
      const btk = parseBtkResultContainer(postHtml, imei);

      if (btk) {
        const finalRes = buildFinalBtkResult(baseResult, btk);
        void recordLearnedTacMapping({
          imeiOrTac: imei,
          brand: finalRes.brand,
          model: finalRes.model,
          shopId,
        });
        return finalRes;
      }

      const pageErr = parseBtkPageError(postHtml);

      // Fallback check if POST response redirected/returned a CAPTCHA (unless it's a transient hiccup)
      const followUpForm = parseBtkFormMetadata(postHtml);
      if (followUpForm.captchaSrc && !isTransientBtkPageError(pageErr)) {
        const imageDataUrl = await fetchCaptchaImageAsDataUrl(
          followUpForm.captchaSrc,
          jar,
          transport
        );
        if (imageDataUrl) {
          const challengeId = crypto.randomUUID();
          challengeStore.set(challengeId, {
            cookies: jar,
            actionUrl: followUpForm.actionUrl,
            hiddenFields: followUpForm.hiddenFields,
            imeiFieldName: followUpForm.imeiFieldName,
            captchaFieldName: followUpForm.captchaFieldName,
            createdAt: Date.now(),
          });
          return {
            ...baseResult,
            btkPendingCaptcha: true,
            captchaImageDataUrl: imageDataUrl,
            challengeId,
            btkError: initialWarning || pageErr || null,
          };
        }
      }

      lastErrorMessage =
        pageErr ||
        "BTK sonucu alınamadı. Resmi e-Devlet IMEI sorgulama sayfasından kontrol edebilirsiniz.";

      // Auto-retry once on transient e-Devlet error or empty unparseable response
      if (sessionAttempt < MAX_FRESH_SESSION_ATTEMPTS - 1) {
        continue;
      }
    } catch (err: any) {
      lastErrorMessage =
        err?.message ||
        "e-Devlet BTK servisine şu an doğrudan ulaşılamadı.";
      if (sessionAttempt < MAX_FRESH_SESSION_ATTEMPTS - 1) {
        continue;
      }
    }
  }

  return {
    ...baseResult,
    btkError:
      lastErrorMessage ||
      "BTK sonucu alınamadı. Resmi e-Devlet IMEI sorgulama sayfasından kontrol edebilirsiniz.",
  };
}
