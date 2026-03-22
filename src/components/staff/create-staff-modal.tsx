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
import { PlusCircle, Loader2 } from "lucide-react";
import { createStaff } from "@/lib/actions/staff-actions";
import { useToast } from "@/hooks/use-toast";

const staffSchema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  role: z.enum(["ADMIN", "TECHNICIAN", "STAFF"]),
  commissionRate: z.string().min(1, "Komisyon oranı gereklidir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function CreateStaffModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
        role: "STAFF",
        commissionRate: "0",
    }
  });

  const onSubmit = async (data: StaffFormValues) => {
    startTransition(async () => {
      const result = await createStaff({
        ...data,
        commissionRate: Number(data.commissionRate)
      });
      if (result.success) {
        toast({ title: "Başarılı", description: "Personel başarıyla eklendi." });
        setOpen(false);
        reset();
      } else {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Yeni Personel Ekle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Yeni Personel Tanımla</DialogTitle>
            <DialogDescription>Sisteme yeni bir personel ve yetki seviyesi ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" {...register("name")} placeholder="Mehmet Demir" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta / Kullanıcı Adı</Label>
              <Input id="email" {...register("email")} placeholder="mehmet@basarteknik.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select onValueChange={(val) => setValue("role", val as any)} defaultValue="STAFF">
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TECHNICIAN">Teknisyen</SelectItem>
                    <SelectItem value="STAFF">Satış Temsilcisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Prim (%)</Label>
                <Input id="commissionRate" type="number" {...register("commissionRate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" {...register("password")} placeholder="••••••" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Personeli Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
