"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.03, 0.06, 0.03],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.03, 0.05, 0.03],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500 blur-[100px]"
                />
            </div>

            <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
                {/* 404 Number */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-8"
                >
                    <motion.h1
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="text-[8rem] md:text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 select-none"
                    >
                        404
                    </motion.h1>
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <AlertTriangle className="w-16 h-16 text-amber-500/20" />
                    </motion.div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        Sayfa Bulunamadı
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                        Lütfen adresi kontrol edin veya ana sayfaya dönün.
                    </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
                >
                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="h-12 px-6 rounded-2xl bg-slate-950 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-all"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ana Sayfaya Dön
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Geri Git
                    </Button>
                </motion.div>

                {/* Search hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60"
                >
                    <Search className="w-3 h-3" />
                    <span>Global arama ile hızlıca içerik bulabilirsiniz</span>
                </motion.div>
            </div>
        </div>
    );
}
