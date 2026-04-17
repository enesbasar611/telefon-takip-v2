"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { verifyApprovalCode, resendApprovalCode } from "@/lib/actions/verify-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, Loader2, RefreshCw, LogOut } from "lucide-react";

export default function VerifyPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        setError("");

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are filled
        if (value && index === 5) {
            const fullCode = newCode.join("");
            if (fullCode.length === 6) {
                handleVerify(fullCode);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < 6; i++) {
            newCode[i] = pasted[i] || "";
        }
        setCode(newCode);
        if (pasted.length === 6) {
            handleVerify(pasted);
        } else {
            inputRefs.current[pasted.length]?.focus();
        }
    };

    const handleVerify = async (fullCode: string) => {
        setIsVerifying(true);
        setError("");

        const result = await verifyApprovalCode(fullCode);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } else {
            setError(result.error || "Doğrulama başarısız.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }

        setIsVerifying(false);
    };

    const handleResend = async () => {
        setResending(true);
        setResendMessage("");
        const result = await resendApprovalCode();
        setResendMessage(result.message || result.error || "");
        setResending(false);
        setTimeout(() => setResendMessage(""), 4000);
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[440px]"
            >
                <div className="bg-white rounded-[28px] shadow-[0_8px_60px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Header */}
                    <div className="pt-12 pb-6 px-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
                        >
                            <AnimatePresence mode="wait">
                                {success ? (
                                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                        <CheckCircle2 className="h-8 w-8 text-white" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="shield" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <Shield className="h-8 w-8 text-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <h1 className="text-[22px] font-bold text-[#1d1d1f] tracking-[-0.5px] mb-2">
                            {success ? "Erişim Onaylandı" : "Erişim Onayı Gerekli"}
                        </h1>
                        <p className="text-[14px] text-[#86868b] leading-relaxed max-w-[280px] mx-auto">
                            {success
                                ? "Sisteme yönlendiriliyorsunuz..."
                                : "Yöneticiniz tarafından size iletilen 6 haneli kodu girin."
                            }
                        </p>
                    </div>

                    {/* Code Input */}
                    {!success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="px-10 pb-4"
                        >
                            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <motion.input
                                        key={index}
                                        ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        disabled={isVerifying}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + index * 0.05 }}
                                        className={`
                      w-[52px] h-[60px] text-center text-[24px] font-bold rounded-2xl border-2 outline-none transition-all duration-300
                      ${digit
                                                ? "border-[#007aff] bg-[#007aff]/5 text-[#007aff] shadow-[0_0_0_4px_rgba(0,122,255,0.08)]"
                                                : "border-[#d2d2d7] bg-[#fafafa] text-[#1d1d1f]"
                                            }
                      ${error ? "border-red-400 bg-red-50/50" : ""}
                      focus:border-[#007aff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,122,255,0.12)]
                      disabled:opacity-50
                    `}
                                        style={{ fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace" }}
                                    />
                                ))}
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center text-[13px] text-red-500 font-medium mb-4"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Loading Indicator */}
                            {isVerifying && (
                                <div className="flex justify-center mb-4">
                                    <Loader2 className="h-6 w-6 text-[#007aff] animate-spin" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Success animation */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-10 pb-8 flex justify-center"
                        >
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl text-[14px] font-semibold">
                                <CheckCircle2 className="h-5 w-5" />
                                Hoş geldiniz!
                            </div>
                        </motion.div>
                    )}

                    {/* Footer Actions */}
                    {!success && (
                        <div className="px-10 pb-10 space-y-3">
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="flex items-center gap-1.5 text-[13px] text-[#007aff] hover:text-[#0056b3] font-semibold transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                                    Kodu Tekrar Gönder
                                </button>
                                <span className="text-[#d2d2d7]">|</span>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="flex items-center gap-1.5 text-[13px] text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Çıkış Yap
                                </button>
                            </div>

                            {/* Resend Message */}
                            <AnimatePresence>
                                {resendMessage && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center text-[12px] text-emerald-600 font-medium"
                                    >
                                        {resendMessage}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* User Info */}
                            {session?.user?.email && (
                                <p className="text-center text-[11px] text-[#c7c7cc] mt-4">
                                    {session.user.email}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Text */}
                <p className="text-center text-[11px] text-[#aeaeb2] mt-6">
                    Erişim talebi yöneticinize iletilmiştir.
                </p>
            </motion.div>
        </div>
    );
}
