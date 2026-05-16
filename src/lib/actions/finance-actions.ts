"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { format, isAfter, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { getShopId, getUserId } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export async function getTransactions(options: {
  accountId?: string;
  dailySessionId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { accountId, dailySessionId, page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  try {
    const shopId = await getShopId();
    const transactions = await prisma.transaction.findMany({
      where: {
        shopId,
        ...(accountId ? { financeAccountId: accountId } : {}),
        ...(dailySessionId ? { dailySessionId } : {}),
      },
      include: {
        user: true,
        sale: true,
        financeAccount: true,
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
    const shopId = await getShopId();
    const accounts = await prisma.financeAccount.findMany({
      where: { shopId },
      orderBy: { createdAt: "asc" }
    });
    return serializePrisma(accounts);
  } catch (error) {
    return [];
  }
}

export async function createAccount(data: {
  name: string;
  type: "CASH" | "BANK" | "POS" | "CREDIT_CARD";
  initialBalance?: number;
  limit?: number;
  billingDay?: number;
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const account = await prisma.financeAccount.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.initialBalance || 0,
        initialBalance: data.initialBalance || 0,
        availableBalance: data.type === "CREDIT_CARD" ? (data.limit || 0) - (data.initialBalance || 0) : (data.initialBalance || 0),
        limit: data.limit,
        billingDay: data.billingDay,
        isDefault: false,
        shopId
      }
    });

    if (data.initialBalance && data.initialBalance > 0) {
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: data.initialBalance,
          description: "Açılış Bakiyesi",
          paymentMethod: data.type === 'CASH' ? 'CASH' : 'TRANSFER',
          financeAccountId: account.id,
          userId,
          shopId,
          category: "AÇILIŞ",
          runningBalance: data.initialBalance
        }
      });
    }

    revalidatePath("/satis/kasa");
    return { success: true, account: serializePrisma(account) };
  } catch (error) {
    console.error("Account creation error:", error);
    return { success: false, error: "Hesap oluşturulamadı." };
  }
}

export async function createManualTransaction(rawData: z.infer<typeof transactionSchema>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 50 transactions per minute
    await checkRateLimit(`createManualTransaction:${userId}`, 50);

    const data = transactionSchema.parse(rawData);

    // Title case formatting for description and category
    const toTitleCase = (str: string) => {
      return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    if (data.description) data.description = toTitleCase(data.description);
    if (data.category) data.category = toTitleCase(data.category);

    // Get active session if any
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: "OPEN", shopId }
    });

    // Route for payment method if no accountId specified
    let targetAccountId = data.accountId;
    if (!targetAccountId) {
      const type = data.paymentMethod === "CASH" ? "CASH" : data.paymentMethod === "CARD" ? "POS" : "BANK";
      const account = await getOrCreateAccountByType(type as any);
      targetAccountId = account.id;
    }

    const txDateStr = data.date || format(new Date(), "yyyy-MM-dd");
    const txDate = startOfDay(new Date(txDateStr));
    const today = startOfDay(new Date());

    if (isAfter(txDate, today)) {
      // Future date detected! Forward to agenda instead.
      const agendaType = data.type === "INCOME" ? "COLLECTION" : "PAYMENT";
      await prisma.agendaEvent.create({
        data: {
          title: data.description,
          type: agendaType,
          date: txDate,
          amount: data.amount,
          category: data.category || "Finans Planlaması",
          shopId
        }
      });
      revalidatePath("/ajanda");
      return { success: true, isFuture: true, message: "İleri tarihli işlem, Randevu Merkezi'ne eklendi." };
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Get the account to update its balance and calculate running balance
      const account = await tx.financeAccount.findUnique({
        where: { id: targetAccountId! }
      });

      if (!account) throw new Error("Hesap bulunamadı.");

      const oldBalance = Number(account.balance);
      const newBalance = data.type === 'INCOME' ? oldBalance + data.amount : oldBalance - data.amount;

      // 2. Calculate New Available Balance if it's a Credit Card
      let newAvailableBalance = account.availableBalance ? Number(account.availableBalance) : null;
      if (account.type === "CREDIT_CARD") {
        // Credit card available balance is limit - balance (but here balance is used as current spendable amount)
        // Actually, let's stick to: balance = money in account/available limit.
        // If it's a credit card, availableBalance = balance.
        newAvailableBalance = newBalance;
      }

      const t = await tx.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          financeAccountId: targetAccountId,
          category: data.category,
          dailySessionId: activeSession?.id,
          userId,
          shopId,
          createdAt: data.date ? new Date(data.date) : new Date(),
          runningBalance: newBalance,
          attachments: {
            create: data.attachments?.map(att => ({
              url: att.url,
              filename: att.filename,
              fileType: att.fileType,
              fileSize: att.fileSize,
              shopId
            }))
          }
        }
      });

      // Update account balance
      await tx.financeAccount.update({
        where: { id: targetAccountId! },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance
        }
      });

      return t;
    });

    revalidatePath("/satis/kasa");
    revalidatePath("/");
    revalidatePath("/satis/kasa");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Manual transaction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "İşlem kaydedilemedi." };
  }
}

