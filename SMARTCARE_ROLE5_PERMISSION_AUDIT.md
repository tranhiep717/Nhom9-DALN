# BÁO CÁO AUDIT VÀ KẾ HOẠCH BỔ SUNG VAI TRÒ NHÂN VIÊN CẬN LÂM SÀNG
**Dự án:** Hệ thống quản lý phòng khám thông minh tích hợp AI — SmartCare (Nhóm 9 DALN)  
**Thời điểm thực hiện:** 03/11/2026  
**Mục tiêu:** Bổ sung vai trò thứ 5 (`NHAN_VIEN_CAN_LAM_SANG`), tái cấu trúc quy trình khám bệnh khép kín, sửa chức năng phiếu khám & chỉ định cận lâm sàng.  

---

## 1. PHÂN TÍCH HIỆN TRẠNG DATABASE & HỆ THỐNG PHÂN QUYỀN

### 1.1. Hiện trạng bảng `vai_tro` và `tai_khoan`
- Bảng `vai_tro` hiện có 4 bản ghi:
  * `1` - `QUAN_TRI_VIEN`: Quản lý và quản trị hệ thống
  * `2` - `BAC_SI`: Bác sĩ khám và điều trị
  * `3` - `BENH_NHAN`: Người sử dụng dịch vụ khám bệnh
  * `4` - `LE_TAN`: Nhân viên tiếp nhận và quản lý lịch hẹn
- Bảng `tai_khoan`: Khóa chính là `MaTaiKhoan` (INT, Auto Increment), KHÔNG có cột `id`.
- Chưa có vai trò `NHAN_VIEN_CAN_LAM_SANG`. Khi thêm mới, ID vai trò này sẽ là `5`.
- **Nguyên tắc an toàn dữ liệu:** Không thay đổi ID cũ của 4 vai trò, không chạy `migrate:fresh`, không xóa/truncate database.

### 1.2. Hiện trạng quy trình khám bệnh và các bảng liên quan
- **Bảng `luot_kham`:** Cột `TrangThai` hiện hỗ trợ các giá trị: `CHO_KHAM`, `DANG_KHAM`, `HOAN_THANH`, `DA_HUY`. Chưa có các trạng thái trung gian `CHO_KET_QUA` (khi đã chỉ định dịch vụ kỹ thuật) và `CHO_KHAM_LAI` (khi kỹ thuật viên đã hoàn tất kết quả để bác sĩ tiếp tục kết luận).
- **Bảng `phieu_kham`:** 
  * Cột `ChanDoan` và `TrieuChung` đều là `NOT NULL`.
  * Hàm `savePhieuKham` trong `LuotKhamController` validate bắt buộc phải có `ChanDoan` xác định. Khi bác sĩ mới khám sơ bộ và cần chỉ định cận lâm sàng trước khi có chẩn đoán cuối cùng, việc bắt buộc chẩn đoán xác định gây tắc nghẽn quy trình.
  * Khi lưu phiếu khám, nếu lượt khám vẫn ở `CHO_KHAM` thì chưa tự động chuyển sang `DANG_KHAM`.
- **Bảng `chi_dinh_dich_vu`:**
  * Hiện chỉ có các cột cơ bản: `MaChiDinh`, `MaLuotKham`, `MaDichVu`, `MaBacSi`, `TrangThai`, `KetQua`, `NgayChiDinh`, `NgayThucHien`, `DonGia`, `GhiChu`.
  * **Thiếu các trường nghiệp vụ của Kỹ thuật viên:** `MaNhanVienThucHien` (khóa ngoại trỏ về `tai_khoan.MaTaiKhoan`), `KetLuan` (nhận xét chuyên môn), `DonViDo` (mg/dL, mmol/L,...), `KhoangThamChieu` (chỉ số bình thường), `TepDinhKem`, `ThoiGianXacNhan`.
  * `ChiDinhDichVuController::store` hiện chỉ cho phép gửi 1 dịch vụ đơn lẻ thay vì chọn nhiều dịch vụ cùng lúc.
  * `ChiDinhDichVuController::updateResult` hiện bị giới hạn chỉ cho Bác sĩ hoặc Admin, chưa cấp quyền cho Nhân viên cận lâm sàng (`NHAN_VIEN_CAN_LAM_SANG`).

