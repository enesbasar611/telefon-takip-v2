import { getCustomerById } from "@/lib/actions/customer-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { notFound } from "next/navigation";
import { CustomerDebtPanel } from "@/components/customer/customer-debt-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Star,
    Wrench,
    ShoppingCart,
    ArrowDownCircle,
    History,
    Clock,
    CheckCircle2,
    FileText,
    Smartphone,
    Calendar,
    Wallet,
    Building2,
    UserCircle,
    Gem,
    Crown,
    ShieldCheck,
    ChevronLeft,
    ArrowUpRight,
    TrendingUp,
    Zap,
    Package,
    Hash,
    AlertCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
    PENDING: "Beklemede",
    APPROVED: "Onaylandı",
    REPAIRING: "Tamirde",
    WAITING_PART: "Parça bekliyor",
    READY: "Hazır",
    DELIVERED: "Teslim edildi",
    CANCELLED: "İptal edildi",
};

const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: "Platin", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 ", icon: Gem, next: 0, percent: 100 };
    if (points >= 500) return { label: "Altın", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-blue-400/10", icon: Crown, next: 1000, percent: (points / 1000) * 100 };
    if (points >= 200) return { label: "Gümüş", color: "text-gray-300 bg-gray-300/10 border-gray-300/20", icon: ShieldCheck, next: 500, percent: (points / 500) * 100 };
    return { label: "Bronz", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Star, next: 200, percent: (points / 200) * 100 };
};

