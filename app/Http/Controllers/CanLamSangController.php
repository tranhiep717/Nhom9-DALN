<?php

namespace App\Http\Controllers;

use App\Models\ChiDinhDichVu;
use App\Models\DichVu;
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
        $searchParam = $request->input('search');
        $serviceParam = $request->input('service_id');

        $query = ChiDinhDichVu::query()->with([
            'dichVu:MaDichVu,TenDichVu,DonGia,MoTa',
            'bacSi:MaBacSi,HoTen,HocVi',
            'nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            'luotKham:MaLuotKham,MaBenhNhan,MaBacSi,ThoiGianTiepNhan,TrangThai',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
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

        // Tìm kiếm theo tên bệnh nhân hoặc số điện thoại
        if ($searchParam) {
            $query->whereHas('luotKham.benhNhan', function ($q) use ($searchParam) {
                $q->where('HoTen', 'like', "%{$searchParam}%")
                  ->orWhere('SoDienThoai', 'like', "%{$searchParam}%");
            });
        }

        $requests = $query->orderBy('NgayChiDinh', 'desc')->get();

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
                // TẤT CẢ DỊCH VỤ ĐÃ CÓ KẾT QUẢ -> CHUYỂN SANG CHO_KHAM_LAI
                $luotKham->update(['TrangThai' => 'CHO_KHAM_LAI']);

                // Thông báo Bác sĩ phụ trách: Bệnh nhân đã sẵn sàng để khám lại
                NotificationService::sendToDoctor(
                    $luotKham->MaBacSi,
                    'KHAM_BENH',
                    'Đã có đầy đủ kết quả cận lâm sàng',
                    "Bệnh nhân {$tenBN} đã hoàn tất toàn bộ chỉ định cận lâm sàng và đang ở hàng chờ khám lại.",
                    "/doctor/examine?visit_id={$luotKham->MaLuotKham}"
                );

                // Thông báo Bệnh nhân
                NotificationService::sendToPatient(
                    $luotKham->MaBenhNhan,
                    'KHAM_BENH',
                    'Đã có kết quả cận lâm sàng',
                    "Tất cả kết quả xét nghiệm/kỹ thuật của bạn đã có. Vui lòng quay lại phòng khám của Bác sĩ để kết luận và kê đơn.",
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
                $luotKham->update(['TrangThai' => $hasCompleted ? 'CHO_KHAM_LAI' : 'DANG_KHAM']);
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
