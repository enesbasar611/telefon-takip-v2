"use client";

import { useState, useTransition } from "react";
import { Trash2, Paperclip, Loader2, PenLine } from "lucide-react";
import { deleteDevice } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { DeviceReceiptModal } from "./device-receipt-modal";
import { UpdateDeviceModal } from "./update-device-modal";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
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

    const handleDelete = async () => {
        startDelete(async () => {
            const result = await deleteDevice(productId);
            if (result.success) {
                toast.success(`${deviceName} başarıyla silindi.`);
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
                    className="group relative h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                    title="Alım/Satış Belgesi"
                >
                    <Paperclip className="h-4 w-4" />
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
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-rose-500/20 hover:border-rose-500/40"
                        title="Sil"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0B0F19] border-border text-foreground/90 rounded-3xl p-8 max-w-[400px]">
                    <AlertDialogHeader className="space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mx-auto">
                            <Trash2 className="h-6 w-6 text-rose-500" />
                        </div>
                        <div className="text-center">
                            <AlertDialogTitle className="text-xl  text-white">Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground/80  mt-2 leading-relaxed">
                                <strong className="text-foreground">{deviceName}</strong> kalıcı olarak silinecek. Bu cihazla ilgili tüm geçmiş (hareketler, satış kalemleri) temizlenecektir. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3 sm:justify-center">
                        <AlertDialogCancel className="bg-card border-border h-11 px-6 rounded-xl  hover:bg-muted">VAZGEÇ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-11 px-8 rounded-xl  shadow-lg shadow-rose-600/20"
                        >
                            EVET, SİL
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}



