# BÁO CÁO KIỂM TOÁN XÁC THỰC, ĐIỀU HƯỚNG & LOGIC DASHBOARD SMARTCARE
**Mã tài liệu:** `SMARTCARE_NAVIGATION_DASHBOARD_AUDIT.md`  
**Thời gian lập báo cáo:** 2026-11-03  
**Hệ thống:** Quản lý phòng khám thông minh SmartCare (Laravel 11 + Inertia.js + React/TypeScript + MySQL)  
**Tác giả:** Đội ngũ Kỹ thuật & Kiểm toán Hệ thống

---

## TỔNG QUAN PHÂN LOẠI MỨC ĐỘ LỖI

| Phân loại | Số lượng | Vấn đề chính |
| :--- | :---: | :--- |
| 🔴 **CRITICAL** | **3** | 1. Dashboard Bác sĩ và Lễ tân dùng dữ liệu giả (hardcoded mock data), không kết nối controller/MySQL.<br>2. Chưa đăng nhập truy cập `/book` không bị chặn chuyển hướng login, dẫn đến lỗi 401 khi submit form.<br>3. Người dùng đã đăng nhập truy cập `/login` bị lỗi 403 Forbidden do Laravel 11 mặc định redirect về `/dashboard` (chỉ dành cho Bệnh nhân). |
| 🟠 **MAJOR** | **2** | 1. Khi đã đăng nhập, click logo SmartCare tại tất cả các Layout đều dẫn về trang chủ công khai `/` thay vì Dashboard theo vai trò.<br>2. Quá trình đăng nhập chưa xử lý đầy đủ `url.intended` trong response JSON và route đặt lịch chưa lưu URL mục tiêu. |
| 🟡 **MINOR** | **1** | Admin Dashboard và Patient Dashboard đã dùng dữ liệu thật nhưng còn thiếu đồng bộ một số nhãn hiển thị và liên kết nhanh. |
| 🟢 **PASSED** | **4** | Phân quyền Middleware `CheckRole` chặn chéo các phân hệ đúng chuẩn; Doanh thu thực thu Admin tính chuẩn từ bảng `thanh_toan` (trạng thái `THANH_CONG`/`DA_THANH_TOAN`); Session bảo mật khi đăng xuất; Xóa session an toàn. |

---

## PHẦN 1. KIỂM TOÁN ĐĂNG NHẬP, ĐIỀU HƯỚNG & LOGO

### 1.1. Lỗi điều hướng khi click Logo SmartCare (MAJOR)
- **File và dòng code liên quan:**
  - `resources/js/Layouts/DashboardLayout.tsx` (dòng 52):
    ```tsx
    <Link href="/" className="flex items-center gap-2 text-primary">
        <Stethoscope className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight">SmartCare</span>
    </Link>
    ```
  - `resources/js/Layouts/AuthenticatedLayout.tsx` (dòng 24):
    ```tsx
    <Link href="/">
        <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
    </Link>
    ```
  - `resources/js/Layouts/PublicLayout.tsx` (dòng 21):
    ```tsx
    <Link href="/" className="flex items-center gap-2">
    ```
  - `resources/js/Layouts/GuestLayout.tsx` (dòng 9): `<Link href="/">`
- **Nguyên nhân lỗi:**
  Tất cả các Layout đều đang hardcode thuộc tính `href="/"` cho logo SmartCare. Khi người dùng (Admin, Bác sĩ, Lễ tân, Bệnh nhân) đang làm việc trong phân hệ của mình và nhấn vào logo, hệ thống điều hướng họ văng ra Trang chủ công khai (`/`) thay vì giữ họ ở trung tâm làm việc (Dashboard) của vai trò tương ứng.
- **Luồng hiện tại (Current Flow):**
  1. Người dùng đăng nhập với vai trò Bác sĩ / Lễ tân / Quản trị viên / Bệnh nhân.
  2. Tại thanh điều hướng, người dùng nhấn vào Logo SmartCare.
  3. Trình duyệt điều hướng về trang chủ công khai `/`. Mặc dù session chưa mất nhưng giao diện hiển thị là trang landing page công khai, làm gián đoạn luồng làm việc.
