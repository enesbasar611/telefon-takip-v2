export type IfreeicloudCategory = "apple" | "universal" | "android";

export interface IfreeicloudServicePreset {
  serviceId: number;
  name: string;
  shortLabel: string;
  description: string;
  category: IfreeicloudCategory;
  fallbackCredit: number;
  liveCredit?: number;
  time?: string;
}

export interface IfreeicloudParsedField {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}

export interface IfreeicloudExtractedData {
  brand: string | null;
  model: string | null;
  color: string | null;
  storage: string | null;
  serialNumber: string | null;
  imei2: string | null;
  fmiStatus: "ON" | "OFF" | null;
  icloudStatus: string | null;
  simLockStatus: "Locked" | "Unlocked" | null;
  carrier: string | null;
  warrantyStatus: string | null;
  purchaseDate: string | null;
  blacklistStatus: string | null;
}

export interface IfreeicloudCheckResult {
  success: boolean;
  imei: string;
  serviceId: number;
  serviceName: string;
  costCredit: number;
  referenceId?: string | null;
  statusCode?: number;
  pending?: boolean;
  checkedAt: string;
  rawHtml: string;
  rawText: string;
  fields: IfreeicloudParsedField[];
  extracted: IfreeicloudExtractedData;
  accountCredit?: number | null;
  currency?: string;
  error?: string;
}

export interface IfreeicloudAccountStatus {
  configured: boolean;
  credit: number | null;
  currency: string;
  error?: string;
}

export const IFREEICLOUD_PRESETS: IfreeicloudServicePreset[] = [
  {
    serviceId: 56,
    name: "Model + Marka + Üretici (Tüm Markalar)",
    shortLabel: "Genel Model/Marka",
    description: "IMEI ile tüm markalar için cihaz modeli, model kodu ve üretici sorgular.",
    category: "universal",
    fallbackCredit: 0.01,
  },
  {
    serviceId: 55,
    name: "Blacklist / Kayıp-Çalıntı Sorgu",
    shortLabel: "Blacklist",
    description: "Küresel operatör kara liste (Clean / Blacklisted) durumunu kontrol eder.",
    category: "universal",
    fallbackCredit: 0.01,
  },
  {
    serviceId: 225,
    name: "Apple Model + Renk + Kapasite + FMI",
    shortLabel: "Model + Renk + GB + FMI",
    description: "iPhone/iPad model, renk, depolama ve Bul (Find My) açık/kapalı bilgisini verir.",
    category: "apple",
    fallbackCredit: 0.02,
  },
  {
    serviceId: 4,
    name: "Apple FMI (Find My) On/Off",
    shortLabel: "FMI On/Off",
    description: "Sadece iCloud Bul (Aktivasyon Kilidi) açık/kapalı durumunu kontrol eder.",
    category: "apple",
    fallbackCredit: 0.01,
  },
  {
    serviceId: 60,
    name: "Apple iCloud Clean / Lost Modu",
    shortLabel: "iCloud Clean/Lost",
    description: "FMI durumu ile birlikte cihazın Kayıp Modunda (Lost Mode) olup olmadığını gösterir.",
    category: "apple",
    fallbackCredit: 0.02,
  },
  {
    serviceId: 241,
    name: "Apple SIM-Lock & IMEI2 & Seri No",
    shortLabel: "SIM-Lock + S/N",
    description: "Operatör SIM kilidi (Unlocked/Locked), IMEI2 ve Seri Numarası bilgisini getirir.",
    category: "apple",
    fallbackCredit: 0.02,
  },
  {
    serviceId: 49,
    name: "IMEI ⇄ IMEI2 ⇄ Seri No Dönüştürücü",
    shortLabel: "IMEI ⇄ S/N",
    description: "IMEI'den ikinci IMEI2, Seri No, model ve garanti özetini çıkarır.",
    category: "apple",
    fallbackCredit: 0.018,
  },
  {
    serviceId: 286,
    name: "Apple Garanti Sorgulama Pro",
    shortLabel: "Garanti Pro",
    description: "Apple garanti bitiş durumu, kapsam türü ve tahmini satın alma bilgisi.",
    category: "apple",
    fallbackCredit: 0.02,
  },
  {
    serviceId: 205,
    name: "iFreeCheck Mini (Çoklu Rapor)",
    shortLabel: "iFreeCheck Mini",
    description: "Model, Garanti, FMI, iCloud, Satın Alma Tarihi ve SIM-Lock tek raporda.",
    category: "apple",
    fallbackCredit: 0.04,
  },
  {
    serviceId: 255,
    name: "Apple Operatör + SIM-Lock",
    shortLabel: "Operatör + SIM-Lock",
    description: "Cihazın kilitli olduğu operatör, ülke ve SIM kilidi bilgisini verir.",
    category: "apple",
    fallbackCredit: 0.05,
  },
  {
    serviceId: 242,
    name: "iFreeCheck Pro (Tam İstihbarat)",
    shortLabel: "iFreeCheck Pro",
    description: "EID, FMI, iCloud, SIM-Lock, Operatör, Garanti ve US Block tüm alanlar.",
    category: "apple",
    fallbackCredit: 0.09,
  },
  {
    serviceId: 275,
    name: "Apple IMEI / Seri No Doğrulama",
    shortLabel: "Apple Doğrula",
    description: "Girilen IMEI veya Seri Numarasının Apple veritabanında geçerliliğini doğrular.",
    category: "apple",
    fallbackCredit: 0.005,
  },
  {
    serviceId: 307,
    name: "Tecno / Infinix / iTel Bilgi",
    shortLabel: "Tecno/Infinix",
    description: "Tecno, Infinix ve iTel cihazlar için model ve garanti sorgular.",
    category: "android",
    fallbackCredit: 0.01,
  },
  {
    serviceId: 196,
    name: "Xiaomi Bilgi & Garanti",
    shortLabel: "Xiaomi Bilgi",
    description: "Xiaomi / Redmi / Poco cihazlar için model ve garanti durumu.",
    category: "android",
    fallbackCredit: 0.04,
  },
  {
    serviceId: 190,
    name: "Samsung Bilgi S2",
    shortLabel: "Samsung S2",
    description: "Samsung model kodu, seri no, operatör ve satış bölgesi bilgisi.",
    category: "android",
    fallbackCredit: 0.06,
  },
  {
    serviceId: 283,
    name: "Huawei Bilgi S2",
    shortLabel: "Huawei S2",
    description: "Huawei cihazlar için model, satış ve garanti detayları.",
    category: "android",
    fallbackCredit: 0.06,
  },
  {
    serviceId: 324,
    name: "Honor Bilgi Sorgu",
    shortLabel: "Honor Bilgi",
    description: "Honor cihazlar için model ve garanti durumu.",
    category: "android",
    fallbackCredit: 0.06,
  },
];

