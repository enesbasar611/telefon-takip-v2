import { readFileSync } from "fs";
import { EdmRegistrationService } from "./src/lib/edm/registration";

// .env dosyasini manuel yukle
const envContent = readFileSync(".env", "utf8");
for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) {
            process.env[key] = value;
        }
    }
}

async function test() {
    try {
        console.log("=== EDM Registration Service Testleri ===\n");

        // Test 1: initializeParameter
        console.log("1. initializeParameter testi basliyor...");
        let integrationCode = "86b90928-bc3b-4330-ab16-e05e1ab6c822"; // Daha once alinan code
        try {
            const paramResult = await EdmRegistrationService.initializeParameter("22222222222");
            console.log("initializeParameter sonucu:", JSON.stringify(paramResult, null, 2));
            integrationCode = paramResult?.data?.integrationCode || integrationCode;
        } catch (e: any) {
            console.error("initializeParameter hatasi:", e.message);
        }

        // Test 2: getTenantBalanceAndStatus
        console.log("\n2. getTenantBalanceAndStatus testi basliyor...");
        try {
            const balanceResult = await EdmRegistrationService.getTenantBalanceAndStatus("22222222222", integrationCode);
            console.log("getTenantBalanceAndStatus sonucu:", JSON.stringify(balanceResult, null, 2));
        } catch (e: any) {
            console.error("getTenantBalanceAndStatus hatasi:", e.message);
        }

        // Test 3: createCustomerPortal (e-Fatura)
        console.log("\n3. createCustomerPortal (e-Fatura) testi basliyor...");
        try {
            const portalResult = await EdmRegistrationService.createCustomerPortal({
                vkn: "22222222222",
                title: "Test Firma 2",
                name: "Test",
                surname: "Kullanici",
                email: "test2@example.com",
                phone: "05555555555",
                address: "Test Adres",
                city: "İstanbul",
                district: "Kadıköy",
                taxOffice: "Kadıköy",
            }, "einvoice", integrationCode, 7207);
            console.log("createCustomerPortal sonucu:", JSON.stringify(portalResult, null, 2));
        } catch (e: any) {
            console.error("createCustomerPortal hatasi:", e.message);
        }

        // Test 4: loadCredit
        console.log("\n4. loadCredit testi basliyor...");
        try {
            const creditResult = await EdmRegistrationService.loadCredit("11111111111", 100);
            console.log("loadCredit sonucu:", JSON.stringify(creditResult, null, 2));
        } catch (e: any) {
            console.error("loadCredit hatasi:", e.message);
        }

    } catch (error: any) {
        console.error("Genel HATA:", error.message);
    }
}

test();
