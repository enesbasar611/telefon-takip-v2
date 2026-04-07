"use client";

import { ReceiptSettingsForm } from "@/components/settings/receipt-settings-form";

interface PrinterTabProps {
    receiptSettings: any[];
}

export function PrinterTab({ receiptSettings }: PrinterTabProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Fiş & Fatura Şablonları</h3>
                <p className="text-xs text-muted-foreground/80">Termal yazıcı çıktılarınızı özelleştirin. Canlı önizleme ile anında görebilirsiniz.</p>
            </div>
            <ReceiptSettingsForm initialSettings={receiptSettings} />
        </div>
    );
}
