"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFoundPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="text-center px-4 max-w-lg mx-auto">
                {/* 404 Number */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-6"
                >
                    <motion.h1
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="text-[6rem] md:text-[8rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 select-none"
                    >
                        404
                    </motion.h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Sayfa Bulunamadı
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
                >
                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="h-11 px-5 rounded-xl bg-slate-950 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-all"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ana Sayfa
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="h-11 px-5 rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Geri Git
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
