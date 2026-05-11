import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { getAllReceiptSettings } from "@/lib/actions/receipt-settings";
import { SettingsInterface } from "@/components/settings/settings-interface";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function AyarlarPage() {
  const session = await getSession();
  const settings = await getSettings();
  const receiptSettings = await getAllReceiptSettings();
  const shop = await getShop();

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <SettingsInterface
      initialSettings={settings}
      receiptSettings={receiptSettings}
      shop={shop}
      isSuperAdmin={isSuperAdmin}
    />
  );
}



