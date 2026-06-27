const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test';
const USERNAME = 'basarteknik';
const PASSWORD = 'Abc.123';
const SENDER_VKN = '3230512384';

function getRequestHeader(sessionId) {
    return {
        clienT_TXN_ID: uuidv4(),
        sessioN_ID: sessionId || "0",
        actioN_DATE: new Date().toISOString(),
        actioN_DATESpecified: true,
        applicatioN_NAME: "Telefon Takip v2",
        hostname: "Server",
        channeL_NAME: "REST",
        reason: "API Islem",
        compressed: "N",
        intL_TXN_ID: 0,
        intL_TXN_IDSpecified: true,
        intL_PARENT_TXN_ID: 0,
        intL_PARENT_TXN_IDSpecified: true,
        simulatioN_FLAG: "N"
    };
}

async function callEdm(endpoint, body, sessionId) {
    const url = `${BASE_URL}${endpoint}`;
    const requestBody = {
        requesT_HEADER: getRequestHeader(sessionId),
        ...body
    };

    console.log(`\n>>> [${endpoint}] Istek gonderiliyor...`);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json', 'accept': 'text/plain' },
            timeout: 30000
        });
        console.log('BASARILI:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('HATA:', error.response?.status, JSON.stringify(error.response?.data, null, 2) || error.message);
        return { error: true, status: error.response?.status, data: error.response?.data };
    }
}

async function main() {
    // 1. Login
    console.log('='.repeat(60));
    console.log('LOGIN');
    console.log('='.repeat(60));
    const loginData = await callEdm('/LoginRequest', {
        useR_NAME: USERNAME,
        password: PASSWORD,
        secreT_KEY: ""
    });

    const sessionId = loginData?.sessioN_ID || loginData?.SESSION_ID || loginData?.requesT_RETURN?.sessioN_ID;
    if (!sessionId || sessionId === '0') {
        console.error('Login basarisiz, session alinamadi!');
        process.exit(1);
    }
    console.log(`\nSession ID: ${sessionId}`);

    // 2. Test fatura verileri
    const uuid = uuidv4();
    const pureDate = new Date().toISOString().split('T')[0];
    const issueTime = new Date().toTimeString().split(' ')[0];
    const invoiceId = `TST${Date.now().toString().slice(-10)}`;

    const invoiceHeader = {
        profilE_ID: "EARSIV",
        invoicE_ID: invoiceId,
        uuiD: uuid,
        issuE_DATE: pureDate,
        issuE_TIME: issueTime,
        invoicE_TYPE: "SATIS",
        notE: "Test fatura",
        currencY_CODE: "TRY",
        sendeR_PARTY: {
            vkn: SENDER_VKN,
            city: "Istanbul",
            county: "Kadikoy",
            adress: "Test Adres",
            adsoyad: "Basar Teknik"
        },
        customeR_PARTY: {
            vkn: "11111111111",
            pk: "",
            city: "Istanbul",
            county: "Besiktas",
            adress: "Test Musteri Adres",
            adsoyad: "Test Musteri",
            firstname: "Test",
            lastname: "Musteri"
        }
    };

    const invoiceLine = [{
        quantity: 1,
        price: 100,
        percent: 20,
        name: "Test Urun",
        unitcode: "C62"
    }];

    const invoiceTotal = { total: 100, totalkdv: 20 };

    // ======= VARYASYON A: Tamamen buyuk harf =======
    console.log('\n' + '='.repeat(60));
    console.log('VARYASYON A: INVOICE > INVOICE_HEADER (Tamamen Buyuk)');
    console.log('='.repeat(60));
    await callEdm('/LoadInvoiceRequestModel', {
        command: "PROCESS",
        INVOICE: {
            INVOICESERIAL_REQUESTED: invoiceId.substring(0, 3),
            INVOICE_HEADER: invoiceHeader,
            INVOICE_LINE: invoiceLine,
            INVOICE_TOTAL: invoiceTotal
        }
    }, sessionId);

    // ======= VARYASYON B: Mixed-case invoicE =======
    console.log('\n' + '='.repeat(60));
    console.log('VARYASYON B: invoicE > invoicE_HEADER (Mixed-Case)');
    console.log('='.repeat(60));
    await callEdm('/LoadInvoiceRequestModel', {
        command: "PROCESS",
        invoicE: {
            INVOICESERIAL_REQUESTED: invoiceId.substring(0, 3),
            invoicE_HEADER: invoiceHeader,
            invoicE_LINE: invoiceLine,
            invoicE_TOTAL: invoiceTotal
        }
    }, sessionId);

    // ======= VARYASYON C: INVOICE + mixed-case alt alanlar =======
    console.log('\n' + '='.repeat(60));
    console.log('VARYASYON C: INVOICE > invoicE_HEADER (Hibrit - Onceki hali)');
    console.log('='.repeat(60));
    await callEdm('/LoadInvoiceRequestModel', {
        command: "PROCESS",
        INVOICE: {
            INVOICESERIAL_REQUESTED: invoiceId.substring(0, 3),
            invoicE_HEADER: invoiceHeader,
            invoicE_LINE: invoiceLine,
            invoicE_TOTAL: invoiceTotal
        }
    }, sessionId);

    console.log('\n' + '='.repeat(60));
    console.log('TEST TAMAMLANDI');
    console.log('='.repeat(60));
}

main().catch(console.error);
