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
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 sm:gap-4 px-0.5">
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg text-foreground tracking-tight">Müşteri Portföyü</h2>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground/80 font-medium">Aktif alacaklar ve cari hesap hareketleri</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64 md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                    <Input
                        placeholder="İsim veya telefon ara..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9 sm:h-9.5 bg-card/80 border-border/60 hover:border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-2xs"
                    />
                </div>

                {/* Filter and Mode Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 relative z-10 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                    <Select value={debtFilter} onValueChange={onDebtFilterChange}>
                        <SelectTrigger className="h-9 sm:h-9.5 w-[125px] sm:w-[135px] shrink-0 bg-card/80 border-border/60 hover:border-border rounded-xl text-[11px] font-bold tracking-tight shadow-2xs">
                            <SelectValue placeholder="Borç Durumu" />
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
                            <SelectItem value="all" className="text-xs">TÜMÜ</SelectItem>
                            <SelectItem value="hasDebt" className="text-xs">BORCU OLANLAR</SelectItem>
                            <SelectItem value="noDebt" className="text-xs">BORCU OLMAYANLAR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={onSortOrderChange}>
                        <SelectTrigger className="h-9 sm:h-9.5 w-[120px] sm:w-[130px] shrink-0 bg-card/80 border-border/60 hover:border-border rounded-xl text-[11px] font-bold tracking-tight shadow-2xs">
                            <SelectValue placeholder="Sıralama" />
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
                            <SelectItem value="newest" className="text-xs">YENİDEN ESKİYE</SelectItem>
                            <SelectItem value="oldest" className="text-xs">ESKİDEN YENİYE</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Quick Status Pills */}
                    <div className="flex bg-muted/40 p-0.5 rounded-xl border border-border/50 shrink-0">
                        {(['all', 'pending', 'overdue', 'tracking'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => onFilterStatusChange(s)}
                                className={cn(
                                    "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap",
                                    filterStatus === s
                                        ? "bg-card text-foreground shadow-2xs border border-border/40 font-extrabold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {s === 'all' ? 'Tümü' : s === 'pending' ? 'Bekleyen' : s === 'overdue' ? 'Geciken' : 'Takip'}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Switcher */}
                    <div className="hidden sm:flex bg-muted/40 p-0.5 rounded-xl border border-border/50 shrink-0">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'list'
                                    ? "bg-card text-foreground shadow-2xs border border-border/40"
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
                                    ? "bg-card text-foreground shadow-2xs border border-border/40"
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
