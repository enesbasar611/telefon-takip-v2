"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  MousePointer2,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./dashboard-context";
import { DashboardStudioDrawer } from "./dashboard-studio-drawer";
import {
  DASHBOARD_PRESETS,
  DENSITY_METRICS,
  WIDGET_REGISTRY,
  extractLayoutPreferences,
  getContainerPxHeightConfig,
  resolveEffectiveGridCols,
  type DashboardDensity,
  type DashboardLayoutPreferences,
  type DashboardWidgetConfig,
  type WidgetHeightMode,
} from "@/lib/dashboard-layout";

interface DashboardClientProps {
  initialLayout?:
    | DashboardLayoutPreferences
    | DashboardWidgetConfig[]
    | string[]
    | null;
  initialData?: unknown;
  widgets: Record<string, React.ReactNode>;
  widgetLabels?: Record<string, string>;
  shopId: string;
}

type ViewportKind = "mobile" | "tablet" | "desktop";

const COL_FRACTION_LABELS: Record<number, string> = {
  6: "1/4",
  8: "1/3",
  9: "3/8",
  12: "1/2",
  15: "5/8",
  16: "2/3",
  24: "Tam",
};

const HEIGHT_MODE_SEQUENCE: WidgetHeightMode[] = ["auto", "compact", "medium", "tall"];

const HEIGHT_MODE_LABELS: Record<WidgetHeightMode, string> = {
  auto: "Oto",
  compact: "Kısa",
  medium: "Orta",
  tall: "Uzun",
};

function getViewportFromWidth(width: number): ViewportKind {
  if (width < 640) return "mobile";
  if (width < 1200) return "tablet";
  return "desktop";
}

