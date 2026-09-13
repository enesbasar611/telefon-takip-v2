"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getActiveSystemAnnouncements } from "@/lib/actions/system-announcement-actions";
import { Info, AlertTriangle, CheckCircle2, Sparkles, X, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

export function SystemAnnouncementsModal() {
    const [unseenAnnouncements, setUnseenAnnouncements] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const { success, data } = await getActiveSystemAnnouncements();
            if (success && data && data.length > 0) {
                const seenIds = (localStorage.getItem("system_seen_announcements") || "").split(",").filter(Boolean);
                
                const unseen = data.filter(ann => !seenIds.includes(ann.id));
                if (unseen.length > 0) {
                    setUnseenAnnouncements(unseen);
                    setCurrentIndex(0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch system announcements", error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAnnouncements();
        }, 3000);

        const interval = setInterval(() => {
            if (unseenAnnouncements.length === 0) {
                fetchAnnouncements();
            }
        }, 30000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [fetchAnnouncements, unseenAnnouncements.length]);

    const handleMarkAsSeen = () => {
        const currentAnnouncement = unseenAnnouncements[currentIndex];
        if (!currentAnnouncement) return;

        const seenIds = (localStorage.getItem("system_seen_announcements") || "").split(",").filter(Boolean);
        if (!seenIds.includes(currentAnnouncement.id)) {
            seenIds.push(currentAnnouncement.id);
            localStorage.setItem("system_seen_announcements", seenIds.join(","));
        }

        if (currentIndex < unseenAnnouncements.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setUnseenAnnouncements([]);
        }
    };

    if (unseenAnnouncements.length === 0) return null;

    const currentAnnouncement = unseenAnnouncements[currentIndex];

    const getIcon = () => {
        switch (currentAnnouncement.type) {
            case 'WARNING': return <AlertTriangle className="w-10 h-10 text-amber-500" />;
            case 'SUCCESS': return <CheckCircle2 className="w-10 h-10 text-emerald-500" />;
            case 'FEATURE': return <Sparkles className="w-10 h-10 text-purple-500" />;
            default: return <Info className="w-10 h-10 text-blue-500" />;
        }
    };

    const getColorStyles = () => {
        switch (currentAnnouncement.type) {
            case 'WARNING': return 'border-amber-500/30 bg-background/90 shadow-amber-500/10 shadow-2xl';
            case 'SUCCESS': return 'border-emerald-500/30 bg-background/90 shadow-emerald-500/10 shadow-2xl';
            case 'FEATURE': return 'border-purple-500/30 bg-background/90 shadow-purple-500/10 shadow-2xl';
            default: return 'border-blue-500/30 bg-background/90 shadow-blue-500/10 shadow-2xl';
        }
    };

    const getGradientClass = () => {
        switch (currentAnnouncement.type) {
            case 'WARNING': return 'bg-gradient-to-r from-amber-500/10 to-transparent';
            case 'SUCCESS': return 'bg-gradient-to-r from-emerald-500/10 to-transparent';
            case 'FEATURE': return 'bg-gradient-to-r from-purple-500/10 to-transparent';
            default: return 'bg-gradient-to-r from-blue-500/10 to-transparent';
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className={`sm:max-w-2xl md:max-w-3xl border-2 backdrop-blur-xl ${getColorStyles()} p-0 overflow-hidden`}>
                <div className={`p-6 ${getGradientClass()}`}>
                    <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                        <div className="shrink-0 p-3 bg-background/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/5">
                            {getIcon()}
                        </div>
                        <div className="flex-1 space-y-2 pt-1">
                            <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight">{currentAnnouncement.title}</DialogTitle>
                            <DialogDescription className="font-medium flex items-center justify-between text-base">
                                <span className="flex items-center gap-2">
                                    {currentAnnouncement.type === "FEATURE" ? "Yeni Özellik" : "Sistem Duyurusu"}
                                </span>
                                {unseenAnnouncements.length > 1 && (
                                    <span className="text-xs bg-background/80 px-3 py-1.5 rounded-full shadow-sm font-bold border border-white/10">
                                        {currentIndex + 1} / {unseenAnnouncements.length}
                                    </span>
                                )}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-2">
                    {(() => {
                        const content = currentAnnouncement.content || "";
                        // If it's a long markdown text, we still split it into tabs if needed (approx 1200 chars now since it's wider)
                        const chunks: string[] = [];
                        if (content.length <= 1500) {
                            chunks.push(content);
                        } else {
                            const paragraphs = content.split(/\n\s*\n/);
                            let currentChunk = "";
                            for (const p of paragraphs) {
                                if (currentChunk.length + p.length > 1500 && currentChunk.length > 0) {
                                    chunks.push(currentChunk.trim());
                                    currentChunk = p + "\n\n";
                                } else {
                                    currentChunk += p + "\n\n";
                                }
                            }
                            if (currentChunk.trim()) chunks.push(currentChunk.trim());
                        }

                        const renderMarkdown = (text: string) => (
                            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                                    prose-headings:font-bold prose-headings:tracking-tight
                                    prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                    prose-li:marker:text-primary/50 prose-ul:space-y-1 prose-ol:space-y-1
                                    prose-hr:border-border/50 prose-strong:text-primary">
                                <ReactMarkdown>
                                    {text}
                                </ReactMarkdown>
                            </div>
                        );

                        if (chunks.length > 1) {
                            return (
                                <Tabs defaultValue="tab-0" className="w-full mt-2">
                                    <TabsList className="w-full flex overflow-x-auto justify-start mb-4 h-auto flex-wrap bg-muted/50 p-1">
                                        {chunks.map((_, idx) => (
                                            <TabsTrigger key={idx} value={`tab-${idx}`} className="flex-1 min-w-[100px] text-sm data-[state=active]:shadow-sm">
                                                Bölüm {idx + 1}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {chunks.map((chunk, idx) => (
                                        <TabsContent key={idx} value={`tab-${idx}`} className="mt-0 focus-visible:outline-none">
                                            <ScrollArea className="max-h-[50vh] w-full pr-4">
                                                <div className="bg-background/40 p-4 md:p-6 rounded-xl border border-white/5 shadow-inner">
                                                    {renderMarkdown(chunk)}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            );
                        }

                        return (
                            <ScrollArea className="max-h-[55vh] w-full pr-4 mt-4">
                                <div className="bg-background/40 p-4 md:p-6 rounded-xl border border-white/5 shadow-inner">
                                    {renderMarkdown(content)}
                                </div>
                            </ScrollArea>
                        );
                    })()}
                </div>

                <div className="p-6 pt-4 bg-muted/30 border-t mt-2">
                    <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end">
                        <Button 
                            onClick={handleMarkAsSeen} 
                            className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                            size="lg"
                        >
                            {currentIndex < unseenAnnouncements.length - 1 ? (
                                <>Sonrakine Geç <ChevronRight className="w-5 h-5 ml-2" /></>
                            ) : (
                                "Okudum, Anladım"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
