"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";
import { updateDeviceTests } from "@/lib/actions/second-hand-actions";
import { useToast } from "@/hooks/use-toast";

const TEST_ITEMS = [
  { id: "battery", label: "Batarya Sağlığı" },
  { id: "screen", label: "Ekran / Dokunmatik" },
  { id: "camera_front", label: "Ön Kamera" },
  { id: "camera_back", label: "Arka Kamera" },
  { id: "speaker", label: "Hoparlör" },
  { id: "mic", label: "Mikrofon" },
  { id: "wifi", label: "Wi-Fi / Bluetooth" },
  { id: "face_touch_id", label: "Face ID / Touch ID" },
  { id: "charging", label: "Şarj Soketi" },
  { id: "buttons", label: "Fiziksel Tuşlar" },
];

interface DeviceTestModalProps {
  deviceId: string;
  deviceName: string;
  initialTests?: any;
}

export function DeviceTestModal({ deviceId, deviceName, initialTests }: DeviceTestModalProps) {
  const [open, setOpen] = useState(false);
  const [tests, setTests] = useState<Record<string, boolean>>(initialTests || {});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = (id: string) => {
    setTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    const result = await updateDeviceTests(deviceId, tests);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Başarılı",
        description: "Test sonuçları güncellendi.",
      });
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Hata",
        description: result.error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Test Et
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{deviceName}</DialogTitle>
          <DialogDescription>
            Teknik kontrol listesini doldurarak cihazın durumunu kaydedin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {TEST_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={!!tests[item.id]}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <Label htmlFor={item.id} className="text-sm font-medium leading-none cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Kaydediliyor..." : "Sonuçları Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
