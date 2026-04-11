"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    CheckCircle2,
    ChevronRight,
    Settings2,
    Smartphone,
    Package,
    CreditCard,
    Wallet,
    Building2,
    MessageSquare,
    Cpu,
    Plus,
    Trash2,
    Loader2,
    Lock,
    Globe,
    Zap,
    Lightbulb,
    Store,
    MapPin,
    Phone,
    QrCode,
    RefreshCw,
    AlertCircle,
    X,
    Users,
    Building
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    createShopOnboarding,
    getOnboardingAIAnalysis,
    saveOnboardingModules,
    getWhatsAppStatusOnboarding,
    reinitWhatsAppOnboarding,
    saveOnboardingIntegrations,
    saveOnboardingFinance,
    finishOnboarding
} from "@/lib/actions/onboarding-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = "setup" | "analysis" | "integrations" | "finance" | "success";

const MODULES = [
    { id: "SALE", name: "POS & Satış", icon: CreditCard, desc: "Hızlı satış ve ödeme takibi" },
    { id: "SERVICE", name: "Teknik Servis", icon: Smartphone, desc: "Arıza kaydı ve onarım yönetimi" },
    { id: "STOCK", name: "Stok & Envanter", icon: Package, desc: "Ürün ve parça satış takibi" },
    { id: "CRM", name: "Müşteri Yönetimi", icon: Users, desc: "Müşteri portföyü ve CRM" },
    { id: "DEBT", name: "Cari & Veresiye", icon: CreditCard, desc: "Borç/alacak ve taksit takibi" },
    { id: "FINANCE", name: "Finans & Gider", icon: Wallet, desc: "Kasa, banka ve cari hesaplar" },
    { id: "SUPPLIER", name: "Tedarikçiler", icon: Building2, desc: "Toptancı ve parça tedariği" },
    { id: "STAFF", name: "Ekip Yönetimi", icon: Users, desc: "Personel ve yetkilendirme" },
    { id: "APPOINTMENT", name: "Randevu Sistemi", icon: Zap, desc: "Zaman planlaması" },
];

const INDUSTRIES = [
    { value: "PHONE_REPAIR", label: "Telefon Teknik Servis & Satış" },
    { value: "ELECTRICIAN", label: "Elektrik & Elektronik" },
    { value: "CLOTHING", label: "Terzi & Konfeksiyon" },
    { value: "AUTOMOTIVE", label: "Oto Servis & Yedek Parça" },
    { value: "COMPUTER_REPAIR", label: "Bilgisayar Hastanesi" },
    { value: "BARBER", label: "Berber & Kuaför" },
    { value: "DIGER", label: "Diğer (Kendi Yazacağım)" },
];

import { useSession } from "next-auth/react";