- **Luồng mong muốn (Target Flow):**
  - **Khách vãng lai (Chưa đăng nhập):** Nhấn Logo $\rightarrow$ Điều hướng về Trang chủ công khai (`/`).
  - **Quản trị viên:** Nhấn Logo $\rightarrow$ Điều hướng về `/admin/dashboard`.
  - **Bác sĩ:** Nhấn Logo $\rightarrow$ Điều hướng về `/doctor/dashboard`.
  - **Lễ tân:** Nhấn Logo $\rightarrow$ Điều hướng về `/receptionist/dashboard`.
  - **Bệnh nhân:** Nhấn Logo $\rightarrow$ Điều hướng về `/dashboard`.
  - Tuyệt đối không làm mất session đăng nhập khi click logo.
- **Cách khắc phục đề xuất:**
  - Xây dựng hàm trợ giúp `getHomeUrlByRole(role, authUser)` hoặc đọc trực tiếp từ `usePage().props.auth.user`:
    ```tsx
    const getLogoUrl = () => {
        if (!authUser) return '/';
        const roleName = authUser.vai_tro?.TenVaiTro || role;
        return match (roleName) {
            'QUAN_TRI_VIEN' | 'admin' => '/admin/dashboard',
            'BAC_SI' | 'doctor' => '/doctor/dashboard',
            'LE_TAN' | 'receptionist' => '/receptionist/dashboard',
            default => '/dashboard',
        };
    };
    ```
  - Gắn URL động này vào thẻ `<Link href={getLogoUrl()}>` trên `DashboardLayout.tsx`, `AuthenticatedLayout.tsx` và `PublicLayout.tsx`.

---

### 1.2. Lỗi Redirect khi người dùng đã có session truy cập `/login` (CRITICAL)
- **File và dòng code liên quan:**
  - `bootstrap/app.php` (dòng 13–22):
    ```php
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ```
  - `routes/auth.php` (dòng 13):
    ```php
    Route::middleware('guest')->group(function () {
        Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    ```
  - `app/Http/Controllers/AuthController.php` (dòng 23–26 và dòng 130–140):
    Hàm `showLogin()` không kiểm tra `Auth::check()`.
  - `routes/web.php` (dòng 57–58):
    ```php
    Route::middleware(['auth', 'role:BENH_NHAN'])->group(function () {
        Route::get('/dashboard', [BenhNhanController::class, 'dashboard'])->name('dashboard');
    ```
- **Nguyên nhân lỗi:**
  Trong Laravel 11, middleware `guest` (`RedirectIfAuthenticated`) mặc định chuyển hướng người dùng đã đăng nhập về `/dashboard`. Tuy nhiên, trong `routes/web.php`, route `/dashboard` được bảo vệ bởi middleware `role:BENH_NHAN`. Khi tài khoản có vai trò `QUAN_TRI_VIEN`, `BAC_SI`, hoặc `LE_TAN` đã đăng nhập mà truy cập URL `/login`, middleware `guest` tự động chuyển hướng họ tới `/dashboard`. Tại đây, `CheckRole` phát hiện tài khoản không phải là `BENH_NHAN` nên lập tức ném lỗi **`403 Forbidden: Bạn không có quyền truy cập vào phân hệ này`**.
- **Luồng hiện tại (Current Flow):**
  1. Quản trị viên/Bác sĩ/Lễ tân đăng nhập vào hệ thống.
  2. Người dùng nhập URL `/login` trên thanh địa chỉ.
  3. Laravel chuyển hướng tới `/dashboard`.
  4. Hệ thống báo lỗi `403 Forbidden`.
- **Luồng mong muốn (Target Flow):**
  - Khi đã đăng nhập, người dùng truy cập `/login` hoặc `/register` phải được chuyển hướng êm thuận (302 Redirect) về chính Dashboard tương ứng với vai trò của họ:
    * Quản trị viên $\rightarrow$ `/admin/dashboard`
    * Bác sĩ $\rightarrow$ `/doctor/dashboard`
    * Lễ tân $\rightarrow$ `/receptionist/dashboard`
    * Bệnh nhân $\rightarrow$ `/dashboard`
