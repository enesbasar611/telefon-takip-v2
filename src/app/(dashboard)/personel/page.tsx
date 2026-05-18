import { StaffManagementClient } from "@/components/staff/staff-management-client";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function PersonelPage() {
  const session = await getSession();
  const userRole = session?.user?.role;

  return (
    <StaffManagementClient
      userRole={userRole}
    />
  );
}
