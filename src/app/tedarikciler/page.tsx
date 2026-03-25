import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, PackageSearch, CreditCard } from "lucide-react";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { CreateSupplierModal } from "@/components/supplier/create-supplier-modal";

export const dynamic = 'force-dynamic';

export default async function TedarikcilerPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tedarikçiler ve Satın Alma</h1>
          <p className="text-muted-foreground">Mal alımı yaptığınız firmaları ve siparişleri yönetin.</p>
        </div>
        <CreateSupplierModal />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tedarikçi</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Siparişler</CardTitle>
            <PackageSearch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.flatMap((s: any) => s.purchases).filter((p: any) => p.status === 'PENDING').length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ödenecek Borç</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
          <CardDescription>Birlikte çalıştığınız firmalar ve iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma Adı</TableHead>
                <TableHead>İletişim Kişisi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Sipariş Adedi</TableHead>
                <TableHead className="text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Tedarikçi bulunamadı.</TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.contact || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.purchases?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-none font-bold text-[10px]">AKTİF</Badge>
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
