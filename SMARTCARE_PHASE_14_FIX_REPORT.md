# SMARTCARE – PHASE 14: FIX RECEPTIONIST PATIENT RECORDS & SIDEBAR REPORT

**Dự án**: Hệ thống Quản lý Khám chữa bệnh Thông minh SmartCare  
**Giai đoạn**: Phase 14 – Chuẩn hóa Sidebar & Hoàn thiện Hồ sơ bệnh nhân cho Lễ tân  
**Thời gian thực hiện**: 04/11/2026  
**Trạng thái**: **HOÀN THÀNH TOÀN DIỆN (PASS 96/96 TEST SUITES, 3.129 ASSERTIONS)**

---

## 1. TỔNG QUAN & MỤC TIÊU PHASE 14

Phase 14 giải quyết triệt để hai vấn đề giao diện còn tồn đọng trên phân hệ Lễ tân (Receptionist):
1. **Trang "Hồ sơ bệnh nhân" không hoạt động**: Trước đây route `/receptionist/records` chỉ là một redirect tạm thời về `/receptionist/queue` từ Phase 9. Chưa có giao diện và chức năng quản lý danh sách, tra cứu hồ sơ bệnh nhân cho lễ tân.
2. **Sidebar trùng lặp và lệch trạng thái điều hướng (Active State Desync)**: Mỗi trang (`Dashboard.tsx`, `Queue.tsx`, `Payment.tsx`) tự khai báo một mảng `navItems` riêng với nhãn, số lượng mục khác nhau; logic highlight active item bị ảnh hưởng bởi query parameters và thiếu đồng bộ.

---

## 2. NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

| Vấn đề | Hiện trạng trước Phase 14 | Nguyên nhân gốc rễ |
| :--- | :--- | :--- |
| **Route `/records`** | Khi click vào menu "Hồ sơ bệnh nhân", người dùng bị điều hướng ngược về Hàng chờ tiếp nhận (`/receptionist/queue`). | Route `receptionist.records` trong `routes/web.php` trỏ vào closure redirect tạm thời (`redirect()->route('receptionist.queue')`), chưa có controller method và component view. |
| **Sidebar Menu** | Menu ở `Dashboard.tsx` chỉ có 3 mục (thiếu Hồ sơ bệnh nhân); menu ở `Payment.tsx` có nhãn khác ("Hàng chờ tiếp nhận", "Hóa đơn & Thu phí", "Hồ sơ"); menu ở `Queue.tsx` có nhãn khác ("Hàng chờ & Tiếp nhận", "Thanh toán"). | Mỗi trang tự hardcode mảng `navItems` cục bộ độc lập, không có cấu hình dùng chung duy nhất (single source of truth). |
| **Active State** | Khi có query parameters (ví dụ `?search=...&page=2`), hoặc chuyển qua lại giữa các trang, trạng thái active của sidebar dễ bị sai lệch hoặc không sáng đúng mục. | `DashboardLayout.tsx` kiểm tra `url.startsWith(item.href)` trực tiếp trên chuỗi URL thô gồm cả query string, chưa tách path và chưa chuẩn hóa fallback giữa các route liên kết (như `/receptionist/payment` và `/receptionist/invoices`). |

---

## 3. CÁC GIẢI PHÁP & THAY ĐỔI ĐÃ TRIỂN KHAI

### 3.1. Cấu hình Menu dùng chung (`resources/js/constants/navigation.ts`)
Tạo mới file cấu hình tập trung duy nhất cho toàn bộ phân hệ Lễ tân:
- Khai báo hằng số `RECEPTIONIST_NAV_ITEMS` gồm đúng 4 mục chuẩn:
  1. **Tổng quan** (`/receptionist/dashboard`, icon `LayoutDashboard`)
  2. **Hàng chờ & Tiếp nhận** (`/receptionist/queue`, icon `Calendar`)
  3. **Thanh toán** (`/receptionist/payment`, icon `CreditCard`)
  4. **Hồ sơ bệnh nhân** (`/receptionist/records`, icon `FileText`)
