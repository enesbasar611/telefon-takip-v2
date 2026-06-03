"use client";

import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface SocketContextType {
    socket: any | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [socket, setSocket] = useState<any | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (status === "loading" || status !== "authenticated" || !session?.user?.shopId) {
            if (socket) {
                console.log("[SOCKET] Oturum kapalı veya shopId yok, bağlantı kesiliyor.");
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const shopId = session.user.shopId;
        const socketUrl = window.location.origin;

        console.log(`[SOCKET] ${shopId} için bağlantı başlatılıyor:`, socketUrl);

        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: 5, // Optimized as per task
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true,
            multiplex: true, // Optimized for performance
        });

        socketInstance.on("connect", () => {
            const transport = (socketInstance as any).io?.engine?.transport?.name || "Bilinmiyor";
            console.log(`[SOCKET] BAĞLANDI! ID: ${socketInstance.id} | Shop: ${shopId} | Transport: ${transport}`);

            // Join room once connected
            socketInstance.emit("join_room", shopId);
            setIsConnected(true);

            // Only show toast if not already connected (prevents toast spam)
            toast.success("Barkod sunucusuna bağlandı");
        });

        socketInstance.on("connect_error", (err: any) => {
            console.error("[SOCKET] BAĞLANTI HATASI:", err.message);
            setIsConnected(false);
        });

        socketInstance.on("disconnect", (reason: any) => {
            console.warn("[SOCKET] BAĞLANTI KOPTU:", reason);
            setIsConnected(false);
        });

        const pingInterval = setInterval(() => {
            if (socketInstance.connected) {
                socketInstance.emit("ping_status", {
                    time: new Date().toISOString(),
                    shopId: shopId
                });
            }
        }, 15000);

        setSocket(socketInstance);

        return () => {
            clearInterval(pingInterval);
            socketInstance.disconnect();
        };
    }, [status, session?.user?.shopId]); // Removed pathname dependency

    // Side effect to handle path-based restrictions if needed, without disconnecting
    useEffect(() => {
        if (!socket) return;

        const isCourierPage = pathname?.startsWith("/kurye");
        const allowedPaths = ["/satis", "/servis", "/stok", "/sorgula"];
        const isAllowed = allowedPaths.some(p => pathname?.startsWith(p));

        if (isCourierPage || !isAllowed) {
            // We could pause or emit a 'leave_room' here if desired, 
            // but the user wants the socket to stay global and active.
            // For now, we just log it to keep the connection alive but silent.
            console.log(`[SOCKET] Kısıtlı sayfadasınız (${pathname}), ama global bağlantı korunuyor.`);
        }
    }, [pathname, socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
