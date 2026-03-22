import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getDebts, getDebtSummary } from "@/lib/actions/debt-actions";
import { CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const debts = await getDebts();
  const totalDebt = await getDebtSummary();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Veresiye ve Alacaklar</h1>
        <p className="text-muted-foreground">Müşteri borçlarını ve ödemelerini takip edin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{totalDebt.toLocaleString('tr-TR')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gecikenler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Alacak Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Kalan Borç</TableHead>
                <TableHead>Vade Tarihi</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Henüz alacak kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                debts.map((debt: any) => (
                  <TableRow key={debt.id} className="group">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {debt.customer.name}
                    </TableCell>
                    <TableCell>{debt.customer.phone}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      ₺{Number(debt.remainingAmount).toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('tr-TR') : "Belirtilmemiş"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={debt.isPaid ? "success" : "destructive"}>
                        {debt.isPaid ? "Ödendi" : "Ödenmedi"}
                      </Badge>
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