- **Cách khắc phục đề xuất:**
  1. Cấu hình chuyển hướng người dùng trong `bootstrap/app.php`:
     ```php
     $middleware->redirectUsersTo(function (Request $request) {
         $user = $request->user();
         if (!$user) return '/';
         $role = strtoupper($user->vaiTro?->TenVaiTro ?? '');
         return match ($role) {
             'QUAN_TRI_VIEN' => route('admin.dashboard'),
             'BAC_SI' => route('doctor.dashboard'),
             'LE_TAN' => route('receptionist.dashboard'),
             default => route('dashboard'),
         };
     });
     ```
  2. Thêm kiểm tra chủ động trong `AuthController::showLogin()` và `showRegister()`:
     ```php
     if (Auth::check()) {
         return redirect($this->getRedirectUrlByRole(Auth::user()));
     }
     ```

---

## PHẦN 2. KIỂM TOÁN LUỒNG ĐẶT LỊCH KHI CHƯA ĐĂNG NHẬP

### 2.1. Lỗi Khách chưa đăng nhập vào `/book` không được chuyển hướng đăng nhập (CRITICAL)
- **File và dòng code liên quan:**
  - `routes/web.php` (dòng 26):
    ```php
    // Public routes
    Route::get('/book', [BenhNhanController::class, 'bookAppointmentView'])->name('book');
    ```
  - `resources/js/Pages/Welcome.tsx` (dòng 25–31):
    `<Link href="/book">Đặt lịch khám</Link>`
  - `resources/js/Layouts/PublicLayout.tsx` (dòng 53):
    `<Link href="/book">Đặt lịch khám</Link>`
  - `app/Http/Controllers/BenhNhanController.php` (dòng 412–431):
    Hàm `bookAppointmentView` không kiểm tra `Auth::check()`, trả về giao diện `Patient/BookAppointment` với `auth.user = null`.
  - `resources/js/Pages/Patient/BookAppointment.tsx` (dòng 149–157 và dòng 181):
    Giao diện hiển thị Layout Bệnh nhân, nhưng khi nhấn Submit thì gọi `axios.post('/appointments')` dẫn tới lỗi 401 Unauthorized.
- **Nguyên nhân lỗi:**
  Route `/book` được đặt trong nhóm Public routes thay vì được bảo vệ bằng middleware xác thực `auth`. Do đó, khách vãng lai bấm "Đặt lịch khám" thì hệ thống vẫn cho phép vào trang đặt lịch, hiển thị đầy đủ bác sĩ, ca khám, cho phép nhập lý do. Chỉ đến bước cuối cùng (khi nhấn nút Xác nhận Đặt lịch), request gửi đến `/appointments` (vốn có middleware `auth`) mới bị chặn lại với mã lỗi 401. Trải nghiệm này vi phạm nguyên tắc nghiệp vụ của SmartCare: **Yêu cầu đăng nhập trước khi tiến hành quy trình đặt lịch**.
- **Luồng hiện tại (Current Flow):**
  1. Khách chưa đăng nhập nhấn nút "Đặt lịch khám" trên trang chủ hoặc header.
  2. Trình duyệt mở trang `/book`.
  3. Khách chọn chuyên khoa, chọn bác sĩ, chọn ngày, chọn ca khám, nhập triệu chứng.
  4. Khách nhấn "Xác nhận đặt lịch khám".
  5. Hệ thống báo lỗi "Unauthenticated" hoặc lỗi đỏ trên màn hình. Lịch hẹn không được tạo và dữ liệu thao tác bị gián đoạn.
- **Luồng mong muốn (Target Flow):**
  1. Khách chưa đăng nhập bấm nút "Đặt lịch khám".
  2. Hệ thống phát hiện chưa đăng nhập, tự động lưu lại URL mong muốn (`url.intended = /book`).
  3. Hệ thống điều hướng khách đến trang Đăng nhập (`/login`) kèm thông báo: *"Vui lòng đăng nhập để thực hiện đặt lịch khám bệnh."*
  4. Người dùng nhập thông tin đăng nhập thành công.
  5. Hệ thống đọc `url.intended` và tự động điều hướng người dùng quay lại đúng trang `/book`.
  6. Người dùng thực hiện các bước: chọn chuyên khoa $\rightarrow$ chọn bác sĩ $\rightarrow$ chọn ngày $\rightarrow$ chọn ca khám $\rightarrow$ nhập lý do.
  7. Backend (`LichHenController::store`) kiểm tra quyền sở hữu hồ sơ bệnh nhân, sức chứa còn lại của ca khám (`SoLuongConNhan > 0`), lưu lịch hẹn vào MySQL và trả về mã lịch hẹn thành công.
  8. Nếu session hết hạn trong lúc đang ở trang `/book`: Khi nhấn nút Xác nhận, hệ thống bắt mã lỗi 401, hiển thị thông báo phiên làm việc hết hạn và đưa về trang `/login`.
