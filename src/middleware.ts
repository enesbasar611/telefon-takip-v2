import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isOnboardingPage = req.nextUrl.pathname.startsWith("/onboarding");

        if (isAuth) {
            const hasShop = !!token.shopId;
            const role = token.role as string;
            const pathname = req.nextUrl.pathname;

            if (!hasShop && !isOnboardingPage) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }


            // --- Role & Permission Protection ---
            const isAdmin = role === "ADMIN";
            const isManager = role === "MANAGER" || isAdmin;

            // Restricted sections
            if ((pathname.startsWith("/personel") || pathname.startsWith("/ayarlar")) && !isManager) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            if (pathname.startsWith("/finans") && !token.canFinance && !isAdmin) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            if ((pathname.startsWith("/satis") || pathname.startsWith("/kasa")) && !token.canSell && !isAdmin) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            if ((pathname.startsWith("/servis") || pathname.startsWith("/teknik")) && !token.canService && !isAdmin) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            if ((pathname.startsWith("/stok") || pathname.startsWith("/cihaz-listesi") || pathname.startsWith("/urunler")) && !token.canStock && !isAdmin) {
                return NextResponse.redirect(new URL("/", req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|login|register|_next/static|_next/image|favicon.ico|onboarding|socket.io|public).*)",
        "/onboarding",
    ],
};
