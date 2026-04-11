"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Code2, ShieldAlert } from "lucide-react";
import { updateShopThemeConfig, updateShopModules, updateShopStatus } from "@/lib/actions/superadmin-actions";

const AVAILABLE_MODULES = [
    { id: "SERVICE", label: "Servis Modülü" },
    { id: "STOCK", label: "Stok Modülü" },
    { id: "SALE", label: "Satış Modülü" },
    { id: "FINANCE", label: "Finans & Raporlar" },
    { id: "APPOINTMENT", label: "Ajanda & Randevu" },
    { id: "CRM", label: "Müşteri Yönetimi" },
    { id: "SUPPLIER", label: "Tedarikçi Takibi" },
    { id: "DEBT", label: "Veresiye Sistemi" },
    { id: "STAFF", label: "Personel Yönetimi" },
    { id: "NOTIFICATION", label: "Bildirim Sistemi" }
];

export function ConfigEditor({ shop, open, onOpenChange, onSaved }: {
    shop: any,
    open: boolean,
    onOpenChange: (o: boolean) => void,
    onSaved: () => void
}) {
    const [themeConfigText, setThemeConfigText] = useState(
        shop ? JSON.stringify(shop.themeConfig || {}, null, 2) : "{}"
    );
    const [enabledModules, setEnabledModules] = useState<string[]>(shop?.enabledModules || []);
    const [isActive, setIsActive] = useState<boolean>(shop?.isActive ?? true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingModules, setSavingModules] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const handleSaveThemeConfig = async () => {
        setJsonError(null);
        let parsedConfig;
        try {
            parsedConfig = JSON.parse(themeConfigText);
        } catch (e: any) {
            setJsonError("Geçersiz JSON formatı: " + e.message);
            return;
        }

        setSavingConfig(true);
        const res = await updateShopThemeConfig(shop.id, parsedConfig);
        setSavingConfig(false);
        if (res.success) {
            toast.success("Tema konfigürasyonu kaydedildi.");
            onSaved();
        } else {
            toast.error(res.error);
        }
    };

    const toggleStatus = async (checked: boolean) => {
        setIsActive(checked);
        setSavingStatus(true);
        const res = await updateShopStatus(shop.id, checked);
        setSavingStatus(false);
        if (res.success) {
            toast.success(`Dükkan durumu ${checked ? 'AKTİF' : 'PASİF'} olarak güncellendi.`);
            onSaved();
        } else {
            toast.error(res.error);
        }
    };

    if (!shop) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-black/95 border-white/10 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-white/10 bg-white/5">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Code2 className="h-5 w-5 text-blue-400" />
                        {shop.name} - Konfigürasyon
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* LEFTSIDE: FEATURE FLAGS */}
                    <div className="p-6 border-r border-white/10 bg-black/40">
                        <div className="mb-8 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4 flex items-center gap-2">
                                <ShieldAlert className="h-3 w-3" />
                                Kritik Ayarlar
                            </h3>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm cursor-pointer" htmlFor="shop-status">
                                    Dükkan Durumu
                                </Label>
                                <Switch
                                    id="shop-status"
                                    checked={isActive}
                                    onCheckedChange={toggleStatus}
                                    disabled={savingStatus}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
                                Pasif dükkanlara erişim engellenir.
                            </p>
                        </div>

                        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Aktif Modüller</h3>
                        <div className="space-y-4">
                            {AVAILABLE_MODULES.map(module => (
                                <div key={module.id} className="flex items-center justify-between">
                                    <Label className="text-xs cursor-pointer opacity-80" htmlFor={`switch-${module.id}`}>
                                        {module.label}
                                    </Label>
                                    <Switch
                                        id={`switch-${module.id}`}
                                        checked={enabledModules.includes(module.id)}
                                        onCheckedChange={(c) => {
                                            const newModules = c
                                                ? [...enabledModules, module.id]
                                                : enabledModules.filter(m => m !== module.id);
                                            setEnabledModules(newModules);
                                            updateShopModules(shop.id, newModules).then(res => {
                                                if (res.success) toast.success(`${module.label} güncellendi.`);
                                                else toast.error(res.error);
                                                onSaved();
                                            });
                                        }}
                                        disabled={savingModules}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHTSIDE: JSON EDITOR */}
                    <div className="md:col-span-2 flex flex-col p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">themeConfig JSON</h3>

                        <div className="flex-1 relative mb-4">
                            <textarea
                                value={themeConfigText}
                                onChange={e => {
                                    setThemeConfigText(e.target.value);
                                    setJsonError(null);
                                }}
                                className="w-full h-[400px] bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-xl font-mono text-sm border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y"
                                spellCheck={false}
                            />
                            {jsonError && (
                                <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-xs font-mono">
                                    {jsonError}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-white/5">
                                Kapat
                            </Button>
                            <Button
                                onClick={handleSaveThemeConfig}
                                disabled={savingConfig || !!jsonError}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                JSON Kaydet
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