- **Cách khắc phục đề xuất:**
  1. Trong `BenhNhanController::bookAppointmentView`:
     ```php
     public function bookAppointmentView(Request $request)
     {
         if (!Auth::check()) {
             session(['url.intended' => route('book')]);
             return redirect()->route('login')->with('info', 'Vui lòng đăng nhập tài khoản để đặt lịch khám bệnh.');
         }
         ...
     ```
  2. Trong `AuthController::login`:
     Đảm bảo cả response redirect HTML lẫn response JSON đều ưu tiên lấy `session()->pull('url.intended', $redirectUrl)`.
  3. Trong `BookAppointment.tsx`: Bắt lỗi 401 tại `handleSubmit` để nếu session timeout thì điều hướng êm thuận về `/login`.

---

## PHẦN 3. KIỂM TOÁN TÍNH CHÍNH XÁC & TOÀN VẸN CỦA CÁC DASHBOARD

### 3.1. Dashboard Bác sĩ (Doctor Dashboard) – Dữ liệu giả hardcoded (CRITICAL)
- **File và dòng code liên quan:**
  - `routes/web.php` (dòng 80):
    ```php
    Route::get('/dashboard', function () { return Inertia::render('Doctor/Dashboard'); })->name('dashboard');
    ```
  - `resources/js/Pages/Doctor/Dashboard.tsx` (dòng 23–33):
    ```tsx
    const stats = [
        { title: 'Lịch khám hôm nay', value: '12', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Đang chờ khám', value: '4', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Đã khám xong', value: '6', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100' },
    ];

    const queue = [
        { id: 'BN01', name: 'Trần Văn D', age: 45, time: '14:00', status: 'Đang chờ', reason: 'Đau tức ngực' },
        { id: 'BN02', name: 'Nguyễn Thị E', age: 32, time: '14:30', status: 'Đang chờ', reason: 'Kiểm tra huyết áp' },
        { id: 'BN03', name: 'Lê Văn F', age: 28, time: '15:00', status: 'Chưa đến', reason: 'Tái khám' },
    ];
    ```
- **Nguyên nhân lỗi:**
  Route `/doctor/dashboard` chỉ là một Closure rỗng, không truyền bất kỳ props nào từ database. File React `Doctor/Dashboard.tsx` hardcode toàn bộ số liệu (12, 4, 6) và danh sách bệnh nhân chờ khám (Trần Văn D, Nguyễn Thị E, Lê Văn F). Số liệu hoàn toàn tách rời với dữ liệu thật trong MySQL.
- **Đối chiếu với cấu trúc MySQL thực tế:**
  - Bác sĩ đăng nhập: Liên kết tài khoản qua `tai_khoan.MaTaiKhoan` $\rightarrow$ `bac_si.MaTaiKhoan` $\rightarrow$ lấy `MaBacSi`.
  - **Lịch khám hôm nay:** `LichHen` thuộc các `CaKham` có `lich_lam_viec.MaBacSi = $maBacSi` và `lich_lam_viec.NgayLamViec = CURDATE()`.
  - **Bệnh nhân đang chờ khám:** `LuotKham` có `MaBacSi = $maBacSi`, `TrangThai = 'DANG_CHO'` và `DATE(ThoiGianTiepNhan) = CURDATE()`.
  - **Lượt khám đang thực hiện:** `LuotKham` có `MaBacSi = $maBacSi` và `TrangThai = 'DANG_KHAM'`.
  - **Lượt khám đã hoàn thành hôm nay:** `LuotKham` có `MaBacSi = $maBacSi`, `TrangThai = 'HOAN_THANH'` và `DATE(ThoiGianTiepNhan) = CURDATE()`.
  - **Hàng chờ thực tế:** Lấy danh sách từ `LuotKham` join `benh_nhan` hôm nay của bác sĩ đó.
