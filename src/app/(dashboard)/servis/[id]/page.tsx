import { Metadata } from "next";
import { ServiceDetailClient } from "@/components/service/service-detail-client";
import { getServiceTicketById } from "@/lib/actions/service-actions";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const ticket = await getServiceTicketById(params.id);
    if (!ticket) {
        return {
            title: "Servis Detay | Başar Teknik",
        };
    }
    const ticketNo = ticket.ticketNumber || ticket.id?.slice(-6);
    return {
        title: `Servis #${ticketNo} | Başar Teknik`,
        description: `${ticket.deviceBrand} ${ticket.deviceModel} arıza kaydı ve teknik servis detayları.`,
    };
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
    return <ServiceDetailClient ticketId={params.id} shopId={""} />;
}
