import { Metadata } from "next";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Doğrulama | Başar Teknik",
  description: "Erişim onayı ve güvenlik doğrulaması.",
};

export default function VerifyPage() {
  return <VerifyClient />;
}
