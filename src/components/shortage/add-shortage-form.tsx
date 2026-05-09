"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    UserPlus,
    Trash2,
    Loader2,
    PackagePlus,
    Store,
    User,
    Phone,
    CheckCircle2,
    PackageCheck,
    Hash,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Users,
    Minus,
    X,
    PlusCircle
} from "lucide-react";
import { QuickCreateProductModal } from "@/components/product/quick-create-product-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { useShortage } from "@/lib/context/shortage-context";
import { searchProducts } from "@/lib/actions/product-actions";
import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { getCouriers } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";

interface AddShortageFormProps {
    onSuccess?: () => void;
    className?: string;
    categories?: any[];
}

export function AddShortageForm({ onSuccess, className, categories = [] }: AddShortageFormProps) {
    const router = useRouter();
    const { addShortage, addShortageBulk } = useShortage();
    const [newName, setNewName] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState(false);
    const [basket, setBasket] = useState<any[]>([]);
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

    // Courier state
    const [couriers, setCouriers] = useState<any[]>([]);
    const [selectedCourierId, setSelectedCourierId] = useState<string>("");

    // Requester state
    const [requesterType, setRequesterType] = useState<"SHOP" | "CUSTOMER" | "NEW">("SHOP");
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [newRequesterName, setNewRequesterName] = useState("");
    const [newRequesterPhone, setNewRequesterPhone] = useState("");

    const searchRef = useRef<HTMLDivElement>(null);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch couriers on mount
        const fetchCouriers = async () => {
            const data = await getCouriers();
            setCouriers(data);
        };
        fetchCouriers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (newName.length >= 2) {
                setSearching(true);
                const results = await searchProducts(newName);
                setSearchResults(results);
                setShowResults(true);
                setSearching(false);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [newName]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerSearch.length >= 2) {
                const { data: customers } = await getCustomersPaginated({ search: customerSearch, limit: 5 });
                setCustomerResults(customers);
                setShowCustomerResults(true);
            } else {
                setCustomerResults([]);
                setShowCustomerResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearch]);

    const addToBasket = () => {
        if (!selectedProduct && !newName.trim()) {
            toast.error("Lütfen önce bir ürün seçin.");
            return;
        }

        const newItem = {
            productId: selectedProduct?.id,
            name: selectedProduct ? selectedProduct.name : newName,
            quantity: quantity,
            barcode: selectedProduct?.barcode
        };

        setBasket(prev => [...prev, newItem]);

        // Reset product selection but keep kurye/requester
        setNewName("");
        setSelectedProduct(null);
        setQuantity(1);
        setShowResults(false);
        toast.info("Ürün listeye eklendi.");
    };

    const removeFromBasket = (index: number) => {
        setBasket(prev => prev.filter((_, i) => i !== index));
    };

    const handleAssign = async () => {
        // Collect all items to assign: basket + current selection (if any)
        const itemsToAssign: any[] = [...basket];

        if (selectedProduct || newName.trim()) {
            itemsToAssign.push({
                productId: selectedProduct?.id,
                name: selectedProduct ? selectedProduct.name : newName,
                quantity: quantity
            });
        }

        if (itemsToAssign.length === 0) {
            toast.error("Lütfen en az bir ürün ekleyin.");
            return;
        }

        if (!selectedCourierId) {
            toast.error("Lütfen bir kurye seçin.");
            return;
        }

        setAdding(true);
        try {
            const requesterData = {
                requesterName: requesterType === "NEW" ? newRequesterName : (requesterType === "SHOP" ? "Dükkan" : selectedCustomer?.name),
                requesterPhone: requesterType === "NEW" ? newRequesterPhone : selectedCustomer?.phone,
                customerId: requesterType === "CUSTOMER" ? selectedCustomer?.id : undefined,
                assignedToId: selectedCourierId
            };

            const finalItems = itemsToAssign.map(item => ({
                ...item,
                ...requesterData
            }));

            await addShortageBulk(finalItems);

            // Reset
            setNewName("");
            setSelectedProduct(null);
            setQuantity(1);
            setBasket([]);
            setShowResults(false);
            onSuccess?.();
            // toast.success is handled by context
        } catch (err) {
            toast.error("Atama sırasında bir hata oluştu.");
        } finally {
            setAdding(false);
        }
    };

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setNewName(product.name);
        setSearchResults([]); // Clear results immediately
        setShowResults(false);
    };

    const handleRequesterTypeChange = (type: "SHOP" | "CUSTOMER" | "NEW") => {
        if (requesterType === type) return;

        if (basket.length > 0 || selectedProduct) {
            if (!confirm("Sipariş veren tipini değiştirirseniz mevcut sepetiniz silinecektir. Devam etmek istiyor musunuz?")) {
                return;
            }
        }

        setRequesterType(type);
        setBasket([]);
        setSelectedProduct(null);
        setNewName("");
        setSelectedCustomer(null);
        setNewRequesterName("");
        setNewRequesterPhone("");
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-4 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <UserPlus className="h-3 w-3 text-blue-400" /> Sipariş Veren
                    </p>
                    <div className="flex bg-card/60 p-1 rounded-lg border border-border/50">
                        <button
                            type="button"
                            onClick={() => handleRequesterTypeChange("SHOP")}
                            className={cn("px-3 py-1.5 text-[10px] font-black rounded-md transition-all", requesterType === "SHOP" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}
                        >
                            DÜKKAN
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRequesterTypeChange("CUSTOMER")}
                            className={cn("px-3 py-1.5 text-[10px] font-black rounded-md transition-all", requesterType === "CUSTOMER" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}
                        >
                            BAYİ
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRequesterTypeChange("NEW")}
                            className={cn("px-3 py-1.5 text-[10px] font-black rounded-md transition-all", requesterType === "NEW" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}
                        >
                            YENİ
                        </button>
                    </div>
                </div>

                {requesterType === "CUSTOMER" && (
                    <div className="relative" ref={customerSearchRef}>
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in zoom-in-95">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-blue-400">{selectedCustomer.name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">{selectedCustomer.phone || "Telefon Yok"}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} className="h-8 w-8 hover:bg-rose-500 hover:text-black rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                <Input
                                    placeholder="Bayi veya telefon ara..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    className="h-10 bg-card/60 border-border/50 pl-10 text-[11px] font-bold rounded-xl focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        )}
                        {showCustomerResults && customerResults.length > 0 && !selectedCustomer && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-card border-2 border-blue-500/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-50 p-2 backdrop-blur-2xl">
                                {customerResults.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedCustomer(c); setShowCustomerResults(false); }}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-500/10 hover:text-blue-500 rounded-xl transition-all group"
                                    >
                                        <p className="text-sm font-black uppercase tracking-tight">{c.name}</p>
                                        <p className="text-[10px] font-bold opacity-50 group-hover:opacity-100">{c.phone || "Telefon Yok"}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {requesterType === "NEW" && (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                        <Input
                            placeholder="Müşteri Adı..."
                            value={newRequesterName}
                            onChange={(e) => setNewRequesterName(e.target.value)}
                            className="h-10 bg-card/60 border-border/50 text-[11px] font-bold rounded-xl"
                        />
                        <PhoneInput
                            placeholder="Telefon..."
                            value={newRequesterPhone}
                            onChange={(val) => setNewRequesterPhone(val)}
                            className="bg-card/60"
                        />
                    </div>
                )}
            </div>

            {couriers.length === 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl space-y-3 animate-in shake-1 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-red-500 uppercase">Kurye Mevcut Değil!</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 leading-tight">Atama yapabilmek için personel sayfasından kurye rolü vermelisiniz.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push("/personel")}
                        variant="outline"
                        className="w-full bg-red-500 border-none text-black hover:bg-black hover:text-red-500 font-black text-[10px] tracking-widest h-10 rounded-xl flex items-center justify-center gap-2"
                    >
                        PERSONEL YÖNETİMİNE GİT
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl transition-all">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <User className="h-3 w-3 text-emerald-400" /> Kurye Seçimi
                        </span>
                        {selectedCourierId ? (
                            <span className="text-emerald-400 font-bold animate-in fade-in">SEÇİLDİ</span>
                        ) : (
                            <span className="text-red-500 font-bold animate-pulse">LÜTFEN SEÇİN</span>
                        )}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {couriers.map((courier) => (
                            <button
                                key={courier.id}
                                onClick={() => setSelectedCourierId(courier.id)}
                                className={cn(
                                    "px-3 py-3 text-xs font-black rounded-xl border transition-all truncate flex flex-col items-start gap-1 relative overflow-hidden group",
                                    selectedCourierId === courier.id
                                        ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                        : "bg-card/40 border-border/50 text-muted-foreground hover:border-emerald-500/30"
                                )}
                            >
                                <Users className={cn("h-3 w-3 absolute -right-1 -bottom-1 opacity-10 scale-150 transition-transform group-hover:scale-[2]", selectedCourierId === courier.id && "opacity-40")} />
                                <span className="relative z-10">{courier.name}</span>
                                <span className={cn("text-[8px] font-bold opacity-60 uppercase relative z-10", selectedCourierId === courier.id && "opacity-100")}>{courier.surname}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl relative" ref={searchRef}>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
                    <PackagePlus className="h-3 w-3 text-blue-400" /> Ürün ve Miktar
                </p>
                <div className="relative">
                    {selectedProduct ? (
                        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in zoom-in-95 group">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <PackagePlus className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-blue-400 truncate uppercase">{selectedProduct.name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedProduct.barcode || "BARKODSUZ"}</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedProduct(null); setNewName(""); }}
                                className="h-10 w-10 hover:bg-rose-500 hover:text-black rounded-xl shrink-0 ml-2"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="relative group">
                            <Input
                                placeholder="Eklenecek Ürün / Barkod..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="pr-12 h-12 bg-card border border-blue-500/20 text-sm font-black tracking-tight focus-visible:ring-4 focus-visible:ring-blue-500/10 rounded-xl transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {searching ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                ) : (
                                    <Search className="h-4 w-4 text-muted-foreground/30" />
                                )}
                            </div>

                            {showResults && searchResults.length > 0 && !selectedProduct && (
                                <div className="absolute top-full left-0 w-full mt-3 bg-card border-2 border-blue-500/20 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-3xl">
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                        {searchResults.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectProduct(p)}
                                                className="w-full text-left p-5 hover:bg-blue-500/10 group/item transition-all border-b border-white/[0.03] last:border-0"
                                            >
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-base font-black group-hover/item:text-blue-500 uppercase truncate leading-tight dark:text-zinc-100">{p.name}</span>
                                                        <span className="text-[10px] font-black group-hover/item:text-blue-500/70 opacity-50 uppercase tracking-widest">{p.barcode || "BARKODSUZ"}</span>
                                                    </div>
                                                    <Badge className={cn("px-4 py-1.5 rounded-xl font-black text-[10px] shrink-0 shadow-lg", p.stock <= 0 ? "bg-rose-500/20 text-rose-500 group-hover/item:bg-rose-500/30" : "bg-emerald-500/20 text-emerald-500 shadow-emerald-500/10")}>
                                                        {p.stock} STOK
                                                    </Badge>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-3 pt-2">
                    {!selectedProduct && newName.length >= 2 && !searching && searchResults.length === 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsQuickCreateOpen(true)}
                            className="w-full h-10 border-dashed border-blue-500/40 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-black rounded-xl font-black text-[10px] tracking-widest gap-2 animate-in fade-in slide-in-from-top-1"
                        >
                            <PlusCircle className="h-4 w-4" />
                            "{newName}" ÜRÜN LİSTEMDE YOK, YENİ TANIMLA
                        </Button>
                    )}
                    <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-card/60 p-1.5 rounded-xl border border-border/50 h-12 shrink-0">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setQuantity(prev => Math.max(1, prev - 1)); }}
                                className="h-9 w-9 flex items-center justify-center hover:bg-black hover:text-blue-500 rounded-lg transition-all active:scale-90"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center text-sm font-black italic">{quantity}</span>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setQuantity(prev => prev + 1); }}
                                className="h-9 w-9 flex items-center justify-center hover:bg-black hover:text-blue-500 rounded-lg transition-all active:scale-90"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => { e.preventDefault(); addToBasket(); }}
                                disabled={!selectedProduct && !newName.trim()}
                                className="h-12 w-12 rounded-xl bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black shrink-0 transition-all active:scale-90"
                                title="Listeye Ekle"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>

                            <Button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleAssign(); }}
                                disabled={adding || (basket.length === 0 && !selectedProduct && !newName.trim()) || !selectedCourierId}
                                className={cn(
                                    "flex-1 h-12 rounded-xl font-black text-[10px] tracking-tight transition-all active:scale-[0.98] uppercase px-2",
                                    selectedCourierId && (basket.length > 0 || selectedProduct || newName.trim())
                                        ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20"
                                        : "bg-zinc-800 text-zinc-500"
                                )}
                            >
                                {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <span className="flex items-center justify-center gap-1 w-full">
                                        <PackageCheck className="h-4 w-4 shrink-0" />
                                        <span className="truncate">
                                            {basket.length > 0 ? `ATA (${basket.length + (selectedProduct || newName.trim() ? 1 : 0)})` : "ATA"}
                                        </span>
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Basket List UI */}
                    {basket.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 opacity-50 mb-3">
                                <Hash className="h-3 w-3" /> Eklenecek Ürünler
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {basket.map((item, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-white/5 hover:bg-white/10 text-[10px] font-black py-2 pl-3 pr-2 rounded-xl border border-white/5 gap-2 group transition-all"
                                    >
                                        <span className="opacity-50">#{idx + 1}</span>
                                        <span className="uppercase">{item.name}</span>
                                        <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded-md font-bold">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFromBasket(idx)}
                                            className="h-5 w-5 rounded-md hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors ml-1"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <QuickCreateProductModal
                    open={isQuickCreateOpen}
                    onOpenChange={setIsQuickCreateOpen}
                    categories={categories}
                    initialName={newName}
                    onSuccess={(product) => {
                        handleSelectProduct(product);
                        setIsQuickCreateOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
