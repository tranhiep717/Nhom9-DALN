<?php

namespace App\Http\Controllers;

use App\Models\NhanVien;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class NhanVienController extends Controller
{
    /**
     * Danh sách nhân viên phòng khám (Admin/Staff.tsx)
     */
    public function index(Request $request): InertiaResponse|JsonResponse
    {
        $query = NhanVien::query()->with('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%")
                  ->orWhere('CCCD', 'like', "%{$search}%")
                  ->orWhere('MaNhanVien', $search)
                  ->orWhereHas('taiKhoan', function ($tq) use ($search) {
                      $tq->where('TenDangNhap', 'like', "%{$search}%");
                  });
            });
        }

        if ($type = $request->input('type')) {
            $query->where('LoaiNhanVien', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        if ($hasAccount = $request->input('has_account')) {
            if ($hasAccount === 'yes') {
                $query->whereNotNull('MaTaiKhoan');
            } elseif ($hasAccount === 'no') {
                $query->whereNull('MaTaiKhoan');
            }
        }

        $staffs = $query->orderBy('MaNhanVien', 'desc')->get();

        // Thống kê nhanh
        $stats = [
            'total' => NhanVien::count(),
            'receptionists' => NhanVien::where('LoaiNhanVien', 'LE_TAN')->count(),
            'clsStaff' => NhanVien::where('LoaiNhanVien', 'CAN_LAM_SANG')->count(),
            'withAccount' => NhanVien::whereNotNull('MaTaiKhoan')->count(),
            'withoutAccount' => NhanVien::whereNull('MaTaiKhoan')->count(),
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $staffs,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Admin/Staff', [
            'staffs' => $staffs,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'status', 'has_account']),
        ]);
    }

    /**
     * Thêm mới nhân sự (Hỗ trợ 2 trong 1: tạo hồ sơ + cấp tài khoản ngay)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'HoTen' => ['required', 'string', 'max:150'],
            'LoaiNhanVien' => ['required', 'string', 'in:LE_TAN,CAN_LAM_SANG,DUOC_SI,THU_NGAN,QUAN_TRI,KHAC'],
            'SoDienThoai' => ['nullable', 'string', 'max:20'],
            'EmailLienHe' => ['nullable', 'email', 'max:150'],
            'CCCD' => ['nullable', 'string', 'max:20'],
            'NgaySinh' => ['nullable', 'date'],
            'GioiTinh' => ['nullable', 'string', 'in:NAM,NU,KHAC'],
            'DiaChi' => ['nullable', 'string', 'max:255'],
            'NgayVaoLam' => ['nullable', 'date'],
            'GhiChu' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:DANG_LAM_VIEC,NGHI_VIEC,TAM_NGHI'],
            // Tùy chọn cấp tài khoản
            'create_account' => ['nullable', 'boolean'],
            'username' => ['nullable', 'string', 'max:50', 'unique:tai_khoan,TenDangNhap', 'regex:/^[a-zA-Z0-9_]+$/'],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'HoTen.required' => 'Vui lòng nhập họ và tên nhân viên.',
            'LoaiNhanVien.required' => 'Vui lòng chọn bộ phận / chức vụ.',
            'username.unique' => 'Tên đăng nhập đã tồn tại trong hệ thống.',
            'password.min' => 'Mật khẩu phải từ 6 ký tự trở lên.',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $maTaiKhoan = null;

            // Nếu Admin tích chọn tạo tài khoản ngay
            if (!empty($validated['create_account']) && !empty($validated['username']) && !empty($validated['password'])) {
                // Xác định mã vai trò tương ứng theo chức vụ
                $roleCode = match ($validated['LoaiNhanVien']) {
                    'LE_TAN' => 'LE_TAN',
                    'CAN_LAM_SANG' => 'NHAN_VIEN_CAN_LAM_SANG',
                    'QUAN_TRI' => 'QUAN_TRI_VIEN',
                    default => 'LE_TAN',
                };

                $vaiTro = VaiTro::where('TenVaiTro', $roleCode)->first();
                $maVaiTro = $vaiTro ? $vaiTro->MaVaiTro : ($roleCode === 'LE_TAN' ? 4 : 5);

                $account = TaiKhoan::create([
                    'TenDangNhap' => $validated['username'],
                    'Email' => $validated['EmailLienHe'] ?? ($validated['username'] . '@smartcare.vn'),
                    'MatKhau' => Hash::make($validated['password']),
                    'MaVaiTro' => $maVaiTro,
                    'TrangThai' => 'HOAT_DONG',
                    'NgayTao' => now(),
                ]);

                $maTaiKhoan = $account->MaTaiKhoan;
            }

            $staff = NhanVien::create([
                'MaTaiKhoan' => $maTaiKhoan,
                'HoTen' => $validated['HoTen'],
                'LoaiNhanVien' => $validated['LoaiNhanVien'],
                'SoDienThoai' => $validated['SoDienThoai'] ?? null,
                'EmailLienHe' => $validated['EmailLienHe'] ?? null,
                'CCCD' => $validated['CCCD'] ?? null,
                'NgaySinh' => $validated['NgaySinh'] ?? null,
                'GioiTinh' => $validated['GioiTinh'] ?? 'NAM',
                'DiaChi' => $validated['DiaChi'] ?? null,
                'NgayVaoLam' => $validated['NgayVaoLam'] ?? now()->toDateString(),
                'GhiChu' => $validated['GhiChu'] ?? null,
                'TrangThai' => $validated['TrangThai'] ?? 'DANG_LAM_VIEC',
            ]);

            $staff->load('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

            return response()->json([
                'success' => true,
                'message' => $maTaiKhoan 
                    ? "Thêm nhân viên [{$staff->HoTen}] và kích hoạt tài khoản thành công." 
                    : "Thêm hồ sơ nhân viên [{$staff->HoTen}] thành công.",
                'data' => $staff,
            ], 201);
        });
    }

    /**
     * Cập nhật thông tin nhân viên
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $staff = NhanVien::find($id);
        if (!$staff) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ nhân viên.'], 404);
        }

        $validated = $request->validate([
            'HoTen' => ['required', 'string', 'max:150'],
            'LoaiNhanVien' => ['required', 'string', 'in:LE_TAN,CAN_LAM_SANG,DUOC_SI,THU_NGAN,QUAN_TRI,KHAC'],
            'SoDienThoai' => ['nullable', 'string', 'max:20'],
            'EmailLienHe' => ['nullable', 'email', 'max:150'],
            'CCCD' => ['nullable', 'string', 'max:20'],
            'NgaySinh' => ['nullable', 'date'],
            'GioiTinh' => ['nullable', 'string', 'in:NAM,NU,KHAC'],
            'DiaChi' => ['nullable', 'string', 'max:255'],
            'NgayVaoLam' => ['nullable', 'date'],
            'GhiChu' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:DANG_LAM_VIEC,NGHI_VIEC,TAM_NGHI'],
        ]);

        $staff->update($validated);
        $staff->load('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ nhân viên thành công.',
            'data' => $staff,
        ]);
    }

    /**
     * Cấp tài khoản bổ sung trực tiếp cho nhân viên chưa có tài khoản
     */
    public function createAccount(Request $request, int $id): JsonResponse
    {
        $staff = NhanVien::find($id);
        if (!$staff) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy nhân viên.'], 404);
        }

        if ($staff->MaTaiKhoan) {
            return response()->json(['success' => false, 'message' => 'Nhân viên này đã có tài khoản.'], 422);
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:tai_khoan,TenDangNhap', 'regex:/^[a-zA-Z0-9_]+$/'],
            'password' => ['required', 'string', 'min:6'],
            'email' => ['nullable', 'email', 'max:100', 'unique:tai_khoan,Email'],
        ], [
            'username.required' => 'Vui lòng nhập tên đăng nhập.',
            'username.unique' => 'Tên đăng nhập đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu từ 6 ký tự trở lên.',
        ]);

        return DB::transaction(function () use ($staff, $validated) {
            $roleCode = match ($staff->LoaiNhanVien) {
                'LE_TAN' => 'LE_TAN',
                'CAN_LAM_SANG' => 'NHAN_VIEN_CAN_LAM_SANG',
                'QUAN_TRI' => 'QUAN_TRI_VIEN',
                default => 'LE_TAN',
            };

            $vaiTro = VaiTro::where('TenVaiTro', $roleCode)->first();
            $maVaiTro = $vaiTro ? $vaiTro->MaVaiTro : ($roleCode === 'LE_TAN' ? 4 : 5);

            $account = TaiKhoan::create([
                'TenDangNhap' => $validated['username'],
                'Email' => $validated['email'] ?? $staff->EmailLienHe ?? ($validated['username'] . '@smartcare.vn'),
                'MatKhau' => Hash::make($validated['password']),
                'MaVaiTro' => $maVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]);

            $staff->update(['MaTaiKhoan' => $account->MaTaiKhoan]);
            $staff->load('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

            return response()->json([
                'success' => true,
                'message' => "Đã cấp tài khoản thành công cho nhân viên [{$staff->HoTen}].",
                'data' => $staff,
            ]);
        });
    }

    /**
     * Chuyển trạng thái nhân viên (Đang làm / Nghỉ việc)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $staff = NhanVien::find($id);
        if (!$staff) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ nhân viên.'], 404);
        }

        $newStatus = ($staff->TrangThai === 'DANG_LAM_VIEC') ? 'NGHI_VIEC' : 'DANG_LAM_VIEC';
        $staff->update(['TrangThai' => $newStatus]);

        // Nếu cho nghỉ việc, tự động khóa tài khoản liên kết (nếu có)
        if ($newStatus === 'NGHI_VIEC' && $staff->MaTaiKhoan) {
            TaiKhoan::where('MaTaiKhoan', $staff->MaTaiKhoan)->update(['TrangThai' => 'KHOA']);
        }

        $staff->load('taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai');

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'DANG_LAM_VIEC' ? "Đã chuyển nhân viên sang Đang làm việc." : "Đã chuyển nhân viên sang Đã nghỉ việc (và khóa tài khoản).",
            'data' => $staff,
        ]);
    }
}

