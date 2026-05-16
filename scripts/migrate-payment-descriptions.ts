import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        where: {
            description: {
                contains: 'Toplu Borç Tahsilatı:'
            }
        }
    });

    console.log(`Found ${transactions.length} records to update.`);

    for (const tx of transactions) {
        const dateStr = format(new Date(tx.createdAt), "dd.MM.yyyy HH:mm", { locale: tr });
        const newDescription = `Yapılan Ödeme (${dateStr})`;

        await prisma.transaction.update({
            where: { id: tx.id },
            data: { description: newDescription }
        });

        console.log(`Updated ID ${tx.id}: "${tx.description}" -> "${newDescription}"`);
    }

    console.log('Update complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
