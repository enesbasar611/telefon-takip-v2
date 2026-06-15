import { auth } from "@/lib/auth";
import ActivityLogsClient from "@/components/settings/activity-logs-client";
import { redirect } from "next/navigation";

export default async function ActivityLogsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="container p-4 md:p-8">
            <ActivityLogsClient userRole={session.user.role} />
        </div>
    );
}
