import { withAuth } from "next-auth/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const pathname = req.nextUrl.pathname;
        const isOnboardingPage = pathname.startsWith("/onboarding");
        const isVerifyPage = pathname.startsWith("/verify");

        if (isAuth) {
            const role = token.role as string;
            const isSuperAdmin = role === "SUPER_ADMIN";
            const isApproved = token.isApproved;
            const hasShop = !!token.shopId;

            // 1. ACCESS VERIFICATION (CRITICAL FIRST STEP)
            // If not approved and not super admin, must be on /verify
            if (!isApproved && !isSuperAdmin) {
                if (!isVerifyPage) {
                    return NextResponse.redirect(new URL("/verify", req.url));
                }
                return NextResponse.next();
            }

            // If already approved but somehow on /verify, move them forward
            if (isApproved && isVerifyPage) {
                if (!hasShop) {
                    return NextResponse.redirect(new URL("/onboarding", req.url));
                }
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // 2. ONBOARDING (RESTRICTED TO APPROVED USERS WITHOUT SHOP)
            if (!hasShop && !isOnboardingPage && !isSuperAdmin) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }

            // 3. PASSIVE SHOP PROTECTION
            const isShopActive = token.isShopActive;
            if (!isShopActive && !isSuperAdmin && !isOnboardingPage && !isVerifyPage) {
                return NextResponse.redirect(new URL("/login?error=AccountSuspended", req.url));
            }

            // 4. ROLE & PERMISSION PROTECTION
            const isCourierOnly = role === "COURIER";

            // Strictly restrict Couriers to /kurye only
            if (isCourierOnly && !pathname.startsWith("/kurye") && pathname !== "/") {
                return NextResponse.redirect(new URL("/kurye", req.url));
            }

            const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN" || role === "SHOP_MANAGER";
            const isManager = role === "MANAGER" || isAdmin;

            if (pathname.startsWith("/admin") && !isSuperAdmin) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            if (pathname.startsWith("/ayarlar/sektorler") && !isSuperAdmin) {
                return NextResponse.redirect(new URL("/ayarlar", req.url));
            }

            if ((pathname.startsWith("/personel") || pathname.startsWith("/ayarlar")) && !isManager) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            const canViewCourier = role === "COURIER" || isAdmin;
            if (pathname.startsWith("/kurye") && !canViewCourier) {
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
    if (req.nextUrl.pathname.startsWith("/login")) {
        const response = NextResponse.next();
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        response.cookies.delete("next-auth.callback-url");
        response.cookies.delete("__Secure-next-auth.callback-url");
        response.cookies.delete("next-auth.csrf-token");
        response.cookies.delete("__Host-next-auth.csrf-token");
        return response;
    }

    return authMiddleware(req as any, event as any);
}

export const config = {
    matcher: [
        "/((?!api|register|privacy-policy|terms|_next/static|_next/image|favicon.ico|favicon.svg|socket.io|public).*)",
    ],
};
