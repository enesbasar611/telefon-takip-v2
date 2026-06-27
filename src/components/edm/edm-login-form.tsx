"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Lock, User, Sparkles } from "lucide-react";

export function EDMLoginForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/edm/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, rememberMe }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Oturum başarıyla açıldı", {
                    description: `Session ID: ${data.sessionId || "Alındı"}`,
                    icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />
                });
                onSuccess();
            } else {
                toast.error(data.error || "Giriş başarısız oldu.");
            }
        } catch (error) {
            toast.error("Bağlantı hatası oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/5">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="w-full max-w-[440px]"
            >
                <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.05)] border border-border/40 relative overflow-hidden">
                    {/* Apple Style Subtle Gradient Background */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground mb-3">
                            EDM Portal Giriş
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Entegrasyon üzerinden fatura kesmek için e-imza / portal bilgilerinizi kullanın.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 ml-2">Portal Kullanıcı Adı</Label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Kullanıcı Adı"
                                        className="h-16 pl-14 rounded-3xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all font-medium text-lg placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 ml-2">Güvenli Şifre</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-16 pl-14 rounded-3xl bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all text-lg placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 ml-1">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked === true)}
                                className="rounded-lg border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm font-bold text-muted-foreground/60 cursor-pointer select-none"
                            >
                                Oturumu Açık Tut (Beni Hatırla)
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] mt-4"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 mr-3 fill-current" />
                                    Giriş Yap
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/30">
                            Güvenli 256-bit AES Şifreleme
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
