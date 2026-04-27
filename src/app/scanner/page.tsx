"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import { Loader2, Camera, ShieldCheck, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileScannerPage() {
    const { socket, isConnected } = useSocket();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [history, setHistory] = useState<{ id: string; name: string; barcode: string; time: string; status: 'success' | 'error' }[]>([]);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedBarcode = useRef<string>("");

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Beep frequency
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio failed:", e);
        }
    };

    useEffect(() => {
        // URL'den room id al veya localStorage'dan
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get("room");

        if (urlRoom) {
            setRoomId(urlRoom);
            localStorage.setItem("scanner_room_id", urlRoom);
        } else {
            const savedRoom = localStorage.getItem("scanner_room_id");
            if (savedRoom) setRoomId(savedRoom);
            else toast.error("Kayıtlı bir oda bulunamadı. Lütfen QR okutun.");
        }

        // HTTPS Check
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const isHttps = window.location.protocol === "https:";
        if (!isLocalhost && !isHttps) {
            toast.warning("Kamera uyarısı: Güvenli olmayan (HTTP) bağlantılarda kamera çalışmayabilir. Chrome kullanıyorsanız 'unsafely-treat-insecure-origin-as-secure' ayarını yapmanız gerekebilir.");
        }
    }, []);

    useEffect(() => {
        if (socket && isConnected && roomId) {
            socket.emit("join_room", roomId);
            console.log("Joined room:", roomId);

            // Feedback event listeners
            socket.on("mobile_feedback", ({ success, message, productName }: { success: boolean; message?: string; productName?: string }) => {
                const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                if (success) {
                    toast.success(`Sepete Gönderildi: ${productName}`);
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                    setHistory(prev => [{
                        id: Math.random().toString(36).substring(7),
                        name: productName || "Bilinmeyen Ürün",
                        barcode: lastScannedBarcode.current || "",
                        time: now,
                        status: 'success' as const
                    }, ...prev].slice(0, 50));
                } else {
                    toast.error(`Hata: ${message}`);
                    if (navigator.vibrate) navigator.vibrate([500]);

                    setHistory(prev => [{
                        id: Math.random().toString(36).substring(7),
                        name: message || "Hata Oluştu",
                        barcode: lastScannedBarcode.current || "",
                        time: now,
                        status: 'error' as const
                    }, ...prev].slice(0, 50));
                }

                // Yeniden okumaya hazır olmak için ufak gecikme ver
                setTimeout(() => setIsScanning(true), 2000);
            });

            return () => {
                socket.off("mobile_feedback");
            };
        }
    }, [socket, isConnected, roomId]);

    const handleReScan = (barcode: string) => {
        if (socket && roomId && barcode) {
            playBeep();
            socket.emit("barcode_scanned", { roomId, barcode });
            toast.info("Barkod tekrar gönderildi...");
        }
    };

    const startScanning = async () => {
        if (!roomId) {
            toast.error("Oda bağlantısı yok! QR kodunu tekrar okutun.");
            return;
        }

        try {
            setIsScanning(true);
            scannerRef.current = new Html5Qrcode("reader");

            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 1
                },
                (decodedText) => {
                    if (socket && roomId) {
                        // Barkodu bulur bulmaz durdur
                        scannerRef.current?.stop().then(() => {
                            setIsScanning(false);
                            playBeep();
                            lastScannedBarcode.current = decodedText;
                            socket.emit("barcode_scanned", { roomId, barcode: decodedText });
                            if (navigator.vibrate) navigator.vibrate(100);
                        });
                    }
                },
                (errorMessage) => {
                    // Çok fazla error verir process esnasında, ignoreluyoruz.
                }
            );
        } catch (err) {
            console.error(err);
            toast.error("Kamera başlatılamadı.");
            setIsScanning(false);
        }
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
            });
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
                <div className="text-center space-y-6 max-w-xs">
                    <div className="relative mx-auto w-16 h-16">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-500 opacity-20" />
                        <Loader2 className="w-16 h-16 animate-spin text-blue-400 absolute inset-0 [animation-duration:1.5s]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">Sunucuya Bağlanıyor</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Traefik Gateway üzerinden güvenli WebSocket tüneli kuruluyor...
                        </p>
                    </div>
                    <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Handshake Aşamasında
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center p-4 py-10 overflow-y-auto">
            <div className="w-full max-w-md bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-800 space-y-8 flex-shrink-0">

                <div className="text-center space-y-2">
                    <ShieldCheck className="w-16 h-16 mx-auto text-green-500" />
                    <h1 className="text-2xl font-bold text-white tracking-tight">Akıllı Tarayıcı</h1>
                    <p className="text-neutral-400 text-sm">
                        {roomId ? "Cihazınız PC ile eşleşti." : "Eşleşme bekleniyor..."}
                    </p>
                    {isConnected && !roomId && (
                        <p className="text-amber-500 text-xs mt-2">Oda kimliği alınamadı, lütfen QR kodu tekrar okutun.</p>
                    )}
                </div>

                {roomId && (
                    <div className="space-y-6">
                        <div className="relative">
                            <div id="reader" className="w-full aspect-square bg-black rounded-xl overflow-hidden border-2 border-dashed border-neutral-700"></div>
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl">
                                    <Camera className="w-10 h-10 text-white/50 mb-2" />
                                    <p className="text-white/60 text-xs font-medium">Kamera Hazır</p>
                                </div>
                            )}
                        </div>

                        {!isScanning ? (
                            <Button
                                onClick={startScanning}
                                className="w-full h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                <Camera className="w-6 h-6" />
                                Taramayı Başlat
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <Button
                                    onClick={stopScanning}
                                    variant="outline"
                                    className="w-full h-16 text-lg font-semibold rounded-xl flex items-center justify-center gap-3 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                >
                                    <PhoneOff className="w-6 h-6" />
                                    Durdur
                                </Button>
                                <p className="text-[10px] text-center text-neutral-500 animate-pulse">Tarayıcı aktif, barkodu kutucuğa hizalayın...</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-neutral-800 space-y-4">
                            <p className="text-[10px] text-neutral-500 text-center">
                                Kamera açılmazsa manuel giriş yapabilirsiniz (Test için)
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Barkod no..."
                                    id="manual-barcode"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.currentTarget as HTMLInputElement).value;
                                            if (val && socket && roomId) {
                                                socket.emit("barcode_scanned", { roomId, barcode: val });
                                                (e.currentTarget as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    className="bg-neutral-800 hover:bg-neutral-700"
                                    onClick={() => {
                                        const input = document.getElementById('manual-barcode') as HTMLInputElement;
                                        if (input.value && socket && roomId) {
                                            socket.emit("barcode_scanned", { roomId, barcode: input.value });
                                            input.value = "";
                                        }
                                    }}
                                >
                                    Gönder
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-500 text-center px-4">
                            Okutulan barkod saniyeler içinde sepetinize düşecektir.
                        </p>

                        <button
                            onClick={() => window.location.href = '/satis'}
                            className="w-full py-4 text-sm font-semibold text-neutral-400 hover:text-white border border-neutral-800 rounded-2xl transition-all active:scale-95"
                        >
                            Satış Ekranına Dön
                        </button>
                    </div>
                )}
            </div>

            {/* Tarama Geçmişi Section */}
            {history.length > 0 && (
                <div className="w-full max-w-md mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-800 overflow-hidden shadow-xl">
                        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-neutral-300">Tarama Geçmişi (Oturum)</h3>
                            <button
                                onClick={() => setHistory([])}
                                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                            >
                                Temizle
                            </button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-800/50">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => item.status === 'success' && handleReScan(item.barcode)}
                                    className="px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group active:bg-blue-500/10"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${item.status === 'success' ? 'text-neutral-200' : 'text-red-400'}`}>
                                                {item.name}
                                            </span>
                                            {item.status === 'success' && (
                                                <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    Yinele
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-neutral-500">{item.time} {item.barcode && `· ${item.barcode}`}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.status === 'success' ? (
                                            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        ) : (
                                            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-3 bg-white/5 border-t border-neutral-800 text-center">
                            <p className="text-[10px] text-neutral-500 font-medium">
                                Toplam {history.filter(h => h.status === 'success').length} Başarılı Okuma
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
