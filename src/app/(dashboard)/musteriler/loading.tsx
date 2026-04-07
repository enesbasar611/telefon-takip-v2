import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";

export default function CustomersLoading() {
    return (
        <div className="p-8 bg-background text-foreground min-h-screen space-y-8">
            <PageHeader
                title="Müşteri Portföyü"
                description="Müşteri verileri yükleniyor..."
                icon={Users}
            />

            <div className="grid grid-cols-1 gap-6">
                <Skeleton className="h-16 rounded-[1.5rem]" />
            </div>

            <div className="rounded-2xl border border-border/40 overflow-hidden bg-card shadow-xl">
                <Table>
                    <TableHeader className="font-medium bg-muted/10">
                        <TableRow className="border-b border-border/40 hover:bg-transparent">
                            <TableHead className="px-8 py-5 text-[10px] uppercase">Profil Bilgisi</TableHead>
                            <TableHead className="py-5 text-[10px] uppercase">Sadakat</TableHead>
                            <TableHead className="py-5 text-[10px] uppercase">İletişim</TableHead>
                            <TableHead className="py-5 text-[10px] uppercase text-center">İşlem Hacmi</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] uppercase text-right">Aksiyon</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i} className="border-b border-border/20">
                                <TableCell className="px-8 py-5">
                                    <div className="flex items-center gap-5">
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Skeleton className="h-8 w-24 rounded-xl" /></TableCell>
                                <TableCell>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-center gap-6">
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </TableCell>
                                <TableCell className="px-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
