import https from "https";
import { encrypt, decrypt } from "./crypto";

const DEFAULT_REGISTRATION_URL = "https://test.edmbilisim.com.tr/CustomerRegistrationIntegration";

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

export class EdmRegistrationService {
    static async initializeParameter(vkn: string) {
        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/parameter/create`;

        const payload = {
            UserName: config.username,
            Password: config.password,
            IntegrationTypeId: 1001,
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
            throw new Error(`EDM initializeParameter hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        return data;
    }

    static async createCustomerPortal(tenantData: {
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
    }, type: "einvoice" | "earchive", integrationCode?: string, integrationCompanyId?: number) {
        const config = getRegistrationConfig();
        const endpoint = type === "einvoice"
            ? "/api/customer/createeinvoice"
            : "/api/customer/createearchive";
        let url = `${config.baseUrl}${endpoint}`;
        if (integrationCode) {
            url += `/${integrationCode}`;
        }

        const payload: any = {
            UserName: config.username,
            Password: config.password,
            Vkn: tenantData.vkn,
            Title: tenantData.title,
            Name: tenantData.name,
            Surname: tenantData.surname,
            Email: tenantData.email,
            Phone: tenantData.phone,
            Address: tenantData.address,
            City: tenantData.city,
            District: tenantData.district,
            TaxOffice: tenantData.taxOffice,
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
            throw new Error(`EDM createCustomerPortal hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        return data;
    }

    static async getTenantBalanceAndStatus(vkn: string, integrationCode?: string) {
        const config = getRegistrationConfig();
        let url = `${config.baseUrl}/api/customer/get?UserName=${encodeURIComponent(config.username)}&Password=${encodeURIComponent(config.password)}&Vkn=${encodeURIComponent(vkn)}`;
        if (integrationCode) {
            url += `&IntegrationCode=${encodeURIComponent(integrationCode)}`;
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

        return {
            counterLeft: data?.counterLeft ?? null,
            codeEInvoice: data?.codeEInvoice ?? null,
            raw: data,
        };
    }

    static async loadCredit(vkn: string, amount: number) {
        const config = getRegistrationConfig();
        const url = `${config.baseUrl}/api/customer/laodcounter`;

        const payload = {
            UserName: config.username,
            Password: config.password,
            Vkn: vkn,
            Amount: amount,
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
            throw new Error(`EDM loadCredit hatasi: ${response.status} - ${text.slice(0, 500)}`);
        }

        return data;
    }
}
