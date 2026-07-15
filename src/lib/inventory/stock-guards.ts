export async function decrementProductStockSafely(
  tx: any,
  productId: string,
  shopId: string,
  quantity: number
) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Stok miktarı geçersiz.");
  }

  const result = await tx.product.updateMany({
    where: {
      id: productId,
      shopId,
      isDeleted: false,
      stock: { gte: quantity },
    },
    data: { stock: { decrement: quantity } },
  });

  if (result.count !== 1) {
    throw new Error("Yetersiz stok. İşlem kaydedilmedi.");
  }

  return tx.product.findUnique({ where: { id: productId, shopId } });
}
