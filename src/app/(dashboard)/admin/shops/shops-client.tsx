"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Store, Zap, ArrowRight, Code2, Users, Receipt, Calendar, Loader2
} from "lucide-react";
import { ConfigEditor } from "@/components/admin/config-editor";
import { impersonateShop } from "@/lib/actions/superadmin-actions";

export function ShopsClient({ initialShops }: { initialShops: any[] }) {
    const router = useRouter();
    const [shops, setShops] = useState(initialShops);
    const [activeShop, setActiveShop] = useState<any | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

    const handleImpersonate = async (shopId: string, shopName: string) => {
        if (!confirm(`Dikkat: "${shopName}" dükkanının kimliğine bürüneceksiniz. Kendi dükkanınıza dönmek için tekrar giriş yapmanız gerekebilir. Onaylıyor musunuz?`)) {
            return;
        }

        setImpersonatingId(shopId);
        const res = await impersonateShop(shopId);
        setImpersonatingId(null);

        if (res.success) {
            toast.success(`${shopName} kimliğine geçildi. Yönlendiriliyorsunuz...`);
            // Force a hard reload so NextAuth refetches the JWT completely
            window.location.href = "/dashboard";
        } else {
            toast.error(res.error);
        }
    };

    const handleEditConfig = (shop: any) => {
        setActiveShop(shop);
        setIsEditorOpen(true);
    };

    const handleSaved = () => {
        // Soft refresh to get new shop data
        router.refresh();
        setIsEditorOpen(false);
    };

    return (
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[300px]">Dükkan & Sektör</TableHead>
                            <TableHead>İstatistikler</TableHead>
                            <TableHead>Modüller</TableHead>
                            <TableHead>Kayıt Tarihi</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shops.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Sistemde henüz dükkan bulunmuyor.
                                </TableCell>
                            </TableRow>
                        )}
                        {shops.map((shop) => (
                            <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Store className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{shop.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Badge variant="outline" className="text-[10px] py-0 border-border/50">
                                                    {shop.industry}
                                                </Badge>
                                                <span className="font-mono text-[9px] opacity-50 ml-1">{shop.id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1" title="Kullanıcı Sayısı">
                                            <Users className="h-3 w-3" /> {shop._count.users}
                                        </div>
                                        <div className="flex items-center gap-1" title="Müşteri Sayısı">
                                            <Store className="h-3 w-3" /> {shop._count.customers}
                                        </div>
                                        <div className="flex items-center gap-1" title="Servis Kayıtları">
                                            <Receipt className="h-3 w-3" /> {shop._count.serviceTickets}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {shop.enabledModules.map((mod: string) => (
                                            <Badge key={mod} variant="secondary" className="text-[9px] py-0 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                                {mod}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(shop.createdAt).toLocaleDateString("tr-TR")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-lg gap-1 border-border/50"
                                            onClick={() => handleEditConfig(shop)}
                                        >
                                            <Code2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Config</span>
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 rounded-lg gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                                            onClick={() => handleImpersonate(shop.id, shop.name)}
                                            disabled={impersonatingId === shop.id}
                                        >
                                            {impersonatingId === shop.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            )}
                                            <span className="hidden sm:inline">Giriş Yap</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {activeShop && (
                <ConfigEditor
                    shop={activeShop}
                    open={isEditorOpen}
                    onOpenChange={setIsEditorOpen}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
