"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogOut, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { deleteLeave } from "@/lib/actions/staff-actions";
import { toast } from "sonner";
import { useState } from "react";

interface LeaveLockModalProps {
    leave: any;
    userName: string;
}

export function LeaveLockModal({ leave, userName }: LeaveLockModalProps) {
    const [isEnding, setIsEnding] = useState(false);

    const handleEndLeave = async () => {
        try {
            setIsEnding(true);
            const res = await deleteLeave(leave.id);
            if (res.success) {
                toast.success("İzin sonlandırıldı. İyi çalışmalar!");
                window.location.reload();
            } else {
                toast.error(res.error || "İzin sonlandırılamadı.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsEnding(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="max-w-md w-full bg-card border border-border shadow-2xl rounded-3xl p-8 relative overflow-hidden"
                >
                    {/* Decorative backgrounds */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 blur-[60px] rounded-full" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Coffee className="h-10 w-10 text-primary" strokeWidth={1.5} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Bugün İzinlisiniz!</h2>
                            <p className="text-muted-foreground">
                                Merhaba <span className="font-semibold text-foreground">{userName}</span>,
                                sistem kayıtlarına göre bugün izinli görünüyorsunuz. Dinlenmenize devam edebilir veya çalışmaya başlamak için izninizi sonlandırabilirsiniz.
                            </p>
                        </div>

                        {leave && (
                            <div className="w-full bg-muted/30 rounded-2xl p-4 border border-border/50 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">İzin Tanımı:</span>
                                    <span className="font-medium">{leave.reason || "Genel İzin"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bitiş Tarihi:</span>
                                    <span className="font-medium">
                                        {new Date(leave.endDate).toLocaleDateString("tr-TR")}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 w-full gap-3 pt-4">
                            <Button
                                size="lg"
                                className="w-full rounded-2xl h-14 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleEndLeave}
                                disabled={isEnding}
                            >
                                {isEnding ? "İşleniyor..." : "İzni Bitir ve Çalışmaya Başla"}
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full rounded-2xl h-14 text-base font-semibold bg-transparent hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sistemden Çıkış Yap
                            </Button>
                        </div>

                        <p className="text-[11px] text-muted-foreground/60">
                            * İzni sonlandırdığınızda sisteme anında erişim sağlayabileceksiniz.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
