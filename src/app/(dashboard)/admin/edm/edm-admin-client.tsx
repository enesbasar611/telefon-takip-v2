"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Store, Zap, Loader2, CreditCard, Search, Settings,
    CheckCircle2, XCircle, ToggleLeft, ToggleRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    getShopsForEdmAdmin, getEdmBalanceForShop, setupEdmForShop
} from "@/lib/actions/superadmin-actions";

export function EdmAdminClient() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [setupShopId, setSetupShopId] = useState<string | null>(null);
    const [checkingBalance, setCheckingBalance] = useState<string | null>(null);

    const { data: shopsData, isLoading } = useQuery({
        queryKey: ["admin-edm-shops"],
        queryFn: async () => {
            const res = await getShopsForEdmAdmin();
            if (!res.success) throw new Error(res.error || "Bayiler yüklenemedi");
            return res.data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const shops = shopsData || [];
    const setupShop = shops.find((s: any) => s.id === setupShopId);

    const filtered = shops.filter((shop: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            shop.name.toLowerCase().includes(q) ||
            (shop.taxNumber || "").includes(q) ||
            (shop.companyName || "").toLowerCase().includes(q)
        );
    });

    const handleCheckBalance = async (shop: any) => {
        setCheckingBalance(shop.id);
        try {
            const res = await getEdmBalanceForShop(shop.id);
            if (res.success && res.data) {
                const data = res.data;
                toast.success(`${shop.name}: ${data.isEInvoice ? "e-Fatura" : "e-Arşiv"} - ${data.counterLeft ?? 0} kontör mevcut.`);
            } else {
                toast.error(res.error || "Sorgulama başarısız.");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setCheckingBalance(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Bayi adı, VKN veya unvan ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 rounded-xl"
                    />
                </div>
                <Badge variant="outline" className="rounded-lg">
                    {filtered.length} bayi
                </Badge>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[280px]">Bayi & Durum</TableHead>
                                <TableHead>VKN / Unvan</TableHead>
                                <TableHead>e-Fatura Durumu</TableHead>
                                <TableHead>Kontör</TableHead>
                                <TableHead className="text-right">Aksiyonlar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                                            <p className="text-xs text-muted-foreground">Bayiler yükleniyor...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="h-8 w-8 opacity-20" />
                                            <p>Eşleşen bayi bulunamadı.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((shop: any) => {
                                    const hasEdm = shop.edmSettings?.edmActive;
                                    return (
                                        <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${shop.isActive ? "bg-primary/10" : "bg-red-500/10"}`}>
                                                        <Store className={`h-5 w-5 ${shop.isActive ? "text-primary" : "text-red-500"}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-foreground truncate max-w-[180px]">{shop.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 font-medium">
                                                                {shop.industry}
                                                            </Badge>
                                                            <span className="text-[9px] font-mono text-muted-foreground opacity-50">#{shop.id.slice(-6)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[13px] font-bold text-foreground">{shop.taxNumber || "—"}</div>
                                                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{shop.companyName || shop.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {hasEdm ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs font-bold text-emerald-600">Aktif</span>
                                                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                                                            {shop.edmSettings?.senderVkn}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                        <span className="text-xs text-muted-foreground">Pasif</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1.5 rounded-xl text-xs"
                                                    onClick={() => handleCheckBalance(shop)}
                                                    disabled={checkingBalance === shop.id || !hasEdm}
                                                >
                                                    {checkingBalance === shop.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                    )}
                                                    Sorgula
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-9 px-3 rounded-xl gap-2 font-bold text-xs bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white transition-all"
                                                    onClick={() => setSetupShopId(shop.id)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    Ayarlar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Setup Modal */}
            <Dialog open={!!setupShopId} onOpenChange={(open) => !open && setSetupShopId(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>EDM Ayarları — {setupShop?.name}</DialogTitle>
                        <DialogDescription>
                            Bayinin e-Fatura entegrasyon ayarlarını düzenleyin.
                        </DialogDescription>
                    </DialogHeader>
                    {setupShop && <EdmSetupForm shop={setupShop} onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["admin-edm-shops"] });
                        setSetupShopId(null);
                    }} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function EdmSetupForm({ shop, onSuccess }: { shop: any; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: shop.edmSettings?.username || "",
        password: "",
        senderVkn: shop.edmSettings?.senderVkn || shop.taxNumber || "",
        senderName: shop.edmSettings?.senderName || shop.companyName || shop.name || "",
        senderAddress: shop.edmSettings?.senderAddress || "",
        senderCity: shop.edmSettings?.senderCity || "",
        senderDistrict: shop.edmSettings?.senderDistrict || "",
        senderTaxOffice: shop.edmSettings?.senderTaxOffice || "",
        environment: shop.edmSettings?.environment || "TEST",
        edmActive: shop.edmSettings?.edmActive || false,
    });

    // Sync form state if shop prop changes (e.g. after refetch)
    useEffect(() => {
        setForm({
            username: shop.edmSettings?.username || "",
            password: "",
            senderVkn: shop.edmSettings?.senderVkn || shop.taxNumber || "",
            senderName: shop.edmSettings?.senderName || shop.companyName || shop.name || "",
            senderAddress: shop.edmSettings?.senderAddress || "",
            senderCity: shop.edmSettings?.senderCity || "",
            senderDistrict: shop.edmSettings?.senderDistrict || "",
            senderTaxOffice: shop.edmSettings?.senderTaxOffice || "",
            environment: shop.edmSettings?.environment || "TEST",
            edmActive: shop.edmSettings?.edmActive || false,
        });
    }, [shop]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await setupEdmForShop(shop.id, {
                ...form,
                password: form.password || undefined,
            });
            if (res.success) {
                toast.success("EDM ayarları güncellendi.");
                onSuccess();
            } else {
                toast.error(res.error || "Güncelleme başarısız.");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 dark:bg-zinc-900/50 border border-border/50 rounded-xl">
                <div className="flex items-center gap-3">
                    {form.edmActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    <div>
                        <div className="font-medium text-foreground">e-Fatura Modülü</div>
                        <div className="text-xs text-muted-foreground">{form.edmActive ? "Aktif" : "Pasif"}</div>
                    </div>
                </div>
                <Switch
                    checked={form.edmActive}
                    onCheckedChange={(v) => setForm({ ...form, edmActive: v })}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>EDM Kullanıcı Adı</Label>
                    <Input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="basarteknik"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>EDM Şifresi</Label>
                    <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Değiştirmek için girin"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Gönderici VKN</Label>
                    <Input
                        value={form.senderVkn}
                        onChange={(e) => setForm({ ...form, senderVkn: e.target.value })}
                        placeholder="10 haneli VKN"
                        maxLength={10}
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Gönderici Ünvan</Label>
                    <Input
                        value={form.senderName}
                        onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                        placeholder="Firma ünvanı"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Adres</Label>
                    <Input
                        value={form.senderAddress}
                        onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
                        placeholder="Tam adres"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>İl</Label>
                    <Input
                        value={form.senderCity}
                        onChange={(e) => setForm({ ...form, senderCity: e.target.value })}
                        placeholder="İstanbul"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Input
                        value={form.senderDistrict}
                        onChange={(e) => setForm({ ...form, senderDistrict: e.target.value })}
                        placeholder="Kadıköy"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <Input
                        value={form.senderTaxOffice}
                        onChange={(e) => setForm({ ...form, senderTaxOffice: e.target.value })}
                        placeholder="Beyoğlu"
                        className="rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ortam</Label>
                    <select
                        value={form.environment}
                        onChange={(e) => setForm({ ...form, environment: e.target.value })}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                    >
                        <option value="TEST">TEST</option>
                        <option value="PRODUCTION">PRODUCTION</option>
                    </select>
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl"
            >
                {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</>
                ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Kaydet</>
                )}
            </Button>
        </form>
    );
}
