# 🏥 SMARTCARE - HỆ THỐNG QUẢN LÝ PHÒNG KHÁM ĐA KHOA
> **Đồ án Lập trình / Đồ án Chuyên ngành - Nhóm 9**  
> Công nghệ: **Laravel 11 (PHP 8.2+) + Inertia.js + React (TypeScript) + TailwindCSS + MySQL**

---

## 📌 1. Yêu cầu môi trường máy tính
Để chạy được dự án, máy của bạn cần cài đặt:
- **PHP >= 8.2** (Khuyên dùng XAMPP / Laragon mới nhất)
- **Composer** (bản 2.x)
- **Node.js** (khuyên dùng Node 18 hoặc 20 LTS)
- **MySQL / MariaDB**

---

## 🚀 2. Hướng dẫn Kéo Code và Chạy Dự Án (Dành cho thành viên nhóm)

### Bước 1: Kéo code mới nhất về máy
- **Nếu dùng GitHub Desktop**:
  - Mở GitHub Desktop -> Chọn repo `Nhom9-DALN`.
  - Bấm nút **Fetch origin**, sau đó bấm **Pull origin** để lấy toàn bộ code mới nhất.
- **Nếu dùng Terminal / Git Bash**:
  ```bash
  git pull origin main
  ```

### Bước 2: Cài đặt thư viện phụ thuộc (Dependencies)
Mở Terminal tại thư mục gốc dự án và chạy:
```bash
composer install
npm install
```

### Bước 3: Cấu hình file môi trường `.env`
1. Nếu chưa có file `.env`, copy từ file `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env`, kiểm tra và chỉnh lại cấu hình database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=phong_kham_rehearsal_test
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Tạo key cho ứng dụng nếu chưa có:
   ```bash
   php artisan key:generate
   ```

### Bước 4: Nạp Cơ sở dữ liệu (Database)
Có 2 cách để nạp dữ liệu chuẩn (Khuyên dùng Cách 1):

* **Cách 1 (Khuyên dùng - Nhanh & đầy đủ 100% dữ liệu mẫu, Trigger & Stored Procedure)**:
  1. Mở phpMyAdmin (hoặc Navicat / HeidiSQL / MySQL Workbench).
  2. Tạo database mới tên là: `phong_kham_rehearsal_test` (bảng mã `utf8mb4_unicode_ci`).
  3. Bấm vào database vừa tạo -> Chọn tab **Import (Nhập)** -> Chọn file:
     `database/sql/smartcare_clean_demo.sql`
  4. Bấm nút **Import / Thực hiện**.

* **Cách 2 (Dùng lệnh Laravel Artisan thuần)**:
  ```bash
  php artisan migrate:fresh
  php artisan smartcare:seed-demo --force
  ```

### Bước 5: Khởi động ứng dụng
Mở 2 cửa sổ Terminal chạy đồng thời:
- **Terminal 1 (Backend Laravel):**
  ```bash
  php artisan serve
  ```
- **Terminal 2 (Frontend React/Vite):**
  ```bash
  npm run dev
  ```
👉 Truy cập ứng dụng tại trình duyệt: **http://127.0.0.1:8000**

---

## 👥 3. Danh sách tài khoản thử nghiệm theo các vai trò
> **Mật khẩu chung cho tất cả tài khoản:** `SmartCare@2026`

| Vai trò | Tên đăng nhập | Tên người dùng | Phạm vi chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin_demo` | Quản Trị Hệ Thống | Thống kê doanh thu, quản lý tài khoản, bác sĩ, dịch vụ, kho thuốc, phân ca |
| **Lễ tân (Receptionist)** | `letan_demo` *(hoặc `letan_hoa`)* | Lễ Tân SmartCare | Tiếp đón, phát số phiếu hàng đợi (STT), theo dõi ca khám, thu ngân & hóa đơn |
| **Bác sĩ (Doctor)** | `bacsi_nam` *(hoặc `bs_hongduc`)* | BS. Nguyễn Văn Nam | Bốc số khám bệnh, ghi chẩn đoán, chỉ định Cận lâm sàng (CLS), kê đơn thuốc |
| **Cận lâm sàng (CLS)** | `cls_minh` | KTV. Trần Quang Minh | Tiếp nhận mẫu xét nghiệm/chụp X-quang, cập nhật trạng thái và trả kết quả |
| **Bệnh nhân (Patient)** | `benhnhan_an` | Nguyễn Văn An | Xem lịch hẹn, hồ sơ bệnh án, lịch sử đơn thuốc và hóa đơn viện phí |

---

## 🔄 4. Quy trình khám chữa bệnh mẫu trên hệ thống (Workflow)
1. **Lễ tân**: Đăng nhập `letan_demo` -> Vào mục *Hàng đợi* -> Tiếp đón bệnh nhân vào khoa (Hệ thống tự động cấp số phiếu theo ca, ví dụ: `NTQ-C1-001`).
2. **Bác sĩ**: Đăng nhập `bacsi_nam` -> Vào mục *Khám bệnh* -> Gọi bệnh nhân tiếp theo -> Khám, chỉ định Cận lâm sàng (Xét nghiệm máu, X-Quang,...).
3. **Kỹ thuật viên CLS**: Đăng nhập `cls_minh` -> Nhận chỉ định -> Thực hiện xét nghiệm -> Nhập kết quả và hoàn thành.
4. **Bác sĩ**: Xem lại kết quả CLS -> Đưa ra chẩn đoán cuối cùng -> Kê đơn thuốc -> Kết thúc lượt khám.
5. **Thu ngân / Lễ tân**: Vào mục *Hóa đơn & Thanh toán* -> Lập hóa đơn viện phí (Tự động trừ tiền BHYT chi trả) -> Xác nhận thanh toán tiền mặt/chuyển khoản -> In phiếu thu.

---

## ⚠️ 5. Lưu ý cho thành viên khi làm việc nhóm trên Git
- Không bao giờ commit file `.env` lên GitHub (mỗi người tự giữ file `.env` riêng trên máy).
- Khi có thay đổi về database (thêm cột, thêm bảng), hãy tạo migration mới hoặc xuất lại file backup `database/sql/smartcare_clean_demo.sql` để đồng bộ cho cả nhóm.
- Trước khi bắt đầu làm tính năng mới, luôn bấm **Fetch / Pull** trên GitHub Desktop để tránh bị xung đột code (conflict).
