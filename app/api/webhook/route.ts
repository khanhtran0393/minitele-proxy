import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import { refresh9ProxyIP, getMyIp } from '@/lib/proxy-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id') || 'default_store';

    let botToken = process.env.BOT_TOKEN;
    let agent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;

    // Thử lấy từ Supabase nếu đã cấu hình URL
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (store) {
        if (store.bot_token) botToken = store.bot_token;
        if (store.proxy_url) agent = new HttpsProxyAgent(store.proxy_url);
      }
    }

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not found' }, { status: 500 });
    }

    // 2. XỬ LÝ THANH TOÁN: Bước xác nhận (Pre-checkout Query)
    if (body.pre_checkout_query) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: body.pre_checkout_query.id,
          ok: true,
        }),
        ...(agent ? { agent } : {})
      });
      return NextResponse.json({ ok: true });
    }

    // 3. XỬ LÝ THANH TOÁN THÀNH CÔNG: Ghi vào Supabase / Mock DB
    if (body.message?.successful_payment) {
      const payment = body.message.successful_payment;
      
      if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
        await supabase.from('purchases').insert({
          user_id: body.message.from.id,
          item_id: payment.invoice_payload,
          amount: payment.total_amount,
          currency: payment.currency,
          store_id: storeId,
          created_at: new Date().toISOString()
        });
      }
      // Note: Nếu không dùng Supabase thì webhook thành công sẽ được page.tsx gọi đến api/payment-success để update global.purchases

      return NextResponse.json({ ok: true });
    }

    // 4. XỬ LÝ LỆNH TỪ NGƯỜI DÙNG (/my_ip, /refresh_ip)
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      
      let replyText = '';
      
      try {
        if (text === '/my_ip') {
          const proxyUrl = (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) ? undefined : process.env.PROXY_URL;
          // We can try fetching the exact proxy used
          const ip = await getMyIp(process.env.PROXY_URL || undefined); // Use env PROXY_URL for verification
          replyText = ip ? `IP hiện tại (qua proxy): ${ip}` : `Không thể lấy IP qua proxy.`;
        } else if (text === '/refresh_ip') {
          const res = await refresh9ProxyIP();
          replyText = `Kết quả làm mới IP: \n${JSON.stringify(res, null, 2)}`;
        }
      } catch (err: any) {
        replyText = `Lỗi hệ thống khi xử lý lệnh: ${err.message}`;
      }

      if (replyText) {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: replyText }),
            ...(agent ? { agent } : {})
          });
        } catch (sendErr) {
          console.error("Lỗi khi gửi tin nhắn qua Telegram:", sendErr);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}