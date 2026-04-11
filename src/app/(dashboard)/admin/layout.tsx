import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    if (session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
