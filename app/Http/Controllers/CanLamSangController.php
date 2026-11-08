<?php

namespace App\Http\Controllers;

use App\Models\ChiDinhDichVu;
use App\Models\DichVu;
use App\Models\LichLamViec;
use App\Models\LuotKham;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CanLamSangController extends Controller
{
    /**
     * DASHBOARD & BÀN LÀM VIỆC KỸ THUẬT VIÊN CẬN LÂM SÀNG
     */
    public function dashboard(Request $request): InertiaResponse|JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập vào phân hệ Cận lâm sàng.');
        }

        $today = now()->toDateString();
        $dateParam = $request->input('date', $today);
        $statusParam = $request->input('status');
        $searchParam = trim((string) $request->input('search', ''));
        $serviceParam = $request->input('service_id');
        $shiftParam = $request->input('shift_id');
        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50], true)) {
            $perPage = 10;
        }

        $query = ChiDinhDichVu::query()->with([
            'dichVu:MaDichVu,TenDichVu,DonGia,MoTa',
            'bacSi:MaBacSi,HoTen,HocVi',
            'nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            'luotKham:MaLuotKham,MaBenhNhan,MaBacSi,MaCaKham,ThoiGianTiepNhan,TrangThai,SoPhieu',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
            'luotKham.caKham:MaCaKham,GioBatDau,GioKetThuc,TrangThai',
        ]);

        // Lọc theo ngày chỉ định
        if ($dateParam && $dateParam !== 'all') {
            $query->whereDate('NgayChiDinh', $dateParam);
        }

        // Lọc theo trạng thái
        if ($statusParam) {
            if ($statusParam === 'CHO_TIEP_NHAN') {
                $query->whereIn('TrangThai', ['CHO_TIEP_NHAN', 'CHO_THUC_HIEN']);
            } elseif ($statusParam === 'DA_CO_KET_QUA') {
                $query->whereIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH']);
            } else {
                $query->where('TrangThai', $statusParam);
            }
        }

        // Lọc theo loại dịch vụ
        if ($serviceParam) {
            $query->where('MaDichVu', $serviceParam);
        }

        // Lọc theo ca CLS (nếu có dữ liệu ca từ lượt khám)
        if ($shiftParam) {
            $query->whereHas('luotKham', function ($q) use ($shiftParam) {
                $q->where('MaCaKham', $shiftParam);
            });
        }

        // Tìm kiếm theo mã BN, tên, số điện thoại, mã lượt khám, số phiếu, mã chỉ định
        if ($searchParam !== '') {
            $cleanDigits = preg_replace('/[^0-9]/', '', $searchParam);
            $query->where(function ($q) use ($searchParam, $cleanDigits) {
                $q->where('MaChiDinh', 'like', "%{$searchParam}%")
                  ->orWhere('MaLuotKham', 'like', "%{$searchParam}%")
                  ->orWhereHas('luotKham', function ($sub) use ($searchParam, $cleanDigits) {
                      $sub->where('SoPhieu', 'like', "%{$searchParam}%")
                          ->orWhere('MaLuotKham', 'like', "%{$searchParam}%");

                      if ($cleanDigits !== '') {
                          $sub->orWhere('MaLuotKham', (int) $cleanDigits);
                      }
                  })
                  ->orWhereHas('luotKham.benhNhan', function ($sub) use ($searchParam, $cleanDigits) {
                      $sub->where('HoTen', 'like', "%{$searchParam}%")
                          ->orWhere('SoDienThoai', 'like', "%{$searchParam}%");

                      if ($cleanDigits !== '') {
                          $sub->orWhere('MaBenhNhan', (int) $cleanDigits);
                      }
                  });
            });
        }

        $requests = $query->orderBy('NgayChiDinh', 'desc')->paginate($perPage)->withQueryString();

        // Thống kê nhanh hôm nay
        $todayQuery = ChiDinhDichVu::whereDate('NgayChiDinh', $today);
        $stats = [
            'totalToday' => (clone $todayQuery)->count(),
            'waitingReceive' => (clone $todayQuery)->whereIn('TrangThai', ['CHO_TIEP_NHAN', 'CHO_THUC_HIEN'])->count(),
            'processing' => (clone $todayQuery)->whereIn('TrangThai', ['DA_TIEP_NHAN', 'DANG_THUC_HIEN'])->count(),
            'completedToday' => (clone $todayQuery)->whereIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH'])->count(),
        ];

        // Danh mục dịch vụ khả dụng phục vụ bộ lọc
        $services = DichVu::where('TrangThai', 'HOAT_DONG')
            ->select('MaDichVu', 'TenDichVu', 'DonGia')
            ->orderBy('TenDichVu', 'asc')
            ->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'requests' => $requests,
                    'stats' => $stats,
                    'services' => $services,
                ],
            ]);
        }

        return Inertia::render('CanLamSang/Dashboard', [
            'requests' => $requests,
            'stats' => $stats,
            'services' => $services,
            'filters' => [
                'date' => $dateParam,
                'status' => $statusParam,
                'search' => $searchParam,
                'service_id' => $serviceParam ? (int)$serviceParam : null,
            ],
        ]);
    }

    protected function buildClsListQuery(Request $request, ?array $statuses = null)
    {
        $query = ChiDinhDichVu::query()->with([
            'dichVu:MaDichVu,TenDichVu,DonGia,MoTa',
            'bacSi:MaBacSi,HoTen,HocVi',
            'nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            'luotKham:MaLuotKham,MaBenhNhan,MaBacSi,MaCaKham,ThoiGianTiepNhan,TrangThai,SoPhieu',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
            'luotKham.caKham:MaCaKham,GioBatDau,GioKetThuc,TrangThai',
        ]);

        if ($statuses) {
            $query->whereIn('TrangThai', $statuses);
        }

        $dateParam = $request->input('date');
        if ($dateParam && $dateParam !== 'all') {
            $query->whereDate('NgayChiDinh', $dateParam);
        }

        $serviceParam = $request->input('service_id');
        if ($serviceParam) {
            $query->where('MaDichVu', $serviceParam);
        }

        $searchParam = trim((string) $request->input('search', ''));
        if ($searchParam !== '') {
            $cleanDigits = preg_replace('/[^0-9]/', '', $searchParam);
            $query->where(function ($q) use ($searchParam, $cleanDigits) {
                $q->where('MaChiDinh', 'like', "%{$searchParam}%")
                  ->orWhere('MaLuotKham', 'like', "%{$searchParam}%")
                  ->orWhereHas('luotKham', function ($sub) use ($searchParam, $cleanDigits) {
                      $sub->where('SoPhieu', 'like', "%{$searchParam}%")
                          ->orWhere('MaLuotKham', 'like', "%{$searchParam}%");

                      if ($cleanDigits !== '') {
                          $sub->orWhere('MaLuotKham', (int) $cleanDigits);
                      }
                  })
                  ->orWhereHas('luotKham.benhNhan', function ($sub) use ($searchParam, $cleanDigits) {
                      $sub->where('HoTen', 'like', "%{$searchParam}%")
                          ->orWhere('SoDienThoai', 'like', "%{$searchParam}%");

                      if ($cleanDigits !== '') {
                          $sub->orWhere('MaBenhNhan', (int) $cleanDigits);
                      }
                  });
            });
        }

        return $query;
    }

    public function schedule(Request $request): InertiaResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền truy cập lịch làm việc CLS.');
        }

        $dateParam = $request->input('date');
        $fromDate = $request->input('from_date', now()->startOfWeek()->toDateString());
        $toDate = $request->input('to_date', now()->endOfWeek()->toDateString());

        // Lấy lịch làm việc của chính kỹ thuật viên này
        $query = LichLamViec::query()
            ->with(['taiKhoan.vaiTro', 'caKhams'])
            ->where(function ($q) use ($user, $request) {
                if ($user->isQuanTriVien() && $accId = $request->input('account_id')) {
                    $q->where('MaTaiKhoan', $accId);
                } else {
                    $q->where('MaTaiKhoan', $user->MaTaiKhoan);
                }
            });

        if ($dateParam && $dateParam !== 'all') {
            $query->whereDate('NgayLamViec', $dateParam);
        } else {
            $query->whereDate('NgayLamViec', '>=', $fromDate)
                  ->whereDate('NgayLamViec', '<=', $toDate);
        }

        $schedules = $query->orderBy('NgayLamViec', 'asc')->orderBy('GioBatDau', 'asc')->get();

        // Đơn chờ tôi xác nhận đổi ca
        $requestsForMe = \App\Models\DonTuNhanSu::with(['taiKhoan.vaiTro', 'taiKhoan.nhanVien', 'taiKhoan.bacSi', 'lichLamViec', 'lichDoiSang'])
            ->where('TaiKhoanDoiCung', $user->MaTaiKhoan)
            ->where('TrangThai', 'CHO_DONG_NGHIEP_XAC_NHAN')
            ->orderBy('created_at', 'desc')
            ->get();

        // Đơn cá nhân của tôi
        $myRequests = \App\Models\DonTuNhanSu::with(['taiKhoanDoiCung.nhanVien', 'taiKhoanDoiCung.bacSi', 'lichLamViec', 'lichDoiSang'])
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $colleagues = \App\Http\Controllers\ChamCongController::getEligibleColleagues($user);

        return Inertia::render('CanLamSang/Schedule', [
            'schedules' => $schedules,
            'requestsForMe' => $requestsForMe,
            'myRequests' => $myRequests,
            'colleagues' => $colleagues,
            'filters' => [
                'date' => $dateParam,
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    public function pending(Request $request): InertiaResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền xem danh sách chờ thực hiện CLS.');
        }

        $query = $this->buildClsListQuery($request, ['CHO_TIEP_NHAN', 'CHO_THUC_HIEN']);
        $requests = $query->orderBy('NgayChiDinh', 'desc')->paginate((int) $request->input('per_page', 10))->withQueryString();

        return Inertia::render('CanLamSang/Pending', [
            'requests' => $requests,
            'services' => DichVu::where('TrangThai', 'HOAT_DONG')->select('MaDichVu', 'TenDichVu')->orderBy('TenDichVu', 'asc')->get(),
            'filters' => [
                'date' => $request->input('date'),
                'service_id' => $request->input('service_id'),
                'search' => trim((string) $request->input('search', '')),
                'per_page' => $request->input('per_page', 10),
            ],
        ]);
    }

    public function processing(Request $request): InertiaResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền xem danh sách đang thực hiện CLS.');
        }

        $query = $this->buildClsListQuery($request, ['DA_TIEP_NHAN', 'DANG_THUC_HIEN']);
        $requests = $query->orderBy('NgayChiDinh', 'desc')->paginate((int) $request->input('per_page', 10))->withQueryString();

        return Inertia::render('CanLamSang/Processing', [
            'requests' => $requests,
            'services' => DichVu::where('TrangThai', 'HOAT_DONG')->select('MaDichVu', 'TenDichVu')->orderBy('TenDichVu', 'asc')->get(),
            'filters' => [
                'date' => $request->input('date'),
                'service_id' => $request->input('service_id'),
                'search' => trim((string) $request->input('search', '')),
                'per_page' => $request->input('per_page', 10),
            ],
        ]);
    }

    public function results(Request $request): InertiaResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            abort(403, 'Bạn không có quyền xem kết quả CLS.');
        }

        $query = $this->buildClsListQuery($request, ['DA_CO_KET_QUA', 'HOAN_THANH']);
        $requests = $query->orderBy('NgayChiDinh', 'desc')->paginate((int) $request->input('per_page', 10))->withQueryString();

        return Inertia::render('CanLamSang/Results', [
            'requests' => $requests,
            'services' => DichVu::where('TrangThai', 'HOAT_DONG')->select('MaDichVu', 'TenDichVu')->orderBy('TenDichVu', 'asc')->get(),
            'filters' => [
                'date' => $request->input('date'),
                'service_id' => $request->input('service_id'),
                'search' => trim((string) $request->input('search', '')),
                'per_page' => $request->input('per_page', 10),
            ],
        ]);
    }

    /**
     * KỸ THUẬT VIÊN TIẾP NHẬN CHỈ ĐỊNH
     */
    public function receive(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tiếp nhận chỉ định cận lâm sàng.'], 403);
        }

        $chiDinh = ChiDinhDichVu::with(['dichVu', 'luotKham.benhNhan'])->find($id);
        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định.'], 404);
        }

        if (in_array($chiDinh->TrangThai, ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'])) {
            return response()->json(['success' => false, 'message' => "Chỉ định đã ở trạng thái '{$chiDinh->TrangThai}', không thể tiếp nhận lại."], 422);
        }

        $chiDinh->update([
            'TrangThai' => 'DA_TIEP_NHAN',
            'MaNhanVienThucHien' => $user->MaTaiKhoan,
        ]);

        // Thông báo Bác sĩ chỉ định
        $tenBN = $chiDinh->luotKham?->benhNhan?->HoTen ?? 'Bệnh nhân';
        $tenDV = $chiDinh->dichVu?->TenDichVu ?? 'Dịch vụ';
        NotificationService::sendToDoctor(
            $chiDinh->MaBacSi,
            'KHAM_BENH',
            'Chỉ định đã được tiếp nhận',
            "Kỹ thuật viên đã tiếp nhận chỉ định {$tenDV} của BN {$tenBN}.",
            "/doctor/examine?visit_id={$chiDinh->MaLuotKham}"
        );

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', "Đã tiếp nhận chỉ định [{$tenDV}] thành công.");
        }

        return response()->json([
            'success' => true,
            'message' => 'Tiếp nhận chỉ định thành công.',
            'data' => $chiDinh->fresh(['dichVu', 'nhanVienThucHien']),
        ]);
    }

    /**
     * KỸ THUẬT VIÊN BẮT ĐẦU THỰC HIỆN DỊCH VỤ
     */
    public function start(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền thực hiện chỉ định.'], 403);
        }

        $chiDinh = ChiDinhDichVu::find($id);
        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định.'], 404);
        }

        $chiDinh->update([
            'TrangThai' => 'DANG_THUC_HIEN',
            'MaNhanVienThucHien' => $user->MaTaiKhoan,
            'NgayThucHien' => $chiDinh->NgayThucHien ?? now(),
        ]);

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Bắt đầu thực hiện dịch vụ kỹ thuật.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Bắt đầu thực hiện dịch vụ kỹ thuật.',
            'data' => $chiDinh->fresh(),
        ]);
    }

    /**
     * NHẬP KẾT QUẢ VÀ XÁC NHẬN HOÀN THÀNH CHỈ ĐỊNH
     * - Tự động kiểm tra các chỉ định còn lại của lượt khám
     * - Nếu toàn bộ chỉ định đã xong -> Chuyển lượt khám sang CHO_KHAM_LAI
     * - Phát thông báo đồng bộ cho Bác sĩ và Bệnh nhân
     */
    public function updateResult(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Chỉ Nhân viên cận lâm sàng hoặc Quản trị viên mới có quyền cập nhật kết quả xét nghiệm.'], 403);
        }

        $chiDinh = ChiDinhDichVu::with(['dichVu', 'luotKham.benhNhan'])->find($id);
        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định.'], 404);
        }

        if ($chiDinh->TrangThai === 'DA_HUY') {
            return response()->json(['success' => false, 'message' => 'Phiếu chỉ định này đã bị hủy, không thể nhập kết quả.'], 422);
        }

        $validated = $request->validate([
            'KetQua' => ['required', 'string'],
            'KetLuan' => ['nullable', 'string'],
            'DonViDo' => ['nullable', 'string', 'max:50'],
            'KhoangThamChieu' => ['nullable', 'string', 'max:100'],
            'TepDinhKem' => ['nullable', 'string', 'max:255'],
            'GhiChu' => ['nullable', 'string', 'max:1000'],
        ], [
            'KetQua.required' => 'Vui lòng nhập kết quả thực hiện dịch vụ.',
        ]);

        return DB::transaction(function () use ($chiDinh, $validated, $user, $request) {
            $chiDinh->update([
                'KetQua' => $validated['KetQua'],
                'KetLuan' => $validated['KetLuan'] ?? null,
                'DonViDo' => $validated['DonViDo'] ?? null,
                'KhoangThamChieu' => $validated['KhoangThamChieu'] ?? null,
                'TepDinhKem' => $validated['TepDinhKem'] ?? null,
                'GhiChu' => $validated['GhiChu'] ?? $chiDinh->GhiChu,
                'TrangThai' => 'DA_CO_KET_QUA',
                'NgayThucHien' => $chiDinh->NgayThucHien ?? now(),
                'ThoiGianXacNhan' => now(),
                'MaNhanVienThucHien' => $user->MaTaiKhoan,
            ]);

            $luotKham = $chiDinh->luotKham;
            $tenBN = $luotKham?->benhNhan?->HoTen ?? 'Bệnh nhân';
            $tenDV = $chiDinh->dichVu?->TenDichVu ?? 'Dịch vụ';

            // Kiểm tra các dịch vụ còn lại của lượt khám này
            $pendingCount = ChiDinhDichVu::where('MaLuotKham', $chiDinh->MaLuotKham)
                ->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'])
                ->count();

            if ($pendingCount === 0 && $luotKham && in_array($luotKham->TrangThai, ['CHO_KET_QUA', 'DANG_KHAM'])) {
                // TẤT CẢ DỊCH VỤ ĐÃ CÓ KẾT QUẢ:
                // Theo chính sách Phase 5.3: KHÔNG tự động chuyển sang CHO_KHAM_LAI.
                // Giữ nguyên trạng thái CHO_KET_QUA cho đến khi bệnh nhân thực sự quay lại và được tiếp nhận vào FIFO.

                // Thông báo Bác sĩ phụ trách: Bệnh nhân đã hoàn tất CLS (chờ bệnh nhân quay lại)
                if ($luotKham->MaBacSi) {
                    NotificationService::sendToDoctor(
                        $luotKham->MaBacSi,
                        'KHAM_BENH',
                        'Đã có đầy đủ kết quả cận lâm sàng',
                        "Bệnh nhân {$tenBN} đã hoàn tất toàn bộ chỉ định cận lâm sàng (chờ bệnh nhân quay lại phòng khám).",
                        "/doctor/examine?visit_id={$luotKham->MaLuotKham}"
                    );
                }

                // Thông báo Bệnh nhân: Có kết quả, hướng dẫn quay lại phòng khám
                NotificationService::sendToPatient(
                    $luotKham->MaBenhNhan,
                    'KHAM_BENH',
                    'Đã có kết quả cận lâm sàng',
                    "Tất cả kết quả xét nghiệm/kỹ thuật của bạn đã có. Vui lòng quay lại quầy/phòng khám để được tiếp nhận khám lại.",
                    "/appointments"
                );
            } else {
                // Vẫn còn dịch vụ khác -> Báo kết quả từng phần cho Bác sĩ
                NotificationService::sendToDoctor(
                    $chiDinh->MaBacSi,
                    'KHAM_BENH',
                    'Có kết quả dịch vụ cận lâm sàng',
                    "Đã có kết quả [{$tenDV}] của BN {$tenBN}. Còn {$pendingCount} chỉ định khác đang thực hiện.",
                    "/doctor/examine?visit_id={$chiDinh->MaLuotKham}"
                );
            }

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', "Đã xác nhận kết quả dịch vụ [{$tenDV}] thành công.");
            }

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật và xác nhận kết quả dịch vụ thành công.',
                'data' => $chiDinh->fresh(['dichVu', 'nhanVienThucHien']),
            ]);
        });
    }

    /**
     * HỦY CHỈ ĐỊNH DỊCH VỤ
     */
    public function cancel(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isQuanTriVien() && !$user->isBacSi())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy chỉ định này.'], 403);
        }

        $chiDinh = ChiDinhDichVu::find($id);
        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định.'], 404);
        }

        if (in_array($chiDinh->TrangThai, ['DA_CO_KET_QUA', 'HOAN_THANH'])) {
            return response()->json(['success' => false, 'message' => 'Chỉ định đã có kết quả xác nhận, không thể hủy.'], 422);
        }

        $chiDinh->update([
            'TrangThai' => 'DA_HUY',
            'GhiChu' => $request->input('LyDoHuy', 'Hủy theo yêu cầu chuyên môn'),
        ]);

        // Kiểm tra xem các chỉ định còn lại có chuyển lượt khám sang CHO_KHAM_LAI không
        $luotKham = $chiDinh->luotKham;
        if ($luotKham && $luotKham->TrangThai === 'CHO_KET_QUA') {
            $pendingCount = ChiDinhDichVu::where('MaLuotKham', $chiDinh->MaLuotKham)
                ->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'])
                ->count();
            if ($pendingCount === 0) {
                $hasCompleted = ChiDinhDichVu::where('MaLuotKham', $chiDinh->MaLuotKham)
                    ->whereIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH'])
                    ->exists();
                // Nếu tất cả dịch vụ đều bị hủy (không có dịch vụ nào hoàn thành) -> quay về DANG_KHAM
                // Nếu có dịch vụ đã hoàn thành -> giữ nguyên CHO_KET_QUA để chờ bệnh nhân quay lại tiếp nhận
                if (!$hasCompleted) {
                    $luotKham->update(['TrangThai' => 'DANG_KHAM']);
                }
            }
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Đã hủy chỉ định dịch vụ thành công.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã hủy chỉ định dịch vụ thành công.',
            'data' => $chiDinh->fresh(),
        ]);
    }
}
