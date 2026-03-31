"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShopOnboarding } from "@/lib/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, Phone, Wallet, GraduationCap, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession, SessionProvider } from "next-auth/react";

function OnboardingForm() {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
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
                await update({ shopId: result.shopId });
                router.push("/");
                router.refresh();
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

            <Card className="w-full max-w-lg bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl relative z-10">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="space-y-1">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                            <GraduationCap className="w-6 h-6 text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Hoş Geldiniz</CardTitle>
                        <CardDescription className="text-white/60">
                            Sistemi kullanmaya başlamak için dükkanınızı kurun.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white/80">Dükkan Adı</Label>
                            <div className="relative">
                                <Store className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                <Input
                                    id="name"
                                    placeholder="Örn: Başar Teknik"
                                    className="pl-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-white/80">Telefon</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                    <Input
                                        id="phone"
                                        placeholder="05xx..."
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="balance" className="text-white/80">Açılış Kasası</Label>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                    <Input
                                        id="balance"
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                                        required
                                        value={formData.openingBalance}
                                        onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-white/80">Adres</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                                <Input
                                    id="address"
                                    placeholder="Dükkan açık adresi..."
                                    className="pl-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-3">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? "Kuruluyor..." : "Dükkanı Oluştur ve Başla"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-white/40 hover:text-white/80 hover:bg-white/5"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Farklı bir hesapla giriş yap / Çıkış
                        </Button>
                    </CardFooter>
                </form>
            </Card>
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
