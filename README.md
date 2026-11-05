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
| **Quản trị viên (Admin)** | `admin_demo` | Quản Trị Hệ Thống | Thiết lập danh mục, phân quyền tài khoản, phân ca trực, chấm công & bảng lương, thống kê doanh thu |
| **Lễ tân (Receptionist)** | `letan_demo` *(hoặc `letan_hoa`)* | Lễ Tân SmartCare | Tiếp đón, phát số phiếu hàng đợi (STT), theo dõi ca khám, thu ngân & hóa đơn |
| **Bác sĩ (Doctor)** | `bacsi_nam` *(hoặc `bs_hongduc`)* | BS. Nguyễn Văn Nam | Bốc số khám bệnh, ghi chẩn đoán, chỉ định Cận lâm sàng (CLS), kê đơn thuốc |
| **Cận lâm sàng (CLS)** | `cls_minh` | KTV. Trần Quang Minh | Tiếp nhận mẫu xét nghiệm/chụp X-quang, cập nhật trạng thái và trả kết quả |
| **Bệnh nhân (Patient)** | `benhnhan_an` | Nguyễn Văn An | Xem lịch hẹn, hồ sơ bệnh án, lịch sử đơn thuốc và hóa đơn viện phí |

---

## 🔄 4. Quy trình nghiệp vụ cốt lõi trên hệ thống

### A. Quy trình Quản trị & Thiết lập Vận hành (Dành cho Quản trị viên - Admin)
1. **Thiết lập danh mục cơ sở**:
   - Quản lý **Chuyên khoa**: Cập nhật thông tin các chuyên khoa khám chữa bệnh.
   - Quản lý **Dịch vụ**: Định cấu hình giá niêm yết, phân loại (Khám bệnh, Xét nghiệm, Chẩn đoán hình ảnh) và điều kiện BHYT.
   - Quản lý **Kho Dược / Thuốc**: Quản lý danh mục thuốc, hoạt chất, hàm lượng, hạn dùng, đơn giá bán và tỷ lệ hỗ trợ BHYT.
2. **Quản lý Tài khoản & Nhân sự**:
   - Tạo mới/khóa tài khoản, phân quyền 5 vai trò trong hệ thống.
   - Hồ sơ Bác sĩ: Gán bác sĩ vào đúng Chuyên khoa và chỉ định phòng khám làm việc.
3. **Quản lý Lịch làm việc & Phân ca**:
   - Xếp lịch trực tuần linh hoạt theo từng phòng khám và từng ca làm việc:
     - **Ca 1 (Sáng)**: 07:00 - 12:00
     - **Ca 2 (Chiều)**: 13:00 - 18:00
4. **Quản trị Nhân sự Nâng cao (Chấm công - Đơn từ - Bảng lương)**:
   - Giám sát tình trạng check-in/check-out ca trực của toàn bộ nhân viên y tế.
   - Tiếp nhận và phê duyệt các đơn từ nhân sự (xin nghỉ phép, xin đổi ca trực giữa đồng nghiệp).
   - Tự động tổng hợp dữ liệu công chuẩn để chốt Bảng lương hàng tháng.
5. **Giám sát & Báo cáo Doanh thu**:
   - Dashboard phân tích thời gian thực: Lưu lượng khám trong ngày, số ca đang chờ, luồng vận hành cận lâm sàng.
   - Giám sát toàn bộ lịch sử hóa đơn thanh toán và xuất báo cáo tài chính/doanh thu.

---

### B. Quy trình Khám chữa bệnh liên thông (Lâm sàng & Tiếp đón)
1. **Bắt đầu ca trực (Staff Check-in)**:
   - Đầu ca làm việc, Bác sĩ (`bacsi_nam`) và Kỹ thuật viên CLS (`cls_minh`) đăng nhập vào hệ thống -> Bấm **Check-in / Điểm danh vào ca** tại thẻ điểm danh nhanh trên giao diện.
   - Hệ thống tự động đối soát với lịch trực tuần và chuyển trạng thái nhân sự sang *Đang trong ca trực*, kích hoạt phòng khám sẵn sàng đón tiếp bệnh nhân.
2. **Lễ tân tiếp đón & Phát số hàng đợi**:
   - Bệnh nhân đến khám -> Lễ tân (`letan_demo`) kiểm tra thông tin hành chính, thẻ BHYT và chuyên khoa cần khám.
   - Hệ thống tự động cấp số phiếu hàng đợi chuẩn hóa theo ca khám (ví dụ: `NTQ-C1-001` - Nội tổng quát, Ca 1, Số 001) và tự động xếp vào hàng đợi phòng khám.
3. **Bác sĩ khám bệnh & Chỉ định cận lâm sàng**:
   - Bác sĩ vào giao diện phòng khám -> Bấm **Gọi số tiếp theo** từ danh sách hàng đợi thời gian thực.
   - Khám lâm sàng, ghi nhận triệu chứng, tiền sử bệnh -> Chỉ định các dịch vụ Cận lâm sàng (Xét nghiệm máu, X-quang, Siêu âm...) nếu cần chẩn đoán chuyên sâu.
4. **Kỹ thuật viên thực hiện Cận lâm sàng (CLS)**:
   - Kỹ thuật viên CLS (`cls_minh`) theo dõi danh sách chờ thực hiện -> Tiếp nhận bệnh nhân, lấy mẫu / chụp chiếu.
   - Cập nhật trạng thái *Đang thực hiện* -> Nhập kết quả đo đạc, tải hình ảnh/kết luận -> Bấm *Hoàn tất trả kết quả*.
5. **Bác sĩ kết luận bệnh án & Kê đơn thuốc**:
   - Bác sĩ xem kết quả xét nghiệm/hình ảnh CLS được đồng bộ tức thì trên màn hình khám -> Đưa ra chẩn đoán xác định (mã bệnh ICD-10).
   - Kê đơn thuốc từ Kho dược trực tuyến (hệ thống tự tính liều lượng, đơn giá và tỷ lệ chi trả của BHYT) -> Bấm *Kết thúc lượt khám*.
6. **Thu ngân xuất hóa đơn & Thu viện phí**:
   - Lễ tân / Thu ngân mở hồ sơ lượt khám tại mục *Hóa đơn & Thanh toán*.
   - Hệ thống tự động tổng hợp viện phí khám, phí dịch vụ CLS và tiền thuốc; tự động khấu trừ phần BHYT chi trả.
   - Xác nhận thu tiền (Tiền mặt hoặc Chuyển khoản QR) -> In phiếu thu hóa đơn cho bệnh nhân -> Đóng hoàn tất hồ sơ khám.
7. **Kết thúc ca trực (Staff Check-out)**:
   - Khi kết thúc giờ làm việc, Bác sĩ và Kỹ thuật viên bấm **Check-out ra ca**.
   - Hệ thống tự động chốt thời gian làm việc thực tế, tính toán đi muộn/về sớm (nếu có) và tự động đồng bộ sang Bảng chấm công của Admin để phục vụ tính lương.

---

## ⚠️ 5. Lưu ý cho thành viên khi làm việc nhóm trên Git
- Không bao giờ commit file `.env` lên GitHub (mỗi người tự giữ file `.env` riêng trên máy).
- Khi có thay đổi về database (thêm cột, thêm bảng), hãy tạo migration mới hoặc xuất lại file backup `database/sql/smartcare_clean_demo.sql` để đồng bộ cho cả nhóm.
- Trước khi bắt đầu làm tính năng mới, luôn bấm **Fetch / Pull** trên GitHub Desktop để tránh bị xung đột code (conflict).
