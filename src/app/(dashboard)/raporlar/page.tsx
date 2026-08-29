import { Metadata } from "next";
import { RaporlarPageClient } from "./raporlar-page-client";

export const metadata: Metadata = {
  title: "Raporlar & Analizler | Başar Teknik",
  description: "Satış, servis, finans ve stok raporları.",
};

export default function RaporlarPage() {
  return <RaporlarPageClient />;
}
