import { Metadata } from "next";
import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { ServiceTabsHeader } from "@/components/service/service-tabs-header";
import { ServiceProfitCards } from "@/components/service/service-profit-cards";

export const metadata: Metadata = {
  title: "Servis Yönetimi | Başar Teknik",
  description: "Mobil servis takibi, arıza kayıtları ve teknisyen atama.",
};

export default function ServisMerkeziPage() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      <ServiceTabsHeader />
      <ServiceProfitCards />
      <ServiceTabsController />
    </div>
  );
}
