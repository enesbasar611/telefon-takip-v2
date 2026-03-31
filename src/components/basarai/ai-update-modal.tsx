"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, RefreshCcw, Loader2, Table, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { parseBulkUpdateWithAI, AIUpdateOperation } from "@/lib/actions/gemini-actions";
import { applyBulkAIUpdates } from "@/lib/actions/product-actions";

export function AIUpdateModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [command, setCommand] = useState("");
    const [isPending, startTransition] = useTransition();
    const [updates, setUpdates] = useState<AIUpdateOperation[] | null>(null);

    const handleParse = () => {
        if (!command.trim()) return;

        startTransition(async () => {
            const result = await parseBulkUpdateWithAI(command);
            if (result.success) {
                if (result.updates.length === 0) {
                    toast.error("Hiçbir ürün eşleşmedi. Lütfen daha net bir ifade kullanın.");
                    return;
                }
                setUpdates(result.updates);
                toast.success(`${result.updates.length} ürün için güncelleme planı hazırlandı.`);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleApply = () => {
        if (!updates) return;
        startTransition(async () => {
            const result = await applyBulkAIUpdates(updates);
            if (result.success) {
                toast.success(`${result.count} ürün başarıyla güncellendi.`);
                onOpenChange(false);
                setUpdates(null);
                setCommand("");
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setUpdates(null); onOpenChange(false); } else onOpenChange(v); }}>
            <DialogContent className="sm:max-w-2xl bg-[#111111] border border-[#333333] text-white p-0 shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-[#222]">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <RefreshCcw className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <DialogTitle className="text-lg font-bold tracking-tight">Akıllı Güncelleme</DialogTitle>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                BAŞAR AI: Mevcut stokları yapay zeka ile topluca güncelleyin.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {!updates ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Ne yapmak istiyorsunuz?
                                </label>
                                <textarea
                                    value={command}
                                    onChange={e => setCommand(e.target.value)}
                                    placeholder="Örn: Tüm şarj aletlerinin satış fiyatını %10 artır."
                                    className="w-full bg-[#18181A] border border-[#333333] rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed h-32"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse(); }}
                                    autoFocus
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-slate-600 font-mono">
                                        [Ctrl+Enter] Planı Hazırlar
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleParse}
                                disabled={isPending || !command.trim()}
                                className="w-full h-12 bg-violet-600 hover:bg-violet-700 font-bold"
                            >
                                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yorumlanıyor...</> : <><Sparkles className="h-4 w-4 mr-2" /> İşlemi Planla</>}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-200">Güncelleme Özeti</h3>
                                <p className="text-[11px] text-slate-500 italic">Lütfen yapılacak değişiklikleri onaylayın.</p>
                            </div>

                            <div className="bg-[#18181A] border border-[#222] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-[12px]">
                                    <thead className="bg-[#111] sticky top-0 border-b border-[#222] text-slate-500 font-bold tracking-wider uppercase text-[9px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Ürün</th>
                                            <th className="px-4 py-3 text-right">Değişiklik</th>
                                            <th className="px-4 py-3 text-left">Neden</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                        {updates.map((up) => (
                                            <tr key={up.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-300">{up.name}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        {up.newName && <span className="text-violet-400">İsim Değişimi</span>}
                                                        {up.sellPrice && <span className="text-emerald-400">₺{up.sellPrice}</span>}
                                                        {up.buyPriceUsd && <span className="text-blue-400">${up.buyPriceUsd}</span>}
                                                        {up.stock !== undefined && <span className="text-orange-400">Stok: {up.stock}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{up.reason}</td>
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
                                    onClick={() => setUpdates(null)}
                                    disabled={isPending}
                                    className="flex-1 h-11 border-[#333] hover:bg-[#222] text-slate-400 font-bold"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    disabled={isPending}
                                    className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
