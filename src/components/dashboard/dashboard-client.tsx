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
import { GripVertical, X, Plus, RotateCcw, Maximize2, LayoutList, LayoutGrid, MousePointer2, Eraser, History, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./dashboard-context";

interface WidgetConfig {
    id: string;
    cols: number;
    rows: number;
    settings?: Record<string, any>;
}

interface DashboardClientProps {
    initialLayout: WidgetConfig[] | string[];
    widgets: Record<string, React.ReactNode>;
    widgetLabels?: Record<string, string>;
}

export function DashboardClient({ initialLayout, widgets, widgetLabels = {} }: DashboardClientProps) {
    const { isEditMode, setIsEditMode, saveLayout, isPending, hasChanges, setHasChanges } = useDashboard();
    const [items, setItems] = useState<WidgetConfig[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const prevEditMode = useRef(isEditMode);

    // BONE STRUCTURE (KEMİK YAPI) - Optimized default layout
    const DEFAULT_SYSTEM_LAYOUT: WidgetConfig[] = [
        // Top Stats Row
        { id: "stat_sales", cols: 1, rows: 1 },
        { id: "stat_income", cols: 1, rows: 1 },
        { id: "stat_collections", cols: 1, rows: 1 },
        { id: "stat_ready", cols: 1, rows: 1 },
        // Mid-Section (Analysis & Main Lists)
        { id: "revenue", cols: 4, rows: 4 },
        { id: "ai_insights", cols: 2, rows: 4 },
        { id: "service_queue", cols: 2, rows: 5 },
        { id: "receivables", cols: 2, rows: 5 },
        { id: "activity", cols: 2, rows: 5 },
        // Bottom Section
        { id: "transactions", cols: 3, rows: 5 },
        { id: "inventory", cols: 3, rows: 5 },
        // Other Stats
        { id: "stat_pending", cols: 1, rows: 1 },
        { id: "stat_stock", cols: 1, rows: 1 },
        { id: "stat_debts", cols: 1, rows: 1 },
        { id: "stat_accounts", cols: 1, rows: 1 },
    ].filter(w => widgets[w.id]);

    const normalize = (layout: (WidgetConfig | string)[]): WidgetConfig[] => {
        return layout.map(idOrConfig => {
            if (typeof idOrConfig === 'string') {
                const def = DEFAULT_SYSTEM_LAYOUT.find(d => d.id === idOrConfig);
                return def || { id: idOrConfig, cols: 2, rows: 2 };
            }
            return idOrConfig;
        }).filter(item => widgets[item.id]);
    };

    useEffect(() => {
        setItems(normalize(initialLayout));
    }, [initialLayout]);

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

    const allWidgetIds = useMemo(() => Object.keys(widgets), [widgets]);
    const hiddenItems = useMemo(() =>
        allWidgetIds.filter(id => !items.find(item => item.id === id)),
        [allWidgetIds, items]
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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
        setItems([...items, { id, cols: 1, rows: 1 }]);
        setHasChanges(true);
    };

    const updateSize = (id: string, cols: number, rows: number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, cols, rows } : item));
        setHasChanges(true);
    };

    const handleToggleSetting = (id: string, key: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, settings: { ...item.settings, [key]: value } };
            }
            return item;
        }));
        setHasChanges(true);
    };

    const handleRevert = () => {
        setItems(normalize(initialLayout));
        setHasChanges(false);
        toast.success("Değişiklikler geri alındı");
    };

    const handleResetToDefault = () => {
        if (window.confirm("Paneli varsayılan (kemik) düzene sıfırlamak istediğinize emin misiniz?")) {
            setItems(DEFAULT_SYSTEM_LAYOUT);
            setHasChanges(true);
            toast.info("Varsayılan düzene dönüldü. Kaydetmek için 'Değişiklikleri Kaydet' butonuna basınız.");
        }
    };

    const displayLabels: Record<string, string> = {
        stats: "İstatistik Paneli",
        revenue: "Gelir Analizi",
        service_status: "Servis Durumu",
        ai_insights: "AI Sihirbazı Öngörüleri",
        activity: "Canlı Akış",
        transactions: "Son İşlemler",
        service_queue: "Servis Kuyruğu",
        inventory: "Trend Ürünler",
        receivables: "Alacaklarım",
        ...widgetLabels
    };

    return (
        <div className="flex flex-col gap-8 pb-32">
            {isEditMode && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-500 bg-muted/30 p-6 rounded-[2.5rem] border border-border/40 font-sans shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2">Bileşen Kitaplığı</span>
                            <p className="text-[9px] text-muted-foreground/60 px-2">Panelinize yeni öğeler ekleyin veya düzeni yönetin</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleRevert} className="h-9 rounded-full bg-card/50 text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500/10 hover:text-orange-600 transition-all border-orange-500/10">
                                <History className="h-3.5 w-3.5 mr-2" />
                                Değişiklikleri Geri Al
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleResetToDefault} className="h-9 rounded-full bg-card/50 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500/10 hover:text-rose-600 transition-all border-rose-500/10">
                                <Eraser className="h-3.5 w-3.5 mr-2" />
                                Varsayılan Düzen
                            </Button>
                        </div>
                    </div>
                    {hiddenItems.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {hiddenItems.map((id) => (
                                <Button key={id} variant="outline" size="sm" onClick={() => handleAdd(id)} className="h-10 px-6 rounded-2xl border-dashed bg-card text-[11px] font-bold uppercase tracking-wider hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-sans shadow-sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {displayLabels[id] || id}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[10px] text-muted-foreground/40 italic px-2 mt-2 font-medium">Tüm bileşenler panelde aktif.</div>
                    )}
                </div>
            )}

            <style jsx global>{`
                .dashboard-list-view .grid { display: flex !important; flex-direction: column !important; gap: 0 !important; width: 100% !important; }
                .dashboard-list-view .group { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; padding: 14px 20px !important; background: transparent !important; border: none !important; border-bottom: 1px solid hsl(var(--border) / 0.1) !important; border-radius: 0 !important; gap: 24px !important; width: 100% !important; min-height: 70px !important; }
                .dashboard-list-view .group:hover { background: hsl(var(--primary) / 0.04) !important; }
                .dashboard-list-view .aspect-square { width: 40px !important; height: 40px !important; flex-shrink: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 12px !important; background: hsl(var(--muted)/0.2) !important; border: 1px solid hsl(var(--border)/0.2) !important; }
                .dashboard-list-view .aspect-square svg { width: 20px !important; height: 20px !important; color: hsl(var(--muted-foreground)/0.5) !important; }
                .dashboard-list-view .aspect-square .absolute { display: none !important; }
                .dashboard-list-view .space-y-4 { flex: 1 !important; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 20px !important; margin: 0 !important; }
                .dashboard-list-view .min-h-\\[44px\\] { min-height: 0 !important; display: flex !important; flex-direction: column !important; flex: 1 !important; }
                .dashboard-list-view .space-y-4 h4 { font-size: 14px !important; font-weight: 700 !important; margin: 0 !important; }
                .dashboard-list-view .space-y-4 p { display: none !important; }
                .dashboard-list-view .pt-2 { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 40px !important; padding: 0 !important; border: none !important; }
                .dashboard-list-view .pt-2 .text-xl { font-size: 15px !important; font-weight: 800 !important; color: hsl(var(--primary)) !important; min-width: 90px !important; text-align: right !important; }
                .dashboard-list-view .pt-2 .text-\\[8px\\] { display: none !important; }
                .dashboard-list-view .text-right .text-xs { font-size: 12px !important; font-weight: 700 !important; color: hsl(var(--muted-foreground)) !important; background: hsl(var(--muted)/0.3) !important; padding: 4px 10px !important; border-radius: 8px !important; }

                .widget-container { align-self: stretch !important; height: auto !important; position: relative !important; }
                .widget-stat { height: auto !important; min-height: 140px !important; align-self: stretch !important; position: relative !important; }
                
                .resize-handle {
                    position: absolute !important;
                    bottom: -5px !important;
                    right: -5px !important;
                    width: 32px !important;
                    height: 32px !important;
                    cursor: nwse-resize !important;
                    z-index: 100 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: hsl(var(--primary)) !important;
                    color: white !important;
                    border-radius: 10px !important;
                    box-shadow: 0 4px 12px hsl(var(--primary) / 0.4) !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    opacity: 0;
                    transform: scale(0.5);
                }
                .group:hover .resize-handle { opacity: 1; transform: scale(1); }
                .resize-handle:active { transform: scale(0.9); background: black !important; }
                .resize-handle svg { width: 16px; height: 16px; }

                .resizing { z-index: 200 !important; }
                .resizing > div { ring: 2px solid hsl(var(--primary)) !important; opacity: 1 !important; transform: scale(1.02) !important; }

                .dashboard-grid {
                    display: grid !important;
                    grid-auto-flow: dense !important;
                    grid-auto-rows: minmax(100px, auto) !important;
                }

                .row-span-1 { grid-row: span 1 !important; }
                .row-span-2 { grid-row: span 2 !important; }
                .row-span-3 { grid-row: span 3 !important; }
                .row-span-4 { grid-row: span 4 !important; }
                .row-span-5 { grid-row: span 5 !important; }
                .row-span-6 { grid-row: span 6 !important; }
                .row-span-7 { grid-row: span 7 !important; }
                .row-span-8 { grid-row: span 8 !important; }
                .row-span-9 { grid-row: span 9 !important; }
                .row-span-10 { grid-row: span 10 !important; }
                .row-span-11 { grid-row: span 11 !important; }
                .row-span-12 { grid-row: span 12 !important; }
                .row-span-13 { grid-row: span 13 !important; }
                .row-span-14 { grid-row: span 14 !important; }
                .row-span-15 { grid-row: span 15 !important; }
                .row-span-16 { grid-row: span 16 !important; }
                .row-span-17 { grid-row: span 17 !important; }
                .row-span-18 { grid-row: span 18 !important; }
                .row-span-19 { grid-row: span 19 !important; }
                .row-span-20 { grid-row: span 20 !important; }
            `}</style>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                    <div className={cn(
                        "dashboard-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500",
                        isEditMode && "ring-8 ring-primary/5 rounded-[4rem] p-8 -m-8 bg-muted/10"
                    )}>
                        {items.map((item) => (
                            <SortableItem key={item.id} id={item.id} cols={item.cols} rows={item.rows} isEditMode={isEditMode} onRemove={() => handleRemove(item.id)} onResize={(newCols: number, newRows: number) => updateSize(item.id, newCols, newRows)} widgetSettings={item.settings} showViewToggle={item.id === 'inventory'} onToggleView={(mode: string) => handleToggleSetting(item.id, 'viewMode', mode)} isStat={item.id.startsWith('stat_')}>
                                {widgets[item.id]}
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className={cn("rounded-[2rem] shadow-2xl ring-4 ring-primary bg-background/95 backdrop-blur-xl border border-primary/20 p-6 overflow-hidden transform scale-[1.05]", items.find(i => i.id === activeId)?.cols === 4 ? "w-[800px]" : "w-80")}>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center"><MousePointer2 className="h-4 w-4 text-primary" /></div>
                                <span className="font-bold text-xs uppercase tracking-tighter text-primary">{displayLabels[activeId] || activeId}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {isEditMode && hasChanges && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <Button
                        size="lg"
                        onClick={async () => {
                            await handleSave();
                            setIsEditMode(false);
                        }}
                        disabled={isPending}
                        className="h-16 px-10 rounded-[2rem] bg-emerald-500 text-white shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-widest flex items-center gap-4 group/finish border-4 border-white/20"
                    >
                        {isPending ? <RotateCcw className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 group-hover/finish:scale-125 transition-all" />}
                        DEĞİŞİKLİKLERİ KAYDET VE BİTİR
                    </Button>
                </div>
            )}
        </div>
    );
}

function SortableItem({ id, children, cols, rows, isEditMode, onRemove, onResize, widgetSettings, showViewToggle, onToggleView, isStat }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });
    const [isResizing, setIsResizing] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);

    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined };
    const colClass = cols === 4 ? "lg:col-span-4 md:col-span-2" :
        cols === 3 ? "lg:col-span-3 md:col-span-2" :
            cols === 2 ? "lg:col-span-2 md:col-span-2" : "col-span-1";

    const rowClass = `row-span-${rows || 1}`;

    const handleResizeStart = (e: React.MouseEvent, corner: 'br' | 'bl' | 'tr' | 'tl') => {
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
        const colWidth = containerRect.width / 4;
        const rowHeight = 110;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const currentY = moveEvent.clientY;
            let diffX = currentX - startX;
            let diffY = currentY - startY;

            // Reverse diff for top/left corners
            if (corner.includes('l')) diffX = -diffX;
            if (corner.includes('t')) diffY = -diffY;

            const colDiff = Math.round(diffX / colWidth);
            const rowDiff = Math.round(diffY / rowHeight);
            const nextCols = Math.max(1, Math.min(4, initialCols + colDiff));
            const nextRows = Math.max(1, Math.min(20, initialRows + rowDiff));

            if (nextCols !== cols || nextRows !== rows) {
                onResize(nextCols, nextRows);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <div ref={(node) => { setNodeRef(node); (itemRef.current as any) = node; }} style={style}
            className={cn("relative rounded-xl transition-all group", isDragging && "opacity-0 invisible", colClass, rowClass, isStat ? "widget-stat" : "widget-container", isResizing && "resizing")}>
            {isEditMode && (
                <div className="absolute inset-0 z-[60] pointer-events-none opacity-100">
                    {/* 4 Corners Resize Handles */}
                    <div className="absolute top-0 left-0 w-8 h-8 cursor-nw-resize pointer-events-auto flex items-center justify-center -translate-x-1/2 -translate-y-1/2 bg-primary text-white rounded-lg scale-75 hover:scale-110 transition-transform shadow-lg active:scale-95" onMouseDown={(e) => handleResizeStart(e, 'tl')}>
                        <Maximize2 className="h-4 w-4 rotate-90" />
                    </div>
                    <div className="absolute top-0 right-0 w-8 h-8 cursor-ne-resize pointer-events-auto flex items-center justify-center translate-x-1/2 -translate-y-1/2 bg-primary text-white rounded-lg scale-75 hover:scale-110 transition-transform shadow-lg active:scale-95" onMouseDown={(e) => handleResizeStart(e, 'tr')}>
                        <Maximize2 className="h-4 w-4" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 cursor-sw-resize pointer-events-auto flex items-center justify-center -translate-x-1/2 translate-y-1/2 bg-primary text-white rounded-lg scale-75 hover:scale-110 transition-transform shadow-lg active:scale-95" onMouseDown={(e) => handleResizeStart(e, 'bl')}>
                        <Maximize2 className="h-4 w-4" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize pointer-events-auto flex items-center justify-center translate-x-1/2 translate-y-1/2 bg-primary text-white rounded-lg scale-75 hover:scale-110 transition-transform shadow-lg active:scale-95" onMouseDown={(e) => handleResizeStart(e, 'br')}>
                        <Maximize2 className="h-4 w-4 rotate-90" />
                    </div>

                    {/* Top Control Bar */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 animate-in zoom-in duration-300 pointer-events-auto">
                        <div className="bg-background/95 backdrop-blur-md flex items-center gap-1 p-1 rounded-xl border border-border/40 shadow-2xl">
                            {showViewToggle && (
                                <div className="flex items-center rounded-lg overflow-hidden border border-border/20 bg-muted/10 mr-1">
                                    <button onClick={() => onToggleView?.('grid')} className={cn("p-1.5 transition-all", (widgetSettings?.viewMode !== 'list') ? "bg-primary text-primary-foreground rounded-lg" : "hover:bg-muted text-muted-foreground")}>
                                        <LayoutGrid className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => onToggleView?.('list')} className={cn("p-1.5 transition-all", (widgetSettings?.viewMode === 'list') ? "bg-primary text-primary-foreground rounded-lg" : "hover:bg-muted text-muted-foreground")}>
                                        <LayoutList className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing bg-card p-1.5 rounded-lg border border-border/40 hover:text-primary transition-all shadow-sm">
                                <GripVertical className="h-3 w-3" />
                            </div>
                            <button onClick={onRemove} className="bg-card p-1.5 rounded-lg border border-border/40 hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={cn("h-full transition-all", isEditMode && "pointer-events-none opacity-80 scale-[0.98] ring-1 ring-primary/20 bg-primary/5 rounded-3xl overflow-hidden shadow-inner", widgetSettings?.viewMode === 'list' && "dashboard-list-view")}>
                {children}
            </div>
            {isEditMode && <div className="absolute inset-0 z-10 bg-transparent cursor-default" />}
        </div>
    );
}
