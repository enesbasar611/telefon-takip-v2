"use client";

import { useFormContext } from "react-hook-form";
import { Smartphone, Grid, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormFactory } from "@/components/common/form-factory";
import { AIDiagnosticPanel } from "./ai-diagnostic-panel";
import { PhotoManager, type PhotoFile } from "./photo-manager";
import { SectionBadge } from "./section-badge";
import { cn } from "@/lib/utils";

interface StepDeviceDetailsProps {
    isSimpleMode: boolean;
    setIsPatternModalOpen: (open: boolean) => void;
    modelSuggestions: string[];
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
    industryFields: any;
    aiDiagnosisMutation: any;
    diagnosticResult: any;
    handleAIDiagnosis: () => void;
    photos: PhotoFile[];
    onAddPhoto: (files: PhotoFile[]) => void;
    onRemovePhoto: (id: string) => void;
    getInputClass: (name: string) => string;
    onAddPartToStock?: (partName: string, estimatedPrice: number) => void;
}

export const StepDeviceDetails = ({
    isSimpleMode,
    setIsPatternModalOpen,
    modelSuggestions,
    showSuggestions,
    setShowSuggestions,
    industryFields,
    aiDiagnosisMutation,
    diagnosticResult,
    handleAIDiagnosis,
    photos,
    onAddPhoto,
    onRemovePhoto,
    getInputClass,
    onAddPartToStock
}: StepDeviceDetailsProps) => {
    const { register, setValue, formState: { errors }, control } = useFormContext();

    const cardClass = "bg-card/40 dark:bg-[#0A0A0B]/40 backdrop-blur-md p-5 rounded-2xl border border-border/50 shadow-sm transition-all hover:border-primary/20 hover:shadow-md group/card relative overflow-hidden";
    const labelClass = "text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-1.5 block ml-0.5 transition-colors group-hover/card:text-muted-foreground/70";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className={cardClass}>
                <div className="flex items-center justify-between mb-8">
                    <SectionBadge icon={Smartphone} title="Cihaz Bilgileri" className="mb-0" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase text-blue-500 hover:bg-blue-500/10 rounded-lg gap-2"
                        onClick={() => setIsPatternModalOpen(true)}
                    >
                        <Grid className="h-3.5 w-3.5" /> Şifre Deseni Çiz
                    </Button>
                </div>

                {isSimpleMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <Label className={labelClass}>Marka</Label>
                            <Input {...register("deviceBrand")} placeholder="Apple, Samsung..." className={getInputClass("deviceBrand")} />
                        </div>
                        <div className="space-y-2 relative">
                            <Label className={labelClass}>Model</Label>
                            <Input
                                {...register("deviceModel")}
                                placeholder="iPhone 15, S24..."
                                className={getInputClass("deviceModel")}
                                onFocus={() => modelSuggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            {showSuggestions && modelSuggestions.length > 0 && (
                                <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden py-1 animate-in fade-in duration-200">
                                    {modelSuggestions.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onMouseDown={() => {
                                                setValue("deviceModel", m);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors"
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className={labelClass}>Cihaz Şifresi</Label>
                            <Input {...register("devicePassword")} placeholder="Opsiyonel..." className={getInputClass("devicePassword")} />
                        </div>
                    </div>
                ) : (
                    <FormFactory
                        fields={industryFields}
                        register={register}
                        control={control}
                        errors={errors}
                        twoCol={true}
                        onPatternClick={() => setIsPatternModalOpen(true)}
                    />
                )}
            </section>

            <section className={cardClass}>
                <AIDiagnosticPanel
                    isDiagnosticPending={aiDiagnosisMutation.isPending}
                    diagnosticResult={diagnosticResult}
                    onAnalyze={handleAIDiagnosis}
                    onAddPartToStock={onAddPartToStock}
                />

                {!isSimpleMode && (
                    <div className="pt-8 border-t border-white/5 mt-8">
                        <PhotoManager
                            photos={photos}
                            onAdd={onAddPhoto}
                            onRemove={onRemovePhoto}
                        />
                    </div>
                )}
            </section>
        </div>
    );
};
