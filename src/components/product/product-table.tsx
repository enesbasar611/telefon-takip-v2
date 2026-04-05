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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, Package } from "lucide-react";
import { deleteProduct } from "@/lib/actions/product-actions";
import { useToast } from "@/hooks/use-toast";

interface ProductTableProps {
  data: any[];
}

export function ProductTable({ data }: ProductTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast({ title: "Başarılı", description: "Ürün silindi." });
      } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Ürün silinirken bir hata oluştu.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ürün Adı</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Alış Fiyatı</TableHead>
            <TableHead>Satış Fiyatı</TableHead>
            <TableHead className="font-medium w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Ürün bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.barcode || "Barkodsuz"}</span>
                  </div>
                </TableCell>
                <TableCell>{product.category?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={product.stock <= product.criticalStock ? "destructive" : "secondary"}>
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">₺{Number(product.buyPrice).toLocaleString("tr-TR")}</span>
                    {product.buyPriceUsd != null && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ">${Number(product.buyPriceUsd).toLocaleString("en-US")}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className=" text-emerald-600 dark:text-emerald-400">₺{Number(product.sellPrice).toLocaleString("tr-TR")}</TableCell>
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
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
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




