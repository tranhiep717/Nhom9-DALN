# BÁO CÁO KIỂM TOÁN VÀ KHẮC PHỤC TOÀN DIỆN BẢO MẬT, CSRF & SESSION (PHASE 15)
## DỰ ÁN SMARTCARE – HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÔNG MINH

**Ngày thực hiện:** 04/11/2026  
**Trạng thái kiểm định:** HOÀN TOÀN THÀNH CÔNG (19/19 Test Suite Phase 15 PASS, 122/122 Toàn bộ Regression Test PASS)  
**Tác quyền:** Antigravity Engineering Team  

---

## 1. TỔNG QUAN VÀ NGUYÊN NHÂN GỐC (ROOT CAUSE ANALYSIS)

Trong đợt kiểm định hệ thống sau Phase 14, phát hiện hai nhóm sự cố trọng yếu liên quan đến phiên làm việc (Session), mã xác thực (CSRF Token) và điều hướng vai trò:

### 1.1. Lỗi HTTP 419 (CSRF Token Mismatch) tại chức năng Tiếp nhận bệnh nhân vãng lai (P3)
- **Hiện tượng:** Khi Lễ tân điền form tạo hồ sơ bệnh nhân vãng lai tại Hàng đợi và bấm "Lưu & Tiếp nhận", hệ thống hiển thị thông báo `CSRF token mismatch.`
- **Nguyên nhân gốc:**
  1. Trong file layout gốc [app.blade.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/views/app.blade.php), thẻ `<meta name="csrf-token" content="{{ csrf_token() }}">` chưa được khai báo ở phần `<head>`.
  2. Tại component [Queue.tsx](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Pages/Receptionist/Queue.tsx), hàm `handleCreateNewPatient` sử dụng raw `fetch('/receptionist/patients', ...)` nhưng không tự động đính kèm header `X-CSRF-TOKEN` hoặc `X-XSRF-TOKEN` từ cookie mã hóa của Laravel.
  3. Cấu hình Axios toàn cục trong [bootstrap.ts](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/bootstrap.ts) chưa kích hoạt tính năng tự trích xuất cookie `withXSRFToken = true` của các phiên bản Axios/Laravel mới, dẫn đến các request ngoài Inertia dễ bị trượt xác thực khi trình duyệt không duy trì cookie.

### 1.3. Lỗi Modal "419 | PAGE EXPIRED" hiển thị khi bấm vào các chức năng sau đăng nhập
- **Hiện tượng:** Người dùng đăng nhập thành công vào hệ thống (SPA), nhưng khi bấm vào các chức năng/menu/nút bấm thì màn hình bật lên modal iframe `419 | PAGE EXPIRED`. Sau khi người dùng nhấn F5 (tải lại toàn bộ trang) thì hệ thống lại hoạt động bình thường và không bị lỗi nữa.
- **Nguyên nhân gốc:**
  1. Khi người dùng tải trang đăng nhập lần đầu, Laravel render layout `app.blade.php` kèm thẻ `<meta name="csrf-token">` chứa token của phiên khách (Guest session).
  2. Khi người dùng bấm đăng nhập, Laravel xác thực thành công và thực hiện `$request->session()->regenerate()`. Cơ chế này tạo một phiên mới với Session ID mới và sinh ra một **CSRF Token hoàn toàn mới** (được gửi về trình duyệt qua cookie `XSRF-TOKEN`).
  3. Tuy nhiên, vì SmartCare hoạt động dưới dạng Single Page Application (Inertia SPA), trình duyệt không thực hiện full reload trang. Do đó, thẻ `<meta name="csrf-token">` trong `document.head` vẫn giữ **token cũ của phiên khách**.
  4. Trước đó, trong `bootstrap.ts` có cấu hình request interceptor:
     ```ts
     window.axios.interceptors.request.use((config) => {
         const token = document.head.querySelector('meta[name="csrf-token"]');
         if (token?.content) config.headers['X-CSRF-TOKEN'] = token.content;
         return config;
     });
     ```
  5. Do Inertia 2.0 sử dụng chính instance `axios` này cho mọi request, khi người dùng bấm bất kỳ link hay nút nào, interceptor đã ép header `X-CSRF-TOKEN` gửi đi token cũ từ thẻ meta. Laravel ưu tiên kiểm tra header `X-CSRF-TOKEN` trước cookie `XSRF-TOKEN`, thấy không khớp với session hiện tại nên trả về **HTTP 419**.
  6. Khi người dùng F5 tải lại trang, Laravel render lại thẻ meta mới khớp với session, nên lỗi tạm thời biến mất cho đến lần đăng nhập kế tiếp.
