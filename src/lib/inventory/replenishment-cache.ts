import { revalidateTag } from "next/cache";

export function getSmartReplenishmentTag(shopId: string): string {
  return `smart-replenishment-${shopId}`;
}

export function revalidateSmartReplenishment(shopId: string): void {
  revalidateTag(getSmartReplenishmentTag(shopId));
}
