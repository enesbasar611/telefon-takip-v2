import * as fs from 'fs';

const file = 'src/components/finance/veresiye-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// The errors reported by tsc are:
// "debt =>" at line 394 -> "(debt: any) =>"
content = content.replace(/debts\.forEach\(debt => \{/g, 'debts.forEach((debt: any) => {');

// "acc =>" inside setPaymentMethod / filter / map at lines 1679, 1715, 1745 -> "(acc: any) =>"
content = content.replace(/acc =>/g, '(acc: any) =>');

// "rates={rates}" in <AddDebtModal and <DebtReceiptModal
// Wait, rates: rates as any doesn't work for props. It should be "rates={rates as any}"
content = content.replace(/rates=\{rates\}/g, 'rates={rates as any}');

// "d =>" in filters -> "(d: any) =>"
content = content.replace(/d =>/g, '(d: any) =>');

// "sum =>" ? No, "(sum, d) =>" -> "(sum: number, d: any) =>"
content = content.replace(/\(sum, d\) =>/g, '(sum: number, d: any) =>');

// Wait, the debt at 390 "Parameter 'debt' implicitly has an 'any' type."
// That was "debts.forEach(debt => {"

fs.writeFileSync(file, content, 'utf8');
console.log('Patched');
