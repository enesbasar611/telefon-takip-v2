"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Users,
    UserCheck,
    Calendar,
    Plus,
    TrendingUp,
    Search,
    ChevronDown,
    MoreVertical,
    Shield,
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CreateStaffModal } from "./create-staff-modal";
import { updateStaffName } from "@/lib/actions/staff-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

interface StaffMember {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    commissionRate: number;
    assignedTickets: any[];
    sales: any[];
    canSell?: boolean;
    canService?: boolean;
    canStock?: boolean;
    canFinance?: boolean;
}

interface StaffManagementClientProps {
    staff: StaffMember[];
    logs: any[];
}

function EditNameModal({ isOpen, onClose, member, onUpdate }: { isOpen: boolean, onClose: () => void, member: StaffMember | null, onUpdate: (id: string, name: string) => void }) {
    const [name, setName] = useState(member?.name || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (member) setName(member.name || "");
    }, [member]);

    const handleSave = async () => {
        if (!member) return;
        setLoading(true);
        const res = await updateStaffName(member.id, name);
        if (res.success) {
            onUpdate(member.id, name);
            onClose();
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-slate-900 border-white/5 text-white rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">İsim Düzenle</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">YENİ İSİM</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl text-slate-400 font-bold">İptal</Button>
                    <Button onClick={handleSave} disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-500 font-black px-8">
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function StaffManagementClient({ staff: initialStaff, logs }: StaffManagementClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "TECHNICIAN">("all");
    const [localStaff, setLocalStaff] = useState(initialStaff);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

    const filteredStaff = useMemo(() => {
        return localStaff.filter(member => {
            const matchesSearch = (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTab = activeTab === "all" || member.role === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [initialStaff, searchTerm, activeTab]);

    const stats = useMemo(() => {
        const total = initialStaff.length;
        const active = initialStaff.filter(s => s.role !== 'STAFF').length; // Logic for active
        const onLeave = 0; // Placeholder
        return { total, active, onLeave };
    }, [initialStaff]);

    const rolePermissions = useMemo(() => {
        const adminUser = initialStaff.find(s => s.role === 'ADMIN');
        const techUser = initialStaff.find(s => s.role === 'TECHNICIAN');
        const staffUser = initialStaff.find(s => s.role === 'STAFF');

        return [
            {
                name: "Satış İşlemleri",
                y: adminUser?.canSell ?? true,
                t: techUser?.canSell ?? true,
                k: staffUser?.canSell ?? true
            },
            {
                name: "Servis Kayıtları",
                y: adminUser?.canService ?? true,
                t: techUser?.canService ?? true,
                k: staffUser?.canService ?? false
            },
            {
                name: "Stok Yönetimi",
                y: adminUser?.canStock ?? true,
                t: techUser?.canStock ?? true,
                k: staffUser?.canStock ?? false
            },
            {
                name: "Finans & Raporlar",
                y: adminUser?.canFinance ?? true,
                t: techUser?.canFinance ?? false,
                k: staffUser?.canFinance ?? false
            },
        ];
    }, [initialStaff]);

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ekip Yönetimi</h1>
                    <p className="text-slate-500 font-medium">Personel performansını ve yetkilerini buradan yönetin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <CreateStaffModal />
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Users className="w-7 h-7" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black text-[10px]">
                                +12%
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOPLAM PERSONEL</p>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <UserCheck className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF GÖREVDE</p>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.active}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Calendar className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İZİNLİ / TATİL</p>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.onLeave}</h3>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Personnel List */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Personel Listesi</h2>
                        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                            <Button
                                onClick={() => setActiveTab("all")}
                                variant="ghost"
                                size="sm"
                                className={cn("h-8 rounded-xl text-[10px] font-black", activeTab === "all" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                            >
                                TÜMÜ
                            </Button>
                            <Button
                                onClick={() => setActiveTab("TECHNICIAN")}
                                variant="ghost"
                                size="sm"
                                className={cn("h-8 rounded-xl text-[10px] font-black", activeTab === "TECHNICIAN" ? "bg-white dark:bg-slate-800 shadow-sm" : "text-slate-500")}
                            >
                                TEKNİSYENLER
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">İSİM / ROL</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">İŞ SAYISI</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">BAŞARI</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">SON GİRİŞ</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-500">AKSİYON</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {filteredStaff.map((member, idx) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-none"
                                        >
                                            <TableCell className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm">
                                                        <AvatarImage src={member.image || ""} />
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black">
                                                            {member.name?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {member.name || "İsimsiz Kullanıcı"}
                                                        </span>
                                                        <Badge className={cn(
                                                            "w-fit text-[9px] font-black border-none px-2 py-0.5",
                                                            member.role === 'ADMIN' ? "bg-indigo-500/10 text-indigo-500" :
                                                                member.role === 'TECHNICIAN' ? "bg-blue-500/10 text-blue-500" :
                                                                    "bg-slate-500/10 text-slate-500"
                                                        )}>
                                                            {member.role === 'ADMIN' ? 'YÖNETİCİ' : member.role === 'TECHNICIAN' ? 'TEKNİSYEN' : 'PERSONEL'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                                    {member.assignedTickets.length + member.sales.length}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-black text-emerald-500">
                                                    %98.5
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-bold text-slate-400">
                                                    Şimdi aktif
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white w-48 rounded-2xl p-2">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                setEditModalOpen(true);
                                                            }}
                                                            className="rounded-xl gap-2 cursor-pointer font-bold py-3 text-xs"
                                                        >
                                                            <ChevronDown className="w-4 h-4" /> İsim Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer font-bold py-3 text-xs">
                                                            <TrendingUp className="w-4 h-4" /> Performans Analizi
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer font-bold py-3 text-xs">
                                                            <Shield className="w-4 h-4" /> Yetkileri Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer font-bold py-3 text-xs text-rose-500">
                                                            <XCircle className="w-4 h-4" /> Personeli Çıkar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Sidebar Matrix & Stats */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Permissions Matrix */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black">Yetki Seviyeleri</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 pb-4">
                                    <div className="col-span-2">MODÜL ERİŞİMİ</div>
                                    <div className="text-center">Y</div>
                                    <div className="text-center">T</div>
                                    <div className="text-center">K</div>
                                </div>

                                {rolePermissions.map((mod, i) => (
                                    <div key={i} className="grid grid-cols-4 items-center">
                                        <div className="col-span-2 text-sm font-bold text-slate-700 dark:text-slate-300">{mod.name}</div>
                                        <div className="flex justify-center">
                                            {mod.y ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700" />}
                                        </div>
                                        <div className="flex justify-center">
                                            {mod.t ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700" />}
                                        </div>
                                        <div className="flex justify-center">
                                            {mod.k ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700" />}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                        * Y: Yönetici, T: Teknisyen, K: Kasiyer/Personel rollerini temsil eder.
                                    </p>
                                </div>

                                <Button className="w-full h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-none shadow-sm text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">
                                    Yetki Şablonlarını Düzenle
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Search */}
                    <div className="p-1 bg-slate-900 dark:bg-blue-600 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="p-8 space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white">Performans Ara</h3>
                                <Activity className="w-5 h-5 text-blue-200" />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Personel ara..."
                                    className="h-12 bg-white/10 border-none rounded-2xl pl-12 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/20 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Log Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">İşlem Logları (Audit Log)</h2>
                    <Button variant="link" className="text-blue-500 font-black text-xs uppercase tracking-widest p-0">Tümünü Gör</Button>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border-none shadow-xl shadow-black/5 overflow-hidden divide-y divide-slate-50 dark:divide-white/5">
                    {logs.map((log, i) => (
                        <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                    log.type === 'service' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {log.type === 'service' ? <Wrench className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        <span className="font-black text-slate-900 dark:text-white">{log.user?.name}</span> {log.message}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                                    {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-bold">Henüz bir işlem kaydı bulunmuyor.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Wrench(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    )
}

function Banknote(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="12" x="2" y="6" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    )
}
