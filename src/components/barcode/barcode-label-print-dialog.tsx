"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Barcode } from "@/components/barcode/barcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  BarcodeCopiesMode,
  BarcodeLabelSize,
  buildBarcodePrintQueue,
  defaultBarcodeLabelSettings,
  getBarcodeLabelDimensions,
  normalizeBarcodeSettings,
} from "@/lib/barcode-utils";
import { Printer, Tags } from "lucide-react";

interface BarcodeLabelPrintDialogProps {
  product?: any;
  products?: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeLabelPrintDialog({ product, products, isOpen, onOpenChange }: BarcodeLabelPrintDialogProps) {
  const [settings, setSettings] = useState(defaultBarcodeLabelSettings);

  const printableProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return product ? [product] : [];
  }, [product, products]);
  const normalizedSettings = useMemo(() => normalizeBarcodeSettings(settings), [settings]);
  const dimensions = useMemo(() => getBarcodeLabelDimensions(normalizedSettings), [normalizedSettings]);
  const queue = useMemo(() => {
    return buildBarcodePrintQueue(printableProducts.map((item) => ({ ...item, selected: true })), normalizedSettings);
  }, [printableProducts, normalizedSettings]);
  const totalStock = useMemo(
    () => printableProducts.reduce((total, item) => total + Number(item.stock || 0), 0),
    [printableProducts]
  );
  const pagePaddingMm = 6;
  const labelGapMm = 2;
  const a4Columns = Math.max(
    1,
    Math.floor((210 - pagePaddingMm * 2 + labelGapMm) / (dimensions.width + labelGapMm))
  );
  const a4Rows = Math.max(
    1,
    Math.floor((297 - pagePaddingMm * 2 + labelGapMm) / (dimensions.height + labelGapMm))
  );
  const labelsPerPage = a4Columns * a4Rows;
  const queuePages = useMemo(() => {
    const pages = [];
    for (let index = 0; index < queue.length; index += labelsPerPage) {
      pages.push(queue.slice(index, index + labelsPerPage));
    }
    return pages;
  }, [queue, labelsPerPage]);
  const isBulk = printableProducts.length > 1;

  if (printableProducts.length === 0) return null;

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((current) => normalizeBarcodeSettings({ ...current, [key]: value }));
  };

  const handlePrint = () => {
    const printArea = document.querySelector(".barcode-print-area");
    const printRoot = printArea?.cloneNode(true) as HTMLElement | null;

    const cleanup = () => {
      document.body.classList.remove("barcode-label-printing");
      printRoot?.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    if (printRoot) {
      printRoot.classList.add("barcode-print-root");
      document.body.appendChild(printRoot);
    }

    document.body.classList.add("barcode-label-printing");
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 10000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] bg-card border-border p-0 overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr] min-h-[520px]">
          <div className="p-6 border-r border-border/60 bg-muted/20 space-y-6 no-print">
            <DialogHeader>
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Tags className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-semibold">{isBulk ? "Toplu Barkod Etiketi" : "Barkod Etiketi"}</DialogTitle>
              <DialogDescription className="text-xs">
                {isBulk
                  ? `${printableProducts.length} ürün için tek seferde A4 veya etiket yazıcı çıktısı hazırlar.`
                  : "Aynı ürün barkodunu seçilen adet kadar yazdırır. Barkod okutulunca POS bu üründen 1 adet sepete ekler."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Yazıcı / Etiket Ölçüsü</Label>
                <Select
                  value={normalizedSettings.labelSize}
                  onValueChange={(value: BarcodeLabelSize) => updateSetting("labelSize", value)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40x30">40 x 30 mm</SelectItem>
                    <SelectItem value="50x30">50 x 30 mm</SelectItem>
                    <SelectItem value="58x40">58 x 40 mm</SelectItem>
                    <SelectItem value="70x40">70 x 40 mm</SelectItem>
                    <SelectItem value="custom">Özel ölçü</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {normalizedSettings.labelSize === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Genişlik</Label>
                    <Input
                      type="number"
                      min={25}
                      max={120}
                      value={normalizedSettings.customWidthMm}
                      onChange={(event) => updateSetting("customWidthMm", Number(event.target.value))}
                      className="h-10 rounded-xl bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Yükseklik</Label>
                    <Input
                      type="number"
                      min={15}
                      max={80}
                      value={normalizedSettings.customHeightMm}
                      onChange={(event) => updateSetting("customHeightMm", Number(event.target.value))}
                      className="h-10 rounded-xl bg-background"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Çıkartma Adedi</Label>
                <Select
                  value={normalizedSettings.copiesMode}
                  onValueChange={(value: BarcodeCopiesMode) => updateSetting("copiesMode", value)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stok kadar ({totalStock})</SelectItem>
                    <SelectItem value="single">Tek etiket</SelectItem>
                    <SelectItem value="custom">Özel adet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {normalizedSettings.copiesMode === "custom" && (
                <div className="space-y-2">
                  <Label className="text-xs">Özel adet</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={normalizedSettings.customCopies}
                    onChange={(event) => updateSetting("customCopies", Number(event.target.value))}
                    className="h-10 rounded-xl bg-background"
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <Label className="text-xs">Fiyatı göster</Label>
                <Switch
                  checked={normalizedSettings.showPrice}
                  onCheckedChange={(checked) => updateSetting("showPrice", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <Label className="text-xs">SKU göster</Label>
                <Switch
                  checked={normalizedSettings.showSku}
                  onCheckedChange={(checked) => updateSetting("showSku", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <Label className="text-xs">Barkod yazısını göster</Label>
                <Switch
                  checked={normalizedSettings.showBarcodeText}
                  onCheckedChange={(checked) => updateSetting("showBarcodeText", checked)}
                />
              </div>
            </div>

            <Button onClick={handlePrint} disabled={queue.length === 0} className="w-full h-11 rounded-xl gap-2">
              <Printer className="h-4 w-4" />
              {queue.length} Etiket Yazdır
            </Button>
          </div>

          <div className="p-6 bg-background/60">
            <div className="no-print mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {isBulk ? `${printableProducts.length} ürün seçildi` : printableProducts[0].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBulk ? `${queue.length} etiket önizleniyor` : printableProducts[0].barcode}
                </p>
              </div>
              <Badge variant="secondary">{dimensions.width} x {dimensions.height} mm</Badge>
            </div>

            <div
              className="barcode-print-area"
              style={{
                "--barcode-label-width": `${dimensions.width}mm`,
                "--barcode-label-height": `${dimensions.height}mm`,
                "--barcode-a4-columns": a4Columns,
                "--barcode-a4-padding": `${pagePaddingMm}mm`,
                "--barcode-label-gap": `${labelGapMm}mm`,
              } as CSSProperties}
            >
              {queuePages.map((page, pageIndex) => (
                <div key={`page-${pageIndex}`} className="barcode-print-page">
                  {page.map((item, index) => (
                    <div key={`${item.id}-${pageIndex}-${index}`} className="barcode-label">
                      <div className="barcode-label-name">{item.name}</div>
                      <Barcode value={item.barcode} width={1.2} height={42} fontSize={10} displayValue={normalizedSettings.showBarcodeText} />
                      <div className="barcode-label-footer">
                        {normalizedSettings.showSku && item.sku ? (
                          <span>{item.sku}</span>
                        ) : normalizedSettings.showBarcodeText ? (
                          <span>{item.barcode}</span>
                        ) : (
                          <span />
                        )}
                        {normalizedSettings.showPrice && item.sellPrice != null && (
                          <span className="barcode-label-price">{formatCurrency(Number(item.sellPrice))} TL</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="no-print barcode-page-counter">
                    A4 sayfa {pageIndex + 1} / {queuePages.length}
                  </div>
                </div>
              ))}
            </div>

            {queue.length > 80 && <p className="no-print mt-4 text-xs text-muted-foreground">Önizleme çok sayıda etiket içeriyor.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
