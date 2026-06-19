"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap, Building2, User, Lock, ShieldCheck } from "lucide-react";
import { saveShopEdmSettings } from "@/lib/actions/edm-settings-actions";

export function EDMSetupForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: "",
        passwordPlain: "",
        senderVkn: "",
        senderTitle: "",
    });

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.passwordPlain || !form.senderVkn || !form.senderTitle) {
            toast.error("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);
        try {
            const res = await saveShopEdmSettings(form);
            if (res.success) {
                toast.success("EDM Entegrasyonu başarıyla kuruldu.");
                onSuccess();
            } else {
                toast.error(res.error || "Kurulum başarısız.");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-none shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative border border-white/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />

                    <CardHeader className="pt-10 pb-6 text-center">
                        <div className="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group transition-all hover:bg-violet-500/20">
                            <Zap className="h-10 w-10 text-violet-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                            EDM Bilişim Kurulumu
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-lg max-w-sm mx-auto">
                            E-fatura kesmeye başlamak için EDM portal bilgilerini girin.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">EDM Kullanıcı Adı</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        <Input
                                            value={form.username}
                                            onChange={(e) => handleChange("username", e.target.value)}
                                            placeholder="Kullanıcı Adı"
                                            className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">EDM Şifre</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        <Input
                                            type="password"
                                            value={form.passwordPlain}
                                            onChange={(e) => handleChange("passwordPlain", e.target.value)}
                                            placeholder="••••••••"
                                            className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Gönderici VKN / TCKN</Label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                            <Input
                                                value={form.senderVkn}
                                                onChange={(e) => handleChange("senderVkn", e.target.value)}
                                                placeholder="1234567890"
                                                className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Firma Ünvanı</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                            <Input
                                                value={form.senderTitle}
                                                onChange={(e) => handleChange("senderTitle", e.target.value)}
                                                placeholder="Örnek Teknoloji Ltd."
                                                className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] mt-4"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="h-5 w-5 mr-2 fill-current" />
                                        Kurulumu Tamamla
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