export async function updateManualTransaction(
  id: string,
  rawData: Partial<z.infer<typeof transactionSchema>> & {
    newAttachments?: any[];
    removedAttachmentIds?: string[];
  }
) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 50 updates per minute
    await checkRateLimit(`updateManualTransaction:${userId}`, 50);

    const { newAttachments, removedAttachmentIds, ...otherData } = rawData;
    const data = transactionSchema.partial().parse(otherData);

    const oldTx = await prisma.transaction.findUnique({
      where: { id, shopId },
      include: { attachments: true }
    });

    if (!oldTx) return { success: false, error: "İşlem bulunamadı." };

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Delete removed attachments if IDs provided
      if (removedAttachmentIds && removedAttachmentIds.length > 0) {
        await tx.attachment.deleteMany({
          where: {
            id: { in: removedAttachmentIds },
            shopId
          }
        });
      }

      // 2. Create new attachments if provided
      const attachmentData = newAttachments?.map(att => ({
        url: att.url,
        filename: att.filename,
        fileType: att.fileType,
        fileSize: att.fileSize,
        shopId
      })) || [];

      // 3. Update the transaction
      const t = await tx.transaction.update({
        where: { id },
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          financeAccountId: data.accountId,
          category: data.category,
          createdAt: data.date ? new Date(data.date) : oldTx.createdAt,
          attachments: attachmentData.length > 0 ? {
            create: attachmentData
          } : undefined
        }
      });

      // 4. Adjust account balances and running balances
      if (oldTx.financeAccountId !== data.accountId || Number(oldTx.amount) !== data.amount || oldTx.type !== data.type) {
        // Reverse old transaction
        if (oldTx.financeAccountId) {
          const oldAccount = await tx.financeAccount.findUnique({ where: { id: oldTx.financeAccountId } });
          if (oldAccount) {
            const reversedBalance = oldTx.type === 'INCOME' ? Number(oldAccount.balance) - Number(oldTx.amount) : Number(oldAccount.balance) + Number(oldTx.amount);
            await tx.financeAccount.update({
              where: { id: oldTx.financeAccountId },
              data: {
                balance: reversedBalance,
                availableBalance: oldAccount.type === 'CREDIT_CARD' ? reversedBalance : oldAccount.availableBalance
              }
            });
          }
        }

        // Apply new transaction
        const targetAccountId = data.accountId || oldTx.financeAccountId;
        if (targetAccountId) {
          const targetAccount = await tx.financeAccount.findUnique({ where: { id: targetAccountId } });
          if (targetAccount) {
            const newBalance = (data.type || oldTx.type) === 'INCOME'
              ? Number(targetAccount.balance) + (data.amount || Number(oldTx.amount))
              : Number(targetAccount.balance) - (data.amount || Number(oldTx.amount));

            await tx.financeAccount.update({
              where: { id: targetAccountId },
              data: {
                balance: newBalance,
                availableBalance: targetAccount.type === 'CREDIT_CARD' ? newBalance : targetAccount.availableBalance
              }
            });

            // Update transaction with new running balance
            await tx.transaction.update({
              where: { id: t.id },
              data: { runningBalance: newBalance }
            });
          }
        }
      }

      return t;
    });

    revalidatePath("/satis/kasa");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Update transaction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "İşlem güncellenemedi." };
  }
}

