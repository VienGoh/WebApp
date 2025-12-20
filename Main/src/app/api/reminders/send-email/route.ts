import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    // Ambil data dari API internal
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${origin}/api/reminders/due`, { cache: 'no-store' });
    const data = await res.json();

    const { due, soon } = data;

    // Format HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Laporan Pengingat Servis Berkala</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
            .section { margin-bottom: 30px; }
            .section-title { color: #374151; font-size: 20px; font-weight: 600; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid; }
            .section-red .section-title { border-color: #ef4444; }
            .section-yellow .section-title { border-color: #f59e0b; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th { background: #f3f4f6; padding: 12px 15px; text-align: left; font-weight: 600; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
            tr:last-child td { border-bottom: none; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
            .badge-red { background: #fee2e2; color: #dc2626; }
            .badge-yellow { background: #fef3c7; color: #d97706; }
            .badge-blue { background: #dbeafe; color: #2563eb; }
            .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-item:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📅 Laporan Pengingat Servis Berkala</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="content">
              <div class="summary">
                <h3 style="margin-top: 0; color: #374151;">📊 Ringkasan Laporan</h3>
                <div class="summary-item">
                  <span>Total Kendaraan:</span>
                  <strong>${due.length + soon.length} kendaraan</strong>
                </div>
                <div class="summary-item">
                  <span>Sudah Jatuh Tempo:</span>
                  <strong style="color: #dc2626;">${due.length} kendaraan</strong>
                </div>
                <div class="summary-item">
                  <span>Segera Jatuh Tempo:</span>
                  <strong style="color: #d97706;">${soon.length} kendaraan</strong>
                </div>
              </div>

              ${due.length > 0 ? `
                <div class="section section-red">
                  <h2 class="section-title">🚨 Sudah Jatuh Tempo (${due.length})</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Plat</th>
                        <th>Pelanggan</th>
                        <th>Terakhir Servis</th>
                        <th>Hari Sejak</th>
                        <th>Interval</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${due.map((item: any) => `
                        <tr>
                          <td><strong>${item.plate}</strong></td>
                          <td>${item.customer}</td>
                          <td>${item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString('id-ID') : '-'}</td>
                          <td><span class="badge badge-red">${item.daysSince || 0} hari</span></td>
                          <td><span class="badge badge-blue">${item.intervalDays} hari</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${soon.length > 0 ? `
                <div class="section section-yellow">
                  <h2 class="section-title">⚠️ Segera Jatuh Tempo (${soon.length})</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Plat</th>
                        <th>Pelanggan</th>
                        <th>Terakhir Servis</th>
                        <th>Hari Sejak</th>
                        <th>Interval</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${soon.map((item: any) => `
                        <tr>
                          <td><strong>${item.plate}</strong></td>
                          <td>${item.customer}</td>
                          <td>${item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString('id-ID') : '-'}</td>
                          <td><span class="badge badge-yellow">${item.daysSince || 0} hari</span></td>
                          <td><span class="badge badge-blue">${item.intervalDays} hari</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <div class="footer">
                <p>Laporan ini dibuat otomatis oleh Sistem Pengingat Servis Kendaraan</p>
                <p>© ${new Date().getFullYear()} - Semua hak dilindungi</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Konfigurasi email
    // Ganti dengan email penerima yang sesuai
    const recipientEmail = process.env.EMAIL_RECIPIENT || 'admin@example.com';

    // Kirim email
    await sendEmail({
      to: recipientEmail,
      subject: `📅 Laporan Pengingat Servis Berkala - ${new Date().toLocaleDateString('id-ID')}`,
      html: htmlContent,
      cc: process.env.EMAIL_CC?.split(','),
      bcc: process.env.EMAIL_BCC?.split(',')
    });

    return NextResponse.json({
      success: true,
      message: 'Email berhasil dikirim',
      data: {
        totalDue: due.length,
        totalSoon: soon.length,
        recipient: recipientEmail
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Gagal mengirim email',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}