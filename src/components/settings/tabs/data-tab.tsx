"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, FileJson, FileSpreadsheet, Trash2, Archive, Loader2, AlertTriangle, Cloud, HardDrive, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { softResetAction, transactionResetAction, fullResetAction, backupToDriveAction, ensureGoogleDriveFolderAction, ExportCategory } from "@/lib/actions/data-management-actions";
import { Check, AlertCircle } from "lucide-react";

interface DataTabProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

const CATEGORIES = [
    { id: "customers", label: "Müşteriler" },
    { id: "products", label: "Ürünler & Stok" },
    { id: "categories", label: "Kategoriler" },
    { id: "services", label: "Servis Kayıtları" },
    { id: "sales", label: "Satışlar" },
    { id: "transactions", label: "Finansal İşlemler" },
    { id: "suppliers", label: "Tedarikçiler" },
    { id: "agenda", label: "Ajanda" },
    { id: "debts", label: "Veresiyeler" },
    { id: "financeAccounts", label: "Kasa & Hesaplar" },
    { id: "supplierTransactions", label: "Tedarikçi İşlemleri" },
    { id: "saleItems", label: "Satış Detayları" },
    { id: "serviceUsedParts", label: "Servis Kullanılan Parçalar" },
    { id: "inventoryMovements", label: "Stok Hareketleri" },
    { id: "serviceLogs", label: "Servis Geçmişi Logları" },
    { id: "returnTickets", label: "İadeler ve Arızalar" },
    { id: "reminders", label: "Hatırlatıcılar" },
    { id: "settings", label: "Sistem Ayarları" },
    { id: "receiptSettings", label: "Fiş Ayarları" }
];

