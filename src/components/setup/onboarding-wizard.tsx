"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    Globe
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    saveOnboardingModules,
    saveOnboardingIntegrations,
    saveOnboardingFinance,
    finishOnboarding,
    resetShopData
} from "@/lib/actions/onboarding-actions";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface OnboardingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    shopName: string;
}

type Step = "modules" | "integrations" | "finance" | "success";

const MODULES = [
    { id: "SALE", name: "POS & Satış", icon: CreditCard, desc: "Hızlı satış ve ödeme takibi" },
    { id: "SERVICE", name: "Teknik Servis", icon: Smartphone, desc: "Arıza kaydı ve onarım yönetimi" },
    { id: "STOCK", name: "Stok & Envanter", icon: Package, desc: "Ürün ve parça stok takibi" },
    { id: "FINANCE", name: "Finans & Gider", icon: Wallet, desc: "Kasa, banka ve cari hesaplar" },
];

// Sector-aware loading messages — copywriting magic ✨
const LOADING_MESSAGES: Record<string, string[]> = {
    terzi: ["Makaslar bileniyor...", "Dikim masası hazırlanıyor...", "Kumaşlar seçiliyor...", "İplikler hazırlanıyor..."],
    "oto-yikama": ["Köpükler hazırlandı...", "Peronlar ayrılıyor...", "Havlular katlanıyor...", "Basınçlı su ayarlanıyor..."],
    elektrikci: ["Kablolar çekiliyor...", "Sigorta kutusu açılıyor...", "Voltaj ölçülüyor..."],
    "bilgisayar-serv": ["BIOS kontrol ediliyor...", "RAM slotları taranıyor...", "Sistem restore başlatılıyor..."],
    kuafor: ["Makaslar sterilize ediliyor...", "Renk karıştırılıyor...", "Müşteri koltuğu hazırlanıyor..."],
    "oto-servis": ["Motor kapağı açılıyor...", "Yağ seviyeleri kontrol ediliyor...", "Lift kaldırılıyor..."],
    lokanta: ["Malzemeler hazırlanıyor...", "Ocak ateşleniyor...", "Menü oluşturuluyor..."],
    default: ["Sisteminiz hazırlanıyor...", "Yapay zeka düşünüyor...", "Sektörünüz analiz ediliyor...", "Neredeyse bitti..."]
};

function getLoadingMessages(sectorValue: string): string[] {
    const lower = sectorValue.toLowerCase()
        .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i")
        .replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u");
    for (const [key, msgs] of Object.entries(LOADING_MESSAGES)) {
        if (lower.includes(key.replace("-", "").slice(0, 5))) return msgs;
    }
    return LOADING_MESSAGES.default;
}

