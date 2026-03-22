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
import { createManualTransaction } from "@/lib/actions/finance-actions";
import { useToast } from "@/hooks/use-toast";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().min(1, "Tutar gereklidir"),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function CreateTransactionModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
        type: "INCOME",
        paymentMethod: "CASH",
    }
  });

  const onSubmit = async (data: TransactionFormValues) => {
    startTransition(async () => {
      const result = await createManualTransaction({
        ...data,
        amount: Number(data.amount)
      });
      if (result.success) {
        toast({ title: "Başarılı", description: "İşlem kaydedildi." });
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
          <span>Yeni İşlem Ekle</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Yeni Finansal Hareket</DialogTitle>
            <DialogDescription>Gelir veya gider kaydı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>İşlem Tipi</Label>
                <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="INCOME">
                    <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="INCOME">Gelir (+)</SelectItem>
                    <SelectItem value="EXPENSE">Gider (-)</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="amount">Tutar (₺)</Label>
                <Input id="amount" type="number" {...register("amount")} placeholder="0.00" />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input id="description" {...register("description")} placeholder="Kira Ödemesi, Aksesuar Satışı vb." />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Ödeme Yöntemi</Label>
              <Select onValueChange={(val) => setValue("paymentMethod", val as any)} defaultValue="CASH">
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CARD">Kredi Kartı / POS</SelectItem>
                  <SelectItem value="TRANSFER">Havale / EFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Vazgeç</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İşlemi Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
