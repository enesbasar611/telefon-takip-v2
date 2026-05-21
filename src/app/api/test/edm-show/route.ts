import { NextRequest, NextResponse } from "next/server";

/**
 * EDM Fatura Görüntüleme - ViewInvoice Wrapper
 * 
 * Tarayıcıda EDM faturasını PDF/HTML olarak göster
 * 
 * Kullanım:
 * /api/test/edm-show?vkn=1234567890&ettn=SATISF202200000001
 * 
 * veya iframe ile:
 * <iframe src="/api/test/edm-show?vkn=...&ettn=..." width="100%" height="800"></iframe>
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const vkn = searchParams.get("vkn");
    const ettn = searchParams.get("ettn");
    const format = (searchParams.get("format") || "earsiv") as string;

    if (!vkn || !ettn) {
        const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EDM Fatura Görüntüleyici - Param Hatası</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .error {
            background: #fee;
            border-left: 4px solid #f44;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #c00;
        }
        .info {
            background: #ffe;
            border-left: 4px solid #ffa500;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #b8860b;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .example {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ EDM Fatura Görüntüleyici</h1>
        
        <div class="error">
            <strong>Eksik Parametreler!</strong>
            <p>Faturayı göstermek için VKN ve ETTN parametreleri gereklidir.</p>
        </div>

        <div class="info">
            <strong>Örnek Kullanım:</strong>
            <div class="example">
                <code>/api/test/edm-show?vkn=1234567890&ettn=SATISF202200000001</code>
            </div>
        </div>

        <h3>Parametreler:</h3>
        <ul>
            <li><code>vkn</code> - Faturayı düzenleyenin Vergi Kimlik Numarası (Gerekli)</li>
            <li><code>ettn</code> - Faturaya ait UUID (ETTN) (Gerekli)</li>
            <li><code>format</code> - Görüntüleme formatı: <code>earsiv</code> (varsayılan) veya diğer</li>
        </ul>

        <h3>Canlı Link Oluştur:</h3>
        <p>VKN ve ETTN'nizi aşağıdaki forma girerek direkt link oluşturabilirsiniz:</p>
        <form style="margin-top: 20px;">
            <div style="margin-bottom: 15px;">
                <label for="vkn">VKN:</label>
                <input type="text" id="vkn" placeholder="1234567890" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
            <div style="margin-bottom: 15px;">
                <label for="ettn">ETTN/UUID:</label>
                <input type="text" id="ettn" placeholder="SATISF202200000001" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
            <button type="button" onclick="openFatura()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                📄 Faturayı Aç
            </button>
        </form>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

        <h3>EDM ViewInvoice Linki:</h3>
        <p>Manuel olarak aşağıdaki format kullanarak direktmen EDM'den fatura görebilirsiniz:</p>
        <div class="example">
            <code>https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv</code>
        </div>
    </div>

    <script>
        function openFatura() {
            const vkn = document.getElementById('vkn').value.trim();
            const ettn = document.getElementById('ettn').value.trim();
            
            if (!vkn || !ettn) {
                alert('Lütfen VKN ve ETTN/UUID değerlerini girin!');
                return;
            }
            
            const url = \`/api/test/edm-show?vkn=\${encodeURIComponent(vkn)}&ettn=\${encodeURIComponent(ettn)}\`;
            window.location.href = url;
        }
    </script>
</body>
</html>
        `;
        return new NextResponse(html, {
            status: 400,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    // ViewInvoice linki oluştur
    const viewInvoiceUrl = `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${encodeURIComponent(vkn)}/${encodeURIComponent(ettn)}/${format}`;

    // HTML iframe sayfası dön
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EDM Fatura - ${ettn}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 24px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
            margin: 10px 0 0 0;
        }
        .controls {
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }
        .controls button {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .controls button:hover {
            background: #764ba2;
        }
        .controls a {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
            padding: 8px 16px;
            border: 1px solid #667eea;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .controls a:hover {
            background: #667eea;
            color: white;
        }
        .info {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 12px 16px;
            margin: 10px 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #333;
        }
        .iframe-container {
            width: 100%;
            height: calc(100vh - 200px);
            border: none;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 300px;
            font-size: 16px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 EDM Fatura Görüntüleyici</h1>
        <p>VKN: <strong>${vkn}</strong> | ETTN: <strong>${ettn}</strong></p>
    </div>

    <div class="controls">
        <button onclick="window.history.back()">← Geri Dön</button>
        <a href="${viewInvoiceUrl}" target="_blank">🔗 Yeni Sekmede Aç</a>
        <button onclick="window.print()">🖨️ Yazdır</button>
        <button onclick="downloadPdf()">⬇️ İndir</button>
    </div>

    <div class="info">
        ✅ Fatura EDM sunucularından yükleniyor... Lütfen bekleyin.
    </div>

    <div class="iframe-container">
        <iframe id="viewer" src="${viewInvoiceUrl}" title="Fatura Görüntüleyici"></iframe>
    </div>

    <script>
        function downloadPdf() {
            const link = document.createElement('a');
            link.href = '${viewInvoiceUrl}';
            link.download = 'fatura_${ettn}.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // iframe yüklendiğinde
        document.getElementById('viewer').onload = function() {
            console.log('✅ Fatura yüklendi');
        };
        
        // iframe yükleme hatası
        document.getElementById('viewer').onerror = function() {
            console.error('❌ Fatura yüklenirken hata oluştu');
        };
    </script>
</body>
</html>
    `;

    return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
