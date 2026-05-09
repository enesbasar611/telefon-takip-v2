import { getCourierTasks, getGlobalShortageList } from "@/lib/actions/shortage-actions";
import { getCategories } from "@/lib/actions/product-actions";
import { CourierDashboardClient } from "@/components/courier/courier-dashboard-client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

interface CourierPageProps {
    searchParams: { date?: string };
}

export default async function CourierPage({ searchParams }: CourierPageProps) {
    const session = await getSession();

    if (!session || (session.user.role !== "COURIER" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        redirect("/");
    }

    const { items: courierTasks } = await getCourierTasks(searchParams.date);
    const allShortages = await getGlobalShortageList(searchParams.date);
    const categories = await getCategories();

    // Lazy importing getStaff to avoid circular dependencies if any, but regular import is fine.
    const { getStaff } = await import("@/lib/actions/staff-actions");
    const allStaff = await getStaff();
    const couriers = allStaff.filter((s: Record<string, any>) => s.role === 'COURIER');

    // Fetch recent notifications for admins
    let adminNotifications: any[] = [];
    if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
        const prisma = (await import("@/lib/prisma")).default;
        const shopIdString = session.user.shopId;
        if (shopIdString) {
            adminNotifications = await prisma.notification.findMany({
                where: {
                    shopId: shopIdString,
                    type: "COURIER_END_DAY",
                    isRead: false
                },
                orderBy: { createdAt: "desc" }
            });
        }
    }

    return (
        <CourierDashboardClient
            initialItems={courierTasks || []}
            initialAllShortages={allShortages}
            categories={categories}
            userId={session.user.id}
            userRole={session.user.role}
            couriers={couriers}
            initialNotifications={adminNotifications}
            initialDate={searchParams.date}
        />
    );
}
