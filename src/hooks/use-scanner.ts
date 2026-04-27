import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";

export const useScanner = (onBarcodeScanned?: (barcode: string, deviceId?: string) => void) => {
    const { socket, isConnected } = useSocket();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isMobileScannerLinked, setIsMobileScannerLinked] = useState(false);

    // Initial Room Connect (For PC)
    const initializeScannerRoom = useCallback((currentUserIdOrShopId: string) => {
        if (!socket || !isConnected) return;

        // Set Room ID logically as the entity's ID (or generate one)
        setRoomId((currentRoomId) => {
            if (currentRoomId !== currentUserIdOrShopId) {
                setIsMobileScannerLinked(false);
            }
            return currentUserIdOrShopId;
        });
        socket.emit("join_room", currentUserIdOrShopId);
    }, [socket, isConnected]);

    // Listener for PC Side (when mobile scans)
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleProcessBarcode = ({ barcode, deviceId }: { barcode: string, deviceId?: string }) => {
            if (onBarcodeScanned) {
                onBarcodeScanned(barcode, deviceId);
            }
        };

        socket.on("process_barcode", handleProcessBarcode);

        return () => {
            socket.off("process_barcode", handleProcessBarcode);
        };
    }, [socket, roomId, onBarcodeScanned]);

    useEffect(() => {
        if (!socket || !roomId) return;

        const handleMobileLinked = () => {
            setIsMobileScannerLinked(true);
        };

        socket.on("mobile_scanner_linked", handleMobileLinked);
        return () => {
            socket.off("mobile_scanner_linked", handleMobileLinked);
        };
    }, [socket, roomId]);

    // Feedback commands sent from PC to Mobile
    const sendSuccessFeedback = useCallback((productName: string, deviceId?: string) => {
        if (socket && roomId) {
            socket.emit("scan_success", { roomId, productName, deviceId });
        }
    }, [socket, roomId]);

    const sendErrorFeedback = useCallback((message: string, deviceId?: string) => {
        if (socket && roomId) {
            socket.emit("scan_error", { roomId, message, deviceId });
        }
    }, [socket, roomId]);

    return {
        socket,
        isConnected,
        isMobileScannerLinked, // In future, you might want to detect if mobile actually joined
        initializeScannerRoom,
        sendSuccessFeedback,
        sendErrorFeedback,
        roomId
    };
};
