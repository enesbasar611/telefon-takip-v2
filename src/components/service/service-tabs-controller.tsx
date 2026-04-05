"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ShoppingBag, Activity, History, AlertCircle, Cpu, Archive } from "lucide-react";
import { ServiceListTable } from "./service-list-table";
import { WarrantySearchClient } from "@/components/warranty/warranty-search-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceTabsControllerProps {
    tickets: any[];
    warrantyStats: any;
}

export function ServiceTabsController({ tickets, warrantyStats }: ServiceTabsControllerProps) {
    const [activeTab, setActiveTab] = useState("active");

    const activeTickets = tickets.filter(t => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status));
    const readyTickets = tickets.filter(t => t.status === "READY");
    const deliveredTickets = tickets.filter(t => t.status === "DELIVERED");
    const cancelledTickets = tickets.filter(t => t.status === "CANCELLED");

    return (
        <div className="flex flex-col gap-8 w-full mt-6">
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex items-center w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl p-1 gap-1 shadow-2xl overflow-x-auto no-scrollbar">
                    <TabsTrigger value="active" className="flex-1 rounded-xl h-full  text-[11px] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 transition-all px-3 whitespace-nowrap">
                        <Activity className="h-3.5 w-3.5" /> Devam Edenler ({activeTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="ready" className="flex-1 rounded-xl h-full  text-[11px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 transition-all px-3 whitespace-nowrap">
                        <History className="h-3.5 w-3.5" /> Hazır ({readyTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="delivered" className="flex-1 rounded-xl h-full  text-[11px] data-[state=active]:bg-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 transition-all px-3 whitespace-nowrap">
                        <ShoppingBag className="h-3.5 w-3.5" /> Teslimatlar ({deliveredTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="flex-1 rounded-xl h-full  text-[11px] data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 transition-all px-3 whitespace-nowrap">
                        <AlertCircle className="h-3.5 w-3.5" /> İptaller ({cancelledTickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="warranty" className="flex-1 rounded-xl h-full  text-[11px] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 transition-all px-3 whitespace-nowrap">
                        <ShieldCheck className="h-3.5 w-3.5" /> Garanti & İade
                    </TabsTrigger>
                </TabsList>

                {/* 1. DEVAM EDENLER */}
                <TabsContent value="active" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="matte-card p-0 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <ServiceListTable
                            data={activeTickets}
                            allowedStatuses={["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"]}
                        />
                    </div>
                </TabsContent>

                {/* 2. HAZIR */}
                <TabsContent value="ready" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="matte-card p-0 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <ServiceListTable
                            data={readyTickets}
                            allowedStatuses={["READY"]}
                        />
                    </div>
                </TabsContent>

                {/* 3. TESLİMATLAR */}
                <TabsContent value="delivered" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="matte-card p-0 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <ServiceListTable
                            data={deliveredTickets}
                            allowedStatuses={["DELIVERED"]}
                        />
                    </div>
                </TabsContent>

                {/* 4. İPTALLER */}
                <TabsContent value="cancelled" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="matte-card p-0 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <ServiceListTable
                            data={cancelledTickets}
                            allowedStatuses={["CANCELLED"]}
                        />
                    </div>
                </TabsContent>

                {/* 3. GARANTİ & İADE SEKMESİ */}
                <TabsContent value="warranty" className="mt-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col gap-10">
                        {/* Stats Cards */}
                        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="rounded-[2rem] border-emerald-500/10 bg-emerald-500/5 shadow-none pb-0">
                                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                                    <CardTitle className="font-medium text-sm  text-emerald-500">Aktif Garantiler</CardTitle>
                                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="text-5xl font-extrabold text-emerald-500">{warrantyStats.activeWarranties}</div>
                                    <p className="text-xs text-emerald-500/60 font-medium mt-3">Süresi devam eden cihazlar</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-[2rem] border-amber-500/10 bg-amber-500/5 shadow-none pb-0">
                                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                                    <CardTitle className="font-medium text-sm  text-amber-500">Biten Garantiler</CardTitle>
                                    <History className="h-6 w-6 text-amber-500" />
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="text-5xl font-extrabold text-amber-500">{warrantyStats.expiredWarranties}</div>
                                    <p className="text-xs text-amber-500/60 font-medium mt-3">Süresi dolan eski tamirler</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-[2rem] border-purple-500/10 bg-purple-500/5 shadow-none pb-0">
                                <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                                    <CardTitle className="font-medium text-sm  text-purple-500">İade Talepleri</CardTitle>
                                    <AlertCircle className="h-6 w-6 text-purple-500" />
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="text-5xl font-extrabold text-purple-500">{warrantyStats.returnRequests}</div>
                                    <p className="text-xs text-purple-500/60 font-medium mt-3">Toptancıya iade bekleyen parçalar</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Yeni Garanti İşlemi */}
                        <div className="matte-card p-10 rounded-[2.5rem] border border-white/5">
                            <h2 className="font-medium text-lg  mb-6 text-white flex items-center gap-3">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Yeni İade veya Garanti Süreci Başlat
                            </h2>
                            <WarrantySearchClient />
                        </div>

                        {/* Son İade Hareketleri */}
                        <div className="matte-card px-0 py-6 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                            <div className="px-10 pb-6 border-b border-white/5">
                                <h2 className="font-medium text-xl font-extrabold text-white">Son İade Hareketleri</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Sisteme girilen son garanti/iade kayıtları</p>
                            </div>
                            <Table>
                                <TableHeader className="font-medium bg-white/[0.01]">
                                    <TableRow className="border-b border-white/[0.03] hover:bg-transparent">
                                        <TableHead className="font-medium px-10 py-6 text-xs  text-slate-500">İade Fişi</TableHead>
                                        <TableHead className="font-medium px-6 py-6 text-xs  text-slate-500">Servis Fişi</TableHead>
                                        <TableHead className="font-medium px-6 py-6 text-xs  text-slate-500">Arızalı Parça</TableHead>
                                        <TableHead className="font-medium px-6 py-6 text-xs  text-slate-500">İade Sebebi</TableHead>
                                        <TableHead className="font-medium px-10 py-6 text-xs  text-slate-500">Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {warrantyStats.recentReturns.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-slate-500 ">Henüz iade işlemi bulunmuyor</TableCell>
                                        </TableRow>
                                    ) : (
                                        warrantyStats.recentReturns.map((ticket: any) => {
                                            const getReasonText = (reason: string) => {
                                                if (reason === 'PART_FAILURE') return 'Parça Arızası';
                                                if (reason === 'LABOR_ERROR') return 'İşçilik Hatası';
                                                if (reason === 'CUSTOMER_MISUSE') return 'Kullanıcı Hatası';
                                                if (reason === 'CUSTOMER_CANCEL') return 'Para İadesi / İptal';
                                                return reason;
                                            };

                                            return (
                                                <TableRow key={ticket.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                                                    <TableCell className="px-10 py-6  text-sm text-purple-400">#{ticket.ticketNumber}</TableCell>
                                                    <TableCell className="px-6 py-6 font-medium text-xs">
                                                        <Badge variant="outline" className="font-mono bg-white/[0.02] border-white/10 text-slate-300">
                                                            {ticket.serviceTicket?.ticketNumber || 'Silinmiş Fiş'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6">
                                                        <div className="flex items-center gap-3 font-medium text-slate-300">
                                                            <Cpu className="h-4 w-4 text-slate-500" />
                                                            {ticket.product?.name || "Bilinmeyen Parça"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6 font-medium">
                                                        <Badge variant="outline" className="text-[10px]  text-rose-400 border-none bg-rose-500/10 px-3 py-1 rounded-full">
                                                            {getReasonText(ticket.returnReason)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-10 py-6 font-medium text-xs text-slate-500">
                                                        {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}






