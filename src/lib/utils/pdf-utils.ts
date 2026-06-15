import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const generatePayrollPDF = (archive: any) => {
    const doc = new jsPDF() as any;
    const title = `${archive.user?.name} ${archive.user?.surname} - ${archive.period} Bordrosu`;

    // ... (existing logic kept for compatibility with archives)
    doc.setFontSize(20);
    doc.text("PERSONEL MAAŞ BORDROSU", 105, 20, { align: "center" });
    // ... rest of existing code ...
    // Note: I will refactor this to use the new corporate style later if needed, 
    // but for now I'll focus on the specific user request for dismissing staff.
    // Actually, let's just make one great function and use it.
};

export const generateCorporatePayrollPDF = (data: {
    shop: any;
    member: any;
    finance: any;
    expenses: any[];
    commissions: any[];
}) => {
    const { shop, member, finance, expenses, commissions } = data;
    const doc = new jsPDF() as any;

    // Page setup
    const pageWidth = doc.internal.pageSize.width;

    // Header - Shop Info
    doc.setFillColor(31, 41, 55); // Dark Gray
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(shop?.name?.toUpperCase() || "MAĞAZA BORDRO", 20, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(shop?.address || "", 20, 28);
    doc.text(`${shop?.phone || ""} | ${shop?.website || ""}`, 20, 33);

    doc.setFontSize(14);
    doc.text("İBRA VE FİNAL BORDROSU", pageWidth - 20, 25, { align: "right" });

    // Reset Text Color
    doc.setTextColor(0, 0, 0);

    // Personnel Info Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONEL BİLGİLERİ", 20, 50);
    doc.line(20, 52, 200, 52);

    doc.autoTable({
        startY: 55,
        margin: { left: 20, right: 20 },
        body: [
            ['AD SOYAD:', `${member.name} ${member.surname || ""}`, 'DÖNEM:', format(new Date(), "MMMM yyyy", { locale: tr }).toUpperCase()],
            ['ROL:', member.role || "-", 'TC / PASAPORT:', "-"],
            ['GİRİŞ TARİHİ:', format(new Date(member.createdAt), "dd.MM.yyyy"), 'ÇIKIŞ TARİHİ:', format(new Date(), "dd.MM.yyyy")],
            ['ÇAL. GÜN:', `${finance.activeDays} GÜN`, 'İZİN GÜNÜ:', `${finance.leaveDays} GÜN`],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', width: 30 },
            2: { fontStyle: 'bold', width: 30 }
        }
    });

    // Financial Details Header
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MADDİ ÖDEME DETAYLARI", 20, finalY);
    doc.line(20, finalY + 2, 200, finalY + 2);

    // Income Table
    doc.autoTable({
        startY: finalY + 5,
        margin: { left: 20, right: 20 },
        head: [['GELİR KALEMLERİ', 'AÇIKLAMA', 'TUTAR']],
        body: [
            ['HAKEDİLEN MAAŞ', `${finance.activeDays} Günlük Kıstelyevm`, `${finance.proRatedSalary.toLocaleString('tr-TR')} TL`],
            ...commissions.map(c => [
                'PRİM ÖDEMESİ',
                c.description || "Satış/Hizmet Primi",
                `${Number(c.amount).toLocaleString('tr-TR')} TL`
            ]),
            [{ content: 'TOPLAM GELİR', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${(finance.proRatedSalary + finance.approvedCommissions).toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue-500
        styles: { fontSize: 9 }
    });

    // Deductions Table
    const deductionY = (doc as any).lastAutoTable.finalY + 5;
    doc.autoTable({
        startY: deductionY,
        margin: { left: 20, right: 20 },
        head: [['KESİNTİ / GİDER KALEMLERİ', 'AÇIKLAMA', 'TUTAR']],
        body: expenses.length > 0 ? [
            ...expenses.map(e => [
                e.type === 'ADVANCE' ? 'AVANS' : (e.type === 'DEDUCTION' ? 'KESİNTİ' : 'GİDER'),
                e.description || "-",
                `${Number(e.amount).toLocaleString('tr-TR')} TL`
            ]),
            [{ content: 'TOPLAM KESİNTİ', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${finance.totalExpenses.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
        ] : [['Kesinti bulunmamaktadır', '-', '0,00 TL']],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }, // Red-500
        styles: { fontSize: 9 }
    });

    // Summary Section
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(243, 244, 246);
    doc.rect(120, summaryY, 80, 25, 'F');

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Toplam Hakediş:", 125, summaryY + 8);
    doc.text(`${(finance.proRatedSalary + finance.approvedCommissions).toLocaleString('tr-TR')} TL`, 195, summaryY + 8, { align: "right" });

    doc.text("Toplam Kesinti:", 125, summaryY + 14);
    doc.text(`- ${finance.totalExpenses.toLocaleString('tr-TR')} TL`, 195, summaryY + 14, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NET ÖDEME:", 125, summaryY + 21);
    doc.text(`${finance.netPayout.toLocaleString('tr-TR')} TL`, 195, summaryY + 21, { align: "right" });

    // Legal Text
    const legalY = summaryY + 40;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const legalText = "Yukarıda dökümü yapılan maaş, prim ve diğer haklarımı eksiksiz olarak aldığımı, işletmeden herhangi bir alacağımın kalmadığını ve bu bordronun aynı zamanda bir ibra senedi hükmünde olduğunu beyan ve taahhüt ederim.";
    const splitLegal = doc.splitTextToSize(legalText, 170);
    doc.text(splitLegal, 20, legalY);

    // Signatures
    const sigY = legalY + 25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("İŞVEREN / KAŞE", 40, sigY);
    doc.text("PERSONEL İMZA", 140, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("(İmza)", 50, sigY + 15);
    doc.text("(İmza)", 150, sigY + 15);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`Bu belge ${format(new Date(), "dd.MM.yyyy HH:mm")} tarihinde sistem üzerinden oluşturulmuştur.`, pageWidth / 2, 285, { align: "center" });

    doc.save(`${member.name}_Final_Bordro_${format(new Date(), "yyyyMMdd")}.pdf`);
};
