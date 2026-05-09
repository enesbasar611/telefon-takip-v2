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
import { Bike, Palette, Layout, Sparkles, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
    Bike: Bike,
    Palette: Palette,
    Layout: Layout,
    Sparkles: Sparkles,
};

export function AnnouncementsModal() {
    const [open, setOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        // Check if there are any announcements
        if (ANNOUNCEMENTS.length === 0) return;

        const latestAnnouncement = ANNOUNCEMENTS[0]; // Assuming sorted by date descending
        const seenId = localStorage.getItem("last_seen_announcement_id");

        if (seenId !== latestAnnouncement.id) {
            setCurrentAnnouncement(latestAnnouncement);
            // Delay opening for a better UX on page load
            const timer = setTimeout(() => setOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        if (currentAnnouncement) {
            localStorage.setItem("last_seen_announcement_id", currentAnnouncement.id);
        }
        setOpen(false);
    };

    if (!currentAnnouncement) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
                <div className="relative">
                    {/* Header Visual */}
                    <div className="h-48 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                        <div className="absolute top-12 left-12">
                            <Badge className="bg-primary/20 text-primary border-primary/20 mb-4 animate-pulse">YENİLİKLER • v{currentAnnouncement.version}</Badge>
                            <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-sm">
                                {currentAnnouncement.title}
                            </h2>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {currentAnnouncement.description}
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            {currentAnnouncement.features.map((feature, idx) => {
                                const Icon = iconMap[feature.icon] || Sparkles;
                                return (
                                    <div key={idx} className="group relative flex items-start gap-5 p-5 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all duration-300">
                                        <div className="h-12 w-12 rounded-xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform group-hover:text-primary">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">
                                                {feature.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-8 rounded-full bg-primary" />
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
                            </div>
                            <Button
                                onClick={handleClose}
                                className="rounded-2xl px-10 h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                ANLADIM <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
