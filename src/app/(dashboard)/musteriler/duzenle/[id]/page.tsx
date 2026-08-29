import { Metadata } from "next";
import { getCustomerById } from "@/lib/actions/customer-actions";
import { MusteriDuzenleClient } from "./musteri-duzenle-client";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const customer = await getCustomerById(params.id);
  if (!customer) {
    return {
      title: "Müşteri Düzenle | Başar Teknik",
    };
  }
  return {
    title: `Müşteri Düzenle: ${customer.name} | Başar Teknik`,
    description: `${customer.name} bilgilerini düzenleyin.`,
  };
}

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  return <MusteriDuzenleClient id={params.id} />;
}
