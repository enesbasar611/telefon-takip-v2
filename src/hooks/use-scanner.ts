import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";

export const useScanner = (onBarcodeScanned?: (barcode: string, deviceId?: string) => void) => {
    const { socket, isConnected } = useSocket();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isMobileScannerLinked, setIsMobileScannerLinked] = useState(false);

    // Initial Room Connect (For PC)
    const initializeScannerRoom = useCallback((currentUserIdOrShopId: string) => {
        if (!socket || !isConnected) return;

        setRoomId((currentRoomId) => {
            if (currentRoomId !== currentUserIdOrShopId) {
                setIsMobileScannerLinked(false);
            }
            return currentUserIdOrShopId;
        });
        socket.emit("join_room", currentUserIdOrShopId);
    }, [socket, isConnected]);

    // Listener for PC Side (when mobile scans or manages cart)
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleProcessBarcode = ({ barcode, deviceId }: { barcode: string, deviceId?: string }) => {
            if (onBarcodeScanned) {
                onBarcodeScanned(barcode, deviceId);
            }
        };

        const handleRemoveFromCart = ({ productId }: { productId: string }) => {
            window.dispatchEvent(new CustomEvent("scanner_remove_from_cart", { detail: { productId } }));
        };

        const handleUpdateQuantity = ({ productId, delta }: { productId: string, delta: number }) => {
            window.dispatchEvent(new CustomEvent("scanner_update_quantity", { detail: { productId, delta } }));
        };

        const handleAddToCart = ({ product }: { product: any }) => {
            window.dispatchEvent(new CustomEvent("scanner_add_to_cart", { detail: { product } }));
        };

        socket.on("process_barcode", handleProcessBarcode);
        socket.on("process_remove_from_cart", handleRemoveFromCart);
        socket.on("process_update_cart_quantity", handleUpdateQuantity);
        socket.on("process_add_to_cart", handleAddToCart);

        return () => {
            socket.off("process_barcode", handleProcessBarcode);
            socket.off("process_remove_from_cart", handleRemoveFromCart);
            socket.off("process_update_cart_quantity", handleUpdateQuantity);
            socket.off("process_add_to_cart", handleAddToCart);
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

    // Feedback & Sync commands sent from PC to Mobile
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

    const syncCartToMobile = useCallback((cart: any[]) => {
        if (socket && roomId) {
            socket.emit("sync_cart", { roomId, cart });
        }
    }, [socket, roomId]);

    return {
        socket,
        isConnected,
        isMobileScannerLinked,
        initializeScannerRoom,
        sendSuccessFeedback,
        sendErrorFeedback,
        syncCartToMobile,
        roomId
    };
};
