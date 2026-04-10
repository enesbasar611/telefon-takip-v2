import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { getAllReceiptSettings } from "@/lib/actions/receipt-settings";
import { SettingsInterface } from "@/components/settings/settings-interface";

export const dynamic = 'force-dynamic';

export default async function AyarlarPage() {
  const settings = await getSettings();
  const receiptSettings = await getAllReceiptSettings();
  const shop = await getShop();

  return (
    <SettingsInterface
      initialSettings={settings}
      receiptSettings={receiptSettings}
      shop={shop}
    />
  );
}



