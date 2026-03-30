"use client";

import { useState, useMemo } from "react";
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
import { useSearchParams } from "next/navigation";
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
import {
  ChevronDown,
  Wrench,
  Search,
  Printer,
  MessageCircle,
  MoreVertical,
  Clock,
  CheckCircle2,
  PackagePlus,
  ShoppingBag,
  XCircle,
  Trash2,
  UserCircle
} from "lucide-react";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { ServiceReceiptModal } from "./service-receipt-modal";
import { ServiceManagementModal } from "./service-management-modal";
import { cn, formatPhone } from "@/lib/utils";

const statusConfig: Record<ServiceStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Beklemede", color: "bg-slate-500", icon: Clock },
  APPROVED: { label: "Onay Bekliyor", color: "bg-blue-500", icon: CheckCircle2 },
  REPAIRING: { label: "Tamirde", color: "bg-orange-500", icon: Wrench },
  WAITING_PART: { label: "Parça Bekliyor", color: "bg-purple-500", icon: PackagePlus },
  READY: { label: "Hazır", color: "bg-emerald-500", icon: CheckCircle2 },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-600", icon: ShoppingBag },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-500", icon: XCircle },
};

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "ticketNumber",
    header: "FİŞ NO",
    cell: ({ row }) => <div className="font-bold text-sm bg-muted px-4 py-1 rounded w-fit">{row.getValue("ticketNumber")}</div>,
  },
  {
    accessorKey: "customer_name",
    header: "MÜŞTERİ",
    accessorFn: (row) => row.customer?.name,
    cell: ({ row }) => (
      <Link href={`/musteriler/${row.original.customerId}`} className="flex flex-col group/name">
        <span className="font-bold text-sm group-hover/name:text-blue-500 transition-colors">{row.original.customer?.name}</span>
        <span className="text-xs text-blue-500 font-bold">{formatPhone(row.original.customer?.phone)}</span>
      </Link>
    ),
  },
  {
    accessorKey: "deviceModel",
    header: "CİHAZ",
    accessorFn: (row) => `${row.deviceBrand} ${row.deviceModel}`,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{row.original.deviceBrand}</span>
        <span className="text-sm text-slate-400 font-bold">{row.original.deviceModel}</span>
      </div>
    ),
  },
  {
    accessorKey: "problemDesc",
    header: "ARIZA TANIMI",
    cell: ({ row }) => <div className="max-w-[150px] truncate text-xs font-bold text-slate-500">"{row.getValue("problemDesc")}"</div>,
  },
  {
    accessorKey: "status",
    header: "DURUM",
    cell: ({ row }) => {
      const status = row.getValue("status") as ServiceStatus;
      const config = statusConfig[status];
      return (
        <Badge className={`${config.color} text-xs font-bold px-4 py-1 shadow-sm border-none`}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "KAYIT TARİHİ",
    cell: ({ row }) => <div className="text-xs font-bold text-slate-500">{format(new Date(row.getValue("createdAt")), "dd MMM HH:mm", { locale: tr })}</div>,
  },
  {
    accessorKey: "estimatedCost",
    header: () => <div className="text-right">TAHMİNİ TUTAR</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("estimatedCost"));
      return <div className="text-right font-bold text-blue-500 text-sm">₺{amount.toLocaleString('tr-TR')}</div>;
    },
  },
];

