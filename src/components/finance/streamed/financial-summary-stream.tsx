import { getFinancialSummary } from "@/lib/actions/finance-actions";
import { serializePrisma } from "@/lib/utils";
import { AccountList } from "../account-list";
import { FinanceDashboard } from "../finance-dashboard";

export async function FinancialSummaryStream() {
    const summaryRaw = await getFinancialSummary();
    const summary = serializePrisma(summaryRaw);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <FinanceDashboard summary={summary} />
            <AccountList accounts={summary.accounts || []} />
        </div>
    );
}
