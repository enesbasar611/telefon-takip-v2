"use client";

import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { getIndustryLabel } from "@/lib/industry-utils";

interface ServiceActionsProps {
    shop?: any;
}

export function ServiceActions({ shop }: ServiceActionsProps) {
    return (
        <CreateServiceModal
            shop={shop}
            trigger={
                <Button className="gap-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-500 text-white border-none">
                    <Plus className="h-4 w-4" />
                    Yeni Kayıt
                </Button>
            }
        />
    );
}