export async function deleteAttachment(id: string) {
  try {
    const shopId = await getShopId();
    await prisma.attachment.delete({
      where: { id, shopId }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Dosya silinemedi." };
  }
}

// getOrCreateDevUser removed - using auth() helpers instead.

/**
 * Returns the default "Kasa" (cash register) account.
 * Creates one automatically if it doesn't exist yet.
 */
export async function getOrCreateKasaAccount(providedShopId?: string) {
  return getOrCreateAccountByType("CASH", providedShopId);
}

export async function getOrCreateAccountByType(type: "CASH" | "BANK" | "POS" | "CREDIT_CARD", providedShopId?: string) {
  const shopId = providedShopId || await getShopId();
  const nameMap = {
    CASH: "Merkez Kasa",
    BANK: "Banka Hesabı",
    POS: "POS Hesabı",
    CREDIT_CARD: "Kredi Kartı"
  };

  // 1. Try to find the account by type
  let account = await prisma.financeAccount.findFirst({
    where: { type, shopId, isActive: true },
    orderBy: { isDefault: "desc" }
  });

  if (account) return account;

  // 2. Fallback: try by name if it exists but type is different (rare case)
  const fallbackName = nameMap[type];
  account = await prisma.financeAccount.findFirst({
    where: { name: { contains: fallbackName }, shopId }
  });

  if (account) {
    return await prisma.financeAccount.update({
      where: { id: account.id },
      data: { type, isDefault: type === "CASH" }
    });
  }

  // 3. Create it fresh
  return await prisma.financeAccount.create({
    data: {
      name: fallbackName,
      type,
      balance: 0,
      isDefault: type === "CASH",
      shopId
    }
  });
}

export async function updateAccount(id: string, data: {
  name: string;
  type: "CASH" | "BANK" | "POS" | "CREDIT_CARD";
  balance?: number;
  limit?: number;
  billingDay?: number;
}) {
  try {
    const shopId = await getShopId();

    // Get current account to calculate available balance if needed
    const current = await prisma.financeAccount.findUnique({
      where: { id, shopId }
    });
    if (!current) throw new Error("Hesap bulunamadı.");

    const newLimit = data.limit ?? Number(current.limit || 0);
    const newBalance = data.balance ?? Number(current.balance);
    const newType = data.type ?? current.type;

    const account = await prisma.financeAccount.update({
      where: { id, shopId },
      data: {
        name: data.name,
        type: newType,
        balance: newBalance,
        limit: newLimit,
        billingDay: data.billingDay ?? current.billingDay,
        availableBalance: newType === "CREDIT_CARD" ? newLimit - newBalance : newBalance
      }
    });

    revalidatePath("/satis/kasa");
    return { success: true, account: serializePrisma(account) };
  } catch (error) {
    console.error("Account update error:", error);
    return { success: false, error: "Hesap güncellenemedi." };
  }
}

export async function getDailySummary() {
  try {
    const shopId = await getShopId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [accounts, todayIncomeAgg, todayExpenseAgg, totalReceivablesAgg, totalPayablesAgg] = await Promise.all([
      prisma.financeAccount.findMany({ where: { shopId } }),
      prisma.transaction.aggregate({
        where: {
          shopId,
          type: 'INCOME',
          createdAt: { gte: today },
          category: { not: "AÇILIŞ" },
          paymentMethod: { not: "DEBT" } // Veresiye işlemleri nakit gelir sayılmasın
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          shopId,
          type: 'EXPENSE',
          createdAt: { gte: today },
          paymentMethod: { not: "DEBT" }
        },
        _sum: { amount: true }
      }),
      prisma.debt.aggregate({
        where: { shopId, isPaid: false },
        _sum: { remainingAmount: true }
      }),
      prisma.supplier.aggregate({
        where: { shopId },
        _sum: { balance: true }
      })
    ]);

    const cashBalance = accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + Number(a.balance), 0);
    const bankBalance = accounts.filter(a => a.type !== 'CASH').reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      todayIncome: Number(todayIncomeAgg._sum.amount) || 0,
      todayExpense: Number(todayExpenseAgg._sum.amount) || 0,
      cashBalance,
      bankBalance,
      totalReceivables: Number(totalReceivablesAgg._sum.remainingAmount) || 0,
      totalPayables: Number(totalPayablesAgg._sum.balance) || 0,
      accounts: serializePrisma(accounts)
    };
  } catch (error) {
    return { todayIncome: 0, todayExpense: 0, cashBalance: 0, bankBalance: 0, totalReceivables: 0, totalPayables: 0, accounts: [] };
  }
}

export async function getDailySession() {
  try {
    const shopId = await getShopId();
    const session = await prisma.dailySession.findFirst({
      where: { status: "OPEN", shopId },
      orderBy: { createdAt: "desc" },
      include: {
        openedBy: true,
        transactions: {
          include: { financeAccount: true }
        }
      }
    });
    return serializePrisma(session);
  } catch (error) {
    return null;
  }
}

