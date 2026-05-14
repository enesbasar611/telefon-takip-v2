import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sendApprovalCodeToAdmin } from "@/lib/mail";


const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ALTERNATIVE_SUPER_ADMIN = process.env.ALTERNATIVE_ADMIN_EMAIL;
const PRIMARY_SUPER_ADMIN_EMAIL = "qwerty61.enes@gmail.com";

function isSuperAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase();
    return [
        PRIMARY_SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_EMAIL,
        ALTERNATIVE_SUPER_ADMIN,
    ]
        .filter(Boolean)
        .some((adminEmail) => adminEmail!.toLowerCase() === normalizedEmail);
}

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSuperAdminPermissions() {
    return {
        role: "SUPER_ADMIN" as Role,
        isApproved: true,
        verificationCode: null,
        canSell: true,
        canService: true,
        canStock: true,
        canFinance: true,
        canDelete: true,
        canEdit: true
    };
}

const SHOP_OWNER_ROLES = new Set<Role>(["ADMIN", "SHOP_MANAGER", "MANAGER"]);

function isShopOwnerRole(role?: Role | string | null): role is Role {
    return !!role && SHOP_OWNER_ROLES.has(role as Role);
}

function getShopManagerPermissions() {
    return {
        role: "SHOP_MANAGER" as Role,
        isApproved: true,
        verificationCode: null,
        canSell: true,
        canService: true,
        canStock: true,
        canFinance: true,
        canDelete: true,
        canEdit: true
    };
}

async function ensureSuperAdminUser(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: getSuperAdminPermissions()
    });
}

async function ensureShopOwnerUser(userId: string, role?: Role | string | null) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            ...getShopManagerPermissions(),
            role: isShopOwnerRole(role) ? role : "SHOP_MANAGER"
        }
    });
}

function needsFullAccessSync(user: {
    isApproved?: boolean | null;
    canSell?: boolean | null;
    canService?: boolean | null;
    canStock?: boolean | null;
    canFinance?: boolean | null;
    canDelete?: boolean | null;
    canEdit?: boolean | null;
}) {
    return !user.isApproved || !user.canSell || !user.canService || !user.canStock || !user.canFinance || !user.canDelete || !user.canEdit;
}

