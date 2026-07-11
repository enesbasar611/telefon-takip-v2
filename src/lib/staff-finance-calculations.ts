const DAY_MS = 24 * 60 * 60 * 1000;

export type StaffLeaveForPayroll = {
  type: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
};

export type StaffExpenseForPayroll = {
  id?: string | null;
  amount: number | string | null;
  type?: string | null;
  description?: string | null;
  createdAt?: Date | string | null;
};

export type StaffCommissionForPayroll = {
  id?: string | null;
  amount: number | string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  referenceId?: string | null;
  createdAt?: Date | string | null;
  approvedAt?: Date | string | null;
};

export type StaffFinanceMovement = {
  id: string;
  category: "INCOME" | "DEDUCTION";
  source: "COMMISSION" | "EXPENSE" | "UNPAID_LEAVE";
  type: string;
  label: string;
  description: string;
  amount: number;
  date: Date | string;
  status?: string | null;
  referenceId?: string | null;
};

export function getPayrollPeriodRange(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const period = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;

  return { start, end, period };
}

export type DashboardStaffRangeMode = "week" | "month";

export function getDashboardStaffPeriodRange({
  mode = "month",
  referenceDate = new Date(),
}: {
  mode?: DashboardStaffRangeMode;
  referenceDate?: Date | string;
} = {}) {
  const ref = new Date(referenceDate);
  if (Number.isNaN(ref.getTime())) return getDashboardStaffPeriodRange({ mode, referenceDate: new Date() });

  if (mode === "week") {
    const start = new Date(ref);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const period = `${start.getFullYear()}-W${String(Math.ceil((((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / DAY_MS) + 1) / 7)).padStart(2, "0")}`;
    return { start, end, period, mode };
  }

  const monthRange = getPayrollPeriodRange(ref);
  return { ...monthRange, mode };
}

export function calculateCareerPoints({
  serviceCount = 0,
  salesCount = 0,
  completedTaskCount = 0,
  approvedCommissions = 0,
}: {
  serviceCount?: number;
  salesCount?: number;
  completedTaskCount?: number;
  approvedCommissions?: number;
}) {
  const points = Math.max(0, Math.round(
    serviceCount * 20 +
    salesCount * 10 +
    completedTaskCount * 5 +
    Number(approvedCommissions || 0) / 100
  ));
  const levelSize = 500;
  const level = Math.floor(points / levelSize) + 1;
  const progressPoints = points % levelSize;
  const progressPercent = Math.min(100, Math.round((progressPoints / levelSize) * 100));

  return {
    points,
    level,
    progressPoints,
    nextLevelPoints: levelSize,
    progressPercent,
    redeemableBonus: points,
  };
}

export function getSalaryPaymentStatus(paymentDay: number | null | undefined, referenceDate = new Date()) {
  const normalizedDay = Math.min(31, Math.max(1, Math.trunc(Number(paymentDay || 1))));
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const buildDueDate = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const due = new Date(year, month, Math.min(normalizedDay, lastDay));
    due.setHours(0, 0, 0, 0);
    return due;
  };

  let dueDate = buildDueDate(today.getFullYear(), today.getMonth());
  if (dueDate < today) {
    dueDate = buildDueDate(today.getFullYear(), today.getMonth() + 1);
  }

  const daysRemaining = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);

  return {
    paymentDay: normalizedDay,
    dueDate,
    daysRemaining,
    isDueToday: daysRemaining === 0,
    isDueSoon: daysRemaining === 1,
    shouldNotify: daysRemaining === 0 || daysRemaining === 1,
  };
}

