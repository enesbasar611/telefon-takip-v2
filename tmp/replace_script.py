import sys
import os

file_path = r'c:\Users\PC\Desktop\dukkan-app\telefon-takip-v2\telefon-takip-v2\src\components\finance\veresiye-client.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines to replace (1-indexed 1400 to 1633)
start_idx = 1399 # 1400-1
end_idx = 1633   # 1633

new_content = """                                {aggregatedData.length > 0 && !isPending && (
                                    <div className={cn(
                                        "transition-all duration-500",
                                        viewMode === 'grid'
                                            ? "grid grid-cols-1 lg:grid-cols-2 gap-3 p-4 md:p-6"
                                            : "flex flex-col"
                                    )}>
                                        <AnimatePresence mode="popLayout">
                                            {aggregatedData.map((item, idx) => (
                                                <VeresiyeCustomerCard
                                                    key={item.customerId}
                                                    item={item}
                                                    idx={idx}
                                                    viewMode={viewMode}
                                                    usdRate={usdRate}
                                                    rates={rates}
                                                    isSelected={selectedCustomerIds.includes(item.customerId)}
                                                    onSelect={(id) => {
                                                        setSelectedCustomerIds(prev =>
                                                            prev.includes(id)
                                                                ? prev.filter(x => x !== id)
                                                                : [...prev, id]
                                                        );
                                                    }}
                                                    onWhatsApp={handleWhatsAppMessage}
                                                    onReceipt={async (item) => {
                                                        const toastId = toast.loading("Hesap dökümü hazırlanıyor...");
                                                        try {
                                                            const res = await getCustomerStatement(item.customerId);
                                                            if (res.success) {
                                                                const combined = [
                                                                    ...(res.debts || []).map((d: any) => ({ ...d, type: 'DEBT' })),
                                                                    ...(res.transactions || []).map((t: any) => ({
                                                                        ...t,
                                                                        type: 'PAYMENT',
                                                                        notes: t.notes || 'Tahsilat / Ödeme',
                                                                        amount: t.amount,
                                                                        remainingAmount: t.amount
                                                                    }))
                                                                ];
                                                                setReceiptCustomer(item);
                                                                setReceiptDebts(combined);
                                                                toast.success("Hesap dökümü yüklendi.", { id: toastId });
                                                            } else {
                                                                toast.error("Hata: " + res.error, { id: toastId });
                                                            }
                                                        } catch (err) {
                                                            toast.error("Bağlantı hatası.", { id: toastId });
                                                        }
                                                    }}
                                                    onDetail={openCustomerStatement}
                                                    onPayment={(item) => {
                                                        setPaymentCustomer(item);
                                                        setPaymentCurrency("TRY");
                                                        setPaymentAmount(String(Math.ceil(item.totalRemainingTRY + (item.totalRemainingUSD * (rates?.usd || 32.5)))));
                                                    }}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
"""

final_lines = lines[:start_idx] + [new_content] + lines[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Replacement successful")
