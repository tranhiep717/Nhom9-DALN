<?php

namespace App\Http\Controllers;

use App\Models\ChiDinhDichVu;
use App\Models\DichVu;
use App\Models\LuotKham;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChiDinhDichVuController extends Controller
{
    /**
     * 1. Danh sách dịch vụ khả dụng (để chọn khi chỉ định)
     */
    public function services(Request $request): JsonResponse
    {
        $query = DichVu::query();

        if ($search = $request->input('search')) {
            $query->where('TenDichVu', 'like', "%{$search}%");
        }

        // Mặc định chỉ lấy dịch vụ đang hoạt động
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        } else {
            $query->where('TrangThai', 'HOAT_DONG');
        }

        $services = $query->orderBy('TenDichVu', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
            'total' => $services->count(),
        ]);
    }

    /**
     * 2. Danh sách chỉ định dịch vụ
     * - Bệnh nhân xem chỉ định của chính mình
     * - Bác sĩ xem chỉ định do mình tạo hoặc thuộc lượt khám của mình
     * - Lễ tân / Admin xem toàn bộ
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ChiDinhDichVu::query()->with([
            'dichVu:MaDichVu,TenDichVu,DonGia',
            'bacSi:MaBacSi,HoTen,HocVi',
            'luotKham:MaLuotKham,MaBenhNhan,MaBacSi,ThoiGianTiepNhan,TrangThai',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai',
        ]);

        if ($user && $user->isBenhNhan()) {
            $maBenhNhan = $user->benhNhan?->MaBenhNhan;
            if (!$maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa có hồ sơ Bệnh nhân.'], 403);
            }
            $query->whereHas('luotKham', function ($q) use ($maBenhNhan) {
                $q->where('MaBenhNhan', $maBenhNhan);
            });
        } elseif ($user && $user->isBacSi()) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa có hồ sơ Bác sĩ.'], 403);
            }
            $query->where('MaBacSi', $maBacSi);
        }

        if ($visitId = $request->input('visit_id')) {
            $query->where('MaLuotKham', $visitId);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $items = $query->orderBy('NgayChiDinh', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
            'total' => $items->count(),
        ]);
    }

    /**
     * 3. Bác sĩ chỉ định dịch vụ cho lượt khám
     * - Hỗ trợ chỉ định 1 hoặc nhiều dịch vụ cùng lúc
     * - Tự động chuyển trạng thái lượt khám sang CHO_KET_QUA
     * - Phát thông báo thời gian thực đến Nhân viên Cận lâm sàng
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Phân quyền: Chỉ Bác sĩ phụ trách mới được chỉ định dịch vụ
        if (!$user || !$user->isBacSi()) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ mới có quyền chỉ định dịch vụ kỹ thuật.'], 403);
        }

        $validated = $request->validate([
            'MaLuotKham' => ['required', 'exists:luot_kham,MaLuotKham'],
            'MaDichVu' => ['nullable', 'exists:dich_vu,MaDichVu'],
            'items' => ['nullable', 'array'],
            'items.*.MaDichVu' => ['required_with:items', 'exists:dich_vu,MaDichVu'],
            'items.*.GhiChu' => ['nullable', 'string', 'max:1000'],
            'GhiChu' => ['nullable', 'string', 'max:1000'],
        ], [
            'MaLuotKham.required' => 'Vui lòng chọn lượt khám.',
        ]);

        $luotKham = LuotKham::with(['benhNhan', 'bacSi'])->find($validated['MaLuotKham']);

        // Chặn chỉ định khi lượt khám đã hoàn thành hoặc đã hủy
        if (in_array($luotKham->TrangThai, ['HOAN_THANH', 'DA_HUY'])) {
            return response()->json([
                'success' => false,
                'message' => "Lượt khám đã ở trạng thái '{$luotKham->TrangThai}', không thể chỉ định thêm dịch vụ.",
            ], 422);
        }

        // Phân quyền: Bác sĩ chỉ chỉ định cho lượt khám mình phụ trách
        if ($user->isBacSi() && $user->bacSi?->MaBacSi !== $luotKham->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Bạn không thể chỉ định dịch vụ cho lượt khám của bác sĩ khác.'], 403);
        }

        // Chuẩn hóa danh sách dịch vụ cần tạo (hỗ trợ cả chọn nhiều hoặc chọn đơn)
        $serviceEntries = [];
        if (!empty($validated['items']) && is_array($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $serviceEntries[] = [
                    'MaDichVu' => (int)$item['MaDichVu'],
                    'GhiChu' => $item['GhiChu'] ?? ($validated['GhiChu'] ?? null),
                ];
            }
        } elseif (!empty($validated['MaDichVu'])) {
            $serviceEntries[] = [
                'MaDichVu' => (int)$validated['MaDichVu'],
                'GhiChu' => $validated['GhiChu'] ?? null,
            ];
        } else {
            throw ValidationException::withMessages([
                'MaDichVu' => 'Vui lòng chọn ít nhất một dịch vụ cận lâm sàng.',
            ]);
        }

        $maBacSi = $user->isBacSi() ? $user->bacSi->MaBacSi : $luotKham->MaBacSi;
        $phieuKham = \App\Models\PhieuKham::where('MaLuotKham', $luotKham->MaLuotKham)->first();
        $createdList = [];

        DB::transaction(function () use ($serviceEntries, $luotKham, $phieuKham, $maBacSi, &$createdList) {
            $now = now();
            foreach ($serviceEntries as $entry) {
                $dichVu = DichVu::find($entry['MaDichVu']);
                if (!$dichVu || $dichVu->TrangThai !== 'HOAT_DONG') {
                    throw ValidationException::withMessages([
                        'MaDichVu' => "Dịch vụ [{$dichVu?->TenDichVu}] hiện đang tạm ngưng phục vụ.",
                    ]);
                }

                // Chống tạo trùng bản ghi nếu đã có chỉ định dịch vụ này đang chờ hoặc đang thực hiện trong cùng lượt khám
                $existing = ChiDinhDichVu::where('MaLuotKham', $luotKham->MaLuotKham)
                    ->where('MaDichVu', $dichVu->MaDichVu)
                    ->whereIn('TrangThai', ['CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'DANG_THUC_HIEN'])
                    ->first();

                if ($existing) {
                    $createdList[] = $existing;
                    continue;
                }

                $created = ChiDinhDichVu::create([
                    'MaLuotKham' => $luotKham->MaLuotKham,
                    'MaPhieuKham' => $phieuKham?->MaPhieuKham,
                    'MaDichVu' => $dichVu->MaDichVu,
                    'MaBacSi' => $maBacSi,
                    'TrangThai' => 'CHO_TIEP_NHAN',
                    'DonGia' => $dichVu->DonGia,
                    'NgayChiDinh' => $now,
                    'GhiChu' => $entry['GhiChu'],
                ]);
                $createdList[] = $created;
            }

            // Chuyển trạng thái Lượt khám sang CHO_KET_QUA
            $luotKham->update(['TrangThai' => 'CHO_KET_QUA']);
        });

        // Bắn thông báo cho Nhân viên Cận lâm sàng
        $tenBN = $luotKham->benhNhan?->HoTen ?? 'Bệnh nhân';
        $count = count($createdList);
        NotificationService::sendToRole(
            'NHAN_VIEN_CAN_LAM_SANG',
            'KHAM_BENH',
            'Chỉ định cận lâm sàng mới',
            "Có {$count} chỉ định cận lâm sàng mới của bệnh nhân {$tenBN} đang chờ tiếp nhận.",
            '/cls/dashboard'
        );

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', "Chỉ định thành công {$count} dịch vụ cận lâm sàng. Lượt khám đã chuyển sang chờ kết quả.");
        }

        return response()->json([
            'success' => true,
            'message' => "Chỉ định thành công {$count} dịch vụ cận lâm sàng.",
            'data' => $createdList,
        ], 201);
    }

    /**
     * 4. Xem chi tiết chỉ định dịch vụ
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chiDinh = ChiDinhDichVu::with([
            'dichVu',
            'bacSi.chuyenKhoa',
            'luotKham.benhNhan',
        ])->find($id);

        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định dịch vụ.'], 404);
        }

        // Bảo mật: Bệnh nhân không được xem chỉ định người khác
        if ($user && $user->isBenhNhan()) {
            $maBenhNhan = $chiDinh->luotKham?->MaBenhNhan;
            if ($user->benhNhan?->MaBenhNhan !== $maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem chỉ định dịch vụ của bệnh nhân khác.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $chiDinh,
        ]);
    }

    /**
     * 5. Cập nhật kết quả thực hiện dịch vụ
     * - Hỗ trợ Kỹ thuật viên Cận lâm sàng, Bác sĩ và Quản trị viên
     * - Khi toàn bộ chỉ định đã có kết quả -> Chuyển lượt khám sang CHO_KHAM_LAI
     */
    public function updateResult(Request $request, int $id)
    {
        $user = $request->user();
        $chiDinh = ChiDinhDichVu::with(['dichVu', 'luotKham.benhNhan'])->find($id);

        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định dịch vụ.'], 404);
        }

        // Kỹ thuật viên Cận lâm sàng, Bác sĩ hoặc Quản trị viên mới được nhập kết quả
        if (!$user || (!$user->isNhanVienCanLamSang() && !$user->isBacSi() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật kết quả dịch vụ.'], 403);
        }

        if ($chiDinh->TrangThai === 'DA_HUY') {
            return response()->json(['success' => false, 'message' => 'Phiếu chỉ định này đã bị hủy, không thể nhập kết quả.'], 422);
        }

        $validated = $request->validate([
            'KetQua' => ['required', 'string'],
            'KetLuan' => ['nullable', 'string'],
            'DonViDo' => ['nullable', 'string', 'max:50'],
            'KhoangThamChieu' => ['nullable', 'string', 'max:100'],
            'GhiChu' => ['nullable', 'string'],
        ], [
            'KetQua.required' => 'Vui lòng nhập kết quả thực hiện dịch vụ.',
        ]);

        return DB::transaction(function () use ($chiDinh, $validated, $user, $request) {
            $chiDinh->update([
                'KetQua' => $validated['KetQua'],
                'KetLuan' => $validated['KetLuan'] ?? null,
                'DonViDo' => $validated['DonViDo'] ?? null,
                'KhoangThamChieu' => $validated['KhoangThamChieu'] ?? null,
                'GhiChu' => $validated['GhiChu'] ?? $chiDinh->GhiChu,
                'NgayThucHien' => $chiDinh->NgayThucHien ?? now(),
                'ThoiGianXacNhan' => now(),
                'MaNhanVienThucHien' => $user->MaTaiKhoan,
                'TrangThai' => 'DA_CO_KET_QUA',
            ]);

            $luotKham = $chiDinh->luotKham;
            $tenBN = $luotKham?->benhNhan?->HoTen ?? 'Bệnh nhân';

            // Kiểm tra các chỉ định còn lại
            $pendingCount = ChiDinhDichVu::where('MaLuotKham', $chiDinh->MaLuotKham)
                ->whereNotIn('TrangThai', ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'])
                ->count();

            if ($pendingCount === 0 && $luotKham && in_array($luotKham->TrangThai, ['CHO_KET_QUA', 'DANG_KHAM'])) {
                $luotKham->update(['TrangThai' => 'CHO_KHAM_LAI']);

                NotificationService::sendToDoctor(
                    $luotKham->MaBacSi,
                    'KHAM_BENH',
                    'Đã có kết quả cận lâm sàng',
                    "Bệnh nhân {$tenBN} đã hoàn tất các chỉ định cận lâm sàng và đang chờ khám lại.",
                    "/doctor/examine?visit_id={$luotKham->MaLuotKham}"
                );

                NotificationService::sendToPatient(
                    $luotKham->MaBenhNhan,
                    'KHAM_BENH',
                    'Đã có kết quả cận lâm sàng',
                    "Kết quả chỉ định của bạn đã có. Vui lòng quay lại phòng khám để bác sĩ kết luận.",
                    "/appointments"
                );
            }

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Cập nhật kết quả dịch vụ thành công.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật kết quả dịch vụ thành công.',
                'data' => $chiDinh->fresh(['dichVu', 'bacSi', 'nhanVienThucHien']),
            ]);
        });
    }

    /**
     * 6. Cập nhật trạng thái chỉ định dịch vụ
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $chiDinh = ChiDinhDichVu::find($id);

        if (!$chiDinh) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy phiếu chỉ định dịch vụ.'], 404);
        }

        if (!$user || (!$user->isBacSi() && !$user->isQuanTriVien() && !$user->isLeTan())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật trạng thái chỉ định.'], 403);
        }

        $validated = $request->validate([
            'TrangThai' => ['required', 'string', 'in:CHO_THUC_HIEN,DANG_THUC_HIEN,HOAN_THANH,DA_HUY'],
        ]);

        $chiDinh->update([
            'TrangThai' => $validated['TrangThai'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Cập nhật trạng thái chỉ định sang '{$validated['TrangThai']}' thành công.",
            'data' => $chiDinh->fresh(),
        ]);
    }
}
