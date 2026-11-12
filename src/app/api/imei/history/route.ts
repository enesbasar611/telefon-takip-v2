import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import {
  deleteImeiLookupHistoryItem,
  getImeiLookupHistory,
} from "@/lib/imei-history";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const history = await getImeiLookupHistory(shopId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET /api/imei/history error:", error);
    return NextResponse.json(
      { error: "IMEI geçmişi yüklenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imei = searchParams.get("imei") || undefined;
    const clearAll = searchParams.get("all") === "1";

    const history = await deleteImeiLookupHistoryItem(
      shopId,
      clearAll ? undefined : imei
    );
    return NextResponse.json({ history });
  } catch (error) {
    console.error("DELETE /api/imei/history error:", error);
    return NextResponse.json(
      { error: "IMEI geçmişi güncellenemedi." },
      { status: 500 }
    );
  }
}

