"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortOrder } from "@/hooks/use-table-sort";

interface SortableHeaderProps {
    label: string;
    field: string;
    sortField: string | null;
    sortOrder: SortOrder;
    onSort: (field: any) => void;
    className?: string;
    align?: "left" | "center" | "right";
}

export function SortableHeader({
    label,
    field,
    sortField,
    sortOrder,
    onSort,
    className,
    align = "left",
}: SortableHeaderProps) {
    const isActive = sortField === field;

    return (
        <div
            className={cn(
                "flex items-center gap-2 cursor-pointer select-none group transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/80 hover:text-foreground",
                align === "center" && "justify-center",
                align === "right" && "justify-end",
                className
            )}
            onClick={() => onSort(field)}
        >
            <span className="uppercase tracking-widest">{label}</span>
            <div className="flex flex-col">
                {isActive ? (
                    sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3 text-primary animate-in fade-in zoom-in duration-300" />
                    ) : (
                        <ChevronDown className="h-3 w-3 text-primary animate-in fade-in zoom-in duration-300" />
                    )
                ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </div>
    );
}



