import { Metadata } from "next";
import { ProfileClient } from "./profil-client";

export const metadata: Metadata = {
  title: "Profilim & Hesabım | Başar Teknik",
  description: "Kullanıcı profili, şifre ve dükkan bilgileri.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
