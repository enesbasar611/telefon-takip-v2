import { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Giriş Yap | Başar Teknik",
  description: "Başar Teknik ERP & Mobil Servis Takip Sistemine Giriş Yapın.",
};

export default function LoginPage() {
  return <LoginClient />;
}
