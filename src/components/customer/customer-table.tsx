"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customer-actions";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPhone } from "@/lib/utils";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";


interface CustomerTableProps {
  data: any[];
}

export function CustomerTable({ data }: CustomerTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(data, "name", "asc");


  const handleDelete = (id: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        toast({ title: "Başarılı", description: "Müşteri silindi." });
      } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Müşteri silinirken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-slate-900/50">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="py-3 pl-4">
              <SortableHeader label="Ad Soyad" field="name" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="py-3">
              <SortableHeader label="Telefon" field="phone" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="py-3 text-xs font-bold text-slate-500">E-posta</TableHead>
            <TableHead className="py-3">
              <SortableHeader label="Kayıt Tarihi" field="createdAt" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Müşteri bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-white/[0.02] border-white/5">
                <TableCell className="font-bold text-sm">{customer.name}</TableCell>
                <TableCell className="font-bold text-xs text-blue-500">{formatPhone(customer.phone)}</TableCell>
                <TableCell className="text-xs font-bold text-slate-400">{customer.email || "-"}</TableCell>
                <TableCell className="text-xs font-bold text-slate-500">
                  {format(new Date(customer.createdAt), "dd MMM yyyy", { locale: tr })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(customer.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
