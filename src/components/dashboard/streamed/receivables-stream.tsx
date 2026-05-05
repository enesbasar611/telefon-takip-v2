import React from "react";
import { getDebts } from "@/lib/actions/debt-actions";
import { ReceivablesClient } from "../receivables-client";

export async function ReceivablesStream() {
    const debtsRaw = await getDebts();
    // Ensure we pass serializable data
    const debts = JSON.parse(JSON.stringify(debtsRaw));

    return <ReceivablesClient debts={debts} />;
}