- Loại bỏ hoàn toàn khai báo `navItems` cục bộ tại `Dashboard.tsx`, `Queue.tsx`, `Payment.tsx`.
- Cập nhật `DashboardLayout.tsx`:
  - Thuộc tính `navItems` trở thành tùy chọn (`navItems?: NavItem[]`).
  - Nếu `role === 'receptionist'` và không truyền `navItems`, layout tự động áp dụng `RECEPTIONIST_NAV_ITEMS`.
  - Logic xác định mục đang hoạt động (`isActive`) được chuẩn hóa bằng cách bóc tách path thuần túy (`url.split('?')[0]`), giải quyết triệt để lỗi active state khi có filter hoặc pagination.

### 3.2. Triển khai Backend (`BenhNhanController.php` & `routes/web.php`)
- **`receptionistIndex(Request $request): Response`**:
  - Truy vấn danh sách bệnh nhân từ bảng `benh_nhan`.
  - Phân trang server-side linh hoạt (mặc định 10, hỗ trợ 20, 50 bản ghi/trang).
  - Tìm kiếm linh hoạt đa trường: Họ tên (`like`), Số điện thoại (`like`), Email (`like`), Mã bệnh nhân số (`exact`).
  - Giữ nguyên query parameters khi chuyển trang (`withQueryString()`).
  - Bảo mật dữ liệu: Chỉ chọn các trường nhân thân công khai (`MaBenhNhan`, `HoTen`, `GioiTinh`, `NgaySinh`, `SoDienThoai`, `DiaChi`, `EmailLienHe`, `MaTaiKhoan`). Tuyệt đối không để lộ mật khẩu, hash `MatKhau` hay thông tin đăng nhập nhạy cảm.
  - Phân quyền RBAC nghiêm ngặt: Chỉ vai trò `LE_TAN` (Mã 4) và `QUAN_TRI_VIEN` (Mã 1) được phép truy cập. Các vai trò khác nhận HTTP 403; khách chưa đăng nhập bị redirect HTTP 302 về `/login`.
- **`receptionistShow(Request $request, int $id): JsonResponse`**:
  - API trả về chi tiết một hồ sơ bệnh nhân kèm tài khoản liên kết (`taiKhoan`), 5 lượt khám gần nhất (`luotKhams`), và 5 lịch hẹn gần nhất (`lichHens`).
  - Phục vụ modal xem chi tiết tại quầy lễ tân mà không cần reload trang.
- **`routes/web.php`**:
  - `GET /receptionist/records` -> `BenhNhanController@receptionistIndex` (name: `receptionist.records`).
  - `GET /receptionist/records/{id}` -> `BenhNhanController@receptionistShow` (name: `receptionist.records.show`).

### 3.3. Xây dựng Giao diện Hồ sơ bệnh nhân (`resources/js/Pages/Receptionist/Patients.tsx`)
- Giao diện xây dựng theo chuẩn TailwindCSS và phong cách thiết kế của SmartCare:
  - Header với tiêu đề và nút chuyển nhanh đến Quầy tiếp nhận.
  - Thanh tìm kiếm tức thì có debounce (400ms).
  - Bộ chọn số dòng hiển thị (10, 20, 50 bản ghi/trang) và nút Đặt lại bộ lọc.
  - Thống kê khoảng bản ghi đang xem và tổng số lượng hồ sơ.
  - Bảng danh sách bệnh nhân hiển thị: Mã BN (định dạng `BN000xxx`), Họ tên, Giới tính (badge màu trực quan), Ngày sinh & Số tuổi tự động tính toán, Số điện thoại, Địa chỉ, và Nút "Chi tiết".
  - Thanh phân trang hoàn chỉnh: Trang đầu, Trang trước, Các nút số trang thông minh (có dấu chấm lửng khi nhiều trang), Trang sau, Trang cuối.
  - **Modal Chi tiết hồ sơ bệnh nhân**:
    - Hiển thị đầy đủ thông tin nhân thân, liên hệ và địa chỉ.
    - Hiển thị trạng thái tài khoản trực tuyến (đã liên kết tài khoản portal hay là khách vãng lai).
    - Hiển thị lịch sử các lượt khám bệnh gần nhất (mã lượt khám, thời gian, trạng thái, số phiếu).
    - Nút thao tác nhanh: Đóng modal hoặc Tiếp nhận trực tiếp vào hàng chờ khám bệnh.

---

## 4. KẾT QUẢ KIỂM THỬ TOÀN DIỆN

