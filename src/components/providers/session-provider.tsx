"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

import { useState } from "react";

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
    const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);

    useEffect(() => {
        const handleStatus = () => setIsOnline(window.navigator.onLine);
        window.addEventListener("online", handleStatus);
        window.addEventListener("offline", handleStatus);
        return () => {
            window.removeEventListener("online", handleStatus);
            window.removeEventListener("offline", handleStatus);
        };
    }, []);

    return (
        <SessionProvider
            // Disable background refresh when offline to prevent console errors
            refetchInterval={isOnline ? 120 : 0}
            // Only refetch on focus if online and with a delay
            refetchOnWindowFocus={false}
        >
            <AuthStatusWatcher />
            {children}
        </SessionProvider>
    );
}



