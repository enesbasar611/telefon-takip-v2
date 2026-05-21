type EdmLoginRequest = {
    requesT_HEADER: {
        sessioN_ID: string;
        clienT_TXN_ID: string;
        applicatioN_NAME: string;
        channeL_NAME: string;
        hostname: string;
        reason: string;
        actioN_DATE: string;
        actioN_DATESpecified: boolean;
    };
    useR_NAME: string;
    password: string;
    secreT_KEY?: string;
};

type EdmLoginResponse = {
    requesT_RETURN?: {
        returN_CODE?: number;
        warnings?: string[];
    };
    sessioN_ID?: string | null;
};

type EdmRequestOptions = {
    baseUrl?: string;
    username?: string;
    password?: string;
    secretKey?: string;
};

export type EdmInvoiceCustomer = {
    name: string;
    tckn?: string;
    vkn?: string;
    taxOffice?: string;
    address?: string;
    city?: string;
    district?: string;
    email?: string;
};

export type EdmInvoiceLine = {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
    unitCode?: string;
};

export type EdmInvoiceInput = {
    customer: EdmInvoiceCustomer;
    lines: EdmInvoiceLine[];
    issueDate?: Date;
    currency?: "TRY" | "USD" | "EUR";
    note?: string;
    invoiceId?: string;
    uuid?: string;
};

export type EdmSendInvoiceResult = {
    success: boolean;
    uuid: string | null;
    sessionId: string;
    response: unknown;
    requestUuid: string;
    requestId: string;
};

const DEFAULT_EDM_REST_URL = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";
const DEFAULT_SENDER_NAME = "Basar Teknik";

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

