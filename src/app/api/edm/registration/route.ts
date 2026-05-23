import { NextResponse } from "next/server";
import { EdmRegistrationService } from "@/lib/edm/registration";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...params } = body;

        switch (action) {
            case "initializeParameter": {
                const { vkn } = params;
                if (!vkn) return NextResponse.json({ error: "vkn gerekli" }, { status: 400 });
                const result = await EdmRegistrationService.initializeParameter(vkn);
                return NextResponse.json(result);
            }
            case "createCustomerPortal": {
                const { tenantData, type } = params;
                if (!tenantData || !type) return NextResponse.json({ error: "tenantData ve type gerekli" }, { status: 400 });
                const result = await EdmRegistrationService.createCustomerPortal(tenantData, type);
                return NextResponse.json(result);
            }
            case "getTenantBalanceAndStatus": {
                const { vkn } = params;
                if (!vkn) return NextResponse.json({ error: "vkn gerekli" }, { status: 400 });
                const result = await EdmRegistrationService.getTenantBalanceAndStatus(vkn);
                return NextResponse.json(result);
            }
            case "loadCredit": {
                const { vkn, amount } = params;
                if (!vkn || amount === undefined) return NextResponse.json({ error: "vkn ve amount gerekli" }, { status: 400 });
                const result = await EdmRegistrationService.loadCredit(vkn, amount);
                return NextResponse.json(result);
            }
            default:
                return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
