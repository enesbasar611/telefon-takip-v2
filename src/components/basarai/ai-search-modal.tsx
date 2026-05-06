"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { useUI } from "@/lib/context/ui-context";
import { useEffect } from "react";

export function AISearchModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [query, setQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const { setAiInputFocused, setAiLoading } = useUI();
    const router = useRouter();

    useEffect(() => {
        setAiLoading(isPending);
    }, [isPending, setAiLoading]);

    // Cleanup: Removed triggerAura logic
    useEffect(() => {
        if (!open) {
            // reset logic no longer applicable
        }
    }, [open]);

    const handleSearch = () => {
        if (!query.trim()) return;

        startTransition(async () => {
            router.push(`/stok?ai_search=${encodeURIComponent(query.trim())}`);
            setQuery("");
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-5 mr-6">
                        <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                            <Search className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="font-bold text-xl tracking-tight">Akıllı Arama</DialogTitle>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                BAŞAR AI: Doğal dilde arama yapın. (Örn: Alış fiyatı 10 dolar altındaki Type-C kablolar)
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 pt-2 space-y-6">
                    <div className="space-y-3">
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setAiInputFocused(true)}
                            onBlur={() => setAiInputFocused(false)}
                            placeholder="Aramak istediğiniz şeyi yazın..."
                            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 h-14 text-base px-5 rounded-2xl focus:ring-2 focus:ring-violet-500/20 transition-all"
                            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={isPending || !query.trim()}
                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isPending ? (
                            <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Aranıyor...</>
                        ) : (
                            <><Sparkles className="h-5 w-5 mr-3" /> Akıllı Aramayı Başlat</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}




