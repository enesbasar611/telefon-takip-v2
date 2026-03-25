import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, AlertCircle, History, CalendarClock } from "lucide-react";
import { getDebts } from "@/lib/actions/debt-actions";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const debts = await getDebts();
  const totalOpenDebt = debts.reduce((sum: number, d: any) => sum + Number(d.remainingAmount), 0);
  const overdueCount = debts.filter((d: any) => d.dueDate && new Date(d.dueDate) < new Date() && !d.isPaid).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Veresiye ve Alacaklar</h1>
        <p className="text-muted-foreground">Müşterilerden gelen açık alacakları ve vade takiplerini yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Açık Alacak</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{totalOpenDebt.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geciken Tahsilatlar</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overdueCount}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Tahsil Edilen</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺0</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="bg-muted p-1 grid grid-cols-3 w-[450px]">
          <TabsTrigger value="open" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Açık Alacaklar
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Gecikenler
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Tahsilat Geçmişi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          <Card className="hover:shadow-md transition-shadow">
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
                    <TableHead className="text-right">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.filter((d: any) => !d.isPaid).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground uppercase tracking-widest font-medium bg-gray-50/50">Açık alacak kaydı bulunamadı.</TableCell>
                    </TableRow>
                  ) : (
                    debts.filter((d: any) => !d.isPaid).map((debt: any) => (
                      <TableRow key={debt.id} className="group">
                        <TableCell className="font-medium group-hover:text-primary transition-colors">
                          {debt.customer.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('tr-TR') : "-"}
                        </TableCell>
                        <TableCell>₺{Number(debt.amount).toLocaleString('tr-TR')}</TableCell>
                        <TableCell className="font-bold text-red-600">₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-[10px] uppercase tracking-widest">BEKLEMEDE</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
           <Card className="hover:shadow-md transition-shadow">
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {debts.filter((d: any) => d.dueDate && new Date(d.dueDate) < new Date() && !d.isPaid).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Gecikmiş ödeme bulunmuyor.</TableCell>
                            </TableRow>
                        ) : (
                            debts.filter((d: any) => d.dueDate && new Date(d.dueDate) < new Date() && !d.isPaid).map((debt: any) => (
                                <TableRow key={debt.id}>
                                    <TableCell className="font-bold">{debt.customer.name}</TableCell>
                                    <TableCell className="text-red-500 font-medium">{new Date(debt.dueDate).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="font-black">₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}</TableCell>
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
