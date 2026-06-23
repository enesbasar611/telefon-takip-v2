import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Helper to replace Turkish characters for environments where custom fonts aren't supported
const fixTurkish = (text: string) => {
    if (!text) return "";
    return text
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
};

const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
        'ADMIN': 'YONETICI',
        'SHOP_MANAGER': 'MUDUR',
        'STAFF': 'PERSONEL',
        'COURIER': 'KURYE',
        'TECHNICIAN': 'TEKNISYEN',
        'SUPER_ADMIN': 'SUPER ADMIN'
    };
    return roles[role] || role;
};

export const generatePayrollPDF = (archive: any) => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text(fixTurkish("PERSONEL MAAŞ BORDROSU"), 105, 20, { align: "center" });

    autoTable(doc, {
        startY: 30,
        head: [[fixTurkish('Detay'), fixTurkish('Bilgi')]],
        body: [
            [fixTurkish('Ad Soyad'), fixTurkish(`${archive.user?.name} ${archive.user?.surname}`)],
            [fixTurkish('Dönem'), fixTurkish(archive.period)],
            [fixTurkish('Baz Maaş'), `${archive.baseSalary?.toLocaleString('tr-TR')} TL`],
            [fixTurkish('Komisyonlar'), `${archive.totalCommissions?.toLocaleString('tr-TR')} TL`],
            [fixTurkish('Kesintiler/Ödemeler'), `${archive.totalExpenses?.toLocaleString('tr-TR')} TL`],
            [fixTurkish('Net Ödenecek'), `${archive.netPayout?.toLocaleString('tr-TR')} TL`],
        ],
    });
    doc.save(`${fixTurkish(archive.user?.name)}_Bordro.pdf`);
};