---

## 2. BẢNG PHÂN TÍCH FILE CẦN SỬA & GIẢI PHÁP CHI TIẾT

| STT | File cần sửa | Chức năng đang tồn tại | Vấn đề phát hiện | Giải pháp sửa đổi | Ảnh hưởng đến dữ liệu & vai trò hiện có |
|---|---|---|---|---|---|
| 1 | `database/migrations/2026_11_03_000002_add_role_nhan_vien_can_lam_sang.php` | Chưa có migration thêm vai trò 5 | Chưa có bản ghi `NHAN_VIEN_CAN_LAM_SANG` trong bảng `vai_tro` | Viết migration `insertOrIgnore` bản ghi `MaVaiTro = 5`, `TenVaiTro = 'NHAN_VIEN_CAN_LAM_SANG'` | **An toàn tuyệt đối**: Không ảnh hưởng đến ID 1, 2, 3, 4 hiện tại |
| 2 | `database/migrations/2026_11_03_000003_extend_chi_dinh_dich_vu_table.php` | `chi_dinh_dich_vu` chỉ có `KetQua` | Thiếu người thực hiện, đơn vị đo, khoảng tham chiếu, kết luận, thời gian xác nhận | Thêm cột `MaNhanVienThucHien`, `KetLuan`, `DonViDo`, `KhoangThamChieu`, `TepDinhKem`, `ThoiGianXacNhan` | **An toàn**: Toàn bộ cột mới đều `nullable`, giữ nguyên dữ liệu chỉ định cũ |
| 3 | `app/Models/TaiKhoan.php` | Quản lý tài khoản, các hàm `isBacSi()`, `isLeTan()`,... | Chưa có hàm nhận diện `isNhanVienCanLamSang()` | Bổ sung method `isNhanVienCanLamSang(): bool` kiểm tra `TenVaiTro === 'NHAN_VIEN_CAN_LAM_SANG'` | Không ảnh hưởng đến các hàm role khác |
| 4 | `app/Models/ChiDinhDichVu.php` | Model chỉ định dịch vụ | Chưa có fillable các cột mới và quan hệ kỹ thuật viên | Thêm các cột mới vào `$fillable`, thêm quan hệ `nhanVienThucHien()` trỏ tới `TaiKhoan` | Mở rộng Eloquent, không phá vỡ logic cũ |
| 5 | `bootstrap/app.php` | Cấu hình middleware `redirectUsersTo` | Khi nhân viên CLS đã có session truy cập `/login`, bị redirect mặc định về `/dashboard` và dính lỗi 403 | Thêm mapping `'NHAN_VIEN_CAN_LAM_SANG' => route('cls.dashboard')` | Khắc phục triệt để lỗi chuyển nhầm dashboard |
| 6 | `app/Http/Controllers/AuthController.php` | Xử lý login, redirect theo role | `getRedirectUrlByRole` và `intendedUrl` chưa hỗ trợ vai trò CLS | Thêm case `'NHAN_VIEN_CAN_LAM_SANG' => route('cls.dashboard')` và kiểm tra intended `/cls` | Giúp nhân viên CLS đăng nhập đúng đích 100% |
| 7 | `routes/web.php` | Định tuyến toàn bộ hệ thống | Chưa có nhóm route `/cls/*` cho nhân viên cận lâm sàng | Tạo route group `prefix('cls')`, middleware `['auth', 'role:NHAN_VIEN_CAN_LAM_SANG,QUAN_TRI_VIEN']` | Tách biệt hoàn toàn phân hệ mới, bảo mật RBAC |
| 8 | `app/Http/Controllers/CanLamSangController.php` (Tạo mới) | Chưa tồn tại | Chưa có controller chuyên trách cho quy trình cận lâm sàng | Xây dựng: `dashboard()`, `index()`, `receive()`, `start()`, `updateResult()`, `cancel()` | Module hóa sạch sẽ, quản lý đúng nghiệp vụ vai trò 5 |
| 9 | `app/Http/Controllers/LuotKhamController.php` | Quản lý lượt khám, phiếu khám, hoàn thành khám | `savePhieuKham` bắt buộc `ChanDoan` cứng; `completeExamine` chưa chặn khi có chỉ định `CHO_KET_QUA`; chưa hỗ trợ chuyển `DANG_KHAM` $\leftrightarrow$ `CHO_KET_QUA` $\leftrightarrow$ `CHO_KHAM_LAI` | Cải tiến: Cho phép lưu chẩn đoán sơ bộ/nháp; tự động chuyển trạng thái; chặn hoàn thành nếu còn chỉ định chưa xong | Nâng cấp toàn diện quy trình khám bệnh |
| 10 | `app/Http/Controllers/ChiDinhDichVuController.php` | Bác sĩ chỉ định dịch vụ | Chỉ cho chọn 1 dịch vụ đơn lẻ; chưa cập nhật trạng thái lượt khám sang `CHO_KET_QUA`; chưa gửi thông báo tới KTV | Cho phép nhận mảng `items` hoặc đơn lẻ; chuyển lượt khám sang `CHO_KET_QUA`; bắn thông báo cho CLS | Bác sĩ chỉ định nhanh chóng, đồng bộ quy trình |
| 11 | `resources/js/Layouts/DashboardLayout.tsx` | Layout dùng chung cho các vai trò | TypeScript interface `role` chưa có `'cls'`, header name/code và logo redirect chưa hỗ trợ vai trò 5 | Thêm `role: 'cls'`, roleName `'Cận lâm sàng'`, logo url `/cls/dashboard` | Đồng bộ UI/UX toàn hệ thống |
| 12 | `resources/js/Layouts/PublicLayout.tsx` & `AuthenticatedLayout.tsx` | Layout công khai và tài khoản | Logo và nút Dashboard chưa map role mới | Bổ sung mapping `NHAN_VIEN_CAN_LAM_SANG` $\rightarrow$ `/cls/dashboard` | Đảm bảo điều hướng nhất quán |
| 13 | `resources/js/Pages/Admin/Accounts.tsx` | Màn hình quản lý tài khoản của Admin | `getRoleBadge` chưa có màu sắc/badge cho vai trò CLS | Thêm badge `Cận lâm sàng` (màu teal) | Hiển thị chuyên nghiệp, đồng bộ dropdown tạo tài khoản |
| 14 | `resources/js/Pages/Doctor/Examine.tsx` | Màn hình bác sĩ khám bệnh | Chưa cho chọn nhiều dịch vụ; form phiếu khám chưa tách rõ chẩn đoán sơ bộ và xác định; chưa có nút "Tiếp tục khám lại" khi có kết quả | Cập nhật UI: chọn nhiều dịch vụ, hiển thị kết quả CLS chi tiết, hỗ trợ tiếp tục khám trên cùng lượt khám | Trải nghiệm khám bệnh liền mạch |
| 15 | `resources/js/Pages/CanLamSang/Dashboard.tsx` (Tạo mới) | Chưa tồn tại | Chưa có giao diện làm việc cho Kỹ thuật viên Cận lâm sàng | Xây dựng Dashboard hoàn chỉnh: thẻ thống kê, bộ lọc, bảng danh sách chỉ định, modal nhập kết quả | Giao diện React/Inertia chuyên biệt cho vai trò 5 |
| 16 | `app/Services/NotificationService.php` | Dịch vụ thông báo | Chưa có trigger thông báo chuyên biệt cho quy trình CLS | Bổ sung thông báo: Bác sĩ chỉ định $\rightarrow$ KTV; KTV tiếp nhận $\rightarrow$ Bác sĩ; KTV xong kết quả $\rightarrow$ Bác sĩ & Bệnh nhân | Hệ thống thông báo phủ kín 5 vai trò |
