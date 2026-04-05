"use client";

import { useState } from "react";
import { Search, ShieldAlert, Cpu, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTicketForWarranty, createReturnTicket } from "@/lib/actions/warranty-actions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function WarrantySearchClient() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState("");
    const [returnReason, setReturnReason] = useState("");
    const [notes, setNotes] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm || searchTerm.length < 3) {
            toast.error("Arama için en az 3 karakter giriniz");
            return;
        }
        setLoading(true);
        try {
            const tickets = await getTicketForWarranty(searchTerm);
            setResults(tickets || []);
            setHasSearched(true);
        } catch (error) {
            toast.error("Arama sırasında hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const openReturnModal = (ticket: any) => {
        setSelectedTicket(ticket);
        setSelectedPart("");
        setReturnReason("");
        setNotes("");
        setIsModalOpen(true);
    };

    const handleSubmitReturn = async () => {
        if (!selectedPart || !returnReason) {
            toast.error("Lütfen parça ve iade sebebi seçiniz");
            return;
        }

        setSubmitLoading(true);
        try {
            const res = await createReturnTicket({
                serviceTicketId: selectedTicket.id,
                productId: selectedPart,
                returnReason: returnReason as any,
                notes: notes,
                createZeroFeeService: true // Auto create a 0 fee ticket for trackability
            });

            if (res.success) {
                toast.success("İade/Garanti talebi başarıyla oluşturuldu", {
                    description: "Yeniden servis girişi yapıldı."
                });
                setIsModalOpen(false);
                // Refresh the search to show the new return
                handleSearch({ preventDefault: () => { } } as any);
            } else {
                toast.error(res.error || "İşlem başarısız");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-xl border-border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center p-2 bg-muted/20">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Servis Kodu (SRV-...) veya Telefon No ile garanti kontrolü yapın..."
                                className="h-14 pl-12 bg-transparent border-none outline-none focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground/60 w-full"
                            />
                        </div>
                        <div className="p-2 w-full sm:w-auto">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-10 w-full sm:w-auto px-8 rounded-lg  bg-primary text-primary-foreground"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Sorgula"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            {hasSearched && (
                <div className="space-y-4">
                    <h3 className="font-medium text-sm  text-muted-foreground px-1 uppercase tracking-wider">Arama Sonuçları</h3>
                    {results.length === 0 ? (
                        <div className="text-center p-8 bg-muted/10 rounded-xl border border-border border-dashed">
                            <p className="text-muted-foreground font-medium">Böyle bir kayıt bulunamadı.</p>
                        </div>
                    ) : (
                        results.map((ticket) => {
                            const hasActiveWarranty = ticket.warrantyExpiry && new Date(ticket.warrantyExpiry) > new Date();
                            const noWarrantyInfo = !ticket.warrantyExpiry;

                            return (
                                <Card key={ticket.id} className="rounded-xl border-border/50 shadow-sm overflow-hidden group hover:border-border transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">

                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-extrabold text-lg text-primary">{ticket.ticketNumber}</span>
                                                {hasActiveWarranty ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 border-none px-2 py-0.5 rounded-md hover:bg-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Garanti Devam Ediyor
                                                    </Badge>
                                                ) : noWarrantyInfo ? (
                                                    <Badge variant="secondary" className="px-2 py-0.5 rounded-md">
                                                        Garanti Bilgisi Yok
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 border-none px-2 py-0.5 rounded-md hover:bg-rose-500/20">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Garanti Süresi Dolmuş
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                                <div>
                                                    <p className="text-[10px] uppercase  text-muted-foreground/70 mb-1">Müşteri</p>
                                                    <p className="text-sm font-semibold">{ticket.customer?.name || "Bilinmiyor"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase  text-muted-foreground/70 mb-1">Cihaz</p>
                                                    <p className="text-sm font-semibold">{ticket.deviceBrand} {ticket.deviceModel}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] uppercase  text-muted-foreground/70 mb-1">Teslim & Bitiş Tarihi</p>
                                                    <p className="text-sm font-medium">
                                                        {ticket.deliveredAt ? format(new Date(ticket.deliveredAt), "dd MMM yyyy", { locale: tr }) : "-"}
                                                        {' → '}
                                                        <span className={hasActiveWarranty ? "text-emerald-600 " : "text-muted-foreground"}>
                                                            {ticket.warrantyExpiry ? format(new Date(ticket.warrantyExpiry), "dd MMM yyyy", { locale: tr }) : "-"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Kullanılan Parçalar */}
                                            {ticket.usedParts && ticket.usedParts.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span className="text-[10px] uppercase  text-muted-foreground/70 flex items-center h-6 mr-1">Değişen Parçalar:</span>
                                                    {ticket.usedParts.map((part: any) => (
                                                        <div key={part.id} className="flex items-center gap-1.5 text-xs font-medium bg-muted/50 border border-border/50 px-2 py-1 rounded-md">
                                                            <Cpu className="h-3 w-3 text-muted-foreground" />
                                                            {part.product.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0 flex items-center justify-end">
                                            <Button
                                                onClick={() => openReturnModal(ticket)}
                                                disabled={ticket.status !== 'DELIVERED'}
                                                variant={hasActiveWarranty ? "default" : "secondary"}
                                                className="rounded-xl w-full md:w-auto"
                                            >
                                                <ShieldAlert className="h-4 w-4 mr-2" />
                                                Garanti / İade Başlat
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Return Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/50">
                    <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="font-medium text-xl font-extrabold flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-primary" />
                                Garanti İstemi Oluştur
                            </DialogTitle>
                            <DialogDescription className="font-medium pt-1">
                                <strong className="text-foreground">{selectedTicket?.ticketNumber}</strong> numaralı fiş için parça arızası / iade kaydı oluşturuyorsunuz.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-medium text-xs  uppercase text-muted-foreground">Arızalı Parça (İade Edilecek)</Label>
                            <Select value={selectedPart} onValueChange={setSelectedPart}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Değişen parçalardan birini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedTicket?.usedParts?.map((part: any) => (
                                        <SelectItem key={part.product.id} value={part.product.id}>
                                            {part.product.name}
                                        </SelectItem>
                                    ))}
                                    {selectedTicket?.usedParts?.length === 0 && (
                                        <SelectItem value="none" disabled>Parça bulunamadı.</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium text-xs  uppercase text-muted-foreground">İade Sebebi</Label>
                            <Select value={returnReason} onValueChange={setReturnReason}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Sebebini belirleyin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PART_FAILURE">Parça Arızası / Bozuk Parça</SelectItem>
                                    <SelectItem value="LABOR_ERROR">İşçilik Hatası</SelectItem>
                                    <SelectItem value="CUSTOMER_MISUSE">Kullanıcı Kaynaklı Hasar</SelectItem>
                                    <SelectItem value="CUSTOMER_CANCEL">Kullanıcı İptali</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium text-xs  uppercase text-muted-foreground">İnceleme Notları</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Müşterinin şikayetini ve teknik notunuzu yazınız..."
                                className="resize-none h-24 rounded-xl"
                            />
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-xs text-muted-foreground font-medium flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            <p>Onayladığınızda toptancıya iade edebilmeniz için <strong>İade Fişi</strong> oluşur ve işlemi takip edebilmeniz için aynı müşteri adına <strong>Ücretsiz Servis Kaydı</strong> açılır.</p>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border/20 bg-muted/10 pr-6 pb-6">
                        <Button variant="ghost" className="rounded-xl " onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button
                            onClick={handleSubmitReturn}
                            disabled={submitLoading || !selectedPart || !returnReason}
                            className="rounded-xl  px-6"
                        >
                            {submitLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "İşlemi Onayla"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}