- **Cách khắc phục đề xuất:**
  - Viết method `dashboard(Request $request)` trong `BacSiController` (hoặc Controller chuyên trách), truy vấn số liệu thực từ các bảng `luot_kham`, `lich_hen`, `ca_kham`, `lich_lam_viec`.
  - Sửa `routes/web.php`: Trỏ route `/doctor/dashboard` về `[BacSiController::class, 'dashboard']`.
  - Cập nhật `Doctor/Dashboard.tsx` để render dữ liệu nhận được từ controller props.

---

### 3.2. Dashboard Lễ tân (Receptionist Dashboard) – Dữ liệu giả hardcoded (CRITICAL)
- **File và dòng code liên quan:**
  - `routes/web.php` (dòng 124):
    ```php
    Route::get('/dashboard', function () { return Inertia::render('Receptionist/Dashboard'); })->name('dashboard');
    ```
  - `resources/js/Pages/Receptionist/Dashboard.tsx` (dòng 26–36):
    ```tsx
    const stats = [
        { title: 'Lịch hẹn hôm nay', value: '45', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Đã tiếp nhận', value: '30', icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-100' },
        { title: 'Chưa đến', value: '15', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const appointments = [
        { id: 'BOOK_827361', name: 'Nguyễn Văn An', time: '09:00', doctor: 'BS. Nguyễn Văn A', status: 'Chưa đến' },
        { id: 'BOOK_827362', name: 'Trần Thị Bình', time: '09:30', doctor: 'BS. Lê Văn C', status: 'Đã tiếp nhận' },
        { id: 'BOOK_827363', name: 'Lê Văn Cường', time: '10:00', doctor: 'BS. Trần Thị B', status: 'Chờ thanh toán' },
    ];
    ```
- **Nguyên nhân lỗi:**
  Tương tự Bác sĩ, route `/receptionist/dashboard` là Closure rỗng, không có Controller. Màn hình Lễ tân hardcode 100% dữ liệu thống kê (45, 30, 15) và bảng lịch hẹn giả (BOOK_827361...).
- **Đối chiếu với cấu trúc MySQL thực tế:**
  - **Lịch hẹn trong ngày:** `LichHen::whereHas('caKham.lichLamViec', fn($q) => $q->whereDate('NgayLamViec', CURDATE()))->count()`.
  - **Chờ tiếp nhận:** Lịch hẹn hôm nay có `TrangThai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN')`.
  - **Đã tiếp nhận:** Lịch hẹn hôm nay có `TrangThai = 'DA_TIEP_NHAN'`.
  - **Lượt khám đang diễn ra:** `LuotKham::where('TrangThai', 'DANG_KHAM')->whereDate('ThoiGianTiepNhan', CURDATE())->count()`.
  - **Hóa đơn chưa thanh toán:** `HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])->count()`.
  - **Doanh thu thực thu trong ngày:** `ThanhToan::whereDate('ThoiGianThanhToan', CURDATE())->whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien')`.
  - **Danh sách lịch hẹn trong ngày:** Eager loading `benhNhan`, `caKham.lichLamViec.bacSi` từ bảng `lich_hen`.
- **Cách khắc phục đề xuất:**
  - Viết method `dashboard(Request $request)` trong `LichHenController` (hoặc `LeTanController`).
  - Sửa `routes/web.php`: Trỏ route `/receptionist/dashboard` về Controller thực tế.
  - Cập nhật `Receptionist/Dashboard.tsx` nhận và render props từ MySQL.

---

### 3.3. Dashboard Quản trị viên (Admin Dashboard) (PASSED / TỐT)
- **File và dòng code liên quan:**
  - `app/Http/Controllers/AdminController.php` (dòng 33–139).
  - `resources/js/Pages/Admin/Dashboard.tsx` (dòng 53–350).
