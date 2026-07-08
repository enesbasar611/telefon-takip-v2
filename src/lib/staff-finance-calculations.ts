const DAY_MS = 24 * 60 * 60 * 1000;

export type StaffLeaveForPayroll = {
  type: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
};

export type StaffExpenseForPayroll = {
  amount: number | string | null;
  type?: string | null;
};

export function getPayrollPeriodRange(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const period = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;

  return { start, end, period };
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
