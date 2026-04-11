import { getIndustryTemplates } from "@/lib/actions/industry-template-actions";
import { IndustryTemplatesAdmin } from "@/components/settings/industry-templates-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Globe } from "lucide-react";

export default async function SektorlerPage() {
    const result = await getIndustryTemplates();
    const templates = result.success ? (result.data ?? []) : [];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Sektör Şablonları"
                description="AI tarafından oluşturulan sektör yapılandırmalarını buradan düzenleyebilirsiniz."
                icon={Globe}
            />
            <IndustryTemplatesAdmin initialTemplates={templates as any} />
        </div>
    );
}
