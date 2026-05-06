import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createProxyAgent } from '@/lib/create-proxy-agent';
import fetch from 'node-fetch';
import { getMyIp } from '@/lib/proxy-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id') || 'default_store';

    let botToken = process.env.BOT_TOKEN;
    let agent = createProxyAgent(process.env.PROXY_URL);

    // Thử lấy từ Supabase nếu đã cấu hình URL
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (store) {
        if (store.bot_token) botToken = store.bot_token;
        if (store.proxy_url) agent = createProxyAgent(store.proxy_url);
      }
    }

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not found' }, { status: 500 });
    }

    // 1. XỬ LÝ THANH TOÁN: Bước xác nhận (Pre-checkout Query)
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

    // 2. XỬ LÝ THANH TOÁN THÀNH CÔNG
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

      return NextResponse.json({ ok: true });
    }

    // 3. XỬ LÝ KHI NGƯỜI DÙNG BẤM NÚT (CALLBACK)
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;
      const callbackQueryId = body.callback_query.id;

      const sendMsg = async (msgText: string) => {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msgText, parse_mode: 'HTML' }),
            ...(agent ? { agent } : {})
          });
        } catch (e) { console.error(e); }
      };

      try {
        if (callbackData === 'action_check_ip') {
          await sendMsg("🌐 Đang kiểm tra IP hiện tại...");
          const ip = await getMyIp(process.env.PROXY_URL);
          await sendMsg(`📍 IP hiện tại đang dùng: <b>${ip || 'Lỗi lấy IP'}</b>`);
        }
      } catch (err) {
        console.error("Callback error:", err);
      }

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQueryId }),
          ...(agent ? { agent } : {})
        });
      } catch (e) { console.error(e); }

      return NextResponse.json({ ok: true });
    }

    // 4. XỬ LÝ LỆNH TEXT TỪ NGƯỜI DÙNG (/menu, /start, /my_ip)
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      
      let replyText = '';
      let replyMarkup = undefined;
      
      try {
        if (text === '/menu' || text === '/start') {
          replyText = "🎛 <b>BẢNG ĐIỀU KHIỂN BOT</b>\nHãy chọn thao tác bên dưới:";
          replyMarkup = {
            inline_keyboard: [
              [
                { text: "🌐 Check IP Proxy", callback_data: "action_check_ip" }
              ],
              [
                { text: "💻 Mở trang Web", web_app: { url: "https://minitele-proxy.vercel.app" } }
              ]
            ]
          };
        } else if (text === '/my_ip') {
          const ip = await getMyIp(process.env.PROXY_URL);
          replyText = ip ? `📍 IP hiện tại (qua proxy): <b>${ip}</b>` : `❌ Không thể lấy IP qua proxy.`;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        replyText = `Lỗi hệ thống: ${errorMessage}`;
      }

      if (replyText) {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'HTML', reply_markup: replyMarkup }),
            ...(agent ? { agent } : {})
          });
        } catch (sendErr) {
          console.error("Lỗi khi gửi tin nhắn:", sendErr);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}