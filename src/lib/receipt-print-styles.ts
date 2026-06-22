/**
 * Shared receipt printing utilities.
 * All receipt modules use these functions for consistent thermal printer output.
 */

/**
 * Returns the full CSS string needed for thermal printer rendering.
 * Covers all Tailwind utility classes used across receipt templates.
 */
export function getReceiptPrintCSS(paperSize: string): string {
    return `
        @page { 
            size: ${paperSize} auto; 
            margin: 0; 
        }
        html, body {
            margin: 0;
            padding: 0;
            height: auto !important;
            width: ${paperSize};
            background: white;
            -webkit-print-color-adjust: exact;
        }
        body { 
            font-family: 'Courier New', Courier, monospace;
        }
        .receipt-container {
            width: 100%;
            height: auto !important;
            min-height: 100px;
            overflow: visible !important;
            padding: 2mm 4mm;
            box-sizing: border-box;
            background: white;
            color: black;
            margin: 0;
            display: block;
        }
        
        /* Layout Utilities */
        .flex { display: flex; }
        .inline-flex { display: inline-flex; }
        .inline-block { display: inline-block; }
        .block { display: block; }
        .grid { display: grid; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .flex-col { flex-direction: column; }
        .flex-1 { flex: 1; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .items-end { align-items: flex-end; }
        .items-baseline { align-items: baseline; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: bold; }
        .font-medium { font-weight: 500; }
        .font-normal { font-weight: normal; }
        .uppercase { text-transform: uppercase; }
        .italic { font-style: italic; }
        
        /* Spacing */
        .mt-0\\.5 { margin-top: 2px; }
        .mt-1 { margin-top: 2px; }
        .mt-2 { margin-top: 4px; }
        .mt-3 { margin-top: 6px; }
        .mt-4 { margin-top: 10px; }
        .mt-8 { margin-top: 20px; }
        .mb-0\\.5 { margin-bottom: 2px; }
        .mb-1 { margin-bottom: 2px; }
        .mb-1\\.5 { margin-bottom: 3px; }
        .mb-2 { margin-bottom: 4px; }
        .mb-3 { margin-bottom: 6px; }
        .mb-4 { margin-bottom: 8px; }
        .mb-6 { margin-bottom: 12px; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .pb-1 { padding-bottom: 2px; }
        .pb-2 { padding-bottom: 4px; }
        .pb-3 { padding-bottom: 6px; }
        .pb-4 { padding-bottom: 8px; }
        .pt-1 { padding-top: 2px; }
        .pt-1\\.5 { padding-top: 3px; }
        .pt-3 { padding-top: 6px; }
        .pt-4 { padding-top: 10px; }
        .px-1 { padding-left: 2px; padding-right: 2px; }
        .px-2 { padding-left: 4px; padding-right: 4px; }
        .py-0\\.5 { padding-top: 1px; padding-bottom: 1px; }
        .py-1 { padding-top: 2px; padding-bottom: 2px; }
        .py-1\\.5 { padding-top: 3px; padding-bottom: 3px; }
        .py-2 { padding-top: 4px; padding-bottom: 4px; }
        .p-1 { padding: 1mm; }
        .p-2 { padding: 2mm; }
        .p-3 { padding: 3mm; }
        .p-4 { padding: 4mm; }
        .gap-0 { gap: 0; }
        .gap-0\\.5 { gap: 1px; }
        .gap-1 { gap: 2px; }
        .gap-1\\.5 { gap: 3px; }
        .gap-2 { gap: 4px; }
        .gap-4 { gap: 8px; }
        .space-y-0\\.5 > * + * { margin-top: 1px; }
        .space-y-1 > * + * { margin-top: 2px; }
        .space-y-1\\.5 > * + * { margin-top: 3px; }
        .space-y-2 > * + * { margin-top: 4px; }
        .space-y-3 > * + * { margin-top: 6px; }
        .space-y-4 > * + * { margin-top: 8px; }
        
        /* Borders */
        .border { border: 1px solid #e2e8f0; }
        .border-2 { border: 1.5px solid black; }
        .border-b { border-bottom: 1px solid #e2e8f0; }
        .border-b-2 { border-bottom: 1.5px solid black; }
        .border-b-4 { border-bottom: 3px solid black; }
        .border-t { border-top: 1px solid #e2e8f0; }
        .border-t-2 { border-top: 1.5px solid black; }
        .border-black { border-color: black; }
        .border-white\\/40 { border-color: rgba(255, 255, 255, 0.4); }
        .border-dashed { border-style: dashed; }
        .border-dotted { border-style: dotted; }
        .border-collapse { border-collapse: collapse; }
        .border-slate-200 { border-color: #e2e8f0; }
        .border-slate-300 { border-color: #cbd5e1; }
        .border-slate-400 { border-color: #94a3b8; }
        .border-emerald-100 { border-color: #d1fae5; }
        
        /* Sizing */
        .w-full { width: 100%; }
        .w-3 { width: 12px; }
        .w-6 { width: 24px; }
        .w-8 { width: 32px; }
        .w-20 { width: 80px; }
        .w-24 { width: 96px; }
        .h-0\\.5 { height: 2px; }
        .h-3 { height: 12px; }
        .h-10 { height: 35px; }
        .h-\\[1px\\] { height: 1px; }
        .h-\\[1\\.5px\\] { height: 1.5px; }
        .min-h-\\[50px\\] { min-height: 50px; }
        .shrink-0 { flex-shrink: 0; }
        
        /* Visual */
        .bg-white { background: white; }
        .bg-black { background: black; }
        .bg-slate-100 { background: #f1f5f9; }
        .bg-emerald-50 { background: #ecfdf5; }
        .bg-emerald-100 { background: #d1fae5; }
        .text-white { color: white; }
        .text-black { color: black; }
        .text-slate-400 { color: #94a3b8; }
        .text-slate-900 { color: #0f172a; }
        .text-emerald-600 { color: #059669; }
        .text-emerald-700 { color: #047857; }
        .text-rose-600 { color: #e11d48; }
        .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .grayscale { filter: grayscale(1); }
        .contrast-150 { filter: contrast(1.5); }
        .contrast-\\[2\\] { filter: contrast(2); }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .rounded-full { border-radius: 9999px; }
        .rounded-sm { border-radius: 2px; }
        .rounded-md { border-radius: 4px; }
        .rounded-lg { border-radius: 6px; }
        .overflow-hidden { overflow: hidden; }
        .break-words { word-break: break-word; }
        .whitespace-normal { white-space: normal; }
        .whitespace-nowrap { white-space: nowrap; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .align-middle { vertical-align: middle; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .top-4 { top: 8px; }
        .right-4 { right: 8px; }
        .opacity-60 { opacity: 0.6; }
        .opacity-\\[0\\.03\\] { opacity: 0.03; }

        /* Absolute Font Sizes for Thermal Printers */
        .text-2xl { font-size: 16pt !important; }
        .text-xl { font-size: 13pt !important; }
        .text-lg { font-size: 11pt !important; }
        .text-sm { font-size: 10pt !important; }
        .text-xs { font-size: 9pt !important; }
        .text-\\[6px\\] { font-size: 5pt !important; }
        .text-\\[6\\.5px\\] { font-size: 5.5pt !important; }
        .text-\\[7px\\] { font-size: 6pt !important; }
        .text-\\[8px\\] { font-size: 7pt !important; }
        .text-\\[9px\\] { font-size: 7.5pt !important; }
        .text-\\[10px\\] { font-size: 8.5pt !important; }
        .text-\\[11px\\] { font-size: 9.5pt !important; }
        .text-\\[13px\\] { font-size: 10pt !important; }
        .text-\\[14px\\] { font-size: 11pt !important; }
        
        .leading-tight { line-height: 1.35; }
        .leading-none { line-height: 1; }
        .leading-relaxed { line-height: 1.4; }
        .tracking-widest { letter-spacing: 0.1em; }
        .tracking-wider { letter-spacing: 0.05em; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-\\[0\\.1em\\] { letter-spacing: 0.1em; }
        .tracking-\\[0\\.3em\\] { letter-spacing: 0.3em; }
        .tracking-\\[0\\.4em\\] { letter-spacing: 0.4em; }

        /* SVG icons must be hidden in print, except barcodes */
        svg { display: none !important; }
        .barcode-svg svg { display: inline-block !important; }
        
        /* Decorative elements hidden in print */
        .print-hide-decoration { display: none !important; }
        .print-hide { display: none !important; }

        @media print {
            body { background: white; }
            .receipt-container { 
                box-shadow: none;
                border: none;
            }
        }
    `;
}

