import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, error: "No files uploaded" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "transactions");

        // Ensure upload directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Ignore if directory already exists
        }

        const uploadedAttachments = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = path.extname(file.name);
            const fileName = `${uuidv4()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            const fileUrl = `/uploads/transactions/${fileName}`;

            await writeFile(filePath, buffer);

            uploadedAttachments.push({
                url: fileUrl,
                filename: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
        }

        return NextResponse.json({ success: true, attachments: uploadedAttachments });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }
}
