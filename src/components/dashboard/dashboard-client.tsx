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
        setItems([...items, { id, cols: 8, rows: 2 }]);
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

    return (
        <div className="flex flex-col gap-8 pb-32">
            <style jsx global>{`
                .dashboard-grid {
                    display: grid !important;
                    grid-template-columns: repeat(24, minmax(0, 1fr)) !important;
                    grid-auto-rows: 160px !important;
                    grid-auto-flow: dense !important;
                    gap: 1.5rem !important;
                }

                .resize-ghost {
                  position: absolute !important;
                  inset: 0 !important;
                  background: hsl(var(--primary) / 0.1) !important;
                  border: 3px dashed hsl(var(--primary)) !important;
                  border-radius: 2.5rem !important;
                  pointer-events: none !important;
                  z-index: 100 !important;
                  transform-origin: top left !important;
                }
            `}</style>

            {isEditMode && (
                <div className="flex flex-col gap-4 bg-muted/20 p-8 rounded-[3rem] border border-border/40 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Tasarım Modu</h3>
                            <p className="text-[10px] text-muted-foreground/60">Widgetları sürükle, bırak ve köşelerinden çekerek istediğin boyuta getir.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setItems(normalize(initialLayout))} className="rounded-full h-10 border-orange-500/20 hover:bg-orange-500/10 text-orange-600 font-bold uppercase text-[10px] tracking-widest px-6 shadow-sm">
                                <History className="h-4 w-4 mr-2" /> Geri Al
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setItems(defaultSystemLayout.map(item => ({ ...item }))); setHasChanges(true); }} className="rounded-full h-10 border-rose-500/20 hover:bg-rose-500/10 text-rose-600 font-bold uppercase text-[10px] tracking-widest px-6 shadow-sm">
                                <RotateCcw className="h-4 w-4 mr-2" /> Varsayılan
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                        {Object.keys(widgets).filter(id => !items.find(i => i.id === id)).map(id => (
                            <Button key={id} variant="outline" onClick={() => handleAdd(id)} className="bg-background rounded-2xl h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group p-1 pr-6 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/20"><Plus className="h-5 w-5" /></div>
                                <span className="text-xs font-bold uppercase tracking-tighter">{displayLabels[id] || id}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                    <div className={cn(
                        "dashboard-grid px-2 transition-all duration-700",
                        isEditMode && "ring-[20px] ring-primary/5 rounded-[5rem] p-12 -m-10 bg-primary/2 backdrop-blur-3xl shadow-inner border border-primary/10"
                    )}>
                        {items.map((item) => (
                            <SortableItem key={item.id} id={item.id} cols={item.cols} rows={item.rows} isEditMode={isEditMode} onRemove={() => handleRemove(item.id)} onResize={(c: number, r: number) => updateSize(item.id, c, r)} widgetSettings={item.settings} onToggleView={(m: string) => handleToggleSetting(item.id, 'viewMode', m)}>
                                {React.isValidElement(widgets[item.id])
                                    ? React.cloneElement(widgets[item.id] as any, {
                                        viewMode: item.settings?.viewMode || 'grid',
                                        shopId,
                                        cols: item.cols,
                                        rows: item.rows
                                    })
                                    : widgets[item.id]}
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className="rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-4 ring-primary bg-background/95 backdrop-blur-2xl p-8 border-2 border-primary/20 scale-[1.02] opacity-90 w-[400px]">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg"><MousePointer2 className="h-6 w-6 text-primary" /></div>
                                <div className="flex flex-col">
                                    <span className="font-black text-xs uppercase tracking-[0.2em] text-primary">{displayLabels[activeId] || activeId}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">Taşınıyor...</span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {isEditMode && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-in slide-in-from-bottom-10 duration-700">
                    <Button size="lg" onClick={async () => { if (hasChanges) await handleSave(); setIsEditMode(false); }} disabled={isPending} className={cn("h-20 px-12 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-[0.3em] flex items-center gap-6 group border-4 border-white/20", hasChanges ? "bg-emerald-500 text-white" : "bg-black text-white")}>
                        {isPending ? <RotateCcw className="h-8 w-8 animate-spin" /> : hasChanges ? <Save className="h-8 w-8" /> : <Check className="h-8 w-8" />}
                        {hasChanges ? "PANEL TASARIMINI KAYDET" : "DÜZENLEMEYİ TAMAMLA"}
                    </Button>
                </div>
            )}
        </div>
    );
}

function SortableItem({ id, children, cols, rows, isEditMode, onRemove, onResize, widgetSettings, onToggleView }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });
    const [isResizing, setIsResizing] = useState(false);
    const [previewSize, setPreviewSize] = useState<{ cols: number, rows: number } | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : isResizing ? 500 : 1,
        gridColumn: `span ${cols || 1} / span ${cols || 1}`,
        gridRow: `span ${rows || 1} / span ${rows || 1}`,
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
        const rowHeight = 160 + 24;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const colDiff = Math.round((moveEvent.clientX - startX) / colWidth);
            const rowDiff = Math.round((moveEvent.clientY - startY) / rowHeight);
            setPreviewSize({
                cols: Math.max(1, Math.min(24, initialCols + colDiff)),
                rows: Math.max(1, Math.min(40, initialRows + rowDiff)) // Max rows increased to 40
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
        <div ref={(node) => { setNodeRef(node); (itemRef.current as any) = node; }} style={style} className={cn("relative rounded-[2.5rem] transition-all group", isDragging && "opacity-0 invisible", isResizing && "resizing z-50 shadow-2xl ring-4 ring-primary/20 bg-background/50")}>
            {isResizing && previewSize && (
                <div className="absolute inset-0 z-10 rounded-[2.5rem] border-2 border-dashed border-primary bg-primary/5 pointer-events-none"
                    style={{
                        width: `${(previewSize.cols / (cols || 1)) * 100}%`,
                        height: `${(previewSize.rows / (rows || 1)) * 100}%`,
                        minWidth: '50px',
                        minHeight: '50px'
                    }}
                />
            )}
            {/* View Toggle Support (Visible on hover in both modes) */}
            {id === 'inventory' && (
                <div className={cn(
                    "absolute -top-4 right-8 z-[70] transition-all duration-300 pointer-events-auto",
                    isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:-top-6"
                )}>
                    <div className="bg-background shadow-[0_15px_30px_rgba(0,0,0,0.1)] flex items-center gap-1 p-1.5 rounded-2xl border border-border/40 backdrop-blur-xl scale-90 origin-bottom right-0">
                        <button onClick={() => onToggleView?.('grid')} className={cn("p-2 rounded-xl transition-all", (widgetSettings?.viewMode !== 'list') ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
                        <button onClick={() => onToggleView?.('list')} className={cn("p-2 rounded-xl transition-all", (widgetSettings?.viewMode === 'list') ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><LayoutList className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            {isEditMode && (
                <div className="absolute inset-0 z-[60] pointer-events-none">
                    <div className="absolute bottom-0 right-0 w-12 h-12 cursor-nwse-resize pointer-events-auto flex items-center justify-center translate-x-1/2 translate-y-1/2 bg-primary text-white rounded-2xl shadow-2xl hover:scale-125 transition-all group-hover:bg-black active:scale-95" onMouseDown={handleResizeStart}>
                        <Maximize2 className="h-6 w-6" />
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-in zoom-in duration-300 pointer-events-auto">
                        <div className="bg-background shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-2 p-2 rounded-2xl border border-border/40 backdrop-blur-xl">
                            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing bg-card p-2 rounded-xl border border-border/40 hover:text-primary transition-all shadow-sm"><GripVertical className="h-4 w-4" /></div>
                            <button onClick={onRemove} className="bg-card p-2 rounded-xl border border-border/40 hover:bg-destructive hover:text-white transition-all shadow-sm"><X className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-primary px-3 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest">{cols}x{rows}</span>
                    </div>
                </div>
            )}
            <div className={cn("h-full w-full transition-all duration-500", isEditMode && "pointer-events-none opacity-40 blur-[2px] scale-[0.98] ring-4 ring-primary/10 rounded-[2.5rem] overflow-hidden bg-primary/5 shadow-inner")}>
                {children}
            </div>
        </div>
    );
}
