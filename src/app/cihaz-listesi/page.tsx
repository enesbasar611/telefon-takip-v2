import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getDeviceList } from "@/lib/actions/device-hub-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { Smartphone, CheckCircle2, ShieldCheck, Zap, Activity } from "lucide-react";
import { DeviceInspectionModal } from "@/components/device-hub/device-inspection-modal";
import { CreateDeviceModal } from "@/components/device-hub/create-device-modal";

export const dynamic = 'force-dynamic';

export default async function DeviceHubPage() {
  const devices = await getDeviceList();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 " />
            <span className="text-[10px] font-black   text-slate-500">Orgelux Hub 2026</span>
          </div>
          <h1 className="text-4xl font-black  text-white  italic">CİHAZ <span className="text-blue-500">MERKEZİ</span></h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sıfır ve İkinci El Cihaz Envanter Yönetimi & Ekspertiz.</p>
        </div>
        <CreateDeviceModal categories={categories} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="matte-card p-6 lg:p-8 rounded-xl flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-x-4 -translate-y-8 bg-blue-600/5 rounded-full" />
            <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500   mb-1">STOKTAKİ CİHAZLAR</p>
                <h3 className="text-4xl font-black text-white ">{devices.length} <span className="text-sm text-slate-600 font-bold ml-1">Ünite</span></h3>
            </div>
        </div>

        <div className="matte-card p-8 rounded-xl flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-x-4 -translate-y-8 bg-emerald-600/5 rounded-full" />
            <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500   mb-1">BU AY SATILAN</p>
                <h3 className="text-4xl font-black text-white ">0 <span className="text-sm text-slate-600 font-bold ml-1">Ünite</span></h3>
            </div>
        </div>

        <div className="matte-card p-8 rounded-xl flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-x-4 -translate-y-8 bg-purple-600/5 rounded-full" />
            <div className="h-12 w-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500   mb-1">GÜNCEL VARLIK DEĞERİ</p>
                <h3 className="text-4xl font-black text-white ">₺{devices.reduce((acc: number, d: any) => acc + Number(d.buyPrice), 0).toLocaleString('tr-TR')}</h3>
            </div>
        </div>
      </div>

      <div className="matte-card rounded-xl overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-border/10/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 ">
                    <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white  ">Envanter Arşivi</h2>
                    <p className="text-[10px] text-slate-500 font-bold   mt-0.5 italic">Gerçek zamanlı cihaz analizi</p>
                </div>
            </div>
        </div>

        <div className="lg:hidden space-y-4 p-4">
            {devices.length === 0 ? (
                <p className="text-center py-10 text-slate-500 font-bold italic  text-xs">Cihaz bulunamadı.</p>
            ) : (
                devices.map((device: any) => (
                    <div key={device.id} className="matte-card p-5 rounded-2xl border-border/10/50 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-border/10 flex items-center justify-center relative">
                                    <Smartphone className="h-6 w-6 text-slate-500" />
                                    {device.deviceInfo?.condition === "NEW" && (
                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full " />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-white  text-sm leading-tight">{device.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold  mt-1">IMEI: {device.deviceInfo?.imei || '-'}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-slate-900 border-border/10 text-[8px] font-black text-slate-500  px-2 py-0.5">
                                {device.category.name}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/40 p-3 rounded-xl border border-border/10/50">
                                <p className="text-[8px] font-black text-slate-600  mb-1 text-center">KONDİSYON</p>
                                <div className="flex gap-0.5 justify-center">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className={`h-1 w-1.5 rounded-full ${i < (device.deviceInfo?.cosmeticScore || 0) ? 'bg-blue-500' : 'bg-slate-800'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-xl border border-border/10/50 text-right">
                                <p className="text-[8px] font-black text-slate-600  mb-1">SATIŞ FİYATI</p>
                                <span className="text-sm font-black text-white italic">₺{Number(device.sellPrice).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/10/50">
                            <span className="text-[9px] text-slate-600 font-bold ">MALİYET: ₺{Number(device.buyPrice).toLocaleString('tr-TR')}</span>
                            <DeviceInspectionModal
                                deviceId={device.deviceInfo?.id}
                                deviceName={device.name}
                                initialResults={device.deviceInfo?.expertChecklist}
                                initialScore={device.deviceInfo?.cosmeticScore}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>

        <Table className="hidden lg:table">
          <TableHeader className="bg-slate-900/40">
            <TableRow className="border-border/10/50 hover:bg-transparent">
              <TableHead className="py-6 pl-8 text-[10px] font-black text-slate-400  ">Cihaz Bilgisi</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-400  ">Sınıflandırma</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-400   text-center">Durum / Kondisyon</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-400   text-right">Maliyet & Satış</TableHead>
              <TableHead className="py-6 pr-8 text-right w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-600 font-black  text-xs italic ">
                  Envanterde henüz cihaz bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device: any) => (
                <TableRow key={device.id} className="border-border/10/50 group hover:bg-slate-900/30 transition-colors">
                  <TableCell className="py-6 pl-8 font-medium">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-border/10 flex items-center justify-center relative shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                           <Smartphone className="h-7 w-7 text-slate-500 group-hover:text-blue-500" />
                           {device.deviceInfo?.condition === "NEW" && (
                              <div className="absolute top-0 right-0 h-4 w-4 bg-blue-500 flex items-center justify-center rounded-bl-lg ">
                                 <Zap className="h-2 w-2 text-white fill-white" />
                              </div>
                           )}
                        </div>
                        <div>
                           <span className="block text-sm font-black text-white   group-hover:text-blue-400 transition-colors">{device.name}</span>
                           <span className="block text-[9px] text-slate-600 font-bold   mt-0.5">IMEI: {device.deviceInfo?.imei || "Bilinmiyor"}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline" className="bg-slate-900 border-border/10 text-[9px] font-black text-slate-500   py-1.5 px-4 rounded-xl">
                        {device.category.name}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`h-1 w-2 rounded-full ${i < (device.deviceInfo?.cosmeticScore || 0) ? 'bg-blue-500' : 'bg-slate-800'}`} />
                            ))}
                        </div>
                        <span className="text-[9px] font-black text-slate-500  ">Kondisyon: {device.deviceInfo?.cosmeticScore}/10</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                       <span className="text-lg font-black text-white italic ">₺{Number(device.sellPrice).toLocaleString('tr-TR')}</span>
                       <span className="text-[9px] text-slate-600 font-bold  ">Maliyet: ₺{Number(device.buyPrice).toLocaleString('tr-TR')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DeviceInspectionModal
                        deviceId={device.deviceInfo?.id}
                        deviceName={device.name}
                        initialResults={device.deviceInfo?.expertChecklist}
                        initialScore={device.deviceInfo?.cosmeticScore}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
