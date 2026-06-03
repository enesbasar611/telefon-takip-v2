import { NextAuthOptions, getServerSession } from "next-auth";
import { cache } from "react";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sendApprovalCodeToAdmin } from "@/lib/mail";
import { checkUserEInvoiceStatus } from "@/lib/e-invoice-check";


const PRIMARY_SUPER_ADMIN_EMAIL = "qwerty61.enes@gmail.com";

function isSuperAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase();
    return normalizedEmail === PRIMARY_SUPER_ADMIN_EMAIL;
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
        // isApproved is intentionally NOT set here to prevent auto-bypass
        canSell: true,
        canService: true,
        canStock: true,
        canFinance: true,
        canDelete: true,
        canEdit: true
    };
}

// Note: Automatic role upgrades (ensureSuperAdminUser, ensureShopOwnerUser) 
// have been removed to prevent unauthorized elevation.
// Roles must now be assigned manually via the database or super admin dashboard.
function needsFullAccessSync(user: any) {
    return !user.canSell || !user.canService || !user.canStock || !user.canFinance || !user.canDelete || !user.canEdit;
}

async function createShopForGoogleUser(user: { id: string; email?: string | null; name?: string | null }) {
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { shopId: true, email: true }
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

    const targetEmail = user.email || existingUser?.email;

    if (targetEmail) {
        await prisma.user.upsert({
            where: { email: targetEmail.toLowerCase() },
            update: {
                ...getShopManagerPermissions(),
                isApproved: false,
                shopId: shop.id
            },
            create: {
                id: user.id,
                email: targetEmail.toLowerCase(),
                ...getShopManagerPermissions(),
                isApproved: false,
                shopId: shop.id
            }
        });
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                ...getShopManagerPermissions(),
                isApproved: false,
                shopId: shop.id
            }
        });
    }

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

                // Static role for designated Super Admin, keep existing role for others
                const effectiveRole = isSuperAdmin ? "SUPER_ADMIN" as Role : (user.role || "USER" as Role);

                // Shop check for everyone EXCEPT Super Admin
                if (!isSuperAdmin && !user.shopId) {
                    throw new Error("ShopNotLinked");
                }

                // Approval check for everyone EXCEPT Super Admin
                if (!isSuperAdmin && !user.isApproved) {
                    throw new Error("AccountNotApproved");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: effectiveRole,
                    shopId: user.shopId,
                    isApproved: isSuperAdmin ? true : user.isApproved,
                    canSell: isSuperAdmin ? true : user.canSell,
                    canService: isSuperAdmin ? true : user.canService,
                    canStock: isSuperAdmin ? true : user.canStock,
                    canFinance: isSuperAdmin ? true : user.canFinance,
                    canEdit: isSuperAdmin ? true : user.canEdit,
                    canDelete: isSuperAdmin ? true : user.canDelete,
                };
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }: any) {
            const email = user.email?.toLowerCase();
            const isSuperAdmin = isSuperAdminEmail(email);

            if (isSuperAdmin) {
                // Ensure Super Admin exists in the current DB
                await prisma.user.upsert({
                    where: { email },
                    update: { role: "SUPER_ADMIN" },
                    create: {
                        email: email!,
                        name: user.name || "Enes Başar",
                        role: "SUPER_ADMIN",
                        isApproved: true
                    }
                });

                // Auto-bootstrap: If no shop exists in the system, create the primary one
                const shopCount = await prisma.shop.count();
                if (shopCount === 0) {
                    console.log("[Setup] No shops found. Bootstrapping primary shop...");
                    await prisma.shop.create({
                        data: {
                            id: "clprimary0000000000000000", // Stable ID for bootstrapping
                            name: "BAŞAR TEKNİK MERKEZ",
                            isActive: true,
                            enabledModules: ["SERVICE", "STOCK", "SALE", "FINANCE", "EFATURA"]
                        }
                    });
                }
                return true;
            }

            if (account?.provider === "google") {
                // Upsert Google user - restricted starting role
                const dbUser = email
                    ? await prisma.user.upsert({
                        where: { email },
                        update: {
                            name: user.name || undefined,
                            image: (user.image || (user as any).picture) || undefined,
                        },
                        create: {
                            email: email,
                            name: user.name || undefined,
                            image: (user.image || (user as any).picture) || undefined,
                            role: Role.SHOP_MANAGER, // Use SHOP_MANAGER as default for new owners
                            isApproved: false,
                        },
                        select: {
                            id: true,
                            role: true,
                            shopId: true,
                            isApproved: true
                        }
                    })
                    : null;

                if (dbUser) {
                    // Check if shop exists for onboarding redirect
                    const shopExists = dbUser.shopId ? await prisma.shop.findUnique({ where: { id: dbUser.shopId } }) : null;

                    if (!dbUser.shopId || !shopExists) {
                        return "/onboarding";
                    }

                    if (!dbUser.isApproved && dbUser.role !== "COURIER") {
                        return "/verify";
                    }
                    return true;
                }
            }

            if (user.role !== "COURIER" && !user.isApproved) {
                return "/verify";
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

            // Real-time DB sync on every request - OPTIMIZED WITH TTL (5s for Super Admin, 30s for others)
            const now = Math.floor(Date.now() / 1000);
            const isSuperAdmin = (token.role === "SUPER_ADMIN") || isSuperAdminEmail(token.email as string);
            const syncInterval = isSuperAdmin ? 5 : 30;

            if (token.id && (!token.lastSync || now - (token.lastSync as number) > syncInterval)) {
                try {
                    let dbUser = await (prisma.user as any).findUnique({
                        where: { id: token.id },
                        select: {
                            id: true,
                            email: true,
                            name: true,
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

                    // Force logout or clear stale data if user no longer exists in current DB
                    if (!dbUser) {
                        if (isSuperAdmin) {
                            console.log(`[JWT] Super Admin ${token.email} not found. Re-provisioning...`);
                            const newUser = await prisma.user.upsert({
                                where: { email: token.email?.toLowerCase() },
                                update: { role: "SUPER_ADMIN" },
                                create: {
                                    email: token.email?.toLowerCase()!,
                                    name: token.name || "Enes Başar",
                                    role: "SUPER_ADMIN",
                                    isApproved: true
                                }
                            });
                            token.id = newUser.id; // Switch to new ID
                            token.lastSync = now;

                            // Auto-bootstrap shop if none exists
                            const shopCount = await prisma.shop.count();
                            if (shopCount === 0) {
                                console.log("[Setup] No shops found. Bootstrapping primary shop in JWT...");
                                await prisma.shop.create({
                                    data: {
                                        id: "clprimary0000000000000000",
                                        name: "BAŞAR TEKNİK MERKEZ",
                                        isActive: true,
                                        enabledModules: ["SERVICE", "STOCK", "SALE", "FINANCE", "EFATURA"]
                                    }
                                });
                            }

                            dbUser = newUser as any;
                        } else {
                            console.warn(`[JWT] User ${token.id} (${token.email}) not found in database. Clearing stale shopId.`);
                            token.shopId = undefined;
                            token.lastSync = now;
                            return token;
                        }
                    }

                    const effectiveUser = dbUser; // Stop auto-upgrading permissions via ensured methods

                    // Sync the core profile bits
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.email = dbUser.email;

                    const currentName = dbUser.name?.trim();
                    if (!currentName || currentName === "...") {
                        const newName = dbUser.email?.split('@')[0] || "Kullanıcı";
                        try {
                            await prisma.user.upsert({
                                where: { email: dbUser.email.toLowerCase() },
                                update: { name: newName },
                                create: {
                                    id: dbUser.id,
                                    email: dbUser.email.toLowerCase(),
                                    name: newName,
                                    role: dbUser.role
                                }
                            });
                        } catch (e) {
                            console.error("Failed to fix user name in DB:", e);
                        }
                        token.name = newName;
                    } else {
                        token.name = currentName;
                    }

                    // Critical: Ensure shopId is synced from the most up-to-date user record
                    // If shopId changed in DB (e.g. impersonation), update token immediately
                    if (token.shopId !== dbUser.shopId) {
                        token.shopId = dbUser.shopId;
                        token.lastSync = now; // Reset sync on change
                    }

                    token.shopId = effectiveUser.shopId || dbUser.shopId;

                    if (isSuperAdmin && !token.shopId) {
                        // Priority 1: Primary shop (BAŞAR)
                        // Priority 2: Any shop with "TEKNİK" or "TELEFON" (User's preferred category)
                        // Priority 3: First available shop
                        const homeShop = await prisma.shop.findFirst({
                            where: { name: { contains: "BAŞAR", mode: "insensitive" } },
                            orderBy: { createdAt: 'asc' }
                        }) || await prisma.shop.findFirst({
                            where: {
                                OR: [
                                    { name: { contains: "TEKNİK", mode: "insensitive" } },
                                    { name: { contains: "TELEFON", mode: "insensitive" } }
                                ]
                            },
                            orderBy: { createdAt: 'asc' }
                        }) || await prisma.shop.findFirst({ orderBy: { createdAt: 'asc' } });

                        if (homeShop) {
                            token.shopId = homeShop.id;
                        }
                    }

                    token.isApproved = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.isApproved;
                    token.canSell = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canSell;
                    token.canService = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canService;
                    token.canStock = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canStock;
                    token.canFinance = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canFinance;
                    token.canEdit = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canEdit;
                    token.canDelete = (isSuperAdmin || dbUser.role === "COURIER") ? true : effectiveUser.canDelete;
                    token.isShopActive = (dbUser as any).shop?.isActive ?? true;

                    // Check e-Invoice Status
                    token.isEInvoiceUser = await checkUserEInvoiceStatus(dbUser.id);

                    // Impersonation detection: If Super Admin is NOT in their home shop
                    if (isSuperAdmin && token.shopId) {
                        const currentShop = await prisma.shop.findUnique({
                            where: { id: token.shopId as string },
                            select: { name: true }
                        });

                        const shopName = (currentShop?.name || "").toLowerCase();
                        const isHomeShop = shopName.includes("başar") ||
                            shopName.includes("basar") ||
                            token.shopId === "clprimary0000000000000000" ||
                            shopName === "";

                        token.isImpersonating = !isHomeShop;
                    } else {
                        token.isImpersonating = false;
                    }

                    token.lastSync = now; // Update sync timestamp
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
                session.user.isImpersonating = token.isImpersonating;
                session.user.isEInvoiceUser = token.isEInvoiceUser;
                if (token.picture) session.user.image = token.picture;
                if (token.image) session.user.image = token.image;
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            const email = user.email?.toLowerCase();
            const isSuperAdmin = isSuperAdminEmail(email);

            if (!isSuperAdmin) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { id: true, isApproved: true, verificationCode: true, role: true }
                });

                // If not approved and no code exists, generate and send one
                if (dbUser && !dbUser.isApproved && !dbUser.verificationCode) {
                    const code = generateVerificationCode();
                    const normalizedEmail = user.email!.toLowerCase();
                    await prisma.user.upsert({
                        where: { email: normalizedEmail },
                        update: {
                            verificationCode: code,
                            isApproved: false
                        },
                        create: {
                            email: normalizedEmail,
                            name: user.name || undefined,
                            verificationCode: code,
                            isApproved: false,
                            role: Role.SHOP_MANAGER,
                        }
                    });
                    await sendApprovalCodeToAdmin(normalizedEmail, code);
                }
            }
        },
        async createUser({ user }) {
            // New users are restricted by default.
            // No auto-upgrade or shop creation here.
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

export const auth = cache(async () => {
    const session = await getSession();
    return session;
});

// Cached home shop lookup for Super Admin fallback
const getHomeShopId = cache(async () => {
    const homeShop = await prisma.shop.findFirst({
        where: { name: { contains: "BAŞAR", mode: "insensitive" } },
        select: { id: true }
    }) || await prisma.shop.findFirst({
        where: {
            OR: [
                { name: { contains: "TEKNİK", mode: "insensitive" } },
                { name: { contains: "TELEFON", mode: "insensitive" } }
            ]
        },
        select: { id: true }
    }) || await prisma.shop.findFirst({ select: { id: true } });

    return homeShop?.id || null;
});

export function getShopId(): Promise<string>;
export function getShopId(required: true): Promise<string>;
export function getShopId(required: false): Promise<string | null>;
export async function getShopId(required = true): Promise<string | null> {
    const session = await auth();

    // Validate shopId: must be truthy and not "null" string/placeholder
    let shopId = session?.user?.shopId;
    if (shopId === "null" || shopId === "undefined" || shopId === "") {
        shopId = undefined;
    }

    if (shopId) {
        return shopId;
    }

    // Super Admin fallback: token may lack shopId during impersonation transitions.
    // Find the "home" shop automatically so no call site crashes.
    if (session?.user?.role === "SUPER_ADMIN" || isSuperAdminEmail(session?.user?.email as string)) {
        const homeShopId = await getHomeShopId();
        if (homeShopId) {
            console.log(`[getShopId] Super Admin fallback to homeShopId: ${homeShopId}`);
            return homeShopId;
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