export default function OnboardingPage() {
    const router = useRouter();
    const { update: updateSession } = useSession(); // Access update to refresh JWT
    const [step, setStep] = useState<Step>("setup");
    const [loading, setLoading] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const [showApiGuide, setShowApiGuide] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Step 0: Shop Setup
    const [shopData, setShopData] = useState({
        name: "",
        industry: "PHONE_REPAIR",
        customIndustry: "",
        address: "",
        phone: ""
    });

    // Check for existing shop on mount
    useEffect(() => {
        const init = async () => {
            const { getShop } = await import("@/lib/actions/setting-actions");
            const existingShop = await getShop();

            if (existingShop) {
                // If they already finished, don't let them stay here
                if (!existingShop.isFirstLogin && !sessionStorage.getItem("just_finished_onboarding")) {
                    router.push("/dashboard");
                    return;
                }

                setShopId(existingShop.id);
                setShopData({
                    name: existingShop.name || "",
                    industry: existingShop.industry || "PHONE_REPAIR",
                    customIndustry: "",
                    address: existingShop.address || "",
                    phone: existingShop.phone || ""
                });

                // Restore step if possible, or trigger analysis
                const savedStep = sessionStorage.getItem("onboarding_step");
                if (savedStep && ["setup", "analysis", "integrations", "finance", "success"].includes(savedStep)) {
                    setStep(savedStep as any);
                }
            }
        };
        init();
    }, []);

    // Save step to session storage on change
    useEffect(() => {
        if (step !== "setup") {
            sessionStorage.setItem("onboarding_step", step);
        }
    }, [step]);

    const handleBack = () => {
        if (step === "analysis") setStep("setup");
        else if (step === "integrations") setStep("analysis");
        else if (step === "finance") setStep("integrations");
    };

    // Step 1: AI Analysis
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>(["SERVICE", "STOCK", "SALE", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"]);

    // Step 2: Integrations
    const [wsStatus, setWsStatus] = useState<any>({ status: "DISCONNECTED" });
    const [geminiStatus, setGeminiStatus] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState("");

    // Step 3: Finance
    const [accounts, setAccounts] = useState<any[]>([
        { id: "1", name: "Merkez Kasa", type: "CASH", balance: 0, isDefault: true }
    ]);

    // Polling WhatsApp Status
    useEffect(() => {
        let interval: any;
        if (step === "integrations") {
            const checkStatus = async () => {
                const res: any = await getWhatsAppStatusOnboarding(shopId || undefined);
                if (res && res.success) setWsStatus(res);
            };
            checkStatus();
            interval = setInterval(checkStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleNext = async () => {
        if (step === "setup") {
            if (!shopData.name.trim()) return toast.error("Dükkan adı gereklidir.");
            const sector = shopData.industry === "DIGER" ? shopData.customIndustry : shopData.industry;
            if (!sector) return toast.error("Lütfen bir sektör belirtin.");

            // Phone validation
            if (shopData.phone && shopData.phone.length > 0 && shopData.phone.length < 14) {
                return toast.error("Lütfen geçerli bir telefon numarası girin.");
            }

            setLoading(true);
            const res = await createShopOnboarding({
                name: shopData.name,
                industry: sector,
                address: shopData.address,
                phone: shopData.phone
            });

            if (res.success && res.shopId) {
                setShopId(res.shopId);
                // REFRESH SESSION: This adds the new shopId to the JWT so middleware doesn't redirect back to /onboarding
                await updateSession({ shopId: res.shopId });

                const aiRes = await getOnboardingAIAnalysis(sector);
                if (aiRes.success) {
                    setAiAnalysis(aiRes.data);
                    setSelectedModules(aiRes.data.suggestedModules || selectedModules);
                }
                setStep("analysis");
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        } else if (step === "analysis") {
            setLoading(true);
            const res = await saveOnboardingModules(
                selectedModules,
                shopData.industry === "DIGER" ? shopData.customIndustry : shopData.industry,
                {
                    labels: aiAnalysis?.labels,
                    categories: aiAnalysis?.suggestedCategories
                },
                shopId || undefined
            );
            if (res.success) {
                setStep("integrations");
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        } else if (step === "integrations") {
            if (geminiStatus && !geminiApiKey.trim()) {
                return toast.error("Kendi API anahtarınızı kullanmak için bir anahtar girin.");
            }
            setLoading(true);
            const res = await saveOnboardingIntegrations({
                whatsappConnected: wsStatus.status === "CONNECTED",
                geminiApiKey: geminiStatus ? geminiApiKey : undefined
            });
            if (res.success) {
                setStep("finance");
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        } else if (step === "finance") {
            setLoading(true);
            const resFin = await saveOnboardingFinance(accounts);
            if (resFin.success) {
                const res = await finishOnboarding();
                if (res.success) {
                    sessionStorage.setItem("just_finished_onboarding", "true");
                    setStep("success");
                } else {
                    toast.error(res.error);
                }
            } else {
                toast.error(resFin.error || "Finansal bilgiler kaydedilemedi.");
            }
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            await updateSession();
            router.push("/dashboard");
        } catch (error) {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* API Guide Modal */}
            {showApiGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 p-8 rounded-[2rem] max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">Gemini API Anahtarı</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowApiGuide(false)}><X /></Button>
                        </div>
                        <p className="text-gray-400 text-sm">Google AI Studio üzerinden ücretsiz API anahtarınızı oluşturabilirsiniz.</p>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" className="block w-full text-center py-3 bg-indigo-600 rounded-xl font-bold">Anahtar Al</a>
                    </div>
                </div>
            )}

            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-[900px] relative z-10">
                {/* Progress Indicators */}
                {step !== "success" && (
                    <div className="flex items-center justify-center gap-2 mb-12">
                        {["setup", "analysis", "integrations", "finance"].map((s, i) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-700",
                                    ["setup", "analysis", "integrations", "finance"].indexOf(step) >= i
                                        ? "w-16 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                        : "w-8 bg-white/10"
                                )}
                            />
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* STEP 0: SHOP SETUP */}
                    {step === "setup" && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="h-20 w-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <Store className="h-10 w-10 text-white" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter italic">Dükkanınızı Tanıyalım</h1>
                                <p className="text-gray-400 text-xl max-w-lg mx-auto leading-relaxed">Başar Bulut ERP ile işletmenizi dijital dünyaya entegre edin. Saniyeler içinde başlayın.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem]">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> İşletme Adı
                                        </Label>
                                        <Input
                                            placeholder="Örn: Başar Teknik"
                                            value={shopData.name}
                                            onChange={e => setShopData({ ...shopData, name: e.target.value })}
                                            className="h-16 bg-black/40 border-white/10 rounded-2xl text-lg px-6 focus:border-white transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> İşletme Sektörü
                                        </Label>
                                        <Select value={shopData.industry} onValueChange={v => setShopData({ ...shopData, industry: v })}>
                                            <SelectTrigger className="h-16 bg-black/40 border-white/10 rounded-2xl text-lg px-6">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border-white/10 text-white rounded-2xl p-2">
                                                {INDUSTRIES.map(ind => (
                                                    <SelectItem key={ind.value} value={ind.value} className="h-12 rounded-xl focus:bg-white focus:text-black">
                                                        {ind.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {shopData.industry === "DIGER" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                                            <Input
                                                placeholder="Sektörü el ile yazın..."
                                                value={shopData.customIndustry}
                                                onChange={e => setShopData({ ...shopData, customIndustry: e.target.value })}
                                                className="h-14 bg-white/5 border-indigo-500/30 rounded-2xl focus:border-indigo-400"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> Adres (Opsiyonel)
                                        </Label>
                                        <Input
                                            placeholder="Açık adresiniz..."
                                            value={shopData.address}
                                            onChange={e => setShopData({ ...shopData, address: e.target.value })}
                                            className="h-16 bg-black/40 border-white/10 rounded-2xl text-lg px-6 focus:border-white transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> Telefon (Müşteri için)
                                        </Label>
                                        <PhoneInput
                                            value={shopData.phone}
                                            onChange={val => setShopData({ ...shopData, phone: val })}
                                            className="h-16 bg-black/40 border-white/10 rounded-2xl text-lg px-6 focus:border-white transition-all shadow-inner border-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleNext}
                                disabled={loading || !shopData.name}
                                className="w-full h-20 bg-white text-black text-2xl font-black rounded-[2.5rem] hover:bg-gray-200 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-2xl shadow-white/10"
                            >
                                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                                    <div className="flex items-center gap-4">
                                        BAŞLA <ChevronRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 1: AI ANALYSIS & MODULES */}
                    {step === "analysis" && (
                        <motion.div
                            key="analysis"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter">Sektörel Yapılandırma</h2>
                                <p className="text-gray-400">Yapay zeka dükkanınız için en iyi modülleri ve terimleri belirledi.</p>
                            </div>

                            {/* AI Analysis - Horizontal Section */}
                            <div className="w-full">
                                {aiAnalysis ? (
                                    <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-indigo-400">
                                                <Cpu className="h-6 w-6 animate-pulse" />
                                                <span className="text-[10px] font-black tracking-widest uppercase">Zeka Analizi</span>
                                            </div>
                                            <div className="flex-1 max-w-2xl px-8 hidden md:block">
                                                <p className="text-[10px] text-indigo-300/80 italic font-medium text-center">"{aiAnalysis.businessAdvice}"</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <Label className="text-[9px] text-indigo-400/60 uppercase font-black">Önerilen Terimler</Label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2">
                                                    {Object.entries(aiAnalysis.labels || {}).map(([key, val]: any) => (
                                                        <div key={key} className="flex items-center justify-between text-[10px] py-1 border-b border-indigo-500/10 last:border-0">
                                                            <span className="text-gray-400 capitalize truncate mr-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                            <span className="font-bold text-white truncate">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-[9px] text-indigo-400/60 uppercase font-black">Başlangıç Kategorileri</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {aiAnalysis.suggestedCategories?.map((cat: string) => (
                                                        <Badge key={cat} className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 rounded-lg h-6 text-[10px]">
                                                            {cat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-32 flex flex-col items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem] opacity-30">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                        <p className="text-[10px] uppercase font-black tracking-widest">AI Analiz Ediyor...</p>
                                    </div>
                                )}
                            </div>

                            {/* Modules Section - 4 Columns */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mevcut Modüller</h3>
                                    <span className="text-[10px] text-indigo-400 font-bold italic">* Seçilmeyen modülleri daha sonra Ayarlar &gt; Modüller kısmından aktif edebilirsiniz.</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {MODULES.map(mod => (
                                        <button
                                            key={mod.id}
                                            onClick={() => {
                                                if (selectedModules.includes(mod.id)) {
                                                    setSelectedModules(selectedModules.filter(id => id !== mod.id));
                                                } else {
                                                    setSelectedModules([...selectedModules, mod.id]);
                                                }
                                            }}
                                            className={cn(
                                                "p-4 rounded-[2rem] border transition-all duration-300 text-left relative group",
                                                selectedModules.includes(mod.id)
                                                    ? "bg-white/10 border-white/20 shadow-2xl scale-[1.02]"
                                                    : "bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-all",
                                                selectedModules.includes(mod.id) ? "bg-white text-black shadow-lg" : "bg-white/5 text-white"
                                            )}>
                                                <mod.icon className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-bold text-sm">{mod.name}</h3>
                                            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-2">{mod.desc}</p>
                                            {selectedModules.includes(mod.id) && (
                                                <div className="absolute top-3 right-3">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleBack}
                                    className="h-20 w-1/4 bg-white/5 text-gray-400 text-xl font-black rounded-[2.5rem] border border-white/5 hover:bg-white/10"
                                >
                                    GERİ
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-1 h-20 bg-white text-black text-2xl font-black rounded-[2.5rem] shadow-2xl"
                                >
                                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : "DEVAM ET"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: INTEGRATIONS */}
                    {step === "integrations" && (
                        <motion.div
                            key="integrations"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter">Akıllı Entegrasyon</h2>
                                <p className="text-gray-400">WhatsApp ve AI özelliklerini burada etkinleştirin.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* WhatsApp Integration */}
                                <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 space-y-8 relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                                <MessageSquare className="h-8 w-8 text-black" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black italic">WhatsApp</h3>
                                                <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest">Bağlantı Paneli</p>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "h-8 px-4 font-black text-[10px] rounded-full",
                                            wsStatus.status === "CONNECTED" ? "bg-emerald-500 text-black" : "bg-white/10 text-white/50"
                                        )}>
                                            {wsStatus.status === "CONNECTED" ? "AKTİF" : "BAĞLI DEĞİL"}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-[2rem] border border-white/5 min-h-[300px]">
                                        {wsStatus.status === "CONNECTED" ? (
                                            <div className="text-center space-y-4 py-8">
                                                <div className="h-24 w-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 mb-4">
                                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                                </div>
                                                <p className="text-emerald-400 font-black tracking-widest uppercase text-[10px]">OTURUM AÇIK</p>
                                                {wsStatus.me && (
                                                    <div className="mt-4 space-y-1">
                                                        <p className="text-white font-bold text-sm tracking-tight">{wsStatus.me.name}</p>
                                                        <p className="text-emerald-500/60 font-mono text-[10px] tracking-widest">+{wsStatus.me.number}</p>
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => reinitWhatsAppOnboarding(shopId || undefined)}
                                                    className="mt-6 text-[10px] font-black tracking-widest text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 h-8 rounded-lg"
                                                >
                                                    OTURUMU DEĞİŞTİR
                                                </Button>
                                            </div>
                                        ) : wsStatus.status === "QR" && wsStatus.qr ? (
                                            <div className="bg-white p-4 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
                                                <img src={wsStatus.qr} alt="WA QR" className="w-[200px] h-[200px]" />
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-6">
                                                <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                                    <QrCode className="h-10 w-10 text-white/20" />
                                                </div>
                                                <Button
                                                    onClick={() => reinitWhatsAppOnboarding(shopId || undefined)}
                                                    className="h-14 px-8 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all font-sans"
                                                >
                                                    BAĞLANTIYI BAŞLAT
                                                </Button>
                                            </div>
                                        )}

                                        {(wsStatus.status === "CONNECTING" || wsStatus.status === "INITIALIZING") && (
                                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
                                                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                                                <p className="text-[10px] text-emerald-500 font-black tracking-widest uppercase">PUPPETEER BAŞLATILIYOR...</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-center text-emerald-500/50 uppercase font-bold tracking-widest leading-relaxed">
                                        TELEFONUNUZDAN WHATSAPP &gt; BAĞLI CİHAZLAR &gt; CİHAZ BAĞLA DİYEREK OKUTUN.
                                    </p>
                                </div>

                                {/* Gemini AI Integration */}
                                <div className="p-10 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 space-y-8 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                                                    <Cpu className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black italic">BAŞAR AI</h3>
                                                    <p className="text-indigo-500/60 text-xs font-bold uppercase tracking-widest">Zeka Entegrasyonu</p>
                                                </div>
                                            </div>
                                            <Switch checked={geminiStatus} onCheckedChange={setGeminiStatus} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                                    <p className="text-xs font-medium text-gray-300">Otomatik stok raporu ve analizi</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                                    <p className="text-xs font-medium text-gray-300">Akıllı kategori yapılandırması</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                                    <p className="text-xs font-medium text-gray-300">Müşteri segmentasyon önerileri</p>
                                                </div>
                                            </div>
                                        </div>

                                        {geminiStatus && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-3 pt-2"
                                            >
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Gemini API Key</Label>
                                                    <Input
                                                        type="password"
                                                        placeholder="AI Anahtarınızı Buraya Yapıştırın..."
                                                        value={geminiApiKey}
                                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                                        className="h-12 bg-black/40 border-indigo-500/20 rounded-xl focus:border-indigo-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowApiGuide(true)}
                                                    className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 transition-colors uppercase tracking-widest pl-1"
                                                >
                                                    <Globe className="h-3 w-3" /> API ANAHTARI NASIL ALINIR?
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
                                        <div className="flex gap-4">
                                            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                                            <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium capitalize">
                                                {!geminiStatus
                                                    ? "Sistemin gelişmiş özelliklerini kullanmak için bizim ortak havuzumuzdaki zekayı kullanacaksınız."
                                                    : "Kendi API anahtarınızı girerek sistemin limitlerini yükseltebilir ve daha hızlı yanıtlar alabilirsiniz."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleBack}
                                    className="h-20 w-1/4 bg-white/5 text-gray-400 text-xl font-black rounded-[2.5rem] border border-white/5 hover:bg-white/10"
                                >
                                    GERİ
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-1 h-20 bg-white text-black text-2xl font-black rounded-[2.5rem] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl"
                                >
                                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : "FİNANSAL ADIMA GEÇ"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: FINANCE */}
                    {step === "finance" && (
                        <motion.div
                            key="finance"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter">Finansal Yapılandırma</h2>
                                <p className="text-gray-400">Kasa ve banka hesaplarınızı oluşturun.</p>
                            </div>

                            <div className="space-y-4 bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem]">
                                {accounts.map((acc, index) => (
                                    <div key={acc.id} className="space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            <div className="col-span-5 space-y-2">
                                                <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Hesap / Kasa Adı</Label>
                                                <Input
                                                    placeholder="Örn: Garanti Bankası"
                                                    value={acc.name}
                                                    onChange={e => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, name: e.target.value } : a))}
                                                    className="h-14 bg-black/40 border-white/10 rounded-2xl"
                                                />
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tür</Label>
                                                <Select value={acc.type} onValueChange={v => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, type: v, limit: undefined, billingDay: undefined, balance: 0 } : a))}>
                                                    <SelectTrigger className="h-14 bg-black/40 border-white/10 rounded-2xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-black border-white/10 text-white p-2 text-xs">
                                                        <SelectItem value="CASH">Nakit Kasa</SelectItem>
                                                        <SelectItem value="BANK">Banka Hesabı</SelectItem>
                                                        <SelectItem value="POS">Sanal POS</SelectItem>
                                                        <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                                                    {acc.type === 'CREDIT_CARD' ? 'GÜNCEL BORÇ' : 'AÇILIŞ BAKİYESİ'}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={acc.balance}
                                                    onChange={e => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: parseFloat(e.target.value) } : a))}
                                                    className="h-14 bg-black/40 border-white/10 rounded-2xl"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center pb-2">
                                                {index === 0 ? (
                                                    <div className="h-10 w-10 flex items-center justify-center text-emerald-500"><Lock className="h-5 w-5" /></div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))}
                                                        className="h-10 w-10 text-red-400 hover:bg-red-500/20 rounded-xl"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {acc.type === 'CREDIT_CARD' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="grid grid-cols-2 gap-4 pl-12"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest pl-1">Toplam Kart Limiti</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Varsa limitinizi girin"
                                                        value={acc.limit || ""}
                                                        onChange={e => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, limit: parseFloat(e.target.value) } : a))}
                                                        className="h-12 bg-indigo-500/5 border-indigo-500/20 rounded-xl focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest pl-1">Son Ödeme Günü (Gün)</Label>
                                                    <Select
                                                        value={acc.billingDay?.toString() || ""}
                                                        onValueChange={v => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, billingDay: parseInt(v) } : a))}
                                                    >
                                                        <SelectTrigger className="h-12 bg-indigo-500/5 border-indigo-500/20 rounded-xl focus:border-indigo-500">
                                                            <SelectValue placeholder="Günü seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-black border-white/10 text-white p-2 text-xs">
                                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                                <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}

                                <Button
                                    onClick={() => setAccounts([...accounts, { id: Math.random().toString(), name: "", type: "BANK", balance: 0 }])}
                                    variant="outline"
                                    className="w-full h-14 border-dashed border-white/20 bg-white/5 hover:bg-white/10 rounded-2xl mt-4"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> HESAP EKLE
                                </Button>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleBack}
                                    className="h-20 w-1/4 bg-white/5 text-gray-400 text-xl font-black rounded-[2.5rem] border border-white/5 hover:bg-white/10"
                                >
                                    GERİ
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-1 h-20 bg-white text-black text-2xl font-black rounded-[2.5rem] shadow-2xl"
                                >
                                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : "KURULUMU TAMAMLA"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12 text-center"
                        >
                            <div className="relative inline-block">
                                <div className="h-40 w-40 bg-white rounded-[4rem] flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.3)] animate-bounce-slow">
                                    <CheckCircle2 className="h-20 w-20 text-black" />
                                </div>
                                <div className="absolute -top-4 -right-4 h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center border-8 border-[#050505]">
                                    <Sparkles className="h-8 w-8 text-black" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-7xl font-black tracking-tighter italic">Hazırsınız!</h1>
                                <p className="text-gray-400 text-2xl max-w-lg mx-auto leading-relaxed uppercase tracking-widest font-bold">
                                    {shopData.name} dijital zirveye yükseliyor.
                                </p>
                            </div>

                            <Button
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full h-24 bg-white text-black text-4xl font-black rounded-[3rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-indigo-500/20"
                            >
                                {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                                    <>SİSTEMİ AÇ <ChevronRight className="h-10 w-10 ml-4" /></>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sector Animation Overlay */}
            {step === "setup" && (
                <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-20 opacity-10 pointer-events-none">
                    <Smartphone className="h-32 w-32 animate-pulse" />
                    <Cpu className="h-32 w-32 animate-pulse delay-300" />
                    <Package className="h-32 w-32 animate-pulse delay-700" />
                </div>
            )}
        </div>
    );
}

