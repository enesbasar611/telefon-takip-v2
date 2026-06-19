require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

function buildHeader(sessionId) {
    return {
        sessioN_ID: sessionId || "0",
        clienT_TXN_ID: "client-" + Date.now(),
        reason: "Integration Test",
        applicatioN_NAME: "TELEFON_TAKIP",
        hostname: "TakipV2",
        channeL_NAME: "API",
        simulatioN_FLAG: "N",
        compressed: "N",
        actioN_DATE: new Date().toISOString(),
        actioN_DATESpecified: true
    };
}

function buildTestUbl(vkn, uuid) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" 
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" 
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#" 
         xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://www.oasis-open.org/committees/bill/receipt/ubl/2.1/xsd/maindoc/UBL-Invoice-2.1.xsd">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
    <cbc:ID>TST2026000000005</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
    <cbc:IssueTime>${new Date().toISOString().split('T')[1].split('.')[0]}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:Note>Test</cbc:Note>
    <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
    <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>Basar Teknik</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="TCKN">11111111111</cbc:ID>
            </cac:PartyIdentification>
            <cac:Contact>
                <cbc:ElectronicMail>test@test.com</cbc:ElectronicMail>
            </cac:Contact>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">20.00</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="TRY">100.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="TRY">20.00</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="TRY">100.00</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="TRY">100.00</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="TRY">120.00</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="TRY">0.00</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="TRY">120.00</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="TRY">100.00</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="TRY">20.00</cbc:TaxAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>Test Urun</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="TRY">100.00</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
</Invoice>`;
    return Buffer.from(xml).toString('base64');
}

async function main() {
    const baseUrl = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";
    const username = process.env.EDM_USERNAME || "basarteknik";
    const password = process.env.EDM_PASSWORD || "Abc.123";
    const senderVkn = process.env.EDM_SENDER_VKN || "3230512384";

    console.log("═══ EDM RAW REST TEST FINAL ═══");

    try {
        // 1. Login
        console.log("Giriş yapılıyor...");
        const loginRes = await axios.post(`${baseUrl}/LoginRequest`, {
            requesT_HEADER: buildHeader("0"),
            useR_NAME: username,
            password: password
        });
        const sessionId = loginRes.data?.sessioN_ID;
        if (!sessionId) {
            console.log("Login Yanıtı:", JSON.stringify(loginRes.data, null, 2));
            throw new Error("Giriş başarısız");
        }
        console.log("Session ID:", sessionId);

        // 2. Build Payload
        const uuid = uuidv4();
        const base64Xml = buildTestUbl(senderVkn, uuid);

        const invoiceBody = {
            UUID: uuid,
            HEADER: {
                SENDER: senderVkn,
                RECEIVER: "1111111111",
                ISSUE_DATE: new Date().toISOString(),
                INVOICE_TYPE: "SATIS",
                PROFILEID: "EARSIVFATURA",
                EARCHIVE: true,
                INVOICE_SEND_TYPE: "ELEKTRONIK"
            },
            CONTENT: {
                value: base64Xml,
                base64: true
            },
            INVOICE_TOTAL: {
                LINE_EXTENSION_AMOUNT: { value: 100.00, currencyID: "TRY" },
                TAX_EXCLUSIVE_AMOUNT: { value: 100.00, currencyID: "TRY" },
                TAX_INCLUSIVE_AMOUNT: { value: 120.00, currencyID: "TRY" },
                PAYABLE_AMOUNT: { value: 120.00, currencyID: "TRY" }
            }
        };

        const requestBody = {
            requesT_HEADER: buildHeader(sessionId),
            INVOICE: [invoiceBody]
        };

        // 3. Send
        console.log("Fatura gönderiliyor...");
        const sendRes = await axios.post(`${baseUrl}/api/SetArchiveInvoiceRequest`, requestBody, {
            headers: { "Authorization": sessionId, "Content-Type": "application/json" }
        });

        console.log("\n--- YANIT ---");
        console.log("Status:", sendRes.status);
        console.log("Data:", JSON.stringify(sendRes.data, null, 2));

        if (sendRes.status === 200 || sendRes.data?.requesT_RETURN?.returN_CODE === 0) {
            console.log("\n✅ BAŞARILI! REST API tam uyumlulukla çalışıyor.");
        } else {
            console.error("\n❌ HATA! Yanıt kodu 0 değil.");
        }

    } catch (error) {
        console.error("\n❌ TEST HATASI:", error.response?.data || error.message);
    }
}

main();
