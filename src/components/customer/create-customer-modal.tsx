"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomer } from "@/lib/actions/customer-actions";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, PlusCircle, Loader2 } from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  phone: z.string()
    .min(1, "Telefon numarası gereklidir")
    .refine((val) => {
      const d = val.replace(/\D/g, "");
      if (d.length === 10 && d.startsWith("5")) return true;
      if (d.length === 11 && d.startsWith("05")) return true;
      if (d.length === 12 && d.startsWith("905")) return true;
      return false;
    }, "Geçerli Türkiye numarası giriniz (5xx xxx xx xx)"),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CreateCustomerModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [phoneValue, setPhoneValue] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const onSubmit = async (data: CustomerFormValues) => {
    startTransition(async () => {
      try {
        const result = await createCustomer(data);
        if (result.success) {
          toast({ title: "Başarılı", description: "Müşteri kaydı oluşturuldu." });
          setOpen(false);
          reset();
          setPhoneValue("");
        } else {
          toast({ title: "Hata", description: result.error, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Hata", description: "Müşteri kaydedilirken bir sistem hatası oluştu.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Yeni Müşteri Ekle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-white/5 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-8 bg-slate-900/50 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Yeni Müşteri Kaydı</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Müşteri portföyüne yeni bir kişi veya kurum ekleyin.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground">Ad Soyad / Firma</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" {...register("name")} placeholder="Ahmet Yılmaz" className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold" />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground">Telefon Numarası</Label>
              <div className="flex items-center h-14 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden focus-within:border-blue-500/30 transition-all">
                <span className="pl-5 pr-2 text-sm font-bold text-emerald-500/70 select-none">+90</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="5xx xxx xx xx"
                  className="flex-1 bg-transparent border-none outline-none pr-5 text-sm font-bold placeholder:text-muted-foreground/40"
                  value={phoneValue}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/[^0-9]/g, "");
                    if (raw.startsWith("90")) raw = raw.substring(2);
                    if (raw.startsWith("0")) raw = raw.substring(1);
                    const trimmed = raw.substring(0, 10);
                    let formatted = trimmed;
                    if (trimmed.length > 3 && trimmed.length <= 6) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3);
                    else if (trimmed.length > 6 && trimmed.length <= 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6);
                    else if (trimmed.length > 8) formatted = trimmed.slice(0, 3) + " " + trimmed.slice(3, 6) + " " + trimmed.slice(6, 8) + " " + trimmed.slice(8);
                    setPhoneValue(formatted);
                    setValue("phone", formatted);
                  }}
                />
              </div>
              {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phone.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-xs font-bold text-slate-500 tracking-[0.2em] ml-1">E-posta Adresi (Opsiyonel)</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <Input id="email" {...register("email")} placeholder="ahmet@email.com" className="h-14 bg-slate-900 border-white/5 rounded-2xl pl-12 text-sm font-bold focus:ring-0 focus:border-blue-500/30 transition-all" />
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900/50 border-t border-white/5">
            <DialogFooter className="gap-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-14 px-8 rounded-2xl font-bold text-slate-400">Vazgeç</Button>
              <Button type="submit" disabled={isPending} className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl gap-3">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                Müşteriyi Kaydet
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
