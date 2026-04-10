import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getDeviceList, getExpiringDevices } from "@/lib/actions/device-hub-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { CreateDeviceModal } from "@/components/device-hub/create-device-modal";
import { ExpiringWarrantiesModal } from "@/components/device-hub/expiring-warranties-modal";
import { DeviceMonthlySalesModal } from "@/components/device-hub/device-monthly-sales-modal";
import { DeviceAiStockAdviceModal } from "@/components/device-hub/device-ai-stock-advice-modal";
import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import {
  Globe, MonitorSmartphone, BadgeCheck, RotateCcw, TrendingUp, Smartphone, Coins, Wallet, CreditCard, Zap,
} from "lucide-react";
import { DeviceListClient } from "@/components/device-hub/device-list-client";
import { getMonthlySalesComparisonHtml } from "@/lib/device-utils";
import { DeviceExportButton } from "@/components/device-hub/device-export-button";
import { getIndustryLabel } from "@/lib/industry-utils";

export const dynamic = "force-dynamic";

export default async function DeviceHubPage() {
  const shopId = await getShopId();
  const [devices, categories, expiringDevices] = await Promise.all([
    getDeviceList(),
    getCategories(),
    getExpiringDevices(),
  ]);

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const assetLabel = getIndustryLabel(shop, "customerAsset");
  const assetLabelUpper = assetLabel.toLocaleUpperCase('tr-TR');

  // Metrics
  const newDevices = devices.filter((d: any) => d.deviceInfo?.condition === "NEW");
  const usedDevices = devices.filter((d: any) => d.deviceInfo?.condition === "USED");
  const intlDevices = devices.filter((d: any) => d.deviceInfo?.condition === "INTERNATIONAL");

  // ... (rest of data fetching)

  // Today's Sales
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaySalesItems = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: startOfToday } },
      product: { deviceInfo: { isNot: null } }
    }
  });
  const todaySalesTotal = todaySalesItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const todayCount = todaySalesItems.length;

  // Monthly Sales Detail for Modal
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlySalesItems = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: startOfMonth } },
      product: { deviceInfo: { isNot: null } }
    },
    include: { product: { include: { deviceInfo: true } }, sale: true },
    orderBy: { sale: { createdAt: "desc" } }
  });

  const monthlyTotal = monthlySalesItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const monthlyCount = monthlySalesItems.length;

  // Last Month Comparison
  const lastMonthStart = new Date(startOfMonth);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(startOfMonth);
  const lastMonthSalesItems = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      product: { deviceInfo: { isNot: null } }
    }
  });
  const lastMonthTotal = lastMonthSalesItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const comparisonHtml = getMonthlySalesComparisonHtml(monthlyTotal, lastMonthTotal);

  // Financial Stock Metrics
  const totalStokMaliyeti = devices.reduce((acc: number, d: any) => acc + (d.stock > 0 ? Number(d.buyPrice) * d.stock : 0), 0);
  const beklenenKar = devices.reduce((acc: number, d: any) => acc + (d.stock > 0 ? (Number(d.sellPrice) - Number(d.buyPrice)) * d.stock : 0), 0);

  // Sales Graph Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const salesGraphData = await Promise.all(last7Days.map(async (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const dailyTotal = monthlySalesItems
      .filter(item => new Date(item.sale.createdAt) >= date && new Date(item.sale.createdAt) < nextDay)
      .reduce((acc, curr) => acc + Number(curr.totalPrice), 0);

    return {
      date: date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      total: dailyTotal,
    };
  }));

  // Missing Items Analysis
  const soldRecentLimit = new Date();
  soldRecentLimit.setDate(soldRecentLimit.getDate() - 30);
  const soldRecently = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: soldRecentLimit } },
      product: { deviceInfo: { isNot: null } }
    },
    include: { product: { include: { deviceInfo: true } } }
  });

  const missingItemsMap = new Map();
  soldRecently.forEach((item: any) => {
    const key = `${item.product.name}-${item.product.deviceInfo?.color}-${item.product.deviceInfo?.storage}`;
    if (!missingItemsMap.has(key)) {
      const stockAvailable = devices.some((d: any) =>
        d.name === item.product.name &&
        d.deviceInfo?.color === item.product.deviceInfo?.color &&
        d.deviceInfo?.storage === item.product.deviceInfo?.storage &&
        d.stock > 0
      );
      if (!stockAvailable) {
        missingItemsMap.set(key, {
          productName: item.product.name,
          color: item.product.deviceInfo?.color,
          storage: item.product.deviceInfo?.storage,
          condition: item.product.deviceInfo?.condition
        });
      }
    }
  });
  const missingItems = Array.from(missingItemsMap.values());

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 lg:p-8">

      {/* Standardized Page Header */}
      <PageHeader
        title={`${assetLabel} Merkezi`}
        description="Envanter yönetimi, finansal takip ve alım-satım süreçlerinin merkezi."
        icon={MonitorSmartphone}
        iconColor="text-blue-500"
        actions={
          <>
            <DeviceExportButton devices={devices} />
            <CreateDeviceModal categories={categories} />
          </>
        }
      />

      {/* Stock Cards Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground/80" />
          <h2 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em]">Stok Durum Paneli</h2>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={MonitorSmartphone} label={`TOPLAM ${assetLabelUpper}`} value={devices.length.toString()} subLabel={`${assetLabel} Adet`} color="blue" />
          {(shop?.industry === 'PHONE_REPAIR' || shop?.industry === 'COMPUTER_REPAIR') ? (
            <>
              <MetricCard icon={BadgeCheck} label={`SIFIR ${assetLabelUpper}`} value={newDevices.length.toString()} subLabel="Sıfır Stok" color="emerald" />
              <MetricCard icon={RotateCcw} label={`2. EL ${assetLabelUpper}`} value={usedDevices.length.toString()} subLabel="İkinci El" color="amber" />
              <MetricCard icon={Globe} label="YURTDIŞI" value={intlDevices.length.toString()} subLabel="Dual SIM" color="purple" />
            </>
          ) : (
            <MetricCard icon={TrendingUp} label="AKTİF STOK" value={devices.length.toString()} subLabel="Toplam Ürün" color="emerald" />
          )}
          <ExpiringWarrantiesModal devices={expiringDevices} count={expiringDevices.length} />
          <DeviceAiStockAdviceModal missingItems={missingItems} />
        </div>
      </div>

      {/* Finance Cards Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-4 w-4 text-muted-foreground/80" />
          <h2 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em]">Finansal Göstergeler</h2>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Wallet} label="STOK MALİYETİ" value={`${totalStokMaliyeti.toLocaleString("tr-TR")} ₺`} subLabel="Toplam Alış" color="rose" />
          <MetricCard icon={TrendingUp} label="BEKLENEN KAR" value={`${beklenenKar.toLocaleString("tr-TR")} ₺`} subLabel="Satış Potansiyeli" color="emerald" />
          <MetricCard icon={CreditCard} label="BUGÜNKÜ SATIŞ" value={`${todaySalesTotal.toLocaleString("tr-TR")} ₺`} subLabel={`${todayCount} İşlem`} color="blue" />
          <DeviceMonthlySalesModal
            monthlyTotal={monthlyTotal}
            monthlyCount={monthlyCount}
            chartData={salesGraphData}
            items={monthlySalesItems}
            comparisonHtml={comparisonHtml}
          />
        </div>
      </div>

      {/* Main Content: Filterable Table Client */}
      <DeviceListClient initialDevices={devices} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, subLabel, color }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
  };

  return (
    <div className="bg-[#121629] p-5 rounded-2xl flex flex-col gap-3 border border-border/60 shadow-lg group transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl transition-colors ${colors[color].split(" ")[0]} ${colors[color].split(" ")[1]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`text-[9px]  tracking-widest px-2 py-0.5 rounded-full ${colors[color].split(" ")[0]} ${colors[color].split(" ")[1]}`}>
          {label}
        </div>
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-[26px]  text-white leading-none tracking-tight">{value}</h3>
        <p className="text-[11px] text-muted-foreground/80  tracking-wide mt-2">{subLabel}</p>
      </div>
    </div>
  );
}