- **Kiểm tra nghiệp vụ doanh thu và số liệu:**
  - **Doanh thu thực tế (`actualRevenue`):** Tính từ `ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien')`. Hoàn toàn tuân thủ yêu cầu: **Không tính trên hóa đơn chưa thanh toán**.
  - **Tổng công nợ (`totalDebt`):** Tính từ `ConLai` của các hóa đơn `CHUA_THANH_TOAN` và `THANH_TOAN_MOT_PHAN`.
  - **Tổng tài khoản, bệnh nhân, bác sĩ, lịch hẹn:** Query trực tiếp qua Eloquent count, không có tình trạng đếm trùng JOIN.
  - **Biểu đồ:** Biểu đồ lượt khám 7 ngày và biểu đồ doanh thu 6 tháng đều được query động theo mốc thời gian thực tế.
- **Điểm cần hoàn thiện nhỏ:**
  - Nhãn hiển thị "Bác sĩ hoạt động": `activeDoctors` đếm các bác sĩ có trạng thái `HOAT_DONG` hoặc `DANG_LAM_VIEC`. Cần truyền thêm `totalDoctors = BacSi::count()` để Admin nắm được cả tổng số nhân sự và số lượng đang làm việc.

---

### 3.4. Dashboard Bệnh nhân (Patient Dashboard) (PASSED / TỐT)
- **File và dòng code liên quan:**
  - `app/Http/Controllers/BenhNhanController.php` (dòng 238–319).
  - `resources/js/Pages/Patient/Dashboard.tsx` (dòng 26–460).
- **Kiểm tra nghiệp vụ:**
  - Đã truy vấn dữ liệu từ MySQL: `upcomingAppointment`, `upcomingCount`, `completedVisits`, `prescriptionsCount`, `unpaidCount`, `unpaidDebt`, `recentVisits`.
  - Phân quyền: Kiểm tra chặt chẽ `$user->isBenhNhan()` và lấy đúng `MaBenhNhan` của tài khoản đang đăng nhập, chống IDOR hoàn toàn.

---

## PHẦN 4. KIỂM TOÁN TÍNH NHẤT QUÁN SAU KHI THAO TÁC (DATA CONSISTENCY)

| Nghiệp vụ thao tác | Tác động dữ liệu MySQL | Phản ánh trên Dashboard hiện tại | Đánh giá & Rủi ro |
| :--- | :--- | :--- | :--- |
| **1. Bệnh nhân tạo lịch hẹn mới** | Thêm 1 dòng vào `lich_hen` với trạng thái `CHO_XAC_NHAN` hoặc `DA_XAC_NHAN` | - Patient: **Cập nhật ngay**<br>- Admin: **Cập nhật ngay**<br>- Receptionist: **KHÔNG ĐỔI** (do dùng mock data)<br>- Doctor: **KHÔNG ĐỔI** (do dùng mock data) | 🔴 Không nhất quán ở phân hệ Lễ tân & Bác sĩ. |
| **2. Bệnh nhân / Lễ tân hủy lịch hẹn** | Cập nhật `lich_hen.TrangThai = 'DA_HUY'` | - Patient: Giảm số lịch hẹn sắp tới<br>- Admin: Biểu đồ lịch hẹn cập nhật cột 'Đã hủy'<br>- Receptionist: **KHÔNG ĐỔI** | 🔴 Lễ tân không thấy lịch hẹn đã bị hủy. |
| **3. Lễ tân tiếp nhận bệnh nhân** | Cập nhật `lich_hen.TrangThai = 'DA_TIEP_NHAN'`, tạo `luot_kham` mới với `TrangThai = 'DANG_CHO'` | - Admin: Cập nhật chỉ số<br>- Doctor: **KHÔNG ĐỔI** (Bác sĩ không thấy bệnh nhân mới vào hàng chờ) | 🔴 Bác sĩ không thể tiếp nhận khám theo thời gian thực nếu chỉ nhìn Dashboard. |
| **4. Bác sĩ hoàn thành khám** | Cập nhật `luot_kham.TrangThai = 'HOAN_THANH'` | - Admin: `completedVisits` tăng 1<br>- Patient: `completedVisits` tăng 1<br>- Doctor: **KHÔNG ĐỔI** (vẫn giữ số 6 giả lập) | 🔴 Bác sĩ không theo dõi được năng suất làm việc thật. |
| **5. Tạo hóa đơn & Thanh toán** | Tạo `hoa_don`, thêm bản ghi `thanh_toan` trạng thái `THANH_CONG` | - Admin: `actualRevenue` tăng đúng bằng số tiền thanh toán<br>- Patient: `unpaidDebt` giảm<br>- Receptionist: **KHÔNG ĐỔI** | 🔴 Lễ tân không kiểm soát được doanh thu ca làm việc. |
| **6. Thêm Bác sĩ / Bệnh nhân mới** | Thêm bản ghi `bac_si` hoặc `benh_nhan` | - Admin: `totalPatients` hoặc `activeDoctors` tăng ngay lập tức | 🟢 Hoạt động chính xác. |

