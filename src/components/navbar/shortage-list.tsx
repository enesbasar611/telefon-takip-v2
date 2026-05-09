"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  approveShortageItem,
  getCouriers,
  assignShortageToCourier
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
import { useSupplierOrders } from "@/lib/context/supplier-order-context"; import {
  User,
  UserPlus,
  Store,
  Phone,
  ChevronDown as ChevronDownIcon
} from "lucide-react";
import { useShortage } from "@/lib/context/shortage-context";

type Tab = "main" | string; // "main" = Ana Eksik Liste, supplierId = supplier tab

export function ShortageList() {
  const { items = [], loading, addShortage, removeShortage, updateQty: updateShortageQty } = useShortage();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("main");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const { orders, assignProductToSupplier, removeProduct, updateQty: updateSupplierQty, totalItemCount, clearSupplier } = useSupplierOrders();
  const supplierIds = Object.keys(orders);

  const [orderingStatus, setOrderingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [couriers, setCouriers] = useState<any[]>([]);

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

  const fetchSuppliers = useCallback(async () => {
    const [sData, cData] = await Promise.all([getSuppliers(), getCouriers()]);
    setSuppliers(sData);
    setCouriers(cData);
  }, []);

  useEffect(() => {
    fetchSuppliers();

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
  }, [fetchSuppliers]);

  // Refresh suppliers when tab changes to "lists" or "analysis"
  useEffect(() => {
    if (activeTab !== "main") {
      fetchSuppliers();
    }
  }, [activeTab, fetchSuppliers]);

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

  const handleApprove = async (id: string, qty: number) => {
    const res = await approveShortageItem(id, qty);
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
    setAdding(true);
    try {
      await addShortage({
        productId: product.id,
        name: product.name,
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

  const handleQtyChange = async (id: string, qty: string) => {
    const val = parseInt(qty);
    if (isNaN(val)) return;
    await updateShortageQty(id, val);
  };

  const handleAssignToCourier = async (shortageId: string, courierId: string | null) => {
    const res = await assignShortageToCourier(shortageId, courierId);
    if (res.success) {
      toast.success(courierId ? "Kuryeye atandı." : "Atama kaldırıldı.");
      // The context will handle the refresh due to revalidatePath
    } else {
      toast.error(res.error);
    }
  };

  const handleSendToSupplier = async (supplier: any, item: any) => {
    assignProductToSupplier(supplier.id, supplier.name, supplier.phone, { productId: item.productId, name: item.name }, item.quantity);
    await removeShortage(item.id, true);
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


  const safeItems = items || [];
  const totalBadge = safeItems.length + totalItemCount;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-card/40 border border-border/10 text-muted-foreground/80 hover:text-blue-500 transition-all">
            <ClipboardList className={cn("h-5 w-5", totalBadge > 0 && "text-red-600 fill-red-600/10")} />
            {totalBadge > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px]  text-white flex items-center justify-center border-2 border-[#020617] animate-pulse">
                {totalBadge}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 bg-card border-2 border-red-600 p-0 shadow-none animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-border/50 bg-white/[0.01]">
            <button
              onClick={() => setActiveTab("main")}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-[10px]  uppercase tracking-widest transition-all border-b-2",
                activeTab === "main"
                  ? "text-blue-400 border-blue-400 bg-blue-500/5"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Ana Liste
              {items.length > 0 && (
                <span className="ml-1.5 bg-red-600/20 text-red-400 rounded-full px-1.5 py-0.5 text-[8px]">
                  {items.length}
                </span>
              )}
            </button>
            {supplierIds.map((id) => {
              const list = orders[id];
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-3 text-[10px]  uppercase tracking-widest transition-all border-b-2 max-w-[120px] truncate",
                    activeTab === id
                      ? "text-emerald-400 border-emerald-400 bg-emerald-500/5"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                  title={list.supplierName}
                >
                  {list.supplierName.split(" ")[0]}
                  <span className="ml-1 bg-emerald-600/20 text-emerald-400 rounded-full px-1.5 py-0.5 text-[8px]">
                    {list.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab: Main Shortage List */}
          {activeTab === "main" && (
            <div className="p-4 space-y-4">
              <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <UserPlus className="h-3 w-3 text-blue-400" /> Sipariş Veren
                  </p>
                  <div className="flex bg-card/60 p-1 rounded-lg border border-border/50">
                    <button onClick={() => setRequesterType("SHOP")} className={cn("px-2 py-1 text-[9px] font-bold rounded-md transition-all", requesterType === "SHOP" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}>DÜKKAN</button>
                    <button onClick={() => setRequesterType("CUSTOMER")} className={cn("px-2 py-1 text-[9px] font-bold rounded-md transition-all", requesterType === "CUSTOMER" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}>KAYITLI</button>
                    <button onClick={() => setRequesterType("NEW")} className={cn("px-2 py-1 text-[9px] font-bold rounded-md transition-all", requesterType === "NEW" ? "bg-blue-500 text-black" : "text-muted-foreground hover:text-foreground")}>YENİ</button>
                  </div>
                </div>

                {requesterType === "CUSTOMER" && (
                  <div className="relative" ref={customerSearchRef}>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-400">{selectedCustomer.name}</span>
                          <span className="text-[8px] text-muted-foreground">{selectedCustomer.phone || "Telefon Yok"}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} className="h-6 w-6 hover:bg-rose-500 hover:text-black">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          placeholder="Müşteri ara..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onFocus={() => customerSearch.length >= 2 && setShowCustomerResults(true)}
                          className="h-8 text-[10px] bg-card border-border/50 pl-8"
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                        {isSearchingCustomer && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />}
                      </div>
                    )}
                    {showCustomerResults && customerResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                        {customerResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerResults(false); setCustomerSearch(""); }} className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors text-left border-b border-white/[0.03] last:border-0">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-200">{c.name}</span>
                              <span className="text-[9px] text-gray-500">{c.phone}</span>
                            </div>
                            {c.debts?.length > 0 && <Badge className="bg-rose-500/10 text-rose-500 text-[8px] scale-75">BORÇLU</Badge>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {requesterType === "NEW" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="İsim..." value={newRequesterName} onChange={(e) => setNewRequesterName(e.target.value)} className="h-8 text-[10px] bg-card border-border/50" />
                    <Input placeholder="Telefon..." value={newRequesterPhone} onChange={(e) => setNewRequesterPhone(e.target.value)} className="h-8 text-[10px] bg-card border-border/50" />
                  </div>
                )}
              </div>

              <div className="relative" ref={searchRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Eksik ürün yaz..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onFocus={() => newName.length >= 2 && setShowResults(true)}
                      className="h-8 bg-white/[0.03] border-border/50 text-[10px] rounded-lg pl-8"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />}
                  </div>
                  <Button
                    onClick={handleManualAdd}
                    size="icon"
                    disabled={adding || !newName.trim()}
                    className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-black shrink-0 rounded-lg"
                  >
                    <PackagePlus className="h-4 w-4" />
                  </Button>
                </div>
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <button key={p.id} onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(p); }} className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left border-b border-white/[0.03] last:border-0">
                          <div className="flex flex-col">
                            <span className="text-[10px]  text-blue-400">{p.name}</span>
                            <span className="text-[8px] text-gray-500 ">{p.sku || 'SKU YOK'}</span>
                          </div>
                          <span className={cn("text-[10px]  bg-card/50 px-3 py-1 rounded-lg border border-border/50", p.stock <= 0 ? "text-rose-500" : "text-emerald-500")}>
                            {p.stock}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[10px] text-gray-500">Ürün bulunamadı.</div>
                    )}
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); handleManualAdd(); }} className="w-full p-2 bg-blue-500/5 text-blue-400 text-[9px]  hover:bg-blue-500/10 transition-colors">
                      + "{newName}" OLARAK MANUEL EKLE
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-600" /></div>
                ) : items.length === 0 ? (
                  <p className="text-[10px] text-center text-gray-600 py-4">Şu an eksik ürün bulunmuyor.</p>
                ) : (() => {
                  const grouped = items.reduce((acc: any, item: any) => {
                    const key = item.customerId || item.requesterName || "Dükkan";
                    if (!acc[key]) acc[key] = { label: item.customer?.name || item.requesterName || "Dükkan", phone: item.customer?.phone || item.requesterPhone, items: [] };
                    acc[key].items.push(item);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([key, group]: any) => (
                    <div key={key} className="space-y-3 pb-2 border-b border-white/[0.03] last:border-0">
                      <div className="flex items-center gap-2 px-1 sticky top-0 bg-card z-10 py-1">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center border text-white font-black text-[8px] shadow-sm uppercase shrink-0",
                          getDeterministicColor(group.label)
                        )}>
                          {getInitials(group.label)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{group.label}</span>
                          {group.phone && <span className="text-[8px] text-muted-foreground">{group.phone}</span>}
                        </div>
                      </div>

                      <div className="space-y-2 ml-2">
                        {group.items.map((item: any) => (
                          <div key={item.id} className="group relative flex flex-col p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-red-500/20 transition-all gap-3 shadow-sm">
                            {/* Top Action Buttons */}
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-black rounded-lg transition-all" title="Tedarikçiye Gönder">
                                    <UserPlus2 className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent side="left" align="start" className="w-48 p-1 bg-card border-border shadow-2xl">
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    <p className="text-[8px]  text-muted-foreground/80 uppercase px-2 py-1.5 tracking-tighter">Tedarikçi Seç</p>
                                    {suppliers.length === 0 ? (
                                      <p className="px-2 py-2 text-[10px] text-muted-foreground Italics">Tedarikçi bulunamadı</p>
                                    ) : (
                                      suppliers.map(s => (
                                        <button
                                          key={s.id}
                                          onClick={() => handleSendToSupplier(s, item)}
                                          className="w-full text-left px-2 py-1.5 text-[10px]  text-gray-300 hover:bg-blue-500 hover:text-black rounded transition-colors"
                                        >
                                          {s.name}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              <div className="flex items-center gap-1 transition-opacity">
                                <Button onClick={() => handleApprove(item.id, item.quantity || 1)} variant="ghost" size="icon" className="h-7 w-7 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-all" title="Stok Tamamla">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="h-7 w-7 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-black rounded-lg transition-all" title="Kaldır">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 overflow-hidden pr-28">
                              <span className="text-[10px] font-bold text-foreground leading-tight truncate flex-1">{item.name}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px]  text-muted-foreground/80 uppercase">Alınacak</span>
                                <Input type="number" value={item.quantity || ""} onChange={(e) => handleQtyChange(item.id, e.target.value)} className="h-8 bg-card border-border/50 text-[10px] px-2  text-blue-500 focus-visible:ring-blue-500 rounded-lg" />
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <span className="text-[8px]  text-muted-foreground/80 uppercase">Mevcut</span>
                                <div className="h-8 flex items-center justify-end px-3 bg-card/50 rounded-lg border border-border/50 w-full">
                                  <span className={cn("text-[11px] ", (item.product?.stock || 0) <= 0 ? "text-rose-500" : "text-emerald-500")}>{item.product?.stock || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Courier Slot */}
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/[0.03]">
                              <div className="flex items-center gap-2">
                                <Truck className={cn("h-3.5 w-3.5", item.assignedToId ? "text-orange-500" : "text-muted-foreground/30")} />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                  {item.assignedTo ? `${item.assignedTo.name} ${item.assignedTo.surname}` : "ATANMADI"}
                                </span>
                                {item.isTaken && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-1.5 py-0 text-[8px] font-black scale-90">ALINDI</Badge>
                                )}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 rounded-md">
                                    {item.assignedToId ? "DEĞİŞTİR" : "ATA"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="end" className="w-48 p-1 bg-card border-border shadow-2xl">
                                  <div className="space-y-1">
                                    <p className="text-[8px] text-muted-foreground uppercase px-2 py-1 tracking-tighter">Kurye Seç</p>
                                    {couriers.length === 0 ? (
                                      <p className="px-2 py-2 text-[10px] text-muted-foreground Italics">Kurye bulunamadı</p>
                                    ) : (
                                      <>
                                        {couriers.map(c => (
                                          <button
                                            key={c.id}
                                            onClick={() => handleAssignToCourier(item.id, c.id)}
                                            className={cn(
                                              "w-full text-left px-2 py-1.5 text-[10px] rounded transition-colors flex items-center justify-between",
                                              item.assignedToId === c.id ? "bg-orange-500/10 text-orange-400" : "text-gray-300 hover:bg-blue-500 hover:text-black"
                                            )}
                                          >
                                            {c.name} {c.surname}
                                            {item.assignedToId === c.id && <CheckCircle2 className="h-3 w-3" />}
                                          </button>
                                        ))}
                                        {item.assignedToId && (
                                          <>
                                            <Separator className="my-1 bg-white/5" />
                                            <button
                                              onClick={() => handleAssignToCourier(item.id, null)}
                                              className="w-full text-left px-2 py-1.5 text-[10px] text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors"
                                            >
                                              Atamayı Kaldır
                                            </button>
                                          </>
                                        )}
                                      </>
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
                  <Separator className="my-2 bg-white/5" />
                  <Button onClick={() => setShowPrintModal(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-black  text-[10px] h-10 rounded-xl">
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
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-xs  text-emerald-400">{list.supplierName}</h3>
                    <p className="text-[9px] text-muted-foreground font-medium">{list.items.length} ürün · {list.items.reduce((s, i) => s + i.quantity, 0)} adet</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {list.items.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-600 py-4">Bu tedarikçiye ürün eklenmedi.</p>
                  ) : (
                    list.items.map((item, idx) => (
                      <div key={`${item.productId ?? item.name}-${idx}`} className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-emerald-500/20 transition-all">
                        <div className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center shrink-0">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="flex-1 text-[10px]  text-foreground truncate">{item.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateSupplierQty(supplierId, item.productId, item.name, item.quantity - 1)}
                            className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:bg-white/10"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="text-[11px]  text-blue-400 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateSupplierQty(supplierId, item.productId, item.name, item.quantity + 1)}
                            className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:bg-white/10"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeProduct(supplierId, item.productId, item.name)}
                          className="h-5 w-5 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {list.items.length > 0 && (
                  <>
                    <Separator className="my-2 bg-white/5" />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleWhatsAppClick(supplierId)}
                        className="flex-1 bg-[#25D366] hover:bg-[#22c55e] text-white  text-[10px] h-10 rounded-xl gap-2"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span className="truncate">WhatsApp Gönder</span>
                      </Button>
                      <Button
                        onClick={() => handleCreateOrder(supplierId, list.items, list.supplierName)}
                        disabled={orderingStatus[supplierId] !== undefined && orderingStatus[supplierId] !== "idle"}
                        className={cn(
                          "flex-1 text-white  text-[10px] h-10 rounded-xl gap-2 transition-all",
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
                            <ClipboardList className="h-4 w-4 shrink-0" /> <span className="truncate">Sipariş Ver</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </PopoverContent>
      </Popover>

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




