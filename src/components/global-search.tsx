"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search, Command, ChevronRight, Package, User, Truck, Wrench,
    Loader2, Sparkles, TrendingDown, TrendingUp, ShoppingCart,
    PlusCircle, Zap, ArrowRight, Terminal, ScanLine
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { globalSearchAction } from "@/lib/actions/search-actions";
import { useRouter } from "next/navigation";
import { ScannerModal } from "@/components/scanner/scanner-modal";
import { useScanner } from "@/hooks/use-scanner";
import { toast } from "sonner";

// ─── Quick Command Definitions ───────────────────────────────────────────────
const QUICK_COMMANDS = [
    {
        id: "new-service",
        label: "Yeni Servis Kaydı Aç",
        description: "Müşteri cihazını servise al, yeni fiş oluştur",
        icon: Wrench,
        color: "blue",
        keywords: ["servis", "yeni servis", "servis aç", "servis kayıt", "cihaz al", "cihaz ekle", "fiş aç", "tamir", "tamire al"],
        action: (router: any) => router.push("/servis/yeni"),
    },
    {
        id: "add-income",
        label: "Gelir Ekle",
        description: "Kasaya nakit veya banka geliri işle",
        icon: TrendingUp,
        color: "emerald",
        keywords: ["gelir", "gelir ekle", "kasa gelir", "para geldi", "tahsilat", "ödeme aldım", "müşteriden aldım", "nakit gir"],
        action: (router: any) => router.push("/satis/kasa?action=add-income"),
    },
    {
        id: "add-expense",
        label: "Gider Ekle",
        description: "Kira, fatura, alım gibi gideri kaydet",
        icon: TrendingDown,
        color: "red",
        keywords: ["gider", "gider ekle", "masraf", "harcama", "kira", "fatura", "ödeme yap", "para çıktı", "nakit öde"],
        action: (router: any) => router.push("/satis/kasa?action=add-expense"),
    },
    {
        id: "create-order",
        label: "Sipariş Listesi Oluştur",
        description: "Tedarikçiye yeni bir sipariş listesi hazırla",
        icon: ShoppingCart,
        color: "purple",
        keywords: ["sipariş", "sipariş ver", "tedarikçi", "temin et", "sipariş listesi", "ürün sipariş", "toptancı", "tedarik"],
        action: (router: any) => router.push("/tedarikciler?action=create-order"),
    },
    {
        id: "new-customer",
        label: "Yeni Müşteri Ekle",
        description: "Sisteme yeni bir müşteri profili oluştur",
        icon: User,
        color: "amber",
        keywords: ["müşteri", "yeni müşteri", "müşteri ekle", "kayıt al", "müşteri kayıt", "müşteri aç"],
        action: (router: any) => router.push("/musteriler/yeni"),
    },
    {
        id: "add-product",
        label: "Stok / Ürün Ekle",
        description: "Depoya yeni ürün veya parça ekle",
        icon: Package,
        color: "orange",
        keywords: ["stok", "ürün", "ürün ekle", "parça", "malzeme", "depo", "stok gir", "envanter"],
        action: (router: any) => router.push("/stok"),
    },
];

const COLOR_MAP: Record<string, string> = {
    blue: "bg-blue-600 text-white border-blue-400/40",
    emerald: "bg-emerald-600 text-white border-emerald-400/40",
    red: "bg-red-600 text-white border-red-400/40",
    purple: "bg-purple-600 text-white border-purple-400/40",
    amber: "bg-amber-600 text-white border-amber-400/40",
    orange: "bg-orange-600 text-white border-orange-400/40",
};

const COLOR_HOVER: Record<string, string> = {
    blue: "bg-blue-600/10 border-blue-500/30",
    emerald: "bg-emerald-600/10 border-emerald-500/30",
    red: "bg-red-600/10 border-red-500/30",
    purple: "bg-purple-600/10 border-purple-500/30",
    amber: "bg-amber-600/10 border-amber-500/30",
    orange: "bg-orange-600/10 border-orange-500/30",
};

