"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Monitor, QrCode, ScanLine, ShoppingCart, Smartphone } from "lucide-react";

interface ScannerHelpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const steps = [
    {
        icon: Monitor,
        title: "POS ekranını açık tut",
        text: "Sepetin açık olduğu bilgisayarda barkod ikonuna basıp QR eşleştirme ekranını aç.",
    },
    {
        icon: QrCode,
        title: "QR kodunu telefondan okut",
        text: "Telefon kamerasıyla QR kodu okutulunca mobil tarayıcı sayfası açılır.",
    },
    {
        icon: Camera,
        title: "Kamera iznini ver",
        text: "Tarayıcı izin isterse kameraya izin ver. Açılmazsa Taramayı Başlat butonuna bas.",
    },
    {
        icon: ShoppingCart,
        title: "Barkodu okut",
        text: "Okunan ürün barkodu bilgisayardaki sepete anında eklenir.",
    },
];

export function ScannerHelpModal({ open, onOpenChange }: ScannerHelpModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Smartphone className="h-6 w-6 text-blue-500" />
                        Telefonu Nasıl Bağlarım?
                    </DialogTitle>
                    <DialogDescription>
                        Telefon kamerasını barkod okuyucu olarak bağlamak için kısa akış.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {steps.map((step, index) => (
                        <div key={step.title} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                <step.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[9px] font-black">
                                        {index + 1}
                                    </Badge>
                                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <ScanLine className="h-4 w-4" />
                            Bağlandıktan sonra QR ekranını açık bırakmana gerek yok.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
