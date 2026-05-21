/**
 * EDM REST API entegrasyonu test example
 * 
 * 4. Adım - Fatura Belgesi Indirme ve Önizleme
 */

import { EdmService } from "@/lib/edm/service";

// Test Example 1: Fatura PDF'sini indir
async function testGetInvoicePdf() {
    try {
        const uuid = "3694852c-47a6-4297-baf2-f5eacad032e9"; // Kullanıcının UUID'si
        
        console.log(`\n📥 EDM'den UUID ${uuid} için PDF indiriliyor...`);
        
        const pdfBuffer = await EdmService.getInvoiceDocument(uuid, "pdf");
        
        console.log(`✅ PDF başarılı! Boyut: ${pdfBuffer.length} bytes`);
        console.log(`📄 URL: http://localhost:5000/api/test/edm-view/${uuid}`);
        console.log(`📄 URL (HTML): http://localhost:5000/api/test/edm-view/${uuid}?format=html`);
        
        return pdfBuffer;
    } catch (error) {
        console.error("❌ PDF indirimi başarısız:", error);
        throw error;
    }
}

// Test Example 2: Fatura HTML'sini indir
async function testGetInvoiceHtml() {
    try {
        const uuid = "3694852c-47a6-4297-baf2-f5eacad032e9";
        
        console.log(`\n📋 EDM'den UUID ${uuid} için HTML indiriliyor...`);
        
        const htmlBuffer = await EdmService.getInvoiceDocument(uuid, "html");
        
        console.log(`✅ HTML başarılı! Boyut: ${htmlBuffer.length} bytes`);
        console.log(`📄 URL: http://localhost:5000/api/test/edm-view/${uuid}?format=html`);
        
        return htmlBuffer;
    } catch (error) {
        console.error("❌ HTML indirimi başarısız:", error);
        throw error;
    }
}

// Tarayıcıda Test:
// 1. PDF önizlemesi:
//    http://localhost:5000/api/test/edm-view/3694852c-47a6-4297-baf2-f5eacad032e9
//
// 2. HTML önizlemesi:
//    http://localhost:5000/api/test/edm-view/3694852c-47a6-4297-baf2-f5eacad032e9?format=html

if (require.main === module) {
    // Node.js'den doğrudan çalıştırıldıysa
    testGetInvoicePdf()
        .then(() => console.log("✅ Test tamamlandı"))
        .catch(error => console.error("❌ Test hatası:", error));
}

export { testGetInvoicePdf, testGetInvoiceHtml };
