import { NextResponse } from "next/server";
import { auth, getShopId } from "@/lib/auth";
import {
  getIfreeicloudAccountInfo,
  getIfreeicloudServices,
  runIfreeicloudCheck,
} from "@/lib/ifreeicloud-service";
import {
  getImeiLookupHistory,
  recordIfreeicloudLookupHistory,
} from "@/lib/imei-history";
import { recordLearnedTacMapping } from "@/lib/tac-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imeiParam = (searchParams.get("imei") || "").replace(/[^a-zA-Z0-9]/g, "");

    const [account, services, history] = await Promise.all([
      getIfreeicloudAccountInfo(),
      getIfreeicloudServices(),
      imeiParam ? getImeiLookupHistory(shopId) : Promise.resolve([]),
    ]);

    const cachedEntry = imeiParam
      ? history.find((item) => item.imei === imeiParam)?.ifreeicloud || null
      : null;

    return NextResponse.json({
      configured: account.configured,
      account,
      services,
      cachedResult: cachedEntry,
    });
  } catch (error: any) {
    console.error("GET /api/imei/ifreeicloud error:", error);
    return NextResponse.json(
      { error: error?.message || "iFreeiCloud bilgisi alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const rawImei = typeof body?.imei === "string" ? body.imei : "";
    const serviceId = Number(body?.serviceId);

    if (!rawImei.trim()) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir IMEI veya seri numarası girin." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir iFreeiCloud servisi seçin." },
        { status: 400 }
      );
    }

    const result = await runIfreeicloudCheck({
      imei: rawImei,
      serviceId,
    });

    if (result.success && !result.pending) {
      try {
        const session = await auth();
        await Promise.all([
          recordIfreeicloudLookupHistory(shopId, result, session?.user?.name || null),
          recordLearnedTacMapping({
            imeiOrTac: result.imei,
            brand: result.extracted.brand,
            model: result.extracted.model,
            shopId,
          }),
        ]);
      } catch (historyError) {
        console.error("Failed to store iFreeiCloud history:", historyError);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/imei/ifreeicloud error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "iFreeiCloud sorgusu sırasında beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}

