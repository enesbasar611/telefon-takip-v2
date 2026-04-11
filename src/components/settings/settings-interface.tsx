"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useMemo, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon, Palette, MessageCircle, Printer, Database, Zap, Users, Store, LayoutGrid, LayoutTemplate } from "lucide-react";
import { bulkUpdateSettings, updateSetting, updateShop } from "@/lib/actions/setting-actions";
import { toast } from "sonner";

// Tab Components
import { AppearanceTab } from "./tabs/appearance-tab";
import { WhatsAppTab } from "./tabs/whatsapp-tab";
import { PrinterTab } from "./tabs/printer-tab";
import { DataTab } from "./tabs/data-tab";
import { AutomationTab } from "./tabs/automation-tab";
import { CustomersTab } from "./tabs/customers-tab";
import { ShopTab } from "./tabs/shop-tab";
import { ModulesTab } from "./tabs/modules-tab";
import { FormsTab } from "./tabs/forms-tab";
import { FloatingSaveBar } from "./floating-save-bar";
import { PageHeader } from "@/components/ui/page-header";

interface SettingsProps {
  initialSettings: any[];
  receiptSettings: any[];
  shop: any;
}

const tabs = [
  { id: "appearance", label: "Görünüm", icon: Palette, desc: "Tema ve renkler" },
  { id: "shop", label: "Dükkan", icon: Store, desc: "Sektör ve bilgiler" },
  { id: "forms", label: "Dinamik Formlar", icon: LayoutTemplate, desc: "Sektörel form ayarları" },
  { id: "modules", label: "Modüller", icon: LayoutGrid, desc: "Aktif özellikler" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Mesaj şablonları" },
  { id: "printing", label: "Yazıcı", icon: Printer, desc: "Fiş ayarları" },
  { id: "customers", label: "Müşteriler", icon: Users, desc: "Sadakat modülü" },
  { id: "data", label: "Veri", icon: Database, desc: "Yedek ve export" },
  { id: "automation", label: "Otomasyon", icon: Zap, desc: "Kurallar ve onaylar" },
];

export function SettingsInterface({ initialSettings, receiptSettings, shop }: SettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabStates] = useState(searchParams.get("tab") || "shop");
  const [whatsappStatus, setWhatsappStatus] = useState<string>("CONNECTED");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { getWhatsAppStatusAction } = await import("@/lib/actions/data-management-actions");
        const res = await getWhatsAppStatusAction();
        setWhatsappStatus(res.status);
      } catch (error) {
        console.error("WhatsApp status check failed", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabStates(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const [isPending, startTransition] = useTransition();
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  // Build initial formData from settings array
  const initialFormData = useMemo(() => {
    const data: Record<string, string> = {};
    initialSettings.forEach((s: any) => {
      data[s.key] = s.value;
    });
    return data;
  }, [initialSettings]);

  const [formData, setFormData] = useState<Record<string, string>>(initialFormData);
  const [savedData, setSavedData] = useState<Record<string, string>>(initialFormData);

  // Dirty state tracking
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(savedData);
  }, [formData, savedData]);

  const handleChange = useCallback((key: string, value: string, isAutoSave = false) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    if (isAutoSave) {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      startTransition(async () => {
        try {
          // Pass false to skip revalidatePath and prevent page flicker
          const result = await updateSetting(key, value, false);
          if (result.success) {
            setSavedData(prev => ({ ...prev, [key]: value }));
          } else {
            toast.error("Ayar otomatik kaydedilemedi.");
          }
        } finally {
          setSavingKeys(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      });
    }
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      const result = await bulkUpdateSettings(formData);
      if (result.success) {
        setSavedData({ ...formData });
        toast.success("Ayarlar başarıyla kaydedildi.");
      } else {
        toast.error("Ayarlar kaydedilirken hata oluştu.");
      }
    });
  };

  const handleCancel = () => {
    setFormData({ ...savedData });
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Page Header ... (lines 73-138) */}
      {/* ... skipping header ... */}
      <PageHeader
        title="Sistem Ayarları"
        description="Platform parametrelerini ve işletme tercihlerini yönetin."
        icon={SettingsIcon}
      />

      <div className="flex gap-6 min-h-[600px]">
        <nav className="w-[220px] shrink-0 sticky top-6 self-start will-change-transform">
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] rounded-2xl p-2 space-y-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-[background-color,border-color,color,box-shadow] duration-200 transform-gpu",
                    isActive
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-muted-foreground/80 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] border border-transparent"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-blue-400" : "text-slate-600")} />
                    {tab.id === "whatsapp" && whatsappStatus === "DISCONNECTED" && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold block leading-tight">{tab.label}</span>
                    <span className={cn("text-[10px] block leading-tight mt-0.5", isActive ? "text-blue-400/60" : "text-slate-600")}>
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] rounded-2xl p-8 min-h-[600px] shadow-sm">
            <div className="mb-8 pb-6 border-b border-slate-200 dark:border-[#222]">
              {tabs.map((tab) => {
                if (tab.id !== activeTab) return null;
                const Icon = tab.icon;
                return (
                  <div key={tab.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{tab.label}</h2>
                      <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground">{tab.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="animate-in fade-in duration-300">
              {activeTab === "appearance" && (
                <AppearanceTab formData={formData} onChange={handleChange} savingKeys={savingKeys} />
              )}
              {activeTab === "shop" && (
                <ShopTab shop={shop} />
              )}
              {activeTab === "forms" && (
                <FormsTab shop={shop} />
              )}
              {activeTab === "modules" && (
                <ModulesTab shop={shop} />
              )}
              {activeTab === "whatsapp" && (
                <WhatsAppTab formData={formData} onChange={handleChange} savingKeys={savingKeys} />
              )}
              {activeTab === "printing" && (
                <PrinterTab receiptSettings={receiptSettings} />
              )}
              {activeTab === "customers" && (
                <CustomersTab formData={formData} onChange={handleChange} savingKeys={savingKeys} />
              )}
              {activeTab === "data" && (
                <DataTab formData={formData} onChange={handleChange} savingKeys={savingKeys} />
              )}
              {activeTab === "automation" && (
                <AutomationTab formData={formData} onChange={handleChange} savingKeys={savingKeys} />
              )}
            </div>
          </div>
        </div>
      </div>

      <FloatingSaveBar
        hasChanges={hasChanges}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
