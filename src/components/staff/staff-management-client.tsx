"use client";

import { useState, useMemo, useEffect } from "react";
import { Role } from "@prisma/client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
    Users,
    UserCheck,
    Calendar,
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
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    getStaffLogs,
    updateRoleTemplate,
    getRoleTemplates,
    updateStaff,
    getAllLogs
} from "@/lib/actions/staff-actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface StaffMember {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    commissionRate: number;
    assignedTickets: any[];
    sales: any[];
    canSell: boolean;
    canService: boolean;
    canStock: boolean;
    canFinance: boolean;
    canDelete: boolean;
    canEdit: boolean;
}

interface StaffManagementClientProps {
    staff: StaffMember[];
    logs: any[];
}

function RoleBadge({ role }: { role: string }) {
    const configs: Record<string, { label: string, className: string }> = {
        ADMIN: { label: "YÖNETİCİ", className: "bg-indigo-500/10 text-indigo-500" },
        MANAGER: { label: "MÜDÜR", className: "bg-purple-500/10 text-purple-500" },
        CASHIER: { label: "KASİYER", className: "bg-emerald-500/10 text-emerald-500" },
        TECHNICIAN: { label: "TEKNİSYEN", className: "bg-blue-500/10 text-blue-500" },
        STAFF: { label: "PERSONEL", className: "bg-slate-500/10 text-slate-500" },
    };

    const config = configs[role] || configs.STAFF;

    return (
        <Badge className={cn("w-fit text-[9px] font-bold border-none px-2 py-0.5", config.className)}>
            {config.label}
        </Badge>
    );
}