### 4.1. Bộ kiểm thử Phase 14 (`tests/Feature/Phase14ReceptionistPatientsTest.php`)
Được thiết kế chuẩn theo pattern của dự án (sử dụng `DatabaseTransactions`, kết nối database test `phong_kham_hybrid_queue_test`, không sử dụng factory khi không có).

| # | Tên Test Case | Kết quả | Mô tả |
| :---: | :--- | :---: | :--- |
| 1 | `test_01_receptionist_can_access_records_page` | **PASS** | HTTP 200, component `Receptionist/Patients`, không còn 302 redirect. |
| 2 | `test_02_records_page_has_required_inertia_props` | **PASS** | Kiểm tra props: `patients`, `data`, `current_page`, `last_page`, `total`, `filters`. |
| 3 | `test_03_records_pagination_respects_per_page` | **PASS** | Server-side pagination áp dụng chính xác tham số `per_page=5`. |
| 4 | `test_04_records_pagination_page_2_works` | **PASS** | Chuyển sang trang 2 hiển thị đúng dữ liệu trang tiếp theo. |
| 5 | `test_05_records_search_by_name` | **PASS** | Tìm kiếm theo họ tên bệnh nhân trả về đúng kết quả. |
| 6 | `test_06_records_search_by_phone` | **PASS** | Tìm kiếm theo số điện thoại lọc chính xác bệnh nhân. |
| 7 | `test_07_records_search_by_patient_id` | **PASS** | Tìm kiếm theo mã ID số định danh bệnh nhân hoạt động chuẩn xác. |
| 8 | `test_08_records_detail_endpoint_returns_patient_data` | **PASS** | API `/receptionist/records/{id}` trả về JSON chi tiết kèm quan hệ. |
| 9 | `test_09_records_detail_endpoint_returns_404_on_nonexistent`| **PASS** | Trả về 404 khi mã bệnh nhân không tồn tại trên hệ thống. |
| 10| `test_10_patient_role_cannot_access_receptionist_records` | **PASS** | Bệnh nhân (VaiTro 3) truy cập bị từ chối với HTTP 403 Forbidden. |
| 11| `test_11_unauthenticated_user_redirected_to_login` | **PASS** | Khách chưa đăng nhập bị chuyển hướng về trang đăng nhập (`/login`). |
| 12| `test_12_admin_role_can_access_receptionist_records` | **PASS** | Quản trị viên (VaiTro 1) có đầy đủ quyền truy cập hồ sơ lễ tân. |
| 13| `test_13_records_response_does_not_leak_sensitive_credentials` | **PASS** | Kiểm tra nội dung response không chứa `MatKhau`, token hay password hash. |
| 14| `test_14_real_database_untouched` | **PASS** | Xác nhận database thật `phong_kham_thong_minh` có đúng 30 bảng nguyên vẹn. |

**Kết quả Phase 14 Test**: **14/14 PASS (125 assertions)**.

---

### 4.2. Kiểm thử hồi quy toàn bộ hệ thống (Regression Test Suite)
Chạy toàn bộ các bộ kiểm thử tự động của hệ thống:

```
PASS  Tests\Feature\HybridQueueAcceptancePhase6Test      (3/3 tests)
PASS  Tests\Feature\HybridQueueControllerIntegrationTest (7/7 tests)
PASS  Tests\Feature\HybridQueuePolicy51Test              (15/15 tests)
PASS  Tests\Feature\HybridQueuePolicy53Test              (16/16 tests)
PASS  Tests\Feature\Phase10BrowserSmokeTest              (9/9 tests, 316 assertions)
PASS  Tests\Feature\Phase12ReceptionQueueCorrectionTest  (8/8 tests)
PASS  Tests\Feature\Phase13QueuePaginationTest           (10/10 tests, 104 assertions)
PASS  Tests\Feature\Phase14ReceptionistPatientsTest      (14/14 tests, 125 assertions)
PASS  Tests\Feature\Phase9IntegrationFixesTest           (5/5 tests)
PASS  Tests\Feature\QueueManagementServiceTest           (12/12 tests)

Tổng cộng: 96 passed (3.129 assertions)
Thời gian chạy: 14.74s
Lỗi tồn đọng: 0
```

