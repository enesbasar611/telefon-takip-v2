import { NextResponse } from "next/server";
import { EdmService, EdmInvoiceInput } from "@/lib/edm/service";

// GET /api/test/edm-invoice
// Submits a test invoice to EDM Test Portal and returns full raw response for debugging.
export async function GET() {
    const config = {
        baseUrl: (process.env.EDM_REST_API_URL || "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test").replace(/\/+$/, ""),
        username: process.env.EDM_USERNAME || "",
        password: process.env.EDM_PASSWORD || "",
    };

    // Step 1: Login and capture session
    let sessionId: string | null = null;
    try {
        sessionId = await EdmService.login();
    } catch (loginErr: any) {
        return NextResponse.json({ success: false, step: "login", error: loginErr.message }, { status: 500 });
    }

    // Step 2: Check user type (e-invoice vs e-archive)
    const customerId = "11111111111"; // Test TCKN - EDM test portal
    let userStatus = { isEInvoice: false, alias: undefined as string | undefined };
    let checkUserRaw: any = null;
    try {
        const checkRes = await EdmService.checkUser(customerId);
        userStatus = checkRes;
        checkUserRaw = { status: 200, body: JSON.stringify(checkRes) };
    } catch (e: any) {
        checkUserRaw = { error: e.message };
    }

    // Step 3: Build payload and send invoice
    const invoiceInput: EdmInvoiceInput = {
        customer: {
            name: "BASARTEKNIK TEST MUSTERI",
            tckn: customerId,
            address: "Test Mahallesi 1. Sokak No:1",
            district: "Merkez",
            city: "İSTANBUL",
        },
        lines: [
            {
                name: "iPhone 11 Ekran Değişimi",
                quantity: 2,
                unitPrice: 1250,
                vatRate: 20,
                unitCode: "C62",
            },
            {
                name: "Servis İşçiliği",
                quantity: 1,
                unitPrice: 200,
                vatRate: 20,
                unitCode: "C62",
            }
        ],
        currency: "TRY",
        note: "EDM UBL 2.1 Entegrasyon Testi",
    };

    let rawResponseText = "";
    let parsedResponse: any = null;
    let httpStatus = 0;
    let sendError: string | null = null;
    let uuid = "";
    let invoiceId = "";
    let sentPayload: any = null;

    try {
        // Intercept sendInvoice to capture payload
        // We'll call it normally and capture the result
        const result = await EdmService.sendInvoice(invoiceInput);
        uuid = result.uuid || result.requestUuid;
        invoiceId = result.requestId;
        parsedResponse = result.response;
        rawResponseText = result.rawResponse || "";
        
        // Manually reconstruct payload for debugging
        sentPayload = {
            isEInvoice: userStatus.isEInvoice,
            customerId,
            endpoint: userStatus.isEInvoice ? "/api/Invoice/SetInvoiceRequest" : "/api/SetArchiveInvoiceRequest",
            invoiceInput: {
                customer: invoiceInput.customer,
                linesCount: invoiceInput.lines.length,
            },
            note: "Payload details captured from EdmService - full XML content omitted for brevity",
        };
    } catch (err: any) {
        sendError = err.message;
    }

    return NextResponse.json({
        success: !sendError,
        sessionId,
        checkUser: { customerId, ...userStatus, rawResponse: checkUserRaw },
        invoice: sendError ? null : { uuid, invoiceId },
        sentPayload: sentPayload,
        edmResponse: parsedResponse,
        rawResponseBody: rawResponseText || "(empty)",
        error: sendError,
        debugNotes: {
            message: "Eğer edmResponse boşsa, EDM gönderim başarısız olmuş veya payload yanlış format. Lütfen rawResponseBody'yi kontrol edin.",
            portalUrl: "https://test.edmbilisim.com.tr/EFaturaUI21ea",
        },
        portalLoginUrl: "https://test.edmbilisim.com.tr/EFaturaUI21ea",
        portalCredentials: { username: config.username },
        searchHints: {
            uuid,
            invoiceId,
            note: "Portalda Giden E-Arşiv Faturalar veya E-Faturalar bölümünden arayın",
        },
    });
}