function StaffEditModal({ isOpen, onClose, member, onUpdate }: {
    isOpen: boolean,
    onClose: () => void,
    member: StaffMember | null,
    onUpdate: () => void
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: member?.name || "",
        role: member?.role || "STAFF",
        canSell: member?.canSell || false,
        canService: member?.canService || false,
        canStock: member?.canStock || false,
        canFinance: member?.canFinance || false,
        canDelete: member?.canDelete || false,
        canEdit: member?.canEdit || false,
    });

    useEffect(() => {
        if (member) {
            setFormData({
                name: member.name || "",
                role: member.role,
                canSell: member.canSell || false,
                canService: member.canService || false,
                canStock: member.canStock || false,
                canFinance: member.canFinance || false,
                canDelete: member.canDelete || false,
                canEdit: member.canEdit || false,
            });
        }
    }, [member]);

    const handleSave = async () => {
        if (!member) return;
        setLoading(true);
        const res = await updateStaff(member.id, {
            ...formData,
            role: formData.role as Role
        });
        if (res.success) {
            onUpdate();
            onClose();
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold">Personel Yetkilerini Düzenle</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs font-medium italic">
                        {member?.name || "Personel"} için sistem erişim yetkilerini özelleştirin.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">AD SOYAD</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-xl font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">ROL</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(v: any) => setFormData({ ...formData, role: v })}
                        >
                            <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-xl font-bold">
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 rounded-xl">
                                <SelectItem value="ADMIN" className="font-bold text-xs uppercase tracking-widest">Yönetici</SelectItem>
                                <SelectItem value="MANAGER" className="font-bold text-xs uppercase tracking-widest">Müdür</SelectItem>
                                <SelectItem value="CASHIER" className="font-bold text-xs uppercase tracking-widest">Kasiyer</SelectItem>
                                <SelectItem value="TECHNICIAN" className="font-bold text-xs uppercase tracking-widest">Teknisyen</SelectItem>
                                <SelectItem value="STAFF" className="font-bold text-xs uppercase tracking-widest">Personel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">YETKİLER</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'canSell', label: 'Satış' },
                                { id: 'canService', label: 'Servis' },
                                { id: 'canStock', label: 'Stok' },
                                { id: 'canFinance', label: 'Finans' },
                                { id: 'canEdit', label: 'Düzenle' },
                                { id: 'canDelete', label: 'Sil' },
                            ].map((perm) => (
                                <div
                                    key={perm.id}
                                    onClick={() => setFormData({ ...formData, [perm.id]: !formData[perm.id as keyof typeof formData] })}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                        formData[perm.id as keyof typeof formData]
                                            ? "bg-blue-500/5 border-blue-500/20"
                                            : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-100 dark:hover:border-white/5"
                                    )}
                                >
                                    <Checkbox
                                        checked={!!formData[perm.id as keyof typeof formData]}
                                        onCheckedChange={(c) => {
                                            setFormData({ ...formData, [perm.id]: !!c });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{perm.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-8 pt-0 gap-2">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl text-slate-400 font-bold uppercase text-[10px] tracking-widest">Vazgeç</Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold px-8 h-12 shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest"
                    >
                        {loading ? "GÜNCELLENİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RoleTemplateModal({
    isOpen,
    onClose
}: {
    isOpen: boolean,
    onClose: () => void
}) {
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            getRoleTemplates().then(setTemplates);
        }
    }, [isOpen]);

    const handleToggle = async (role: Role, field: string) => {
        const roleStr = role as string;
        const current = templates.find(t => t.role === role) || {
            canSell: roleStr === 'ADMIN' || roleStr === 'MANAGER' || roleStr === 'CASHIER' || roleStr === 'STAFF',
            canService: roleStr === 'ADMIN' || roleStr === 'MANAGER' || roleStr === 'TECHNICIAN',
            canStock: roleStr === 'ADMIN' || roleStr === 'MANAGER' || roleStr === 'TECHNICIAN',
            canFinance: roleStr === 'ADMIN' || roleStr === 'MANAGER',
        };

        const updated = {
            ...current,
            [field]: !current[field]
        };

        const res = await updateRoleTemplate(role, updated);
        if (res.success) {
            getRoleTemplates().then(setTemplates);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold">Yetki Şablonlarını Düzenle</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs font-medium italic">
                        * Bu değişiklikler sadece yeni oluşturulan personelleri etkiler.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 pt-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-50 dark:border-white/5 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ROL</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">SATIŞ</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">SERVİS</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">STOK</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">FİNANS</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">DÜZENLE</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">SİL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {["ADMIN", "MANAGER", "CASHIER", "TECHNICIAN", "STAFF"].map((role) => {
                                const t = templates.find(temp => temp.role === role) || {
                                    canSell: true,
                                    canService: true,
                                    canStock: true,
                                    canFinance: true,
                                };
                                return (
                                    <TableRow key={role} className="hover:bg-transparent border-b border-slate-50 dark:border-white/5 last:border-none">
                                        <TableCell className="font-bold text-xs text-slate-500 uppercase tracking-widest py-6">
                                            {role === 'ADMIN' ? 'YÖNETİCİ' :
                                                role === 'MANAGER' ? 'MÜDÜR' :
                                                    role === 'CASHIER' ? 'KASİYER' :
                                                        role === 'TECHNICIAN' ? 'TEKNİSYEN' : 'PERSONEL'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canSell}
                                                onCheckedChange={() => handleToggle(role as Role, 'canSell')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canService}
                                                onCheckedChange={() => handleToggle(role as Role, 'canService')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canStock}
                                                onCheckedChange={() => handleToggle(role as Role, 'canStock')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canFinance}
                                                onCheckedChange={() => handleToggle(role as Role, 'canFinance')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canEdit}
                                                onCheckedChange={() => handleToggle(role as Role, 'canEdit')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={t.canDelete}
                                                onCheckedChange={() => handleToggle(role as Role, 'canDelete')}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter className="p-8 pt-4">
                    <Button onClick={onClose} className="rounded-2xl bg-slate-900 dark:bg-blue-600 text-white font-bold px-8 h-12 shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest">Kapat</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function StaffManagementClient({ staff: initialStaff = [], logs: initialLogs = [] }: StaffManagementClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "TECHNICIAN" | "MANAGER" | "CASHIER">("all");
    const [localStaff, setLocalStaff] = useState<StaffMember[]>(initialStaff || []);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

    // Logs related state
    const [logs, setLogs] = useState(initialLogs);
    const [logPage, setLogPage] = useState(1);
    const [logTotalPages, setLogTotalPages] = useState(1);
    const [logSearch, setLogSearch] = useState("");
    const [logDate, setLogDate] = useState("");
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLogsLoading(true);
            const res = await getStaffLogs(logPage, 10, logSearch, logDate);
            if (res.success) {
                setLogs(res.logs);
                setLogTotalPages(res.totalPages);
            }
            setIsLogsLoading(false);
        };
        fetchLogs();
    }, [logPage, logSearch, logDate]);

    const handleExportCSV = async () => {
        const allLogs = await getAllLogs();
        const headers = ["Personel", "İşlem", "Tarih", "Tip"];
        const rows = allLogs.map((log: any) => [
            log.user?.name || "Sistem",
            log.message,
            new Date(log.createdAt).toLocaleString('tr-TR'),
            log.type === 'service' ? 'Teknik Servis' : 'Satış'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `personel_islem_loglari_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const filteredStaff = useMemo(() => {
        return localStaff.filter(member => {
            const matchesSearch = (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTab = filter === "all" || (member.role as string) === filter;
            return matchesSearch && matchesTab;
        });
    }, [localStaff, searchTerm, filter]);

    const stats = useMemo(() => ({
        total: localStaff.length,
        active: localStaff.filter(s => s.role !== 'STAFF').length,
        onLeave: 0
    }), [localStaff]);

    const rolePermissions = useMemo(() => {
        const roles = ["ADMIN", "MANAGER", "CASHIER", "TECHNICIAN"];
        return [
            { name: "Satış İşlemleri", perms: roles.map(r => localStaff.find(s => s.role === r)?.canSell ?? true) },
            { name: "Servis Kayıtları", perms: roles.map(r => localStaff.find(s => s.role === r)?.canService ?? true) },
            { name: "Stok Yönetimi", perms: roles.map(r => localStaff.find(s => s.role === r)?.canStock ?? true) },
            { name: "Finans & Raporlar", perms: roles.map(r => localStaff.find(s => s.role === r)?.canFinance ?? true) },
        ];
    }, [localStaff]);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Ekip Yönetimi</h1>
                    <p className="text-slate-500 font-medium">Personel performansını ve yetkilerini buradan yönetin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <CreateStaffModal />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "TOPLAM PERSONEL", val: stats.total, icon: Users, color: "blue" },
                    { label: "AKTİF GÖREVDE", val: stats.active, icon: UserCheck, color: "emerald" },
                    { label: "İZİNLİ / TATİL", val: stats.onLeave, icon: Calendar, color: "rose" }
                ].map((s, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", `bg-${s.color}-500/10 text-${s.color}-500`)}>
                                    <s.icon className="w-7 h-7" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{s.val}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personel Listesi</h2>
                        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                            {[
                                { id: "all", label: "TÜMÜ" },
                                { id: "TECHNICIAN", label: "TEKNİSYENLER" },
                                { id: "MANAGER", label: "MÜDÜRLER" },
                                { id: "CASHIER", label: "KASİYERLER" }
                            ].map(t => (
                                <Button
                                    key={t.id}
                                    variant="ghost"
                                    onClick={() => setFilter(t.id as any)}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] font-bold tracking-widest transition-all",
                                        filter === t.id
                                            ? "bg-slate-900 text-white shadow-lg shadow-black/20"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">İSİM / ROL</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">İŞ SAYISI</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">BAŞARI</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">SON GİRİŞ</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">AKSİYON</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {filteredStaff.map((member, idx) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-none cursor-pointer"
                                        >
                                            <TableCell className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm">
                                                        <AvatarImage src={member.image || ""} />
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs">
                                                            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {member.name}
                                                        </span>
                                                        <RoleBadge role={member.role} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {member.assignedTickets.length + member.sales.length}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-emerald-500">%98.5</TableCell>
                                            <TableCell className="text-xs font-bold text-slate-400">Şimdi aktif</TableCell>
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
                                                            <Shield className="w-4 h-4" /> Düzenle & Yetkilendir
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

                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 bg-white dark:bg-slate-900/50 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <h2 className="text-xl font-bold">Yetki Seviyeleri</h2>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 pb-4">
                                <div className="col-span-1">MODÜL</div>
                                <div className="text-center">ADM</div>
                                <div className="text-center">MÜD</div>
                                <div className="text-center">KAS</div>
                                <div className="text-center">TEK</div>
                            </div>
                            {rolePermissions.map((mod, i) => (
                                <div key={i} className="grid grid-cols-5 items-center">
                                    <div className="col-span-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">{mod.name}</div>
                                    {mod.perms.map((p, pi) => (
                                        <div key={pi} className="flex justify-center">
                                            {p ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-slate-200 dark:text-slate-800" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <Button
                                onClick={() => setTemplateModalOpen(true)}
                                className="w-full h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-none shadow-sm text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest"
                            >
                                Yetki Şablonlarını Düzenle
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-1 bg-slate-900 dark:bg-blue-600 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="p-8 space-y-4 relative z-10">
                            <div className="flex items-center justify-between font-bold text-white">
                                <h3 className="text-lg">Performans Ara</h3>
                                <Activity className="w-5 h-5 text-blue-200" />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Personel ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 bg-white/10 border-none rounded-2xl pl-12 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/20 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        İşlem Logları <Activity className="w-4 h-4 text-blue-500" />
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                placeholder="İşlem veya personel ara..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="h-9 w-64 bg-white dark:bg-slate-900/50 border-none rounded-xl pl-9 text-xs font-bold"
                            />
                        </div>
                        <Input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="h-9 w-40 bg-white dark:bg-slate-900/50 border-none rounded-xl text-xs font-bold"
                        />
                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm gap-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <Download className="w-3.5 h-3.5" /> CSV İNDİR
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border-none shadow-xl shadow-black/5 overflow-hidden divide-y divide-slate-50 dark:divide-white/5 relative">
                    {isLogsLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                    log.type === 'service' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {log.type === 'service' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md mr-2">
                                            {log.user?.name}
                                        </span>
                                        {log.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">#{log.id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-900 dark:text-white">
                                        {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {!isLogsLoading && logs.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <Activity className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Kayıt Bulunamadı</p>
                        </div>
                    )}
                </div>

                {logTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Button
                            variant="ghost"
                            disabled={logPage === 1}
                            onClick={() => setLogPage(p => p - 1)}
                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Önceki
                        </Button>
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            SAYFA {logPage} / {logTotalPages}
                        </div>
                        <Button
                            variant="ghost"
                            disabled={logPage === logTotalPages}
                            onClick={() => setLogPage(p => p + 1)}
                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
                        >
                            Sonraki <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <StaffEditModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                member={selectedMember}
                onUpdate={() => router.refresh()}
            />
            <RoleTemplateModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
            />
        </div>
    );
}
