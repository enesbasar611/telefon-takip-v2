export type WidgetHeightMode = "auto" | "compact" | "medium" | "tall";
export type DashboardDensity = "compact" | "comfortable" | "spacious";
export type WidgetCategory = "kpi" | "finance" | "service" | "stock";
export type WidgetKind = "stat" | "module";

export interface DashboardWidgetConfig {
  id: string;
  cols: number;
  rows: number;
  heightMode?: WidgetHeightMode;
  mobileVisible?: boolean;
  mobileCols?: 1 | 2;
  settings?: Record<string, any>;
}

export interface DashboardLayoutPreferences {
  version: 2;
  density: DashboardDensity;
  autoCompactEmpty: boolean;
  presetId?: string;
  items: DashboardWidgetConfig[];
}

export interface WidgetRegistryMeta {
  id: string;
  label: string;
  description: string;
  category: WidgetCategory;
  kind: WidgetKind;
  defaultCols: number;
  minCols: number;
  maxCols: number;
  allowedCols: number[];
  defaultRows: number;
  minRows: number;
  maxRows: number;
  defaultHeightMode: WidgetHeightMode;
  defaultMobileCols: 1 | 2;
}

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  density: DashboardDensity;
  items: DashboardWidgetConfig[];
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryMeta> = {
  // --- KPI KARTLARI ---
  stat_sales: {
    id: "stat_sales",
    label: "Kasa Bakiyesi & Aylık Kâr",
    description: "Nakit kasa durumu ve aylık toplam kâr göstergesi",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_income: {
    id: "stat_income",
    label: "Servis Gelirleri",
    description: "Günlük servis gelir özeti ve değişim trendi",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_collections: {
    id: "stat_collections",
    label: "Tahsilatlar",
    description: "Günlük nakit/kart/havale tahsilat toplamı",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_accounts: {
    id: "stat_accounts",
    label: "Satış Hacmi",
    description: "Bugünkü toplam satış cirosu",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_ready: {
    id: "stat_ready",
    label: "Hazır Cihazlar",
    description: "Teslime hazır bekleyen tamir cihazları",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_pending: {
    id: "stat_pending",
    label: "Bekleyen Servisler",
    description: "Aktif tamir ve onay bekleyen iş emirleri",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_stock: {
    id: "stat_stock",
    label: "Kritik Stok",
    description: "Tükenen ve kritik eşik altındaki ürünler",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },
  stat_debts: {
    id: "stat_debts",
    label: "Veresiyeler (Özet)",
    description: "Toplam açık müşteri alacak bakiyesi",
    category: "kpi",
    kind: "stat",
    defaultCols: 6,
    minCols: 6,
    maxCols: 12,
    allowedCols: [6, 8, 12],
    defaultRows: 1,
    minRows: 1,
    maxRows: 1,
    defaultHeightMode: "auto",
    defaultMobileCols: 1,
  },

  // --- ANALİTİK & FİNANS MODÜLLERİ ---
  revenue: {
    id: "revenue",
    label: "Gelir Analizi",
    description: "Satış + Servis günlük gelir ve kâr grafiği",
    category: "finance",
    kind: "module",
    defaultCols: 15,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 15, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "medium",
    defaultMobileCols: 2,
  },
  transactions: {
    id: "transactions",
    label: "Finansal Kayıtlar",
    description: "Satılan ürünler, tahsilatlar ve verilenler akışı",
    category: "finance",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  cash_channels: {
    id: "cash_channels",
    label: "Kasa & Ödeme Kanalları",
    description: "Nakit, banka/POS, döviz hesapları ve günlük akış",
    category: "finance",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  receivables: {
    id: "receivables",
    label: "Bekleyen Tahsilatlar (Veresiye)",
    description: "Sabitlenen bayiler, alacak takibi ve hızlı tahsilat",
    category: "finance",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  supplier_payables: {
    id: "supplier_payables",
    label: "Tedarikçi Borçları & Ödemeler",
    description: "TRY/USD tedarikçi bakiyeleri ve son alımlar",
    category: "finance",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },

  // --- SERVİS & OPERASYON MODÜLLERİ ---
  service_status: {
    id: "service_status",
    label: "Servis Durumu",
    description: "Aktif/tüm servis aşamalarının oransal dağılımı",
    category: "service",
    kind: "module",
    defaultCols: 9,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 9, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  service_queue: {
    id: "service_queue",
    label: "Servis Kuyruğu",
    description: "Öncelikli aktif servis kayıtları ve teknisyen durumu",
    category: "service",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  daily_agenda: {
    id: "daily_agenda",
    label: "Bugünün Teslimat & Vade Ajandası",
    description: "Geciken teslimatlar, yaklaşan borç vadeleri ve görevler",
    category: "service",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  returns_warranty: {
    id: "returns_warranty",
    label: "İade, Değişim & Garanti",
    description: "Bekleyen iadeler, tedarikçideki parçalar ve garanti bitişleri",
    category: "service",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  ai_insights: {
    id: "ai_insights",
    label: "Tahminleyici Zeka",
    description: "Ölü stok, geciken teslimat ve performans öngörüleri",
    category: "service",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  activity: {
    id: "activity",
    label: "Canlı Aktivite",
    description: "Servis, denetim ve kasa işlem akışı",
    category: "service",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },

  // --- STOK & LOJİSTİK MODÜLLERİ ---
  inventory: {
    id: "inventory",
    label: "Trend Ürünler",
    description: "Seçili dönemde en çok satılan ürünler",
    category: "stock",
    kind: "module",
    defaultCols: 12,
    minCols: 8,
    maxCols: 24,
    allowedCols: [8, 12, 16, 24],
    defaultRows: 3,
    minRows: 2,
    maxRows: 5,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
  shortage_status: {
    id: "shortage_status",
    label: "Kurye Sipariş Durumu",
    description: "Eksikler ve kurye tedarik grupları",
    category: "stock",
    kind: "module",
    defaultCols: 24,
    minCols: 12,
    maxCols: 24,
    allowedCols: [12, 16, 24],
    defaultRows: 2,
    minRows: 2,
    maxRows: 4,
    defaultHeightMode: "auto",
    defaultMobileCols: 2,
  },
};

export const SYSTEM_DASHBOARD_LAYOUT: DashboardWidgetConfig[] = [
  // ROW 1: Financial KPIs (24 cols)
  { id: "stat_sales", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_income", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_collections", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_accounts", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },

  // ROW 2: Operational KPIs (24 cols)
  { id: "stat_ready", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_pending", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_stock", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
  { id: "stat_debts", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },

  // ROW 3: Revenue & Service Status (15 + 9 = 24 cols)
  { id: "revenue", cols: 15, rows: 3, heightMode: "medium", mobileVisible: true, mobileCols: 2 },
  { id: "service_status", cols: 9, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },

  // ROW 4: Operations & Live Transactions (12 + 12 = 24 cols)
  { id: "service_queue", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
  { id: "transactions", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },

  // ROW 5: Cash Channels & Daily Agenda (12 + 12 = 24 cols)
  { id: "cash_channels", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
  { id: "daily_agenda", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },

  // ROW 6: Inventory & Receivables (12 + 12 = 24 cols)
  { id: "inventory", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
  { id: "receivables", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },

  // ROW 7: Supplier Payables & Returns / Warranty (12 + 12 = 24 cols)
  { id: "supplier_payables", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
  { id: "returns_warranty", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },

  // ROW 8: AI Intelligence & Live Activity (12 + 12 = 24 cols)
  { id: "ai_insights", cols: 12, rows: 3, heightMode: "auto", mobileVisible: false, mobileCols: 2 },
  { id: "activity", cols: 12, rows: 3, heightMode: "auto", mobileVisible: false, mobileCols: 2 },

  // ROW 9: Courier Shortage Status (24 cols)
  { id: "shortage_status", cols: 24, rows: 2, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
];

export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    id: "balanced",
    name: "Genel Denge (Tüm Panel)",
    description: "Finans, servis, kasa, ajanda ve stok modüllerinin tamamı dengeli düzende",
    density: "comfortable",
    items: SYSTEM_DASHBOARD_LAYOUT.map((i) => ({ ...i })),
  },
  {
    id: "finance",
    name: "Finans & Kasa Odaklı",
    description: "Nakit akışı, finansal kayıtlar, ödeme kanalları, veresiye ve tedarikçiler önde",
    density: "comfortable",
    items: [
      { id: "stat_sales", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_collections", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_accounts", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_debts", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "cash_channels", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "transactions", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "receivables", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "supplier_payables", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "revenue", cols: 24, rows: 3, heightMode: "medium", mobileVisible: true, mobileCols: 2 },
      { id: "daily_agenda", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "returns_warranty", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
    ],
  },
  {
    id: "service",
    name: "Atölye & Servis Odaklı",
    description: "Servis kuyruğu, teslimat ajandası, iade/garanti ve kurye takibi önde",
    density: "comfortable",
    items: [
      { id: "stat_pending", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_ready", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_income", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_stock", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "service_queue", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "service_status", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "daily_agenda", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "returns_warranty", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "shortage_status", cols: 24, rows: 2, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "ai_insights", cols: 12, rows: 3, heightMode: "auto", mobileVisible: false, mobileCols: 2 },
      { id: "activity", cols: 12, rows: 3, heightMode: "auto", mobileVisible: false, mobileCols: 2 },
    ],
  },
  {
    id: "minimal",
    name: "Sade & Hızlı",
    description: "Yalnızca günlük temel KPI'lar ve en sık kullanılan 4 modül",
    density: "compact",
    items: [
      { id: "stat_sales", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_income", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_collections", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "stat_debts", cols: 6, rows: 1, heightMode: "auto", mobileVisible: true, mobileCols: 1 },
      { id: "transactions", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "service_queue", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "cash_channels", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
      { id: "daily_agenda", cols: 12, rows: 3, heightMode: "auto", mobileVisible: true, mobileCols: 2 },
    ],
  },
];

export const DENSITY_METRICS: Record<
  DashboardDensity,
  {
    label: string;
    gapPx: number;
    statHeightPx: number;
    autoMaxHeightPx: number;
    mobileMaxHeightPx: number;
    compactHeightPx: number;
    mediumHeightPx: number;
    tallHeightPx: number;
  }
> = {
  compact: {
    label: "Kompakt",
    gapPx: 10,
    statHeightPx: 162,
    autoMaxHeightPx: 300,
    mobileMaxHeightPx: 290,
    compactHeightPx: 224,
    mediumHeightPx: 320,
    tallHeightPx: 430,
  },
  comfortable: {
    label: "Standart",
    gapPx: 12,
    statHeightPx: 176,
    autoMaxHeightPx: 368,
    mobileMaxHeightPx: 336,
    compactHeightPx: 248,
    mediumHeightPx: 360,
    tallHeightPx: 484,
  },
  spacious: {
    label: "Ferah",
    gapPx: 16,
    statHeightPx: 190,
    autoMaxHeightPx: 430,
    mobileMaxHeightPx: 380,
    compactHeightPx: 276,
    mediumHeightPx: 400,
    tallHeightPx: 540,
  },
};

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidHeightMode(value: unknown): value is WidgetHeightMode {
  return value === "auto" || value === "compact" || value === "medium" || value === "tall";
}

function isValidDensity(value: unknown): value is DashboardDensity {
  return value === "compact" || value === "comfortable" || value === "spacious";
}

export function sanitizeWidgetConfig(
  raw: DashboardWidgetConfig | string
): DashboardWidgetConfig | null {
  const id = typeof raw === "string" ? raw : raw?.id;
  if (!id || typeof id !== "string") return null;

  const meta = WIDGET_REGISTRY[id];
  const minCols = meta?.minCols ?? 6;
  const maxCols = meta?.maxCols ?? 24;
  const minRows = meta?.minRows ?? 1;
  const maxRows = meta?.maxRows ?? 5;
  const defaultCols = meta?.defaultCols ?? 12;
  const defaultRows = meta?.defaultRows ?? 3;
  const defaultHeightMode = meta?.defaultHeightMode ?? "auto";
  const defaultMobileCols = meta?.defaultMobileCols ?? 2;

  if (typeof raw === "string") {
    return {
      id,
      cols: defaultCols,
      rows: defaultRows,
      heightMode: defaultHeightMode,
      mobileVisible: true,
      mobileCols: defaultMobileCols,
    };
  }

  let cols = isFinitePositive(raw.cols)
    ? Math.min(maxCols, Math.max(minCols, Math.round(raw.cols)))
    : defaultCols;
  let rows = isFinitePositive(raw.rows)
    ? Math.min(maxRows, Math.max(minRows, Math.round(raw.rows)))
    : defaultRows;

  // Upgrade outdated broken dimensions cleanly
  if (id === "service_status" && rows === 2) rows = 3;
  if (id === "ai_insights" && (rows === 2 || cols === 10)) {
    rows = 3;
    cols = 12;
  }
  if (id === "inventory" && cols === 10) cols = 12;
  if (id === "revenue" && cols === 16) cols = 15;

  const heightMode = isValidHeightMode(raw.heightMode)
    ? raw.heightMode
    : meta?.kind === "stat"
      ? "auto"
      : defaultHeightMode;

  const mobileCols: 1 | 2 =
    raw.mobileCols === 1 || raw.mobileCols === 2 ? raw.mobileCols : defaultMobileCols;

  return {
    id,
    cols,
    rows,
    heightMode,
    mobileVisible: raw.mobileVisible !== false,
    mobileCols,
    ...(raw.settings && typeof raw.settings === "object" ? { settings: raw.settings } : {}),
  };
}

export function getSystemDashboardLayout(availableWidgetIds: Iterable<string>) {
  const available = new Set(availableWidgetIds);
  return SYSTEM_DASHBOARD_LAYOUT.filter((item) => available.has(item.id)).map((item) => ({
    ...item,
  }));
}

export function extractLayoutPreferences(
  rawLayout: unknown,
  availableWidgetIds?: Iterable<string>,
  fallbackLayout?: DashboardWidgetConfig[]
): DashboardLayoutPreferences {
  const available = availableWidgetIds
    ? new Set(availableWidgetIds)
    : new Set(Object.keys(WIDGET_REGISTRY));

  const defaultItems = (fallbackLayout ?? getSystemDashboardLayout(available)).map((item) => ({
    ...item,
  }));

  if (!rawLayout) {
    return {
      version: 2,
      density: "comfortable",
      autoCompactEmpty: true,
      presetId: "balanced",
      items: defaultItems,
    };
  }

  const isV2Object =
    typeof rawLayout === "object" &&
    !Array.isArray(rawLayout) &&
    Array.isArray((rawLayout as any).items);

  const rawItems: Array<DashboardWidgetConfig | string> = isV2Object
    ? (rawLayout as any).items
    : Array.isArray(rawLayout)
      ? rawLayout
      : [];

  const density: DashboardDensity = isV2Object && isValidDensity((rawLayout as any).density)
    ? (rawLayout as any).density
    : "comfortable";

  const autoCompactEmpty: boolean =
    isV2Object && typeof (rawLayout as any).autoCompactEmpty === "boolean"
      ? (rawLayout as any).autoCompactEmpty
      : true;

  const presetId: string | undefined =
    isV2Object && typeof (rawLayout as any).presetId === "string"
      ? (rawLayout as any).presetId
      : undefined;

  if (rawItems.length === 0) {
    return {
      version: 2,
      density,
      autoCompactEmpty,
      presetId: presetId || "balanced",
      items: defaultItems,
    };
  }

  const seen = new Set<string>();
  const sanitizedItems: DashboardWidgetConfig[] = [];

  for (const entry of rawItems) {
    const clean = sanitizeWidgetConfig(entry);
    if (!clean) continue;
    if (!available.has(clean.id) || seen.has(clean.id)) continue;
    seen.add(clean.id);
    sanitizedItems.push(clean);
  }

  // Only auto-append newly introduced system widgets when upgrading from legacy pre-v2 array format
  if (!isV2Object) {
    for (const fallbackItem of defaultItems) {
      if (!seen.has(fallbackItem.id) && available.has(fallbackItem.id)) {
        seen.add(fallbackItem.id);
        sanitizedItems.push({ ...fallbackItem });
      }
    }
  }

  return {
    version: 2,
    density,
    autoCompactEmpty,
    presetId,
    items: sanitizedItems.length > 0 ? sanitizedItems : defaultItems,
  };
}

export function sanitizeLayoutPayloadForServer(rawPayload: unknown): DashboardLayoutPreferences {
  return extractLayoutPreferences(rawPayload, Object.keys(WIDGET_REGISTRY));
}

export function normalizeDashboardLayout(
  layout: Array<DashboardWidgetConfig | string> | DashboardLayoutPreferences | null | undefined,
  availableWidgetIds: Iterable<string>,
  fallbackLayout?: DashboardWidgetConfig[]
) {
  return extractLayoutPreferences(layout, availableWidgetIds, fallbackLayout).items;
}

export function resolveEffectiveGridCols(
  widget: DashboardWidgetConfig,
  viewport: "mobile" | "tablet" | "desktop"
): number {
  const meta = WIDGET_REGISTRY[widget.id];
  const kind = meta?.kind ?? (widget.id.startsWith("stat_") ? "stat" : "module");

  if (viewport === "mobile") {
    return widget.mobileCols ?? (kind === "stat" ? 1 : 2);
  }

  if (viewport === "tablet") {
    // 12-column grid on tablets so KPIs sit 2-per-row cleanly and modules stay readable
    if (kind === "stat") {
      return widget.cols >= 12 ? 12 : 6;
    }
    return widget.cols >= 16 ? 12 : widget.cols <= 9 ? 6 : 12;
  }

  return widget.cols;
}

export function getContainerPxHeightConfig(
  widget: DashboardWidgetConfig,
  density: DashboardDensity,
  isMobile: boolean,
  isEmpty: boolean,
  autoCompactEmpty: boolean
): {
  mode: WidgetHeightMode | "empty-strip" | "stat-fixed";
  heightPx?: number;
  maxHeightPx?: number;
} {
  const metrics = DENSITY_METRICS[density];
  const meta = WIDGET_REGISTRY[widget.id];
  const kind = meta?.kind ?? (widget.id.startsWith("stat_") ? "stat" : "module");

  if (kind === "stat") {
    if (isMobile) {
      return { mode: "auto", maxHeightPx: undefined };
    }
    return { mode: "stat-fixed", heightPx: metrics.statHeightPx };
  }

  if (isEmpty && autoCompactEmpty) {
    return { mode: "empty-strip", heightPx: 68, maxHeightPx: 68 };
  }

  const heightMode = widget.heightMode ?? meta?.defaultHeightMode ?? "auto";

  if (isMobile) {
    if (heightMode === "compact") return { mode: "auto", maxHeightPx: metrics.compactHeightPx };
    if (heightMode === "tall") return { mode: "auto", maxHeightPx: metrics.tallHeightPx };
    return { mode: "auto", maxHeightPx: metrics.mobileMaxHeightPx };
  }

  if (heightMode === "compact") return { mode: "compact", heightPx: metrics.compactHeightPx };
  if (heightMode === "medium") return { mode: "medium", heightPx: metrics.mediumHeightPx };
  if (heightMode === "tall") return { mode: "tall", heightPx: metrics.tallHeightPx };

  // Dynamic auto-fit up to density ceiling (or rows-scaled ceiling when user dragged resize)
  const scaledCeiling =
    widget.rows >= 4 ? metrics.tallHeightPx : widget.rows === 2 ? metrics.compactHeightPx + 40 : metrics.autoMaxHeightPx;
  return { mode: "auto", maxHeightPx: scaledCeiling };
}

/** @deprecated Legacy check kept only for signature compatibility; returns false so user layouts are never wiped. */
export function isCollapsedDashboardLayout(_layout: unknown) {
  return false;
}
