/**
 * e-Arsiv XSLT Sablonunu Veritabanina Kaydetme Scripti
 * 
 * Kullanim:
 *   npx tsx scripts/save-earsiv-xslt.ts
 * 
 * Bu script:
 * 1. public/e-arsiv.xslt dosyasini okur
 * 2. Ilk EDMSettings kaydini bulur
 * 3. earsivXslt alanina kaydeder
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function saveEarsivXslt() {
    console.log("[Save XSLT] e-Arsiv XSLT sablonu kaydediliyor...");

    // 1. XSLT dosyasini oku
    const xsltPath = path.join(process.cwd(), "public", "e-arsiv.xslt");
    let xsltContent: string;
    
    try {
        xsltContent = fs.readFileSync(xsltPath, "utf8");
        console.log("[Save XSLT] XSLT dosyasi okundu, uzunluk:", xsltContent.length);
    } catch (error) {
        console.error("[Save XSLT] XSLT dosyasi okunamadi:", error);
        process.exit(1);
    }

    // 2. Ilk EDMSettings kaydini bul
    const edmSettings = await prisma.eDMSettings.findFirst();
    
    if (!edmSettings) {
        console.error("[Save XSLT] EDMSettings kaydi bulunamadi.");
        process.exit(1);
    }

    // 3. earsivXslt alanina kaydet
    await prisma.eDMSettings.update({
        where: { id: edmSettings.id },
        data: {
            earsivXslt: xsltContent,
        },
    });

    console.log("[Save XSLT] e-Arsiv XSLT basariyla kaydedildi.");
    console.log("  Shop ID:", edmSettings.shopId);
    console.log("  XSLT Uzunlugu:", xsltContent.length);

    await prisma.$disconnect();
}

// Calistir
saveEarsivXslt().catch((error) => {
    console.error("[Save XSLT] Genel hata:", error);
    process.exit(1);
});
