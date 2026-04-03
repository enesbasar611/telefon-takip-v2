"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    X,
    Command,
    ChevronRight,
    Package,
    User,
    Truck,
    Wrench,
    Loader2,
    Calendar,
    Hash,
    Sparkles
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { globalSearchAction } from "@/lib/actions/search-actions";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Toggle logic for Shift + S
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "S" && e.shiftKey) {
                e.preventDefault();
                setOpen(open => !open);
            }
        };

        window.addEventListener("keydown", down);
        return () => window.removeEventListener("keydown", down);
    }, []);

    const handleSearch = useCallback(async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await globalSearchAction(val);
            setResults(data || []);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
            setSelectedIndex(0);
        }
    }, []);

    const navigateTo = (href: string) => {
        router.push(href);
        setOpen(false);
        setQuery("");
        setResults([]);
    };

    // Keyboard navigation within results
    useEffect(() => {
        if (!open || results.length === 0) return;
        const down = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % results.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
            } else if (e.key === "Enter" && results[selectedIndex]) {
                e.preventDefault();
                navigateTo(results[selectedIndex].href);
            }
        };
        window.addEventListener("keydown", down);
        return () => window.removeEventListener("keydown", down);
    }, [open, results, selectedIndex]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Ürün': return <Package className="h-4 w-4" />;
            case 'Müşteri': return <User className="h-4 w-4" />;
            case 'Tedarikçi': return <Truck className="h-4 w-4" />;
            case 'Servis': return <Wrench className="h-4 w-4" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl bg-[#0F172A]/95 border-white/10 p-0 overflow-hidden rounded-3xl backdrop-blur-2xl shadow-2xl shadow-blue-500/10 focus-visible:outline-none">
                    <div className="flex flex-col h-full ring-0 outline-none">
                        {/* Search Input Section */}
                        <div className="flex items-center gap-3 p-6 border-b border-white/5 relative">
                            <Search className="h-6 w-6 text-blue-500" />
                            <Input
                                autoFocus
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Ürün, Müşteri, Tedarikçi veya Servis No Ara..."
                                className="bg-transparent border-none h-10 text-xl font-black text-white focus-visible:ring-0 focus-visible:border-none placeholder:text-slate-500 p-0 shadow-none outline-none"
                            />
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-[10px] font-black text-slate-400">SHIFT</span>
                                <span className="text-[10px] font-black text-slate-400">+</span>
                                <span className="text-[10px] font-black text-slate-400">S</span>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div className="max-h-[60vh] min-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                            {query.length < 2 ? (
                                <div className="p-12 text-center space-y-4">
                                    <div className="h-20 w-20 rounded-3xl bg-blue-500/5 mx-auto flex items-center justify-center">
                                        <Command className="h-10 w-10 text-blue-500/40" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-300">Evrensel Takip Araması</p>
                                        <p className="text-xs font-semibold text-slate-500 mt-1">Sistemdeki her şeyi anında bulun.</p>
                                    </div>
                                </div>
                            ) : loading ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-4 text-blue-500">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <span className="text-xs font-black uppercase tracking-widest italic">Veriler Sorgulanıyor...</span>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="p-12 text-center text-slate-500 italic font-medium">
                                    "{query}" ile ilgili bir sonuç bulunamadı.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {results.map((result, i) => (
                                        <button
                                            key={i}
                                            onClick={() => navigateTo(result.href)}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group border border-transparent",
                                                selectedIndex === i
                                                    ? "bg-blue-600/10 border-blue-500/30 shadow-xl shadow-blue-500/5"
                                                    : "hover:bg-white/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                                selectedIndex === i
                                                    ? "bg-blue-600 text-white border-blue-400/50"
                                                    : "bg-white/5 text-slate-400 border-white/5"
                                            )}>
                                                {getTypeIcon(result.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">
                                                        {result.breadcrumb}
                                                    </span>
                                                    <Badge className="bg-white/10 text-slate-300 border-none text-[8px] h-4 rounded-md">
                                                        {result.type}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-sm font-black text-white group-hover:text-blue-300 truncate">
                                                    {result.title}
                                                </h4>
                                                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                                                    {result.subtitle}
                                                </p>
                                            </div>

                                            <ChevronRight className={cn(
                                                "h-5 w-5 transition-transform",
                                                selectedIndex === i ? "text-blue-400 translate-x-1" : "text-slate-600"
                                            )} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">↑↓</span> Seç</span>
                                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">ENTER</span> Git</span>
                                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">ESC</span> Kapat</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-500/50">
                                <Sparkles className="h-3 w-3" />
                                <span>Powered by Takip V2 Core</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
