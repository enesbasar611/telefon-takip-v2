import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ana Sayfa | Başar Teknik",
};

export default async function RootPage() {
  const session = await getSession();
  if (session?.user?.role === "COURIER") {
    redirect("/kurye");
  }
  redirect("/dashboard");
}



