import React from "react";
import { getDebts } from "@/lib/actions/debt-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { ReceivablesClient } from "../receivables-client";

export async function ReceivablesStream() {
    const [debtsRaw, shop] = await Promise.all([
        getDebts(),
        getShop()
    ]);
    const debts = JSON.parse(JSON.stringify(debtsRaw));

    return <ReceivablesClient debts={debts} shopName={shop?.name} shopPhone={shop?.phone} />;
}
