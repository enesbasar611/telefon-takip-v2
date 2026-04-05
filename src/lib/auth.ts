import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Geçersiz giriş bilgileri");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Kullanıcı bulunamadı veya şifre atanmamış");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Hatalı şifre");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    shopId: user.shopId,
                    canSell: user.canSell,
                    canService: user.canService,
                    canStock: user.canStock,
                    canFinance: user.canFinance,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shopId = user.shopId;
                token.canSell = user.canSell;
                token.canService = user.canService;
                token.canStock = user.canStock;
                token.canFinance = user.canFinance;
            }

            // Recovery: If shopId is missing in token, check DB
            if (token.id && !token.shopId) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id },
                    select: {
                        shopId: true,
                        shop: { select: { name: true } },
                        role: true,
                        canSell: true,
                        canService: true,
                        canStock: true,
                        canFinance: true,
                    }
                });
                if (dbUser) {
                    token.shopId = dbUser.shopId;
                    token.role = dbUser.role;
                    token.canSell = dbUser.canSell;
                    token.canService = dbUser.canService;
                    token.canStock = dbUser.canStock;
                    token.canFinance = dbUser.canFinance;
                }
            }

            if (trigger === "update" && session) {
                return { ...token, ...session };
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.shopId = token.shopId;
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
