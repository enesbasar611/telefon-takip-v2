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
            <DialogContent className="sm:max-w-[600px] bg-[#111111] border border-[#333333] text-white p-0 shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <Search className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-bold tracking-tight">Akıllı Arama</DialogTitle>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                BAŞAR AI: Doğal dilde arama yapın. (Örn: Alış fiyatı 10 dolar altındaki Type-C kablolar)
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setAiInputFocused(true)}
                            onBlur={() => setAiInputFocused(false)}
                            placeholder="Aramak istediğiniz şeyi yazın..."
                            className="bg-[#18181A] border-[#333333] text-white placeholder:text-slate-500 h-12 text-sm"
                            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={isPending || !query.trim()}
                        className="w-full h-12 bg-violet-600 hover:bg-violet-700 font-bold"
                    >
                        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aranıyor...</> : <><Sparkles className="h-4 w-4 mr-2" /> Ara</>}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
