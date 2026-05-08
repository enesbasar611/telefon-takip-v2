import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Gavel, Users, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
    const lastUpdated = "8 Mayıs 2026";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] selection:bg-primary/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Import Font */}
            <style dangerouslySetInnerHTML={{
                __html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          html { scroll-behavior: smooth; }
        `
            }} />

            {/* Hero Section */}
            <header className="relative py-20 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(15,23,42,1),rgba(15,23,42,0.5))]" />
                <div className="container relative mx-auto px-6">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
                            Kullanıcı Sözleşmesi
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Başar Teknik ERP & Teknik Servis Takip sistemini kullanarak aşağıdaki şartları ve koşulları kabul etmiş sayılırsınız.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-semibold dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                                Hizmet Şartları
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 text-slate-500 dark:text-slate-500 text-xs">
                                Son Güncelleme: {lastUpdated}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Section */}
            <main className="container mx-auto px-6 py-20 pb-40">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Navigation/Sidebar */}
                    <aside className="lg:w-64 shrink-0 lg:sticky lg:top-8 h-fit space-y-8">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-all px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 w-full mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Giriş Ekranına Dön
                        </Link>
                        <nav className="flex flex-col gap-1">
                            <a href="#tanimlar" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Tanımlar</a>
                            <a href="#lisans" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Kullanım Lisansı</a>
                            <a href="#sorumluluk" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Sorumluluklar</a>
                            <a href="#servis" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Servis Sınırları</a>
                            <a href="#ucretlendirme" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Ücretlendirme</a>
                            <a href="#fesih" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Fesih</a>
                        </nav>
                    </aside>

                    {/* Main Articles */}
                    <div className="flex-1 max-w-4xl space-y-16">
                        <section id="tanimlar" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">1</span>
                                Tanımlar
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    <strong>Hizmet Sağlayıcı:</strong> Başar Teknik (Webfone bünyesinde) olarak anılacaktır.
                                </p>
                                <p>
                                    <strong>Kullanıcı:</strong> Sisteme kayıt olan ve servis takip altyapısını kullanan teknik servis işletmecisi veya yetkilisi.
                                </p>
                                <p>
                                    <strong>Sistem:</strong> https://basarteknik.tech adresi üzerinden sunulan bulut tabanlı ERP ve Teknik Servis Takip yazılımıdır.
                                </p>
                            </div>
                        </section>

                        <section id="lisans" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm">2</span>
                                Kullanım Lisansı ve Şartlar
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Sistem, teknik servis yönetimi amacıyla kullanıcıya özel bir lisansla sunulmaktadır. Kullanıcı aşağıdaki eylemlerde bulunmayacağını taahhüt eder:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Yazılımı kopyalamak, kaynak koduna erişmeye çalışmak veya tersine mühendislik yapmak.</li>
                                    <li>Sistemi yasa dışı faaliyetler veya spam amacıyla kullanmak.</li>
                                    <li>Kullanıcı hesaplarını üçüncü şahıslara kiralamak veya satmak.</li>
                                </ul>
                            </div>
                        </section>

                        <section id="sorumluluk" className="scroll-mt-20 p-8 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Users className="w-24 h-24" />
                            </div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm">3</span>
                                Kullanıcı Sorumlulukları
                            </h2>
                            <div className="space-y-4 relative z-10">
                                <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                                    <p className="text-sm">Müşteri verilerinin doğruluğu ve sisteme girilen içeriklerin yasal sorumluluğu tamamen Kullanıcıya aittir.</p>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                                    <p className="text-sm">Cihaz teslim ve iade süreçlerinde müşteriye verilen formların içeriği kullanıcı sorumluluğundadır.</p>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                                    <p className="text-sm">Şifre güvenliği ve Google OAuth hesabının erişim güvenliği kullanıcı tarafından sağlanmalıdır.</p>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                                    <p className="text-sm">Google Drive yedekleme özelliği kullanıldığında, yedeklenen verilerin yönetimi ve Drive hesabı güvenliği tamamen kullanıcının kendi Gmail hesabına aittir.</p>
                                </div>
                            </div>
                        </section>

                        <section id="servis" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-sm">4</span>
                                Servis Sınırları ve Garanti
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Başar Teknik, sistemin %99.9 çalışma süresini hedefler ancak teknik kesintiler, güncellemeler veya mücbir sebeplerden kaynaklanan veri kayıplarından dolayı doğrudan sorumlu tutulamaz.
                                </p>
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 flex gap-4">
                                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-400 m-0">
                                        Önemli finansal verileriniz için periyodik olarak dışa aktarım (Export) yaparak yedek almanız önerilir.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="fesih" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 text-sm">5</span>
                                Sözleşmenin Feshi
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Kullanım şartlarının ihlali durumunda Başar Teknik, kullanıcı hesabını askıya alma veya kalıcı olarak kapatma hakkını saklı tutar. Kullanıcı dilediği zaman sistemdeki verilerini silerek sözleşmeyi sonlandırabilir.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 py-12">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        &copy; {new Date().getFullYear()} Başar Teknik & Webfone. Tüm hakları saklıdır.
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                        <Link href="/privacy-policy" className="text-xs text-slate-400 hover:text-primary underline underline-offset-2">Gizlilik Politikası</Link>
                        <Link href="/login" className="text-xs text-slate-400 hover:text-primary">Giriş Yap</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
