"use client";

import { useQuery } from "@tanstack/react-query";
import { getDailySummary } from "@/lib/actions/finance-actions";
import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";

export function IntelligentAlerts() {
    const { data: summary, isPending } = useQuery({
        queryKey: ["finance-summary"],
        queryFn: getDailySummary,
    });

    if (isPending || !summary) return null;

    const alerts = [];

    // Alert 1: Kasa Devir/Sıfırlama uyarısı
    if (summary.cashBalance > 50000) {
        alerts.push({
            type: "warning",
            icon: AlertTriangle,
            title: "Yüksek Nakit Bakiyesi",
            message: "Kasanızda 50.000₺ üzerinde nakit birikmiş durumda. Güvenlik ve hesap verimliliği için bir kısmını bankaya aktarmayı düşünebilirsiniz."
        });
    }

    // Alert 2: Gider artışı (Temsili olarak bugünün gideri yüksekse)
    if (summary.dailyTotalExpenses > summary.dailyTotalIncomes && summary.dailyTotalExpenses > 0) {
        alerts.push({
            type: "danger",
            icon: TrendingDown,
            title: "Giderler Gelirleri Aştı",
            message: "Bugün yaptığınız harcamalar toplam gelirinizi geçmiş durumda. Kasa açıklarına karşı dikkatli olun."
        });
    }

    // Alert 3: Kâr durumu
    if (summary.dailyTotalIncomes > summary.dailyTotalExpenses * 2 && summary.dailyTotalIncomes > 0) {
        alerts.push({
            type: "success",
            icon: TrendingUp,
            title: "Verimli Bir Gün!",
            message: "Bugün gelirleriniz, giderlerinizin iki katından fazla. Harika gidiyorsunuz!"
        });
    }

    // Alert 4: Standart bilgilendirme (Boş kalmasın diye)
    if (alerts.length === 0) {
        alerts.push({
            type: "info",
            icon: Lightbulb,
            title: "Finansal Asistan",
            message: "Kasanız şu anda stabil görünüyor. Düzenli olarak gün sonu almayı veya kasayı sıfırlamayı unutmayın."
        });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {alerts.map((alert, i) => {
                const Icon = alert.icon;
                const colors = {
                    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    danger: "bg-rose-500/10 text-rose-600 border-rose-500/20",
                    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                };
                
                return (
                    <div key={i} className={`flex gap-4 p-4 rounded-2xl border ${colors[alert.type as keyof typeof colors]} items-start animate-in fade-in duration-500`}>
                        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl shrink-0">
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="text-xs opacity-80 leading-relaxed">{alert.message}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