export function DataTab({ formData, onChange, savingKeys }: DataTabProps) {
    const [exportingFormat, setExportingFormat] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>(CATEGORIES.map(c => c.id) as ExportCategory[]);

    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset Modal State
    const [resetModal, setResetModal] = useState<{ open: boolean, type: "soft" | "tx" | "full", countdown: number } | null>(null);

    const toggleCategory = (id: ExportCategory) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // ────────── EXPORT ──────────
    const handleExport = async (format: "json" | "xlsx") => {
        if (selectedCategories.length === 0) {
            toast.error("Lütfen en az bir kategori seçin.");
            return;
        }

        setExportingFormat(format);
        try {
            const res = await fetch(`/api/export?format=${format}&categories=${selectedCategories.join(",")}`);
            if (!res.ok) throw new Error("Dışa aktarma başarısız");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `basar-teknik-yedek-${new Date().toISOString().slice(0, 10)}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${format.toUpperCase()} dosyası indirildi.`);
        } catch (err: any) {
            toast.error(err.message || "Dışa aktarma sırasında bir hata oluştu.");
        } finally {
            setExportingFormat(null);
        }
    };

    // ────────── IMPORT ──────────
    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        toast.info("İçe aktarılıyor, lütfen bekleyin...");

        try {
            const res = await fetch("/api/import", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();

            if (!res.ok || result.error) throw new Error(result.error || "İçe aktarma başarısız");

            let msg = "Veriler başarıyla içe aktarıldı:\n";
            Object.entries(result.stats).forEach(([key, val]) => {
                msg += `${key}: ${val} kayıt\n`;
            });

            toast.success(msg);
        } catch (err: any) {
            toast.error(err.message || "İçe aktarma sırasında bir hata oluştu.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ────────── RESET MODAL LOGIC ──────────
    useEffect(() => {
        if (resetModal && resetModal.countdown > 0) {
            const timer = setTimeout(() => {
                setResetModal(prev => prev ? { ...prev, countdown: prev.countdown - 1 } : null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resetModal]);

    const executeReset = () => {
        if (!resetModal || resetModal.countdown > 0 || isPending) return;

        startTransition(async () => {
            try {
                const action =
                    resetModal.type === "soft" ? softResetAction :
                        resetModal.type === "tx" ? transactionResetAction :
                            fullResetAction;

                const result = await action();
                if (result.success) {
                    toast.success("Veritabanı temizliği başarıyla tamamlandı. Sayfa yenileniyor...");
                    setResetModal(null);

                    // Delay reload slightly to let toast be seen
                    setTimeout(() => {
                        window.location.href = "/dashboard";
                    }, 1500);
                } else {
                    toast.error("İşlem sırasında hata oluştu.");
                }
            } catch (err) {
                toast.error("Beklenmeyen bir hata oluştu.");
            }
        });
    };

    const isAutoBackup = formData.autoBackupEnabled === "true";
    const isBackupSaving = savingKeys.has("autoBackupEnabled");
    const isDriveSaving = savingKeys.has("googleDriveEnabled");

    return (
        <div className="space-y-12 pb-6">

            {/* ────────── IMPORT / EXPORT ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Export Section */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">Veri Dışa Aktar</Label>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Seçili modülleri indirerek manuel yedeğini alın.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] shadow-sm">
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {CATEGORIES.map(c => {
                                const categoryId = c.id as ExportCategory;
                                const active = selectedCategories.includes(categoryId);
                                return (
                                    <label
                                        key={categoryId}
                                        className="flex items-center gap-2 cursor-pointer group"
                                        onClick={() => toggleCategory(categoryId)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors",
                                            active ? "bg-blue-500 border-blue-500" : "border-slate-300 dark:border-border/80 bg-transparent group-hover:border-slate-500"
                                        )}>
                                            {active && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <span className={cn("text-xs font-medium", active ? "text-slate-900 dark:text-white" : "text-muted-foreground/80 dark:text-muted-foreground")}>{c.label}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleExport("json")}
                                disabled={!!exportingFormat}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all group shadow-sm",
                                    "border-slate-100 dark:border-[#222] bg-slate-50 dark:bg-[#151515] hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-900 dark:text-white text-xs font-semibold"
                                )}
                            >
                                {exportingFormat === "json" ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <FileJson className="w-4 h-4 text-blue-400" />}
                                JSON İndir
                            </button>
                            <button
                                onClick={() => handleExport("xlsx")}
                                disabled={!!exportingFormat}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all group shadow-sm",
                                    "border-slate-100 dark:border-[#222] bg-slate-50 dark:bg-[#151515] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-900 dark:text-white text-xs font-semibold"
                                )}
                            >
                                {exportingFormat === "xlsx" ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                                Excel İndir
                            </button>
                        </div>
                    </div>
                </div>

                {/* Import & Backup Auto Section */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-semibold text-slate-900 dark:text-white">Veri İçe Aktar</Label>
                            <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">JSON veya Excel formatındaki verileri sisteme yükleyin.</p>
                        </div>

                        <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-border/80 bg-white dark:bg-[#111] hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors relative cursor-pointer group shadow-sm" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Dosya seçin veya sürükleyin</p>
                                    <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Yalnızca .json, .csv veya .xlsx</p>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv,.xlsx" onChange={handleImportFile} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider opacity-50">Yedekleme ve Depolama</Label>

                        {/* Download Local Backup (New requested feature) */}
                        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between group hover:border-blue-500/40 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <Archive className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-900 dark:text-white font-semibold">Şimdi Manuel Yedek Al</p>
                                    <p className="text-[11px] text-muted-foreground/80 dark:text-muted-foreground">Tüm verileri içeren tam yedeği bilgisayara indir.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleExport("json")}
                                disabled={!!exportingFormat}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {exportingFormat === "json" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                Yedeği İndir
                            </button>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <HardDrive className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-slate-900 dark:text-white font-medium">Günlük Otomatik Yedek (Local)</p>
                                    <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Her gün gece alınan yedekler sistemde saklanır.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isBackupSaving && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                <Switch
                                    checked={isAutoBackup}
                                    onCheckedChange={(checked) => onChange("autoBackupEnabled", checked ? "true" : "false", true)}
                                    disabled={isBackupSaving}
                                />
                            </div>
                        </div>

                        <div className={cn(
                            "p-4 rounded-xl border transition-all space-y-4",
                            formData.googleDriveEnabled === "true"
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-slate-200 dark:border-[#222] bg-white dark:bg-[#111]"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Cloud className={cn("w-5 h-5", formData.googleDriveEnabled === "true" ? "text-emerald-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">Google Drive Yedekleme</p>
                                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Yedekleri otomatik olarak Drive hesabınıza yükleyin.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isDriveSaving && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                                    <Switch
                                        checked={formData.googleDriveEnabled === "true"}
                                        onCheckedChange={async (checked) => {
                                            onChange("googleDriveEnabled", checked ? "true" : "false", true);
                                            if (checked) {
                                                const res = await ensureGoogleDriveFolderAction();
                                                if (res.success) {
                                                    onChange("googleDriveFolderId", res.folderId, false);
                                                    toast.success("Google Drive klasörü başarıyla bağlandı.");
                                                } else {
                                                    toast.error(res.error);
                                                }
                                            }
                                        }}
                                        disabled={isDriveSaving}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                            </div>

                            {formData.googleDriveEnabled === "true" && (
                                <div className="grid grid-cols-1 gap-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-emerald-500/10">
                                        {formData.googleDriveFolderId ? (
                                            <>
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-emerald-600/80 uppercase">Klasör Hazır</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">{formData.googleDriveFolderId}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                <p className="text-[10px] font-bold text-amber-600/80 uppercase">Klasör Oluşturuluyor...</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const res = await backupToDriveAction();
                                                if (res.success) toast.success(res.message);
                                                else toast.error(res.error);
                                            }}
                                            className="flex-1 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <Cloud className="w-3 h-3" /> ŞİMDİ DRIVE'A YEDEKLE
                                        </button>
                                        <button
                                            onClick={() => ensureGoogleDriveFolderAction()}
                                            className="px-4 py-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-border/50 text-slate-600 dark:text-muted-foreground text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-all"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-center text-muted-foreground px-2 italic">
                                        Not: Google Drive ișlemleri için Google ile giriș yapmıș olmanız gerekir.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ────────── SYSTEM RESET ────────── */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-[#222]">
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-900 dark:text-white">Sistem Sıfırlama ve Temizlik</Label>
                    <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Performansı artırmak veya sistemi yeni kullanıma hazırlamak için araçlar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] flex flex-col items-start gap-4 shadow-sm">
                        <div className="flex items-center gap-3 w-full">
                            <Archive className="text-yellow-500 w-5 h-5" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Hafif Temizlik</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground leading-relaxed flex-1">
                            Sadece bildirimleri, AI uyarılarını ve tamamlanmış ajanda etkinliklerini siler. Düzenli temizlik için idealdir.
                        </p>
                        <button onClick={() => setResetModal({ open: true, type: "soft", countdown: 3 })} className="w-full py-2 rounded-lg bg-slate-100 dark:bg-[#222] hover:bg-slate-200 dark:hover:bg-[#333] text-xs font-semibold text-slate-900 dark:text-white transition-colors">
                            Temizliği Başlat
                        </button>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#111] flex flex-col items-start gap-4 shadow-sm">
                        <div className="flex items-center gap-3 w-full">
                            <RefreshCw className="text-orange-500 w-5 h-5" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">İşlemsel Sıfırlama</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground leading-relaxed flex-1">
                            Tüm satış, servis ve ödeme geçmişini siler. Müşteriler ve stok ürünleri <strong className="text-slate-900 dark:text-foreground">korunur.</strong> Yeni bir döneme başlarken kullanılır.
                        </p>
                        <button onClick={() => setResetModal({ open: true, type: "tx", countdown: 3 })} className="w-full py-2 rounded-lg bg-slate-100 dark:bg-[#222] hover:bg-orange-500/20 hover:text-orange-400 border border-transparent hover:border-orange-500/30 text-xs font-semibold text-slate-900 dark:text-white transition-colors">
                            İşlemleri Sıfırla
                        </button>
                    </div>

                    <div className="p-5 rounded-xl border border-red-500/20 bg-white dark:bg-[#111] flex flex-col items-start gap-4 shadow-[0_0_15px_rgba(239,68,68,0.05)_inset] shadow-sm">
                        <div className="flex items-center gap-3 w-full">
                            <Trash2 className="text-red-500 w-5 h-5" />
                            <span className="text-sm font-bold text-red-500">Tam Sıfırlama</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground leading-relaxed flex-1">
                            Sistemdeki her şeyi siler (Müşteriler, ürünler, tedarikçiler). Yalnızca sistem tarafından sağlanan varsayılan kategoriler korunur.
                        </p>
                        <button onClick={() => setResetModal({ open: true, type: "full", countdown: 3 })} className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-xs font-semibold text-red-500 transition-colors">
                            Tümünü Sil
                        </button>
                    </div>
                </div>
            </div>

            {/* ────────── CONFIRMATION MODAL ────────── */}
            {resetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-card/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 slide-in-from-bottom-4">

                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center animate-pulse",
                                resetModal.type === "soft" ? "bg-yellow-500/20 text-yellow-500" :
                                    resetModal.type === "tx" ? "bg-orange-500/20 text-orange-500" :
                                        "bg-red-500/20 text-red-500"
                            )}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {resetModal.type === "soft" ? "Hafif Temizlik" :
                                        resetModal.type === "tx" ? "İşlemsel Sıfırlama" : "Sistemi Sıfırla"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2">Bu işlem geri alınamaz.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#151515] rounded-xl p-4 border border-slate-200 dark:border-[#222]">
                            <p className="text-xs font-bold text-slate-700 dark:text-foreground mb-2">Şu kayıtlar kalıcı olarak silinecek:</p>
                            <ul className="text-xs text-muted-foreground/80 dark:text-muted-foreground list-disc list-inside space-y-1">
                                {resetModal.type === "soft" && (
                                    <><li>Tüm okunmuş bildirimler</li><li>Süresi dolmuş yapay zeka uyarıları</li><li>Tamamlanmış ajanda etkinlikleri</li></>
                                )}
                                {resetModal.type === "tx" && (
                                    <><li>Tüm servis biletleri ve durum geçmişi</li><li>Tüm satış fişleri ve kalemleri</li><li>Kasa giriş/çıkış işlemleri</li></>
                                )}
                                {resetModal.type === "full" && (
                                    <><li>Müşteriler, ürünler ve tedarikçiler</li><li>Tüm finansal veriler ve servisler</li><li>Varsayılanlar hariç her şey</li></>
                                )}
                            </ul>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setResetModal(null)}
                                disabled={isPending}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-[#333] text-sm font-semibold text-slate-600 dark:text-foreground hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-all disabled:opacity-50"
                            >
                                İptal Et
                            </button>
                            <button
                                onClick={executeReset}
                                disabled={resetModal.countdown > 0 || isPending}
                                className={cn(
                                    "flex-1 flex justify-center items-center py-3 rounded-xl text-sm font-semibold transition-all shadow-lg",
                                    resetModal.countdown > 0 ? "bg-[#222] text-muted-foreground/80 cursor-not-allowed" :
                                        resetModal.type === "soft" ? "bg-yellow-500 hover:bg-yellow-600 text-black shadow-yellow-500/20" :
                                            resetModal.type === "tx" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20" :
                                                "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                                )}
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                    resetModal.countdown > 0 ? `Emin misiniz? (${resetModal.countdown})` : "Evet, Onaylıyorum"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
