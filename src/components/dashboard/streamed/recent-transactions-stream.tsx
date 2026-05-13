import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, serializePrisma } from "@/lib/utils";
import { getRecentTransactions } from "@/lib/actions/dashboard-actions";
import { getShopId } from "@/lib/auth";

export async function RecentTransactionsStream() {
    const shopId = await getShopId(false);
    if (!shopId) return null;
    const recentTransactionsRaw = await getRecentTransactions(shopId);
    const recentTransactions = serializePrisma(recentTransactionsRaw);

    return (
        <Card className="h-auto flex flex-col border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500 animate-in fade-in">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                        <History className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                        <CardTitle className="font-medium text-lg tracking-tight font-sans uppercase">Finansal Kayıtlar</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Son İşlemler</p>
                    </div>
                </div>
                <Link href="/satis/kasa">
                    <Button variant="outline" className="text-[10px] uppercase tracking-tighter text-blue-500 border-blue-500/20 hover:bg-blue-500/5 h-9 rounded-xl px-5 transition-all">
                        TÜMÜ <ChevronRight className="h-3 w-3 ml-2" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-card z-10">
                            <tr className="text-[10px] text-muted-foreground/60 bg-muted/20 tracking-[.15em] uppercase">
                                <th className="px-8 py-4">Müşteri / Zaman</th>
                                <th className="px-6 py-4 border-none lg:table-cell hidden">Detay</th>
                                <th className="px-6 py-4">Tutar</th>
                                <th className="px-8 py-4 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {recentTransactions.slice(0, 6).map((t: any) => (
                                <tr key={t.id} className="group hover:bg-muted/10 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="text-foreground text-sm tracking-tight">
                                            {t.customer?.name || t.sale?.customer?.name || (t.description.includes('SATIŞ') ? 'Hızlı Satış' : 'Genel İşlem')}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-tighter font-medium">{format(new Date(t.createdAt), "d MMM, HH:mm", { locale: tr })}</div>
                                    </td>
                                    <td className="px-6 py-5 text-xs text-muted-foreground lg:table-cell hidden max-w-[150px] truncate">{t.description}</td>
                                    <td className="px-6 py-5">
                                        <RevealFinancial amount={t.amount} className="text-sm tracking-tight" />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border-none shadow-sm transition-all group-hover:scale-105",
                                            t.paymentMethod === 'DEBT'
                                                ? 'bg-amber-500/10 text-amber-500'
                                                : t.type === 'INCOME'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-destructive/10 text-destructive'
                                        )}>
                                            {t.paymentMethod === 'DEBT' ? 'VERESİYE' : (t.category || (t.type === 'INCOME' ? 'TAHSİLAT' : 'GİDER'))}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {recentTransactions.length > 6 && (
                    <Link href="/satis/kasa" className="flex flex-col items-center justify-center py-4 bg-muted/5 border-t border-border/10 group cursor-pointer">
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] group-hover:text-primary transition-colors">
                            {recentTransactions.length - 6} KAYIT DAHA VAR
                        </span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/30 rotate-90 mt-1 animate-bounce" />
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}




