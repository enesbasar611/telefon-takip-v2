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
  MoreHorizontal,
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
  XCircle
} from "lucide-react";
import { ServiceStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { ServiceDetailsModal } from "./service-details-modal";
import { ServiceStatusModal } from "./service-status-modal";
import { ServiceReceiptModal } from "./service-receipt-modal";
import { ServiceManagementModal } from "./service-management-modal";
import { cn } from "@/lib/utils";

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
        <Badge className={`${config.color} text-[10px]  font-black  shadow-sm border-none`}>
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
  const [showReceipt, setShowReceipt] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [isQuickDeliver, setIsQuickDeliver] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredData = useMemo(() => {
    if (statusFilter === "ALL") return data;
    return data.filter(t => t.status === statusFilter);
  }, [data, statusFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: filteredData,
    columns: [
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
                  className="h-8 px-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-[10px] rounded-lg border border-emerald-500/20 gap-2 mb-0"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setIsQuickDeliver(true);
                    setShowManagement(true);
                  }}
                >
                  <ShoppingBag className="h-3 w-3" /> TESLİM ET
                </Button>
              )}
              <Link href={`https://wa.me/${ticket.customer?.phone?.replace(/\s+/g, '')}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] bg-card border-white/5 text-white">
                  <DropdownMenuLabel className="text-[10px] font-black   text-gray-500 p-3">İşlemler</DropdownMenuLabel>
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
      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar mx-6 mt-6 shadow-inner">
        <Button
          variant={statusFilter === "ALL" ? "default" : "ghost"}
          size="sm"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "h-9 px-6 rounded-xl text-[10px] font-black tracking-widest transition-all",
            statusFilter === "ALL" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-white"
          )}
        >
          TÜMÜ
        </Button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "h-9 px-6 rounded-xl text-[10px] font-black tracking-widest transition-all gap-2 shrink-0",
              statusFilter === key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-white"
            )}
          >
            <div className={cn("h-1.5 w-1.5 rounded-full", config.color)} />
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
              <div key={row.id} className="matte-card p-5 rounded-3xl border border-white/5 space-y-4 bg-slate-900/20 backdrop-blur-xl transition-all active:scale-[0.98]" onClick={() => {
                setSelectedTicket(ticket);
                setIsQuickDeliver(false);
                setShowManagement(true);
              }}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black bg-slate-900 border border-border/10 text-slate-400 px-2 py-0.5 rounded w-fit mb-2  ">{ticket.ticketNumber}</span>
                    <h3 className="font-black text-white  text-sm leading-tight">{ticket.deviceBrand} {ticket.deviceModel}</h3>
                    <p className="text-[10px] text-slate-500 font-bold  mt-1 uppercase tracking-wider">{ticket.customer?.name}</p>
                  </div>
                  <Badge className={`${config.color} border-none text-[8px] font-black px-2 py-0.5  `}>
                    {config.label}
                  </Badge>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-600  mb-1 uppercase">ARIZA TANIMI</p>
                  <p className="text-[10px] text-slate-300 font-medium italic truncate">"{ticket.problemDesc}"</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest ">Ücret</span>
                    <span className="text-sm font-black text-blue-500 italic">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === "READY" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                          setIsQuickDeliver(true);
                          setShowManagement(true);
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-slate-900 border border-border/10 text-slate-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                        setShowStatus(true);
                      }}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center py-10 text-slate-500 font-bold italic">Kayıt bulunamadı.</p>
        )}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader className="bg-slate-900/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-white/5">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-6">
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
                  className="hover:bg-blue-600/5 transition-colors border-white/5 last:border-0"
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
                  colSpan={columns.length + 2}
                  className="h-32 text-center font-bold text-slate-600 italic uppercase underline decoration-blue-500/30 underline-offset-8"
                >
                  Kritik düzeyde kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-8 border-t border-white/5">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ">
          TOPLAM {filteredData.length} İŞLEM LİSTELENİYOR
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="font-black text-[10px] uppercase tracking-widest bg-white/[0.02] border border-white/5 rounded-xl h-10 px-6"
          >
            ÖNCEKİ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="font-black text-[10px] uppercase tracking-widest bg-white/[0.02] border border-white/5 rounded-xl h-10 px-6"
          >
            SONRAKİ
          </Button>
        </div>
      </div>
    </div>
  );
}
