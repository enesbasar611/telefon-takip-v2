import { ServiceDetailClient } from "@/components/service/service-detail-client";

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
    return <ServiceDetailClient ticketId={params.id} shopId={""} />;
}
