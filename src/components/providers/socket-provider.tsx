"use client";

import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "sonner";

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
    const [socket, setSocket] = useState<any | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketUrl = window.location.origin;

        console.log("[SOCKET] Başlatılıyor:", socketUrl);

        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ['websocket'], // KRİTİK: Traefik için polling tamamen devre dışı
            upgrade: false,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true,
        });

        socketInstance.on("connect", () => {
            const transport = (socketInstance as any).io?.engine?.transport?.name || "Bilinmiyor";
            console.log(`[SOCKET] BAĞLANDI! ID: ${socketInstance.id} | Transport: ${transport}`);
            setIsConnected(true);
            toast.success("Barkod sunucusuna bağlandı");
        });

        socketInstance.on("connect_error", (err: any) => {
            console.error("[SOCKET] BAĞLANTI HATASI:", err.message);
            // Mobil cihazlarda debug'ı kolaylaştırmak için toast
            if (window.innerWidth < 768) {
                toast.error(`Bağlantı Hatası: ${err.message}`);
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
                socketInstance.emit("ping_status", { time: new Date().toISOString() });
            }
        }, 15000);

        setSocket(socketInstance);
        return () => {
            clearInterval(pingInterval);
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
