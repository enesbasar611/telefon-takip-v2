import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sendApprovalCodeToAdmin } from "@/lib/mail";
import { cache } from "react";

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "qwerty61.enes@gmail.com";

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            }
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
                    isApproved: user.isApproved,
                    canSell: user.canSell,
                    canService: user.canService,
                    canStock: user.canStock,
                    canFinance: user.canFinance,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account, trigger, session }: any) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shopId = user.shopId;
                token.isApproved = user.isApproved;
                token.canSell = user.canSell;
                token.canService = user.canService;
                token.canStock = user.canStock;
                token.canFinance = user.canFinance;
            }

            if (account) {
                token.provider = account.provider;
                token.accessToken = account.access_token;
            }

            // Real-time synchronization: Check DB to ensure user is still active and roles are current
            if (token.id) {
                const dbUser = await (prisma.user as any).findUnique({
                    where: { id: token.id },
                    select: {
                        id: true,
                        shopId: true,
                        role: true,
                        isApproved: true,
                        canSell: true,
                        canService: true,
                        canStock: true,
                        canFinance: true,
                        shop: {
                            select: { isActive: true }
                        }
                    }
                });

                // Force logout if user no longer exists
                if (!dbUser) {
                    return null as any;
                }

                // Always sync critical fields from DB to ensure permissions are real-time
                token.shopId = dbUser.shopId;
                token.role = dbUser.role;
                token.isApproved = dbUser.isApproved;
                token.canSell = dbUser.canSell;
                token.canService = dbUser.canService;
                token.canStock = dbUser.canStock;
                token.canFinance = dbUser.canFinance;
                token.isShopActive = (dbUser as any).shop?.isActive ?? true;
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
                session.user.isApproved = token.isApproved;
                session.user.canSell = token.canSell;
                session.user.canService = token.canService;
                session.user.canStock = token.canStock;
                session.user.canFinance = token.canFinance;
                session.user.isShopActive = token.isShopActive;
                if (token.picture) session.user.image = token.picture;
                if (token.image) session.user.image = token.image;
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            // Automatically promote & approve the Super Admin
            if (user.email === SUPER_ADMIN_EMAIL) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        role: "SUPER_ADMIN" as Role,
                        isApproved: true,
                        verificationCode: null,
                        canFinance: true,
                        canDelete: true,
                        canEdit: true
                    }
                });
            } else {
                // For non-admin users: if not approved and no code, generate one and email admin
                const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
                if (dbUser && !dbUser.isApproved && !dbUser.verificationCode) {
                    const code = generateVerificationCode();
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { verificationCode: code }
                    });
                    await sendApprovalCodeToAdmin(user.email!, code);
                }
            }
        },
        async createUser({ user }) {
            // New users registered via OAuth (PrismaAdapter)
            const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
            const roleStr = isSuperAdmin ? "SUPER_ADMIN" : "SHOP_MANAGER";

            if (isSuperAdmin) {
                // Super Admin: auto-approve, no code needed
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        role: roleStr as Role,
                        isApproved: true,
                        verificationCode: null,
                        canFinance: true,
                        canDelete: true,
                        canEdit: true
                    }
                });
            } else {
                // Regular user: generate code, email admin
                const code = generateVerificationCode();
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        role: roleStr as Role,
                        isApproved: false,
                        verificationCode: code,
                        canFinance: true,
                        canDelete: true,
                        canEdit: true
                    }
                });
                // Send verification code to admin
                await sendApprovalCodeToAdmin(user.email!, code);
            }
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};

export const getSession = cache(() => getServerSession(authOptions));

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
