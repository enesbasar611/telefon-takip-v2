import { NextResponse } from 'next/server';
import os from 'os';

export async function GET(request: Request) {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        const netInterface = interfaces[name];
        if (netInterface) {
            for (const iface of netInterface) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    ips.push(iface.address);
                }
            }
        }
    }

    // Traefik/Proxy arkasındayken Host bilgisini al
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    // Preferred selection
    const preferred = ips.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.')) || ips[0] || 'localhost';

    return NextResponse.json({
        ip: preferred,
        origin: origin,
        allIps: ips
    });
}