interface CachedServiceCatalog {
  fetchedAt: number;
  servicesById: Map<number, { name: string; credit: number; time: string }>;
}

const SERVICE_CATALOG_TTL_MS = 30 * 60 * 1000;
let cachedCatalog: CachedServiceCatalog | null = null;

function getCredentials() {
  const rawUrl = (process.env.IFREEICLOUD_API_URL || "").trim();
  const username = (process.env.IFREEICLOUD_USERNAME || "").trim();
  const apiKey = (process.env.IFREEICLOUD_API_KEY || "").trim();

  if (!rawUrl || !username || !apiKey) {
    return null;
  }

  let endpoint = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = "/api/index.php";
    }
    endpoint = parsed.toString();
  } catch {
    // Keep provided URL string as-is
  }

  return { endpoint, username, apiKey };
}

export function isIfreeicloudConfigured(): boolean {
  return Boolean(getCredentials());
}

async function callDhruApi(
  action: string,
  extraParams?: Record<string, string>,
  timeoutMs = 25000
): Promise<any> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error("iFreeiCloud API kimlik bilgileri yapılandırılmamış.");
  }

  const form = new URLSearchParams({
    username: creds.username,
    apiaccesskey: creds.apiKey,
    requestformat: "JSON",
    action,
    ...(extraParams || {}),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(creds.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/plain, */*",
        "User-Agent": "BasarTeknik-DhruClient/1.0",
      },
      body: form.toString(),
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`iFreeiCloud HTTP ${response.status} hatası.`);
    }

    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error("iFreeiCloud API beklenen JSON formatında yanıt vermedi.");
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("iFreeiCloud API isteği zaman aşımına uğradı.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractDhruErrorMessage(payload: any): string | null {
  const errItem = Array.isArray(payload?.ERROR) ? payload.ERROR[0] : payload?.ERROR;
  if (!errItem) return null;

  const rawMsg =
    (typeof errItem === "string"
      ? errItem
      : errItem?.MESSAGE || errItem?.message || errItem?.FULL_DESCRIPTION) ||
    "iFreeiCloud isteği reddedildi.";

  const lower = String(rawMsg).toLowerCase();
  if (lower.includes("insufficient") || lower.includes("credit") || lower.includes("balance")) {
    return "iFreeiCloud bakiyeniz yetersiz. Panelden bakiye yüklemeniz gerekiyor.";
  }
  if (lower.includes("invalid imei") || lower.includes("imei")) {
    return `Geçersiz IMEI / Seri No: ${rawMsg}`;
  }
  if (lower.includes("authentication") || lower.includes("api key") || lower.includes("username")) {
    return "iFreeiCloud API kullanıcı adı veya anahtarı geçersiz.";
  }
  return String(rawMsg);
}

export async function getIfreeicloudAccountInfo(): Promise<IfreeicloudAccountStatus> {
  if (!isIfreeicloudConfigured()) {
    return { configured: false, credit: null, currency: "USD" };
  }

  try {
    const data = await callDhruApi("accountinfo", undefined, 12000);
    const errMsg = extractDhruErrorMessage(data);
    if (errMsg) {
      return { configured: true, credit: null, currency: "USD", error: errMsg };
    }

    const successItem = Array.isArray(data?.SUCCESS) ? data.SUCCESS[0] : data?.SUCCESS;
    // Dhru v6.1 returns "AccoutInfo" (panel typo) or "AccountInfo"
    const info = successItem?.AccoutInfo || successItem?.AccountInfo || {};
    const parsedCredit =
      info?.credit !== undefined && info?.credit !== null ? Number(info.credit) : null;

    return {
      configured: true,
      credit: Number.isFinite(parsedCredit) ? parsedCredit : null,
      currency: String(info?.currency || "USD").toUpperCase(),
    };
  } catch (err: any) {
    return {
      configured: true,
      credit: null,
      currency: "USD",
      error: err?.message || "Bakiye bilgisi alınamadı.",
    };
  }
}

export async function getIfreeicloudServices(
  forceRefresh = false
): Promise<IfreeicloudServicePreset[]> {
  if (!isIfreeicloudConfigured()) {
    return IFREEICLOUD_PRESETS;
  }

  const now = Date.now();
  if (!forceRefresh && cachedCatalog && now - cachedCatalog.fetchedAt < SERVICE_CATALOG_TTL_MS) {
    return IFREEICLOUD_PRESETS.map((preset) => {
      const live = cachedCatalog!.servicesById.get(preset.serviceId);
      return live
        ? { ...preset, liveCredit: live.credit, time: live.time }
        : preset;
    });
  }

  try {
    const data = await callDhruApi("imeiservicelist", undefined, 15000);
    const map = new Map<number, { name: string; credit: number; time: string }>();
    const groups = data?.SUCCESS?.[0]?.LIST;
    if (groups && typeof groups === "object") {
      for (const groupKey of Object.keys(groups)) {
        const services = groups[groupKey]?.SERVICES;
        if (!services || typeof services !== "object") continue;
        for (const svcKey of Object.keys(services)) {
          const svc = services[svcKey];
          const id = Number(svc?.SERVICEID);
          const credit = Number(svc?.CREDIT);
          if (Number.isFinite(id) && Number.isFinite(credit)) {
            map.set(id, {
              name: decodeHtmlEntities(String(svc?.SERVICENAME || "")),
              credit,
              time: String(svc?.TIME || "Instant"),
            });
          }
        }
      }
    }

    if (map.size > 0) {
      cachedCatalog = { fetchedAt: now, servicesById: map };
    }

    return IFREEICLOUD_PRESETS.map((preset) => {
      const live = map.get(preset.serviceId);
      return live
        ? { ...preset, liveCredit: live.credit, time: live.time }
        : preset;
    });
  } catch {
    return IFREEICLOUD_PRESETS;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
}

function classifyFieldTone(label: string, value: string): "good" | "warn" | "bad" | undefined {
  const l = label.toLowerCase();
  const v = value.toLowerCase().trim();

  if (l.includes("find my") || l === "fmi") {
    if (v === "off" || v.startsWith("off")) return "good";
    if (v === "on" || v.startsWith("on")) return "bad";
  }
  if (l.includes("icloud status") || l.includes("icloud")) {
    if (v.includes("clean")) return "good";
    if (v.includes("lost") || v.includes("stolen") || v.includes("erased")) return "bad";
  }
  if (l.includes("blacklist") || l.includes("block status")) {
    if (v.includes("clean")) return "good";
    if (v.includes("blacklisted") || v.includes("lost") || v.includes("stolen") || v.includes("blocked")) {
      return "bad";
    }
  }
  if (l.includes("sim-lock") || l.includes("sim lock")) {
    if (v.includes("unlocked")) return "good";
    if (v.includes("locked")) return "bad";
  }
  if (l.includes("warranty")) {
    if (v.includes("active") || v.includes("limited") || v.includes("applecare")) return "good";
    if (v.includes("expired") || v.includes("out of warranty")) return "warn";
  }
  if (l.includes("replaced")) {
    if (v === "no" || v.includes("false")) return "good";
    if (v === "yes") return "warn";
  }
  return undefined;
}

function normalizeStorageText(raw: string): string | null {
  const upper = raw.toUpperCase();
  const match = upper.match(/\b(16|32|64|128|256|512|1024|1|2)\s?(GB|TB)\b/);
  if (!match) return null;
  if (match[2] === "TB" || match[1] === "1024") {
    return match[1] === "2" ? "2 TB" : "1 TB";
  }
  return `${match[1]} GB`;
}

function extractColorFromModelString(modelLine: string): string | null {
  const knownColors = [
    "Natural Titanium",
    "Desert Titanium",
    "Black Titanium",
    "White Titanium",
    "Blue Titanium",
    "Space Black",
    "Space Grey",
    "Space Gray",
    "Deep Purple",
    "Alpine Green",
    "Sierra Blue",
    "Pacific Blue",
    "Midnight Green",
    "Rose Gold",
    "Jet Black",
    "Product Red",
    "Ultramarine",
    "Starlight",
    "Midnight",
    "Graphite",
    "Titanium",
    "Lavender",
    "Phantom Black",
    "Purple",
    "Yellow",
    "Orange",
    "Silver",
    "Gold",
    "Black",
    "White",
    "Green",
    "Blue",
    "Pink",
    "Red",
    "Coral",
    "Teal",
  ];
  const lower = modelLine.toLowerCase();
  for (const c of knownColors) {
    if (lower.includes(c.toLowerCase())) {
      return c;
    }
  }
  return null;
}

function cleanAppleModelName(rawModel: string): string {
  // Turn "iPhone 13 128GB Pink" or "iPhone XR 64GB Black A1984 US/Canada" into "iPhone 13" / "iPhone XR"
  let cleaned = rawModel
    .replace(/\b(16|32|64|128|256|512|1024|1|2)\s?(GB|TB)\b.*$/i, "")
    .replace(/\bA\d{4}\b.*$/i, "")
    .trim();
  if (!cleaned) cleaned = rawModel.trim();
  return cleaned;
}

function inferBrandFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("apple")) return "Apple";
  if (lower.includes("samsung") || lower.includes("galaxy") || lower.startsWith("sm-")) return "Samsung";
  if (lower.includes("redmi")) return "Redmi";
  if (lower.includes("poco")) return "Poco";
  if (lower.includes("xiaomi")) return "Xiaomi";
  if (lower.includes("huawei")) return "Huawei";
  if (lower.includes("honor")) return "Honor";
  if (lower.includes("infinix")) return "Infinix";
  if (lower.includes("tecno")) return "Tecno";
  if (lower.includes("oppo")) return "Oppo";
  if (lower.includes("realme")) return "Realme";
  if (lower.includes("vivo")) return "Vivo";
  if (lower.includes("pixel") || lower.includes("google")) return "Google";
  if (lower.includes("oneplus")) return "OnePlus";
  return null;
}

export function parseDhruResultHtml(rawHtml: string): {
  rawText: string;
  fields: IfreeicloudParsedField[];
  extracted: IfreeicloudExtractedData;
} {
  const withNewlines = String(rawHtml || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeHtmlEntities(withNewlines);
  const lines = decoded
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const fields: IfreeicloudParsedField[] = [];
  const extracted: IfreeicloudExtractedData = {
    brand: null,
    model: null,
    color: null,
    storage: null,
    serialNumber: null,
    imei2: null,
    fmiStatus: null,
    icloudStatus: null,
    simLockStatus: null,
    carrier: null,
    warrantyStatus: null,
    purchaseDate: null,
    blacklistStatus: null,
  };

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 42) {
      const label = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (!label || !value) continue;

      fields.push({
        label,
        value,
        tone: classifyFieldTone(label, value),
      });

      const lowerLabel = label.toLowerCase();
      const upperVal = value.toUpperCase();

      if (lowerLabel === "brand" || lowerLabel === "manufacturer") {
        const inferred = inferBrandFromText(value);
        extracted.brand = inferred || extracted.brand || value;
      } else if (lowerLabel === "model" || lowerLabel === "model description") {
        if (!extracted.model || lowerLabel === "model") {
          const storageInModel = normalizeStorageText(value);
          if (storageInModel && !extracted.storage) {
            extracted.storage = storageInModel;
          }
          const colorInModel = extractColorFromModelString(value);
          if (colorInModel && !extracted.color) {
            extracted.color = colorInModel;
          }
          const brandInModel = inferBrandFromText(value);
          if (brandInModel && !extracted.brand) {
            extracted.brand = brandInModel;
          }
          extracted.model =
            brandInModel === "Apple" ? cleanAppleModelName(value) : value;
        }
      } else if (lowerLabel === "color" || lowerLabel === "colour") {
        extracted.color = value;
      } else if (lowerLabel === "storage" || lowerLabel === "capacity") {
        extracted.storage = normalizeStorageText(value) || value;
      } else if (lowerLabel === "serial number" || lowerLabel === "serial") {
        if (!value.includes("*")) {
          extracted.serialNumber = value;
        }
      } else if (lowerLabel === "imei2 number" || lowerLabel === "imei2") {
        const digits = value.replace(/\D/g, "");
        if (digits.length >= 14) {
          extracted.imei2 = digits;
        }
      } else if (lowerLabel.includes("find my") || lowerLabel === "fmi") {
        if (upperVal.startsWith("ON")) extracted.fmiStatus = "ON";
        else if (upperVal.startsWith("OFF")) extracted.fmiStatus = "OFF";
      } else if (lowerLabel.includes("icloud status")) {
        extracted.icloudStatus = value;
      } else if (lowerLabel.includes("sim-lock") || lowerLabel.includes("sim lock")) {
        if (upperVal.includes("UNLOCKED")) extracted.simLockStatus = "Unlocked";
        else if (upperVal.includes("LOCKED")) extracted.simLockStatus = "Locked";
      } else if (
        lowerLabel.includes("locked carrier") ||
        lowerLabel === "carrier" ||
        lowerLabel.includes("next tether")
      ) {
        extracted.carrier = value;
      } else if (lowerLabel.includes("warranty")) {
        extracted.warrantyStatus = value;
      } else if (lowerLabel.includes("purchase date")) {
        extracted.purchaseDate = value;
      } else if (lowerLabel.includes("blacklist")) {
        extracted.blacklistStatus = value;
      }
    } else {
      fields.push({ label: "Sonuç", value: line });
    }
  }

  return {
    rawText: lines.join("\n"),
    fields,
    extracted,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runIfreeicloudCheck(params: {
  imei: string;
  serviceId: number;
}): Promise<IfreeicloudCheckResult> {
  const checkedAt = new Date().toISOString();
  const cleanTarget = params.imei.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const presets = await getIfreeicloudServices();
  const matchedPreset = presets.find((p) => p.serviceId === params.serviceId);
  const serviceName = matchedPreset?.name || `iFreeiCloud Servis #${params.serviceId}`;
  const costCredit = matchedPreset?.liveCredit ?? matchedPreset?.fallbackCredit ?? 0;

  if (!isIfreeicloudConfigured()) {
    return {
      success: false,
      imei: cleanTarget,
      serviceId: params.serviceId,
      serviceName,
      costCredit,
      checkedAt,
      rawHtml: "",
      rawText: "",
      fields: [],
      extracted: {
        brand: null,
        model: null,
        color: null,
        storage: null,
        serialNumber: null,
        imei2: null,
        fmiStatus: null,
        icloudStatus: null,
        simLockStatus: null,
        carrier: null,
        warrantyStatus: null,
        purchaseDate: null,
        blacklistStatus: null,
      },
      error: "iFreeiCloud API kimlik bilgileri eksik.",
    };
  }

  if (cleanTarget.length < 8 || cleanTarget.length > 20) {
    throw new Error("Geçerli bir 15 haneli IMEI veya Seri Numarası girin.");
  }

  const xmlOrder = `<PARAMETERS><IMEI>${escapeXml(cleanTarget)}</IMEI><ID>${Number(params.serviceId)}</ID></PARAMETERS>`;

  const orderResponse = await callDhruApi(
    "placeimeiorder",
    { parameters: xmlOrder },
    30000
  );

  const errMsg = extractDhruErrorMessage(orderResponse);
  if (errMsg) {
    const account = await getIfreeicloudAccountInfo();
    return {
      success: false,
      imei: cleanTarget,
      serviceId: params.serviceId,
      serviceName,
      costCredit,
      checkedAt,
      rawHtml: "",
      rawText: "",
      fields: [],
      extracted: {
        brand: null,
        model: null,
        color: null,
        storage: null,
        serialNumber: null,
        imei2: null,
        fmiStatus: null,
        icloudStatus: null,
        simLockStatus: null,
        carrier: null,
        warrantyStatus: null,
        purchaseDate: null,
        blacklistStatus: null,
      },
      accountCredit: account.credit,
      currency: account.currency,
      error: errMsg,
    };
  }

  const successNode = Array.isArray(orderResponse?.SUCCESS)
    ? orderResponse.SUCCESS[0]
    : orderResponse?.SUCCESS;

  const referenceId = successNode?.REFERENCEID ? String(successNode.REFERENCEID) : null;
  let resultHtml = String(successNode?.RESULT || successNode?.CODE || "");
  let statusCode = successNode?.STATUS !== undefined ? Number(successNode.STATUS) : undefined;

  // Poll instant orders if Dhru returned a reference ID without immediate CODE/RESULT
  if (!resultHtml && referenceId) {
    const waitSteps = [900, 1400, 2000, 2500];
    for (const ms of waitSteps) {
      await delay(ms);
      const xmlPoll = `<PARAMETERS><ID>${escapeXml(referenceId)}</ID></PARAMETERS>`;
      const pollRes = await callDhruApi("getimeiorder", { parameters: xmlPoll }, 20000);
      const pollErr = extractDhruErrorMessage(pollRes);
      if (pollErr) {
        throw new Error(pollErr);
      }

      const pollSuccess = Array.isArray(pollRes?.SUCCESS)
        ? pollRes.SUCCESS[0]
        : pollRes?.SUCCESS;
      statusCode = pollSuccess?.STATUS !== undefined ? Number(pollSuccess.STATUS) : statusCode;
      const pollCode = String(pollSuccess?.CODE || pollSuccess?.RESULT || "").trim();

      if (statusCode === 4 || (pollCode && statusCode !== 0 && statusCode !== 1)) {
        resultHtml = pollCode;
        break;
      }
      if (statusCode === 3) {
        resultHtml = pollCode || "Sipariş iFreeiCloud tarafından reddedildi / iade edildi.";
        const accountAfterReject = await getIfreeicloudAccountInfo();
        const parsedReject = parseDhruResultHtml(resultHtml);
        return {
          success: false,
          imei: cleanTarget,
          serviceId: params.serviceId,
          serviceName,
          costCredit,
          referenceId,
          statusCode,
          checkedAt,
          rawHtml: resultHtml,
          rawText: parsedReject.rawText,
          fields: parsedReject.fields,
          extracted: parsedReject.extracted,
          accountCredit: accountAfterReject.credit,
          currency: accountAfterReject.currency,
          error: parsedReject.rawText || "Servis yanıtı reddedildi.",
        };
      }
    }
  }

  const account = await getIfreeicloudAccountInfo();

  if (!resultHtml) {
    return {
      success: true,
      imei: cleanTarget,
      serviceId: params.serviceId,
      serviceName,
      costCredit,
      referenceId,
      statusCode: statusCode ?? 1,
      pending: true,
      checkedAt,
      rawHtml: "",
      rawText: "",
      fields: [],
      extracted: {
        brand: null,
        model: null,
        color: null,
        storage: null,
        serialNumber: null,
        imei2: null,
        fmiStatus: null,
        icloudStatus: null,
        simLockStatus: null,
        carrier: null,
        warrantyStatus: null,
        purchaseDate: null,
        blacklistStatus: null,
      },
      accountCredit: account.credit,
      currency: account.currency,
      error: referenceId
        ? `Sipariş alındı (#${referenceId}), sonuç hazırlanıyor.`
        : "Sonuç bekleniyor.",
    };
  }

  const parsed = parseDhruResultHtml(resultHtml);
  return {
    success: true,
    imei: cleanTarget,
    serviceId: params.serviceId,
    serviceName,
    costCredit,
    referenceId,
    statusCode: statusCode ?? 4,
    pending: false,
    checkedAt,
    rawHtml: resultHtml,
    rawText: parsed.rawText,
    fields: parsed.fields,
    extracted: parsed.extracted,
    accountCredit: account.credit,
    currency: account.currency,
  };
}

