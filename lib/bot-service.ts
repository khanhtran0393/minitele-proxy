import { supabase } from './supabase';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export async function sendBotMessage(storeId: string, chatId: number, text: string) {
  // 1. Lấy cấu hình Store từ Supabase
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error || !store) throw new Error('Không tìm thấy cấu hình store');

  // 2. Cấu hình Proxy Agent từ 9proxy (lấy từ database hoặc biến môi trường)
  const proxyUrl = store.proxy_url || process.env.PROXY_URL;
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  // 3. Gọi API Telegram qua Proxy
  const url = `https://api.telegram.org/bot${store.bot_token}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text }),
    agent: proxyAgent, // QUAN TRỌNG: Lệnh đi qua ống thở Proxy ở đây
  });

  return await response.json();
}