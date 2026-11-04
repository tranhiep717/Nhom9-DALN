<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\ChuyenKhoa;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\LichLamViec;
use App\Models\CaKham;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class BacSiController extends Controller
{
    /**
     * 1. Hiển thị danh sách bác sĩ (Công khai & Khách hàng/Bệnh nhân)
     * 3. Tìm kiếm bác sĩ theo tên
     * 4. Lọc bác sĩ theo chuyên khoa
     */
    public function index(Request $request)
    {
        $query = BacSi::query()->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa');

        // Mặc định khách công khai chỉ thấy bác sĩ đang hoạt động
        $query->whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC']);

        // 3. Tìm kiếm theo tên bác sĩ hoặc học vị
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('HocVi', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        // 4. Lọc bác sĩ theo chuyên khoa (Mã hoặc Tên)
        if ($specialtyId = $request->input('specialty_id')) {
            $query->where('MaChuyenKhoa', $specialtyId);
        } elseif ($specialtyName = $request->input('specialty')) {
            $query->whereHas('chuyenKhoa', function ($q) use ($specialtyName) {
                $q->where('TenChuyenKhoa', 'like', "%{$specialtyName}%");
            });
        }

        $doctors = $query->orderBy('HoTen', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $doctors,
                'total' => $doctors->count(),
            ]);
        }

        $chuyenKhoas = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')->get();

        return Inertia::render('Doctors/Index', [
            'doctors' => $doctors,
            'chuyenKhoas' => $chuyenKhoas,
            'filters' => $request->only(['search', 'specialty', 'specialty_id']),
        ]);
    }

    /**
     * Màn hình danh sách Bác sĩ dành riêng cho Patient Portal
     */
    public function patientIndex(Request $request)
    {
        $query = BacSi::query()->with([
            'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'lichLamViecs' => function ($q) {
                $q->whereDate('NgayLamViec', '>=', now()->toDateString())
                  ->where('TrangThai', 'MO')
                  ->with(['caKhams' => function ($cq) {
                      $cq->where('TrangThai', 'CON_TRONG');
                  }]);
            }
        ])->whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('HocVi', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        if ($specialtyId = $request->input('specialty_id')) {
            $query->where('MaChuyenKhoa', $specialtyId);
        }

        $doctors = $query->orderBy('HoTen', 'asc')->get();
        $chuyenKhoas = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')->get();

        return Inertia::render('Patient/Doctors', [
            'doctors' => $doctors,
            'chuyenKhoas' => $chuyenKhoas,
            'filters' => $request->only(['search', 'specialty_id']),
        ]);
    }

    /**
     * 2. Xem chi tiết bác sĩ
     * 5. Hiển thị học vị, kinh nghiệm, mô tả và thông tin liên hệ phù hợp
     */
    public function show(Request $request, int $id)
    {
        $doctor = BacSi::with([
            'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa,MoTa',
            'lichLamViecs' => function ($q) {
                $q->where('NgayLamViec', '>=', now()->toDateString())
                  ->orderBy('NgayLamViec', 'asc')
                  ->with('caKhams');
            },
        ])->find($id);

        if (!$doctor) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin bác sĩ.',
                ], 404);
            }
            abort(404, 'Không tìm thấy thông tin bác sĩ.');
        }

        // 6. Bảo mật: Không để người dùng truy cập dữ liệu tài khoản quản trị nhạy cảm
        $safeData = [
            'MaBacSi' => $doctor->MaBacSi,
            'HoTen' => $doctor->HoTen,
            'HocVi' => $doctor->HocVi,
            'KinhNghiem' => $doctor->KinhNghiem,
            'MoTa' => $doctor->MoTa,
            'SoDienThoai' => $doctor->SoDienThoai,
            'EmailLienHe' => $doctor->EmailLienHe,
            'TrangThai' => $doctor->TrangThai,
            'chuyen_khoa' => $doctor->chuyenKhoa,
            'lich_lam_viec' => $doctor->lichLamViecs,
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $safeData,
            ]);
        }

        return Inertia::render('Doctors/Show', [
            'doctor' => $safeData,
        ]);
    }

    /**
     * Danh sách bác sĩ dành cho Quản trị viên (/admin/doctors)
     * 6. Phân quyền: Chỉ Quản trị viên mới được vào
     */
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isQuanTriVien()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
            }
            abort(403, 'Bạn không có quyền truy cập vào chức năng quản trị Bác sĩ.');
        }

        $query = BacSi::query()->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%")
                  ->orWhere('HocVi', 'like', "%{$search}%");
            });
        }

        if ($specId = $request->input('specialty_id')) {
            $query->where('MaChuyenKhoa', $specId);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $doctors = $query->orderBy('MaBacSi', 'desc')->get();
        $chuyenKhoas = ChuyenKhoa::all();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $doctors,
                'chuyenKhoas' => $chuyenKhoas,
            ]);
        }

        return Inertia::render('Admin/Doctors', [
            'doctors' => $doctors,
            'chuyenKhoas' => $chuyenKhoas,
            'filters' => $request->only(['search', 'specialty_id', 'status']),
        ]);
    }

    /**
     * Thêm Bác sĩ mới (Chỉ Quản trị viên)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isQuanTriVien()) {
            return response()->json(['message' => 'Bạn không có quyền thêm bác sĩ.'], 403);
        }

        $validated = $request->validate([
            'HoTen' => ['required', 'string', 'max:150'],
            'MaChuyenKhoa' => ['required', 'exists:chuyen_khoa,MaChuyenKhoa'],
            'HocVi' => ['nullable', 'string', 'max:100'],
            'KinhNghiem' => ['nullable', 'integer', 'min:0', 'max:70'],
            'MoTa' => ['nullable', 'string'],
            'SoDienThoai' => ['nullable', 'string', 'max:20'],
            'EmailLienHe' => ['nullable', 'email', 'max:255'],
            'TrangThai' => ['nullable', 'string', 'in:HOAT_DONG,DANG_LAM_VIEC,NGHI_PHEP,NGHI_VIEC'],
            // Tùy chọn tạo tài khoản bác sĩ
            'username' => ['nullable', 'string', 'max:100', 'unique:tai_khoan,TenDangNhap'],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'HoTen.required' => 'Họ và tên bác sĩ không được để trống.',
            'MaChuyenKhoa.required' => 'Vui lòng chọn chuyên khoa cho bác sĩ.',
            'MaChuyenKhoa.exists' => 'Chuyên khoa đã chọn không tồn tại.',
            'username.unique' => 'Tên đăng nhập đã tồn tại trong hệ thống.',
        ]);

        $doctor = DB::transaction(function () use ($validated, $request) {
            $maTaiKhoan = null;

            // Nếu admin muốn cấp tài khoản ngay cho bác sĩ
            if (!empty($validated['username']) && !empty($validated['password'])) {
                $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->first();
                $tk = TaiKhoan::create([
                    'MaVaiTro' => $vaiTroBS ? $vaiTroBS->MaVaiTro : 2,
                    'TenDangNhap' => $validated['username'],
                    'MatKhau' => Hash::make($validated['password']),
                    'Email' => $validated['EmailLienHe'] ?? ($validated['username'] . '@smartcare.vn'),
                    'TrangThai' => 'HOAT_DONG',
                    'NgayTao' => now(),
                ]);
                $maTaiKhoan = $tk->MaTaiKhoan;
            }

            return BacSi::create([
                'MaTaiKhoan' => $maTaiKhoan,
                'MaChuyenKhoa' => $validated['MaChuyenKhoa'],
                'HoTen' => $validated['HoTen'],
                'HocVi' => $validated['HocVi'] ?? null,
                'KinhNghiem' => $validated['KinhNghiem'] ?? null,
                'MoTa' => $validated['MoTa'] ?? null,
                'SoDienThoai' => $validated['SoDienThoai'] ?? null,
                'EmailLienHe' => $validated['EmailLienHe'] ?? null,
                'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Thêm bác sĩ mới thành công.',
            'data' => $doctor->load('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa'),
        ], 201);
    }

    /**
     * Cập nhật thông tin bác sĩ (Quản trị viên hoặc chính bác sĩ cập nhật hồ sơ của mình)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $doctor = BacSi::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Không tìm thấy bác sĩ cần cập nhật.'], 404);
        }

        // 6. Phân quyền: Chỉ Quản trị viên hoặc chính Bác sĩ sở hữu tài khoản này
        $isOwner = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $doctor->MaBacSi;
        $isAdmin = $user && $user->isQuanTriVien();

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Bạn không có quyền chỉnh sửa thông tin bác sĩ này.'], 403);
        }

        $validated = $request->validate([
            'HoTen' => ['required', 'string', 'max:150'],
            'MaChuyenKhoa' => ['sometimes', 'required', 'exists:chuyen_khoa,MaChuyenKhoa'],
            'HocVi' => ['nullable', 'string', 'max:100'],
            'KinhNghiem' => ['nullable', 'integer', 'min:0', 'max:70'],
            'MoTa' => ['nullable', 'string'],
            'SoDienThoai' => ['nullable', 'string', 'max:20'],
            'EmailLienHe' => ['nullable', 'email', 'max:255'],
            'TrangThai' => ['sometimes', 'nullable', 'string', 'in:HOAT_DONG,DANG_LAM_VIEC,NGHI_PHEP,NGHI_VIEC'],
        ]);

        // Nếu là bác sĩ tự cập nhật thì không được tự đổi chuyên khoa hoặc trạng thái hoạt động
        if (!$isAdmin) {
            unset($validated['MaChuyenKhoa'], $validated['TrangThai']);
        }

        $doctor->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin bác sĩ thành công.',
            'data' => $doctor->fresh()->load('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa'),
        ]);
    }

    /**
     * Xóa / Ngưng hoạt động bác sĩ (Chỉ Quản trị viên)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isQuanTriVien()) {
            return response()->json(['message' => 'Chỉ Quản trị viên mới có quyền thực hiện thao tác này.'], 403);
        }

        $doctor = BacSi::find($id);
        if (!$doctor) {
            return response()->json(['message' => 'Không tìm thấy bác sĩ.'], 404);
        }

        // Kiểm tra xem bác sĩ có lịch hẹn chờ khám sắp tới hay không
        $hasActiveAppointments = \App\Models\LichHen::whereHas('caKham.lichLamViec', function ($q) use ($id) {
            $q->where('MaBacSi', $id);
        })->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])->exists();

        if ($hasActiveAppointments) {
            return response()->json([
                'success' => false,
                'message' => 'Bác sĩ đang có lịch hẹn chờ khám của bệnh nhân, không thể chuyển sang ngừng làm việc.',
            ], 422);
        }

        // Chuyển trạng thái sang NGHI_VIEC để bảo toàn lịch sử y tế
        $doctor->update(['TrangThai' => 'NGHI_VIEC']);

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái bác sĩ sang ngừng làm việc.',
        ]);
    }

    /**
     * BÀN LÀM VIỆC / DASHBOARD BÁC SĨ THỜI GIAN THỰC TỪ MYSQL
     */
    public function dashboard(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isBacSi() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập vào bàn làm việc của Bác sĩ.');
        }

        $bacSi = $user->bacSi;
        if (!$bacSi) {
            $bacSi = BacSi::with('chuyenKhoa')->where('TrangThai', 'HOAT_DONG')->first();
        }

        $maBacSi = $bacSi?->MaBacSi;
        $today = now()->toDateString();

        // 1. Lịch khám hôm nay: Lịch hẹn có ca khám thuộc lịch làm việc hôm nay của bác sĩ (loại trừ đã hủy)
        $todayAppointmentsCount = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($maBacSi, $today) {
            $q->where('MaBacSi', $maBacSi)
              ->whereDate('NgayLamViec', $today);
        })->where('TrangThai', '!=', 'DA_HUY')->count();

        // 2. Bệnh nhân chờ khám hôm nay: Lượt khám của bác sĩ hôm nay có TrangThai = 'CHO_KHAM'
        $waitingPatientsCount = LuotKham::where('MaBacSi', $maBacSi)
            ->whereDate('ThoiGianTiepNhan', $today)
            ->where('TrangThai', 'CHO_KHAM')
            ->count();

        // 3. Lượt khám đang thực hiện: Lượt khám của bác sĩ có TrangThai = 'DANG_KHAM'
        $inProgressVisitsCount = LuotKham::where('MaBacSi', $maBacSi)
            ->where('TrangThai', 'DANG_KHAM')
            ->count();

        // 4. Lượt khám hoàn thành hôm nay: Lượt khám của bác sĩ hôm nay có TrangThai = 'HOAN_THANH'
        $completedTodayCount = LuotKham::where('MaBacSi', $maBacSi)
            ->whereDate('ThoiGianTiepNhan', $today)
            ->where('TrangThai', 'HOAN_THANH')
            ->count();

        // 5. Danh sách bệnh nhân trong hàng chờ khám hôm nay của bác sĩ (eager load tránh N+1)
        $queue = LuotKham::where('MaBacSi', $maBacSi)
            ->whereDate('ThoiGianTiepNhan', $today)
            ->whereIn('TrangThai', ['CHO_KHAM', 'DANG_KHAM'])
            ->with([
                'benhNhan:MaBenhNhan,HoTen,NgaySinh,GioiTinh,SoDienThoai',
                'phieuKham:MaPhieuKham,MaLuotKham,TrieuChung,ChanDoan',
                'lichHen:MaLichHen,LyDoKham',
            ])
            ->orderByRaw("FIELD(TrangThai, 'DANG_KHAM', 'CHO_KHAM')")
            ->orderBy('ThoiGianTiepNhan', 'asc')
            ->get()
            ->map(function ($vk) {
                $age = null;
                if ($vk->benhNhan?->NgaySinh) {
                    $age = \Carbon\Carbon::parse($vk->benhNhan->NgaySinh)->age;
                }
                return [
                    'id' => $vk->benhNhan ? ('BN' . str_pad($vk->benhNhan->MaBenhNhan, 6, '0', STR_PAD_LEFT)) : 'BN000000',
                    'visitId' => $vk->MaLuotKham,
                    'name' => $vk->benhNhan?->HoTen ?? 'Bệnh nhân',
                    'age' => $age ?? 'N/A',
                    'time' => $vk->ThoiGianTiepNhan ? \Carbon\Carbon::parse($vk->ThoiGianTiepNhan)->format('H:i') : '--:--',
                    'status' => $vk->TrangThai === 'DANG_KHAM' ? 'Đang khám' : 'Đang chờ',
                    'rawStatus' => $vk->TrangThai,
                    'reason' => $vk->phieuKham?->TrieuChung ?? $vk->lichHen?->LyDoKham ?? 'Khám bệnh',
                ];
            });

        $stats = [
            'todayAppointments' => $todayAppointmentsCount,
            'waitingPatients' => $waitingPatientsCount,
            'inProgressVisits' => $inProgressVisitsCount,
            'completedVisits' => $completedTodayCount,
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'doctor' => $bacSi,
                    'stats' => $stats,
                    'queue' => $queue,
                ],
            ]);
        }

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => $bacSi,
            'stats' => $stats,
            'queue' => $queue,
        ]);
    }
}
