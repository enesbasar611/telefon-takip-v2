export interface DashboardWidgetConfig {
  id: string;
  cols: number;
  rows: number;
  settings?: Record<string, any>;
}

export const SYSTEM_DASHBOARD_LAYOUT: DashboardWidgetConfig[] = [
  { id: "stat_sales", cols: 6, rows: 1 },
  { id: "stat_income", cols: 6, rows: 1 },
  { id: "stat_collections", cols: 6, rows: 1 },
  { id: "stat_ready", cols: 6, rows: 1 },
  { id: "stat_pending", cols: 6, rows: 1 },
  { id: "stat_stock", cols: 6, rows: 1 },
  { id: "stat_debts", cols: 6, rows: 1 },
  { id: "stat_accounts", cols: 6, rows: 1 },
  { id: "revenue", cols: 18, rows: 5 },
  { id: "service_status", cols: 6, rows: 5 },
  { id: "ai_insights", cols: 12, rows: 4 },
  { id: "shortage_status", cols: 12, rows: 5 },
  { id: "inventory", cols: 8, rows: 6 },
  { id: "service_queue", cols: 16, rows: 6 },
  { id: "transactions", cols: 16, rows: 6 },
  { id: "activity", cols: 8, rows: 6 },
  { id: "receivables", cols: 24, rows: 4 },
];

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
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

  if (!Array.isArray(layout) || layout.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }

  const normalized = layout
    .map((item) => {
      const id = typeof item === "string" ? item : item?.id;
      if (!id || !available.has(id)) return null;

      const defaultItem = fallbackById.get(id) ?? { id, cols: 6, rows: 2 };
      if (typeof item === "string") {
        return { ...defaultItem };
      }

      return {
        ...item,
        id,
        cols: isPositiveNumber(item.cols) ? Math.min(24, Math.max(1, item.cols)) : defaultItem.cols,
        rows: isPositiveNumber(item.rows) ? Math.min(40, Math.max(1, item.rows)) : defaultItem.rows,
      };
    })
    .filter(Boolean) as DashboardWidgetConfig[];

  return normalized.length > 0 ? normalized : fallback.map((item) => ({ ...item }));
}

export function isCollapsedDashboardLayout(layout: Array<DashboardWidgetConfig | string> | null | undefined) {
  if (!Array.isArray(layout) || layout.length < 6) return false;

  const configuredItems = layout.filter((item) => typeof item !== "string") as DashboardWidgetConfig[];
  if (configuredItems.length < 6) return false;

  const collapsedCount = configuredItems.filter((item) => isPositiveNumber(item.cols) && item.cols <= 2).length;
  return collapsedCount >= Math.ceil(configuredItems.length / 3);
}
