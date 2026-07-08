import { calculatePayrollSnapshot, getSalaryPaymentStatus, inclusiveDayCount } from "../src/lib/staff-finance-calculations";

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

console.log("staff-finance-calculations tests passed");
