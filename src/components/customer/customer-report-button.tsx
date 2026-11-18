"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";
import { CustomerActivityReportModal } from "./customer-activity-report-modal";

interface CustomerReportButtonProps {
    customer: any;
    shop?: any;
    rates?: any;
    defaultCurrency?: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    label?: string;
}

export function CustomerReportButton({
    customer,
    shop,
    rates,
    defaultCurrency = "TRY",
    variant = "outline",
    size = "default",
    className,
    label = "Faaliyet Ekstresi & Çıktı"
}: CustomerReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!customer) return null;

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setIsOpen(true)}
                className={className}
                title="Müşteriye bu zamana kadar yapılmış tüm satış, servis ve ürünlerin dökümünü ve çıktısını al"
            >
                <Printer className="w-4 h-4 mr-2 text-primary" />
                <span>{label}</span>
            </Button>

            {isOpen && (
                <CustomerActivityReportModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    customer={customer}
                    shop={shop}
                    rates={rates}
                    defaultCurrency={defaultCurrency}
                />
            )}
        </>
    );
}