- **Biện pháp xử lý triệt để:**
  1. **Bỏ ép token cũ từ meta trong Axios Interceptor:** Xóa bỏ đoạn mã ép `X-CSRF-TOKEN` tĩnh từ `document.head`. Axios với `withXSRFToken = true` và `withCredentials = true` sẽ tự động đọc cookie `XSRF-TOKEN` động (luôn được cập nhật tự động sau mỗi request/login) và gửi qua header `X-XSRF-TOKEN`.
  2. **Đồng bộ thẻ meta qua sự kiện SPA navigate:** Trong `app.tsx`, lắng nghe sự kiện `router.on('navigate')` để cập nhật lại thuộc tính `content` của `<meta name="csrf-token">` mỗi khi Inertia chuyển trang, bảo đảm thẻ meta luôn mới nhất.
  3. **Xử lý sự kiện `invalid` của Inertia:** Lắng nghe `router.on('invalid')`. Khi gặp mã lỗi 419 (do session hết hạn thật sự sau thời gian dài không thao tác), hệ thống sẽ gọi `event.preventDefault()` để triệt tiêu hoàn toàn modal popup iframe màu xám và tự động `window.location.reload()` để người dùng tiếp tục làm việc mượt mà.

---

## 2. CÁC BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ ĐÃ THỰC HIỆN

### 2.1. Cấu hình xác thực và điều hướng phân quyền đa vai trò
1. **Sửa `AuthenticatedSessionController.php`:**
   - Sau khi `Auth::login()`, hệ thống truy vấn vai trò thực tế (`vaiTro->TenVaiTro`).
   - Tự động điều hướng chính xác về dashboard chuyên trách:
     - `QUAN_TRI_VIEN` -> `/admin/dashboard`
     - `BAC_SI` -> `/doctor/dashboard`
     - `LE_TAN` -> `/receptionist/dashboard`
     - `NHAN_VIEN_CAN_LAM_SANG` -> `/cls/dashboard`
     - `BENH_NHAN` -> `/dashboard` (hoặc `/patient/dashboard`)
2. **Cấu hình Fallback an toàn cho `/dashboard`:**
   - Tách `/dashboard` khỏi nhóm `role:BENH_NHAN`, áp dụng `auth` thông thường.
   - Tại [BenhNhanController.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/BenhNhanController.php) và `redirectUsersTo` trong [bootstrap/app.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/bootstrap/app.php): nếu người dùng là Bác sĩ, Lễ tân, Quản trị viên hay CLS vô tình gõ trực tiếp URL `/dashboard`, hệ thống tự động redirect về đúng dashboard của họ thay vì ném lỗi 403.
   - Các route nghiệp vụ đặc thù như `/admin/*`, `/doctor/*`, `/receptionist/*`, `/cls/*` vẫn giữ nguyên kiểm soát vai trò chặt chẽ bằng middleware `CheckRole` (trả về 403 đối với vai trò không được phép).

### 2.2. Chuẩn hóa cơ chế bảo vệ CSRF và Session 2 lớp
1. **Bổ sung Meta Tag CSRF vào Master Layout:**
   - Trong [resources/views/app.blade.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/views/app.blade.php):
     ```html
     <meta name="csrf-token" content="{{ csrf_token() }}">
     ```
2. **Chia sẻ Token qua Inertia Middleware:**
   - Trong [HandleInertiaRequests.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Middleware/HandleInertiaRequests.php): chia sẻ `'csrf_token' => fn () => csrf_token()` vào props của Inertia để frontend có thể truy cập bất kỳ lúc nào.
