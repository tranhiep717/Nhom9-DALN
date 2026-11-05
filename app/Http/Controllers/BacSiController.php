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

        // Chuẩn hóa bộ lọc ngày thống nhất (ưu tiên NgayKham, fallback ThoiGianTiepNhan)
        $dateFilter = function ($q) use ($today) {
            $q->where(function ($sub) use ($today) {
                $sub->whereDate('NgayKham', $today)
                    ->orWhere(function ($s) use ($today) {
                        $s->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $today);
                    });
            });
        };

        // 1. Lịch khám hôm nay: Lịch hẹn có ca khám thuộc lịch làm việc hôm nay của bác sĩ (loại trừ đã hủy)
        $todayAppointmentsCount = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($maBacSi, $today) {
            $q->where('MaBacSi', $maBacSi)
              ->whereDate('NgayLamViec', $today);
        })->where('TrangThai', '!=', 'DA_HUY')->count();

        // 2. Bệnh nhân chờ khám hôm nay: Gồm cả CHO_KHAM và CHO_KHAM_LAI (tái khám CLS)
        $waitingPatientsCount = LuotKham::where('MaBacSi', $maBacSi)
            ->tap($dateFilter)
            ->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])
            ->count();

        // 3. Lượt khám đang thực hiện: TrangThai = 'DANG_KHAM'
        $inProgressVisitsCount = LuotKham::where('MaBacSi', $maBacSi)
            ->where('TrangThai', 'DANG_KHAM')
            ->count();

        // 4. Lượt khám hoàn thành hôm nay: TrangThai = 'HOAN_THANH'
        $completedTodayCount = LuotKham::where('MaBacSi', $maBacSi)
            ->tap($dateFilter)
            ->where('TrangThai', 'HOAN_THANH')
            ->count();

        // 5. Ca khám đang thực hiện của bác sĩ (nếu có)
        $activeVisitModel = LuotKham::where('MaBacSi', $maBacSi)
            ->where('TrangThai', 'DANG_KHAM')
            ->with([
                'benhNhan:MaBenhNhan,HoTen,NgaySinh,GioiTinh,SoDienThoai',
                'phieuKham:MaPhieuKham,MaLuotKham,TrieuChung,ChanDoan',
                'caKham:MaCaKham,GioBatDau,GioKetThuc',
            ])
            ->first();

        $activeExamining = null;
        if ($activeVisitModel) {
            $activeAge = null;
            if (!empty($activeVisitModel->benhNhan?->NgaySinh)) {
                try {
                    $activeAge = \Carbon\Carbon::parse($activeVisitModel->benhNhan->NgaySinh)->age;
                } catch (\Throwable $e) {
                    $activeAge = null;
                }
            }
            $activeTime = $activeVisitModel->ThoiGianBatDauKham ?? $activeVisitModel->ThoiGianVaoHang ?? $activeVisitModel->ThoiGianTiepNhan;
            $activeExamining = [
                'id' => $activeVisitModel->benhNhan ? ('BN' . str_pad($activeVisitModel->benhNhan->MaBenhNhan, 6, '0', STR_PAD_LEFT)) : 'BN000000',
                'visitId' => $activeVisitModel->MaLuotKham,
                'ticket' => $activeVisitModel->SoPhieu ?? ('#' . $activeVisitModel->MaLuotKham),
                'stt' => $activeVisitModel->STTTrongNgay ?? '---',
                'shiftId' => $activeVisitModel->MaCaKham,
                'name' => $activeVisitModel->benhNhan?->HoTen ?? 'Bệnh nhân',
                'age' => $activeAge !== null ? $activeAge : 'N/A',
                'gender' => $activeVisitModel->benhNhan?->GioiTinh === 'NAM' ? 'Nam' : ($activeVisitModel->benhNhan?->GioiTinh === 'NU' ? 'Nữ' : ''),
                'time' => $activeTime ? \Carbon\Carbon::parse($activeTime)->format('H:i') : '--:--',
                'reason' => $activeVisitModel->phieuKham?->TrieuChung ?? $activeVisitModel->lichHen?->LyDoKham ?? 'Khám bệnh',
                'status' => 'Đang khám',
            ];
        }

        // 6. Danh sách bệnh nhân trong hàng chờ khám hôm nay (CHÍNH SÁCH FIFO 5.1 & 15.4)
        // - Chỉ gồm các bệnh nhân chờ khám: CHO_KHAM và CHO_KHAM_LAI
        // - Không trộn bệnh nhân DANG_KHAM vào bảng hàng chờ để tránh sai lệch thời gian và trạng thái
        // - Sắp xếp tuyệt đối theo FIFO: ThoiGianVaoHang ASC, sau đó MaLuotKham ASC
        $queue = LuotKham::where('MaBacSi', $maBacSi)
            ->tap($dateFilter)
            ->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])
            ->with([
                'benhNhan:MaBenhNhan,HoTen,NgaySinh,GioiTinh,SoDienThoai',
                'phieuKham:MaPhieuKham,MaLuotKham,TrieuChung,ChanDoan',
                'lichHen:MaLichHen,LyDoKham',
                'caKham:MaCaKham,GioBatDau,GioKetThuc',
            ])
            ->orderBy('ThoiGianVaoHang', 'asc')
            ->orderBy('MaLuotKham', 'asc')
            ->get()
            ->map(function ($vk) {
                $age = null;
                if (!empty($vk->benhNhan?->NgaySinh)) {
                    try {
                        $age = \Carbon\Carbon::parse($vk->benhNhan->NgaySinh)->age;
                    } catch (\Throwable $e) {
                        $age = null;
                    }
                }
                $queueTime = $vk->ThoiGianVaoHang ?? $vk->ThoiGianTiepNhan;
                return [
                    'id' => $vk->benhNhan ? ('BN' . str_pad($vk->benhNhan->MaBenhNhan, 6, '0', STR_PAD_LEFT)) : 'BN000000',
                    'visitId' => $vk->MaLuotKham,
                    'ticket' => $vk->SoPhieu ?? ('#' . $vk->MaLuotKham),
                    'stt' => $vk->STTTrongNgay ?? '---',
                    'shiftId' => $vk->MaCaKham,
                    'name' => $vk->benhNhan?->HoTen ?? 'Bệnh nhân',
                    'age' => $age !== null ? $age : 'N/A',
                    'gender' => $vk->benhNhan?->GioiTinh === 'NAM' ? 'Nam' : ($vk->benhNhan?->GioiTinh === 'NU' ? 'Nữ' : ''),
                    'time' => $queueTime ? \Carbon\Carbon::parse($queueTime)->format('H:i') : '--:--',
                    'status' => $vk->TrangThai === 'CHO_KHAM_LAI' ? 'Chờ khám lại' : 'Đang chờ',
                    'rawStatus' => $vk->TrangThai,
                    'reason' => $vk->phieuKham?->TrieuChung ?? $vk->lichHen?->LyDoKham ?? 'Khám bệnh',
                    'queueType' => $vk->LoaiHangDoi === 'DAT_LICH' ? 'P2 Đặt lịch' : ($vk->LoaiHangDoi === 'TRUC_TIEP' ? 'P3 Trực tiếp' : 'Hàng thường'),
                ];
            });

        $stats = [
            'todayAppointments' => $todayAppointmentsCount,
            'waitingPatients' => $waitingPatientsCount,
            'waitingInitial' => LuotKham::where('MaBacSi', $maBacSi)->tap($dateFilter)->where('TrangThai', 'CHO_KHAM')->count(),
            'waitingReExam' => LuotKham::where('MaBacSi', $maBacSi)->tap($dateFilter)->where('TrangThai', 'CHO_KHAM_LAI')->count(),
            'waitingCls' => LuotKham::where('MaBacSi', $maBacSi)->tap($dateFilter)->where('TrangThai', 'CHO_KET_QUA')->count(),
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
                    'activeExamining' => $activeExamining,
                ],
            ]);
        }

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => $bacSi,
            'stats' => $stats,
            'queue' => $queue,
            'activeExamining' => $activeExamining,
        ]);
    }

    /**
     * Màn hình riêng quản lý Bệnh nhân chờ CLS của Bác sĩ (PHASE 15.5)
     */
    public function clsPatients(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isBacSi() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập vào danh sách bệnh nhân chờ CLS.');
        }

        $bacSi = $user->bacSi;
        if (!$bacSi) {
            $bacSi = BacSi::with('chuyenKhoa')->where('TrangThai', 'HOAT_DONG')->first();
        }
        $maBacSi = $bacSi?->MaBacSi;

        $dateParam = $request->input('date');
        $effectiveDate = ($dateParam === null) ? date('Y-m-d') : $dateParam;

        $query = LuotKham::query()
            ->where('MaBacSi', $maBacSi)
            ->whereHas('chiDinhDichVus')
            ->with([
                'benhNhan:MaBenhNhan,HoTen,NgaySinh,GioiTinh,SoDienThoai,DiaChi',
                'caKham:MaCaKham,GioBatDau,GioKetThuc',
                'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
                'phieuKham:MaPhieuKham,MaLuotKham,TrieuChung,ChanDoan,ChanDoanBanDau,ChanDoanSauCLS',
                'chiDinhDichVus.dichVu:MaDichVu,TenDichVu,DonGia',
                'chiDinhDichVus.nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            ]);

        // Lọc ngày khám
        if ($effectiveDate && $effectiveDate !== 'all') {
            $query->where(function ($q) use ($effectiveDate) {
                $q->whereDate('NgayKham', $effectiveDate)
                  ->orWhere(function ($sub) use ($effectiveDate) {
                      $sub->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $effectiveDate);
                  });
            });
        }

        // Lọc theo Chuyên khoa
        if ($specialtyId = $request->input('specialty_id')) {
            $query->where('MaChuyenKhoa', $specialtyId);
        }

        // Lọc theo loại Dịch vụ CLS
        if ($serviceId = $request->input('service_id')) {
            $query->whereHas('chiDinhDichVus', function ($cq) use ($serviceId) {
                $cq->where('MaDichVu', $serviceId);
            });
        }

        // Lọc theo giai đoạn CLS
        if ($stage = $request->input('status')) {
            if ($stage === 'CHO_THUC_HIEN') {
                $query->where('TrangThai', 'CHO_KET_QUA')
                      ->whereHas('chiDinhDichVus', function ($cq) {
                          $cq->whereIn('TrangThai', ['YEU_CAU', 'CHO_THUC_HIEN']);
                      });
            } elseif ($stage === 'DANG_THUC_HIEN') {
                $query->where('TrangThai', 'CHO_KET_QUA')
                      ->whereHas('chiDinhDichVus', function ($cq) {
                          $cq->where('TrangThai', 'DANG_THUC_HIEN');
                      });
            } elseif ($stage === 'CHO_KET_QUA') {
                $query->where('TrangThai', 'CHO_KET_QUA')
                      ->whereHas('chiDinhDichVus', function ($cq) {
                          $cq->where('TrangThai', 'CHO_KET_QUA');
                      });
            } elseif ($stage === 'DA_CO_KET_QUA') {
                $query->where('TrangThai', 'CHO_KET_QUA')
                      ->whereDoesntHave('chiDinhDichVus', function ($cq) {
                          $cq->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY']);
                      });
            } elseif ($stage === 'DA_QUAY_LAI') {
                $query->where('TrangThai', 'CHO_KHAM_LAI');
            }
        } else {
            $query->whereIn('TrangThai', ['CHO_KET_QUA', 'CHO_KHAM_LAI', 'DANG_KHAM']);
        }

        // Tìm kiếm
        if ($search = $request->input('search')) {
            $cleanCode = preg_replace('/[^0-9]/', '', $search);
            $query->where(function ($q) use ($search, $cleanCode) {
                $q->where('SoPhieu', 'like', "%{$search}%")
                  ->orWhere('MaLuotKham', 'like', "%{$search}%")
                  ->orWhereHas('benhNhan', function ($bq) use ($search, $cleanCode) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                      if (!empty($cleanCode)) {
                          $bq->orWhere('MaBenhNhan', (int)$cleanCode);
                      }
                  });
            });
        }

        $query->orderByRaw("CASE WHEN TrangThai = 'CHO_KHAM_LAI' THEN 1 WHEN TrangThai = 'CHO_KET_QUA' THEN 2 ELSE 3 END")
              ->orderBy('ThoiGianTiepNhan', 'desc');

        $perPage = (int)$request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50])) {
            $perPage = 10;
        }

        $visits = $query->paginate($perPage)->withQueryString();

        $clsServices = \App\Models\DichVu::where('TrangThai', 'HOAT_DONG')->orderBy('TenDichVu', 'asc')->get(['MaDichVu', 'TenDichVu']);
        $specialties = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')->orderBy('TenChuyenKhoa', 'asc')->get(['MaChuyenKhoa', 'TenChuyenKhoa']);

        $baseStatQuery = LuotKham::where('MaBacSi', $maBacSi)->whereHas('chiDinhDichVus');
        if ($effectiveDate && $effectiveDate !== 'all') {
            $baseStatQuery->where(function ($q) use ($effectiveDate) {
                $q->whereDate('NgayKham', $effectiveDate)
                  ->orWhere(function ($sub) use ($effectiveDate) {
                      $sub->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $effectiveDate);
                  });
            });
        }
        $clsStats = [
            'total' => (clone $baseStatQuery)->count(),
            'waitingExec' => (clone $baseStatQuery)->where('TrangThai', 'CHO_KET_QUA')->whereHas('chiDinhDichVus', fn($cq) => $cq->whereIn('TrangThai', ['YEU_CAU', 'CHO_THUC_HIEN']))->count(),
            'inProgress' => (clone $baseStatQuery)->where('TrangThai', 'CHO_KET_QUA')->whereHas('chiDinhDichVus', fn($cq) => $cq->where('TrangThai', 'DANG_THUC_HIEN'))->count(),
            'waitingResult' => (clone $baseStatQuery)->where('TrangThai', 'CHO_KET_QUA')->whereHas('chiDinhDichVus', fn($cq) => $cq->where('TrangThai', 'CHO_KET_QUA'))->count(),
            'hasResultWaitingReturn' => (clone $baseStatQuery)->where('TrangThai', 'CHO_KET_QUA')->whereDoesntHave('chiDinhDichVus', fn($cq) => $cq->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY']))->count(),
            'returnedToQueue' => (clone $baseStatQuery)->where('TrangThai', 'CHO_KHAM_LAI')->count(),
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $visits,
                'clsStats' => $clsStats,
            ]);
        }

        return Inertia::render('Doctor/ClsPatients', [
            'doctor' => $bacSi,
            'visits' => $visits,
            'clsServices' => $clsServices,
            'specialties' => $specialties,
            'clsStats' => $clsStats,
            'filters' => [
                'date' => $effectiveDate,
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
                'service_id' => $request->input('service_id', ''),
                'specialty_id' => $request->input('specialty_id', ''),
                'per_page' => $perPage,
                'page' => $visits->currentPage(),
            ],
        ]);
    }
}
