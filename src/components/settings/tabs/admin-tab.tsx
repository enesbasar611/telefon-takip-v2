"use client";

import { ShieldAlert, Globe, LayoutGrid, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminTab() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="grid gap-6 sm:grid-cols-2">
                {/* Dükkan Yönetimi */}
                <div className="group relative bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <ShieldAlert className="h-6 w-6 text-amber-500" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Dükkan Yönetimi</h3>
                    <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">
                        Sistemdeki tüm kayıtlı işletmeleri görün, durumlarını yönetin ve dükkan hesaplarına doğrudan erişin.
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 dark:border-white/10 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all group/btn">
                        <Link href="/admin/shops" className="flex items-center justify-center gap-2">
                            Tüm Dükkanları Yönet <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>

                {/* Sektör Yönetimi */}
                <div className="group relative bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Globe className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sektör Yapılandırması</h3>
                    <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">
                        Sektörel bazlı dinamik formları, terimleri ve varsayılan modül yapılandırmalarını global olarak düzenleyin.
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 dark:border-white/10 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group/btn">
                        <Link href="/ayarlar/sektorler" className="flex items-center justify-center gap-2">
                            Sektörleri Düzenle <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Güvenlik Uyarısı</span>
                </div>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/60 leading-relaxed">
                    Bu bölüm sadece Sistem Yöneticileri (Super Admin) içindir. Yapılan değişiklikler tüm platformu ve bağlı dükkanları etkileyebilir.
                    Lütfen işlem yaparken dikkatli olun.
                </p>
            </div>
        </div>
    );
}
