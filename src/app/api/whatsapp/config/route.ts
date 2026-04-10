import { NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp/whatsapp-manager';
import { getShopId } from '@/lib/auth';

export async function GET() {
    try {
        const shopId = await getShopId().catch(() => null);
        if (!shopId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const statusData = await whatsappManager.getStatus(shopId);
        return NextResponse.json(statusData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const shopId = await getShopId().catch(() => null);
        if (!shopId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { action } = await req.json();

        if (action === 'initialize') {
            whatsappManager.initialize(shopId);
            return NextResponse.json({ message: 'Initializing...' });
        }

        if (action === 'logout') {
            await whatsappManager.logout(shopId);
            return NextResponse.json({ message: 'Logging out...' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
