"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    User,
    Printer,
    Loader2,
    ArrowLeftRight,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { UnifiedOperation } from "@/lib/actions/activity-actions";

interface SalesHistoryRowProps {
    op: UnifiedOperation;
    isExpanded: boolean;
    onToggleExpand: () => void;
    getTypeLabel: (type: any) => string;
    getTypeColor: (type: any) => string;
    getPaymentIcon: (method: string) => React.ReactNode;
    getPaymentLabel: (method: string) => string;
    translateLabel: (text: string | null | undefined) => string;
    handlePrintReceipt: (op: UnifiedOperation) => void;
    handleReturn: (op: UnifiedOperation, item: any) => void;
    receiptLoading: string | null;
    rates?: any;
    defaultCurrency?: string;
}

export function SalesHistoryRow({
    op,
    isExpanded,
    onToggleExpand,
    getTypeLabel,
    getTypeColor,
    getPaymentIcon,
    getPaymentLabel,
    translateLabel,
    handlePrintReceipt,
    handleReturn,
    receiptLoading,
    rates,
    defaultCurrency = "TRY"
}: SalesHistoryRowProps) {
    const getDisplayAmount = () => {
        let amount = op.amount;
        let currency = op.currency;

        if (defaultCurrency !== currency && rates) {
            if (currency === "TRY" && defaultCurrency === "USD") {
                amount = amount / (rates.usd || 34.5);
            } else if (currency === "USD" && defaultCurrency === "TRY") {
                amount = amount * (rates.usd || 34.5);
            }
            currency = defaultCurrency;
        }

        return {
            amount,
            symbol: currency === "USD" ? "$" : "₺"
        };
    };

    const { amount: displayAmount, symbol: displaySymbol } = getDisplayAmount();
    const isIncome = op.transactionType === 'INCOME';
    return (
        <tr
            className={cn(
                "group hover:bg-muted/10 transition-all duration-300 cursor-pointer border-b border-border/30",
                isExpanded && "bg-muted/5 shadow-inner"
            )}
            onClick={onToggleExpand}
        >
            <td className="px-6 py-0.5">
                <Badge variant="outline" className={cn("text-[10px] font-black px-1.5 py-0 rounded-md border-2", getTypeColor(op.type))}>
                    {getTypeLabel(op.type)}
                </Badge>
            </td>
            <td className="px-6 py-1">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[16px] font-bold leading-tight">{format(new Date(op.date), "dd MMMM yyyy", { locale: tr })}</span>
                    <span className="text-[13px] text-muted-foreground font-black opacity-70 tracking-tight">{format(new Date(op.date), "HH:mm")}</span>
                </div>
            </td>
            <td className="px-6 py-0.5">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-[16px] font-black tracking-tight">{op.customerName}</span>
                </div>
            </td>
            <td className="px-6 py-1">
                <div className="flex flex-col gap-1.5 max-w-md">
                    {op.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {op.items.slice(0, 3).map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[14px] px-2 py-0.5 h-auto rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-muted-foreground border-none font-bold tracking-tight">
                                    {item.quantity}x {item.name}
                                </Badge>
                            ))}
                            {op.items.length > 3 && (
                                <span className="text-[13px] text-muted-foreground font-black">+{op.items.length - 3} SKU daha</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[14px] text-muted-foreground line-clamp-1 italic font-medium">"{op.description}"</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-0.5 text-right">
                <div className="flex flex-col items-end">
                    <span className={cn(
                        "text-[20px] font-black tracking-tighter",
                        isIncome ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {isIncome ? "+" : "-"}{displaySymbol}{displayAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 opacity-70">
                        <span className="text-[13px] uppercase tracking-wider font-bold text-muted-foreground">
                            {op.accountName ? translateLabel(op.accountName) : getPaymentLabel(op.paymentMethod)}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-0.5 text-right">
                <div className="flex items-center justify-end gap-1">
                    {op.type === 'SALE' && (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Fiş Yazdır"
                            disabled={!!receiptLoading && receiptLoading === op.id}
                            className="h-10 w-10 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all"
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(op); }}
                        >
                            {receiptLoading === op.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Printer className="h-4 w-4" />
                            }
                        </Button>
                    )}
                    {(op.type === 'SALE' || op.type === 'DEBT_DIRECT') && (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="İade İşlemi"
                            className="h-10 w-10 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReturn(op, op.items.length === 1 ? op.items[0] : undefined);
                            }}
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Detaylar"
                        className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-none"
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </td>
        </tr>
    );
}
