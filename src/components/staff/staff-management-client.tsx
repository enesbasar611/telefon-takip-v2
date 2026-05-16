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
    Calendar as CalendarIcon,
    Lock,
    Phone,
    Mail,
    UserPlus
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
import { StaffDeleteModal } from "./staff-delete-modal";
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
import {
    getDefaultStaffPermissions,
    STAFF_PERMISSION_FIELDS,
    STAFF_ROLE_LABELS,
    STAFF_ROLE_TEMPLATE_ROLES,
} from "@/lib/staff-permissions";

interface StaffMember {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
    phone: string | null;
    role: Role;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    commissionRate: number;
    assignedTickets: any[];
    sales: any[];
    shortageTasks?: any[];
    canSell: boolean;
    canService: boolean;
    canStock: boolean;
    canFinance: boolean;
    canDelete: boolean;
    canEdit: boolean;
    leaves: any[];
}

interface StaffManagementClientProps {
    staff: StaffMember[];
    logs: any[];
    userRole?: string;
}

function RoleBadge({ role }: { role: string }) {
    const configs: Record<string, { label: string, className: string }> = {
        SUPER_ADMIN: { label: "SÜPER EDN", className: "bg-rose-500/10 text-rose-500" },
        SHOP_MANAGER: { label: "Dukkan Sahibi", className: "bg-violet-500/10 text-violet-500" },
        ADMIN: { label: "YÖNETİCİ", className: "bg-indigo-500/10 text-indigo-500" },
        MANAGER: { label: "MÜDÜR", className: "bg-purple-500/10 text-purple-500" },
        CASHIER: { label: "KASİYER", className: "bg-emerald-500/10 text-emerald-500" },
        TECHNICIAN: { label: "TEKNİSYEN", className: "bg-blue-500/10 text-blue-500" },
        COURIER: { label: "KURYE", className: "bg-orange-500/10 text-orange-500" },
        STAFF: { label: "PERSONEL", className: "bg-slate-500/10 text-muted-foreground/80" },
    };

    const config = configs[role] || configs.STAFF;

    return (
        <Badge className={cn("w-fit text-[9px] border-none px-2 py-0.5", config.className)}>
            {config.label}
        </Badge>
    );
}

