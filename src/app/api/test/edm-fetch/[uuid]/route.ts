import { NextRequest, NextResponse } from "next/server";
import { EdmService } from "@/lib/edm/service";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const { uuid } = params;
  const search = request.nextUrl.searchParams;
  const format = (search.get("format") || "pdf").toLowerCase() as "pdf" | "html";

  if (!uuid || !uuid.trim()) {
    return new NextResponse(JSON.stringify({ success: false, error: "UUID eksik" }), { status: 400 });
  }

  try {
    const buffer = await EdmService.getInvoiceDocument(uuid.trim(), format as "pdf" | "html");

    const contentType = format === "pdf" ? "application/pdf" : "text/html; charset=utf-8";
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="edm-${uuid}.${format}"`,
      },
    });
  } catch (err: any) {
    console.error("edm-fetch error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
