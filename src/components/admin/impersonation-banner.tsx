"use client";

import { useTransition } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonating } from "@/lib/actions/superadmin-actions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function ImpersonationBanner({ shopName }: { shopName: string }) {
    const { update } = useSession();
    const [isPending, startTransition] = useTransition();

    const handleStopImpersonating = () => {
        startTransition(async () => {
            const result = await stopImpersonating();
            if (result.success) {
                toast.success("Admin paneline dönüldü.");
                await update();
                // Short timeout to allow state propagation
                setTimeout(() => {
                    window.location.href = "/admin/shops";
                }, 1000);
            } else {
                toast.error(result.error || "Hata oluştu.");
            }
        });
    };

    return (
        <div className="bg-amber-600 text-white py-3 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-xl border-b border-white/20 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80">KİMLİĞE BÜRÜNME AKTİF</span>
                    <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                        {shopName} verilerini görüntülüyorsunuz
                    </span>
                </div>
            </div>
            <Button
                onClick={handleStopImpersonating}
                disabled={isPending}
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest h-8 border border-white/20 rounded-lg px-4"
            >
                {isPending ? "Dönülüyor..." : <><LogOut className="w-3 h-3 mr-2" /> ADMİN PANELİNE DÖN</>}
            </Button>
        </div>
    );
}
