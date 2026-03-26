import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, ShieldCheck } from "lucide-react";

export default function ServiceIadePage() {
  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex items-center gap-5 mb-4">
        <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
        </div>
        <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Garanti ve iade yönetimi</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">Tamir garanti süreleri ve iade talepleri kontrol merkezi</p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-[2rem] border-emerald-500/10 bg-emerald-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-emerald-600">Aktif garantiler</CardTitle>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">42</div>
            <p className="text-xs text-emerald-600/60 font-medium mt-2">Süresi devam eden cihazlar</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-amber-500/10 bg-amber-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-amber-600">Biten garantiler</CardTitle>
            <History className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-amber-600 tracking-tight">156</div>
            <p className="text-xs text-amber-600/60 font-medium mt-2">Süresi dolan eski tamirler</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-rose-500/10 bg-rose-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-rose-600">İade talepleri</CardTitle>
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-rose-600 tracking-tight">2</div>
            <p className="text-xs text-rose-600/60 font-medium mt-2">Bekleyen iade veya tekrar tamir</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-8 border-b border-border">
          <CardTitle className="text-xl font-extrabold">Son iade hareketleri</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Garanti kapsamındaki son işlemler</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border">
                <TableHead className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight">Fiş no</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight">Müşteri</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight">Cihaz</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight">İşlem</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight">Durum</TableHead>
                <TableHead className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-tight text-right">Garanti bitiş</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                <TableCell className="px-8 py-6 font-bold text-sm">SRV-1005</TableCell>
                <TableCell className="px-6 py-6 font-medium">Can Özkan</TableCell>
                <TableCell className="px-6 py-6 font-medium">Apple iPad Air 4</TableCell>
                <TableCell className="px-6 py-6 font-medium">Batarya değişimi</TableCell>
                <TableCell className="px-6 py-6">
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 rounded-full">Aktif</Badge>
                </TableCell>
                <TableCell className="px-8 py-6 text-right font-bold text-sm">22 Eyl 2026</TableCell>
              </TableRow>
              <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                <TableCell className="px-8 py-6 font-bold text-sm">SRV-1002</TableCell>
                <TableCell className="px-6 py-6 font-medium">Ahmet Akın</TableCell>
                <TableCell className="px-6 py-6 font-medium">Xiaomi Note 10 Pro</TableCell>
                <TableCell className="px-6 py-6 font-medium">Şarj soketi</TableCell>
                <TableCell className="px-6 py-6">
                  <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-500/20 bg-rose-500/10 px-4 py-1.5 rounded-full">İade/tekrar</Badge>
                </TableCell>
                <TableCell className="px-8 py-6 text-right font-bold text-sm text-rose-600">Bugün</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
