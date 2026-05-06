import fetch from 'node-fetch';
import { createProxyAgent } from './create-proxy-agent';

/**
 * Lấy IP hiện tại thông qua Proxy để xác minh (Tránh rò rỉ IP)
 */
export async function getMyIp(proxyRaw?: string) {
  try {
    const agent = createProxyAgent(proxyRaw);
    const response = await fetch('https://api.ipify.org?format=json', {
      ...(agent ? { agent } : {})
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json() as { ip: string };
    return data.ip;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Lỗi lấy IP qua Proxy:", errorMessage);
    return null;
  }
}
