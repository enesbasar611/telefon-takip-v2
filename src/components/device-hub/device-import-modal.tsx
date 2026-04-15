"use client";

import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, Table as TableIcon, X } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { bulkCreateProducts } from "@/lib/actions/product-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const REQUIRED_FIELDS = [
    { id: "name", label: "Ürün Adı / Model", required: true },
    { id: "brand", label: "Marka", required: false },
    { id: "model", label: "Model Detayı", required: false },
    { id: "imei", label: "IMEI / Seri No", required: false },
    { id: "color", label: "Renk", required: false },
    { id: "capacity", label: "Hafıza", required: false },
    { id: "buyPrice", label: "Alış Fiyatı", required: true },
    { id: "sellPrice", label: "Satış Fiyatı", required: true },
    { id: "stock", label: "Stok Adedi", required: true },
    { id: "condition", label: "Durum (NEW/USED)", required: false },
];

export function DeviceImportModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep("upload");
        setFileData([]);
        setHeaders([]);
        setMapping({});
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const bstr = event.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (data.length > 0) {
                const rawHeaders = data[0] as string[];
                const rows = data.slice(1) as any[][];

                // Convert rows to objects using raw headers
                const parsedRows = rows.map(row => {
                    const obj: any = {};
                    rawHeaders.forEach((h, i) => {
                        obj[h] = row[i];
                    });
                    return obj;
                });

                setHeaders(rawHeaders);
                setFileData(parsedRows);

                // Auto-match headers
                const initialMapping: Record<string, string> = {};
                REQUIRED_FIELDS.forEach(field => {
                    const match = rawHeaders.find(h =>
                        h.toLowerCase().includes(field.label.toLowerCase()) ||
                        h.toLowerCase().includes(field.id.toLowerCase())
                    );
                    if (match) initialMapping[field.id] = match;
                });
                setMapping(initialMapping);
                setStep("mapping");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const formattedData = fileData.map(row => {
                const item: any = {
                    name: row[mapping.name] || "İsimsiz Cihaz",
                    brand: row[mapping.brand] || "",
                    model: row[mapping.model] || "",
                    imei: row[mapping.imei]?.toString() || undefined,
                    color: row[mapping.color] || undefined,
                    capacity: row[mapping.capacity]?.toString() || undefined,
                    buyPrice: Number(row[mapping.buyPrice]) || 0,
                    sellPrice: Number(row[mapping.sellPrice]) || 0,
                    stock: Number(row[mapping.stock]) || 1,
                    condition: row[mapping.condition] || "USED",
                    isSecondHand: true,
                    categoryPath: ["Cihaz Havuzu", row[mapping.brand] || "Diğer"]
                };
                return item;
            });

            const result = await bulkCreateProducts(formattedData);
            if (result.success) {
                toast.success(`${result.count} cihaz başarıyla içe aktarıldı.`);
                setOpen(false);
                reset();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("İçe aktarma sırasında bir hata oluştu.");
        } finally {
            setIsImporting(false);
        }
    };

    const isMappingComplete = REQUIRED_FIELDS
        .filter(f => f.required)
        .every(f => mapping[f.id]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-2xl border-dashed">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">İçe Aktar (CSV)</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] sm:h-auto flex flex-col p-0 overflow-hidden rounded-[2rem]">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        Cihaz İçe Aktar
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden px-6">
                    {step === "upload" && (
                        <div
                            className="mt-4 border-2 border-dashed border-border/60 rounded-[2rem] h-[300px] flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-lg">Excel veya CSV dosyanızı yükleyin</p>
                                <p className="text-sm text-muted-foreground">Sürükle bırak veya tıklayarak seç</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {step === "mapping" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Sütun Eşleştirme</h3>
                                    <p className="text-sm text-muted-foreground">Lütfen dosyanızdaki başlıkları uygun alanlarla eşleştirin.</p>
                                </div>
                                <Badge variant="outline" className="px-3 py-1 rounded-lg">
                                    {headers.length} Sütun Bulundu
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {REQUIRED_FIELDS.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="flex items-center gap-1.5">
                                            {field.label}
                                            {field.required && <span className="text-destructive">*</span>}
                                        </Label>
                                        <Select
                                            value={mapping[field.id]}
                                            onValueChange={(val) => setMapping(prev => ({ ...prev, [field.id]: val }))}
                                        >
                                            <SelectTrigger className="rounded-xl bg-muted/30">
                                                <SelectValue placeholder="Sütun seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Önizleme</h3>
                                    <p className="text-sm text-muted-foreground">Aktarılacak ilk 5 kayıt gösteriliyor.</p>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-lg">
                                    {fileData.length} Kayıt Hazır
                                </Badge>
                            </div>

                            <div className="border border-border/40 rounded-2xl overflow-hidden bg-muted/5">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            {REQUIRED_FIELDS.filter(f => mapping[f.id]).map(f => (
                                                <TableHead key={f.id} className="text-[10px] uppercase tracking-wider font-bold">{f.label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fileData.slice(0, 5).map((row, i) => (
                                            <TableRow key={i}>
                                                {REQUIRED_FIELDS.filter(f => mapping[f.id]).map(f => (
                                                    <TableCell key={f.id} className="text-xs font-medium">{row[mapping[f.id]] || "-"}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 mt-auto bg-muted/5 border-t border-border/40">
                    <div className="flex items-center justify-between w-full">
                        <Button variant="ghost" className="rounded-xl" onClick={reset}>Vazgeç</Button>

                        <div className="flex items-center gap-3">
                            {step === "mapping" && (
                                <Button
                                    className="rounded-xl gap-2 px-8"
                                    disabled={!isMappingComplete}
                                    onClick={() => setStep("preview")}
                                >
                                    Önizleme <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                            {step === "preview" && (
                                <Button
                                    className="rounded-xl gap-2 px-8 bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isImporting}
                                    onClick={handleImport}
                                >
                                    {isImporting ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    {isImporting ? "Aktarılıyor..." : "Aktarımı Başlat"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
