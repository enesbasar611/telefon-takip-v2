"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export async function getTransactions(options: {
  accountId?: string;
  dailySessionId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { accountId, dailySessionId, page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        ...(accountId ? { accountId } : {}),
        ...(dailySessionId ? { dailySessionId } : {}),
      },
      include: {
        user: true,
        sale: true,
        account: true,
        dailySession: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
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

    revalidatePath("/satis/kasa");
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
  date?: string;
  attachments?: { url: string; filename: string; fileType: string; fileSize: number }[];
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
          userId: user.id,
          createdAt: data.date ? new Date(data.date) : new Date(),
          attachments: {
            create: data.attachments?.map(att => ({
              url: att.url,
              filename: att.filename,
              fileType: att.fileType,
              fileSize: att.fileSize
            }))
          }
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

    revalidatePath("/satis/kasa");
    revalidatePath("/");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    console.error("Manual transaction error:", error);
    return { success: false, error: "İşlem kaydedilemedi." };
  }
}

export async function updateManualTransaction(id: string, data: {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  accountId?: string;
  category?: string;
  date?: string;
  newAttachments?: { url: string; filename: string; fileType: string; fileSize: number }[];
  removedAttachmentIds?: string[];
}) {
  try {
    const oldTx = await prisma.transaction.findUnique({
      where: { id },
      include: { attachments: true }
    });

    if (!oldTx) return { success: false, error: "İşlem bulunamadı." };

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Update the transaction
      const t = await tx.transaction.update({
        where: { id },
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          accountId: data.accountId,
          category: data.category,
          createdAt: data.date ? new Date(data.date) : oldTx.createdAt,
          attachments: {
            deleteMany: data.removedAttachmentIds ? { id: { in: data.removedAttachmentIds } } : {},
            create: data.newAttachments?.map(att => ({
              url: att.url,
              filename: att.filename,
              fileType: att.fileType,
              fileSize: att.fileSize
            }))
          }
        }
      });

      // 2. Adjust account balances if account changed or amount changed
      if (oldTx.accountId !== data.accountId || Number(oldTx.amount) !== data.amount || oldTx.type !== data.type) {
        // Reverse old transaction
        if (oldTx.accountId) {
          await tx.account.update({
            where: { id: oldTx.accountId },
            data: {
              balance: {
                [oldTx.type === 'INCOME' ? 'decrement' : 'increment']: oldTx.amount
              }
            }
          });
        }

        // Apply new transaction
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
      }

      return t;
    });

    revalidatePath("/satis/kasa");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    console.error("Update transaction error:", error);
    return { success: false, error: "İşlem güncellenemedi." };
  }
}

export async function deleteAttachment(id: string) {
  try {
    await prisma.attachment.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Dosya silinemedi." };
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

/**
 * Returns the default "Kasa" (cash register) account.
 * Creates one automatically if it doesn't exist yet.
 */
export async function getOrCreateKasaAccount() {
  // 1. Try the default-flagged account
  let kasa = await prisma.account.findFirst({ where: { isDefault: true } });
  if (kasa) return kasa;

  // 2. Try by name
  kasa = await prisma.account.findFirst({ where: { name: { contains: "Kasa" } } });
  if (kasa) {
    await prisma.account.update({ where: { id: kasa.id }, data: { isDefault: true } });
    return kasa;
  }

  // 3. Create it fresh
  kasa = await prisma.account.create({
    data: { name: "Kasa", type: "CASH", balance: 0, isDefault: true }
  });
  return kasa;
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

    revalidatePath("/satis/kasa");
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

    // Net change for THIS session (income - expense)
    const netChange = session.transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      return t.type === 'INCOME' ? acc + amount : acc - amount;
    }, 0);

    const expectedBalance = Number(session.openingBalance) + netChange;

    // Fetch / create the Kasa account
    const kasaAccount = await getOrCreateKasaAccount();

    await prisma.$transaction(async (tx) => {
      // 1. Close the session
      await tx.dailySession.update({
        where: { id },
        data: {
          closingBalance: expectedBalance,
          actualBalance,
          status: "CLOSED",
          closedById: user.id,
          notes: notes ? `${session.notes || ''}\nKapanış Notu: ${notes}` : session.notes
        }
      });

      // 2. Apply the net delta to the Kasa account
      //    Only count transactions NOT already linked to this Kasa account
      //    (to avoid double-counting when sales already updated the account)
      const kasaLinkedTxIds = session.transactions
        .filter(t => t.accountId === kasaAccount.id)
        .map(t => t.id);

      const nonKasaTxs = session.transactions.filter(
        t => !kasaLinkedTxIds.includes(t.id) && t.accountId === null
      );

      const unlinkedNet = nonKasaTxs.reduce((acc, t) => {
        const amount = Number(t.amount);
        return t.type === 'INCOME' ? acc + amount : acc - amount;
      }, 0);

      if (unlinkedNet !== 0) {
        await tx.account.update({
          where: { id: kasaAccount.id },
          data: {
            balance: {
              [unlinkedNet > 0 ? 'increment' : 'decrement']: Math.abs(unlinkedNet)
            }
          }
        });
      }
    });

    revalidatePath("/satis/kasa");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("closeDailySession error:", error);
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

    revalidatePath("/satis/kasa");
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

export async function paySupplierDebt(data: {
  supplierId: string;
  accountId: string;
  amount: number;
  description: string;
}) {
  try {
    const user = await getOrCreateDevUser();
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: "OPEN" }
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Account balance
      const account = await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } }
      });

      // 2. Update Supplier balance
      const supplier = await tx.supplier.update({
        where: { id: data.supplierId },
        data: { balance: { decrement: data.amount } }
      });

      // 3. Create General Transaction (linked to account)
      const transaction = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: data.amount,
          description: `Tedarikçi Ödemesi: ${supplier.name} - ${data.description}`,
          paymentMethod: account.type === 'CASH' ? 'CASH' : 'TRANSFER',
          accountId: data.accountId,
          dailySessionId: activeSession?.id,
          userId: user.id,
          category: "TEDARİKÇİ ÖDEMESİ"
        }
      });

      // 4. Create Supplier Transaction
      await tx.supplierTransaction.create({
        data: {
          supplierId: data.supplierId,
          amount: data.amount,
          type: "EXPENSE",
          description: data.description,
          date: new Date()
        }
      });

      // 5. Allocate payment to PurchaseOrders (FIFO)
      let remainingToApply = data.amount;
      const unpaidOrders = await tx.purchaseOrder.findMany({
        where: {
          supplierId: data.supplierId,
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
          remainingAmount: { gt: 0 }
        },
        orderBy: { createdAt: 'asc' }
      });

      for (const order of unpaidOrders) {
        if (remainingToApply <= 0) break;

        const orderRemaining = Number(order.remainingAmount);
        const applyAmount = Math.min(remainingToApply, orderRemaining);

        const newRemaining = orderRemaining - applyAmount;
        await tx.purchaseOrder.update({
          where: { id: order.id },
          data: {
            remainingAmount: newRemaining,
            paymentStatus: newRemaining === 0 ? "PAID" : "PARTIAL"
          }
        });

        remainingToApply -= applyAmount;
      }

      return { transaction };
    });

    revalidatePath("/satis/kasa");
    revalidatePath("/tedarikciler");
    revalidatePath("/");
    return { success: true, transaction: serializePrisma(result.transaction) };
  } catch (error) {
    console.error("Pay supplier debt error:", error);
    return { success: false, error: "Ödeme gerçekleştirilemedi." };
  }
}
