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
import { searchProducts, quickUpdateStock, getProductByBarcode } from "@/lib/actions/product-actions";
import { getCustomers, createCustomerMuted } from "@/lib/actions/customer-actions";
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
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("scanner_last_tab");
            return (saved as ActiveTab) || 'scan';
        }
        return 'scan';
    });
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [isCheckoutBarVisible, setIsCheckoutBarVisible] = useState(true);
    const [lastSaleData, setLastSaleData] = useState<any>(null);

    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    // History Pagination & Search
    const [historyLimit, setHistoryLimit] = useState(5);
    const [historySearch, setHistorySearch] = useState("");

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedBarcode = useRef<string>("");
    const lastAddRef = useRef<{ id: string; time: number } | null>(null);
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

        // Load Cart
        const savedCart = localStorage.getItem("scanner_cart_backup");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) { }
        }

        // Fetch customers
        getCustomers().then(setCustomers);
    }, []);

    // Persist Tab & Cart
    useEffect(() => {
        localStorage.setItem("scanner_last_tab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem("scanner_cart_backup", JSON.stringify(cart));
    }, [cart]);

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

                    const newEntry: { id: string; name: string; barcode: string; time: string; status: 'success' | 'error' } = {
                        id: Date.now().toString(),
                        name: productName || "Ürün",
                        barcode: barcode || lastScannedBarcode.current || "???",
                        time: now,
                        status: 'success'
                    };
                    setHistory(prev => [newEntry, ...prev].slice(0, 100));
                } else {
                    toast.error(`Hata: ${message}`);
                    if (navigator.vibrate) navigator.vibrate([500]);
                    playBeep('error');

                    const newEntry: { id: string; name: string; barcode: string; time: string; status: 'success' | 'error' } = {
                        id: Date.now().toString(),
                        name: message || "Hata",
                        barcode: barcode || lastScannedBarcode.current || "???",
                        time: now,
                        status: 'error'
                    };
                    setHistory(prev => [newEntry, ...prev].slice(0, 100));
                }

                // If mobile page just loaded or reconnected, PC confirms we are synced
                if (socket && roomId) {
                    socket.emit("mobile_ask_sync", { roomId });
                }

                if (activeTab === 'scan') {
                    // Don't auto-restart if we just added, wait a bit longer
                    setTimeout(() => {
                        if (!isScanning && scannerRef.current === null && activeTab === 'scan') {
                            startScanning();
                        }
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
        if (!product) return;

        // Debounce rapid additions (prevent "1 adds 3" bug)
        const now = Date.now();
        if (lastAddRef.current && lastAddRef.current.id === product.id && now - lastAddRef.current.time < 1000) {
            return;
        }
        lastAddRef.current = { id: product.id, time: now };

        if (socket && roomId) {
            // Vibrate immediately on click
            if (navigator.vibrate) navigator.vibrate(50);

            const posProduct = {
                id: product.id,
                name: product.name,
                sellPrice: product.sellPrice,
                stock: product.stock
            };
            socket.emit("add_to_cart", { roomId, product: posProduct });
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
            // Explicitly cast to number and ensure it's not zero
            const change = Number(delta);
            if (isNaN(change)) return;
            socket.emit("update_cart_quantity", { roomId, productId, delta: change });
        }
    };

    const updateCartPrice = (productId: string, newPrice: number) => {
        if (socket && roomId) {
            socket.emit("update_cart_price", { roomId, productId, newPrice });
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

                // Fetch fresh info immediately
                fetchStockProductInfo(stockBarcode);

                setStockQuantity(1);

                const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const newEntry: { id: string; name: string; barcode: string; time: string; status: 'success' | 'error' } = {
                    id: Date.now().toString(),
                    name: `Stok +${stockQuantity}: ${res.data.name}`,
                    barcode: stockBarcode,
                    time: now,
                    status: 'success'
                };
                setHistory(prev => [newEntry, ...prev].slice(0, 100));
            } else {
                toast.error(res.error);
                playBeep('error');
            }
        });
    };

    const fetchStockProductInfo = async (barcode: string) => {
        if (barcode.length < 3) {
            setStockProduct(null);
            return;
        }
        try {
            const res = await getProductByBarcode(barcode);
            if (res.success) setStockProduct(res.data);
            else setStockProduct(null);
        } catch (e) {
            setStockProduct(null);
        }
    };

    const handleCreateCustomer = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!newCustomer.name || newCustomer.name.length < 2) {
            toast.error("Geçerli bir isim girin.");
            return;
        }
        setIsCreatingCustomer(true);
        try {
            const res = await createCustomerMuted(newCustomer);
            if (res.success && res.customer) {
                toast.success("Müşteri başarıyla eklendi.");
                setCustomers(prev => [res.customer, ...prev]);
                setSelectedCustomerId(res.customer.id);
                setIsNewCustomerModalOpen(false);
                setNewCustomer({ name: '', phone: '' });
            } else {
                toast.error(res.error || "Müşteri eklenemedi.");
            }
        } catch (error) {
            toast.error("Sistem hatası.");
        } finally {
            setIsCreatingCustomer(false);
        }
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

    const startScanning = async (isRetry = false) => {
        if (!roomId || scannerRef.current || isScanning) return;
        try {
            setIsScanning(true);
            scannerRef.current = new Html5Qrcode("reader");
            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 25,
                    qrbox: (viewWidth, viewHeight) => {
                        // Increase scanner area for easier detection
                        const width = Math.min(viewWidth * 0.85, 300);
                        const height = Math.min(viewHeight * 0.45, 180);
                        return { width, height };
                    },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    if (socket && roomId) {
                        // Stop current scan session immediately
                        scannerRef.current?.stop().then(() => {
                            scannerRef.current = null;
                            setIsScanning(false);
                            playBeep('success');
                            lastScannedBarcode.current = decodedText;

                            if (activeTab === 'stock') {
                                setStockBarcode(decodedText);
                                fetchStockProductInfo(decodedText);
                                toast.success("Eşleşme sağlandı");
                            } else {
                                socket.emit("barcode_scanned", { roomId, barcode: decodedText });
                            }

                            if (navigator.vibrate) navigator.vibrate(100);
                        }).catch(() => {
                            scannerRef.current = null;
                            setIsScanning(false);
                        });
                    }
                },
                () => { }
            );
        } catch (err: any) {
            console.error("Camera start error:", err);

            // If it's a common "busy" error, try one more time after a short delay
            if (!isRetry && (err.name === 'NotReadableError' || err.message?.includes('busy'))) {
                scannerRef.current = null;
                setIsScanning(false);
                setTimeout(() => startScanning(true), 500);
                return;
            }

            toast.error("Kamera başlatılamadı. Cihaz meşgul olabilir veya izin gerekebilir.");
            setIsScanning(false);
            scannerRef.current = null;
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            const ref = scannerRef.current;
            scannerRef.current = null; // Prevent race conditions
            setIsScanning(false);
            try {
                await ref.stop();
            } catch (err) {
                console.error("Stop scanning error:", err);
            }
        }
    };

    useEffect(() => {
        if (!roomId || !isConnected) return;

        // Auto-start only for 'scan' tab
        if (activeTab !== 'scan') {
            stopScanning();
            return;
        }

        let isMounting = true;
        const autoStart = async () => {
            if (isMounting) {
                await stopScanning();
                setTimeout(() => {
                    if (isMounting && activeTab === 'scan') startScanning();
                }, 400);
            }
        };

        autoStart();
        return () => {
            isMounting = false;
        };
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
        <div className="h-[100dvh] bg-neutral-950 flex flex-col text-white tabular-nums selection:bg-blue-500/30 overflow-hidden">
            {/* Header */}
            <div className="bg-neutral-900/40 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-[100] px-5 py-3 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <ScanSearch className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-base tracking-tight leading-none">Başar AI</h1>
                        <p className="text-[9px] text-neutral-500 font-bold mt-0.5 uppercase tracking-wider">Barkod Okuyucu</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5 bg-neutral-800/50 px-2.5 py-1 rounded-full border border-white/5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" : "bg-red-500")} />
                            <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">{isConnected ? "SİSTEME BAĞLI" : "BAĞLANTI YOK"}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all text-neutral-400"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-64 custom-scrollbar">
                {/* Tabs - Sticky below header */}
                <div className="sticky top-0 z-[90] bg-neutral-950/80 backdrop-blur-xl px-4 py-3">
                    <div className="flex p-1 bg-neutral-900 rounded-[1.2rem] border border-white/5 gap-1 shadow-xl overflow-x-auto no-scrollbar">
                        {[
                            { id: 'scan', label: 'TARA', icon: Camera },
                            { id: 'search', label: 'ARA', icon: Search },
                            { id: 'cart', label: `SEPET`, icon: ShoppingCart, badge: cart.length > 0 ? cart.length : null },
                            { id: 'stock', label: 'STOK', icon: PackagePlus }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-[0.8rem] text-[9px] font-extrabold transition-all whitespace-nowrap relative min-w-[60px]",
                                    activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span className={cn(activeTab === tab.id ? "inline" : "hidden")}>{tab.label}</span>
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-neutral-900">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* Persistent Reader - Always in DOM for hardware access */}
                    <div className={cn("relative transition-all duration-500", activeTab !== 'scan' && activeTab !== 'stock' ? "h-0 opacity-0 overflow-hidden mb-0" : "mb-8")}>
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
                        {!isScanning && (activeTab === 'scan' || activeTab === 'stock') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-[3rem] z-20">
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                    <Camera className="w-10 h-10 text-white/20" />
                                </div>
                                <p className="text-white/40 text-sm font-black uppercase tracking-widest">Kamera Beklemede</p>
                            </div>
                        )}
                    </div>

                    {activeTab === 'scan' && (
                        !isScanning ? (
                            <Button
                                onClick={() => startScanning()}
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
                        )
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider pl-1 font-sans">ÜRÜN ARA VEYA OKUT</label>
                                        {!isScanning ? (
                                            <button
                                                onClick={() => startScanning()}
                                                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black active:scale-90 transition-all font-sans"
                                            >
                                                <Camera className="w-3.5 h-3.5" /> TARA
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopScanning}
                                                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black active:scale-90 transition-all font-sans"
                                            >
                                                <PhoneOff className="w-3.5 h-3.5" /> DURDUR
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Ürün adı, SKU veya barkod..."
                                            className="h-14 bg-neutral-950 border-white/5 rounded-xl text-sm font-black px-11"
                                            value={stockBarcode}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                setStockBarcode(val);
                                                handleSearch(val);
                                                fetchStockProductInfo(val);
                                            }}
                                        />
                                        {stockBarcode && (
                                            <button
                                                onClick={() => {
                                                    setStockBarcode("");
                                                    setStockProduct(null);
                                                    setSearchResults([]);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Results in Stock Mode */}
                                    {searchResults.length > 0 && !stockProduct && (
                                        <div className="max-h-60 overflow-y-auto space-y-2 py-2 no-scrollbar">
                                            {searchResults.map((p) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setStockProduct(p);
                                                        setStockBarcode(p.barcode || p.sku || p.id);
                                                        setSearchResults([]);
                                                    }}
                                                    className="bg-neutral-800/50 border border-white/5 p-3 rounded-xl flex items-center justify-between active:scale-[0.98] transition-all"
                                                >
                                                    <span className="text-xs font-black truncate flex-1 pr-4">{p.name}</span>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-[9px] text-blue-500 font-bold">STOK: {p.stock}</span>
                                                        <span className="text-[9px] text-neutral-500 italic mt-0.5">{p.barcode || p.sku || 'KOD YOK'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {stockProduct && (
                                        <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl space-y-2 animate-in slide-in-from-top-2 duration-300 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2">
                                                <button onClick={() => { setStockProduct(null); setStockBarcode(""); }} className="p-2 text-neutral-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                                    <PackagePlus className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">{stockProduct.name}</h4>
                                                    <p className="text-[9px] text-neutral-500 font-bold tracking-widest mt-0.5 uppercase">{stockProduct.category?.name || 'GENEL'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-[10px] font-black text-neutral-400">MEVCUT STOK</span>
                                                <span className={cn("text-xl font-black", stockProduct.stock <= 5 ? "text-amber-500" : "text-emerald-500")}>{stockProduct.stock}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">EKLEME ADEDİ</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex items-center bg-neutral-950 rounded-xl p-1 border border-white/5">
                                            <button onClick={() => setStockQuantity(Math.max(1, stockQuantity - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-neutral-900 transition-colors"><Minus className="w-4 h-4 text-neutral-500" /></button>
                                            <Input
                                                type="number"
                                                className="flex-1 bg-transparent border-none text-center text-lg font-black focus:ring-0"
                                                value={stockQuantity}
                                                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                                            />
                                            <button onClick={() => setStockQuantity(stockQuantity + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-neutral-900 transition-colors"><Plus className="w-4 h-4 text-neutral-500" /></button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    disabled={!stockProduct || isPending}
                                    onClick={handleStockAction}
                                    className="w-full h-16 bg-white text-black hover:bg-neutral-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all active:scale-[0.98]"
                                >
                                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "STOK GÜNCELLE"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cart' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            {/* Standalone POS Controls */}
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] space-y-6 shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">MÜŞTERİ SEÇİMİ</label>
                                        <button
                                            onClick={() => setIsNewCustomerModalOpen(true)}
                                            className="text-[9px] font-black text-blue-500 flex items-center gap-1 hover:bg-blue-500/10 px-2 py-1 rounded-full transition-all"
                                        >
                                            <Plus className="w-3 h-3" /> YENİ EKLE
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                        <select
                                            className="w-full h-14 pl-11 pr-6 bg-neutral-950 border border-white/5 rounded-xl text-sm font-black appearance-none"
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

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider pl-1">ÖDEME YÖNTEMİ</label>
                                    <div className="grid grid-cols-2 gap-2">
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
                                                    "flex items-center gap-2.5 p-3.5 rounded-xl border transition-all",
                                                    paymentMethod === m.id
                                                        ? "bg-white border-white text-black"
                                                        : "bg-neutral-950 border-white/5 text-neutral-600"
                                                )}
                                            >
                                                <m.icon className={cn("w-4 h-4", paymentMethod === m.id ? "text-black" : "text-neutral-700")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
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
                                                    <h4 className="text-[16px] font-black text-neutral-100 truncate tracking-tight uppercase leading-tight">{item.name}</h4>
                                                    <div className="text-xs text-blue-500 font-black mt-2 flex items-center gap-1">
                                                        <span className="opacity-60 text-[10px]">₺</span>
                                                        <input
                                                            type="number"
                                                            value={item.sellPrice}
                                                            onChange={(e) => updateCartPrice(item.id, parseFloat(e.target.value) || 0)}
                                                            className="bg-neutral-800/40 border border-white/5 text-blue-500 font-extrabold px-3 py-1 rounded-lg h-9 focus:ring-1 focus:ring-blue-500/50 w-24 outline-none"
                                                        />
                                                        <span className="text-neutral-500 text-[10px] ml-2 block">ADET</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 active:bg-red-500 active:text-white transition-all shadow-lg shrink-0"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between bg-neutral-950/50 p-2 rounded-[2rem] border border-white/5">
                                                <div className="flex items-center bg-black/40 rounded-[1.5rem] p-1 border border-white/5">
                                                    <button onClick={() => updateCartQuantity(item.id, -1)} className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-lg text-neutral-400">－</button>
                                                    <span className="w-12 text-center font-black text-base tabular-nums">{item.quantity}</span>
                                                    <button onClick={() => updateCartQuantity(item.id, 1)} className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-lg text-blue-500">＋</button>
                                                </div>
                                                <div className="px-4 text-right">
                                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-0.5">ARA TOPLAM</span>
                                                    <div className="font-black text-white text-xl tracking-tight tabular-nums">
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

                {/* Bottom Terminal Bar */}
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 p-3 transition-all duration-500 z-[120]",
                    isCheckoutBarVisible ? "translate-y-0" : "translate-y-[calc(100%-80px)]"
                )}>
                    <div className="max-w-md mx-auto bg-neutral-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.2rem] shadow-2xl p-4 overflow-hidden relative">
                        <button onClick={() => setIsCheckoutBarVisible(!isCheckoutBarVisible)} className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10" />

                        <div className="flex justify-between items-center mt-2.5 gap-3">
                            <div className="flex bg-neutral-950/50 px-4 py-3 rounded-2xl border border-white/5 flex-1 items-center justify-between" onClick={() => setIsCheckoutBarVisible(!isCheckoutBarVisible)}>
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">TOPLAM</span>
                                    <span className="text-xl font-black text-white leading-none">₺{formatCurrency(cartTotal)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">ADET</span>
                                    <span className="text-sm font-black text-blue-500 leading-none">{cart.length}</span>
                                </div>
                            </div>

                            {!isCheckoutBarVisible ? (
                                <Button
                                    onClick={(e) => { e.stopPropagation(); if (activeTab !== 'cart') setActiveTab('cart'); setIsCheckoutBarVisible(true); }}
                                    className="h-16 px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                                >
                                    {activeTab === 'cart' ? 'TAMAMLA' : 'SEPETE GİT'}
                                </Button>
                            ) : (
                                <button onClick={() => setIsCheckoutBarVisible(false)} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-neutral-500">
                                    <ChevronDown className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        <div className={cn("mt-5 space-y-4 transition-all duration-500 origin-bottom", isCheckoutBarVisible ? "scale-100 opacity-100 h-auto" : "scale-90 opacity-0 h-0 invisible")}>
                            {activeTab === 'cart' ? (
                                <Button
                                    disabled={cart.length === 0 || isPending}
                                    onClick={handleCheckout}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase"
                                >
                                    {isPending ? <Loader2 className="animate-spin" /> : "SATIŞI ONAYLA"}
                                </Button>
                            ) : (
                                <Button onClick={() => setActiveTab('cart')} className="w-full h-16 bg-white text-black font-black rounded-xl text-xs tracking-widest uppercase">SEPETE GİT</Button>
                            )}
                        </div>
                    </div>
                </div>

                <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                    <DialogContent className="max-w-[90vw] rounded-[3rem] bg-neutral-950 border-white/5 p-8 text-white">
                        <div className="text-center space-y-6">
                            <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-2xl">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">SATIŞ BAŞARILI</h2>
                            <div className="bg-neutral-900 rounded-[2rem] p-8 border border-white/5">
                                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] mb-3">TAHSİLAT TUTARI</p>
                                <span className="text-5xl font-black text-green-500 tracking-tighter">₺{formatCurrency(lastSaleData?.finalAmount || 0)}</span>
                            </div>
                            <Button onClick={() => { setIsSuccessModalOpen(false); window.location.reload(); }} className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-[0.2em]">KAPAT</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isNewCustomerModalOpen} onOpenChange={setIsNewCustomerModalOpen}>
                    <DialogContent className="max-w-[90vw] rounded-[2.5rem] bg-neutral-900 border-white/5 text-white p-8">
                        <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tight">Hızlı Müşteri</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">AD SOYAD</label>
                                <Input placeholder="Müşteri adı..." value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="bg-neutral-950 border-white/5 h-14 text-sm font-black" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">TELEFON</label>
                                <Input placeholder="05XX..." value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="bg-neutral-950 border-white/5 h-14 text-sm font-black" />
                            </div>
                        </div>
                        <Button type="button" onClick={(e) => handleCreateCustomer(e)} disabled={isCreatingCustomer} className="w-full h-16 bg-blue-600 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">
                            {isCreatingCustomer ? <Loader2 className="animate-spin" /> : "KAYDET VE SEÇ"}
                        </Button>
                    </DialogContent>
                </Dialog>

                <ScannerHelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />

                <style jsx global>{`
                @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }
                .animate-scan-line { animation: scanLine 2s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.1) transparent; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; }
            `}</style>
            </div>
        </div>
    );
}
