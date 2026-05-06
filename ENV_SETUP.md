# 🔧 HƯỚNG DẪN CẤU HÌNH BIẾN MÔI TRƯỜNG (Environment Variables)

## 📋 DANH SÁCH BIẾN CẦN THIẾT

| Tên biến | Bắt buộc | Mô tả |
|---|---|---|
| `BOT_TOKEN` | ✅ | Token xác thực Telegram Bot |
| `PROXY_URL` | ✅ | Địa chỉ proxy để che IP |
| `SUPABASE_URL` | ❌ | URL Supabase (chỉ cần nếu dùng database) |
| `SUPABASE_ANON_KEY` | ❌ | Khóa Supabase (chỉ cần nếu dùng database) |

---

## 1. `BOT_TOKEN` ⚠️ BẮT BUỘC

**Lấy ở đâu:** Nhắn tin cho `@BotFather` trên Telegram → `/mybots` → Chọn bot → **API Token**

```env
BOT_TOKEN=1234567890:ABCDEFghijklmnopqrstuvwxyz123456789
```

---

## 2. `PROXY_URL` ⚠️ BẮT BUỘC

Hệ thống **tự động nhận diện và phân tích** chuỗi proxy từ nhiều định dạng. Bạn chỉ cần copy nguyên chuỗi từ nhà cung cấp proxy và dán vào.

### ✅ Định dạng 1: Chuỗi 6 trường (phổ biến nhất với các nhà cung cấp proxy)

```
Format:  name:type:host:port:login:pass
```

```env
PROXY_URL=connecticut:socks5:niceproxy.io:17521:skytran-country-US:Tedoem123
```

> Hệ thống sẽ tự động chuyển thành `socks5://skytran-country-US:Thedoem123@niceproxy.io:17521`

---

### ✅ Định dạng 2: Chuỗi 4 trường

```
Format:  host:port:login:pass
```

```env
PROXY_URL=niceproxy.io:17521:myusername:mypassword
```

> Hệ thống sẽ tự động chuyển thành `http://myusername:mypassword@niceproxy.io:17521`

---

### ✅ Định dạng 3: URL chuẩn (nếu bạn muốn kiểm soát chính xác protocol)

```env
# SOCKS5 proxy (khuyến nghị cho Telegram):
PROXY_URL=socks5://username:password@niceproxy.io:17521

# HTTP proxy:
PROXY_URL=http://username:password@proxyhost.com:8080

# Proxy không cần xác thực:
PROXY_URL=http://proxyhost.com:8080
```

---

### ✅ Định dạng 4: Chỉ host:port (không có xác thực)

```env
PROXY_URL=proxyhost.com:8080
```

---

### 🔍 Bảng chọn loại proxy theo type

| Giá trị `type` trong chuỗi 6 trường | Protocol sử dụng |
|---|---|
| `socks5` | SOCKS5 (khuyến nghị) |
| `socks4` | SOCKS4 |
| `http` | HTTP |
| `https` | HTTPS |

---

## 3. `SUPABASE_URL` (Tùy chọn)

Chỉ cần thiết lập nếu bạn dùng Supabase để lưu lịch sử giao dịch.

**Lấy ở đâu:** [supabase.com](https://supabase.com) → Chọn project → Settings → API → **Project URL**

```env
SUPABASE_URL=https://abcdefghijklmn.supabase.co
```

> **Nếu KHÔNG dùng Supabase:** Để trống hoặc không tạo biến này. Hệ thống sẽ tự bỏ qua.

---

## 4. `SUPABASE_ANON_KEY` (Tùy chọn)

Chỉ cần nếu đã điền `SUPABASE_URL` ở trên.

**Lấy ở đâu:** Supabase → Settings → API → **Project API Keys** → `anon public`

```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 MẪU FILE `.env` ĐẦY ĐỦ

```env
# ==========================================
# BẮT BUỘC
# ==========================================

# Token bot Telegram
BOT_TOKEN=1234567890:ABCDEFghijklmnopqrstuvwxyz123456789

# Proxy - Chọn 1 trong các cách viết sau đây:

# Cách 1: Chuỗi 6 trường từ nhà cung cấp (copy nguyên từ dashboard)
PROXY_URL=connecticut:socks5:niceproxy.io:17521:myuser:mypassword

# Cách 2: URL chuẩn SOCKS5
# PROXY_URL=socks5://myuser:mypassword@niceproxy.io:17521

# Cách 3: URL chuẩn HTTP
# PROXY_URL=http://myuser:mypassword@proxyhost.com:8080

# ==========================================
# TÙY CHỌN (Xóa hoặc để trống nếu không dùng Supabase)
# ==========================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## ☁️ CẤU HÌNH TRÊN VERCEL

Vào **Vercel Dashboard** → Chọn project → **Settings** → **Environment Variables** → Thêm từng biến:

| Tên biến (Key) | Giá trị (Value) |
|---|---|
| `BOT_TOKEN` | Token lấy từ @BotFather |
| `PROXY_URL` | Chuỗi proxy ở bất kỳ định dạng nào trong mục 2 |
| `SUPABASE_URL` | *(để trống nếu không dùng)* |
| `SUPABASE_ANON_KEY` | *(để trống nếu không dùng)* |

> ⚠️ Sau khi thêm/sửa biến môi trường, bắt buộc phải bấm **Redeploy** để Vercel tải lại cấu hình mới.

---

## ✅ KIỂM TRA SAU KHI CẤU HÌNH

### Bước 1: Đăng ký Webhook với Telegram
Mở trình duyệt, truy cập:
```
https://your-vercel-domain.vercel.app/api/setup-webhooks
```

Kết quả thành công:
```json
{
  "message": "Kết quả thiết lập Webhook",
  "details": [{ "store": "env_BOT_TOKEN", "success": true }]
}
```

### Bước 2: Kiểm tra IP Proxy
Nhắn lệnh `/my_ip` cho bot trên Telegram.

- ✅ **Đúng:** IP trả về là IP của Proxy (ví dụ `72.74.16.52`)
- ❌ **Sai:** IP trả về là IP của Vercel (dải `76.76.21.x`)

### Bước 3: Mở Bảng điều khiển
Nhắn lệnh `/menu` hoặc `/start` cho bot.

- ✅ **Đúng:** Bot hiện ra các nút bấm "🌐 Check IP Proxy" và "💻 Mở trang Web"
