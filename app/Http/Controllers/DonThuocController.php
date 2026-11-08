<?php

namespace App\Http\Controllers;

use App\Models\ChiTietDonThuoc;
use App\Models\DonThuoc;
use App\Models\LuotKham;
use App\Models\Thuoc;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DonThuocController extends Controller
{
    /**
     * 1. Danh sách đơn thuốc
     * - Bệnh nhân xem đơn thuốc của chính mình
     * - Bác sĩ xem đơn thuốc do mình kê
     * - Quản trị viên xem toàn bộ
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DonThuoc::query()->with([
            'luotKham:MaLuotKham,MaBenhNhan,MaBacSi,ThoiGianTiepNhan,TrangThai',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,NgaySinh,GioiTinh',
            'luotKham.hoaDon:MaHoaDon,MaLuotKham,TongTien,GiamGia,BaoHiemChiTra,BenhNhanChiTra,TrangThai',
            'luotKham.hoaDon.thanhToans',
            'bacSi:MaBacSi,HoTen,HocVi',
            'chiTietDonThuocs.thuoc:MaThuoc,TenThuoc,DonViTinh,DangBaoChe',
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

        // Lọc theo lượt khám nếu có
        if ($visitId = $request->input('visit_id')) {
            $query->where('MaLuotKham', $visitId);
        }

        $prescriptions = $query->orderBy('NgayKeDon', 'desc')->get();

        // Tính tổng tiền thuốc cho từng đơn
        $data = $prescriptions->map(function ($dt) {
            $tongTien = $dt->chiTietDonThuocs->sum(function ($ct) {
                return $ct->ThanhTien ?? ($ct->SoLuong * $ct->DonGia);
            });
            $dt->TongTienThuoc = $tongTien;
            return $dt;
        });

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $data,
                'total' => $data->count(),
            ]);
        }

        return Inertia::render('Patient/Prescriptions', [
            'prescriptions' => $data,
        ]);
    }

    /**
     * 2. Xem chi tiết đơn thuốc
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $donThuoc = DonThuoc::with([
            'luotKham.benhNhan',
            'bacSi.chuyenKhoa',
            'chiTietDonThuocs.thuoc',
        ])->find($id);

        if (!$donThuoc) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn thuốc.'], 404);
        }

        // Bảo mật 1: Bệnh nhân không được xem đơn thuốc của người khác
        if ($user && $user->isBenhNhan()) {
            $maBenhNhan = $donThuoc->luotKham?->MaBenhNhan;
            if ($user->benhNhan?->MaBenhNhan !== $maBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem đơn thuốc của bệnh nhân khác.'], 403);
            }
        }

        // Bảo mật 2: Bác sĩ không được xem đơn thuốc do bác sĩ khác kê (trừ admin)
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi !== $donThuoc->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem đơn thuốc của bác sĩ khác.'], 403);
        }

        $tongTien = $donThuoc->chiTietDonThuocs->sum(function ($ct) {
            return $ct->ThanhTien ?? ($ct->SoLuong * $ct->DonGia);
        });

        $donThuoc->TongTienThuoc = $tongTien;

        return response()->json([
            'success' => true,
            'data' => $donThuoc,
        ]);
    }

    /**
     * 3. Bác sĩ kê đơn thuốc cho lượt khám
     * - Thêm nhiều thuốc vào một đơn
     * - Kiểm tra số lượng tồn (SoLuongTon) trước khi kê đơn
     * - Sử dụng DB Transaction để trừ tồn kho an toàn tuyệt đối
     * - Tính toán chính xác tổng tiền thuốc
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // 1. Phân quyền: Chỉ Bác sĩ mới có quyền kê đơn thuốc
        if (!$user || !$user->isBacSi()) {
            return response()->json(['success' => false, 'message' => 'Chỉ Bác sĩ phụ trách mới có quyền kê đơn thuốc.'], 403);
        }

        $validated = $request->validate([
            'MaLuotKham' => ['required', 'exists:luot_kham,MaLuotKham'],
            'LoiDan' => ['nullable', 'string'],
            'GhiChu' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.MaThuoc' => ['required', 'exists:thuoc,MaThuoc'],
            'items.*.SoLuong' => ['required', 'integer', 'min:1'],
            'items.*.LieuDung' => ['required', 'string', 'max:255'],
            'items.*.TanSuat' => ['required', 'string', 'max:255'],
            'items.*.ThoiGianDung' => ['nullable', 'string', 'max:100'],
            'items.*.CachDung' => ['nullable', 'string'],
        ], [
            'MaLuotKham.required' => 'Vui lòng chọn lượt khám.',
            'items.required' => 'Đơn thuốc phải có ít nhất 1 loại thuốc.',
            'items.*.MaThuoc.required' => 'Vui lòng chọn thuốc.',
            'items.*.SoLuong.min' => 'Số lượng thuốc phải lớn hơn hoặc bằng 1.',
            'items.*.LieuDung.required' => 'Vui lòng nhập liều dùng cho từng loại thuốc.',
            'items.*.TanSuat.required' => 'Vui lòng nhập tần suất dùng thuốc.',
        ]);

        $luotKham = LuotKham::find($validated['MaLuotKham']);

        // Phân quyền: Bác sĩ chỉ kê đơn cho lượt khám mà mình phụ trách
        if ($user->isBacSi() && $user->bacSi?->MaBacSi !== $luotKham->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Bạn không thể kê đơn thuốc cho lượt khám của bác sĩ khác.'], 403);
        }

        // Chặn kê đơn khi lượt khám đã hoàn thành hoặc đã hủy
        if (in_array($luotKham->TrangThai, ['HOAN_THANH', 'DA_HUY'])) {
            return response()->json(['success' => false, 'message' => "Lượt khám đã ở trạng thái '{$luotKham->TrangThai}', không thể kê thêm đơn thuốc."], 422);
        }

        // Bác sĩ xác định
        $maBacSi = $user->isBacSi() ? $user->bacSi->MaBacSi : $luotKham->MaBacSi;

        return DB::transaction(function () use ($validated, $luotKham, $maBacSi, $request) {
            // Chống race condition / double submit tạo 2 đơn thuốc cho cùng một lượt khám
            $existingActive = DonThuoc::where('MaLuotKham', $luotKham->MaLuotKham)
                ->where('TrangThai', '!=', 'DA_HUY')
                ->lockForUpdate()
                ->first();

            if ($existingActive) {
                throw ValidationException::withMessages([
                    'MaLuotKham' => 'Lượt khám này đã có đơn thuốc đang hoạt động. Vui lòng cập nhật đơn thuốc hiện có hoặc hủy đơn cũ trước khi kê đơn mới.',
                ]);
            }

            // Sắp xếp ID thuốc để tránh deadlock khi khóa nhiều dòng đồng thời
            $sortedItems = collect($validated['items'])->sortBy('MaThuoc')->values()->all();

            // 2. Kiểm tra tồn kho của tất cả các thuốc trước khi tạo đơn (với lockForUpdate)
            $medicinesToUpdate = [];
            foreach ($sortedItems as $item) {
                $thuoc = Thuoc::lockForUpdate()->find($item['MaThuoc']);

                if (!$thuoc || $thuoc->TrangThai !== 'HOAT_DONG') {
                    throw ValidationException::withMessages([
                        'items' => "Thuốc [{$thuoc?->TenThuoc}] hiện không còn hoạt động để kê đơn.",
                    ]);
                }

                if ($thuoc->SoLuongTon < $item['SoLuong']) {
                    throw ValidationException::withMessages([
                        'items' => "Thuốc [{$thuoc->TenThuoc}] không đủ số lượng tồn trong kho (Hiện còn: {$thuoc->SoLuongTon}, yêu cầu: {$item['SoLuong']}).",
                    ]);
                }

                $medicinesToUpdate[] = [
                    'model' => $thuoc,
                    'item' => $item,
                ];
            }

            // 3. Tạo Đơn thuốc
            $donThuoc = DonThuoc::create([
                'MaLuotKham' => $luotKham->MaLuotKham,
                'MaBacSi' => $maBacSi,
                'NgayKeDon' => now(),
                'LoiDan' => $validated['LoiDan'] ?? null,
                'TrangThai' => 'DA_KE',
                'GhiChu' => $validated['GhiChu'] ?? null,
            ]);

            // 4. Thêm từng chi tiết đơn thuốc và trừ tồn kho
            $tongTien = 0;
            foreach ($medicinesToUpdate as $entry) {
                $thuoc = $entry['model'];
                $item = $entry['item'];

                $donGia = $thuoc->DonGia;
                $soLuong = $item['SoLuong'];
                $thanhTienItem = $soLuong * $donGia;
                $tongTien += $thanhTienItem;

                // Trừ số lượng tồn kho
                $thuoc->decrement('SoLuongTon', $soLuong);

                // Tạo ChiTietDonThuoc (ThanhTien là cột STORED GENERATED trong MySQL, không insert vào)
                ChiTietDonThuoc::create([
                    'MaDonThuoc' => $donThuoc->MaDonThuoc,
                    'MaThuoc' => $thuoc->MaThuoc,
                    'SoLuong' => $soLuong,
                    'LieuDung' => $item['LieuDung'],
                    'TanSuat' => $item['TanSuat'],
                    'ThoiGianDung' => $item['ThoiGianDung'] ?? null,
                    'CachDung' => $item['CachDung'] ?? null,
                    'DonGia' => $donGia,
                ]);
            }

            $donThuocLoaded = $donThuoc->load(['chiTietDonThuocs.thuoc', 'bacSi:MaBacSi,HoTen']);
            $donThuocLoaded->TongTienThuoc = $tongTien;

            // Kích hoạt thông báo cho Bệnh nhân
            NotificationService::sendToPatient(
                $luotKham->MaBenhNhan,
                'DON_THUOC',
                'Đơn thuốc mới',
                "Bác sĩ đã hoàn tất kê đơn thuốc cho lượt khám #{$luotKham->MaLuotKham}.",
                '/patient/prescriptions'
            );

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Kê đơn thuốc thành công và đã cập nhật trừ kho.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Kê đơn thuốc thành công và đã cập nhật trừ kho.',
                'data' => $donThuocLoaded,
            ], 201);
        });
    }

    /**
     * 4. Cập nhật đơn thuốc sau khi tạo
     * - Tính toán chính xác phần chênh lệch tồn kho (Delta = Mới - Cũ)
     * - Khóa dòng bằng lockForUpdate để bảo vệ dữ liệu đồng thời tuyệt đối
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($request, $id, $user) {
            $donThuoc = DonThuoc::with(['luotKham', 'chiTietDonThuocs.thuoc'])->lockForUpdate()->find($id);

            if (!$donThuoc) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn thuốc.'], 404);
            }

            $isDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $donThuoc->MaBacSi;
            $isAdmin = $user && $user->isQuanTriVien();

            if (!$isDoctor && !$isAdmin) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền chỉnh sửa đơn thuốc này.'], 403);
            }

            if ($donThuoc->TrangThai === 'DA_HUY') {
                return response()->json(['success' => false, 'message' => 'Đơn thuốc đã bị hủy, không thể chỉnh sửa.'], 422);
            }

            if ($donThuoc->luotKham && in_array($donThuoc->luotKham->TrangThai, ['HOAN_THANH', 'DA_HUY'])) {
                return response()->json(['success' => false, 'message' => "Lượt khám đã ở trạng thái '{$donThuoc->luotKham->TrangThai}', không thể sửa đơn thuốc."], 422);
            }

            $validated = $request->validate([
                'LoiDan' => ['nullable', 'string'],
                'GhiChu' => ['nullable', 'string'],
                'items' => ['required', 'array', 'min:1'],
                'items.*.MaThuoc' => ['required', 'exists:thuoc,MaThuoc'],
                'items.*.SoLuong' => ['required', 'integer', 'min:1'],
                'items.*.LieuDung' => ['required', 'string', 'max:255'],
                'items.*.TanSuat' => ['required', 'string', 'max:255'],
                'items.*.ThoiGianDung' => ['nullable', 'string', 'max:100'],
                'items.*.CachDung' => ['nullable', 'string'],
            ]);

            // Gom số lượng thuốc cũ trong đơn
            $oldQuantities = [];
            foreach ($donThuoc->chiTietDonThuocs as $oldCt) {
                $oldQuantities[$oldCt->MaThuoc] = ($oldQuantities[$oldCt->MaThuoc] ?? 0) + $oldCt->SoLuong;
            }

            // Gom số lượng thuốc mới yêu cầu
            $newQuantities = [];
            foreach ($validated['items'] as $newItem) {
                $mId = $newItem['MaThuoc'];
                $newQuantities[$mId] = ($newQuantities[$mId] ?? 0) + $newItem['SoLuong'];
            }

            // Danh sách tất cả mã thuốc liên quan (cũ và mới), sắp xếp để chống deadlock
            $allMedicineIds = array_unique(array_merge(array_keys($oldQuantities), array_keys($newQuantities)));
            sort($allMedicineIds);

            // Kiểm tra và cập nhật chênh lệch tồn kho
            foreach ($allMedicineIds as $mId) {
                $oldQty = $oldQuantities[$mId] ?? 0;
                $newQty = $newQuantities[$mId] ?? 0;
                $diff = $newQty - $oldQty; // Dương: cần trừ thêm; Âm: hoàn trả kho

                $thuoc = Thuoc::lockForUpdate()->find($mId);
                if (!$thuoc) {
                    throw ValidationException::withMessages(['items' => "Thuốc mã {$mId} không tồn tại."]);
                }

                if ($diff > 0) {
                    // Cần lấy thêm từ kho
                    if ($thuoc->SoLuongTon < $diff) {
                        throw ValidationException::withMessages([
                            'items' => "Thuốc [{$thuoc->TenThuoc}] không đủ số lượng tồn trong kho để tăng thêm (Hiện còn: {$thuoc->SoLuongTon}, yêu cầu tăng thêm: {$diff}).",
                        ]);
                    }
                    $thuoc->decrement('SoLuongTon', $diff);
                } elseif ($diff < 0) {
                    // Hoàn trả về kho
                    $thuoc->increment('SoLuongTon', abs($diff));
                }
            }

            // Xóa các chi tiết cũ và tạo lại chi tiết mới
            ChiTietDonThuoc::where('MaDonThuoc', $donThuoc->MaDonThuoc)->delete();

            $tongTien = 0;
            foreach ($validated['items'] as $item) {
                $thuoc = Thuoc::find($item['MaThuoc']);
                $donGia = $thuoc->DonGia;
                $thanhTienItem = $item['SoLuong'] * $donGia;
                $tongTien += $thanhTienItem;

                ChiTietDonThuoc::create([
                    'MaDonThuoc' => $donThuoc->MaDonThuoc,
                    'MaThuoc' => $thuoc->MaThuoc,
                    'SoLuong' => $item['SoLuong'],
                    'LieuDung' => $item['LieuDung'],
                    'TanSuat' => $item['TanSuat'],
                    'ThoiGianDung' => $item['ThoiGianDung'] ?? null,
                    'CachDung' => $item['CachDung'] ?? null,
                    'DonGia' => $donGia,
                ]);
            }

            $donThuoc->update([
                'LoiDan' => $validated['LoiDan'] ?? $donThuoc->LoiDan,
                'GhiChu' => $validated['GhiChu'] ?? $donThuoc->GhiChu,
            ]);

            $donThuocUpdated = $donThuoc->fresh(['chiTietDonThuocs.thuoc', 'bacSi:MaBacSi,HoTen']);
            $donThuocUpdated->TongTienThuoc = $tongTien;

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật đơn thuốc thành công và đã điều chỉnh tồn kho chính xác.',
                'data' => $donThuocUpdated,
            ]);
        });
    }

    /**
     * 5. Hủy đơn thuốc & Hoàn trả tồn kho (Bảo đảm Idempotency & Concurrency)
     */
    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        return DB::transaction(function () use ($id, $user, $request) {
            $donThuoc = DonThuoc::with('chiTietDonThuocs.thuoc')->lockForUpdate()->find($id);

            if (!$donThuoc) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn thuốc.'], 404);
            }

            $isDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $donThuoc->MaBacSi;
            $isAdmin = $user && $user->isQuanTriVien();

            if (!$isDoctor && !$isAdmin) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy đơn thuốc này.'], 403);
            }

            // Kiểm tra chống hủy trùng lặp nhiều lần (Idempotency) bên trong transaction lock
            if ($donThuoc->TrangThai === 'DA_HUY') {
                return response()->json(['success' => false, 'message' => 'Đơn thuốc này đã được hủy trước đó.'], 422);
            }

            // Hoàn trả số lượng tồn kho cho từng loại thuốc với lockForUpdate
            $details = $donThuoc->chiTietDonThuocs;
            $sortedDetails = $details->sortBy('MaThuoc');

            foreach ($sortedDetails as $ct) {
                $thuoc = Thuoc::lockForUpdate()->find($ct->MaThuoc);
                if ($thuoc) {
                    $thuoc->increment('SoLuongTon', $ct->SoLuong);
                }
            }

            $donThuoc->update(['TrangThai' => 'DA_HUY']);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Hủy đơn thuốc thành công và đã hoàn trả lại số lượng tồn kho.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Hủy đơn thuốc thành công và đã hoàn trả lại số lượng tồn kho.',
                'data' => $donThuoc->fresh(),
            ]);
        });
    }
}
