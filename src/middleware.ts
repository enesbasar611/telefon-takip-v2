import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isOnboardingPage = req.nextUrl.pathname.startsWith("/onboarding");

        if (isAuth) {
            const hasShop = !!token.shopId;

            if (!hasShop && !isOnboardingPage) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }

            if (hasShop && isOnboardingPage) {
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
