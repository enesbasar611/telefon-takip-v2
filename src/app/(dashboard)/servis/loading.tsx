import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Wrench } from "lucide-react";

export default function ServiceLoading() {
    return (
        <div className="p-8 bg-background text-foreground min-h-screen space-y-8">
            <PageHeader
                title="Servis Yönetimi"
                description="Servis kayıtları yükleniyor..."
                icon={Wrench}
            />

            <div className="flex gap-4 mb-6">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border/40 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-border/20">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
