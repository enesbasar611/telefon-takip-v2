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

   return (
      <CustomerListClient
         currentPage={page}
         searchTerm={search}
      />
   );
}
