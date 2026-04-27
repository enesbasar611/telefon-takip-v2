const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const os = require('os');

function getLocalIps() {
    const ips = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

function getPreferredIp() {
    const ips = getLocalIps();
    // 192.168 veya 10. ile başlayanları önceliklendir (Genel ev/ofis ağları)
    const preferred = ips.find(ip => ip.startsWith('192.168.') || ip.startsWith('10.'));
    return preferred || ips[0] || 'localhost';
}

const dev = process.env.NODE_ENV !== 'production';
// -H 0.0.0.0 parametresini komut satırından alalım veya varsayılan olarak '0.0.0.0' kullanalım.
const hostname = process.argv.includes('-H') ? process.argv[process.argv.indexOf('-H') + 1] : '0.0.0.0';
const port = process.env.PORT || 5000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            const { pathname } = parsedUrl;

            // Debug log
            if (!pathname.startsWith('/_next')) {
                console.log(`[HTTP] ${req.method} ${pathname}`);
            }

            // Discovery endpoint for mobile pairing
            if (pathname === '/api/network-info' || pathname === '/api/network-info/') {
                console.log('[API] Serving network info');
                const ip = getPreferredIp();
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers['host'] || `${ip}:${port}`;
                const origin = `${protocol}://${host}`;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    ip,
                    port,
                    origin,
                    allIps: getLocalIps()
                }));
                return;
            }

            handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on('connection', (socket) => {
        console.log('A client connected:', socket.id);

        // Telefon veya masaüstünün odaya katılması
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Telefondan taranan barkod
        socket.on('barcode_scanned', ({ roomId, barcode }) => {
            console.log(`Barcode scanned in room ${roomId}: ${barcode} (by ${socket.id})`);
            io.to(roomId).emit('process_barcode', {
                barcode,
                deviceId: socket.id.substring(0, 4).toUpperCase()
            });
        });

        socket.on('mobile_scanner_ready', ({ roomId }) => {
            if (!roomId) return;
            console.log(`Mobile scanner linked in room ${roomId}: ${socket.id}`);
            io.to(roomId).emit('mobile_scanner_linked', {
                deviceId: socket.id.substring(0, 4).toUpperCase()
            });
        });

        // PC'den telefona ekleme başarılı sinyali
        socket.on('scan_success', ({ roomId, productName, deviceId }) => {
            io.to(roomId).emit('mobile_feedback', { success: true, productName, deviceId });
        });

        // PC'den telefona hata sinyali
        socket.on('scan_error', ({ roomId, message, deviceId }) => {
            io.to(roomId).emit('mobile_feedback', { success: false, message, deviceId });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    httpServer
        .once('error', (err) => {
            console.error('Server error:', err);
            process.exit(1);
        })
        .listen(port, hostname, () => {
            const ips = getLocalIps();
            const preferred = getPreferredIp();
            console.log(`\n> Takip V2 Sunucusu Hazır:`);
            console.log(`  - Yerel:   http://localhost:${port}`);
            if (preferred !== 'localhost') {
                console.log(`  - Ağ (IP): http://${preferred}:${port} (QR buna göre oluşturulur)`);
            }
            if (ips.length > 1) {
                console.log(`  - Diğer IP'ler: ${ips.join(', ')}`);
            }
            console.log(`> Socket.io motoru aktif yol: /socket.io\n`);
        });
});
