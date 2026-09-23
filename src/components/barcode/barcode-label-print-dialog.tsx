"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
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
import { Printer, Tags, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface BarcodeLabelPrintDialogProps {
  product?: any;
  products?: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ResizableLogo({ src, width, height, onChange, minW = 20, maxW = 120, minH = 10, maxH = 60 }: any) {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;
      
      let newW = startWidth;
      let newH = startHeight;

      if (dir.includes('e')) newW = startWidth + dx;
      if (dir.includes('w')) newW = startWidth - dx;
      if (dir.includes('s')) newH = startHeight + dy;
      if (dir.includes('n')) newH = startHeight - dy;

      onChange(
        Math.max(minW, Math.min(maxW, newW)),
        Math.max(minH, Math.min(maxH, newH))
      );
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClass = `absolute w-2 h-2 bg-white border border-blue-500 no-print transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;

  return (
    <div className="relative group inline-block" style={{ width: `${width}px`, height: `${height}px` }}>
      <img src={src} alt="Logo" className="w-full h-full object-contain pointer-events-none" style={{ filter: 'grayscale(100%) contrast(200%) brightness(50%)', mixBlendMode: 'multiply' }} />
      <div className={`absolute inset-0 border border-blue-500/50 pointer-events-none no-print transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      
      <div className={`${handleClass} -top-1 -left-1 cursor-nwse-resize`} onPointerDown={(e) => handlePointerDown(e, 'nw')} />
      <div className={`${handleClass} -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(e) => handlePointerDown(e, 'n')} />
      <div className={`${handleClass} -top-1 -right-1 cursor-nesw-resize`} onPointerDown={(e) => handlePointerDown(e, 'ne')} />
      <div className={`${handleClass} top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => handlePointerDown(e, 'e')} />
      <div className={`${handleClass} -bottom-1 -right-1 cursor-nwse-resize`} onPointerDown={(e) => handlePointerDown(e, 'se')} />
      <div className={`${handleClass} -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(e) => handlePointerDown(e, 's')} />
      <div className={`${handleClass} -bottom-1 -left-1 cursor-nesw-resize`} onPointerDown={(e) => handlePointerDown(e, 'sw')} />
      <div className={`${handleClass} top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => handlePointerDown(e, 'w')} />
    </div>
  );
}

export function BarcodeLabelPrintDialog({ product, products, isOpen, onOpenChange }: BarcodeLabelPrintDialogProps) {
  const [settings, setSettings] = useState(defaultBarcodeLabelSettings);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [productNameFontSize, setProductNameFontSize] = useState<number>(10);
  const [priceFontSize, setPriceFontSize] = useState<number>(10);
  const [barcodeWidth, setBarcodeWidth] = useState<number>(1.2);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoWidthPx, setLogoWidthPx] = useState<number>(60);
  const [logoHeightPx, setLogoHeightPx] = useState<number>(24);
  
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [previewBounds, setPreviewBounds] = useState({ width: 0, height: 0 });

  // Load advanced settings
  useEffect(() => {
    const saved = localStorage.getItem("barcode_advanced_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.productNameFontSize) setProductNameFontSize(parsed.productNameFontSize);
        if (parsed.priceFontSize) setPriceFontSize(parsed.priceFontSize);
        if (parsed.barcodeWidth) setBarcodeWidth(parsed.barcodeWidth);
        if (parsed.logoData) setLogoData(parsed.logoData);
        if (parsed.logoWidthPx) setLogoWidthPx(parsed.logoWidthPx);
        if (parsed.logoHeightPx) setLogoHeightPx(parsed.logoHeightPx);
      } catch (e) {}
    }
  }, []);

  // Save advanced settings
  useEffect(() => {
    localStorage.setItem("barcode_advanced_settings", JSON.stringify({
      productNameFontSize,
      priceFontSize,
      barcodeWidth,
      logoData,
      logoWidthPx,
      logoHeightPx
    }));
  }, [productNameFontSize, priceFontSize, barcodeWidth, logoData, logoWidthPx, logoHeightPx]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoData(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

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
  const isSinglePreview = queue.length === 1;
  const previewPageWidthMm = isSinglePreview ? dimensions.width : 210;
  const previewPageHeightMm = isSinglePreview ? dimensions.height : 297;
  const previewPageWidthPx = previewPageWidthMm * 96 / 25.4;
  const previewPageHeightPx = previewPageHeightMm * 96 / 25.4;

  useEffect(() => {
    if (!isOpen || !previewFrameRef.current) return;

    const updateBounds = () => {
      const rect = previewFrameRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPreviewBounds({ width: rect.width, height: rect.height });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(previewFrameRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  const queuePages = useMemo(() => {
    const pages = [];
    for (let index = 0; index < queue.length; index += labelsPerPage) {
      pages.push(queue.slice(index, index + labelsPerPage));
    }
    return pages;
  }, [queue, labelsPerPage]);
  const previewPageStackGapPx = isSinglePreview ? 0 : Math.max(0, queuePages.length - 1) * 16;

  useEffect(() => {
    setManualZoom(null);
  }, [dimensions.height, dimensions.width, queue.length]);

  const autoScale = useMemo(() => {
    if (!previewBounds.width || !previewBounds.height) {
      if (queue.length <= 1) return 1.8;
      if (queue.length <= 4) return 0.75;
      if (queue.length <= 12) return 0.6;
      if (queue.length <= 24) return 0.45;
      return 0.35;
    }

    const insetPx = 48;
    const availableWidth = Math.max(160, previewBounds.width - insetPx);
    const availableHeight = Math.max(160, previewBounds.height - insetPx);
    const fitWidth = availableWidth / previewPageWidthPx;
    const fitHeight = availableHeight / (previewPageHeightPx * Math.max(1, queuePages.length) + previewPageStackGapPx);
    const fitScale = Math.min(fitWidth, fitHeight);
    const maxScale = isSinglePreview ? 4 : 1.1;

    return Math.min(maxScale, Math.max(0.12, fitScale));
  }, [
    isSinglePreview,
    previewBounds.height,
    previewBounds.width,
    previewPageHeightPx,
    previewPageWidthPx,
    previewPageStackGapPx,
    queue.length,
    queuePages.length,
  ]);

  const currentScale = manualZoom !== null ? manualZoom / 100 : autoScale;
  const isBulk = printableProducts.length > 1;

  if (printableProducts.length === 0) return null;

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((current) => normalizeBarcodeSettings({ ...current, [key]: value }));
  };

  const handlePrint = () => {
    const printArea = document.querySelector(".barcode-print-area");
    const printRoot = printArea?.cloneNode(true) as HTMLElement | null;
    const printStyle = document.createElement("style");

    const cleanup = () => {
      document.body.classList.remove("barcode-label-printing");
      printRoot?.remove();
      printStyle.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    // If printing a single label format (like 57x32 or 50x30), adjust the page size
    // Otherwise if it's A4 it will fall back to the A4 defaults in globals.css if we don't override,
    // but overriding specifically for the selected dimensions ensures label printers work correctly.
    const isLabelPrinter = a4Columns === 1 && a4Rows === 1;
    if (isLabelPrinter || normalizedSettings.labelSize === "57x32") {
      printStyle.textContent = `@media print { 
        @page { size: ${dimensions.width}mm ${dimensions.height}mm; margin: 0; } 
        body.barcode-label-printing .barcode-print-page {
          width: ${dimensions.width}mm !important;
          min-height: ${dimensions.height}mm !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        body.barcode-label-printing .barcode-print-root {
          width: ${dimensions.width}mm !important;
        }
        body.barcode-label-printing .barcode-label {
          width: ${dimensions.width}mm !important;
          height: ${dimensions.height}mm !important;
          border: none !important;
        }
      }`;
    } else {
      printStyle.textContent = `@media print { @page { size: A4; margin: 0; } }`;
    }
    document.head.appendChild(printStyle);

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
      <DialogContent className="sm:max-w-[1000px] bg-card border-border p-0 overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-[280px_1fr] h-[85vh] max-h-[800px]">
          <div className="p-6 border-r border-border/60 bg-muted/20 space-y-6 no-print overflow-y-auto custom-scrollbar">
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
                    <SelectItem value="57x32">32 x 57 mm (Teknik Servis)</SelectItem>
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

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px]">Ürün Adı Büyüklüğü</Label>
                      <span className="text-[10px] text-muted-foreground">{productNameFontSize}px</span>
                    </div>
                    <Slider
                      value={[productNameFontSize]}
                      min={6}
                      max={24}
                      step={1}
                      onValueChange={([val]) => setProductNameFontSize(val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px]">Fiyat Büyüklüğü</Label>
                      <span className="text-[10px] text-muted-foreground">{priceFontSize}px</span>
                    </div>
                    <Slider
                      value={[priceFontSize]}
                      min={6}
                      max={24}
                      step={1}
                      onValueChange={([val]) => setPriceFontSize(val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px]">Barkod Büyüklüğü</Label>
                      <span className="text-[10px] text-muted-foreground">{barcodeWidth}x</span>
                    </div>
                    <Slider
                      value={[barcodeWidth]}
                      min={0.5}
                      max={3}
                      step={0.1}
                      onValueChange={([val]) => setBarcodeWidth(val)}
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 border-b border-border/50 pb-1 block">Firma Logosu (Sol Alt)</Label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="h-9 text-[10px]" />
                    {logoData && (
                      <>
                        <div className="space-y-2 pt-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px]">Logo Genişliği</Label>
                            <span className="text-[10px] text-muted-foreground">{logoWidthPx}px</span>
                          </div>
                          <Slider
                            value={[logoWidthPx]}
                            min={20}
                            max={120}
                            step={1}
                            onValueChange={([val]) => setLogoWidthPx(val)}
                          />
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px]">Logo Yüksekliği</Label>
                            <span className="text-[10px] text-muted-foreground">{logoHeightPx}px</span>
                          </div>
                          <Slider
                            value={[logoHeightPx]}
                            min={10}
                            max={60}
                            step={1}
                            onValueChange={([val]) => setLogoHeightPx(val)}
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setLogoData(null)} className="h-7 px-2 text-[10px] w-full text-red-500 hover:text-red-600 hover:bg-red-500/10">
                          Logoyu Kaldır
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

            <Button onClick={handlePrint} disabled={queue.length === 0} className="w-full h-11 rounded-xl gap-2">
              <Printer className="h-4 w-4" />
              {queue.length} Etiket Yazdır
            </Button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-background/20 relative overflow-hidden flex flex-col items-center justify-start min-h-[520px]">
            <div className="no-print w-full mb-6 flex items-center justify-between gap-3 bg-white dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isBulk ? `${printableProducts.length} farklı ürün` : printableProducts[0].name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-bold border-blue-500/20 text-blue-500 bg-blue-500/5">
                    {queue.length} Etiket
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {a4Columns} Sütun x {a4Rows} Satır
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setManualZoom(prev => Math.max(10, (prev || autoScale * 100) - 10))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div
                  className="px-2 min-w-[50px] text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500"
                  onClick={() => setManualZoom(null)}
                >
                  %{Math.round(currentScale * 100)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setManualZoom(prev => Math.min(400, (prev || autoScale * 100) + 10))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Badge variant="secondary" className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-none font-bold">
                {dimensions.width} x {dimensions.height} mm
              </Badge>
            </div>

            <div ref={previewFrameRef} className="flex-1 w-full flex overflow-auto px-4 pb-8 pt-4 custom-scrollbar bg-slate-200/50 dark:bg-black/20">
              <div
                className="m-auto transition-all duration-300"
                style={{
                  width: previewPageWidthPx * currentScale,
                  height: (previewPageHeightPx * queuePages.length + previewPageStackGapPx) * currentScale,
                  flexShrink: 0,
                }}
              >
                <div
                  className="relative shadow-2xl transition-all duration-300 origin-top-left bg-white"
                  style={{
                    width: `${previewPageWidthMm}mm`,
                    height: `${previewPageHeightMm}mm`,
                    transform: `scale(${currentScale})`,
                  }}
                >
                  <div
                    className="barcode-print-area w-full h-full"
                    style={{
                      "--barcode-label-width": `${dimensions.width}mm`,
                      "--barcode-label-height": `${dimensions.height}mm`,
                      "--barcode-a4-columns": a4Columns,
                      "--barcode-a4-padding": `${pagePaddingMm}mm`,
                      "--barcode-label-gap": `${labelGapMm}mm`,
                      background: "white",
                    } as CSSProperties}
                  >
                    {queuePages.map((page, pageIndex) => (
                      <div
                        key={`page-${pageIndex}`}
                        className={cn(
                          "barcode-print-page bg-white relative w-full h-full",
                          isSinglePreview && "barcode-print-page-single"
                        )}
                      >
                        {page.map((item, index) => (
                          <div key={`${item.id}-${pageIndex}-${index}`} className="barcode-label">
                            <div className="barcode-label-name" style={{ fontSize: `${productNameFontSize}px` }}>{item.name}</div>
                            
                            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                              <Barcode value={item.barcode} width={barcodeWidth} height={42} fontSize={10} displayValue={normalizedSettings.showBarcodeText} />
                            </div>

                            <div className="barcode-label-footer">
                              {logoData ? (
                                <ResizableLogo 
                                  src={logoData} 
                                  width={logoWidthPx} 
                                  height={logoHeightPx} 
                                  onChange={(w: number, h: number) => {
                                    setLogoWidthPx(w);
                                    setLogoHeightPx(h);
                                  }} 
                                />
                              ) : normalizedSettings.showSku && item.sku ? (
                                <span style={{ fontSize: `${priceFontSize * 0.8}px` }}>{item.sku}</span>
                              ) : (
                                <span />
                              )}
                              {normalizedSettings.showPrice && item.sellPrice != null && (
                                <span className="barcode-label-price" style={{ fontSize: `${priceFontSize}px` }}>{formatCurrency(Number(item.sellPrice))} TL</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="no-print barcode-page-counter absolute bottom-2 right-2 opacity-50 pointer-events-none text-black text-[10px] font-bold">
                          Sayfa {pageIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {queue.length > 80 && (
              <div className="no-print absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <p className="text-[10px] text-amber-500 font-bold whitespace-nowrap">
                  DİKKAT: Çok sayıda etiket yazdırılıyor ({queue.length} adet)
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
