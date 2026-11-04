<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\Thuoc;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LuotKhamController extends Controller
{
    /**
     * 1. Danh sách lượt khám
     * - Bác sĩ chỉ xem và xử lý lượt khám thuộc phạm vi mình được phân quyền
     * - Bệnh nhân chỉ xem các lượt khám của chính mình
     * - Lễ tân và Quản trị viên xem toàn bộ lượt khám
     * - Lọc theo ngày (mặc định hôm nay nếu không truyền), trạng thái
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LuotKham::query()->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
            'bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'lichHen:MaLichHen,MaCaKham,TrangThai,LyDoKham',
            'phieuKham',
            'donThuoc.chiTietDonThuocs.thuoc',
            'chiDinhDichVus.dichVu',
            'chiDinhDichVus.nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            'chiDinhDichVus.bacSi:MaBacSi,HoTen',
        ]);

        // Phân quyền dữ liệu
        if ($user && $user->isBacSi()) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa liên kết hồ sơ Bác sĩ.'], 403);
            }
            $query->where('MaBacSi', $maBacSi);
        } elseif ($user && $user->isBenhNhan()) {
            $maBenhNhan = $user->benhNhan?->MaBenhNhan;
            if (!$maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa có hồ sơ Bệnh nhân.'], 403);
            }
            $query->where('MaBenhNhan', $maBenhNhan);
        } elseif ($doctorId = $request->input('doctor_id')) {
            // Lễ tân / Admin lọc theo bác sĩ cụ thể
            $query->where('MaBacSi', $doctorId);
        }

        // Tìm kiếm theo tên hoặc SĐT bệnh nhân
        if ($search = $request->input('search')) {
            $query->whereHas('benhNhan', function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%");
            });
        }

        // Lọc theo ngày tiếp nhận
        if ($date = $request->input('date')) {
            $query->whereDate('ThoiGianTiepNhan', $date);
        } elseif ($from = $request->input('from_date')) {
            $query->whereDate('ThoiGianTiepNhan', '>=', $from);
            if ($to = $request->input('to_date')) {
                $query->whereDate('ThoiGianTiepNhan', '<=', $to);
            }
        }

        // Lọc theo trạng thái lượt khám
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $visits = $query->orderBy('ThoiGianTiepNhan', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $visits,
                'total' => $visits->count(),
            ]);
        }

        $selectedVisitId = $request->input('visit_id');
        $selectedVisit = null;
        if ($selectedVisitId) {
            $selectedVisit = $visits->firstWhere('MaLuotKham', (int)$selectedVisitId);
            if (!$selectedVisit) {
                // Kiểm tra và tải chi tiết nếu lượt khám không nằm trong danh sách lọc hiện tại
                $foundVisit = LuotKham::with([
                    'benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
                    'bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
                    'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
                    'lichHen:MaLichHen,MaCaKham,TrangThai,LyDoKham',
                    'phieuKham',
                    'donThuoc.chiTietDonThuocs.thuoc',
                    'chiDinhDichVus.dichVu',
                    'chiDinhDichVus.nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
                    'chiDinhDichVus.bacSi:MaBacSi,HoTen',
                ])->find((int)$selectedVisitId);

                if ($foundVisit) {
                    if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi !== $foundVisit->MaBacSi) {
                        abort(403, 'Bạn không có quyền truy cập lượt khám của bác sĩ khác.');
                    }
                    $selectedVisit = $foundVisit;
                }
            }
        }
        if (!$selectedVisit && $visits->isNotEmpty()) {
            $selectedVisit = $visits->firstWhere('TrangThai', 'DANG_KHAM') 
                ?? $visits->firstWhere('TrangThai', 'CHO_KHAM') 
                ?? $visits->first();
        }

        // Lấy lịch sử khám trước đây của bệnh nhân (nếu có selectedVisit)
        $patientHistory = collect();
        if ($selectedVisit && $selectedVisit->MaBenhNhan) {
            $patientHistory = LuotKham::where('MaBenhNhan', $selectedVisit->MaBenhNhan)
                ->where('MaLuotKham', '!=', $selectedVisit->MaLuotKham)
                ->with([
                    'bacSi:MaBacSi,HoTen',
                    'phieuKham',
                    'donThuoc.chiTietDonThuocs.thuoc:MaThuoc,TenThuoc,DonViTinh',
                    'chiDinhDichVus.dichVu:MaDichVu,TenDichVu',
                ])
                ->orderBy('ThoiGianTiepNhan', 'desc')
                ->take(5)
                ->get();
        }

        // Danh mục Thuốc khả dụng đang hoạt động (kèm hàm lượng, quy cách, tồn kho)
        $availableMedicines = Thuoc::where('TrangThai', 'HOAT_DONG')
            ->orderBy('TenThuoc', 'asc')
            ->get(['MaThuoc', 'TenThuoc', 'HoatChat', 'HamLuong', 'DonViTinh', 'DangBaoChe', 'DonGia', 'SoLuongTon', 'HuongDanSuDung']);

        // Danh mục Dịch vụ khả dụng đang hoạt động
        $availableServices = DichVu::where('TrangThai', 'HOAT_DONG')
            ->orderBy('TenDichVu', 'asc')
            ->get(['MaDichVu', 'TenDichVu', 'DonGia', 'MoTa']);

        // Thống kê hôm nay của Bác sĩ
        $today = now()->toDateString();
        $baseDoctorQuery = LuotKham::query();
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi) {
            $baseDoctorQuery->where('MaBacSi', $user->bacSi->MaBacSi);
        }
        $stats = [
            'totalToday' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->count(),
            'waiting' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->where('TrangThai', 'CHO_KHAM')->count(),
            'examining' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->where('TrangThai', 'DANG_KHAM')->count(),
            'waitingCls' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->where('TrangThai', 'CHO_KET_QUA')->count(),
            'waitingReExam' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->where('TrangThai', 'CHO_KHAM_LAI')->count(),
            'completed' => (clone $baseDoctorQuery)->whereDate('ThoiGianTiepNhan', $today)->where('TrangThai', 'HOAN_THANH')->count(),
        ];

        return Inertia::render('Doctor/Examine', [
            'visits' => $visits,
            'selectedVisit' => $selectedVisit,
            'patientHistory' => $patientHistory,
            'availableMedicines' => $availableMedicines,
            'availableServices' => $availableServices,
            'stats' => $stats,
            'filters' => [
                'date' => $request->input('date', ''),
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
                'visit_id' => $selectedVisit?->MaLuotKham,
            ],
        ]);
    }

    /**
     * 2. Xem chi tiết lượt khám
     * - Eager load toàn bộ hồ sơ điều trị: Phiếu khám, Đơn thuốc, Chỉ định dịch vụ
     * - Kiểm tra nghiêm ngặt phân quyền bệnh nhân & bác sĩ
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $visit = LuotKham::with([
            'benhNhan',
            'bacSi.chuyenKhoa',
            'lichHen.caKham.lichLamViec',
            'phieuKham',
            'donThuoc.chiTietDonThuocs.thuoc',
            'chiDinhDichVus.dichVu',
        ])->find($id);

        if (!$visit) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lượt khám.'], 404);
        }

        // Bảo mật 1: Bệnh nhân không được xem lượt khám của bệnh nhân khác
        if ($user && $user->isBenhNhan() && $user->benhNhan?->MaBenhNhan !== $visit->MaBenhNhan) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem thông tin lượt khám của bệnh nhân khác.'], 403);
        }

        // Bảo mật 2: Bác sĩ không được xem lượt khám ngoài phạm vi phân quyền của mình
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi !== $visit->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem lượt khám của bác sĩ khác.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $visit,
        ]);
    }

    /**
     * 3. Tiếp nhận bệnh nhân & Tạo lượt khám
     * - Tiếp nhận từ Lịch hẹn (đã xác nhận)
     * - Hoặc tiếp nhận trực tiếp tại quầy lễ tân
     * - Kiểm tra KHÔNG tạo trùng lượt khám cho cùng lịch hẹn
     * - Sử dụng DB Transaction để đồng bộ trạng thái Lịch hẹn -> DA_TIEP_NHAN
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Chỉ Lễ tân và Quản trị viên (hoặc Bác sĩ trong ca trực) mới có quyền tiếp nhận bệnh nhân
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien() && !$user->isBacSi())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tiếp nhận bệnh nhân tạo lượt khám.'], 403);
        }

        $validated = $request->validate([
            'MaLichHen' => ['nullable', 'exists:lich_hen,MaLichHen'],
            'MaBenhNhan' => ['required_without:MaLichHen', 'nullable', 'exists:benh_nhan,MaBenhNhan'],
            'MaBacSi' => ['required_without:MaLichHen', 'nullable', 'exists:bac_si,MaBacSi'],
            'GhiChu' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($validated, $user, $request) {
            $maLichHen = $validated['MaLichHen'] ?? null;
            $ghiChu = $validated['GhiChu'] ?? null;

            if ($maLichHen) {
                // Khóa lịch hẹn trước để tránh 2 request đồng thời cùng tiếp nhận
                $lichHen = LichHen::with('caKham.lichLamViec')->lockForUpdate()->find($maLichHen);
                if (!$lichHen) {
                    throw ValidationException::withMessages([
                        'MaLichHen' => 'Lịch hẹn không tồn tại.',
                    ]);
                }

                // Kiểm tra không tạo trùng lượt khám cho cùng lịch hẹn
                $existingVisit = LuotKham::where('MaLichHen', $maLichHen)->lockForUpdate()->first();
                if ($existingVisit || $lichHen->TrangThai === 'DA_TIEP_NHAN') {
                    throw ValidationException::withMessages([
                        'MaLichHen' => "Lịch hẹn này đã được tiếp nhận tạo lượt khám trước đó.",
                    ]);
                }

                if (in_array($lichHen->TrangThai, ['DA_HUY', 'HOAN_THANH'])) {
                    throw ValidationException::withMessages([
                        'MaLichHen' => "Lịch hẹn đang ở trạng thái '{$lichHen->TrangThai}', không thể tiếp nhận khám.",
                    ]);
                }

                $maBenhNhan = $lichHen->MaBenhNhan;
                $maBacSi = $validated['MaBacSi'] ?? $lichHen->caKham?->lichLamViec?->MaBacSi;

                if (!$maBacSi) {
                    throw ValidationException::withMessages([
                        'MaBacSi' => 'Không xác định được bác sĩ phụ trách cho ca khám này.',
                    ]);
                }

                // Cập nhật trạng thái lịch hẹn sang DA_TIEP_NHAN
                $lichHen->update([
                    'TrangThai' => 'DA_TIEP_NHAN',
                ]);
            } else {
                // Tiếp nhận trực tiếp không qua lịch hẹn trước
                $maBenhNhan = $validated['MaBenhNhan'];
                $maBacSi = $validated['MaBacSi'];
            }

            // Tạo lượt khám mới
            $visit = LuotKham::create([
                'MaLichHen' => $maLichHen,
                'MaBenhNhan' => $maBenhNhan,
                'MaBacSi' => $maBacSi,
                'ThoiGianTiepNhan' => now(),
                'TrangThai' => 'CHO_KHAM',
                'GhiChu' => $ghiChu,
            ]);

            // Kích hoạt thông báo nghiệp vụ
            $bn = BenhNhan::find($maBenhNhan);
            $bs = BacSi::find($maBacSi);
            $tenBN = $bn?->HoTen ?? 'Bệnh nhân';
            $tenBS = $bs?->HoTen ?? 'Bác sĩ';

            // Gửi thông báo cho Bác sĩ phụ trách
            NotificationService::sendToDoctor(
                $maBacSi,
                'TIEP_NHAN',
                'Bệnh nhân mới vào hàng chờ khám',
                "Bệnh nhân {$tenBN} đã được tiếp nhận vào hàng chờ khám của bạn.",
                "/doctor/examine?visit_id={$visit->MaLuotKham}"
            );

            // Gửi thông báo cho Bệnh nhân
            NotificationService::sendToPatient(
                $maBenhNhan,
                'TIEP_NHAN',
                'Tiếp nhận phòng khám thành công',
                "Bạn đã được tiếp nhận thành công vào hàng chờ khám của BS. {$tenBS}. Lượt khám #{$visit->MaLuotKham}.",
                "/appointments"
            );

            // Nếu request từ Inertia router
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', "Tiếp nhận bệnh nhân {$tenBN} thành công. Lượt khám đã được tạo và chuyển vào hàng chờ.");
            }

            return response()->json([
                'success' => true,
                'message' => "Tiếp nhận bệnh nhân {$tenBN} thành công. Lượt khám đang ở trạng thái Chờ khám.",
                'data' => $visit->load(['benhNhan:MaBenhNhan,HoTen,SoDienThoai', 'bacSi:MaBacSi,HoTen']),
            ], 201);
        });
    }

    /**
     * 4. Bác sĩ bắt đầu khám bệnh
     */
    public function startExamine(Request $request, int $id)
    {
        $user = $request->user();
        $visit = LuotKham::find($id);

        if (!$visit) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lượt khám.'], 404);
        }

        // 1. Chỉ Bác sĩ phụ trách mới được bắt đầu khám bệnh
        $isAssignedDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $visit->MaBacSi;

        if (!$isAssignedDoctor) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ phụ trách mới có quyền bắt đầu phiên khám bệnh.'], 403);
        }

        if (in_array($visit->TrangThai, ['HOAN_THANH', 'DA_HUY'])) {
            return response()->json([
                'success' => false,
                'message' => "Lượt khám đã ở trạng thái '{$visit->TrangThai}', không thể bắt đầu khám lại.",
            ], 422);
        }

        $visit->update([
            'TrangThai' => 'DANG_KHAM',
            'ThoiGianBatDauKham' => $visit->ThoiGianBatDauKham ?? now(),
        ]);

        // Kích hoạt thông báo cho bệnh nhân
        NotificationService::sendToPatient(
            $visit->MaBenhNhan,
            'KHAM_BENH',
            'Bác sĩ đang khám bệnh',
            "Lượt khám #{$visit->MaLuotKham} của bạn đang được tiến hành.",
            "/appointments"
        );

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Bắt đầu quá trình khám bệnh thành công.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Bắt đầu quá trình khám bệnh thành công.',
            'data' => $visit->fresh(),
        ]);
    }

    /**
     * 5. Lưu hoặc cập nhật Phiếu khám bệnh (Bệnh án)
     */
    public function savePhieuKham(Request $request, int $id)
    {
        $user = $request->user();
        $visit = LuotKham::find($id);

        if (!$visit) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lượt khám.'], 404);
        }

        $isAssignedDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $visit->MaBacSi;

        if (!$isAssignedDoctor) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ phụ trách mới có quyền ghi hồ sơ phiếu khám cho lượt khám này.'], 403);
        }

        if (in_array($visit->TrangThai, ['HOAN_THANH', 'DA_HUY'])) {
            return response()->json([
                'success' => false,
                'message' => "Lượt khám đã ở trạng thái '{$visit->TrangThai}', không thể chỉnh sửa hồ sơ phiếu khám.",
            ], 422);
        }

        $validated = $request->validate([
            'TrieuChung' => ['nullable', 'string'],
            'TienSuBenh' => ['nullable', 'string'],
            'KetQuaKham' => ['nullable', 'string'],
            'ChanDoanBanDau' => ['nullable', 'string'],
            'ChanDoanSauCLS' => ['nullable', 'string'],
            'KetLuan' => ['nullable', 'string'],
            'HuongDieuTri' => ['nullable', 'string'],
            'LoiDanBacSi' => ['nullable', 'string'],
            'GhiChu' => ['nullable', 'string'],
            'ChanDoan' => ['nullable', 'string'],
        ]);

        $existingPhieu = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->first();

        // 1. Dữ liệu khám ban đầu (Bảo toàn chẩn đoán ban đầu khi cập nhật chẩn đoán sau CLS)
        $trieuChung = $validated['TrieuChung'] ?? ($existingPhieu?->TrieuChung ?? ($visit->lichHen?->LyDoKham ?: 'Khám lâm sàng'));
        $ketQuaKham = $validated['KetQuaKham'] ?? ($existingPhieu?->KetQuaKham ?? null);
        $tienSuBenh = $validated['TienSuBenh'] ?? ($existingPhieu?->TienSuBenh ?? null);

        // Chẩn đoán ban đầu: Giữ nguyên chẩn đoán ban đầu đã lưu, không bị ghi đè bởi chẩn đoán sau CLS
        $chanDoanBanDau = !empty(trim($validated['ChanDoanBanDau'] ?? ''))
            ? trim($validated['ChanDoanBanDau'])
            : ($existingPhieu?->ChanDoanBanDau ?? (!empty(trim($validated['ChanDoan'] ?? '')) ? trim($validated['ChanDoan']) : null));

        // Chẩn đoán sau CLS / Chẩn đoán xác định kết luận
        $chanDoanSauCLS = !empty(trim($validated['ChanDoanSauCLS'] ?? ''))
            ? trim($validated['ChanDoanSauCLS'])
            : ($existingPhieu?->ChanDoanSauCLS ?? null);

        $ketLuan = !empty(trim($validated['KetLuan'] ?? ''))
            ? trim($validated['KetLuan'])
            : ($existingPhieu?->KetLuan ?? null);

        $huongDieuTri = $validated['HuongDieuTri'] ?? ($existingPhieu?->HuongDieuTri ?? null);
        $loiDanBacSi = $validated['LoiDanBacSi'] ?? ($existingPhieu?->LoiDanBacSi ?? null);
        $ghiChu = $validated['GhiChu'] ?? ($existingPhieu?->GhiChu ?? null);

        // Cột tương thích ngược ChanDoan: Ưu tiên chẩn đoán sau CLS nếu đã có, ngược lại lấy chẩn đoán ban đầu
        $chanDoanTong = $chanDoanSauCLS ?: ($chanDoanBanDau ?: 'Theo dõi lâm sàng');

        $phieuKham = PhieuKham::updateOrCreate(
            ['MaLuotKham' => $visit->MaLuotKham],
            [
                'TrieuChung' => $trieuChung,
                'KetQuaKham' => $ketQuaKham,
                'TienSuBenh' => $tienSuBenh,
                'ChanDoan' => $chanDoanTong,
                'ChanDoanBanDau' => $chanDoanBanDau,
                'ChanDoanSauCLS' => $chanDoanSauCLS,
                'KetLuan' => $ketLuan,
                'HuongDieuTri' => $huongDieuTri,
                'LoiDanBacSi' => $loiDanBacSi,
                'GhiChu' => $ghiChu,
            ]
        );

        // Liên kết trực tiếp MaPhieuKham cho tất cả các chỉ định CLS của lượt khám này
        \App\Models\ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)
            ->whereNull('MaPhieuKham')
            ->update(['MaPhieuKham' => $phieuKham->MaPhieuKham]);

        // Tự động chuyển trạng thái lượt khám nếu đang ở CHO_KHAM hoặc CHO_KHAM_LAI
        if (in_array($visit->TrangThai, ['CHO_KHAM', 'CHO_KHAM_LAI'])) {
            $visit->update([
                'TrangThai' => 'DANG_KHAM',
                'ThoiGianBatDauKham' => $visit->ThoiGianBatDauKham ?? now(),
            ]);
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Lưu hồ sơ phiếu khám thành công.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Lưu hồ sơ phiếu khám thành công.',
            'data' => $phieuKham,
        ]);
    }

    /**
     * 6. Hoàn thành lượt khám
     */
    public function completeExamine(Request $request, int $id)
    {
        $user = $request->user();
        $visit = LuotKham::with('lichHen')->find($id);

        if (!$visit) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lượt khám.'], 404);
        }

        $isAssignedDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $visit->MaBacSi;

        if (!$isAssignedDoctor) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ phụ trách mới có quyền hoàn thành lượt khám này.'], 403);
        }

        if ($visit->TrangThai === 'HOAN_THANH') {
            return response()->json(['success' => false, 'message' => 'Lượt khám này đã được hoàn thành trước đó.'], 422);
        }

        if ($visit->TrangThai === 'DA_HUY') {
            return response()->json(['success' => false, 'message' => 'Lượt khám đã bị hủy, không thể hoàn thành.'], 422);
        }

        // Bắt buộc phải có phiếu khám và chẩn đoán trước khi hoàn thành khám
        $phieuKham = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->first();
        if (!$phieuKham || empty(trim($phieuKham->ChanDoan))) {
            return response()->json([
                'success' => false,
                'message' => 'Lượt khám chưa có Phiếu khám hoặc chưa có chẩn đoán bệnh. Vui lòng ghi chẩn đoán trước khi hoàn thành.',
            ], 422);
        }

        // Kiểm tra xem có dịch vụ cận lâm sàng nào chưa có kết quả không (chặn tuyệt đối nếu còn dịch vụ chờ)
        $pendingServicesCount = \App\Models\ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)
            ->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'])
            ->count();
        if ($pendingServicesCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Lượt khám vẫn còn {$pendingServicesCount} dịch vụ cận lâm sàng chưa có kết quả. Vui lòng cập nhật kết quả hoặc hủy chỉ định trước khi hoàn tất.",
            ], 422);
        }

        return DB::transaction(function () use ($visit, $request) {
            $visit->update([
                'TrangThai' => 'HOAN_THANH',
                'ThoiGianKetThucKham' => now(),
            ]);

            // Nếu lượt khám bắt nguồn từ Lịch hẹn, hoàn thành luôn lịch hẹn đó
            if ($visit->lichHen) {
                $visit->lichHen->update([
                    'TrangThai' => 'HOAN_THANH',
                ]);
            }

            // Kích hoạt thông báo nghiệp vụ
            $bn = BenhNhan::find($visit->MaBenhNhan);
            $tenBN = $bn?->HoTen ?? 'Bệnh nhân';

            // Gửi thông báo cho Bệnh nhân
            NotificationService::sendToPatient(
                $visit->MaBenhNhan,
                'KHAM_BENH',
                'Lượt khám đã hoàn tất',
                "Lượt khám #{$visit->MaLuotKham} của bạn đã hoàn thành. Vui lòng di chuyển đến quầy lễ tân để thanh toán và nhận thuốc.",
                "/appointments"
            );

            // Gửi thông báo cho Lễ tân
            NotificationService::sendToRole(
                'LE_TAN',
                'KHAM_BENH',
                'Bệnh nhân khám xong chờ thanh toán',
                "Bệnh nhân {$tenBN} đã hoàn thành lượt khám #{$visit->MaLuotKham}, sẵn sàng lập hóa đơn và thu ngân.",
                "/receptionist/payment"
            );

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Hoàn thành lượt khám bệnh thành công.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Hoàn thành lượt khám bệnh thành công.',
                'data' => $visit->fresh(['phieuKham', 'donThuoc', 'chiDinhDichVus']),
            ]);
        });
    }
}
