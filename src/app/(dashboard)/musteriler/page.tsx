import { Suspense } from "react";
import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { CustomerListClient } from "@/components/customer/customer-list-client";
import CustomersLoading from "./loading";

export const dynamic = 'force-dynamic';

interface Props {
   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function CustomersData({ searchParams }: Props) {
   const params = await searchParams;
   const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
   const search = typeof params.search === 'string' ? params.search : undefined;

   const { data: customers, totalPages, total: totalCount } = await getCustomersPaginated({
      page,
      limit: 15,
      search
   });

   return (
      <CustomerListClient
         initialCustomers={customers}
         totalPages={totalPages}
         totalCount={totalCount}
         currentPage={page}
      />
   );
}

export default function CustomersPage({ searchParams }: Props) {
   return (
      <Suspense fallback={<CustomersLoading />}>
         <CustomersData searchParams={searchParams} />
      </Suspense>
   );
}



