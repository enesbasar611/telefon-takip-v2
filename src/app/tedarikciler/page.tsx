import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { Truck, Phone, Mail, MapPin } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TedarikcilerPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tedarikçiler ve Satın Alma</h1>
        <p className="text-muted-foreground">Tedarikçi verilerini ve siparişlerini yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tedarikçi</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tedarikçi Adı</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Adres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Henüz tedarikçi kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier: any) => (
                  <TableRow key={supplier.id} className="group">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.contact || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {supplier.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {supplier.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px] truncate">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {supplier.address || "-"}
                      </div>
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
