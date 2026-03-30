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
import { PlusCircle, Loader2, Landmark, Wallet, CreditCard, ArrowRightLeft } from "lucide-react";
import { createManualTransaction } from "@/lib/actions/finance-actions";
import { toast } from "sonner";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().min(1, "Tutar gereklidir"),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
  accountId: z.string().min(1, "Hesap seçimi gereklidir"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function CreateTransactionModal({ accounts }: { accounts: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "INCOME",
      paymentMethod: "CASH",
      accountId: accounts?.[0]?.id || "",
    }
  });

  const onSubmit = async (data: TransactionFormValues) => {
    startTransition(async () => {
      const result = await createManualTransaction({
        ...data,
        amount: Number(data.amount)
      });
      if (result.success) {
        toast.success("İşlem başarıyla kaydedildi.");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK': return <Landmark className="h-3 w-3" />;
      case 'POS': return <ArrowRightLeft className="h-3 w-3" />;
      case 'CREDIT_CARD': return <CreditCard className="h-3 w-3" />;
      default: return <Wallet className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-blue-500/20 gap-2 h-10 px-5 text-xs font-bold">
          <PlusCircle className="h-4 w-4" />
          <span>YENİ İŞLEM EKLE</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-blue-600" />
        <form onSubmit={handleSubmit(onSubmit)} className="p-10">
          <DialogHeader className="mb-8 p-0 text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <PlusCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Yeni Finansal Hareket</DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                  Gelir/Gider Kayıt Sistemi
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">İŞLEM TİPİ</Label>
                <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="INCOME">
                  <SelectTrigger className="h-14 rounded-[1.5rem] bg-muted/20 border-border/40 font-black text-xs shadow-inner">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[1.5rem] border-border/40 bg-background/95 backdrop-blur-xl p-2">
                    <SelectItem value="INCOME" className="text-emerald-500 font-black text-xs rounded-xl py-3">GELİR (+)</SelectItem>
                    <SelectItem value="EXPENSE" className="text-rose-500 font-black text-xs rounded-xl py-3">GİDER (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">TUTAR (₺)</Label>
                <Input id="amount" type="number" {...register("amount")} placeholder="0.00" className="h-14 rounded-[1.5rem] bg-muted/20 border-border/40 font-black text-lg pl-6 shadow-inner" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">HESAP SEÇİMİ</Label>
              <Select onValueChange={(val) => setValue("accountId", val)} defaultValue={accounts?.[0]?.id}>
                <SelectTrigger className="h-14 rounded-[1.5rem] bg-muted/20 border-border/40 font-black text-xs shadow-inner">
                  <SelectValue placeholder="Hesap seçiniz" />
                </SelectTrigger>
                <SelectContent className="rounded-[1.5rem] border-border/40 bg-background/95 backdrop-blur-xl p-2">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-xl py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[250px]">
                        <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shadow-sm">
                          {getAccountIcon(acc.type)}
                        </div>
                        <span className="font-extrabold text-xs">{acc.name}</span>
                        <span className="text-[11px] font-black text-muted-foreground/60 ml-auto italic">₺{Number(acc.balance).toLocaleString('tr-TR')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">AÇIKLAMA</Label>
              <Input id="description" {...register("description")} placeholder="İşlem detayını yazın..." className="h-14 rounded-[1.5rem] bg-muted/20 border-border/40 font-black text-xs px-6 shadow-inner" />
              {errors.description && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.description.message}</p>}
            </div>

            <div className="space-y-4">
              <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">ÖDEME YÖNTEMİ</Label>
              <Select onValueChange={(val) => setValue("paymentMethod", val as any)} defaultValue="CASH">
                <SelectTrigger className="h-14 rounded-[1.5rem] bg-muted/20 border-border/40 font-black text-xs shadow-inner">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent className="rounded-[1.5rem] border-border/40 bg-background/95 backdrop-blur-xl p-2">
                  <SelectItem value="CASH" className="text-xs font-black rounded-xl py-3">NAKİT</SelectItem>
                  <SelectItem value="CARD" className="text-xs font-black rounded-xl py-3">KREDİ KARTI / POS</SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs font-black rounded-xl py-3">HAVALE / EFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="flex-1 h-14 rounded-[1.5rem] text-xs font-black uppercase tracking-widest border border-border/40 hover:bg-muted transition-all">VAZGEÇ</Button>
            <Button type="submit" disabled={isPending} className="flex-[2] h-14 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 transition-all text-white">
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "İŞLEMİ KAYDET VE EKLE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

