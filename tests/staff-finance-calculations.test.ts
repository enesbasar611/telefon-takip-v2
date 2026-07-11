import { buildStaffFinanceMovements, calculateCareerPoints, calculatePayrollSnapshot, getDashboardStaffPeriodRange, getSalaryPaymentStatus, inclusiveDayCount } from "../src/lib/staff-finance-calculations";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(inclusiveDayCount(new Date(2026, 6, 1), new Date(2026, 6, 1)) === 1, "Same-day ranges should count as one day.");
assert(inclusiveDayCount(new Date(2026, 6, 1), new Date(2026, 6, 3)) === 3, "Date ranges should include both start and end days.");

const snapshot = calculatePayrollSnapshot({
  baseSalary: 30000,
  staffCreatedAt: new Date(2026, 6, 10),
  periodStart: new Date(2026, 6, 1),
  periodEnd: new Date(2026, 6, 31, 23, 59, 59, 999),
  asOfDate: new Date(2026, 6, 31),
  approvedCommissions: 2500,
  pendingCommissions: 1000,
  expenses: [
    { amount: 1500, type: "ADVANCE" },
    { amount: 9999, type: "DEDUCTION" },
  ],
  leaves: [
    {
      type: "UNPAID",
      status: "APPROVED",
      startDate: new Date(2026, 6, 20),
      endDate: new Date(2026, 6, 22),
    },
  ],
});

assert(snapshot.activeDays === 22, "Mid-month hires should be paid from hire day through period end.");
assert(snapshot.unpaidLeaveDays === 3, "Unpaid leave should count overlapping days inclusively.");
assert(snapshot.manualExpenses === 1500, "Legacy DEDUCTION rows should not be double-counted as manual expenses.");
assert(snapshot.unpaidLeaveDeduction === 3000, "Unpaid leave deduction should use 30-day salary basis.");
assert(snapshot.netPayout === 20000, "Net payout should be pro-rated salary plus commissions minus advances and leave deductions.");

const exitedSnapshot = calculatePayrollSnapshot({
  baseSalary: 30000,
  staffCreatedAt: new Date(2026, 6, 1),
  staffEndedAt: new Date(2026, 6, 10, 18, 0),
  periodStart: new Date(2026, 6, 1),
  periodEnd: new Date(2026, 6, 31, 23, 59, 59, 999),
  asOfDate: new Date(2026, 6, 31),
  approvedCommissions: 0,
  expenses: [],
  leaves: [],
});

assert(exitedSnapshot.activeDays === 10, "Employment end date should stop active-day payroll calculation.");
assert(exitedSnapshot.proRatedSalary === 10000, "Exited staff salary should be pro-rated until exit date.");

const dueToday = getSalaryPaymentStatus(7, new Date(2026, 6, 7, 14, 30));
assert(dueToday.isDueToday, "Salary payment status should flag payment day as due today.");
assert(dueToday.shouldNotify, "Salary payment status should notify on payment day.");

const dueTomorrow = getSalaryPaymentStatus(8, new Date(2026, 6, 7, 14, 30));
assert(dueTomorrow.isDueSoon, "Salary payment status should flag one day remaining.");
assert(dueTomorrow.shouldNotify, "Salary payment status should notify one day before payment day.");

const clampedEndOfMonth = getSalaryPaymentStatus(31, new Date(2026, 1, 27));
assert(clampedEndOfMonth.dueDate.getDate() === 28, "Salary payment day should clamp to the month's last day.");

const movements = buildStaffFinanceMovements({
  commissions: [
    { id: "c1", amount: 2500, type: "SERVICE", description: "Servis primi", approvedAt: new Date(2026, 6, 15), status: "APPROVED" },
  ],
  expenses: [
    { id: "e1", amount: 1500, type: "ADVANCE", description: "Temmuz avansı", createdAt: new Date(2026, 6, 12) },
    { id: "e2", amount: 500, type: "DEDUCTION", description: "Ekran hasarı kesintisi", createdAt: new Date(2026, 6, 20) },
  ],
  unpaidLeaveDeduction: 3000,
  unpaidLeaveDays: 3,
  periodEnd: new Date(2026, 6, 31),
});

assert(movements.length === 4, "Finance movements should include commissions, advances, deductions, and unpaid leave deductions.");
assert(movements.some((movement) => movement.type === "ADVANCE" && movement.label === "Avans"), "Advance movement should be labeled.");
assert(movements.some((movement) => movement.type === "DEDUCTION" && movement.description === "Ekran hasarı kesintisi"), "Manual deductions should be visible in movement history.");
assert(movements.some((movement) => movement.source === "UNPAID_LEAVE" && movement.amount === 3000), "Unpaid leave deduction should be visible in movement history.");
assert(new Date(movements[0].date).getTime() >= new Date(movements[1].date).getTime(), "Finance movements should be newest-first.");

const monthRange = getDashboardStaffPeriodRange({ mode: "month", referenceDate: new Date(2026, 6, 10) });
assert(monthRange.start.getDate() === 1, "Monthly staff dashboard range should start on the first day.");
assert(monthRange.end.getDate() === 31, "Monthly staff dashboard range should end on the last day.");
assert(monthRange.period === "2026-07", "Monthly staff dashboard range should expose archive-like period key.");

const weekRange = getDashboardStaffPeriodRange({ mode: "week", referenceDate: new Date(2026, 6, 10) });
assert(weekRange.start.getDay() === 1, "Weekly staff dashboard range should start on Monday.");
assert(weekRange.end.getDay() === 0, "Weekly staff dashboard range should end on Sunday.");

const career = calculateCareerPoints({ serviceCount: 5, salesCount: 3, completedTaskCount: 4, approvedCommissions: 1250 });
assert(career.points === 163, "Career points should combine services, sales, tasks, and approved commissions.");
assert(career.redeemableBonus === 163, "Career points should be redeemable as bonus amount.");

console.log("staff-finance-calculations tests passed");
