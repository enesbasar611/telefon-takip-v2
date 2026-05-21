import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const today = format(new Date(), "d MMMM yyyy", { locale: tr });

const statusClasses: Record<string, string> = {
  "Onaylandı": "bg-emerald-500/10 text-emerald-700",
  "Gönderildi": "bg-sky-500/10 text-sky-700",
  "Hazırlanıyor": "bg-amber-500/10 text-amber-700",
  "İptal Edildi": "bg-rose-500/10 text-rose-700",
};

const invoiceCards = [
  {
    title: "Kalan Kontör Bakiyesi",
    value: "2.450",
    note: "Fatura oluşturmak için kullanılabilir",
  },
  {
    title: "Bu Ay Kesilen Fatura",
    value: "18",
    note: "Sandbox ortamında oluşturuldu",
  },
  {
    title: "Mod Durumu",
    value: "TEST (Sandbox)",
    note: "Gerçek e-Fatura işlemi için henüz canlı değil",
  },
];

const invoiceRows = [
  {
    number: "EF-2026-001",
    customer: "Pera Elektronik",
    date: "15 Mayıs 2026",
    amount: "₺1.280,00",
    status: "Onaylandı",
    link: "/api/test/edm-view/ef-2026-001",
  },
  {
    number: "EF-2026-002",
    customer: "Moda Depo",
    date: "18 Mayıs 2026",
    amount: "₺4.590,00",
    status: "Gönderildi",
    link: "/api/test/edm-view/ef-2026-002",
  },
  {
    number: "EF-2026-003",
    customer: "Atlas Ticaret",
    date: "20 Mayıs 2026",
    amount: "₺9.150,00",
    status: "İptal Edildi",
    link: "/api/test/edm-view/ef-2026-003",
  },
];

export default function EFaturaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="e-Fatura"
        description={
          <span className="text-muted-foreground">
            Test modunda e-Fatura yönetimi. Apple tarzı premium arayüzle fatura kullanımınızı takip edin.
          </span>
        }
        icon={FileText}
        badge={
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-sm">
            Sandbox Modu
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <div className="rounded-[1.75rem] bg-slate-950/95 p-6 text-white shadow-xl ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">e-Fatura Genel Bakış</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Kullanıma Hazır</h2>
                </div>
                <div className="rounded-3xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10">
                  {today}
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Fatura kesme, kontör takibi ve belge görüntüleme işlemleriniz için sade, modern ve test ortamına uygun bir gösterge panosu.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {invoiceCards.map((card) => (
                <div key={card.title} className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{card.title}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Son İşlemler</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Kesilmiş faturalarınız burada</h3>
                </div>
                <Button variant="outline" size="sm" className="rounded-full px-5">
                  Detaylı Raporu Gör
                </Button>
              </div>
              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Fatura No</th>
                      <th className="px-5 py-4 font-semibold">Müşteri</th>
                      <th className="px-5 py-4 font-semibold">Tarih</th>
                      <th className="px-5 py-4 font-semibold text-right">Tutar</th>
                      <th className="px-5 py-4 font-semibold">Durum</th>
                      <th className="px-5 py-4 font-semibold text-right">Biçim</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {invoiceRows.map((invoice) => (
                      <tr key={invoice.number} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{invoice.number}</td>
                        <td className="px-5 py-4">{invoice.customer}</td>
                        <td className="px-5 py-4">{invoice.date}</td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-900">{invoice.amount}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[invoice.status] || "bg-slate-100 text-slate-700"}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <a
                            href={`${invoice.link}?format=html`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-slate-100"
                          >
                            HTML
                          </a>
                          <a
                            href={`${invoice.link}?format=pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
                          >
                            PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Sandbox Durumu</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">Test Modu Etkin</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bu sayfa gerçek faturalar yerine test verileriyle çalışır. Üst düzey güvenlik ve ön izleme deneyimi için tasarlandı.
            </p>
            <div className="mt-5 rounded-[1.75rem] bg-slate-950/95 p-4 text-white shadow-lg ring-1 ring-white/10">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300">Entegrasyon Durumu</p>
              <p className="mt-3 text-2xl font-semibold">Hazır</p>
              <p className="mt-2 text-sm text-slate-300">Mock EDM fatura önizlemeleri anında tekrar kullanılabilir.</p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">En Son Fatura</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">EF-2026-003</p>
                <p className="mt-1 text-xs text-slate-500">Atlas Ticaret • 20 Mayıs 2026</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">EF-2026-002</p>
                <p className="mt-1 text-xs text-slate-500">Moda Depo • 18 Mayıs 2026</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Hızlı İşlem</p>
            <div className="mt-5 grid gap-3">
              <Button variant="secondary" size="default" className="rounded-full">
                Yeni e-Fatura Oluştur
              </Button>
              <Button variant="outline" size="default" className="rounded-full">
                E-Defter & Raporlar
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
