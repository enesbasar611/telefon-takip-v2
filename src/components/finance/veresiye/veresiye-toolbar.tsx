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
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 px-2">
            <div className="space-y-2">
                <h2 className="font-medium text-3xl text-foreground uppercase">Müşteri Portföyü</h2>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground/80 opacity-80 uppercase tracking-widest font-bold">Aktif alacaklar ve cari hareketler listesi</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto mt-2">
                <div className="relative group flex-1 md:flex-none md:w-80">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 group-focus-within:text-indigo-400 transition-colors z-20" />
                    <Input
                        placeholder="İsim veya telefon numarası..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-14 h-14 bg-muted/50 border-border shadow-2xl rounded-2xl focus-visible:ring-indigo-500/20 focus-visible:bg-muted transition-all text-sm text-foreground relative z-10"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <Select value={debtFilter} onValueChange={onDebtFilterChange}>
                        <SelectTrigger className="h-12 w-[160px] bg-muted/50 border-border rounded-xl text-xs font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Borç Filtresi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">TÜM MÜŞTERİLER</SelectItem>
                            <SelectItem value="hasDebt">BORCU OLANLAR</SelectItem>
                            <SelectItem value="noDebt">BORCU OLMAYANLAR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={onSortOrderChange}>
                        <SelectTrigger className="h-12 w-[160px] bg-muted/50 border-border rounded-xl text-xs font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Sıralama" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">YENİDEN ESKİYE</SelectItem>
                            <SelectItem value="oldest">ESKİDEN YENİYE</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                        {(['all', 'pending', 'overdue', 'tracking'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => onFilterStatusChange(s)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
                                    filterStatus === s
                                        ? "bg-background dark:bg-zinc-800 text-indigo-600 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {s === 'all' ? 'Tümü' : s === 'pending' ? 'Bekleyen' : s === 'overdue' ? 'Gecikenler' : 'Takip'}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list'
                                    ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Liste Görünümü"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid'
                                    ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm"
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
