import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTransactions, getFinanceSummary } from "@/lib/actions/finance-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Banknote, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function FinansPage() {
  const transactions = await getTransactions();
  const summary = await getFinanceSummary();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finans Yönetimi</h1>
        <p className="text-muted-foreground">Gelir, gider ve kasa durumunu takip edin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{summary.totalIncome.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{summary.totalExpense.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Kasa</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{summary.balance.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Alacaklar</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">₺0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Açıklama</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Ödeme Yöntemi</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Henüz bir işlem kaydı yok.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "INCOME" ? "success" : "destructive"} className="capitalize">
                        {t.type === "INCOME" ? "Gelir" : "Gider"}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.paymentMethod}</TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(t.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "INCOME" ? "+" : "-"} ₺{Number(t.amount).toLocaleString('tr-TR')}
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
