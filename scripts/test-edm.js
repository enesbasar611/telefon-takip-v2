require('dotenv').config();
require('ts-node/register');
const { sendInvoice } = require('../src/lib/edm/rest-client');

async function main() {
    console.log("═══ EDM REST CLIENT TEST (UBL + UPPERCASE) ═══");

    const credentials = {
        username: process.env.EDM_USERNAME || "basarteknik",
        password: process.env.EDM_PASSWORD || "Abc.123",
        senderVkn: process.env.EDM_SENDER_VKN || "3230512384",
        baseUrl: "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test"
    };

    const payload = {
        invoiceId: "TST2026000000001",
        issueDate: new Date().toISOString(),
        currency: "TRY",
        items: [
            {
                name: "Test Entegrasyon Ürünü",
                quantity: 1,
                unitPrice: 100,
                vatRate: 20
            }
        ],
        customer: {
            vknTckn: "1111111111", // Test VKN
            name: "Test Müşterisi A.Ş.",
            address: "Test Sokak No:1",
            city: "İstanbul",
            district: "Kadıköy"
        },
        note: "Bu bir otomatik test faturasıdır."
    };

    try {
        console.log("Fatura gönderiliyor...");
        const result = await sendInvoice(credentials, payload, "earsiv");

        console.log("\n--- TEST SONUCU ---");
        console.log("Success:", result.success);
        console.log("UUID:", result.uuid);
        console.log("Invoice ID:", result.invoiceId);

        if (result.success) {
            console.log("\n✅ BAŞARILI! Fatura EDM portalına ulaştı.");
            console.log("Görünüm URL (Tahmini):", result.viewUrl);
            if (result.xmlContent) {
                console.log("UBL XML Üretildi (İlk 100 karakter):", result.xmlContent.substring(0, 100) + "...");
            }
        } else {
            console.error("\n❌ HATA ALINDI!");
            console.error("Hata Mesajı:", result.error);
            console.log("Ham Yanıt:", JSON.stringify(result.rawResponse, null, 2));
        }
    } catch (error) {
        console.error("\n❌ BEKLENMEDİK HATA:", error.message);
    }
}

main();
