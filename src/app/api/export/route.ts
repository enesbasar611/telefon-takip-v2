import { NextResponse } from "next/server";
import { getExportData, ExportCategory } from "@/lib/actions/data-management-actions";
import * as xlsx from "xlsx";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const format = url.searchParams.get("format") || "json";
        const categoriesParam = url.searchParams.get("categories");

        let categories: ExportCategory[] = [];
        if (categoriesParam) {
            categories = categoriesParam.split(",") as ExportCategory[];
        } else {
            // Default to all
            categories = [
                "customers", "products", "categories", "services", "sales", "transactions",
                "suppliers", "agenda", "debts", "financeAccounts", "receiptSettings", "reminders",
                "saleItems", "serviceUsedParts", "inventoryMovements", "supplierTransactions",
                "serviceLogs", "returnTickets", "settings"
            ];
        }

        const data = await getExportData(categories);

        if (format === "csv" || format === "xlsx") {
            // Create Excel workbook
            const wb = xlsx.utils.book_new();

            // Add a sheet for each category
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value) && value.length > 0) {
                    const ws = xlsx.utils.json_to_sheet(value);
                    xlsx.utils.book_append_sheet(wb, ws, key);
                }
            }

            const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Disposition": `attachment; filename="basar-teknik-yedek.${format}"`,
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            });
        }

        // Return JSON
        return new NextResponse(JSON.stringify(data, null, 2), {
            headers: {
                "Content-Disposition": `attachment; filename="basar-teknik-yedek.json"`,
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("[EXPORT API ERROR]", error);
        return NextResponse.json({ error: error.message || "Bilinmeyen bir hata oluştu" }, { status: 500 });
    }
}
