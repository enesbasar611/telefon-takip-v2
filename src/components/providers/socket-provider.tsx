"use client";

import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface SocketContextType {
    socket: any | null;
    isConnected: boolean;
    tabId: string;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    tabId: "",
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [socket, setSocket] = useState<any | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [tabId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());

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
        // Room ID is now unique per tab to prevent cross-talk between windows
        const roomId = `${shopId}:${tabId}`;

        console.log(`[SOCKET] ${roomId} için bağlantı başlatılıyor:`, socketUrl);

        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true,
            multiplex: true,
        });

        socketInstance.on("connect", () => {
            const transport = (socketInstance as any).io?.engine?.transport?.name || "Bilinmiyor";
            console.log(`[SOCKET] BAĞLANDI! ID: ${socketInstance.id} | Room: ${roomId} | Transport: ${transport}`);

            // Join room once connected
            socketInstance.emit("join_room", roomId);
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
                    roomId: roomId
                });
            }
        }, 15000);

        setSocket(socketInstance);

        return () => {
            clearInterval(pingInterval);
            socketInstance.disconnect();
        };
    }, [status, session?.user?.shopId, tabId]);

    // Side effect to handle path-based restrictions if needed, without disconnecting
    useEffect(() => {
        if (!socket) return;

        const isCourierPage = pathname?.startsWith("/kurye");
        const allowedPaths = ["/satis", "/servis", "/stok", "/sorgula"];
        const isAllowed = allowedPaths.some(p => pathname?.startsWith(p));

        if (isCourierPage || !isAllowed) {
            console.log(`[SOCKET] Kısıtlı sayfadasınız (${pathname}), ama global bağlantı korunuyor.`);
        }
    }, [pathname, socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, tabId }}>
            {children}
        </SocketContext.Provider>
    );
};
