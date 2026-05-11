"use client";

import { useEffect, useState } from "react";
import { ANNOUNCEMENTS, Announcement } from "@/config/announcements";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bike, Palette, Layout, Sparkles, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { updateSetting } from "@/lib/actions/setting-actions";

const iconMap: Record<string, any> = {
    Bike,
    Palette,
    Layout,
    Sparkles,
};

export function AnnouncementsModal() {
    const { settings } = useDashboardData();
    const [open, setOpen] = useState(false);
    const [unseenAnnouncements, setUnseenAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasBeenShown, setHasBeenShown] = useState(false);

    useEffect(() => {
        if (ANNOUNCEMENTS.length === 0) return;

        if (hasBeenShown) return;

        // Get seen IDs from both DB settings and localStorage for maximum robustness
        const dbSeenRaw = settings?.find(s => s.key === "seen_announcements")?.value || "";
        const dbSeenIds = dbSeenRaw.split(",").filter(Boolean);
        const localSeenIds = (localStorage.getItem("seen_announcement_ids") || "").split(",").filter(Boolean);

        const allSeenIds = Array.from(new Set([...dbSeenIds, ...localSeenIds]));

        const unseen = ANNOUNCEMENTS.filter(a => !allSeenIds.includes(a.id));

        if (unseen.length > 0) {
            setUnseenAnnouncements(unseen);
            setHasBeenShown(true);
            // Small delay for better UX
            const timer = setTimeout(() => setOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [settings, hasBeenShown]);

    const handleClose = async () => {
        setOpen(false);
        const seenIds = unseenAnnouncements.map(a => a.id);
        const dbSeenRaw = settings?.find(s => s.key === "seen_announcements")?.value || "";
        const existingIds = dbSeenRaw.split(",").filter(Boolean);

        const newSeenIds = Array.from(new Set([...existingIds, ...seenIds])).join(",");

        // Save to DB
        await updateSetting("seen_announcements", newSeenIds);

        // Save to LocalStorage as fallback
        localStorage.setItem("seen_announcement_ids", newSeenIds);
    };

    const nextSlide = () => {
        if (currentIndex < unseenAnnouncements.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (unseenAnnouncements.length === 0) return null;

    const currentAnnouncement = unseenAnnouncements[currentIndex];

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
        }}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-background/60 backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentAnnouncement.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="relative"
                    >
                        {/* Header Visual */}
                        <div className="h-56 bg-gradient-to-br from-primary/30 via-secondary/15 to-transparent relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />

                            <div className="absolute top-10 left-10 right-10">
                                <div className="flex items-center justify-between mb-4">
                                    <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Yenilik • v{currentAnnouncement.version}
                                    </Badge>
                                    {unseenAnnouncements.length > 1 && (
                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">
                                            {currentIndex + 1} / {unseenAnnouncements.length}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none max-w-xl">
                                    {currentAnnouncement.title}
                                </h2>
                                <p className="text-muted-foreground/80 text-sm mt-4 font-medium max-w-2xl leading-relaxed line-clamp-2">
                                    {currentAnnouncement.description}
                                </p>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 bg-gradient-to-b from-transparent to-background/40">
                            <div className={cn(
                                "grid gap-4",
                                currentAnnouncement.features.length > 3 ? "grid-cols-2" : "grid-cols-1"
                            )}>
                                {currentAnnouncement.features.map((feature, idx) => {
                                    const Icon = iconMap[feature.icon] || Sparkles;
                                    return (
                                        <div
                                            key={idx}
                                            className="group relative flex items-start gap-5 p-5 rounded-3xl bg-muted/10 border border-white/5 hover:border-primary/30 hover:bg-muted/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
                                        >
                                            <div className="h-12 w-12 rounded-2xl bg-card border border-border/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:text-primary">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="font-bold text-[13px] text-foreground uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">
                                                    {feature.title}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-medium">
                                                    {feature.description}
                                                </p>
                                            </div>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                                                <Check className="h-4 w-4 text-emerald-500 shadow-glow" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-border/40">
                                <div className="flex items-center gap-3">
                                    {unseenAnnouncements.length > 1 && unseenAnnouncements.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "h-1.5 transition-all duration-500 rounded-full",
                                                idx === currentIndex ? "w-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "w-1.5 bg-primary/10"
                                            )}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center gap-3">
                                    {currentIndex > 0 && (
                                        <Button
                                            variant="ghost"
                                            onClick={prevSlide}
                                            className="rounded-2xl h-14 px-6 text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[11px]"
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Geri
                                        </Button>
                                    )}
                                    <Button
                                        onClick={nextSlide}
                                        className="rounded-[1.5rem] px-12 h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 group"
                                    >
                                        {currentIndex === unseenAnnouncements.length - 1 ? (
                                            <>BAŞLAYALIM <Check className="ml-2 h-4 w-4" /></>
                                        ) : (
                                            <>İLERİ <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
