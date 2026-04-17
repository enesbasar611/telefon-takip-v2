import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export async function sendApprovalCodeToAdmin(requesterEmail: string, code: string) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.error("ADMIN_EMAIL is not set in .env");
        return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);

    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; padding: 0; background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; }
      .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
      .header { background: linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%); padding: 32px 40px; text-align: center; }
      .header h1 { color: #ffffff; font-size: 18px; font-weight: 600; margin: 0; letter-spacing: -0.3px; }
      .header p { color: rgba(255,255,255,0.6); font-size: 12px; margin: 6px 0 0; letter-spacing: 0.5px; text-transform: uppercase; }
      .body { padding: 40px; }
      .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #86868b; font-weight: 600; margin-bottom: 6px; }
      .value { font-size: 15px; color: #1d1d1f; font-weight: 500; margin-bottom: 24px; word-break: break-all; }
      .code-box { background: #f5f5f7; border-radius: 16px; padding: 28px; text-align: center; margin: 8px 0 24px; }
      .code { font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #0071e3; font-family: 'SF Mono', 'Menlo', monospace; }
      .footer { padding: 20px 40px; border-top: 1px solid #f0f0f0; text-align: center; }
      .footer p { font-size: 11px; color: #86868b; margin: 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔐 Yeni Erişim Talebi</h1>
        <p>Onay Bekliyor</p>
      </div>
      <div class="body">
        <div class="label">Talep Eden E-posta</div>
        <div class="value">${requesterEmail}</div>
        <div class="label">Onay Kodu</div>
        <div class="code-box">
          <div class="code">${code}</div>
        </div>
        <div style="font-size: 13px; color: #86868b; line-height: 1.6;">
          Bu kodu ilgili kullanıcıya ileterek sisteme erişim sağlamasını onaylayabilirsiniz. 
          Eğer bu talebi tanımıyorsanız, herhangi bir işlem yapmanıza gerek yoktur.
        </div>
      </div>
      <div class="footer">
        <p>Bu otomatik bir bildirimdir · Telefon Takip Sistemi</p>
      </div>
    </div>
  </body>
  </html>
  `;

    try {
        await transporter.sendMail({
            from: `"Sistem Yönetimi" <${process.env.EMAIL_SERVER_USER}>`,
            to: adminEmail,
            subject: `⚠️ New Access Request - #${randomId}`,
            html,
        });
        console.log(`Approval code sent to admin for: ${requesterEmail}`);
    } catch (error) {
        console.error("Failed to send approval email:", error);
    }
}
