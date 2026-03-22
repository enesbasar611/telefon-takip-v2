import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserCheck, Star, Users } from "lucide-react";
import { getCustomers } from "@/lib/actions/customer-actions";

export const dynamic = 'force-dynamic';

export default async function MusterilerPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Müşteri Yönetimi (CRM)</h1>
        <p className="text-muted-foreground">Müşteri portföyünüzü ve işlem geçmişlerini yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Müşteriler (Ay)</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: any) => new Date(c.createdAt) > new Date(new Date().setDate(1))).length}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif İşlemler</CardTitle>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: any) => c.tickets.some((t: any) => t.status !== 'DELIVERED')).length}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sadık Müşteriler</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter((c: any) => c.loyaltyPoints > 100).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
          <CardDescription>Müşteri iletişim bilgileri ve genel durumu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Son İşlem</TableHead>
                <TableHead>Servis / Satış</TableHead>
                <TableHead className="text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Müşteri bulunamadı.</TableCell>
                </TableRow>
              ) : (
                customers.map((customer: any) => (
                  <TableRow key={customer.id} className="group cursor-pointer">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-xs">
                      {customer.tickets.length > 0 ? (
                        <span>{new Date(customer.tickets[0].createdAt).toLocaleDateString('tr-TR')}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-[10px]">{customer.tickets.length} Servis</Badge>
                        <Badge variant="outline" className="text-[10px]">{customer.sales.length} Satış</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-[10px] uppercase">AKTİF</Badge>
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
