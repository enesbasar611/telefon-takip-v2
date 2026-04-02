"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Camera, X, Shield, MapPin, UserPlus } from "lucide-react";
import { createStaff } from "@/lib/actions/staff-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const staffSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "STAFF"]),
  branch: z.string().default("Ana Şube"),
  canSell: z.boolean().default(true),
  canService: z.boolean().default(true),
  canStock: z.boolean().default(true),
  canFinance: z.boolean().default(false),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function CreateStaffModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: "STAFF",
      branch: "Ana Şube",
      canSell: true,
      canService: true,
      canStock: true,
      canFinance: false,
    }
  });

  const onSubmit = async (data: StaffFormValues) => {
    startTransition(async () => {
      const result = await createStaff({
        ...data,
        name: `${data.name} ${data.surname}`,
        commissionRate: 0, // Default to 0
      });
      if (result.success) {
        toast.success("Personel başarıyla tanımlandı.");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex gap-2 items-center">
          <UserPlus className="h-4 w-4" />
          Yeni Personel Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Yeni Personel Ekle</DialogTitle>
              <p className="text-slate-500 text-xs font-medium">Sisteme yeni bir kullanıcı tanımlayın</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-4 space-y-8">
          {/* Top Section: Photo and Basic Info */}
          <div className="flex gap-8 items-start">
            {/* Photo Upload Area */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/20 group hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden">
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">FOTOĞRAF</span>
              </div>
              <p className="text-[8px] text-slate-400 font-bold uppercase text-center max-w-[100px]">
                Max 5MB, JPG veya PNG formatında olmalıdır.
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ADI</Label>
                <Input
                  {...register("name")}
                  placeholder="Örn: Ahmet"
                  className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SOYADI</Label>
                <Input
                  {...register("surname")}
                  placeholder="Örn: Yılmaz"
                  className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-POSTA</Label>
                <Input
                  {...register("email")}
                  placeholder="ahmet@example.com"
                  className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TELEFON</Label>
                <Input
                  {...register("phone")}
                  placeholder="+90 5xx xxx xx xx"
                  className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Role and Branch Selection */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ROL SEÇİMİ</Label>
              <Select onValueChange={(v) => setValue("role", v as any)} defaultValue="STAFF">
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Bir rol seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/5 text-white rounded-xl">
                  <SelectItem value="ADMIN">Yönetici</SelectItem>
                  <SelectItem value="TECHNICIAN">Teknisyen</SelectItem>
                  <SelectItem value="STAFF">Kasiyer / Personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ŞUBE SEÇİMİ</Label>
              <Select onValueChange={(v) => setValue("branch", v)} defaultValue="Ana Şube">
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <SelectValue placeholder="Bir şube seçin..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/5 text-white rounded-xl">
                  <SelectItem value="Ana Şube">Ana Şube</SelectItem>
                  <SelectItem value="Şube 2">Şube 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions Sections */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-50 dark:bg-white/5" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YETKİ TANIMLARI</span>
              <div className="h-[1px] flex-1 bg-slate-50 dark:bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PermissionToggle
                id="canSell"
                title="Satış Yapabilir"
                description="Satış ekranı ve ödeme işlemleri"
                checked={watch("canSell")}
                onCheckedChange={(c) => setValue("canSell", !!c)}
              />
              <PermissionToggle
                id="canService"
                title="Servis Kaydı Açabilir"
                description="Müşteri cihaz kabulü ve takip"
                checked={watch("canService")}
                onCheckedChange={(c) => setValue("canService", !!c)}
              />
              <PermissionToggle
                id="canStock"
                title="Stok Düzenleyebilir"
                description="Envanter girişi ve düzenleme"
                checked={watch("canStock")}
                onCheckedChange={(c) => setValue("canStock", !!c)}
              />
              <PermissionToggle
                id="canFinance"
                title="Finansal Verileri Görebilir"
                description="Ciro, gider ve kar raporları"
                checked={watch("canFinance")}
                onCheckedChange={(c) => setValue("canFinance", !!c)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex gap-2 items-center"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Personeli Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionToggle({ id, title, description, checked, onCheckedChange }: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (c: boolean) => void
}) {
  return (
    <div
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border-2",
        checked
          ? "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10"
          : "bg-slate-50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-white/5"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(!!c)}
        className="rounded-md border-slate-300 dark:border-slate-600"
      />
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-xs font-black", checked ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")}>{title}</span>
        <p className="text-[10px] font-bold text-slate-400 leading-none">{description}</p>
      </div>
    </div>
  );
}
