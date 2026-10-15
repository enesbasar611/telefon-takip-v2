import { Metadata } from "next";
import { Suspense } from "react";
import { SorgulaClient } from "./sorgula-client";
import { getRecentServiceTickets } from "@/lib/actions/service-actions";

export const metadata: Metadata = {
  title: "Cihaz & Servis Sorgulama | Başar Teknik",
  description: "Servis numarası, telefon, IMEI veya müşteri adı ile anlık teknik servis sorgusu ve yönetim paneli.",
};

export default async function SorgulaPage() {
  const initialRecentTickets = await getRecentServiceTickets(8);

  return (
    <Suspense
      fallback={
        <div className="w-full space-y-4 animate-pulse p-4">
          <div className="h-10 w-48 bg-muted/40 rounded-xl" />
          <div className="h-24 w-full bg-muted/30 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-muted/20 rounded-2xl" />
            <div className="h-48 bg-muted/20 rounded-2xl" />
          </div>
        </div>
      }
    >
      <SorgulaClient initialRecentTickets={initialRecentTickets} />
    </Suspense>
  );
}
