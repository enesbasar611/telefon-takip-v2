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
            <DialogContent className="max-w-4xl bg-card border-white/10 p-0 overflow-hidden rounded-3xl" id="print-area">
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
                    <div className="p-8 space-y-8 a4-content print:p-0 w-full" id="print-area">
                        <DialogHeader className="flex flex-row items-center justify-between no-print border-b border-white/5 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Printer className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <DialogTitle className="font-medium text-2xl  tracking-tight">Sipariş Detayı / Fiş</DialogTitle>
                                    <p className="text-xs font-medium text-muted-foreground pt-1">Sipariş No: #{order.orderNo}</p>
                                </div>
                            </div>
                            <Button onClick={handlePrint} variant="default" size="lg" className="h-12 px-8 rounded-2xl gap-3  bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
                                <Printer className="h-5 w-5" />
                                <span>A4 Yazdır</span>
                            </Button>
                        </DialogHeader>

                        {/* Print Only Header Section */}
                        <div className="hidden print:flex justify-between border-b-2 border-black pb-4 mb-8">
                            <div>
                                <h1 className="font-medium text-3xl  tracking-tighter mb-1">SATIN ALMA FORMU</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className=" text-black">NO: #{order.orderNo}</span>
                                    <span>•</span>
                                    <span>{format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="font-medium text-xl  uppercase tracking-widest text-blue-600">TAKIPV2</h2>
                                <p className="text-[10px]  text-slate-400">Inventory Management System</p>
                            </div>
                        </div>

                        {/* Client/Order Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-10">
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 print:p-0 print:border-none">
                                <div className="flex items-center gap-2 mb-4 text-blue-400 print:text-black">
                                    <Globe className="h-4 w-4" />
                                    <h4 className="font-medium text-[10px]  uppercase tracking-widest">Tedarikçi Bilgileri</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg  text-foreground print:text-xl print:text-black">{order.supplier?.name || "Bilinmeyen Tedarikçi"}</p>
                                    {order.supplier?.phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-black">
                                            <Phone className="h-3 w-3" />
                                            <span>{order.supplier.phone}</span>
                                        </div>
                                    )}
                                    {order.supplier?.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-black">
                                            <Mail className="h-3 w-3" />
                                            <span>{order.supplier.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 print:p-0 print:border-none">
                                <div className="flex items-center gap-2 mb-4 text-purple-400 print:text-black">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <h4 className="font-medium text-[10px]  uppercase tracking-widest">Sipariş Durumu</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs  text-muted-foreground print:text-black text-[10px] uppercase">Tarih:</span>
                                        <span className="text-xs  text-foreground print:text-black">{format(new Date(order.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs  text-muted-foreground print:text-black text-[10px] uppercase">Durum:</span>
                                        <Badge className=" bg-blue-500/10 text-blue-400 border-none print:text-black print:bg-transparent px-0 uppercase">
                                            {order.status === "COMPLETED" ? "TAMAMLANDI" : "BEKLEMEDE"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="space-y-4 print:mt-10">
                            <div className="flex items-center justify-between no-print">
                                <h3 className="font-medium text-sm  text-foreground uppercase tracking-widest">Sipariş İçeriği</h3>
                            </div>
                            <div className="rounded-3xl border border-white/5 bg-white/[0.01] overflow-hidden print:rounded-none print:border-none">
                                <table className="w-full text-left print-table">
                                    <thead className="bg-white/[0.04] border-b border-white/5 print:bg-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-wider print:text-black">Ürün Adı</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-wider text-center print:text-black">Talep</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-wider text-center print:text-black">Alınan</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-wider text-right print:text-black">Birim</th>
                                            <th className="px-6 py-4 text-[10px]  text-muted-foreground uppercase tracking-wider text-right print:text-black">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 print:divide-black">
                                        {(order.items || []).map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-5">
                                                    <p className="text-sm  text-foreground print:text-black">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium print:text-black">ID: {item.productId || "MANUEL"}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm  text-foreground print:text-black">{item.quantity}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm  text-emerald-400 print:text-black">{item.receivedQuantity || 0}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right  text-sm print:text-black">
                                                    ₺{(Number(item.buyPrice) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-5 text-right  text-sm print:text-black">
                                                    ₺{((Number(item.buyPrice) || 0) * (item.receivedQuantity || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Footer */}
                        <div className="flex flex-col items-end pt-6 border-t border-white/5 print:border-black/20">
                            <div className="w-80 space-y-3">
                                <div className="flex items-center justify-between text-muted-foreground print:text-black">
                                    <span className="text-xs  uppercase tracking-widest">Ara Toplam</span>
                                    <span className="text-sm ">₺{(Number(order.totalAmount) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground print:text-black">
                                    <span className="text-xs  uppercase tracking-widest">KDV (%0)</span>
                                    <span className="text-sm ">₺0,00</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-white/10 print:border-black">
                                    <span className="text-sm  uppercase text-foreground print:text-black">Genel Toplam</span>
                                    <span className="text-3xl  text-blue-500 tracking-tighter print:text-black">₺{(Number(order.totalAmount) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden print:flex print:mt-20 print:justify-between px-10">
                            <div className="text-center">
                                <div className="w-40 border-b border-black mb-2"></div>
                                <p className="text-[10px]  uppercase">Teslim Eden</p>
                            </div>
                            <div className="text-center">
                                <div className="w-40 border-b border-black mb-2"></div>
                                <p className="text-[10px]  uppercase">Teslim Alan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}








