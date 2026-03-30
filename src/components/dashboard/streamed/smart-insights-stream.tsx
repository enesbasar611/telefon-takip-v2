import { SmartInsights } from "@/components/dashboard/smart-insights";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { serializePrisma } from "@/lib/utils";

export async function SmartInsightsStream() {
    const statsDataRaw = await getDashboardStats();
    const statsData = serializePrisma(statsDataRaw);

    return (
        <div className="lg:col-span-2 shadow-xl rounded-[2rem] overflow-hidden animate-in fade-in duration-1000">
            <SmartInsights stats={statsData} />
        </div>
    );
}