3. **Cấu hình Axios bảo mật toàn cầu:**
   - Trong [resources/js/bootstrap.ts](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/bootstrap.ts):
     - Kích hoạt `axios.defaults.withCredentials = true` (duy trì session cookie trên tất cả request AJAX).
     - Kích hoạt `axios.defaults.withXSRFToken = true` (tự động đọc cookie `XSRF-TOKEN` do Laravel sinh ra).
     - Thêm request interceptor: tự động đính kèm `X-CSRF-TOKEN` từ thẻ meta tag nếu tồn tại, tạo cơ chế bảo vệ kép (cookie + header).
     - Thêm response interceptor xử lý lỗi HTTP 419: hiển thị thông báo rõ ràng "Phiên làm việc đã hết hạn hoặc mã xác thực không hợp lệ", hướng dẫn người dùng làm mới trang mà không làm mất dữ liệu nhập trên form.
4. **Chuẩn hóa toàn bộ request frontend từ `fetch()` sang `axios`:**
   - Trong [Receptionist/Queue.tsx](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Pages/Receptionist/Queue.tsx):
     - Thay thế `fetch` bằng `axios.post('/receptionist/patients', ...)` có đính kèm đầy đủ CSRF token.
     - Thay thế tìm kiếm bệnh nhân bằng `axios.get('/receptionist/patients/search', ...)`.
     - Thêm trạng thái khóa submit kép (`isCreatingPatient` flag) và vô hiệu hóa nút bấm trong khi request đang gửi, ngăn chặn click liên tục tạo nhiều hồ sơ trùng lặp.
   - Trong [Receptionist/Patients.tsx](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Pages/Receptionist/Patients.tsx):
     - Chuyển đổi gọi API chi tiết hồ sơ bệnh nhân từ `fetch` sang `axios.get()`.

---

## 3. DANH SÁCH TỆP TIN ĐÃ CHỈNH SỬA VÀ TẠO MỚI

