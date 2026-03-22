import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, AlertCircle, TrendingDown } from "lucide-react";
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
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geciken Tahsilatlar</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{overdueCount}</div>
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
              {debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground uppercase tracking-widest font-medium bg-gray-50/50">Açık alacak kaydı bulunamadı.</TableCell>
                </TableRow>
              ) : (
                debts.map((debt: any) => (
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
                      {debt.isPaid ? (
                        <Badge className="bg-green-100 text-green-800 border-none font-bold text-[10px] uppercase">ÖDENDİ</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-none font-bold text-[10px] uppercase">BEKLEMEDE</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
