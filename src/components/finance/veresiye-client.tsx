"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, AlertCircle, History, CalendarClock, TrendingDown, CheckCircle2 } from "lucide-react";
import { collectDebtPayment } from "@/lib/actions/debt-actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type Debt = {
    id: string;
    amount: number;
    remainingAmount: number;
    dueDate?: string | null;
    isPaid: boolean;
    notes?: string | null;
    customer: { id: string; name: string; phone?: string };
};

function PayButton({ debt }: { debt: Debt }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(String(debt.remainingAmount));
    const [isPending, startTransition] = useTransition();

    const handlePay = () => {
        const payAmt = parseFloat(amount);
        if (!payAmt || payAmt <= 0) { toast.error("Geçerli bir tutar girin."); return; }
        if (payAmt > Number(debt.remainingAmount)) { toast.error("Ödeme tutarı kalan borçtan fazla olamaz."); return; }
        startTransition(async () => {
            const result = await collectDebtPayment(debt.id, payAmt);
            if (result.success) {
                toast.success(`₺${payAmt.toLocaleString('tr-TR')} tahsilat kaydedildi.`);
                setOpen(false);
            } else {
                toast.error(result.error || "İşlem başarısız.");
            }
        });
    };

    return (
        <>
            <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-8 px-4 rounded-xl"
            >
                Ödeme Al
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tahsilat Ekle</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-bold text-foreground">{debt.customer.name}</span> — Kalan Borç: ₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground">Tahsilat Tutarı (₺)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={1}
                            max={Number(debt.remainingAmount)}
                            className="h-12 text-lg font-bold rounded-xl"
                        />
                    </div>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <Button
                            onClick={handlePay}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                            {isPending ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function VeresiyeClient({
    debts,
    thisMonthCollected,
}: {
    debts: Debt[];
    thisMonthCollected: number;
}) {
    const openDebts = debts.filter((d) => !d.isPaid);
    const overdueDebts = debts.filter(
        (d) => d.dueDate && new Date(d.dueDate) < new Date() && !d.isPaid
    );
    const paidDebts = debts.filter((d) => d.isPaid);
    const totalOpenDebt = openDebts.reduce((s, d) => s + Number(d.remainingAmount), 0);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold">Veresiye ve Alacaklar</h1>
                <p className="text-muted-foreground text-sm mt-1">Müşterilerden gelen açık alacakları ve vade takiplerini yönetin.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Açık Alacak</CardTitle>
                        <CreditCard className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₺{totalOpenDebt.toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{openDebts.length} açık kayıt</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Geciken Tahsilatlar</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{overdueDebts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Vadesi geçmiş kayıt</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Ay Tahsil Edilen</CardTitle>
                        <Wallet className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₺{thisMonthCollected.toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Fiili tahsilat</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="open" className="w-full">
                <TabsList className="bg-muted p-1 grid grid-cols-3 w-[450px]">
                    <TabsTrigger value="open" className="gap-2">
                        <CalendarClock className="h-4 w-4" /> Açık Alacaklar
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="gap-2">
                        <TrendingDown className="h-4 w-4" /> Gecikenler
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" /> Tahsilat Geçmişi
                    </TabsTrigger>
                </TabsList>

                {/* Açık Alacaklar */}
                <TabsContent value="open" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alacak Listesi</CardTitle>
                            <CardDescription>Müşteri bazlı açık hesaplar ve ödeme durumları.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Müşteri</TableHead>
                                        <TableHead>Vade Tarihi</TableHead>
                                        <TableHead>Toplam Borç</TableHead>
                                        <TableHead>Kalan Alacak</TableHead>
                                        <TableHead className="text-right">Aksiyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {openDebts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/40" />
                                                Açık alacak kaydı bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        openDebts.map((debt) => (
                                            <TableRow key={debt.id} className="group">
                                                <TableCell className="font-medium group-hover:text-primary transition-colors">
                                                    {debt.customer.name}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('tr-TR') : "—"}
                                                </TableCell>
                                                <TableCell>₺{Number(debt.amount).toLocaleString('tr-TR')}</TableCell>
                                                <TableCell className="font-bold text-red-600">
                                                    ₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <PayButton debt={debt} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gecikenler */}
                <TabsContent value="overdue" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vadesi Geçenler</CardTitle>
                            <CardDescription>Ödeme tarihi üzerinden süre geçmiş alacaklar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Müşteri</TableHead>
                                        <TableHead>Vade Tarihi</TableHead>
                                        <TableHead>Kalan Borç</TableHead>
                                        <TableHead className="text-right">Aksiyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overdueDebts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Gecikmiş ödeme bulunmuyor.</TableCell>
                                        </TableRow>
                                    ) : (
                                        overdueDebts.map((debt) => (
                                            <TableRow key={debt.id}>
                                                <TableCell className="font-bold">{debt.customer.name}</TableCell>
                                                <TableCell className="text-red-500 font-medium">
                                                    {new Date(debt.dueDate!).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell className="font-bold text-red-600">₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}</TableCell>
                                                <TableCell className="text-right">
                                                    <PayButton debt={debt} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tahsilat Geçmişi */}
                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tahsilat Geçmişi</CardTitle>
                            <CardDescription>Ödenmiş alacak kayıtları.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Müşteri</TableHead>
                                        <TableHead>Toplam Borç</TableHead>
                                        <TableHead className="text-right">Durum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paidDebts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Henüz tahsil edilen alacak yok.</TableCell>
                                        </TableRow>
                                    ) : (
                                        paidDebts.map((debt) => (
                                            <TableRow key={debt.id}>
                                                <TableCell className="font-medium">{debt.customer.name}</TableCell>
                                                <TableCell>₺{Number(debt.amount).toLocaleString('tr-TR')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">
                                                        TAHSİL EDİLDİ
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
