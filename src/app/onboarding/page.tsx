"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShopOnboarding } from "@/lib/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, Phone, Wallet, GraduationCap, LogOut, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession, SessionProvider } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

function OnboardingForm() {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        currency: "TRY",
        openingBalance: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await createShopOnboarding(formData);
            if (result.success) {
                toast.success("Dükkan başarıyla oluşturuldu! Yönlendiriliyorsunuz...");
                await update({
                    shopId: result.shopId,
                    shopName: result.shopName
                });

                // Immediate router refresh to update server-side session state for middleware
                router.refresh();

                // Force a full reload to the absolute dashboard path to bypass any root-level redirects
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 800);
            } else {
                toast.error(result.error || "Bir hata oluştu.");
            }
        } catch (error) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Premium Arkaplan Atmosferi */}
            <div className="fixed inset-0 bg-[#050505] -z-20" />
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[130px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[130px] rounded-full -z-10 animate-pulse transition-all duration-3000" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] -z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-xl relative z-10"
            >
                <Card className="bg-[#0A0A0A]/60 border border-white/5 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />

                    <form onSubmit={handleSubmit}>
                        <CardHeader className="p-10 pb-6 space-y-4 text-center">
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-[#111] rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                                    <GraduationCap className="w-8 h-8 text-blue-500 relative z-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <CardTitle className="font-medium text-3xl  text-white tracking-tight">Dükkanınızı Kurun</CardTitle>
                                <CardDescription className="text-slate-500 text-sm font-medium">
                                    Hoş geldiniz! Mevcut envanterinizi ve kasanızı BAŞAR AI ile yönetmek için dükkan bilgilerinizi girin.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="px-10 space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="name" className="font-medium text-[11px]  text-slate-500 uppercase tracking-widest pl-1">DÜKKAN ADI</Label>
                                <div className="relative group">
                                    <Store className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                    <Input
                                        id="name"
                                        placeholder="Örn: Başar Teknik"
                                        className="h-12 pl-12 bg-[#111] border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="phone" className="font-medium text-[11px]  text-slate-500 uppercase tracking-widest pl-1">İLETİŞİM HATTI</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="phone"
                                            placeholder="05xx..."
                                            className="h-12 pl-12 bg-[#111] border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="balance" className="font-medium text-[11px]  text-slate-500 uppercase tracking-widest pl-1">AÇILIŞ KASASI (₺)</Label>
                                    <div className="relative group">
                                        <Wallet className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="balance"
                                            type="number"
                                            placeholder="0.00"
                                            className="h-12 pl-12 bg-[#111] border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all"
                                            required
                                            value={formData.openingBalance}
                                            onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="address" className="font-medium text-[11px]  text-slate-500 uppercase tracking-widest pl-1">ADRES BİLGİSİ</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                    <Input
                                        id="address"
                                        placeholder="Dükkan açık adresi..."
                                        className="h-12 pl-12 bg-[#111] border-white/5 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all"
                                        required
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-4">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                </div>
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                                    Kurulum tamamlandıktan sonra tüm sistemler, personelleriniz ve satış ekranlarınız anında kullanıma açılacaktır.
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="p-10 pt-4 flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-slate-100  py-7 rounded-2xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 text-base"
                                disabled={loading}
                            >
                                {loading ? (
                                    "Kurulum Başlatıldı..."
                                ) : (
                                    <>
                                        Dükkanı Oluştur ve Sisteme Gir
                                        <ChevronRight className="h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                className="text-[11px]  text-slate-600 hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 py-2"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                            >
                                <LogOut className="h-3 w-3" />
                                Çıkış Yap / Başka Hesap
                            </button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                    <div className="flex items-center gap-2 group cursor-default">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px]  text-white uppercase tracking-widest">AI INTEGRATED</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <SessionProvider>
            <OnboardingForm />
        </SessionProvider>
    );
}





