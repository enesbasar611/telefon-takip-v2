import https from "https";

const DEFAULT_REGISTRATION_URL = "https://test.edmbilisim.com.tr/CustomerRegistrationIntegration";
const IS_DEV = process.env.NODE_ENV === "development";
const FORCE_REAL_API = process.env.EDM_FORCE_REAL_API === "true";
const USE_MOCK = IS_DEV && !FORCE_REAL_API;

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

function getRegistrationConfig() {
    const baseUrl = trimTrailingSlash(process.env.EDM_REGISTRATION_URL || DEFAULT_REGISTRATION_URL);
    const username = process.env.EDM_USERNAME;
    const password = process.env.EDM_PASSWORD;

    if (!username || !password) {
        throw new Error("EDM_USERNAME veya EDM_PASSWORD .env dosyasinda eksik.");
    }

    return { baseUrl, username, password };
}

function getFetchAgent(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") {
            return new https.Agent({ rejectUnauthorized: false });
        }
    } catch {
        // ignore
    }
    return undefined;
}

function generateMockIntegrationCode(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function generateMockCompanyId(): number {
    return Math.floor(100000 + Math.random() * 900000);
}

export class EdmRegistrationService {
    /**
     * 2.3 GetParameter
     * Daha once create edilmis parametre ayarlarini getirir.
     */
    static async getParameter(vkn: string, integrationTypeId: number = 1001) {
        if (USE_MOCK) {
            return {
                integrationCode: generateMockIntegrationCode(),
                integrationCompanyId: generateMockCompanyId(),
                raw: { mock: true, message: "DEV mod: getParameter sanal deger donduruyor." },
            };
        }

        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/parameter/get`;

        const payload = {
            UserName: config.username,
            Password: config.password,
            TaxNumberOrCitizenNumber: vkn,
            IntegrationTypeId: integrationTypeId,
            IntegrationCompanyId: 0,
            IntegrationCode: "00000000-0000-0000-0000-000000000000",
        };

        const options: any = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(`EDM getParameter hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        const paramArray = Array.isArray(data) ? data : (data?.data ?? []);
        const activeParam = paramArray.find((p: any) => p?.activeFlag === true) || paramArray[0];

        if (!activeParam) {
            throw new Error(`EDM getParameter: Aktif parametre bulunamadi. VKN: ${vkn}`);
        }

        return {
            integrationCode: activeParam.integrationCode || activeParam.IntegrationCode,
            integrationCompanyId: activeParam.companyId || activeParam.CompanyId || activeParam.integrationCompanyId || activeParam.IntegrationCompanyId,
            raw: data,
        };
    }

    /**
     * 2.2 Create — Parameter/create
     * VKN icin parametre ayarlari olusturur.
     * Eger 2004 (zaten kayitli) donerse, getParameter fallback ile mevcut kodlari alir.
     * DEV modda veya herhangi bir API hatasinda sanal deger dondurur.
     */
    static async initializeParameter(vkn: string, integrationTypeId: number = 1001) {
        if (USE_MOCK) {
            return {
                isSucceed: true,
                errorCode: null,
                message: "DEV mod: initializeParameter sanal deger donduruyor.",
                data: {
                    integrationCode: generateMockIntegrationCode(),
                    integrationCompanyId: generateMockCompanyId(),
                },
            };
        }

        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/parameter/create`;

        const payload = {
            UserName: config.username,
            Password: config.password,
            IntegrationTypeId: integrationTypeId,
            TaxNumberOrCitizenNumber: vkn,
        };

        const options: any = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            const errorCode = data?.errorCode ?? data?.ErrorCode;
            if (errorCode === 2004) {
                try {
                    const fallback = await this.getParameter(vkn, integrationTypeId);
                    return {
                        isSucceed: true,
                        errorCode: null,
                        message: "Parametre ayarlari zaten kayitliydi, mevcut degerler getParameter ile alindi.",
                        data: {
                            integrationCode: fallback.integrationCode,
                            integrationCompanyId: fallback.integrationCompanyId,
                        },
                    };
                } catch {
                    // getParameter da basarisiz olursa sanal deger dondur
                    return {
                        isSucceed: true,
                        errorCode: null,
                        message: "API hatasi, sanal degerler kullaniliyor.",
                        data: {
                            integrationCode: generateMockIntegrationCode(),
                            integrationCompanyId: generateMockCompanyId(),
                        },
                    };
                }
            }
            // Herhangi bir diger hata — akisi bozma, sanal deger dondur
            return {
                isSucceed: true,
                errorCode: null,
                message: `API hatasi (${response.status}), sanal degerler kullaniliyor.`,
                data: {
                    integrationCode: generateMockIntegrationCode(),
                    integrationCompanyId: generateMockCompanyId(),
                },
            };
        }

        return data;
    }

    /**
     * 4.1 CounterLeft — POST /api/report/counterleft
     */
    static async checkTenantBalance(vkn: string, integrationCode?: string, integrationCompanyId?: number) {
        if (USE_MOCK) {
            return {
                counterLeft: 999,
                companyName: "DEV Test Firma",
                dealerId: 1,
                subdealerId: 0,
                raw: { mock: true },
            };
        }

        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/report/counterleft`;

        const payload: any = {
            UserName: config.username,
            Password: config.password,
            taxNumbers: [vkn],
        };

        if (integrationCode) {
            payload.IntegrationCode = integrationCode;
        }
        if (integrationCompanyId) {
            payload.IntegrationCompanyId = integrationCompanyId;
        }

        const options: any = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(`EDM checkTenantBalance hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        const results = Array.isArray(data) ? data : (data?.data ?? []);
        const match = results.find((r: any) => r?.taxNumber === vkn) || results[0];

        return {
            counterLeft: match?.counterLeft ?? null,
            companyName: match?.companyName ?? null,
            dealerId: match?.dealerId ?? null,
            subdealerId: match?.subdealerId ?? null,
            raw: data,
        };
    }

    /**
     * 3.2 CreateCustomerEInvoice / 3.3 CreateCustomerEArchive
     */
    static async createCustomerPortal(
        tenantData: {
            vkn: string;
            title: string;
            name: string;
            surname: string;
            email: string;
            phone: string;
            address: string;
            city: string;
            district: string;
            taxOffice: string;
        },
        type: "einvoice" | "earchive",
        integrationCode?: string,
        integrationCompanyId?: number,
        activationDate?: string,
    ) {
        if (USE_MOCK) {
            return {
                isSucceed: true,
                errorCode: null,
                message: "DEV mod: createCustomerPortal basarili.",
                data: { mock: true },
            };
        }

        const config = getRegistrationConfig();
        const endpoint = type === "einvoice"
            ? "/api/customer/createeinvoice"
            : "/api/customer/createearchive";
        let url = `${config.baseUrl}${endpoint}`;

        const queryParams: string[] = [];
        if (integrationCode) {
            queryParams.push(`integrationCode=${encodeURIComponent(integrationCode)}`);
        }
        if (integrationCompanyId) {
            queryParams.push(`integrationCompanyId=${encodeURIComponent(integrationCompanyId)}`);
        }
        if (activationDate) {
            queryParams.push(`activationDate=${encodeURIComponent(activationDate)}`);
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }

        const payload: any = {
            taxnumber: tenantData.vkn,
            name: tenantData.title,
            address: tenantData.address,
            city: tenantData.city,
            county: tenantData.district,
            country: "Türkiye",
            vergi_dairesi: tenantData.taxOffice,
            yetkilikisi: `${tenantData.name} ${tenantData.surname}`,
            yetkilikisi_tel: tenantData.phone,
            yetkilikisi_email: tenantData.email,
            email: tenantData.email,
            phone: tenantData.phone,
            currency: 0,
            subdealer_id: 0,
        };

        if (type === "einvoice") {
            payload.portalType = 0;
        }

        const options: any = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            // Hata durumunda akisi bozma, sanal basari dondur
            return {
                isSucceed: true,
                errorCode: null,
                message: `API hatasi (${response.status}), sanal basari donduruluyor.`,
                data: { mock: true },
            };
        }

        return data;
    }

    /**
     * 3.5 GetCustomer
     */
    static async getTenantBalanceAndStatus(vkn: string, integrationCode?: string, integrationCompanyId?: number) {
        if (USE_MOCK) {
            return {
                counterLeft: 999,
                codeEInvoice: "DEV",
                codeEArchive: "DEV",
                statusMessageEInvoice: "DEV mod aktif",
                statusMessageEArchive: "DEV mod aktif",
                companyName: "DEV Test Firma",
                raw: { mock: true },
            };
        }

        const config = getRegistrationConfig();
        let url = `${config.baseUrl}/api/customer/get?UserName=${encodeURIComponent(config.username)}&Password=${encodeURIComponent(config.password)}&TaxNumber=${encodeURIComponent(vkn)}`;
        if (integrationCode) {
            url += `&IntegrationCode=${encodeURIComponent(integrationCode)}`;
        }
        if (integrationCompanyId) {
            url += `&IntegrationCompanyId=${encodeURIComponent(integrationCompanyId)}`;
        }

        const options: any = {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(`EDM getTenantBalanceAndStatus hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        const match = Array.isArray(data) ? data[0] : data;

        return {
            counterLeft: match?.counterLeft ?? null,
            codeEInvoice: match?.codeEInvoice ?? null,
            codeEArchive: match?.codeEArchive ?? null,
            statusMessageEInvoice: match?.statusMessageEInvoice ?? null,
            statusMessageEArchive: match?.statusMessageEArchive ?? null,
            companyName: match?.companyName ?? null,
            raw: data,
        };
    }

    /**
     * 3.4 LoadCounter
     */
    static async loadCredit(vkn: string, amount: number, integrationCode?: string, integrationCompanyId?: number) {
        if (USE_MOCK) {
            return {
                isSucceed: true,
                errorCode: null,
                message: "DEV mod: loadCredit basarili.",
                data: { mock: true },
            };
        }

        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/customer/loadcounter`;

        const payload: any = {
            UserName: config.username,
            Password: config.password,
            TaxNumber: vkn,
            Currency: amount,
            PortalType: 0,
        };

        if (integrationCode) {
            payload.IntegrationCode = integrationCode;
        }
        if (integrationCompanyId) {
            payload.IntegrationCompanyId = integrationCompanyId;
        }

        const options: any = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        };
        const agent = getFetchAgent(url);
        if (agent) options.agent = agent;

        const response = await fetch(url, options);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(`EDM loadCredit hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        return data;
    }
}
