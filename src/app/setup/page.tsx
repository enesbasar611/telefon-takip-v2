import { Metadata } from "next";
import { SetupClient } from "./setup-client";

export const metadata: Metadata = {
  title: "Sistem Kurulumu | Başar Teknik",
  description: "Dükkanınız için modülleri seçin ve sistem kurulumunu tamamlayın.",
};

export default function SetupPage() {
  return <SetupClient />;
}
