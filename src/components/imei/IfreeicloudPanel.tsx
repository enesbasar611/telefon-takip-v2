"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Copy,
  History,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type {
  IfreeicloudAccountStatus,
  IfreeicloudCheckResult,
  IfreeicloudServicePreset,
} from "@/lib/ifreeicloud-service";

interface IfreeicloudPanelProps {
  imei: string;
  detectedBrand?: string | null;
  compact?: boolean;
  initialResult?: IfreeicloudCheckResult | null;
  onResult?: (result: IfreeicloudCheckResult) => void;
}

const FEATURED_APPLE_IDS = [225, 4, 241, 60, 49, 286];
const FEATURED_ANDROID_IDS = [56, 55, 307, 196, 190, 283, 324];
const FEATURED_UNIVERSAL_IDS = [56, 55, 225, 4, 241, 196, 190];

export function IfreeicloudPanel({
  imei,
  detectedBrand,
  compact = false,
  initialResult = null,
  onResult,
}: IfreeicloudPanelProps) {
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [account, setAccount] = useState<IfreeicloudAccountStatus | null>(null);
  const [services, setServices] = useState<IfreeicloudServicePreset[]>([]);
  const [result, setResult] = useState<IfreeicloudCheckResult | null>(initialResult);
  const [isFromHistory, setIsFromHistory] = useState(Boolean(initialResult));
  const [runningServiceId, setRunningServiceId] = useState<number | null>(null);
  const [selectedExtraServiceId, setSelectedExtraServiceId] = useState<string>("205");

  const brandGroup = useMemo<"apple" | "android" | "all">(() => {
    const b = (detectedBrand || "").toLowerCase();
    if (b.includes("apple") || b.includes("iphone") || b.includes("ipad")) return "apple";
    if (
      b.includes("samsung") ||
      b.includes("xiaomi") ||
      b.includes("redmi") ||
      b.includes("poco") ||
      b.includes("huawei") ||
      b.includes("honor") ||
      b.includes("tecno") ||
      b.includes("infinix")
    ) {
      return "android";
    }
    return "all";
  }, [detectedBrand]);

  const [activeGroup, setActiveGroup] = useState<"apple" | "android" | "all">(brandGroup);

  useEffect(() => {
    setActiveGroup(brandGroup);
  }, [brandGroup]);

  useEffect(() => {
    let active = true;
    const cleanImei = (imei || "").replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanImei) {
      setLoadingMeta(false);
      return;
    }

    setLoadingMeta(true);
    fetch(`/api/imei/ifreeicloud?imei=${encodeURIComponent(cleanImei)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setConfigured(Boolean(data.configured));
        setAccount(data.account || null);
        setServices(Array.isArray(data.services) ? data.services : []);
        if (data.cachedResult && !initialResult) {
          setResult(data.cachedResult);
          setIsFromHistory(true);
          onResult?.(data.cachedResult);
        }
      })
      .catch(() => {
        // Keep silent if metadata fetch fails
      })
      .finally(() => {
        if (active) setLoadingMeta(false);
      });

    return () => {
      active = false;
    };
  }, [imei]);

  const quickButtons = useMemo(() => {
    const idOrder =
      activeGroup === "apple"
        ? FEATURED_APPLE_IDS
        : activeGroup === "android"
        ? FEATURED_ANDROID_IDS
        : FEATURED_UNIVERSAL_IDS;

    return idOrder
      .map((id) => services.find((s) => s.serviceId === id))
      .filter((s): s is IfreeicloudServicePreset => Boolean(s));
  }, [services, activeGroup]);

  const handleRunCheck = async (serviceId: number) => {
    if (!imei || runningServiceId !== null) return;
    setRunningServiceId(serviceId);

    try {
      const response = await fetch("/api/imei/ifreeicloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imei, serviceId }),
      });

      const payload: IfreeicloudCheckResult = await response.json();

      if (typeof payload.accountCredit === "number") {
        setAccount((prev) => ({
          configured: true,
          credit: payload.accountCredit ?? prev?.credit ?? null,
          currency: payload.currency || prev?.currency || "USD",
        }));
      }

      if (!response.ok || (!payload.success && payload.error)) {
        toast({
          variant: "destructive",
          title: "iFreeiCloud Sorgu Hatası",
          description: payload.error || "Sorgulama tamamlanamadı.",
        });
      } else {
        setResult(payload);
        setIsFromHistory(false);
        onResult?.(payload);
        toast({
          title: "iFreeiCloud Sorgusu Tamamlandı",
          description: `${payload.serviceName} sonucu alındı.`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Bağlantı Hatası",
        description: "iFreeiCloud API sunucusuna ulaşılamadı.",
      });
    } finally {
      setRunningServiceId(null);
    }
  };

  if (loadingMeta) {
    return (
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/[0.04] p-3 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
        <span>iFreeiCloud Pro servisleri yükleniyor...</span>
      </div>
    );
  }

  if (!configured) {
    return null;
  }

  const creditText =
    account?.credit !== null && account?.credit !== undefined
      ? `$${account.credit.toFixed(account.credit < 0.1 ? 3 : 2).replace(/0$/, "")}`
      : "Bakiye: --";

  const lowCredit = account?.credit !== null && account?.credit !== undefined && account.credit <= 0.05;

  return (
    <div
      className={`rounded-xl border border-indigo-500/25 bg-gradient-to-br from-indigo-50/80 via-white/90 to-cyan-50/60 dark:from-indigo-500/[0.06] dark:via-slate-900/40 dark:to-cyan-500/[0.04] ${
        compact ? "p-3" : "p-4"
      } space-y-3`}
    >
      {/* Header + Live Credit */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                iFreeiCloud Pro İstihbarat
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                CAPTCHA&apos;sız
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              FMI (iCloud), SIM-Lock, Blacklist, Seri No ve Tam Model/Kapasite kontrolü
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`text-[11px] font-mono font-semibold px-2 py-0.5 ${
            lowCredit
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
          }`}
        >
          <Coins className="w-3 h-3 mr-1" />
          Bakiye: {creditText}
        </Badge>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { key: "apple", label: "Apple / iPhone" },
          { key: "android", label: "Android / Genel" },
          { key: "all", label: "Popüler Tümü" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveGroup(tab.key as "apple" | "android" | "all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
              activeGroup === tab.key
                ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                : "bg-white/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Service Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {quickButtons.map((svc) => {
          const price = svc.liveCredit ?? svc.fallbackCredit;
          const isRunning = runningServiceId === svc.serviceId;
          const cannotAfford =
            account?.credit !== null && account?.credit !== undefined && account.credit < price;

          return (
            <Button
              key={svc.serviceId}
              type="button"
              size="sm"
              variant="outline"
              disabled={runningServiceId !== null || cannotAfford}
              onClick={() => handleRunCheck(svc.serviceId)}
              title={`${svc.description} ($${price})`}
              className="h-7 px-2.5 text-[11px] font-medium border-indigo-500/30 bg-white/80 dark:bg-slate-950/40 hover:bg-indigo-500/15 dark:hover:bg-indigo-500/20 hover:border-indigo-400 text-slate-800 dark:text-slate-200 gap-1.5"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500 dark:text-indigo-400" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              )}
              <span>{svc.shortLabel}</span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300/80">
                (${price})
              </span>
            </Button>
          );
        })}
      </div>

      {/* Full Service Selector */}
      {!compact && services.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <select
            value={selectedExtraServiceId}
            onChange={(e) => setSelectedExtraServiceId(e.target.value)}
            className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-950/50 px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
          >
            {services.map((svc) => {
              const price = svc.liveCredit ?? svc.fallbackCredit;
              return (
                <option key={svc.serviceId} value={String(svc.serviceId)}>
                  #{svc.serviceId} • {svc.name} (${price})
                </option>
              );
            })}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={runningServiceId !== null}
            onClick={() => handleRunCheck(Number(selectedExtraServiceId))}
            className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {runningServiceId === Number(selectedExtraServiceId) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1.5" />
            )}
            Seçili Servisi Sorgula
          </Button>
        </div>
      )}

      {/* Parsed Results */}
      {result && result.fields.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white/90 dark:bg-slate-950/50 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              {isFromHistory ? (
                <History className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{result.serviceName}</span>
              {isFromHistory && (
                <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400/90">
                  (Kayıtlı Sonuç — Kredi Harcanmadı)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(result.checkedAt).toLocaleString("tr-TR")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {result.fields.map((field, idx) => {
              const toneClass =
                field.tone === "good"
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : field.tone === "bad"
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : field.tone === "warn"
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-slate-900 dark:text-slate-100 font-medium";

              const copyable =
                field.label.toLowerCase().includes("serial") ||
                field.label.toLowerCase().includes("imei");

              return (
                <div
                  key={`${field.label}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900/70 px-2.5 py-1.5 text-[11px] border border-slate-200/80 dark:border-slate-800/80"
                >
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">{field.label}:</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`truncate text-right ${toneClass}`} title={field.value}>
                      {field.value}
                    </span>
                    {copyable && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(field.value);
                          toast({ title: "Kopyalandı", description: field.value });
                        }}
                        className="text-slate-400 hover:text-cyan-500 shrink-0"
                        title="Kopyala"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {account?.error && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{account.error}</span>
        </div>
      )}
    </div>
  );
}
