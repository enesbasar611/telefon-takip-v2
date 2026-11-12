"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Receipt,
    Users,
    Phone,
    Loader2,
    Calendar,
    ArrowUpRight,
    Wrench,
    ShoppingCart,
    Clock,
    UserCircle,
    FileText
} from "lucide-react";
import { getCustomerById } from "@/lib/actions/customer-actions";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";
import { CustomerHistoryList } from "./customer-history-list";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";

interface CustomerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string | null;
    customerName?: string;
    customerPhone?: string;
}

export function CustomerHistoryModal({
    isOpen,
    onClose,
    customerId,
    customerName,
    customerPhone
}: CustomerHistoryModalProps) {
    const { data: customer, isLoading, error } = useQuery({
        queryKey: ["customer-history-modal", customerId],
        queryFn: () => getCustomerById(customerId!),
        enabled: !!customerId && isOpen,
        staleTime: 1000 * 30, // 30 sec cache
    });

    const { data: rates } = useQuery({
        queryKey: ["rates"],
        queryFn: () => getCurrentExchangeRates(),
        staleTime: 1000 * 60,
    });

    const displayName = customer?.name || customerName || "Müşteri";
    const displayPhone = customer?.phone || customerPhone;

    const ticketsCount = customer?.tickets?.length ?? 0;
    const salesCount = customer?.sales?.length ?? 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[850px] max-h-[90dvh] p-0 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col gap-0 bg-card border border-border/60 shadow-2xl">
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col">
                {/* Header */}
                <DialogHeader className="p-4 sm:p-5 pr-12 bg-muted/30 border-b border-border/50">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-base sm:text-lg font-black text-foreground truncate">
                                        {displayName}
                                    </DialogTitle>
                                    {customer?.isVip && (
                                        <Badge className="bg-blue-500/10 text-blue-500 border-none text-[8px] px-2 py-0.5 rounded-md font-bold">
                                            VIP
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    {displayPhone && (
                                        <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-blue-500" />
                                            {formatPhone(displayPhone)}
                                        </span>
                                    )}
                                    <span>•</span>
                                    <span>İşlem Arşivi & Geriye Dönük Fiş Çıktısı</span>
                                </DialogDescription>
                            </div>
                        </div>

                        {customerId && (
                            <Link href={`/musteriler/${customerId}`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                >
                                    <span>Profili Aç</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Summary Quick Stats */}
                    {customer && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
                            <div className="bg-background/80 rounded-xl px-3 py-1.5 border border-border/40 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Toplam Satış</span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    {salesCount} Adet
                                </span>
                            </div>
                            <div className="bg-background/80 rounded-xl px-3 py-1.5 border border-border/40 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Toplam Servis</span>
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                    {ticketsCount} Adet
                                </span>
                            </div>
                            <div className="bg-background/80 rounded-xl px-3 py-1.5 border border-border/40 flex items-center justify-between col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Kayıt Tarihi</span>
                                <span className="text-[11px] font-bold text-foreground">
                                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("tr-TR") : "—"}
                                </span>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                                Müşterinin işlem arşivi ve fişleri yükleniyor...
                            </p>
                        </div>
                    ) : error || !customer ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <p className="text-sm font-bold text-rose-500">Müşteri işlem verileri alınamadı.</p>
                            <p className="text-xs mt-1">Lütfen bağlantınızı kontrol edip tekrar deneyin.</p>
                        </div>
                    ) : (
                        <CustomerHistoryList
                            customer={customer}
                            rates={rates}
                        />
                    )}
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

