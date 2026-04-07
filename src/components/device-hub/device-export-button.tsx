"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceExportButtonProps {
    devices: any[];
}

export function DeviceExportButton({ devices }: DeviceExportButtonProps) {
    const handleExport = () => {
        if (!devices || devices.length === 0) return;

        // CSV Header
        const headers = [
            "ID", "Cihaz Adı", "Marka", "Model", "IMEI", "Kondisyon",
            "Renk", "Hafıza", "RAM", "Pil Sağlığı",
            "Alış Fiyatı", "Satış Fiyatı", "Eklenme Tarihi"
        ];

        // CSV Rows
        const rows = devices.map(d => [
            d.id,
            d.name,
            d.brand || d.name.split(" ")[0],
            d.name.split(" ").slice(1).join(" "),
            d.deviceInfo?.imei || "-",
            d.deviceInfo?.condition === "NEW" ? "Sıfır" : d.deviceInfo?.condition === "USED" ? "2. El" : "Yurtdışı",
            d.deviceInfo?.color || "-",
            d.deviceInfo?.storage || "-",
            d.deviceInfo?.ram || "-",
            d.deviceInfo?.batteryHealth ? `%${d.deviceInfo.batteryHealth}` : "-",
            d.buyPrice.toString(),
            d.sellPrice.toString(),
            new Date(d.createdAt).toLocaleDateString("tr-TR")
        ]);

        // Build CSV string with semicolon separator for Excel compatibility in TR
        const csvContent = [
            headers.join(";"),
            ...rows.map(row => row.join(";"))
        ].join("\n");

        // Add UTF-8 BOM for character encoding
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const fileName = `cihaz-hub-stok-${new Date().toISOString().split("T")[0]}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            className="h-12 px-6 rounded-2xl bg-card border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-foreground hover:text-emerald-400  transition-all gap-2 group shadow-lg"
        >
            <FileSpreadsheet className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">DIŞA AKTAR</span>
        </Button>
    );
}



