import { Metadata } from "next";
import { StockAIClient } from "./stok-ai-client";

export const metadata: Metadata = {
  title: "AI Stok Asistanı | Başar Teknik",
  description: "Yapay zeka destekli stok tahmini ve otomatik ikmal önerileri.",
};

export default function StockAIPage() {
  return <StockAIClient />;
}
