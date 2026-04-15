"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Smartphone,
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  Wrench,
  Package,
  History,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ServiceStatus } from "@prisma/client";
import { cn, formatPhone } from "@/lib/utils";
import { PatternLock } from "@/components/ui/pattern-lock";
import { parseServiceDiagnosticWithAI } from "@/lib/actions/gemini-actions";

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "bg-slate-500" },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-500" },
  REPAIRING: { label: "Tamirde", color: "bg-orange-500" },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500" },
  READY: { label: "Hazır", color: "bg-emerald-500" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-600" },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-500" },
};

interface ServiceDetailsModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDetailsModal({ ticket, isOpen, onClose }: ServiceDetailsModalProps) {
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  if (!ticket) return null;

  const status = statusConfig[ticket.status as ServiceStatus];

  const handleAIRecommendation = async () => {
    setIsAILoading(true);
    try {
      const result = await parseServiceDiagnosticWithAI(
        ticket.problemDesc,
        `${ticket.deviceBrand} ${ticket.deviceModel}`,
        "PHONE_REPAIR" // Or get from context if available
      );
      if (result.success) {
        setAiRecommendation(result.data);
      }
    } catch (error) {
      console.error("AI Recommendation error:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleClose = () => {
    setAiRecommendation(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden bg-card border-none shadow-2xl rounded-[1.5rem] md:rounded-[2rem]">
        <DialogHeader className="p-6 md:p-8 bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-2xl">
                <Smartphone className="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="font-bold text-2xl tracking-tight">{ticket.ticketNumber}</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground/80 mt-0.5">
                  {ticket.deviceBrand} {ticket.deviceModel}
                </DialogDescription>
              </div>
            </div>
            <Badge className={cn("text-[10px] sm:text-xs font-bold px-6 py-2 shadow-xl border-none w-fit", status.color)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 md:px-8 py-2 h-[75vh]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">

            {/* Left Column: Customer & Device & AI */}
            <div className="lg:col-span-7 space-y-8">

              {/* Arıza Detayı & AI Butonu */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Arıza Detayları</h4>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIRecommendation}
                    disabled={isAILoading}
                    className="h-9 rounded-xl bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 gap-2 text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    {isAILoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Yapay Zeka Tavsiyesi
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-3xl p-6 border border-border/50 shadow-inner group relative">
                    <p className="text-base font-medium leading-relaxed italic text-foreground/90">
                      "{ticket.problemDesc}"
                    </p>
                  </div>

                  {/* AI Recommendation Result */}
                  {aiRecommendation && (
                    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-500/5 to-violet-500/5 dark:from-blue-500/10 dark:to-violet-500/10 border border-blue-200 dark:border-blue-900/50 rounded-3xl space-y-6 animate-in fade-in zoom-in-95 duration-500 shadow-xl shadow-blue-500/5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">BAŞAR AI ANALİZİ</span>
                        <div className={cn(
                          "ml-auto px-3 py-1.5 rounded-full text-[10px] font-bold border",
                          aiRecommendation.riskLevel === "Yüksek" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                            aiRecommendation.riskLevel === "Orta" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}>
                          ÖNEM: {aiRecommendation.riskLevel}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-blue-500/60" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Olası Teşhisler</span>
                          </div>
                          <ul className="text-sm text-foreground/80 space-y-2 list-none">
                            {aiRecommendation.possibleCauses?.map((c: string, i: number) => (
                              <li key={i} className="flex gap-2 items-start">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-blue-500/60" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Önerilen Parçalar</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aiRecommendation.suggestedParts?.map((p: any, i: number) => (
                              <div key={i} className="flex flex-col gap-1 p-2.5 rounded-xl bg-background border border-border/50">
                                <span className="text-xs font-semibold text-foreground">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground">Tahmini: ₺{p.estimatedPrice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {aiRecommendation.professionalNote && (
                        <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 flex gap-3">
                          <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Wrench className="h-3 w-3 text-blue-500" />
                          </div>
                          <p className="text-xs leading-relaxed italic text-blue-700 dark:text-blue-300">
                            {aiRecommendation.professionalNote}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Müşteri ve Cihaz Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-card/50 rounded-3xl p-6 space-y-4 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Müşteri</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">İsim</span>
                      <span className="text-sm font-semibold">{ticket.customer?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">Telefon</span>
                      <span className="text-sm font-mono text-blue-500">{formatPhone(ticket.customer?.phone)}</span>
                    </div>
                  </div>
                </section>

                <section className="bg-card/50 rounded-3xl p-6 space-y-4 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Cihaz</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">IMEI / Seri</span>
                      <span className="text-sm font-mono select-all">{ticket.imei || ticket.serialNumber || "Bilinmiyor"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">Durum</span>
                      <Badge variant="outline" className="text-[10px] py-0">{ticket.cosmeticCondition || "Normal"}</Badge>
                    </div>
                  </div>
                </section>
              </div>

              {ticket.devicePassword && (
                <section className="bg-muted/10 rounded-3xl p-6 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Cihaz Güvenliği</h4>
                  </div>
                  {ticket.devicePassword.startsWith("DESEN:") ? (
                    <div className="flex flex-col items-center gap-4">
                      <PatternLock
                        width={180}
                        height={180}
                        readOnly
                        initialPattern={ticket.devicePassword.replace("DESEN:", "").split(",").map(Number)}
                      />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">Kilit Deseni</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50 shadow-inner">
                      <span className="text-xs font-bold text-muted-foreground uppercase">PIN / Şifre</span>
                      <span className="text-base font-mono font-black select-all tracking-widest">{ticket.devicePassword}</span>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right Column: History & Misc */}
            <div className="lg:col-span-5 space-y-6">

              <section className="bg-muted/10 rounded-3xl p-6 border border-border/50">
                <div className="flex items-center gap-2 mb-6">
                  <History className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">İşlem Geçmişi</h4>
                </div>
                <div className="space-y-6">
                  {ticket.logs?.map((log: any, idx: number) => (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full mt-1.5 z-10",
                          idx === 0 ? "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" : "bg-muted-foreground/20"
                        )} />
                        {idx !== ticket.logs.length - 1 && <div className="w-px h-full bg-border -mt-1 group-hover:bg-primary/20 transition-colors" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("text-xs font-bold", idx === 0 ? "text-primary" : "text-foreground/70")}>{log.status}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">{format(new Date(log.createdAt), "dd MMM, HH:mm", { locale: tr })}</span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!ticket.logs || ticket.logs.length === 0) && (
                    <div className="text-center py-8">
                      <History className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground italic tracking-tight">Henüz işlem geçmişi kaydedilmemiştir.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-card/50 rounded-3xl p-6 space-y-4 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tarihler</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">Kayıt</span>
                    <span className="text-xs font-medium">{format(new Date(ticket.createdAt), "dd MMMM yyyy", { locale: tr })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase">Beklenen Teslim</span>
                    <span className="text-xs font-bold text-blue-500">
                      {ticket.estimatedDeliveryDate ? format(new Date(ticket.estimatedDeliveryDate), "dd MMMM yyyy", { locale: tr }) : "Belirtilmedi"}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 md:p-8 bg-muted/30 border-t border-border/50">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tahmini Tutar</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground tracking-tighter">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">KDV DAHİL</span>
                </div>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Atanan Teknisyen</span>
                <span className="text-sm font-bold text-foreground/80">{ticket.technician?.name || "Atanmamış"}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="flex-1 sm:flex-none h-12 px-6 rounded-2xl font-bold text-sm" onClick={handleClose}>Kapat</Button>
              <Button className="flex-1 sm:flex-none h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 gap-2">
                <Receipt className="h-4 w-4" /> Yazdır / Fatura
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
