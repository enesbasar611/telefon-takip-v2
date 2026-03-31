import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { NotificationSidebar } from "@/components/notifications/notification-sidebar";
import { Bell } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BildirimlerPage() {
  const notifications = await getSystemNotifications();

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">

      <div className="flex flex-col lg:flex-row gap-10 items-start justify-center max-w-7xl mx-auto w-full">
        <NotificationFeed notifications={notifications} />
        <NotificationSidebar notifications={notifications.notifications} />
      </div>

    </div>
  );
}
