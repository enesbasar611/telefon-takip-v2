import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servis Listesi | Başar Teknik",
};

export default async function ServisListeRedirectPage() {
  redirect("/servis");
}
