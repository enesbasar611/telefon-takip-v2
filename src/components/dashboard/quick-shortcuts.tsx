"use client";

import { useState, useEffect } from "react";
import {
    Plus, X, ShoppingCart, Package, Wrench, Smartphone,
    Banknote, Users, Settings, LucideIcon, ExternalLink,
    Archive, Database, ChevronDown, Zap, LayoutGrid,
    Sparkles, GripVertical, Trash2, Edit3, Save, CheckCircle2,
    TrendingUp, TrendingDown, Wallet, UserPlus, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { toast } from "sonner";

// Modal Imports
import { CreateProductModal } from "@/components/product/create-product-modal";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { CreateCustomerModal } from "@/components/customer/create-customer-modal";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";

interface Shortcut {
    id: string;
    label: string;
    path?: string;
    action?: string;
    iconName: string;
    color?: string;
    bg?: string;
}

interface ActionItem {
    label: string;
    path?: string;
    action?: string;
    icon: LucideIcon;
    iconName: string;
    color: string;
    bg: string;
    isFullscreen?: boolean;
}

const ACTION_POOL: Record<string, ActionItem[]> = {
    "Satış & Finans": [
        { label: "Yeni Satış", path: "/satis", icon: ShoppingCart, iconName: "ShoppingCart", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Hızlı Gelir Ekle", action: "CREATE_INCOME", icon: TrendingUp, iconName: "TrendingUp", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Hızlı Gider Ekle", action: "CREATE_EXPENSE", icon: TrendingDown, iconName: "TrendingDown", color: "text-rose-500", bg: "bg-rose-500/10" },
        { label: "Kasa Hareketi", action: "CREATE_TRANSACTION", icon: Wallet, iconName: "Wallet", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    ],
    "Stok & Envanter": [
        { label: "Yeni Ürün Ekle", action: "CREATE_PRODUCT", icon: Package, iconName: "Package", color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Stok Listesi", path: "/stok", icon: LayoutGrid, iconName: "LayoutGrid", color: "text-slate-500", bg: "bg-slate-500/10" },
    ],
    "Servis & Müşteri": [
        { label: "Yeni Servis Kaydı", action: "CREATE_SERVICE", icon: Wrench, iconName: "Wrench", color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Yeni Müşteri", action: "CREATE_CUSTOMER", icon: UserPlus, iconName: "UserPlus", color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Servis Listesi", path: "/servis", icon: Smartphone, iconName: "Smartphone", color: "text-blue-500", bg: "bg-blue-500/10" },
    ],
    "Sistem": [
        { label: "Ayarlar", path: "/ayarlar", icon: Settings, iconName: "Settings", color: "text-slate-500", bg: "bg-slate-500/10" },
        { label: "Sistem Yedeği", path: "/api/export?format=json", icon: Archive, iconName: "Archive", color: "text-rose-500", bg: "bg-rose-500/10" },
    ]
};

const iconMap: Record<string, LucideIcon> = {
    ShoppingCart, Package, Wrench, Smartphone, Banknote, Users,
    Settings, Plus, Archive, Database, LayoutGrid, Sparkles,
    TrendingUp, TrendingDown, Wallet, UserPlus, Receipt
};

interface QuickShortcutsProps {
    shop?: any;
    categories?: any[];
    suppliers?: any[];
}

export function QuickShortcuts({ shop, categories = [], suppliers = [] }: QuickShortcutsProps) {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("dashboard_shortcuts_v2");
        if (saved) {
            setShortcuts(JSON.parse(saved));
        } else {
            // Default shortcuts
            const defaults: Shortcut[] = [
                { id: "1", label: "Yeni Ürün Ekle", action: "CREATE_PRODUCT", iconName: "Package", color: "text-blue-500", bg: "bg-blue-500/10" },
                { id: "2", label: "Yeni Satış", path: "/satis", iconName: "ShoppingCart", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { id: "3", label: "Yeni Servis Kaydı", action: "CREATE_SERVICE", iconName: "Wrench", color: "text-amber-500", bg: "bg-amber-500/10" },
                { id: "4", label: "Yeni Müşteri", action: "CREATE_CUSTOMER", iconName: "UserPlus", color: "text-purple-500", bg: "bg-purple-500/10" },
                { id: "5", label: "Gider Ekle", action: "CREATE_EXPENSE", iconName: "TrendingDown", color: "text-rose-500", bg: "bg-rose-500/10" },
                { id: "6", label: "Kasa İşlemi", action: "CREATE_TRANSACTION", iconName: "Wallet", color: "text-indigo-500", bg: "bg-indigo-500/10" },
            ];
            setShortcuts(defaults);
        }
    }, []);

    const saveShortcuts = (newShortcuts: Shortcut[]) => {
        setShortcuts(newShortcuts);
        localStorage.setItem("dashboard_shortcuts_v2", JSON.stringify(newShortcuts));
    };

    const handleAction = (shortcut: Shortcut) => {
        if (isEditMode) return;

        if (shortcut.action) {
            setActiveModal(shortcut.action);
            setIsOpen(false);
        }
    };

    const removeShortcut = (id: string) => {
        saveShortcuts(shortcuts.filter(s => s.id !== id));
    };

    const addShortcut = (item: ActionItem) => {
        if (shortcuts.length >= 12) {
            toast.error("Maksimum 12 kısayol ekleyebilirsiniz.");
            return;
        }

        // Match by action or path
        const isDuplicate = shortcuts.some(s =>
            (item.action && s.action === item.action) ||
            (item.path && s.path === item.path)
        );

        if (isDuplicate) {
            toast.warning("Bu kısayol zaten ekli.");
            return;
        }

        const newShortcut: Shortcut = {
            id: Math.random().toString(36).substring(7),
            label: item.label,
            path: item.path,
            action: item.action,
            iconName: item.iconName,
            color: item.color,
            bg: item.bg
        };
        saveShortcuts([...shortcuts, newShortcut]);
        toast.success(`${item.label} kısayola eklendi.`);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(val) => {
                setIsOpen(val);
                if (!val) setIsEditMode(false);
            }}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-10 px-4 gap-2 border-border/40 bg-card/40 backdrop-blur-md hover:bg-primary/10 hover:text-primary hover:border-primary/40 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm group"
                    >
                        <Zap className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                        <span>Hızlı İşlemler</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:translate-y-0.5 transition-transform" />
                    </Button>
                </DialogTrigger>
                <DialogContent
                    overlayClassName="backdrop-blur-md bg-black/40"
                    className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl"
                >
                    <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-row items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Kısayol Merkezi</DialogTitle>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Sık kullandığınız işlemleri kişiselleştirin</p>
                            </div>
                        </div>
                        <Button
                            variant={isEditMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={cn(
                                "h-10 rounded-xl px-5 gap-2 uppercase text-[10px] font-black tracking-widest transition-all",
                                isEditMode ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-card/50"
                            )}
                        >
                            {isEditMode ? (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    BİTİR (KAYDET)
                                </>
                            ) : (
                                <>
                                    <Edit3 className="w-3.5 h-3.5" />
                                    DÜZENLE
                                </>
                            )}
                        </Button>
                    </DialogHeader>

                    <div className="px-8 pb-10 pt-2 h-[60vh] overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {isEditMode ? (
                                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-border/40" />
                                            <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">MEVCUT KISAYOLLAR (SIRALA/SİL)</h4>
                                            <div className="h-px flex-1 bg-border/40" />
                                        </div>

                                        <Reorder.Group axis="y" values={shortcuts} onReorder={saveShortcuts} className="space-y-2">
                                            {shortcuts.map((s) => (
                                                <Reorder.Item key={s.id} value={s}>
                                                    <div className="flex items-center gap-4 p-4 bg-muted/40 border border-border/40 rounded-2xl group transition-all hover:bg-muted/60">
                                                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                                                            {(() => {
                                                                const Icon = iconMap[s.iconName] || ExternalLink;
                                                                return <Icon className={cn("w-5 h-5", s.color)} />;
                                                            })()}
                                                        </div>
                                                        <span className="flex-1 font-bold text-xs uppercase tracking-tight">{s.label}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeShortcut(s.id)}
                                                            className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-border/40" />
                                            <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">KISAYOL HAVUZU (EKLE)</h4>
                                            <div className="h-px flex-1 bg-border/40" />
                                        </div>

                                        {Object.entries(ACTION_POOL).map(([group, items]) => (
                                            <div key={group} className="space-y-3">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 opacity-70">{group}</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {items.map((item) => {
                                                        const isAdded = shortcuts.some(s => (item.action && s.action === item.action) || (item.path && s.path === item.path));
                                                        return (
                                                            <button
                                                                key={item.label}
                                                                disabled={isAdded}
                                                                onClick={() => addShortcut(item)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-24 gap-2 group/btn",
                                                                    isAdded
                                                                        ? "bg-muted/20 border-border/20 opacity-40 cursor-not-allowed"
                                                                        : "bg-white dark:bg-zinc-900 border-border/40 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                                                                )}
                                                            >
                                                                <item.icon className={cn("w-5 h-5 transition-transform group-hover/btn:scale-110", item.color)} />
                                                                <span className="text-[9px] font-black uppercase text-center leading-none">{item.label}</span>
                                                                {isAdded && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute top-2 right-2" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {shortcuts.map((shortcut, idx) => {
                                        const Icon = iconMap[shortcut.iconName] || ExternalLink;

                                        const content = (
                                            <div className="flex flex-col items-center justify-center p-6 h-36 bg-white dark:bg-zinc-900 border border-border/50 hover:border-primary/40 rounded-[2rem] transition-all hover:-translate-y-1.5 shadow-sm hover:shadow-2xl group/item relative overflow-hidden active:scale-95">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover/item:scale-110", shortcut.bg || "bg-muted/30")}>
                                                    <Icon className={cn("w-7 h-7", shortcut.color || "text-muted-foreground")} />
                                                </div>
                                                <span className="text-[11px] font-black text-center leading-tight text-foreground uppercase tracking-tight">
                                                    {shortcut.label}
                                                </span>
                                            </div>
                                        );

                                        if (shortcut.action) {
                                            return (
                                                <button key={shortcut.id} onClick={() => handleAction(shortcut)} className="block w-full">
                                                    {content}
                                                </button>
                                            );
                                        }

                                        return (
                                            <Link key={shortcut.id} href={shortcut.path || "#"} onClick={() => setIsOpen(false)} className="block">
                                                {content}
                                            </Link>
                                        );
                                    })}

                                    {shortcuts.length < 12 && (
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="flex flex-col items-center justify-center p-6 h-36 bg-dashed border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 rounded-[2rem] transition-all group shadow-inner"
                                        >
                                            <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-all group-hover:rotate-90" />
                                            <span className="text-[10px] font-black text-muted-foreground mt-3 uppercase tracking-widest">Kısayol Düzenle</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                {isEditMode ? "Kısıyolları sürükle-bırak ile sıralayabilir veya çöp kutusu ile silebilirsiniz." : "İşlem yapmak için bir butona dokunun."}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">İstasyon v2.0</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Render Active Modals */}
            <CreateProductModal
                open={activeModal === "CREATE_PRODUCT"}
                onOpenChange={(v: boolean) => !v && setActiveModal(null)}
                categories={categories}
                suppliers={suppliers}
                shop={shop}
            />

            <CreateServiceModal
                open={activeModal === "CREATE_SERVICE"}
                onOpenChange={(v: boolean) => !v && setActiveModal(null)}
                shop={shop}
            />

            <CreateCustomerModal
                open={activeModal === "CREATE_CUSTOMER"}
                onOpenChange={(v: boolean) => !v && setActiveModal(null)}
            />

            <CreateTransactionModal
                open={activeModal === "CREATE_TRANSACTION" || activeModal === "CREATE_INCOME" || activeModal === "CREATE_EXPENSE"}
                onOpenChange={(v: boolean) => !v && setActiveModal(null)}
                initialType={activeModal === "CREATE_INCOME" ? "INCOME" : activeModal === "CREATE_EXPENSE" ? "EXPENSE" : undefined}
            />
        </>
    );
}
