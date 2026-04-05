"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Printer,
    FileText,
    ArrowLeft,
    Wallet,
    TrendingDown,
    TrendingUp,
    Download,
    X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TedarikciCariEkstreModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
}

export function TedarikciCariEkstreModal({ isOpen, onClose, supplier }: TedarikciCariEkstreModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Give a small delay for the modal to mount and styles to apply before printing
            const timer = setTimeout(() => {
                window.print();
                onClose();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!supplier) return null;
    const transactions = supplier.transactions || [];

    return (
        <div id="print-area-wrapper" className="fixed inset-0 z-[9999] bg-white text-black hidden print:block overflow-visible">
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
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide everything except our print area */
                    body > *:not(#print-area-wrapper) {
                        display: none !important;
                    }
                    #print-area-wrapper {
                        display: block !important;
                        position: relative !important;
                        width: 100% !important;
                        background: white !important;
                    }
                    .ekstre-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .ekstre-table th, .ekstre-table td {
                        border: 1px solid #000 !important;
                        padding: 8px 6px !important;
                        font-size: 10px !important;
                        color: black !important;
                    }
                    .ekstre-table th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                        text-align: left;
                    }
                }
            `}} />

            <div className="p-10 w-full" id="print-area">
                {/* Print Title */}
                <div className="flex flex-col items-center text-center mb-10 border-b-2 border-black pb-6">
                    <h1 className="font-medium text-2xl  uppercase tracking-widest mb-1">CARI HESAP EKSTRESI</h1>
                    <p className="text-xs  text-slate-600">Basım Tarihi: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: tr })}</p>

                    <div className="mt-8 flex justify-between w-full text-left">
                        <div className="flex-1">
                            <h3 className="font-medium text-[10px]  uppercase text-slate-500 mb-1">TEDARİKÇİ BİLGİLERİ</h3>
                            <p className="text-sm  text-black">{supplier.name}</p>
                            <p className="text-xs font-medium text-slate-800">{supplier.phone || "-"}</p>
                            <p className="text-xs font-medium text-slate-800 max-w-[300px]">{supplier.address || "-"}</p>
                        </div>
                        <div className="text-right flex-1">
                            <h3 className="font-medium text-[10px]  uppercase text-slate-500 mb-1">HESAP ÖZETİ</h3>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-800">Toplam Shopping: ₺{Number(supplier.totalShopping || 0).toLocaleString("tr-TR")}</p>
                                <p className="text-sm  text-black">Güncel Bakiye: ₺{Number(supplier.balance).toLocaleString("tr-TR")}</p>
                                <p className="text-[10px]  text-rose-600 uppercase">
                                    {Number(supplier.balance) > 0 ? "TEDARİKÇİYE BORÇLUYUZ" : Number(supplier.balance) < 0 ? "TEDARİKÇİDEN ALACAKLIYIZ" : "HESAP KAPALI"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <table className="ekstre-table">
                    <thead>
                        <tr>
                            <th>TARİH</th>
                            <th>İŞLEM TİPİ</th>
                            <th>AÇIKLAMA</th>
                            <th className="text-right">ESKİ BAKİYE</th>
                            <th className="text-right">TUTAR</th>
                            <th className="text-right">YENİ BAKİYE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let cumulativeBalance = 0;
                            const sorted = [...(supplier.transactions || [])].sort((a, b) =>
                                new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
                            );

                            const rows = sorted.map((t: any) => {
                                const prevBalance = cumulativeBalance;
                                const amount = Number(t.amount);
                                if (t.type === "INCOME") cumulativeBalance += amount;
                                else cumulativeBalance -= amount;
                                const currentBalance = cumulativeBalance;

                                return (
                                    <tr key={t.id}>
                                        <td>{format(new Date(t.date || t.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</td>
                                        <td>{t.type === "INCOME" ? "BORÇ ALIM" : "BORÇ ÖDEME"}</td>
                                        <td>{t.description}</td>
                                        <td className="text-right">₺{prevBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                                        <td className="text-right">
                                            {t.type === "INCOME" ? "+" : "-"} ₺{amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-right ">₺{currentBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                );
                            });
                            return rows.reverse();
                        })()}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="grid grid-cols-2 gap-20 mt-20 px-10">
                    <div className="text-center">
                        <div className="w-full border-b border-black mb-2"></div>
                        <p className="text-[10px]  uppercase">TESLİM EDEN</p>
                    </div>
                    <div className="text-center">
                        <div className="w-full border-b border-black mb-2"></div>
                        <p className="text-[10px]  uppercase">TESLİM ALAN</p>
                    </div>
                </div>
            </div>
        </div>
    );
}





