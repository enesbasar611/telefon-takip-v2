import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shopId = user.shopId;
                token.shopName = user.shop?.name;
                token.canSell = user.canSell;
                token.canService = user.canService;
                token.canStock = user.canStock;
                token.canFinance = user.canFinance;
            }

            // Recovery: If shopId is missing in token, check DB (helps with onboarding sync issues)
            if (token.id && !token.shopId) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id },
                    select: { shopId: true, shop: { select: { name: true } }, role: true }
                });
                if (dbUser?.shopId) {
                    token.shopId = dbUser.shopId;
                    token.shopName = dbUser.shop?.name;
                    token.role = dbUser.role;
                }
            }

            if (trigger === "update" && session?.shopId) {
                token.shopId = session.shopId;
                if (session.shopName) token.shopName = session.shopName;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.shopId = token.shopId;
                session.user.shopName = token.shopName;
                session.user.canSell = token.canSell;
                session.user.canService = token.canService;
                session.user.canStock = token.canStock;
                session.user.canFinance = token.canFinance;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};

export const getSession = () => getServerSession(authOptions);

export const auth = async () => {
    const session = await getSession();
    return session;
};

export const getShopId = async () => {
    const session = await auth();
    if (!session?.user?.shopId) {
        throw new Error("Unauthorized: No Shop ID found");
    }
    return session.user.shopId;
};

export const getUserId = async () => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized: No User ID found");
    }
    return session.user.id;
};
