"use client";

import { useState, useTransition, ReactNode, useEffect } from "react";
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
import { PlusCircle, Loader2, User, Smartphone, Hash, AlertCircle, Banknote, SmartphoneIcon } from "lucide-react";
import { createServiceTicket } from "@/lib/actions/service-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/ui/phone-input";
import { PriceInput } from "@/components/ui/price-input";
import { formatCurrency } from "@/lib/utils";
import { findCustomerByPhone } from "@/lib/actions/customer-lookup-actions";
import { Mail } from "lucide-react";
import { ServiceReceiptModal } from "./service-receipt-modal";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .min(1, "Telefon numarası gereklidir")
    .refine((val) => {
      const d = val.replace(/\D/g, "");
      return d.length === 10 && d.startsWith("5");
    }, "Geçerli bir numara girin (5xx xxx xxxx)"),
  customerEmail: z.string().email("Geçerli bir mail adresi girin").optional().or(z.literal("")),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || (val.length === 15 && /^\d+$/.test(val)), {
      message: "IMEI numarası tam olarak 15 haneli rakamlardan oluşmalıdır"
    }),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  estimatedCost: z.string().refine((val) => !isNaN(Number(val)), "Geçerli bir sayı giriniz"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface CreateServiceModalProps {
  trigger?: ReactNode;
}

export function CreateServiceModal({ trigger }: CreateServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [phoneValue, setPhoneValue] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      estimatedCost: "0",
      customerEmail: "",
    }
  });

  // Auto-lookup customer when phone is entered
  useEffect(() => {
    const checkPhone = async () => {
      const sanitized = phoneValue.replace(/\D/g, "");
      if (sanitized.length === 10) {
        setIsLookingUp(true);
        try {
          const customer = await findCustomerByPhone(sanitized);
          if (customer) {
            setValue("customerName", customer.name);
            if (customer.email) {
              setValue("customerEmail", customer.email);
            }
            toast({
              title: "Müşteri Bulundu",
              description: `${customer.name} bilgileri otomatik dolduruldu.`,
              duration: 3000,
            });
          }
        } catch (error) {
          console.error("Lookup error:", error);
        } finally {
          setIsLookingUp(false);
        }
      }
    };

    const timeoutId = setTimeout(checkPhone, 500);
    return () => clearTimeout(timeoutId);
  }, [phoneValue, setValue, toast]);

  const onSubmit = async (data: ServiceFormValues) => {
    startTransition(async () => {
      const result = await createServiceTicket({
        ...data,
        estimatedCost: Number(data.estimatedCost),
      });

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Servis kaydı başarıyla oluşturuldu.",
        });
        setCreatedTicket(result.data);
        setShowReceipt(true);
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast({
          title: "Hata",
          description: result.error || "Kayıt oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Yeni Servis Kaydı</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background border-border/50 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-8 bg-card/50 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="font-medium text-2xl ">Yeni Servis Kaydı</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Müşteri ve cihaz bilgilerini girerek yeni bir teknik servis kaydı oluşturun.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="customerName" className="font-medium text-xs  text-muted-foreground">Müşteri Ad Soyad</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="customerName" {...register("customerName")} placeholder="Ali Yılmaz" className="h-14 bg-card border-border/50 rounded-2xl pl-12 text-sm " />
                </div>
                {errors.customerName && <p className="text-[10px] text-red-500  ml-1">{errors.customerName.message}</p>}
              </div>

              <PhoneInput
                label="Telefon Numarası"
                required
                value={phoneValue}
                isLookingUp={isLookingUp}
                error={errors.customerPhone?.message}
                onChange={(val: string) => {
                  setPhoneValue(val);
                  setValue("customerPhone", val);
                }}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="customerEmail" className="font-medium text-xs  text-muted-foreground">E-Posta Adresi (İsteğe Bağlı)</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="customerEmail" type="email" {...register("customerEmail")} placeholder="ornek@mail.com" className="h-14 bg-card border-border/50 rounded-2xl pl-12 text-sm " />
              </div>
              {errors.customerEmail && <p className="text-[10px] text-red-500  ml-1">{errors.customerEmail.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="deviceBrand" className="font-medium text-xs  text-muted-foreground">Cihaz Markası</Label>
                <div className="relative group">
                  <SmartphoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="deviceBrand" {...register("deviceBrand")} placeholder="Apple, Samsung..." className="h-14 bg-card border-border/50 rounded-2xl pl-12 text-sm " />
                </div>
                {errors.deviceBrand && <p className="text-[10px] text-red-500  ml-1">{errors.deviceBrand.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="deviceModel" className="font-medium text-xs  text-muted-foreground">Cihaz Modeli</Label>
                <Input id="deviceModel" {...register("deviceModel")} placeholder="iPhone 13, Galaxy S21..." className="h-14 bg-card border-border/50 rounded-2xl px-6 text-sm " />
                {errors.deviceModel && <p className="text-[10px] text-red-500  ml-1">{errors.deviceModel.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="imei" className="font-medium text-xs  text-muted-foreground">IMEI / Seri No</Label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="imei" {...register("imei")} placeholder="15 haneli IMEI" maxLength={15} className="h-14 bg-card border-border/50 rounded-2xl pl-12 text-sm " />
                </div>
                {errors.imei && <p className="text-[10px] text-red-500  ml-1">{errors.imei.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="estimatedCost" className="font-medium text-xs  text-muted-foreground">Tahmini Ücret</Label>
                <PriceInput
                  id="estimatedCost"
                  value={watch("estimatedCost")}
                  onChange={(v) => setValue("estimatedCost", String(v), { shouldValidate: true })}
                  placeholder="0,00"
                  className="h-14 bg-card border-border/50 rounded-2xl pl-10 text-sm  transition-all tabular-nums text-emerald-500"
                />
                {errors.estimatedCost && <p className="text-[10px] text-red-500  ml-1">{errors.estimatedCost.message}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="problemDesc" className="font-medium text-xs  text-muted-foreground">Arıza Tanımı</Label>
              <div className="relative group">
                <AlertCircle className="absolute left-4 top-5 h-4 w-4 text-muted-foreground" />
                <Input id="problemDesc" {...register("problemDesc")} placeholder="Ekran kırık, şarj almıyor..." className="h-14 bg-card border-border/50 rounded-2xl pl-12 text-sm " />
              </div>
              {errors.problemDesc && <p className="text-[10px] text-red-500  ml-1">{errors.problemDesc.message}</p>}
            </div>
          </div>

          <div className="p-8 bg-card/50 border-t border-border/50">
            <DialogFooter className="gap-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="h-14 px-8 rounded-2xl  text-muted-foreground">Vazgeç</Button>
              <Button type="submit" disabled={isPending} className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white  text-sm rounded-2xl gap-3 transition-all active:scale-95">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                Kaydı Tamamla
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>

      {createdTicket && (
        <ServiceReceiptModal
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setCreatedTicket(null);
          }}
          ticket={createdTicket}
        />
      )}
    </Dialog>
  );
}





