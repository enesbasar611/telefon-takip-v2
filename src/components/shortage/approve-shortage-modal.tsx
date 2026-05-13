import { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    ArrowUpCircle,
    Banknote,
    CheckCircle,
    CreditCard,
    Info,
    Package,
    ShoppingCart,
    Smartphone,
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/lib/context/dashboard-data-context";

type PriceCurrency = "TRY" | "USD" | "EUR";

type Category = {
    id: string;
    name: string;
    parentId?: string | null;
};

type StockPayload = {
    productName: string;
    categoryId: string | null;
    buyPrice: number;
    sellPrice: number;
    priceCurrency: PriceCurrency;
};

interface ApproveShortageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (
        mode: "STOCK" | "SALE" | "DEBT",
        paymentMethod?: "CASH" | "CARD" | "TRANSFER" | "DEBT",
        customPrice?: number,
        currency?: "TL" | "USD" | "EUR",
        stockPayload?: StockPayload,
        quantity?: number
    ) => void;
    itemName: string;
    quantity: number;
    requesterName: string;
    isCustomer: boolean;
    productId?: string;
    product?: any;
    categories?: Category[];
}

const normalizeSearch = (value: string) =>
    value
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i")
        .replace(/İ/g, "i")
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const getCurrencySymbol = (currency: PriceCurrency) => {
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    return "₺";
};

