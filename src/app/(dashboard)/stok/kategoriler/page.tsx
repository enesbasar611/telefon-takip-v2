import { Package, Sparkles, Layers, PlusCircle, ChevronRight } from "lucide-react";
import { getAllCategories } from "@/lib/actions/category-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { CategoryManagementClient } from "@/components/product/category-management-client";

import { PageHeader } from "@/components/ui/page-header";

export default async function KategorilerPage() {
    const [categories, products] = await Promise.all([
        getAllCategories(),
        getProducts()
    ]);

    return (
        <div className="flex flex-col gap-10 pb-20">
            <PageHeader
                title="Kategori Yönetimi"
                description="Stok hiyerarşinizi ve ürün ağacınızı bu dinamik merkezden şekillendirin."
                icon={Layers}
                iconColor="text-indigo-500"
                iconBgColor="bg-indigo-500/10"
                badge={
                    <div className="bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm">
                        <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">STOK VARYANT AĞACI</span>
                    </div>
                }
            />

            {/* How-To Guide */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.02] p-6 space-y-4 shadow-sm backdrop-blur-sm">
                <h2 className="font-medium text-[11px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400" /> Stok Nasıl Eklenir? — 3 Yöntem
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Method 1 */}
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3 transition-colors hover:bg-violet-500/[0.08]">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center border border-violet-500/20 shadow-inner">
                                <Sparkles className="h-4 w-4 text-violet-500" />
                            </div>
                            <p className="text-[12px] font-bold text-violet-600 dark:text-violet-300">AI ile Kategori + Ürün</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Bu sayfada <span className="text-violet-600 dark:text-violet-300 font-semibold">&quot;AI ile Kategori + Ürün Ekle&quot;</span> butonuna tıklayın. Serbest metin yazın:
                        </p>
                        <div className="bg-zinc-100/80 dark:bg-black/30 rounded-lg px-3 py-2 text-[10px] text-muted-foreground font-mono leading-relaxed border border-zinc-200 dark:border-border/50 shadow-inner">
                            &quot;Şarj Aletleri &gt; Type-C &gt; 27W şarj aleti, 10 adet, alış 100 satış 500 TL, raf B-3&quot;
                        </div>
                        <p className="text-[10px] text-muted-foreground/80">→ Gemini hiyerarşiyi ve ürünleri otomatik oluşturur</p>
                    </div>

                    {/* Method 2 */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3 transition-colors hover:bg-blue-500/[0.08]">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                <Layers className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-[12px] font-bold text-blue-600 dark:text-blue-300">Toplu AI Stok Ekle</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <span className="text-blue-600 dark:text-blue-300 font-semibold">/stok</span> sayfasında <span className="text-blue-600 dark:text-blue-300 font-semibold">&quot;Toplu AI Stok Ekle&quot;</span> butonu:
                        </p>
                        <ol className="space-y-1.5 text-[10px] text-muted-foreground/80">
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" /> Çok ürün tek seferde tanımlayın</li>
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" /> Gemini listeyi ayrıştırır</li>
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" /> Tabloyu gözden geçirin &amp; kaydedin</li>
                        </ol>
                    </div>

                    {/* Method 3 */}
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-3 transition-colors hover:bg-indigo-500/[0.08]">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <PlusCircle className="h-4 w-4 text-indigo-500" />
                            </div>
                            <p className="text-[12px] font-bold text-indigo-600 dark:text-indigo-300">Manuel Tek Ürün</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <span className="text-indigo-600 dark:text-indigo-300 font-semibold">/stok</span> sayfasında <span className="text-indigo-600 dark:text-indigo-300 font-semibold">&quot;Yeni Ürün Ekle&quot;</span>:
                        </p>
                        <ol className="space-y-1.5 text-[10px] text-muted-foreground/80">
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" /> Kategori ağacından seçin</li>
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" /> Fiyat/stok/raf girin</li>
                            <li className="flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" /> <span className="text-violet-300">✨ AI ile Doldur</span> ile otomatik</li>
                        </ol>
                    </div>
                </div>
            </div>

            <CategoryManagementClient initialCategories={categories} products={products} />
        </div>
    );
}





