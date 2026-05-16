import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { ServiceTabsHeader } from "../../../components/service/service-tabs-header";

export default function ServisMerkeziPage() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      <ServiceTabsHeader />
      <ServiceTabsController />
    </div>
  );
}