async function createShopForGoogleUser(user: { id: string; email?: string | null; name?: string | null }) {
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { shopId: true }
    });

    if (existingUser?.shopId) {
        return existingUser.shopId;
    }

    const fallbackName = user.email?.split("@")[0] || "Yeni Dükkan";
    const shop = await prisma.shop.create({
        data: {
            name: user.name ? `${user.name} Dükkanı` : `${fallbackName} Dükkanı`,
            email: user.email || undefined,
            isFirstLogin: true,
            isActive: true
        }
    });

    await prisma.user.update({
        where: { id: user.id },
        data: {
            ...getShopManagerPermissions(),
            shopId: shop.id
        }
    });

    return shop.id;
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file"
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

                const email = credentials.email.toLowerCase();
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user || !user.password) {
                    throw new Error("Kullanıcı bulunamadı veya şifre atanmamış");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Hatalı şifre");
                }

                const isSuperAdmin = isSuperAdminEmail(user.email);
                let effectiveUser = user;
                if (isSuperAdmin && (user.role !== "SUPER_ADMIN" || !user.isApproved || !user.canFinance || !user.canDelete || !user.canEdit)) {
                    effectiveUser = await ensureSuperAdminUser(user.id);
                } else if (!isSuperAdmin && isShopOwnerRole(user.role) && needsFullAccessSync(user)) {
                    effectiveUser = await ensureShopOwnerUser(user.id, user.role);
                }

                if (!isSuperAdmin && !effectiveUser.isApproved) {
                    throw new Error("AccountNotApproved");
                }

                if (!isSuperAdmin && !effectiveUser.shopId) {
                    throw new Error("ShopNotLinked");
                }

                return {
                    id: effectiveUser.id,
                    email: effectiveUser.email,
                    name: effectiveUser.name,
                    role: isSuperAdmin ? "SUPER_ADMIN" : effectiveUser.role,
                    shopId: effectiveUser.shopId,
                    isApproved: isSuperAdmin ? true : effectiveUser.isApproved,
                    canSell: effectiveUser.canSell,
                    canService: effectiveUser.canService,
                    canStock: effectiveUser.canStock,
                    canFinance: isSuperAdmin ? true : effectiveUser.canFinance,
                    canEdit: isSuperAdmin ? true : effectiveUser.canEdit,
                    canDelete: isSuperAdmin ? true : effectiveUser.canDelete,
                };
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }: any) {
            const email = user.email?.toLowerCase();
            const isSuperAdmin = isSuperAdminEmail(email);

            if (isSuperAdmin && user.id) {
                await ensureSuperAdminUser(user.id);
                return true;
            }

            if (account?.provider === "google") {
                const dbUser = email
                    ? await prisma.user.findUnique({
                        where: { email },
                        select: {
                            id: true,
                            role: true,
                            shopId: true,
                            isApproved: true,
                            canSell: true,
                            canService: true,
                            canStock: true,
                            canFinance: true,
                            canEdit: true,
                            canDelete: true
                        }
                    })
                    : null;

                if (dbUser && !dbUser.shopId && dbUser.role === "STAFF") {
                    await createShopForGoogleUser({ id: dbUser.id, email: user.email, name: user.name });
                    return true;
                }

                if (dbUser && isShopOwnerRole(dbUser.role)) {
                    if (needsFullAccessSync(dbUser)) {
                        await ensureShopOwnerUser(dbUser.id, dbUser.role);
                    }
                    return true;
                }

                if (dbUser && !dbUser.isApproved) {
                    return "/login?error=AccountNotApproved";
                }

                return true;
            }

            if (!user.isApproved) {
                return "/login?error=AccountNotApproved";
            }

            return true;
        },
        async jwt({ token, user, account }: any) {
            // Initial sign in — populate token from credentials/OAuth
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.shopId = user.shopId;
                token.isApproved = user.isApproved;
                token.canSell = user.canSell;
                token.canService = user.canService;
                token.canStock = user.canStock;
                token.canFinance = user.canFinance;
                token.canEdit = user.canEdit;
                token.canDelete = user.canDelete;
            }

            if (account && account.provider === "google") {
                token.provider = account.provider;
                token.accessToken = account.access_token;

                // Explicitly persist the refresh token if provided (happens on prompt=consent)
                if (account.refresh_token) {
                    await prisma.account.updateMany({
                        where: {
                            provider: "google",
                            providerAccountId: account.providerAccountId
                        },
                        data: {
                            refresh_token: account.refresh_token,
                            access_token: account.access_token,
                            expires_at: account.expires_at,
                        }
                    });
                }
            }

            // Real-time DB sync on every request.
            // Because we always read from DB here, when stopImpersonating() updates
            // the shopId in DB the very next JWT evaluation (triggered by update() or
            // any navigation) will automatically carry the fresh value — no merging needed.
            if (token.id) {
                try {
                    const dbUser = await (prisma.user as any).findUnique({
                        where: { id: token.id },
                        select: {
                            id: true,
                            email: true,
                            shopId: true,
                            role: true,
                            isApproved: true,
                            canSell: true,
                            canService: true,
                            canStock: true,
                            canFinance: true,
                            canEdit: true,
                            canDelete: true,
                            shop: {
                                select: { isActive: true }
                            }
                        }
                    });

                    // Force logout if user no longer exists
                    if (!dbUser) {
                        return null as any;
                    }

                    const isSuperAdmin = isSuperAdminEmail(dbUser.email) || dbUser.role === "SUPER_ADMIN";
                    const effectiveUser = isSuperAdmin
                        ? (needsFullAccessSync(dbUser) || dbUser.role !== "SUPER_ADMIN" ? await ensureSuperAdminUser(dbUser.id) : dbUser)
                        : (isShopOwnerRole(dbUser.role) && needsFullAccessSync(dbUser) ? await ensureShopOwnerUser(dbUser.id, dbUser.role) : dbUser);

                    token.shopId = effectiveUser.shopId;
                    token.role = isSuperAdmin ? "SUPER_ADMIN" : effectiveUser.role;
                    token.isApproved = isSuperAdmin ? true : effectiveUser.isApproved;
                    token.canSell = effectiveUser.canSell;
                    token.canService = effectiveUser.canService;
                    token.canStock = effectiveUser.canStock;
                    token.canFinance = isSuperAdmin ? true : effectiveUser.canFinance;
                    token.canEdit = isSuperAdmin ? true : effectiveUser.canEdit;
                    token.canDelete = isSuperAdmin ? true : effectiveUser.canDelete;
                    token.isShopActive = (dbUser as any).shop?.isActive ?? true;
                } catch (error) {
                    console.error("NextAuth token DB sync failed:", error);
                }
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
                session.user.canEdit = token.canEdit;
                session.user.canDelete = token.canDelete;
                session.user.isShopActive = token.isShopActive;
                if (token.picture) session.user.image = token.picture;
                if (token.image) session.user.image = token.image;
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            if (isSuperAdminEmail(user.email)) {
                await ensureSuperAdminUser(user.id);
            } else {
                const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
                if (dbUser && isShopOwnerRole(dbUser.role)) {
                    await ensureShopOwnerUser(dbUser.id, dbUser.role);
                    return;
                }
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
            if (isSuperAdminEmail(user.email)) {
                await ensureSuperAdminUser(user.id);
                return;
            }

            await createShopForGoogleUser(user);
        }
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

export function getShopId(): Promise<string>;
export function getShopId(required: true): Promise<string>;
export function getShopId(required: false): Promise<string | null>;
export async function getShopId(required = true): Promise<string | null> {
    const session = await auth();

    // Fast path: shopId is already in the token
    if (session?.user?.shopId) {
        return session.user.shopId;
    }

    // Super Admin fallback: token may lack shopId during impersonation transitions.
    // Find the "home" shop automatically so no call site crashes.
    if (session?.user?.role === "SUPER_ADMIN") {
        const homeShop = await prisma.shop.findFirst({
            where: { name: { contains: "BAŞAR", mode: "insensitive" } },
            select: { id: true }
        }) || await prisma.shop.findFirst({ select: { id: true } });

        if (homeShop) {
            return homeShop.id;
        }
    }

    if (required) {
        throw new Error("Unauthorized: No Shop ID found");
    }

    return null;
};

export const getUserId = async () => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized: No User ID found");
    }
    return session.user.id;
};
