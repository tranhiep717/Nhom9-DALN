<?php

namespace App\Http\Controllers;

use App\Models\BenhNhan;
use App\Models\TaiKhoan;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\HoaDon;
use App\Models\DonThuoc;
use App\Models\ChuyenKhoa;
use App\Models\BacSi;
use App\Models\CaKham;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BenhNhanController extends Controller
{
    /**
     * Danh sách hồ sơ bệnh nhân dành cho Lễ tân (Inertia page)
     * Phân trang server-side, tìm kiếm theo tên/SĐT/mã BN.
     * Không lộ mật khẩu, không lộ thông tin y tế nhạy cảm.
     */
    public function receptionistIndex(Request $request): Response
    {
        $user = $request->user();

        // Chỉ Lễ tân và Quản trị viên được truy cập
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập trang này.');
        }

        $search = trim((string) $request->input('search', ''));
        $perPage = min(max((int) $request->input('per_page', 10), 5), 100);

        $query = BenhNhan::query()
            ->select([
                'MaBenhNhan', 'HoTen', 'GioiTinh', 'NgaySinh',
                'SoDienThoai', 'DiaChi', 'EmailLienHe', 'MaTaiKhoan',
            ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%");
                if (is_numeric($search)) {
                    $q->orWhere('MaBenhNhan', (int) $search);
                }
            });
        }

        $patients = $query->orderBy('MaBenhNhan', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('Receptionist/Patients', [
            'auth'    => ['user' => $user],
            'patients' => $patients,
            'filters' => [
                'search'   => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Chi tiết một hồ sơ bệnh nhân dành cho Lễ tân
     * Kèm theo lịch sử đặt hẹn và các lượt khám gần nhất.
     */
    public function receptionistShow(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập hồ sơ này.',
            ], 403);
        }

        $benhNhan = BenhNhan::with([
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai',
            'luotKhams' => function ($q) {
                $q->select([
                    'MaLuotKham', 'MaBenhNhan', 'MaBacSi', 'ThoiGianTiepNhan',
                    'TrangThai', 'SoPhieu', 'STTTrongNgay', 'LoaiHangDoi', 'GhiChu'
                ])->orderBy('MaLuotKham', 'desc')->take(5);
            },
            'lichHens' => function ($q) {
                $q->select([
                    'MaLichHen', 'MaBenhNhan', 'MaCaKham', 'LyDoKham',
                    'NgayDat', 'TrangThai'
                ])->orderBy('MaLichHen', 'desc')->take(5);
            },
        ])->find($id);

        if (!$benhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $benhNhan,
        ]);
    }

    /**
     * Danh sách bệnh nhân (tìm kiếm, phân trang)
     * Chỉ dành cho Bác sĩ, Lễ tân và Quản trị viên
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Phân quyền: Bệnh nhân không được xem danh sách toàn bộ bệnh nhân khác
        if ($user->isBenhNhan()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập danh sách bệnh nhân.',
            ], 403);
        }

        // 2. Tìm kiếm theo từ khóa (Tên, SĐT, Email, Mã BN)
        $query = BenhNhan::query()->with('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%")
                  ->orWhere('MaBenhNhan', $search);
            });
        }

        // 3. Lọc theo giới tính nếu có
        if ($gender = $request->input('gender')) {
            $query->where('GioiTinh', $gender);
        }

        $perPage = min((int) ($request->input('per_page', 15)), 100);
        $benhNhans = $query->orderBy('MaBenhNhan', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $benhNhans,
        ]);
    }

    /**
     * Tìm kiếm nhanh bệnh nhân phục vụ tiếp nhận lễ tân (Debounce Search)
     */
    public function search(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->isBenhNhan()) {
            return response()->json(['success' => false, 'message' => 'Không có quyền truy cập.'], 403);
        }

        $q = trim((string) $request->input('q', ''));
        if (empty($q)) {
            $patients = BenhNhan::orderBy('MaBenhNhan', 'desc')->take(20)->get();
            return response()->json([
                'success' => true,
                'data' => $patients,
            ]);
        }

        $patients = BenhNhan::where(function ($query) use ($q) {
            $query->where('HoTen', 'like', "%{$q}%")
                  ->orWhere('SoDienThoai', 'like', "%{$q}%");
            if (is_numeric($q)) {
                $query->orWhere('MaBenhNhan', (int)$q);
            }
        })
        ->orderBy('MaBenhNhan', 'desc')
        ->take(30)
        ->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    /**
     * Tạo mới hồ sơ bệnh nhân từ quầy lễ tân (cho bệnh nhân vãng lai chưa có hồ sơ)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien() && !$user->isBacSi())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo hồ sơ bệnh nhân.'], 403);
        }

        $validated = $request->validate([
            'HoTen' => ['required', 'string', 'max:100'],
            'SoDienThoai' => [
                'required',
                'string',
                'regex:/^0[0-9]{9}$/',
                Rule::unique('benh_nhan', 'SoDienThoai'),
            ],
            'GioiTinh' => ['required', 'in:NAM,NU,KHAC'],
            'NgaySinh' => ['nullable', 'date', 'before:today'],
            'DiaChi' => ['nullable', 'string', 'max:255'],
            'EmailLienHe' => ['nullable', 'email', 'max:100'],
            'SoTheBHYT' => ['nullable', 'string', 'max:15'],
            'MucHuongBHYT' => ['nullable', 'integer', 'in:0,80,95,100'],
        ], [
            'HoTen.required' => 'Vui lòng nhập họ và tên bệnh nhân.',
            'SoDienThoai.required' => 'Vui lòng nhập số điện thoại.',
            'SoDienThoai.regex' => 'Số điện thoại không hợp lệ (cần 10 chữ số bắt đầu bằng số 0).',
            'SoDienThoai.unique' => 'Số điện thoại này đã tồn tại trong hệ thống. Vui lòng tìm kiếm hồ sơ bệnh nhân theo số này.',
            'GioiTinh.required' => 'Vui lòng chọn giới tính.',
            'NgaySinh.before' => 'Ngày sinh phải trước ngày hiện tại.',
        ]);

        $benhNhan = BenhNhan::create([
            'HoTen' => trim($validated['HoTen']),
            'SoDienThoai' => trim($validated['SoDienThoai']),
            'GioiTinh' => $validated['GioiTinh'],
            'NgaySinh' => $validated['NgaySinh'] ?? null,
            'DiaChi' => $validated['DiaChi'] ?? null,
            'EmailLienHe' => $validated['EmailLienHe'] ?? null,
            'SoTheBHYT' => !empty($validated['SoTheBHYT']) ? strtoupper(trim($validated['SoTheBHYT'])) : null,
            'MucHuongBHYT' => isset($validated['MucHuongBHYT']) ? (int)$validated['MucHuongBHYT'] : 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tạo hồ sơ bệnh nhân {$benhNhan->HoTen} thành công.",
            'data' => $benhNhan,
        ], 201);
    }

    /**
     * Xem thông tin hồ sơ bệnh nhân của người dùng đang đăng nhập
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        // Tìm hồ sơ bệnh nhân gắn với tài khoản này
        $benhNhan = $user->benhNhan;

        // Nếu chưa có, tự động tạo một hồ sơ gắn với MaTaiKhoan
        if (!$benhNhan && $user->isBenhNhan()) {
            $benhNhan = BenhNhan::create([
                'MaTaiKhoan' => $user->MaTaiKhoan,
                'HoTen' => $user->TenDangNhap,
                'EmailLienHe' => $user->Email,
            ]);
            $user->load('benhNhan');
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $benhNhan,
                'account' => [
                    'MaTaiKhoan' => $user->MaTaiKhoan,
                    'TenDangNhap' => $user->TenDangNhap,
                    'Email' => $user->Email,
                    'TrangThai' => $user->TrangThai,
                    'VaiTro' => $user->vaiTro?->TenVaiTro,
                ],
            ]);
        }

        return Inertia::render('Patient/Dashboard', [
            'benhNhan' => $benhNhan,
        ]);
    }

    /**
     * Xem thông tin chi tiết một hồ sơ bệnh nhân theo ID
     * - Bệnh nhân chỉ được xem hồ sơ của chính mình
     * - Bác sĩ, Lễ tân, Quản trị viên được xem để phục vụ khám chữa bệnh
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $benhNhan = BenhNhan::with('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai')->find($id);

        if (!$benhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân.',
            ], 404);
        }

        // Kiểm tra quyền riêng tư: Bệnh nhân không được xem hồ sơ của người khác
        if ($user->isBenhNhan() && $user->benhNhan?->MaBenhNhan !== $benhNhan->MaBenhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xem hồ sơ của bệnh nhân khác.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $benhNhan,
        ]);
    }

    /**
     * Cập nhật thông tin hồ sơ của chính bệnh nhân đang đăng nhập
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $benhNhan = $user->benhNhan;

        if (!$benhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân gắn với tài khoản này.',
            ], 404);
        }

        // Validate dữ liệu đầu vào
        $validated = $this->validateBenhNhanData($request);

        // Cập nhật chỉ các trường thông tin cá nhân, KHÔNG cho phép sửa MaTaiKhoan
        $benhNhan->fill([
            'HoTen' => $validated['HoTen'],
            'NgaySinh' => $validated['NgaySinh'] ?? null,
            'GioiTinh' => $validated['GioiTinh'] ?? null,
            'SoDienThoai' => $validated['SoDienThoai'] ?? null,
            'DiaChi' => $validated['DiaChi'] ?? null,
            'EmailLienHe' => $validated['EmailLienHe'] ?? null,
        ]);
        $benhNhan->save();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hồ sơ bệnh nhân thành công.',
                'data' => $benhNhan->fresh(),
            ]);
        }

        return redirect()->back()->with('success', 'Cập nhật thông tin thành công.');
    }

    /**
     * Cập nhật hồ sơ bệnh nhân theo ID
     * - Bệnh nhân chỉ được cập nhật hồ sơ của chính mình
     * - Quản trị viên có toàn quyền cập nhật
     * - Tuyệt đối không cho phép đổi MaTaiKhoan hoặc can thiệp trường hệ thống
     */
    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $benhNhan = BenhNhan::find($id);

        if (!$benhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hồ sơ bệnh nhân.',
            ], 404);
        }

        // Phân quyền: Bệnh nhân chỉ được cập nhật hồ sơ của chính mình
        if ($user->isBenhNhan() && $user->benhNhan?->MaBenhNhan !== $benhNhan->MaBenhNhan) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa hồ sơ của bệnh nhân khác.',
            ], 403);
        }

        // Lễ tân và Bác sĩ không được sửa hồ sơ cá nhân của bệnh nhân (trừ trường hợp khám bệnh có phiếu khám riêng)
        if ($user->isBacSi() || $user->isLeTan()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa thông tin cá nhân của bệnh nhân.',
            ], 403);
        }

        // Validate dữ liệu đầu vào
        $validated = $this->validateBenhNhanData($request);

        // Chỉ cập nhật các trường được phép, ngăn chặn thay đổi MaTaiKhoan
        $benhNhan->fill([
            'HoTen' => $validated['HoTen'],
            'NgaySinh' => $validated['NgaySinh'] ?? null,
            'GioiTinh' => $validated['GioiTinh'] ?? null,
            'SoDienThoai' => $validated['SoDienThoai'] ?? null,
            'DiaChi' => $validated['DiaChi'] ?? null,
            'EmailLienHe' => $validated['EmailLienHe'] ?? null,
        ]);
        $benhNhan->save();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hồ sơ bệnh nhân thành công.',
                'data' => $benhNhan->fresh(),
            ]);
        }

        return redirect()->back()->with('success', 'Cập nhật hồ sơ bệnh nhân thành công.');
    }

    /**
     * Dashboard tổng quan dành cho Bệnh nhân
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isBenhNhan()) {
            if ($user->isQuanTriVien()) return redirect()->route('admin.dashboard');
            if ($user->isBacSi()) return redirect()->route('doctor.dashboard');
            if ($user->isLeTan()) return redirect()->route('receptionist.dashboard');
            if ($user->isNhanVienCanLamSang()) return redirect()->route('cls.dashboard');
            return redirect()->route('login');
        }

        $benhNhan = $user->benhNhan;
        if (!$benhNhan) {
            $benhNhan = BenhNhan::create([
                'MaTaiKhoan' => $user->MaTaiKhoan,
                'HoTen' => $user->TenDangNhap,
                'EmailLienHe' => $user->Email,
            ]);
            $user->load('benhNhan');
        }

        $maBN = $benhNhan->MaBenhNhan;

        // 1. Lịch hẹn sắp tới gần nhất (chưa hủy và chưa hoàn thành)
        $upcomingAppointment = LichHen::where('MaBenhNhan', $maBN)
            ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])
            ->whereHas('caKham.lichLamViec', function ($q) {
                $q->whereDate('NgayLamViec', '>=', now()->toDateString());
            })
            ->with([
                'caKham.lichLamViec.bacSi.chuyenKhoa',
            ])
            ->orderBy('MaLichHen', 'asc')
            ->first();

        // 2. Thống kê tổng quan
        $upcomingCount = LichHen::where('MaBenhNhan', $maBN)
            ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])
            ->count();

        $completedVisits = LuotKham::where('MaBenhNhan', $maBN)
            ->where('TrangThai', 'HOAN_THANH')
            ->count();

        $prescriptionsCount = DonThuoc::whereHas('luotKham', function ($q) use ($maBN) {
            $q->where('MaBenhNhan', $maBN);
        })->where('TrangThai', 'DA_CAP')->count();

        // Hóa đơn chưa thanh toán & tổng nợ
        $unpaidInvoices = HoaDon::whereHas('luotKham', function ($q) use ($maBN) {
            $q->where('MaBenhNhan', $maBN);
        })->whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])
          ->with('thanhToans')
          ->get();

        $unpaidCount = $unpaidInvoices->count();
        $unpaidDebt = $unpaidInvoices->sum(function ($inv) {
            return $inv->ConLai ?? max(0, (float)$inv->BenhNhanChiTra - (float)$inv->DaThanhToan);
        });

        // 3. Hóa đơn gần nhất
        $latestInvoice = HoaDon::whereHas('luotKham', function ($q) use ($maBN) {
            $q->where('MaBenhNhan', $maBN);
        })->with(['thanhToans', 'chiTietHoaDons'])->orderBy('NgayTao', 'desc')->first();

        // 4. Các lượt khám gần nhất
        $recentVisits = LuotKham::where('MaBenhNhan', $maBN)
            ->with(['bacSi.chuyenKhoa', 'phieuKham'])
            ->orderBy('ThoiGianTiepNhan', 'desc')
            ->take(4)
            ->get();

        return Inertia::render('Patient/Dashboard', [
            'benhNhan' => $benhNhan,
            'upcomingAppointment' => $upcomingAppointment,
            'stats' => [
                'upcomingCount' => $upcomingCount,
                'completedVisits' => $completedVisits,
                'prescriptionsCount' => $prescriptionsCount,
                'unpaidCount' => $unpaidCount,
                'unpaidDebt' => $unpaidDebt,
            ],
            'latestInvoice' => $latestInvoice,
            'recentVisits' => $recentVisits,
        ]);
    }

    /**
     * Màn hình xem và chỉnh sửa Hồ sơ cá nhân Bệnh nhân
     */
    public function profileView(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isBenhNhan()) {
            if ($user->isQuanTriVien()) return redirect()->route('admin.dashboard');
            if ($user->isBacSi()) return redirect()->route('doctor.dashboard');
            if ($user->isLeTan()) return redirect()->route('receptionist.dashboard');
            if ($user->isNhanVienCanLamSang()) return redirect()->route('cls.dashboard');
            return redirect()->route('login');
        }

        $benhNhan = $user->benhNhan;
        if (!$benhNhan) {
            $benhNhan = BenhNhan::create([
                'MaTaiKhoan' => $user->MaTaiKhoan,
                'HoTen' => $user->TenDangNhap,
                'EmailLienHe' => $user->Email,
            ]);
            $user->load('benhNhan');
        }

        return Inertia::render('Patient/Profile', [
            'benhNhan' => $benhNhan,
            'account' => [
                'MaTaiKhoan' => $user->MaTaiKhoan,
                'TenDangNhap' => $user->TenDangNhap,
                'Email' => $user->Email,
                'TrangThai' => $user->TrangThai,
                'VaiTro' => $user->vaiTro?->TenVaiTro,
            ],
        ]);
    }

    /**
     * Màn hình Lịch sử khám bệnh của Bệnh nhân
     */
    public function medicalHistory(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isBenhNhan()) {
            if ($user->isQuanTriVien()) return redirect()->route('admin.dashboard');
            if ($user->isBacSi()) return redirect()->route('doctor.dashboard');
            if ($user->isLeTan()) return redirect()->route('receptionist.dashboard');
            if ($user->isNhanVienCanLamSang()) return redirect()->route('cls.dashboard');
            return redirect()->route('login');
        }

        $maBN = $user->benhNhan?->MaBenhNhan;
        if (!$maBN) {
            return Inertia::render('Patient/MedicalHistory', ['visits' => [], 'filters' => []]);
        }

        $query = LuotKham::where('MaBenhNhan', $maBN)
            ->with([
                'bacSi.chuyenKhoa',
                'phieuKham',
                'donThuoc.chiTietDonThuocs.thuoc',
                'chiDinhDichVus.dichVu',
                'hoaDon.thanhToans',
            ]);

        // Bộ lọc từ khóa
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('phieuKham', function ($pq) use ($search) {
                    $pq->where('ChanDoan', 'like', "%{$search}%")
                       ->orWhere('TrieuChung', 'like', "%{$search}%");
                })->orWhereHas('bacSi', function ($bq) use ($search) {
                    $bq->where('HoTen', 'like', "%{$search}%");
                });
            });
        }

        // Bộ lọc ngày
        if ($fromDate = $request->input('from_date')) {
            $query->whereDate('ThoiGianTiepNhan', '>=', $fromDate);
        }
        if ($toDate = $request->input('to_date')) {
            $query->whereDate('ThoiGianTiepNhan', '<=', $toDate);
        }

        $visits = $query->orderBy('ThoiGianTiepNhan', 'desc')->get();

        return Inertia::render('Patient/MedicalHistory', [
            'visits' => $visits,
            'filters' => [
                'search' => $request->input('search', ''),
                'from_date' => $request->input('from_date', ''),
                'to_date' => $request->input('to_date', ''),
            ],
        ]);
    }

    /**
     * Màn hình Đặt lịch khám bệnh dành cho Bệnh nhân
     * Khách chưa đăng nhập lập tức được lưu URL mong muốn và chuyển sang /login
     */
    public function bookAppointmentView(Request $request)
    {
        // 1. Khách chưa đăng nhập: chuyển về /login ngay và lưu intended URL
        if (!Auth::check()) {
            session(['url.intended' => $request->fullUrl()]);
            return redirect()->route('login')->with('info', 'Vui lòng đăng nhập tài khoản để đặt lịch khám bệnh.');
        }

        $user = $request->user();

        // 2. Nếu đăng nhập vai trò khác, chuyển về Dashboard tương ứng
        if (!$user->isBenhNhan()) {
            return redirect($this->getRedirectUrlByRole($user))
                ->with('warning', 'Phân hệ đặt lịch khám chỉ dành riêng cho tài khoản Bệnh nhân.');
        }

        $specialties = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')
            ->withCount('bacSis')
            ->orderBy('TenChuyenKhoa', 'asc')
            ->get();

        $doctors = BacSi::where('TrangThai', 'HOAT_DONG')
            ->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa')
            ->orderBy('HoTen', 'asc')
            ->get();

        return Inertia::render('Patient/BookAppointment', [
            'specialties' => $specialties,
            'doctors' => $doctors,
            'preselectedDoctorId' => $request->input('doctor_id'),
            'preselectedSpecialtyId' => $request->input('specialty_id'),
        ]);
    }

    /**
     * Xác định URL điều hướng theo vai trò người dùng
     */
    protected function getRedirectUrlByRole(TaiKhoan $taiKhoan): string
    {
        $roleName = strtoupper($taiKhoan->vaiTro?->TenVaiTro ?? '');

        return match ($roleName) {
            'QUAN_TRI_VIEN' => route('admin.dashboard'),
            'BAC_SI' => route('doctor.dashboard'),
            'LE_TAN' => route('receptionist.dashboard'),
            default => route('dashboard'),
        };
    }

    /**
     * Validate dữ liệu hồ sơ bệnh nhân
     */
    protected function validateBenhNhanData(Request $request): array
    {
        return $request->validate([
            'HoTen' => ['required', 'string', 'max:150'],
            'NgaySinh' => ['nullable', 'date', 'before_or_equal:today'],
            'GioiTinh' => ['nullable', 'string', 'in:Nam,Nữ,Khác'],
            'SoDienThoai' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s\-()]+$/'],
            'DiaChi' => ['nullable', 'string', 'max:255'],
            'EmailLienHe' => ['nullable', 'email', 'max:255'],
        ], [
            'HoTen.required' => 'Họ và tên bệnh nhân không được để trống.',
            'HoTen.max' => 'Họ và tên không được vượt quá 150 ký tự.',
            'NgaySinh.date' => 'Ngày sinh không đúng định dạng ngày tháng.',
            'NgaySinh.before_or_equal' => 'Ngày sinh không thể lớn hơn ngày hôm nay.',
            'GioiTinh.in' => 'Giới tính chỉ nhận giá trị: Nam, Nữ hoặc Khác.',
            'SoDienThoai.regex' => 'Số điện thoại chứa ký tự không hợp lệ.',
            'EmailLienHe.email' => 'Email liên hệ không đúng định dạng.',
        ]);
    }
}
