import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Wallet } from "lucide-react";
import { getStaff } from "@/lib/actions/staff-actions";
import { CreateStaffModal } from "@/components/staff/create-staff-modal";

export const dynamic = 'force-dynamic';

export default async function PersonelPage() {
  const staff = await getStaff();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personel ve Yetkiler</h1>
          <p className="text-muted-foreground">Ekibinizi yönetin ve performanslarını takip edin.</p>
        </div>
        <CreateStaffModal />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Teknisyenler</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.filter((s: any) => s.role === 'TECHNICIAN').length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ayki Primler</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
          <CardDescription>Maaş, prim ve işlem loglarını yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Tamamlanan Servis</TableHead>
                <TableHead>Satış Adedi</TableHead>
                <TableHead>Prim Oranı (%)</TableHead>
                <TableHead className="text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Personel bulunamadı.</TableCell>
                </TableRow>
              ) : (
                staff.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.assignedTickets?.length || 0}</TableCell>
                    <TableCell>{user.sales?.length || 0}</TableCell>
                    <TableCell>%{Number(user.commissionRate)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-none text-[10px] font-bold">AKTİF</Badge>
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
