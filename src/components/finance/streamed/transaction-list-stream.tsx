import { TransactionHistory } from "../transaction-history";
import { getTransactions } from "@/lib/actions/finance-actions";
import { serializePrisma } from "@/lib/utils";

export async function TransactionListStream() {
    // Initial fetch: 50 transactions
    const transactionsRaw = await getTransactions({ pageSize: 50 });
    const transactions = serializePrisma(transactionsRaw);

    return <TransactionHistory transactions={transactions} />;
}



