import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package } from "lucide-react";
import { serializePrisma } from "@/lib/utils";
import { getTopSellingProducts } from "@/lib/actions/dashboard-actions";

export async function TopProductsStream() {
    const topProductsRaw = await getTopSellingProducts();
    const topProducts = serializePrisma(topProductsRaw);

    return (
        <Card className="border border-border/40 shadow-xl overflow-hidden rounded-[2.5rem] bg-card mt-2 transition-all duration-500 animate-in fade-in duration-1000">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight font-sans uppercase">Trend Ürünler</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">En Çok Tercih Edilenler</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {(topProducts ?? []).map((product: any) => (
                        <div key={product.id} className="group relative bg-muted/10 p-5 rounded-[1.8rem] border border-transparent hover:border-primary/10 transition-all">
                            <div className="aspect-square rounded-[1.5rem] bg-card border border-border/40 flex items-center justify-center mb-5 relative overflow-hidden group-hover:shadow-lg transition-all">
                                <Package className="h-14 w-14 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                {product.stock <= product.criticalStock && (
                                    <div className="absolute top-4 left-4 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg">KRİTİK STOK</div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="min-h-[44px]">
                                    <h4 className="font-black text-sm text-foreground tracking-tight line-clamp-2 uppercase font-sans leading-tight">{product.name}</h4>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-70">{product.category}</p>
                                </div>
                                <div className="flex items-end justify-between pt-2 border-t border-border/20">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Birim Fiyat</span>
                                        <span className="text-xl font-black text-blue-500 tracking-tighter">₺{product.price.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-1">Satış</span>
                                        <span className="text-xs font-black text-foreground">{product.sales} ADET</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
