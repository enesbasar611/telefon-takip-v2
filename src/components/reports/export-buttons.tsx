"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonsProps {
    exportData: {
        sales: any[];
        tickets: any[];
        inventory: any[];
    } | null;
    dashboardRef: React.RefObject<HTMLDivElement>;
}

export function ExportButtons({ exportData, dashboardRef }: ExportButtonsProps) {
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const exportToExcel = async () => {
        if (!exportData) {
            toast.error("Dışa aktarılacak veri bulunamadı.");
            return;
        }
        setIsExportingExcel(true);
        try {
            const XLSX = await import("xlsx");
            const wb = XLSX.utils.book_new();

            // Sheet 1: Satışlar
            if (exportData.sales.length > 0) {
                const ws1 = XLSX.utils.json_to_sheet(exportData.sales);
                XLSX.utils.book_append_sheet(wb, ws1, "Satışlar");
            }

            // Sheet 2: Teknik Servis
            if (exportData.tickets.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(exportData.tickets);
                XLSX.utils.book_append_sheet(wb, ws2, "Teknik Servis");
            }

            // Sheet 3: Parça Stoğu
            if (exportData.inventory.length > 0) {
                const ws3 = XLSX.utils.json_to_sheet(exportData.inventory);
                XLSX.utils.book_append_sheet(wb, ws3, "Parça Stoğu");
            }

            const filename = `Rapor_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.xlsx`;
            XLSX.writeFile(wb, filename);
            toast.success("Excel başarıyla indirildi!", { description: "Satışlar, Servis ve Stok sekmelerini içerir." });
        } catch (error) {
            toast.error("Excel oluşturulurken hata oluştu.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    const exportToPdf = async () => {
        if (!dashboardRef.current) {
            toast.error("Rapor alanı bulunamadı.");
            return;
        }
        setIsExportingPdf(true);
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf")
            ]);

            const element = dashboardRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // Retina kalitesi için 2x
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#0f172a", // dark bg
                logging: false,
                imageTimeout: 15000,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "px",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;

            // Split into pages if needed
            const pageHeightInPixels = pdfHeight / ratio;
            let currentY = 0;
            let pageNum = 0;

            while (currentY < imgHeight) {
                if (pageNum > 0) pdf.addPage();
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = imgWidth;
                pageCanvas.height = Math.min(pageHeightInPixels, imgHeight - currentY);
                const ctx = pageCanvas.getContext("2d")!;
                ctx.drawImage(canvas, 0, -currentY);
                const pageImg = pageCanvas.toDataURL("image/jpeg", 0.95);
                pdf.addImage(pageImg, "JPEG", imgX, 0, imgWidth * ratio, pageCanvas.height * ratio);
                currentY += pageHeightInPixels;
                pageNum++;
            }

            const filename = `Rapor_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.pdf`;
            pdf.save(filename);
            toast.success("PDF başarıyla indirildi!", { description: "Retina kalitesinde hazırlandı." });
        } catch (error) {
            toast.error("PDF oluşturulurken hata oluştu.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={isExportingExcel || !exportData}
                className="gap-2 rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all  text-xs uppercase tracking-wider h-10 px-4"
            >
                {isExportingExcel ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                )}
                Excel
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={exportToPdf}
                disabled={isExportingPdf}
                className="gap-2 rounded-xl border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/60 transition-all  text-xs uppercase tracking-wider h-10 px-4"
            >
                {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <FileText className="h-4 w-4" />
                )}
                PDF
            </Button>
        </div>
    );
}



