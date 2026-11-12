import prisma from "@/lib/prisma";
import type {
  AppleExtendedSpecs,
  BtkClassification,
  ImeiLookupResult,
} from "./imei-utils";
import type { IfreeicloudCheckResult } from "./ifreeicloud-service";

const HISTORY_SETTING_KEY = "imei_lookup_history";
const MAX_HISTORY_ENTRIES = 200;

export interface ImeiHistoryEntry {
  imei: string;
  tac: string;
  brand: string | null;
  model: string | null;
  classification: BtkClassification;
  previousClassification?: BtkClassification | null;
  statusChanged?: boolean;
  durum: string;
  kaynak: string;
  sorguTarihi: string;
  markaModel: string;
  luhnValid: boolean;
  queriedBy?: string | null;
  firstCheckedAt: string;
  lastCheckedAt: string;
  queryCount: number;
  appleSpecs?: AppleExtendedSpecs | null;
  ifreeicloud?: IfreeicloudCheckResult | null;
}

function parseHistoryJson(raw?: string | null): ImeiHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getImeiLookupHistory(
  shopId: string
): Promise<ImeiHistoryEntry[]> {
  const row = await prisma.setting.findUnique({
    where: {
      shopId_key: {
        shopId,
        key: HISTORY_SETTING_KEY,
      },
    },
    select: { value: true },
  });
  return parseHistoryJson(row?.value);
}

async function saveImeiLookupHistory(
  shopId: string,
  entries: ImeiHistoryEntry[]
): Promise<ImeiHistoryEntry[]> {
  const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES);
  await prisma.setting.upsert({
    where: {
      shopId_key: {
        shopId,
        key: HISTORY_SETTING_KEY,
      },
    },
    update: {
      value: JSON.stringify(trimmed),
    },
    create: {
      shopId,
      key: HISTORY_SETTING_KEY,
      value: JSON.stringify(trimmed),
    },
  });
  return trimmed;
}

export async function recordImeiLookupHistory(
  shopId: string,
  result: ImeiLookupResult,
  queriedBy?: string | null
): Promise<ImeiHistoryEntry[]> {
  if (!result.luhnValid || result.btkPendingCaptcha || !result.btk) {
    return getImeiLookupHistory(shopId);
  }

  const existing = await getImeiLookupHistory(shopId);
  const prev = existing.find((item) => item.imei === result.imei);
  const nowIso = result.checkedAt || new Date().toISOString();
  const nextClass = result.btk.classification;
  const changed = Boolean(prev && prev.classification !== nextClass);

  const nextEntry: ImeiHistoryEntry = {
    imei: result.imei,
    tac: result.tac,
    brand: result.brand,
    model: result.model,
    classification: nextClass,
    previousClassification: changed
      ? prev!.classification
      : prev?.previousClassification || null,
    statusChanged: changed || false,
    durum: result.btk.durum,
    kaynak: result.btk.kaynak,
    sorguTarihi: result.btk.sorguTarihi,
    markaModel: result.btk.markaModel,
    luhnValid: result.luhnValid,
    queriedBy: queriedBy || prev?.queriedBy || null,
    firstCheckedAt: prev?.firstCheckedAt || nowIso,
    lastCheckedAt: nowIso,
    queryCount: (prev?.queryCount || 0) + 1,
    appleSpecs: result.appleSpecs || null,
    ifreeicloud: prev?.ifreeicloud || null,
  };

  const remaining = existing.filter((item) => item.imei !== result.imei);
  return saveImeiLookupHistory(shopId, [nextEntry, ...remaining]);
}

export async function recordIfreeicloudLookupHistory(
  shopId: string,
  checkResult: IfreeicloudCheckResult,
  queriedBy?: string | null
): Promise<ImeiHistoryEntry[]> {
  if (!checkResult.success || checkResult.pending) {
    return getImeiLookupHistory(shopId);
  }

  const existing = await getImeiLookupHistory(shopId);
  const prev = existing.find((item) => item.imei === checkResult.imei);
  const nowIso = checkResult.checkedAt || new Date().toISOString();

  const nextEntry: ImeiHistoryEntry = prev
    ? {
        ...prev,
        brand: prev.brand || checkResult.extracted.brand || null,
        model: checkResult.extracted.model || prev.model || null,
        lastCheckedAt: nowIso,
        queriedBy: queriedBy || prev.queriedBy || null,
        ifreeicloud: checkResult,
      }
    : {
        imei: checkResult.imei,
        tac: checkResult.imei.slice(0, 8),
        brand: checkResult.extracted.brand || null,
        model: checkResult.extracted.model || null,
        classification: "BELIRSIZ",
        previousClassification: null,
        statusChanged: false,
        durum: `iFreeiCloud (${checkResult.serviceName})`,
        kaynak: "iFreeiCloud API",
        sorguTarihi: nowIso,
        markaModel: [checkResult.extracted.brand, checkResult.extracted.model]
          .filter(Boolean)
          .join(" ") || "Bilinmiyor",
        luhnValid: true,
        queriedBy: queriedBy || null,
        firstCheckedAt: nowIso,
        lastCheckedAt: nowIso,
        queryCount: 1,
        appleSpecs: null,
        ifreeicloud: checkResult,
      };

  const remaining = existing.filter((item) => item.imei !== checkResult.imei);
  return saveImeiLookupHistory(shopId, [nextEntry, ...remaining]);
}

export async function deleteImeiLookupHistoryItem(
  shopId: string,
  imei?: string
): Promise<ImeiHistoryEntry[]> {
  if (!imei) {
    return saveImeiLookupHistory(shopId, []);
  }
  const existing = await getImeiLookupHistory(shopId);
  const filtered = existing.filter((item) => item.imei !== imei);
  return saveImeiLookupHistory(shopId, filtered);
}

