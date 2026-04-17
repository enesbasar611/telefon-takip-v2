"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (error) {
            toast.error("Google girişi sırasında bir hata oluştu");
            setIsLoading(false);
        }
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/dashboard",
            });

            if (result?.error) {
                toast.error("Giriş bilgileri hatalı");
            } else {
                window.location.href = "/dashboard";
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
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
                        <div className="relative h-20 w-20 bg-[#111] rounded-3xl flex items-center justify-center mb-6 border border-border shadow-2xl">
                            <Smartphone className="h-10 w-10 text-violet-500" />
                        </div>
                    </div>
                    <h1 className="font-medium text-4xl font-extrabold mb-3 tracking-tight bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
                        BAŞAR TEKNİK
                    </h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-border rounded-full">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px]  text-muted-foreground uppercase tracking-widest">Güvenli Yönetim Sistemi v2.0</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-border/50 bg-[#0A0A0A]/60 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-violet-600 to-transparent opacity-50" />
                        <CardHeader className="text-center pt-10 pb-6">
                            <CardTitle className="font-medium text-2xl  text-white tracking-tight">Giriş Yap</CardTitle>
                            <CardDescription className="text-muted-foreground/80 text-sm mt-2">
                                Dükkan yönetimine başlamak için Google hesabınızı kullanın
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 flex flex-col gap-6">
                            {/* Credentials Form */}
                            <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">E-POSTA ADRESİ</Label>
                                    <Input
                                        type="email"
                                        placeholder="enes@basarteknik.tech"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-white/5 border-border rounded-2xl text-white placeholder:text-white/20  focus:ring-2 focus:ring-violet-500/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest ml-1">ŞİFRE</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-white/5 border-border rounded-2xl text-white placeholder:text-white/20  focus:ring-2 focus:ring-violet-500/20"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-violet-600 text-white hover:bg-violet-700 rounded-2xl  transition-all active:scale-95 shadow-xl shadow-violet-600/20"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Yap"}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/50" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                    <span className="bg-[#0A0A0A] px-4 text-muted-foreground/80 ">Veya</span>
                                </div>
                            </div>

                            {/* Direct Google Sign-In Button */}
                            <Button
                                type="button"
                                className="w-full h-14 bg-[#111] border border-white/10 text-white hover:bg-white/5 hover:border-white/20 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl group"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.08z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09a6.96 6.96 0 0 1 0-4.18V7.07H2.18a11.01 11.01 0 0 0 0 9.86l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span className="font-semibold tracking-tight text-white/90 group-hover:text-white">Google ile Giriş Yap</span>
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-3 justify-center text-slate-600">
                                <Sparkles className="h-3 w-3 text-violet-500/50" />
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






