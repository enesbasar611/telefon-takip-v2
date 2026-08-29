import { Metadata } from "next";
import { OnboardingClient } from "./onboarding-client";

export const metadata: Metadata = {
  title: "Hoş Geldiniz | Başar Teknik",
  description: "Başar Teknik ERP & Mobil Servis Sistem Kurulum Sihirbazı.",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
