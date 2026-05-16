import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { getAllReceiptSettings } from "@/lib/actions/receipt-settings";
import { SettingsInterface } from "@/components/settings/settings-interface";
import { getSession } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function AyarlarPage() {
  const queryClient = new QueryClient();
  const session = await getSession();

  // Prefetch everything
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["settings"],
      queryFn: getSettings
    }),
    queryClient.prefetchQuery({
      queryKey: ["receipt-settings"],
      queryFn: getAllReceiptSettings
    }),
    queryClient.prefetchQuery({
      queryKey: ["shop"],
      queryFn: getShop
    })
  ]);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsInterface
        isSuperAdmin={isSuperAdmin}
      />
    </HydrationBoundary>
  );
}



