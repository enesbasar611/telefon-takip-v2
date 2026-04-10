"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

function AuthStatusWatcher() {
    const { status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            // Force a refresh if they are on a dashboard page but session is gone
            if (window.location.pathname.startsWith("/dashboard") ||
                window.location.pathname.startsWith("/servis") ||
                window.location.pathname.startsWith("/stok")) {
                window.location.href = "/login?reason=session_expired";
            }
        }
    }, [status]);

    return null;
}

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider
            refetchInterval={30} // Check session every 30 seconds
            refetchOnWindowFocus={true} // Revalidate when user returns to the tab
        >
            <AuthStatusWatcher />
            {children}
        </SessionProvider>
    );
}



