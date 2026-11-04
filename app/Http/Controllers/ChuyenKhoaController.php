<?php

namespace App\Http\Controllers;

use App\Models\ChuyenKhoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChuyenKhoaController extends Controller
{
    /**
     * 1. Hiển thị danh sách chuyên khoa + 3. Tìm kiếm chuyên khoa + 4. Đếm số lượng bác sĩ
     */
    public function index(Request $request)
    {
        $query = ChuyenKhoa::query()->withCount('bacSis');

        // Lọc theo trạng thái hoạt động mặc định (trừ khi admin yêu cầu xem tất cả)
        if (!$request->user() || !$request->user()->isQuanTriVien()) {
            $query->where('TrangThai', 'HOAT_DONG');
        } elseif ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        // 3. Tìm kiếm theo tên hoặc mô tả chuyên khoa
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenChuyenKhoa', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        $chuyenKhoas = $query->orderBy('TenChuyenKhoa', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $chuyenKhoas,
                'total' => $chuyenKhoas->count(),
            ]);
        }

        return Inertia::render('Specialties/Index', [
            'chuyenKhoas' => $chuyenKhoas,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Danh sách Chuyên khoa dành riêng cho Patient Portal
     */
    public function patientIndex(Request $request)
    {
        $query = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')
            ->withCount('bacSis')
            ->with(['bacSis' => function ($q) {
                $q->whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC'])
                  ->select('MaBacSi', 'MaChuyenKhoa', 'HoTen', 'HocVi');
            }]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenChuyenKhoa', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        $specialties = $query->orderBy('TenChuyenKhoa', 'asc')->get();

        return Inertia::render('Patient/Specialties', [
            'specialties' => $specialties,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * 2. Xem thông tin chi tiết một chuyên khoa kèm danh sách bác sĩ trực thuộc
     */
    public function show(Request $request, int $id)
    {
        $chuyenKhoa = ChuyenKhoa::withCount('bacSis')
            ->with(['bacSis' => function ($q) {
                $q->where('TrangThai', 'HOAT_DONG')
                  ->select('MaBacSi', 'MaTaiKhoan', 'MaChuyenKhoa', 'HoTen', 'HocVi', 'KinhNghiem', 'MoTa', 'TrangThai');
            }])
            ->find($id);

        if (!$chuyenKhoa) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin chuyên khoa.',
                ], 404);
            }
            abort(404, 'Không tìm thấy chuyên khoa yêu cầu.');
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $chuyenKhoa,
            ]);
        }

        return Inertia::render('Specialties/Show', [
            'chuyenKhoa' => $chuyenKhoa,
        ]);
    }

    /**
     * Thêm mới chuyên khoa (Chỉ dành cho Quản trị viên)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isQuanTriVien()) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ Quản trị viên mới có quyền thêm chuyên khoa.',
            ], 403);
        }

        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:150', 'unique:chuyen_khoa,TenChuyenKhoa'],
            'MoTa' => ['nullable', 'string'],
            'TrangThai' => ['nullable', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenChuyenKhoa.required' => 'Tên chuyên khoa không được để trống.',
            'TenChuyenKhoa.unique' => 'Tên chuyên khoa này đã tồn tại trong hệ thống.',
        ]);

        $chuyenKhoa = ChuyenKhoa::create([
            'TenChuyenKhoa' => $validated['TenChuyenKhoa'],
            'MoTa' => $validated['MoTa'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm chuyên khoa mới thành công.',
            'data' => $chuyenKhoa,
        ], 201);
    }

    /**
     * Cập nhật chuyên khoa (Chỉ dành cho Quản trị viên)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isQuanTriVien()) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ Quản trị viên mới có quyền cập nhật chuyên khoa.',
            ], 403);
        }

        $chuyenKhoa = ChuyenKhoa::find($id);
        if (!$chuyenKhoa) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy chuyên khoa cần cập nhật.',
            ], 404);
        }

        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:150', 'unique:chuyen_khoa,TenChuyenKhoa,' . $id . ',MaChuyenKhoa'],
            'MoTa' => ['nullable', 'string'],
            'TrangThai' => ['nullable', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenChuyenKhoa.required' => 'Tên chuyên khoa không được để trống.',
            'TenChuyenKhoa.unique' => 'Tên chuyên khoa này đã tồn tại trong hệ thống.',
        ]);

        $chuyenKhoa->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật chuyên khoa thành công.',
            'data' => $chuyenKhoa->fresh(),
        ]);
    }
}
