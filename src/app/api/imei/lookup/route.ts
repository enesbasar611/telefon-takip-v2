import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import { lookupSingleImei } from "@/lib/imei-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const rawImei = typeof body?.imei === "string" ? body.imei : "";
    const challengeId = typeof body?.challengeId === "string" ? body.challengeId : undefined;
    const captchaCode = typeof body?.captchaCode === "string" ? body.captchaCode : undefined;
    const skipCache = Boolean(body?.skipCache);

    if (!rawImei.trim()) {
      return NextResponse.json({ error: "Lütfen bir IMEI numarası girin." }, { status: 400 });
    }

    const result = await lookupSingleImei({
      rawImei,
      challengeId,
      captchaCode,
      skipCache,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/imei/lookup error:", error);
    return NextResponse.json(
      { error: "IMEI sorgulaması sırasında beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}