function matchCommands(query: string) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return QUICK_COMMANDS.filter(cmd =>
        cmd.keywords.some(kw => kw.includes(q) || q.includes(kw) || kw.startsWith(q))
    );
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isCommandMode, setIsCommandMode] = useState(false);
    const router = useRouter();

    const [scannerRoomId, setScannerRoomId] = useState<string>("");
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

    // Provide default parameter value explicitly to avoid unused parameter issues if any,
    // though barcode is strictly typed as string.
    const { initializeScannerRoom, sendSuccessFeedback } = useScanner(
        (barcode: string) => {
            handleSearch(barcode);
            sendSuccessFeedback("Arandı");
            toast.success("Barkod okutuldu");
            setIsScannerModalOpen(false);
        }
    );

    useEffect(() => {
        let rid = localStorage.getItem("scanner_room_id");
        if (!rid) {
            rid = "scanner-" + Math.random().toString(36).substring(2, 10);
            localStorage.setItem("scanner_room_id", rid);
        }
        setScannerRoomId(rid);
        initializeScannerRoom(rid);
    }, [initializeScannerRoom]);

    // Global Event Listener for manual trigger
    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("open-global-search", handleOpen);
        return () => window.removeEventListener("open-global-search", handleOpen);
    }, []);

    // Ctrl+Shift+S → Detaylı Arama
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "S" && e.shiftKey && e.ctrlKey) {
                e.preventDefault();
                setOpen(o => !o);
            }
        };
        window.addEventListener("keydown", down);
        return () => window.removeEventListener("keydown", down);
    }, []);

    const matchedCommands = useMemo(() => matchCommands(query), [query]);

    const handleSearch = useCallback(async (val: string) => {
        setQuery(val);
        setSelectedIndex(0);

        if (val.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        // If natural language commands found, prioritize them
        const cmds = matchCommands(val);
        if (cmds.length > 0) {
            setIsCommandMode(true);
        } else {
            setIsCommandMode(false);
        }

        setLoading(true);
        try {
            const data = await globalSearchAction(val);
            setResults(data || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const navigateTo = (href: string) => {
        router.push(href);
        setOpen(false);
        setQuery("");
        setResults([]);
        setIsCommandMode(false);
    };

    const runCommand = (cmd: typeof QUICK_COMMANDS[0]) => {
        cmd.action(router);
        setOpen(false);
        setQuery("");
        setResults([]);
        setIsCommandMode(false);
    };

    const allItems = isCommandMode
        ? [...matchedCommands.map(c => ({ __cmd: true, ...c })), ...results.map(r => ({ __cmd: false, ...r }))]
        : results.map(r => ({ __cmd: false, ...r }));

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const down = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(p => (p + 1) % Math.max(allItems.length, 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(p => (p - 1 + Math.max(allItems.length, 1)) % Math.max(allItems.length, 1));
            } else if (e.key === "Enter" && allItems[selectedIndex]) {
                e.preventDefault();
                const item = allItems[selectedIndex] as any;
                if (item.__cmd) runCommand(item as any);
                else navigateTo(item.href);
            }
        };
        window.addEventListener("keydown", down);
        return () => window.removeEventListener("keydown", down);
    }, [open, allItems, selectedIndex]);

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
                <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border-none p-0 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800/50 focus-visible:outline-none">
                    <div className="flex flex-col h-full">

                        {/* Search Input */}
                        <div className="flex items-center gap-4 p-6 pr-24 border-b border-zinc-100 dark:border-zinc-800/50 relative bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className={cn("transition-colors", isCommandMode && query.length > 0 ? "text-purple-400" : "text-blue-500")}>
                                {isCommandMode && query.length > 0
                                    ? <Terminal className="h-5 w-5" />
                                    : <Search className="h-5 w-5" />
                                }
                            </div>
                            <div className="flex-1 relative">
                                <Input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Ne yapmak istiyorsun? 'gelir ekle', 'yeni servis' ya da ürün ismi yaz..."
                                    className="bg-transparent border-none h-12 text-sm font-medium text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/40 p-0 pr-10 shadow-none w-full"
                                />
                                <button
                                    onClick={() => setIsScannerModalOpen(true)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors rounded-lg"
                                >
                                    <ScanLine className="h-5 w-5" />
                                </button>
                            </div>
                            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-border/50 text-[10px] text-muted-foreground/80 font-mono shrink-0">
                                CTRL+⇧+S
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[65vh] min-h-[280px] overflow-y-auto p-3 space-y-1 custom-scrollbar">
                            {query.length < 2 ? (
                                /* Empty State: show shortcut hints */
                                <div className="space-y-4 p-4">
                                    <div className="text-center py-6">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 mx-auto flex items-center justify-center mb-4 border border-border/50">
                                            <Zap className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground/90">Evrensel Komut Merkezi</p>
                                        <p className="text-xs text-muted-foreground/80 mt-1">Arama yap veya doğal dilde komut ver</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-2 mb-4">Hızlı Komutlar</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {QUICK_COMMANDS.map((cmd) => {
                                                const Icon = cmd.icon;
                                                return (
                                                    <button
                                                        key={cmd.id}
                                                        onClick={() => runCommand(cmd)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all hover:opacity-90 group",
                                                            "bg-white/3 border-border/50 hover:bg-white/6"
                                                        )}
                                                    >
                                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", COLOR_MAP[cmd.color])}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[10px] font-bold text-foreground/90 uppercase tracking-[0.05em]">{cmd.label}</p>
                                                            <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate uppercase tracking-tighter italic">{cmd.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : loading ? (
                                <div className="p-16 flex flex-col items-center justify-center gap-3 text-blue-500">
                                    <Loader2 className="h-7 w-7 animate-spin" />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">Sorgulanıyor...</span>
                                </div>
                            ) : allItems.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground/80 text-sm font-medium">
                                    "<span className="text-muted-foreground">{query}</span>" için sonuç bulunamadı.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Command results section header */}
                                    {isCommandMode && matchedCommands.length > 0 && (
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 px-3 pt-1 pb-0.5">
                                            ⚡ İşlem Komutları
                                        </p>
                                    )}

                                    {allItems.map((item: any, i) => {
                                        const isSelected = selectedIndex === i;

                                        if (item.__cmd) {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => runCommand(item)}
                                                    onMouseEnter={() => setSelectedIndex(i)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left border",
                                                        isSelected
                                                            ? cn(COLOR_HOVER[item.color], "shadow-lg")
                                                            : "border-transparent hover:bg-white/4"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                                        isSelected ? COLOR_MAP[item.color] : "bg-white/5 text-muted-foreground border-border/50"
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                                    </div>
                                                    <ArrowRight className={cn("h-4 w-4 transition-transform shrink-0", isSelected ? "text-white translate-x-0.5" : "text-slate-600")} />
                                                </button>
                                            );
                                        }

                                        // Normal search result
                                        return (
                                            <>
                                                {/* Section divider between commands and search results */}
                                                {isCommandMode && matchedCommands.length > 0 && i === matchedCommands.length && (
                                                    <div key={`divider-${i}`} className="flex items-center gap-2 px-3 py-2">
                                                        <div className="flex-1 h-px bg-white/5" />
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-1 mb-4">Arama Sonuçları ({results.length})</p>
                                                        <div className="flex-1 h-px bg-white/5" />
                                                    </div>
                                                )}
                                                <button
                                                    key={item.id || i}
                                                    onClick={() => navigateTo(item.href)}
                                                    onMouseEnter={() => setSelectedIndex(i)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left border",
                                                        isSelected
                                                            ? "bg-blue-600/10 border-blue-500/30 shadow-xl shadow-blue-500/5"
                                                            : "border-transparent hover:bg-white/4"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                                        isSelected ? "bg-blue-600 text-white border-blue-400/50" : "bg-white/5 text-muted-foreground border-border/50"
                                                    )}>
                                                        {getTypeIcon(item.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400/70">
                                                                {item.breadcrumb}
                                                            </span>
                                                            <Badge className="bg-white/8 text-muted-foreground border-none text-[8px] h-4 px-1.5 rounded-md">
                                                                {item.type}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="font-semibold text-sm text-foreground group-hover:text-blue-500 dark:group-hover:text-blue-300 truncate">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                                                        {item.customerHref && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); navigateTo(item.customerHref); }}
                                                                className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                                                            >
                                                                <User className="h-3 w-3" /> Müşteri Profiline Git
                                                            </button>
                                                        )}
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 transition-transform shrink-0",
                                                        isSelected ? "text-blue-400 translate-x-0.5" : "text-slate-700"
                                                    )} />
                                                </button>
                                            </>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between pointer-events-none select-none">
                            <div className="flex items-center gap-4 text-zinc-400">
                                <span className="flex items-center gap-2 grayscale-0">
                                    <kbd className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold text-foreground/60 shadow-sm">↑↓</kbd>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest">SEÇ</span>
                                </span>
                                <span className="flex items-center gap-2 grayscale-0">
                                    <kbd className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold text-foreground/60 shadow-sm">ENTER</kbd>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest">ÇALIŞTIR</span>
                                </span>
                                <span className="flex items-center gap-2 grayscale-0">
                                    <kbd className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold text-foreground/60 shadow-sm">ESC</kbd>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest">KAPAT</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-500/30">
                                <Search className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold tracking-widest">BAŞAR AI</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <ScannerModal open={isScannerModalOpen} onOpenChange={setIsScannerModalOpen} shopIdOrUserId={scannerRoomId} />
        </>
    );
}
