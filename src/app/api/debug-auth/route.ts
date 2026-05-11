import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            role: true,
            shopId: true
        }
    });

    return NextResponse.json({
        session: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            shopId: session.user.shopId
        },
        dbUser
    });
}
