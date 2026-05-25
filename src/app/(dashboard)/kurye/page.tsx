import { CourierDashboardClient } from "@/components/courier/courier-dashboard-client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import {
    getCourierNotifications,
    getCourierTasks,
    getGlobalShortageList,
} from "@/lib/actions/shortage-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { getCouriers } from "@/lib/actions/shortage-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";

export const dynamic = 'force-dynamic';

interface CourierPageProps {
    searchParams: { date?: string };
}

export default async function CourierPage({ searchParams }: CourierPageProps) {
    const session = await getSession();

    const allowedRoles = ["COURIER", "ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"];
    if (!session || (!allowedRoles.includes(session.user.role))) {
        redirect("/");
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedDate = searchParams.date || todayStr;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session.user.role);
    const queryClient = new QueryClient();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["courier-tasks", selectedDate],
            queryFn: () => getCourierTasks(selectedDate),
        }),
        queryClient.prefetchQuery({
            queryKey: ["global-shortages", selectedDate],
            queryFn: () => getGlobalShortageList(selectedDate),
        }),
        queryClient.prefetchQuery({
            queryKey: ["categories"],
            queryFn: () => getCategories(),
        }),
        queryClient.prefetchQuery({
            queryKey: ["couriers"],
            queryFn: () => getCouriers(),
        }),
        queryClient.prefetchQuery({
            queryKey: ["suppliers"],
            queryFn: () => getSuppliers(),
        }),
        ...(isAdmin ? [
            queryClient.prefetchQuery({
                queryKey: ["courier-notifications"],
                queryFn: () => getCourierNotifications(),
            })
        ] : []),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CourierDashboardClient
                userId={session.user.id}
                userRole={session.user.role}
                initialDate={selectedDate}
            />
        </HydrationBoundary>
    );
}
