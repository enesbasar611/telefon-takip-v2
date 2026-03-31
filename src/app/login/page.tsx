"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, LogIn, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none" />

            <div className="z-10 w-full max-w-md">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-primary/20 backdrop-blur-xl">
                        <Smartphone className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Başar Teknik</h1>
                    <p className="text-slate-400">Yeni nesil mağaza ve teknik servis yönetimi</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-10 pointer-events-none" />

                    <CardHeader className="space-y-1 pb-8 text-center border-b border-slate-800/50">
                        <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
                        <CardDescription className="text-slate-400">
                            Devam etmek için Google hesabınızla giriş yapın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 pb-10 px-8 flex flex-col gap-6">
                        <Button
                            variant="default"
                            size="lg"
                            className="w-full text-base font-semibold h-14 bg-white text-black hover:bg-slate-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                            )}
                            {isLoading ? "Giriş Yapılıyor..." : "Google ile Giriş Yap"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>

                        <div className="relative mt-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500 backdrop-blur-sm">
                                    Güvenli Erişim
                                </span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Sistem Aktif ve Çalışıyor
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} Başar Teknik Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}
