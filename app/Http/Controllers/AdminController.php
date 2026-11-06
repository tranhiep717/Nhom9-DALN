<?php

namespace App\Http\Controllers;

use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BenhNhan;
use App\Models\BacSi;
use App\Models\NhanVien;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use App\Models\Thuoc;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\HoaDon;
use App\Models\ThanhToan;
use App\Models\LichLamViec;
use App\Models\CaKham;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdminController extends Controller
{
    /**
     * BƯỚC 2: ADMIN DASHBOARD
     * Thống kê tổng quan thời gian thực từ database
     * Tuân thủ: Doanh thu thực tế tính từ các giao dịch thanh toán THANH_CONG, KHÔNG lấy TongTien hóa đơn
     */
    public function dashboard(Request $request): InertiaResponse|JsonResponse
    {
        $today = now()->toDateString();

        // 1. Số liệu thống kê tổng hợp
        $totalPatients = BenhNhan::count();
        $activeDoctors = BacSi::whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC'])->count();
        $totalAccounts = TaiKhoan::count();
        $totalAppointments = LichHen::count();
        
        $todayAppointments = LichHen::whereHas('caKham.lichLamViec', function ($q) use ($today) {
            $q->whereDate('NgayLamViec', $today);
        })->count();

        $completedVisits = LuotKham::where('TrangThai', 'HOAN_THANH')->count();

        $paidInvoicesCount = HoaDon::where('TrangThai', 'DA_THANH_TOAN')->count();
        $unpaidInvoicesCount = HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])->count();

        // Doanh thu thực tế thu được từ bảng thanh_toan (chỉ tính giao dịch thành công: DA_THANH_TOAN hoặc THANH_CONG)
        $actualRevenue = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');

        // Tổng công nợ còn lại của các hóa đơn chưa thu xong (eager load thanhToans tránh N+1 và tránh tính trùng)
        $totalDebt = (float) HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])
            ->with('thanhToans')
            ->get()
            ->sum(function ($inv) {
                return $inv->ConLai ?? max(0, (float)$inv->BenhNhanChiTra - (float)$inv->DaThanhToan);
            });

        // 2. Biểu đồ lượt khám 7 ngày gần nhất
        $visitsChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $count = LuotKham::whereDate('ThoiGianTiepNhan', $date)->count();
            $dayName = now()->subDays($i)->locale('vi')->isoFormat('dd (DD/MM)');
            $visitsChart[] = [
                'date' => $date,
                'name' => $dayName,
                'visits' => $count,
            ];
        }

        // 3. Biểu đồ lịch hẹn theo trạng thái
        $appointmentStats = [
            ['name' => 'Chờ xác nhận', 'value' => LichHen::where('TrangThai', 'CHO_XAC_NHAN')->count(), 'color' => '#F59E0B'],
            ['name' => 'Đã xác nhận', 'value' => LichHen::where('TrangThai', 'DA_XAC_NHAN')->count(), 'color' => '#3B82F6'],
            ['name' => 'Đã tiếp nhận', 'value' => LichHen::where('TrangThai', 'DA_TIEP_NHAN')->count(), 'color' => '#6366F1'],
            ['name' => 'Hoàn thành', 'value' => LichHen::where('TrangThai', 'HOAN_THANH')->count(), 'color' => '#10B981'],
            ['name' => 'Đã hủy', 'value' => LichHen::where('TrangThai', 'DA_HUY')->count(), 'color' => '#EF4444'],
        ];

        // 4. Biểu đồ doanh thu thực thu 6 tháng gần nhất
        $revenueChart = [];
        for ($m = 5; $m >= 0; $m--) {
            $monthDate = now()->subMonths($m);
            $year = $monthDate->year;
            $month = $monthDate->month;
            $monthRev = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
                ->whereYear('ThoiGianThanhToan', $year)
                ->whereMonth('ThoiGianThanhToan', $month)
                ->sum('SoTien');

            $revenueChart[] = [
                'name' => 'Tháng ' . $month . '/' . $year,
                'revenue' => $monthRev,
            ];
        }

        // 5. Tỷ lệ bệnh nhân mới (đăng ký tài khoản trong tháng này) và bệnh nhân cũ
        $newPatientsThisMonth = BenhNhan::whereHas('taiKhoan', function ($q) {
            $q->whereMonth('NgayTao', now()->month)
              ->whereYear('NgayTao', now()->year);
        })->count();
        $oldPatients = max(0, $totalPatients - $newPatientsThisMonth);

        $statsData = [
            'totalPatients' => $totalPatients,
            'activeDoctors' => $activeDoctors,
            'totalAccounts' => $totalAccounts,
            'totalAppointments' => $totalAppointments,
            'todayAppointments' => $todayAppointments,
            'completedVisits' => $completedVisits,
            'paidInvoicesCount' => $paidInvoicesCount,
            'unpaidInvoicesCount' => $unpaidInvoicesCount,
            'actualRevenue' => $actualRevenue,
            'totalDebt' => $totalDebt,
            'visitsChart' => $visitsChart,
            'appointmentStats' => $appointmentStats,
            'revenueChart' => $revenueChart,
            'patientRatio' => [
                ['name' => 'Bệnh nhân mới tháng này', 'value' => $newPatientsThisMonth, 'color' => '#0D9488'],
                ['name' => 'Bệnh nhân cũ', 'value' => $oldPatients, 'color' => '#64748B'],
            ],
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $statsData,
            ]);
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => $statsData,
        ]);
    }

    /**
     * BƯỚC 3: QUẢN LÝ TÀI KHOẢN (Admin/Accounts.tsx)
     */
    public function usersIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = TaiKhoan::query()->with([
            'vaiTro:MaVaiTro,TenVaiTro,MoTa',
            'bacSi' => function ($q) {
                $q->select('MaBacSi', 'MaTaiKhoan', 'HoTen', 'MaChuyenKhoa', 'EmailLienHe', 'SoDienThoai')
                  ->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa');
            },
            'nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai,EmailLienHe'
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenDangNhap', 'like', "%{$search}%")
                  ->orWhere('Email', 'like', "%{$search}%")
                  ->orWhere('MaTaiKhoan', $search)
                  ->orWhereHas('bacSi', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%");
                  })
                  ->orWhereHas('nhanVien', function ($nq) use ($search) {
                      $nq->where('HoTen', 'like', "%{$search}%");
                  });
            });
        }

        if ($roleId = $request->input('role_id')) {
            $query->where('MaVaiTro', $roleId);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $users = $query->orderBy('MaTaiKhoan', 'desc')->get();
        $roles = VaiTro::all();

        // Danh sách bác sĩ chưa có tài khoản đăng nhập (để Admin gán khi tạo hoặc sửa tài khoản)
        $unlinkedDoctors = BacSi::whereNull('MaTaiKhoan')
            ->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa')
            ->orderBy('HoTen', 'asc')
            ->get(['MaBacSi', 'HoTen', 'MaChuyenKhoa', 'EmailLienHe', 'SoDienThoai']);

        // Danh sách nhân viên (Lễ tân, CLS...) chưa có tài khoản đăng nhập
        $unlinkedStaff = NhanVien::whereNull('MaTaiKhoan')
            ->orderBy('HoTen', 'asc')
            ->get(['MaNhanVien', 'HoTen', 'LoaiNhanVien', 'SoDienThoai', 'EmailLienHe']);

        // Ẩn mật khẩu tuyệt đối
        $safeUsers = $users->map(function ($u) {
            unset($u->MatKhau);
            return $u;
        });

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $safeUsers,
                'roles' => $roles,
                'unlinkedDoctors' => $unlinkedDoctors,
                'unlinkedStaff' => $unlinkedStaff,
            ]);
        }

        return Inertia::render('Admin/Accounts', [
            'users' => $safeUsers,
            'roles' => $roles,
            'unlinkedDoctors' => $unlinkedDoctors,
            'unlinkedStaff' => $unlinkedStaff,
            'filters' => $request->only(['search', 'role_id', 'status']),
        ]);
    }

    public function usersStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenDangNhap' => ['required', 'string', 'max:50', 'unique:tai_khoan,TenDangNhap', 'regex:/^[a-zA-Z0-9_]+$/'],
            'Email' => ['required', 'email', 'max:100', 'unique:tai_khoan,Email'],
            'MatKhau' => ['required', 'string', 'min:6'],
            'MaVaiTro' => ['required', 'exists:vai_tro,MaVaiTro'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,KHOA'],
            'MaBacSi' => ['nullable', 'integer', 'exists:bac_si,MaBacSi'],
            'MaNhanVien' => ['nullable', 'integer', 'exists:nhan_vien,MaNhanVien'],
        ], [
            'TenDangNhap.required' => 'Vui lòng nhập tên đăng nhập.',
            'TenDangNhap.unique' => 'Tên đăng nhập đã được sử dụng.',
            'TenDangNhap.regex' => 'Tên đăng nhập chỉ chứa chữ cái, chữ số và dấu gạch dưới.',
            'Email.required' => 'Vui lòng nhập email.',
            'Email.unique' => 'Email đã tồn tại trong hệ thống.',
            'MatKhau.min' => 'Mật khẩu phải từ 6 ký tự trở lên.',
            'MaVaiTro.exists' => 'Vai trò không hợp lệ.',
            'MaBacSi.exists' => 'Bác sĩ được chọn không tồn tại trong hệ thống.',
            'MaNhanVien.exists' => 'Nhân viên được chọn không tồn tại trong hệ thống.',
        ]);

        return DB::transaction(function () use ($validated) {
            $maBacSi = $validated['MaBacSi'] ?? null;
            $maNhanVien = $validated['MaNhanVien'] ?? null;

            // Nếu có chọn Bác sĩ, kiểm tra xem bác sĩ này đã có tài khoản chưa
            if ($maBacSi) {
                $doctor = BacSi::lockForUpdate()->find($maBacSi);
                if (!$doctor) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy hồ sơ bác sĩ được chọn.',
                    ], 404);
                }
                if ($doctor->MaTaiKhoan) {
                    return response()->json([
                        'success' => false,
                        'message' => "Bác sĩ '{$doctor->HoTen}' đã được liên kết với một tài khoản khác trong hệ thống.",
                    ], 422);
                }
            }

            // Nếu có chọn Nhân viên, kiểm tra xem nhân viên này đã có tài khoản chưa
            if ($maNhanVien) {
                $staff = NhanVien::lockForUpdate()->find($maNhanVien);
                if (!$staff) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy hồ sơ nhân viên được chọn.',
                    ], 404);
                }
                if ($staff->MaTaiKhoan) {
                    return response()->json([
                        'success' => false,
                        'message' => "Nhân viên '{$staff->HoTen}' đã được liên kết với một tài khoản khác trong hệ thống.",
                    ], 422);
                }
            }

            $account = TaiKhoan::create([
                'TenDangNhap' => $validated['TenDangNhap'],
                'Email' => $validated['Email'],
                'MatKhau' => Hash::make($validated['MatKhau']),
                'MaVaiTro' => $validated['MaVaiTro'],
                'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
                'NgayTao' => now(),
            ]);

            // Gán tài khoản cho bác sĩ được chọn
            if ($maBacSi) {
                BacSi::where('MaBacSi', $maBacSi)->update(['MaTaiKhoan' => $account->MaTaiKhoan]);
            }

            // Gán tài khoản cho nhân viên được chọn
            if ($maNhanVien) {
                NhanVien::where('MaNhanVien', $maNhanVien)->update(['MaTaiKhoan' => $account->MaTaiKhoan]);
            }

            $account->load([
                'vaiTro:MaVaiTro,TenVaiTro,MoTa',
                'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
                'nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai'
            ]);
            unset($account->MatKhau);

            $msg = 'Tạo tài khoản người dùng thành công.';
            if ($maBacSi) {
                $msg = "Tạo tài khoản và gán thành công cho Bác sĩ {$account->bacSi?->HoTen}.";
            } elseif ($maNhanVien) {
                $msg = "Tạo tài khoản và gán thành công cho Nhân viên {$account->nhanVien?->HoTen}.";
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data' => $account,
            ], 201);
        });
    }

    public function usersUpdate(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'Email' => ['required', 'email', 'max:100', "unique:tai_khoan,Email,{$id},MaTaiKhoan"],
            'MaVaiTro' => ['required', 'exists:vai_tro,MaVaiTro'],
            'MatKhau' => ['nullable', 'string', 'min:6'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,KHOA'],
            'MaBacSi' => ['nullable', 'integer', 'exists:bac_si,MaBacSi'],
            'MaNhanVien' => ['nullable', 'integer', 'exists:nhan_vien,MaNhanVien'],
        ]);

        return DB::transaction(function () use ($currentUser, $validated, $id) {
            $targetUser = TaiKhoan::lockForUpdate()->find($id);

            if (!$targetUser) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
            }

            // Quy tắc bảo mật: Không tự hạ quyền Quản trị viên của chính mình hoặc làm mất Quản trị viên cuối cùng
            $adminRole = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
            if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan && $validated['MaVaiTro'] != $adminRole?->MaVaiTro) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thể tự hạ quyền Quản trị viên của chính tài khoản đang đăng nhập.',
                ], 422);
            }

            // Kiểm tra số lượng Admin hoạt động khi có hành động hạ quyền hoặc khóa Admin
            if ($targetUser->isQuanTriVien()) {
                $isDemoting = ($validated['MaVaiTro'] != $adminRole?->MaVaiTro);
                $isLocking = (!empty($validated['TrangThai']) && $validated['TrangThai'] === 'KHOA' && $targetUser->TrangThai === 'HOAT_DONG');

                if ($isDemoting || $isLocking) {
                    $totalAdmins = TaiKhoan::where('MaVaiTro', $adminRole?->MaVaiTro)
                        ->where('TrangThai', 'HOAT_DONG')
                        ->lockForUpdate()
                        ->count();

                    if ($totalAdmins <= 1) {
                        return response()->json([
                            'success' => false,
                            'message' => $isDemoting 
                                ? 'Không thể đổi vai trò của Quản trị viên duy nhất còn hoạt động trong hệ thống.' 
                                : 'Không thể khóa Quản trị viên duy nhất còn hoạt động trong hệ thống.',
                        ], 422);
                    }
                }
            }

            $updateData = [
                'Email' => $validated['Email'],
                'MaVaiTro' => $validated['MaVaiTro'],
            ];

            if (!empty($validated['TrangThai'])) {
                // Không cho phép tự khóa tài khoản của chính mình
                if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan && $validated['TrangThai'] === 'KHOA') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Bạn không thể tự khóa tài khoản của chính mình.',
                    ], 422);
                }
                $updateData['TrangThai'] = $validated['TrangThai'];
            }

            if (!empty($validated['MatKhau'])) {
                $updateData['MatKhau'] = Hash::make($validated['MatKhau']);
            }

            $targetUser->update($updateData);

            // Xử lý gán / đổi Bác sĩ nếu có gửi lên MaBacSi
            if (array_key_exists('MaBacSi', $validated)) {
                $newMaBacSi = $validated['MaBacSi'];
                $currentDoctor = BacSi::where('MaTaiKhoan', $targetUser->MaTaiKhoan)->first();

                if ($newMaBacSi) {
                    if (!$currentDoctor || $currentDoctor->MaBacSi != $newMaBacSi) {
                        $targetDoctor = BacSi::lockForUpdate()->find($newMaBacSi);
                        if ($targetDoctor && $targetDoctor->MaTaiKhoan && $targetDoctor->MaTaiKhoan !== $targetUser->MaTaiKhoan) {
                            return response()->json([
                                'success' => false,
                                'message' => "Bác sĩ '{$targetDoctor->HoTen}' đã được gán cho tài khoản khác.",
                            ], 422);
                        }
                        if ($currentDoctor) {
                            $currentDoctor->update(['MaTaiKhoan' => null]);
                        }
                        BacSi::where('MaBacSi', $newMaBacSi)->update(['MaTaiKhoan' => $targetUser->MaTaiKhoan]);
                    }
                } else {
                    if ($currentDoctor) {
                        $currentDoctor->update(['MaTaiKhoan' => null]);
                    }
                }
            }

            // Xử lý gán / đổi Nhân viên nếu có gửi lên MaNhanVien
            if (array_key_exists('MaNhanVien', $validated)) {
                $newMaNhanVien = $validated['MaNhanVien'];
                $currentStaff = NhanVien::where('MaTaiKhoan', $targetUser->MaTaiKhoan)->first();

                if ($newMaNhanVien) {
                    if (!$currentStaff || $currentStaff->MaNhanVien != $newMaNhanVien) {
                        $targetStaff = NhanVien::lockForUpdate()->find($newMaNhanVien);
                        if ($targetStaff && $targetStaff->MaTaiKhoan && $targetStaff->MaTaiKhoan !== $targetUser->MaTaiKhoan) {
                            return response()->json([
                                'success' => false,
                                'message' => "Nhân viên '{$targetStaff->HoTen}' đã được gán cho tài khoản khác.",
                            ], 422);
                        }
                        if ($currentStaff) {
                            $currentStaff->update(['MaTaiKhoan' => null]);
                        }
                        NhanVien::where('MaNhanVien', $newMaNhanVien)->update(['MaTaiKhoan' => $targetUser->MaTaiKhoan]);
                    }
                } else {
                    if ($currentStaff) {
                        $currentStaff->update(['MaTaiKhoan' => null]);
                    }
                }
            }

            $targetUser->load([
                'vaiTro:MaVaiTro,TenVaiTro,MoTa',
                'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
                'nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai'
            ]);
            unset($targetUser->MatKhau);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật tài khoản thành công.',
                'data' => $targetUser,
            ]);
        });
    }

    public function usersToggleStatus(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        return DB::transaction(function () use ($currentUser, $id) {
            $targetUser = TaiKhoan::lockForUpdate()->find($id);

            if (!$targetUser) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
            }

            // Quy tắc bảo mật: Không tự khóa tài khoản đang đăng nhập
            if ($targetUser->MaTaiKhoan === $currentUser->MaTaiKhoan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thể tự khóa tài khoản quản trị đang đăng nhập của mình.',
                ], 422);
            }

            $newStatus = ($targetUser->TrangThai === 'HOAT_DONG') ? 'KHOA' : 'HOAT_DONG';

            // Bảo vệ Admin cuối cùng: Không thể khóa Quản trị viên duy nhất đang hoạt động
            if ($targetUser->isQuanTriVien() && $newStatus === 'KHOA' && $targetUser->TrangThai === 'HOAT_DONG') {
                $adminRole = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
                $totalActiveAdmins = TaiKhoan::where('MaVaiTro', $adminRole?->MaVaiTro)
                    ->where('TrangThai', 'HOAT_DONG')
                    ->lockForUpdate()
                    ->count();

                if ($totalActiveAdmins <= 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không thể khóa Quản trị viên duy nhất còn hoạt động trong hệ thống.',
                    ], 422);
                }
            }

            $targetUser->update(['TrangThai' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => $newStatus === 'HOAT_DONG' ? 'Đã mở khóa tài khoản thành công.' : 'Đã khóa tài khoản thành công.',
                'data' => ['TrangThai' => $newStatus],
            ]);
        });
    }

    /**
     * BƯỚC 4: QUẢN LÝ BỆNH NHÂN (Admin/Patients.tsx)
     */
    public function patientsIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = BenhNhan::query()->with([
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai',
            'luotKhams' => fn($q) => $q->select('MaLuotKham', 'MaBenhNhan', 'TrangThai', 'ThoiGianTiepNhan'),
        ])->withCount(['luotKhams', 'lichHens']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('HoTen', 'like', "%{$search}%")
                  ->orWhere('SoDienThoai', 'like', "%{$search}%")
                  ->orWhere('EmailLienHe', 'like', "%{$search}%")
                  ->orWhere('MaBenhNhan', $search);
            });
        }

        if ($gender = $request->input('gender')) {
            $query->where('GioiTinh', $gender);
        }

        $patients = $query->orderBy('MaBenhNhan', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $patients,
                'total' => $patients->count(),
            ]);
        }

        return Inertia::render('Admin/Patients', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'gender']),
        ]);
    }

    public function patientsShow(int $id): JsonResponse
    {
        $patient = BenhNhan::with([
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,TrangThai',
            'lichHens.caKham.lichLamViec.bacSi',
            'luotKhams.bacSi.chuyenKhoa',
            'luotKhams.nguoiTiepNhan:MaTaiKhoan,TenDangNhap,Email',
            'luotKhams.phieuKham',
            'luotKhams.donThuoc.chiTietDonThuocs.thuoc',
            'luotKhams.chiDinhDichVus.dichVu',
            'luotKhams.chiDinhDichVus.nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
            'luotKhams.hoaDon.nguoiThu:MaTaiKhoan,TenDangNhap,Email',
            'luotKhams.hoaDon.thanhToans.nguoiThu:MaTaiKhoan,TenDangNhap,Email',
        ])->find($id);

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hồ sơ bệnh nhân.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    /**
     * BƯỚC 5: QUẢN LÝ CHUYÊN KHOA (Admin/Specialties.tsx)
     */
    public function specialtiesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = ChuyenKhoa::query()->withCount('bacSis')->with(['bacSis' => function ($q) {
            $q->select('MaBacSi', 'MaChuyenKhoa', 'HoTen', 'HocVi', 'TrangThai');
        }]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenChuyenKhoa', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $specialties = $query->orderBy('TenChuyenKhoa', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $specialties,
            ]);
        }

        return Inertia::render('Admin/Specialties', [
            'specialties' => $specialties,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function specialtiesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:100', 'unique:chuyen_khoa,TenChuyenKhoa'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenChuyenKhoa.required' => 'Vui lòng nhập tên chuyên khoa.',
            'TenChuyenKhoa.unique' => 'Tên chuyên khoa đã tồn tại.',
        ]);

        $specialty = ChuyenKhoa::create([
            'TenChuyenKhoa' => $validated['TenChuyenKhoa'],
            'MoTa' => $validated['MoTa'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm chuyên khoa mới thành công.',
            'data' => $specialty,
        ], 201);
    }

    public function specialtiesUpdate(Request $request, int $id): JsonResponse
    {
        $specialty = ChuyenKhoa::find($id);
        if (!$specialty) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy chuyên khoa.'], 404);
        }

        $validated = $request->validate([
            'TenChuyenKhoa' => ['required', 'string', 'max:100', "unique:chuyen_khoa,TenChuyenKhoa,{$id},MaChuyenKhoa"],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ]);

        // Nếu chuyển sang NGUNG_HOAT_DONG: Kiểm tra xem có ca khám / lịch hẹn sắp tới không
        if (isset($validated['TrangThai']) && $validated['TrangThai'] === 'NGUNG_HOAT_DONG' && $specialty->TrangThai !== 'NGUNG_HOAT_DONG') {
            $hasActiveAppointments = LichHen::whereHas('caKham.lichLamViec.bacSi', function ($q) use ($id) {
                $q->where('MaChuyenKhoa', $id);
            })->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])->exists();

            if ($hasActiveAppointments) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chuyên khoa đang có lịch hẹn chờ khám của bệnh nhân. Không thể ngừng hoạt động vào lúc này.',
                ], 422);
            }
        }

        $specialty->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật chuyên khoa thành công.',
            'data' => $specialty->fresh(),
        ]);
    }

    /**
     * BƯỚC 7: QUẢN LÝ DỊCH VỤ (Admin/Services.tsx)
     */
    public function servicesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = DichVu::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('TenDichVu', 'like', "%{$search}%")
                  ->orWhere('MoTa', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('LoaiDichVu', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $services = $query->orderBy('TenDichVu', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $services,
            ]);
        }

        return Inertia::render('Admin/Services', [
            'services' => $services,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function servicesStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'TenDichVu' => ['required', 'string', 'max:150', 'unique:dich_vu,TenDichVu'],
            'DonGia' => ['required', 'numeric', 'min:0'],
            'LoaiDichVu' => ['required', 'string', 'max:50'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ], [
            'TenDichVu.required' => 'Vui lòng nhập tên dịch vụ.',
            'DonGia.required' => 'Vui lòng nhập đơn giá dịch vụ.',
            'DonGia.min' => 'Đơn giá không thể nhỏ hơn 0.',
        ]);

        $service = DichVu::create([
            'TenDichVu' => $validated['TenDichVu'],
            'DonGia' => $validated['DonGia'],
            'LoaiDichVu' => $validated['LoaiDichVu'],
            'MoTa' => $validated['MoTa'] ?? null,
            'TrangThai' => $validated['TrangThai'] ?? 'HOAT_DONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm dịch vụ mới thành công.',
            'data' => $service,
        ], 201);
    }

    public function servicesUpdate(Request $request, int $id): JsonResponse
    {
        $service = DichVu::find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy dịch vụ.'], 404);
        }

        $validated = $request->validate([
            'TenDichVu' => ['required', 'string', 'max:150', "unique:dich_vu,TenDichVu,{$id},MaDichVu"],
            'DonGia' => ['required', 'numeric', 'min:0'],
            'LoaiDichVu' => ['required', 'string', 'max:50'],
            'MoTa' => ['nullable', 'string', 'max:500'],
            'TrangThai' => ['sometimes', 'string', 'in:HOAT_DONG,NGUNG_HOAT_DONG'],
        ]);

        // Cập nhật giá mới: lưu ý hệ thống đã lưu snapshot đơn giá ở chi_dinh_dich_vu và chi_tiet_hoa_don
        // nên việc update DonGia ở bảng danh mục chỉ áp dụng cho các chỉ định MỚI, bảo toàn 100% lịch sử cũ
        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật dịch vụ thành công. Đơn giá lịch sử của các chỉ định cũ vẫn được bảo toàn.',
            'data' => $service->fresh(),
        ]);
    }

    /**
     * BƯỚC 8: TRA CỨU HÓA ĐƠN TOÀN HỆ THỐNG (Admin/Invoices.tsx)
     */
    public function invoicesIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = HoaDon::query()->with([
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai',
            'luotKham.bacSi:MaBacSi,HoTen',
            'luotKham.nguoiTiepNhan:MaTaiKhoan,TenDangNhap,Email',
            'chiTietHoaDons',
            'thanhToans.nguoiThu:MaTaiKhoan,TenDangNhap,Email',
            'nguoiThu:MaTaiKhoan,TenDangNhap,Email',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('MaHoaDon', $search)
                  ->orWhereHas('luotKham.benhNhan', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        if ($date = $request->input('date')) {
            $query->whereDate('NgayTao', $date);
        }

        $invoices = $query->orderBy('NgayTao', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $invoices,
                'total' => $invoices->count(),
            ]);
        }

        return Inertia::render('Admin/Invoices', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status', 'date']),
        ]);
    }

    /**
     * BƯỚC 8: BÁO CÁO TÀI CHÍNH & DOANH THU (Admin/Reports.tsx)
     */
    public function reportsIndex(Request $request): InertiaResponse|JsonResponse
    {
        $period = $request->input('period');
        if ($period === 'today') {
            $fromDate = now()->toDateString();
            $toDate = now()->toDateString();
        } elseif ($period === 'month') {
            $fromDate = now()->startOfMonth()->toDateString();
            $toDate = now()->endOfMonth()->toDateString();
        } elseif ($period === 'quarter') {
            $fromDate = now()->startOfQuarter()->toDateString();
            $toDate = now()->endOfQuarter()->toDateString();
        } elseif ($period === 'year') {
            $fromDate = now()->startOfYear()->toDateString();
            $toDate = now()->endOfYear()->toDateString();
        } else {
            $fromDate = $request->input('from_date', now()->startOfMonth()->toDateString());
            $toDate = $request->input('to_date', now()->toDateString());
        }

        // Doanh thu thực thu chỉ tính các giao dịch thành công (DA_THANH_TOAN hoặc THANH_CONG) trong khoảng thời gian
        $paymentsQuery = ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
            ->whereDate('ThoiGianThanhToan', '>=', $fromDate)
            ->whereDate('ThoiGianThanhToan', '<=', $toDate);

        $totalRevenue = (float) $paymentsQuery->sum('SoTien');

        // Phân loại doanh thu theo phương thức thanh toán
        $byMethod = ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])
            ->whereDate('ThoiGianThanhToan', '>=', $fromDate)
            ->whereDate('ThoiGianThanhToan', '<=', $toDate)
            ->select('PhuongThucThanhToan', DB::raw('SUM(SoTien) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('PhuongThucThanhToan')
            ->get();

        // Tổng nợ viện phí phát sinh (eager load thanhToans tránh N+1 và tránh tính trùng)
        $totalDebt = (float) HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])
            ->whereDate('NgayTao', '>=', $fromDate)
            ->whereDate('NgayTao', '<=', $toDate)
            ->with('thanhToans')
            ->get()
            ->sum(function ($inv) {
                return $inv->ConLai ?? max(0, (float)$inv->BenhNhanChiTra - (float)$inv->DaThanhToan);
            });

        // Thống kê số lượt khám theo bác sĩ trong khoảng thời gian
        $visitsByDoctor = LuotKham::whereDate('ThoiGianTiepNhan', '>=', $fromDate)
            ->whereDate('ThoiGianTiepNhan', '<=', $toDate)
            ->select('MaBacSi', DB::raw('COUNT(*) as total_visits'))
            ->with('bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa', 'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa')
            ->groupBy('MaBacSi')
            ->orderBy('total_visits', 'desc')
            ->get();

        $reportData = [
            'period' => $period,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'totalRevenue' => $totalRevenue,
            'totalDebt' => $totalDebt,
            'byMethod' => $byMethod,
            'visitsByDoctor' => $visitsByDoctor,
            'totalVisits' => LuotKham::whereDate('ThoiGianTiepNhan', '>=', $fromDate)->whereDate('ThoiGianTiepNhan', '<=', $toDate)->count(),
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $reportData,
            ]);
        }

        return Inertia::render('Admin/Reports', [
            'reports' => $reportData,
            'filters' => [
                'period' => $period,
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    /**
     * BƯỚC 9: GIÁM SÁT CẬN LÂM SÀNG TOÀN VIỆN (Admin/ClsMonitor.tsx)
     */
    public function clsMonitorIndex(Request $request): InertiaResponse|JsonResponse
    {
        $query = \App\Models\ChiDinhDichVu::query()->with([
            'dichVu',
            'bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,NgaySinh,GioiTinh',
            'nhanVienThucHien:MaTaiKhoan,TenDangNhap,Email',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('MaChiDinh', $search)
                  ->orWhereHas('luotKham.benhNhan', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                  })
                  ->orWhereHas('dichVu', function ($dq) use ($search) {
                      $dq->where('TenDichVu', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'COMPLETED') {
                $query->whereIn('TrangThai', ['HOAN_THANH', 'DA_CO_KET_QUA']);
            } elseif ($status === 'PENDING') {
                $query->whereIn('TrangThai', ['CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'CHO_THUC_HIEN']);
            } else {
                $query->where('TrangThai', $status);
            }
        }

        if ($type = $request->input('type')) {
            $query->whereHas('dichVu', function ($dq) use ($type) {
                $dq->where('TenDichVu', 'like', "%{$type}%");
            });
        }

        if ($date = $request->input('date')) {
            $query->whereDate('NgayChiDinh', $date);
        }

        // Thống kê chuẩn theo dữ liệu thực tế MySQL
        $totalOrders = \App\Models\ChiDinhDichVu::count();
        $completedOrders = \App\Models\ChiDinhDichVu::whereIn('TrangThai', ['HOAN_THANH', 'DA_CO_KET_QUA'])->count();
        $pendingOrders = \App\Models\ChiDinhDichVu::whereIn('TrangThai', ['CHO_TIEP_NHAN', 'DA_TIEP_NHAN', 'CHO_THUC_HIEN'])->count();
        $processingOrders = \App\Models\ChiDinhDichVu::where('TrangThai', 'DANG_THUC_HIEN')->count();
        $cancelledOrders = \App\Models\ChiDinhDichVu::where('TrangThai', 'DA_HUY')->count();

        // Doanh thu CLS (tổng tiền các chỉ định đã thực hiện / đã có kết quả)
        $totalRevenue = (float) \App\Models\ChiDinhDichVu::whereIn('TrangThai', ['HOAN_THANH', 'DA_CO_KET_QUA'])->sum('DonGia');

        $stats = [
            'total' => $totalOrders,
            'completed' => $completedOrders,
            'pending' => $pendingOrders,
            'processing' => $processingOrders,
            'cancelled' => $cancelledOrders,
            'totalRevenue' => $totalRevenue,
            'completionRate' => $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 1) : 0,
        ];

        // Biểu đồ 1: Top dịch vụ CLS được chỉ định nhiều nhất
        $topServices = \App\Models\ChiDinhDichVu::join('dich_vu', 'chi_dinh_dich_vu.MaDichVu', '=', 'dich_vu.MaDichVu')
            ->selectRaw('dich_vu.TenDichVu as name, count(*) as count, sum(chi_dinh_dich_vu.DonGia) as revenue')
            ->groupBy('dich_vu.TenDichVu')
            ->orderByDesc('count')
            ->take(6)
            ->get();

        // Biểu đồ 2: Bác sĩ chỉ định nhiều nhất
        $topDoctors = \App\Models\ChiDinhDichVu::join('bac_si', 'chi_dinh_dich_vu.MaBacSi', '=', 'bac_si.MaBacSi')
            ->selectRaw('bac_si.HoTen as name, count(*) as count')
            ->groupBy('bac_si.HoTen')
            ->orderByDesc('count')
            ->take(6)
            ->get();

        // Biểu đồ 3: Phân loại nhóm dịch vụ (Xét nghiệm, X-Quang, Siêu âm, Khác)
        $byType = \App\Models\ChiDinhDichVu::join('dich_vu', 'chi_dinh_dich_vu.MaDichVu', '=', 'dich_vu.MaDichVu')
            ->select('dich_vu.TenDichVu')
            ->get()
            ->groupBy(function ($item) {
                $name = mb_strtolower($item->TenDichVu, 'UTF-8');
                if (str_contains($name, 'xét nghiệm') || str_contains($name, 'máu') || str_contains($name, 'nước tiểu')) {
                    return 'Xét nghiệm';
                }
                if (str_contains($name, 'x-quang') || str_contains($name, 'ct') || str_contains($name, 'mri')) {
                    return 'Chẩn đoán hình ảnh';
                }
                if (str_contains($name, 'siêu âm')) {
                    return 'Siêu âm';
                }
                return 'Khám & Thăm dò';
            })
            ->map(function ($group, $label) {
                return [
                    'name' => $label,
                    'displayName' => $label,
                    'value' => $group->count(),
                ];
            })
            ->values();

        // Biểu đồ 4: Phân bố trạng thái
        $statusDistribution = [
            ['name' => 'Đã có kết quả', 'value' => $completedOrders, 'color' => '#10B981'],
            ['name' => 'Chờ tiếp nhận & làm', 'value' => $pendingOrders, 'color' => '#F59E0B'],
            ['name' => 'Đang phân tích', 'value' => $processingOrders, 'color' => '#0284C7'],
            ['name' => 'Đã hủy', 'value' => $cancelledOrders, 'color' => '#EF4444'],
        ];

        // Danh sách KTV CLS để lọc
        $clsTechnicians = \App\Models\TaiKhoan::whereHas('vaiTro', function ($q) {
            $q->where('TenVaiTro', 'NHAN_VIEN_CAN_LAM_SANG');
        })->select('MaTaiKhoan', 'TenDangNhap', 'Email')->get();

        // Phân trang danh sách chỉ định
        $perPage = (int)$request->input('per_page', 15);
        $orders = (clone $query)->orderBy('NgayChiDinh', 'desc')->paginate($perPage)->withQueryString();

        $clsData = [
            'orders' => $orders,
            'stats' => $stats,
            'charts' => [
                'topServices' => $topServices,
                'topDoctors' => $topDoctors,
                'byType' => $byType,
                'statusDistribution' => $statusDistribution,
            ],
            'technicians' => $clsTechnicians,
            'filters' => $request->only(['search', 'status', 'type', 'date', 'per_page']),
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $clsData,
            ]);
        }

        return Inertia::render('Admin/ClsMonitor', $clsData);
    }

    /**
     * BÁO CÁO & GIÁM SÁT TIẾP ĐÓN - HÀNG CHỜ TOÀN VIỆN (ADMIN RECEPTION ANALYTICS)
     */
    public function receptionAnalytics(Request $request): InertiaResponse|JsonResponse
    {
        $timeRange = $request->input('time_range', 'all'); // 'all', 'today', 'week', 'month', 'custom'
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');
        $specialtyId = $request->input('specialty_id');
        $doctorId = $request->input('doctor_id');
        $status = $request->input('status');
        $source = $request->input('source'); // 'DAT_LICH' (P2) or 'TRUC_TIEP' (P3)
        $search = $request->input('search');

        // Query cơ sở
        $baseQuery = LuotKham::query();

        // Lọc theo mốc thời gian
        if ($timeRange === 'today') {
            $today = now()->toDateString();
            $baseQuery->where(function ($q) use ($today) {
                $q->whereDate('NgayKham', $today)->orWhereDate('ThoiGianTiepNhan', $today);
            });
        } elseif ($timeRange === 'week') {
            $startOfWeek = now()->startOfWeek()->toDateString();
            $endOfWeek = now()->endOfWeek()->toDateString();
            $baseQuery->where(function ($q) use ($startOfWeek, $endOfWeek) {
                $q->whereBetween('NgayKham', [$startOfWeek, $endOfWeek])
                  ->orWhereBetween('ThoiGianTiepNhan', [$startOfWeek, $endOfWeek]);
            });
        } elseif ($timeRange === 'month') {
            $startOfMonth = now()->startOfMonth()->toDateString();
            $endOfMonth = now()->endOfMonth()->toDateString();
            $baseQuery->where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('NgayKham', [$startOfMonth, $endOfMonth])
                  ->orWhereBetween('ThoiGianTiepNhan', [$startOfMonth, $endOfMonth]);
            });
        } elseif ($timeRange === 'custom' && ($fromDate || $toDate)) {
            if ($fromDate && $toDate) {
                $baseQuery->where(function ($q) use ($fromDate, $toDate) {
                    $q->whereBetween('NgayKham', [$fromDate, $toDate])
                      ->orWhereBetween('ThoiGianTiepNhan', [$fromDate, $toDate]);
                });
            } elseif ($fromDate) {
                $baseQuery->where(function ($q) use ($fromDate) {
                    $q->whereDate('NgayKham', '>=', $fromDate)
                      ->orWhereDate('ThoiGianTiepNhan', '>=', $fromDate);
                });
            } elseif ($toDate) {
                $baseQuery->where(function ($q) use ($toDate) {
                    $q->whereDate('NgayKham', '<=', $toDate)
                      ->orWhereDate('ThoiGianTiepNhan', '<=', $toDate);
                });
            }
        }
        // nếu $timeRange === 'all', không lọc ngày => hiển thị trọn vẹn 275 ca thực tế

        if ($specialtyId) {
            $baseQuery->where('MaChuyenKhoa', $specialtyId);
        }
        if ($doctorId) {
            $baseQuery->where('MaBacSi', $doctorId);
        }
        if ($status) {
            $baseQuery->where('TrangThai', $status);
        }
        if ($source) {
            if ($source === 'DAT_LICH') {
                $baseQuery->where(function ($q) {
                    $q->where('LoaiHangDoi', 'DAT_LICH')->orWhereNotNull('MaLichHen');
                });
            } elseif ($source === 'TRUC_TIEP') {
                $baseQuery->where(function ($q) {
                    $q->where('LoaiHangDoi', 'TRUC_TIEP')->whereNull('MaLichHen');
                });
            }
        }
        if ($search) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('SoPhieu', 'like', "%{$search}%")
                  ->orWhereHas('benhNhan', function ($bq) use ($search) {
                      $bq->where('HoTen', 'like', "%{$search}%")
                         ->orWhere('SoDienThoai', 'like', "%{$search}%");
                  });
            });
        }

        // Tính toán các chỉ số KPI
        $allMatching = (clone $baseQuery)->get();
        $totalVisits = $allMatching->count();
        $completedCount = $allMatching->where('TrangThai', 'HOAN_THANH')->count();
        $activeCount = $allMatching->whereIn('TrangThai', ['CHO_KHAM', 'DANG_KHAM', 'CHO_KET_QUA', 'CHO_KHAM_LAI'])->count();
        $cancelledCount = $allMatching->where('TrangThai', 'BO_LUOT')->count();
        $bookedCount = $allMatching->filter(fn($v) => $v->LoaiHangDoi === 'DAT_LICH' || !empty($v->MaLichHen))->count();
        $walkinCount = $allMatching->filter(fn($v) => $v->LoaiHangDoi === 'TRUC_TIEP' && empty($v->MaLichHen))->count();

        $completionRate = $totalVisits > 0 ? round(($completedCount / $totalVisits) * 100, 1) : 0;
        $dropRate = $totalVisits > 0 ? round(($cancelledCount / $totalVisits) * 100, 1) : 0;
        $bookedRate = $totalVisits > 0 ? round(($bookedCount / $totalVisits) * 100, 1) : 0;

        $kpi = [
            'totalVisits' => $totalVisits,
            'completedCount' => $completedCount,
            'activeCount' => $activeCount,
            'cancelledCount' => $cancelledCount,
            'bookedCount' => $bookedCount,
            'walkinCount' => $walkinCount,
            'completionRate' => $completionRate,
            'dropRate' => $dropRate,
            'bookedRate' => $bookedRate,
        ];

        // Biểu đồ 1: Theo Chuyên khoa
        $specialtiesMap = ChuyenKhoa::pluck('TenChuyenKhoa', 'MaChuyenKhoa')->toArray();
        $bySpecialty = $allMatching->groupBy('MaChuyenKhoa')->map(function ($group, $key) use ($specialtiesMap) {
            return [
                'name' => $specialtiesMap[$key] ?? 'Khoa #' . $key,
                'count' => $group->count(),
            ];
        })->sortByDesc('count')->values()->take(8);

        // Biểu đồ 2: Top Bác sĩ
        $doctorsMap = BacSi::pluck('HoTen', 'MaBacSi')->toArray();
        $byDoctor = $allMatching->groupBy('MaBacSi')->map(function ($group, $key) use ($doctorsMap) {
            return [
                'name' => $doctorsMap[$key] ?? 'Bác sĩ #' . $key,
                'count' => $group->count(),
            ];
        })->sortByDesc('count')->values()->take(8);

        // Biểu đồ 3: Phân bố theo Ca khám
        $caKhams = CaKham::whereIn('MaCaKham', $allMatching->pluck('MaCaKham')->unique())->get()->keyBy('MaCaKham');
        $byShift = $allMatching->groupBy(function ($item) use ($caKhams) {
            $ck = $caKhams[$item->MaCaKham] ?? null;
            if (!$ck) return 'Ca chung';
            $hour = (int)substr($ck->GioBatDau, 0, 2);
            if ($hour < 12) return 'Ca sáng (07h-12h)';
            if ($hour < 17) return 'Ca chiều (13h-17h)';
            return 'Ca tối (17h-21h)';
        })->map(function ($group, $label) {
            return [
                'name' => $label,
                'count' => $group->count(),
            ];
        })->values();

        // Biểu đồ 4: Phân bố Nguồn tiếp đón
        $sourceDistribution = [
            ['name' => 'P2 Đặt hẹn trước', 'value' => $bookedCount, 'color' => '#10B981'],
            ['name' => 'P3 Trực tiếp vãng lai', 'value' => $walkinCount, 'color' => '#6366F1'],
        ];

        // Biểu đồ 5: Phân bố Trạng thái
        $statusDistribution = [
            ['name' => 'Chờ khám', 'value' => $allMatching->where('TrangThai', 'CHO_KHAM')->count(), 'color' => '#F59E0B'],
            ['name' => 'Đang khám', 'value' => $allMatching->where('TrangThai', 'DANG_KHAM')->count(), 'color' => '#0284C7'],
            ['name' => 'Chờ KQ CLS', 'value' => $allMatching->where('TrangThai', 'CHO_KET_QUA')->count(), 'color' => '#EAB308'],
            ['name' => 'Chờ khám lại', 'value' => $allMatching->where('TrangThai', 'CHO_KHAM_LAI')->count(), 'color' => '#0D9488'],
            ['name' => 'Hoàn thành', 'value' => $completedCount, 'color' => '#10B981'],
            ['name' => 'Bỏ lượt', 'value' => $cancelledCount, 'color' => '#EF4444'],
        ];

        // Danh sách lượt khám phân trang cho Bảng Đối soát & Truy vết
        $perPage = (int)$request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50])) {
            $perPage = 10;
        }

        $visits = (clone $baseQuery)->with([
            'benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh',
            'bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'nguoiTiepNhan:MaTaiKhoan,TenDangNhap,Email',
            'caKham:MaCaKham,GioBatDau,GioKetThuc',
        ])
        ->orderBy('MaLuotKham', 'desc')
        ->paginate($perPage)
        ->withQueryString();

        // Danh mục dropdown
        $specialties = ChuyenKhoa::select('MaChuyenKhoa', 'TenChuyenKhoa')->get();
        $doctors = BacSi::where('TrangThai', 'HOAT_DONG')->select('MaBacSi', 'HoTen', 'HocVi')->get();

        $data = [
            'kpi' => $kpi,
            'charts' => [
                'bySpecialty' => $bySpecialty,
                'byDoctor' => $byDoctor,
                'byShift' => $byShift,
                'sourceDistribution' => $sourceDistribution,
                'statusDistribution' => $statusDistribution,
            ],
            'visits' => $visits,
            'specialties' => $specialties,
            'doctors' => $doctors,
            'filters' => [
                'time_range' => $timeRange,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'specialty_id' => $specialtyId ? (int)$specialtyId : null,
                'doctor_id' => $doctorId ? (int)$doctorId : null,
                'status' => $status,
                'source' => $source,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['success' => true, 'data' => $data]);
        }

        return Inertia::render('Admin/ReceptionAnalytics', $data);
    }

    /**
     * Bàn tiếp đón Lễ tân dành riêng cho Quản trị viên
     */
    public function receptionIndex(Request $request): InertiaResponse|JsonResponse
    {
        $data = app(LichHenController::class)->getReceptionistDashboardData($request);
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }
        return Inertia::render('Admin/Reception', $data);
    }

    /**
     * Quản lý Hàng chờ & Gọi số dành riêng cho Quản trị viên
     */
    public function queueIndex(Request $request): InertiaResponse
    {
        $data = app(LichHenController::class)->getQueueData($request);
        return Inertia::render('Admin/Queue', $data);
    }
}
