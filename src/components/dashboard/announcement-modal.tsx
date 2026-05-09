"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Update this version string whenever there are new features!
const CURRENT_VERSION = "1.0.1";

const LATEST_UPDATES = [
    {
        title: "Gelişmiş İade Yönetimi",
        description: "Müşteri ve tedarikçi iade işlemlerinde artık İade Seçenekleri (Sadece Stoğa Al, Yenisi Verildi, Para İadesi vb.) sunuluyor."
    },
    {
        title: "Veresiye & Sipariş İade Entegrasyonu",
        description: "Artık müşteri iadesi yaparken müşterinin eski veresiye/sipariş geçmişini görüp kolaylıkla seçebilir ve ürün borcunu otomatik düşebilirsiniz."
    },
    {
        title: "Performans ve Güvenlik",
        description: "Personel rolleri daha güvenli hale getirildi, arayüz performans iyileştirmesi yapıldı."
    }
];

export function AnnouncementModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const lastVersion = localStorage.getItem("app_version");
        if (lastVersion !== CURRENT_VERSION) {
            setOpen(true);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem("app_version", CURRENT_VERSION);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
        }}>
            <DialogContent className="max-w-md bg-background rounded-3xl border-border/40 shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center border-b border-border/40">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Yeni Özellikler Geldi!</DialogTitle>
                    <DialogDescription className="text-sm mt-2 font-medium">
                        Sistemi sizin için daha yetenekli ve akıllı hale getirdik. v{CURRENT_VERSION}
                    </DialogDescription>
                </div>

                <ScrollArea className="max-h-[300px] p-6">
                    <div className="space-y-4">
                        {LATEST_UPDATES.map((update, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="min-w-6 min-h-6 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">{update.title}</span>
                                    <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{update.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2">
                    <Button onClick={handleClose} className="w-full rounded-xl h-12 text-sm font-bold shadow-lg shadow-primary/20">
                        Harika, Devam Et
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
