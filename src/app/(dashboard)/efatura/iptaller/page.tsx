import { Metadata } from "next";
import { EfaturaIptallerClient } from "./efatura-iptaller-client";

export const metadata: Metadata = {
  title: "İptal E-Faturalar | Başar Teknik",
  description: "İptal edilen e-fatura ve e-arşiv belgesi kayıtları.",
};

export default function EfaturaIptallerPage() {
  return <EfaturaIptallerClient />;
}
