import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // XSLT dosyasini oku
        const xsltPath = join(process.cwd(), "public", "xslt", "general.xslt");
        const xsltContent = readFileSync(xsltPath, "utf8");

        // XML'i al - simdlik ornek XML kullan
        // Gercek implementasyonda DB'den veya EDM'den XML alinacak
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${id}</cbc:ID>
  <cbc:IssueDate>2026-05-23</cbc:IssueDate>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Basar Teknik</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Test Musteri</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="TRY">100.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

        // XSLT donusumu yap - simdilik basit HTML donusumu
        // Gercek implementasyonda xslt-processor veya benzeri kutuphane kullanilacak
        const result = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Fatura ${id}</title></head>
<body>
<h1>Fatura #${id}</h1>
<pre>${xmlContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
<hr/>
<h2>XSLT Sablonu</h2>
<pre>${xsltContent.slice(0, 500)}...</pre>
</body>
</html>`;

        // HTML olarak dondur
        return new NextResponse(result, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    } catch (error: any) {
        console.error("[XSLT Render] Hata:", error);
        return NextResponse.json(
            { error: "Fatura render hatasi", detail: error.message },
            { status: 500 }
        );
    }
}
