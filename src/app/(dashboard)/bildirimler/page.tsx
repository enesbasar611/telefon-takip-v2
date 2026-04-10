import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { getServiceCounts } from "@/lib/actions/service-actions";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { NotificationSidebar } from "@/components/notifications/notification-sidebar";
import { Bell } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BildirimlerPage() {
  const [notifications, serviceStats] = await Promise.all([
    getSystemNotifications(),
    getServiceCounts()
  ]);

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col lg:flex-row gap-10 items-start justify-center max-w-7xl mx-auto w-full">
        <NotificationFeed notifications={notifications} />
        <NotificationSidebar
          notifications={notifications.notifications}
          serviceStats={serviceStats}
        />
      </div>
    </div>
  );
}



