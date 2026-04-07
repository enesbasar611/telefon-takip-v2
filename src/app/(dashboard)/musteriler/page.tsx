import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { CustomerListClient } from "@/components/customer/customer-list-client";

export const dynamic = 'force-dynamic';

interface Props {
   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomersPage({ searchParams }: Props) {
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



