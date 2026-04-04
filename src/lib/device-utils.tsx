import { TrendingUp as ArrowUp, TrendingDown as ArrowDown } from "lucide-react";

export const APPLE_COLORS = [
    { name: "Natural Titanium", hex: "#A7A5A0" },
    { name: "Blue Titanium", hex: "#424855" },
    { name: "White Titanium", hex: "#F2F3EE" },
    { name: "Black Titanium", hex: "#3C3D3A" },
    { name: "Deep Purple", hex: "#594F63" },
    { name: "Space Black", hex: "#1F2020" },
    { name: "Silver", hex: "#E3E4E5" },
    { name: "Gold", hex: "#F5E3C8" },
    { name: "Sierra Blue", hex: "#9EB5C7" },
    { name: "Graphite", hex: "#41424C" },
    { name: "Pacific Blue", hex: "#2E4755" },
    { name: "Midnight", hex: "#2C343C" },
    { name: "Starlight", hex: "#F0EBE3" },
    { name: "Desert Titanium", hex: "#C8B19C" },
    { name: "Rose Gold", hex: "#E6C7C2" },
];

export const getColorHex = (brand?: string, colorName?: string) => {
    if (!brand || !colorName) return null;
    const b = brand.toLowerCase();
    const c = colorName.toLowerCase();

    if (b === "apple") {
        const found = APPLE_COLORS.find(col => col.name.toLowerCase() === c);
        if (found) return found.hex;
    }
    return null;
};

export function getMonthlySalesComparisonHtml(monthlyTotal: number, lastMonthTotal: number) {
    const diff = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 100;
    const isUp = diff >= 0;

    return (
        <div className={`flex items-center gap-1 text-[11px] font-black mt-1 ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
            {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {isUp ? "+" : ""}{diff.toFixed(1)}%
            <span className="text-slate-600 font-bold ml-1">geçen aya göre</span>
        </div>
    );
}
