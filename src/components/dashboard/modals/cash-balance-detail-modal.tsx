"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Wallet,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  Receipt,
  User,
  Store,
  Clock,
  Plus,
  Printer,
  Sparkles,
  Landmark,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getCashBalanceMonthlyDetails } from "@/lib/actions/dashboard-detail-actions";
import dynamic from "next/dynamic";

const CreateTransactionModal = dynamic(
  () => import("@/components/finance/create-transaction-modal").then((m) => m.CreateTransactionModal),
  { ssr: false }
);

interface CashBalanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashBalanceDetailModal({ isOpen, onClose }: CashBalanceDetailModalProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [activeTab, setActiveTab] = useState<"all" | "incomes" | "expenses">("all");
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cash-balance-monthly-detail", selectedYear, selectedMonth],
    queryFn: () => getCashBalanceMonthlyDetails({ year: selectedYear, month: selectedMonth }),
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToCurrent = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return `₺${num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return format(new Date(date), "d MMM yyyy, HH:mm", { locale: tr });
  };

  const handlePrint = () => {
    window.print();
  };

  const transactions = data?.last20Transactions || [];
  const inflows = data?.last20Inflows || [];
  const outflows = data?.last20Outflows || [];

  const displayList =
    activeTab === "incomes" ? inflows : activeTab === "expenses" ? outflows : transactions;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/40 bg-gradient-to-r from-card/80 to-muted/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    KASA BAKİYESİ VE AYLIK HAREKET RAPORU
                    {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    Ay tabanlı nakit akışı özeti ve son 20 kasa hareketi detayları
                  </DialogDescription>
                </div>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/50 self-stretch sm:self-auto justify-between sm:justify-start">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-xl hover:bg-background text-muted-foreground hover:text-foreground"
                  title="Önceki Ay"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-2 text-center min-w-[120px]">
                  <span className="text-xs font-black text-foreground uppercase tracking-tight flex items-center justify-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {data?.monthLabel || format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy", { locale: tr })}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth}
                  className="h-8 w-8 rounded-xl hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Sonraki Ay"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {!isCurrentMonth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToCurrent}
                    className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg ml-1"
                  >
                    Bu Ay
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Kasa verileri ve hareketler yükleniyor...</p>
              </div>
            ) : !data ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-sm font-semibold text-rose-500">Kasa verisi alınamadı.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs rounded-xl">
                  Tekrar Dene
                </Button>
              </div>
            ) : (
              <>
                {/* 4 Monthly KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Ay Başı Kasa Bakiyesi */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 hover:border-border transition-all shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        Ay Başı Kasa
                      </span>
                      <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-base sm:text-xl font-black text-foreground tracking-tight">
                      {formatCurrency(data.openingBalance)}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      1 {data.monthLabel.split(" ")[0]} devir bakiyesi
                    </p>
                  </div>

                  {/* 2. Ayın Başından Beri Kasaya Giren Para */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        Kasaya Giren Para
                      </span>
                      <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      +{formatCurrency(data.monthInflow)}
                    </div>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      Ay başından beri {data.monthInflowCount} giriş işlemi
                    </p>
                  </div>

                  {/* 3. Ayın Başından Beri Kasadan Çıkan Para */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        Kasadan Çıkan Para
                      </span>
                      <div className="h-7 w-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <TrendingDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      -{formatCurrency(data.monthOutflow)}
                    </div>
                    <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                      Ay başından beri {data.monthOutflowCount} çıkış işlemi
                    </p>
                  </div>

                  {/* 4. Güncel Kasa Bakiyesi */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-primary/[0.06] border border-primary/30 hover:border-primary/50 transition-all shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-primary">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        Güncel Kasa Bakiyesi
                      </span>
                      <div className="h-7 w-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Wallet className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-base sm:text-xl font-black text-primary tracking-tight">
                      {formatCurrency(data.currentCashBalance)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                      <span>Aylık Net:</span>
                      <span
                        className={cn(
                          "font-bold",
                          data.netMonthCashflow >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {data.netMonthCashflow >= 0 ? "+" : ""}
                        {formatCurrency(data.netMonthCashflow)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtitle & Filter Tabs for Last 20 Transactions */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Son 20 Kasa Kaydı
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Kasada gerçekleşen en son 20 nakit hareketinin giriş/çıkış kırılımı
                      </p>
                    </div>

                    <Tabs
                      value={activeTab}
                      onValueChange={(val: any) => setActiveTab(val)}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9 p-1 bg-muted/40 rounded-xl border border-border/50">
                        <TabsTrigger
                          value="all"
                          className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          Tümü ({transactions.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="incomes"
                          className="text-xs font-bold rounded-lg text-emerald-600 dark:text-emerald-400 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          Girişler ({inflows.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="expenses"
                          className="text-xs font-bold rounded-lg text-rose-600 dark:text-rose-400 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          Çıkışlar ({outflows.length})
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Summary Bar for the shown last 20 records */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-muted/20 border border-border/50 text-xs">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Son 20 Kayıt Giriş Toplamı:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                          +{formatCurrency(data.last20InflowTotal)}
                        </strong>
                        <span className="text-[10px] text-muted-foreground font-semibold">({inflows.length} adet)</span>
                      </div>
                      <div className="h-3 w-px bg-border/60 hidden sm:block" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Son 20 Kayıt Çıkış Toplamı:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-black">
                          -{formatCurrency(data.last20OutflowTotal)}
                        </strong>
                        <span className="text-[10px] text-muted-foreground font-semibold">({outflows.length} adet)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-muted-foreground font-medium">Net:</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-black px-2 py-0.5 rounded-lg border",
                          data.last20Net >= 0
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                        )}
                      >
                        {data.last20Net >= 0 ? "+" : ""}
                        {formatCurrency(data.last20Net)}
                      </Badge>
                    </div>
                  </div>

                  {/* Transaction List */}
                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar">
                    {displayList.length === 0 ? (
                      <div className="text-center py-10 space-y-2 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                        <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground font-medium">
                          {activeTab === "incomes"
                            ? "Son 20 işlem içerisinde nakit giriş kaydı bulunamadı."
                            : activeTab === "expenses"
                            ? "Son 20 işlem içerisinde nakit çıkış kaydı bulunamadı."
                            : "Henüz kasa hareketi bulunmuyor."}
                        </p>
                      </div>
                    ) : (
                      displayList.map((tx: any, idx: number) => {
                        const isIncome = tx.type === "INCOME";
                        const title =
                          tx.description ||
                          (tx.sale?.saleNumber ? `Satış #${tx.sale.saleNumber}` : isIncome ? "Nakit Giriş" : "Nakit Çıkış");
                        const category = tx.category || (isIncome ? "Gelir" : "Gider");
                        const partyName = tx.customer?.name || tx.supplier?.name;
                        const userName = tx.user?.name;

                        return (
                          <div
                            key={tx.id || idx}
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all shadow-sm group",
                              isIncome ? "hover:border-emerald-500/30" : "hover:border-rose-500/30"
                            )}
                          >
                            {/* Left Icon & Description */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                                  isIncome
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                )}
                              >
                                {isIncome ? (
                                  <ArrowDownLeft className="h-5 w-5" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                                    {title}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-tight bg-muted/60"
                                  >
                                    {category}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
                                  <span>{formatDate(tx.createdAt)}</span>
                                  {partyName && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        {partyName}
                                      </span>
                                    </>
                                  )}
                                  {userName && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                        ({userName})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Amount & Balance */}
                            <div className="text-right shrink-0 space-y-0.5">
                              <div
                                className={cn(
                                  "text-xs sm:text-sm font-black tracking-tight",
                                  isIncome
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                )}
                              >
                                {isIncome ? "+" : "-"}
                                {formatCurrency(tx.amount)}
                              </div>

                              {tx.runningBalance !== null && tx.runningBalance !== undefined && (
                                <p className="text-[10px] text-muted-foreground font-medium">
                                  Kasa: {formatCurrency(tx.runningBalance)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 sm:p-4 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddTxOpen(true)}
                className="h-9 text-xs font-bold rounded-xl gap-1.5 border-border/60 hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Kasa Hareketi
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 text-xs font-bold rounded-xl gap-1.5 border-border/60 hover:bg-muted"
              >
                <Printer className="h-3.5 w-3.5" />
                Yazdır
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                className="h-9 px-4 text-xs font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isAddTxOpen && (
        <CreateTransactionModal
          open={isAddTxOpen}
          onOpenChange={(open) => {
            setIsAddTxOpen(open);
            if (!open) refetch();
          }}
        />
      )}
    </>
  );
}