import { getShop } from "@/lib/actions/setting-actions";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
    const [customer, accounts, shop] = await Promise.all([
        getCustomerById(params.id),
        getAccounts(),
        getShop()
    ]);

    if (!customer) {
        notFound();
    }

    const totalRevenue = (customer.sales?.reduce((acc: number, s: any) => acc + Number(s.finalAmount), 0) || 0) +
        (customer.tickets?.reduce((acc: number, t: any) => acc + Number(t.actualCost), 0) || 0);

    const activeTicketsCount = customer.tickets?.filter((t: any) => !["DELIVERED", "CANCELLED"].includes(t.status)).length || 0;

    const totalDebt = customer.debts?.reduce((acc: number, d: any) => acc + Number(d.remainingAmount), 0) || 0;
    const tier = getLoyaltyTier(customer.loyaltyPoints);

    // Collect all items (Service parts + Sale items)
    const serviceParts = customer.tickets?.flatMap((t: any) =>
        (t.usedParts || []).map((p: any) => {
            const startDate = t.deliveredAt || t.createdAt;
            let expiry = t.warrantyExpiry;

            // If ticket doesn't have expiry, calculate from part's warranty info
            if (!expiry) {
                const date = new Date(startDate);
                if (p.warrantyDays) {
                    date.setDate(date.getDate() + p.warrantyDays);
                    expiry = date;
                } else if (p.warrantyMonths) {
                    date.setMonth(date.getMonth() + p.warrantyMonths);
                    expiry = date;
                }
            }

            return {
                ...p,
                itemName: p.product?.name,
                itemCategory: p.product?.category?.name,
                supplierName: p.product?.supplier?.name,
                cost: p.costPrice,
                price: p.unitPrice,
                referenceNumber: t.ticketNumber,
                referenceId: t.id,
                type: 'SERVICE',
                date: startDate,
                warrantyExpiry: expiry
            };
        })
    ) || [];

    const saleItems = customer.sales?.flatMap((s: any) =>
        (s.items || []).map((item: any) => {
            const date = s.createdAt;
            const warrantyMonths = item.product?.warrantyMonths || 0;
            let expiry = null;
            if (warrantyMonths > 0) {
                const d = new Date(date);
                d.setMonth(d.getMonth() + warrantyMonths);
                expiry = d;
            }

            return {
                ...item,
                itemName: item.product?.name,
                itemCategory: item.product?.category?.name,
                supplierName: item.product?.supplier?.name,
                cost: item.product?.buyPrice,
                price: item.unitPrice,
                referenceNumber: s.saleNumber,
                referenceId: s.id,
                type: 'SALE',
                date: date,
                warrantyExpiry: expiry
            };
        })
    ) || [];

    const allUsedItems = [...serviceParts, ...saleItems].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
            {/* Header Profile Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-4">
                <div className="flex gap-8 items-center">
                    <Link href="/musteriler">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-28 w-28 rounded-xl bg-blue-500/10 border-4 border-background flex items-center justify-center relative shadow-none overflow-hidden group hover:scale-105 transition-all">
                        {customer.photo ? (
                            <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <UserCircle className="h-12 w-12 text-blue-500" />
                        )}
                        {customer.isVip && (
                            <div className="absolute top-0 right-0 h-6 w-6 bg-blue-500 flex items-center justify-center rounded-bl-xl border-4 border-background">
                                <Zap className="h-3 w-3 text-white fill-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="font-medium text-4xl font-extrabold">{customer.name}</h1>
                            {customer.isVip && (
                                <Badge className="bg-blue-500 text-white border-none  text-[10px] px-4 py-1.5 rounded-xl animate-pulse">Vip üye</Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-6 text-xs  text-muted-foreground">
                            <div className="flex items-center gap-2 group cursor-pointer hover:text-foreground transition-colors">
                                <Phone className="h-4 w-4 text-blue-500" />
                                <span>{customer.phone}</span>
                            </div>
                            {customer.email && (
                                <div className="flex items-center gap-2 group cursor-pointer hover:text-foreground transition-colors">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                    <span className="truncate max-w-[200px]">{customer.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]  border-border text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                                    {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3 mr-2 text-blue-500" /> : <UserCircle className="h-3 w-3 mr-2 text-blue-500" />}
                                    {customer.type === 'KURUMSAL' ? "Kurumsal" : "Bireysel"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link href={`/musteriler/duzenle/${customer.id}`}>
                        <Button variant="outline" className="border-border bg-muted hover:bg-blue-500/10 hover:text-blue-500 px-6 h-12 rounded-2xl  transition-all shadow-none">Profili düzenle</Button>
                    </Link>
                    <Link href={`/satis?customerId=${customer.id}`}>
                        <Button className="bg-blue-600 text-white px-6 h-12 rounded-2xl  hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Satış yap</Button>
                    </Link>
                </div>
            </div>

            {/* Main Grid: CRM Analiz & Sadakat */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Loyalty Panel */}
                <Card className="lg:col-span-1 border-border shadow-sm group overflow-hidden relative bg-card rounded-xl">
                    <CardHeader className="border-b border-border pb-6 bg-muted/10">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <CardTitle className="font-medium text-sm ">Sadakat seviyesi</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="flex flex-col items-center text-center">
                            <div className={cn("h-24 w-24 rounded-xl flex items-center justify-center border-none shadow-lg mb-4 group-hover:scale-110 transition-transform", tier.color)}>
                                <tier.icon className="h-12 w-12" />
                            </div>
                            <h3 className="font-medium text-2xl font-extrabold">{tier.label}</h3>
                            <p className="text-xs  text-muted-foreground mt-1">Aktif üyelik seviyesi</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs  text-muted-foreground">Gelişim puanı</span>
                                <span className="text-sm  text-blue-500">{customer.loyaltyPoints} / {tier.next || customer.loyaltyPoints}</span>
                            </div>
                            <Progress value={tier.percent} className="h-2 bg-muted [&>div]:bg-blue-500 rounded-full" />
                            {tier.next > 0 && (
                                <p className="text-[10px] text-muted-foreground font-medium text-center">
                                    Bir sonraki seviye için {tier.next - customer.loyaltyPoints} puan daha gerekiyor.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Financial & Summary Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="border-border shadow-sm group bg-card rounded-xl hover:translate-y-[-4px] transition-all overflow-hidden relative">
                        <CardContent className="p-10 flex flex-col gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform">
                                <Wallet className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs  text-muted-foreground mb-1">Toplam işlem hacmi</p>
                                <h3 className="font-medium text-4xl font-extrabold">₺{formatCurrency(totalRevenue)}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm group bg-card rounded-xl hover:translate-y-[-4px] transition-all overflow-hidden relative">
                        <CardContent className="p-10 flex flex-col gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform">
                                <Wrench className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs  text-muted-foreground mb-1">Aktif servis adedi</p>
                                <h3 className="font-medium text-4xl font-extrabold">{activeTicketsCount} cihaz</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm group bg-card rounded-xl hover:translate-y-[-4px] transition-all overflow-hidden relative">
                        <CardContent className="p-10 flex flex-col gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5 group-hover:scale-110 transition-transform">
                                <ArrowDownCircle className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs  text-muted-foreground mb-1">Güncel borç bakiyesi</p>
                                <h3 className="font-medium text-4xl font-extrabold text-rose-500">₺{formatCurrency(totalDebt)}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History Tabs */}
                    <div className="col-span-1 md:col-span-3">
                        <Tabs defaultValue="history" className="w-full">
                            <TabsList className="bg-muted/30 border-b border-border w-full justify-start rounded-none h-auto p-0 gap-10 mb-8 overflow-x-auto">
                                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4  text-xs transition-all">İşlem arşivi</TabsTrigger>
                                <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4  text-xs transition-all">Borç & Tahsilat</TabsTrigger>
                                <TabsTrigger value="parts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4  text-xs transition-all">Kullanılan parçalar</TabsTrigger>
                                <TabsTrigger value="warranty" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4  text-xs transition-all">Aktif garantiler</TabsTrigger>
                                <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4  text-xs transition-all">Müşteri notları</TabsTrigger>
                            </TabsList>

                            <TabsContent value="financial" className="outline-none">
                                <CustomerDebtPanel customer={customer} accounts={accounts} shop={shop} />
                            </TabsContent>

                            <TabsContent value="history" className="space-y-2 outline-none">
                                {[...(customer.tickets || []), ...(customer.sales || [])]
                                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map((item: any, idx: number) => {
                                        // Build display title
                                        const saleItemNames = !item.ticketNumber && item.items?.length > 0
                                            ? item.items.map((i: any) => i.product?.name || 'Ürün').join(', ')
                                            : null;

                                        const title = item.ticketNumber
                                            ? `${item.deviceBrand} ${item.deviceModel}`
                                            : saleItemNames || item.saleNumber;

                                        return (
                                            <div key={idx} className="bg-card px-4 py-3 rounded-xl border border-border flex items-center justify-between hover:bg-muted/10 transition-all group shadow-sm gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                                                        item.ticketNumber ? 'bg-blue-600/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                                    )}>
                                                        {item.ticketNumber ? <Wrench className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors leading-tight">
                                                            {title}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                                            <span>{format(new Date(item.createdAt), "d MMM yyyy", { locale: tr })}</span>
                                                            <span className="opacity-40">•</span>
                                                            <span className="text-blue-500 font-bold">#{item.ticketNumber || item.saleNumber}</span>
                                                            {item.ticketNumber && item.problemDesc && (
                                                                <>
                                                                    <span className="opacity-40">•</span>
                                                                    <span className="truncate max-w-[120px]">{item.problemDesc}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] border-none px-2.5 py-1 rounded-lg hidden sm:flex",
                                                        item.status === 'DELIVERED' || !item.status ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-500'
                                                    )}>
                                                        {item.status ? statusLabels[item.status] : "Tamamlandı"}
                                                    </Badge>
                                                    <span className="text-sm font-bold tabular-nums">
                                                        ₺{formatCurrency(Number(item.actualCost) || Number(item.finalAmount) || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </TabsContent>

                            <TabsContent value="parts" className="space-y-6 outline-none">
                                {allUsedItems.length === 0 ? (
                                    <div className="p-20 text-center bg-card rounded-xl border border-border border-dashed">
                                        <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-sm  text-muted-foreground">Henüz parça/ürün kullanımı kaydedilmemiş</p>
                                    </div>
                                ) : (
                                    <div className="bg-card border border-border rounded-xl shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-muted/30 border-b border-border">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[10px]  uppercase tracking-widest text-muted-foreground">Parça / Ürün</th>
                                                        <th className="px-6 py-5 text-[10px]  uppercase tracking-widest text-muted-foreground">Tedarikçi</th>
                                                        <th className="px-6 py-5 text-[10px]  uppercase tracking-widest text-muted-foreground">İşlem</th>
                                                        <th className="px-6 py-5 text-[10px]  uppercase tracking-widest text-muted-foreground">Maliyet/Fiyat</th>
                                                        <th className="px-8 py-5 text-[10px]  uppercase tracking-widest text-muted-foreground">Garanti Durumu</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {allUsedItems.map((p: any, idx: number) => {
                                                        const isExpired = p.warrantyExpiry && new Date(p.warrantyExpiry) < new Date();
                                                        const now = new Date();
                                                        let percent = 0;
                                                        let daysLeft = 0;

                                                        if (p.warrantyExpiry) {
                                                            const expiry = new Date(p.warrantyExpiry);
                                                            const start = new Date(p.date);
                                                            const totalDays = differenceInDays(expiry, start) || 1; // Prevent div by zero
                                                            daysLeft = differenceInDays(expiry, now);
                                                            percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
                                                        }

                                                        return (
                                                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn(
                                                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                                            p.type === 'SERVICE' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                                                                        )}>
                                                                            {p.type === 'SERVICE' ? <Wrench className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className=" text-sm truncate">{p.itemName}</div>
                                                                            <div className="text-[10px] text-muted-foreground  mt-1 uppercase tracking-tighter">{p.itemCategory || 'Genel'}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                        <span className="text-xs ">{p.supplierName || 'Bilinmiyor'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className={cn(
                                                                            "text-[10px]  uppercase tracking-widest",
                                                                            p.type === 'SERVICE' ? "text-blue-500" : "text-emerald-500"
                                                                        )}>#{p.referenceNumber}</div>
                                                                        <div className="text-[10px] text-muted-foreground font-medium">{format(new Date(p.date), "d MMM yyyy", { locale: tr })}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px]  text-muted-foreground">M: ₺{formatCurrency(p.cost || 0)}</span>
                                                                        <span className="text-sm  text-foreground">S: ₺{formatCurrency(p.price || 0)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    {p.warrantyExpiry ? (
                                                                        <div className="w-[180px] space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className={cn(
                                                                                    "text-[9px]  uppercase tracking-widest",
                                                                                    isExpired ? "text-rose-500" : "text-emerald-500"
                                                                                )}>
                                                                                    {isExpired ? "Süre Doldu" : `${daysLeft} Gün Kaldı`}
                                                                                </span>
                                                                                <span className="text-[9px]  text-muted-foreground/60">{format(new Date(p.warrantyExpiry), "d/MM/yy")}</span>
                                                                            </div>
                                                                            <Progress value={percent} className={cn(
                                                                                "h-1.5 bg-muted rounded-full",
                                                                                isExpired ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500 shadow-sm shadow-emerald-500/10"
                                                                            )} />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px]  text-muted-foreground/40 italic">- Garanti Tanımsız -</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="warranty" className="space-y-6 outline-none">
                                <div className="grid gap-8 md:grid-cols-2">
                                    {[...allUsedItems].filter(p => p.warrantyExpiry).map((p: any, idx: number) => {
                                        const now = new Date();
                                        const expiry = new Date(p.warrantyExpiry);
                                        const start = new Date(p.date);
                                        const totalDays = differenceInDays(expiry, start) || 1;
                                        const daysLeft = differenceInDays(expiry, now);
                                        const percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
                                        const isExpired = daysLeft < 0;

                                        return (
                                            <Card key={idx} className="bg-card border-border shadow-sm overflow-hidden group rounded-xl hover:border-blue-500/30 transition-all">
                                                <CardHeader className="pb-4 border-b border-border bg-muted/10">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center border border-border shadow-sm",
                                                                p.type === 'SERVICE' ? "bg-blue-500/10 text-blue-500 shadow-blue-500/5" : "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5"
                                                            )}>
                                                                {p.type === 'SERVICE' ? <ShieldCheck className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                                                            </div>
                                                            <div>
                                                                <CardTitle className="font-medium text-xs  leading-tight truncate max-w-[150px]">{p.itemName}</CardTitle>
                                                                <CardDescription className="text-[10px]  uppercase tracking-tighter">no: {p.referenceNumber}</CardDescription>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={cn(
                                                            "border-none  text-[10px] px-3 py-1.5 rounded-xl",
                                                            isExpired ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10'
                                                        )}>
                                                            {isExpired ? 'Süre Doldu' : 'Aktif Koruma'}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-10">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px]  text-muted-foreground uppercase tracking-widest">Kalan Süre</span>
                                                            <span className={cn(
                                                                "text-lg  mt-0.5",
                                                                isExpired ? 'text-rose-500/50' : 'text-emerald-500'
                                                            )}>
                                                                {isExpired ? 'Tamamlandı' : `${daysLeft} GÜN`}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[9px]  text-muted-foreground uppercase">Tedarikçi</div>
                                                            <div className="text-[11px]  text-foreground">{p.supplierName || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <Progress value={percent} className={cn(
                                                        "h-2 bg-muted rounded-full",
                                                        isExpired ? "[&>div]:bg-rose-500" : "[&>div]:bg-emerald-500 shadow-sm shadow-emerald-500/10"
                                                    )} />
                                                    <div className="flex items-center justify-between mt-6">
                                                        <div className="flex items-center gap-2 text-[10px]  text-muted-foreground">
                                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                            <span>Bitiş: {format(expiry, "d MMM yyyy", { locale: tr })}</span>
                                                        </div>
                                                        <Link href={p.type === 'SERVICE' ? `/servis/liste` : `/satis/kasa`}>
                                                            <Button variant="ghost" className="text-[10px]  text-blue-500 hover:bg-blue-500/5 px-0 h-auto">
                                                                Detayı gör <ArrowUpRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </TabsContent>

                            <TabsContent value="notes" className="outline-none">
                                <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
                                    <CardHeader className="border-b border-border bg-muted/10">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <CardTitle className="font-medium text-sm ">Stratejik müşteri notları</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10">
                                        <div className="bg-muted/30 p-10 rounded-xl border border-border min-h-[250px] text-muted-foreground text-sm font-medium leading-relaxed group hover:border-blue-500/20 transition-all">
                                            {customer.notes || "Bu profil için henüz stratejik bir not girişi yapılmamıştır."}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div >
    );
}