| STT | Tệp tin | Hành động | Mục đích |
|:---:|:---|:---:|:---|
| 1 | `resources/views/app.blade.php` | Cập nhật | Thêm `<meta name="csrf-token">` trong `<head>` |
| 2 | `resources/js/bootstrap.ts` | Cập nhật | Cấu hình `withCredentials`, `withXSRFToken`, Request/Response Interceptor |
| 3 | `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Cập nhật | Điều hướng người dùng sau đăng nhập theo đúng vai trò thực tế |
| 4 | `app/Http/Controllers/BenhNhanController.php` | Cập nhật | Safe redirect khi nhân viên truy cập `/dashboard`, `/profile`, `/records` |
| 5 | `bootstrap/app.php` | Cập nhật | Khai báo `redirectUsersTo` nhất quán theo vai trò |
| 6 | `app/Http/Middleware/HandleInertiaRequests.php` | Cập nhật | Chia sẻ `csrf_token` vào Inertia props |
| 7 | `routes/web.php` | Cập nhật | Tách `/dashboard` chung có điều hướng tự động, giữ `/patient/*` cho bệnh nhân |
| 8 | `resources/js/Pages/Receptionist/Queue.tsx` | Cập nhật | Dùng Axios cho tạo BN vãng lai & tìm kiếm, khóa double-submit |
| 9 | `resources/js/Pages/Receptionist/Patients.tsx` | Cập nhật | Dùng Axios cho popup xem chi tiết hồ sơ bệnh nhân |
| 10 | `tests/Feature/Phase15SecurityCsrfSessionAuditTest.php` | Tạo mới | Bộ 19 kiểm thử tự động toàn diện về CSRF, Session, Login và RBAC |

---

## 4. MA TRẬN BẢO MẬT VÀ PHÂN QUYỀN 4 VAI TRÒ + KỸ THUẬT VIÊN CLS

| Phân hệ / URL | Bệnh nhân (`BENH_NHAN`) | Lễ tân (`LE_TAN`) | Bác sĩ (`BAC_SI`) | Quản trị viên (`QUAN_TRI_VIEN`) | CLS (`NHAN_VIEN_CAN_LAM_SANG`) | Khách vãng lai (Chưa đăng nhập) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| Trang chủ & Tra cứu (`/`, `/doctors`, `/specialties`, `/medicines`) | **200 OK** | **200 OK** | **200 OK** | **200 OK** | **200 OK** | **200 OK** |
| Đăng nhập (`/login`) & Đăng ký (`/register`) | Redirect Dashboard | Redirect Dashboard | Redirect Dashboard | Redirect Dashboard | Redirect Dashboard | **200 OK** |
| Dashboard mặc định (`/dashboard`) | Render Patient Dashboard | Safe Redirect -> Receptionist | Safe Redirect -> Doctor | Safe Redirect -> Admin | Safe Redirect -> CLS | Redirect -> `/login` (302) |
| Phân hệ Bệnh nhân (`/patient/*`) | **200 OK** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | Redirect -> `/login` (302) |
| Phân hệ Lễ tân (`/receptionist/*`) | **403 Forbidden** | **200 OK** | **403 Forbidden** | **200 OK** (Hỗ trợ) | **403 Forbidden** | Redirect -> `/login` (302) |
| Phân hệ Bác sĩ (`/doctor/*`) | **403 Forbidden** | **403 Forbidden** | **200 OK** | **403 Forbidden** | **403 Forbidden** | Redirect -> `/login` (302) |
| Phân hệ Kỹ thuật viên CLS (`/cls/*`) | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **200 OK** | Redirect -> `/login` (302) |
| Phân hệ Quản trị viên (`/admin/*`) | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **200 OK** | **403 Forbidden** | Redirect -> `/login` (302) |
| Đăng xuất (`POST /logout`) | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/` | 302 -> `/login` |

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST VERIFICATION)

### 5.1. Bộ test chuyên sâu Phase 15 (`Phase15SecurityCsrfSessionAuditTest.php`)
Chạy lệnh: `php artisan test --filter=Phase15SecurityCsrfSessionAuditTest`
- **Kết quả:** **19/19 PASSED** (88 assertions) – Thời gian: **2.22s**

Chi tiết 19 test case đã thực thi:
1. `✓ 01 patient login redirects to patient dashboard`: Bệnh nhân đăng nhập -> Chuyển hướng đúng `/dashboard`.
2. `✓ 02 receptionist login redirects to receptionist dashboard`: Lễ tân đăng nhập -> Chuyển hướng đúng `/receptionist/dashboard` (Hết lỗi 403).
3. `✓ 03 doctor login redirects to doctor dashboard`: Bác sĩ đăng nhập -> Chuyển hướng đúng `/doctor/dashboard` (Hết lỗi 403).
4. `✓ 04 admin login redirects to admin dashboard`: Quản trị viên đăng nhập -> Chuyển hướng đúng `/admin/dashboard`.
5. `✓ 05 cls login redirects to cls dashboard`: KTV CLS đăng nhập -> Chuyển hướng đúng `/cls/dashboard`.
6. `✓ 06 user logout invalidates session and redirects`: Đăng xuất vô hiệu hóa session, xóa xác thực và chuyển hướng về `/`.
7. `✓ 07 relogin after logout succeeds`: Đăng nhập lại ngay sau khi đăng xuất thành công mượt mà.
8. `✓ 08 session persists across multiple get requests`: Session duy trì ổn định qua nhiều request GET liên tiếp của cùng người dùng.
9. `✓ 09 direct dashboard access for non patient redirects safely`: Nhân viên truy cập trực tiếp URL `/dashboard` được chuyển hướng an toàn về trang phù hợp, không bị treo hoặc 403.
10. `✓ 10 unauthorized role gets 403 on restricted subsystems`: Phân quyền RBAC hoạt động chuẩn xác, trả về HTTP 403 khi truy cập trái phép phân hệ khác.
11. `✓ 11 unauthenticated request is redirected or 401`: Chưa đăng nhập truy cập route web bị redirect về `/login` (302); truy cập API trả về HTTP 401.
12. `✓ 12 meta csrf token is rendered in all views`: Thẻ `<meta name="csrf-token">` hiển thị đầy đủ và hợp lệ trên mã nguồn HTML của trang.
13. `✓ 13 post with valid csrf token succeeds`: Các request POST gửi kèm CSRF token hợp lệ được Laravel chấp thuận (200/201).
14. `✓ 14 patient creation prevents duplicate records`: Tạo bệnh nhân kiểm tra trùng số điện thoại chặt chẽ, ngăn ngừa sinh bản ghi rác.
15. `✓ 15 patient book and cancel appointment workflow`: Toàn bộ luồng đặt lịch khám và hủy lịch của bệnh nhân hoạt động thông suốt.
16. `✓ 16 receptionist p2 and p3 intake workflow`: Lễ tân tiếp nhận lịch hẹn (P2 - `DAT_LICH`) và bệnh nhân vãng lai (P3 - `TRUC_TIEP`) thành công, cấp số phiếu đúng chuẩn.
17. `✓ 17 doctor call patient and save exam workflow`: Bác sĩ gọi số khám bệnh, ghi nhận kết quả khám và kết luận bệnh án thành công.
18. `✓ 18 admin account management security`: Quản trị viên quản lý tài khoản an toàn, ngăn chặn việc tạo tài khoản trùng email.
19. `✓ 19 real database untouched`: Cam kết an toàn tuyệt đối cơ sở dữ liệu thật.

### 5.2. Toàn bộ hệ thống kiểm thử hồi quy SmartCare (Regression Test Suite)
Chạy lệnh: `php artisan test --filter="Phase|HybridQueue|QueueManagement"`
- **Kết quả:** **122/122 PASSED** (3,680 assertions) – Thời gian: **12.88s**
- **Tỷ lệ thành công:** **100% (0 lỗi, 0 thất bại)**

### 5.3. Kiểm tra TypeScript & Biên dịch Vite Production
- `npx tsc --noEmit`: **0 lỗi** (Exit Code 0).
- `npm run build`: **Biên dịch thành công trong 17.70s**, 3,501 modules transformed, tạo các asset bundle tối ưu gzip trong thư mục `public/build/`.

---

## 6. KIỂM ĐỊNH AN TOÀN DỮ LIỆU THẬT (DATABASE INTEGRITY AUDIT)

Hệ thống đã kiểm tra trực tiếp cơ sở dữ liệu thật `phong_kham_thong_minh` trên máy chủ MySQL local:
- **Số lượng bảng hiện tại:** **30 bảng** (Đúng chuẩn, không thêm bớt bảng)
- **Số lượng bản ghi lượt khám (`luot_kham`):** **23 bản ghi** (Không phát sinh bản ghi rác nào)
- **Kết luận:** Cơ sở dữ liệu thật được bảo vệ an toàn 100%, không bị ảnh hưởng bởi quá trình kiểm thử và phát triển.

---

## 7. HƯỚNG DẪN KIỂM THỬ THỦ CÔNG TRÊN TRÌNH DUYỆT (BROWSER TESTING GUIDE)

Để xác nhận thực tế trên giao diện trình duyệt web, người dùng có thể thực hiện các bước sau:

1. **Khởi động server phát triển:**
   - Terminal 1: `php artisan serve` (Chạy tại `http://localhost:8000` hoặc `http://127.0.0.1:8000`)
   - Terminal 2: `npm run dev` (nếu muốn xem live reload) hoặc dùng bản build production vừa tạo (`npm run build`).

2. **Kiểm tra đăng nhập từng vai trò:**
   - Mở cửa sổ ẩn danh (Incognito).
   - Đăng nhập Lễ tân: Sau khi đăng nhập, hệ thống sẽ đưa thẳng vào `/receptionist/dashboard` (không còn lỗi 403).
   - Đăng nhập Bác sĩ: Sau khi đăng nhập, hệ thống sẽ đưa thẳng vào `/doctor/dashboard`.

3. **Kiểm tra Tiếp nhận bệnh nhân vãng lai (P3) – Xác nhận hết lỗi CSRF:**
   - Tại giao diện Lễ tân, vào menu "Hàng đợi khám".
   - Bấm nút "Tiếp nhận trực tiếp" / "Thêm bệnh nhân mới".
   - Điền Họ tên, Số điện thoại, chọn Chuyên khoa và Ca khám.
   - Bấm "Lưu & Tiếp nhận":
     - Không còn báo lỗi `CSRF token mismatch.` hay `HTTP 419`.
     - Bệnh nhân được cấp số phiếu P3 thành công và hiển thị ngay trên bảng hàng đợi.
     - Nút lưu bị mờ/khóa trong lúc xử lý để chống bấm nhiều lần liên tiếp.

4. **Lưu ý về Cookie Domain khi test:**
   - Nếu truy cập qua `http://localhost:8000`, hãy duy trì nhất quán domain `localhost`. Tránh việc mở một tab là `localhost` và tab khác là `127.0.0.1` vì session cookie của trình duyệt được phân tách theo từng hostname.

---

*Báo cáo được khởi tạo tự động và lưu trữ tại [SMARTCARE_PHASE_15_SYSTEM_SECURITY_AUDIT.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_PHASE_15_SYSTEM_SECURITY_AUDIT.md).*
