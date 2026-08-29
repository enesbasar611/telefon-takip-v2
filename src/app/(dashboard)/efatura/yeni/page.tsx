import { Metadata } from "next";
import { EfaturaYeniClient } from "./efatura-yeni-client";

export const metadata: Metadata = {
  title: "Yeni E-Fatura Oluştur | Başar Teknik",
  description: "Yeni e-fatura veya e-arşiv belgesi düzenleme formu.",
};

export default function EfaturaYeniPage() {
  return <EfaturaYeniClient />;
}