export function inclusiveDayCount(startDate: Date | string, endDate: Date | string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function calculatePayrollSnapshot({
  baseSalary,
  staffCreatedAt,
  staffEndedAt,
  periodStart,
  periodEnd,
  asOfDate = new Date(),
  approvedCommissions,
  pendingCommissions = 0,
  expenses,
  leaves,
}: {
  baseSalary: number;
  staffCreatedAt?: Date | string | null;
  staffEndedAt?: Date | string | null;
  periodStart: Date;
  periodEnd: Date;
  asOfDate?: Date;
  approvedCommissions: number;
  pendingCommissions?: number;
  expenses: StaffExpenseForPayroll[];
  leaves: StaffLeaveForPayroll[];
}) {
  const salaryDays = 30;
  const periodEffectiveEnd = asOfDate < periodEnd ? asOfDate : periodEnd;
  const createdAt = staffCreatedAt ? new Date(staffCreatedAt) : null;
  const endedAt = staffEndedAt ? new Date(staffEndedAt) : null;
  const effectiveStart = createdAt && createdAt > periodStart ? createdAt : periodStart;
  const effectiveEnd = endedAt && endedAt < periodEffectiveEnd ? endedAt : periodEffectiveEnd;
  const activeDays = effectiveEnd < effectiveStart
    ? 0
    : Math.min(salaryDays, Math.max(0, inclusiveDayCount(effectiveStart, effectiveEnd)));

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let dailyLeaveCount = 0;

  for (const leave of leaves) {
    if (leave.status !== "APPROVED") continue;

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    if (leaveStart > periodEnd || leaveEnd < periodStart) continue;

    const overlapStart = leaveStart > periodStart ? leaveStart : periodStart;
    const overlapEnd = leaveEnd < periodEnd ? leaveEnd : periodEnd;
    const days = inclusiveDayCount(overlapStart, overlapEnd);

    if (leave.type === "UNPAID") unpaidLeaveDays += days;
    else if (leave.type === "DAILY") dailyLeaveCount += days;
    else paidLeaveDays += days;
  }

  const manualExpenses = expenses
    .filter((expense) => expense.type !== "DEDUCTION")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const unpaidLeaveDeduction = (baseSalary / salaryDays) * unpaidLeaveDays;
  const totalExpenses = manualExpenses + unpaidLeaveDeduction;
  const proRatedSalary = (baseSalary / salaryDays) * activeDays;

  return {
    baseSalary,
    proRatedSalary,
    activeDays,
    approvedCommissions,
    pendingCommissions,
    manualExpenses,
    unpaidLeaveDeduction,
    totalExpenses,
    leaveDays: paidLeaveDays + unpaidLeaveDays,
    unpaidLeaveDays,
    paidLeaveDays,
    dailyLeaveCount,
    netPayout: proRatedSalary + approvedCommissions - totalExpenses,
  };
}

export function buildStaffFinanceMovements({
  commissions = [],
  expenses = [],
  unpaidLeaveDeduction = 0,
  unpaidLeaveDays = 0,
  periodEnd = new Date(),
}: {
  commissions?: StaffCommissionForPayroll[];
  expenses?: StaffExpenseForPayroll[];
  unpaidLeaveDeduction?: number;
  unpaidLeaveDays?: number;
  periodEnd?: Date | string;
}): StaffFinanceMovement[] {
  const expenseLabels: Record<string, string> = {
    ADVANCE: "Avans",
    DEDUCTION: "Kesinti",
    MEAL: "Yemek gideri",
    TRAVEL: "Yol gideri",
  };

  const commissionLabels: Record<string, string> = {
    SERVICE: "Servis primi",
    SALE: "Satış primi",
    COMMISSION: "Prim",
  };

  const rows: StaffFinanceMovement[] = [
    ...commissions.map((commission, index) => {
      const type = String(commission.type || "COMMISSION").toUpperCase();
      return {
        id: commission.id || `commission-${index}`,
        category: "INCOME" as const,
        source: "COMMISSION" as const,
        type,
        label: commissionLabels[type] || "Prim",
        description: commission.description || "Prim",
        amount: Number(commission.amount || 0),
        date: commission.approvedAt || commission.createdAt || periodEnd,
        status: commission.status,
        referenceId: commission.referenceId,
      };
    }),
    ...expenses.map((expense, index) => {
      const type = String(expense.type || "ADVANCE").toUpperCase();
      return {
        id: expense.id || `expense-${index}`,
        category: "DEDUCTION" as const,
        source: "EXPENSE" as const,
        type,
        label: expenseLabels[type] || "Gider / kesinti",
        description: expense.description || expenseLabels[type] || "Gider / kesinti",
        amount: Number(expense.amount || 0),
        date: expense.createdAt || periodEnd,
      };
    }),
  ];

  if (unpaidLeaveDeduction > 0) {
    rows.push({
      id: "unpaid-leave-deduction",
      category: "DEDUCTION",
      source: "UNPAID_LEAVE",
      type: "UNPAID_LEAVE",
      label: "Ücretsiz izin",
      description: `${unpaidLeaveDays} gün ücretsiz izin kesintisi`,
      amount: unpaidLeaveDeduction,
      date: periodEnd,
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
