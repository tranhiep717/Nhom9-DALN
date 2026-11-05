<?php

namespace App\Http\Controllers;

use App\Models\Thuoc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ThuocController extends Controller
{
    /**
     * 1. Hiển thị danh sách thuốc & Tìm kiếm
     * - Tìm kiếm theo tên thuốc (TenThuoc) hoặc hoạt chất (HoatChat)
     * - Lọc theo dạng bào chế, trạng thái
     */
    public function index(Request $request)
    {
        $query = Thuoc::query();

        // 2. Tìm kiếm theo tên hoặc hoạt chất
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenThuoc', 'like', "%{$search}%")
                  ->orWhere('HoatChat', 'like', "%{$search}%");
            });
        }

        // Lọc theo dạng bào chế
        if ($dosageForm = $request->input('dang_bao_che')) {
            $query->where('DangBaoChe', $dosageForm);
        }

        // Lọc theo trạng thái
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        } else {
            // Mặc định chỉ hiển thị thuốc đang hoạt động nếu người dùng thường tra cứu
            if (!$request->user() || !$request->user()->isQuanTriVien()) {
                $query->where('TrangThai', 'HOAT_DONG');
            }
        }

        // Lọc theo tồn kho (ví dụ: chỉ lấy thuốc còn hàng)
        if ($request->boolean('in_stock')) {
            $query->where('SoLuongTon', '>', 0);
        }

        $medicines = $query->orderBy('TenThuoc', 'asc')->get();

        if ($request->user()?->isQuanTriVien() && !$request->expectsJson() && !$request->is('api/*')) {
            return Inertia::render('Admin/Medicines', [
                'medicines' => $medicines,
                'filters' => $request->only(['search', 'dang_bao_che', 'status', 'in_stock']),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $medicines,
            'total' => $medicines->count(),
        ]);
    }

    /**
     * 3. Xem chi tiết thông tin một loại thuốc
     */
    public function show(int $id): JsonResponse
    {
        $thuoc = Thuoc::find($id);

        if (!$thuoc) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thuốc này.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $thuoc,
        ]);
    }

    /**
     * 4. Quản trị viên thêm thuốc mới
     * - Kiểm tra số lượng tồn (SoLuongTon >= 0) và đơn giá (DonGia >= 0)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Phân quyền: Chỉ Quản trị viên mới được thêm thuốc vào kho
        if (!$user || !$user->isQuanTriVien()) {
            return response()->json(['success' => false, 'message' => 'Chỉ Quản trị viên mới có quyền thêm thuốc vào hệ thống.'], 403);
        }

        // Tự động map GiaBan sang DonGia nếu gửi từ giao diện
        if ($request->has('GiaBan') && !$request->has('DonGia')) {
            $request->merge(['DonGia' => $request->input('GiaBan')]);
        }

        $validated = $request->validate([
            'TenThuoc' => ['required', 'string', 'max:255', 'unique:thuoc,TenThuoc'],
            'HoatChat' => ['nullable', 'string', 'max:255'],
            'HamLuong' => ['nullable', 'string', 'max:100'],
            'DonViTinh' => ['required', 'string', 'max:50'],
            'DangBaoChe' => ['nullable', 'string', 'max:100'],
            'DonGia' => ['required', 'numeric', 'min:0'],
            'SoLuongTon' => ['required', 'integer', 'min:0'],
            'HuongDanSuDung' => ['nullable', 'string'],
            'ChongChiDinh' => ['nullable', 'string'],
            'TrangThai' => ['nullable', 'string', 'in:HOAT_DONG,NGUNG_SU_DUNG,HET_HANG'],
        ], [
            'TenThuoc.required' => 'Vui lòng nhập tên thuốc.',
            'TenThuoc.unique' => 'Tên thuốc này đã tồn tại trong danh mục.',
            'DonViTinh.required' => 'Vui lòng nhập đơn vị tính (viên, gói, chai,...).',
            'DonGia.required' => 'Vui lòng nhập đơn giá thuốc.',
            'DonGia.min' => 'Đơn giá không được âm.',
            'SoLuongTon.required' => 'Vui lòng nhập số lượng tồn ban đầu.',
            'SoLuongTon.min' => 'Số lượng tồn không được âm.',
        ]);

        $thuoc = Thuoc::create([
            'TenThuoc' => $validated['TenThuoc'],
            'HoatChat' => $validated['HoatChat'] ?? null,
            'HamLuong' => $validated['HamLuong'] ?? null,
            'DonViTinh' => $validated['DonViTinh'],
            'DangBaoChe' => $validated['DangBaoChe'] ?? null,
            'DonGia' => $validated['DonGia'],
            'SoLuongTon' => $validated['SoLuongTon'],
            'HuongDanSuDung' => $validated['HuongDanSuDung'] ?? null,
            'ChongChiDinh' => $validated['ChongChiDinh'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm thuốc vào danh mục thành công.',
            'data' => $thuoc,
        ], 201);
    }

    /**
     * 5. Quản trị viên cập nhật thông tin thuốc
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isQuanTriVien()) {
            return response()->json(['success' => false, 'message' => 'Chỉ Quản trị viên mới có quyền cập nhật thông tin thuốc.'], 403);
        }

        $thuoc = Thuoc::find($id);
        if (!$thuoc) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thuốc.'], 404);
        }

        // Tự động map GiaBan sang DonGia nếu gửi từ giao diện
        if ($request->has('GiaBan') && !$request->has('DonGia')) {
            $request->merge(['DonGia' => $request->input('GiaBan')]);
        }

        $validated = $request->validate([
            'TenThuoc' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('thuoc', 'TenThuoc')->ignore($thuoc->MaThuoc, 'MaThuoc')],
            'HoatChat' => ['sometimes', 'nullable', 'string', 'max:255'],
            'HamLuong' => ['sometimes', 'nullable', 'string', 'max:100'],
            'DonViTinh' => ['sometimes', 'required', 'string', 'max:50'],
            'DangBaoChe' => ['sometimes', 'nullable', 'string', 'max:100'],
            'DonGia' => ['sometimes', 'required', 'numeric', 'min:0'],
            'SoLuongTon' => ['sometimes', 'required', 'integer', 'min:0'],
            'HuongDanSuDung' => ['sometimes', 'nullable', 'string'],
            'ChongChiDinh' => ['sometimes', 'nullable', 'string'],
            'TrangThai' => ['sometimes', 'required', 'string', 'in:HOAT_DONG,NGUNG_SU_DUNG,HET_HANG'],
        ], [
            'DonGia.min' => 'Đơn giá không được âm.',
            'SoLuongTon.min' => 'Số lượng tồn không được âm.',
        ]);

        $thuoc->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thuốc thành công.',
            'data' => $thuoc->fresh(),
        ]);
    }

    /**
     * 6. Quản trị viên xóa hoặc ngừng sử dụng thuốc
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isQuanTriVien()) {
            return response()->json(['success' => false, 'message' => 'Chỉ Quản trị viên mới có quyền xóa thuốc.'], 403);
        }

        $thuoc = Thuoc::withCount('chiTietDonThuocs')->find($id);
        if (!$thuoc) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thuốc.'], 404);
        }

        // Nếu thuốc đã có trong đơn thuốc, chuyển sang NGUNG_SU_DUNG thay vì xóa cứng
        if ($thuoc->chi_tiet_don_thuocs_count > 0) {
            $thuoc->update(['TrangThai' => 'NGUNG_SU_DUNG']);
            return response()->json([
                'success' => true,
                'message' => 'Thuốc đã từng được kê trong đơn thuốc nên đã được chuyển sang trạng thái NGỪNG SỬ DỤNG.',
                'data' => $thuoc->fresh(),
            ]);
        }

        $thuoc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa thuốc khỏi danh mục thành công.',
        ]);
    }
}
