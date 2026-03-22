import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Landmark } from "lucide-react";
import { getTransactions, getFinancialSummary } from "@/lib/actions/finance-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const transactions = await getTransactions();
  const summary = await getFinancialSummary();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finansal Yönetim</h1>
        <p className="text-muted-foreground">İşletmenizin gelir, gider ve kasa durumunu takip edin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{summary.totalIncome.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{summary.totalExpense.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kasa (Nakit)</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₺{summary.cashBalance.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banka / POS</CardTitle>
            <Landmark className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₺{summary.bankBalance.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Son Hareketler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Ödeme Tipi</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium uppercase tracking-widest bg-gray-50/50">Henüz finansal hareket bulunmuyor.</TableCell>
                </TableRow>
              ) : (
                transactions.map((t: any) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {format(new Date(t.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {t.paymentMethod === 'CASH' ? 'NAKİT' : t.paymentMethod === 'CARD' ? 'KART' : 'HAVALE'}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.user?.name || 'Sistem'}</TableCell>
                    <TableCell className={`text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
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
