"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, RefreshCcw, Loader2, Table, Check, AlertTriangle, ArrowLeft, Info } from "lucide-react";
import { parseBulkUpdateWithAI, AIUpdateOperation, AIUpdateResponse, enhanceAndClarifyIntent, AIIntentClarification } from "@/lib/actions/gemini-actions";
import { applyBulkAIUpdates } from "@/lib/actions/product-actions";
import { useUI } from "@/lib/context/ui-context";
import { useAura } from "@/lib/context/aura-context";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";

export function AIUpdateModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [command, setCommand] = useState("");
    const [isPending, startTransition] = useTransition();
    const { setAiInputFocused, setAiLoading } = useUI();
    const { triggerAura } = useAura();
    const [aiResponse, setAiResponse] = useState<AIUpdateResponse | null>(null);
    const [clarification, setClarification] = useState<AIIntentClarification | null>(null);

    useEffect(() => {
        setAiLoading(isPending);
    }, [isPending, setAiLoading]);

    // Ensure aura is reset when modal closes
    useEffect(() => {
        if (!open) {
            triggerAura("idle");
        }
    }, [open, triggerAura]);

    const updates = aiResponse?.updates || null;

    const handleParse = (forcedCommand?: string) => {
        const cmdToUse = forcedCommand || command;
        if (!cmdToUse.trim()) return;

        startTransition(async () => {
            // If we don't have a clarification yet, get one
            if (!clarification && !forcedCommand) {
                const intentResult = await enhanceAndClarifyIntent(cmdToUse);
                if (intentResult.success) {
                    if (intentResult.data.isPerfect) {
                        // Skip clarification if AI is very sure
                        executeParse(intentResult.data.enhancedPrompt);
                    } else {
                        setClarification(intentResult.data);
                    }
                    return;
                }
            }

            executeParse(cmdToUse);
        });
    };

    const executeParse = async (cmd: string) => {
        const result = await parseBulkUpdateWithAI(cmd);
        if (result.success) {
            if (result.data.updates.length === 0) {
                toast.error("BAŞAR AI: Hiçbir ürün eşleşmedi. Lütfen daha net bir ifade kullanın.");
                return;
            }
            setAiResponse(result.data);
            setClarification(null); // Clear clarification when response arrives
            toast.success(`BAŞAR AI: ${result.data.affectedCount} ürün tespit edildi.`);
        } else {
            toast.error(result.error);
        }
    };

    const handleApply = () => {
        if (!updates) return;
        startTransition(async () => {
            const result = await applyBulkAIUpdates(updates);
            if (result.success) {
                toast.success(`BAŞAR AI: ${result.count} ürün başarıyla güncellendi. İşlem Başarılı!`);
                onOpenChange(false);
                setAiResponse(null);
                setCommand("");
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setAiResponse(null); setClarification(null); onOpenChange(false); } else onOpenChange(v); }}>
            <DialogContent className="sm:max-w-2xl bg-[#111111] border border-[#333333] text-white p-0 shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-[#222]">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <RefreshCcw className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <DialogTitle className="font-medium text-lg  tracking-tight">Akıllı Güncelleme</DialogTitle>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                BAŞAR AI: Mevcut stokları yapay zeka ile topluca güncelleyin.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {!updates ? (
                        <>
                            <div className="space-y-2">
                                <Label className="font-medium text-[11px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Ne yapmak istiyorsunuz?
                                </Label>
                                <textarea
                                    value={command}
                                    onChange={e => {
                                        setCommand(e.target.value);
                                    }}
                                    onFocus={() => {
                                        setAiInputFocused(true);
                                        triggerAura("focus");
                                    }}
                                    onBlur={() => {
                                        setAiInputFocused(false);
                                        triggerAura("idle");
                                    }}
                                    placeholder="Örn: Tüm şarj aletlerinin satış fiyatını %10 artır."
                                    className="w-full bg-[#18181A] border border-[#333333] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-muted-foreground/80 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed h-32"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse(); }}
                                    autoFocus
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-slate-600 font-mono">
                                        [Ctrl+Enter] Planı Hazırlar
                                    </p>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
                                        <Info className="h-3 w-3" /> Neler Yapabilirsiniz? (Günlük Dil)
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[
                                            { t: "Fiyat Artışı", e: "Şarjların fiyatını 20 lira arttır" },
                                            { t: "Stok Girişi", e: "Kılıflara 10 tane daha ekle" },
                                            { t: "Konum Güncelleme", e: "Bataryaları en arka rafa taşı" },
                                            { t: "Hızlı Kayıt", e: "iPhone 11 camı ekle, fiyat kalsın, stoğu 3 yap" },
                                        ].map((tip, i) => (
                                            <div
                                                key={i}
                                                className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-violet-500/30 transition-colors cursor-pointer group"
                                                onClick={() => setCommand(tip.e)}
                                            >
                                                <p className="text-[10px] text-violet-400 font-medium mb-1 group-hover:text-violet-300 transition-colors">{tip.t}</p>
                                                <p className="text-[11px] text-muted-foreground leading-snug italic line-clamp-2">"{tip.e}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {clarification && (
                                <div className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                                            <RefreshCcw className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-violet-300">Bunu mu demek istemiştiniz?</h4>
                                            <p className="text-sm text-white font-medium italic">"{clarification.clarifiedIntent}"</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-violet-600 hover:bg-violet-700 text-[11px] h-8 px-4"
                                            onClick={() => handleParse(clarification.enhancedPrompt)}
                                        >
                                            Evet, Devam Et
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-white text-[11px] h-8"
                                            onClick={() => setClarification(null)}
                                        >
                                            Hayır, Düzenle
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => handleParse()}
                                disabled={isPending || !command.trim()}
                                className="w-full h-12 bg-violet-600 hover:bg-violet-700 "
                            >
                                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yorumlanıyor...</> : <><Sparkles className="h-4 w-4 mr-2" /> İşlemi Planla</>}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-5 w-5 text-violet-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-sm  text-violet-200">BAŞAR AI Planı</h3>
                                    <p className="text-[12px] text-violet-300/80 leading-relaxed font-medium">
                                        {aiResponse?.summary}
                                    </p>
                                </div>
                            </div>

                            {aiResponse?.warnings && aiResponse.warnings.length > 0 && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                                    <h3 className="font-medium text-[11px]  text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3" /> Uyarılar
                                    </h3>
                                    <ul className="space-y-1">
                                        {aiResponse.warnings.map((w: string, i: number) => (
                                            <li key={i} className="text-[11px] text-amber-200/70 border-l border-amber-500/30 pl-3 leading-relaxed">
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-1">
                                <h3 className="font-medium text-sm  text-foreground/90">Etkilenecek Ürünler ({aiResponse?.affectedCount})</h3>
                                <p className="text-[11px] text-muted-foreground/80 italic">Lütfen yapılacak değişiklikleri onaylayın.</p>
                            </div>

                            <div className="bg-[#18181A] border border-[#222] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-[12px]">
                                    <thead className="bg-[#111] sticky top-0 border-b border-[#222] text-muted-foreground/80  tracking-wider uppercase text-[9px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Ürün</th>
                                            <th className="px-4 py-3 text-right">Eski Durum</th>
                                            <th className="px-4 py-3 text-right">Yeni Durum</th>
                                            <th className="px-4 py-3 text-left">Neden</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                        {updates.map((up: any) => (
                                            <tr key={up.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-foreground">{up.name}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full w-fit  uppercase ${up.status === 'Halledildi' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            }`}>
                                                            {up.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground/80 italic">
                                                    Güncellenecek...
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        {up.newName && <span className="text-violet-400 ">Yeni İsim: {up.newName}</span>}
                                                        {up.sellPrice !== undefined && <span className="text-emerald-400 ">₺{up.sellPrice}</span>}
                                                        {up.buyPriceUsd !== undefined && <span className="text-blue-400 ">${up.buyPriceUsd}</span>}
                                                        {up.stock !== undefined && <span className="text-orange-400 ">Stok: {up.stock}</span>}
                                                        {up.location && <span className="text-cyan-400 ">Raf: {up.location}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground/80 text-[11px] leading-tight max-w-[150px]">{up.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                                    Bu işlem doğrudan veritabanını güncelleyecektir. Lütfen fiyatları ve miktarları dikkatlice kontrol edin.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setAiResponse(null)}
                                    disabled={isPending}
                                    className="flex-1 h-11 border-[#333] hover:bg-[#222] text-muted-foreground "
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    disabled={isPending}
                                    className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white "
                                >
                                    {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uygulanıyor...</> : <><Check className="h-4 w-4 mr-2" /> Onayla ve Uygula</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}






