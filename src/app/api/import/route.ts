import { NextResponse } from "next/server";
import { importData } from "@/lib/actions/data-management-actions";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const _categories = formData.get("categories") as string;

        if (!file) {
            return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        let parsedData: Record<string, any[]> = {};

        if (file.name.endsWith(".json")) {
            const text = new TextDecoder("utf-8").decode(buffer);
            parsedData = JSON.parse(text);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".csv")) {
            const wb = xlsx.read(buffer, { type: "buffer" });

            for (const sheetName of wb.SheetNames) {
                const sheet = wb.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet);
                parsedData[sheetName.toLowerCase()] = data as any[];
            }
        } else {
            return NextResponse.json({ error: "Desteklenmeyen dosya formatı." }, { status: 400 });
        }

        const result = await importData(parsedData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, stats: result.stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
