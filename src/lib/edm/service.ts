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
    rawResponse: string;
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

function amountToWords(amount: number, currency: string = "TRY"): string {
    const units = ["", "BİR", "İKİ", "ÜÇ", "DÖRT", "BEŞ", "ALTI", "YEDİ", "SEKİZ", "DOKUZ"];
    const tens = ["", "ON", "YİRMİ", "OTUZ", "KIRK", "ELLİ", "ALTMIŞ", "YETMİŞ", "SEKSEN", "DOKSAN"];
    const orders = ["", "BİN", "MİLYON", "MİLYAR"];

    const convertGroup = (n: number) => {
        let res = "";
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) res += (h === 1 ? "" : units[h]) + "YÜZ";
        if (t > 0) res += tens[t];
        if (u > 0) res += (u === 1 && h === 0 && t === 0 ? "BİR" : units[u]);
        return res;
    };

    const convertOrdered = (n: number, orderIdx: number) => {
        if (n === 0) return "";
        let group = convertGroup(n);
        if (orderIdx === 1 && n === 1) group = ""; // "Bir Bin" -> "Bin"
        return group + orders[orderIdx];
    };

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = "";
    let temp = integerPart;
    let orderIdx = 0;

    if (temp === 0) result = "SIFIR";
    while (temp > 0) {
        const group = temp % 1000;
        result = convertOrdered(group, orderIdx) + result;
        temp = Math.floor(temp / 1000);
        orderIdx++;
    }

    let currencyName = "TÜRK LİRASI";
    let subCurrencyName = "KURUŞ";
    if (currency === "USD") { currencyName = "DOLAR"; subCurrencyName = "SENT"; }
    else if (currency === "EUR") { currencyName = "EURO"; subCurrencyName = "SENT"; }

    result = "YALNIZ " + result + " " + currencyName;

    if (decimalPart > 0) {
        result += " " + convertGroup(decimalPart) + " " + subCurrencyName;
    }

    return result.trim();
}

function getEdmCurrencyCode(currency: EdmInvoiceInput["currency"]) {
    return 0;
}

function getInvoiceId(issueDate: Date, invoiceId?: string) {
    if (invoiceId) return invoiceId;
    const datePart = issueDate.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    return `TST${datePart}${randomPart}`;
}

