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

        const testVkn = "22222222222";
        let integrationCode = "";
        let integrationCompanyId = 0;

        // Test 1: initializeParameter (2004 fallback ile getParameter)
        console.log("1. initializeParameter testi basliyor...");
        try {
            const paramResult = await EdmRegistrationService.initializeParameter(testVkn);
            console.log("initializeParameter sonucu:", JSON.stringify(paramResult, null, 2));
            integrationCode = paramResult?.data?.integrationCode || "";
            integrationCompanyId = paramResult?.data?.integrationCompanyId || 0;
        } catch (e: any) {
            console.error("initializeParameter hatasi:", e.message);
        }
        console.log("Kullanilacak integrationCode:", integrationCode || "(bos)");
        console.log("Kullanilacak integrationCompanyId:", integrationCompanyId || "(bos)");

        // Test 2: checkTenantBalance (POST /api/report/counterleft)
        console.log("\n2. checkTenantBalance testi basliyor...");
        try {
            const balanceResult = await EdmRegistrationService.checkTenantBalance(
                testVkn,
                integrationCode || undefined,
                integrationCompanyId || undefined,
            );
            console.log("checkTenantBalance sonucu:", JSON.stringify(balanceResult, null, 2));
        } catch (e: any) {
            console.error("checkTenantBalance hatasi:", e.message);
        }

        // Test 3: getTenantBalanceAndStatus (GET /api/customer/get)
        console.log("\n3. getTenantBalanceAndStatus testi basliyor...");
        try {
            const statusResult = await EdmRegistrationService.getTenantBalanceAndStatus(
                testVkn,
                integrationCode || undefined,
                integrationCompanyId || undefined,
            );
            console.log("getTenantBalanceAndStatus sonucu:", JSON.stringify(statusResult, null, 2));
        } catch (e: any) {
            console.error("getTenantBalanceAndStatus hatasi:", e.message);
        }

        // Test 4: createCustomerPortal (e-Fatura)
        console.log("\n4. createCustomerPortal (e-Fatura) testi basliyor...");
        try {
            const portalResult = await EdmRegistrationService.createCustomerPortal(
                {
                    vkn: testVkn,
                    title: "EDM Test Firma",
                    name: "Test",
                    surname: "Kullanici",
                    email: "test@edmbilisim.com.tr",
                    phone: "05555555555",
                    address: "Test Adres",
                    city: "İstanbul",
                    district: "Kadıköy",
                    taxOffice: "Kadıköy",
                },
                "einvoice",
                integrationCode || undefined,
                integrationCompanyId || undefined,
                new Date().toISOString(),
            );
            console.log("createCustomerPortal sonucu:", JSON.stringify(portalResult, null, 2));
        } catch (e: any) {
            console.error("createCustomerPortal hatasi:", e.message);
        }

        // Test 5: loadCredit
        console.log("\n5. loadCredit testi basliyor...");
        try {
            const creditResult = await EdmRegistrationService.loadCredit(
                testVkn,
                100,
                integrationCode || undefined,
                integrationCompanyId || undefined,
            );
            console.log("loadCredit sonucu:", JSON.stringify(creditResult, null, 2));
        } catch (e: any) {
            console.error("loadCredit hatasi:", e.message);
        }

    } catch (error: any) {
        console.error("Genel HATA:", error.message);
    }
}

test();
