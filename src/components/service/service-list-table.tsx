"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronDown, Wrench, Search, Printer, MessageCircle, MoreVertical } from "lucide-react";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { ServiceDetailsModal } from "./service-details-modal";
import { ServiceStatusModal } from "./service-status-modal";

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "bg-slate-500" },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-500" },
  REPAIRING: { label: "Tamirde", color: "bg-orange-500" },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500" },
  READY: { label: "Hazır", color: "bg-emerald-500" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-600" },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-500" },
};

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "ticketNumber",
    header: "Fiş No",
    cell: ({ row }) => <div className="font-black text-xs bg-muted px-2 py-1 rounded w-fit">{row.getValue("ticketNumber")}</div>,
  },
  {
    accessorKey: "customer_name",
    header: "Müşteri",
    accessorFn: (row) => row.customer?.name,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{row.original.customer?.name}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{row.original.customer?.phone}</span>
      </div>
    ),
  },
  {
    accessorKey: "deviceModel",
    header: "Cihaz",
    accessorFn: (row) => `${row.deviceBrand} ${row.deviceModel}`,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{row.original.deviceBrand}</span>
        <span className="text-xs text-muted-foreground">{row.original.deviceModel}</span>
      </div>
    ),
  },
  {
    accessorKey: "problemDesc",
    header: "Problem",
    cell: ({ row }) => <div className="max-w-[150px] truncate text-xs italic font-medium">"{row.getValue("problemDesc")}"</div>,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.getValue("status") as ServiceStatus;
      const config = statusConfig[status];
      return (
        <Badge className={`${config.color} text-[10px] uppercase font-black tracking-tighter shadow-sm border-none`}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tarih",
    cell: ({ row }) => <div className="text-xs font-bold text-muted-foreground">{format(new Date(row.getValue("createdAt")), "dd MMM HH:mm", { locale: tr })}</div>,
  },
  {
    accessorKey: "estimatedCost",
    header: () => <div className="text-right">Tahmini Tutar</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("estimatedCost"));
      return <div className="text-right font-black text-primary">₺{amount.toLocaleString('tr-TR')}</div>;
    },
  },
];

export function ServiceListTable({ data }: { data: any[] }) {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns: [
        ...columns,
        {
            id: "actions",
            cell: ({ row }) => {
                const ticket = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Link href={`https://wa.me/${ticket.customer?.phone?.replace(/\s+/g, '')}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                                <MessageCircle className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={`/servis/yazdir?id=${ticket.id}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                                <Printer className="h-4 w-4" />
                            </Button>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] bg-[#141416] border-white/5 text-white">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500 p-3">İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem className="text-xs font-bold gap-3 p-3 cursor-pointer focus:bg-white/5" onSelect={() => {
                                    setSelectedTicket(ticket);
                                    setShowDetails(true);
                                }}>
                                    <Search className="h-4 w-4 text-blue-500" /> Detayları Gör
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold gap-3 p-3 cursor-pointer focus:bg-white/5" onSelect={() => {
                                    setSelectedTicket(ticket);
                                    setShowStatus(true);
                                }}>
                                    <Wrench className="h-4 w-4 text-blue-500" /> Durum Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-xs font-bold gap-3 p-3 cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500">
                                    Kaydı Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    globalFilterFn: (row, columnId, value) => {
      const customerName = row.original.customer?.name as string;
      const ticketNumber = row.getValue("ticketNumber") as string;
      const imei = row.original.imei as string;

      const search = value.toLowerCase();
      return (
        customerName?.toLowerCase().includes(search) ||
        ticketNumber?.toLowerCase().includes(search) ||
        imei?.toLowerCase().includes(search)
      );
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Müşteri, Fiş No veya IMEI Ara..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10 h-11 border-2 focus:border-primary transition-all shadow-sm"
            />
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 font-bold text-xs h-11 shadow-sm">
                Sütunlar <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs font-medium"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {selectedTicket && (
        <>
            <ServiceDetailsModal
                ticket={selectedTicket}
                isOpen={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setSelectedTicket(null);
                }}
            />
            <ServiceStatusModal
                ticket={selectedTicket}
                isOpen={showStatus}
                onClose={() => {
                    setShowStatus(false);
                    setSelectedTicket(null);
                }}
            />
        </>
      )}

      <div className="lg:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
                const ticket = row.original;
                const status = ticket.status as ServiceStatus;
                const config = statusConfig[status];
                return (
                    <div key={row.id} className="matte-card p-5 rounded-2xl border-slate-800/50 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-widest">{ticket.ticketNumber}</span>
                                <h3 className="font-black text-white uppercase text-sm leading-tight">{ticket.deviceBrand} {ticket.deviceModel}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{ticket.customer?.name}</p>
                            </div>
                            <Badge className={`${config.color} border-none text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter`}>
                                {config.label}
                            </Badge>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">ARIZA TANIMI</p>
                            <p className="text-[10px] text-slate-300 font-medium italic truncate">"{ticket.problemDesc}"</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">TAHMİNİ ÜCRET</span>
                                <span className="text-sm font-black text-blue-500 italic">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/servis/yazdir?id=${ticket.id}`} target="_blank">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-blue-500/5 text-blue-500 border border-blue-500/10">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#141416] border-white/5 text-white w-48">
                                        <DropdownMenuItem className="text-[10px] font-black uppercase p-3 gap-3" onSelect={() => {
                                            setSelectedTicket(ticket);
                                            setShowDetails(true);
                                        }}>
                                            <Search className="h-4 w-4 text-blue-500" /> DETAYLAR
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-[10px] font-black uppercase p-3 gap-3" onSelect={() => {
                                            setSelectedTicket(ticket);
                                            setShowStatus(true);
                                        }}>
                                            <Wrench className="h-4 w-4 text-blue-500" /> DURUM GÜNCELLE
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <p className="text-center py-10 text-slate-500 font-bold italic">Kayıt bulunamadı.</p>
        )}
      </div>

      <div className="hidden lg:block rounded-2xl border shadow-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-black text-[10px] uppercase tracking-[0.15em] py-5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-primary/5 transition-colors border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-bold text-muted-foreground italic"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Toplam {data.length} Kayıt Listeleniyor
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="font-bold text-xs"
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="font-bold text-xs"
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
