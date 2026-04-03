"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (error) {
            console.error("Giriş hatası:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden text-white font-sans">
            {/* Pure Dark Atmosphere */}
            <div className="fixed inset-0 bg-black -z-20" />

            <div className="z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center mb-10 text-center"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-violet-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative h-20 w-20 bg-[#111] rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
                            <Smartphone className="h-10 w-10 text-violet-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold mb-3 tracking-tight bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
                        BAŞAR TEKNİK
                    </h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Güvenli Yönetim Sistemi v2.0</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-white/5 bg-[#0A0A0A]/60 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-violet-600 to-transparent opacity-50" />
                        <CardHeader className="text-center pt-10 pb-6">
                            <CardTitle className="text-2xl font-black text-white tracking-tight">Giriş Yap</CardTitle>
                            <CardDescription className="text-slate-500 text-sm mt-2">
                                Dükkan yönetimine başlamak için Google hesabınızı kullanın
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 flex flex-col gap-6">
                            <Button
                                className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg group"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <img src="https://www.google.com/favicon.ico" className="h-5 w-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                                        Google ile Devam Et
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-3 justify-center text-slate-600">
                                <Sparkles className="h-3 w-3" />
                                <span className="text-[10px] font-medium uppercase tracking-[0.2em]">BAŞAR AI Entegrasyonu Aktif</span>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-center mt-8 text-[11px] text-slate-600 font-medium uppercase tracking-widest px-4 leading-relaxed">
                        Bu sistem sadece yetkili personel kullanımı içindir. <br /> Tüm işlemler kayıt altına alınmaktadır.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}