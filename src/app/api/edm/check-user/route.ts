import { NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json(
                { error: "customerId parametresi zorunludur." },
                { status: 400 }
            );
        }

        const result = await EdmService.checkUser(customerId);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
