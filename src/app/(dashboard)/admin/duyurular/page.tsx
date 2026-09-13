import { Metadata } from "next";
import { SystemAnnouncementsClient } from "./client";
import { getAllSystemAnnouncements } from "@/lib/actions/system-announcement-actions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Sistem Duyuruları | Admin",
    description: "Tüm kullanıcılara gösterilecek sistem duyurularının yönetimi",
};

export default async function SystemAnnouncementsPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const { data: announcements, success } = await getAllSystemAnnouncements();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <SystemAnnouncementsClient 
                initialAnnouncements={success ? (announcements || []) : []} 
            />
        </div>
    );
}
