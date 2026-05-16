import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { CustomerListClient } from "@/components/customer/customer-list-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export const dynamic = 'force-dynamic';

interface Props {
   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomersPage({ searchParams }: Props) {
   const params = await searchParams;
   const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
   const search = typeof params.search === 'string' ? params.search : undefined;

   const queryClient = new QueryClient();

   await queryClient.prefetchQuery({
      queryKey: ["customers-paginated", page, search],
      queryFn: () => getCustomersPaginated({
         page,
         limit: 15,
         search
      }),
   });

   return (
      <HydrationBoundary state={dehydrate(queryClient)}>
         <CustomerListClient
            currentPage={page}
            searchTerm={search}
         />
      </HydrationBoundary>
   );
}
