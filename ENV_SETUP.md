# 🔧 HƯỚNG DẪN CẤU HÌNH BIẾN MÔI TRƯỜNG (Environment Variables)

## 📌 Tổng quan

Dự án này cần các biến môi trường để kết nối với:
- Telegram Bot API
- 9Proxy (để che giấu IP)
- Ngrok (cầu nối giữa Vercel và máy cá nhân)
- Supabase (tùy chọn, dùng để lưu trữ dữ liệu)

---

## 📋 DANH SÁCH BIẾN BẮT BUỘC

### 1. `BOT_TOKEN` ⚠️ BẮT BUỘC
- **Mô tả:** Token xác thực của Telegram Bot.
- **Lấy ở đâu:** Nhắn tin cho `@BotFather` trên Telegram → `/newbot` hoặc `/mybots` → Chọn bot → Lấy "API Token".
- **Định dạng:** `1234567890:ABCDEFghijklmnopqrstuvwxyz123456789`
- **Ví dụ:**
  ```
  BOT_TOKEN=1234567890:ABCDEFghijklmnopqrstuvwxyz123456789
  ```

---

### 2. `PROXY_URL` ⚠️ BẮT BUỘC (để ẩn IP Vercel)
- **Mô tả:** Địa chỉ proxy dùng để che giấu IP gốc của Vercel khi gọi Telegram API.
- **Lấy ở đâu:** Lấy từ phần mềm 9Proxy. Cổng proxy hiển thị trong danh sách proxy (ví dụ: cổng `20199`).

> ⚠️ **QUAN TRỌNG:** Vercel là máy chủ trên internet, **KHÔNG** thể kết nối vào địa chỉ nội bộ như `192.168.x.x` hay `127.0.0.1`. Bắt buộc phải dùng **Ngrok** để mở cổng này ra ngoài internet.

- **Các bước lấy đúng địa chỉ PROXY_URL:**
  1. Mở terminal trên máy tính đang chạy 9Proxy.
  2. Gõ lệnh (thay `20199` bằng cổng proxy của bạn):
     ```bash
     ngrok tcp 20199
     ```
  3. Ngrok sẽ hiện ra link dạng: `tcp://x.tcp.ngrok.io:12345`
  4. Dùng link đó làm giá trị cho `PROXY_URL`.
  
- **Định dạng:**
  ```
  # Nếu 9Proxy dùng chuẩn HTTP:
  PROXY_URL=http://x.tcp.ngrok.io:12345
  
  # Nếu 9Proxy dùng chuẩn SOCKS5:
  PROXY_URL=socks5://x.tcp.ngrok.io:12345
  
  # Nếu proxy có username/password:
  PROXY_URL=http://username:password@x.tcp.ngrok.io:12345
  ```
- **Ví dụ thực tế:**
  ```
  PROXY_URL=http://2.tcp.ngrok.io:19843
  ```

---

### 3. `PROXY_CONTROL_URL` ⚠️ BẮT BUỘC (để đổi IP từ Telegram)
- **Mô tả:** URL để gọi API quản lý cổng của 9Proxy (chức năng đổi/gỡ IP).
- **Lấy ở đâu:** Mở phần mềm 9Proxy → Vào phần **API** → Mục **"API quản lý cổng"** → **"Gỡ IP"**.
- **Ngrok sử dụng:** Domain tĩnh `rare-grouse-personally.ngrok-free.app` (hoặc domain bạn đã đăng ký).
  - Terminal máy nhà cần chạy lệnh:
    ```bash
    ngrok http --domain=rare-grouse-personally.ngrok-free.app 10101
    ```
- **Định dạng:**
  ```
  PROXY_CONTROL_URL=https://<ngrok-domain>/api/port_free?t=<loại>&ports=<cổng>
  ```
- **Ví dụ thực tế:**
  ```
  PROXY_CONTROL_URL=https://rare-grouse-personally.ngrok-free.app/api/port_free?t=2&ports=20199
  ```
  > 💡 Trong đó `t=2` là loại gỡ IP (tham khảo docs 9Proxy), `ports=20199` là cổng proxy bạn đang sử dụng.

---

## 📋 DANH SÁCH BIẾN TÙY CHỌN (Nếu dùng Supabase)

