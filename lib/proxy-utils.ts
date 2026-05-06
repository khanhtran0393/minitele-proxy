import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Giao tiếp với 9Proxy qua Ngrok (hoặc Local) để làm mới/quản lý IP
 */
export async function refresh9ProxyIP() {
  const controlUrl = process.env.PROXY_CONTROL_URL;
  if (!controlUrl) return { error: "Thiếu cấu hình PROXY_CONTROL_URL" };

  try {
    const response = await fetch(controlUrl);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data; // Dữ liệu trả về từ 9Proxy
  } catch (error: any) {
    console.error("Lỗi giao tiếp với máy chủ Ngrok/9Proxy:", error.message);
    return { error: error.message };
  }
}

/**
 * Lấy IP hiện tại thông qua Proxy để xác minh (Tránh rò rỉ IP)
 */
export async function getMyIp(proxyUrl?: string) {
  try {
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    const response = await fetch('https://api.ipify.org?format=json', {
      ...(agent ? { agent } : {})
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json() as { ip: string };
    return data.ip;
  } catch (error: any) {
    console.error("Lỗi lấy IP qua Proxy:", error.message);
    return null;
  }
}
