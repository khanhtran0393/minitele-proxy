import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function GET(request: Request) {
  try {
    const results = [];
    // Tự động lấy Domain của bạn (Vercel hoặc Localhost)
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const domain = `${protocol}://${host}`;

    // 1. Thử lấy từ biến môi trường BOT_TOKEN trước
    if (process.env.BOT_TOKEN) {
      const webhookUrl = `${domain}/api/webhook`;
      const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
      const agent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;
      const res = await fetch(telegramUrl, { ...(agent ? { agent } : {}) });
      const data = await res.json() as { ok: boolean, description?: string };
      results.push({
        store: 'env_BOT_TOKEN',
        success: data.ok,
        description: data.description || 'Thành công'
      });
    }

    // 2. Lấy danh sách Bot từ Database (nếu Supabase được cấu hình)
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
      const { data: stores, error } = await supabase.from('stores').select('id, bot_token, proxy_url');
      
      if (!error && stores) {
        for (const store of stores) {
          const webhookUrl = `${domain}/api/webhook?id=${store.id}`;
          const telegramUrl = `https://api.telegram.org/bot${store.bot_token}/setWebhook?url=${webhookUrl}`;

          const proxyUrl = store.proxy_url || process.env.PROXY_URL;
          const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

          const res = await fetch(telegramUrl, { ...(agent ? { agent } : {}) });
          const data = await res.json() as { ok: boolean, description?: string };

          results.push({
            store: store.id,
            success: data.ok,
            description: data.description || 'Thành công'
          });
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy BOT_TOKEN trong env hay cấu hình Supabase hợp lệ.' }, { status: 400 });
    }

    return NextResponse.json({ message: "Kết quả thiết lập Webhook", details: results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Lỗi hệ thống: ' + errorMessage }, { status: 500 });
  }
}