type NamedProduct = { name?: string | null };
type ReturnNameSource = {
  productName?: string | null;
  product?: NamedProduct | null;
  serviceTicket?: { deviceBrand?: string | null; deviceModel?: string | null } | null;
  debt?: { notes?: string | null; description?: string | null; sale?: SaleNameSource | null } | null;
  sale?: SaleNameSource | null;
};

type SaleNameSource = {
  items?: Array<{
    quantity?: number | null;
    product?: NamedProduct | null;
  }> | null;
};

const cleanName = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const saleItemNames = (sale?: SaleNameSource | null) => {
  const names = (sale?.items || [])
    .map((item) => cleanName(item.product?.name))
    .filter(Boolean);

  return names.length > 0 ? Array.from(new Set(names)).join(", ") : undefined;
};

export function pickReturnProductName(source: ReturnNameSource) {
  return (
    cleanName(source.productName) ||
    cleanName(source.product?.name) ||
    cleanName(source.debt?.notes) ||
    cleanName(source.debt?.description) ||
    saleItemNames(source.sale) ||
    saleItemNames(source.debt?.sale) ||
    cleanName([source.serviceTicket?.deviceBrand, source.serviceTicket?.deviceModel].filter(Boolean).join(" "))
  );
}
