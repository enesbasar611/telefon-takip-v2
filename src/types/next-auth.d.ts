import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            shopId: string | null;
            isApproved?: boolean;
            shopName?: string | null;
            canSell?: boolean;
            canService?: boolean;
            canStock?: boolean;
            canFinance?: boolean;
            canEdit?: boolean;
            canDelete?: boolean;
            isShopActive?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        shopId: string | null;
        isApproved?: boolean;
        shopName?: string | null;
        canSell?: boolean;
        canService?: boolean;
        canStock?: boolean;
        canFinance?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        shopId: string | null;
        isApproved?: boolean;
        shopName?: string | null;
        canSell?: boolean;
        canService?: boolean;
        canStock?: boolean;
        canFinance?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
        isShopActive?: boolean;
    }
}
