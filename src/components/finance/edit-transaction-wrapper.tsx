"use client";

import { CreateTransactionModal } from "./create-transaction-modal";
import { EditCustomerPaymentModal } from "./edit-customer-payment-modal";

interface EditTransactionWrapperProps {
    transaction: any;
    trigger: React.ReactNode;
}

export function EditTransactionWrapper({ transaction, trigger }: EditTransactionWrapperProps) {
    // Determine if this is a debt payment
    // 1. If it has a debtId
    // 2. If it has a customerId and the category is Tahsilat
    const isDebtPayment = !!transaction.debtId || (!!transaction.customerId && (transaction.category === "Tahsilat" || transaction.category === "Veresiye"));

    if (isDebtPayment) {
        return (
            <EditCustomerPaymentModal
                transaction={transaction}
                trigger={trigger}
            />
        );
    }

    return (
        <CreateTransactionModal
            initialData={transaction}
            trigger={trigger}
        />
    );
}
