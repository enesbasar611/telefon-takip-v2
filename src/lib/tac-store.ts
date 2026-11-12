import prisma from "@/lib/prisma";
import {
  createTacMatch,
  lookupTacDevice,
  normalizeImeiDigits,
  parseBrandAndModel,
  type TacDeviceMatch,
} from "./imei-utils";

const LEARNED_TAC_KEY = "learned_tac_catalog";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_LEARNED_TACS = 2500;

interface StoredTacEntry {
  brand: string;
  model: string;
  modelCode?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __learnedTacCache:
    | {
        loadedAt: number;
        entries: Map<string, StoredTacEntry>;
      }
    | undefined;
}

function getCacheStore() {
  if (!globalThis.__learnedTacCache) {
    globalThis.__learnedTacCache = {
      loadedAt: 0,
      entries: new Map(),
    };
  }
  return globalThis.__learnedTacCache;
}

function isUsableText(val?: string | null): val is string {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return Boolean(
    v &&
      v !== "bilinmiyor" &&
      v !== "unknown" &&
      v !== "not known" &&
      v !== "n/a" &&
      v !== "--" &&
      v !== "-"
  );
}

function addEntryIfValid(
  map: Map<string, StoredTacEntry>,
  rawTacOrImei: string | null | undefined,
  rawBrand: string | null | undefined,
  rawModel: string | null | undefined,
  rawModelCode?: string | null
) {
  const digits = normalizeImeiDigits(rawTacOrImei);
  if (digits.length < 8) return;
  const tac = digits.slice(0, 8);
  if (!isUsableText(rawBrand) || !isUsableText(rawModel)) return;

  const modelCodeMatch = rawModel.match(/\(([A-Z0-9-]{4,12})\)\s*$/i);
  map.set(tac, {
    brand: rawBrand.trim(),
    model: rawModel.trim(),
    modelCode: rawModelCode?.trim() || modelCodeMatch?.[1] || undefined,
  });
}

async function hydrateLearnedTacCache(force = false): Promise<Map<string, StoredTacEntry>> {
  const store = getCacheStore();
  const now = Date.now();
  if (!force && store.loadedAt > 0 && now - store.loadedAt < CACHE_TTL_MS) {
    return store.entries;
  }

  try {
    const [tacCatalogRows, historyRows, serviceRows, deviceRows] = await Promise.all([
      prisma.setting.findMany({
        where: { key: LEARNED_TAC_KEY },
        select: { value: true },
      }),
      prisma.setting.findMany({
        where: { key: "imei_lookup_history" },
        select: { value: true },
      }),
      prisma.serviceTicket.findMany({
        where: { imei: { not: null } },
        select: { imei: true, deviceBrand: true, deviceModel: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.deviceHubInfo.findMany({
        select: {
          imei: true,
          product: { select: { name: true } },
        },
        take: 500,
      }),
    ]);

    for (const dev of deviceRows) {
      if (!dev.imei || !dev.product?.name) continue;
      const parsed = parseBrandAndModel(dev.product.name);
      addEntryIfValid(store.entries, dev.imei, parsed.brand, parsed.model);
    }

    for (const svc of serviceRows) {
      addEntryIfValid(store.entries, svc.imei, svc.deviceBrand, svc.deviceModel);
    }

    for (const row of historyRows) {
      try {
        const list = JSON.parse(row.value);
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          addEntryIfValid(store.entries, item?.imei || item?.tac, item?.brand, item?.model);
        }
      } catch {
        // skip malformed history row
      }
    }

    // Explicit learned catalog takes highest priority
    for (const row of tacCatalogRows) {
      try {
        const parsed = JSON.parse(row.value);
        if (parsed && typeof parsed === "object") {
          for (const [tac, entry] of Object.entries(parsed as Record<string, StoredTacEntry>)) {
            addEntryIfValid(
              store.entries,
              tac,
              entry?.brand,
              entry?.model,
              entry?.modelCode
            );
          }
        }
      } catch {
        // skip malformed catalog row
      }
    }

    store.loadedAt = now;
  } catch (err) {
    // Non-fatal: still allow static TAC database lookups even if DB is temporarily unreachable
    console.warn("hydrateLearnedTacCache warning:", err);
  }

  return store.entries;
}

/**
 * Resolves TAC metadata from the static dictionary first, falling back to
 * the shop/DB-hydrated TAC cache so verified device models resolve immediately.
 */
export async function lookupTacWithLocalDb(imei: string): Promise<TacDeviceMatch | null> {
  const staticMatch = lookupTacDevice(imei);
  if (staticMatch) return staticMatch;

  const digits = normalizeImeiDigits(imei);
  if (digits.length < 8) return null;
  const tac = digits.slice(0, 8);

  const map = await hydrateLearnedTacCache();
  const learned = map.get(tac);
  if (!learned) return null;

  return createTacMatch(tac, learned.brand, learned.model, learned.modelCode);
}

/**
 * Learns a verified TAC -> (brand, model) mapping into memory and persists it
 * into the shop's `Setting` catalog so subsequent checks skip unknown TAC states.
 */
export async function recordLearnedTacMapping(params: {
  imeiOrTac?: string | null;
  brand?: string | null;
  model?: string | null;
  modelCode?: string | null;
  shopId?: string | null;
}): Promise<void> {
  const digits = normalizeImeiDigits(params.imeiOrTac);
  if (digits.length < 8) return;
  const tac = digits.slice(0, 8);

  if (!isUsableText(params.brand) || !isUsableText(params.model)) return;

  // Already present in static database with identical model? Skip redundant write
  const staticMatch = lookupTacDevice(tac);
  if (staticMatch) return;

  const store = getCacheStore();
  addEntryIfValid(store.entries, tac, params.brand, params.model, params.modelCode);

  if (!params.shopId) return;

  try {
    const existing = await prisma.setting.findUnique({
      where: {
        shopId_key: {
          shopId: params.shopId,
          key: LEARNED_TAC_KEY,
        },
      },
      select: { value: true },
    });

    let catalog: Record<string, StoredTacEntry> = {};
    if (existing?.value) {
      try {
        const parsed = JSON.parse(existing.value);
        if (parsed && typeof parsed === "object") catalog = parsed;
      } catch {
        catalog = {};
      }
    }

    catalog[tac] = {
      brand: params.brand.trim(),
      model: params.model.trim(),
      modelCode: params.modelCode?.trim() || undefined,
    };

    const keys = Object.keys(catalog);
    if (keys.length > MAX_LEARNED_TACS) {
      for (const oldKey of keys.slice(0, keys.length - MAX_LEARNED_TACS)) {
        delete catalog[oldKey];
      }
    }

    await prisma.setting.upsert({
      where: {
        shopId_key: {
          shopId: params.shopId,
          key: LEARNED_TAC_KEY,
        },
      },
      update: { value: JSON.stringify(catalog) },
      create: {
        shopId: params.shopId,
        key: LEARNED_TAC_KEY,
        value: JSON.stringify(catalog),
      },
    });
  } catch (err) {
    console.warn("recordLearnedTacMapping warning:", err);
  }
}

