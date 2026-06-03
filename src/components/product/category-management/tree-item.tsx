"use client";

import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, FolderOpen, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryNode } from "./types";

interface CategoryItemProps {
    node: CategoryNode;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    stats: { totalStock: number };
    onSelect: (id: string) => void;
    onToggle: (id: string, e: React.MouseEvent) => void;
    activeId: string | null;
    isMobile?: boolean;
}

export function TreeItem({ node, level, isSelected, isExpanded, hasChildren, stats, onSelect, onToggle, activeId }: CategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        over
    } = useSortable({
        id: node.id,
        data: {
            type: 'category',
            parentId: node.parentId
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        marginLeft: `${level * 20}px`,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    const isOver = over?.id === node.id;

    return (
        <div ref={setNodeRef} style={style} className="w-full mb-1 group/item">
            <div
                onClick={() => onSelect(node.id)}
                className={cn(
                    "flex items-center justify-between py-2.5 px-4 rounded-xl border border-transparent select-none transition-all cursor-pointer",
                    isSelected
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white border-zinc-200/50 dark:border-white/[0.02]",
                    isOver && !isDragging && "border-emerald-500/50 bg-emerald-500/10 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                    isDragging && "border-indigo-500/50 bg-indigo-500/20"
                )}
            >
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={e => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground/80" />
                    </div>

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) onToggle(node.id, e);
                        }}
                        className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-lg transition-all",
                            hasChildren ? "cursor-pointer hover:bg-zinc-200 dark:hover:bg-white/10" : "opacity-0 invisible"
                        )}
                    >
                        <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground/80 transition-transform duration-200",
                            isExpanded && "rotate-90 text-indigo-500 dark:text-indigo-400"
                        )} />
                    </div>

                    <div className="relative">
                        {hasChildren && isExpanded ? (
                            <FolderOpen className={cn("h-5 w-5 shrink-0 transition-colors", isSelected ? "text-indigo-400" : "text-blue-400")} />
                        ) : (
                            <Folder className={cn("h-5 w-5 shrink-0 transition-colors", isSelected ? "text-indigo-400" : "text-muted-foreground/80")} />
                        )}
                        {hasChildren && !isExpanded && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-black animate-pulse" />
                        )}
                    </div>

                    <span className={cn(
                        "text-[13.5px] truncate tracking-tight transition-all",
                        isSelected ? "" : "font-medium"
                    )}>
                        {node.name}
                    </span>
                </div>

                <div className="flex items-center gap-3 opacity-60 group-hover/item:opacity-100 transition-opacity">
                    <div className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px]  tracking-wider border transition-all",
                        isSelected
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300"
                            : "bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-border text-muted-foreground/80"
                    )}>
                        {stats.totalStock}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RootDropZone() {
    const { setNodeRef, isOver } = useDroppable({
        id: 'null',
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-full h-14 border border-dashed rounded-2xl flex items-center justify-center transition-all duration-300",
                isOver
                    ? "bg-emerald-500/20 border-emerald-500/50 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-border hover:border-indigo-500/30"
            )}
        >
            <span className={cn(
                "text-[11px]  uppercase tracking-[0.2em] transition-colors font-medium",
                isOver ? "text-emerald-500" : "text-muted-foreground/40"
            )}>
                Ana Dizine Taşı
            </span>
        </div>
    );
}
