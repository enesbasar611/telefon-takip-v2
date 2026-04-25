"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings2, Wrench, ShoppingCart, Wallet } from "lucide-react";

interface CustomersTabProps {
    formData: Record<string, string>;
    onChange: (key: string, value: string, isAutoSave?: boolean) => void;
    savingKeys: Set<string>;
}

export function CustomersTab({ formData, onChange, savingKeys }: CustomersTabProps) {
    const isLoyaltyEnabled = formData.loyalty_enabled !== "false";

    // Service config
    const serviceThreshold = formData.loyalty_service_spend_threshold || "1000";
    const servicePoints = formData.loyalty_service_points_earned || "20";

    // Sale config
    const saleThreshold = formData.loyalty_sale_spend_threshold || "1000";
    const salePoints = formData.loyalty_sale_points_earned || "10";

    // Value config
    const pointValueTl = formData.loyalty_point_value_tl || "5";

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Sadakat Sistemi Aktif/Pasif */}
            <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-200 dark:border-[#222] bg-slate-50 dark:bg-[#111]">
                <div className="space-y-1 pr-6 flex-1">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-500" />
                        <Label className="text-base font-semibold text-slate-900 dark:text-white">Sadakat Sistemi (Dijital Cüzdan)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground/80 dark:text-muted-foreground leading-relaxed mt-1">
                        Müşterilerinizin alışveriş ve servis işlemlerinden puan kazanmasını ve bu puanları ödemelerinde indirim (nakit) olarak kullanmasını sağlar.
                    </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    {savingKeys.has("loyalty_enabled") && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                    <Switch
                        checked={isLoyaltyEnabled}
                        onCheckedChange={(checked) => onChange("loyalty_enabled", checked ? "true" : "false", true)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>
            </div>

            <div className={`space-y-8 transition-opacity duration-300 ${!isLoyaltyEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                {/* ---------- SERVİS İŞLEMLERİ ---------- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Wrench className="w-5 h-5 text-orange-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Servis İşlemlerinde Puan Kazanımı</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Harcama Kotası (TL)</Label>
                                {savingKeys.has("loyalty_service_spend_threshold") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <Input
                                type="number" min="1" placeholder="Örn: 1000"
                                value={serviceThreshold}
                                onChange={(e) => onChange("loyalty_service_spend_threshold", e.target.value)}
                                onBlur={(e) => onChange("loyalty_service_spend_threshold", e.target.value, true)}
                                className="bg-white dark:bg-[#151515] h-12"
                            />
                            <p className="text-[11px] text-muted-foreground">Her kaç TL için puan verilecek?</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Kazanılacak Puan</Label>
                                {savingKeys.has("loyalty_service_points_earned") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <Input
                                type="number" min="0" placeholder="Örn: 20"
                                value={servicePoints}
                                onChange={(e) => onChange("loyalty_service_points_earned", e.target.value)}
                                onBlur={(e) => onChange("loyalty_service_points_earned", e.target.value, true)}
                                className="bg-white dark:bg-[#151515] h-12"
                            />
                            <p className="text-[11px] text-muted-foreground">Yukarıdaki kotaya ulaştıkça eklenecek miktar.</p>
                        </div>
                    </div>
                </div>

                {/* ---------- SATIŞ İŞLEMLERİ ---------- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <ShoppingCart className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Hızlı Satış (Aksesuar) İşlemlerinde Puan Kazanımı</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Harcama Kotası (TL)</Label>
                                {savingKeys.has("loyalty_sale_spend_threshold") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <Input
                                type="number" min="1" placeholder="Örn: 1000"
                                value={saleThreshold}
                                onChange={(e) => onChange("loyalty_sale_spend_threshold", e.target.value)}
                                onBlur={(e) => onChange("loyalty_sale_spend_threshold", e.target.value, true)}
                                className="bg-white dark:bg-[#151515] h-12"
                            />
                            <p className="text-[11px] text-muted-foreground">Satışlarda her kaç TL için puan verilecek?</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Kazanılacak Puan</Label>
                                {savingKeys.has("loyalty_sale_points_earned") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <Input
                                type="number" min="0" placeholder="Örn: 10"
                                value={salePoints}
                                onChange={(e) => onChange("loyalty_sale_points_earned", e.target.value)}
                                onBlur={(e) => onChange("loyalty_sale_points_earned", e.target.value, true)}
                                className="bg-white dark:bg-[#151515] h-12"
                            />
                            <p className="text-[11px] text-muted-foreground">Genellikle satış kar marjı düşük olduğundan farklı bir puan oranı belirleyebilirsiniz.</p>
                        </div>
                    </div>
                </div>

                {/* ---------- PUAN DEĞERİ (TL) ---------- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Wallet className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Puanların Cüzdan Karşılığı (TL)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">1 Puanın TL Değeri</Label>
                                {savingKeys.has("loyalty_point_value_tl") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number" min="0" step="0.1" placeholder="Örn: 5"
                                    value={pointValueTl}
                                    onChange={(e) => onChange("loyalty_point_value_tl", e.target.value)}
                                    onBlur={(e) => onChange("loyalty_point_value_tl", e.target.value, true)}
                                    className="bg-white dark:bg-[#151515] h-12 pl-10"
                                />
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground font-medium text-sm">
                                    ₺
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium text-blue-500">
                                Örnek: Müşterinin hesabında 50 puan varsa, bunu fatura ödemesinde {50 * (Number(pointValueTl) || 5)} TL nakit indirim olarak kullanabilir.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------- KAR ORANLARI (DÖVİZ ÇEVİRİCİ) ---------- */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Settings2 className="w-5 h-5 text-blue-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Döviz Çevirici Kar Oranları (TL)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Bayi Karı (TL)</Label>
                                {savingKeys.has("dealer_profit_tl") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number" min="0" placeholder="Örn: 200"
                                    value={formData.dealer_profit_tl ?? "200"}
                                    onChange={(e) => onChange("dealer_profit_tl", e.target.value)}
                                    onBlur={(e) => onChange("dealer_profit_tl", e.target.value, true)}
                                    className="bg-white dark:bg-[#151515] h-12 pl-10"
                                />
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground font-medium text-sm">
                                    ₺
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Bayi seçildiğinde ücrete eklenecek miktar.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Müşteri Karı (TL)</Label>
                                {savingKeys.has("customer_profit_tl") && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number" min="0" placeholder="Örn: 700"
                                    value={formData.customer_profit_tl ?? "700"}
                                    onChange={(e) => onChange("customer_profit_tl", e.target.value)}
                                    onBlur={(e) => onChange("customer_profit_tl", e.target.value, true)}
                                    className="bg-white dark:bg-[#151515] h-12 pl-10"
                                />
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground font-medium text-sm">
                                    ₺
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Müşteri seçildiğinde ücrete eklenecek miktar.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-[#222] rounded-2xl p-5 mt-4 text-xs text-muted-foreground">
                    <strong className="text-slate-800 dark:text-slate-200">Nasıl Çalışır?</strong><br />
                    Puan kazanma oranları (TL eşikleri) geçmiş ödemeleri etkilemez. Ayrıca müşteri bu puanları kullanıp
                    indirim aldığında, o kadar puan cüzdanından <strong>otomatik düşülür</strong>. Sistemi sadece onure
                    etmek için (puan harcatmaksızın) kullanacaksanız indirim menüsünü pas geçebilirsiniz.
                </div>
            </div>
        </div>
    );
}
