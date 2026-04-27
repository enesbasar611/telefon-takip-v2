"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import { Loader2, Camera, ShieldCheck, PhoneOff, Search, Trash2, Plus, Minus, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchProducts } from "@/lib/actions/product-actions";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

export default function MobileScannerPage() {
    const { socket, isConnected } = useSocket();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [history, setHistory] = useState<{ id: string; name: string; barcode: string; time: string; status: 'success' | 'error' }[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'scan' | 'search' | 'cart'>('scan');

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedBarcode = useRef<string>("");
    const hasAutoStarted = useRef(false);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
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

        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const isHttps = window.location.protocol === "https:";
        if (!isLocalhost && !isHttps) {
            toast.warning("Kamera uyarısı: HTTP üzerinde kamera çalışmayabilir.");
        }
    }, []);

    useEffect(() => {
        if (socket && isConnected && roomId) {
            socket.emit("join_room", roomId);
            socket.emit("mobile_scanner_ready", { roomId });

            socket.on("mobile_feedback", ({ success, message, productName }: { success: boolean; message?: string; productName?: string }) => {
                const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                if (success) {
                    toast.success(`Sepete Eklendi: ${productName}`);
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
                }

                // Allow scanning again after feedback
                if (activeTab === 'scan') {
                    // Start scanning again after a short delay
                    setTimeout(() => {
                        if (!isScanning) startScanning();
                    }, 1500);
                }
            });

            socket.on("cart_updated", ({ cart }: { cart: any[] }) => {
                setCart(cart);
            });

            return () => {
                socket.off("mobile_feedback");
                socket.off("cart_updated");
            };
        }
    }, [socket, isConnected, roomId, activeTab]);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchProducts(val);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const addToCart = (product: any) => {
        if (socket && roomId) {
            socket.emit("add_to_cart", { roomId, product });
            toast.info(`${product.name} ekleniyor...`);
        }
    };

    const removeFromCart = (productId: string) => {
        if (socket && roomId) {
            socket.emit("remove_from_cart", { roomId, productId });
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        if (socket && roomId) {
            socket.emit("update_cart_quantity", { roomId, productId, delta });
        }
    };

    const handleReScan = (barcode: string) => {
        if (socket && roomId && barcode) {
            playBeep();
            socket.emit("barcode_scanned", { roomId, barcode });
            toast.info("Yeniden gönderiliyor...");
        }
    };

    const startScanning = async () => {
        if (!roomId || scannerRef.current || isScanning) return;

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
                        scannerRef.current?.stop().then(() => {
                            scannerRef.current = null;
                            setIsScanning(false);
                            playBeep();
                            lastScannedBarcode.current = decodedText;
                            socket.emit("barcode_scanned", { roomId, barcode: decodedText });
                            if (navigator.vibrate) navigator.vibrate(100);
                        });
                    }
                },
                () => { }
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
                scannerRef.current = null;
                setIsScanning(false);
            });
        }
    };

    useEffect(() => {
        if (!roomId || !isConnected || hasAutoStarted.current || activeTab !== 'scan') return;
        hasAutoStarted.current = true;
        startScanning();
    }, [roomId, isConnected, activeTab]);

    useEffect(() => {
        return () => {
            scannerRef.current?.stop().catch(() => { });
            scannerRef.current = null;
        };
    }, []);

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6 tabular-nums">
                <div className="text-center space-y-6 max-w-xs">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto" />
                    <h3 className="text-xl font-bold">Bağlanıyor...</h3>
                </div>
            </div>
        );
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col text-white tabular-nums">
            {/* Header */}
            <div className="bg-neutral-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">Smart Scanner</h1>
                        <p className="text-[10px] text-neutral-500 font-medium mt-1 uppercase tracking-wider">Mobile Assistant</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">{isConnected ? "ONLINE" : "OFFLINE"}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-neutral-900 mx-6 mt-6 rounded-2xl border border-white/5 gap-1">
                {[
                    { id: 'scan', label: 'Tara', icon: Camera },
                    { id: 'search', label: 'Ara', icon: Search },
                    { id: 'cart', label: `Sepet (${cart.length})`, icon: ShoppingCart }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.id !== 'scan' && isScanning) stopScanning();
                            setActiveTab(tab.id as any);
                        }}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all",
                            activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-neutral-500 hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto pb-40">
                {activeTab === 'scan' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="relative">
                            <div id="reader" className="w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-dashed border-neutral-800 shadow-2xl"></div>
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-3xl">
                                    <Camera className="w-12 h-12 text-white/30 mb-3" />
                                    <p className="text-white/40 text-sm font-medium">Tarayıcı Hazır</p>
                                </div>
                            )}
                        </div>

                        {!isScanning ? (
                            <Button
                                onClick={startScanning}
                                className="w-full h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-3xl gap-3 shadow-xl shadow-blue-600/20"
                            >
                                <Camera className="w-6 h-6" />
                                Taramayı Başlat
                            </Button>
                        ) : (
                            <Button
                                onClick={stopScanning}
                                variant="outline"
                                className="w-full h-16 text-lg font-bold rounded-3xl gap-3 bg-white/5 border-white/10 hover:bg-white/10"
                            >
                                <PhoneOff className="w-6 h-6" />
                                Durdur
                            </Button>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-2">OTURUM GEÇMİŞİ</h3>
                            <div className="space-y-2">
                                {history.length === 0 ? (
                                    <div className="bg-neutral-900/50 rounded-3xl border border-white/5 p-8 text-center">
                                        <p className="text-xs text-neutral-500">Henüz ürün okutulmadı.</p>
                                    </div>
                                ) : (
                                    history.slice(0, 10).map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => item.status === 'success' && handleReScan(item.barcode)}
                                            className="bg-neutral-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className={cn("text-sm font-semibold truncate", item.status === 'success' ? "text-neutral-200" : "text-red-400")}>
                                                    {item.name}
                                                </h4>
                                                <p className="text-[10px] text-neutral-500 mt-0.5">{item.time} • {item.barcode}</p>
                                            </div>
                                            <div className={cn("w-2 h-2 rounded-full", item.status === 'success' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Ürün adı veya barkod..."
                                className="h-16 pl-12 pr-12 bg-neutral-900 border-white/5 rounded-3xl text-sm focus:bg-neutral-800 transition-all"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearch("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-xs text-neutral-500">Ürünler aranıyor...</p>
                                </div>
                            ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                                <div className="text-center p-12 bg-neutral-900 rounded-3xl border border-white/5">
                                    <p className="text-sm text-neutral-400">Ürün bulunamadı.</p>
                                </div>
                            ) : (
                                searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-neutral-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-neutral-800"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-sm font-semibold truncate text-neutral-200">
                                                {product.name}
                                            </h4>
                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                                ₺{formatCurrency(product.sellPrice)} • Stok: {product.stock}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-active:bg-blue-500 group-active:text-white transition-all">
                                            <Plus className="w-5 h-5 text-blue-500 group-active:text-white" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cart' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-neutral-900 rounded-3xl border border-white/5 space-y-4">
                                <ShoppingCart className="w-12 h-12 text-neutral-700" />
                                <p className="text-sm text-neutral-500">Sepetiniz boş.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.id} className="bg-neutral-900 border border-white/5 p-5 rounded-3xl space-y-4 shadow-xl">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[15px] font-bold text-neutral-100 truncate">{item.name}</h4>
                                                <p className="text-xs text-blue-500 font-semibold mt-1">₺{formatCurrency(item.sellPrice)}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center bg-neutral-950 rounded-2xl p-1 border border-white/5">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-800"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-12 text-center font-bold text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-800"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-right font-black text-blue-400">
                                                ₺{formatCurrency(item.sellPrice * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Info Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-neutral-900 border-t border-white/5 backdrop-blur-xl z-[60]">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">TOPLAM TUTAR</span>
                        <span className="text-2xl font-black text-white">₺{formatCurrency(totalAmount)}</span>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/satis'}
                        className="w-full h-16 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-3xl border border-white/5 shadow-2xl active:scale-[0.98] transition-all"
                    >
                        SATIŞI PC DEN TAMAMLA
                    </Button>
                </div>
            </div>
        </div>
    );
}
