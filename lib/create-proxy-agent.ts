import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * Phân tích chuỗi proxy từ nhiều định dạng khác nhau thành URL chuẩn.
 *
 * Hỗ trợ các định dạng đầu vào:
 *
 * 1. URL chuẩn (đã có protocol):
 *    socks5://user:pass@host:port
 *    http://user:pass@host:port
 *
 * 2. Định dạng 6 trường (name:type:host:port:login:pass) - phổ biến với proxy nhà cung cấp:
 *    connecticut:socks5:niceproxy.io:17521:myuser:mypass
 *
 * 3. Định dạng 4 trường (host:port:login:pass) - mặc định dùng http:
 *    niceproxy.io:17521:myuser:mypass
 *
 * 4. Định dạng 2 trường (host:port) - không xác thực:
 *    niceproxy.io:17521
 */
export function parseProxyUrl(raw: string | undefined): string | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const trimmed = raw.trim();

  // Nếu đã là URL chuẩn (có protocol://)
  if (/^(https?|socks[45]?):\/\//i.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(':');

  // Định dạng 6 trường: name:type:host:port:login:pass
  if (parts.length === 6) {
    const [, type, host, port, login, pass] = parts;
    const protocol = type.toLowerCase().startsWith('socks') ? type.toLowerCase() : 'http';
    return `${protocol}://${encodeURIComponent(login)}:${encodeURIComponent(pass)}@${host}:${port}`;
  }

  // Định dạng 4 trường: host:port:login:pass
  if (parts.length === 4) {
    const [host, port, login, pass] = parts;
    return `http://${encodeURIComponent(login)}:${encodeURIComponent(pass)}@${host}:${port}`;
  }

  // Định dạng 2 trường: host:port (không có xác thực)
  if (parts.length === 2) {
    const [host, port] = parts;
    return `http://${host}:${port}`;
  }

  // Không nhận ra định dạng, trả về nguyên gốc để thử
  console.warn('[createProxyAgent] Không nhận ra định dạng proxy URL:', trimmed);
  return trimmed;
}

/**
 * Tự động tạo đúng loại Proxy Agent dựa trên protocol của URL.
 * Hỗ trợ: http://, https://, socks5://, socks4://
 * Tự động phân tích nhiều định dạng chuỗi proxy khác nhau.
 *
 * @param raw - Chuỗi proxy ở bất kỳ định dạng nào được hỗ trợ
 * @returns Agent tương thích để dùng với node-fetch
 */
export function createProxyAgent(raw: string | undefined) {
  const proxyUrl = parseProxyUrl(raw);
  if (!proxyUrl) return undefined;

  const lowerUrl = proxyUrl.toLowerCase();

  if (lowerUrl.startsWith('socks5://') || lowerUrl.startsWith('socks4://') || lowerUrl.startsWith('socks://')) {
    return new SocksProxyAgent(proxyUrl);
  }

  return new HttpsProxyAgent(proxyUrl);
}
