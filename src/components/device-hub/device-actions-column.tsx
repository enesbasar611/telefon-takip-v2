"use client";

import { useState, useTransition } from "react";
import { Trash2, Paperclip, Loader2 } from "lucide-react";
import { deleteDevice } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { DeviceReceiptModal } from "./device-receipt-modal";
import { UpdateDeviceModal } from "./update-device-modal";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeviceActionsColumnProps {
    productId: string;
    deviceName: string;
    device: any;
}

export function DeviceActionsColumn({ productId, deviceName, device }: DeviceActionsColumnProps) {
    const [isDeleting, startDelete] = useTransition();
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleDelete = async (keepInBalance: boolean = false) => {
        startDelete(async () => {
            const result = await deleteDevice(productId, { keepInBalance });
            if (result.success) {
                toast.success(result.message ?? `${deviceName} başarıyla silindi.`);
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["devices"] }),
                    queryClient.invalidateQueries({ queryKey: ["dashboard-init"] }),
                    queryClient.invalidateQueries({ queryKey: ["dashboard-stat-detail"] }),
                ]);
                router.refresh();
            } else {
                toast.error(result.error ?? "Cihaz silinirken bir hata oluştu.");
            }
        });
    };

    return (
        <div className="flex items-center justify-end gap-2 pr-2">
            {/* Düzenle Button (Blue) */}
            <UpdateDeviceModal device={device} />

            {/* Belge Button (Emerald) */}
            <DeviceReceiptModal device={device}>
                <button
                    className="group relative h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                    title="Alım/Satış Belgesi"
                >
                    <Paperclip className="h-4.5 w-4.5" />
                    {(() => {
                        const count = (device.deviceInfo?.photoUrls?.length || 0) +
                            (device.deviceInfo?.sellerIdPhotoUrl ? 1 : 0) +
                            (device.deviceInfo?.invoiceUrl ? 1 : 0);
                        if (count === 0) return null;
                        return (
                            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-emerald-500 text-white text-[9px]  rounded-full border-2 border-[#0B0F19] shadow-lg animate-in zoom-in duration-300">
                                {count}
                            </span>
                        );
                    })()}
                </button>
            </DeviceReceiptModal>

            {/* Silme Button (Rose) with Alert Dialog */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button
                        disabled={isDeleting}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-rose-500/20 hover:border-rose-500/40"
                        title="Sil"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                            <Trash2 className="h-4.5 w-4.5" />
                        )}
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0B0F19] border-white/10 text-foreground/90 rounded-3xl p-8 max-w-[480px]">
                    <AlertDialogHeader className="space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mx-auto">
                            <Trash2 className="h-6 w-6 text-rose-500" />
                        </div>
                        <div className="text-center">
                            <AlertDialogTitle className="text-xl text-white">Cihaz Silinsin mi?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground/80 mt-2 leading-relaxed">
                                <strong className="text-foreground">{deviceName}</strong> için silme işlemi yapmaktasınız. Bu cihazın alım maliyeti bakiyeden düşülsün mü yoksa geçmiş veriler korunarak sadece listeden mi kaldırılsın?
                            </AlertDialogDescription>
                        </div>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-1 gap-3 mt-8">
                        <AlertDialogAction
                            onClick={() => handleDelete(false)}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-auto py-5 px-8 rounded-2xl shadow-lg shadow-rose-600/20 flex flex-col items-center justify-center border-none"
                        >
                            <span className="font-bold underline uppercase text-sm tracking-widest">Tamamen Sil ve Bakiyeyi Düzelt</span>
                            <span className="text-[10px] opacity-70 mt-1 lowercase font-normal text-rose-100">Alım işlemi iptal edilir, bakiye geri yüklenir.</span>
                        </AlertDialogAction>

                        <AlertDialogAction
                            onClick={() => handleDelete(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white h-auto py-5 px-8 rounded-2xl shadow-lg shadow-amber-600/20 flex flex-col items-center justify-center border-none"
                        >
                            <span className="font-bold underline uppercase text-sm tracking-widest">Sadece Listeden Kaldır</span>
                            <span className="text-[10px] opacity-70 mt-1 lowercase font-normal text-amber-100">Bakiye etkilenmez, cihaz geçmiş kayıtlarında kalır.</span>
                        </AlertDialogAction>

                        <AlertDialogCancel className="bg-card border-white/5 h-12 px-6 rounded-2xl hover:bg-muted font-bold text-xs uppercase text-white mt-2 transition-all active:scale-95">VAZGEÇ</AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
