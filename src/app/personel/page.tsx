import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStaff } from "@/lib/actions/staff-actions";
import { UserCog, Shield, Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PersonelPage() {
  const staff = await getStaff();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personel ve Yetkiler</h1>
        <p className="text-muted-foreground">İşletme personelini ve sistem yetkilerini yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Yöneticiler</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.filter((s: any) => s.role === 'ADMIN').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Katılım Tarihi</TableHead>
                <TableHead className="text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Henüz personel kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s: any) => (
                  <TableRow key={s.id} className="group">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {s.name || "İsimsiz"}
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">Aktif</Badge>
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