function isSoapServiceUrl(value?: string) {
    return Boolean(value && /\.svc(?:$|[/?#])/i.test(value));
}

function getEdmConfig(options: EdmRequestOptions = {}) {
    const legacyApiUrl = process.env.EDM_API_URL;
    const baseUrl = options.baseUrl
        || process.env.EDM_REST_API_URL
        || (isSoapServiceUrl(legacyApiUrl) ? undefined : legacyApiUrl)
        || DEFAULT_EDM_REST_URL;
    const username = options.username || process.env.EDM_USERNAME;
    const password = options.password || process.env.EDM_PASSWORD;
    const secretKey = options.secretKey || process.env.EDM_SECRET_KEY;

    if (!username || !password) {
        throw new Error("EDM_USERNAME veya EDM_PASSWORD .env dosyasında eksik.");
    }

    return {
        baseUrl: trimTrailingSlash(baseUrl),
        username,
        password,
        secretKey,
    };
}

function buildRequestHeader(sessionId = "0", reason = "Login") {
    return {
        sessioN_ID: sessionId,
        clienT_TXN_ID: crypto.randomUUID(),
        applicatioN_NAME: "TakipV2",
        channeL_NAME: "API",
        hostname: process.env.EDM_HOSTNAME || "TakipV2",
        reason,
        actioN_DATE: new Date().toISOString(),
        actioN_DATESpecified: true,
    };
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

function xmlEscape(value: unknown) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function getCustomerIdentifier(customer: EdmInvoiceCustomer) {
    return customer.vkn || customer.tckn || "11111111111";
}

function getInvoiceTotals(lines: EdmInvoiceLine[]) {
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
    const taxTotal = roundMoney(lines.reduce((sum, line) => {
        const vatRate = line.vatRate ?? 20;
        return sum + (line.quantity * line.unitPrice * vatRate / 100);
    }, 0));

    return {
        subtotal,
        taxTotal,
        payableAmount: roundMoney(subtotal + taxTotal),
    };
}

function getEdmCurrencyCode(currency: EdmInvoiceInput["currency"]) {
    // Swagger exposes EDM currency codes as integer enum values without names.
    // 0 is accepted by model binding and keeps the UBL XML as the source of truth for TRY/USD/EUR.
    return 0;
}

function getInvoiceId(issueDate: Date, invoiceId?: string) {
    if (invoiceId) return invoiceId;
    const datePart = issueDate.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    return `TST${datePart}${randomPart}`;
}

function buildInvoiceXml(input: EdmInvoiceInput, invoiceId: string, uuid: string) {
    const currency = input.currency || "TRY";
    const issueDate = input.issueDate || new Date();
    const customerIdentifier = getCustomerIdentifier(input.customer);
    const senderVkn = process.env.EDM_SENDER_VKN || process.env.EDM_USERNAME || "1111111111";
    const senderName = process.env.EDM_SENDER_NAME || DEFAULT_SENDER_NAME;
    const totals = getInvoiceTotals(input.lines);

    const invoiceLines = input.lines.map((line, index) => {
        const vatRate = line.vatRate ?? 20;
        const lineAmount = roundMoney(line.quantity * line.unitPrice);
        const lineTax = roundMoney(lineAmount * vatRate / 100);

        return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${xmlEscape(line.unitCode || "C62")}">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${lineTax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${lineAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${lineTax.toFixed(2)}</cbc:TaxAmount>
        <cbc:Percent>${vatRate}</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${xmlEscape(line.name)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${roundMoney(line.unitPrice).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
  <cbc:ID>${xmlEscape(invoiceId)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${xmlEscape(uuid)}</cbc:UUID>
  <cbc:IssueDate>${issueDate.toISOString().slice(0, 10)}</cbc:IssueDate>
  <cbc:IssueTime>${issueDate.toISOString().slice(11, 19)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:Note>${xmlEscape(input.note || "Test fatura")}</cbc:Note>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${input.lines.length}</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${xmlEscape(senderVkn)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${xmlEscape(senderName)}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${input.customer.vkn ? "VKN" : "TCKN"}">${xmlEscape(customerIdentifier)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${xmlEscape(input.customer.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${xmlEscape(input.customer.address || "Test Adres")}</cbc:StreetName>
        <cbc:CitySubdivisionName>${xmlEscape(input.customer.district || "Merkez")}</cbc:CitySubdivisionName>
        <cbc:CityName>${xmlEscape(input.customer.city || "Istanbul")}</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Person>
        <cbc:FirstName>${xmlEscape(input.customer.name.split(" ")[0] || input.customer.name)}</cbc:FirstName>
        <cbc:FamilyName>${xmlEscape(input.customer.name.split(" ").slice(1).join(" ") || "Musteri")}</cbc:FamilyName>
      </cac:Person>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${totals.taxTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totals.payableAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totals.payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${invoiceLines}
</Invoice>`;
}

function toBase64(value: string) {
    return Buffer.from(value, "utf8").toString("base64");
}

function extractInvoiceUuid(value: unknown): string | null {
    if (!value || typeof value !== "object") return null;

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        if (/uuid/i.test(key) && typeof nestedValue === "string" && nestedValue.trim()) {
            return nestedValue.trim();
        }

        if (Array.isArray(nestedValue)) {
            for (const item of nestedValue) {
                const uuid = extractInvoiceUuid(item);
                if (uuid) return uuid;
            }
        } else if (nestedValue && typeof nestedValue === "object") {
            const uuid = extractInvoiceUuid(nestedValue);
            if (uuid) return uuid;
        }
    }

    return null;
}

function extractEdmError(value: unknown): string | null {
    if (!value || typeof value !== "object") return null;
    const parts: string[] = [];

    const walk = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        for (const [key, nestedValue] of Object.entries(node as Record<string, unknown>)) {
            if (/warning|description|message|error|code/i.test(key)) {
                if (typeof nestedValue === "string" || typeof nestedValue === "number") {
                    parts.push(`${key}: ${nestedValue}`);
                } else if (Array.isArray(nestedValue)) {
                    for (const item of nestedValue) {
                        if (typeof item === "string" || typeof item === "number") {
                            parts.push(`${key}: ${item}`);
                        }
                    }
                }
            }

            if (nestedValue && typeof nestedValue === "object") {
                walk(nestedValue);
            }
        }
    };

    walk(value);
    return parts.length > 0 ? parts.join(" | ").slice(0, 1000) : null;
}

export class EdmService {
    static async login(options: EdmRequestOptions = {}): Promise<string | null> {
        const config = getEdmConfig(options);
        const payload: EdmLoginRequest = {
            requesT_HEADER: buildRequestHeader(),
            useR_NAME: config.username,
            password: config.password,
            ...(config.secretKey ? { secreT_KEY: config.secretKey } : {}),
        };

        const response = await fetch(`${config.baseUrl}/LoginRequest`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data: EdmLoginResponse | null = null;

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch {
            throw new Error(`EDM Login JSON yanıtı okunamadı. HTTP ${response.status}`);
        }

        if (!response.ok) {
            const warning = data?.requesT_RETURN?.warnings?.join(", ");
            throw new Error(warning || `EDM Login HTTP hatası: ${response.status}`);
        }

        const token = data?.sessioN_ID?.trim();
        if (!token) {
            const returnCode = data?.requesT_RETURN?.returN_CODE;
            throw new Error(`EDM Login başarılı yanıt döndü ama token bulunamadı.${returnCode !== undefined ? ` ReturnCode: ${returnCode}` : ""}`);
        }

        return token;
    }

    static async sendInvoice(input: EdmInvoiceInput, options: EdmRequestOptions = {}): Promise<EdmSendInvoiceResult> {
        if (!input.lines.length) {
            throw new Error("EDM fatura gönderimi için en az bir kalem gereklidir.");
        }

        const config = getEdmConfig(options);
        const sessionId = await this.login(options);
        if (!sessionId) {
            throw new Error("EDM login token alınamadığı için fatura gönderilemedi.");
        }

        const issueDate = input.issueDate || new Date();
        const requestUuid = input.uuid || crypto.randomUUID();
        const requestId = getInvoiceId(issueDate, input.invoiceId);
        const invoiceXml = buildInvoiceXml({ ...input, issueDate }, requestId, requestUuid);
        const totals = getInvoiceTotals(input.lines);
        const customerIdentifier = getCustomerIdentifier(input.customer);

        const payload = {
            requesT_HEADER: buildRequestHeader(sessionId, "SetArchiveInvoiceRequest"),
            invoice: [
                {
                    header: {
                        sender: process.env.EDM_SENDER_VKN || process.env.EDM_USERNAME,
                        receiver: customerIdentifier,
                        supplier: process.env.EDM_SENDER_NAME || DEFAULT_SENDER_NAME,
                        customer: input.customer.name,
                        issuE_DATE: issueDate.toISOString(),
                        issuE_DATESpecified: true,
                        payablE_AMOUNT: {
                            currencyID: getEdmCurrencyCode(input.currency),
                            value: totals.payableAmount,
                        },
                        profileid: "EARSIVFATURA",
                        earchive: true,
                        invoicE_TYPE: "SATIS",
                        invoicE_SEND_TYPE: "ELEKTRONIK",
                    },
                    content: {
                        contentType: "application/xml",
                        value: toBase64(invoiceXml),
                    },
                    trxid: Date.now(),
                    uuid: requestUuid,
                    id: requestId,
                },
            ],
        };

        const response = await fetch(`${config.baseUrl}/api/SetArchiveInvoiceRequest`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${sessionId}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data: unknown = null;

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch {
            throw new Error(`EDM fatura JSON yanıtı okunamadı. HTTP ${response.status}`);
        }

        if (!response.ok) {
            const detail = extractEdmError(data);
            throw new Error(`EDM fatura gönderim HTTP hatası: ${response.status}${detail ? ` - ${detail}` : ""}`);
        }

        return {
            success: true,
            uuid: extractInvoiceUuid(data) || requestUuid,
            sessionId,
            response: data,
            requestUuid,
            requestId,
        };
    }

    static async getInvoiceDocument(
        uuid: string,
        format: "pdf" | "html" = "pdf",
        options: EdmRequestOptions = {}
    ): Promise<Buffer> {
        const config = getEdmConfig(options);
        const sessionId = await this.login(options);
        if (!sessionId) {
            throw new Error("EDM login token alınamadığı için fatura belgesi indirilemedi.");
        }

        // EDM endpoint'ini dene - birden fazla format olabilir
        const endpoints = [
            `${config.baseUrl}/api/Invoice/Get${format === "pdf" ? "Pdf" : "Html"}/${encodeURIComponent(uuid)}`,
            `${config.baseUrl}/api/Document/Get${format === "pdf" ? "Pdf" : "Html"}/${encodeURIComponent(uuid)}`,
            `${config.baseUrl}/api/Document/${encodeURIComponent(uuid)}?format=${format}`,
            `${config.baseUrl}/api/Invoice/${encodeURIComponent(uuid)}/download?format=${format}`,
        ];

        let lastError: Error | null = null;

        for (const endpointUrl of endpoints) {
            try {
                const response = await fetch(endpointUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${sessionId}`,
                        "Accept": format === "pdf" ? "application/pdf" : "text/html",
                    },
                });

                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    return Buffer.from(arrayBuffer);
                }

                // Log attempt
                if (response.status === 404) {
                    console.warn(`EDM endpoint not found: ${endpointUrl}`);
                } else {
                    console.warn(`EDM endpoint error (${response.status}): ${endpointUrl}`);
                }
            } catch (error) {
                console.warn(`EDM endpoint fetch error: ${endpointUrl}`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        // Tüm endpoint'ler başarısız olduysa hata dön
        throw new Error(
            `EDM fatura belgesi indirimi başarısız. Denenen ${endpoints.length} endpoint'in tümü başarısız oldu. Son hata: ${lastError?.message || "Bilinmiyor"}`
        );
    }
}
