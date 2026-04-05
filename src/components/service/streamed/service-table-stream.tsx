import { ServiceTable } from "../service-table";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceStatus } from "@prisma/client";

interface ServiceTableStreamProps {
    status?: ServiceStatus | ServiceStatus[];
}

export async function ServiceTableStream({ status }: ServiceTableStreamProps) {
    // Initial load: 50 items (configured in getServiceTickets default)
    const tickets = await getServiceTickets({ status, pageSize: 50 });

    return <ServiceTable data={tickets} />;
}



