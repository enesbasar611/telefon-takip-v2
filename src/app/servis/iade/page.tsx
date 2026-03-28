import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, History, ShieldCheck, Cpu } from "lucide-react";
import { getWarrantyStats } from "@/lib/actions/warranty-actions";
import { WarrantySearchClient } from "@/components/warranty/warranty-search-client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function ServiceIadePage() {
  const stats = await getWarrantyStats();

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex items-center gap-5 mb-4">
        <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <ShieldCheck className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold">Garanti ve İade Yönetimi</h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">Tamir garanti süreleri sorgulama ve iade işlemleri</p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-xl border-emerald-500/10 bg-emerald-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-emerald-600">Aktif Garantiler</CardTitle>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-emerald-600">{stats.activeWarranties}</div>
            <p className="text-xs text-emerald-600/60 font-medium mt-2">Süresi devam eden cihazlar</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-500/10 bg-amber-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-amber-600">Biten Garantiler</CardTitle>
            <History className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-amber-600">{stats.expiredWarranties}</div>
            <p className="text-xs text-amber-600/60 font-medium mt-2">Süresi dolan eski tamirler</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-rose-500/10 bg-rose-500/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-sm font-bold text-rose-600">İade Talepleri</CardTitle>
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-4xl font-extrabold text-rose-600">{stats.returnRequests}</div>
            <p className="text-xs text-rose-600/60 font-medium mt-2">Toptancıya iade bekleyen parçalar</p>
          </CardContent>
        </Card>
      </div>

      {/* Garanti Sorgulama ve İşlem Başlatma Modülü */}
      <div>
        <h2 className="text-lg font-bold mb-4">Yeni Garanti / İade İşlemi Başlat</h2>
        <WarrantySearchClient />
      </div>

      <Card className="rounded-xl border-border shadow-sm bg-card overflow-hidden mt-6">
        <CardHeader className="p-8 border-b border-border">
          <CardTitle className="text-xl font-extrabold">Son İade Hareketleri</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Sisteme girilen son garanti/iade kayıtları</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border">
                <TableHead className="px-8 py-5 text-xs font-bold text-muted-foreground w-32">İade Fişi</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground w-32">Servis Fişi</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground">Arızalı Parça</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground">İade Sebebi</TableHead>
                <TableHead className="px-6 py-5 text-xs font-bold text-muted-foreground w-40">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium">Henüz iade işlemi bulunmuyor</TableCell>
                </TableRow>
              ) : (
                stats.recentReturns.map((ticket: any) => {
                  const getReasonText = (reason: string) => {
                    if (reason === 'PART_FAILURE') return 'Parça Arızası';
                    if (reason === 'LABOR_ERROR') return 'İşçilik Hatası';
                    if (reason === 'CUSTOMER_MISUSE') return 'Kullanıcı Hatası';
                    if (reason === 'CUSTOMER_CANCEL') return 'Para İadesi / İptal';
                    return reason;
                  };

                  return (
                    <TableRow key={ticket.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <TableCell className="px-8 py-6 font-bold text-sm text-primary">{ticket.ticketNumber}</TableCell>
                      <TableCell className="px-6 py-6 font-medium text-xs">
                        <Badge variant="outline" className="font-mono bg-background">
                          {ticket.serviceTicket?.ticketNumber || 'Silinmiş Fiş'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="flex items-center gap-2 font-medium">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          {ticket.product?.name || "Bilinmeyen Parça"}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6 font-medium">
                        <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-500/20 bg-rose-500/10 px-3 py-1 rounded-full">
                          {getReasonText(ticket.returnReason)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-6 font-medium text-xs text-muted-foreground">
                        {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