function buildInvoiceXml(input: EdmInvoiceInput, invoiceId: string, uuid: string, isEInvoice: boolean) {
    const currency = input.currency || "TRY";
    const issueDate = input.issueDate || new Date();
    const customerIdentifier = getCustomerIdentifier(input.customer);
    const senderVkn = process.env.EDM_SENDER_VKN || process.env.EDM_USERNAME || "1111111111";
    const senderName = process.env.EDM_SENDER_NAME || DEFAULT_SENDER_NAME;
    const totals = getInvoiceTotals(input.lines);
    const profileId = isEInvoice ? "TEMELFATURA" : "EARSIVFATURA";

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
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 UBL-Invoice-2.1.xsd">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent />
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${xmlEscape(invoiceId)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${xmlEscape(uuid)}</cbc:UUID>
  <cbc:IssueDate>${issueDate.toISOString().slice(0, 10)}</cbc:IssueDate>
  <cbc:IssueTime>${issueDate.toISOString().slice(11, 19)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:Note>${xmlEscape(amountToWords(totals.payableAmount, currency))}</cbc:Note>
  ${input.note ? `<cbc:Note>${xmlEscape(input.note)}</cbc:Note>` : ""}
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
      <cac:PostalAddress>
        <cbc:CityName>İSTANBUL</cbc:CityName>
        <cac:Country>
          <cbc:Name>TÜRKİYE</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
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
        <cbc:CityName>${xmlEscape(input.customer.city || "İSTANBUL")}</cbc:CityName>
        <cac:Country>
          <cbc:Name>TÜRKİYE</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${totals.taxTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${totals.taxTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
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

    const walk = (node: any): string | null => {
        if (!node || typeof node !== "object") return null;
        if (node.UUID && typeof node.UUID === "string") return node.UUID;
        if (node.uuid && typeof node.uuid === "string") return node.uuid;

        for (const val of Object.values(node)) {
            if (Array.isArray(val)) {
                for (const item of val) {
                    const res = walk(item);
                    if (res) return res;
                }
            } else if (val && typeof val === "object") {
                const res = walk(val);
                if (res) return res;
            }
        }
        return null;
    };

    return walk(value);
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

    static async checkUser(vknTckn: string, options: EdmRequestOptions = {}): Promise<{ isEInvoice: boolean, alias?: string }> {
        const config = getEdmConfig(options);
        const sessionId = await this.login(options);

        const response = await fetch(`${config.baseUrl}/api/CheckUser/${vknTckn}`, {
            headers: { "Authorization": `Bearer ${sessionId}` }
        });

        if (!response.ok) return { isEInvoice: false };

        const data = await response.json().catch(() => null);
        if (data && Array.isArray(data) && data.length > 0) {
            return { isEInvoice: true, alias: data[0].Alias };
        }

        return { isEInvoice: false };
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

        const customerId = getCustomerIdentifier(input.customer);
        const userStatus = await this.checkUser(customerId, options);

        const isEInvoice = userStatus.isEInvoice;
        const profileId = isEInvoice ? "TEMELFATURA" : "EARSIVFATURA";
        const endpoint = isEInvoice ? "/api/Invoice/SetInvoiceRequest" : "/api/SetArchiveInvoiceRequest";

        const issueDate = input.issueDate || new Date();
        const requestUuid = input.uuid || crypto.randomUUID();
        const requestId = getInvoiceId(issueDate, input.invoiceId);
        const invoiceXml = buildInvoiceXml({ ...input, issueDate }, requestId, requestUuid, isEInvoice);
        const totals = getInvoiceTotals(input.lines);

        const payload = {
            requesT_HEADER: buildRequestHeader(sessionId, isEInvoice ? "SetInvoiceRequest" : "SetArchiveInvoiceRequest"),
            invoice: [
                {
                    header: {
                        sender: process.env.EDM_SENDER_VKN || process.env.EDM_USERNAME,
                        receiver: customerId,
                        supplier: process.env.EDM_SENDER_NAME || DEFAULT_SENDER_NAME,
                        customer: input.customer.name,
                        issuE_DATE: issueDate.toISOString(),
                        payablE_AMOUNT: {
                            currencyID: 0,
                            value: totals.payableAmount,
                        },
                        profileid: profileId,
                        earchive: !isEInvoice,
                        invoicE_TYPE: "SATIS",
                        ...(isEInvoice ? { receiveraliaS: userStatus.alias } : { invoicE_SEND_TYPE: "ELEKTRONIK" }),
                    },
                    content: {
                        contentType: "application/xml",
                        value: toBase64(invoiceXml),
                    },
                    uuid: requestUuid,
                    id: requestId,
                },
            ],
        };

        const response = await fetch(`${config.baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${sessionId}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let data: any = null;

        console.log(`[EDM] sendInvoice HTTP ${response.status} - raw body (${responseText.length} chars):`, responseText.slice(0, 500));

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch {
            // Non-JSON response - not fatal if status is ok
            console.warn(`[EDM] sendInvoice response is not JSON. Raw: ${responseText.slice(0, 200)}`);
        }

        if (!response.ok) {
            const detail = extractEdmError(data) || responseText.slice(0, 500);
            throw new Error(`EDM fatura gönderim HTTP hatası: ${response.status}${detail ? ` - ${detail}` : ""}`);
        }

        return {
            success: true,
            uuid: extractInvoiceUuid(data) || requestUuid,
            sessionId,
            response: data,
            rawResponse: responseText,
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

        const response = await fetch(`${config.baseUrl}/api/Invoice/Get${format.toUpperCase()}/${uuid}`, {
            headers: { "Authorization": `Bearer ${sessionId}` }
        });

        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }

        throw new Error(`Fatura belgesi indirilemedi (${response.status})`);
    }
}
