"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
    Building2,
    PhoneCall,
    Mail,
    Settings,
    Hash,
    Landmark,
    HeadphonesIcon,
    Smartphone,
    Save,
    Loader2,
    FolderOpen
} from "lucide-react";
import { updateSupplier } from "@/lib/actions/supplier-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const supplierSchema = z.object({
    name: z.string().min(2, "Firma adı zorunludur"),
    taxInfo: z.string().optional(),
    contact: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Geçerli e-posta giriniz").optional().or(z.literal("")),
    address: z.string().optional(),
    category: z.string().optional(),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    trustScore: z.number().min(0).max(10),
    notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const CATEGORIES = [
    { id: "Yedek Parça", icon: Settings, color: "text-orange-400", bg: "bg-orange-400/10" },
    { id: "Aksesuar", icon: HeadphonesIcon, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: "Cihaz", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-400/10" },
    { id: "Diğer", icon: Hash, color: "text-slate-400", bg: "bg-slate-400/10" },
];

const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return `+90 ${cleaned}`;
    if (cleaned.length <= 5) return `+90 (${cleaned.slice(2, 5)}`;
    if (cleaned.length <= 8) return `+90 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}`;
    if (cleaned.length <= 10) return `+90 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)}`;
    return `+90 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
};

const formatIban = (val: string) => {
    let cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleaned.length > 0 && !cleaned.startsWith("TR")) {
        cleaned = "TR" + cleaned;
    }
    let formatted = "";
    for (let i = 0; i < cleaned.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += " ";
        formatted += cleaned[i];
    }
    return formatted.slice(0, 32);
};

interface EditSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
}

export function EditSupplierModal({ isOpen, onClose, supplier }: EditSupplierModalProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: supplier?.name || "",
            taxInfo: supplier?.taxNumber && supplier?.taxOffice ? `${supplier.taxNumber} / ${supplier.taxOffice}` : supplier?.taxNumber || "",
            contact: supplier?.contact || "",
            phone: supplier?.phone || "",
            email: supplier?.email || "",
            address: supplier?.address || "",
            category: supplier?.category || "Aksesuar",
            bankName: supplier?.bankName || "",
            iban: supplier?.iban || "",
            trustScore: (supplier?.trustScore || 85) / 10,
            notes: supplier?.notes || "",
        }
    });

    useEffect(() => {
        if (supplier) {
            reset({
                name: supplier.name,
                taxInfo: supplier.taxNumber && supplier.taxOffice ? `${supplier.taxNumber} / ${supplier.taxOffice}` : supplier.taxNumber || "",
                contact: supplier.contact,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                category: supplier.category || "Aksesuar",
                bankName: supplier.bankName,
                iban: supplier.iban,
                trustScore: (supplier.trustScore || 85) / 10,
                notes: supplier.notes,
            });
        }
    }, [supplier, reset]);

    const trustScore = watch("trustScore");
    const selectedCategory = watch("category");

    const onSubmit = async (data: SupplierFormValues) => {
        startTransition(async () => {
            const [taxNum, ...officeParts] = (data.taxInfo || "").split("/");
            const taxNumber = taxNum?.trim() || null;
            const taxOffice = officeParts.join("/").trim() || null;
            const score = Math.round(data.trustScore * 10);

            const result = await updateSupplier(supplier.id, {
                name: data.name,
                contact: data.contact || null,
                phone: data.phone || null,
                email: data.email || null,
                address: data.address || null,
                category: data.category || null,
                bankName: data.bankName || null,
                iban: data.iban || null,
                notes: data.notes || null,
                trustScore: score,
                taxNumber,
                taxOffice,
            });

            if (result.success) {
                toast.success("Tedarikçi bilgileri güncellendi.");
                onClose();
            } else {
                toast.error(result.error || "Bir hata oluştu.");
            }
        });
    };

    const getRiskLevel = (score: number) => {
        if (score >= 8.5) return { label: 'Stratejik Ortak', color: 'bg-blue-500', bars: 4 };
        if (score >= 6.0) return { label: 'Güvenilir Tedarikçi', color: 'bg-emerald-500', bars: 3 };
        if (score >= 4.0) return { label: 'Standart', color: 'bg-yellow-500', bars: 2 };
        return { label: 'Riskli', color: 'bg-rose-500', bars: 1 };
    };

    const risk = getRiskLevel(trustScore || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-[#0B101B] border-white/5 p-0 overflow-hidden shadow-2xl [&>button]:hidden">
                <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <DialogTitle className="text-xl font-black text-white flex items-center gap-3">
                        <Settings className="h-5 w-5 text-blue-500" />
                        Tedarikçi Bilgilerini Düzenle
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[90vh] sm:h-[80vh] max-h-[850px]">

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* LEFT COLUMN */}
                            <div className="flex-1 space-y-6">

                                {/* Identity & Contact Card */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                            <FolderOpen className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <h3 className="text-sm font-black text-white">Kurumsal Kimlik & İletişim</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">FİRMA ADI</Label>
                                            <Input id="name" {...register("name")} placeholder="Örn: Teknoloji Lojistik A.Ş." className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500" />
                                            {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="taxInfo" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">VERGİ NO / DAİRESİ</Label>
                                            <Input id="taxInfo" {...register("taxInfo")} placeholder="1234567890 / Boğaziçi VD" className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">YETKİLİ KİŞİ</Label>
                                            <Input id="contact" {...register("contact")} placeholder="Ad Soyad" className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">TELEFON</Label>
                                            <div className="relative">
                                                <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                <Controller
                                                    name="phone"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            type="tel"
                                                            placeholder="+90 (___) ___ __ __"
                                                            className="pl-9 bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                                                            {...field}
                                                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-5">
                                        <Label htmlFor="email" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">E-POSTA ADRESİ</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input id="email" type="email" {...register("email")} placeholder="iletisim@tedarikci.com" className="pl-9 bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-[10px] font-black tracking-wider text-slate-500 uppercase">FİRMA AÇIK ADRESİ</Label>
                                        <Textarea
                                            id="address"
                                            {...register("address")}
                                            placeholder="Sokak, Mahalle, İlçe/İl detaylarını giriniz..."
                                            className="bg-white/[0.03] border-white/5 min-h-[80px] rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Sub Panels */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                                    {/* Category */}
                                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                                <Building2 className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white">Tedarik Kategorisi</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {CATEGORIES.map((cat) => {
                                                const Icon = cat.icon;
                                                const isSelected = selectedCategory === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setValue("category", cat.id)}
                                                        className={cn(
                                                            "flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold transition-all border",
                                                            isSelected
                                                                ? "bg-[#1E293B] border-blue-500/50 text-blue-400 shadow-md shadow-blue-500/10"
                                                                : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-white"
                                                        )}
                                                    >
                                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                                        {cat.id}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bank Details */}
                                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                <Landmark className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white">Banka Bilgileri</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                {...register("bankName")}
                                                placeholder="Banka Adı"
                                                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                                            />
                                            <Controller
                                                name="iban"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        placeholder="IBAN (TR...)"
                                                        className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus-visible:ring-blue-500 uppercase font-mono"
                                                        {...field}
                                                        onChange={(e) => field.onChange(formatIban(e.target.value))}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                </div>

                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="w-full lg:w-[340px] shrink-0 space-y-6">

                                {/* Scoring */}
                                <div className="rounded-2xl bg-[#0F172A]/50 border border-white/[0.05] p-5">
                                    <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase mb-4">MÜKEMMELLİYET PUANLAMASI</h3>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-300">Güvenilirlik Skoru</span>
                                        <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                            Aktif: {trustScore?.toFixed(1) || "0.0"}
                                        </span>
                                    </div>

                                    <Controller
                                        name="trustScore"
                                        control={control}
                                        render={({ field }) => (
                                            <Slider
                                                defaultValue={[field.value]}
                                                max={10}
                                                step={0.1}
                                                onValueChange={(vals: number[]) => field.onChange(vals[0])}
                                                className="my-5"
                                            />
                                        )}
                                    />

                                    <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">KRİTİKLİK SEVİYESİ</p>
                                        <div className="flex items-center justify-center gap-1.5 mb-2">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all duration-300", i < risk.bars ? risk.color : "bg-white/10")} />
                                            ))}
                                        </div>
                                        <p className="text-xs font-medium text-slate-400 leading-relaxed mt-2">
                                            Bu tedarikçi <span className={cn("font-bold text-white", risk.color.replace('bg-', 'text-'))}>"{risk.label}"</span> olarak değerlendirilmektedir.
                                        </p>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 flex flex-col h-[200px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase">YÖNETİCİ NOTLARI</h3>
                                        <Settings className="h-3.5 w-3.5 text-slate-600" />
                                    </div>
                                    <Textarea
                                        {...register("notes")}
                                        placeholder="Tedarikçi ile ilgili notları buraya ekleyin..."
                                        className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-slate-600 focus-visible:ring-0 resize-none"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:px-6 sm:py-4 border-t border-white/5 bg-[#080B12] flex items-center justify-between shrink-0">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-slate-400 hover:text-white font-bold h-11 px-6 rounded-xl hover:bg-white/5">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white font-black h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all">
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
