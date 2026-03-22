import { CustomerTable } from "@/components/customer/customer-table";
import { CreateCustomerModal } from "@/components/customer/create-customer-modal";
import { getCustomers } from "@/lib/actions/customer-actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Müşteriler (CRM)</h1>
          <p className="text-muted-foreground">Müşteri verilerini ve işlem geçmişini yönetin.</p>
        </div>
        <CreateCustomerModal />
      </div>

      <Suspense fallback={<CustomerTableSkeleton />}>
        <CustomerTable data={customers} />
      </Suspense>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
