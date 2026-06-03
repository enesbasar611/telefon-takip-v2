"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, PersonStanding, Smartphone, Receipt } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

export const StepIndicator = ({ currentStep, setCurrentStep }: StepIndicatorProps) => {
    const steps = [
        { step: 1, label: "Müşteri", icon: PersonStanding },
        { step: 2, label: "Cihaz & Arıza", icon: Smartphone },
        { step: 3, label: "İşlem & Ödeme", icon: Receipt },
    ];

    return (
        <div className="flex items-center justify-between px-4 mb-8">
            {steps.map((s, idx) => (
                <div key={s.step} className="flex items-center flex-1 last:flex-none group">
                    <div
                        onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                        className={cn(
                            "flex items-center gap-3 transition-all duration-500 cursor-default",
                            s.step < currentStep && "cursor-pointer hover:opacity-80",
                            s.step === currentStep ? "opacity-100" : "opacity-40"
                        )}
                    >
                        <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-500 border shadow-sm",
                            s.step === currentStep
                                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-primary/20"
                                : s.step < currentStep
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                    : "bg-muted border-border text-muted-foreground"
                        )}>
                            {s.step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">ADIM 0{s.step}</span>
                            <span className="text-xs font-bold whitespace-nowrap">{s.label}</span>
                        </div>
                    </div>
                    {idx < 2 && (
                        <div className="flex-1 mx-6 h-[1px] bg-border/40 relative overflow-hidden">
                            <div
                                className="absolute inset-0 bg-primary transition-all duration-1000 ease-in-out"
                                style={{ width: currentStep > s.step ? "100%" : "0%" }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