export function DashboardClient({
  initialLayout,
  widgets,
  widgetLabels = {},
  shopId,
}: DashboardClientProps) {
  const {
    isEditMode,
    setIsEditMode,
    isStudioOpen,
    setIsStudioOpen,
    saveLayout,
    isPending,
    hasChanges,
    setHasChanges,
    saveVersion,
  } = useDashboard();

  const availableIds = useMemo(() => Object.keys(widgets), [widgets]);
  const initialSerialized = useMemo(
    () => JSON.stringify(initialLayout ?? null),
    [initialLayout]
  );

  const resolvedInitial = useMemo(
    () => extractLayoutPreferences(initialLayout, availableIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialSerialized, availableIds]
  );

  const [preferences, setPreferences] =
    useState<DashboardLayoutPreferences>(resolvedInitial);
  const [savedSnapshot, setSavedSnapshot] =
    useState<DashboardLayoutPreferences>(resolvedInitial);
  const lastSyncedRef = useRef<{ serialized: string; saveVersion: number }>({
    serialized: initialSerialized,
    saveVersion,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportKind>("desktop");
  const [emptyWidgets, setEmptyWidgets] = useState<Record<string, boolean>>({});
  const [forcedExpanded, setForcedExpanded] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement | null>(null);

  const isMobile = viewport === "mobile";

  // Synchronize with refreshed server props only when not actively editing
  useEffect(() => {
    const serverChanged = initialSerialized !== lastSyncedRef.current.serialized;
    const savedChanged = saveVersion !== lastSyncedRef.current.saveVersion;

    if (!hasChanges && !isEditMode && (serverChanged || savedChanged)) {
      setPreferences(resolvedInitial);
      setSavedSnapshot(resolvedInitial);
      lastSyncedRef.current = {
        serialized: initialSerialized,
        saveVersion,
      };
    }
  }, [initialSerialized, saveVersion, resolvedInitial, hasChanges, isEditMode]);

  // Responsive viewport listener
  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewportFromWidth(window.innerWidth));
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Stable callbacks for widgets reporting empty/populated status
  const emptyCallbacksRef = useRef<Record<string, (isEmpty: boolean) => void>>({});
  const getEmptyCallback = useCallback((id: string) => {
    if (!emptyCallbacksRef.current[id]) {
      emptyCallbacksRef.current[id] = (isEmpty: boolean) => {
        setEmptyWidgets((prev) => {
          if (prev[id] === isEmpty) return prev;
          return { ...prev, [id]: isEmpty };
        });
      };
    }
    return emptyCallbacksRef.current[id];
  }, []);

  const displayLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const key of availableIds) {
      map[key] = WIDGET_REGISTRY[key]?.label ?? widgetLabels[key] ?? key;
    }
    return map;
  }, [availableIds, widgetLabels]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCenter(args);
  }, []);

  const commitPreferences = useCallback(
    (updater: (prev: DashboardLayoutPreferences) => DashboardLayoutPreferences) => {
      setPreferences((prev) => updater(prev));
      setHasChanges(true);
    },
    [setHasChanges]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    commitPreferences((prev) => {
      const oldIndex = prev.items.findIndex((i) => i.id === active.id);
      const newIndex = prev.items.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex),
      };
    });
  };

  const handleUpdateWidget = useCallback(
    (id: string, patch: Partial<DashboardWidgetConfig>) => {
      commitPreferences((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [commitPreferences]
  );

  const handleToggleWidget = useCallback(
    (id: string) => {
      commitPreferences((prev) => {
        const exists = prev.items.some((item) => item.id === id);
        if (exists) {
          if (prev.items.length <= 1) {
            toast.warning("Panelde en az 1 kart kalmalıdır.");
            return prev;
          }
          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
          };
        }

        const meta = WIDGET_REGISTRY[id];
        const newItem: DashboardWidgetConfig = {
          id,
          cols: meta?.defaultCols ?? 12,
          rows: meta?.defaultRows ?? 3,
          heightMode: meta?.defaultHeightMode ?? "auto",
          mobileVisible: true,
          mobileCols: meta?.defaultMobileCols ?? 2,
        };
        return {
          ...prev,
          items: [...prev.items, newItem],
        };
      });
    },
    [commitPreferences]
  );

  const handleMoveWidget = useCallback(
    (id: string, direction: "up" | "down") => {
      commitPreferences((prev) => {
        const idx = prev.items.findIndex((item) => item.id === id);
        if (idx < 0) return prev;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.items.length) return prev;
        return {
          ...prev,
          items: arrayMove(prev.items, idx, targetIdx),
        };
      });
    },
    [commitPreferences]
  );

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const availableSet = new Set(availableIds);
      const filteredItems = preset.items
        .filter((item) => availableSet.has(item.id))
        .map((item) => ({ ...item }));

      commitPreferences((prev) => ({
        ...prev,
        version: 2,
        presetId: preset.id,
        density: preset.density,
        items: filteredItems.length > 0 ? filteredItems : prev.items,
      }));
      toast.success(`"${preset.name}" şablonu uygulandı`);
    },
    [availableIds, commitPreferences]
  );

  const handleChangeDensity = useCallback(
    (density: DashboardDensity) => {
      commitPreferences((prev) => ({ ...prev, density }));
    },
    [commitPreferences]
  );

  const handleCycleDensity = useCallback(() => {
    const order: DashboardDensity[] = ["compact", "comfortable", "spacious"];
    const idx = order.indexOf(preferences.density);
    const next = order[(idx + 1) % order.length];
    handleChangeDensity(next);
  }, [preferences.density, handleChangeDensity]);

  const handleToggleAutoCompactEmpty = useCallback(
    (value: boolean) => {
      commitPreferences((prev) => ({ ...prev, autoCompactEmpty: value }));
    },
    [commitPreferences]
  );

  const handleReset = useCallback(() => {
    const fallback = extractLayoutPreferences(null, availableIds);
    setPreferences(fallback);
    setHasChanges(true);
    toast.info("Varsayılan düzen uygulandı. Kalıcı yapmak için Kaydet'e basın.");
  }, [availableIds, setHasChanges]);

  const handleUndo = useCallback(() => {
    setPreferences(savedSnapshot);
    setHasChanges(false);
    toast.info("Son kaydedilen düzene dönüldü");
  }, [savedSnapshot, setHasChanges]);

  const handleSave = useCallback(async () => {
    const ok = await saveLayout(preferences);
    if (ok) {
      setSavedSnapshot(preferences);
      setIsEditMode(false);
      setIsStudioOpen(false);
    }
  }, [preferences, saveLayout, setIsEditMode, setIsStudioOpen]);

  // Listen for top header "Kaydet & Bitir" trigger when in edit mode
  useEffect(() => {
    const onSaveAndExit = () => {
      handleSave();
    };
    window.addEventListener("dashboard:save-and-exit", onSaveAndExit);
    return () => window.removeEventListener("dashboard:save-and-exit", onSaveAndExit);
  }, [handleSave]);

  const handleToggleSetting = useCallback(
    (id: string, key: string, value: any) => {
      commitPreferences((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id
            ? { ...item, settings: { ...(item.settings || {}), [key]: value } }
            : item
        ),
      }));
    },
    [commitPreferences]
  );

  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      id: string,
      desktopCols: number,
      startHeightPx: number
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (viewport === "mobile") return;

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const totalGridCols = viewport === "tablet" ? 12 : 24;
      const densityGap = DENSITY_METRICS[preferences.density].gapPx;
      const gridWidth = gridRef.current?.clientWidth || window.innerWidth - 64;
      const colPixelStep =
        (gridWidth - densityGap * (totalGridCols - 1)) / totalGridCols;

      const meta = WIDGET_REGISTRY[id];
      const allowed = meta?.allowedCols ?? [6, 8, 12, 16, 24];
      const isStat = meta?.kind === "stat";
      let lastAppliedCols = desktopCols;
      let lastAppliedMode: WidgetHeightMode | undefined;

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const moveX =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientX
            : (moveEvent as MouseEvent).clientX;
        const moveY =
          "touches" in moveEvent
            ? moveEvent.touches[0].clientY
            : (moveEvent as MouseEvent).clientY;

        const deltaX = moveX - clientX;
        const deltaY = moveY - clientY;

        // Calculate new column span normalized to 24-col schema
        const deltaViewportCols = Math.round(deltaX / Math.max(24, colPixelStep));
        const deltaDesktopCols =
          viewport === "tablet" ? deltaViewportCols * 2 : deltaViewportCols;
        const targetDesktopCols = Math.max(
          meta?.minCols ?? 6,
          Math.min(meta?.maxCols ?? 24, desktopCols + deltaDesktopCols)
        );

        const snappedCols = allowed.reduce((prev, curr) =>
          Math.abs(curr - targetDesktopCols) < Math.abs(prev - targetDesktopCols)
            ? curr
            : prev
        );

        let nextHeightMode: WidgetHeightMode | undefined;
        if (!isStat && Math.abs(deltaY) > 22) {
          const targetPx = startHeightPx + deltaY;
          if (targetPx < 280) nextHeightMode = "compact";
          else if (targetPx < 410) nextHeightMode = "medium";
          else nextHeightMode = "tall";
        }

        if (
          snappedCols === lastAppliedCols &&
          (!nextHeightMode || nextHeightMode === lastAppliedMode)
        ) {
          return;
        }
        lastAppliedCols = snappedCols;
        if (nextHeightMode) lastAppliedMode = nextHeightMode;

        setPreferences((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  cols: snappedCols,
                  ...(nextHeightMode ? { heightMode: nextHeightMode } : {}),
                }
              : item
          ),
        }));
        setHasChanges(true);
      };

      const handleEnd = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);
    },
    [viewport, preferences.density, setHasChanges]
  );

  // Visible items for current viewport & mode
  const renderedItems = useMemo(() => {
    return preferences.items.filter((item) => {
      if (!widgets[item.id]) return false;
      if (isMobile && !isEditMode && item.mobileVisible === false) return false;
      return true;
    });
  }, [preferences.items, widgets, isMobile, isEditMode]);

  const hiddenCount = Math.max(0, availableIds.length - preferences.items.length);
  const densityMetric = DENSITY_METRICS[preferences.density];

  const gridStyle: React.CSSProperties = useMemo(() => {
    if (viewport === "mobile") {
      return {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gridAutoRows: "auto",
        gap: `${densityMetric.gapPx}px`,
        gridAutoFlow: "row",
      };
    }

    return {
      display: "grid",
      gridTemplateColumns:
        viewport === "tablet"
          ? "repeat(12, minmax(0, 1fr))"
          : "repeat(24, minmax(0, 1fr))",
      gridAutoRows: "8px",
      rowGap: "0px",
      columnGap: `${densityMetric.gapPx}px`,
      gridAutoFlow: isEditMode ? "row" : "dense",
    };
  }, [viewport, densityMetric.gapPx, isEditMode]);

  return (
    <div className="space-y-4">
      {/* Unified Sticky Edit Mode Control Bar */}
      {isEditMode && (
        <div className="sticky top-2 z-40 rounded-2xl border border-primary/30 bg-background/90 dark:bg-[#0c121d]/95 backdrop-blur-xl shadow-lg px-3.5 py-2.5 flex items-center justify-between gap-2.5 flex-wrap animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Tasarım Modu
                </span>
                {hasChanges ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    Kaydedilmemiş değişiklikler
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground hidden md:inline">
                    Kartları sürükle, genişlik ve yükseklik modunu seç
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsStudioOpen(true)}
              className="h-8 rounded-xl text-[11px] font-semibold gap-1.5 px-2.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Stüdyo</span>
              {hiddenCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-bold tabular-nums">
                  +{hiddenCount}
                </span>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCycleDensity}
              className="h-8 rounded-xl text-[11px] font-semibold gap-1.5 px-2.5 cursor-pointer hidden sm:inline-flex"
              title="Görünüm yoğunluğunu değiştir (Kompakt / Standart / Ferah)"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>{densityMetric.label}</span>
            </Button>

            {hasChanges && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleUndo}
                disabled={isPending}
                className="h-8 rounded-xl text-[11px] font-semibold gap-1 px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Geri Al</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleReset}
              disabled={isPending}
              className="h-8 rounded-xl text-[11px] font-semibold px-2.5 text-muted-foreground hover:text-foreground cursor-pointer hidden md:inline-flex"
            >
              Varsayılan
            </Button>

            <Button
              type="button"
              size="sm"
              variant={hasChanges ? "default" : "secondary"}
              onClick={
                hasChanges
                  ? handleSave
                  : () => {
                      setIsEditMode(false);
                      setIsStudioOpen(false);
                    }
              }
              disabled={isPending}
              className="h-8 rounded-xl text-[11px] font-semibold gap-1.5 px-3 cursor-pointer"
            >
              {hasChanges ? (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{isPending ? "Kaydediliyor..." : "Kaydet & Bitir"}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Tamamla</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Grid + Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={renderedItems.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div
            ref={gridRef}
            style={gridStyle}
            className={cn(
              "transition-colors duration-200",
              isEditMode &&
                "rounded-3xl p-2 sm:p-3 bg-primary/[0.02] ring-1 ring-primary/20"
            )}
          >
            {renderedItems.map((item, idx) => {
              const effectiveCols = resolveEffectiveGridCols(item, viewport);
              const meta = WIDGET_REGISTRY[item.id];
              const isStat = meta?.kind === "stat" || item.id.startsWith("stat_");
              const rawEmpty = Boolean(emptyWidgets[item.id]);
              const isCollapsedEmpty =
                !isStat &&
                rawEmpty &&
                preferences.autoCompactEmpty &&
                !isEditMode &&
                !forcedExpanded[item.id];

              const heightCfg = getContainerPxHeightConfig(
                item,
                preferences.density,
                isMobile,
                isCollapsedEmpty,
                preferences.autoCompactEmpty
              );

              const clonedWidget = React.isValidElement(widgets[item.id])
                ? React.cloneElement(
                    widgets[item.id] as React.ReactElement<any>,
                    isStat
                      ? {
                          cols: item.cols,
                          rows: item.rows,
                        }
                      : {
                          viewMode: item.settings?.viewMode || "grid",
                          shopId,
                          cols: item.cols,
                          rows: item.rows,
                          onDataStatus: getEmptyCallback(item.id),
                        }
                  )
                : widgets[item.id];

              return (
                <SortableWidgetCell
                  key={item.id}
                  item={item}
                  index={idx}
                  totalCount={renderedItems.length}
                  label={displayLabels[item.id] || item.id}
                  viewport={viewport}
                  effectiveCols={effectiveCols}
                  gapPx={densityMetric.gapPx}
                  heightCfg={heightCfg}
                  isEditMode={isEditMode}
                  isStat={isStat}
                  isEmpty={rawEmpty}
                  isCollapsedEmpty={isCollapsedEmpty}
                  isTemporarilyExpanded={Boolean(forcedExpanded[item.id])}
                  onExpandEmpty={() =>
                    setForcedExpanded((prev) => ({ ...prev, [item.id]: true }))
                  }
                  onCollapseEmpty={() =>
                    setForcedExpanded((prev) => ({ ...prev, [item.id]: false }))
                  }
                  onRemove={() => handleToggleWidget(item.id)}
                  onUpdateWidget={(patch) => handleUpdateWidget(item.id, patch)}
                  onMove={(dir) => handleMoveWidget(item.id, dir)}
                  onToggleView={(m) => handleToggleSetting(item.id, "viewMode", m)}
                  onResizeStart={(e, startHeightPx) =>
                    handleResizeStart(e, item.id, item.cols, startHeightPx)
                  }
                >
                  {clonedWidget}
                </SortableWidgetCell>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="rounded-2xl shadow-2xl ring-2 ring-primary bg-background/95 backdrop-blur-xl px-4 py-3 border border-primary/30 w-[280px] pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <MousePointer2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {displayLabels[activeId] || activeId}
                  </div>
                  <div className="text-[10px] text-primary font-medium uppercase tracking-wider">
                    Yeni konuma yerleştiriliyor...
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Panel Studio Slide-Over Drawer */}
      <DashboardStudioDrawer
        open={isStudioOpen}
        onOpenChange={setIsStudioOpen}
        preferences={preferences}
        availableWidgetIds={availableIds}
        onToggleWidget={handleToggleWidget}
        onUpdateWidget={handleUpdateWidget}
        onMoveWidget={handleMoveWidget}
        onApplyPreset={handleApplyPreset}
        onChangeDensity={handleChangeDensity}
        onToggleAutoCompactEmpty={handleToggleAutoCompactEmpty}
        onResetDefault={handleReset}
      />
    </div>
  );
}

interface SortableWidgetCellProps {
  item: DashboardWidgetConfig;
  index: number;
  totalCount: number;
  label: string;
  viewport: ViewportKind;
  effectiveCols: number;
  gapPx: number;
  heightCfg: ReturnType<typeof getContainerPxHeightConfig>;
  isEditMode: boolean;
  isStat: boolean;
  isEmpty: boolean;
  isCollapsedEmpty: boolean;
  isTemporarilyExpanded: boolean;
  onExpandEmpty: () => void;
  onCollapseEmpty: () => void;
  onRemove: () => void;
  onUpdateWidget: (patch: Partial<DashboardWidgetConfig>) => void;
  onMove: (direction: "up" | "down") => void;
  onToggleView: (mode: string) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, startHeightPx: number) => void;
  children: React.ReactNode;
}

function SortableWidgetCell({
  item,
  index,
  totalCount,
  label,
  viewport,
  effectiveCols,
  gapPx,
  heightCfg,
  isEditMode,
  isStat,
  isEmpty,
  isCollapsedEmpty,
  isTemporarilyExpanded,
  onExpandEmpty,
  onCollapseEmpty,
  onRemove,
  onUpdateWidget,
  onMove,
  onToggleView,
  onResizeStart,
  children,
}: SortableWidgetCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isEditMode });

  const innerRef = useRef<HTMLDivElement | null>(null);
  const initialEstimatedHeight =
    heightCfg.heightPx ?? (heightCfg.maxHeightPx ? Math.min(300, heightCfg.maxHeightPx) : 176);
  const [measuredHeight, setMeasuredHeight] = useState<number>(initialEstimatedHeight);

  const isMobile = viewport === "mobile";

  // Keep measured height synchronized with real DOM content for Bento 8px packing
  useEffect(() => {
    if (isMobile) return;
    const el = innerRef.current;
    if (!el) return;

    const updateMeasurement = () => {
      const next = Math.ceil(el.offsetHeight);
      if (next > 0) {
        setMeasuredHeight((prev) => (Math.abs(prev - next) >= 2 ? next : prev));
      }
    };

    updateMeasurement();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      updateMeasurement();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, isEditMode, isCollapsedEmpty, heightCfg.heightPx, heightCfg.maxHeightPx]);

  const effectiveHeightForSpan = heightCfg.heightPx && !isEditMode
    ? heightCfg.heightPx
    : Math.max(measuredHeight, heightCfg.heightPx ?? 0);

  const spanRows = Math.max(8, Math.ceil((effectiveHeightForSpan + gapPx) / 8));

  const cellStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    gridColumn: `span ${effectiveCols} / span ${effectiveCols}`,
    ...(isMobile
      ? {}
      : {
          gridRowEnd: `span ${spanRows}`,
          paddingBottom: `${gapPx}px`,
          alignSelf: "start",
        }),
  };

  const meta = WIDGET_REGISTRY[item.id];
  const allowedCols = meta?.allowedCols ?? [6, 8, 12, 16, 24];
  const currentHeightMode: WidgetHeightMode =
    item.heightMode ?? meta?.defaultHeightMode ?? "auto";
  const isMobileVisible = item.mobileVisible !== false;
  const mobileCols = item.mobileCols ?? meta?.defaultMobileCols ?? 2;

  const handleCycleHeightMode = () => {
    const idx = HEIGHT_MODE_SEQUENCE.indexOf(currentHeightMode);
    const next = HEIGHT_MODE_SEQUENCE[(idx + 1) % HEIGHT_MODE_SEQUENCE.length];
    onUpdateWidget({ heightMode: next });
  };

  // Compute CSS height bounds on content wrapper (never breaks inner Card flex scroll)
  const contentWrapperStyle: React.CSSProperties = {};
  let contentWrapperClass = "w-full relative flex flex-col min-h-0";

  if (heightCfg.heightPx) {
    contentWrapperStyle.height = `${heightCfg.heightPx}px`;
  } else if (heightCfg.maxHeightPx) {
    contentWrapperStyle.maxHeight = `${heightCfg.maxHeightPx}px`;
    (contentWrapperStyle as Record<string, string>)["--widget-max-h"] =
      `${heightCfg.maxHeightPx}px`;
    contentWrapperClass =
      "w-full relative flex flex-col min-h-0 [&>*]:min-h-0 [&>*]:!h-auto [&>*]:max-h-[var(--widget-max-h)]";
  }

  return (
    <div
      ref={setNodeRef}
      style={cellStyle}
      className={cn(
        "relative min-w-0",
        isDragging && "opacity-35 z-50"
      )}
    >
      <div
        ref={innerRef}
        className={cn(
          "relative w-full rounded-2xl transition-all duration-200",
          isEditMode &&
            "ring-1 ring-primary/35 shadow-sm bg-card/40 overflow-hidden",
          isEditMode && isMobile && !isMobileVisible && "opacity-55 ring-amber-500/40"
        )}
      >
        {/* Dedicated Non-Overlapping Edit Mode Top Strip */}
        {isEditMode && (
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-primary/[0.08] border-b border-primary/20 text-[10px] select-none">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center gap-1.5 min-w-0 flex-1 cursor-grab active:cursor-grabbing py-0.5"
              title="Sürükleyerek taşı"
            >
              <GripVertical className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate">{label}</span>
              {!isMobileVisible && (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  Mobil Gizli
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Mobile controls vs Desktop/Tablet width controls */}
              {isMobile ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWidget({ mobileCols: mobileCols === 1 ? 2 : 1 })
                    }
                    className="h-6 px-1.5 rounded-md bg-background/80 border border-border/50 font-semibold text-foreground cursor-pointer tabular-nums"
                    title="Mobil sütun genişliği"
                  >
                    {mobileCols === 1 ? "1/2" : "Tam"}
                  </button>
                  <button
                    type="button"
                    disabled={index <= 0}
                    onClick={() => onMove("up")}
                    className="h-6 w-6 rounded-md bg-background/80 border border-border/50 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    title="Yukarı Taşı"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index >= totalCount - 1}
                    onClick={() => onMove("down")}
                    className="h-6 w-6 rounded-md bg-background/80 border border-border/50 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    title="Aşağı Taşı"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  {/* Width snap options */}
                  <div className="hidden sm:inline-flex items-center rounded-md bg-background/70 border border-border/50 p-0.5 gap-0.5">
                    {allowedCols.map((colOpt) => (
                      <button
                        key={colOpt}
                        type="button"
                        onClick={() => onUpdateWidget({ cols: colOpt })}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all cursor-pointer tabular-nums",
                          item.cols === colOpt
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {COL_FRACTION_LABELS[colOpt] ?? `${colOpt}`}
                      </button>
                    ))}
                  </div>

                  {/* Height mode cycle for modules */}
                  {!isStat && (
                    <button
                      type="button"
                      onClick={handleCycleHeightMode}
                      className="h-6 px-1.5 rounded-md bg-background/80 border border-border/50 text-[9px] font-semibold text-foreground hover:bg-muted cursor-pointer"
                      title="Yükseklik modu: Otomatik / Kısa / Orta / Uzun (tıkla değiştir)"
                    >
                      Boy: {HEIGHT_MODE_LABELS[currentHeightMode]}
                    </button>
                  )}

                  {/* Top products list/grid view toggle */}
                  {item.id === "inventory" && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleView(
                          item.settings?.viewMode === "list" ? "grid" : "list"
                        )
                      }
                      className="h-6 px-1.5 rounded-md bg-background/80 border border-border/50 text-[9px] font-semibold text-foreground hover:bg-muted cursor-pointer"
                      title="Liste / Izgara görünümü"
                    >
                      {item.settings?.viewMode === "list" ? "Izgara" : "Liste"}
                    </button>
                  )}
                </>
              )}

              {/* Mobile visibility toggle */}
              <button
                type="button"
                onClick={() => onUpdateWidget({ mobileVisible: !isMobileVisible })}
                className={cn(
                  "h-6 w-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors",
                  isMobileVisible
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-muted/50 text-muted-foreground border-border/50"
                )}
                title={isMobileVisible ? "Mobilde gizle" : "Mobilde göster"}
              >
                {isMobileVisible ? (
                  <Smartphone className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>

              {/* Remove from panel */}
              <button
                type="button"
                onClick={onRemove}
                className="h-6 w-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Panelden kaldır"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Empty Strip OR Normal Content */}
        {isCollapsedEmpty ? (
          <>
            <div className="hidden">{children}</div>
            <div className="h-[68px] w-full rounded-2xl border border-border/40 bg-card/75 dark:bg-[#0c121d]/75 backdrop-blur-xl px-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground truncate">
                  {label}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground shrink-0">
                  Aktif kayıt yok
                </span>
              </div>
              <button
                type="button"
                onClick={onExpandEmpty}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Göster</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </>
        ) : (
          <div style={contentWrapperStyle} className={contentWrapperClass}>
            {children}

            {/* Small collapse-back chip when user expanded an empty widget manually */}
            {!isEditMode && isEmpty && isTemporarilyExpanded && (
              <button
                type="button"
                onClick={onCollapseEmpty}
                className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 text-[10px] font-semibold bg-background/90 border border-border/60 text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg shadow-xs cursor-pointer"
              >
                <ChevronUp className="h-3 w-3" />
                Daralt
              </button>
            )}

            {/* Full card drag surface in Edit Mode so users can drag anywhere */}
            {isEditMode && (
              <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing bg-transparent"
              />
            )}
          </div>
        )}

        {/* Bottom-Right Resize Corner Handle (Desktop/Tablet Edit Mode) */}
        {isEditMode && !isMobile && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => onResizeStart(e, measuredHeight)}
            onTouchStart={(e) => onResizeStart(e, measuredHeight)}
            className="absolute bottom-1 right-1 z-30 h-6 w-6 rounded-lg bg-primary text-primary-foreground shadow-md flex items-center justify-center cursor-nwse-resize opacity-85 hover:opacity-100 hover:scale-105 transition-all"
            title="Sürükleyerek genişlik ve yükseklik ayarla"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path
                d="M10 4L4 10M10 8L8 10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
