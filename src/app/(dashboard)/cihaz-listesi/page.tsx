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
import { DeviceImportModal } from "@/components/device-hub/device-import-modal";
import { getIndustryLabel } from "@/lib/industry-utils";
import { DeviceMonthSelector } from "@/components/device-hub/device-month-selector";
import { DeviceDateRangeSelector } from "@/components/device-hub/device-date-range-selector";

export const dynamic = "force-dynamic";

export default async function DeviceHubPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const deviceId = searchParams.deviceId as string;
  const month = searchParams.month as string;
  const startDateParam = searchParams.startDate as string;
  const endDateParam = searchParams.endDate as string;
  const shopId = await getShopId();
  const [devices, categories, expiringDevices] = await Promise.all([
    getDeviceList({ month, startDate: startDateParam, endDate: endDateParam }),
    getCategories(),
    getExpiringDevices(),
  ]);

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const assetLabel = getIndustryLabel(shop, "customerAsset");
  const assetLabelUpper = assetLabel.toLocaleUpperCase('tr-TR');

  // Filtering Boundaries
  let startBound: Date;
  let endBound: Date;

  if (startDateParam && endDateParam) {
    startBound = new Date(startDateParam);
    startBound.setHours(0, 0, 0, 0);
    endBound = new Date(endDateParam);
    endBound.setHours(23, 59, 59, 999);
  } else {
    const activeMonth = month || new Date().toISOString().substring(0, 7);
    startBound = new Date(`${activeMonth}-01T00:00:00`);
    endBound = new Date(startBound);
    endBound.setMonth(endBound.getMonth() + 1);
  }

  // Separation
  const stockDevices = devices.filter((d: any) => d.stock > 0);
  const soldDevices = devices.filter((d: any) => d.stock === 0 && d.sale);

  // Filtered Sold Devices (based on period)
  const filteredSoldDevices = soldDevices.filter((d: any) => {
    const saleDate = new Date(d.sale.createdAt);
    return saleDate >= startBound && saleDate < endBound;
  });

  // Metrics
  const newDevicesStock = stockDevices.filter((d: any) => d.deviceInfo?.condition === "NEW");
  const usedDevicesStock = stockDevices.filter((d: any) => d.deviceInfo?.condition === "USED");
  const intlDevicesStock = stockDevices.filter((d: any) => d.deviceInfo?.condition === "INTERNATIONAL");

  // Financial Stock Metrics
  const totalStokMaliyeti = stockDevices.reduce((acc: number, d: any) => acc + (Number(d.buyPrice) * d.stock), 0);
  const beklenenKar = stockDevices.reduce((acc: number, d: any) => acc + (Number(d.sellPrice) - Number(d.buyPrice)) * d.stock, 0);

  // Financial Sales Metrics (Selected Period)
  const periodTotalSatis = filteredSoldDevices.reduce((acc: number, d: any) => acc + Number(d.sellPrice), 0);
  const periodToplamKar = filteredSoldDevices.reduce((acc: number, d: any) => acc + (Number(d.sellPrice) - Number(d.buyPrice)), 0);

  // Period Sales Detail for Graphs
  const periodSalesItems = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: startBound, lt: endBound } },
      product: { deviceInfo: { isNot: null } }
    },
    include: { product: { include: { deviceInfo: true } }, sale: true },
    orderBy: { sale: { createdAt: "desc" } }
  });

  const periodTotal = periodSalesItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const periodCount = periodSalesItems.length;

  // Comparison logic (simplified, relative to startBound)
  const lastMonthStart = new Date(startBound);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(startBound);
  const lastMonthSalesItems = await prisma.saleItem.findMany({
    where: {
      shopId,
      sale: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      product: { deviceInfo: { isNot: null } }
    }
  });
  const lastMonthTotal = lastMonthSalesItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
  const comparisonHtml = getMonthlySalesComparisonHtml(periodTotal, lastMonthTotal);

  // Missing Items Analysis
  const soldRecentLimit = new Date();
  soldRecentLimit.setDate(soldRecentLimit.getDate() - 30);
  const missingItemsMap = new Map();
  // ... (Missing items logic remains similar but uses stockDevices)
  periodSalesItems.forEach((item: any) => {
    const key = `${item.product.name}-${item.product.deviceInfo?.color}-${item.product.deviceInfo?.storage}`;
    if (!missingItemsMap.has(key)) {
      const stockAvailable = stockDevices.some((d: any) =>
        d.name === item.product.name &&
        d.deviceInfo?.color === item.product.deviceInfo?.color &&
        d.deviceInfo?.storage === item.product.deviceInfo?.storage
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
  // Purchases in period
  const periodPurchases = await prisma.product.findMany({
    where: {
      shopId,
      createdAt: { gte: startBound, lt: endBound },
      deviceInfo: { isNot: null }
    }
  });

  const missingItems = Array.from(missingItemsMap.values());  // Sales Graph Data (Selected Period)
  const daysInPeriod = Math.ceil((endBound.getTime() - startBound.getTime()) / (1000 * 60 * 60 * 24));
  const salesGraphData = Array.from({ length: daysInPeriod }).map((_, i) => {
    const dayDate = new Date(startBound);
    dayDate.setDate(dayDate.getDate() + i);

    const dailySales = periodSalesItems.filter((item: any) => new Date(item.sale.createdAt).toDateString() === dayDate.toDateString());
    const dailyTotal = dailySales.reduce((acc: number, curr: any) => acc + Number(curr.totalPrice), 0);
    const dailyCount = dailySales.length;

    const dailyPurchases = periodPurchases.filter((p: any) => new Date(p.createdAt).toDateString() === dayDate.toDateString()).length;

    return {
      date: dayDate.getDate().toString(),
      total: dailyTotal,
      salesCount: dailyCount,
      purchaseCount: dailyPurchases
    };
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-8 max-w-7xl mx-auto p-0 sm:p-8">

      {/* Standardized Page Header */}
      <PageHeader
        title={`${assetLabel} Merkezi`}
        description="Envanter yönetimi, finansal takip ve alım-satım süreçlerinin merkezi."
        icon={MonitorSmartphone}
        iconColor="text-blue-500"
        actions={
          <>
            <DeviceDateRangeSelector initialMonth={month} />
            <DeviceImportModal />
            <DeviceExportButton
              devices={devices}
              categories={categories}
              selectedMonth={month}
            />
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
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 scrollbar-none sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={MonitorSmartphone} label={`STOKTAKİ ${assetLabelUpper}`} value={stockDevices.length.toString()} subLabel={`${assetLabel} Adet`} color="blue" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={BadgeCheck} label={`SIFIR ${assetLabelUpper}`} value={newDevicesStock.length.toString()} subLabel="Sıfır Stok" color="emerald" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={RotateCcw} label={`2. EL ${assetLabelUpper}`} value={usedDevicesStock.length.toString()} subLabel="İkinci El" color="amber" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={Globe} label="YURTDIŞI" value={intlDevicesStock.length.toString()} subLabel="Dual SIM" color="purple" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={Wallet} label="STOK MALİYETİ" value={`${totalStokMaliyeti.toLocaleString("tr-TR")} ₺`} subLabel={`Beklenen Kar: + ${beklenenKar.toLocaleString("tr-TR")} ₺`} color="rose" />
          </div>
        </div>
      </div>

      {/* Finance Cards Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-4 w-4 text-muted-foreground/80" />
          <h2 className="font-medium text-[10px]  text-muted-foreground/80 uppercase tracking-[0.2em]">Finansal Göstergeler ({startDateParam ? `${startDateParam} - ${endDateParam}` : (month || "Bu Ay")})</h2>
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 scrollbar-none sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={TrendingUp} label="BEKLENEN KAR" value={`${beklenenKar.toLocaleString("tr-TR")} ₺`} subLabel="Stok Potansiyeli" color="emerald" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={CreditCard} label="DÖNEM SATIŞI" value={`${periodTotalSatis.toLocaleString("tr-TR")} ₺`} subLabel={`${periodCount} Cihaz`} color="blue" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <MetricCard icon={Zap} label="DÖNEM KARI" value={`${periodToplamKar.toLocaleString("tr-TR")} ₺`} subLabel="Net Cihaz Karı" color="emerald" />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <DeviceMonthlySalesModal
              monthlyTotal={periodTotalSatis}
              monthlyCount={periodCount}
              chartData={salesGraphData}
              items={periodSalesItems}
              comparisonHtml={comparisonHtml}
            />
          </div>
          <div className="min-w-[200px] sm:min-w-0">
            <DeviceAiStockAdviceModal
              missingItems={missingItems}
              monthlySales={periodSalesItems}
              stockDevices={stockDevices}
            />
          </div>
        </div>
      </div>

      {/* Main Content: Filterable Table Client */}
      <DeviceListClient
        initialDevices={devices}
        initialDeviceId={deviceId}
      />
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
    <div className="bg-card p-5 rounded-2xl flex flex-col gap-3 border border-border/60 shadow-lg group transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl transition-colors ${colors[color].split(" ")[0]} ${colors[color].split(" ")[1]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`text-[9px]  tracking-widest px-2 py-0.5 rounded-full ${colors[color].split(" ")[0]} ${colors[color].split(" ")[1]}`}>
          {label}
        </div>
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-[26px]  text-foreground leading-none tracking-tight">{value}</h3>
        <p className="text-[11px] text-muted-foreground/80  tracking-wide mt-2">{subLabel}</p>
      </div>
    </div>
  );
}





