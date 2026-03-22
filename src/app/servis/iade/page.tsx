import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, ShieldCheck } from "lucide-react";

export default function ServiceIadePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Garanti ve İade Yönetimi</h1>
        <p className="text-muted-foreground">Yapılan tamirlerin garanti sürelerini ve iade taleplerini yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Aktif Garantiler</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">42</div>
            <p className="text-xs text-muted-foreground">Süresi devam eden tamirler.</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50/10 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Biten Garantiler</CardTitle>
            <History className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">156</div>
            <p className="text-xs text-muted-foreground">Süresi dolan eski tamirler.</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">İade Talepleri</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">Bekleyen iade veya tekrar tamir.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son İade Hareketleri</CardTitle>
          <CardDescription>İşletmenizde gerçekleşen son garanti kapsamındaki işlemler.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fiş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Cihaz</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Garanti Bitiş</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">SRV-1005</TableCell>
                <TableCell>Can Özkan</TableCell>
                <TableCell>Apple iPad Air 4</TableCell>
                <TableCell>Batarya Değişimi</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Aktif</Badge>
                </TableCell>
                <TableCell className="text-right">22 Eyl 2026</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SRV-1002</TableCell>
                <TableCell>Ahmet Akın</TableCell>
                <TableCell>Xiaomi Note 10 Pro</TableCell>
                <TableCell>Şarj Soketi</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">İade/Tekrar</Badge>
                </TableCell>
                <TableCell className="text-right">Bugün</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
