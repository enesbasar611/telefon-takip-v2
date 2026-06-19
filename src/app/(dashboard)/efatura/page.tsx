"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, FileText, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getShopEdmSettings } from "@/lib/actions/edm-settings-actions";
import { EDMSetupForm } from "@/components/edm/edm-setup-form";
import { EDMDashboard } from "@/components/edm/edm-dashboard";
import { getShop } from "@/lib/actions/setting-actions";

export default function EfaturaPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [edmConfigured, setEdmConfigured] = useState<boolean | null>(null);
    const [isModuleActive, setIsModuleActive] = useState<boolean | null>(null);

    async function checkStatus() {
        setLoading(true);
        try {
            const [settings, shop] = await Promise.all([
                getShopEdmSettings(),
                getShop()
            ]);

            setIsModuleActive(shop?.isEInvoiceEnabled || false);
            setEdmConfigured(!!(settings?.username && settings?.hasPassword));
        } catch (error) {
            console.error("Status check failed:", error);
            setIsModuleActive(false);
            setEdmConfigured(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkStatus();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
                    <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">SaaS Modülü Hazırlanıyor...</p>
            </div>
        );
    }

    // Modül aktif değilse (Super Admin tarafından kapatılmışsa)
    if (isModuleActive === false) {
        const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="text-center max-w-lg">
                    <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <ShieldAlert className="h-12 w-12 text-red-500/50" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">E-Fatura Modülü Kapalı</h2>
                    <p className="text-muted-foreground/80 text-lg leading-relaxed mb-8">
                        {isSuperAdmin
                            ? "Bu dükkanın e-fatura lisansı aktif değil. Lütfen admin panelinden modülü aktifleştirin."
                            : "E-Fatura modülünü kullanmak yetkiniz bulunmuyor veya modül dükkanınız için aktif edilmemiş. Lütfen yöneticinizle iletişime geçin."}
                    </p>
                    {isSuperAdmin && (
                        <Button
                            onClick={() => router.push("/admin/shops")}
                            className="rounded-2xl bg-primary px-10 py-7 h-auto text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
                        >
                            Dükkan Ayarlarına Git
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Modül aktif ama konfigürasyon yoksa (İlk kurulum)
    if (edmConfigured === false) {
        return <EDMSetupForm onSuccess={() => checkStatus()} />;
    }

    // Her şey tamam, Dashboard göster
    return (
        <div className="py-4">
            <EDMDashboard />
        </div>
    );
}
