"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createShopOnboarding } from "@/lib/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, Phone, Wallet, GraduationCap, LogOut, Sparkles, ChevronRight, CheckCircle2, Globe } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { signOut, useSession, SessionProvider } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { industries, IndustryType } from "@/config/industries";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

function OnboardingForm() {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        currency: "TRY",
        openingBalance: 0,
        website: "",
        industry: "PHONE_REPAIR" as IndustryType,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await createShopOnboarding(formData);
            if (result.success) {
                toast.success("Dükkan başarıyla oluşturuldu! Kurulum tamamlanıyor...");

                // Update client session
                await update({
                    shopId: result.shopId,
                    shopName: result.shopName,
                    role: "ADMIN"
                });

                // Redirect to setup wizard to select modules
                setTimeout(() => {
                    toast.success("Şimdi modüllerinizi seçin...");
                    window.location.href = "/setup";
                }, 1500);
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
        <div className="h-screen w-screen flex items-center justify-center bg-transparent p-4 md:p-8 fixed inset-0 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Premium Arkaplan Atmosferi - Dinamik Sektörel Renkler */}
            <div className="fixed inset-0 bg-[#050505] -z-20" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={formData.industry}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="fixed inset-0 -z-10 overflow-hidden"
                >
                    {/* Atmospheric Glows - Sağ Üst & Sol Alt */}
                    <div className={`absolute top-[-20%] right-[-10%] w-[55%] h-[55%] blur-[140px] rounded-full opacity-[0.3] animate-pulse transition-colors duration-1000
                        ${formData.industry === 'PHONE_REPAIR' ? 'bg-blue-600' :
                            formData.industry === 'ELECTRICIAN' ? 'bg-amber-500' :
                                formData.industry === 'GROCERY' ? 'bg-emerald-500' :
                                    formData.industry === 'CLOTHING' ? 'bg-rose-500' :
                                        formData.industry === 'COMPUTER_REPAIR' ? 'bg-indigo-500' :
                                            formData.industry === 'PLUMBING' ? 'bg-cyan-500' : 'bg-slate-500'}`}
                    />
                    <div className={`absolute bottom-[-20%] left-[-10%] w-[55%] h-[55%] blur-[140px] rounded-full opacity-[0.3] animate-pulse transition-colors duration-1000
                        ${formData.industry === 'PHONE_REPAIR' ? 'bg-indigo-600' :
                            formData.industry === 'ELECTRICIAN' ? 'bg-orange-600' :
                                formData.industry === 'GROCERY' ? 'bg-green-600' :
                                    formData.industry === 'CLOTHING' ? 'bg-pink-600' :
                                        formData.industry === 'COMPUTER_REPAIR' ? 'bg-blue-600' :
                                            formData.industry === 'PLUMBING' ? 'bg-blue-400' : 'bg-gray-600'}`}
                    />

                    {/* Corner Icons - Sol Üst & Sağ Alt - Her zaman görünür, hemen gelir */}
                    {isMounted && (() => {
                        const bgIcons = (industries as any)[formData.industry]?.bgIcons || [];
                        const cornerPositions = [
                            { position: 'top-6 left-6', iconIndex: 0, size: 'w-44 h-44', rotDir: 1 },
                            { position: 'top-6 left-44', iconIndex: 1, size: 'w-28 h-28', rotDir: -1 },
                            { position: 'top-40 left-14', iconIndex: 2, size: 'w-20 h-20', rotDir: 1 },
                            { position: 'bottom-6 right-6', iconIndex: 3, size: 'w-44 h-44', rotDir: -1 },
                            { position: 'bottom-6 right-44', iconIndex: 4, size: 'w-28 h-28', rotDir: 1 },
                            { position: 'bottom-40 right-14', iconIndex: 0, size: 'w-20 h-20', rotDir: -1 },
                        ];
                        return cornerPositions.map((corner, i) => {
                            const Icon = bgIcons[corner.iconIndex % bgIcons.length] || bgIcons[0];
                            if (!Icon) return null;
                            return (
                                <motion.div
                                    key={`corner-${formData.industry}-${i}`}
                                    className={`absolute ${corner.position} text-white pointer-events-none`}
                                    initial={{ opacity: 0.15, rotate: 0, scale: 1 }}
                                    animate={{
                                        opacity: [0.12, 0.22, 0.12],
                                        rotate: corner.rotDir > 0 ? [0, 360] : [0, -360],
                                        scale: [1, 1.08, 1],
                                    }}
                                    transition={{
                                        opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                                        rotate: { duration: 30 + i * 4, repeat: Infinity, ease: 'linear' },
                                        scale: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
                                    }}
                                >
                                    <Icon className={corner.size} />
                                </motion.div>
                            );
                        });
                    })()}

                    {/* Floating Icons - Her zaman görünür, yavaş süzlen */}
                    {isMounted && (() => {
                        const bgIcons = (industries as any)[formData.industry]?.bgIcons || [];
                        const floatConfigs = [
                            { x: -420, y: -200, ix: 0, dur: 18, size: 'w-32 h-32' },
                            { x: 380, y: 180, ix: 1, dur: 22, size: 'w-28 h-28' },
                            { x: -280, y: 220, ix: 2, dur: 20, size: 'w-24 h-24' },
                            { x: 300, y: -240, ix: 3, dur: 25, size: 'w-36 h-36' },
                            { x: -100, y: -310, ix: 4, dur: 16, size: 'w-20 h-20' },
                            { x: 160, y: 290, ix: 0, dur: 28, size: 'w-24 h-24' },
                            { x: -360, y: 60, ix: 1, dur: 21, size: 'w-20 h-20' },
                            { x: 210, y: -110, ix: 2, dur: 19, size: 'w-28 h-28' },
                        ];
                        return floatConfigs.map((cfg, i) => {
                            const Icon = bgIcons[cfg.ix % bgIcons.length] || bgIcons[0];
                            if (!Icon) return null;
                            return (
                                <motion.div
                                    key={`float-${formData.industry}-${i}`}
                                    className="absolute left-1/2 top-1/2 text-white pointer-events-none"
                                    style={{ translateX: '-50%', translateY: '-50%' }}
                                    initial={{ x: cfg.x, y: cfg.y, opacity: 0.18, rotate: 0 }}
                                    animate={{
                                        x: [cfg.x, cfg.x + 70, cfg.x - 50, cfg.x],
                                        y: [cfg.y, cfg.y - 50, cfg.y + 70, cfg.y],
                                        opacity: [0.18, 0.28, 0.18],
                                        rotate: [0, 360],
                                    }}
                                    transition={{
                                        x: { duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' },
                                        y: { duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' },
                                        opacity: { duration: cfg.dur / 2, repeat: Infinity, ease: 'easeInOut' },
                                        rotate: { duration: cfg.dur * 1.5, repeat: Infinity, ease: 'linear' },
                                    }}
                                >
                                    <Icon className={cfg.size} />
                                </motion.div>
                            );
                        });
                    })()}
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] -z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-4xl relative z-10 my-auto"
            >
                <Card className="bg-[#0A0A0A]/60 border border-border/50 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />

                    <form onSubmit={handleSubmit}>
                        <CardHeader className="p-10 pb-6 space-y-4 text-center">
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-[#111] rounded-2xl flex items-center justify-center border border-border shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                                    <GraduationCap className="w-8 h-8 text-blue-500 relative z-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <CardTitle className="font-medium text-3xl  text-white tracking-tight">Dükkanınızı Kurun</CardTitle>
                                <CardDescription className="text-muted-foreground/80 text-sm font-medium">
                                    Hoş geldiniz! Mevcut envanterinizi ve kasanızı BAŞAR AI ile yönetmek için dükkan bilgilerinizi girin.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="px-10 space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="name" className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest pl-1">DÜKKAN ADI</Label>
                                <div className="relative group">
                                    <Store className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                    <Input
                                        id="name"
                                        placeholder="Örn: Başar Teknik"
                                        className="h-12 pl-12 bg-[#111] border-border/50 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="industry" className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest pl-1">SEKTÖR TİPİ</Label>
                                <Select
                                    value={formData.industry}
                                    onValueChange={(val: IndustryType) => setFormData({ ...formData, industry: val })}
                                >
                                    <SelectTrigger className="h-12 bg-[#111] border-border/50 text-white rounded-xl focus:ring-blue-500/40">
                                        <SelectValue placeholder="Sektör Seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A0A0A] border-border/50 text-white">
                                        {Object.entries(industries).map(([key, config]) => {
                                            const Icon = config.icon;
                                            return (
                                                <SelectItem key={key} value={key} className="focus:bg-blue-500/10 focus:text-blue-400">
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-4 w-4" />
                                                        <span>{config.name}</span>
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <PhoneInput
                                        label="İLETİŞİM HATTI"
                                        value={formData.phone}
                                        onChange={(val) => setFormData({ ...formData, phone: val })}
                                        required
                                        className="bg-[#111] border-border/50"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="balance" className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest pl-1">AÇILIŞ KASASI (₺)</Label>
                                    <div className="relative group">
                                        <Wallet className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="balance"
                                            type="number"
                                            placeholder="0.00"
                                            className="h-12 pl-12 bg-[#111] border-border/50 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all font-medium"
                                            required
                                            value={formData.openingBalance}
                                            onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="address" className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest pl-1">ADRES BİLGİSİ</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="address"
                                            placeholder="Dükkan açık adresi..."
                                            className="h-12 pl-12 bg-[#111] border-border/50 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all font-medium"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="website" className="font-medium text-[11px]  text-muted-foreground/80 uppercase tracking-widest pl-1">WEB SİTESİ (OPSİYONEL)</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                                        <Input
                                            id="website"
                                            placeholder="www.dukanadresi.com"
                                            className="h-12 pl-12 bg-[#111] border-border/50 text-white placeholder:text-slate-700 focus:border-blue-500/40 rounded-xl transition-all font-medium"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-4">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
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





