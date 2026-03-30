"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export async function getTransactions(filters?: { accountId?: string; dailySessionId?: string }) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        ...(filters?.accountId ? { accountId: filters.accountId } : {}),
        ...(filters?.dailySessionId ? { dailySessionId: filters.dailySessionId } : {}),
      },
      include: {
        user: true,
        sale: true,
        account: true,
        dailySession: true
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "asc" }
    });
    return serializePrisma(accounts);
  } catch (error) {
    return [];
  }
}

export async function createAccount(data: { name: string; type: "CASH" | "BANK" | "POS" | "CREDIT_CARD"; initialBalance?: number }) {
  try {
    const account = await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.initialBalance || 0,
        isDefault: false
      }
    });

    if (data.initialBalance && data.initialBalance > 0) {
      // Create initial balance transaction
      const user = await getOrCreateDevUser();
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: data.initialBalance,
          description: "Açılış Bakiyesi",
          paymentMethod: data.type === 'CASH' ? 'CASH' : 'TRANSFER',
          accountId: account.id,
          userId: user.id,
          category: "AÇILIŞ"
        }
      });
    }

    revalidatePath("/finans");
    return { success: true, account: serializePrisma(account) };
  } catch (error) {
    return { success: false, error: "Hesap oluşturulamadı." };
  }
}

export async function createManualTransaction(data: {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  accountId?: string;
  category?: string;
}) {
  try {
    const user = await getOrCreateDevUser();

    // Get active session if any
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: "OPEN" }
    });

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          accountId: data.accountId,
          category: data.category,
          dailySessionId: activeSession?.id,
          userId: user.id
        }
      });

      // Update account balance if accountId is provided
      if (data.accountId) {
        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              [data.type === 'INCOME' ? 'increment' : 'decrement']: data.amount
            }
          }
        });
      }

      return t;
    });

    revalidatePath("/finans");
    revalidatePath("/");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    console.error("Manual transaction error:", error);
    return { success: false, error: "İşlem kaydedilemedi." };
  }
}

async function getOrCreateDevUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@basarteknik.com",
        name: "Admin",
        password: "password123",
        role: "ADMIN"
      }
    });
  }
  return user;
}

export async function getFinancialSummary() {
  try {
    const accounts = await prisma.account.findMany();
    const transactions = await prisma.transaction.findMany();

    // Calculate total receivables (Customer Debts)
    const debts = await prisma.debt.findMany({ where: { isPaid: false } });
    const totalReceivables = debts.reduce((sum, d) => sum + Number(d.remainingAmount), 0);

    // Calculate total payables (Supplier Balances)
    const suppliers = await prisma.supplier.findMany();
    const totalPayables = suppliers.reduce((sum, s) => sum + Number(s.balance), 0);

    const summaryData = transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        acc.totalIncome += amount;
      } else {
        acc.totalExpense += amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    const cashBalance = accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + Number(a.balance), 0);
    const bankBalance = accounts.filter(a => a.type !== 'CASH').reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      ...summaryData,
      cashBalance,
      bankBalance,
      totalReceivables,
      totalPayables,
      netAssets: cashBalance + bankBalance + totalReceivables - totalPayables,
      accounts: serializePrisma(accounts)
    };
  } catch (error) {
    return { totalIncome: 0, totalExpense: 0, cashBalance: 0, bankBalance: 0, totalReceivables: 0, totalPayables: 0, netAssets: 0, accounts: [] };
  }
}

export async function getDailySession() {
  try {
    const session = await prisma.dailySession.findFirst({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { openedBy: true }
    });
    return serializePrisma(session);
  } catch (error) {
    return null;
  }
}

export async function openDailySession(openingBalance: number, notes?: string) {
  try {
    const user = await getOrCreateDevUser();

    const existing = await prisma.dailySession.findFirst({
      where: { status: "OPEN" }
    });

    if (existing) return { success: false, error: "Zaten açık bir kasa oturumu mevcut." };

    const session = await prisma.dailySession.create({
      data: {
        openingBalance,
        notes,
        status: "OPEN",
        openedById: user.id
      }
    });

    revalidatePath("/finans");
    return { success: true, session: serializePrisma(session) };
  } catch (error) {
    return { success: false, error: "Kasa açılamadı." };
  }
}

export async function closeDailySession(id: string, actualBalance: number, notes?: string) {
  try {
    const user = await getOrCreateDevUser();

    const session = await prisma.dailySession.findUnique({
      where: { id },
      include: { transactions: true }
    });

    if (!session) return { success: false, error: "Oturum bulunamadı." };

    const netChange = session.transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      return t.type === 'INCOME' ? acc + amount : acc - amount;
    }, 0);

    const expectedBalance = Number(session.openingBalance) + netChange;

    await prisma.dailySession.update({
      where: { id },
      data: {
        closingBalance: expectedBalance,
        actualBalance,
        status: "CLOSED",
        closedById: user.id,
        notes: notes ? `${session.notes || ''}\nKapanış Notu: ${notes}` : session.notes
      }
    });

    revalidatePath("/finans");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Kasa kapatılamadı." };
  }
}

export async function transferFunds(data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}) {
  try {
    const user = await getOrCreateDevUser();

    if (data.fromAccountId === data.toAccountId) {
      return { success: false, error: "Aynı hesaba transfer yapılamaz." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decrease from source
      await tx.account.update({
        where: { id: data.fromAccountId },
        data: { balance: { decrement: data.amount } }
      });

      // 2. Increase to destination
      await tx.account.update({
        where: { id: data.toAccountId },
        data: { balance: { increment: data.amount } }
      });

      // 3. Create Transfer record (as two linked transactions)
      const transferId = `TRF-${Date.now()}`;

      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: data.amount,
          description: `Transfer: ${data.description} (Gönderen)`,
          paymentMethod: "TRANSFER",
          accountId: data.fromAccountId,
          userId: user.id,
          category: "TRANSFER"
        }
      });

      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: data.amount,
          description: `Transfer: ${data.description} (Alan)`,
          paymentMethod: "TRANSFER",
          accountId: data.toAccountId,
          userId: user.id,
          category: "TRANSFER"
        }
      });
    });

    revalidatePath("/finans");
    return { success: true };
  } catch (error) {
    console.error("Transfer error:", error);
    return { success: false, error: "Transfer işlemi başarısız oldu." };
  }
}

export async function getAccountAnalytics(accountId: string, period: "DAY" | "WEEK" | "MONTH" = "WEEK") {
  try {
    const now = new Date();
    let startDate = new Date();

    if (period === "DAY") startDate.setHours(0, 0, 0, 0);
    else if (period === "WEEK") startDate.setDate(now.getDate() - 7);
    else if (period === "MONTH") startDate.setMonth(now.getMonth() - 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: "asc" }
    });

    // Group by date for charts
    const grouped = transactions.reduce((acc: any, t) => {
      const date = format(new Date(t.createdAt), period === "DAY" ? "HH:00" : "dd MMM", { locale: tr });
      if (!acc[date]) acc[date] = { date, income: 0, expense: 0, balance: 0 };

      if (t.type === "INCOME") acc[date].income += Number(t.amount);
      else acc[date].expense += Number(t.amount);

      return acc;
    }, {});

    const chartData = Object.values(grouped);

    // Distribution by category
    const categories = transactions.reduce((acc: any, t) => {
      const cat = t.category || "DİĞER";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(t.amount);
      return acc;
    }, {});

    const distributionData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return {
      chartData,
      distributionData,
      transactions: serializePrisma(transactions.slice(-10)) // Last 10 for mini list
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return { chartData: [], distributionData: [], transactions: [] };
  }
}
