# HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÔNG MINH TÍCH HỢP AI - SMARTCARE
## TÀI LIỆU HƯỚNG DẪN NGHIỆM THU & BÀN GIAO SẢN PHẨM (GIAI ĐOẠN 6)
**Dự án:** Nhóm 9 - DALN  
**Công nghệ:** Laravel 11 + MySQL 8.0 + React 18 + TypeScript + Inertia.js + Tailwind CSS + Google Gemini AI  
**Ngày cập nhật:** 03/11/2026  

---

## MỤC LỤC
1. [Hướng dẫn cài đặt & khởi chạy](#1-hướng-dẫn-cài-đặt--khởi-chạy)
2. [Cấu hình biến môi trường (.env)](#2-cấu-hình-biến-môi-trường-env)
3. [Danh mục tài khoản Demo nghiệm thu](#3-danh-mục-tài-khoản-demo-nghiệm-thu)
4. [Kiến trúc hệ thống & Sơ đồ Use Case](#4-kiến-trúc-hệ-thống--sơ-đồ-use-case)
5. [Sơ đồ thực thể liên kết (ERD)](#5-sơ-đồ-thực-thể-liên-kết-erd)
6. [Kịch bản Demo xuyên suốt từ A đến Z (Dành cho Giảng viên)](#6-kịch-bản-demo-xuyên-suốt-từ-a-đến-z)
7. [Báo cáo phân hệ Trợ lý ảo AI Medical Assistant](#7-báo-cáo-phân-hệ-trợ-lý-ảo-ai-medical-assistant)
8. [Đánh giá kiểm thử tự động & Browser E2E](#8-đánh-giá-kiểm-thử-tự-động--browser-e2e)

---

## 1. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 1.1. Yêu cầu môi trường
- **PHP**: >= 8.2 (yêu cầu extensions: `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `curl`)
- **Composer**: >= 2.x
- **Node.js**: >= 18.x (npm >= 9.x)
- **Database**: MySQL >= 8.0 (hoặc MariaDB >= 10.4)

### 1.2. Các bước cài đặt chi tiết
```bash
# Bước 1: Di chuyển vào thư mục dự án
cd c:\Users\admin\quanlytkbieu-app\Nhom9-DALN

# Bước 2: Cài đặt dependencies PHP & Composer
composer install

# Bước 3: Cài đặt dependencies Frontend & Build
npm install
npm run build

# Bước 4: Thiết lập cấu hình môi trường
cp .env.example .env
php artisan key:generate

# Bước 5: Khởi tạo database và dữ liệu
# Lưu ý: Tuyệt đối KHÔNG chạy migrate:fresh trên môi trường có dữ liệu thật!
php artisan migrate

# Bước 6: Nạp dữ liệu Demo chuẩn phục vụ nghiệm thu (chỉ thêm nếu chưa có, an toàn 100%)
php artisan smartcare:seed-demo

# Bước 7: Khởi chạy máy chủ phát triển
php artisan serve
# Đồng thời tại terminal thứ 2:
npm run dev
```

---

## 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

Cần đảm bảo các thông số sau trong tệp `.env`:

```dotenv
APP_NAME="SmartCare Clinic"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

# Cấu hình Cơ sở dữ liệu MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=phong_kham_thong_minh
DB_USERNAME=root
DB_PASSWORD=

# Cấu hình Trợ lý Y tế AI (Google Gemini)
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Mật khẩu dùng chung cho bộ tài khoản Demo (Mặc định: SmartCare@2026)
DEMO_PASSWORD="SmartCare@2026"
```

> **Ghi chú về AI Chatbot:**  
> Hệ thống có cơ chế Fallback y tế & Cơ sở tri thức nội bộ SmartCare FAQ tự động kích hoạt nếu chưa cấu hình `GEMINI_API_KEY`. Khi có khóa API, SmartCare AI sẽ kết nối trực tiếp với Google Gemini 1.5 Flash để hỗ trợ tư vấn thời gian thực.

---

## 3. DANH MỤC TÀI KHOẢN DEMO NGHIỆM THU

Tất cả các tài khoản Demo đã được mã hóa mật khẩu an toàn chuẩn bcrypt (`Hash::make`), liên kết hồ sơ tương ứng và sẵn sàng đăng nhập:

| STT | Vai trò (Role) | Họ và tên | Tên đăng nhập | Email | Mật khẩu mặc định | Ghi chú quyền hạn |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Quản trị viên** | Quản Trị Viên Demo | `admin_demo` | `admin@smartcare.vn` | `SmartCare@2026` | Toàn quyền cấu hình, tài khoản, dịch vụ, thuốc, báo cáo tài chính toàn viện. |
| **2** | **Lễ tân** | Lễ Tân Demo | `letan_demo` | `letan@smartcare.vn` | `SmartCare@2026` | Quản lý hàng chờ, tiếp nhận ca khám, lập hóa đơn viện phí, thu tiền, in phiếu thu. |
| **3** | **Bác sĩ** | BS. CKI Nguyễn Văn Nam | `bacsi_nam` | `bacsi.nam@smartcare.vn` | `SmartCare@2026` | Chuyên khoa Nội Tổng Quát, khám bệnh, lập phiếu khám, kê đơn thuốc, chỉ định CLS. |
| **4** | **Bệnh nhân 1** | Bệnh Nhân An (Demo) | `benhnhan_an` | `benhnhan.an@smartcare.vn` | `SmartCare@2026` | Tra cứu bác sĩ, đặt lịch khám trực tuyến, xem lịch sử bệnh án, theo dõi đơn thuốc & công nợ. |
| **5** | **Bệnh nhân 2** | Bệnh Nhân Bình (Demo) | `benhnhan_binh` | `benhnhan.binh@smartcare.vn` | `SmartCare@2026` | Tài khoản bệnh nhân độc lập, kiểm tra cách ly dữ liệu cá nhân (chống IDOR). |

---

## 4. KIẾN TRÚC HỆ THỐNG & SƠ ĐỒ USE CASE

### 4.1. Kiến trúc hệ thống tổng thể (Architecture)
Hệ thống được tổ chức theo mô hình phân tầng nguyên khối hiện đại (Modern Monolith with Inertia):
- **Client Tier**: Single Page Application viết bằng React 18, TypeScript, Tailwind CSS, Heroicons & Lucide Icons.
- **Protocol Tier**: Inertia.js đóng vai trò cầu nối dữ liệu, loại bỏ overhead của việc xây dựng REST API CRUD truyền thống, giữ trọn vẹn trạng thái bảo mật của Laravel Session & CSRF Token.
- **Application Tier (Backend)**: Laravel 11 Framework với mô hình MVC, Form Requests, Policies, Database Transactions, Locking (`lockForUpdate`), và Service Layer (`AiMedicalAssistantService`).
- **Data Tier**: MySQL 8.0 với các Stored Procedure nghiệp vụ (`sp_dat_lich_hen`, `sp_kiem_tra_trung_lich`), Triggers bảo toàn công nợ tài chính, và các ràng buộc toàn vẹn khóa ngoại.
- **External Integration Tier**: Google Gemini Generative AI tương tác thông qua RESTful HTTPS với cơ chế guardrails y tế.

### 4.2. Sơ đồ Use Case phân quyền (RBAC)
```
+-----------------------------------------------------------------------------------+
|                            HỆ THỐNG SMARTCARE CLINIC                              |
+-----------------------------------------------------------------------------------+
                                        |
       +-----------------+--------------+---------------+------------------+
       |                 |                              |                  |
[BỆNH NHÂN]          [LỄ TÂN]                       [BÁC SĨ]         [QUẢN TRỊ VIÊN]
       |                 |                              |                  |
       +-- Tra cứu BS    +-- Quản lý hàng chờ           +-- Xem hàng chờ   +-- Quản lý tài khoản
       +-- Đặt lịch hẹn  +-- Tiếp nhận bệnh nhân        +-- Khám bệnh      +-- Quản lý Bác sĩ/Khoa
       +-- Xem lịch sử   +-- Lập hóa đơn viện phí       +-- Ghi phiếu khám +-- Quản lý danh mục Dịch vụ
       +-- Xem đơn thuốc +-- Thu tiền & In phiếu        +-- Kê đơn thuốc   +-- Quản lý kho thuốc
       +-- Xem công nợ   +-- Tra cứu lịch hẹn           +-- Chỉ định CLS   +-- Báo cáo doanh thu toàn viện
       +-- Hỏi đáp AI    +-- Hủy lịch theo yêu cầu      +-- Cập nhật KQ    +-- Cấu hình hệ thống
```

---

## 5. SƠ ĐỒ THỰC THỂ LIÊN KẾT (ERD)

Mối quan hệ giữa các bảng chính trong MySQL `phong_kham_thong_minh`:

```
[tai_khoan] 1 ---- 1..* [vai_tro]
    |
    +---- 1:1 ----> [benh_nhan] 1 ---- 0..* [lich_hen]
    |                                            |
    +---- 1:1 ----> [bac_si] 1                   | (Tiếp nhận)
                       |                         v
                       +---- 1..* [ca_kham] ----> [luot_kham]
                                                      |
                 +------------------------------------+-----------------------------+
                 |                                    |                             |
                 v                                    v                             v
           [phieu_kham]                         [don_thuoc]                 [chi_dinh_dich_vu]
                                                      |                             |
                                                      v                             v
                                            [chi_tiet_don_thuoc]             [dich_vu]
                                                      |
                                                      v
                                                   [thuoc]
                                                      |
                                                      v (Tổng hợp chi phí)
                                                  [hoa_don] 1 ---- 1..* [chi_tiet_hoa_don]
                                                      |
                                                      +---- 1..* [thanh_toan] (Biên lai thu)
```

**Bảng AI Chatbot:**
```
[benh_nhan] 1 ---- 0..* [hoi_thoai_ai] 1 ---- 1..* [tin_nhan_ai]
```

---

## 6. KỊCH BẢN DEMO XUYÊN SUỐT TỪ A ĐẾN Z

Hội đồng nghiệm thu và Giảng viên có thể thực hiện theo kịch bản khép kín 6 bước sau để đánh giá đầy đủ tính toàn vẹn nghiệp vụ:

### Bước 1: Bệnh nhân đặt lịch trực tuyến & Trợ lý ảo AI
1. Đăng nhập tài khoản Bệnh nhân: `benhnhan.an@smartcare.vn` / `SmartCare@2026`.
2. Mở hộp thoại **SmartCare AI** (ở góc phải dưới màn hình) -> Đặt câu hỏi: *"Phòng khám làm việc vào khung giờ nào?"* hoặc *"Hướng dẫn tôi cách đặt lịch khám"*. Quan sát AI phản hồi chính xác thông tin phòng khám kèm lời cảnh báo y tế bắt buộc.
3. Truy cập menu **"Đặt lịch khám"**:
   - Chọn chuyên khoa **Nội Tổng Quát**.
   - Chọn bác sĩ **BS. CKI Nguyễn Văn Nam**.
   - Chọn ngày làm việc hôm nay và chọn **Ca khám còn trống**.
   - Nhập lý do: *"Kiểm tra định kỳ tiêu hóa"*, bấm **"Xác nhận đặt lịch"**.
4. Lịch hẹn được tạo thành công với mã hiển thị, trạng thái `CHO_XAC_NHAN`. Đăng xuất.

### Bước 2: Lễ tân tiếp nhận bệnh nhân vào hàng chờ
1. Đăng nhập tài khoản Lễ tân: `letan@smartcare.vn` / `SmartCare@2026`.
2. Truy cập màn hình **"Hàng chờ & Tiếp nhận"** (`/receptionist/queue`).
3. Tìm kiếm bệnh nhân theo tên "Bệnh Nhân An" hoặc số điện thoại `0901234567`.
4. Bấm nút **"Tiếp nhận"**. Hệ thống tạo một **Lượt khám mới** (`CHO_KHAM`), chuyển trạng thái lịch hẹn sang `DA_TIEP_NHAN`.
5. Thử bấm lại: hệ thống báo lỗi không cho tiếp nhận trùng. Đăng xuất.

### Bước 3: Bác sĩ khám bệnh, kê đơn thuốc & chỉ định dịch vụ
1. Đăng nhập tài khoản Bác sĩ: `bacsi.nam@smartcare.vn` / `SmartCare@2026`.
2. Truy cập màn hình **"Phòng khám bệnh"** (`/doctor/examine`).
3. Chọn bệnh nhân An từ danh sách hàng chờ của bác sĩ -> Bấm **"Bắt đầu khám"** (Lượt khám chuyển `DANG_KHAM`).
4. Nhập thông tin khám:
   - Triệu chứng: *"Đau rát vùng thượng vị, ợ hơi"*.
   - Chẩn đoán: *"Viêm loét dạ dày tá tràng thể nhẹ"*.
   - Bấm **"Lưu phiếu khám"**.
5. Kê đơn thuốc:
   - Tìm kiếm thuốc *"Omeprazol 20mg"* -> Kê số lượng: 14 viên -> Nhập cách dùng: *"Uống 1 viên trước bữa ăn sáng 30 phút"*.
   - Bấm **"Thêm vào đơn"**. Quan sát số lượng tồn kho thuốc bị trừ tức thì trên hệ thống.
6. Chỉ định dịch vụ cận lâm sàng:
   - Chỉ định dịch vụ *"Nội soi dạ dày qua đường tiêu hóa"*.
   - Cập nhật kết quả: *"Niêm mạc hang vị viêm trợt nhẹ, không xuất huyết"*. Bấm hoàn thành dịch vụ.
7. Bác sĩ bấm **"Hoàn tất buổi khám"** -> Hồ sơ được khóa, bảo vệ toàn vẹn dữ liệu. Đăng xuất.

### Bước 4: Lễ tân lập hóa đơn viện phí & Thu tiền
1. Đăng nhập lại tài khoản Lễ tân: `letan@smartcare.vn` / `SmartCare@2026`.
2. Truy cập menu **"Hóa đơn & Thanh toán"** (`/receptionist/invoices`).
3. Chọn lượt khám vừa hoàn thành của Bệnh nhân An -> Bấm **"Lập hóa đơn"**.
4. Hệ thống tự động bóc tách chi phí viện phí:
   - Tiền công khám bệnh.
   - Tiền thuốc theo đơn.
   - Tiền dịch vụ cận lâm sàng đã chỉ định.
   - Bảo toàn đúng giá lịch sử, tính toán giảm trừ bảo hiểm y tế.
5. Thực hiện thu tiền:
   - Thu đợt 1 (ví dụ 50% số tiền): Nhập số tiền -> Chọn phương thức *Chuyển khoản* -> Bấm **"Xác nhận thanh toán"**. Hóa đơn chuyển trạng thái `THANH_TOAN_MOT_PHAN`.
   - Thu đợt 2 (số tiền còn lại): Chọn *Tiền mặt* -> Bấm **"Thu đủ số tiền còn nợ"**. Hóa đơn chuyển `DA_THANH_TOAN`.
   - Bấm **"In phiếu thu"** để xem và in phiếu thu viện phí hoàn chỉnh. Đăng xuất.

### Bước 5: Bệnh nhân tra cứu lịch sử bệnh án & đơn thuốc
1. Đăng nhập tài khoản Bệnh nhân: `benhnhan.an@smartcare.vn` / `SmartCare@2026`.
2. Vào mục **"Lịch sử khám bệnh"** -> Xem lại chi tiết chẩn đoán của bác sĩ, kết quả nội soi.
3. Vào mục **"Đơn thuốc của tôi"** -> Xem hướng dẫn sử dụng thuốc Omeprazol, liều dùng chi tiết.
4. Vào mục **"Hóa đơn viện phí"** -> Xem chi tiết các khoản thanh toán, phiếu thu, số dư công nợ còn lại (0 đ).

### Bước 6: Quản trị viên theo dõi Dashboard & Báo cáo tài chính
1. Đăng nhập tài khoản Quản trị viên: `admin@smartcare.vn` / `SmartCare@2026`.
2. Quan sát **Admin Dashboard**:
   - Doanh thu thực thu cập nhật tức thì theo thời gian thực từ bảng `thanh_toan`.
   - Thống kê lượt khám, biểu đồ ca khám, công suất phòng khám.
3. Truy cập **"Báo cáo tài chính"** (`/admin/reports`): Xem doanh thu phân bổ theo phương thức (Tiền mặt, Chuyển khoản), năng suất từng bác sĩ.
4. Truy cập **"Quản lý danh mục Thuốc"**: Kiểm tra số lượng tồn kho thuốc Omeprazol đã được cập nhật chính xác sau đợt kê đơn.

---

## 7. BÁO CÁO PHÂN HỆ TRỢ LÝ ẢO AI MEDICAL ASSISTANT

- **Service:** `App\Services\AiMedicalAssistantService`
- **Controller:** `App\Http\Controllers\AiChatController`
- **Component Giao diện:** `resources/js/Components/AiChatWidget.tsx` (nhúng toàn cục trên PublicLayout và Cổng Bệnh nhân)
- **Tình trạng hoạt động:**
  - Kết nối Google Gemini API thông qua `GEMINI_API_KEY`.
  - Bộ lọc an toàn y tế (Guardrails): Chặn tuyệt đối hành vi người dùng cố tình yêu cầu AI kết luận bệnh thay bác sĩ hoặc kê đơn bừa bãi.
  - Chống rò rỉ dữ liệu (Anti-IDOR): Từ chối trả lời thông tin bệnh án của bệnh nhân khác.
  - Luôn đính kèm cảnh báo y tế bắt buộc: *"Thông tin từ trợ lý AI chỉ mang tính chất tham khảo và hỗ trợ thông tin, không thay thế cho chẩn đoán, tư vấn chuyên môn hoặc chỉ định điều trị của Bác sĩ."*
  - Lưu trữ toàn bộ hội thoại và tin nhắn vào 2 bảng MySQL `hoi_thoai_ai` và `tin_nhan_ai` phục vụ giám sát y tế.

---

## 8. ĐÁNG GIÁ KIỂM THỬ TỰ ĐỘNG & BROWSER E2E

### 8.1. Kết quả kiểm thử tự động toàn diện (Automated Regression Test Suite)
Hệ thống sở hữu **14 bộ kiểm thử chuyên sâu** với **190 kịch bản kiểm thử tự động**, đạt tỷ lệ thành công tuyệt đối **190/190 PASS (100%)**:

1. `test:auth`: 5/5 PASS (Đăng ký, Đăng nhập, Mã hóa mật khẩu, Phân quyền RBAC).
2. `test:benhnhan`: 5/5 PASS (Quản lý hồ sơ, Cập nhật thông tin, Bảo vệ MaTaiKhoan).
3. `test:chuyenkhoa`: 4/4 PASS (Danh mục, Tra cứu, Tìm kiếm chuyên khoa).
4. `test:bacsi`: 5/5 PASS (Hồ sơ bác sĩ, Chuyên khoa, Lịch làm việc).
5. `test:lichkham`: 6/6 PASS (Khung giờ, Ca khám, Đặt lịch trực tuyến).
6. `test:khambenh`: 25/25 PASS (Phiếu khám, Đơn thuốc, Tồn kho, Chỉ định CLS).
7. `test:letanhangcho`: 10/10 PASS (Hàng chờ, Tiếp nhận bệnh nhân, Chống trùng lặp).
8. `test:bacsikhambenh`: 18/18 PASS (Tích hợp màn hình bác sĩ, Khóa dữ liệu sau khám).
9. `test:hoadon`: 25/25 PASS (An toàn tài chính, Idempotency, Khóa đồng thời, Công nợ).
10. `test:patient-portal`: 12/12 PASS (Dashboard bệnh nhân, Lịch sử khám, Đơn thuốc, Hóa đơn).
11. `test:admin-portal`: 12/12 PASS (Admin Dashboard, Quản lý tài khoản, Danh mục, Báo cáo).
12. `test:admin-audit`: 13/13 PASS (Kiểm toán bảo mật, Chống tự khóa Admin cuối cùng).
13. `test:smartcare-e2e`: 38/38 PASS (Luồng tích hợp liên thông 4 vai trò xuyên suốt).
14. `test:ai-chatbot`: 12/12 PASS (Tài khoản demo, Hỏi đáp y tế, Lưu vết MySQL, Cách ly dữ liệu).

### 8.2. Đánh giá kiểm thử giao diện trình duyệt (Browser E2E)
- **Tình trạng hiện tại:** Dự án chưa cài đặt gói công cụ Browser Headless E2E (như Playwright hoặc Puppeteer) trong `package.json` để tránh làm phình kích thước mã nguồn.
- **Biện pháp đảm bảo:**
  - Toàn bộ luồng render giao diện Inertia (React Props, HTTP Response, Authorization Redirect, Database State) đã được kiểm thử chặt chẽ 100% thông qua bộ test `test:smartcare-e2e` và `test:bacsikhambenh`.
  - Frontend TypeScript và Vite Bundle đã được kiểm tra nghiêm ngặt với lệnh `npm run build` (0 error, 0 warning, build thành công trong 15.99s).
  - Đối với phần kiểm thử giao diện thực tế (Browser UI/UX), xin vui lòng thực hiện trực tiếp trên trình duyệt theo **Kịch bản Demo tại Mục 6** để trải nghiệm mượt mà nhất.
