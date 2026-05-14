import type { Role } from "@prisma/client";

export type StaffPermissionSet = {
  canSell: boolean;
  canService: boolean;
  canStock: boolean;
  canFinance: boolean;
  canDelete: boolean;
  canEdit: boolean;
};

export const STAFF_PERMISSION_FIELDS: { key: keyof StaffPermissionSet; label: string }[] = [
  { key: "canSell", label: "Satış" },
  { key: "canService", label: "Servis" },
  { key: "canStock", label: "Stok" },
  { key: "canFinance", label: "Finans" },
  { key: "canEdit", label: "Düzenle" },
  { key: "canDelete", label: "Sil" },
];

export const STAFF_ROLE_TEMPLATE_ROLES: Role[] = [
  "SHOP_MANAGER",
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "TECHNICIAN",
  "STAFF",
  "COURIER",
];

export const STAFF_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  SHOP_MANAGER: "Dükkan Sahibi",
  ADMIN: "Yönetici",
  MANAGER: "Mağaza Müdürü",
  CASHIER: "Kasiyer",
  TECHNICIAN: "Teknisyen",
  STAFF: "Satış Danışmanı",
  COURIER: "Kurye",
};

export const STAFF_ROLE_DEFAULT_PERMISSIONS: Record<string, StaffPermissionSet> = {
  SUPER_ADMIN: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
  SHOP_MANAGER: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
  ADMIN: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
  MANAGER: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: false, canEdit: true },
  CASHIER: { canSell: true, canService: false, canStock: false, canFinance: true, canDelete: false, canEdit: false },
  TECHNICIAN: { canSell: false, canService: true, canStock: true, canFinance: false, canDelete: false, canEdit: true },
  STAFF: { canSell: true, canService: false, canStock: false, canFinance: false, canDelete: false, canEdit: false },
  COURIER: { canSell: false, canService: false, canStock: false, canFinance: false, canDelete: false, canEdit: false },
  USER: { canSell: false, canService: false, canStock: false, canFinance: false, canDelete: false, canEdit: false },
};

export function getDefaultStaffPermissions(role?: Role | string | null): StaffPermissionSet {
  return STAFF_ROLE_DEFAULT_PERMISSIONS[role || "STAFF"] || STAFF_ROLE_DEFAULT_PERMISSIONS.STAFF;
}