export function ApproveShortageModal({
    open,
    onOpenChange,
    onApprove,
    itemName,
    quantity,
    requesterName,
    isCustomer,
    product,
    categories = []
}: ApproveShortageModalProps) {
    const [step, setStep] = useState<"STOCK" | "CHOICE" | "PRICE" | "PAYMENT">("STOCK");
    const [selectedMode, setSelectedMode] = useState<"SALE" | "DEBT" | null>(null);
    const [salePrice, setSalePrice] = useState<number>(0);
    const [saleCurrency, setSaleCurrency] = useState<"TL" | "USD" | "EUR">("TL");
    const [stockQuantity, setStockQuantity] = useState(quantity || 1);
    const [productName, setProductName] = useState(itemName);
    const [categoryId, setCategoryId] = useState<string>("");
    const [categoryQuery, setCategoryQuery] = useState<string>("");
    const [buyPrice, setBuyPrice] = useState<number>(0);
    const [sellPrice, setSellPrice] = useState<number>(0);
    const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>("TRY");
    const { rates, defaultCurrency } = useDashboardData();

    const categoryPathMap = useMemo(() => {
        const map = new Map<string, Category>();
        categories.forEach((category) => map.set(category.id, category));

        const getPath = (category: Category): string => {
            const parents: string[] = [category.name];
            let current = category.parentId ? map.get(category.parentId) : null;
            while (current) {
                parents.unshift(current.name);
                current = current.parentId ? map.get(current.parentId) : null;
            }
            return parents.join(" > ");
        };

        return new Map(categories.map((category) => [category.id, getPath(category)]));
    }, [categories]);

    const categoryOptions = useMemo(() => {
        const source = normalizeSearch(`${productName} ${itemName}`);
        const query = normalizeSearch(categoryQuery);
        const sourceTokens = new Set(source.split(" ").filter(Boolean));
        const queryTokens = new Set(query.split(" ").filter(Boolean));
        const wantsScreen = /ekran|lcd|oled|display/.test(source);
        const wantsCharging = /sarj|type c|lightning|usb/.test(source) && !wantsScreen;

        return categories
            .map((category) => {
                const path = categoryPathMap.get(category.id) || category.name;
                const normalizedPath = normalizeSearch(path);
                const pathTokens = normalizedPath.split(" ").filter(Boolean);
                let score = category.parentId ? 1 : 0;

                pathTokens.forEach((token) => {
                    if (sourceTokens.has(token)) score += 5;
                    else if (source.includes(token) || token.includes(source)) score += 2;
                    if (queryTokens.has(token)) score += 8;
                    else if (query && (normalizedPath.includes(query) || query.includes(token))) score += 4;
                });

                if (wantsScreen && /ekran|lcd|oled|display/.test(normalizedPath)) score += 25;
                if (wantsScreen && /sarj|type c|lightning|usb/.test(normalizedPath)) score -= 30;
                if (source.includes("iphone") && normalizedPath.includes("iphone")) score += 8;
                if (source.includes("batarya") && /batarya|pil/.test(normalizedPath)) score += 8;
                if (wantsCharging && /sarj|type c|lightning|usb/.test(normalizedPath)) score += 8;

                return { category, path, score };
            })
            .filter((option) => !query || normalizeSearch(option.path).includes(query) || option.score > 0)
            .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path, "tr"))
            .slice(0, 8);
    }, [categories, categoryPathMap, categoryQuery, itemName, productName]);

    const inferredCategoryId = useMemo(() => {
        if (product?.categoryId) return product.categoryId;
        const query = normalizeSearch(itemName);
        if (!query || categories.length === 0) return "";
        const queryTokens = new Set(query.split(" ").filter(Boolean));
        const wantsScreen = /ekran|lcd|oled|display/.test(query);
        const wantsCharging = /sarj|type c|lightning|usb/.test(query) && !wantsScreen;

        const bestMatch = categories.reduce<{ id: string; score: number } | null>((best, category) => {
            const path = normalizeSearch(categoryPathMap.get(category.id) || category.name);
            const categoryTokens = path.split(" ").filter(Boolean);
            let score = 0;
            categoryTokens.forEach((token) => {
                if (queryTokens.has(token)) score += 4;
                else if (query.includes(token) || token.includes(query)) score += 1;
            });
            if (category.parentId) score += 1;
            if (wantsScreen && /ekran|lcd|oled|display/.test(path)) score += 25;
            if (wantsScreen && /sarj|type c|lightning|usb/.test(path)) score -= 30;
            if (query.includes("iphone") && path.includes("iphone")) score += 8;
            if (query.includes("batarya") && /batarya|pil/.test(path)) score += 8;
            if (wantsCharging && /sarj|type c|lightning|usb/.test(path)) score += 8;
            return !best || score > best.score ? { id: category.id, score } : best;
        }, null);

        return bestMatch && bestMatch.score > 0 ? bestMatch.id : "";
    }, [categories, categoryPathMap, itemName, product?.categoryId]);

    const getCurrencyRate = (currency: PriceCurrency) => {
        if (currency === "USD") return rates?.usd || 34;
        if (currency === "EUR") return rates?.eur || 37;
        return 1;
    };

    const convertPrice = (value: number, fromCurrency: PriceCurrency, toCurrency: PriceCurrency) => {
        const tryValue = (Number(value) || 0) * getCurrencyRate(fromCurrency);
        if (toCurrency === "TRY") return Math.ceil(tryValue);
        return Number((tryValue / getCurrencyRate(toCurrency)).toFixed(2));
    };

    const handlePriceCurrencyChange = (nextCurrency: PriceCurrency) => {
        if (nextCurrency === priceCurrency) return;
        setBuyPrice((current) => convertPrice(current, priceCurrency, nextCurrency));
        setSellPrice((current) => convertPrice(current, priceCurrency, nextCurrency));
        setPriceCurrency(nextCurrency);
    };

    const tryEquivalent = (value: number) =>
        priceCurrency === "TRY" ? value : Math.ceil((Number(value) || 0) * getCurrencyRate(priceCurrency));

    useEffect(() => {
        if (!open) return;
        const productCurrency = product?.attributes?.priceCurrency;
        const preferredCurrency = String(defaultCurrency || "TRY");
        const nextCurrency: PriceCurrency =
            productCurrency === "USD" || productCurrency === "EUR" || productCurrency === "TRY"
                ? productCurrency
                : preferredCurrency === "USD" || preferredCurrency === "EUR"
                    ? preferredCurrency
                    : "TRY";
        const buy = nextCurrency === "TRY"
            ? Number(product?.buyPrice || 0)
            : Number(product?.buyPriceUsd || 0);
        const sell = nextCurrency === "TRY"
            ? Number(product?.sellPrice || 0)
            : Number(product?.sellPriceUsd || 0);

        setStep(isCustomer ? "CHOICE" : "STOCK");
        setSelectedMode(null);
        setSalePrice(Number(product?.sellPrice || 0));
        setSaleCurrency("TL");
        setStockQuantity(quantity || 1);
        setProductName(itemName);
        setPriceCurrency(nextCurrency);
        setBuyPrice(buy);
        setSellPrice(sell);
        setCategoryId(inferredCategoryId);
        setCategoryQuery("");
    }, [defaultCurrency, inferredCategoryId, isCustomer, itemName, open, product, quantity]);

    const stockPayload: StockPayload = {
        productName: productName.trim(),
        categoryId: categoryId || null,
        buyPrice,
        sellPrice,
        priceCurrency
    };

    const canSaveStock = Boolean(stockPayload.productName && stockPayload.categoryId && stockQuantity > 0);

    const completeStock = () => {
        if (!canSaveStock) return;
        onApprove("STOCK", "CASH", undefined, "TL", stockPayload, stockQuantity);
        onOpenChange(false);
    };

    const handleChoice = (mode: "STOCK" | "SALE" | "DEBT") => {
        if (mode === "STOCK") {
            setStep("STOCK");
            return;
        }
        setSelectedMode(mode);
        setStep("PRICE");
    };

    const handlePriceConfirm = () => {
        if (selectedMode === "DEBT") {
            onApprove("DEBT", "DEBT", salePrice, saleCurrency, stockPayload, stockQuantity);
            onOpenChange(false);
        } else {
            setStep("PAYMENT");
        }
    };

    const reset = () => {
        setStep(isCustomer ? "CHOICE" : "STOCK");
        setSelectedMode(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) reset(); }}>
            <DialogContent className="sm:max-w-[620px] bg-background border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Stok Onayi</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                                {itemName} - {stockQuantity} adet
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-blue-400">
                            Urun stok kaydina alinacak. Sistem siparis adina gore en uygun kategoriyi secer; gerekirse kategori, adet ve fiyatlari burada degistirebilirsiniz.
                            {isCustomer && step === "CHOICE" && <span className="block mt-1 font-black opacity-80 underline">{requesterName} icin satis veya veresiye islemi de yapabilirsiniz.</span>}
                        </p>
                    </div>

                    {step === "CHOICE" ? (
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { mode: "STOCK", title: "Sadece Stoga Ekle", desc: "Urunu dukkan stok kaydina alir.", icon: Package },
                                { mode: "SALE", title: "Bayiye Satis Olarak Isle", desc: "Stoga ekler ve musteri/bayi satisi olusturur.", icon: ShoppingCart },
                                { mode: "DEBT", title: "Bayiye Veresiye Yaz", desc: "Stoga ekler ve borc kaydi acik kalir.", icon: Wallet },
                            ].map((option) => (
                                <button
                                    key={option.mode}
                                    onClick={() => handleChoice(option.mode as "STOCK" | "SALE" | "DEBT")}
                                    className="group flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-colors">
                                            <option.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tight">{option.title}</h4>
                                            <p className="text-[10px] font-bold text-muted-foreground opacity-60">{option.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : step === "STOCK" ? (
                        <div className="space-y-5 animate-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Urun Adi</Label>
                                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-2xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adet</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={stockQuantity}
                                        onChange={(e) => setStockQuantity(Math.max(1, Number(e.target.value) || 1))}
                                        className="h-12 rounded-2xl font-black"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kategori / Alt Kategori</Label>
                                {categoryId && (
                                    <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2">
                                        <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
                                            {categoryPathMap.get(categoryId) || "Kategori secildi"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCategoryId("");
                                                setCategoryQuery("");
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-700/70 hover:text-blue-900 dark:text-blue-300/70 dark:hover:text-blue-100"
                                        >
                                            Degistir
                                        </button>
                                    </div>
                                )}
                                <Input
                                    value={categoryQuery}
                                    onChange={(e) => {
                                        setCategoryQuery(e.target.value);
                                        setCategoryId("");
                                    }}
                                    placeholder="Kategori yazin... Ornek: iphone ekran"
                                    className="h-12 rounded-2xl font-bold bg-zinc-100 text-zinc-950 placeholder:text-zinc-500 border-zinc-200 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500 dark:border-white/10"
                                />
                                <div className="max-h-44 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                                    {categoryOptions.length > 0 ? (
                                        categoryOptions.map(({ category, path }) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => {
                                                    setCategoryId(category.id);
                                                    setCategoryQuery("");
                                                }}
                                                className={cn(
                                                    "w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors",
                                                    categoryId === category.id
                                                        ? "bg-blue-500 text-white"
                                                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10"
                                                )}
                                            >
                                                {path}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                            Uygun kategori bulunamadi.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-1">
                                {(["TRY", "USD", "EUR"] as PriceCurrency[]).map((currency) => (
                                    <button
                                        key={currency}
                                        type="button"
                                        onClick={() => handlePriceCurrencyChange(currency)}
                                        className={cn(
                                            "h-9 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            priceCurrency === currency
                                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {getCurrencySymbol(currency)} {currency}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alis Fiyati ({priceCurrency})</Label>
                                    <PriceInput value={buyPrice} onChange={setBuyPrice} prefix={getCurrencySymbol(priceCurrency)} className="h-12 rounded-2xl font-black" />
                                    {priceCurrency !== "TRY" && <p className="text-[10px] text-muted-foreground font-bold">TL karsiligi: ₺{tryEquivalent(buyPrice).toLocaleString("tr-TR")}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Satis Fiyati ({priceCurrency})</Label>
                                    <PriceInput value={sellPrice} onChange={setSellPrice} prefix={getCurrencySymbol(priceCurrency)} className="h-12 rounded-2xl font-black" />
                                    {priceCurrency !== "TRY" && <p className="text-[10px] text-muted-foreground font-bold">TL karsiligi: ₺{tryEquivalent(sellPrice).toLocaleString("tr-TR")}</p>}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isCustomer && (
                                    <Button variant="ghost" onClick={() => setStep("CHOICE")} className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest">
                                        Geri
                                    </Button>
                                )}
                                <Button
                                    onClick={completeStock}
                                    disabled={!canSaveStock}
                                    className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                >
                                    Stoga Kaydet
                                </Button>
                            </div>
                        </div>
                    ) : step === "PRICE" ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Birim Satis Fiyati ({saleCurrency})</Label>
                                <div className="flex gap-2">
                                    <PriceInput
                                        value={salePrice}
                                        onChange={setSalePrice}
                                        prefix={saleCurrency === "TL" ? "₺" : saleCurrency === "USD" ? "$" : "€"}
                                        className="h-12 text-lg font-black"
                                    />
                                    <div className="flex bg-zinc-100 dark:bg-white/5 rounded-2xl p-1 border border-zinc-200 dark:border-white/10">
                                        {(["TL", "USD", "EUR"] as const).map((currency) => (
                                            <button
                                                key={currency}
                                                onClick={() => setSaleCurrency(currency)}
                                                className={cn(
                                                    "px-3 rounded-xl text-[10px] font-black transition-all",
                                                    saleCurrency === currency ? "bg-blue-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {currency}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setStep("CHOICE")} className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest">
                                    Vazgec
                                </Button>
                                <Button onClick={handlePriceConfirm} className="flex-[2] h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                    Devam Et
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Odeme Yontemi Secin</h4>
                            {[
                                { id: "CASH", label: "NAKIT", icon: Banknote },
                                { id: "CARD", label: "KREDI KARTI / POS", icon: CreditCard },
                                { id: "TRANSFER", label: "HAVALE / EFT", icon: Smartphone },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => {
                                        onApprove("SALE", method.id as any, salePrice, saleCurrency, stockPayload, stockQuantity);
                                        onOpenChange(false);
                                    }}
                                    className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-transparent hover:border-blue-500/30 transition-all text-left w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                                            <method.icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-tighter">{method.label}</span>
                                    </div>
                                    <CheckCircle className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                            <Button variant="ghost" onClick={() => setStep("PRICE")} className="w-full h-11 text-[10px] font-black uppercase tracking-widest">
                                Geri Don
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
