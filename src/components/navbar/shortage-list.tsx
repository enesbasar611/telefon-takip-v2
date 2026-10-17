"use client";

import { useEffect, useState, useRef } from "react";
import {
  ClipboardList,
  CheckCircle2,
  PackagePlus,
  Loader2,
  Printer,
  Trash2,
  Search,
  MessageCircle,
  Package,
  Minus,
  Plus,
  UserPlus2,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  approveShortageItem,
  getCouriers,
  assignShortageToCourier,
  assignShortageToSupplier
} from "@/lib/actions/shortage-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn, getInitials, getDeterministicColor } from "@/lib/utils";
import { StockReceiptModal } from "./stock-receipt-modal";
import { Badge } from "@/components/ui/badge";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  UserPlus,
  Store,
  Phone,
  Eraser,
  RefreshCw,
  ChevronDown as ChevronDownIcon
} from "lucide-react";
import { useShortage } from "@/lib/context/shortage-context";

type Tab = "main" | string; // "main" = Ana Eksik Liste, supplierId = supplier tab

export function ShortageList() {
  const { items = [], loading, refresh, addShortage, removeShortage, updateQty: updateShortageQty, clearShortages, syncZeroStock } = useShortage();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("main");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { orders, assignProductToSupplier, removeProduct, updateQty: updateSupplierQty, totalItemCount, clearSupplier, markSeen } = useSupplierOrders();
  const supplierIds = Object.keys(orders);

  const [orderingStatus, setOrderingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Requester States
  const [requesterType, setRequesterType] = useState<"SHOP" | "CUSTOMER" | "NEW">("SHOP");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newRequesterName, setNewRequesterName] = useState("");
  const [newRequesterPhone, setNewRequesterPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: couriers = [], isLoading: isLoadingCouriers } = useQuery({
    queryKey: ["couriers"],
    queryFn: () => getCouriers(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (customerSearch.length >= 2) {
        setIsSearchingCustomer(true);
        const res = await getCustomersPaginated({ search: customerSearch, limit: 5 });
        setCustomerResults(res.data);
        setIsSearchingCustomer(false);
        setShowCustomerResults(true);
      } else {
        setCustomerResults([]);
        setShowCustomerResults(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (newName.length >= 2) {
        setIsSearching(true);
        const results = await searchProducts(newName);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [newName]);

  const resolveCriticalQuantity = (product: any, requestedQuantity: number) => {
    if (requesterType !== "SHOP" || !product?.id) return requestedQuantity;

    const stock = Number(product.stock ?? 0);
    const criticalStock = Number(product.criticalStock ?? 0);
    if (!criticalStock || stock > criticalStock || stock + requestedQuantity > criticalStock) {
      return requestedQuantity;
    }

    const suggestedQuantity = Math.max(requestedQuantity, criticalStock + 1 - stock);
    const nextStock = stock + requestedQuantity;
    const suggestedStock = stock + suggestedQuantity;
    const useSuggested = confirm(
      `${product.name} için kritik stok seviyesi ${criticalStock}. ${requestedQuantity} adet eklerseniz güncel stok ${nextStock} olacak ve ürün eksik listesinde kalacak.\n\nStoğu ${suggestedStock} yapmak ister misiniz?\n\nTamam: Evet, miktarı ${suggestedQuantity} yap\nİptal: Hayır, yine de gönder`
    );

    return useSuggested ? suggestedQuantity : requestedQuantity;
  };

  const handleApprove = async (id: string, qty: number) => {
    const item = safeItems.find((entry: any) => entry.id === id);
    const finalQty = item?.product ? resolveCriticalQuantity(item.product, qty) : qty;
    const res = await approveShortageItem(id, finalQty);
    if (res.success) {
      await removeShortage(id);
      toast.success("Stok başarıyla güncellendi", { position: "bottom-right" });
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    await removeShortage(id);
    toast.success("Listeden kaldırıldı", { position: "bottom-right" });
  };

  const handleManualAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addShortage({
        name: newName,
        quantity: 1,
        requesterName: requesterType === "NEW" ? newRequesterName : (requesterType === "SHOP" ? "Dükkan" : selectedCustomer?.name),
        requesterPhone: requesterType === "NEW" ? newRequesterPhone : selectedCustomer?.phone,
        customerId: requesterType === "CUSTOMER" ? selectedCustomer?.id : undefined
      });
      setNewName("");
      setShowResults(false);
    } finally {
      setAdding(false);
    }
  };

  const handleSelectProduct = async (product: any) => {
    const finalQty = resolveCriticalQuantity(product, 1);
    setAdding(true);
    try {
      await addShortage({
        productId: product.id,
        name: product.name,
        quantity: finalQty,
        requesterName: requesterType === "NEW" ? newRequesterName : (requesterType === "SHOP" ? "Dükkan" : selectedCustomer?.name),
        requesterPhone: requesterType === "NEW" ? newRequesterPhone : selectedCustomer?.phone,
        customerId: requesterType === "CUSTOMER" ? selectedCustomer?.id : undefined
      });
      setNewName("");
      setShowResults(false);
    } finally {
      setAdding(false);
    }
  };

  const handleQtyChange = async (id: string, qty: string) => {
    const val = parseInt(qty);
    if (isNaN(val)) return;
    await updateShortageQty(id, val);
  };

  const handleAssignToCourier = async (shortageId: string, courierId: string | null) => {
    const res = await assignShortageToCourier(shortageId, courierId);
    if (res.success) {
      toast.success(courierId ? "Kuryeye atandı." : "Atama kaldırıldı.");
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleAssignToSupplier = async (supplier: any, item: any) => {
    assignProductToSupplier(supplier.id, supplier.name, supplier.phone, { productId: item.productId, name: item.name }, item.quantity || 1);
    const res = await assignShortageToSupplier(item.id, supplier.id);
    if (res.success) {
      toast.success(`${item.name} → ${supplier.name} tedarikçisine atandı.`);
      refresh();
    } else {
      toast.error(res.error || "Tedarikçi ataması başarısız.");
    }
  };

  const handleRemoveSupplierAssignment = async (item: any) => {
    if (item.supplierId) {
      removeProduct(item.supplierId, item.productId, item.name, false);
      const res = await assignShortageToSupplier(item.id, null);
      if (res.success) {
        toast.success("Tedarikçi ataması kaldırıldı.");
        refresh();
      } else {
        toast.error(res.error || "Atama kaldırılamadı.");
      }
    }
  };

  const handleWhatsAppClick = (supplierId: string) => {
    const list = orders[supplierId];
    if (!list) return;
    const lines = list.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
    const initialMessage = `*Sipariş Listesi — ${list.supplierName}*\n\n${lines}\n\n_TakipV2 üzerinden gönderildi._`;

    setSelectedSupplier({
      id: supplierId,
      name: list.supplierName,
      phone: list.supplierPhone,
      message: initialMessage
    });
    setWhatsappModalOpen(true);
  };

  const handleCreateOrder = async (supplierId: string, items: any[], supplierName: string) => {
    setOrderingStatus((prev) => ({ ...prev, [supplierId]: "loading" }));
    try {
      const res = await createPurchaseOrderAction({
        supplierId,
        orderNo: `PO-${Date.now()}`,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          buyPrice: 0,
        })),
        totalAmount: 0,
        vatAmount: 0,
        netAmount: 0,
        description: "Eksikler listesinden otomatik oluşturuldu",
      });

      if (res.success) {
        setOrderingStatus((prev) => ({ ...prev, [supplierId]: "success" }));
        toast.success(`${supplierName} siparişi oluşturuldu!`);
        setTimeout(() => {
          setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
          clearSupplier(supplierId);
          setActiveTab("main");
        }, 1500);
      } else {
        toast.error("Sipariş oluşturulamadı.");
        setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
      }
    } catch (err) {
      setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
      toast.error("Beklenmeyen bir hata oluştu.");
    }
  };


  const clearAllFlow = async () => {
    await clearShortages();
    await syncZeroStock();
  };

  const safeItems = items || [];
  const totalBadge = safeItems.length + totalItemCount;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="relative h-10 w-10 rounded-xl bg-card/40 border border-border/10 text-muted-foreground/80 hover:text-blue-500 transition-all">
        <ClipboardList className={cn("h-5 w-5", totalBadge > 0 && "text-red-600 fill-red-600/10")} />
        {totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px]  text-white flex items-center justify-center border-2 border-[#020617] animate-pulse">
            {totalBadge}
          </span>
        )}
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full bg-card border border-border/40 rounded-[2rem] p-0 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="p-3 px-5 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between pr-10">
              <DialogTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" /> Eksik Ürün Listesi
              </DialogTitle>
              {activeTab === "main" && items.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (confirm("Tüm listeyi temizleyip stokta olmayanları otomatik eklemek istediğinize emin misiniz?")) {
                        await clearAllFlow();
                      }
                    }}
                    className="h-8 text-[10px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-slate-950 gap-2"
                  >
                    <Eraser className="h-3 w-3" /> Listeyi Temizle & Yenile
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-border/50 bg-muted/10 px-2 py-1 gap-1">
            <button
              onClick={() => setActiveTab("main")}
              className={cn(
                "flex-shrink-0 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl border flex items-center gap-1.5",
                activeTab === "main"
                  ? "text-blue-500 border-blue-500/30 bg-blue-500/10 shadow-sm"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span>Ana Liste</span>
              {items.length > 0 && (
                <span className="bg-rose-500/20 text-rose-500 rounded-full px-1.5 py-0.2 text-[9px] font-black">
                  {items.length}
                </span>
              )}
            </button>
            {supplierIds.map((id) => {
              const list = orders[id];
              return (
                <button
                  key={id}
                  onClick={() => {
                    markSeen(id);
                    setActiveTab(id);
                  }}
                  className={cn(
                    "flex-shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl border max-w-[160px] truncate flex items-center gap-1.5",
                    activeTab === id
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                  )}
                  title={list.supplierName}
                >
                  {list.hasNewItems && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <span className="truncate">{list.supplierName.split(" ")[0]}</span>
                  <span className={cn("rounded-full px-1.5 py-0.2 text-[9px] font-black", list.hasNewItems ? "bg-emerald-500 text-slate-950" : "bg-emerald-600/20 text-emerald-400")}>
                    {list.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab: Main Shortage List */}
          {activeTab === "main" && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
              {/* Compact Requester Selector */}
              <div className="bg-muted/20 border border-border/40 p-2 sm:p-2.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-blue-400" /> Sipariş Veren
                  </span>
                  <div className="flex bg-background/80 p-0.5 rounded-lg border border-border/40">
                    <button onClick={() => setRequesterType("SHOP")} className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", requesterType === "SHOP" ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>DÜKKAN</button>
                    <button onClick={() => setRequesterType("CUSTOMER")} className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", requesterType === "CUSTOMER" ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>KAYITLI</button>
                    <button onClick={() => setRequesterType("NEW")} className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", requesterType === "NEW" ? "bg-blue-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>YENİ</button>
                  </div>
                </div>

                {requesterType === "CUSTOMER" && (
                  <div className="relative pt-1" ref={customerSearchRef}>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-blue-400">{selectedCustomer.name}</span>
                          <span className="text-[10px] text-muted-foreground">{selectedCustomer.phone || "Telefon Yok"}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} className="h-6 w-6 hover:bg-rose-500 hover:text-white">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          placeholder="Müşteri ara..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onFocus={() => customerSearch.length >= 2 && setShowCustomerResults(true)}
                          className="h-8 text-xs bg-background/80 border-border/50 pl-8"
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        {isSearchingCustomer && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />}
                      </div>
                    )}
                    {showCustomerResults && customerResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                        {customerResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerResults(false); setCustomerSearch(""); }} className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-0">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{c.name}</span>
                              <span className="text-[10px] text-muted-foreground">{c.phone}</span>
                            </div>
                            {c.debts?.length > 0 && <Badge className="bg-rose-500/10 text-rose-500 text-[9px]">BORÇLU</Badge>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {requesterType === "NEW" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Input placeholder="İsim..." value={newRequesterName} onChange={(e) => setNewRequesterName(e.target.value)} className="h-8 text-xs bg-background/80 border-border/50" />
                    <Input placeholder="Telefon..." value={newRequesterPhone} onChange={(e) => setNewRequesterPhone(e.target.value)} className="h-8 text-xs bg-background/80 border-border/50" />
                  </div>
                )}
              </div>

              {/* Add Product Search Bar */}
              <div className="relative" ref={searchRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Eksik ürün adı veya barkod..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onFocus={() => newName.length >= 2 && setShowResults(true)}
                      className="h-9 bg-background/80 border-border/60 text-sm rounded-xl pl-9"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-blue-500" />}
                  </div>
                  <Button
                    onClick={handleManualAdd}
                    size="icon"
                    disabled={adding || !newName.trim()}
                    className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-xl"
                  >
                    <PackagePlus className="h-4 w-4" />
                  </Button>
                </div>
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <button key={p.id} onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(p); }} className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/40 last:border-0">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">{p.sku || 'SKU YOK'}</span>
                          </div>
                          <span className={cn("text-xs font-black px-2.5 py-1 rounded-lg border", p.stock <= 0 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20")}>
                            {p.stock}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-muted-foreground">Ürün bulunamadı.</div>
                    )}
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); handleManualAdd(); }} className="w-full p-2.5 bg-blue-500/10 text-blue-500 text-xs font-bold hover:bg-blue-500/20 transition-colors">
                      + "{newName}" OLARAK MANUEL EKLE
                    </button>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium">Şu an eksik ürün bulunmuyor.</p>
                  </div>
                ) : (() => {
                  const grouped = items.reduce((acc: any, item: any) => {
                    const key = item.customerId || item.requesterName || "Dükkan";
                    if (!acc[key]) acc[key] = { label: item.customer?.name || item.requesterName || "Dükkan", phone: item.customer?.phone || item.requesterPhone, items: [] };
                    acc[key].items.push(item);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([key, group]: any) => (
                    <div key={key} className="space-y-2.5">
                      <div className="flex items-center gap-2 px-1 sticky top-0 bg-card/95 backdrop-blur z-10 py-1">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center border text-white font-black text-[9px] shadow-sm uppercase shrink-0",
                          getDeterministicColor(group.label)
                        )}>
                          {getInitials(group.label)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground uppercase tracking-tight">{group.label}</span>
                          {group.phone && <span className="text-[10px] text-muted-foreground font-medium">({group.phone})</span>}
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            {group.items.length} ürün
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {group.items.map((item: any) => (
                          <div key={item.id} className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border/70 hover:border-border transition-all space-y-3 shadow-sm">
                            {/* Product Header & Delete */}
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-foreground leading-snug break-words">
                                    {item.name}
                                  </span>
                                  {item.isFromReplenishment && (
                                    <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[9px] px-1.5 py-0">Akıllı Stok</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                  <span>Mevcut Stok: <strong className={cn((item.product?.stock ?? 0) <= 0 ? "text-rose-500 font-bold" : "text-emerald-500 font-bold")}>{item.product?.stock ?? 0}</strong></span>
                                  {item.product?.sku && <span className="text-muted-foreground/70">SKU: {item.product.sku}</span>}
                                </div>
                              </div>

                              <Button
                                onClick={() => handleDelete(item.id)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl shrink-0"
                                title="Listeden Kaldır"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Touch-friendly Quantity Adjuster & Quick Complete */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                              <div className="flex items-center bg-muted/40 p-0.5 rounded-xl border border-border/50">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQtyChange(item.id, String(Math.max(1, (item.quantity || 1) - 1)))}
                                  className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground font-black shrink-0 active:scale-95 transition-transform"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>

                                <div className="px-3 min-w-[60px] text-center">
                                  <span className="text-sm font-black text-foreground">
                                    {item.quantity || 1}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground ml-1 font-semibold uppercase">adet</span>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQtyChange(item.id, String((item.quantity || 1) + 1))}
                                  className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground font-black shrink-0 active:scale-95 transition-transform"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <Button
                                onClick={() => handleApprove(item.id, item.quantity || 1)}
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border-emerald-500/30 bg-emerald-500/5 rounded-xl gap-1.5 transition-all"
                                title="Stok Tamamla"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Stok Tamamla</span>
                              </Button>
                            </div>

                            {/* Dedicated Assignment Buttons: Kuryeye Ata & Tedarikçiye Ata */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40">
                              {/* Kuryeye Ata */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "h-9 w-full justify-between px-3 text-xs font-semibold rounded-xl transition-all border",
                                      item.assignedToId
                                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                                        : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/60"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <Truck className={cn("h-4 w-4 shrink-0", item.assignedToId ? "text-orange-500" : "text-muted-foreground")} />
                                      <span className="truncate">
                                        {item.assignedTo ? `${item.assignedTo.name} ${item.assignedTo.surname}` : "Kuryeye Ata"}
                                      </span>
                                    </span>
                                    <Badge variant="outline" className="text-[9px] ml-1 shrink-0 bg-background/50 border-border">
                                      {item.assignedToId ? "Değiştir" : "Ata"}
                                    </Badge>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="start" className="w-56 p-1.5 bg-card border-border shadow-2xl rounded-2xl">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase px-2 py-1 tracking-wider">Kurye Seç</p>
                                    {couriers.length === 0 ? (
                                      <p className="px-2 py-2 text-xs text-muted-foreground italic">Kurye bulunamadı</p>
                                    ) : (
                                      <>
                                        {couriers.map((c: any) => (
                                          <button
                                            key={c.id}
                                            onClick={() => handleAssignToCourier(item.id, c.id)}
                                            className={cn(
                                              "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between",
                                              item.assignedToId === c.id ? "bg-orange-500/10 text-orange-400 font-bold" : "text-foreground hover:bg-muted"
                                            )}
                                          >
                                            <span>{c.name} {c.surname}</span>
                                            {item.assignedToId === c.id && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />}
                                          </button>
                                        ))}
                                        {item.assignedToId && (
                                          <>
                                            <Separator className="my-1 bg-border/50" />
                                            <button
                                              onClick={() => handleAssignToCourier(item.id, null)}
                                              className="w-full text-left px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                                            >
                                              Kurye Atamasını Kaldır
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              {/* Tedarikçiye Ata */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "h-9 w-full justify-between px-3 text-xs font-semibold rounded-xl transition-all border",
                                      item.supplierId
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                        : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/60"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <Store className={cn("h-4 w-4 shrink-0", item.supplierId ? "text-emerald-500" : "text-muted-foreground")} />
                                      <span className="truncate">
                                        {item.supplier?.name || "Tedarikçiye Ata"}
                                      </span>
                                    </span>
                                    <Badge variant="outline" className="text-[9px] ml-1 shrink-0 bg-background/50 border-border">
                                      {item.supplierId ? "Değiştir" : "Ata"}
                                    </Badge>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="end" className="w-56 p-1.5 bg-card border-border shadow-2xl rounded-2xl">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase px-2 py-1 tracking-wider">Tedarikçi Seç</p>
                                    {suppliers.length === 0 ? (
                                      <p className="px-2 py-2 text-xs text-muted-foreground italic">Tedarikçi bulunamadı</p>
                                    ) : (
                                      <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                                        {suppliers.map((s: any) => (
                                          <button
                                            key={s.id}
                                            onClick={() => handleAssignToSupplier(s, item)}
                                            className={cn(
                                              "w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between",
                                              item.supplierId === s.id ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-foreground hover:bg-muted"
                                            )}
                                          >
                                            <span className="truncate">{s.name}</span>
                                            {item.supplierId === s.id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                          </button>
                                        ))}
                                        {item.supplierId && (
                                          <>
                                            <Separator className="my-1 bg-border/50" />
                                            <button
                                              onClick={() => handleRemoveSupplierAssignment(item)}
                                              className="w-full text-left px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                                            >
                                              Tedarikçi Atamasını Kaldır
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {items.length > 0 && (
                <>
                  <Separator className="my-2 bg-border/40" />
                  <Button onClick={() => setShowPrintModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl">
                    <Printer className="h-4 w-4 mr-2" /> LİSTEYİ YAZDIR
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Tab: Supplier Order List */}
          {activeTab !== "main" && orders[activeTab] && (() => {
            const list = orders[activeTab];
            const supplierId = activeTab;
            return (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
                <div className="flex items-center justify-between bg-muted/20 p-3 rounded-2xl border border-border/40">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-500 flex items-center gap-2">
                      <Store className="h-4 w-4" /> {list.supplierName}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {list.items.length} çeşit · {list.items.reduce((s, i) => s + i.quantity, 0)} adet
                    </p>
                  </div>
                  {list.hasNewItems && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] animate-pulse">
                      Yeni Ürün Eklendi
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  {list.items.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-6">Bu tedarikçiye ürün eklenmedi.</p>
                  ) : (
                    list.items.map((item, idx) => (
                      <div key={`${item.productId ?? item.name}-${idx}`} className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-border transition-all">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <span className="flex-1 text-xs font-bold text-foreground truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0 bg-muted/40 p-0.5 rounded-xl border border-border/50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateSupplierQty(supplierId, item.productId, item.name, item.quantity - 1)}
                            className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground font-black active:scale-95 transition-transform"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-black text-foreground min-w-[28px] text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateSupplierQty(supplierId, item.productId, item.name, item.quantity + 1)}
                            className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground font-black active:scale-95 transition-transform"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(supplierId, item.productId, item.name)}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0"
                          title="Kaldır"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {list.items.length > 0 && (
                  <div className="sticky bottom-0 bg-card pt-4 pb-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleWhatsAppClick(supplierId)}
                        className="flex-1 bg-[#25D366] hover:bg-[#22c55e] text-white text-xs font-bold h-10 rounded-xl gap-2"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span className="truncate">WhatsApp Gönder</span>
                      </Button>
                      <Button
                        onClick={() => handleCreateOrder(supplierId, list.items, list.supplierName)}
                        disabled={orderingStatus[supplierId] !== undefined && orderingStatus[supplierId] !== "idle"}
                        className={cn(
                          "flex-1 text-white text-xs font-bold h-10 rounded-xl gap-2 transition-all",
                          orderingStatus[supplierId] === "success"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : "bg-blue-600 hover:bg-blue-500"
                        )}
                      >
                        {orderingStatus[supplierId] === "loading" ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : orderingStatus[supplierId] === "success" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="truncate">Sipariş Verildi</span>
                          </>
                        ) : (
                          <>
                            <ClipboardList className="h-4 w-4 shrink-0" /> <span className="truncate">Sipariş Oluştur</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <StockReceiptModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        items={items}
      />

      {selectedSupplier && (
        <WhatsAppConfirmModal
          isOpen={whatsappModalOpen}
          onClose={() => {
            setWhatsappModalOpen(false);
            setSelectedSupplier(null);
          }}
          phone={selectedSupplier.phone || ""}
          customerName={selectedSupplier.name}
          initialMessage={selectedSupplier.message}
        />
      )}
    </>
  );
}




