"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDetailedExportData } from "@/lib/actions/report-actions";
import { fixTurkish } from "@/lib/utils/pdf-utils";
import { format } from "date-fns";

interface ExportButtonsProps {
    dashboardRef: React.RefObject<HTMLDivElement>;
    stats?: any;
    salesData?: any[];
    serviceMetrics?: any[];
    cashflow?: any[];
    topProducts?: any[];
    brandDistribution?: any[];
}

export function ExportButtons({
    dashboardRef,
    stats,
    salesData,
    serviceMetrics,
    cashflow,
    topProducts,
    brandDistribution,
}: ExportButtonsProps) {
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const exportToExcel = async () => {
        setIsExportingExcel(true);
        try {
            const exportData = await getDetailedExportData();
            if (!exportData) {
                toast.error("Dışa aktarılacak veri bulunamadı.");
                return;
            }
            const XLSX = await import("xlsx");
            const wb = XLSX.utils.book_new();

            // Sheet 1: Satışlar
            if (exportData.sales && exportData.sales.length > 0) {
                const ws1 = XLSX.utils.json_to_sheet(exportData.sales);
                ws1["!cols"] = [
                    { wch: 18 }, // Fiş_No
                    { wch: 18 }, // Tarih
                    { wch: 24 }, // Müşteri
                    { wch: 38 }, // Ürünler
                    { wch: 16 }, // Ödeme_Türü
                    { wch: 32 }, // Açıklama
                    { wch: 14 }, // Tutar
                ];
                XLSX.utils.book_append_sheet(wb, ws1, "Satışlar");
            }

            // Sheet 2: Teknik Servis
            if (exportData.tickets && exportData.tickets.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(exportData.tickets);
                ws2["!cols"] = [
                    { wch: 18 }, // İş_Emri_No
                    { wch: 14 }, // Tarih
                    { wch: 22 }, // Müşteri
                    { wch: 24 }, // Cihaz
                    { wch: 18 }, // Durum
                    { wch: 14 }, // Maliyet
                ];
                XLSX.utils.book_append_sheet(wb, ws2, "Teknik Servis");
            }

            // Sheet 3: Parça Stoğu
            if (exportData.inventory && exportData.inventory.length > 0) {
                const ws3 = XLSX.utils.json_to_sheet(exportData.inventory);
                ws3["!cols"] = [
                    { wch: 18 }, // Barkod
                    { wch: 32 }, // Ürün_Adı
                    { wch: 18 }, // Kategori
                    { wch: 12 }, // Stok_Adedi
                    { wch: 12 }, // Kritik_Stok
                    { wch: 16 }, // Alış_Fiyatı_TL
                    { wch: 16 }, // Alış_Fiyatı_USD
                    { wch: 16 }, // Satış_Fiyatı_TL
                ];
                XLSX.utils.book_append_sheet(wb, ws3, "Parça Stoğu");
            }

            const shopPrefix = (exportData.shop?.name || "Rapor").replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
            const filename = `${shopPrefix}_Finans_ve_Satis_Raporu_${format(new Date(), "dd-MM-yyyy")}.xlsx`;
            XLSX.writeFile(wb, filename);
            toast.success("Excel başarıyla indirildi!", {
                description: "Satışlar (Açıklama notlarıyla), Servis ve Stok verileri aktarıldı."
            });
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error("Excel oluşturulurken hata oluştu.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    const exportToPdf = async () => {
        setIsExportingPdf(true);
        try {
            const [exportData, { default: jsPDF }, { default: autoTable }] = await Promise.all([
                getDetailedExportData(),
                import("jspdf"),
                import("jspdf-autotable")
            ]);

            if (!exportData) {
                toast.error("Rapor verileri alınamadı.");
                return;
            }

            // Clean capture of charts if rendered
            let salesChartImg: string | null = null;
            let cashflowChartImg: string | null = null;

            try {
                if (dashboardRef.current) {
                    const { default: html2canvas } = await import("html2canvas");
                    const salesEl = dashboardRef.current.querySelector('[data-chart="sales-trend"]') as HTMLElement;
                    const cashflowEl = dashboardRef.current.querySelector('[data-chart="cashflow"]') as HTMLElement;

                    if (salesEl) {
                        const canvas = await html2canvas(salesEl, {
                            scale: 2,
                            backgroundColor: "#0b1120",
                            logging: false,
                            useCORS: true,
                        });
                        salesChartImg = canvas.toDataURL("image/png");
                    }

                    if (cashflowEl) {
                        const canvas = await html2canvas(cashflowEl, {
                            scale: 2,
                            backgroundColor: "#0b1120",
                            logging: false,
                            useCORS: true,
                        });
                        cashflowChartImg = canvas.toDataURL("image/png");
                    }
                }
            } catch (err) {
                console.warn("Chart image capture omitted:", err);
            }

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            }) as any;

            const shopName = exportData.shop?.name || "BAŞAR TEKNİK";

            // PAGE 1: HEADER & OVERVIEW
            // Top Header Bar
            doc.setFillColor(15, 23, 42); // dark navy
            doc.rect(0, 0, 210, 26, "F");
            doc.setFillColor(16, 185, 129); // emerald strip
            doc.rect(0, 26, 210, 1.5, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(fixTurkish(shopName.toUpperCase()), 14, 11);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184);
            doc.text(fixTurkish("FİNANSAL PERFORMANS VE YÖNETİM ANALİZ RAPORU"), 14, 18);

            doc.setFontSize(8);
            doc.setTextColor(203, 213, 225);
            doc.text(fixTurkish(`Rapor Tarihi: ${format(new Date(), "dd.MM.yyyy HH:mm")}`), 196, 11, { align: "right" });
            if (exportData.shop?.phone) {
                doc.text(fixTurkish(`İletişim: ${exportData.shop.phone}`), 196, 17, { align: "right" });
            }

            // Executive KPI Cards (4 cards across page)
            const startY = 33;
            const kpis = [
                {
                    label: "BU AY NET SATIS",
                    val: `${Number(stats?.currentMonthRevenue || 0).toLocaleString("tr-TR")} TL`,
                    sub: `${stats?.revenueGrowth >= 0 ? "+" : ""}${stats?.revenueGrowth || 0}% gecen aya gore`,
                    color: [16, 185, 129]
                },
                {
                    label: "TAMAMLANAN SERVIS",
                    val: `${stats?.completedServicesThisMonth || 0} Adet`,
                    sub: "Bu ay teslim edilen",
                    color: [59, 130, 246]
                },
                {
                    label: "TOPLAM MUSTERI",
                    val: `${stats?.totalCustomers || 0}`,
                    sub: "Kayitli cari portfoy",
                    color: [139, 92, 246]
                },
                {
                    label: "KRITIK STOK",
                    val: `${stats?.criticalStockCount || 0} Urun`,
                    sub: "Esik altinda olan",
                    color: [239, 68, 68]
                },
            ];

            kpis.forEach((kpi, idx) => {
                const x = 14 + idx * (42.5 + 4);
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(x, startY, 42.5, 18, 2, 2, "FD");

                doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                doc.rect(x, startY, 42.5, 1.2, "F");

                doc.setFontSize(6.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(100, 116, 139);
                doc.text(fixTurkish(kpi.label), x + 3, startY + 5);

                doc.setFontSize(9.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(fixTurkish(kpi.val), x + 3, startY + 11);

                doc.setFontSize(6);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(148, 163, 184);
                doc.text(fixTurkish(kpi.sub), x + 3, startY + 15.5);
            });

            let currentY = 56;

            // Optional Chart Snapshot
            if (salesChartImg || cashflowChartImg) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(fixTurkish("GRAFIKSEL FINANS & AKIS ANALIZI"), 14, currentY);
                currentY += 4;

                if (salesChartImg && cashflowChartImg) {
                    const chartW = 89;
                    const chartH = 46;
                    doc.addImage(salesChartImg, "PNG", 14, currentY, chartW, chartH);
                    doc.addImage(cashflowChartImg, "PNG", 107, currentY, chartW, chartH);
                    currentY += chartH + 6;
                } else if (salesChartImg) {
                    const chartW = 182;
                    const chartH = 48;
                    doc.addImage(salesChartImg, "PNG", 14, currentY, chartW, chartH);
                    currentY += chartH + 6;
                }
            }

            // Top Products Table
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(fixTurkish("EN COK SATAN URUNLER"), 14, currentY);

            const topProductsRows = (topProducts || []).slice(0, 6).map((p: any, idx: number) => {
                const qty = Number(p.sales || 0);
                const price = Number(p.price || 0);
                const total = qty * price;
                return [
                    idx + 1,
                    fixTurkish(p.name || "-"),
                    fixTurkish(p.categoryName || "Genel"),
                    `${qty} adet`,
                    `${price.toLocaleString("tr-TR")} TL`,
                    `${total.toLocaleString("tr-TR")} TL`
                ];
            });

            autoTable(doc, {
                startY: currentY + 3,
                head: [["#", "Urun Adi", "Kategori", "Satis Adedi", "Birim Fiyat", "Toplam Gelir"]],
                body: topProductsRows.length > 0 ? topProductsRows : [["-", "Henuz satis verisi yok", "-", "-", "-", "-"]],
                theme: "grid",
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
                styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica" },
                columnStyles: {
                    0: { cellWidth: 10, halign: "center" },
                    1: { cellWidth: 62 },
                    2: { cellWidth: 32 },
                    3: { cellWidth: 24, halign: "center" },
                    4: { cellWidth: 26, halign: "right" },
                    5: { cellWidth: 28, halign: "right" },
                },
                margin: { left: 14, right: 14 },
            });

            currentY = (doc as any).lastAutoTable.finalY + 7;

            // Service Ticket Status Breakdown Table
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(fixTurkish("TEKNIK SERVIS DURUM DAGILIMI"), 14, currentY);

            const totalServiceCount = (serviceMetrics || []).reduce((acc: number, m: any) => acc + (Number(m.value) || 0), 0);
            const serviceRows = (serviceMetrics || []).map((m: any) => [
                fixTurkish(m.name),
                `${m.value || 0} cihaz`,
                totalServiceCount > 0 ? `%${(((m.value || 0) / totalServiceCount) * 100).toFixed(1)}` : "%0"
            ]);

            autoTable(doc, {
                startY: currentY + 3,
                head: [["Servis Durumu", "Cihaz Adedi", "Yuzdelik Payi"]],
                body: serviceRows.length > 0 ? serviceRows : [["Aktif servis kaydi bulunamadi", "-", "-"]],
                theme: "grid",
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
                styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica" },
                columnStyles: {
                    0: { cellWidth: 82 },
                    1: { cellWidth: 50, halign: "center" },
                    2: { cellWidth: 50, halign: "center" },
                },
                margin: { left: 14, right: 14 },
            });

            // PAGE 2+: DETAILED SALES LIST
            doc.addPage();

            // Header for Sales Page
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 18, "F");
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 18, 210, 1, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(fixTurkish("DETAYLI SATIŞ VE İŞLEM HAREKETLERİ"), 14, 11);

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184);
            doc.text(fixTurkish("Satış Notları, Müşteri Bilgileri ve Ödeme Açıklamaları"), 14, 16);

            const salesRows = (exportData.sales || []).slice(0, 200).map((s: any) => [
                fixTurkish(s.Fiş_No),
                s.Tarih,
                fixTurkish(s.Müşteri),
                fixTurkish(s.Ürünler),
                fixTurkish(s.Ödeme_Türü),
                fixTurkish(s.Açıklama),
                `${Number(s.Tutar || 0).toLocaleString("tr-TR")} TL`
            ]);

            const totalSalesSum = (exportData.sales || []).reduce((acc: number, s: any) => acc + (Number(s.Tutar) || 0), 0);

            autoTable(doc, {
                startY: 23,
                head: [["Fis No", "Tarih", "Musteri", "Urunler", "Odeme Turu", "Aciklama / Not", "Tutar"]],
                body: salesRows.length > 0 ? salesRows : [["-", "-", "Satis verisi yok", "-", "-", "-", "-"]],
                foot: [
                    [
                        { content: fixTurkish("TOPLAM SATIS TUTARI:"), colSpan: 6, styles: { halign: "right", fontStyle: "bold" } },
                        { content: `${totalSalesSum.toLocaleString("tr-TR")} TL`, styles: { halign: "right", fontStyle: "bold", textColor: [16, 185, 129] } }
                    ]
                ],
                theme: "grid",
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7 },
                footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 7.5 },
                styles: { fontSize: 6.8, cellPadding: 1.8, font: "helvetica", overflow: "linebreak" },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 24 },
                    2: { cellWidth: 26 },
                    3: { cellWidth: 38 },
                    4: { cellWidth: 22 },
                    5: { cellWidth: 34 },
                    6: { cellWidth: 18, halign: "right" },
                },
                margin: { left: 14, right: 14, bottom: 15 },
            });

            // Footers on all pages
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(148, 163, 184);
                doc.setDrawColor(226, 232, 240);
                doc.line(14, 287, 196, 287);
                doc.text(fixTurkish(`${shopName} • Raporlama ve Analiz Sistemi`), 14, 292);
                doc.text(fixTurkish(`Sayfa ${i} / ${totalPages}`), 196, 292, { align: "right" });
            }

            const shopPrefix = shopName.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_");
            const filename = `${shopPrefix}_Finans_ve_Satis_Raporu_${format(new Date(), "dd-MM-yyyy")}.pdf`;
            doc.save(filename);
            toast.success("PDF başarıyla oluşturuldu!", {
                description: "Yönetici özeti, grafikler, en çok satanlar ve satış detayları hazırlandı."
            });
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("PDF oluşturulurken hata oluştu.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={isExportingExcel}
                className="gap-1.5 sm:gap-2 rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all text-[11px] sm:text-xs uppercase tracking-wider h-8 sm:h-10 px-2.5 sm:px-4"
            >
                {isExportingExcel ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                    <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                Excel
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={exportToPdf}
                disabled={isExportingPdf}
                className="gap-1.5 sm:gap-2 rounded-xl border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/60 transition-all text-[11px] sm:text-xs uppercase tracking-wider h-8 sm:h-10 px-2.5 sm:px-4"
            >
                {isExportingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                PDF
            </Button>
        </div>
    );
}
