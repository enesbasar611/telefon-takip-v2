import { Metadata } from "next";
import { SorgulaClient } from "./sorgula-client";

export const metadata: Metadata = {
  title: "Servis Sorgulama | Başar Teknik",
  description: "Servis fiş numarası ve telefon ile cihaz durumu sorgulama.",
};

export default function SorgulaPage() {
  return <SorgulaClient />;
}
