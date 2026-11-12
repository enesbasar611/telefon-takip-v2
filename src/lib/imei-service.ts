import crypto from "crypto";
import https from "https";
import {
  applyImeiAutoComplete,
  buildAppleExtendedSpecs,
  classifyBtkStatus,
  isValidImeiLuhn,
  lookupTacDevice,
  normalizeImeiDigits,
  parseBrandAndModel,
  type BtkOfficialDetails,
  type ImeiLookupResult,
} from "./imei-utils";

const BTK_URL = "https://www.turkiye.gov.tr/imei-sorgulama";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;

interface CachedLookupEntry {
  result: ImeiLookupResult;
  expiresAt: number;
}

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
  var __imeiLookupCache: Map<string, CachedLookupEntry> | undefined;
  // eslint-disable-next-line no-var
  var __btkCaptchaChallenges: Map<string, PendingBtkChallenge> | undefined;
}

function getCacheStore(): Map<string, CachedLookupEntry> {
  if (!globalThis.__imeiLookupCache) {
    globalThis.__imeiLookupCache = new Map();
  }
  return globalThis.__imeiLookupCache;
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
        agent: false, // Fresh TLS connection per hop; avoids Undici ECONNRESET on idle F5 sockets
        timeout: REQUEST_TIMEOUT_MS,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
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

function isRetryableSocketError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = String((err as { code?: unknown }).code || "");
  const msg = String((err as { message?: unknown }).message || "");
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EPIPE" ||
    msg.includes("ECONNRESET") ||
    msg.includes("socket hang up")
  );
}

