"use client";

import React from "react";
import { Search, List, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface VeresiyeToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    debtFilter: string;
    onDebtFilterChange: (value: string) => void;
    sortOrder: string;
    onSortOrderChange: (value: string) => void;
    filterStatus: 'all' | 'pending' | 'overdue' | 'tracking';
    onFilterStatusChange: (status: 'all' | 'pending' | 'overdue' | 'tracking') => void;
    viewMode: 'list' | 'grid';
    onViewModeChange: (mode: 'list' | 'grid') => void;
}

export const VeresiyeToolbar: React.FC<VeresiyeToolbarProps> = ({
    searchTerm,
    onSearchChange,
    debtFilter,
    onDebtFilterChange,
    sortOrder,
    onSortOrderChange,
    filterStatus,
    onFilterStatusChange,
    viewMode,
    onViewModeChange,
}) => {
    return (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6 px-1">
            <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg sm:text-xl xl:text-2xl text-foreground uppercase tracking-tight">Müşteri Portföyü</h2>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground/80 font-medium">Aktif alacaklar ve cari hesap hareketleri</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:flex-none md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                    <Input
                        placeholder="İsim veya telefon ara..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10 sm:h-11 bg-muted/40 border-border/70 rounded-xl text-xs sm:text-sm text-foreground focus-visible:ring-primary/20"
                    />
                </div>

                {/* Filter and Mode Controls */}
                <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                    <Select value={debtFilter} onValueChange={onDebtFilterChange}>
                        <SelectTrigger className="h-9 sm:h-10 w-[130px] sm:w-[145px] shrink-0 bg-muted/40 border-border/70 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Borç Durumu" />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                            <SelectItem value="all">TÜMÜ</SelectItem>
                            <SelectItem value="hasDebt">BORCU OLANLAR</SelectItem>
                            <SelectItem value="noDebt">BORCU OLMAYANLAR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={onSortOrderChange}>
                        <SelectTrigger className="h-9 sm:h-10 w-[125px] sm:w-[140px] shrink-0 bg-muted/40 border-border/70 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Sıralama" />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                            <SelectItem value="newest">YENİDEN ESKİYE</SelectItem>
                            <SelectItem value="oldest">ESKİDEN YENİYE</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Quick Status Pills */}
                    <div className="flex bg-muted/40 p-0.5 rounded-xl border border-border/60 shrink-0">
                        {(['all', 'pending', 'overdue', 'tracking'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => onFilterStatusChange(s)}
                                className={cn(
                                    "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-tight transition-all whitespace-nowrap",
                                    filterStatus === s
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {s === 'all' ? 'Tümü' : s === 'pending' ? 'Bekleyen' : s === 'overdue' ? 'Geciken' : 'Takip'}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Switcher */}
                    <div className="hidden sm:flex bg-muted/40 p-0.5 rounded-xl border border-border/60 shrink-0">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'list'
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Liste Görünümü"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'grid'
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Izgara Görünümü"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
