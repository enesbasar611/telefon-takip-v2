import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EdmService } from "@/lib/edm/service";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopId();
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const format = (searchParams.get("format") as "html" | "pdf") || "pdf";

        const invoice = await prisma.eDMInvoice.findFirst({
            where: { id, shopId },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
        }

        // Önce EDM'den dene
        try {
            const buffer = await EdmService.getInvoiceDocument(invoice.uuid, format);
            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    "Content-Type": format === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${invoice.invoiceId}.${format}"`,
                },
            });
        } catch (edmError: any) {
            console.warn(`[EDM] PDF/HTML indirme başarısız: ${edmError.message}`);
        }

        // Fallback: lokal HTML oluştur
        if (format === "html") {
            const html = generateLocalHtml(invoice);
            return new NextResponse(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${invoice.invoiceId}.html"`,
                },
            });
        }

        // Fallback: puppeteer ile PDF
        const puppeteer = await import("puppeteer");
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const html = generateLocalHtml(invoice);
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${invoice.invoiceId}.pdf"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateLocalHtml(invoice: any): string {
    const lines = invoice.lines || [];
    const issueDate = new Date(invoice.issueDate).toLocaleDateString("tr-TR");
    const subtotal = Number(invoice.subtotal).toFixed(2);
    const taxTotal = Number(invoice.taxTotal).toFixed(2);
    const total = Number(invoice.totalAmount).toFixed(2);

    const linesHtml = lines
        .map(
            (line: any, i: number) => `
        <tr>
            <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
            <td style="padding:8px;border:1px solid #ddd;">${line.name}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${line.quantity}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(line.unitPrice).toFixed(2)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${line.vatRate}%</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(line.totalPrice).toFixed(2)}</td>
        </tr>
    `
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Fatura ${invoice.invoiceId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .meta { margin-bottom: 24px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
        .totals { margin-top: 16px; text-align: right; }
        .totals div { margin: 4px 0; }
        .total { font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>e-Fatura / e-Arşiv</h1>
    <div class="meta">
        <div><strong>Fatura No:</strong> ${invoice.invoiceId}</div>
        <div><strong>UUID:</strong> ${invoice.uuid}</div>
        <div><strong>Tarih:</strong> ${issueDate}</div>
        <div><strong>Durum:</strong> ${invoice.status}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th># </th>
                <th>Ürün/Hizmet</th>
                <th>Adet</th>
                <th>Birim Fiyat</th>
                <th>KDV</th>
                <th>Toplam</th>
            </tr>
        </thead>
        <tbody>
            ${linesHtml}
        </tbody>
    </table>

    <div class="totals">
        <div>Ara Toplam: ${subtotal} ${invoice.currency}</div>
        <div>KDV Toplam: ${taxTotal} ${invoice.currency}</div>
        <div class="total">Genel Toplam: ${total} ${invoice.currency}</div>
    </div>
</body>
</html>`;
}