export function ServiceListTable({ data, allowedStatuses }: { data: any[], allowedStatuses?: ServiceStatus[] }) {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [isQuickDeliver, setIsQuickDeliver] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = useMemo(() => {
    if (statusFilter === "ALL") return data;
    return data.filter(t => t.status === statusFilter);
  }, [data, statusFilter]);

  const tableColumns = useMemo<ColumnDef<any>[]>(() => [
    ...columns,
    {
      id: "live_action",
      header: "YÖNETİM",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-blue-500 hover:bg-blue-500/10 relative group rounded-xl border border-blue-500/10"
          onClick={() => {
            setSelectedTicket(row.original);
            setIsQuickDeliver(false);
            setShowManagement(true);
          }}
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-xl animate-pulse group-hover:hidden" />
          <Wrench className="h-4 w-4 relative z-10" />
        </Button>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex justify-end gap-2">
            {ticket.status === "READY" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold text-xs rounded-xl border border-emerald-500/20 gap-2 mb-0"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsQuickDeliver(true);
                  setShowManagement(true);
                }}
              >
                <ShoppingBag className="h-4 w-4" /> TESLİM ET
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-blue-500 hover:bg-blue-500/10 rounded-xl border border-blue-500/10"
              onClick={() => {
                setSelectedTicket(ticket);
                setShowReceipt(true);
              }}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Link href={`/musteriler/${ticket.customerId}`}>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-500 hover:bg-blue-500/10 rounded-xl border border-blue-500/10" title="Müşteri Profili">
                <UserCircle className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`https://wa.me/${ticket.customer?.phone?.replace(/\s+/g, '')}`} target="_blank">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl border border-blue-500/10" title="WhatsApp Mesaj">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-white/5">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px] bg-slate-900 border border-white/5 text-white p-2 rounded-2xl backdrop-blur-3xl">
                <DropdownMenuLabel className="text-xs font-bold text-gray-500 p-3">Operasyon Paneli</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-sm font-bold gap-3 p-4 cursor-pointer focus:bg-white/5 rounded-xl"
                  onSelect={() => {
                    setSelectedTicket(ticket);
                    setShowManagement(true);
                  }}
                >
                  <Search className="h-4 w-4 text-blue-500" /> Detayları Gör
                </DropdownMenuItem>
                <Link href={`/musteriler/${ticket.customerId}`}>
                  <DropdownMenuItem className="text-sm font-bold gap-3 p-4 cursor-pointer focus:bg-white/5 rounded-xl">
                    <UserCircle className="h-4 w-4 text-blue-500" /> Müşteri Profili
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-sm font-bold gap-3 p-4 cursor-pointer focus:bg-white/5 rounded-xl"
                  onSelect={() => {
                    setSelectedTicket(ticket);
                    setShowManagement(true);
                  }}
                >
                  <Wrench className="h-4 w-4 text-blue-500" /> Durum Güncelle
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="text-sm font-bold gap-3 p-4 cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 rounded-xl">
                  <Trash2 className="h-4 w-4" /> Kaydı Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [columns]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
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
      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900/60 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar mx-8 mt-8 shadow-inner backdrop-blur-xl">
        <Button
          variant={statusFilter === "ALL" ? "default" : "ghost"}
          size="sm"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "h-10 px-8 rounded-xl text-xs font-bold transition-all",
            statusFilter === "ALL" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-500 hover:text-white"
          )}
        >
          TÜMÜ
        </Button>
        {Object.entries(statusConfig)
          .filter(([key]) => !allowedStatuses || allowedStatuses.includes(key as ServiceStatus))
          .map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "h-10 px-8 rounded-xl text-xs font-bold transition-all gap-3 shrink-0",
                statusFilter === key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-500 hover:text-white"
              )}
            >
              <div className={cn("h-2 w-2 rounded-full", config.color)} />
              {config.label.toUpperCase()}
            </Button>
          ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Müşteri, Fiş No veya IMEI Ara..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 h-12 bg-white/[0.02] border-white/5 rounded-2xl text-xs font-bold text-white focus:bg-white/[0.05] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 font-bold text-xs h-12 bg-white/[0.02] border-white/5 px-6 rounded-2xl">
                Sütunlar <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-slate-300">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs font-medium focus:bg-white/10 focus:text-white"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "ticketNumber" ? "Fiş No" :
                        column.id === "customer_name" ? "Müşteri" :
                          column.id === "deviceModel" ? "Cihaz" :
                            column.id === "problemDesc" ? "Problem" :
                              column.id === "status" ? "Durum" :
                                column.id === "createdAt" ? "Tarih" :
                                  column.id === "estimatedCost" ? "Tahmini Tutar" :
                                    column.id === "live_action" ? "Yönetim" :
                                      column.id === "actions" ? "Aksiyonlar" : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedTicket && (
        <>
          <ServiceReceiptModal
            ticket={selectedTicket}
            isOpen={showReceipt}
            onClose={() => {
              setShowReceipt(false);
              setSelectedTicket(null);
            }}
          />
          <ServiceManagementModal
            ticket={selectedTicket}
            isOpen={showManagement}
            isQuickDeliver={isQuickDeliver}
            onClose={() => {
              setShowManagement(false);
              setSelectedTicket(null);
            }}
          />
        </>
      )}

      {/* Mobile View */}
      <div className="lg:hidden space-y-4 px-6 pb-6">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const ticket = row.original;
            const status = ticket.status as ServiceStatus;
            const config = statusConfig[status];
            return (
              <div
                key={ticket.id}
                className={cn(
                  "p-8 matte-card rounded-[2.5rem] border border-white/5 bg-slate-900/40 space-y-6 relative overflow-hidden",
                  highlightedId === ticket.id && "animate-blink-blue"
                )}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsQuickDeliver(false);
                  setShowManagement(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold bg-slate-900 border border-border/10 text-blue-500 px-3 py-1 rounded w-fit">{ticket.ticketNumber}</span>
                    <h3 className="font-bold text-white text-lg leading-tight">{ticket.deviceBrand} {ticket.deviceModel}</h3>
                    <p className="text-xs text-slate-500 font-bold">{ticket.customer?.name}</p>
                  </div>
                  <Badge className={`${config.color} border-none text-xs font-bold px-3 py-1`}>
                    {config.label}
                  </Badge>
                </div>

                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/[0.03]">
                  <p className="text-xs font-bold text-slate-600 mb-2">Arıza Tanımı</p>
                  <p className="text-xs text-slate-300 font-bold">"{ticket.problemDesc}"</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-600 font-bold">Tahmini Ücret</span>
                    <span className="text-xl font-bold text-blue-500">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex gap-3">
                    {ticket.status === "READY" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                          setIsQuickDeliver(true);
                          setShowManagement(true);
                        }}
                      >
                        <ShoppingBag className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-2xl bg-slate-900 border border-border/10 text-slate-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                        setShowManagement(true);
                      }}
                    >
                      <Wrench className="h-5 w-5" />
                    </Button>
                    <Link href={`/musteriler/${ticket.customerId}`} onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      >
                        <UserCircle className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-10 text-slate-500 font-bold">Kayıt bulunamadı.</p>
        )}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader className="bg-slate-900/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-white/5">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-bold text-xs tracking-[0.2em] text-slate-500 py-8">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "hover:bg-blue-600/5 transition-colors border-white/5 last:border-0",
                    highlightedId === row.original.id && "animate-blink-blue"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-6">
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
                  colSpan={table.getAllColumns().length}
                  className="h-32 text-center font-bold text-slate-600 underline decoration-blue-500/30 underline-offset-8"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-10 border-t border-white/5 bg-slate-900/40">
        <div className="text-xs font-bold text-slate-500">
          SİSTEMDE TOPLAM {filteredData.length} İŞLEM KAYDI LİSTELENİYOR
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="font-bold text-xs bg-white/[0.02] border border-white/5 rounded-2xl h-12 px-8 hover:bg-white/5 transition-all"
          >
            ÖNCEKİ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="font-bold text-xs bg-white/[0.02] border border-white/5 rounded-2xl h-12 px-8 hover:bg-white/5 transition-all"
          >
            SONRAKİ
          </Button>
        </div>
      </div>
    </div >
  );
}
