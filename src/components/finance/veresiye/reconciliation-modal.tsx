"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addReconciliationNote } from "@/lib/actions/debt-actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface ReconciliationModalProps {
    open: boolean;
    onClose: () => void;
    customer: any | null;
}

export function ReconciliationModal({ open, onClose, customer }: ReconciliationModalProps) {
    const [note, setNote] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!customer) return;
        if (!note.trim()) {
            toast.error("Lütfen bir not veya tarih giriniz.");
            return;
        }

        setLoading(true);
        const result = await addReconciliationNote({
            customerId: customer.customerId || customer.id,
            note: note.trim()
        });
        setLoading(false);

        if (result.success) {
            toast.success("Mutabakat eklendi.");
            setNote("");
            onClose();
        } else {
            toast.error(result.error || "Mutabakat eklenemedi.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Hesap Mutabakatı Ekle</DialogTitle>
                    <DialogDescription>
                        Müşteriyle hesabınızı karşılaştırıp "mutabık kalındı" notu ekleyin. Bu işlem bakiyeleri etkilemez, sadece ekstrenizde bir onay noktası (tarih) oluşturur.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Mutabakat Notu / Tarihi</Label>
                        <Input
                            placeholder="Örn: 13 Eylül 2026 itibariyle mutabık kalınmıştır."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button onClick={handleConfirm} disabled={loading || !note.trim()}>
                        {loading ? "Kaydediliyor..." : "Mutabakatı Kaydet"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
