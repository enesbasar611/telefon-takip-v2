import { Metadata } from "next";
import { EfaturaDetayClient } from "./efatura-detay-client";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `E-Fatura Detay | Başar Teknik`,
    description: "E-Fatura belgesi detayları, PDF görüntüleme ve yazdırma.",
  };
}

export default function EfaturaDetailPage() {
  return <EfaturaDetayClient />;
}
