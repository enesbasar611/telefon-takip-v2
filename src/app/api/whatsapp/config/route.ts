import { NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp/whatsapp-manager';

export async function GET() {
    try {
        const { status, qr, error } = whatsappManager.getStatus();
        return NextResponse.json({ status, qr, error });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        if (action === 'initialize') {
            whatsappManager.initialize(); // Don't await here as it might take time
            return NextResponse.json({ message: 'Initializing...' });
        }

        if (action === 'logout') {
            await whatsappManager.logout();
            return NextResponse.json({ message: 'Logging out...' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
