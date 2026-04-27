"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScanner } from "@/hooks/use-scanner";
import { Smartphone, QrCode, Loader2, HelpCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { buildScannerUrl } from "@/lib/scanner-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScannerHelpModal } from "@/components/scanner/scanner-help-modal";
import { toast } from "sonner";

interface ScannerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shopIdOrUserId: string;
}

export function ScannerModal({ open, onOpenChange, shopIdOrUserId }: ScannerModalProps) {
    const { initializeScannerRoom, isConnected, isMobileScannerLinked, socket } = useScanner();
    const [qrUrl, setQrUrl] = useState("");
    const [recentScans, setRecentScans] = useState<{ id: string; name: string; time: string; device: string }[]>([]);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!open) return;

        // Detect mobile/tablet and redirect
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && qrUrl) {
            router.push(qrUrl);
            onOpenChange(false);
        }
    }, [open, qrUrl, router, onOpenChange]);

    useEffect(() => {
        if (open && shopIdOrUserId) {
            initializeScannerRoom(shopIdOrUserId);

            const setFallbackUrl = () => {
                setQrUrl(buildScannerUrl({
                    roomId: shopIdOrUserId,
                    browserOrigin: window.location.origin,
                }));
            };

            // Fetch server's actual LAN IP to make QR reachable by mobile
            fetch("/api/network-info")
                .then(r => r.json())
                .then(data => {
                    setQrUrl(buildScannerUrl({
                        roomId: shopIdOrUserId,
                        browserOrigin: window.location.origin,
                        networkInfo: data,
                    }));
                })
                .catch(setFallbackUrl);
        }
    }, [open, shopIdOrUserId, initializeScannerRoom]);

    useEffect(() => {
        if (!socket || !open) return;

        const handleBarcode = ({ barcode, deviceId }: { barcode: string, deviceId?: string }) => {
            const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            setRecentScans(prev => [{
                id: Math.random().toString(36).substring(7),
                name: barcode, // Initially we only have the barcode string here or we could lookup
                time: now,
                device: deviceId || "???"
            }, ...prev].slice(0, 5));
        };

        socket.on("process_barcode", handleBarcode);
        return () => { socket.off("process_barcode", handleBarcode); };
    }, [socket, open]);

    const openHelp = () => {
        if (isMobileScannerLinked) {
            toast.info("Telefon zaten bağlı.");
            return;
        }
        setIsHelpOpen(true);
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-neutral-200 dark:border-neutral-800 backdrop-blur-md bg-white/90 dark:bg-neutral-900/90 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Smartphone className="w-6 h-6 text-blue-500" />
                        Telefon Kamerası ile Tarama
                    </DialogTitle>
                    <DialogDescription>
                        Aşağıdaki QR kodunu telefonunuzdan okutarak cihazı sepetinize bağlayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    <>
                        {!isConnected && (
                            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-500">
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <p className="text-xs font-medium">Sunucu bağlantısı bekleniyor, QR hazır.</p>
                            </div>
                        )}
                        {isMobileScannerLinked && (
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <p className="text-xs font-medium">Telefon bağlı. Barkod okutmaya hazır.</p>
                            </div>
                        )}
                        <div className="flex flex-col items-center space-y-4">
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                                    {qrUrl ? (
                                        <QRCodeSVG value={qrUrl} size={180} />
                                    ) : (
                                        <div className="w-[180px] h-[180px] bg-neutral-100 animate-pulse rounded-lg" />
                                    )}
                                </div>
                                <div className="w-full px-4 space-y-2 text-center">
                                    <Input
                                        readOnly
                                        value={qrUrl}
                                        onFocus={(event) => event.currentTarget.select()}
                                        className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300"
                                    />
                                    <p className="text-[9px] text-neutral-500 italic mt-1">
                                        (Bağlanamazsa bu adresi telefon tarayıcısına elle yazın)
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 rounded-2xl gap-2"
                                onClick={openHelp}
                            >
                                <HelpCircle className="h-4 w-4" />
                                Nasıl bağlarım?
                            </Button>

                            <div className="text-center space-y-2 max-w-xs">
                                <p className="font-semibold flex items-center justify-center gap-2 text-neutral-800 dark:text-neutral-200">
                                    <QrCode className="w-4 h-4 text-green-500" />
                                    Eşleşme Bekleniyor
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Telefonunuz eşleştiğinde, okutulan her barkod anında aşağıdaki ürünler listesine düşecektir.
                                </p>
                            </div>

                            {recentScans.length > 0 && (
                                <div className="w-full bg-neutral-50 dark:bg-black/20 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 space-y-3">
                                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Son Okutulanlar</h4>
                                    <div className="space-y-2">
                                        {recentScans.map(scan => (
                                            <div key={scan.id} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                        #{scan.device}
                                                    </span>
                                                    <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[120px] font-mono">
                                                        {scan.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-neutral-400">{scan.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </>
                </div>
            </DialogContent>
        </Dialog>
        <ScannerHelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
        </>
    );
}
