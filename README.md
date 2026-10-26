# Blade Rush: Shadow Arena
Game chặt chém 2D (HTML5 Canvas, JS thuần, PWA offline). Không dùng thư viện/CDN.

## Cấu trúc
index.html · style.css · game.js · manifest.json · service-worker.js · assets/icon-*.png

## Chạy trên máy tính
Mở `index.html` (chơi được ngay). Để thử PWA/offline cần HTTPS hoặc localhost: `python3 -m http.server 8000` rồi vào http://localhost:8000

## Đưa lên GitHub Pages
1. Tạo repo mới, upload toàn bộ file (giữ nguyên thư mục `assets`).
2. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, thư mục `/ (root)` → Save.
3. Đợi ~1 phút, mở `https://<tên>.github.io/<repo>/`.

## iPhone (Safari)
1. Mở link bằng Safari, đợi game tải xong (cần Internet lần đầu).
2. Nút Chia sẻ → **Thêm vào Màn hình chính**.
3. Mở app từ Màn hình chính một lần khi còn mạng, rồi tắt mạng để thử offline.
4. Tay cầm: ghép Bluetooth trong Cài đặt iOS, mở game, bấm một nút để nhận diện; sẽ có thông báo kết nối.

## Điều khiển
Tay cầm: Stick/D-pad di chuyển · A chém · B né · X xoáy · Start tạm dừng.
Bàn phím: WASD/mũi tên · J chém · K né · L xoáy · P tạm dừng. Cảm ứng: joystick trái + 3 nút phải.

## Kỹ năng
Xoáy (X/L) diện rộng · Né (B/K) · Phi kiếm (Y/U): 3 kiếm xuyên, hồi 4s · Khiên (R1/L1/O): bất tử 3s + hồi 15 máu, hồi 12s.
10 cảnh chọn tự do (PLAY → Chọn cảnh). Mỗi cảnh 3 đợt; cảnh 2/4/6/8/10 thêm đợt trùm với kỹ năng riêng: Xương Vương (triệu hồi, lao), Bóng Ma (dịch chuyển, vòng đạn), Hỏa Thần (quạt cầu lửa, đập đất), Băng Hậu (xoắn ốc băng, vòng đạn), Ma Vương (tổng hợp).

## Cập nhật phiên bản
Khi sửa code, đổi `CACHE='blade-rush-v1'` trong service-worker.js (v2, v3…) để xóa cache cũ.

## Cần kiểm thử trên iPhone thật
Gamepad API theo từng iOS/tay cầm (mapping nút), âm thanh sau lần chạm đầu, safe area, hành vi PWA fullscreen, offline sau khi cài, hiệu năng/nhiệt. Bản này chưa được kiểm thử trên thiết bị thật.
