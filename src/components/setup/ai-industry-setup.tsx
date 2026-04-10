"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import { generateIndustryConfigWithAI } from "@/lib/actions/gemini-actions";
import { saveAIIndustryConfig } from "@/lib/actions/setting-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AIIndustrySetupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIIndustrySetup({ isOpen, onClose }: AIIndustrySetupProps) {
    const [step, setStep] = useState<"input" | "preview" | "success">("input");
    const [sectorName, setSectorName] = useState("");
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);

    const handleGenerate = async () => {
        if (!sectorName.trim()) {
            toast.error("Lütfen sektörünüzü belirtin.");
            return;
        }

        setLoading(true);
        try {
            const result = await generateIndustryConfigWithAI(sectorName);
            if (result.success) {
                setConfig(result.data);
                setStep("preview");
            } else {
                toast.error(result.error || "Yapılandırma oluşturulamadı.");
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await saveAIIndustryConfig(
                config.serviceFormFields,
                config.inventoryFormFields,
                config.accessories || []
            );
            if (result.success) {
                setStep("success");
                toast.success("Dükkanınız başarıyla yapılandırıldı!");
            } else {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error("Kaydedilirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => step !== "success" && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border/50 text-white p-0 overflow-hidden shadow-2xl">
                <div className="relative p-8 space-y-6">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                    {step === "input" && (
                        <div className="space-y-6">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
                                    </div>
                                    <DialogTitle className="font-semibold text-2xl tracking-tight">AI ile Yapılandır</DialogTitle>
                                </div>
                                <DialogDescription className="text-sm text-gray-400 leading-relaxed">
                                    Sektörünüze özel servis formlarını ve stok kategorilerini AI ile anında oluşturun.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sector" className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">İşletmenizin Sektörü</Label>
                                    <Input
                                        id="sector"
                                        placeholder="Örn: Mobilya İmalat, Halı Yıkama, Terzi..."
                                        value={sectorName}
                                        onChange={(e) => setSectorName(e.target.value)}
                                        className="bg-white/[0.03] border-border/50 rounded-2xl h-14 text-base focus:border-indigo-500/50 transition-all"
                                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                                    />
                                </div>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold tracking-wider shadow-lg shadow-indigo-500/20 group"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <>
                                            YAPILANDIRMAYI ÜRET
                                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-6">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                        <Settings2 className="h-5 w-5" />
                                    </div>
                                    <DialogTitle className="font-semibold text-xl tracking-tight">Yapılandırma Önizleme</DialogTitle>
                                </div>
                                <DialogDescription className="text-sm text-gray-400 leading-relaxed">
                                    AI, "{sectorName}" sektörü için şu alanları önerdi:
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-1">Servis Kayıt Alanları</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(config?.serviceFormFields || []).map((f: any, i: number) => (
                                            <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-border/50 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[11px] text-gray-300 font-medium truncate">{f.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-1">Stok Ekstra Alanları</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(config?.inventoryFormFields || []).map((f: any, i: number) => (
                                            <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-border/50 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[11px] text-gray-300 font-medium truncate">{f.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-1">Müşteriden Alınacak Aksesuarlar</Label>
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {(config?.accessories || []).map((acc: string, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-indigo-500/5 border-indigo-500/20 text-[10px] py-1 px-3 rounded-xl">
                                                {acc}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border/30">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("input")}
                                    className="flex-1 h-12 rounded-xl text-xs font-bold text-gray-500"
                                >
                                    GERİ GİT
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-[2] h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold tracking-wider"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KURULUMU TAMAMLA"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-in zoom-in duration-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight">Harika!</h3>
                                <p className="text-sm text-gray-400 max-w-[280px]">
                                    {sectorName} özel yapılandırması tamamlandı. Artık dükkanınız size özel alanlarla çalışmaya hazır.
                                </p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="w-full h-14 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                            >
                                BAŞLAYALIM
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