async function fetchWithRedirectsAndCookies(
  initialUrl: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
  jar: Record<string, string>,
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
        res = await sendFreshHttpsRequest(
          currentUrl,
          currentMethod,
          headersWithCookie,
          currentBody
        );
        break;
      } catch (err) {
        if (attempt === 1 || !isRetryableSocketError(err)) throw err;
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

function parseBtkResultContainer(html: string, queriedImei: string): BtkOfficialDetails | null {
  const containerMatch =
    html.match(
      /<(?:div|dl|section)[^>]*class=["'][^"']*resultContainer[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|dl|section)>/i
    ) ||
    html.match(
      /<dl[^>]*class=["'][^"']*compact[^"']*["'][^>]*>([\s\S]*?)<\/dl>/i
    );
  const scope = containerMatch ? containerMatch[1] : html;
  const ddMatches = Array.from(scope.matchAll(/<dd[^>]*>([\s\S]*?)<\/dd>/gi));
  if (ddMatches.length < 2) return null;

  const values = ddMatches.map((m) => decodeHtmlEntities(m[1]));
  const imei = values[0] || queriedImei;
  const durum = values[1] || "";
  const kaynak = values[2] || "Bilgi Teknolojileri ve İletişim Kurumu";
  const sorguTarihi = values[3] || new Date().toLocaleDateString("tr-TR");
  const markaModel = values[4] || "";

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
  jar: Record<string, string>
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
    jar
  );
  if (!res.ok) return null;
  const rawCt = res.headers["content-type"];
  const mime = (Array.isArray(rawCt) ? rawCt[0] : rawCt) || "image/png";
  return `data:${mime};base64,${res.body.toString("base64")}`;
}

export interface LookupImeiParams {
  rawImei: string;
  challengeId?: string;
  captchaCode?: string;
  skipCache?: boolean;
}

/**
 * Resolves 14+1 IMEI Luhn validity, TAC brand/model metadata, Apple extended device info,
 * and official e-Devlet BTK status (with human-in-the-loop CAPTCHA prompt when required).
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
  const tacMatch = lookupTacDevice(imei);

  let brand = tacMatch?.brand || null;
  let model = tacMatch?.model || null;
  let appleSpecs = tacMatch?.appleSpecs || null;

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

  // 1. Check 24h cache when not explicitly submitting a fresh CAPTCHA verification
  const cache = getCacheStore();
  if (!params.skipCache && !params.captchaCode) {
    const cached = cache.get(imei);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        ...cached.result,
        autoCompleted15thDigit: completed.autoCompleted,
        cached: true,
      };
    }
  }

  const challengeStore = getChallengeStore();

  try {
    // 2. If user supplied a human-entered CAPTCHA code for an active challenge, submit it
    if (params.challengeId && params.captchaCode?.trim()) {
      const pending = challengeStore.get(params.challengeId);
      if (!pending) {
        return await startFreshBtkSession(baseResult, imei, "Güvenlik kodu oturumu zaman aşımına uğradı. Lütfen yeni kodu girin.");
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
            Origin: "https://www.turkiye.gov.tr",
            Referer: BTK_URL,
          },
          body: formBody.toString(),
        },
        pending.cookies
      );
      challengeStore.delete(params.challengeId);

      const html = postRes.text();
      const btk = parseBtkResultContainer(html, imei);

      if (btk) {
        const parsed = parseBrandAndModel(btk.markaModel, brand, model);
        brand = parsed.brand;
        model = parsed.model;
        if (brand?.toLowerCase() === "apple") {
          appleSpecs = buildAppleExtendedSpecs(model || btk.markaModel, tacMatch?.modelCode);
        }

        const finalResult: ImeiLookupResult = {
          ...baseResult,
          brand,
          model,
          appleSpecs,
          btk,
          btkPendingCaptcha: false,
          btkError: null,
          checkedAt: new Date().toISOString(),
        };
        cache.set(imei, { result: finalResult, expiresAt: Date.now() + CACHE_TTL_MS });
        return finalResult;
      }

      const nextForm = parseBtkFormMetadata(html);
      if (nextForm.captchaSrc) {
        const imageDataUrl = await fetchCaptchaImageAsDataUrl(nextForm.captchaSrc, pending.cookies);
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
            btkError: "Güvenlik kodu doğrulanamadı. Lütfen görseldeki yeni kodu yazın.",
          };
        }
      }

      return {
        ...baseResult,
        btkError: "e-Devlet yanıtı okunamadı. Resmi e-Devlet sayfasından kontrol edebilirsiniz.",
      };
    }

    // 3. Initial request to turkiye.gov.tr/imei-sorgulama
    return await startFreshBtkSession(baseResult, imei);
  } catch (error) {
    console.error("BTK lookup error:", error);
    return {
      ...baseResult,
      btkError:
        "e-Devlet BTK servisine şu an doğrudan ulaşılamadı. Cihaz TAC bilgisi gösteriliyor; BTK doğrulaması için e-Devlet bağlantısını kullanabilirsiniz.",
    };
  }
}

async function startFreshBtkSession(
  baseResult: ImeiLookupResult,
  imei: string,
  initialWarning?: string
): Promise<ImeiLookupResult> {
  const jar: Record<string, string> = {};
  const getRes = await fetchWithRedirectsAndCookies(
    BTK_URL,
    {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    },
    jar
  );

  if (!getRes.ok) {
    return {
      ...baseResult,
      btkError: `e-Devlet servisi HTTP ${getRes.status} yanıtı döndürdü. Resmi e-Devlet sayfasından doğrulayabilirsiniz.`,
    };
  }

  const html = getRes.text();
  const formMeta = parseBtkFormMetadata(html);
  const challengeStore = getChallengeStore();

  // When e-Devlet presents a CAPTCHA image, present it cleanly to the human user
  if (formMeta.captchaSrc) {
    const imageDataUrl = await fetchCaptchaImageAsDataUrl(formMeta.captchaSrc, jar);
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
        Origin: "https://www.turkiye.gov.tr",
        Referer: BTK_URL,
      },
      body: formBody.toString(),
    },
    jar
  );

  const postHtml = postRes.text();
  const btk = parseBtkResultContainer(postHtml, imei);

  if (btk) {
    const parsed = parseBrandAndModel(btk.markaModel, baseResult.brand, baseResult.model);
    const resolvedBrand = parsed.brand;
    const resolvedModel = parsed.model;
    const appleSpecs =
      resolvedBrand?.toLowerCase() === "apple"
        ? buildAppleExtendedSpecs(resolvedModel || btk.markaModel, baseResult.tacMatch?.modelCode)
        : baseResult.appleSpecs;

    const completedResult: ImeiLookupResult = {
      ...baseResult,
      brand: resolvedBrand,
      model: resolvedModel,
      appleSpecs,
      btk,
      btkPendingCaptcha: false,
      btkError: null,
      checkedAt: new Date().toISOString(),
    };

    getCacheStore().set(imei, {
      result: completedResult,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return completedResult;
  }

  // Fallback check if POST response redirected/returned a CAPTCHA
  const followUpForm = parseBtkFormMetadata(postHtml);
  if (followUpForm.captchaSrc) {
    const imageDataUrl = await fetchCaptchaImageAsDataUrl(followUpForm.captchaSrc, jar);
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
        btkError: initialWarning || null,
      };
    }
  }

  return {
    ...baseResult,
    btkError: "BTK sonucu alınamadı. Resmi e-Devlet IMEI sorgulama sayfasından kontrol edebilirsiniz.",
  };
}
