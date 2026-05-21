"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText, Plus, ExternalLink, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const today = format(new Date(), "d MMMM yyyy", { locale: tr });

const statusColors: Record<string, string> = {
  "Onaylandı": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Gönderildi": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "Hazırlanıyor": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "İptal Edildi": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Başarılı": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function EFaturaPage() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([
    {
      number: "EF-2026-001",
      customer: "Pera Elektronik",
      date: "15 Mayıs 2026",
      amount: "₺1.280,00",
      status: "Onaylandı",
      uuid: "ef-2026-001",
    },
    {
      number: "EF-2026-002",
      customer: "Moda Depo",
      date: "18 Mayıs 2026",
      amount: "₺4.590,00",
      status: "Gönderildi",
      uuid: "ef-2026-002",
    },
    {
      number: "EF-2026-003",
      customer: "Atlas Ticaret",
      date: "20 Mayıs 2026",
      amount: "₺9.150,00",
      status: "İptal Edildi",
      uuid: "ef-2026-003",
    },
  ]);

  const handleCreateInvoice = async () => {
    setLoading(true);
    const toastId = toast.loading("Test faturası oluşturuluyor...");

    try {
      const res = await fetch("/api/test/edm-invoice");
      const data = await res.json();

      if (data.success) {
        toast.success("Fatura başarıyla oluşturuldu ve EDM portalına gönderildi.", { id: toastId });

        // Listeye ekle (Simüle ediyoruz)
        const newInvoice = {
          number: data.details.invoiceId || `TST-${Date.now()}`,
          customer: "OSMAN HIZLI - TEST MUSTERI",
          date: today,
          amount: "₺2.700,00",
          status: "Başarılı",
          uuid: data.details.uuid,
        };

        setInvoices([newInvoice, ...invoices]);
      } else {
        toast.error(`Hata: ${data.error || "Fatura oluşturulamadı"}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Bağlantı hatası oluştu.", { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
      <PageHeader
        title="e-Fatura Merkezi"
        description="EDM entegrasyonu ile fatura süreçlerinizi yönetin, kontör takibi yapın ve belgelerinizi görüntüleyin."
        icon={FileText}
        badge={
          <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            Sandbox (Test) Modu
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kontör Kartı */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sky-500/5 transition-transform group-hover:scale-150 dark:bg-sky-500/10" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Kontör Bakiyesi</p>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">2.450</h3>
            <span className="text-sm font-medium text-slate-500">adet</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Yaklaşık 12 ay daha yeterli</p>
        </div>

        {/* Aylık Fatura Kartı */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150 dark:bg-emerald-500/10" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Aylık Gönderim</p>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">18</h3>
            <span className="text-sm font-medium text-slate-500">fatura</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Geçen aya göre %12 artış</p>
        </div>

        {/* Durum Kartı */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-150 dark:bg-amber-500/10" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Port Bağlantısı</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">EDM Aktif</h3>
          </div>
          <p className="mt-3 text-xs text-slate-500">Test (UBL 2.1) Hizmeti</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40">
            <div className="overflow-hidden rounded-[2.3rem]">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="py-5 pl-8 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fatura No</TableHead>
                    <TableHead className="py-5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alıcı</TableHead>
                    <TableHead className="py-5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Durum</TableHead>
                    <TableHead className="py-5 font-bold uppercase tracking-wider text-right text-slate-500 dark:text-slate-400">Tutar</TableHead>
                    <TableHead className="py-5 pr-8 font-bold uppercase tracking-wider text-right text-slate-500 dark:text-slate-400">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice, index) => (
                    <TableRow
                      key={invoice.uuid}
                      className={`group border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${index === 0 && loading ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {invoice.number}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{invoice.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 font-medium text-slate-700 dark:text-slate-300">{invoice.customer}</TableCell>
                      <TableCell className="py-5 text-center">
                        <Badge variant="outline" className={`rounded-full px-3 py-1 font-semibold border ${statusColors[invoice.status] || "bg-slate-100 text-slate-600"}`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-right font-black text-slate-950 dark:text-white">{invoice.amount}</TableCell>
                      <TableCell className="py-5 pr-8 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-9 w-9 rounded-full hover:bg-sky-500/10 hover:text-sky-600 dark:hover:bg-sky-500/20"
                          >
                            <a href={`/api/test/edm-view/${invoice.uuid}?format=html`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-9 w-9 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20"
                          >
                            <a href={`/api/test/edm-view/${invoice.uuid}?format=pdf`} target="_blank">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {/* Aksiyon Kutusu */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Plus className="h-4 w-4 text-sky-500" />
              Hızlı İşlem
            </h4>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={handleCreateInvoice}
                disabled={loading}
                className="group h-12 w-full rounded-2xl bg-slate-950 text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    Yeni e-Fatura Oluştur
                    <CheckCircle2 className="ml-2 h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                Toplu Fatura Gönder
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Destek & Yardım</h4>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-500/5 p-4 border border-amber-500/10">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700/80 dark:text-amber-500/70">
                Şu an sandbox modundasınız. Kesilen faturalar resmi geçerlilik taşımaz ve EDM test portalına düşer.
              </p>
            </div>
            <a
              href="https://test.edmbilisim.com.tr/EFaturaUI21ea"
              target="_blank"
              className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              EDM Test Portalına Git
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
