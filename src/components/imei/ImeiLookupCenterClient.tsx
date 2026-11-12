"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  Copy,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isValidImeiLuhn,
  normalizeImeiDigits,
  type BtkClassification,
  type ImeiLookupResult,
} from "@/lib/imei-utils";
import type { ImeiHistoryEntry } from "@/lib/imei-history";
import { Imei14Plus1Field } from "./Imei14Plus1Field";
import { CameraImeiScanner } from "./CameraImeiScanner";
import { BtkDiagnosticCard } from "./ImeiResultModal";
import { toast } from "sonner";

interface ImeiLookupCenterClientProps {
  initialHistory: ImeiHistoryEntry[];
}

function formatDateTimeTr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ImeiLookupCenterClient({
  initialHistory,
}: ImeiLookupCenterClientProps) {
  const router = useRouter();
  const topPanelRef = useRef<HTMLDivElement>(null);

  const [imeiInput, setImeiInput] = useState("");
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recheckingImei, setRecheckingImei] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ImeiLookupResult | null>(null);

  const [history, setHistory] = useState<ImeiHistoryEntry[]>(initialHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BtkClassification>("ALL");
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const digits = normalizeImeiDigits(imeiInput);
  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);

  const refreshHistoryFromServer = async () => {
    try {
      const res = await fetch("/api/imei/history", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.history)) {
        setHistory(data.history);
      }
    } catch {
      // ignore silent refresh failures
    }
  };

  const runLiveLookup = async (
    targetImei: string,
    extra?: { challengeId?: string; captchaCode?: string },
    options?: { fromHistoryRow?: boolean }
  ) => {
    const clean = normalizeImeiDigits(targetImei);
    if (clean.length < 14) {
      toast.error("Sorgulama için en az 14 haneli IMEI girin.");
      return;
    }

    setImeiInput(clean);
    setIsLoading(true);
    if (options?.fromHistoryRow) {
      setRecheckingImei(clean);
      topPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const res = await fetch("/api/imei/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei: clean,
          ...extra,
        }),
      });
      const data: ImeiLookupResult = await res.json();
      if (!res.ok) {
        toast.error((data as any)?.error || "IMEI sorgulaması başarısız.");
        return;
      }

      if (data.imei) {
        setImeiInput(data.imei);
        setAutoCompleted(Boolean(data.autoCompleted15thDigit));
      }
      setActiveResult(data);

      if (data.btk && !data.btkPendingCaptcha) {
        await refreshHistoryFromServer();
        toast.success(
          `${data.imei}: ${data.btk.classification} (${data.brand || "Cihaz"} ${data.model || ""})`
        );
      }
    } catch {
      toast.error("IMEI sorgu servisine ulaşılamadı.");
    } finally {
      setIsLoading(false);
      setRecheckingImei(null);
    }
  };

  const handleFieldChange = (nextImei: string, meta?: { autoCompleted: boolean }) => {
    setAutoCompleted(Boolean(meta?.autoCompleted));
    setImeiInput(nextImei);
  };

  const handleScanDetected = (scanned: string) => {
    const clean = normalizeImeiDigits(scanned);
    setImeiInput(clean);
    setAutoCompleted(false);
    void runLiveLookup(clean);
  };

  const handleDeleteEntry = async (imei?: string) => {
    try {
      if (!imei) setIsClearingHistory(true);
      const url = imei
        ? `/api/imei/history?imei=${encodeURIComponent(imei)}`
        : "/api/imei/history?all=1";
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Kayıt silinemedi.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data?.history)) {
        setHistory(data.history);
      }
      toast.success(imei ? `${imei} geçmişten kaldırıldı.` : "IMEI geçmişi temizlendi.");
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleNavigateAction = (
    target: "service" | "buyback",
    payload: {
      imei: string;
      brand?: string | null;
      model?: string | null;
      classification?: BtkClassification;
    }
  ) => {
    const params = new URLSearchParams();
    params.set("imei", payload.imei);
    if (payload.brand) params.set("brand", payload.brand);
    if (payload.model) params.set("model", payload.model);
    if (payload.classification) params.set("btkStatus", payload.classification);

    if (target === "service") {
      router.push(`/servis/yeni?${params.toString()}`);
    } else {
      params.set("newDevice", "1");
      router.push(`/cihaz-listesi?${params.toString()}`);
    }
  };

  const counts = useMemo(() => {
    return {
      ALL: history.length,
      KAYITLI: history.filter((h) => h.classification === "KAYITLI").length,
      KAYITSIZ: history.filter((h) => h.classification === "KAYITSIZ").length,
      KLONLU: history.filter((h) => h.classification === "KLONLU").length,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase("tr-TR");
    return history.filter((item) => {
      if (statusFilter !== "ALL" && item.classification !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        item.imei,
        item.brand,
        item.model,
        item.durum,
        item.kaynak,
        item.markaModel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(q);
    });
  }, [history, searchTerm, statusFilter]);

  const renderStatusBadge = (
    classification: BtkClassification,
    statusChanged?: boolean,
    previousClassification?: BtkClassification | null
  ) => {
    if (classification === "KAYITLI") {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-black gap-1">
            <ShieldCheck className="h-3 w-3" />
            KAYITLI
          </Badge>
          {statusChanged && previousClassification && (
            <Badge
              variant="outline"
              className="text-[9px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400"
            >
              Önceki: {previousClassification}
            </Badge>
          )}
        </div>
      );
    }
    if (classification === "KLONLU") {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-black text-[10px] font-black gap-1">
            <AlertTriangle className="h-3 w-3" />
            KLONLU / RİSKLİ
          </Badge>
          {statusChanged && previousClassification && (
            <Badge className="bg-rose-600 text-white text-[9px] font-black">
              DURUM DEĞİŞTİ ({previousClassification} → KLONLU)
            </Badge>
          )}
        </div>
      );
    }
    if (classification === "KAYITSIZ") {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[10px] font-black gap-1">
            <ShieldAlert className="h-3 w-3" />
            KAYITSIZ
          </Badge>
          {statusChanged && previousClassification && (
            <Badge
              variant="outline"
              className="text-[9px] font-bold border-rose-500/40 text-rose-600 dark:text-rose-400"
            >
              Önceki: {previousClassification}
            </Badge>
          )}
        </div>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-bold">
        BELİRSİZ
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Lookup Panel */}
      <Card
        ref={topPanelRef}
        className="p-4 sm:p-6 rounded-2xl border-border/60 bg-card/80 backdrop-blur-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Canlı IMEI &amp; e-Devlet BTK Sorgulama
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              14 hane yazdığınızda 15. Luhn basamağı otomatik hesaplanır. Her sorgu önbelleksiz, anlık e-Devlet üzerinden yapılır.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-[10px] font-bold border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          >
            Önbelleksiz Canlı BTK
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Imei14Plus1Field
              value={digits}
              onChange={handleFieldChange}
              onEnter={() => void runLiveLookup(digits)}
              onOpenScanner={() => setScannerOpen(true)}
              placeholder="14 haneli IMEI yazın..."
              inputClassName="h-12 sm:h-13 rounded-xl text-sm sm:text-base"
              plusBoxClassName="h-12 sm:h-13 w-12 sm:w-14 rounded-xl text-base sm:text-lg"
            />

            <Button
              type="button"
              disabled={isLoading || digits.length < 14}
              onClick={() => runLiveLookup(digits)}
              className="h-12 sm:h-13 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm gap-2 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Canlı Sorgula</span>
            </Button>
          </div>
          {autoCompleted && luhnOk && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-0.5">
              14 hane girildi → 15. Luhn kontrol hanesi (<strong>{digits[14]}</strong>) otomatik eklendi.
            </p>
          )}
        </div>

        {/* Active Live Result */}
        {activeResult && (
          <div className="pt-2 space-y-3 border-t border-border/50">
            <BtkDiagnosticCard
              result={activeResult}
              isSubmittingCaptcha={isLoading}
              onSubmitCaptcha={(code) =>
                runLiveLookup(activeResult.imei, {
                  challengeId: activeResult.challengeId,
                  captchaCode: code,
                })
              }
              onRefreshCaptcha={() => runLiveLookup(activeResult.imei)}
            />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                type="button"
                onClick={() =>
                  handleNavigateAction("service", {
                    imei: activeResult.imei,
                    brand: activeResult.brand,
                    model: activeResult.model,
                    classification: activeResult.btk?.classification,
                  })
                }
                className="flex-1 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs gap-2"
              >
                <Wrench className="h-4 w-4" />
                Bu Cihazla Servis Kaydı Aç
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleNavigateAction("buyback", {
                    imei: activeResult.imei,
                    brand: activeResult.brand,
                    model: activeResult.model,
                    classification: activeResult.btk?.classification,
                  })
                }
                className="flex-1 h-11 rounded-xl font-bold text-xs gap-2"
              >
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                Cihaz Alımına Aktar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lookup History & Quick Re-Check */}
      <Card className="p-4 sm:p-6 rounded-2xl border-border/60 bg-card/80 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Önceki IMEI Sorgulamaları ({history.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Klonlama veya kayıt değişikliği kontrolü için tek tıkla canlı tekrar sorgulayın.
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isClearingHistory}
              onClick={() => handleDeleteEntry(undefined)}
              className="w-fit h-9 px-3 rounded-xl text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Geçmişi Temizle
            </Button>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { key: "ALL", label: `Tümü (${counts.ALL})` },
                { key: "KAYITLI", label: `Kayıtlı (${counts.KAYITLI})` },
                { key: "KAYITSIZ", label: `Kayıtsız (${counts.KAYITSIZ})` },
                { key: "KLONLU", label: `Klonlu (${counts.KLONLU})` },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.key}
                type="button"
                size="sm"
                variant={statusFilter === tab.key ? "default" : "outline"}
                onClick={() => setStatusFilter(tab.key)}
                className="h-8 px-3 rounded-xl text-xs font-semibold"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="IMEI, marka veya model ara..."
              className="h-9 pl-8 rounded-xl text-xs"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
            <Smartphone className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              {history.length === 0
                ? "Henüz kaydedilmiş IMEI sorgusu bulunmuyor"
                : "Filtreye uygun IMEI kaydı bulunamadı"}
            </p>
            <p className="text-xs text-muted-foreground">
              Üstteki alandan veya üst bardan yaptığınız her başarılı BTK sorgusu otomatik olarak buraya eklenir.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-3.5">IMEI</th>
                    <th className="py-3 px-3.5">Marka / Model</th>
                    <th className="py-3 px-3.5">BTK Durumu</th>
                    <th className="py-3 px-3.5">Son Sorgu</th>
                    <th className="py-3 px-3.5 text-right">Hızlı İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredHistory.map((item) => {
                    const isRowChecking = recheckingImei === item.imei && isLoading;
                    return (
                      <tr
                        key={item.imei}
                        className="hover:bg-muted/25 transition-colors"
                      >
                        <td className="py-3 px-3.5 font-mono tabular-nums font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span>{item.imei}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(item.imei);
                                toast.success("IMEI kopyalandı.");
                              }}
                              title="Kopyala"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-foreground">
                            {[item.brand, item.model].filter(Boolean).join(" ") ||
                              "Bilinmeyen Cihaz"}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">
                            {item.kaynak || item.markaModel}
                          </p>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            {renderStatusBadge(
                              item.classification,
                              item.statusChanged,
                              item.previousClassification
                            )}
                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">
                              {item.durum}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDateTimeTr(item.lastCheckedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                              {item.queryCount}x sorgu
                            </Badge>
                            {item.queriedBy && <span>• {item.queriedBy}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isLoading}
                              onClick={() =>
                                runLiveLookup(item.imei, undefined, {
                                  fromHistoryRow: true,
                                })
                              }
                              className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] gap-1"
                            >
                              {isRowChecking ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Tekrar Sorgula
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleNavigateAction("service", {
                                  imei: item.imei,
                                  brand: item.brand,
                                  model: item.model,
                                  classification: item.classification,
                                })
                              }
                              title="Servis Kaydı Aç"
                              className="h-8 px-2 rounded-lg text-[11px] gap-1"
                            >
                              <Wrench className="h-3 w-3 text-cyan-500" />
                              Servis
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleNavigateAction("buyback", {
                                  imei: item.imei,
                                  brand: item.brand,
                                  model: item.model,
                                  classification: item.classification,
                                })
                              }
                              title="Cihaz Alımına Aktar"
                              className="h-8 px-2 rounded-lg text-[11px] gap-1"
                            >
                              <ShoppingBag className="h-3 w-3 text-emerald-500" />
                              Alım
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteEntry(item.imei)}
                              title="Geçmişten Sil"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {filteredHistory.map((item) => {
                const isRowChecking = recheckingImei === item.imei && isLoading;
                return (
                  <div
                    key={item.imei}
                    className="rounded-xl border border-border/60 bg-background/60 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono tabular-nums text-xs font-bold">
                          {item.imei}
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                          {[item.brand, item.model].filter(Boolean).join(" ") ||
                            "Bilinmeyen Cihaz"}
                        </p>
                      </div>
                      {renderStatusBadge(
                        item.classification,
                        item.statusChanged,
                        item.previousClassification
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {item.durum} {item.kaynak ? `• ${item.kaynak}` : ""}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Son sorgu: {formatDateTimeTr(item.lastCheckedAt)}</span>
                      <span>{item.queryCount}x sorgu</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isLoading}
                        onClick={() =>
                          runLiveLookup(item.imei, undefined, {
                            fromHistoryRow: true,
                          })
                        }
                        className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5"
                      >
                        {isRowChecking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Tekrar Sorgula
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleNavigateAction("service", {
                            imei: item.imei,
                            brand: item.brand,
                            model: item.model,
                            classification: item.classification,
                          })
                        }
                        className="h-9 px-2.5 rounded-lg text-xs gap-1"
                      >
                        <Wrench className="h-3.5 w-3.5 text-cyan-500" />
                        Servis
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleNavigateAction("buyback", {
                            imei: item.imei,
                            brand: item.brand,
                            model: item.model,
                            classification: item.classification,
                          })
                        }
                        className="h-9 px-2.5 rounded-lg text-xs gap-1"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
                        Alım
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteEntry(item.imei)}
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <CameraImeiScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScanDetected}
      />
    </div>
  );
}

