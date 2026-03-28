import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { BildirimlerClient } from "@/components/navbar/bildirimler-client";

export const dynamic = 'force-dynamic';

export default async function BildirimlerPage() {
  const notifications = await getSystemNotifications();
  return <BildirimlerClient notifications={notifications} />;
}
