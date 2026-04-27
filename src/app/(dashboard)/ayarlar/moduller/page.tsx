"use client";

import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, HelpCircle, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { fixAllBarcodes } from "@/lib/actions/product-actions";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { buildScannerUrl } from "@/lib/scanner-url";
import { ScannerHelpModal } from "@/components/scanner/scanner-help-modal";
import { useScanner } from "@/hooks/use-scanner";

export default function MobileScannerSettingsPage() {
    const { data: session } = useSession();
    const [qrUrl, setQrUrl] = useState("");
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { initializeScannerRoom, isMobileScannerLinked } = useScanner();

    useEffect(() => {
        if (session?.user?.shopId || session?.user?.id) {
            const room = session.user.shopId || session.user.id;
            initializeScannerRoom(room);

            const setFallbackUrl = () => {
                setQrUrl(buildScannerUrl({
                    roomId: room,
                    browserOrigin: window.location.origin,
                }));
            };

            fetch("/api/network-info")
                .then((r) => r.json())
                .then((data) => {
                    setQrUrl(buildScannerUrl({
                        roomId: room,
                        browserOrigin: window.location.origin,
                        networkInfo: data,
                    }));
                })
                .catch(setFallbackUrl);
        }
    }, [session, initializeScannerRoom]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(qrUrl);
        toast.success("Bağlantı kopyalandı!");
    };

    const openHelp = () => {
        if (isMobileScannerLinked) {
            toast.info("Telefon zaten bağlı.");
            return;
        }
        setIsHelpOpen(true);
    };

    return (
        <>
        <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mobil Tarayıcı Modülü</h1>
                <p className="text-neutral-500 mt-2">
                    Akıllı telefonunuzun kamerasını PC üzerindeki POS ve sepet sistemlerine entegre edin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-500" />
                            Cihaz Eşleştirme
                        </CardTitle>
                        <CardDescription>
                            Telefonunuzdan kamerayı açıp aşağıdaki QR kodu okutarak cihazınızı bağlayın.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border">
                            {qrUrl ? (
                                <QRCodeSVG value={qrUrl} size={200} />
                            ) : (
                                <div className="w-[200px] h-[200px] bg-neutral-100 animate-pulse rounded-lg" />
                            )}
                        </div>

                        <div className="w-full flex items-center space-x-2">
                            <Input
                                readOnly
                                value={qrUrl}
                                onFocus={(event) => event.currentTarget.select()}
                                className="flex-1 h-11 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-mono"
                            />
                            <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 rounded-2xl gap-2"
                            onClick={openHelp}
                        >
                            <HelpCircle className="w-4 h-4" />
                            Nasıl bağlarım?
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-green-500" />
                            Nasıl Çalışır?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
                            <li className="flex gap-3">
                                <span className="font-bold text-neutral-900 dark:text-white">1.</span>
                                Bilgisayarınızda (PC) sepet veya ürün arama barındaki Kamera (📷) sembolüne tıklayın.
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-neutral-900 dark:text-white">2.</span>
                                Telefonunuzdan bu sekmede oluşturulan QR kodunu bir kez okutarak eşleşmeyi tamamlayın.
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-neutral-900 dark:text-white">3.</span>
                                Eşleşen telefonda açılan sayfada ürün barkodunu okutun.
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-neutral-900 dark:text-white">4.</span>
                                Okunan tüm ürünler güvenli bağlantı sayesinde masaüstündeki sepetinize anında eklenecektir.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            Veri Bakımı (Kritik)
                        </CardTitle>
                        <CardDescription>
                            Tüm ürün barkodlarını yeni formata (BSR + Ad Baş Harfleri + ID) dönüştürür. Bu işlem geri alınamaz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 max-w-md">
                            Mevcut etiketlerinizdeki barkodlar geçersiz kalacaktır. Lütfen bu işlemi yalnızca yeni sisteme geçiş yaparken kullanın.
                        </p>
                        <Button
                            variant="destructive"
                            className="flex items-center gap-2"
                            onClick={async () => {
                                if (confirm("Tüm ürün barkodlarını yeni formata dönüştürmek istediğinize emin misiniz?")) {
                                    const res = await fixAllBarcodes();
                                    if (res.success) {
                                        toast.success(`${res.count} ürün barkodu başarıyla güncellendi!`);
                                    } else {
                                        toast.error("İşlem sırasında bir hata oluştu.");
                                    }
                                }
                            }}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Barkodları Yeniden Oluştur (Tümü)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
        <ScannerHelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
        </>
    );
}
