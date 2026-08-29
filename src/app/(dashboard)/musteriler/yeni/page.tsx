import { Metadata } from "next";
import { YeniMusteriClient } from "./yeni-musteri-client";

export const metadata: Metadata = {
  title: "Yeni Müşteri Ekle | Başar Teknik",
  description: "Yeni müşteri kaydı ve cari hesap oluşturma.",
};

export default function NewCustomerPage() {
  return <YeniMusteriClient />;
}
