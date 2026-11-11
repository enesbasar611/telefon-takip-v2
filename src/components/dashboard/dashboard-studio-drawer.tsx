"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DASHBOARD_PRESETS,
  DENSITY_METRICS,
  WIDGET_REGISTRY,
  type DashboardDensity,
  type DashboardLayoutPreferences,
  type DashboardWidgetConfig,
  type WidgetCategory,
  type WidgetHeightMode,
} from "@/lib/dashboard-layout";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStudioDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: DashboardLayoutPreferences;
  availableWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  onUpdateWidget: (id: string, patch: Partial<DashboardWidgetConfig>) => void;
  onMoveWidget: (id: string, direction: "up" | "down") => void;
  onApplyPreset: (presetId: string) => void;
  onChangeDensity: (density: DashboardDensity) => void;
  onToggleAutoCompactEmpty: (value: boolean) => void;
  onResetDefault: () => void;
}

const CATEGORY_TABS: Array<{ id: "all" | WidgetCategory; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "kpi", label: "KPI" },
  { id: "finance", label: "Finans" },
  { id: "service", label: "Servis" },
  { id: "stock", label: "Stok" },
];

const CATEGORY_BADGE_MAP: Record<WidgetCategory, { label: string; className: string }> = {
  kpi: {
    label: "KPI",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
  finance: {
    label: "Finans",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  service: {
    label: "Servis",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  stock: {
    label: "Stok",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
  },
};

const HEIGHT_MODE_OPTIONS: Array<{ value: WidgetHeightMode; label: string }> = [
  { value: "auto", label: "Oto" },
  { value: "compact", label: "Kısa" },
  { value: "medium", label: "Orta" },
  { value: "tall", label: "Uzun" },
];

export function DashboardStudioDrawer({
  open,
  onOpenChange,
  preferences,
  availableWidgetIds,
  onToggleWidget,
  onUpdateWidget,
  onMoveWidget,
  onApplyPreset,
  onChangeDensity,
  onToggleAutoCompactEmpty,
  onResetDefault,
}: DashboardStudioDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | WidgetCategory>("all");

  const activeMap = useMemo(() => {
    const map = new Map<string, { config: DashboardWidgetConfig; index: number }>();
    preferences.items.forEach((item, index) => {
      map.set(item.id, { config: item, index });
    });
    return map;
  }, [preferences.items]);

  const catalogItems = useMemo(() => {
    const availableSet = new Set(availableWidgetIds);
    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");

    const all = Object.values(WIDGET_REGISTRY).filter((meta) => availableSet.has(meta.id));

    return all
      .filter((meta) => {
        if (categoryFilter !== "all" && meta.category !== categoryFilter) return false;
        if (!q) return true;
        return (
          meta.label.toLocaleLowerCase("tr-TR").includes(q) ||
          meta.description.toLocaleLowerCase("tr-TR").includes(q) ||
          meta.id.toLocaleLowerCase("tr-TR").includes(q)
        );
      })
      .sort((a, b) => {
        const activeA = activeMap.get(a.id);
        const activeB = activeMap.get(b.id);
        if (activeA && activeB) return activeA.index - activeB.index;
        if (activeA) return -1;
        if (activeB) return 1;
        return 0;
      });
  }, [availableWidgetIds, searchQuery, categoryFilter, activeMap]);

  const activeCount = preferences.items.length;
  const totalCount = availableWidgetIds.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 flex flex-col gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-l border-border/50"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border/40 bg-muted/15 space-y-1 shrink-0 text-left">
          <div className="flex items-center justify-between gap-3 pr-7">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                  Panel Stüdyosu
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold px-2 py-0.5 tabular-nums"
                  >
                    {activeCount}/{totalCount} aktif
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Kartları aç/kapat, yükseklik ve mobil düzenini kişiselleştir
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Global Density & Auto-Compact Strip */}
        <div className="px-5 py-3 border-b border-border/40 bg-muted/10 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Görünüm Yoğunluğu
            </span>
            <div className="inline-flex items-center rounded-xl bg-muted/50 p-1 border border-border/40">
              {(Object.keys(DENSITY_METRICS) as DashboardDensity[]).map((densityKey) => {
                const isSelected = preferences.density === densityKey;
                return (
                  <button
                    key={densityKey}
                    type="button"
                    onClick={() => onChangeDensity(densityKey)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-background text-foreground shadow-xs border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {DENSITY_METRICS[densityKey].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground">
                Verisiz kartları otomatik daralt
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Boş listeler büyük boşluk bırakmaz, tek satırlık özet şeridine küçülür
              </p>
            </div>
            <Switch
              checked={preferences.autoCompactEmpty}
              onCheckedChange={onToggleAutoCompactEmpty}
            />
          </div>
        </div>

        {/* Main Studio Tabs */}
        <Tabs defaultValue="widgets" className="flex-1 min-h-0 flex flex-col">
          <div className="px-5 pt-3 shrink-0">
            <TabsList className="grid grid-cols-2 w-full rounded-xl h-9">
              <TabsTrigger value="widgets" className="text-xs font-semibold gap-1.5 rounded-lg">
                <LayoutGrid className="h-3.5 w-3.5" />
                Kart Kütüphanesi ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="presets" className="text-xs font-semibold gap-1.5 rounded-lg">
                <Sparkles className="h-3.5 w-3.5" />
                Hazır Şablonlar ({DASHBOARD_PRESETS.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: WIDGET CATALOG */}
          <TabsContent
            value="widgets"
            className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden"
          >
            {/* Search & Category Filters */}
            <div className="px-5 pt-3 pb-2.5 space-y-2.5 shrink-0 border-b border-border/30">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kart ara... (kasa, veresiye, servis, iade)"
                  className="h-9 pl-8 text-xs rounded-xl bg-muted/25 border-border/50"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all whitespace-nowrap cursor-pointer",
                      categoryFilter === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Catalog List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2.5 custom-scrollbar">
              {catalogItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1">
                  <p className="text-xs font-semibold">Eşleşen kart bulunamadı</p>
                  <p className="text-[11px]">Arama kelimesini veya kategori filtresini değiştirin</p>
                </div>
              ) : (
                catalogItems.map((meta) => {
                  const activeEntry = activeMap.get(meta.id);
                  const isActive = Boolean(activeEntry);
                  const cfg = activeEntry?.config;
                  const idx = activeEntry?.index ?? -1;
                  const catBadge = CATEGORY_BADGE_MAP[meta.category];
                  const effectiveHeightMode: WidgetHeightMode =
                    cfg?.heightMode ?? meta.defaultHeightMode;
                  const isMobileVisible = cfg?.mobileVisible !== false;
                  const mobileCols = cfg?.mobileCols ?? meta.defaultMobileCols;

                  return (
                    <div
                      key={meta.id}
                      className={cn(
                        "rounded-2xl border p-3.5 transition-all space-y-2.5",
                        isActive
                          ? "border-primary/30 bg-primary/[0.03] shadow-xs"
                          : "border-border/50 bg-card/50 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {meta.label}
                            </span>
                            <span
                              className={cn(
                                "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                                catBadge.className
                              )}
                            >
                              {catBadge.label}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-semibold text-muted-foreground tabular-nums">
                                #{idx + 1}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {meta.description}
                          </p>
                        </div>

                        <Switch
                          checked={isActive}
                          onCheckedChange={() => onToggleWidget(meta.id)}
                          aria-label={`${meta.label} görünürlüğü`}
                        />
                      </div>

                      {isActive && cfg && (
                        <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2 flex-wrap">
                          {/* Height mode pills (for modules) */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {meta.kind === "module" && (
                              <div className="inline-flex items-center rounded-lg bg-muted/50 p-0.5 border border-border/40">
                                {HEIGHT_MODE_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      onUpdateWidget(meta.id, { heightMode: opt.value })
                                    }
                                    className={cn(
                                      "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer",
                                      effectiveHeightMode === opt.value
                                        ? "bg-background text-foreground shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Mobile visibility */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateWidget(meta.id, { mobileVisible: !isMobileVisible })
                              }
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                                isMobileVisible
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-muted/40 text-muted-foreground border-border/40"
                              )}
                              title="Mobilde göster / gizle"
                            >
                              <Smartphone className="h-3 w-3" />
                              {isMobileVisible ? (
                                <>
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>Mobil Açık</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-2.5 w-2.5" />
                                  <span>Mobilde Gizli</span>
                                </>
                              )}
                            </button>

                            {isMobileVisible && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateWidget(meta.id, {
                                    mobileCols: mobileCols === 1 ? 2 : 1,
                                  })
                                }
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-border/40 bg-muted/30 text-foreground hover:bg-muted/60 transition-all cursor-pointer tabular-nums"
                                title="Mobil satır genişliği (1 yarım / 2 tam)"
                              >
                                {mobileCols === 1 ? "Mobil 1/2" : "Mobil Tam"}
                              </button>
                            )}
                          </div>

                          {/* Reorder Arrows */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx <= 0}
                              onClick={() => onMoveWidget(meta.id, "up")}
                              className="h-7 w-7 rounded-lg border border-border/40 bg-background/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Yukarı Taşı"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx >= preferences.items.length - 1}
                              onClick={() => onMoveWidget(meta.id, "down")}
                              className="h-7 w-7 rounded-lg border border-border/40 bg-background/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Aşağı Taşı"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAB 2: PRESETS */}
          <TabsContent
            value="presets"
            className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3 mt-0 data-[state=inactive]:hidden custom-scrollbar"
          >
            {DASHBOARD_PRESETS.map((preset) => {
              const isCurrent = preferences.presetId === preset.id;
              const kpiCount = preset.items.filter((i) =>
                WIDGET_REGISTRY[i.id]?.kind === "stat"
              ).length;
              const moduleCount = preset.items.length - kpiCount;

              return (
                <div
                  key={preset.id}
                  className={cn(
                    "rounded-2xl border p-4 transition-all space-y-3",
                    isCurrent
                      ? "border-primary/40 bg-primary/[0.04] shadow-xs"
                      : "border-border/50 bg-card/60 hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">
                          {preset.name}
                        </h4>
                        {isCurrent && (
                          <Badge className="text-[10px] font-semibold px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
                            Seçili
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {preset.items
                      .filter((item) => WIDGET_REGISTRY[item.id]?.kind === "module")
                      .slice(0, 6)
                      .map((item) => (
                        <span
                          key={item.id}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/50 border border-border/40 text-muted-foreground"
                        >
                          {WIDGET_REGISTRY[item.id]?.label ?? item.id}
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {kpiCount} KPI · {moduleCount} Modül ·{" "}
                      {DENSITY_METRICS[preset.density].label}
                    </span>
                    <Button
                      size="sm"
                      variant={isCurrent ? "secondary" : "default"}
                      className="h-8 rounded-xl text-xs font-semibold px-3 cursor-pointer"
                      onClick={() => onApplyPreset(preset.id)}
                    >
                      {isCurrent ? "Tekrar Uygula" : "Şablonu Uygula"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/40 bg-muted/15 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetDefault}
            className="h-9 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Varsayılana Sıfırla
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl text-xs font-semibold gap-1.5 px-4 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Bitti
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

