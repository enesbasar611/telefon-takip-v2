import { Metadata } from "next";
import { Suspense } from "react";
import { YeniServisClient } from "./yeni-servis-client";

export const metadata: Metadata = {
  title: "Yeni Servis Kaydı | Başar Teknik",
  description: "Yeni teknik servis kabul ve arıza kaydı formu.",
};

export default function NewServicePage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse text-xs text-muted-foreground">Servis formu yükleniyor...</div>}>
      <YeniServisClient />
    </Suspense>
  );
}
