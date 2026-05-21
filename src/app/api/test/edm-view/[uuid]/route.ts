import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

interface MockInvoice {
    uuid: string;
    invoiceNo: string;
    issueDate: string;
    dueDate: string;
    sender: {
        name: string;
        vkn: string;
        address: string;
        city: string;
    };
    buyer: {
        name: string;
        tckn: string;
        address: string;
        city: string;
    };
    lines: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        amount: number;
    }>;
    subtotal: number;
    vatAmount: number;
    total: number;
    currency: string;
    note: string;
}

const GIB_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/5/50/Gelir_%C4%B0daresi_Ba%C5%9Fkanl%C4%B1%C4%9F%C4%B1_logo.svg";

function getMockInvoice(uuid: string): MockInvoice {
    const now = new Date();
    const issueDate = now.toISOString().split("T")[0];
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    return {
        uuid,
        invoiceNo: `TST${issueDate.replace(/-/g, "")}000001`,
        issueDate,
        dueDate,
        sender: {
            name: "BASAR TEKNIK",
            vkn: process.env.EDM_SENDER_VKN || "1111111111",
            address: "Test Caddesi No: 1",
            city: "Istanbul",
        },
        buyer: {
            name: "Test Musteri",
            tckn: "11111111111",
            address: "Test Adres",
            city: "Istanbul",
        },
        lines: [
            {
                description: "Test Servis Hizmeti",
                quantity: 1,
                unitPrice: 100,
                vatRate: 20,
                amount: 100,
            },
        ],
        subtotal: 100,
        vatAmount: 20,
        total: 120,
        currency: "TRY",
        note: "Test faturasidir. EDM test sunucusunda uretilmistir.",
    };
}

