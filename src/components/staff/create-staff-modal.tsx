"use client";

import { useState, useTransition, useRef } from "react";
import { Role } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Plus, Loader2, Camera, X, Shield, MapPin, UserPlus, Image as ImageIcon } from "lucide-react";
import { createStaff } from "@/lib/actions/staff-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";

const staffSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "TECHNICIAN", "STAFF"]),
  branch: z.string().min(1, "Şube seçiniz"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  customImage: z.string().optional(),
  canSell: z.boolean(),
  canService: z.boolean(),
  canStock: z.boolean(),
  canFinance: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function CreateStaffModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      name: "",
      surname: "",
      email: "",
      password: "",
      role: "STAFF",
      branch: "Ana Şube",
      gender: "MALE",
      phone: "",
      customImage: "",
      canSell: true,
      canService: false,
      canStock: false,
      canFinance: false,
      canEdit: true,
      canDelete: false,
    }
  });

  const name = watch("name") || "";
  const surname = watch("surname") || "";
  const initials = (name.charAt(0) + surname.charAt(0)).toUpperCase() || "?";

  const onSubmit = async (data: StaffFormValues) => {
    startTransition(async () => {
      const result = await createStaff({
        ...data,
        image: data.customImage || "",
        role: data.role as Role,
        commissionRate: 0,
      });

      if (result.success) {
        toast.success("Personel başarıyla tanımlandı.");
        setOpen(false);
        reset();
        setPreviewImage(null);
      } else {
        toast.error(result.error || "Bir hata oluştu");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white  text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex gap-2 items-center">
          <UserPlus className="h-4 w-4" />
          Yeni Personel Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-card border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-medium text-xl  text-slate-900 dark:text-white">Yeni Personel Ekle</DialogTitle>
              <DialogDescription className="text-muted-foreground/80 text-xs font-medium">Sisteme yeni bir kullanıcı tanımlayın</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-4 space-y-8">
          <div className="flex gap-8 items-start">
            <div className="flex flex-col items-center gap-3">
              <input type="hidden" {...register("customImage")} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      setPreviewImage(base64);
                      setValue("customImage", base64);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative w-24 h-24 bg-white dark:bg-muted rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 border-white dark:border-border ring-4 ring-blue-500/10">
                  {previewImage ? (
                    <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                  ) : initials !== "?" ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-3xl  text-muted-foreground dark:text-white/20">
                      {initials}
                    </div>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[120px]">
                <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("gender", "MALE");
                      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch("name") || "E")}&background=4F46E5&color=fff&bold=true`;
                      setValue("customImage", url);
                      setPreviewImage(url);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px]  transition-all uppercase tracking-tighter flex items-center justify-center gap-1",
                      watch("gender") === "MALE" ? "bg-blue-600 text-white shadow-lg" : "text-muted-foreground hover:text-slate-600"
                    )}
                  >
                    ERKEK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("gender", "FEMALE");
                      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(watch("name") || "K")}&background=E11D48&color=fff&bold=true`;
                      setValue("customImage", url);
                      setPreviewImage(url);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px]  transition-all uppercase tracking-tighter flex items-center justify-center gap-1",
                      watch("gender") === "FEMALE" ? "bg-rose-600 text-white shadow-lg" : "text-muted-foreground hover:text-slate-600"
                    )}
                  >
                    KADIN
                  </button>
                </div>
                <p className="text-[9px]  text-center text-muted-foreground uppercase tracking-widest">HIZLI AVATAR</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">ADI</Label>
                <Input
                  {...register("name")}
                  placeholder="Örn: Ahmet"
                  className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">SOYADI</Label>
                <Input
                  {...register("surname")}
                  placeholder="Örn: Yılmaz"
                  className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">E-POSTA</Label>
                <Input
                  {...register("email")}
                  placeholder="ahmet@example.com"
                  className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium text-[10px]  text-rose-500 uppercase tracking-widest ml-1">GİRİŞ ŞİFRESİ</Label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="******"
                  className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <PhoneInput
                label="TELEFON"
                value={watch("phone") || ""}
                onChange={(val: string) => setValue("phone", val)}
                error={errors.phone?.message}
                className="h-11 border-none bg-slate-50 dark:bg-muted/50"
              />
            </div>
          </div>

          {/* Role and Branch Selection */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">ROL SEÇİMİ</Label>
              <Select onValueChange={(v) => setValue("role", v as any)} defaultValue="STAFF">
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs">
                  <SelectValue placeholder="Bir rol seçin..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card border-slate-200 dark:border-border/50 rounded-xl">
                  <SelectItem value="ADMIN" className="">Yönetici (Full)</SelectItem>
                  <SelectItem value="MANAGER" className="">Mağaza Müdürü</SelectItem>
                  <SelectItem value="CASHIER" className="">Kasiyer</SelectItem>
                  <SelectItem value="TECHNICIAN" className="">Teknisyen</SelectItem>
                  <SelectItem value="STAFF" className="">Satış Danışmanı / Personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">ŞUBE SEÇİMİ</Label>
              <Select onValueChange={(v) => setValue("branch", v)} defaultValue="Ana Şube">
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-muted/50 border-none rounded-xl  text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <SelectValue placeholder="Bir şube seçin..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-white rounded-xl">
                  <SelectItem value="Ana Şube">Ana Şube</SelectItem>
                  <SelectItem value="Şube 2">Şube 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Permissions */}
          <div className="pt-4 border-t border-border/50 mt-4">
            <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">HIZLI YETKİLER</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue("canSell", !watch("canSell"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canSell") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canSell") ? "border-emerald-500 bg-emerald-500" : "border-border/80")}>
                  {watch("canSell") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">SATIŞ</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("canService", !watch("canService"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canService") ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canService") ? "border-blue-500 bg-blue-500" : "border-border/80")}>
                  {watch("canService") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">SERVİS</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("canStock", !watch("canStock"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canStock") ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canStock") ? "border-orange-500 bg-orange-500" : "border-border/80")}>
                  {watch("canStock") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">STOK</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("canFinance", !watch("canFinance"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canFinance") ? "bg-purple-500/10 border-purple-500/20 text-purple-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canFinance") ? "border-purple-500 bg-purple-500" : "border-border/80")}>
                  {watch("canFinance") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">FİNANS</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("canEdit", !watch("canEdit"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canEdit") ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canEdit") ? "border-indigo-500 bg-indigo-500" : "border-border/80")}>
                  {watch("canEdit") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">DÜZENLEME</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("canDelete", !watch("canDelete"))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                  watch("canDelete") ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-border/50 text-muted-foreground/80"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", watch("canDelete") ? "border-red-500 bg-red-500" : "border-border/80")}>
                  {watch("canDelete") && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[10px]  uppercase tracking-wider">SİLME</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className=" text-xs uppercase tracking-widest text-muted-foreground hover:text-slate-900 dark:hover:text-white"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white  text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex gap-2 items-center"
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