### 4. `SUPABASE_URL` (Tùy chọn)
- **Mô tả:** URL của project Supabase để lưu lịch sử giao dịch.
- **Lấy ở đâu:** Vào [supabase.com](https://supabase.com) → Chọn project → Settings → API → Project URL.
- **Ví dụ:**
  ```
  SUPABASE_URL=https://abcdefghijklmn.supabase.co
  ```
- **⚠️ Lưu ý:** Nếu **không dùng Supabase**, hãy để trống biến này hoặc điền `https://your-project-id.supabase.co` (giá trị placeholder). Hệ thống sẽ tự động bỏ qua phần Supabase.

---

### 5. `SUPABASE_ANON_KEY` (Tùy chọn)
- **Mô tả:** Khóa ẩn danh (anon key) của Supabase, dùng để truy vấn dữ liệu.
- **Lấy ở đâu:** Vào [supabase.com](https://supabase.com) → Chọn project → Settings → API → Project API Keys → `anon public`.
- **Ví dụ:**
  ```
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

---

## 📝 MẪU FILE `.env` ĐẦY ĐỦ (Dùng khi test ở máy tính)

```env
# ===========================================
# BẮT BUỘC
# ===========================================

# Token bot Telegram (lấy từ @BotFather)
BOT_TOKEN=1234567890:ABCDEFghijklmnopqrstuvwxyz123456789

# Địa chỉ proxy để che IP (phải dùng Ngrok, không dùng 192.168.x.x hoặc 127.0.0.1)
# Khi test LOCAL, có thể dùng thẳng địa chỉ nội bộ:
PROXY_URL=http://192.168.1.14:20199

# URL điều khiển 9Proxy (khi test LOCAL dùng IP nội bộ)
PROXY_CONTROL_URL=http://192.168.1.14:10101/api/port_free?t=2&ports=20199

# ===========================================
# TÙY CHỌN (Bỏ trống nếu không dùng Supabase)
# ===========================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## ☁️ CẤU HÌNH TRÊN VERCEL (Production)

Khi deploy lên Vercel, thay địa chỉ nội bộ bằng địa chỉ Ngrok công khai:

| Tên biến | Giá trị LOCAL (test) | Giá trị VERCEL (production) |
|---|---|---|
| `BOT_TOKEN` | Giống nhau | Giống nhau |
| `PROXY_URL` | `http://192.168.1.14:20199` | `http://x.tcp.ngrok.io:12345` (từ `ngrok tcp 20199`) |
| `PROXY_CONTROL_URL` | `http://192.168.1.14:10101/api/...` | `https://rare-grouse-personally.ngrok-free.app/api/...` |
| `SUPABASE_URL` | (tùy chọn) | (tùy chọn) |
| `SUPABASE_ANON_KEY` | (tùy chọn) | (tùy chọn) |

---

## 🚀 CÁC LỆNH NGROK CẦN CHẠY TRÊN MÁY TÍNH NHÀ

Máy tính ở nhà cần **2 cửa sổ terminal** chạy song song:

```bash
# Cửa sổ 1: Mở cổng API quản lý 9Proxy (cổng 10101)
ngrok http --domain=rare-grouse-personally.ngrok-free.app 10101

# Cửa sổ 2: Mở cổng Proxy ra internet (cổng 20199 hoặc cổng của bạn)
ngrok tcp 20199
```

> ⚠️ **Giữ 2 cửa sổ này mở 24/7**, nếu tắt đi Vercel sẽ không kết nối được về máy nhà.

---

## ✅ KIỂM TRA SAU KHI CẤU HÌNH

1. **Thiết lập webhook Telegram:**
   Truy cập trình duyệt vào: `https://your-vercel-domain.vercel.app/api/setup-webhooks`
   - Kết quả thành công: `{"message":"Kết quả thiết lập Webhook","details":[{"store":"env_BOT_TOKEN","success":true}]}`

2. **Kiểm tra IP Proxy:**
   Nhắn lệnh `/my_ip` cho bot trên Telegram.
   - Kết quả đúng: IP trả về là IP của Proxy (ví dụ `72.74.16.52`), **KHÔNG** phải IP của Vercel.

3. **Kiểm tra bảng điều khiển:**
   Nhắn lệnh `/menu` hoặc `/start` cho bot.
   - Kết quả đúng: Bot hiện ra các nút bấm "🔄 Đổi IP Mới", "🌐 Check IP Hiện Tại", "💻 Mở trang quản trị Web".
