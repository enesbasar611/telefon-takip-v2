import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSecondHandDevices } from "@/lib/actions/second-hand-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { Smartphone, CheckCircle2 } from "lucide-react";
import { DeviceTestModal } from "@/components/second-hand/device-test-modal";
import { CreateSecondHandModal } from "@/components/second-hand/create-second-hand-modal";

export const dynamic = 'force-dynamic';

export default async function IkinciElPage() {
  const devices = await getSecondHandDevices();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İkinci El Cihazlar</h1>
          <p className="text-muted-foreground">Alınan ve satılan ikinci el cihazların stok takibi.</p>
        </div>
        <CreateSecondHandModal categories={categories} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stoktaki Cihazlar</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Satılan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Cihaz Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cihaz</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Satış Fiyatı</TableHead>
                <TableHead className="text-right w-[100px]">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Henüz ikinci el cihaz kaydı yok.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device: any) => (
                  <TableRow key={device.id} className="group">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                      {device.name}
                    </TableCell>
                    <TableCell>{device.category.name}</TableCell>
                    <TableCell>{device.secondHandInfo?.imei || "Bilinmiyor"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Stokta</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ₺{Number(device.sellPrice).toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {device.secondHandInfo && (
                        <DeviceTestModal
                          deviceId={device.secondHandInfo.id}
                          deviceName={device.name}
                          initialTests={device.secondHandInfo.testResults}
                        />
                      )}
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