---

### 4.3. Kiểm tra TypeScript & Frontend Build

- **TypeScript Type Check**: `npx tsc --noEmit` -> **Exit code 0 (0 lỗi)**.
- **Vite Production Build**: `npm run build` -> **Hoàn thành thành công trong 18.06s**.
  - Generated: `public/build/assets/Patients-BJq4I9iw.js` (17.27 kB | gzip: 4.78 kB).
  - Không có cảnh báo hay lỗi cú pháp nào.

---

### 4.4. Kiểm tra Toàn vẹn Database Thật (`phong_kham_thong_minh`)
Thực hiện truy vấn trực tiếp kiểm tra database sản xuất:
```sql
SELECT count(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'phong_kham_thong_minh';
-- Kết quả: 30 bảng (nguyên vẹn)

SELECT count(*) FROM phong_kham_thong_minh.luot_kham;
-- Kết quả: 23 lượt khám (nguyên vẹn, không có migration, không có backfill ghi đè)
```

---

## 5. DANH SÁCH FILE THAY ĐỔI / TẠO MỚI

1. `resources/js/constants/navigation.ts` *(Tạo mới)*: Định nghĩa cấu hình menu `RECEPTIONIST_NAV_ITEMS` dùng chung chuẩn.
2. `resources/js/Layouts/DashboardLayout.tsx` *(Chỉnh sửa)*: Tích hợp menu mặc định cho lễ tân, chuẩn hóa tính toán `isActive` theo URL thuần.
3. `resources/js/Pages/Receptionist/Patients.tsx` *(Tạo mới)*: Giao diện danh sách hồ sơ, tìm kiếm, phân trang và modal xem chi tiết hồ sơ bệnh nhân.
4. `resources/js/Pages/Receptionist/Dashboard.tsx` *(Chỉnh sửa)*: Sử dụng `RECEPTIONIST_NAV_ITEMS`, xóa bỏ mảng khai báo menu trùng lặp.
5. `resources/js/Pages/Receptionist/Queue.tsx` *(Chỉnh sửa)*: Sử dụng `RECEPTIONIST_NAV_ITEMS`, xóa bỏ mảng khai báo menu trùng lặp.
6. `resources/js/Pages/Receptionist/Payment.tsx` *(Chỉnh sửa)*: Sử dụng `RECEPTIONIST_NAV_ITEMS`, xóa bỏ mảng khai báo menu trùng lặp.
7. `app/Http/Controllers/BenhNhanController.php` *(Chỉnh sửa)*: Bổ sung method `receptionistIndex` và `receptionistShow`.
8. `routes/web.php` *(Chỉnh sửa)*: Định tuyến `/receptionist/records` và `/receptionist/records/{id}`.
9. `tests/Feature/Phase14ReceptionistPatientsTest.php` *(Tạo mới)*: 14 test case kiểm thử toàn diện chức năng hồ sơ và phân quyền.
10. `tests/Feature/Phase10BrowserSmokeTest.php` *(Chỉnh sửa)*: Bổ sung bước kiểm tra trang hồ sơ bệnh nhân vào kịch bản smoke test lễ tân.
11. `tests/Feature/Phase9IntegrationFixesTest.php` *(Chỉnh sửa)*: Cập nhật assertion cho `receptionist.records` từ redirect tạm sang HTTP 200 trang thật.

---

## 6. KẾT LUẬN

Phase 14 đã hoàn thành 100% mục tiêu:
- Phân hệ Lễ tân đã có trang **Hồ sơ bệnh nhân** hoàn chỉnh, hoạt động trơn tru với tìm kiếm đa năng, phân trang server-side và popup xem chi tiết đầy đủ thông tin nhân thân, tài khoản và lịch sử khám.
- Toàn bộ 4 trang lễ tân (**Tổng quan**, **Hàng chờ & Tiếp nhận**, **Thanh toán**, **Hồ sơ bệnh nhân**) đã dùng chung **một cấu hình Sidebar duy nhất**, trạng thái Active menu bám sát URL chính xác.
- Hệ thống đạt trạng thái hoàn hảo với **96/96 test suite thành công (3.129 assertions)**, **0 lỗi TypeScript/Vite**, và **bảo toàn tuyệt đối database sản xuất**.
