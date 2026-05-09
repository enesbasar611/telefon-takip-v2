"use client";

import { useState, useEffect } from "react";
import { Plus, X, ShoppingCart, Package, Wrench, Smartphone, Banknote, Users, Settings, LucideIcon, ExternalLink, Archive, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Shortcut {
    id: string;
    label: string;
    path: string;
    iconName: string;
    isFullscreen?: boolean;
}

const SHORTCUT_GROUPS = [
    {
        name: "Satış & Finans",
        items: [
            { label: "POS (Tam Ekran)", path: "/satis?fullscreen=true", icon: ShoppingCart, iconName: "ShoppingCart", isFullscreen: true },
            { label: "Kasa / İşlemler", path: "/finans", icon: Banknote, iconName: "Banknote" },
        ]
    },
    {
        name: "Stok Yönetimi",
        items: [
            { label: "Ürün Listesi", path: "/stok", icon: Package, iconName: "Package" },
            { label: "Yeni Ürün Ekle", path: "/stok?mode=new", icon: Plus, iconName: "Plus" },
        ]
    },
    {
        name: "Servis & Teknik",
        items: [
            { label: "Servis Listesi", path: "/servis/liste", icon: Wrench, iconName: "Wrench" },
            { label: "Cihaz Takibi", path: "/cihaz-listesi", icon: Smartphone, iconName: "Smartphone" },
        ]
    },
    {
        name: "Genel",
        items: [
            { label: "Müşteriler", path: "/musteriler", icon: Users, iconName: "Users" },
            { label: "Sistem Ayarları", path: "/ayarlar", icon: Settings, iconName: "Settings" },
        ]
    },
    {
        name: "Veri & Yedek",
        items: [
            { label: "Sistem Yedeği", path: "/api/export?format=json", icon: Archive, iconName: "Archive" },
        ]
    }
];

const FLAT_AVAILABLE = SHORTCUT_GROUPS.flatMap(g => g.items);

const iconMap: Record<string, LucideIcon> = {
    ShoppingCart,
    Package,
    Wrench,
    Smartphone,
    Banknote,
    Users,
    Settings,
    Plus,
    Archive,
    Database
};

export function QuickShortcuts() {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("dashboard_shortcuts");
        if (saved) {
            setShortcuts(JSON.parse(saved));
        } else {
            // Default shortcuts
            const defaults = FLAT_AVAILABLE.slice(0, 6).map(s => ({
                id: Math.random().toString(36).substring(7),
                label: s.label,
                path: s.path,
                iconName: s.iconName
            }));
            setShortcuts(defaults);
        }
    }, []);

    const saveShortcuts = (newShortcuts: Shortcut[]) => {
        setShortcuts(newShortcuts);
        localStorage.setItem("dashboard_shortcuts", JSON.stringify(newShortcuts));
    };

    const addShortcut = (s: typeof FLAT_AVAILABLE[0]) => {
        if (shortcuts.length >= 6) return;
        if (shortcuts.some(existing => existing.path === s.path)) return; // Prevent duplicates

        const newShortcut = {
            id: Math.random().toString(36).substring(7),
            label: s.label,
            path: s.path,
            iconName: s.iconName
        };
        saveShortcuts([...shortcuts, newShortcut]);
        setIsOpen(false);
    };

    const removeShortcut = (id: string) => {
        saveShortcuts(shortcuts.filter(s => s.id !== id));
    };

    return (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {shortcuts.map((shortcut) => {
                const Icon = iconMap[shortcut.iconName] || ExternalLink;
                const isApi = shortcut.path.startsWith("/api/");
                const content = (
                    <div className="flex flex-col items-center justify-center p-3 h-20 sm:h-24 w-28 sm:w-32 bg-card/40 hover:bg-card/80 border border-border/40 hover:border-primary/40 rounded-2xl transition-all hover:-translate-y-1 shadow-sm backdrop-blur-md overflow-hidden">
                        <div className="relative">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2" />
                            {FLAT_AVAILABLE.find(f => f.path === shortcut.path)?.isFullscreen && (
                                <div className="absolute -top-1 -right-2 bg-primary/20 rounded-full p-0.5 border border-primary/30">
                                    <ExternalLink className="w-2 h-2 text-primary" />
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight text-neutral-600 dark:text-neutral-400">
                            {shortcut.label.toUpperCase()}
                        </span>
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3 text-primary/30" />
                        </div>
                    </div>
                );

                return (
                    <div key={shortcut.id} className="relative group">
                        {isApi ? (
                            <a href={shortcut.path} download>
                                {content}
                            </a>
                        ) : (
                            <Link href={shortcut.path}>
                                {content}
                            </Link>
                        )}
                        <button
                            onClick={() => removeShortcut(shortcut.id)}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}

            {shortcuts.length < 6 && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center justify-center p-3 h-20 sm:h-24 w-28 sm:w-32 bg-dashed border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 rounded-2xl transition-all group">
                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-wider">Kısayol Ekle</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 text-foreground">
                        <DialogHeader>
                            <DialogTitle>Hızlı Kısayol Ekle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                            {SHORTCUT_GROUPS.map((group) => (
                                <div key={group.name} className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{group.name}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {group.items.map((s) => {
                                            const isAdded = shortcuts.some(ex => ex.path === s.path);
                                            return (
                                                <Button
                                                    key={s.path}
                                                    variant="outline"
                                                    className={cn(
                                                        "flex flex-col h-auto py-4 gap-2 border-border/40 hover:border-primary/40 hover:bg-primary/5 rounded-xl transition-all relative overflow-hidden",
                                                        isAdded && "opacity-50 grayscale cursor-default"
                                                    )}
                                                    onClick={() => !isAdded && addShortcut(s)}
                                                >
                                                    <s.icon className="w-5 h-5 text-primary" />
                                                    <span className="text-[10px] font-bold uppercase">{s.label}</span>
                                                    {isAdded && (
                                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                                            <span className="bg-primary text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold">EKLENDİ</span>
                                                        </div>
                                                    )}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
