import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            shopId: string | null;
            shopName?: string | null;
            canSell?: boolean;
            canService?: boolean;
            canStock?: boolean;
            canFinance?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        shopId: string | null;
        shopName?: string | null;
        canSell?: boolean;
        canService?: boolean;
        canStock?: boolean;
        canFinance?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        shopId: string | null;
        shopName?: string | null;
        canSell?: boolean;
        canService?: boolean;
        canStock?: boolean;
        canFinance?: boolean;
    }
}
