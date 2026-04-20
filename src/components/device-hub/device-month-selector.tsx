"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DeviceMonthSelectorProps {
    initialMonth: string;
}

export function DeviceMonthSelector({ initialMonth }: DeviceMonthSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(initialMonth);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);
        if (val) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("month", val);
            router.push(`/cihaz-listesi?${params.toString()}`);
        }
    };

    return (
        <input
            type="month"
            className="bg-card/50 border border-border/60 text-[10px] text-foreground/80 hover:border-blue-500/50 transition-all px-3 py-1.5 rounded-xl cursor-pointer"
            value={value}
            onChange={handleChange}
        />
    );
}