export function OnboardingWizard({ isOpen, onClose, shopName }: OnboardingWizardProps) {
    const [step, setStep] = useState<Step>("modules");
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");

    // Step 1: Modules & Industry
    const [selectedModules, setSelectedModules] = useState<string[]>(["SERVICE", "STOCK", "SALE", "FINANCE"]);
    const [sector, setSector] = useState("");

    // Step 2: Integrations
    const [whatsappConnected, setWhatsappConnected] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [useDefaultGemini, setUseDefaultGemini] = useState(true);

    // Step 3: Finance
    const [accounts, setAccounts] = useState<any[]>([
        { id: "1", name: "Merkez Kasa", type: "CASH", balance: 0, isDefault: true }
    ]);

    // Cycling loading message animation
    useEffect(() => {
        if (!loading || step !== "modules") { setLoadingMessage(""); return; }
        const messages = getLoadingMessages(sector);
        let idx = 0;
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => {
            idx = (idx + 1) % messages.length;
            setLoadingMessage(messages[idx]);
        }, 900);
        return () => clearInterval(interval);
    }, [loading, step, sector]);

    const handleNext = async () => {
        setLoading(true);
        try {
            if (step === "modules") {
                if (!sector.trim()) {
                    toast.error("Lütfen sektörünüzü belirtin.");
                    setLoading(false);
                    return;
                }
                const res = await saveOnboardingModules(selectedModules, sector);
                if (!res.success) {
                    toast.error(res.error || "İşlem başarısız oldu.");
                    setLoading(false);
                    return;
                }
                setStep("integrations");
            } else if (step === "integrations") {
                const res = await saveOnboardingIntegrations({
                    whatsappConnected,
                    geminiApiKey: useDefaultGemini ? undefined : geminiKey
                });
                if (!res.success) {
                    toast.error(res.error || "İşlem başarısız oldu.");
                    setLoading(false);
                    return;
                }
                setStep("finance");
            } else if (step === "finance") {
                const res1 = await saveOnboardingFinance(accounts);
                if (!res1.success) {
                    toast.error(res1.error || "İşlem başarısız oldu.");
                    setLoading(false);
                    return;
                }
                const res2 = await finishOnboarding();
                if (res2.success) {
                    sessionStorage.setItem("just_finished_onboarding", "true");
                    setStep("success");
                } else {
                    toast.error(res2.error || "İşlem başarısız oldu.");
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Beklenmeyen bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const addAccount = () => {
        setAccounts([...accounts, { id: Math.random().toString(), name: "", type: "BANK", balance: 0, limit: 0, billingDay: 1 }]);
    };

    const removeAccount = (id: string) => {
        setAccounts(accounts.filter(a => a.id !== id));
    };

    const updateAccount = (id: string, updates: any) => {
        setAccounts(accounts.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const handleReset = async () => {
        if (confirm("Tüm verileriniz silinecek ve sıfırdan başlanacak. Emin misiniz?")) {
            setLoading(true);
            const res = await resetShopData();
            if (res.success) {
                toast.success("Veriler sıfırlandı. Yeniden başlıyoruz.");
                window.location.reload();
            } else {
                toast.error(res.error);
                setLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => step !== "success" && !loading && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden bg-black/60 backdrop-blur-3xl border-white/10 p-0 text-white shadow-2xl">
                <div className="flex h-full flex-col relative">
                    {/* Background Animation */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse delay-700" />
                    </div>

                    <div className="relative z-10 p-8 pt-10">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-8 cursor-pointer" onClick={handleReset}>
                            <div className="flex gap-2">
                                {["modules", "integrations", "finance", "success"].map((s, i) => (
                                    <div
                                        key={s}
                                        className={`h-1 rounded-full transition-all duration-500 ${["modules", "integrations", "finance", "success"].indexOf(step) >= i
                                            ? "w-8 bg-white"
                                            : "w-4 bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 px-3 py-1 uppercase tracking-widest font-bold">
                                Onboarding v2.0
                            </Badge>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === "modules" && (
                                <motion.div
                                    key="modules"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-bold tracking-tight">Hoş Geldiniz, {shopName}</h1>
                                        <p className="text-gray-400 text-lg">İşletme sektörünüzü ve kullanmak istediğiniz modülleri seçin.</p>
                                    </div>

                                    <div className="space-y-2 pb-2 border-b border-white/10 mb-4">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Sektörünüz / İş Alanınız</Label>
                                        <Input
                                            placeholder="Örn: Telefoncu, Terzi, Elektrikçi..."
                                            value={sector}
                                            onChange={(e) => setSector(e.target.value)}
                                            className="bg-black/40 border-white/10 rounded-2xl h-14 text-lg focus:border-white transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {MODULES.map((mod) => (
                                            <button
                                                key={mod.id}
                                                onClick={() => {
                                                    if (selectedModules.includes(mod.id)) {
                                                        setSelectedModules(selectedModules.filter(id => id !== mod.id));
                                                    } else {
                                                        setSelectedModules([...selectedModules, mod.id]);
                                                    }
                                                }}
                                                className={`p-6 rounded-3xl border transition-all duration-300 text-left group relative overflow-hidden ${selectedModules.includes(mod.id)
                                                    ? "bg-white/10 border-white/20 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]"
                                                    : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                                    }`}
                                            >
                                                <div className="relative z-10 flex flex-col gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${selectedModules.includes(mod.id) ? "bg-white text-black" : "bg-white/5 text-white"
                                                        }`}>
                                                        <mod.icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{mod.name}</h3>
                                                        <p className="text-sm text-gray-400 leading-tight mt-1">{mod.desc}</p>
                                                    </div>
                                                </div>
                                                {selectedModules.includes(mod.id) && (
                                                    <motion.div
                                                        layoutId="check"
                                                        className="absolute top-4 right-4"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === "integrations" && (
                                <motion.div
                                    key="integrations"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-bold tracking-tight">Akıllı Entegrasyonlar</h1>
                                        <p className="text-gray-400 text-lg">Sisteminizi dış dünya ile bağlayın.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* WhatsApp Section */}
                                        <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between group">
                                            <div className="flex gap-4 items-center">
                                                <div className="h-16 w-16 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                                    <MessageSquare className="h-8 w-8 text-black" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">WhatsApp Business</h3>
                                                    <p className="text-emerald-300 text-sm opacity-80">Müsterilerinize otomatik mesaj gönderin.</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setWhatsappConnected(!whatsappConnected)}
                                                className={`rounded-2xl h-12 px-8 font-bold transition-all ${whatsappConnected
                                                    ? "bg-emerald-400 text-black hover:bg-emerald-300"
                                                    : "bg-white text-black hover:bg-gray-200"
                                                    }`}
                                            >
                                                {whatsappConnected ? "BAĞLANDI" : "BAĞLA"}
                                            </Button>
                                        </div>

                                        {/* Gemini AI Section */}
                                        <div className="p-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-4 items-center">
                                                    <div className="h-16 w-16 rounded-3xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                                                        <Cpu className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold">Gemini AI (Zeka)</h3>
                                                        <p className="text-indigo-300 text-sm opacity-80">AI ile otomatik ürün ve kategori yönetimi.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold opacity-50">VARSAYILAN</span>
                                                    <Switch
                                                        checked={useDefaultGemini}
                                                        onCheckedChange={setUseDefaultGemini}
                                                    />
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {!useDefaultGemini && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="pt-4 overflow-hidden"
                                                    >
                                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Gemini API Key</Label>
                                                        <Input
                                                            type="password"
                                                            placeholder="AI Anahtarınızı Buraya Yapıştırın..."
                                                            value={geminiKey}
                                                            onChange={(e) => setGeminiKey(e.target.value)}
                                                            className="bg-black/40 border-indigo-500/20 rounded-2xl h-12 focus:border-indigo-500"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === "finance" && (
                                <motion.div
                                    key="finance"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 pb-2"
                                >
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-bold tracking-tight">Finansal Tanımlama</h1>
                                        <p className="text-gray-400 text-lg">Banka ve kasalarınızı belirleyin.</p>
                                    </div>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                                        {accounts.map((acc, index) => (
                                            <div key={acc.id} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 group animate-in slide-in-from-right-4 duration-300">
                                                <div className="grid grid-cols-12 gap-4 items-end">
                                                    <div className="col-span-4 space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hesap Adı</Label>
                                                        <Input
                                                            value={acc.name}
                                                            placeholder="Örn: Garanti Bankası"
                                                            onChange={(e) => updateAccount(acc.id, { name: e.target.value })}
                                                            className="bg-black/20 border-white/5 rounded-2xl h-12"
                                                        />
                                                    </div>
                                                    <div className="col-span-3 space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tür</Label>
                                                        <Select value={acc.type} onValueChange={(val) => updateAccount(acc.id, { type: val })}>
                                                            <SelectTrigger className="bg-black/20 border-white/5 rounded-2xl h-12">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-black border-white/10 text-white">
                                                                <SelectItem value="CASH">Nakit Kasa</SelectItem>
                                                                <SelectItem value="BANK">Banka Hesabı</SelectItem>
                                                                <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-3 space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bakiye</Label>
                                                        <Input
                                                            type="number"
                                                            value={acc.balance}
                                                            onChange={(e) => updateAccount(acc.id, { balance: parseFloat(e.target.value) })}
                                                            className="bg-black/20 border-white/5 rounded-2xl h-12"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-center pb-1">
                                                        {acc.isDefault ? (
                                                            <Badge className="bg-emerald-500 text-black font-bold h-10 px-4 rounded-xl">VARSAYILAN</Badge>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeAccount(acc.id)}
                                                                className="h-12 w-12 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {acc.type === "CREDIT_CARD" && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="col-span-12 grid grid-cols-2 gap-4 mt-2"
                                                        >
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kart Limiti</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={acc.limit}
                                                                    onChange={(e) => updateAccount(acc.id, { limit: parseFloat(e.target.value) })}
                                                                    className="bg-black/20 border-white/5 rounded-2xl h-12"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hesap Kesim Günü</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1" max="31"
                                                                    value={acc.billingDay}
                                                                    onChange={(e) => updateAccount(acc.id, { billingDay: parseInt(e.target.value) })}
                                                                    className="bg-black/20 border-white/5 rounded-2xl h-12"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={addAccount}
                                        variant="outline"
                                        className="w-full h-12 rounded-2xl border-dashed border-white/20 bg-white/5 hover:bg-white/10 group"
                                    >
                                        <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                                        YENİ HESAP EKLE
                                    </Button>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 flex flex-col items-center justify-center space-y-8 text-center"
                                >
                                    <div className="relative">
                                        <div className="h-32 w-32 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)]">
                                            <CheckCircle2 className="h-16 w-16 text-black" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-black"
                                        >
                                            <Sparkles className="h-6 w-6 text-black" />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-3">
                                        <h1 className="text-5xl font-bold tracking-tighter italic">Harika İş Çıkardın!</h1>
                                        <p className="text-gray-400 text-xl max-w-[400px]">
                                            Sistemin her şeyi hazır. Artık işletmeni zirveye taşımaya başlayabilirsin.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => window.location.reload()}
                                        className="w-full h-16 rounded-[2rem] bg-white text-black text-xl font-bold hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        DASHBOARD'A GİT
                                        <ChevronRight className="ml-2 h-6 w-6" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {step !== "success" && (
                            <div className="flex gap-4 pt-10 border-t border-white/10 mt-8">
                                <Button
                                    variant="ghost"
                                    disabled={loading || step === "modules"}
                                    onClick={() => step === "integrations" ? setStep("modules") : setStep("integrations")}
                                    className="h-16 px-8 rounded-2xl font-bold text-gray-500 hover:bg-white/5"
                                >
                                    GERİ
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-1 h-16 rounded-[2rem] bg-white text-black font-extrabold text-lg tracking-wide hover:bg-gray-200 shadow-xl shadow-white/10 group overflow-hidden"
                                >
                                    <AnimatePresence mode="wait">
                                        {loading && step === "modules" && loadingMessage ? (
                                            <motion.span
                                                key={loadingMessage}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.25 }}
                                                className="flex items-center gap-2 text-sm font-semibold"
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                                {loadingMessage}
                                            </motion.span>
                                        ) : loading ? (
                                            <motion.span key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </motion.span>
                                        ) : (
                                            <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                                {step === "finance" ? "TAMAMLA" : "SONRAKİ ADIM"}
                                                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
