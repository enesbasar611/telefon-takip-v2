"use client";

import React, { useState, useTransition, useMemo, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GripVertical, X, Plus, RotateCcw, Maximize2, LayoutList, LayoutGrid, MousePointer2, History, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./dashboard-context";
import {
    DashboardWidgetConfig,
    getSystemDashboardLayout,
    isCollapsedDashboardLayout,
    normalizeDashboardLayout,
} from "@/lib/dashboard-layout";

interface DashboardClientProps {
    initialLayout: DashboardWidgetConfig[] | string[];
    initialData?: unknown;
    widgets: Record<string, React.ReactNode>;
    widgetLabels?: Record<string, string>;
    shopId: string;
}

export function DashboardClient({ initialLayout, widgets, widgetLabels = {}, shopId }: DashboardClientProps) {
    const { isEditMode, setIsEditMode, saveLayout, isPending, hasChanges, setHasChanges } = useDashboard();
    const [emptyWidgets, setEmptyWidgets] = useState<Record<string, boolean>>({});
    const availableWidgetIds = useMemo(() => Object.keys(widgets), [widgets]);
    const defaultSystemLayout = useMemo(
        () => getSystemDashboardLayout(availableWidgetIds),
        [availableWidgetIds]
    );
    const [items, setItems] = useState<DashboardWidgetConfig[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const prevEditMode = useRef(isEditMode);

    const normalize = (layout: (DashboardWidgetConfig | string)[]): DashboardWidgetConfig[] => {
        if (isCollapsedDashboardLayout(layout)) {
            return defaultSystemLayout.map(item => ({ ...item }));
        }

        return normalizeDashboardLayout(layout, availableWidgetIds, defaultSystemLayout);
    };

    useEffect(() => {
        setItems(normalize(initialLayout));
    }, [initialLayout, defaultSystemLayout, availableWidgetIds]);

    const handleSave = async (silent = false) => {
        if (!hasChanges) return;
        await saveLayout(items, silent);
    };

    useEffect(() => {
        if (prevEditMode.current === true && isEditMode === false && hasChanges) {
            handleSave(true);
        }
        prevEditMode.current = isEditMode;
    }, [isEditMode, hasChanges]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragStart(event: DragStartEvent) {
        if (!isEditMode) return;
        setActiveId(event.active.id as string);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        if (!isEditMode) return;
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            setHasChanges(true);
        }
    };

    const handleRemove = (id: string) => {
        setItems(items.filter(item => item.id !== id));
        setHasChanges(true);
    };

    const handleAdd = (id: string) => {
        // Default size update: More compact defaults
        const defaultConfig = defaultSystemLayout.find(d => d.id === id) || { cols: 8, rows: 2 };
        setItems([...items, { ...defaultConfig, id }]);
        setHasChanges(true);
    };

    const updateSize = (id: string, cols: number, rows: number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, cols, rows } : item));
        setHasChanges(true);
    };

    const handleToggleSetting = async (id: string, key: string, value: any) => {
        const newItems = items.map(item => item.id === id ? { ...item, settings: { ...item.settings, [key]: value } } : item);
        setItems(newItems);
        setHasChanges(true);

        // Auto-save when toggling view mode if not in edit mode
        if (!isEditMode) {
            try {
                await saveLayout(newItems, true);
            } catch (err) {
                console.error("Auto-save setting failed", err);
            }
        }
    };

    const handleDataStatus = (id: string, isEmpty: boolean) => {
        setEmptyWidgets(prev => {
            if (prev[id] === isEmpty) return prev;
            return { ...prev, [id]: isEmpty };
        });
    };

    const displayLabels: Record<string, string> = {
        revenue: "Gelir Analizi",
        service_status: "Servis Durumu",
        ai_insights: "Yapay Zeka Öngörüleri",
        shortage_status: "Eksik Ürünler",
        receivables: "Bekleyen Tahsilatlar",
        activity: "Canlı Aktivite",
        transactions: "Son İşlemler",
        service_queue: "Servis Kuyruğu",
        inventory: "Trend Ürünler",
        ...widgetLabels
    };

    // Tighter grid for better density
    const gridStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
        gridAutoRows: "minmax(140px, auto)", // Slightly smaller base row, allow expansion
        gridAutoFlow: "dense",
        gap: "1.25rem", // Reduced gap
    };

    return (
        <div className="flex flex-col gap-6 pb-24">
            {isEditMode && (
                <div className="flex flex-col gap-4 bg-muted/10 p-6 rounded-[2.5rem] border border-border/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">Tasarım Modu</h3>
                            <p className="text-[10px] text-muted-foreground/50">Widgetları sürükle, bırak ve boyutlandır. Verisiz kartlar normal modda otomatik küçülür.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setItems(normalize(initialLayout))} className="rounded-2xl h-9 border-orange-500/10 hover:bg-orange-500/5 text-orange-600/80 font-black uppercase text-[9px] tracking-widest px-5 shadow-sm">
                                <History className="h-3.5 w-3.5 mr-2" /> Geri Al
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setItems(defaultSystemLayout.map(item => ({ ...item }))); setHasChanges(true); }} className="rounded-2xl h-9 border-rose-500/10 hover:bg-rose-500/5 text-rose-600/80 font-black uppercase text-[9px] tracking-widest px-5 shadow-sm">
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Varsayılan
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                        {Object.keys(widgets).filter(id => !items.find(i => i.id === id)).map(id => (
                            <Button key={id} variant="outline" onClick={() => handleAdd(id)} className="bg-background/50 rounded-xl h-10 border-dashed border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group p-1 pr-4 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-primary/10"><Plus className="h-4 w-4" /></div>
                                <span className="text-[10px] font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">{displayLabels[id] || id}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                    <div
                        style={gridStyle}
                        className={cn(
                            "px-1 transition-all duration-500",
                            isEditMode && "ring-[10px] ring-primary/5 rounded-[4rem] p-8 -m-8 bg-primary/2 backdrop-blur-md shadow-inner border border-primary/10"
                        )}
                    >
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                cols={item.cols}
                                rows={item.rows}
                                isEditMode={isEditMode}
                                isEmpty={emptyWidgets[item.id]}
                                onRemove={() => handleRemove(item.id)}
                                onResize={(c: number, r: number) => updateSize(item.id, c, r)}
                                widgetSettings={item.settings}
                                onToggleView={(m: string) => handleToggleSetting(item.id, 'viewMode', m)}
                            >
                                {React.isValidElement(widgets[item.id])
                                    ? React.cloneElement(widgets[item.id] as any, {
                                        viewMode: item.settings?.viewMode || 'grid',
                                        shopId,
                                        cols: item.cols,
                                        rows: item.rows,
                                        onDataStatus: (isEmpty: boolean) => handleDataStatus(item.id, isEmpty)
                                    })
                                    : widgets[item.id]}
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className="rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] ring-2 ring-primary bg-background/95 backdrop-blur-3xl p-6 border border-primary/30 scale-[1.02] opacity-90 w-[320px]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner"><MousePointer2 className="h-5 w-5 text-primary" /></div>
                                <div className="flex flex-col">
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">{displayLabels[activeId] || activeId}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-black opacity-40">Yerleştiriliyor...</span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {isEditMode && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-in slide-in-from-bottom-10 duration-700">
                    <Button size="lg" onClick={async () => { if (hasChanges) await handleSave(); setIsEditMode(false); }} disabled={isPending} className={cn("h-16 px-10 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 group border-2 border-white/10", hasChanges ? "bg-emerald-500 text-white" : "bg-zinc-950 text-white")}>
                        {isPending ? <RotateCcw className="h-6 w-6 animate-spin" /> : hasChanges ? <Save className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                        {hasChanges ? "TASARIMI KAYDET" : "DÜZENLEMEYİ BİTİR"}
                    </Button>
                </div>
            )}
        </div>
    );
}

function SortableItem({ id, children, cols, rows, isEditMode, onRemove, onResize, widgetSettings, onToggleView, isEmpty }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });
    const [isResizing, setIsResizing] = useState(false);
    const [previewSize, setPreviewSize] = useState<{ cols: number, rows: number } | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    // Dynamic row calculation: if empty and not in edit mode, force height to 1 row
    const actualRows = (!isEditMode && isEmpty) ? 1 : (rows || 1);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : isResizing ? 500 : 1,
        gridColumn: `span ${cols || 1} / span ${cols || 1}`,
        gridRow: `span ${actualRows} / span ${actualRows}`,
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const initialCols = cols;
        const initialRows = rows || 1;
        const gridContainer = itemRef.current?.parentElement;
        if (!gridContainer) return;
        const containerRect = gridContainer.getBoundingClientRect();
        const colWidth = containerRect.width / 24;
        const rowHeight = 140 + 20; // Matches gridAutoRows + gap roughly

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const colDiff = Math.round((moveEvent.clientX - startX) / colWidth);
            const rowDiff = Math.round((moveEvent.clientY - startY) / rowHeight);
            setPreviewSize({
                cols: Math.max(1, Math.min(24, initialCols + colDiff)),
                rows: Math.max(1, Math.min(40, initialRows + rowDiff))
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setPreviewSize(prev => { if (prev) onResize(prev.cols, prev.rows); return null; });
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div ref={(node) => { setNodeRef(node); (itemRef.current as any) = node; }} style={style} className={cn("relative rounded-[2rem] transition-all group", isDragging && "opacity-0 invisible", isResizing && "resizing z-50 shadow-2xl ring-4 ring-primary/10 bg-background/40")}>
            {isResizing && previewSize && (
                <div className="absolute inset-0 z-10 rounded-[2rem] border-2 border-dashed border-primary/40 bg-primary/5 pointer-events-none"
                    style={{
                        width: `${(previewSize.cols / (cols || 1)) * 100}%`,
                        height: `${(previewSize.rows / (actualRows || 1)) * 100}%`,
                        minWidth: '40px',
                        minHeight: '40px'
                    }}
                />
            )}

            {/* View Toggle */}
            {id === 'inventory' && (
                <div className={cn(
                    "absolute -top-3 right-6 z-[70] transition-all duration-300 pointer-events-auto",
                    isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:-top-5"
                )}>
                    <div className="bg-card shadow-xl flex items-center gap-1 p-1 rounded-xl border border-border/40 backdrop-blur-2xl scale-[0.85] origin-bottom shadow-primary/5">
                        <button onClick={() => onToggleView?.('grid')} className={cn("p-1.5 rounded-lg transition-all", (widgetSettings?.viewMode !== 'list') ? "bg-primary text-black shadow-md" : "hover:bg-muted text-muted-foreground")}><LayoutGrid className="h-3.5 w-3.5" /></button>
                        <button onClick={() => onToggleView?.('list')} className={cn("p-1.5 rounded-lg transition-all", (widgetSettings?.viewMode === 'list') ? "bg-primary text-black shadow-md" : "hover:bg-muted text-muted-foreground")}><LayoutList className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
            )}

            {isEditMode && (
                <div className="absolute inset-0 z-[60] pointer-events-none">
                    <div className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize pointer-events-auto flex items-center justify-center translate-x-1/3 translate-y-1/3 bg-primary text-black rounded-lg shadow-xl hover:scale-110 transition-all active:scale-95" onMouseDown={handleResizeStart}>
                        <Maximize2 className="h-5 w-5" />
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 animate-in zoom-in duration-300 pointer-events-auto">
                        <div className="bg-card shadow-2xl flex items-center gap-1.5 p-1.5 rounded-xl border border-border/40 backdrop-blur-2xl shadow-primary/5">
                            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing bg-muted/30 p-1.5 rounded-lg border border-border/20 hover:text-primary transition-all"><GripVertical className="h-3.5 w-3.5" /></div>
                            <button onClick={onRemove} className="bg-muted/30 p-1.5 rounded-lg border border-border/20 hover:bg-destructive hover:text-white transition-all"><X className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                </div>
            )}
            <div className={cn("h-full w-full transition-all duration-300", isEditMode && "pointer-events-none opacity-40 blur-[1px] scale-[0.98] ring-2 ring-primary/10 rounded-[2rem] overflow-hidden bg-primary/2")}>
                {children}
            </div>
        </div>
    );
}
