"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { formatProperCase, formatPhoneRaw } from "@/lib/formatters";
import { toTitleCase } from "@/lib/utils";

export async function createShopOnboarding(formData: {
    name: string;
    address: string;
    phone: string;
    currency: string;
    openingBalance: number;
    website?: string;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // 1. Create the Shop
        const shop = await prisma.shop.create({
            data: {
                name: toTitleCase(formData.name),
                address: toTitleCase(formData.address),
                phone: formatPhoneRaw(formData.phone),
            },
        });

        // 2. Link User to Shop and set as ADMIN
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!userExists) {
            return { success: false, error: "Kullanıcı kaydı bulunamadı. DB sıfırlanmış veya eski oturum kalmış olabilir. Lütfen çıkış yapıp tekrar giriş yapın." };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                shopId: shop.id,
                role: "ADMIN",
            },
        });

        // 3. Create initial "Kasa" account
        await prisma.financeAccount.create({
            data: {
                name: "Merkez Kasa",
                type: "CASH",
                balance: formData.openingBalance,
                isDefault: true,
                shopId: shop.id,
            },
        });

        // 4. Create initial Daily Session if balance > 0
        if (formData.openingBalance > 0) {
            await prisma.dailySession.create({
                data: {
                    openingBalance: formData.openingBalance,
                    openedById: session.user.id as string,
                    status: "OPEN",
                    shopId: shop.id,
                    notes: "Sistem açılış bakiyesi",
                },
            });
        }

        // 5. Create default Receipt Settings for all types
        const receiptTypes = [
            { id: "pos", subtitle: "PROFESYONEL TEKNİK SERVİS" },
            { id: "service", subtitle: "MOBİL SERVİS & TEKNİK DESTEK" },
            { id: "stock", subtitle: "EKSİK / SİPARİŞ LİSTESİ" }
        ];

        await Promise.all(receiptTypes.map(type =>
            prisma.receiptSettings.create({
                data: {
                    id: `${shop.id}_${type.id}`,
                    title: shop.name.toUpperCase(),
                    subtitle: type.subtitle,
                    phone: shop.phone || "",
                    address: shop.address || "",
                    footer: "Bizi Tercih Ettiğiniz İçin Teşekkürler",
                    website: formData.website || "",
                    shopId: shop.id,
                    terms: type.id === "service" ? "• Arıza tespit ücreti 150 TL'dir. İptal edilen cihazlarda bu ücret tahsil edilir.\n• 30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir.\n• Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz." : null
                }
            })
        ));

        // 6. Initialize Global Settings (WhatsApp Templates, Company Info, etc.)
        const globalSettings = [
            { key: "companyName", value: shop.name },
            { key: "companyPhone", value: shop.phone || "" },
            { key: "companyAddress", value: shop.address || "" },
            { key: "companyWebsite", value: formData.website || "" },
            // WhatsApp Templates
            { key: "whatsappNewService", value: "Sayın {musteri_adi}, {cihaz} cihazınız {servis_no} numarası ile servisimize kabul edilmiştir." },
            { key: "whatsappReady", value: "Sayın {musteri_adi}, {cihaz} cihazınızın tamiri tamamlanmıştır. Teslim alabilirsiniz." },
            { key: "whatsappAppointment", value: "Sayın {musteri_adi}, {tarih} tarihinde randevunuz oluşturulmuştur. Sizi bekliyoruz!" },
            { key: "whatsappPaymentReminder", value: "Sayın {musteri_adi}, {tutar} tutarındaki ödemeniz hakkında hatırlatma. Ödeme için bize ulaşabilirsiniz." },
            { key: "whatsappConfirmBeforeSend", value: "true" },
            // Barcode & Printing
            { key: "barcodeAutoPrint", value: "true" },
            { key: "receiptAutoPrint", value: "true" },
            { key: "currencySymbol", value: "₺" },
        ];

        await Promise.all(globalSettings.map(s =>
            prisma.setting.upsert({
                where: { shopId_key: { shopId: shop.id, key: s.key } },
                update: { value: s.value },
                create: { ...s, shopId: shop.id }
            })
        ));

        revalidatePath("/");
        revalidatePath("/ayarlar");
        return { success: true, shopId: shop.id, shopName: shop.name };
    } catch (error: any) {
        console.error("Onboarding error:", error);
        return { success: false, error: error?.message || "Dükkan oluşturulamadı." };
    }
}
