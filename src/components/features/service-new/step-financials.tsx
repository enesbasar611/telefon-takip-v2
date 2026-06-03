"use client";

import { useFormContext } from "react-hook-form";
import { Receipt, Clock, Camera } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoManager, type PhotoFile } from "./photo-manager";
import { SectionBadge } from "./section-badge";
import { cn } from "@/lib/utils";

interface StepFinancialsProps {
    technicians: any[];
    isSimpleMode: boolean;
    photos: PhotoFile[];
    onAddPhoto: (files: PhotoFile[]) => void;
    onRemovePhoto: (id: string) => void;
    getInputClass: (name: string) => string;
}

export const StepFinancials = ({
    technicians,
    isSimpleMode,
    photos,
    onAddPhoto,
    onRemovePhoto,
    getInputClass
}: StepFinancialsProps) => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();

    const cardClass = "bg-card/40 dark:bg-[#0A0A0B]/40 backdrop-blur-md p-5 rounded-2xl border border-border/50 shadow-sm transition-all hover:border-primary/20 hover:shadow-md group/card relative overflow-hidden";
    const labelClass = "text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1.5 block ml-0.5 transition-colors group-hover/card:text-muted-foreground/70";

    const watchedEstimatedCost = watch("estimatedCost");
    const priority = watch("priority");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className={cardClass}>
                <SectionBadge icon={Receipt} title="Ödeme ve Planlama" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClass}>Tahmini Tutar</Label>
                        <div className="relative group">
                            <PriceInput
                                value={watchedEstimatedCost}
                                onChange={(val) => setValue("estimatedCost", String(val), { shouldValidate: true })}
                                className={cn(getInputClass("estimatedCost"), "h-14 text-2xl font-black text-primary border-primary/20 bg-primary/5 focus-visible:ring-primary/10")}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40 tracking-widest">TRY</div>
                        </div>
                        {errors.estimatedCost && <p className="text-[11px] text-destructive font-medium px-1">{errors.estimatedCost.message?.toString()}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className={labelClass}>Alınan Kapora</Label>
                        <PriceInput
                            value={watch("downPayment")}
                            onChange={(val) => setValue("downPayment", String(val), { shouldValidate: true })}
                            className={getInputClass("downPayment")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={labelClass}>Zimmetli Teknisyen</Label>
                        <Select
                            value={watch("technicianId")}
                            onValueChange={(val) => setValue("technicianId", val)}
                        >
                            <SelectTrigger className={getInputClass("technicianId")}>
                                <SelectValue placeholder="Teknisyen Seçin" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-xl">
                                {technicians.map((t) => (
                                    <SelectItem key={t.id} value={t.id} className="cursor-pointer">{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className={labelClass}>Tahmini Teslimat</Label>
                        <div className="relative">
                            <Input
                                type="datetime-local"
                                {...register("estimatedDeliveryDate")}
                                className={getInputClass("estimatedDeliveryDate")}
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 pointer-events-none" />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-3">
                        <Label className={labelClass}>İşlem Önceliği</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { val: 1, lab: "DÜŞÜK", cls: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 active:bg-emerald-500" },
                                { val: 2, lab: "NORMAL", cls: "border-blue-500/20 bg-blue-500/5 text-blue-600 active:bg-blue-500" },
                                { val: 3, lab: "KRİTİK", cls: "border-rose-500/20 bg-rose-500/5 text-rose-600 active:bg-rose-500" },
                            ].map(p => (
                                <button
                                    key={p.val}
                                    type="button"
                                    onClick={() => setValue("priority", p.val)}
                                    className={cn(
                                        "h-11 rounded-xl border text-[10px] font-black tracking-widest transition-all",
                                        priority === p.val ? p.cls.replace("/5", "/10") + " border-primary/40 ring-1 ring-primary/20" : "bg-muted/30 text-muted-foreground/40 border-border/10 hover:bg-muted"
                                    )}
                                >
                                    {p.lab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {isSimpleMode && (
                <section className={cardClass}>
                    <SectionBadge icon={Camera} title="Fotoğraf Kaydı" />
                    <PhotoManager
                        photos={photos}
                        onAdd={onAddPhoto}
                        onRemove={onRemovePhoto}
                    />
                </section>
            )}
        </div>
    );
};
