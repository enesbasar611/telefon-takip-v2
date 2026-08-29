import { Metadata } from "next";
import { EfaturaGelenClient } from "./efatura-gelen-client";

export const metadata: Metadata = {
  title: "Gelen E-Faturalar | Başar Teknik",
  description: "Tedarikçilerden ve dış sistemlerden gelen e-faturalar.",
};

export default function EfaturaGelenPage() {
  return <EfaturaGelenClient />;
}
