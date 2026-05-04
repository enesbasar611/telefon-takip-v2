"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormsTab } from "@/components/settings/tabs/forms-tab";
import { Layout } from "lucide-react";

export function AdminFormsEditor({ shop, open, onOpenChange }: {
    shop: any,
    open: boolean,
    onOpenChange: (o: boolean) => void
}) {
    if (!shop) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-white dark:bg-[#0a0a0a] border-border dark:border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
                <DialogHeader className="px-8 py-6 border-b border-border dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black italic tracking-tighter">
                        <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                            <Layout className="w-5 h-5" />
                        </div>
                        {shop.name.toUpperCase()} - SEKTÖREL FORM YAPILANDIRMASI
                    </DialogTitle>
                </DialogHeader>
                <div className="p-8 overflow-y-auto h-[calc(90vh-100px)] custom-scrollbar">
                    <FormsTab shop={shop} adminShopId={shop.id} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
