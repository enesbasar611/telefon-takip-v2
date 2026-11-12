import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import { callGemini } from "@/lib/actions/gemini-actions";
import { applyImeiAutoComplete, isValidImeiLuhn, normalizeImeiDigits } from "@/lib/imei-utils";

export const dynamic = "force-dynamic";

const IMEI_OCR_PROMPT =
  "Extract the 15-digit IMEI number from this phone screen or box label. Return ONLY the 15 digits.";

export async function POST(request: Request) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await request.json();
    const rawImage = typeof body?.image === "string" ? body.image : "";

    if (!rawImage.trim()) {
      return NextResponse.json({ error: "Görüntü verisi bulunamadı." }, { status: 400 });
    }

    const dataUrlMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const mimeType = dataUrlMatch ? dataUrlMatch[1] : "image/jpeg";
    const base64Data = dataUrlMatch ? dataUrlMatch[2] : rawImage;

    const aiRes = await callGemini(
      shopId,
      [
        IMEI_OCR_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ],
      "text"
    );

    if ("error" in aiRes) {
      return NextResponse.json({ error: aiRes.error }, { status: 400 });
    }

    const text = aiRes.text || "";
    const fifteenDigitCandidates = text.match(/\b\d{15}\b/g) || [];
    const validCandidate = fifteenDigitCandidates.find((candidate) => isValidImeiLuhn(candidate));

    let extracted = validCandidate || fifteenDigitCandidates[0] || "";
    if (!extracted) {
      const compactDigits = normalizeImeiDigits(text);
      if (compactDigits.length === 14) {
        extracted = applyImeiAutoComplete("", compactDigits).value;
      } else {
        extracted = compactDigits;
      }
    }

    if (extracted.length < 14) {
      return NextResponse.json(
        { error: "Görüntüden 15 haneli IMEI okunamadı. Lütfen daha net bir kare çekin." },
        { status: 422 }
      );
    }

    const finalImei =
      extracted.length === 14 ? applyImeiAutoComplete("", extracted).value : extracted.slice(0, 15);

    return NextResponse.json({
      imei: finalImei,
      luhnValid: isValidImeiLuhn(finalImei),
    });
  } catch (error) {
    console.error("POST /api/imei/ocr error:", error);
    return NextResponse.json(
      { error: "Fotoğraftan IMEI okunurken bir hata oluştu." },
      { status: 500 }
    );
  }
}

