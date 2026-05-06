import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/app/data/items';
import { supabase } from '@/lib/supabase';
import { createProxyAgent } from '@/lib/create-proxy-agent';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId } = body;

    // Lấy storeId từ URL để biết là shop nào đang gọi
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('id') || 'default_store';

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'Missing userId or itemId' }, { status: 400 });
    }

    const item = getItemById(itemId);
    if (!item) return NextResponse.json({ error: 'Invalid item' }, { status: 400 });

    // 1. Lấy cấu hình Bot/Proxy từ Supabase (nếu có cấu hình) hoặc từ biến môi trường
    let botToken = process.env.BOT_TOKEN;
    let agent = createProxyAgent(process.env.PROXY_URL);

    // Thử lấy từ Supabase nếu đã cấu hình URL
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project-id')) {
      const { data: store } = await supabase
        .from('stores')
        .select('bot_token, proxy_url')
        .eq('id', storeId)
        .single();

      if (store) {
        if (store.bot_token) botToken = store.bot_token;
        if (store.proxy_url) agent = createProxyAgent(store.proxy_url);
      }
    }

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not found. Please set BOT_TOKEN in .env or configure Supabase stores.' }, { status: 500 });
    }

    // 2. Tạo Invoice Link trực tiếp từ Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.name,
        description: item.description,
        payload: itemId,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: item.name, amount: item.price }],
      }),
      ...(agent ? { agent } : {})
    });

    const data = await response.json() as { ok: boolean, result?: string, description?: string };

    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return NextResponse.json({ error: `Telegram Error: ${data.description || 'Unknown error'}` }, { status: 500 });
    }

    // Trả về link thanh toán cho khách, không lưu bất cứ thứ gì vào DB
    return NextResponse.json({ invoiceLink: data.result });

  } catch (error: unknown) {
    console.error('Catch Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed: ${errorMessage}` }, { status: 500 });
  }
}