function formatDateTR(dateStr: string): string {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function htmlEscape(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatInvoiceMoney(amount: number, currency: string): string {
    const symbol = currency === "TRY" ? "TL " : `${currency} `;
    return `${symbol}${amount.toFixed(2).replace(".", ",")}`;
}

async function generateInvoiceHTML(invoice: MockInvoice): Promise<string> {
    const qrPayload = JSON.stringify({
        belgeTipi: "e-FATURA",
        faturaNo: invoice.invoiceNo,
        uuid: invoice.uuid,
        tarih: invoice.issueDate,
        alici: invoice.buyer.name,
        vknTckn: invoice.buyer.tckn,
        toplam: invoice.total,
        paraBirimi: invoice.currency,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 148,
        color: {
            dark: "#111827",
            light: "#ffffff",
        },
    });
    const lineRows = invoice.lines
        .map(
            (line, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>
                                <strong>${htmlEscape(line.description)}</strong>
                                <span>Servis / hizmet kalemi</span>
                            </td>
                            <td class="numeric">${htmlEscape(line.quantity)}</td>
                            <td class="numeric">${formatInvoiceMoney(line.unitPrice, invoice.currency)}</td>
                            <td class="numeric">%${htmlEscape(line.vatRate)}</td>
                            <td class="numeric">${formatInvoiceMoney(line.amount, invoice.currency)}</td>
                        </tr>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>e-FATURA - ${htmlEscape(invoice.invoiceNo)}</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #111827;
            --muted: #4b5563;
            --line: #d7dce2;
            --soft: #f5f7fa;
            --official: #b91c1c;
            --blue: #1d4ed8;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            background: #eef1f5;
            color: var(--ink);
        }
        .toolbar {
            width: 210mm;
            margin: 0 auto 14px;
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        .toolbar button,
        .toolbar .pdf-button {
            border: 1px solid #c8ced6;
            background: #fff;
            color: var(--ink);
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            padding: 9px 13px;
            text-decoration: none;
        }
        .document {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            border: 1px solid var(--line);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
        }
        .top-line {
            height: 5px;
            background: linear-gradient(90deg, var(--official), var(--official) 48%, var(--blue) 48%, var(--blue));
        }
        .page { padding: 18mm 16mm 14mm; }
        .masthead {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            border-bottom: 2px solid var(--ink);
            padding-bottom: 16px;
        }
        .gib-logo {
            width: 176px;
            height: auto;
            display: block;
        }
        .title-block {
            text-align: center;
            flex: 1;
            padding-top: 2px;
        }
        .title-block .kicker {
            margin: 0 0 10px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: var(--muted);
        }
        .title-block h1 {
            margin: 0;
            font-size: 30px;
            letter-spacing: 0;
            color: var(--official);
        }
        .title-block .hierarchy {
            margin-top: 8px;
            font-size: 11px;
            font-weight: 700;
            color: var(--ink);
        }
        .qr-card {
            width: 132px;
            text-align: center;
            border: 1px solid var(--line);
            padding: 8px;
            background: #fff;
        }
        .qr-card img {
            width: 100%;
            display: block;
        }
        .qr-card span {
            display: block;
            margin-top: 6px;
            font-size: 9px;
            font-weight: 700;
            color: var(--muted);
        }
        .meta-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            border: 1px solid var(--line);
            border-top: 0;
        }
        .meta-item {
            padding: 9px 10px;
            border-right: 1px solid var(--line);
        }
        .meta-item:last-child { border-right: 0; }
        .meta-item span {
            display: block;
            color: var(--muted);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .meta-item strong {
            display: block;
            margin-top: 5px;
            font-size: 12px;
        }
        .section { margin-top: 18px; }
        .party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }
        .party-box,
        .note-box {
            border: 1px solid var(--line);
            background: #fff;
        }
        .box-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin: 0;
            padding: 9px 11px;
            border-bottom: 1px solid var(--line);
            background: var(--soft);
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .box-title small {
            color: var(--muted);
            font-size: 9px;
            font-weight: 700;
        }
        .party-content { padding: 12px; }
        .party-name {
            margin: 0 0 9px;
            font-size: 16px;
            font-weight: 800;
        }
        .kv {
            display: grid;
            grid-template-columns: 104px 1fr;
            gap: 6px 10px;
            margin: 0;
            font-size: 12px;
            line-height: 1.45;
        }
        .kv dt {
            color: var(--muted);
            font-weight: 700;
        }
        .kv dd { margin: 0; }
        .lines-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid var(--line);
        }
        .lines-table th {
            background: #1f2937;
            color: #fff;
            font-size: 10px;
            padding: 9px 8px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        .lines-table td {
            border-top: 1px solid var(--line);
            padding: 10px 8px;
            font-size: 12px;
            vertical-align: top;
        }
        .lines-table td span {
            display: block;
            margin-top: 3px;
            color: var(--muted);
            font-size: 10px;
        }
        .numeric {
            text-align: right;
            white-space: nowrap;
        }
        .totals-grid {
            display: grid;
            grid-template-columns: 1fr 270px;
            gap: 14px;
            align-items: start;
            margin-top: 14px;
        }
        .note-box { min-height: 118px; }
        .note-box p {
            margin: 0;
            padding: 12px;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.55;
        }
        .summary {
            border: 1px solid var(--line);
            background: #fff;
        }
        .summary-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            border-bottom: 1px solid var(--line);
            padding: 9px 10px;
            font-size: 12px;
        }
        .summary-row:last-child { border-bottom: 0; }
        .summary-row strong { font-size: 15px; }
        .summary-row.total {
            background: #fee2e2;
            border-top: 2px solid var(--official);
            color: #7f1d1d;
            font-weight: 800;
        }
        .seal-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 14px;
            color: var(--muted);
            font-size: 10px;
        }
        .seal {
            border: 1px solid var(--line);
            padding: 9px 10px;
            width: 48%;
            min-height: 48px;
            background: var(--soft);
        }
        .seal strong {
            display: block;
            color: var(--ink);
            margin-bottom: 4px;
        }
        .legal-footer {
            margin-top: 18px;
            border-top: 1px solid var(--line);
            padding-top: 11px;
            color: var(--muted);
            font-size: 10px;
            line-height: 1.55;
        }
        @page {
            size: A4;
            margin: 0;
        }
        @media (max-width: 860px) {
            body { padding: 12px; }
            .document,
            .toolbar { width: 100%; }
            .page { padding: 18px; }
            .masthead,
            .party-grid,
            .totals-grid {
                display: grid;
                grid-template-columns: 1fr;
            }
            .meta-strip { grid-template-columns: 1fr 1fr; }
            .meta-item { border-bottom: 1px solid var(--line); }
            .qr-card { width: 132px; }
        }
        @media print {
            body {
                background: #fff;
                padding: 0;
            }
            .toolbar { display: none; }
            .document {
                width: 210mm;
                min-height: 297mm;
                border: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="window.print()">Yazdir</button>
        <button onclick="downloadHTML()">HTML Indir</button>
        <a href="?format=pdf" class="pdf-button">PDF Goruntule</a>
    </div>

    <main class="document">
        <div class="top-line"></div>
        <div class="page">
            <header class="masthead">
                <img class="gib-logo" src="${GIB_LOGO_URL}" alt="Gelir Idaresi Baskanligi">
                <div class="title-block">
                    <p class="kicker">T.C. HAZINE VE MALIYE BAKANLIGI</p>
                    <h1>e-FATURA</h1>
                    <div class="hierarchy">Gelir Idaresi Baskanligi &middot; e-Belge Sistemi &middot; UBL-TR 1.2</div>
                </div>
                <div class="qr-card">
                    <img src="${qrCodeDataUrl}" alt="Fatura dogrulama QR kodu">
                    <span>GIB QR DOGRULAMA</span>
                </div>
            </header>

            <section class="meta-strip" aria-label="Fatura ust bilgileri">
                <div class="meta-item">
                    <span>Fatura No</span>
                    <strong>${htmlEscape(invoice.invoiceNo)}</strong>
                </div>
                <div class="meta-item">
                    <span>Fatura Tarihi</span>
                    <strong>${htmlEscape(formatDateTR(invoice.issueDate))}</strong>
                </div>
                <div class="meta-item">
                    <span>Senaryo</span>
                    <strong>TEMELFATURA</strong>
                </div>
                <div class="meta-item">
                    <span>Belge Tipi</span>
                    <strong>SATIS</strong>
                </div>
            </section>

            <section class="section party-grid">
                <article class="party-box">
                    <h2 class="box-title">Satici Bilgileri <small>Accounting Supplier Party</small></h2>
                    <div class="party-content">
                        <p class="party-name">${htmlEscape(invoice.sender.name)}</p>
                        <dl class="kv">
                            <dt>VKN</dt>
                            <dd>${htmlEscape(invoice.sender.vkn)}</dd>
                            <dt>Vergi Dairesi</dt>
                            <dd>Kurumsal e-Belge Servisi</dd>
                            <dt>Adres</dt>
                            <dd>${htmlEscape(invoice.sender.address)}</dd>
                            <dt>Il</dt>
                            <dd>${htmlEscape(invoice.sender.city)}</dd>
                        </dl>
                    </div>
                </article>

                <article class="party-box">
                    <h2 class="box-title">Alici Bilgileri <small>Accounting Customer Party</small></h2>
                    <div class="party-content">
                        <p class="party-name">${htmlEscape(invoice.buyer.name)}</p>
                        <dl class="kv">
                            <dt>TCKN / VKN</dt>
                            <dd>${htmlEscape(invoice.buyer.tckn)}</dd>
                            <dt>Vergi Dairesi</dt>
                            <dd>Belirtilmedi</dd>
                            <dt>Adres</dt>
                            <dd>${htmlEscape(invoice.buyer.address)}</dd>
                            <dt>Il</dt>
                            <dd>${htmlEscape(invoice.buyer.city)}</dd>
                        </dl>
                    </div>
                </article>
            </section>

            <section class="section">
                <table class="lines-table">
                    <thead>
                        <tr>
                            <th style="width: 42px;">Sira</th>
                            <th>Mal / Hizmet</th>
                            <th class="numeric">Miktar</th>
                            <th class="numeric">Birim Fiyat</th>
                            <th class="numeric">KDV</th>
                            <th class="numeric">Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineRows}
                    </tbody>
                </table>
            </section>

            <section class="totals-grid">
                <article class="note-box">
                    <h2 class="box-title">Aciklamalar <small>Notes</small></h2>
                    <p>${htmlEscape(invoice.note || "Bu fatura elektronik ortamda duzenlenmistir.")}</p>
                </article>
                <aside class="summary" aria-label="Fatura tutar ozeti">
                    <div class="summary-row">
                        <span>Mal / Hizmet Toplami</span>
                        <strong>${formatInvoiceMoney(invoice.subtotal, invoice.currency)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Hesaplanan KDV</span>
                        <strong>${formatInvoiceMoney(invoice.vatAmount, invoice.currency)}</strong>
                    </div>
                    <div class="summary-row total">
                        <span>Odenecek Tutar</span>
                        <strong>${formatInvoiceMoney(invoice.total, invoice.currency)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Para Birimi</span>
                        <strong>${htmlEscape(invoice.currency)}</strong>
                    </div>
                </aside>
            </section>

            <section class="seal-row">
                <div class="seal">
                    <strong>e-Belge Hiyerarsisi</strong>
                    Bakanlik > GIB > e-Fatura > UBL-TR > ${htmlEscape(invoice.invoiceNo)}
                </div>
                <div class="seal">
                    <strong>Belge Kimligi</strong>
                    UUID: ${htmlEscape(invoice.uuid)}<br>
                    Vade Tarihi: ${htmlEscape(formatDateTR(invoice.dueDate))}
                </div>
            </section>

            <footer class="legal-footer">
                Bu cikti, e-Belge gorunum hiyerarsisine uygun kurumsal onizleme sablonu olarak uretilmistir. Canli entegrasyonda fatura no, musteri bilgileri, servis kalemleri, tutarlar ve dogrulama QR verisi EDM/GIB yanitlarindan dinamik olarak basilir.
            </footer>
        </div>
    </main>

    <script>
        function downloadHTML() {
            const html = document.documentElement.outerHTML;
            const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "efatura_${htmlEscape(invoice.invoiceNo)}.html");
            link.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>
    `;
}

function escapePDFString(value: string): string {
    return value.replace(/([\\()])/g, "\\$1");
}

function formatMoney(amount: number): string {
    return `TRY ${amount.toFixed(2).replace(".", ",")}`;
}

function generateInvoicePDF(invoice: MockInvoice): Uint8Array {
    const lines: string[] = [
        "BT",
        "/F1 18 Tf",
        "50 760 Td",
        "(e-FATURA) Tj",
        "0 -28 Td",
        "/F1 12 Tf",
        `(${escapePDFString(`Fatura No: ${invoice.invoiceNo}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(`Tarih: ${formatDateTR(invoice.issueDate)}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(`Vade: ${formatDateTR(invoice.dueDate)}`)}) Tj`,
        "0 -24 Td",
        `(${escapePDFString(`Satici: ${invoice.sender.name}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(`VKN: ${invoice.sender.vkn}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(invoice.sender.address)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(invoice.sender.city)}) Tj`,
        "0 -24 Td",
        `(${escapePDFString(`Alici: ${invoice.buyer.name}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(`TCKN: ${invoice.buyer.tckn}`)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(invoice.buyer.address)}) Tj`,
        "0 -18 Td",
        `(${escapePDFString(invoice.buyer.city)}) Tj`,
        "0 -24 Td",
        "/F1 10 Tf",
        `(${escapePDFString("Kalemler:")}) Tj`,
        "0 -18 Td",
    ];

    invoice.lines.forEach((line, index) => {
        lines.push(`(${escapePDFString(`${index + 1}. ${line.description} - ${line.quantity} x ${formatMoney(line.unitPrice)} = ${formatMoney(line.amount)}`)}) Tj`);
        if (index < invoice.lines.length - 1) {
            lines.push("0 -14 Td");
        }
    });

    lines.push("0 -24 Td");
    lines.push(`(${escapePDFString(`Ara Toplam: ${formatMoney(invoice.subtotal)}`)}) Tj`);
    lines.push("0 -18 Td");
    lines.push(`(${escapePDFString(`KDV: ${formatMoney(invoice.vatAmount)}`)}) Tj`);
    lines.push("0 -18 Td");
    lines.push(`(${escapePDFString(`Genel Toplam: ${formatMoney(invoice.total)}`)}) Tj`);
    lines.push("ET");

    const content = lines.join("\n");
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);

    const objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`,
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];

    const pdfParts: Uint8Array[] = [];
    const header = encoder.encode("%PDF-1.3\n");
    pdfParts.push(header);

    const offsets: number[] = [];
    let cursor = header.length;

    for (const object of objects) {
        offsets.push(cursor);
        const objectBytes = encoder.encode(object);
        pdfParts.push(objectBytes);
        cursor += objectBytes.length;
    }

    const xrefHeader = encoder.encode("xref\n0 6\n");
    pdfParts.push(xrefHeader);
    cursor += xrefHeader.length;

    const xrefEntries = [
        "0000000000 65535 f \n",
        ...offsets.map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`),
    ].join("");
    const xrefBytes = encoder.encode(xrefEntries);
    pdfParts.push(xrefBytes);
    cursor += xrefBytes.length;

    const trailer = encoder.encode(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offsets[0]}\n%%EOF\n`);
    pdfParts.push(trailer);

    const result = new Uint8Array(cursor + trailer.length);
    let offset = 0;
    for (const part of pdfParts) {
        result.set(part, offset);
        offset += part.length;
    }

    return result;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { uuid: string } }
) {
    const { uuid } = await Promise.resolve(params);
    const searchParams = request.nextUrl.searchParams;

    if (!uuid || !uuid.trim()) {
        return new NextResponse("UUID parametresi eksik", { status: 400 });
    }

    const invoice = getMockInvoice(uuid.trim());
    const format = searchParams.get("format")?.toLowerCase() || "html";

    if (format === "pdf") {
        const pdfBytes = generateInvoicePDF(invoice);
        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="fatura-${invoice.invoiceNo}.pdf"`,
            },
        });
    }

    const html = await generateInvoiceHTML(invoice);

    return new NextResponse(html, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `inline; filename="fatura-${uuid}.html"`,
        },
    });
}
