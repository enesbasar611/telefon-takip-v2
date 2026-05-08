import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Server, RefreshCw } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                            Gizlilik Politikası
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Verilerinizin güvenliği bizim için en yüksek önceliktir. Başar Teknik olarak, kişisel verilerinizin nasıl işlendiğini şeffaf bir şekilde paylaşıyoruz.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-semibold dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                                <Shield className="w-4 h-4" />
                                KVKK Uyumlu
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-semibold dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
                                <Lock className="w-4 h-4" />
                                Google OAuth Doğrulandı
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
                            <a href="#giris" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-l-2 border-transparent">Giriş ve Kapsam</a>
                            <a href="#google" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-l-2 border-transparent">Google Verileri</a>
                            <a href="#toplanan" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-l-2 border-transparent">Toplanan Veriler</a>
                            <a href="#paylasim" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-l-2 border-transparent">Veri Paylaşımı</a>
                            <a href="#guvenlik" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all border-l-2 border-transparent">Güvenlik</a>
                        </nav>
                    </aside>

                    {/* Main Articles */}
                    <div className="flex-1 max-w-4xl space-y-16">
                        <section id="giris" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">1</span>
                                Giriş ve Kapsam
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Bu Gizlilik Politikası, Başar Teknik ("biz", "bize" veya "bizim") tarafından işletilen <strong>https://basarteknik.tech</strong> adresi üzerinden sunulan hizmetlerimiz kapsamında kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
                                </p>
                                <p>
                                    Sistemimizi kullanarak, bu politikada belirtilen veri toplama ve kullanım uygulamalarını kabul etmiş sayılırsınız.
                                </p>
                            </div>
                        </section>

                        <section id="google" className="scroll-mt-20 p-8 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Shield className="w-24 h-24 text-blue-500 rotate-12" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 relative z-10">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm">2</span>
                                Google OAuth Verileri
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none relative z-10 text-slate-700 dark:text-slate-300">
                                <p className="font-medium text-slate-900 dark:text-white underline decoration-blue-500/30 underline-offset-4">
                                    Google Hesabı ile giriş yaparken erişilen veriler:
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                                    <li className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <div>
                                            <strong className="block text-slate-900 dark:text-white">Ad ve Soyad</strong>
                                            <span className="text-xs text-slate-500">Profil oluşturma ve kişiselleştirme için kullanılır.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                        <div>
                                            <strong className="block text-slate-900 dark:text-white">E-posta Adresi</strong>
                                            <span className="text-xs text-slate-500">Kullanıcı kimlik doğrulaması ve iletişim için kullanılır.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                        <div>
                                            <strong className="block text-slate-900 dark:text-white">Profil Fotoğrafı</strong>
                                            <span className="text-xs text-slate-500">Sadece uygulama içi profil görünümü için çekilir.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm border border-blue-500/10">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                        <div>
                                            <strong className="block text-slate-900 dark:text-white">Google Drive Erişimi</strong>
                                            <span className="text-xs text-slate-500">Yedekleme özelliği aktif edildiğinde, verileriniz şifreli olarak <strong>kendi Google Drive hesabınızda</strong> saklanır. Bu verilere biz erişemeyiz.</span>
                                        </div>
                                    </li>
                                </ul>
                                <div className="mt-6 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-emerald-500/20 flex items-center gap-4">
                                    <RefreshCw className="w-5 h-5 text-emerald-500" />
                                    <p className="text-sm m-0 italic">
                                        Google verileriniz <strong>sadece kimlik doğrulama ve kullanıcı tarafından onaylanan Drive yedeklemesi</strong> için kullanılır. Verileriniz asla reklam veya farklı amaçlarla işlenmez.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="toplanan" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">3</span>
                                Hizmet Kapsamında Toplanan Veriler
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Sistemi kullanırken oluşturduğunuz içerikler (ürün kayıtları, teknik servis formları, finansal veriler vb.) veritabanımızda güvenli bir şekilde saklanır. Bu veriler:
                                </p>
                                <ul>
                                    <li>Hizmetin sunulması ve yönetilmesi</li>
                                    <li>İşlem kayıtlarının tutulması</li>
                                    <li>Sistem hatalarının tespiti ve performans iyileştirmesi</li>
                                </ul>
                                <p>amaçlarıyla kullanılır.</p>
                            </div>
                        </section>

                        <section id="paylasim" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 text-sm">4</span>
                                Veri Paylaşımı ve Üçüncü Taraflar
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    <strong>Google Verileriniz Asla Satılmaz veya Paylaşılmaz.</strong>
                                </p>
                                <p>
                                    Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü taraf pazarlama şirketi veya veri komisyoncusu ile paylaşılmamaktadır. Sadece teknik altyapı hizmeti sağlayan iş ortaklarımız (sunucu sağlayıcıları vb.) ile hizmetin yürütülmesi için gerekli sınırlı veri paylaşımı yapılabilir.
                                </p>
                            </div>
                        </section>

                        <section id="guvenlik" className="scroll-mt-20">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 text-sm">5</span>
                                Veri Güvenliği ve Haklarınız
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p>
                                    Verileriniz KVKK (Kişisel Verilerin Korunması Kanunu) standartlarına uygun olarak şifrelenmiş protokoller (SSL/TLS) üzerinden iletilir ve korunur.
                                </p>
                                <p>
                                    Dilediğiniz zaman hesabınızı kapatma ve verilerinizin silinmesini talep etme hakkına sahipsiniz. Bunun için <strong>iletisim@basarteknik.tech</strong> adresine e-posta gönderebilirsiniz.
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
                        <Link href="/terms" className="text-xs text-slate-400 hover:text-primary underline underline-offset-2">Kullanım Koşulları</Link>
                        <Link href="/login" className="text-xs text-slate-400 hover:text-primary">Giriş Yap</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
