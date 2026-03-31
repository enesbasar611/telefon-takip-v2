"use client";

import { useState, useRef } from "react";
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
  StickyNote
} from "lucide-react";
import { createCustomer } from "@/lib/actions/customer-actions";
import { toast } from "sonner";

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

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      const result = await createCustomer(values);
      if (result.success) {
        toast.success("Müşteri başarıyla oluşturuldu");
        router.push("/musteriler");
      } else {
        toast.error(result.error || "Müşteri oluşturulurken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-background text-white min-h-screen">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Yeni Müşteri Kaydı</h1>
              <p className="text-gray-500 text-sm mt-1">Sistem için yeni bir teknik servis ortağı veya bireysel müşteri tanımlayın.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => router.back()}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold flex gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="genel" className="w-full">
                <TabsList className="bg-card border border-white/5 p-1 mb-6">
                  <TabsTrigger value="genel" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">Genel Bilgiler</TabsTrigger>
                  <TabsTrigger value="ek" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">Ek Detaylar</TabsTrigger>
                </TabsList>

                <TabsContent value="genel" className="mt-0">
                  <Card className="bg-card border-none shadow-sm p-2">
                    <CardContent className="pt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-500 font-bold text-[10px]">MÜŞTERİ ADI SOYADI</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                  <Input placeholder="Örn: Ahmet Yılmaz" {...field} className="bg-background border-white/5 pl-10 focus:ring-blue-600" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-500 font-bold text-[10px]">MÜŞTERİ TİPİ</FormLabel>
                              <div className="flex gap-2 p-1 bg-background rounded-lg border border-white/5">
                                <Button
                                  type="button"
                                  variant={field.value === "BIREYSEL" ? "secondary" : "ghost"}
                                  className={`flex-1 gap-2 text-xs font-bold ${field.value === "BIREYSEL" ? "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20" : "text-gray-500"}`}
                                  onClick={() => field.onChange("BIREYSEL")}
                                >
                                  <UserCircle className="h-4 w-4" />
                                  Bireysel
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "KURUMSAL" ? "secondary" : "ghost"}
                                  className={`flex-1 gap-2 text-xs font-bold ${field.value === "KURUMSAL" ? "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20" : "text-gray-500"}`}
                                  onClick={() => field.onChange("KURUMSAL")}
                                >
                                  <Building2 className="h-4 w-4" />
                                  Kurumsal
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
                            <FormItem>
                              <FormLabel className="text-gray-500 font-bold text-[10px]">TELEFON NUMARASI</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 z-10" />
                                  <IMaskInput
                                    mask="+90 (000) 000 00 00"
                                    definitions={{
                                      '0': /[0-9]/
                                    }}
                                    value={field.value}
                                    unmask={false}
                                    onAccept={(value) => field.onChange(value)}
                                    placeholder="+90 (5__) ___ __ __"
                                    className="flex h-10 w-full rounded-md border border-white/5 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
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
                            <FormItem>
                              <FormLabel className="text-gray-500 font-bold text-[10px]">E-POSTA ADRESİ</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                  <Input placeholder="example@domain.com" {...field} className="bg-background border-white/5 pl-10 focus:ring-blue-600" />
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
                          <FormItem>
                            <FormLabel className="text-gray-400 font-bold text-xs ml-1">ADRES BİLGİSİ</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Textarea
                                  placeholder="Sokak, Mahalle, Kat/Daire ve Şehir bilgileri..."
                                  className="bg-background border-white/5 pl-10 min-h-[100px] focus:ring-blue-600"
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
                  <Card className="bg-card border-none shadow-sm p-2">
                    <CardContent className="pt-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="secondaryPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 font-bold text-xs ml-1">YEDEK TELEFON</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 z-10" />
                                <IMaskInput
                                  mask="+90 (000) 000 00 00"
                                  definitions={{
                                    '0': /[0-9]/
                                  }}
                                  value={field.value}
                                  unmask={true}
                                  onAccept={(value) => {
                                    let pure = value.replace(/\D/g, "");
                                    if (pure.startsWith("90")) pure = pure.substring(2);
                                    field.onChange(pure);
                                  }}
                                  placeholder="+90 (5__) ___ __ __"
                                  className="flex h-11 w-full rounded-md border border-white/5 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-gray-600 text-xs font-bold">Müşteriye ulaşılamadığında aranacak ikincil numara.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              {/* Profile Photo Card */}
              <Card className="bg-card border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between px-6">
                  <CardTitle className="text-gray-500 font-bold text-[10px]">MÜŞTERİ FOTOĞRAFI</CardTitle>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-rose-500 hover:bg-rose-500/10"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                  />
                  <div
                    className="h-32 w-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center relative mb-4 group cursor-pointer hover:border-blue-500/50 transition-colors overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-gray-700 group-hover:text-blue-500" />
                        <div className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full border-4 border-[#141416]">
                          <PlusIcon className="h-3 w-3 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 text-center px-4">JPG veya PNG, max. 2MB. Kimlik tanıma için önerilir.</p>
                </CardContent>
              </Card>

              {/* VIP Status Card */}
              <Card className="bg-card border-none shadow-sm">
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="isVip"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${field.value ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            <Star className={`h-5 w-5 ${field.value ? 'fill-blue-500' : ''}`} />
                          </div>
                          <div>
                            <FormLabel className="text-sm font-bold block">VIP Müşteri</FormLabel>
                            <p className="text-[10px] text-gray-500 font-medium">Öncelikli servis ve indirim</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="bg-card border-none shadow-sm h-full">
                <CardHeader className="pb-2 flex flex-row items-center gap-2">
                  <StickyNote className="h-4 w-4 text-gray-500" />
                  <CardTitle className="text-gray-500 font-bold text-[10px]">ÖZEL NOTLAR</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Teknik geçmiş, özel istekler veya hatırlatmalar..."
                            className="bg-background border-white/5 min-h-[150px] text-sm focus:ring-blue-600"
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
