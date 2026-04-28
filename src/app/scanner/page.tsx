"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSocket } from "@/components/providers/socket-provider";
import { toast } from "sonner";
import {
    Loader2, Camera, ShieldCheck, PhoneOff, Search, Trash2, Plus, Minus,
    ShoppingCart, X, User, CreditCard, Banknote, Share2, CheckCircle2,
    History, HelpCircle, PackagePlus, ArrowRightLeft, ScanSearch, ChevronDown, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchProducts, quickUpdateStock } from "@/lib/actions/product-actions";
import { getCustomers } from "@/lib/actions/customer-actions";
import { createSale } from "@/lib/actions/sale-actions";
import { sendWhatsAppAction } from "@/lib/actions/data-management-actions";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScannerHelpModal } from "@/components/scanner/scanner-help-modal";

type ActiveTab = 'scan' | 'search' | 'cart' | 'stock';

export default function MobileScannerPage() {
    const { socket, isConnected } = useSocket();
    const [isPending, startTransition] = useTransition();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Persistent History
    const [history, setHistory] = useState<{ id: string; name: string; barcode: string; time: string; status: 'success' | 'error' }[]>([]);

    const [cart, setCart] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("null");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT_CARD" | "TRANSFER" | "DEBT">("CASH");

    // Search & Stock states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [stockBarcode, setStockBarcode] = useState("");
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockProduct, setStockProduct] = useState<any>(null);

    // UI states
    const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [lastSaleData, setLastSaleData] = useState<any>(null);

    // History Pagination & Search
    const [historyLimit, setHistoryLimit] = useState(5);
    const [historySearch, setHistorySearch] = useState("");

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedBarcode = useRef<string>("");
    const hasAutoStarted = useRef(false);

    const playBeep = (type: 'success' | 'error' = 'success') => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(type === 'success' ? 800 : 300, audioCtx.currentTime);
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

    // Load persisted data
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

        // Load History
        const savedHistory = localStorage.getItem("scanner_history");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("History parse error", e);
            }
        }

        // Fetch customers
        getCustomers().then(setCustomers);
    }, []);

    // Save History whenever it changes
    useEffect(() => {
        localStorage.setItem("scanner_history", JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        if (socket && isConnected && roomId) {
            socket.emit("join_room", roomId);
            socket.emit("mobile_scanner_ready", { roomId });

            socket.on("mobile_feedback", ({ success, message, productName, barcode }: { success: boolean; message?: string; productName?: string; barcode?: string }) => {
                const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                if (success) {
                    toast.success(`Sepete Eklendi: ${productName}`);
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    playBeep('success');

                    const newEntry = {
                        id: Date.now().toString(),
                        name: productName || "Ürün",
                        barcode: barcode || lastScannedBarcode.current || "???",
                        time: now,
                        status: 'success' as const
                    };
                    setHistory(prev => [newEntry, ...prev].slice(0, 100));
                } else {
                    toast.error(`Hata: ${message}`);
                    if (navigator.vibrate) navigator.vibrate([500]);
                    playBeep('error');

                    const newEntry = {
                        id: Date.now().toString(),
                        name: message || "Hata",
                        barcode: barcode || lastScannedBarcode.current || "???",
                        time: now,
                        status: 'error' as const
                    };
                    setHistory(prev => [newEntry, ...prev].slice(0, 100));
                }

                if (activeTab === 'scan') {
                    // Start scanning again after a delay to show toast
                    setTimeout(() => { if (!isScanning) startScanning(); }, 1200);
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

    const updateCartQuantity = (productId: string, delta: number) => {
        if (socket && roomId) {
            socket.emit("update_cart_quantity", { roomId, productId, delta });
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        if (paymentMethod === "DEBT" && selectedCustomerId === "null") {
            toast.error("Veresiye işlem için müşteri seçmelisiniz.");
            return;
        }

        const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

        startTransition(async () => {
            try {
                const result = await createSale({
                    customerId: selectedCustomerId === "null" ? undefined : selectedCustomerId,
                    paymentMethod: paymentMethod,
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.sellPrice
                    })),
                    totalAmount: totalAmount,
                    discountAmount: 0,
                    usedPoints: 0
                });

                if (result.success) {
                    toast.success("Satış tamamlandı!");
                    setLastSaleData(result.data);
                    setIsSuccessModalOpen(true);
                    setCart([]);
                } else {
                    toast.error(result.error || "Hata oluştu.");
                }
            } catch (error) {
                toast.error("İşlem sırasında bir hata oluştu.");
            }
        });
    };

    const handleStockAction = async () => {
        if (!stockBarcode) return;

        startTransition(async () => {
            const res = await quickUpdateStock(stockBarcode, stockQuantity);
            if (res.success) {
                toast.success(`${res.data.name} stoğu güncellendi. Yeni stok: ${res.data.stock}`);
                setStockBarcode("");
                setStockQuantity(1);
                setStockProduct(null);

                const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                setHistory(prev => [{
                    id: Date.now().toString(),
                    name: `Stok +${stockQuantity}: ${res.data.name}`,
                    barcode: stockBarcode,
                    time: now,
                    status: 'success'
                }, ...prev].slice(0, 100));
            } else {
                toast.error(res.error);
                playBeep('error');
            }
        });
    };

    const sendWhatsAppReceipt = async () => {
        if (!lastSaleData) return;
        const customer = lastSaleData.customer;
        if (!customer || !customer.phone) {
            toast.error("Müşteri telefon numarası bulunamadı.");
            return;
        }

        const itemsStr = lastSaleData.items.map((i: any) => `• ${i.product.name} x${i.quantity} (₺${formatCurrency(i.unitPrice * i.quantity)})`).join("\n");
        const message = `SAYIN ${customer.name.toUpperCase()},\n\n🛒 Satış işleminiz tamamlanmıştır.\n\nFatura No: ${lastSaleData.saleNumber}\n\nÜrünler:\n${itemsStr}\n\n🏷️ Toplam: ₺${formatCurrency(lastSaleData.finalAmount)}\n\nBizi tercih ettiğiniz için teşekkür ederiz. 🙏`;

        try {
            const res = await sendWhatsAppAction(customer.phone, message);
            if (res.success) toast.success("WhatsApp gönderildi.");
            else toast.error("Hata: " + res.error);
        } catch (error) {
            toast.error("Sistem hatası.");
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
                    fps: 15,
                    qrbox: (viewWidth, viewHeight) => {
                        return { width: viewWidth * 0.7, height: 100 };
                    },
                    aspectRatio: 1
                },
                (decodedText) => {
                    if (socket && roomId) {
                        scannerRef.current?.stop().then(() => {
                            scannerRef.current = null;
                            setIsScanning(false);
                            playBeep('success');
                            lastScannedBarcode.current = decodedText;

                            // If we are in stock tab, just fill the barcode
                            if (activeTab === 'stock') {
                                setStockBarcode(decodedText);
                                toast.success("Barkod okundu: " + decodedText);
                            } else {
                                socket.emit("barcode_scanned", { roomId, barcode: decodedText });
                            }

                            if (navigator.vibrate) navigator.vibrate(100);
                        });
                    }
                },
                () => { }
            );
        } catch (err) {
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

    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6 tabular-nums">
                <div className="text-center space-y-6 max-w-xs animate-in zoom-in-50 duration-500">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
                        <ShieldCheck className="w-10 h-10 text-blue-500 absolute inset-0 m-auto" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Sunucuya Bağlanıyor</h3>
                        <p className="text-neutral-500 text-sm mt-2 font-medium">Bağlantı güvenli tünel üzerinden kuruluyor...</p>
                    </div>
                </div>
            </div>
        );
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

    const filteredHistory = history.filter(item =>
        item.name.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.barcode.includes(historySearch)
    );

    const visibleHistory = filteredHistory.slice(0, historyLimit);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col text-white tabular-nums selection:bg-blue-500/30 overflow-hidden">
            {/* Header */}
            <div className="bg-neutral-900/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <ScanSearch className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter leading-none italic uppercase">Başar AI</h1>
                        <p className="text-[10px] text-neutral-500 font-black mt-1 uppercase tracking-[0.2em]">Scanner Assistant</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all"
                    >
                        <HelpCircle className="w-6 h-6 text-neutral-400" />
                    </button>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", isConnected ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500")} />
                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{isConnected ? "ONLINE" : "OFFLINE"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-48">
                {/* Tabs - Sticky below header */}
                <div className="sticky top-0 z-[90] bg-neutral-950/80 backdrop-blur-xl px-6 py-4">
                    <div className="flex p-1.5 bg-neutral-900 rounded-[2rem] border border-white/5 gap-1.5 shadow-2xl overflow-x-auto no-scrollbar">
                        {[
                            { id: 'scan', label: 'TARA', icon: Camera },
                            { id: 'search', label: 'ARA', icon: Search },
                            { id: 'stock', label: 'STOK', icon: PackagePlus },
                            { id: 'cart', label: `SEPET`, icon: ShoppingCart, badge: cart.length > 0 ? cart.length : null }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id !== 'scan' && isScanning) stopScanning();
                                    setActiveTab(tab.id as any);
                                }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-4 px-3 rounded-[1.5rem] text-[10px] font-black transition-all whitespace-nowrap relative min-w-[70px]",
                                    activeTab === tab.id ? "bg-white text-black shadow-xl" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className={cn(activeTab === tab.id ? "inline" : "hidden sm:inline")}>{tab.label}</span>
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-neutral-900">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'scan' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
                                <div id="reader" className="w-full aspect-[4/3] bg-black rounded-[3rem] overflow-hidden border-2 border-white/5 shadow-2xl relative">
                                    {isScanning && (
                                        <div className="absolute inset-0 z-10 pointer-events-none border-[40px] border-black/40">
                                            <div className="h-full w-full border-2 border-blue-500/50 rounded-2xl relative overflow-hidden">
                                                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[3rem] z-20">
                                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                            <Camera className="w-10 h-10 text-white/20" />
                                        </div>
                                        <p className="text-white/40 text-sm font-black uppercase tracking-widest">Bakış Açısı Hazır</p>
                                    </div>
                                )}
                            </div>

                            {!isScanning ? (
                                <Button
                                    onClick={startScanning}
                                    className="w-full h-20 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-[2rem] gap-4 shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    <Camera className="w-7 h-7" />
                                    TARAMAYI BAŞLAT
                                </Button>
                            ) : (
                                <Button
                                    onClick={stopScanning}
                                    variant="outline"
                                    className="w-full h-20 text-lg font-black rounded-[2rem] gap-4 bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 transition-all text-red-500"
                                >
                                    <PhoneOff className="w-7 h-7" />
                                    DURDUR
                                </Button>
                            )}

                            <div className="pt-4 space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center">
                                            <History className="w-4 h-4 text-neutral-500" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">İŞLEM GEÇMİŞİ</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm("Tüm geçmiş silinecek, emin misiniz?")) {
                                                setHistory([]);
                                                localStorage.removeItem("scanner_history");
                                                toast.success("Geçmiş temizlendi.");
                                            }
                                        }}
                                        className="text-[10px] text-red-500/60 font-black hover:text-red-500 uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 active:scale-90 transition-all"
                                    >
                                        TEMİZLE
                                    </button>
                                </div>

                                {/* History Search & Pagination */}
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Geçmişte ara..."
                                            className="h-12 pl-12 pr-4 bg-neutral-900 border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-wider placeholder:text-neutral-700 focus:bg-neutral-800 transition-all"
                                            value={historySearch}
                                            onChange={(e) => {
                                                setHistorySearch(e.target.value);
                                                setHistoryLimit(5);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-3 min-h-[100px]">
                                        {visibleHistory.length === 0 ? (
                                            <div className="bg-neutral-900/30 rounded-[2.5rem] border border-dashed border-white/5 p-12 text-center flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center">
                                                    <ArrowRightLeft className="w-8 h-8 text-neutral-800" />
                                                </div>
                                                <p className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest">Sonuç Bulunamadı</p>
                                            </div>
                                        ) : (
                                            visibleHistory.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        if (item.status === 'success') {
                                                            socket?.emit("barcode_scanned", { roomId, barcode: item.barcode });
                                                            toast.info(`${item.name} ekleniyor...`);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "bg-neutral-900/60 border border-white/5 p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden group",
                                                        item.status === 'error' ? "border-red-500/20 bg-red-500/5" : "hover:bg-neutral-800 cursor-pointer"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0 pr-6 relative z-10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[9px] font-black bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md">{item.time}</span>
                                                            <span className="text-[9px] font-black text-neutral-600 truncate max-w-[120px]">{item.barcode}</span>
                                                        </div>
                                                        <h4 className={cn("text-sm font-black truncate group-hover:text-blue-400 transition-colors", item.status === 'success' ? "text-neutral-100" : "text-red-400")}>
                                                            {item.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 relative z-10">
                                                        {item.status === 'success' && (
                                                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-active:bg-blue-600 group-active:text-white transition-all shadow-lg">
                                                                <Plus className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div className={cn("w-1.5 h-10 rounded-full", item.status === 'success' ? "bg-green-500/30" : "bg-red-500/30")} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {filteredHistory.length > historyLimit && (
                                        <button
                                            onClick={() => setHistoryLimit(prev => prev + 5)}
                                            className="w-full py-6 flex flex-col items-center gap-2 group active:scale-95 transition-all text-neutral-600 hover:text-white"
                                        >
                                            <ChevronDown className="w-8 h-8 animate-bounce group-hover:text-blue-500" />
                                            <span className="text-[10px] font-black tracking-[0.3em] uppercase">Daha Fazla Göster ({filteredHistory.length - historyLimit} Ürün Kaldı)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Ürün adı veya barkod..."
                                    className="h-20 pl-14 pr-14 bg-neutral-900 border-white/5 rounded-[2rem] text-base placeholder:text-neutral-700 focus:bg-neutral-800 transition-all font-black"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => handleSearch("")}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                        <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">Veritabanı Sorgulanıyor</p>
                                    </div>
                                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                                    <div className="text-center p-20 bg-neutral-900/50 rounded-[3rem] border border-white/5 border-dashed">
                                        <p className="text-sm text-neutral-500 font-bold italic">Sonuç bulunamadı...</p>
                                    </div>
                                ) : (
                                    searchResults.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="bg-neutral-900 border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-neutral-800"
                                        >
                                            <div className="flex-1 min-w-0 pr-6">
                                                <h4 className="text-base font-black truncate text-neutral-200 uppercase tracking-tighter">
                                                    {product.name}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs font-black text-blue-500">₺{formatCurrency(product.sellPrice)}</span>
                                                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", product.stock <= 5 ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500")}>STOK: {product.stock}</span>
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 group-active:bg-blue-600 transition-all shadow-xl">
                                                <Plus className="w-7 h-7 text-blue-500 group-active:text-white" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 scale-150 rotate-12 opacity-5 pointer-events-none">
                                    <PackagePlus className="w-24 h-24 text-white" />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] pl-2">ÜRÜN BARKODU</label>
                                        <button
                                            onClick={startScanning}
                                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black active:scale-90 transition-all shadow-lg shadow-blue-900/20"
                                        >
                                            <Camera className="w-3.5 h-3.5" /> TARA
                                        </button>
                                    </div>
                                    <Input
                                        placeholder="Okutun veya yazın..."
                                        className="h-16 bg-neutral-950 border-white/5 rounded-2xl text-base font-black px-6 tracking-wider"
                                        value={stockBarcode}
                                        onChange={(e) => setStockBarcode(e.target.value.toUpperCase())}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] pl-2">EKLEME ADEDİ</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 flex items-center bg-neutral-950 rounded-2xl p-1 border border-white/5">
                                            <button onClick={() => setStockQuantity(Math.max(1, stockQuantity - 1))} className="w-14 h-14 rounded-xl flex items-center justify-center hover:bg-neutral-900 transition-colors"><Minus className="w-5 h-5 text-neutral-500" /></button>
                                            <Input
                                                type="number"
                                                className="flex-1 bg-transparent border-none text-center text-xl font-black focus:ring-0"
                                                value={stockQuantity}
                                                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                                            />
                                            <button onClick={() => setStockQuantity(stockQuantity + 1)} className="w-14 h-14 rounded-xl flex items-center justify-center hover:bg-neutral-900 transition-colors"><Plus className="w-5 h-5 text-neutral-500" /></button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    disabled={!stockBarcode || isPending}
                                    onClick={handleStockAction}
                                    className="w-full h-20 bg-white text-black hover:bg-neutral-100 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-30 disabled:bg-neutral-800"
                                >
                                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "STOK GÜNCELLE"}
                                </Button>
                            </div>

                            <div className="px-4 py-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] flex items-start gap-4">
                                <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-amber-500/70 font-medium leading-relaxed uppercase tracking-wider">
                                    Buradan yapılan güncellemeler envanter loglarına <span className="font-black text-amber-500">"Hızlı Stok Girişi"</span> olarak kaydedilir ve stok değeri belirtilen miktar kadar <span className="font-black text-amber-500">artırılır</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cart' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            {/* Standalone POS Controls */}
                            <div className="bg-neutral-900 border border-white/5 p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] pl-2">MÜŞTERİ SEÇİMİ</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                        <select
                                            className="w-full h-16 pl-14 pr-6 bg-neutral-950 border border-white/5 rounded-2xl text-sm font-black appearance-none focus:outline-none focus:border-blue-500 transition-all uppercase tracking-wider shadow-inner"
                                            value={selectedCustomerId}
                                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                                        >
                                            <option value="null">PERAKENDE MÜŞTERİ</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] pl-2">ÖDEME YÖNTEMİ</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'CASH', label: 'NAKİT', icon: Banknote },
                                            { id: 'CREDIT_CARD', label: 'KART', icon: CreditCard },
                                            { id: 'TRANSFER', label: 'HAVALE', icon: Share2 },
                                            { id: 'DEBT', label: 'VERESİYE', icon: Trash2 }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setPaymentMethod(m.id as any)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border transition-all relative overflow-hidden group",
                                                    paymentMethod === m.id
                                                        ? "bg-white border-white text-black shadow-xl scale-[1.03]"
                                                        : "bg-neutral-950 border-white/5 text-neutral-500"
                                                )}
                                            >
                                                <m.icon className={cn("w-6 h-6", paymentMethod === m.id ? "text-black" : "text-neutral-700")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                                                {paymentMethod === m.id && (
                                                    <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 animate-pulse pointer-events-none" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 bg-neutral-900 border border-dashed border-white/5 rounded-[3rem] space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-neutral-950 flex items-center justify-center">
                                        <ShoppingCart className="w-10 h-10 text-neutral-800" />
                                    </div>
                                    <p className="text-[11px] text-neutral-600 font-black uppercase tracking-[0.2em]">Sepetiniz şu an boş</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em]">SEPETTEKİLER</h3>
                                        <span className="text-[11px] font-black text-blue-500">{cart.length} ÜRÜN</span>
                                    </div>
                                    {cart.map((item) => (
                                        <div key={item.id} className="bg-neutral-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-xl active:bg-neutral-800 transition-colors">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[16px] font-black text-neutral-100 truncate tracking-tight uppercase">{item.name}</h4>
                                                    <p className="text-xs text-blue-500 font-black mt-1.5">₺{formatCurrency(item.sellPrice)} <span className="text-white/20 px-1">/</span> <span className="text-neutral-500 text-[10px]">ADET</span></p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 active:bg-red-500 active:text-white transition-all shadow-lg"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between bg-neutral-950/50 p-2 rounded-[2rem] border border-white/5">
                                                <div className="flex items-center bg-black/40 rounded-[1.5rem] p-1 border border-white/5">
                                                    <button onClick={() => updateCartQuantity(item.id, -1)} className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-lg text-neutral-400">－</button>
                                                    <span className="w-12 text-center font-black text-base">{item.quantity}</span>
                                                    <button onClick={() => updateCartQuantity(item.id, 1)} className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-lg text-blue-500">＋</button>
                                                </div>
                                                <div className="px-4 text-right">
                                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-0.5">ARA TOPLAM</span>
                                                    <div className="font-black text-white text-xl tracking-tight">
                                                        ₺{formatCurrency(item.sellPrice * item.quantity)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Final Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-3xl border-t border-white/10 z-[120] animate-in slide-in-from-bottom-full duration-500">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="flex justify-between items-end px-3">
                        <div className="space-y-1">
                            <span className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em]">ÖDENECEK TUTAR</span>
                            <div className="flex items-center gap-3">
                                <span className={cn("text-xs font-black px-3 py-1 rounded-full border", cart.length > 0 ? "bg-blue-600/20 border-blue-600 text-blue-500" : "bg-neutral-900 border-white/5 text-neutral-700")}>
                                    {cart.length} ÜRÜN
                                </span>
                            </div>
                        </div>
                        <span className="text-4xl font-black text-white tracking-tighter">₺{formatCurrency(cartTotal)}</span>
                    </div>
                    {activeTab === 'cart' ? (
                        <Button
                            disabled={cart.length === 0 || isPending}
                            onClick={handleCheckout}
                            className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[2.5rem] shadow-[0_0_40px_rgba(37,99,235,0.2)] active:scale-[0.98] transition-all disabled:opacity-20 text-lg uppercase tracking-[0.1em]"
                        >
                            {isPending ? <Loader2 className="w-8 h-8 animate-spin" /> : "GÜVENLİ SATIŞI TAMAMLA"}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setActiveTab('cart')}
                            className="w-full h-20 bg-white text-black font-black rounded-[2.5rem] active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-sm tracking-widest relative overflow-hidden"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            SEPETE GİT (₺{formatCurrency(cartTotal)})
                            {cart.length > 0 && (
                                <div className="absolute top-0 left-0 h-full bg-blue-500 w-1 animate-pulse" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DialogContent className="max-w-[90vw] sm:max-w-md rounded-[3rem] bg-neutral-900 border-white/5 text-white p-8 overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <DialogHeader>
                        <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-2xl relative">
                            <CheckCircle2 className="w-14 h-14 text-green-500" />
                            <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping opacity-20" />
                        </div>
                        <DialogTitle className="text-center text-3xl font-black uppercase tracking-tighter italic">İşlem Tamam!</DialogTitle>
                        <p className="text-center text-neutral-500 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">REFERANS NO: {lastSaleData?.saleNumber}</p>
                    </DialogHeader>

                    <div className="py-8 space-y-4">
                        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                <span>ÖDEME YÖNTEMİ</span>
                                <span className="bg-neutral-800 text-white px-3 py-1 rounded-md">{paymentMethod}</span>
                            </div>
                            <div className="h-[1px] bg-white/5 w-full" />
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">TAHSİLAT</span>
                                <span className="text-green-500 text-4xl font-black tracking-tighter">₺{formatCurrency(lastSaleData?.finalAmount || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-3 sm:gap-3">
                        {lastSaleData?.customer?.phone && (
                            <Button
                                onClick={sendWhatsAppReceipt}
                                className="w-full h-16 bg-green-600 hover:bg-green-700 rounded-[1.5rem] font-black flex gap-3 text-sm tracking-widest active:scale-95 transition-all shadow-xl shadow-green-900/20"
                            >
                                <Share2 className="w-6 h-6" />
                                WHATSAPP İLE PAYLAŞ
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsSuccessModalOpen(false);
                                window.location.reload();
                            }}
                            className="w-full h-16 rounded-[1.5rem] bg-white/5 border-white/10 hover:bg-white/10 font-black text-sm tracking-widest active:scale-95 transition-all"
                        >
                            YENİ İŞLEM BAŞLAT
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ScannerHelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />

            {/* Custom Animation Styles */}
            <style jsx global>{`
                @keyframes scanLine {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan-line {
                    animation: scanLine 2s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
