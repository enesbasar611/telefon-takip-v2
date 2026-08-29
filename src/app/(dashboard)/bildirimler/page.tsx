import { Metadata } from "next";
import { BildirimlerClient } from "./bildirimler-client";

export const metadata: Metadata = {
  title: "Bildirimler | Başar Teknik",
  description: "Sistem uyarıları, cihaz durum güncellemeleri ve bildirimler.",
};

export default function BildirimlerPage() {
  return <BildirimlerClient />;
}