function StaffEditModal({ isOpen, onClose, member, onUpdate, userRole }: {
    isOpen: boolean,
    onClose: () => void,
    member: StaffMember | null,
    onUpdate: () => void,
    userRole?: string
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: member?.name || "",
        surname: member?.surname || "",
        email: member?.email || "",
        phone: member?.phone || "",
        password: "",
        role: member?.role || "STAFF",
        canSell: member?.canSell || false,
        canService: member?.canService || false,
        canStock: member?.canStock || false,
        canFinance: member?.canFinance || false,
        canDelete: member?.canDelete || false,
        canEdit: member?.canEdit || false,
    });

    const [leaveData, setLeaveData] = useState({
        startDate: "",
        endDate: "",
        type: "ANNUAL",
        note: ""
    });

    useEffect(() => {
        if (member) {
            setFormData({
                name: member.name || "",
                surname: member.surname || "",
                email: member.email || "",
                phone: member.phone || "",
                password: "",
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

    const handleAssignLeave = async () => {
        if (!member || !leaveData.startDate || !leaveData.endDate) return;
        setLoading(true);
        const { assignStaffLeave } = await import("@/lib/actions/staff-actions");
        const res = await assignStaffLeave({
            userId: member.id,
            startDate: new Date(leaveData.startDate),
            endDate: new Date(leaveData.endDate),
            type: leaveData.type,
            note: leaveData.note
        });

        if (res.success) {
            setLeaveData({ startDate: "", endDate: "", type: "ANNUAL", note: "" });
            onUpdate();
        }
        setLoading(false);
    };

    const handleDeleteLeave = async (leaveId: string) => {
        if (!confirm("Bu izni silmek istediğinize emin misiniz?")) return;
        const { deleteStaffLeave } = await import("@/lib/actions/staff-actions");
        const res = await deleteStaffLeave(leaveId);
        if (res.success) {
            onUpdate();
        }
    };

    const handleRoleChange = (role: Role) => {
        setFormData({
            ...formData,
            role,
            ...getDefaultStaffPermissions(role)
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-card border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="font-bold text-xl">Profil ve Yetki Yönetimi</DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 text-xs font-semibold">
                                {member?.name} {member?.surname} için sistem erişimini özelleştirin.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest pl-1">AD</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold px-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest pl-1">SOYAD</Label>
                            <Input
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold px-4"
                            />
                        </div>
                    </div>

                    {(userRole === "SUPER_ADMIN" || userRole === "SHOP_MANAGER" || userRole === "ADMIN") && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> E-POSTA
                                </Label>
                                <Input
                                    value={formData.email}
                                    disabled
                                    className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold px-4 opacity-60 italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] text-rose-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> YENİ ŞİFRE (ADMIN)
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Şifreyi sıfırla..."
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="h-12 bg-rose-500/5 dark:bg-rose-500/10 border-none rounded-2xl font-bold px-4 ring-1 ring-rose-500/20"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> TELEFON
                            </Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold px-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest pl-1">SİSTEM ROLÜ</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v: any) => handleRoleChange(v as Role)}
                            >
                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold px-4">
                                    <SelectValue placeholder="Rol seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-2xl">
                                    {Object.entries(STAFF_ROLE_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val} className="text-xs font-bold uppercase tracking-widest py-3">
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/10">
                        <div className="flex items-center justify-between px-1">
                            <Label className="font-black text-[10px] text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> İZİN / TATİL YÖNETİMİ
                            </Label>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black opacity-50 uppercase pl-1">BAŞLANGIÇ</Label>
                                    <Input
                                        type="date"
                                        value={leaveData.startDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                                        className="h-10 bg-white dark:bg-white/5 border-none rounded-xl font-bold px-3 text-xs shadow-sm ring-1 ring-border/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black opacity-50 uppercase pl-1">BİTİŞ</Label>
                                    <Input
                                        type="date"
                                        value={leaveData.endDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                                        className="h-10 bg-white dark:bg-white/5 border-none rounded-xl font-bold px-3 text-xs shadow-sm ring-1 ring-border/5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black opacity-50 uppercase pl-1">İZİN TİPİ</Label>
                                    <Select value={leaveData.type} onValueChange={(v) => setLeaveData({ ...leaveData, type: v })}>
                                        <SelectTrigger className="h-10 bg-white dark:bg-white/5 border-none rounded-xl font-bold px-3 text-xs shadow-sm ring-1 ring-border/5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANNUAL">Yıllık İzin</SelectItem>
                                            <SelectItem value="SICK">Raporlu / Hasta</SelectItem>
                                            <SelectItem value="UNPAID">Ücretsiz İzin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleAssignLeave}
                                        disabled={loading}
                                        className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-lg"
                                    >
                                        {loading ? "..." : "İzini Tanımla"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {member?.leaves && member.leaves.length > 0 && (
                            <div className="space-y-2 overflow-y-visible pr-2">
                                {member.leaves.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((leave: any) => {
                                    const isCurrent = new Date() >= new Date(leave.startDate) && new Date() <= new Date(leave.endDate);
                                    return (
                                        <div key={leave.id} className={cn(
                                            "p-4 rounded-2xl flex items-center justify-between border-2 transition-all",
                                            isCurrent ? "bg-amber-500/10 border-amber-500/20 shadow-md" : "bg-slate-50 dark:bg-white/5 border-transparent opacity-80"
                                        )}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                                        {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                                                    </span>
                                                    {isCurrent && <Badge className="bg-amber-500 text-white border-none text-[8px] font-black">ŞU AN İZİNLİ</Badge>}
                                                </div>
                                                <span className="text-[9px] font-bold opacity-50 uppercase">
                                                    {leave.type === "ANNUAL" ? "Yıllık İzin" : leave.type === "SICK" ? "Raporlu" : "Ücretsiz İzin"}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteLeave(leave.id)}
                                                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 shadow-none border-none ring-0 focus-visible:ring-0"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {(userRole === "SUPER_ADMIN" || userRole === "SHOP_MANAGER" || userRole === "ADMIN") && (
                        <div className="space-y-3 pt-6 border-t border-border/10">
                            <div className="flex items-center justify-between px-1">
                                <Label className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">MODÜL YETKİLERİ (HASSAS)</Label>
                                <Badge className="bg-blue-600/10 text-blue-600 border-none text-[8px] font-black tracking-widest">KRİTİK</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {STAFF_PERMISSION_FIELDS.map((perm) => (
                                    <motion.div
                                        key={perm.key}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setFormData({ ...formData, [perm.key]: !formData[perm.key] })}
                                        className={cn(
                                            "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 items-center text-center",
                                            formData[perm.key]
                                                ? "bg-blue-600/10 border-blue-600/30 text-blue-600 shadow-sm"
                                                : "bg-slate-50 dark:bg-white/5 border-transparent opacity-60"
                                        )}
                                    >
                                        <Checkbox
                                            checked={!!formData[perm.key]}
                                            onCheckedChange={(c) => {
                                                setFormData({ ...formData, [perm.key]: !!c });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 border-2 border-blue-600/30 data-[state=checked]:bg-blue-600"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{perm.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 bg-slate-50/50 dark:bg-white/5 gap-3 border-t border-border/10">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl text-muted-foreground uppercase text-[10px] font-black tracking-widest px-8"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-2xl bg-blue-600 hover:bg-blue-700 px-10 h-14 shadow-xl shadow-blue-500/25 text-xs font-black uppercase tracking-[0.15em] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? "İŞLENİYOR..." : "BİLGİLERİ GÜNCELLE"}
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
        const current = templates.find(t => t.role === role) || getDefaultStaffPermissions(role);

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
            <DialogContent className="max-w-4xl bg-white dark:bg-card border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="font-extra-bold text-2xl">Yetki Şablonlarını Düzenle</DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 text-xs font-bold italic">
                        * Bu değişiklikler sadece yeni oluşturulan personelleri etkiler. Mevcut personelleri tek tek düzenleyin.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 pt-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-50 dark:border-border/50 hover:bg-transparent">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">ROL</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">SATIŞ</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">SERVİS</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">STOK</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">FİNANS</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">DÜZENLE</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">SİL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {STAFF_ROLE_TEMPLATE_ROLES.map((role) => {
                                const t = templates.find(temp => temp.role === role) || getDefaultStaffPermissions(role);
                                return (
                                    <TableRow key={role} className="hover:bg-transparent border-b border-slate-50 dark:border-border/50 last:border-none">
                                        <TableCell className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest py-6">
                                            {STAFF_ROLE_LABELS[role] || role}
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
                    <Button onClick={onClose} className="rounded-2xl bg-card dark:bg-blue-600 text-white px-8 h-12 shadow-lg shadow-blue-500/20 text-xs font-black uppercase tracking-widest">Kapat</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { PageHeader } from "@/components/ui/page-header";

export function StaffManagementClient({ staff: initialStaff = [], logs: initialLogs = [], userRole }: StaffManagementClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"all" | "SUPER_ADMIN" | "TECHNICIAN" | "MANAGER" | "CASHIER" | "COURIER">("all");
    const [localStaff, setLocalStaff] = useState<StaffMember[]>(initialStaff || []);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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
                member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.surname?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTab = filter === "all" || (member.role as string) === filter;
            return matchesSearch && matchesTab;
        });
    }, [localStaff, searchTerm, filter]);

    const stats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let monthlyTotalDays = 0;
        localStaff.forEach(s => {
            s.leaves?.forEach(l => {
                const leaveStart = new Date(l.startDate);
                const leaveEnd = new Date(l.endDate);

                const overlapStart = leaveStart < startOfMonth ? startOfMonth : leaveStart;
                const overlapEnd = leaveEnd > endOfMonth ? endOfMonth : leaveEnd;

                if (overlapStart <= overlapEnd) {
                    const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    monthlyTotalDays += diffDays;
                }
            });
        });

        return {
            total: localStaff.length,
            active: localStaff.filter(s => s.role !== 'STAFF').length,
            onLeave: localStaff.filter(s =>
                s.leaves?.some(l => new Date(l.startDate) <= now && new Date(l.endDate) >= now)
            ).length,
            monthlyTotalDays
        };
    }, [localStaff]);

    const rolePermissions = useMemo(() => {
        const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER", "TECHNICIAN"];
        return [
            { name: "Satış İşlemleri", perms: roles.map(r => localStaff.find(s => s.role === r)?.canSell ?? true) },
            { name: "Servis Kayıtları", perms: roles.map(r => localStaff.find(s => s.role === r)?.canService ?? true) },
            { name: "Stok Yönetimi", perms: roles.map(r => localStaff.find(s => s.role === r)?.canStock ?? true) },
            { name: "Finans & Raporlar", perms: roles.map(r => localStaff.find(s => s.role === r)?.canFinance ?? true) },
        ];
    }, [localStaff]);

    return (
        <div className="animate-in fade-in duration-700 space-y-12 pb-20">
            <PageHeader
                title="Ekip Yönetimi"
                description="Personel performansını, yetkilerini ve işlem loglarını buradan yönetin."
                icon={Users}
                badge={
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border-none px-3 py-1 text-[9px] uppercase font-black tracking-widest">SİSTEM DENETİMİ</Badge>
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-card border border-border/40 shadow-xl hover:bg-slate-50 transition-all">
                            <Filter className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <CreateStaffModal />
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "TOPLAM PERSONEL", val: stats.total, icon: Users, color: "blue", bg: "bg-blue-500/10", text: "text-blue-500" },
                    { label: "AKTİF GÖREVDE", val: stats.active, icon: UserCheck, color: "emerald", bg: "bg-emerald-500/10", text: "text-emerald-500" },
                    { label: "İZİNLİ / TATİL", val: stats.onLeave, sub: `BU AY: ${stats.monthlyTotalDays} GÜN`, icon: Calendar, color: "rose", bg: "bg-rose-500/10", text: "text-rose-500" }
                ].map((s, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-border/20 shadow-2xl bg-card overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("h-16 w-16 rounded-[1.6rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500", s.bg)}>
                                    <s.icon className={cn("w-8 h-8", s.text)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{s.label}</p>
                                <div className="flex items-baseline gap-3">
                                    <h3 className="font-bold text-4xl text-foreground tracking-tight">{s.val}</h3>
                                    {s.sub && <span className="text-[10px] font-black text-muted-foreground">{s.sub}</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Personel Listesi</h2>
                        <div className="flex items-center gap-2 p-1 bg-muted/30 dark:bg-card/50 rounded-[1.5rem] border border-border/50 backdrop-blur-md">
                            {[
                                { id: "all", label: "TÜMÜ" },
                                { id: "SUPER_ADMIN", label: "SÜPER EDN" },
                                { id: "TECHNICIAN", label: "TEKNİSYENLER" },
                                { id: "MANAGER", label: "MÜDÜRLER" },
                                { id: "CASHIER", label: "KASİYERLER" },
                                { id: "COURIER", label: "KURYELER" }
                            ].map(t => (
                                <Button
                                    key={t.id}
                                    variant="ghost"
                                    onClick={() => setFilter(t.id as any)}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] font-black tracking-widest transition-all",
                                        filter === t.id
                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Card className="rounded-[2.5rem] overflow-hidden border-border/20 shadow-2xl">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-black/20">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="font-black py-6 px-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">İSİM / ROL</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">İŞ SAYISI</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">BAŞARI</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SON GİRİŞ</TableHead>
                                    <TableHead className="font-black text-right pr-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">İŞLEM</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {filteredStaff.map((member, idx) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => {
                                                setSelectedMember(member);
                                                setEditModalOpen(true);
                                            }}
                                            className="group hover:bg-blue-500/[0.02] dark:hover:bg-blue-500/5 transition-all border-b border-border/5 last:border-none cursor-pointer"
                                        >
                                            <TableCell className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                                        <Avatar className="relative h-14 w-14 rounded-2xl border-2 border-white dark:border-border shadow-md transition-transform group-hover:scale-105">
                                                            <AvatarImage src={member.image || ""} />
                                                            <AvatarFallback className="bg-slate-100 dark:bg-muted text-slate-900 dark:text-white text-sm font-black">
                                                                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 text-left">
                                                        <span className="text-sm font-black text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {member.name} {member.surname || ""}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <RoleBadge role={member.role} />
                                                            {member.leaves?.some(l => new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()) && (
                                                                <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black tracking-widest px-1.5 py-0">İZİNLİ</Badge>
                                                            )}
                                                            {member.email && (
                                                                <span className="text-[10px] font-bold text-muted-foreground/60 transition-all italic block mt-0.5">
                                                                    {member.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-black text-foreground/80">
                                                {member.role === 'COURIER' && member.shortageTasks
                                                    ? member.shortageTasks.length
                                                    : (member.assignedTickets?.length || 0) + (member.sales?.length || 0)}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-sm font-black",
                                                member.role === 'COURIER'
                                                    ? (
                                                        (member.shortageTasks?.filter((t: any) => t.isResolved || t.isTaken).length || 0) / Math.max(member.shortageTasks?.length || 1, 1) >= 0.8
                                                            ? "text-emerald-500"
                                                            : "text-amber-500"
                                                    )
                                                    : "text-emerald-500"
                                            )}>
                                                {member.role === 'COURIER' && member.shortageTasks
                                                    ? `%${member.shortageTasks.length > 0
                                                        ? Math.round(((member.shortageTasks.filter((t: any) => t.isResolved || t.isTaken).length) / member.shortageTasks.length) * 100)
                                                        : 100}`
                                                    : "%98.5"}
                                            </TableCell>
                                            <TableCell className="text-[10px] font-black text-muted-foreground uppercase">Şimdi aktif</TableCell>
                                            <TableCell className="text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-border/50 text-foreground dark:text-white w-56 rounded-[1.5rem] p-2 shadow-2xl backdrop-blur-xl">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedMember(member);
                                                                setEditModalOpen(true);
                                                            }}
                                                            className="rounded-xl gap-3 cursor-pointer py-4 text-xs font-black uppercase tracking-widest"
                                                        >
                                                            <Shield className="w-4 h-4 text-blue-500" /> Düzenle & Yetki
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-muted dark:bg-white/5 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedMember(member);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                            className="rounded-xl gap-3 cursor-pointer py-4 text-xs text-rose-500 font-black uppercase tracking-widest hover:bg-rose-500/10"
                                                        >
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
                    <Card className="rounded-[2.5rem] border-border/20 shadow-2xl overflow-hidden group">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <h2 className="font-black text-xl uppercase tracking-tight">Yetki Matrisi</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/10 pb-4">
                                <div className="col-span-1">MODÜL</div>
                                <div className="text-center">ADM</div>
                                <div className="text-center">MÜD</div>
                                <div className="text-center">KAS</div>
                                <div className="text-center">TEK</div>
                            </div>
                            {rolePermissions.map((mod, i) => (
                                <div key={i} className="grid grid-cols-5 items-center group/row py-1 transition-all">
                                    <div className="col-span-1 text-[10px] font-bold text-slate-700 dark:text-foreground group-hover/row:text-blue-500 transition-colors">{mod.name}</div>
                                    {mod.perms.map((p, pi) => (
                                        <div key={pi} className="flex justify-center">
                                            {p ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground/20" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <Button
                                onClick={() => setTemplateModalOpen(true)}
                                className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-border/20 shadow-sm text-foreground text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all mt-4"
                            >
                                Şablonları Güncelle
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                        <div className="p-8 space-y-5 relative z-10">
                            <div className="flex items-center justify-between text-white">
                                <h3 className="font-black text-lg uppercase tracking-tight">Hızlı Arama</h3>
                                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <Input
                                    placeholder="İsim veya e-posta..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-14 bg-white/10 border-none rounded-2xl pl-12 text-white placeholder:text-white/40 shadow-inner font-bold text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8 pt-8">
                <Card className="rounded-[2.5rem] border-border/20 shadow-2xl overflow-hidden group">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="font-black text-xl uppercase tracking-tight">Aylık İzin & Tatil Raporu</h2>
                            </div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl">
                                {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {initialStaff.map((member) => {
                                const currentMonthLeaves = member.leaves?.filter((l: any) => {
                                    const start = new Date(l.startDate);
                                    const now = new Date();
                                    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                                }) || [];

                                const totalDays = currentMonthLeaves.reduce((acc: number, l: any) => {
                                    const start = new Date(l.startDate);
                                    const end = new Date(l.endDate);
                                    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                    return acc + diff;
                                }, 0);

                                if (totalDays === 0) return null;

                                return (
                                    <div key={member.id} className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-border/10 flex flex-col gap-4 group hover:bg-white dark:hover:bg-white/10 transition-all hover:shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-white dark:border-white/10 shadow-lg">
                                                    <AvatarImage src={member.image || ""} />
                                                    <AvatarFallback className="bg-blue-600 text-white font-black text-xs uppercase italic tracking-tighter">
                                                        {member.name?.[0]}{member.surname?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-black text-foreground">{member.name} {member.surname}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{member.role}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-amber-500">{totalDays}</p>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">TOPLAM GÜN</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {currentMonthLeaves.map((l: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between text-[9px] font-bold text-muted-foreground border-t border-border/5 pt-2">
                                                    <span>{new Date(l.startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} - {new Date(l.endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-2 py-0 border-amber-500/20 text-amber-600">{l.type === 'TATIL' ? 'TATİL' : 'İZİN'}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {initialStaff.every((m: any) => !m.leaves?.some((l: any) => {
                                const start = new Date(l.startDate);
                                const now = new Date();
                                return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                            })) && (
                                    <div className="col-span-full py-12 text-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto opacity-40">
                                            <Calendar className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Bu ay herhangi bir izin kaydı bulunmuyor</p>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6 pt-12">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <h2 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">İşlem Logları</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="İşlem veya personel..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="h-11 w-72 bg-white dark:bg-card/50 border border-border/20 rounded-xl pl-10 text-xs font-bold shadow-sm"
                            />
                        </div>
                        <Input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="h-11 w-44 bg-white dark:bg-card/50 border border-border/20 rounded-xl text-xs font-bold shadow-sm"
                        />
                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            className="h-11 px-6 rounded-xl bg-white dark:bg-card border-none shadow-xl gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            <Download className="w-4 h-4" /> CSV İNDİR
                        </Button>
                    </div>
                </div>

                <div className="bg-card rounded-[2.5rem] overflow-hidden border border-border/10 shadow-2xl relative">
                    {isLogsLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 backdrop-blur-[2px]">
                            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                        </div>
                    )}
                    <div className="divide-y divide-border/5">
                        {logs.map((log, i) => (
                            <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105",
                                        log.type === 'service' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {log.type === 'service' ? (
                                            <Shield className="w-5 h-5" />
                                        ) : (
                                            <TrendingUp className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-foreground/90">
                                                <span className="text-blue-600 dark:text-blue-400 uppercase text-[9px] font-black px-2 py-0.5 bg-blue-500/10 rounded-md mr-3 tracking-widest">
                                                    {log.user?.name}
                                                </span>
                                                {log.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] text-muted-foreground font-black tracking-widest group-hover:text-foreground transition-colors uppercase italic opacity-40">#{log.id.slice(-8).toUpperCase()}</p>
                                            <div className="h-1 w-1 rounded-full bg-border"></div>
                                            <p className="text-[9px] font-black text-muted-foreground tracking-widest uppercase">{log.type === 'service' ? 'TEKNİK SERVİS' : 'SATIŞ SİSTEMİ'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
                                            {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}
                                        </p>
                                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest">
                                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all bg-slate-100 dark:bg-white/5">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!isLogsLoading && logs.length === 0 && (
                        <div className="p-32 text-center space-y-5">
                            <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto">
                                <Activity className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Herhangi bir işlem kaydı bulunamadı</p>
                        </div>
                    )}
                </div>

                {logTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-6 pt-8 pb-12">
                        <Button
                            variant="ghost"
                            disabled={logPage === 1}
                            onClick={() => setLogPage(p => p - 1)}
                            className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 bg-white dark:bg-card border border-border/10 shadow-lg"
                        >
                            <ChevronLeft className="w-4 h-4" /> Önceki
                        </Button>
                        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl shadow-blue-500/20">
                            {logPage} / {logTotalPages}
                        </div>
                        <Button
                            variant="ghost"
                            disabled={logPage === logTotalPages}
                            onClick={() => setLogPage(p => p + 1)}
                            className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 bg-white dark:bg-card border border-border/10 shadow-lg"
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
                onUpdate={() => {
                    router.refresh();
                    router.refresh(); // Double refresh to ensure revalidation
                }}
                userRole={userRole}
            />
            <StaffDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                member={selectedMember}
                otherStaff={localStaff.filter(s => s.id !== selectedMember?.id)}
                onDeleted={() => router.refresh()}
            />
            <RoleTemplateModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
            />
        </div>
    );
}
