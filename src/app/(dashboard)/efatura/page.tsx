import { Metadata } from "next";
import { EfaturaClient } from "./efatura-client";

export const metadata: Metadata = {
  title: "E-Fatura Yönetimi | Başar Teknik",
  description: "EDM Bilişim e-Fatura, e-Arşiv ve taslak yönetimi.",
};

export default function EfaturaPage() {
  return <EfaturaClient />;
}
