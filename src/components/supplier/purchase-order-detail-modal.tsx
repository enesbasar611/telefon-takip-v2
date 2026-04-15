"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Printer, CheckCircle2, Clock, Phone, Mail, MapPin, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

export function PurchaseOrderDetailModal({ isOpen, onClose, order }: PurchaseOrderDetailModalProps) {
    if (!order) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-w-full w-full h-full sm:h-auto sm:max-h-[90vh] bg-card border-border p-0 overflow-y-auto sm:rounded-3xl rounded-none" id="print-area">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            size: A4;
                            margin: 15mm;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                            margin: 0;
                            padding: 0;
                        }
                        /* Hide main Page content */
                        body > *:not(#print-area-wrapper) {
                            display: none !important;
                        }
                        #print-area-wrapper {
                            display: flex !important;
                            justify-content: center !important;
                            width: 100% !important;
                        }
                        #print-area {
                            width: 210mm !important;
                            padding: 0 !important;
                            background: white !important;
                            color: black !important;
                            position: static !important;
                            border: none !important;
                            box-shadow: none !important;
                            display: block !important;
                        }
                        .no-print { display: none !important; }
                        
                        /* A4 Table Fixes */
                        .print-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                        }
                        .print-table th, .print-table td {
                            border: 1px solid black !important;
                            padding: 10px !important;
                            color: black !important;
                        }

                        /* Force visibility */
                        body * { visibility: hidden; }
                        #print-area-wrapper, #print-area-wrapper * { visibility: visible !important; }
                    }
                `}} />

                <div id="print-area-wrapper">
                    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 a4-content print:p-0 w-full" id="print-area">
                        <DialogHeader className="flex flex-row items-center justify-between no-print border-b border-border/50 pb-4 sm:pb-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Printer className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="font-medium text-lg sm:text-2xl tracking-tight">Sipariş Detayı</DialogTitle>
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground pt-0.5">Sipariş No: #{order.orderNo}</p>
                                </div>
                            </div>
                            <Button onClick={handlePrint} variant="default" size="sm" className="h-10 px-4 sm:h-12 sm:px-8 rounded-xl sm:rounded-2xl gap-2 sm:gap-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
                                <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">A4 Yazdır</span>
                                <span className="sm:hidden">Yazdır</span>
                            </Button>
                        </DialogHeader>

                        {/* Print Only Header Section */}
                        <div className="hidden print:flex justify-between border-b-2 border-black pb-4 mb-8">
                            <div>
                                <h1 className="font-medium text-3xl tracking-tighter mb-1">SATIN ALMA FORMU</h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                                    <span className=" text-black">NO: #{order.orderNo}</span>
                                    <span>•</span>
                                    <span>{format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="font-medium text-xl uppercase tracking-widest text-blue-600">TAKIPV2</h2>
                                <p className="text-[10px] text-muted-foreground">Inventory Management System</p>
                            </div>
                        </div>

                        {/* Client/Order Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 print:grid-cols-2 print:gap-10">
                            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-border/50 print:p-0 print:border-none">
                                <div className="flex items-center gap-2 mb-3 sm:mb-4 text-blue-400 print:text-black">
                                    <Globe className="h-4 w-4" />
                                    <h4 className="font-medium text-[10px] uppercase tracking-widest">Tedarikçi Bilgileri</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base sm:text-lg text-foreground print:text-xl print:text-black">{order.supplier?.name || "Bilinmeyen Tedarikçi"}</p>
                                    {order.supplier?.phone && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground print:text-black">
                                            <Phone className="h-3 w-3" />
                                            <span>{order.supplier.phone}</span>
                                        </div>
                                    )}
                                    {order.supplier?.email && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground print:text-black">
                                            <Mail className="h-3 w-3" />
                                            <span>{order.supplier.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-border/50 print:p-0 print:border-none">
                                <div className="flex items-center gap-2 mb-3 sm:mb-4 text-purple-400 print:text-black">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <h4 className="font-medium text-[10px] uppercase tracking-widest">Sipariş Durumu</h4>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-muted-foreground print:text-black">Tarih:</span>
                                        <span className="text-xs text-foreground print:text-black">{format(new Date(order.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-muted-foreground print:text-black">Durum:</span>
                                        <Badge className=" bg-blue-500/10 text-blue-400 border-none print:text-black print:bg-transparent px-0 uppercase text-[10px]">
                                            {order.status === "COMPLETED" ? "TAMAMLANDI" : "BEKLEMEDE"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-4 print:mt-10">
                            <div className="flex items-center justify-between no-print">
                                <h3 className="font-medium text-[10px] sm:text-sm text-foreground uppercase tracking-widest">Sipariş İçeriği</h3>
                            </div>

                            {/* Mobile View: Cards */}
                            <div className="sm:hidden space-y-3">
                                {(order.items || []).map((item: any) => (
                                    <div key={item.id} className="p-4 rounded-2xl border border-border/50 bg-white/[0.01] space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground">ID: {item.productId || "MANUEL"}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-border/50 text-emerald-400">
                                                {item.receivedQuantity || 0} / {item.quantity}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase">Birim</p>
                                                <p className="text-xs">₺{(Number(item.buyPrice) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground uppercase">Toplam</p>
                                                <p className="text-xs font-medium text-blue-400">₺{((Number(item.buyPrice) || 0) * (item.receivedQuantity || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop/Print View: Table */}
                            <div className="hidden sm:block rounded-3xl border border-border/50 bg-white/[0.01] overflow-hidden print:rounded-none print:border-none">
                                <table className="w-full text-left print-table">
                                    <thead className="bg-white/[0.04] border-b border-border/50 print:bg-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider print:text-black">Ürün Adı</th>
                                            <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider text-center print:text-black">Talep</th>
                                            <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider text-center print:text-black">Alınan</th>
                                            <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider text-right print:text-black">Birim</th>
                                            <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider text-right print:text-black">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 print:divide-black">
                                        {(order.items || []).map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-foreground print:text-black">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium print:text-black">ID: {item.productId || "MANUEL"}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm text-foreground print:text-black">{item.quantity}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm text-emerald-400 print:text-black">{item.receivedQuantity || 0}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right text-sm print:text-black">
                                                    ₺{(Number(item.buyPrice) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-5 text-right text-sm print:text-black">
                                                    ₺{((Number(item.buyPrice) || 0) * (item.receivedQuantity || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Footer */}
                        <div className="flex flex-col items-end pt-6 border-t border-border/50 print:border-black/20">
                            <div className="w-full sm:w-80 space-y-3">
                                <div className="flex items-center justify-between text-muted-foreground print:text-black">
                                    <span className="text-[10px] uppercase tracking-widest">Ara Toplam</span>
                                    <span className="text-xs sm:text-sm">₺{(Number(order.totalAmount) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground print:text-black">
                                    <span className="text-[10px] uppercase tracking-widest">KDV (%0)</span>
                                    <span className="text-xs sm:text-sm">₺0,00</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-border print:border-black">
                                    <span className="text-xs sm:text-sm uppercase text-foreground print:text-black">Genel Toplam</span>
                                    <span className="text-xl sm:text-3xl text-blue-500 tracking-tighter print:text-black">₺{(Number(order.totalAmount) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden print:flex print:mt-20 print:justify-between px-10">
                            <div className="text-center">
                                <div className="w-40 border-b border-black mb-2"></div>
                                <p className="text-[10px] uppercase">Teslim Eden</p>
                            </div>
                            <div className="text-center">
                                <div className="w-40 border-b border-black mb-2"></div>
                                <p className="text-[10px] uppercase">Teslim Alan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
