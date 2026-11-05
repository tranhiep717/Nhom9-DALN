<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\Thuoc;
use App\Services\NotificationService;
use App\Services\QueueManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LuotKhamController extends Controller
{
    protected QueueManagementService $queueService;

    public function __construct(QueueManagementService $queueService)
    {
        $this->queueService = $queueService;
    }
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
            'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'caKham:MaCaKham,GioBatDau,GioKetThuc',
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

        // Tìm kiếm theo tên, SĐT, mã bệnh nhân (BNxxx hoặc số), mã lượt khám hoặc số phiếu
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

        // Lọc theo ngày tiếp nhận / ngày khám (mặc định hôm nay nếu không truyền)
        $dateParam = $request->input('date');
        $effectiveDate = ($dateParam === null) ? date('Y-m-d') : $dateParam;
        if ($effectiveDate && $effectiveDate !== 'all') {
            $query->where(function ($q) use ($effectiveDate) {
                $q->whereDate('NgayKham', $effectiveDate)
                  ->orWhere(function ($sub) use ($effectiveDate) {
                      $sub->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $effectiveDate);
                  });
            });
        } elseif ($from = $request->input('from_date')) {
            $query->whereDate('ThoiGianTiepNhan', '>=', $from);
            if ($to = $request->input('to_date')) {
                $query->whereDate('ThoiGianTiepNhan', '<=', $to);
            }
        }

        // Lọc theo Ca khám
        $shiftId = $request->input('shift_id', $request->input('ca_kham_id'));
        if ($shiftId) {
            $query->where('MaCaKham', $shiftId);
        }

        // Lọc theo Chuyên khoa
        $specialtyId = $request->input('specialty_id');
        if ($specialtyId) {
            $query->where('MaChuyenKhoa', $specialtyId);
        }

        // Lọc theo trạng thái lượt khám
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        // PHÂN TRANG SERVER-SIDE CHO BÁC SĨ (PHASE 13)
        // Mặc định 10 bản ghi/trang, cho phép 10, 20, 50 bản ghi/trang
        $perPage = (int)$request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50])) {
            $perPage = 10;
        }
        $page = max(1, (int)$request->input('page', 1));

        // Sắp xếp thứ tự hàng đợi: Đang khám đầu tiên, sau đó chờ khám (CHO_KHAM và CHO_KHAM_LAI theo FIFO ThoiGianVaoHang)
        // CHÍNH SÁCH CHÍNH THỨC (PHASE 5.1 & 15.4):
        // 1. Phân nhóm trạng thái: DANG_KHAM (1) -> CHO_KHAM/CHO_KHAM_LAI (2) -> CHO_KET_QUA (3) -> HOAN_THANH (4)
        // 2. Ca khám sớm khám trước nếu xem tất cả ca khám: CaKham.GioBatDau ASC
        // 3. FIFO chung theo thời gian vào hàng: ThoiGianVaoHang ASC, MaLuotKham ASC
        // - P2 (Đặt lịch) và P3 (Trực tiếp) nằm chung một hàng đợi, KHÔNG ưu tiên P2 trước P3
        // - Bệnh nhân tái khám CLS tham gia hàng đợi theo đúng thời điểm quay lại, KHÔNG ưu tiên hơn P2/P3
        $orderedQuery = $query
            ->orderByRaw("CASE WHEN TrangThai = 'DANG_KHAM' THEN 1 WHEN TrangThai IN ('CHO_KHAM', 'CHO_KHAM_LAI') THEN 2 WHEN TrangThai = 'CHO_KET_QUA' THEN 3 ELSE 4 END")
            ->orderByRaw("(SELECT GioBatDau FROM ca_kham WHERE ca_kham.MaCaKham = luot_kham.MaCaKham) ASC")
            ->orderBy('ThoiGianVaoHang', 'asc')
            ->orderBy('MaLuotKham', 'asc');

        $visits = (clone $orderedQuery)->paginate($perPage, ['*'], 'page', $page)->withQueryString();

        // Nếu trang hiện tại vượt quá trang cuối, tự động chuyển về trang hợp lệ gần nhất
        if ($page > $visits->lastPage() && $visits->lastPage() > 0) {
            $page = $visits->lastPage();
            $visits = (clone $orderedQuery)->paginate($perPage, ['*'], 'page', $page)->withQueryString();
        }

        // Gán số lần gọi và quyền bỏ lượt cho từng lượt khám trên trang hiện tại
        $visits->getCollection()->each(function ($v) {
            $v->call_count = $this->queueService->getCallCount($v);
            $v->can_skip = ($v->call_count >= 3 && in_array($v->TrangThai, ['CHO_KHAM', 'CHO_KHAM_LAI']));
        });

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $visits->items(),
                'pagination' => [
                    'total' => $visits->total(),
                    'per_page' => $visits->perPage(),
                    'current_page' => $visits->currentPage(),
                    'last_page' => $visits->lastPage(),
                ],
                'total' => $visits->total(),
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

        // Thống kê hôm nay của Bác sĩ (chuẩn hóa đồng bộ với Dashboard)
        $today = now()->toDateString();
        $dateFilter = function ($q) use ($today) {
            $q->where(function ($sub) use ($today) {
                $sub->whereDate('NgayKham', $today)
                    ->orWhere(function ($s) use ($today) {
                        $s->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $today);
                    });
            });
        };

        $baseDoctorQuery = LuotKham::query();
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi) {
            $baseDoctorQuery->where('MaBacSi', $user->bacSi->MaBacSi);
        }

        $stats = [
            'totalToday' => (clone $baseDoctorQuery)->tap($dateFilter)->count(),
            'waiting' => (clone $baseDoctorQuery)->tap($dateFilter)->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])->count(),
            'waitingInitial' => (clone $baseDoctorQuery)->tap($dateFilter)->where('TrangThai', 'CHO_KHAM')->count(),
            'waitingReExam' => (clone $baseDoctorQuery)->tap($dateFilter)->where('TrangThai', 'CHO_KHAM_LAI')->count(),
            'waitingCls' => (clone $baseDoctorQuery)->tap($dateFilter)->where('TrangThai', 'CHO_KET_QUA')->count(),
            'examining' => (clone $baseDoctorQuery)->where('TrangThai', 'DANG_KHAM')->count(),
            'completed' => (clone $baseDoctorQuery)->tap($dateFilter)->where('TrangThai', 'HOAN_THANH')->count(),
        ];

        // Danh sách các ca khám hôm nay của Bác sĩ
        $doctorShifts = collect();
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi) {
            $maBacSi = $user->bacSi->MaBacSi;
            $doctorShifts = CaKham::whereHas('lichLamViec', function ($q) use ($maBacSi, $today) {
                $q->where('MaBacSi', $maBacSi)->whereDate('NgayLamViec', $today);
            })->with('lichLamViec')->orderBy('GioBatDau', 'asc')->get();
        }

        return Inertia::render('Doctor/Examine', [
            'visits' => $visits,
            'selectedVisit' => $selectedVisit,
            'patientHistory' => $patientHistory,
            'availableMedicines' => $availableMedicines,
            'availableServices' => $availableServices,
            'doctorShifts' => $doctorShifts,
            'stats' => $stats,
            'filters' => [
                'date' => $effectiveDate,
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
                'shift_id' => $shiftId ? (int)$shiftId : null,
                'specialty_id' => $specialtyId ? (int)$specialtyId : null,
                'visit_id' => $selectedVisit?->MaLuotKham,
                'per_page' => $perPage,
                'page' => $visits->currentPage(),
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
     * 3. Tiếp nhận bệnh nhân & Tạo lượt khám tích hợp Hybrid Queue
     * - Tiếp nhận từ Lịch hẹn (P2) qua QueueManagementService::checkInAppointment()
     * - Tiếp nhận trực tiếp (P3) qua QueueManagementService::registerWalkIn()
     * - Tự động cấp số thứ tự nguyên tử và định dạng số phiếu
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
            'MaChuyenKhoa' => ['nullable', 'exists:chuyen_khoa,MaChuyenKhoa'],
            'MaCaKham' => ['nullable', 'exists:ca_kham,MaCaKham'],
            'MaBacSi' => ['nullable', 'exists:bac_si,MaBacSi'],
            'CoBHYT' => ['nullable', 'boolean'],
            'SoTheBHYT' => ['nullable', 'string', 'max:15'],
            'MucHuongBHYT' => ['nullable', 'integer', 'in:0,80,95,100'],
            'TuyenKCB' => ['nullable', 'string', 'in:DUNG_TUYEN,TRAI_TUYEN,KHONG_BHYT'],
            'GhiChu' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $maLichHen = $validated['MaLichHen'] ?? null;
            $ghiChu = $validated['GhiChu'] ?? null;

            if ($maLichHen) {
                // TIẾP NHẬN BỆNH NHÂN ĐẶT LỊCH HẸN (P2)
                $visit = $this->queueService->checkInAppointment((int)$maLichHen, $user->MaTaiKhoan);
            } else {
                // TIẾP NHẬN BỆNH NHÂN TRỰC TIẾP (P3)
                $maBenhNhan = (int)$validated['MaBenhNhan'];
                $maCaKham = $validated['MaCaKham'] ?? null;
                $maChuyenKhoa = $validated['MaChuyenKhoa'] ?? null;
                $maBacSi = $validated['MaBacSi'] ?? null;

                // Tự động tìm kiếm Chuyên khoa và Ca khám nếu chỉ truyền MaBacSi (backward compatibility)
                if (!$maCaKham && $maBacSi) {
                    $bs = BacSi::find($maBacSi);
                    $maChuyenKhoa = $maChuyenKhoa ?? $bs?->MaChuyenKhoa;
                    $today = now()->toDateString();
                    $activeCa = CaKham::whereHas('lichLamViec', function ($q) use ($maBacSi, $today) {
                        $q->where('MaBacSi', $maBacSi)->whereDate('NgayLamViec', $today);
                    })->whereIn('TrangThai', ['CON_TRONG', 'MO'])->first();

                    $maCaKham = $activeCa?->MaCaKham;
                }

                if (!$maCaKham || !$maChuyenKhoa) {
                    throw ValidationException::withMessages([
                        'MaCaKham' => 'Vui lòng chọn ca khám và chuyên khoa phù hợp để tiếp nhận.',
                    ]);
                }

                // Kiểm tra chống tạo trùng ở giao diện Lễ tân (Bệnh nhân đã có ca chờ trực tiếp trong ca này)
                $today = now()->toDateString();
                $existingActive = LuotKham::where('MaBenhNhan', $maBenhNhan)
                    ->where('NgayKham', $today)
                    ->where('MaCaKham', $maCaKham)
                    ->where('LoaiHangDoi', 'TRUC_TIEP')
                    ->whereIn('TrangThai', ['CHO_KHAM', 'DANG_KHAM'])
                    ->first();

                if ($existingActive) {
                    throw ValidationException::withMessages([
                        'MaBenhNhan' => "Bệnh nhân hiện đã có lượt khám trực tiếp đang chờ (#{$existingActive->MaLuotKham} - Số phiếu: {$existingActive->SoPhieu}) trong ca khám này.",
                    ]);
                }

                $visit = $this->queueService->registerWalkIn(
                    $maBenhNhan,
                    (int)$maChuyenKhoa,
                    (int)$maCaKham,
                    $user->MaTaiKhoan,
                    3, // Bắt buộc P3 trong hàng đợi thông thường
                    $ghiChu
                );
            }

            // Đồng bộ thông tin BHYT cho ca khám
            $bn = BenhNhan::find($visit->MaBenhNhan);
            $coBhyt = isset($validated['CoBHYT']) ? (bool)$validated['CoBHYT'] : (!empty($bn?->SoTheBHYT) && ($bn?->MucHuongBHYT ?? 0) > 0);
            $soThe = !empty($validated['SoTheBHYT']) ? strtoupper(trim($validated['SoTheBHYT'])) : ($coBhyt ? $bn?->SoTheBHYT : null);
            $mucHuong = isset($validated['MucHuongBHYT']) ? (int)$validated['MucHuongBHYT'] : ($coBhyt ? ($bn?->MucHuongBHYT ?? 80) : 0);
            $tuyenKcb = $validated['TuyenKCB'] ?? ($coBhyt ? 'DUNG_TUYEN' : 'KHONG_BHYT');

            $visit->update([
                'CoBHYT' => $coBhyt,
                'SoTheBHYT' => $coBhyt ? $soThe : null,
                'MucHuongBHYT' => $coBhyt ? $mucHuong : 0,
                'TuyenKCB' => $coBhyt ? $tuyenKcb : 'KHONG_BHYT',
            ]);

            // Cập nhật lại vào hồ sơ bệnh nhân nếu có cung cấp số thẻ mới
            if ($coBhyt && $soThe && $bn && (empty($bn->SoTheBHYT) || $bn->SoTheBHYT !== $soThe || $bn->MucHuongBHYT !== $mucHuong)) {
                $bn->update([
                    'SoTheBHYT' => $soThe,
                    'MucHuongBHYT' => $mucHuong,
                ]);
            }

            // Kích hoạt thông báo nghiệp vụ
            $tenBN = $bn?->HoTen ?? 'Bệnh nhân';

            if ($visit->MaBacSi) {
                NotificationService::sendToDoctor(
                    $visit->MaBacSi,
                    'TIEP_NHAN',
                    'Bệnh nhân mới vào hàng chờ khám',
                    "Bệnh nhân {$tenBN} (Số phiếu: {$visit->SoPhieu}) đã được tiếp nhận vào hàng chờ khám.",
                    "/doctor/examine?visit_id={$visit->MaLuotKham}"
                );
            }

            NotificationService::sendToPatient(
                $visit->MaBenhNhan,
                'TIEP_NHAN',
                'Tiếp nhận phòng khám thành công',
                "Bạn đã được tiếp nhận thành công. Số phiếu của bạn: {$visit->SoPhieu} (STT: {$visit->STTTrongNgay}).",
                "/appointments"
            );

            $msg = "Tiếp nhận thành công bệnh nhân {$tenBN}. Số phiếu: {$visit->SoPhieu} (STT: {$visit->STTTrongNgay}).";

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data' => $visit->load(['benhNhan:MaBenhNhan,HoTen,SoDienThoai', 'bacSi:MaBacSi,HoTen', 'chuyenKhoa', 'caKham']),
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', $e->getMessage());
            }
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bác sĩ gọi bệnh nhân tiếp theo trong hàng đợi (Hybrid Queue Call Next Patient)
     */
    public function callNextPatient(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isBacSi() || !$user->bacSi?->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ mới có quyền gọi bệnh nhân khám.'], 403);
        }

        $maBacSi = $user->bacSi->MaBacSi;

        // Nếu ca khám không được truyền lên, tìm ca khám của bác sĩ hôm nay
        $maCaKham = $request->input('MaCaKham') ?? $request->input('ma_ca_kham') ?? $request->input('shift_id');
        if (!$maCaKham) {
            $nowTime = now()->toTimeString();
            $today = now()->toDateString();
            
            $currentCa = CaKham::whereHas('lichLamViec', function ($q) use ($maBacSi, $today) {
                $q->where('MaBacSi', $maBacSi)->whereDate('NgayLamViec', $today);
            })
            ->whereIn('TrangThai', ['CON_TRONG', 'MO'])
            ->orderByRaw("CASE WHEN ? BETWEEN GioBatDau AND GioKetThuc THEN 1 ELSE 2 END", [$nowTime])
            ->first();

            if (!$currentCa) {
                $currentCa = CaKham::whereHas('lichLamViec', function ($q) use ($maBacSi, $today) {
                    $q->where('MaBacSi', $maBacSi)->whereDate('NgayLamViec', $today);
                })->first();
            }

            if (!$currentCa) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'Không tìm thấy ca khám hôm nay của bác sĩ để gọi bệnh nhân.');
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ca khám hôm nay của bác sĩ để gọi bệnh nhân.',
                ], 422);
            }

            $maCaKham = $currentCa->MaCaKham;
        }

        try {
            $visit = $this->queueService->callNextPatient($maBacSi, (int)$maCaKham);

            if (!$visit) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('info', 'Hàng đợi hiện không có bệnh nhân chờ khám trong ca này.');
                }
                return response()->json([
                    'success' => true,
                    'message' => 'Hàng đợi hiện không có bệnh nhân chờ khám trong ca này.',
                    'data' => null,
                ]);
            }

            $tenBN = $visit->benhNhan?->HoTen ?? 'Bệnh nhân';

            // Kích hoạt thông báo cho bệnh nhân
            NotificationService::sendToPatient(
                $visit->MaBenhNhan,
                'KHAM_BENH',
                'Mời vào phòng khám',
                "Mời bệnh nhân {$tenBN} (Số phiếu: {$visit->SoPhieu}) vào phòng khám của BS. {$user->bacSi->HoTen}.",
                "/appointments"
            );

            if ($request->header('X-Inertia')) {
                return redirect()->route('doctor.examine', ['visit_id' => $visit->MaLuotKham])
                    ->with('success', "Đã gọi bệnh nhân {$tenBN} - Số phiếu: {$visit->SoPhieu}. Bắt đầu khám bệnh.");
            }

            return response()->json([
                'success' => true,
                'message' => "Đã gọi bệnh nhân {$tenBN} - Số phiếu: {$visit->SoPhieu}.",
                'data' => $visit->load('benhNhan'),
            ]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', $msg);
            }
            return response()->json([
                'success' => false,
                'message' => $msg,
            ], 422);
        }
    }

    /**
     * Ghi nhận mỗi lần phát loa gọi bệnh nhân (Chống ghi nhận trùng 3s)
     */
    public function recordPatientCall(Request $request)
    {
        $validated = $request->validate([
            'MaLuotKham' => ['required', 'integer', 'exists:luot_kham,MaLuotKham'],
            'GhiChu'     => ['nullable', 'string', 'max:255'],
            'Token'      => ['nullable', 'string', 'max:64'],
        ]);

        try {
            $userId = $request->user()->MaTaiKhoan;
            $res = $this->queueService->recordPatientCall(
                (int)$validated['MaLuotKham'],
                $userId,
                $validated['GhiChu'] ?? null,
                $validated['Token'] ?? null
            );

            $msg = "Đã phát loa gọi lượt #{$validated['MaLuotKham']}. Lần gọi: {$res['call_count']}/3.";
            if ($res['deduplicated']) {
                $msg = "Lần gọi đã được ghi nhận trước đó (bỏ qua lặp thao tác).";
            }

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success'      => true,
                'message'      => $msg,
                'call_count'   => $res['call_count'],
                'can_skip'     => $res['can_skip'],
                'deduplicated' => $res['deduplicated'],
                'token'        => $res['token'] ?? null,
            ]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', $msg);
            }
            return response()->json(['success' => false, 'message' => $msg], 422);
        }
    }

    /**
     * Xác nhận bỏ lượt sau khi đã phát loa đủ 3 lần
     */
    public function skipPatient(Request $request)
    {
        $validated = $request->validate([
            'MaLuotKham' => ['required', 'integer', 'exists:luot_kham,MaLuotKham'],
            'LyDo'       => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $userId = $request->user()->MaTaiKhoan;
            $lyDo = $validated['LyDo'] ?? 'Gọi 3 lần không có mặt';
            $visit = $this->queueService->skipPatient((int)$validated['MaLuotKham'], $userId, $lyDo);

            $msg = "Đã xác nhận bỏ lượt khám #{$visit->MaLuotKham} (Số phiếu: {$visit->SoPhieu}).";

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data'    => $visit,
            ]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', $msg);
            }
            return response()->json(['success' => false, 'message' => $msg], 422);
        }
    }

    /**
     * Tiếp nhận bệnh nhân quay lại sau cận lâm sàng (CLS Return)
     */
    public function recordClsReturn(Request $request)
    {
        $validated = $request->validate([
            'MaLuotKham' => ['required', 'integer', 'exists:luot_kham,MaLuotKham'],
        ]);

        try {
            $userId = $request->user()->MaTaiKhoan;
            $visit = $this->queueService->recordClsReturn((int)$validated['MaLuotKham'], $userId);

            $msg = "Tiếp nhận quay lại sau CLS thành công cho lượt #{$visit->MaLuotKham} (Số phiếu: {$visit->SoPhieu}). Bệnh nhân đã vào hàng chờ khám lại theo thời điểm hiện tại.";

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data'    => $visit,
            ]);
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', $msg);
            }
            return response()->json(['success' => false, 'message' => $msg], 422);
        }
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
