"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Save,
  X,
  Building2,
  UserCircle,
  Star,
  StickyNote,
  ArrowLeft,
  ShieldCheck,
  Zap,
  MoreVertical,
  Loader2
} from "lucide-react";
import { updateCustomer, getCustomerById } from "@/lib/actions/customer-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const customerSchema = z.object({
  name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz (5XXXXXXXXX)"),
  secondaryPhone: z.string().optional().or(z.literal("")),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  type: z.string().optional().or(z.literal("")),
  isVip: z.boolean().optional(),
  photo: z.string().optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      secondaryPhone: "",
      email: "",
      address: "",
      notes: "",
      type: "BIREYSEL",
      isVip: false,
      photo: "",
    },
  });

  useEffect(() => {
    async function loadCustomer() {
      const customer = await getCustomerById(params.id);
      if (customer) {
        form.reset({
          name: customer.name,
          phone: customer.phone,
          secondaryPhone: customer.secondaryPhone || "",
          email: customer.email || "",
          address: customer.address || "",
          notes: customer.notes || "",
          type: customer.type || "BIREYSEL",
          isVip: customer.isVip || false,
          photo: customer.photo || "",
        });
        setPhotoPreview(customer.photo || null);
      }
      setFetching(false);
    }
    loadCustomer();
  }, [params.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dosya boyutu 2MB'dan büyük olamaz");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        form.setValue("photo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue("photo", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function onSubmit(values: CustomerFormValues) {
    setLoading(true);
    try {
      const result = await updateCustomer(params.id, values);
      if (result.success) {
        toast.success("Müşteri profili güncellendi");
        router.push(`/musteriler/${params.id}`);
      } else {
        toast.error(result.error || "Güncelleme sırasında bir hata oluştu");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
     return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-amber-500" /></div>;
  }

  return (
    <div className="p-8 bg-[#0a0a0b] text-white min-h-screen space-y-8 animate-in fade-in duration-500">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto">
          {/* Top Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/5 text-gray-500 hover:text-white transition-all shadow-xl"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">Profil <span className="text-amber-500">Düzenleme</span></h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1 italic">CRM • Müşteri Kimlik Yönetimi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-black px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-amber-strong transition-all flex gap-3"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 stroke-[3px]" />}
                DEĞİŞİKLİKLERİ KAYDET
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="genel" className="w-full">
                <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-10 mb-8">
                  <TabsTrigger value="genel" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-400 px-0 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">TEMEL VERİLER</TabsTrigger>
                  <TabsTrigger value="ek" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-400 px-0 py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all">EK İLETİŞİM</TabsTrigger>
                </TabsList>

                <TabsContent value="genel" className="mt-0 outline-none">
                  <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian p-4">
                    <CardContent className="pt-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">MÜŞTERİ ADI SOYADI</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-amber-500 transition-colors" />
                                  <Input placeholder="Ahmet Yılmaz" {...field} className="bg-[#0a0a0b] border-white/5 h-14 pl-12 rounded-xl font-bold focus:ring-1 focus:ring-amber-500/20" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-black uppercase tracking-widest text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">MÜŞTERİ TİPİ</FormLabel>
                              <div className="flex gap-3 p-1.5 bg-[#0a0a0b] rounded-xl border border-white/5 h-14">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 gap-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                                    field.value === "BIREYSEL" ? "bg-amber-500 text-black shadow-amber-sm" : "text-gray-500 hover:text-white"
                                  )}
                                  onClick={() => field.onChange("BIREYSEL")}
                                >
                                  <UserCircle className="h-4 w-4" />
                                  BİREYSEL
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className={cn(
                                    "flex-1 gap-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                                    field.value === "KURUMSAL" ? "bg-amber-500 text-black shadow-amber-sm" : "text-gray-500 hover:text-white"
                                  )}
                                  onClick={() => field.onChange("KURUMSAL")}
                                >
                                  <Building2 className="h-4 w-4" />
                                  KURUMSAL
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">BİRİNCİL İLETİŞİM</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-amber-500 transition-colors z-10" />
                                  <IMaskInput
                                    mask="+90 (000) 000 00 00"
                                    definitions={{ '0': /[0-9]/ }}
                                    value={field.value}
                                    unmask={false}
                                    onAccept={(value) => field.onChange(value)}
                                    className="flex h-14 w-full rounded-xl border border-white/5 bg-[#0a0a0b] px-3 py-2 text-sm font-bold ring-offset-background placeholder:text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500/20 pl-12 transition-all"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">E-POSTA ADRESİ</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-amber-500 transition-colors" />
                                  <Input placeholder="example@domain.com" {...field} className="bg-[#0a0a0b] border-white/5 h-14 pl-12 rounded-xl font-bold focus:ring-1 focus:ring-amber-500/20" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">LOKASYON BİLGİSİ</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <MapPin className="absolute left-4 top-6 h-5 w-5 text-gray-700 group-focus-within:text-amber-500 transition-colors" />
                                <Textarea
                                  placeholder="Sokak, Mahalle ve Şehir bilgileri..."
                                  className="bg-[#0a0a0b] border-white/5 pl-12 min-h-[140px] rounded-[1.5rem] font-bold focus:ring-1 focus:ring-amber-500/20 py-5"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ek">
                  <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian p-4">
                    <CardContent className="pt-8 space-y-6">
                      <FormField
                        control={form.control}
                        name="secondaryPhone"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-600 font-black text-[10px] uppercase tracking-widest">YEDEK TELEFON</FormLabel>
                            <FormControl>
                                <div className="relative group">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-amber-500 transition-colors z-10" />
                                  <IMaskInput
                                    mask="+90 (000) 000 00 00"
                                    definitions={{ '0': /[0-9]/ }}
                                    value={field.value}
                                    unmask={false}
                                    onAccept={(value) => field.onChange(value)}
                                    className="flex h-14 w-full rounded-xl border border-white/5 bg-[#0a0a0b] px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-500/20 pl-12 transition-all"
                                  />
                                </div>
                            </FormControl>
                            <FormDescription className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic mt-2">Müşteriye ulaşılamadığında aranacak alternatif kanal.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-8">
              {/* Profile Photo Card */}
              <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian overflow-hidden">
                <CardHeader className="pb-4 flex flex-row items-center justify-between px-8 border-b border-white/[0.03] bg-white/[0.01]">
                  <CardTitle className="text-gray-600 font-black text-[10px] uppercase tracking-[0.2em]">PROFİL GÖRSELİ</CardTitle>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-10">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                  />
                  <div
                    className="h-40 w-40 rounded-[2.5rem] whisper-border border-white/10 flex items-center justify-center relative mb-6 group cursor-pointer hover:border-amber-500/50 transition-all overflow-hidden shadow-2xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Camera className="h-10 w-10 text-gray-700 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">YÜKLEME YAP</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest italic px-4 leading-relaxed">GÖRSEL TANIMA SİSTEMİ İÇİN PNG/JPG FORMATI ÖNERİLİR (MAX 2MB).</p>
                </CardContent>
              </Card>

              {/* VIP Status Card */}
              <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian p-2">
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="isVip"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                             "p-3 rounded-2xl transition-all shadow-xl",
                             field.value ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/10"
                          )}>
                            <Star className={cn("h-6 w-6", field.value && "fill-amber-500 animate-pulse")} />
                          </div>
                          <div>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-white">VIP ÜYELİK STATÜSÜ</FormLabel>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter mt-1 italic">Öncelikli Operasyon & İndirim</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-amber-500 h-7 w-12"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="bg-[#141416] border-white/5 shadow-2xl obsidian flex-1">
                <CardHeader className="pb-4 px-8 border-b border-white/[0.03] bg-white/[0.01]">
                   <div className="flex items-center gap-3">
                      <StickyNote className="h-4 w-4 text-amber-500 shadow-amber-sm" />
                      <CardTitle className="text-gray-600 font-black text-[10px] uppercase tracking-[0.2em]">STRATEJİK NOTLAR</CardTitle>
                   </div>
                </CardHeader>
                <CardContent className="p-8">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Teknik geçmiş, özel protokoller veya hatırlatmalar..."
                            className="bg-[#0a0a0b] border-white/5 min-h-[160px] rounded-2xl text-xs font-bold leading-relaxed focus:ring-1 focus:ring-amber-500/20 p-6 italic"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
