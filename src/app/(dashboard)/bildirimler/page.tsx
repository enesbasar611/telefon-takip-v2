"use client";

import { Bell, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { NotificationSidebar } from "@/components/notifications/notification-sidebar";
import { useQuery } from "@tanstack/react-query";
import { getSystemNotifications } from "@/lib/actions/notification-actions";
import { getServiceCounts } from "@/lib/actions/service-actions";
import { Suspense } from "react";

function BildirimlerContent() {
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await getSystemNotifications();
      return res;
    },
    staleTime: 1 * 60 * 1000, // 1 minute stale time for notifications
    refetchInterval: 30 * 1000, // Auto refresh every 30 seconds
  });

  const { data: serviceStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["service-counts"],
    queryFn: async () => {
      const res = await getServiceCounts();
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoadingNotifications || isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
        <p className="text-sm text-muted-foreground font-medium">Bildirimler yükleniyor...</p>
      </div>
    );
  }

  const notifications = notificationsData || { notifications: [], total: 0, unreadCount: 0 };
  const stats = serviceStats || { active: 0, ready: 0, done: 0, all: 0 };

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start justify-center max-w-7xl mx-auto w-full">
      <NotificationFeed notifications={notifications} />
      <NotificationSidebar
        notifications={notifications.notifications}
        serviceStats={stats}
      />
    </div>
  );
}

export default function BildirimlerPage() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      <PageHeader
        title="Bildirim Merkezi"
        description="Sistem uyarıları, cihaz durum güncellemeleri ve önemli hatırlatıcılar."
        icon={Bell}
      />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
          <p className="text-sm text-muted-foreground font-medium">Bağlanıyor...</p>
        </div>
      }>
        <BildirimlerContent />
      </Suspense>
    </div>
  );
}



