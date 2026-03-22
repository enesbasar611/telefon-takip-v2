import { getSettings } from "@/lib/actions/setting-actions";
import { SettingsInterface } from "@/components/settings/settings-interface";

export const dynamic = 'force-dynamic';

export default async function AyarlarPage() {
  const settings = await getSettings();

  return (
    <SettingsInterface initialSettings={settings} />
  );
}
