import { Metadata } from "next";
import { YeniServisClient } from "./yeni-servis-client";

export const metadata: Metadata = {
  title: "Yeni Servis Kaydı | Başar Teknik",
  description: "Yeni teknik servis kabul ve arıza kaydı formu.",
};

export default function NewServicePage() {
  return <YeniServisClient />;
}