export const generateCorporatePayrollPDF = (data: {
    shop: any;
    member: any;
    finance: any;
    expenses: any[];
    commissions: any[];
}) => {
    const { shop, member, finance, expenses, commissions } = data;
    if (!member || !finance) throw new Error("Gerekli veriler eksik");

    const proRatedSalary = Number(finance.proRatedSalary || 0);
    const approvedCommissions = Number(finance.approvedCommissions || 0);
    const totalExpenses = Number(finance.totalExpenses || 0);
    const netPayout = Number(finance.netPayout || 0);
    const activeDays = Number(finance.activeDays || 0);
    const leaveDays = Number(finance.leaveDays || 0);

    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(fixTurkish(shop?.name?.toUpperCase() || "MAĞAZA BORDRO"), 20, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(fixTurkish(shop?.address || ""), 20, 28);
    doc.text(fixTurkish(`${shop?.phone || ""} | ${shop?.website || ""}`), 20, 33);

    doc.setFontSize(14);
    doc.text(fixTurkish("IBRA VE MAAŞ BORDROSU"), pageWidth - 20, 25, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(fixTurkish("PERSONEL BILGILERI"), 20, 50);
    doc.line(20, 52, 200, 52);

    autoTable(doc, {
        startY: 55,
        margin: { left: 20, right: 20 },
        body: [
            [fixTurkish('AD SOYAD:'), fixTurkish(`${member.name} ${member.surname || ""}`), fixTurkish('DÖNEM:'), fixTurkish(format(new Date(), "MMMM yyyy", { locale: tr }).toUpperCase())],
            [fixTurkish('ROL:'), fixTurkish(getRoleLabel(member.role || "-")), fixTurkish('TC / PASAPORT:'), "-"],
            [fixTurkish('GİRİŞ TARİHİ:'), format(new Date(member.createdAt), "dd.MM.yyyy"), fixTurkish('ÇIKIŞ TARİHİ:'), format(new Date(), "dd.MM.yyyy")],
            [fixTurkish('ÇAL. GÜN:'), `${activeDays} GÜN`, fixTurkish('İZİN GÜNÜ:'), `${leaveDays} GÜN`],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 2: { fontStyle: 'bold', cellWidth: 30 } }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(fixTurkish("MADDİ ÖDEME DETAYLARI"), 20, finalY + 10);
    doc.line(20, finalY + 12, 200, finalY + 12);

    autoTable(doc, {
        startY: finalY + 15,
        margin: { left: 20, right: 20 },
        head: [[fixTurkish('GELİR KALEMLERİ'), fixTurkish('AÇIKLAMA'), fixTurkish('TUTAR')]],
        body: [
            [fixTurkish('HAKEDİLEN MAAŞ'), fixTurkish(`${activeDays} Günlük Yevmiye`), `${proRatedSalary.toLocaleString('tr-TR')} TL`],
            ...commissions.map(c => [fixTurkish('PRİM ÖDEMESİ'), fixTurkish(c.description || "Satış/Hizmet Primi"), `${Number(c.amount || 0).toLocaleString('tr-TR')} TL`]),
            [{ content: fixTurkish('TOPLAM GELİR'), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${(proRatedSalary + approvedCommissions).toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
    });

    const deductionY = (doc as any).lastAutoTable?.finalY || 150;
    autoTable(doc, {
        startY: deductionY + 5,
        margin: { left: 20, right: 20 },
        head: [[fixTurkish('KESİNTİ / GİDER KALEMLERİ'), fixTurkish('AÇIKLAMA'), fixTurkish('TUTAR')]],
        body: expenses.length > 0 ? [
            ...expenses.map(e => [fixTurkish(e.type === 'ADVANCE' ? 'AVANS' : (e.type === 'DEDUCTION' ? 'KESİNTİ' : 'GİDER')), fixTurkish(e.description || "-"), `${Number(e.amount).toLocaleString('tr-TR')} TL`]),
            [{ content: fixTurkish('TOPLAM KESİNTİ'), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${totalExpenses.toLocaleString('tr-TR')} TL`, styles: { fontStyle: 'bold' } }]
        ] : [[fixTurkish('Kesinti bulunmamaktadır'), '-', '0,00 TL']],
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9 }
    });

    const summaryY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFillColor(243, 244, 246);
    doc.rect(120, summaryY + 10, 80, 30, 'F'); // Kutu yüksekliğini artırdık (25 -> 30+)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Satır aralıklarını genişlettik (14-18-21 yerine 18-24-32)
    doc.text(fixTurkish("Toplam Hakediş:"), 125, summaryY + 18);
    doc.text(`${(proRatedSalary + approvedCommissions).toLocaleString('tr-TR')} TL`, 195, summaryY + 18, { align: "right" });

    doc.text(fixTurkish("Toplam Kesinti:"), 125, summaryY + 24);
    doc.text(`- ${totalExpenses.toLocaleString('tr-TR')} TL`, 195, summaryY + 24, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(fixTurkish("NET ODEME:"), 125, summaryY + 32);
    doc.text(`${netPayout.toLocaleString('tr-TR')} TL`, 195, summaryY + 32, { align: "right" });

    const legalY = summaryY + 50; // Yasal metni de biraz aşağı kaydırdık
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const legalText = fixTurkish("Yukarıda dökümü yapılan maaş, prim ve diğer haklarımı eksiksiz olarak aldığımı, işletmeden herhangi bir alacağımın kalmadığını ve bu bordronun aynı zamanda bir ibra senedi hükmünde olduğunu beyan ve taahhüt ederim.");
    const splitLegal = doc.splitTextToSize(legalText, 170);
    doc.text(splitLegal, 20, legalY);

    const sigY = legalY + 25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(fixTurkish("İŞVEREN / KAŞE"), 40, sigY);
    doc.text(fixTurkish("PERSONEL İMZA"), 140, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(fixTurkish("(İmza)"), 50, sigY + 15);
    doc.text(fixTurkish("(İmza)"), 150, sigY + 15);

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(fixTurkish(`Bu belge ${format(new Date(), "dd.MM.yyyy HH:mm")} tarihinde sistem üzerinden oluşturulmuştur.`), pageWidth / 2, 285, { align: "center" });

    doc.save(`${fixTurkish(member.name)}_Final_Bordro_${format(new Date(), "yyyyMMdd")}.pdf`);
};
