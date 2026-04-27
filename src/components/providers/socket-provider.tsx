"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";

interface SocketContextType {
    socket: Socket | null;
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketUrl = window.location.origin;
        const socketInstance = io(socketUrl, {
            path: "/socket.io",
            transports: ['websocket'], // Force websocket for Traefik performance and stability
            reconnection: true,
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("connect_error", (err: Error) => {
            console.error("Socket connection error:", err.message);
            setIsConnected(false);
        });

        socketInstance.on("disconnect", (reason: string) => {
            console.log("Socket disconnected:", reason);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
