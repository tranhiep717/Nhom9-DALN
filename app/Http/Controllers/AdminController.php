<?php

namespace App\Http\Controllers;

use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BenhNhan;
use App\Models\BacSi;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use App\Models\Thuoc;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\HoaDon;
use App\Models\ThanhToan;
use App\Models\LichLamViec;
use App\Models\CaKham;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminController extends Controller
{
    /**
     * BƯỚC 2: ADMIN DASHBOARD
     * Thống kê tổng quan thời gian thực từ database
     * Tuân thủ: Doanh thu thực tế tính từ các giao dịch thanh toán THANH_CONG, KHÔNG lấy TongTien hóa đơn
     */
    public function dashboard(Request $request): InertiaResponse|JsonResponse
    {
        $today = now()->toDateString();

        // 1. Số liệu thống kê tổng hợp
        $totalPatients = BenhNhan::count();
        $activeDoctors = BacSi::whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC'])->count();
        $totalAccounts = TaiKhoan::count();
        $totalAppointments = LichHen::count();
        
        $todayAppointments = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })->count();

        $completedVisits = LuotKham::where('TrangThai', 'HOAN_THANH')->count();

        $paidInvoicesCount = HoaDon::where('TrangThai', 'DA_THANH_TOAN')->count();
        $unpaidInvoicesCount = HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])->count();

        // Doanh thu thực tế thu được từ bảng thanh_toan (chỉ tính giao dịch thành công: DA_THANH_TOAN hoặc THANH_CONG)
        $actualRevenue = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');

        // Tổng công nợ còn lại của các hóa đơn chưa thu xong (eager load thanhToans tránh N+1 và tránh tính trùng)
        $totalDebt = (float) HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])
            ->with('thanhToans')
            ->get()
            ->sum(function ($inv) {
                return $inv->ConLai ?? max(0, (float)$inv->BenhNhanChiTra - (float)$inv->DaThanhToan);
            });

        // 2. Biểu đồ lượt khám 7 ngày gần nhất
        $visitsChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $count = LuotKham::whereDate('ThoiGianTiepNhan', $date)->count();
            $dayName = now()->subDays($i)->locale('vi')->isoFormat('dd (DD/MM)');
            $visitsChart[] = [
                'date' => $date,
                'name' => $dayName,
                'visits' => $count,
            ];
        }

        // 3. Biểu đồ lịch hẹn theo trạng thái
        $appointmentStats = [
            ['name' => 'Chờ xác nhận', 'value' => LichHen::where('TrangThai', 'CHO_XAC_NHAN')->count(), 'color' => '#F59E0B'],
            ['name' => 'Đã xác nhận', 'value' => LichHen::where('TrangThai', 'DA_XAC_NHAN')->count(), 'color' => '#3B82F6'],
            ['name' => 'Đã tiếp nhận', 'value' => LichHen::where('TrangThai', 'DA_TIEP_NHAN')->count(), 'color' => '#6366F1'],
            ['name' => 'Hoàn thành', 'value' => LichHen::where('TrangThai', 'HOAN_THANH')->count(), 'color' => '#10B981'],
            ['name' => 'Đã hủy', 'value' => LichHen::where('TrangThai', 'DA_HUY')->count(), 'color' => '#EF4444'],
        ];

        // 4. Biểu đồ doanh thu thực thu 6 tháng gần nhất
        $revenueChart = [];
        for ($m = 5; $m >= 0; $m--) {
            $monthDate = now()->subMonths($m);
            $year = $monthDate->year;
            $month = $monthDate->month;
            $monthRev = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
                ->whereYear('ThoiGianThanhToan', $year)
                ->whereMonth('ThoiGianThanhToan', $month)
                ->sum('SoTien');

            $revenueChart[] = [
                'name' => 'Tháng ' . $month . '/' . $year,
                'revenue' => $monthRev,
            ];
        }

        // 5. Tỷ lệ bệnh nhân mới (đăng ký tài khoản trong tháng này) và bệnh nhân cũ
        $newPatientsThisMonth = BenhNhan::whereHas('taiKhoan', function ($q) {
            $q->whereMonth('NgayTao', now()->month)
              ->whereYear('NgayTao', now()->year);
        })->count();
        $oldPatients = max(0, $totalPatients - $newPatientsThisMonth);

        $statsData = [
            'totalPatients' => $totalPatients,
            'activeDoctors' => $activeDoctors,
            'totalAccounts' => $totalAccounts,
            'totalAppointments' => $totalAppointments,
            'todayAppointments' => $todayAppointments,
            'completedVisits' => $completedVisits,
            'paidInvoicesCount' => $paidInvoicesCount,
            'unpaidInvoicesCount' => $unpaidInvoicesCount,
            'actualRevenue' => $actualRevenue,
            'totalDebt' => $totalDebt,
            'visitsChart' => $visitsChart,
            'appointmentStats' => $appointmentStats,
            'revenueChart' => $revenueChart,
            'patientRatio' => [
                ['name' => 'Bệnh nhân mới tháng này', 'value' => $newPatientsThisMonth, 'color' => '#0D9488'],
                ['name' => 'Bệnh nhân cũ', 'value' => $oldPatients, 'color' => '#64748B'],
            ],
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $statsData,
            ]);
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => $statsData,
        ]);
    }

    /**
     * BƯỚC 3: QUẢN LÝ TÀI KHOẢN (Admin/Accounts.tsx)
     */
    public function usersIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = TaiKhoan::query()->with('vaiTro:MaVaiTro,TenVaiTro,MoTa');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenDangNhap', 'like', "%{$search}%")
                  ->orWhere('Email', 'like', "%{$search}%")
                  ->orWhere('MaTaiKhoan', $search);
            });
        }

        if ($roleId = $request->input('role_id')) {
            $query->where('MaVaiTro', $roleId);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $users = $query->orderBy('MaTaiKhoan', 'desc')->get();
        $roles = VaiTro::all();

        // Ẩn mật khẩu tuyệt đối
        $safeUsers = $users->map(function ($u) {
            unset($u->MatKhau);
            return $u;
        });

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $safeUsers,
                'roles' => $roles,
            ]);
        }

        return Inertia::render('Admin/Accounts', [
            'users' => $safeUsers,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role_id', 'status']),
        ]);
    }

    public function usersStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenDangNhap' => ['required', 'string', 'max:50', 'unique:tai_khoan,TenDangNhap', 'regex:/^[a-zA-Z0-9_]+$/'],
            'Email' => ['required', 'email', 'max:100', 'unique:tai_khoan,Email'],
            'MatKhau' => ['required', 'string', 'min:6'],
            'MaVaiTro' => ['required', 'exists:vai_tro,MaVaiTro'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,KHOA'],
        ], [
            'TenDangNhap.required' => 'Vui lòng nhập tên đăng nhập.',
            'TenDangNhap.unique' => 'Tên đăng nhập đã được sử dụng.',
            'TenDangNhap.regex' => 'Tên đăng nhập chỉ chứa chữ cái, chữ số và dấu gạch dưới.',
            'Email.required' => 'Vui lòng nhập email.',
            'Email.unique' => 'Email đã tồn tại trong hệ thống.',
            'MatKhau.min' => 'Mật khẩu phải từ 6 ký tự trở lên.',
            'MaVaiTro.exists' => 'Vai trò không hợp lệ.',
        ]);

        $account = TaiKhoan::create([
            'TenDangNhap' => $validated['TenDangNhap'],
            'Email' => $validated['Email'],
            'MatKhau' => Hash::make($validated['MatKhau']),
            'MaVaiTro' => $validated['MaVaiTro'],
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
            'NgayTao' => now(),
        ]);

        $account->load('vaiTro:MaVaiTro,TenVaiTro');
        unset($account->MatKhau);

        return response()->json([
            'success' => true,
            'message' => 'Tạo tài khoản người dùng thành công.',
            'data' => $account,
        ], 201);
    }

    public function usersUpdate(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'Email' => ['required', 'email', 'max:100', "unique:tai_khoan,Email,{$id},MaTaiKhoan"],
            'MaVaiTro' => ['required', 'exists:vai_tro,MaVaiTro'],
            'MatKhau' => ['nullable', 'string', 'min:6'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,KHOA'],
        ]);

        return DB::transaction(function () use ($currentUser, $validated, $id) {
            $targetUser = TaiKhoan::lockForUpdate()->find($id);

            if (!$targetUser) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
            }

            // Quy tắc bảo mật: Không tự hạ quyền Quản trị viên của chính mình hoặc làm mất Quản trị viên cuối cùng
            $adminRole = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
            if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan && $validated['MaVaiTro'] != $adminRole?->MaVaiTro) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thể tự hạ quyền Quản trị viên của chính tài khoản đang đăng nhập.',
                ], 422);
            }

            // Kiểm tra số lượng Admin hoạt động khi có hành động hạ quyền hoặc khóa Admin
            if ($targetUser->isQuanTriVien()) {
                $isDemoting = ($validated['MaVaiTro'] != $adminRole?->MaVaiTro);
                $isLocking = (!empty($validated['TrangThai']) && $validated['TrangThai'] === 'KHOA' && $targetUser->TrangThai === 'HOAT_DONG');

                if ($isDemoting || $isLocking) {
                    $totalAdmins = TaiKhoan::where('MaVaiTro', $adminRole?->MaVaiTro)
                        ->where('TrangThai', 'HOAT_DONG')
                        ->lockForUpdate()
                        ->count();

                    if ($totalAdmins <= 1) {
                        return response()->json([
                            'success' => false,
                            'message' => $isDemoting 
                                ? 'Không thể đổi vai trò của Quản trị viên duy nhất còn hoạt động trong hệ thống.' 
                                : 'Không thể khóa Quản trị viên duy nhất còn hoạt động trong hệ thống.',
                        ], 422);
                    }
                }
            }

            $updateData = [
                'Email' => $validated['Email'],
                'MaVaiTro' => $validated['MaVaiTro'],
            ];

            if (!empty($validated['TrangThai'])) {
                // Không cho phép tự khóa tài khoản của chính mình
                if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan && $validated['TrangThai'] === 'KHOA') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Bạn không thể tự khóa tài khoản của chính mình.',
                    ], 422);
                }
                $updateData['TrangThai'] = $validated['TrangThai'];
            }

            if (!empty($validated['MatKhau'])) {
                $updateData['MatKhau'] = Hash::make($validated['MatKhau']);
            }

            $targetUser->update($updateData);
            $targetUser->load('vaiTro:MaVaiTro,TenVaiTro');
            unset($targetUser->MatKhau);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật tài khoản thành công.',
                'data' => $targetUser,
            ]);
        });
    }

    public function usersToggleStatus(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        return DB::transaction(function () use ($currentUser, $id) {
            $targetUser = TaiKhoan::lockForUpdate()->find($id);

            if (!$targetUser) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
            }

            // Quy tắc bảo mật: Không tự khóa tài khoản đang đăng nhập
            if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thể tự khóa tài khoản quản trị đang đăng nhập của mình.',
                ], 422);
            }

            $newStatus = ($targetUser->TrangThai === 'HOAT_DONG') ? 'KHOA' : 'HOAT_DONG';

            // Bảo vệ Admin cuối cùng: Không thể khóa Quản trị viên duy nhất đang hoạt động
            if ($targetUser->isQuanTriVien() && $newStatus === 'KHOA' && $targetUser->TrangThai === 'HOAT_DONG') {
                $adminRole = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
                $totalActiveAdmins = TaiKhoan::where('MaVaiTro', $adminRole?->MaVaiTro)
                    ->where('TrangThai', 'HOAT_DONG')
                    ->lockForUpdate()
                    ->count();

                if ($totalActiveAdmins <= 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không thể khóa Quản trị viên duy nhất còn hoạt động trong hệ thống.',
                    ], 422);
                }
            }

            $targetUser->update(['TrangThai' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => $newStatus === 'HOAT_DONG' ? 'Đã mở khóa tài khoản thành công.' : 'Đã khóa tài khoản thành công.',
                'data' => ['TrangThai' => $newStatus],
            ]);
        });
    }

    /**
     * BƯỚC 4: QUẢN LÝ BỆNH NHÂN (Admin/Patients.tsx)
     */
    public function patientsIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = BenhNhan::query()->with([
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai',
            'luotKhams' => fn($q) => $q->select('MaLuotKham', 'MaBenhNhan', 'TrangThai', 'ThoiGianTiepNhan'),
        ])->withCount(['luotKhams', 'lichHens']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%")
                  ->orWhere('MaBenhNhan', $search);
            });
        }

        if ($gender = $request->input('gender')) {
            $query->where('GioiTinh', $gender);
        }

        $patients = $query->orderBy('MaBenhNhan', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $patients,
                'total' => $patients->count(),
            ]);
        }

        return Inertia::render('Admin/Patients', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'gender']),
        ]);
    }

    public function patientsShow(int $id): JsonResponse
    {
        $patient = BenhNhan::with([
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai',
            'lichHens.caKham.lichLamViec.bacSi',
            'luotKhams.bacSi.chuyenKhoa',
            'luotKhams.phieuKham',
            'luotKhams.donThuoc.chiTietDonThuocs.thuoc',
            'luotKhams.chiDinhDichVus.dichVu',
            'luotKhams.hoaDon.thanhToans',
        ])->find($id);

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ bệnh nhân.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    /**
     * BƯỚC 5: QUẢN LÝ CHUYÊN KHOA (Admin/Specialties.tsx)
     */
    public function specialtiesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = ChuyenKhoa::query()->withCount('bacSis')->with(['bacSis' => function ($q) {
            $q->select('MaBacSi', 'MaChuyenKhoa', 'HoTen', 'HocVi', 'TrangThai');
        }]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenChuyenKhoa', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $specialties = $query->orderBy('TenChuyenKhoa', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $specialties,
            ]);
        }

        return Inertia::render('Admin/Specialties', [
            'specialties' => $specialties,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function specialtiesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:100', 'unique:chuyen_khoa,TenChuyenKhoa'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenChuyenKhoa.required' => 'Vui lòng nhập tên chuyên khoa.',
            'TenChuyenKhoa.unique' => 'Tên chuyên khoa đã tồn tại.',
        ]);

        $specialty = ChuyenKhoa::create([
            'TenChuyenKhoa' => $validated['TenChuyenKhoa'],
            'MoTa' => $validated['MoTa'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm chuyên khoa mới thành công.',
            'data' => $specialty,
        ], 201);
    }

    public function specialtiesUpdate(Request $request, int $id): JsonResponse
    {
        $specialty = ChuyenKhoa::find($id);
        if (!$specialty) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy chuyên khoa.'], 404);
        }

        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:100', "unique:chuyen_khoa,TenChuyenKhoa,{$id},MaChuyenKhoa"],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ]);

        // Nếu chuyển sang NGUNG_HOAT_DONG: Kiểm tra xem có ca khám / lịch hẹn sắp tới không
        if (isset($validated['TrangThai']) && $validated['TrangThai'] === 'NGUNG_HOAT_DONG' && $specialty->TrangThai !== 'NGUNG_HOAT_DONG') {
            $hasActiveAppointments = LichHen::whereHas('caKham.lichLamViec.bacSi', function ($q) use ($id) {
                $q->where('MaChuyenKhoa', $id);
            })->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])->exists();

            if ($hasActiveAppointments) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chuyên khoa đang có lịch hẹn chờ khám của bệnh nhân. Không thể ngừng hoạt động vào lúc này.',
                ], 422);
            }
        }

        $specialty->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật chuyên khoa thành công.',
            'data' => $specialty->fresh(),
        ]);
    }

    /**
     * BƯỚC 7: QUẢN LÝ DỊCH VỤ (Admin/Services.tsx)
     */
    public function servicesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = DichVu::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenDichVu', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('LoaiDichVu', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $services = $query->orderBy('TenDichVu', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $services,
            ]);
        }

        return Inertia::render('Admin/Services', [
            'services' => $services,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function servicesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenDichVu' => ['required', 'string', 'max:150', 'unique:dich_vu,TenDichVu'],
            'DonGia' => ['required', 'numeric', 'min:0'],
            'LoaiDichVu' => ['required', 'string', 'max:50'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenDichVu.required' => 'Vui lòng nhập tên dịch vụ.',
            'DonGia.required' => 'Vui lòng nhập đơn giá dịch vụ.',
            'DonGia.min' => 'Đơn giá không thể nhỏ hơn 0.',
        ]);

        $service = DichVu::create([
            'TenDichVu' => $validated['TenDichVu'],
            'DonGia' => $validated['DonGia'],
            'LoaiDichVu' => $validated['LoaiDichVu'],
            'MoTa' => $validated['MoTa'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm dịch vụ mới thành công.',
            'data' => $service,
        ], 201);
    }

    public function servicesUpdate(Request $request, int $id): JsonResponse
    {
        $service = DichVu::find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy dịch vụ.'], 404);
        }

        $validated = $request->validate([
            'TenDichVu' => ['required', 'string', 'max:150', "unique:dich_vu,TenDichVu,{$id},MaDichVu"],
            'DonGia' => ['required', 'numeric', 'min:0'],
            'LoaiDichVu' => ['required', 'string', 'max:50'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ]);

        // Cập nhật giá mới: lưu ý hệ thống đã lưu snapshot đơn giá ở chi_dinh_dich_vu và chi_tiet_hoa_don
        // nên việc update DonGia ở bảng danh mục chỉ áp dụng cho các chỉ định MỚI, bảo toàn 100% lịch sử cũ
        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật dịch vụ thành công. Đơn giá lịch sử của các chỉ định cũ vẫn được bảo toàn.',
            'data' => $service->fresh(),
        ]);
    }

    /**
     * BƯỚC 8: TRA CỨU HÓA ĐƠN TOÀN HỆ THỐNG (Admin/Invoices.tsx)
     */
    public function invoicesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = HoaDon::query()->with([
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai',
            'luotKham.bacSi:MaBacSi,HoTen',
            'chiTietHoaDons',
            'thanhToans',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('MaHoaDon', $search)
                  ->orWhereHas('luotKham.benhNhan', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        if ($date = $request->input('date')) {
            $query->whereDate('NgayTao', $date);
        }

        $invoices = $query->orderBy('NgayTao', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $invoices,
                'total' => $invoices->count(),
            ]);
        }

        return Inertia::render('Admin/Invoices', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status', 'date']),
        ]);
    }

    /**
     * BƯỚC 8: BÁO CÁO TÀI CHÍNH & DOANH THU (Admin/Reports.tsx)
     */
    public function reportsIndex(Request $request): InertiaResponse|JsonResponse
    {
        $period = $request->input('period');
        if ($period === 'today') {
            $fromDate = now()->toDateString();
            $toDate = now()->toDateString();
        } elseif ($period === 'month') {
            $fromDate = now()->startOfMonth()->toDateString();
            $toDate = now()->endOfMonth()->toDateString();
        } elseif ($period === 'quarter') {
            $fromDate = now()->startOfQuarter()->toDateString();
            $toDate = now()->endOfQuarter()->toDateString();
        } elseif ($period === 'year') {
            $fromDate = now()->startOfYear()->toDateString();
            $toDate = now()->endOfYear()->toDateString();
        } else {
            $fromDate = $request->input('from_date', now()->startOfMonth()->toDateString());
            $toDate = $request->input('to_date', now()->toDateString());
        }

        // Doanh thu thực thu chỉ tính các giao dịch thành công (DA_THANH_TOAN hoặc THANH_CONG) trong khoảng thời gian
        $paymentsQuery = ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
            ->whereDate('ThoiGianThanhToan', '>=', $fromDate)
            ->whereDate('ThoiGianThanhToan', '<=', $toDate);

        $totalRevenue = (float) $paymentsQuery->sum('SoTien');

        // Phân loại doanh thu theo phương thức thanh toán
        $byMethod = ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
            ->whereDate('ThoiGianThanhToan', '>=', $fromDate)
            ->whereDate('ThoiGianThanhToan', '<=', $toDate)
            ->select('PhuongThucThanhToan', DB::raw('SUM(SoTien) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('PhuongThucThanhToan')
            ->get();

        // Tổng nợ viện phí phát sinh (eager load thanhToans tránh N+1 và tránh tính trùng)
        $totalDebt = (float) HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])
            ->whereDate('NgayTao', '>=', $fromDate)
            ->whereDate('NgayTao', '<=', $toDate)
            ->with('thanhToans')
            ->get()
            ->sum(function ($inv) {
                return $inv->ConLai ?? max(0, (float)$inv->BenhNhanChiTra - (float)$inv->DaThanhToan);
            });

        // Thống kê số lượt khám theo bác sĩ trong khoảng thời gian
        $visitsByDoctor = LuotKham::whereDate('ThoiGianTiepNhan', '>=', $fromDate)
            ->whereDate('ThoiGianTiepNhan', '<=', $toDate)
            ->select('MaBacSi', DB::raw('COUNT(*) as total_visits'))
            ->with('bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa', 'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa')
            ->groupBy('MaBacSi')
            ->orderBy('total_visits', 'desc')
            ->get();

        $reportData = [
            'period' => $period,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'totalRevenue' => $totalRevenue,
            'totalDebt' => $totalDebt,
            'byMethod' => $byMethod,
            'visitsByDoctor' => $visitsByDoctor,
            'totalVisits' => LuotKham::whereDate('ThoiGianTiepNhan', '>=', $fromDate)->whereDate('ThoiGianTiepNhan', '<=', $toDate)->count(),
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $reportData,
            ]);
        }

        return Inertia::render('Admin/Reports', [
            'reports' => $reportData,
            'filters' => [
                'period' => $period,
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }
}
