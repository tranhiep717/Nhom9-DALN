<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChuyenKhoa;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\HoaDon;
use App\Models\ThanhToan;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LichHenController extends Controller
{
    /**
     * Danh sách lịch hẹn
     * - Bệnh nhân xem lịch của chính mình
     * - Bác sĩ xem lịch thuộc các ca khám của mình
     * - Lễ tân và Quản trị viên xem toàn bộ và quản lý
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LichHen::query()->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,EmailLienHe,GioiTinh,NgaySinh',
            'caKham:MaCaKham,MaLichLamViec,GioBatDau,GioKetThuc,SoLuongTiepNhan,TrangThai',
            'caKham.lichLamViec:MaLichLamViec,MaBacSi,NgayLamViec',
            'caKham.lichLamViec.bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'caKham.lichLamViec.bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
        ]);

        // Phân quyền dữ liệu theo vai trò
        if ($user && $user->isBenhNhan()) {
            $maBenhNhan = $user->benhNhan?->MaBenhNhan;
            if (!$maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa có hồ sơ Bệnh nhân.'], 403);
            }
            $query->where('MaBenhNhan', $maBenhNhan);
        } elseif ($user && $user->isBacSi()) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa liên kết hồ sơ Bác sĩ.'], 403);
            }
            // Bác sĩ chỉ xem lịch hẹn thuộc ca khám của mình
            $query->whereHas('caKham.lichLamViec', function ($q) use ($maBacSi) {
                $q->where('MaBacSi', $maBacSi);
            });
        }

        // Bộ lọc ngày hẹn
        if ($date = $request->input('date')) {
            $query->whereHas('caKham.lichLamViec', function ($q) use ($date) {
                $q->whereDate('NgayLamViec', $date);
            });
        }

        // Bộ lọc trạng thái lịch hẹn
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $appointments = $query->orderBy('MaLichHen', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $appointments,
                'total' => $appointments->count(),
            ]);
        }

        // Trả về view Appointments của bệnh nhân
        return Inertia::render('Appointments', [
            'appointments' => $appointments,
        ]);
    }

    /**
     * Xem chi tiết lịch hẹn
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $appointment = LichHen::with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,EmailLienHe,GioiTinh,NgaySinh',
            'caKham:MaCaKham,MaLichLamViec,GioBatDau,GioKetThuc,SoLuongTiepNhan,TrangThai',
            'caKham.lichLamViec:MaLichLamViec,MaBacSi,NgayLamViec',
            'caKham.lichLamViec.bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'caKham.lichLamViec.bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'luotKham',
        ])->find($id);

        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch hẹn.'], 404);
        }

        // Kiểm tra phân quyền: Bệnh nhân không được xem lịch người khác
        if ($user && $user->isBenhNhan() && $user->benhNhan?->MaBenhNhan !== $appointment->MaBenhNhan) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem lịch hẹn của bệnh nhân khác.'], 403);
        }

        // Bác sĩ chỉ xem lịch hẹn thuộc ca khám của mình
        if ($user && $user->isBacSi()) {
            $maBacSiCa = $appointment->caKham?->lichLamViec?->MaBacSi;
            if ($user->bacSi?->MaBacSi !== $maBacSiCa) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem lịch hẹn của bác sĩ khác.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $appointment,
        ]);
    }

    /**
     * ĐẶT LỊCH HẸN KHÁM BỆNH
     * Sử dụng Stored Procedure sp_dat_lich_hen đã được xây dựng sẵn trong database
     * Đảm bảo concurrency control (lockForUpdate) và tính toàn vẹn 100%
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Xác định bệnh nhân đặt lịch
        if ($user && $user->isBenhNhan()) {
            $maBenhNhan = $user->benhNhan?->MaBenhNhan;
            if (!$maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Vui lòng hoàn thiện hồ sơ bệnh nhân trước khi đặt lịch.'], 400);
            }
        } elseif ($user && $user->isLeTan()) {
            // Lễ tân hỗ trợ tiếp nhận đặt lịch trực tiếp tại quầy
            $request->validate(['MaBenhNhan' => ['required', 'exists:benh_nhan,MaBenhNhan']]);
            $maBenhNhan = $request->input('MaBenhNhan');
        } else {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền phân bổ bệnh nhân vào ca khám hoặc đặt lịch khám.'], 403);
        }

        // 2. Validate dữ liệu đầu vào
        $validated = $request->validate([
            'MaCaKham' => ['required', 'exists:ca_kham,MaCaKham'],
            'LyDoKham' => ['nullable', 'string', 'max:1000'],
            'CoBHYT' => ['nullable', 'boolean'],
            'SoTheBHYT' => ['nullable', 'string', 'max:15'],
            'MucHuongBHYT' => ['nullable', 'integer', 'in:0,80,95,100'],
        ], [
            'MaCaKham.required' => 'Vui lòng chọn ca khám.',
            'MaCaKham.exists' => 'Ca khám không tồn tại.',
        ]);

        $maCaKham = (int) $validated['MaCaKham'];
        $lyDoKham = $validated['LyDoKham'] ?? 'Khám bệnh';

        // Cập nhật thông tin BHYT cho bệnh nhân nếu có cung cấp khi đặt lịch
        if (!empty($validated['SoTheBHYT'])) {
            $bnRecord = BenhNhan::find($maBenhNhan);
            if ($bnRecord) {
                $bnRecord->update([
                    'SoTheBHYT' => strtoupper(trim($validated['SoTheBHYT'])),
                    'MucHuongBHYT' => (int) ($validated['MucHuongBHYT'] ?? 80),
                ]);
            }
        }

        // 3. Kiểm tra bệnh nhân không được đặt trùng ca khám này nếu đã có lịch đang chờ/xác nhận
        $daDatTrung = LichHen::where('MaBenhNhan', $maBenhNhan)
            ->where('MaCaKham', $maCaKham)
            ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])
            ->exists();

        if ($daDatTrung) {
            throw ValidationException::withMessages([
                'MaCaKham' => 'Bạn đã có một lịch hẹn đang chờ hoặc đã xác nhận trong ca khám này.',
            ]);
        }

        // 4. Thực thi đặt lịch qua Stored Procedure sp_dat_lich_hen
        try {
            DB::statement('CALL sp_dat_lich_hen(?, ?, ?)', [
                $maBenhNhan,
                $maCaKham,
                $lyDoKham,
            ]);
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage();

            // Bắt các thông điệp lỗi chuẩn từ Stored Procedure SQLSTATE 45000
            if (str_contains($errorMsg, 'da het so luong')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ca khám này đã hết số lượng tiếp nhận. Vui lòng chọn ca khám khác.',
                ], 422);
            }

            if (str_contains($errorMsg, 'khong o trang thai con trong')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ca khám hiện không còn mở để tiếp nhận đặt lịch.',
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi đặt lịch khám: ' . $errorMsg,
            ], 500);
        }

        // 5. Lấy lịch hẹn vừa tạo thành công
        $newLichHen = LichHen::where('MaBenhNhan', $maBenhNhan)
            ->where('MaCaKham', $maCaKham)
            ->orderBy('MaLichHen', 'desc')
            ->with([
                'caKham.lichLamViec.bacSi.chuyenKhoa',
            ])->first();

        // Kích hoạt thông báo nghiệp vụ
        if ($newLichHen) {
            $bn = BenhNhan::find($maBenhNhan);
            $tenBN = $bn?->HoTen ?? 'Bệnh nhân';
            $ngayKham = $newLichHen->caKham?->lichLamViec?->NgayLamViec ?? date('Y-m-d');
            $gioKham = substr($newLichHen->caKham?->GioBatDau ?? '08:00', 0, 5);
            $maBacSiCa = $newLichHen->caKham?->lichLamViec?->MaBacSi;

            // Thông báo Bệnh nhân
            NotificationService::sendToPatient(
                $maBenhNhan,
                'LICH_HEN',
                'Đặt lịch khám thành công',
                "Lịch hẹn #{$newLichHen->MaLichHen} vào lúc {$gioKham} ngày {$ngayKham} đã được ghi nhận thành công.",
                '/appointments'
            );

            // Thông báo Lễ tân
            NotificationService::sendToRole(
                'LE_TAN',
                'LICH_HEN',
                'Lịch hẹn khám mới',
                "Bệnh nhân {$tenBN} vừa đặt lịch hẹn #{$newLichHen->MaLichHen} khám ngày {$ngayKham}.",
                '/receptionist/queue'
            );

            // Thông báo Bác sĩ
            if ($maBacSiCa) {
                NotificationService::sendToDoctor(
                    $maBacSiCa,
                    'LICH_HEN',
                    'Bệnh nhân đăng ký khám',
                    "Bệnh nhân {$tenBN} vừa đăng ký ca khám ngày {$ngayKham} ({$gioKham}).",
                    '/appointments'
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Đặt lịch khám thành công. Lịch hẹn của bạn đang chờ xác nhận.',
            'data' => $newLichHen,
        ], 201);
    }

    /**
     * HỦY LỊCH HẸN
     * - Bệnh nhân chỉ hủy được lịch của chính mình khi lịch chưa tiếp nhận
     * - Khi hủy, slot ca khám lập tức được giải phóng cho bệnh nhân khác
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $appointment = LichHen::find($id);

        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch hẹn.'], 404);
        }

        // Phân quyền hủy: Bệnh nhân chỉ hủy lịch của mình
        if ($user && $user->isBenhNhan()) {
            if ($user->benhNhan?->MaBenhNhan !== $appointment->MaBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy lịch hẹn của bệnh nhân khác.'], 403);
            }
        } elseif ($user && !$user->isLeTan() && !$user->isQuanTriVien()) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy lịch hẹn này.'], 403);
        }

        // Kiểm tra trạng thái có được phép hủy không
        if (in_array($appointment->TrangThai, ['DA_TIEP_NHAN', 'HOAN_THANH'])) {
            return response()->json([
                'success' => false,
                'message' => 'Lịch hẹn đã được tiếp nhận khám hoặc đã hoàn thành, không thể hủy.',
            ], 422);
        }

        if ($appointment->TrangThai === 'DA_HUY') {
            return response()->json([
                'success' => false,
                'message' => 'Lịch hẹn này đã được hủy trước đó.',
            ], 422);
        }

        // Cập nhật trạng thái DA_HUY
        $appointment->update([
            'TrangThai' => 'DA_HUY',
        ]);

        // Kích hoạt thông báo
        $bn = BenhNhan::find($appointment->MaBenhNhan);
        $tenBN = $bn?->HoTen ?? 'Bệnh nhân';
        if ($user && $user->isBenhNhan()) {
            NotificationService::sendToRole('LE_TAN', 'LICH_HEN', 'Bệnh nhân hủy lịch hẹn', "Bệnh nhân {$tenBN} đã hủy lịch hẹn #{$appointment->MaLichHen}.", '/receptionist/queue');
        } else {
            NotificationService::sendToPatient($appointment->MaBenhNhan, 'LICH_HEN', 'Lịch hẹn đã bị hủy', "Lịch hẹn #{$appointment->MaLichHen} của bạn đã bị hủy bởi nhân viên phòng khám.", '/appointments');
        }

        return response()->json([
            'success' => true,
            'message' => 'Hủy lịch hẹn thành công. Chỗ khám đã được giải phóng.',
            'data' => $appointment->fresh(),
        ]);
    }

    /**
     * LỄ TÂN / ADMIN CẬP NHẬT TRẠNG THÁI LỊCH HẸN
     * (Xác nhận lịch, tiếp nhận vào phòng khám...)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Chỉ Lễ tân và Quản trị viên mới được đổi trạng thái quy trình
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Chỉ Lễ tân hoặc Quản trị viên mới có quyền cập nhật trạng thái lịch hẹn.'], 403);
        }

        $appointment = LichHen::find($id);
        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch hẹn.'], 404);
        }

        $validated = $request->validate([
            'TrangThai' => ['required', 'string', 'in:CHO_XAC_NHAN,DA_XAC_NHAN,DA_TIEP_NHAN,HOAN_THANH,DA_HUY'],
        ], [
            'TrangThai.required' => 'Vui lòng chọn trạng thái mới.',
            'TrangThai.in' => 'Trạng thái lịch hẹn không hợp lệ.',
        ]);

        $appointment->update([
            'TrangThai' => $validated['TrangThai'],
        ]);

        if ($validated['TrangThai'] === 'DA_XAC_NHAN') {
            NotificationService::sendToPatient(
                $appointment->MaBenhNhan,
                'LICH_HEN',
                'Lịch hẹn đã được xác nhận',
                "Lịch hẹn #{$appointment->MaLichHen} của bạn đã được lễ tân xác nhận thành công.",
                '/appointments'
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Cập nhật trạng thái lịch hẹn sang '{$validated['TrangThai']}' thành công.",
            'data' => $appointment->fresh(),
        ]);
    }

    /**
     * LẤY DỮ LIỆU HÀNG CHỜ PHỤC VỤ CẢ LỄ TÂN VÀ QUẢN TRỊ VIÊN
     */
    public function getQueueData(Request $request): array
    {
        $query = LichHen::query()->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,EmailLienHe,GioiTinh,NgaySinh',
            'caKham:MaCaKham,MaLichLamViec,GioBatDau,GioKetThuc,SoLuongTiepNhan,TrangThai',
            'caKham.lichLamViec:MaLichLamViec,MaBacSi,NgayLamViec',
            'caKham.lichLamViec.bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'caKham.lichLamViec.bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'luotKham:MaLuotKham,MaLichHen,TrangThai,ThoiGianTiepNhan,ThoiGianBatDauKham,ThoiGianKetThucKham',
        ]);

        // Bộ lọc ngày hẹn (mặc định hôm nay nếu không truyền hoặc không chọn 'all')
        $dateParam = $request->input('date');
        $effectiveDate = ($dateParam === null) ? date('Y-m-d') : $dateParam;

        if ($effectiveDate && $effectiveDate !== 'all') {
            $query->whereHas('caKham.lichLamViec', function ($q) use ($effectiveDate) {
                $q->whereDate('NgayLamViec', $effectiveDate);
            });
        }

        // Lọc theo Bác sĩ
        if ($doctorId = $request->input('doctor_id')) {
            $query->whereHas('caKham.lichLamViec', function ($q) use ($doctorId) {
                $q->where('MaBacSi', $doctorId);
            });
        }

        // Lọc theo Chuyên khoa
        if ($specialtyId = $request->input('specialty_id')) {
            $query->whereHas('caKham.lichLamViec.bacSi', function ($q) use ($specialtyId) {
                $q->where('MaChuyenKhoa', $specialtyId);
            });
        }

        // Lọc theo trạng thái lịch hẹn
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        // Tìm kiếm theo tên hoặc số điện thoại bệnh nhân
        if ($search = $request->input('search')) {
            $query->whereHas('benhNhan', function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%");
            });
        }

        $appointments = $query->orderBy('MaLichHen', 'desc')->get();

        // 2. Truy vấn Hàng đợi Khám tổng hợp (Hybrid Queue: Đặt lịch P2 + Trực tiếp P3)
        $activeQueueQuery = LuotKham::query()->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh',
            'bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'caKham:MaCaKham,GioBatDau,GioKetThuc',
            'lichHen:MaLichHen,TrangThai',
        ]);

        if ($effectiveDate && $effectiveDate !== 'all') {
            $activeQueueQuery->where(function ($q) use ($effectiveDate) {
                $q->whereDate('NgayKham', $effectiveDate)
                  ->orWhere(function ($sub) use ($effectiveDate) {
                      $sub->whereNull('NgayKham')->whereDate('ThoiGianTiepNhan', $effectiveDate);
                  });
            });
        }

        if ($doctorId) {
            $activeQueueQuery->where('MaBacSi', $doctorId);
        }

        if ($specialtyId) {
            $activeQueueQuery->where('MaChuyenKhoa', $specialtyId);
        }

        // Lọc theo Ca khám
        $shiftId = $request->input('shift_id', $request->input('ca_kham_id'));
        if ($shiftId) {
            $activeQueueQuery->where('MaCaKham', $shiftId);
        }

        // Lọc theo trạng thái lượt khám
        if ($status && in_array($status, ['CHO_KHAM', 'DANG_KHAM', 'CHO_KET_QUA', 'CHO_KHAM_LAI', 'HOAN_THANH', 'BO_LUOT'])) {
            $activeQueueQuery->where('TrangThai', $status);
        }

        if ($search) {
            $activeQueueQuery->where(function ($q) use ($search) {
                $q->where('SoPhieu', 'like', "%{$search}%")
                  ->orWhereHas('benhNhan', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                  });
            });
        }

        // PHÂN TRANG SERVER-SIDE CHO BẢNG HÀNG ĐỢI (PHASE 13)
        // Mặc định 10 bản ghi/trang, cho phép 10, 20, 50 bản ghi/trang
        $perPage = (int)$request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50])) {
            $perPage = 10;
        }
        $page = max(1, (int)$request->input('page', 1));

        $orderedQueueQuery = $activeQueueQuery
            ->orderByRaw("CASE WHEN TrangThai = 'DANG_KHAM' THEN 1 WHEN TrangThai IN ('CHO_KHAM', 'CHO_KHAM_LAI') THEN 2 WHEN TrangThai = 'CHO_KET_QUA' THEN 3 ELSE 4 END")
            ->orderBy('ThoiGianVaoHang', 'asc')
            ->orderBy('MaLuotKham', 'asc');

        $activeQueue = (clone $orderedQueueQuery)->paginate($perPage, ['*'], 'page', $page)->withQueryString();

        // Nếu trang hiện tại vượt quá trang cuối (sau khi xóa/hủy lượt), tự động chuyển về trang hợp lệ gần nhất
        if ($page > $activeQueue->lastPage() && $activeQueue->lastPage() > 0) {
            $page = $activeQueue->lastPage();
            $activeQueue = (clone $orderedQueueQuery)->paginate($perPage, ['*'], 'page', $page)->withQueryString();
        }

        // Gán số lần gọi và quyền bỏ lượt cho từng lượt khám trên trang hiện tại
        $queueService = app(\App\Services\QueueManagementService::class);
        $activeQueue->getCollection()->each(function ($v) use ($queueService) {
            $v->call_count = $queueService->getCallCount($v);
            $v->can_skip = ($v->call_count >= 3 && in_array($v->TrangThai, ['CHO_KHAM', 'CHO_KHAM_LAI']));
        });

        // Danh mục Bác sĩ và Chuyên khoa phục vụ dropdown bộ lọc
        $doctors = BacSi::where('TrangThai', 'HOAT_DONG')
            ->select('MaBacSi', 'HoTen', 'HocVi', 'MaChuyenKhoa')
            ->orderBy('HoTen', 'asc')
            ->get();

        $specialties = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')
            ->select('MaChuyenKhoa', 'TenChuyenKhoa')
            ->orderBy('TenChuyenKhoa', 'asc')
            ->get();

        // Danh mục Bệnh nhân và Ca khám hôm nay phục vụ Modal tiếp nhận trực tiếp
        $availablePatients = BenhNhan::select('MaBenhNhan', 'HoTen', 'SoDienThoai', 'GioiTinh', 'NgaySinh')
            ->orderBy('HoTen', 'asc')
            ->take(100)
            ->get();

        $shiftsQuery = CaKham::whereIn('TrangThai', ['CON_TRONG', 'MO'])
            ->with(['lichLamViec.bacSi.chuyenKhoa']);

        if ($effectiveDate && $effectiveDate !== 'all') {
            $shiftsQuery->whereHas('lichLamViec', function ($q) use ($effectiveDate) {
                $q->whereDate('NgayLamViec', $effectiveDate);
            });
        }

        $availableShifts = $shiftsQuery->get();

        // Thống kê nhanh hàng chờ hôm nay
        $todayDate = date('Y-m-d');
        $todayAppointments = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($todayDate) {
            $q->whereDate('NgayLamViec', $todayDate);
        })->get();

        $todayVisits = LuotKham::where(function ($q) use ($todayDate) {
            $q->whereDate('NgayKham', $todayDate)
              ->orWhereDate('ThoiGianTiepNhan', $todayDate);
        })->get();

        $p2Count = $todayVisits->filter(fn($v) => $v->LoaiHangDoi === 'DAT_LICH' || $v->MucUuTien == 2 || !empty($v->MaLichHen))->count();
        $p3Count = $todayVisits->filter(fn($v) => ($v->LoaiHangDoi === 'TRUC_TIEP' || $v->MucUuTien == 3) && empty($v->MaLichHen))->count();

        $stats = [
            'total_today' => $todayAppointments->count() + $todayVisits->where('LoaiHangDoi', 'TRUC_TIEP')->count(),
            'waiting_checkin' => $todayAppointments->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])->count(),
            'received' => $todayVisits->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])->count(),
            'examining' => $todayVisits->where('TrangThai', 'DANG_KHAM')->count(),
            'completed' => $todayVisits->where('TrangThai', 'HOAN_THANH')->count(),
            'active_in_queue' => $todayVisits->whereIn('TrangThai', ['CHO_KHAM', 'DANG_KHAM', 'CHO_KET_QUA', 'CHO_KHAM_LAI'])->count(),
            'booked_count' => $p2Count,
            'walkin_count' => $p3Count,
            'queue_total' => $activeQueue->total(),
            'chartStats' => [
                'statusDistribution' => [
                    ['name' => 'Chờ khám', 'status' => 'CHO_KHAM', 'value' => $todayVisits->where('TrangThai', 'CHO_KHAM')->count(), 'color' => '#F59E0B'],
                    ['name' => 'Đang khám', 'status' => 'DANG_KHAM', 'value' => $todayVisits->where('TrangThai', 'DANG_KHAM')->count(), 'color' => '#0284C7'],
                    ['name' => 'Chờ KQ CLS', 'status' => 'CHO_KET_QUA', 'value' => $todayVisits->where('TrangThai', 'CHO_KET_QUA')->count(), 'color' => '#EAB308'],
                    ['name' => 'Chờ khám lại', 'status' => 'CHO_KHAM_LAI', 'value' => $todayVisits->where('TrangThai', 'CHO_KHAM_LAI')->count(), 'color' => '#0D9488'],
                    ['name' => 'Đã xong', 'status' => 'HOAN_THANH', 'value' => $todayVisits->where('TrangThai', 'HOAN_THANH')->count(), 'color' => '#10B981'],
                    ['name' => 'Bỏ lượt', 'status' => 'BO_LUOT', 'value' => $todayVisits->where('TrangThai', 'BO_LUOT')->count(), 'color' => '#F43F5E'],
                ],
                'priorityDistribution' => [
                    ['name' => 'P2 Đặt lịch', 'value' => $p2Count, 'color' => '#10B981'],
                    ['name' => 'P3 Trực tiếp', 'value' => $p3Count, 'color' => '#8B5CF6'],
                ],
                'totalVisits' => $todayVisits->count(),
                'totalP2' => $p2Count,
                'totalP3' => $p3Count,
            ],
        ];

        return [
            'appointments' => $appointments,
            'activeQueue' => $activeQueue,
            'doctors' => $doctors,
            'specialties' => $specialties,
            'availablePatients' => $availablePatients,
            'availableShifts' => $availableShifts,
            'stats' => $stats,
            'filters' => [
                'date' => $effectiveDate,
                'doctor_id' => $doctorId ? (int)$doctorId : null,
                'specialty_id' => $specialtyId ? (int)$specialtyId : null,
                'shift_id' => $shiftId ? (int)$shiftId : null,
                'status' => $status,
                'search' => $search,
                'per_page' => $perPage,
                'page' => $activeQueue->currentPage(),
            ],
        ];
    }

    /**
     * MÀN HÌNH QUẢN LÝ HÀNG CHỜ CHO LỄ TÂN (Inertia View Receptionist/Queue)
     * - Kết nối dữ liệu thực tế từ MySQL
     * - Eager load: Bệnh nhân, Ca khám, Lịch làm việc, Bác sĩ, Chuyên khoa, Lượt khám
     * - Hỗ trợ lọc theo: Ngày khám, Bác sĩ, Chuyên khoa, Trạng thái, Tìm kiếm
     */
    public function queue(Request $request)
    {
        $user = $request->user();

        // Bảo mật: Chỉ Lễ tân và Quản trị viên mới được truy cập màn hình hàng chờ lễ tân
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập trang quản lý hàng chờ của lễ tân.');
        }

        $data = $this->getQueueData($request);
        return Inertia::render('Receptionist/Queue', $data);
    }

    /**
     * DỮ LIỆU BÀN LÀM VIỆC LỄ TÂN DÙNG CHUNG (LỄ TÂN & ADMIN)
     */
    public function getReceptionistDashboardData(Request $request): array
    {
        $today = now()->toDateString();

        // 1. Lịch hẹn hôm nay toàn viện (loại trừ đã hủy)
        $todayAppointmentsCount = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })->where('TrangThai', '!=', 'DA_HUY')->count();

        // 2. Bệnh nhân chưa đến: lịch hẹn hôm nay có trạng thái CHO_XAC_NHAN hoặc DA_XAC_NHAN
        $notArrivedCount = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])->count();

        // 3. Bệnh nhân đã tiếp nhận: lịch hẹn hôm nay có trạng thái DA_TIEP_NHAN
        $checkedInCount = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })->where('TrangThai', 'DA_TIEP_NHAN')->count();

        // 4. Lượt khám đang diễn ra trong phòng khám hôm nay: LuotKham TrangThai = 'DANG_KHAM'
        $inProgressVisitsCount = LuotKham::whereDate('ThoiGianTiepNhan', $today)
            ->where('TrangThai', 'DANG_KHAM')
            ->count();

        // 5. Hóa đơn còn công nợ chưa thu xong toàn viện
        $unpaidInvoicesCount = HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])->count();

        // 6. Doanh thu thực thu trong ngày hôm nay: tính từ giao dịch thanh toán thành công
        $todayRevenue = (float) ThanhToan::whereDate('ThoiGianThanhToan', $today)
            ->whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
            ->sum('SoTien');

        // 7. Danh sách lịch hẹn hôm nay (eager load tránh N+1)
        $todayAppointmentsList = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })
        ->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai',
            'caKham.lichLamViec.bacSi:MaBacSi,HoTen,HocVi',
            'caKham:MaCaKham,GioBatDau,GioKetThuc',
            'luotKham:MaLuotKham,MaLichHen,TrangThai',
        ])
        ->orderBy('MaLichHen', 'desc')
        ->take(15)
        ->get()
        ->map(function ($app) {
            $statusText = match ($app->TrangThai) {
                'CHO_XAC_NHAN' => 'Chưa đến',
                'DA_XAC_NHAN' => 'Chưa đến',
                'DA_TIEP_NHAN' => 'Đã tiếp nhận',
                'HOAN_THANH' => 'Hoàn thành',
                'DA_HUY' => 'Đã hủy',
                default => $app->TrangThai,
            };

            return [
                'id' => 'LH' . str_pad($app->MaLichHen, 6, '0', STR_PAD_LEFT),
                'appointmentId' => $app->MaLichHen,
                'name' => $app->benhNhan?->HoTen ?? 'Bệnh nhân',
                'phone' => $app->benhNhan?->SoDienThoai ?? 'N/A',
                'time' => $app->caKham ? substr($app->caKham->GioBatDau, 0, 5) : '--:--',
                'doctor' => $app->caKham?->lichLamViec?->bacSi?->HoTen ?? 'Bác sĩ trực',
                'status' => $statusText,
                'rawStatus' => $app->TrangThai,
            ];
        });

        $stats = [
            'todayAppointments' => $todayAppointmentsCount,
            'notArrived' => $notArrivedCount,
            'checkedIn' => $checkedInCount,
            'inProgressVisits' => $inProgressVisitsCount,
            'unpaidInvoices' => $unpaidInvoicesCount,
            'todayRevenue' => $todayRevenue,
        ];

        return [
            'stats' => $stats,
            'appointments' => $todayAppointmentsList,
        ];
    }

    /**
     * DASHBOARD / BÀN LÀM VIỆC LỄ TÂN THỜI GIAN THỰC TỪ MYSQL
     */
    public function receptionistDashboard(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập vào bàn làm việc của Lễ tân.');
        }

        $data = $this->getReceptionistDashboardData($request);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        return Inertia::render('Receptionist/Dashboard', $data);
    }
}
