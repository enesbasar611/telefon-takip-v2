import { getCustomers } from "@/lib/actions/customer-actions";
import { CustomerListClient } from "@/components/customer/customer-list-client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
   const customers = await getCustomers();
   return <CustomerListClient customers={customers} />;
}
