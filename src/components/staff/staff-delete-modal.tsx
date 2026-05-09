"use client";

import { useState, useEffect } from "react";
import { Role } from "@prisma/client";
import {
    AlertTriangle,
    Trash2,
    UserPlus,
    UserMinus,
    ChevronRight,
    Users
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { checkStaffDeletion, deleteStaff } from "@/lib/actions/staff-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StaffDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any | null;
    otherStaff: any[];
    onDeleted: () => void;
}

export function StaffDeleteModal({ isOpen, onClose, member, otherStaff, onDeleted }: StaffDeleteModalProps) {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<{
        hasPendingTasks: boolean;
        pendingTasks: number;
        role: Role;
    } | null>(null);
    const [selectedAction, setSelectedAction] = useState<'TRANSFER' | 'DELETE_ALL' | 'DETACH' | null>(null);
    const [transferToId, setTransferToId] = useState<string>("");

    useEffect(() => {
        if (isOpen && member) {
            setChecking(true);
            checkStaffDeletion(member.id).then(res => {
                if (res.success) {
                    setStatus({
                        hasPendingTasks: res.hasPendingTasks!,
                        pendingTasks: res.pendingTasks!,
                        role: res.role as Role
                    });
                    if (!res.hasPendingTasks) {
                        setSelectedAction('DETACH'); // Default for no tasks
                    }
                }
                setChecking(false);
            });
        } else {
            setStatus(null);
            setSelectedAction(null);
            setTransferToId("");
        }
    }, [isOpen, member]);

    const handleDelete = async () => {
        if (!member) return;
        if (status?.hasPendingTasks && !selectedAction) {
            toast.error("Lütfen bir işlem seçin.");
            return;
        }
        if (selectedAction === 'TRANSFER' && !transferToId) {
            toast.error("Lütfen transfer edilecek personeli seçin.");
            return;
        }

        setLoading(true);
        const res = await deleteStaff(member.id, selectedAction ? {
            action: selectedAction,
            transferToId: transferToId || undefined
        } : undefined);

        if (res.success) {
            toast.success("Personel başarıyla silindi.");
            onDeleted();
            onClose();
        } else {
            toast.error(res.error || "Bir hata oluştu.");
        }
        setLoading(false);
    };

    if (!member) return null;

    const availableStaff = otherStaff.filter(s =>
        status?.role === 'COURIER' ? s.role === 'COURIER' : s.role === status?.role
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose()}>
            <DialogContent className="max-w-md bg-white dark:bg-card border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl overflow-hidden p-0">
                <div className="bg-rose-500/10 p-8 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[1.4rem] bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Trash2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black tracking-tight">{member.name} Siliniyor</DialogTitle>
                        <DialogDescription className="text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-widest mt-1 italic">
                            DİKKAT: BU İŞLEM GERİ ALINAMAZ
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {checking ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="h-12 w-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kontrol Ediliyor...</p>
                        </div>
                    ) : status?.hasPendingTasks ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                        Bu personelin üzerine atanmış {status.pendingTasks} adet tamamlanmamış görev bulunuyor.
                                    </p>
                                    <p className="text-[10px] text-orange-700/60 dark:text-orange-400/60 font-medium">
                                        Personeli silmeden önce bu görevlere ne yapılacağını seçmelisiniz.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">GÖREV YÖNETİMİ</p>

                                <button
                                    onClick={() => setSelectedAction('TRANSFER')}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                                        selectedAction === 'TRANSFER'
                                            ? "bg-blue-500/5 border-blue-600"
                                            : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedAction === 'TRANSFER' ? "bg-blue-600 text-white" : "bg-white dark:bg-card text-muted-foreground"
                                    )}>
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">Başka Birine Aktar</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Görevleri yeni personele ata</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                                </button>

                                {selectedAction === 'TRANSFER' && (
                                    <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                        <Select value={transferToId} onValueChange={setTransferToId}>
                                            <SelectTrigger className="h-14 bg-blue-500/5 border-blue-500/20 rounded-2xl focus:ring-0">
                                                <SelectValue placeholder="Görevlerin devredileceği kişi" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-card rounded-2xl border-border/50">
                                                {availableStaff.length > 0 ? (
                                                    availableStaff.map((s) => (
                                                        <SelectItem key={s.id} value={s.id} className="rounded-xl py-3 px-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-bold uppercase tracking-tight">{s.name}</span>
                                                                <span className="text-[9px] text-muted-foreground font-medium">{s.role}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Transfer edilebilecek kişi bulunamadı</p>
                                                        <p className="text-[9px] text-muted-foreground mt-1">Lütfen önce yeni bir {status.role} oluşturun.</p>
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedAction('DETACH')}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                                        selectedAction === 'DETACH'
                                            ? "bg-amber-500/5 border-amber-600"
                                            : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedAction === 'DETACH' ? "bg-amber-500 text-white" : "bg-white dark:bg-card text-muted-foreground"
                                    )}>
                                        <UserMinus className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">Havuzda Bırak</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Görevleri sahipsiz bırak (havuza at)</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button
                                    onClick={() => setSelectedAction('DELETE_ALL')}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                                        selectedAction === 'DELETE_ALL'
                                            ? "bg-rose-500/5 border-rose-600"
                                            : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedAction === 'DELETE_ALL' ? "bg-rose-600 text-white" : "bg-white dark:bg-card text-muted-foreground"
                                    )}>
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-rose-600">Her Şeyi Sil</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Kurye ile birlikte tüm görevlerini sil</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                <span className="font-bold text-slate-900 dark:text-white uppercase px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-lg mr-2 italic">{member.name}</span>
                                adlı personeli sistemden çıkarmak istediğinize emin misiniz?
                            </p>
                            <p className="text-[10px] text-rose-500/60 font-black uppercase tracking-[0.2em]">BU İŞLEM PERSONELİN SİSTEME ERİŞİMİNİ ANINDA KESER</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 pt-0 gap-3 border-t border-slate-50 dark:border-white/5 pt-8">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-2xl h-14 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={loading || (status?.hasPendingTasks && !selectedAction)}
                        className="rounded-3xl h-14 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/20 disabled:grayscale transition-all"
                    >
                        {loading ? "İŞLEM YAPILIYOR..." : status?.hasPendingTasks ? "GÖREVLERİ YÖNET VE SİL" : "PERSONELİ KALDIR"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
