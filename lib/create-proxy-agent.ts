import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * Tự động tạo đúng loại Proxy Agent dựa trên protocol của PROXY_URL.
 * Hỗ trợ: http://, https://, socks5://, socks4://
 *
 * @param proxyUrl - URL proxy, ví dụ: socks5://user:pass@host:port
 * @returns Agent tương thích để dùng với node-fetch
 */
export function createProxyAgent(proxyUrl: string | undefined) {
  if (!proxyUrl) return undefined;

  const protocol = proxyUrl.toLowerCase();

  if (protocol.startsWith('socks5://') || protocol.startsWith('socks4://') || protocol.startsWith('socks://')) {
    return new SocksProxyAgent(proxyUrl);
  }

  // Mặc định dùng HttpsProxyAgent cho http:// và https://
  return new HttpsProxyAgent(proxyUrl);
}