---

## PHẦN 5. KẾ HOẠCH KHẮC PHỤC & BẢO ĐẢM TOÀN VẸN (IMPLEMENTATION PLAN)

Sau khi báo cáo được rà soát và thông qua, các bước chỉnh sửa sẽ được thực hiện tuần tự theo nguyên tắc: **Không xóa dữ liệu, không migrate:fresh, không làm hỏng các test suite đã PASS**:

### Bước 1: Khắc phục điều hướng Logo & Redirect Đăng nhập
1. Sửa `resources/js/Layouts/DashboardLayout.tsx`, `AuthenticatedLayout.tsx`, `PublicLayout.tsx`: Thay link logo bằng route tương ứng theo vai trò.
2. Sửa `bootstrap/app.php`: Đăng ký `$middleware->redirectUsersTo(...)` chuyển hướng người dùng theo 4 vai trò.
3. Sửa `AuthController.php`: Thêm kiểm tra `Auth::check()` trong `showLogin()` và `showRegister()`.

### Bước 2: Hoàn thiện luồng Đặt lịch khi chưa đăng nhập
1. Sửa `BenhNhanController::bookAppointmentView`: Nếu khách chưa đăng nhập, lưu `session(['url.intended' => route('book')])` và chuyển hướng về `/login` kèm thông báo.
2. Cập nhật `AuthController::login`: Sử dụng `session()->pull('url.intended', $redirectUrl)` cho cả Inertia và JSON response.
3. Cập nhật `BookAppointment.tsx`: Bắt lỗi 401 khi submit form để điều hướng về `/login` nếu phiên làm việc hết hạn.

### Bước 3: Thay thế dữ liệu Mock của Dashboard Bác sĩ & Lễ tân bằng dữ liệu MySQL
1. Bổ sung `BacSiController::dashboard`: Truy vấn thống kê ca khám, lượt khám chờ, lượt khám hoàn thành và danh sách bệnh nhân chờ trong ngày của bác sĩ đăng nhập.
2. Bổ sung `LichHenController::receptionistDashboard` (hoặc `LeTanController::dashboard`): Truy vấn số lịch hẹn trong ngày, tiếp nhận, hàng chờ, hóa đơn chưa thanh toán và doanh thu thực thu trong ngày.
3. Trỏ routes `/doctor/dashboard` và `/receptionist/dashboard` về Controller tương ứng trong `routes/web.php`.
4. Cập nhật giao diện `Doctor/Dashboard.tsx` và `Receptionist/Dashboard.tsx` render props thật, loại bỏ hoàn toàn mock data hardcode.

### Bước 4: Viết bộ kiểm thử hồi quy tự động (Command `test:audit-nav-dashboard`)
Kiểm thử tự động:
- Kiểm tra link Logo cho cả 4 vai trò.
- Kiểm tra truy cập `/login` khi đã có session không bị 403.
- Kiểm tra truy cập `/book` khi là khách $\rightarrow$ redirect `/login` kèm `url.intended`.
- Kiểm tra đăng nhập xong $\rightarrow$ redirect về đúng `/book`.
- Kiểm tra dữ liệu Dashboard của cả 4 vai trò khớp 100% với câu truy vấn trực tiếp trên MySQL.
- Chạy toàn bộ 15 test suites hiện có để bảo đảm không xảy ra hồi quy.

---
*Báo cáo được hoàn thành và bảo lưu đầy đủ căn cứ mã nguồn. Tuyệt đối chưa can thiệp sửa đổi code cho đến khi có sự thống nhất.*
