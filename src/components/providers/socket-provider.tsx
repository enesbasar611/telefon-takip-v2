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
        if (status === "loading") return;

        // Skip socket connection on courier panel as requested - it causes 
        // connection errors on unstable mobile networks and isn't needed there.
        const isCourierPage = pathname?.startsWith("/kurye");

        const allowedPaths = ["/satis", "/servis", "/stok", "/sorgula"];
        const isAllowed = allowedPaths.some(p => pathname?.startsWith(p));

        // Sadece giriş yapılmışsa, shopId varsa, kurye sayfasında değilsek VE izin verilen sayfalardaysak bağlan
        if (status !== "authenticated" || !session?.user?.shopId || isCourierPage || !isAllowed) {
            if (socket) {
                console.log(`[SOCKET] Bağlantı için uygun olmayan durum (Sayfa: ${pathname}), kesiliyor...`);
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const shopId = session.user.shopId;
        const socketUrl = window.location.origin;

        console.log(`[SOCKET] ${shopId} için ${pathname} sayfasında başlatılıyor:`, socketUrl);

        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true, // we still use autoConnect since we are already inside the "isAllowed" block
        });

        socketInstance.on("connect", () => {
            const transport = (socketInstance as any).io?.engine?.transport?.name || "Bilinmiyor";
            console.log(`[SOCKET] BAĞLANDI! ID: ${socketInstance.id} | Shop: ${shopId} | Transport: ${transport}`);

            // Odaya katıl
            socketInstance.emit("join_room", shopId);

            setIsConnected(true);
            toast.success("Barkod sunucusuna bağlandı");
        });

        socketInstance.on("connect_error", (err: any) => {
            console.error("[SOCKET] BAĞLANTI HATASI:", err.message);
            // Sadece mobil cihazlarda hata göster
            if (window.innerWidth < 768) {
                toast.error(`Barkod Bağlantı Hatası: ${err.message}`);
            }
            setIsConnected(false);
        });

        socketInstance.on("disconnect", (reason: any) => {
            console.warn("[SOCKET] BAĞLANTI KOPTU:", reason);
            setIsConnected(false);
        });

        // Debug: Sunucuya özel ping gönder
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
    }, [status, session?.user?.shopId, pathname]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