export async function openDailySession(openingBalance: number, notes?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const existing = await prisma.dailySession.findFirst({
      where: { status: "OPEN", shopId }
    });

    if (existing) return { success: false, error: "Zaten açık bir kasa oturumu mevcut." };

    const session = await prisma.dailySession.create({
      data: {
        openingBalance,
        notes,
        status: "OPEN",
        openedById: userId,
        shopId
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
    const userId = await getUserId();

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
          closedById: userId,
          notes: notes ? `${session.notes || ''}\nKapanış Notu: ${notes}` : session.notes
        }
      });

      // 2. Apply the delta to Kasa
      const kasaLinkedTxIds = session.transactions
        .filter(t => t.financeAccountId === kasaAccount.id)
        .map(t => t.id);

      const nonKasaTxs = session.transactions.filter(
        t => !kasaLinkedTxIds.includes(t.id) && t.financeAccountId === null && t.paymentMethod !== "DEBT"
      );

      const unlinkedNet = nonKasaTxs.reduce((acc, t) => {
        const amount = Number(t.amount);
        return t.type === 'INCOME' ? acc + amount : acc - amount;
      }, 0);

      if (unlinkedNet !== 0) {
        await tx.financeAccount.update({
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
    // Check inside the try block below to get userId
    if (data.fromAccountId === data.toAccountId) {
      return { success: false, error: "Aynı hesaba transfer yapılamaz." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Decrease from source
      await tx.financeAccount.update({
        where: { id: data.fromAccountId },
        data: { balance: { decrement: data.amount } }
      });

      // 2. Increase to destination
      await tx.financeAccount.update({
        where: { id: data.toAccountId },
        data: { balance: { increment: data.amount } }
      });

      // 3. Create Transfer record (as two linked transactions)
      const shopId = await getShopId();
      const userId = await getUserId();

      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: data.amount,
          description: `Transfer: ${data.description} (Gönderen)`,
          paymentMethod: "TRANSFER",
          financeAccountId: data.fromAccountId,
          userId,
          shopId,
          category: "TRANSFER"
        }
      });

      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: data.amount,
          description: `Transfer: ${data.description} (Alan)`,
          paymentMethod: "TRANSFER",
          financeAccountId: data.toAccountId,
          userId,
          shopId,
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

    const shopId = await getShopId();
    const transactions = await prisma.transaction.findMany({
      where: {
        financeAccountId: accountId,
        shopId,
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
    const shopId = await getShopId();
    const userId = await getUserId();
    const activeSession = await prisma.dailySession.findFirst({
      where: { status: "OPEN", shopId }
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Account balance
      const account = await tx.financeAccount.update({
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
          financeAccountId: data.accountId,
          dailySessionId: activeSession?.id,
          userId,
          shopId,
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
          date: new Date(),
          shopId
        }
      });

      // 5. Allocate payment to PurchaseOrders (FIFO)
      let remainingToApply = data.amount;
      const unpaidOrders = await tx.purchaseOrder.findMany({
        where: {
          supplierId: data.supplierId,
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
          remainingAmount: { gt: 0 },
          shopId
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

export async function deleteAccount(id: string) {
  try {
    const shopId = await getShopId();

    const account = await prisma.financeAccount.findUnique({
      where: { id, shopId },
      include: {
        transactions: { take: 1 }
      }
    });

    if (!account) return { success: false, error: "Hesap bulunamadı." };

    // Prevent deleting Central Cashbox
    if (account.isDefault || account.name.toLowerCase().includes("merkez")) {
      return { success: false, error: "Merkezi Kasa silinemez." };
    }

    // Check for existing transactions
    if (account.transactions.length > 0) {
      return {
        success: false,
        error: "İşlem geçmişi olan hesaplar silinemez. Önce işlemleri başka bir hesaba taşımalı veya silmelisiniz."
      };
    }

    await prisma.financeAccount.delete({
      where: { id, shopId }
    });

    revalidatePath("/satis/kasa");
    return { success: true };
  } catch (error) {
    console.error("Account deletion error:", error);
    return { success: false, error: "Hesap silinemedi." };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const shopId = await getShopId();

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id, shopId },
        include: { financeAccount: true }
      });

      if (!transaction) throw new Error("İşlem bulunamadı.");

      // Reverse balance
      if (transaction.financeAccountId) {
        const amount = Number(transaction.amount);
        const balanceChange = transaction.type === 'INCOME' ? -amount : amount;

        await tx.financeAccount.update({
          where: { id: transaction.financeAccountId },
          data: {
            balance: { increment: balanceChange },
            availableBalance: transaction.financeAccount?.type === 'CREDIT_CARD' ? { increment: balanceChange } : undefined
          }
        });
      }

      await tx.transaction.delete({
        where: { id, shopId }
      });
    });

    revalidatePath("/satis/kasa");
    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "İşlem silinemedi." };
  }
}

export async function deleteTransactions(ids: string[]) {
  try {
    const shopId = await getShopId();

    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const transaction = await tx.transaction.findUnique({
          where: { id, shopId },
          include: { financeAccount: true }
        });

        if (!transaction) continue;

        // Reverse balance
        if (transaction.financeAccountId) {
          const amount = Number(transaction.amount);
          const balanceChange = transaction.type === 'INCOME' ? -amount : amount;

          await tx.financeAccount.update({
            where: { id: transaction.financeAccountId },
            data: {
              balance: { increment: balanceChange },
              availableBalance: transaction.financeAccount?.type === 'CREDIT_CARD' ? { increment: balanceChange } : undefined
            }
          });
        }

        await tx.transaction.delete({
          where: { id, shopId }
        });
      }
    });

    revalidatePath("/satis/kasa");
    return { success: true };
  } catch (error) {
    console.error("Bulk delete transactions error:", error);
    return { success: false, error: "İşlemler silinemedi." };
  }
}