/**
 * Opens a new window with the receipt content and triggers print.
 */
export function printReceipt(
    receiptRef: React.RefObject<HTMLDivElement | null>,
    paperSize: string,
    title: string
): void {
    if (!receiptRef.current) {
        console.error("Print failed: Receipt ref is null");
        return;
    }

    const content = receiptRef.current.innerHTML;
    if (!content) {
        console.error("Print failed: Receipt content is empty");
        return;
    }

    const w = window.open("", "_blank");
    if (!w) {
        alert("Pop-up engelleyici yazıcıyı engelliyor. Lütfen izin verin.");
        return;
    }

    w.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>${getReceiptPrintCSS(paperSize)}</style>
            </head>
            <body class="bg-white">
                <div class="receipt-container">
                    ${content}
                </div>
            </body>
        </html>
    `);

    w.document.close();

    // Wait for content and styles to be ready
    w.onload = () => {
        setTimeout(() => {
            w.focus();
            w.print();
            w.close();
        }, 500);
    };

    // Fallback if onload doesn't fire (some browsers with about:blank)
    setTimeout(() => {
        if (!w.closed) {
            w.focus();
            w.print();
            w.close();
        }
    }, 1000);
}

/**
 * Generates a high-resolution PNG image of the receipt for download/sharing.
 */
export async function generateReceiptImage(
    receiptRef: React.RefObject<HTMLDivElement | null>
): Promise<Blob | null> {
    if (!receiptRef.current) return null;

    // Add temporary class for targeting in onclone
    receiptRef.current.classList.add('receipt-capture-target');

    try {
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default;
        const canvas = await html2canvas(receiptRef.current, {
            scale: 6,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            windowHeight: 8000, // Force large virtual viewport to prevent clipping long lists
            onclone: (clonedDoc) => {
                const capturedEl = clonedDoc.querySelector('.receipt-capture-target') as HTMLElement;
                if (capturedEl) {
                    // Force the background to be white and remove any shadow/border that might interfere
                    capturedEl.style.boxShadow = 'none';
                    capturedEl.style.border = 'none';
                    capturedEl.style.padding = '0';
                    capturedEl.style.margin = '0';
                    capturedEl.style.width = '384px'; // Max thermal width (approx 80mm)
                    capturedEl.style.height = 'fit-content';
                    capturedEl.style.display = 'block';

                    const el = capturedEl.querySelector('.font-mono') as HTMLElement;
                    if (el) el.style.fontFamily = "'Courier New', monospace";

                    // CRITICAL: Ensure the cloned hierarchy allows full vertical growth
                    let current: HTMLElement | null = capturedEl;
                    while (current && current.tagName !== 'HTML') {
                        current.style.maxHeight = 'none';
                        current.style.height = 'auto';
                        current.style.minHeight = '0';
                        current.style.overflow = 'visible';
                        // Add extra padding to the very bottom to prevent character clipping
                        if (current === capturedEl) {
                            current.style.paddingBottom = '30px';
                        }
                        current = current.parentElement as HTMLElement | null;
                    }
                }
            }
        });
        receiptRef.current.classList.remove('receipt-capture-target');
        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
        });
    } catch (err) {
        if (receiptRef.current) {
            receiptRef.current.classList.remove('receipt-capture-target');
        }
        console.error("Receipt image generation failed", err);
        return null;
    }
}

/**
 * Downloads the receipt as a PNG image.
 */
export async function downloadReceiptImage(
    receiptRef: React.RefObject<HTMLDivElement | null>,
    filename: string
): Promise<void> {
    const blob = await generateReceiptImage(receiptRef);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generates a professional table-based PDF for debt records.
 */
export async function generateDebtPDF(data: {
    customerName: string;
    customerPhone?: string;
    shopName: string;
    shopPhone?: string;
    items: any[];
    totals: {
        try: number;
        usd: number;
        portfolioTRY: number;
    };
    filename: string;
}) {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Set Header
    doc.setFontSize(18);
    doc.text(data.shopName, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(data.shopPhone || "", 105, 20, { align: 'center' });

    doc.line(20, 25, 190, 25);

    // Customer Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MÜŞTERİ:", 20, 35);
    doc.setFont("helvetica", "normal");
    doc.text(data.customerName, 50, 35);
    if (data.customerPhone) {
        doc.text(data.customerPhone, 50, 40);
    }

    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 190, 35, { align: 'right' });

    // Table Data
    const tableData = data.items.map(item => [
        new Date(item.createdAt).toLocaleDateString('tr-TR'),
        item.type === 'PAYMENT' ? '[TAHSİLAT] ' + (item.notes || '') : (item.notes || item.description || 'BORÇ'),
        new Intl.NumberFormat(item.currency === 'USD' ? 'en-US' : 'tr-TR', {
            style: 'currency',
            currency: item.currency || 'TRY'
        }).format(item.amount)
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['Tarih', 'Açıklama', 'Tutar']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        styles: { font: 'helvetica', fontSize: 9 },
        columnStyles: {
            2: { halign: 'right' }
        }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOPLAM TL BORCU:", 140, finalY, { align: 'right' });
    doc.text(new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.totals.try), 190, finalY, { align: 'right' });

    if (data.totals.usd > 0) {
        doc.text("TOPLAM USD BORCU:", 140, finalY + 7, { align: 'right' });
        doc.text(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totals.usd), 190, finalY + 7, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setFillColor(240, 240, 240);
    doc.rect(130, finalY + 12, 65, 12, 'F');
    doc.text("GENEL TOPLAM:", 140, finalY + 20, { align: 'right' });
    doc.text(new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.totals.portfolioTRY), 190, finalY + 20, { align: 'right' });

    doc.save(data.filename);
}

/**
 * Generates a professional PDF from a DOM element.
 * This is the preferred way to support Turkish characters and complex styling,
 * as it leverages the browser's rendering engine via html2canvas.
 */
export async function generateProfessionalPDF(
    element: HTMLElement,
    filename: string
): Promise<void> {
    try {
        const { jsPDF } = await import("jspdf");
        const html2canvasModule = await import("html2canvas");
        const html2canvas = html2canvasModule.default;

        const canvas = await html2canvas(element, {
            scale: 4, // 4-5x scale is best for high-quality printing
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        const pdfWidth = 210; // A4 width in mm
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const imgRatio = imgHeightPx / imgWidthPx;
        const pdfHeight = Math.max(297, pdfWidth * imgRatio);

        const pdf = new jsPDF("p", "mm", [pdfWidth, pdfHeight]);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
    } catch (err) {
        console.error("PDF generation failed", err);
    }
}

/**
 * Returns the width class for the receipt container based on paper size.
 */
export function getReceiptWidthClass(paperSize: string): string {
    switch (paperSize) {
        case "58mm": return "w-[58mm]";
        case "80mm": return "w-[80mm]";
        default: return "w-[72mm]";
    }
}
