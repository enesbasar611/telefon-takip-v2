export interface DashboardWidgetConfig {
  id: string;
  cols: number;
  rows: number;
  settings?: Record<string, any>;
}

export const SYSTEM_DASHBOARD_LAYOUT: DashboardWidgetConfig[] = [
  // ROW 1: Financial KPIs (24 cols total, 1 row tall)
  { id: "stat_sales", cols: 6, rows: 1 },
  { id: "stat_income", cols: 6, rows: 1 },
  { id: "stat_collections", cols: 6, rows: 1 },
  { id: "stat_accounts", cols: 6, rows: 1 },

  // ROW 2: Operational KPIs (24 cols total, 1 row tall)
  { id: "stat_ready", cols: 6, rows: 1 },
  { id: "stat_pending", cols: 6, rows: 1 },
  { id: "stat_stock", cols: 6, rows: 1 },
  { id: "stat_debts", cols: 6, rows: 1 },

  // ROW 3: Main Performance & Analytics (15 + 9 = 24 cols, 3 rows tall)
  { id: "revenue", cols: 15, rows: 3 },
  { id: "service_status", cols: 9, rows: 3 },

  // ROW 4: Operations & Live Transactions (12 + 12 = 24 cols, 3 rows tall)
  { id: "service_queue", cols: 12, rows: 3 },
  { id: "transactions", cols: 12, rows: 3 },

  // ROW 5: AI Intelligence & Live Activity Feed (12 + 12 = 24 cols, 3 rows tall)
  { id: "ai_insights", cols: 12, rows: 3 },
  { id: "activity", cols: 12, rows: 3 },

  // ROW 6: Inventory Performance & Receivables (12 + 12 = 24 cols, 3 rows tall)
  { id: "inventory", cols: 12, rows: 3 },
  { id: "receivables", cols: 12, rows: 3 },

  // ROW 7: Logistics & Delivery (24 cols, 2 rows tall)
  { id: "shortage_status", cols: 24, rows: 2 },
];

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isLegacyOrBrokenLayout(layout: Array<DashboardWidgetConfig | string> | null | undefined): boolean {
  if (!Array.isArray(layout) || layout.length === 0) return true;

  // Check if primary system widgets are missing
  const ids = new Set(layout.map((item) => (typeof item === "string" ? item : item?.id)));
  if (!ids.has("revenue") || !ids.has("service_status") || !ids.has("stat_sales")) {
    return true;
  }

  // Detect outdated dimension signatures that caused uneven grid gaps
  const configs = layout.filter((item) => typeof item !== "string") as DashboardWidgetConfig[];
  const serviceStatus = configs.find((c) => c.id === "service_status");
  if (serviceStatus && (serviceStatus.rows === 2 || serviceStatus.cols === 8)) return true;

  const aiInsights = configs.find((c) => c.id === "ai_insights");
  if (aiInsights && (aiInsights.cols === 10 || aiInsights.rows === 2)) return true;

  const inventory = configs.find((c) => c.id === "inventory");
  if (inventory && inventory.cols === 10) return true;

  const revenue = configs.find((c) => c.id === "revenue");
  if (revenue && revenue.cols === 16) return true;

  return false;
}

export function getSystemDashboardLayout(availableWidgetIds: Iterable<string>) {
  const available = new Set(availableWidgetIds);
  return SYSTEM_DASHBOARD_LAYOUT.filter((item) => available.has(item.id)).map((item) => ({ ...item }));
}

export function normalizeDashboardLayout(
  layout: Array<DashboardWidgetConfig | string> | null | undefined,
  availableWidgetIds: Iterable<string>,
  fallbackLayout?: DashboardWidgetConfig[]
) {
  const available = new Set(availableWidgetIds);
  const fallback = fallbackLayout ?? getSystemDashboardLayout(available);
  const fallbackById = new Map(fallback.map((item) => [item.id, item]));

  // If layout is missing, empty, or has outdated dimensions causing gaps, return clean balanced default
  if (!Array.isArray(layout) || layout.length === 0 || isLegacyOrBrokenLayout(layout)) {
    return fallback.map((item) => ({ ...item }));
  }

  const normalized = layout
    .map((item) => {
      const id = typeof item === "string" ? item : item?.id;
      if (!id || !available.has(id)) return null;

      const defaultItem = fallbackById.get(id) ?? { id, cols: 12, rows: 3 };
      if (typeof item === "string") {
        return { ...defaultItem };
      }

      // Upgrade known outdated dimensions to balanced pairs
      let cols = isPositiveNumber(item.cols) ? Math.min(24, Math.max(1, item.cols)) : defaultItem.cols;
      let rows = isPositiveNumber(item.rows) ? Math.min(40, Math.max(1, item.rows)) : defaultItem.rows;

      if (id === "service_status" && rows === 2) rows = 3;
      if (id === "ai_insights" && (rows === 2 || cols === 10)) { rows = 3; cols = 12; }
      if (id === "inventory" && cols === 10) cols = 12;
      if (id === "revenue" && cols === 16) cols = 15;

      return {
        ...item,
        id,
        cols,
        rows,
      };
    })
    .filter(Boolean) as DashboardWidgetConfig[];

  // Ensure any missing system widgets from available list are appended gracefully
  const existingIds = new Set(normalized.map((n) => n.id));
  for (const fallbackItem of fallback) {
    if (!existingIds.has(fallbackItem.id) && available.has(fallbackItem.id)) {
      normalized.push({ ...fallbackItem });
    }
  }

  return normalized.length > 0 ? normalized : fallback.map((item) => ({ ...item }));
}

export function isCollapsedDashboardLayout(layout: Array<DashboardWidgetConfig | string> | null | undefined) {
  if (!Array.isArray(layout) || layout.length < 6) return false;

  const configuredItems = layout.filter((item) => typeof item !== "string") as DashboardWidgetConfig[];
  if (configuredItems.length < 6) return false;

  const collapsedCount = configuredItems.filter((item) => isPositiveNumber(item.cols) && item.cols <= 2).length;
  return collapsedCount >= Math.ceil(configuredItems.length / 3);
}
