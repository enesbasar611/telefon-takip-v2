"use client";

import { useState, useTransition } from "react";
import { Check, X, ShieldCheck, Camera, Smartphone, Wifi, Bluetooth, Battery, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDeviceExpertise } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const CHECKLIST_ITEMS = [
  { id: "faceid", label: "FaceID / TouchID", icon: Info },
  { id: "camera_front", label: "Ön Kamera", icon: Camera },
  { id: "camera_back", label: "Arka Kamera", icon: Camera },
  { id: "wifi", label: "Wi-Fi Bağlantısı", icon: Wifi },
  { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { id: "network", label: "Şebeke / 4G-5G", icon: Wifi },
  { id: "battery", label: "Batarya Sağlığı", icon: Battery },
  { id: "screen", label: "Ekran / Dokunmatik", icon: Smartphone },
  { id: "charging", label: "Şarj Soketi", icon: Battery },
  { id: "audio", label: "Hoparlör / Ahize", icon: Info },
  { id: "buttons", label: "Fiziksel Tuşlar", icon: Info },
  { id: "sensors", label: "Sensörler", icon: Info },
];

export function DeviceInspectionModal({
  deviceId,
  deviceName,
  initialResults,
  initialScore
}: {
  deviceId: string;
  deviceName: string;
  initialResults: any;
  initialScore: number;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any>(initialResults || {});
  const [cosmeticScore, setCosmeticScore] = useState(initialScore || 10);
  const [isPending, startTransition] = useTransition();

  const toggleCheck = (id: string) => {
    setResults((prev: any) => ({
      ...prev,
      [id]: prev[id] === "OK" ? "FAIL" : "OK",
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateDeviceExpertise(deviceId, results, cosmeticScore);
      if (res.success) {
        toast.success("Ekspertiz raporu güncellendi.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-900 border border-border/10 text-slate-500 hover:text-blue-500 hover:bg-blue-600/10 transition-all">
          <ShieldCheck className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background border-border/10 text-white p-0 overflow-hidden rounded-xl">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 ">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-black  ">Cihaz Ekspertiz Raporu</DialogTitle>
                    <p className="text-[10px] text-slate-500 font-bold   mt-0.5">{deviceName}</p>
                </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-500  ">KOZMETİK SKORU: {cosmeticScore}/10</span>
                    <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCosmeticScore(i + 1)}
                                className={`h-2 w-8 rounded-full transition-all ${i < cosmeticScore ? 'bg-blue-500 ' : 'bg-slate-800 hover:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>
                <Separator className="bg-slate-800/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CHECKLIST_ITEMS.map((item) => (
                <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                        results[item.id] === "OK"
                        ? 'bg-emerald-600/5 border-emerald-500/20'
                        : results[item.id] === "FAIL"
                        ? 'bg-rose-600/5 border-rose-500/20'
                        : 'bg-slate-900/40 border-border/10/60 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${
                        results[item.id] === "OK" ? 'text-emerald-500' : results[item.id] === "FAIL" ? 'text-rose-500' : 'text-slate-500'
                    }`} />
                    <span className="text-[11px] font-black  ">{item.label}</span>
                  </div>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                        results[item.id] === "OK" ? 'bg-emerald-500 text-white' : results[item.id] === "FAIL" ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-600'
                  }`}>
                    {results[item.id] === "OK" ? <Check className="h-3 w-3 stroke-[4px]" /> : results[item.id] === "FAIL" ? <X className="h-3 w-3 stroke-[4px]" /> : <Info className="h-3 w-3" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-border/10/50 bg-slate-900/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500  ">Sistem Onayına Hazır</span>
           </div>
           <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] font-black   text-slate-500 hover:text-white">İptal</Button>
                <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white font-black   px-8 h-12 rounded-2xl ">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "RAPORU KAYDET"}
                </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
