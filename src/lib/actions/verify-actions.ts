"use server";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendApprovalCodeToAdmin } from "@/lib/mail";
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

async function getVerificationUserId() {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        return session.user.id;
    }

    const token = await getToken({
        req: { headers: headers() } as any,
        secret: process.env.NEXTAUTH_SECRET
    });

    return token?.id as string | undefined;
}

export async function verifyApprovalCode(code: string) {
    try {
        const userId = await getVerificationUserId();
        if (!userId) {
            return { success: false, error: "Oturum bulunamadı. Lütfen tekrar Gmail ile giriş yapın." };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: "Kullanıcı bulunamadı." };
        }

        if (user.isApproved) {
            return { success: true, message: "Zaten onaylanmış." };
        }

        if (!user.verificationCode) {
            return { success: false, error: "Doğrulama kodu tanımlı değil. Yönetici ile iletişime geçin." };
        }

        if (user.verificationCode !== code.trim()) {
            return { success: false, error: "Geçersiz kod. Lütfen tekrar deneyin." };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isApproved: true,
                verificationCode: null,
                verificationAttempts: 0,
            } as any,
        });

        return { success: true, message: "Erişim onaylandı!" };
    } catch (error) {
        console.error("Verification error:", error);
        return { success: false, error: "Doğrulama sırasında bir hata oluştu." };
    }
}

export async function resendApprovalCode() {
    try {
        const userId = await getVerificationUserId();
        if (!userId) {
            return { success: false, error: "Oturum bulunamadı. Lütfen tekrar Gmail ile giriş yapın." };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                isApproved: true,
                verificationAttempts: true,
                lastVerificationSent: true
            }
        });

        if (!user) {
            return { success: false, error: "Kullanıcı bulunamadı." };
        }

        if (user.isApproved) {
            return { success: true, message: "Zaten onaylanmış." };
        }

        if (user.verificationAttempts >= 3) {
            return {
                success: false,
                error: "Maksimum kod gönderim sınırına ulaştınız (3/3). Lütfen yöneticinizle iletişime geçin."
            };
        }

        if (user.lastVerificationSent) {
            const lastSent = new Date(user.lastVerificationSent).getTime();
            const now = new Date().getTime();
            const diffSeconds = Math.floor((now - lastSent) / 1000);

            if (diffSeconds < 60) {
                return {
                    success: false,
                    error: `Yeni kod için ${60 - diffSeconds} saniye beklemelisiniz.`
                };
            }
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCode: newCode,
                verificationAttempts: { increment: 1 },
                lastVerificationSent: new Date()
            } as any,
        });

        await sendApprovalCodeToAdmin(user.email, newCode);

        return {
            success: true,
            message: `Yeni kod yöneticiye gönderildi. (Kalan hak: ${3 - (user.verificationAttempts + 1)})`
        };
    } catch (error) {
        console.error("Resend code error:", error);
        return { success: false, error: "Kod gönderilirken bir hata oluştu." };
    }
}
