"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, DollarSign, PenTool, Receipt, LayoutList, CheckCircle2 } from "lucide-react";
import { createAgendaEventAction } from "@/lib/actions/agenda-actions";
import { toast } from "sonner";
import { AgendaEventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<AgendaEventType>('SERVICE');

    const types = [
        { id: 'SERVICE', label: 'Servis', icon: PenTool, color: "blue" },
        { id: 'PAYMENT', label: 'Ödeme', icon: Receipt, color: "red" },
        { id: 'COLLECTION', label: 'Tahsilat', icon: DollarSign, color: "emerald" },
        { id: 'TASK', label: 'Görev', icon: CheckCircle2, color: "purple" },
    ];

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);

            const dateStr = formData.get("date") as string;
            const timeStr = formData.get("time") as string;
            // combine date and time
            const dateObj = new Date(`${dateStr}T${timeStr || "12:00"}`);

            // Validation: Prevent past appointments
            const now = new Date();
            if (dateObj < now) {
                toast.error("Geçmiş bir tarih veya saate randevu ekleyemezsiniz.");
                setIsLoading(false);
                return;
            }

            const amountStr = formData.get("amount") as string;
            const amount = amountStr ? parseFloat(amountStr) : undefined;

            const res = await createAgendaEventAction({
                title: formData.get("title") as string,
                type: selectedType,
                date: dateObj,
                category: formData.get("category") as string,
                amount: amount,
                notes: formData.get("notes") as string,
                assignedTo: [] // simple implementation for now, can be extended to multi-select
            });

            if (res.success) {
                toast.success("Randevu / İşlem başarıyla oluşturuldu.");
                onClose();
            } else {
                toast.error(res.error || "Bir hata oluştu.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] border-[#333333] bg-[#111111] p-0 shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <DialogHeader className="px-6 pt-6 pb-2">
                    <p className="text-[11px] font-medium text-blue-500 uppercase tracking-widest mb-1">OPERASYONEL PLANLAMA</p>
                    <DialogTitle className="text-2xl text-white font-semibold">Yeni İşlem / Randevu Oluştur</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Takvime yeni bir servis işlemi, ödeme veya görev ekleyin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
                    {/* Types */}
                    <div className="space-y-3">
                        <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">İŞLEM TÜRÜ SEÇİN</Label>
                        <div className="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-1.5 rounded-2xl border border-[#222]">
                            {types.map(t => {
                                const isSelected = selectedType === t.id;
                                const Icon = t.icon;
                                return (
                                    <button
                                        type="button"
                                        key={t.id}
                                        onClick={() => setSelectedType(t.id as AgendaEventType)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all",
                                            isSelected
                                                ? "bg-[#222] shadow-sm text-white"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-[#222]/50"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5", isSelected && `text-${t.color}-400`)} />
                                        <span className="text-xs font-medium uppercase">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">İŞLEM BAŞLIĞI</Label>
                            <Input
                                required
                                name="title"
                                placeholder="Örn: iPhone 14 Pro Ekran Tamiri"
                                className="bg-[#151515] border-[#222] text-white h-12 text-base rounded-xl"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">TARİH</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input required type="date" name="date" className="bg-[#151515] border-[#222] text-white h-12 pl-10 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">SAAT</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input type="time" name="time" defaultValue="12:00" className="bg-[#151515] border-[#222] text-white h-12 pl-10 rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Category & Amount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">KATEGORİ</Label>
                                <Input name="category" placeholder="Örn: Ekran Tamiri" className="bg-[#151515] border-[#222] text-white h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">TUTAR (TRY)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-medium">₺</span>
                                    <Input name="amount" type="number" step="0.01" placeholder="0.00" className="bg-[#151515] border-[#222] text-white h-12 pl-8 rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">NOTLAR / AÇIKLAMA</Label>
                            <Textarea name="notes" placeholder="İşlem hakkında özel notlar..." className="bg-[#151515] border-[#222] text-white min-h-[80px] resize-none rounded-xl" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-[#222] text-slate-300">
                            İptal Et
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] h-10 rounded-xl">
                            {isLoading ? "Oluşturuluyor..." : "Kaydet ve Oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
