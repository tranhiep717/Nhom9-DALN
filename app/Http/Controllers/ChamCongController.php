<?php

namespace App\Http\Controllers;

use App\Models\BangLuong;
use App\Models\BacSi;
use App\Models\ChamCong;
use App\Models\DonTuNhanSu;
use App\Models\LichLamViec;
use App\Models\TaiKhoan;
use App\Services\ChamCongPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChamCongController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ChamCong::query()->with(['bacSi', 'taiKhoan.vaiTro', 'lichLamViec', 'donTu']);

        if ($user && $user->isBacSi()) {
            $query->where(function ($q) use ($user) {
                if ($user->bacSi?->MaBacSi) {
                    $q->where('MaBacSi', $user->bacSi->MaBacSi);
                }
                $q->orWhere('MaTaiKhoan', $user->MaTaiKhoan);
            });
        } elseif ($user && ($user->isLeTan() || $user->isNhanVienCanLamSang())) {
            $query->where('MaTaiKhoan', $user->MaTaiKhoan);
        } elseif ($request->filled('doctor_id')) {
            $query->where('MaBacSi', $request->input('doctor_id'));
        } elseif ($request->filled('account_id')) {
            $query->where('MaTaiKhoan', $request->input('account_id'));
        }

        if ($date = $request->input('date')) {
            $query->whereDate('NgayChamCong', $date);
        }

        if ($month = $request->input('month')) {
            $query->where('NgayChamCong', 'like', "$month%");
        }

        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('NgayChamCong', 'desc')->get(),
        ]);
    }

    public function payroll(Request $request): JsonResponse
    {
        $user = $request->user();
        $month = $request->input('month', now()->format('Y-m'));
        $query = BangLuong::query()->with(['bacSi', 'taiKhoan.vaiTro']);

        if ($user && $user->isBacSi()) {
            $query->where(function ($q) use ($user) {
                if ($user->bacSi?->MaBacSi) {
                    $q->where('MaBacSi', $user->bacSi->MaBacSi);
                }
                $q->orWhere('MaTaiKhoan', $user->MaTaiKhoan);
            });
        } elseif ($user && ($user->isLeTan() || $user->isNhanVienCanLamSang())) {
            $query->where('MaTaiKhoan', $user->MaTaiKhoan);
        } elseif ($request->filled('doctor_id')) {
            $query->where('MaBacSi', $request->input('doctor_id'));
        } elseif ($request->filled('account_id')) {
            $query->where('MaTaiKhoan', $request->input('account_id'));
        }

        $query->where('ThangNam', $month);

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('TongTien', 'desc')->get(),
            'month' => $month,
        ]);
    }

    public function adminPayrollPage(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));

        $records = BangLuong::query()
            ->with(['bacSi.chuyenKhoa', 'taiKhoan.vaiTro'])
            ->where('ThangNam', $month)
            ->orderBy('TongTien', 'desc')
            ->get();

        $attendanceRecords = ChamCong::query()
            ->with(['bacSi.chuyenKhoa', 'taiKhoan.vaiTro', 'lichLamViec', 'donTu'])
            ->where('NgayChamCong', 'like', "$month%")
            ->orderBy('NgayChamCong', 'desc')
            ->limit(200)
            ->get();

        $doctors = BacSi::query()->with('chuyenKhoa')->orderBy('HoTen', 'asc')->get();
        $staffAccounts = TaiKhoan::query()
            ->with('vaiTro')
            ->whereHas('vaiTro', fn ($q) => $q->whereIn('TenVaiTro', ['NHAN_VIEN_CAN_LAM_SANG', 'LE_TAN']))
            ->get();

        // Danh sách đơn từ nhân sự tháng này (hoặc đang chờ xử lý)
        $requests = DonTuNhanSu::query()
            ->with(['taiKhoan.vaiTro', 'taiKhoan.bacSi.chuyenKhoa', 'taiKhoanDoiCung.vaiTro', 'taiKhoanDoiCung.bacSi.chuyenKhoa', 'adminDuyet', 'lichLamViec', 'lichDoiSang'])
            ->where(function ($q) use ($month) {
                $q->whereIn('TrangThai', ['CHO_DUYET', 'CHO_ADMIN_DUYET', 'CHO_DONG_NGHIEP_XAC_NHAN'])
                  ->orWhere('NgayApDung', 'like', "$month%");
            })
            ->orderByRaw("FIELD(TrangThai, 'CHO_ADMIN_DUYET', 'CHO_DUYET', 'CHO_DONG_NGHIEP_XAC_NHAN', 'DA_DUYET', 'TU_CHOI', 'DONG_NGHIEP_TU_CHOI', 'ADMIN_TU_CHOI')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Payroll', [
            'month' => $month,
            'records' => $records,
            'attendanceRecords' => $attendanceRecords,
            'doctors' => $doctors,
            'staffAccounts' => $staffAccounts,
            'staffRequests' => $requests,
        ]);
    }

    public function doctorPayrollPage(Request $request)
    {
        $user = $request->user();
        $doctor = $user?->bacSi;

        if (!$doctor) {
            abort(403, 'Tài khoản chưa liên kết hồ sơ bác sĩ.');
        }

        $month = $request->input('month', now()->format('Y-m'));
        $today = now()->toDateString();

        $records = BangLuong::query()
            ->where(function ($q) use ($doctor, $user) {
                $q->where('MaBacSi', $doctor->MaBacSi);
                if ($user) {
                    $q->orWhere('MaTaiKhoan', $user->MaTaiKhoan);
                }
            })
            ->where('ThangNam', $month)
            ->orderBy('TongTien', 'desc')
            ->get();

        $attendance = ChamCong::query()
            ->with('donTu')
            ->where(function ($q) use ($doctor, $user) {
                $q->where('MaBacSi', $doctor->MaBacSi);
                if ($user) {
                    $q->orWhere('MaTaiKhoan', $user->MaTaiKhoan);
                }
            })
            ->where('NgayChamCong', 'like', "$month%")
            ->orderBy('NgayChamCong', 'desc')
            ->get();

        $todayRecord = ChamCong::query()
            ->with('donTu')
            ->where(function ($q) use ($doctor, $user) {
                $q->where('MaBacSi', $doctor->MaBacSi);
                if ($user) {
                    $q->orWhere('MaTaiKhoan', $user->MaTaiKhoan);
                }
            })
            ->whereDate('NgayChamCong', $today)
            ->first();

        $todaySchedule = LichLamViec::where('MaBacSi', $doctor->MaBacSi)
            ->whereDate('NgayLamViec', $today)
            ->first();

        // Đơn từ cá nhân của bác sĩ
        $myRequests = DonTuNhanSu::with(['taiKhoanDoiCung.bacSi', 'lichLamViec', 'lichDoiSang'])
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        // Đơn đồng nghiệp xin đổi ca gửi tới bác sĩ này
        $requestsForMe = DonTuNhanSu::with(['taiKhoan.vaiTro', 'taiKhoan.bacSi.chuyenKhoa', 'lichLamViec', 'lichDoiSang'])
            ->where('TaiKhoanDoiCung', $user->MaTaiKhoan)
            ->where('TrangThai', 'CHO_DONG_NGHIEP_XAC_NHAN')
            ->orderBy('created_at', 'desc')
            ->get();

        $colleagues = self::getEligibleColleagues($user);

        return Inertia::render('Doctor/Payroll', [
            'month' => $month,
            'records' => $records,
            'attendance' => $attendance,
            'doctor' => $doctor,
            'todayRecord' => $todayRecord,
            'todaySchedule' => $todaySchedule,
            'myRequests' => $myRequests,
            'requestsForMe' => $requestsForMe,
            'colleagues' => $colleagues,
        ]);
    }

    public function staffAttendancePage(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $month = $request->input('month', now()->format('Y-m'));
        $today = now()->toDateString();

        $todayRecord = ChamCong::with('donTu')
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->whereDate('NgayChamCong', $today)
            ->first();

        $todaySchedule = LichLamViec::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->whereDate('NgayLamViec', $today)
            ->first();

        $monthlyPayroll = BangLuong::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->where('ThangNam', $month)
            ->first();

        $monthlyAttendance = ChamCong::with('donTu')
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->where('NgayChamCong', 'like', "$month%")
            ->orderBy('NgayChamCong', 'desc')
            ->get();

        $myRequests = DonTuNhanSu::with(['taiKhoanDoiCung', 'lichLamViec', 'lichDoiSang'])
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $requestsForMe = DonTuNhanSu::with(['taiKhoan.vaiTro', 'lichLamViec', 'lichDoiSang'])
            ->where('TaiKhoanDoiCung', $user->MaTaiKhoan)
            ->where('TrangThai', 'CHO_DONG_NGHIEP_XAC_NHAN')
            ->orderBy('created_at', 'desc')
            ->get();

        $colleagues = self::getEligibleColleagues($user);

        $roleName = $user->vaiTro?->TenVaiTro;
        $component = $roleName === 'NHAN_VIEN_CAN_LAM_SANG'
            ? 'CanLamSang/Attendance'
            : 'Receptionist/Attendance';

        return Inertia::render($component, [
            'user' => $user->load('vaiTro'),
            'month' => $month,
            'todayRecord' => $todayRecord,
            'todaySchedule' => $todaySchedule,
            'monthlyPayroll' => $monthlyPayroll,
            'monthlyAttendance' => $monthlyAttendance,
            'myRequests' => $myRequests,
            'requestsForMe' => $requestsForMe,
            'colleagues' => $colleagues,
        ]);
    }

    public function checkIn(Request $request)
    {
        $user = $request->user();
        $doctor = $user?->bacSi;

        $maBacSi = $request->input('MaBacSi', $doctor?->MaBacSi);
        $maTaiKhoan = $request->input('MaTaiKhoan', $user?->MaTaiKhoan);

        if (!$maBacSi && !$maTaiKhoan) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Thiếu thông tin người dùng để chấm công.']);
            }
            return response()->json(['success' => false, 'message' => 'Thiếu thông tin người dùng để chấm công.'], 422);
        }

        $date = $request->input('NgayChamCong', now()->toDateString());
        $time = $request->input('GioCheckIn', now()->format('H:i:s'));

        // 1. RÀNG BUỘC CHẶT CHẼ: BẮT BUỘC PHẢI CÓ CA LÀM VIỆC ĐƯỢC PHÂN CÔNG
        $schedule = null;
        if ($maBacSi) {
            $schedule = LichLamViec::where('MaBacSi', $maBacSi)
                ->whereDate('NgayLamViec', $date)
                ->first();
        }
        if (!$schedule && $maTaiKhoan) {
            $schedule = LichLamViec::where('MaTaiKhoan', $maTaiKhoan)
                ->whereDate('NgayLamViec', $date)
                ->first();
        }

        if (!$schedule) {
            $errMsg = 'Hôm nay bạn không có ca làm việc nào được phân công. Vui lòng liên hệ Quản trị viên nếu cần phân ca!';
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => $errMsg]);
            }
            return response()->json([
                'success' => false,
                'message' => $errMsg,
            ], 422);
        }

        // 2. KIỂM TRA ĐƠN XIN ĐI MUỘN ĐÃ ĐƯỢC ADMIN DUYỆT (NẾU CÓ)
        $approvedLateRequest = DonTuNhanSu::where('MaTaiKhoan', $maTaiKhoan)
            ->where('LoaiDon', 'DI_MUON')
            ->whereDate('NgayApDung', $date)
            ->where('TrangThai', 'DA_DUYET')
            ->first();

        $excusedLateMinutes = (int) ($approvedLateRequest?->SoPhutDuocDuyet ?? 0);

        $expectedTime = $schedule->GioBatDau ?? '08:00:00';
        $lateMinutes = ChamCongPolicy::lateMinutes($time, $expectedTime);

        // Xác định trạng thái có phép hay không
        $status = ChamCongPolicy::statusFromTime(
            $time,
            $expectedTime,
            null,
            null,
            $excusedLateMinutes,
            0
        );

        // Xác định vai trò
        $roleName = 'BAC_SI';
        if ($user && $user->vaiTro) {
            $roleName = $user->vaiTro->TenVaiTro;
        } elseif ($maTaiKhoan) {
            $tk = TaiKhoan::with('vaiTro')->find($maTaiKhoan);
            $roleName = $tk?->vaiTro?->TenVaiTro ?? 'BAC_SI';
        }

        $salaryPolicy = ChamCongPolicy::calculateDaySalary([
            'role' => $roleName,
            'loai_ca' => $schedule->LoaiCa ?? 'sang',
            'late_minutes' => $lateMinutes,
            'excused_late_minutes' => $excusedLateMinutes,
            'early_minutes' => 0,
            'thuong' => 0,
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $criteria = [];
        if ($maBacSi) {
            $criteria['MaBacSi'] = $maBacSi;
        } else {
            $criteria['MaTaiKhoan'] = $maTaiKhoan;
        }
        $criteria['NgayChamCong'] = $date;

        $record = ChamCong::updateOrCreate(
            $criteria,
            [
                'MaBacSi' => $maBacSi,
                'MaTaiKhoan' => $maTaiKhoan,
                'MaLichLamViec' => $schedule->MaLichLamViec,
                'LoaiCa' => $schedule->LoaiCa ?? 'sang',
                'GioCheckIn' => $time,
                'TrangThai' => $status,
                'SoPhutTre' => $lateMinutes,
                'SoPhutVeSom' => 0,
                'TienLuongCoBan' => $salaryPolicy['luong_co_ban'],
                'PhuCapCa' => $salaryPolicy['phu_cap_ca'],
                'TienThuong' => $salaryPolicy['tien_thuong'],
                'TienPhat' => $salaryPolicy['tien_phat'],
                'TongTien' => $salaryPolicy['tong_tien'],
                'MaDonTu' => $approvedLateRequest?->MaDonTu,
            ]
        );

        $msg = 'Check-in thành công.';
        if ($lateMinutes > 15 && $excusedLateMinutes >= $lateMinutes) {
            $msg = "Check-in thành công. Bạn được miễn phạt đi muộn theo đơn duyệt ({$excusedLateMinutes} phút).";
        } elseif ($lateMinutes > 15 && $excusedLateMinutes > 0) {
            $excess = $lateMinutes - $excusedLateMinutes;
            $msg = "Check-in thành công. Bạn đi muộn {$lateMinutes} phút (vượt {$excess} phút so với đơn duyệt {$excusedLateMinutes} phút).";
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', $msg);
        }

        return response()->json([
            'success' => true,
            'message' => $msg,
            'data' => $record->fresh()->load('donTu'),
        ]);
    }

    public function checkOut(Request $request)
    {
        $user = $request->user();
        $doctor = $user?->bacSi;
        $maBacSi = $request->input('MaBacSi', $doctor?->MaBacSi);
        $maTaiKhoan = $request->input('MaTaiKhoan', $user?->MaTaiKhoan);
        $date = $request->input('NgayChamCong', now()->toDateString());

        if (!$maBacSi && !$maTaiKhoan) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Thiếu thông tin người dùng để chấm công.']);
            }
            return response()->json(['success' => false, 'message' => 'Thiếu thông tin người dùng để chấm công.'], 422);
        }

        $query = ChamCong::whereDate('NgayChamCong', $date);
        if ($maBacSi) {
            $query->where('MaBacSi', $maBacSi);
        } else {
            $query->where('MaTaiKhoan', $maTaiKhoan);
        }

        $record = $query->first();

        if (!$record) {
            $errMsg = 'Chưa có bản ghi check-in ngày hôm nay.';
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => $errMsg]);
            }
            return response()->json(['success' => false, 'message' => $errMsg], 404);
        }

        $time = $request->input('GioCheckOut', now()->format('H:i:s'));

        // Tìm ca trực để lấy giờ kết thúc ca
        $schedule = LichLamViec::find($record->MaLichLamViec);
        $expectedEndTime = $schedule?->GioKetThuc ?? '17:00:00';
        $earlyMinutes = ChamCongPolicy::earlyMinutes($time, $expectedEndTime);

        // Kiểm tra đơn xin về sớm đã được duyệt
        $approvedEarlyRequest = DonTuNhanSu::where('MaTaiKhoan', $maTaiKhoan)
            ->where('LoaiDon', 'VE_SOM')
            ->whereDate('NgayApDung', $date)
            ->where('TrangThai', 'DA_DUYET')
            ->first();

        $excusedEarlyMinutes = (int) ($approvedEarlyRequest?->SoPhutDuocDuyet ?? 0);

        // Xác định vai trò
        $roleName = 'BAC_SI';
        if ($user && $user->vaiTro) {
            $roleName = $user->vaiTro->TenVaiTro;
        } elseif ($maTaiKhoan) {
            $tk = TaiKhoan::with('vaiTro')->find($maTaiKhoan);
            $roleName = $tk?->vaiTro?->TenVaiTro ?? 'BAC_SI';
        }

        // Lấy lại đơn đi muộn nếu có để tính tổng phạt chuẩn xác
        $approvedLateRequest = DonTuNhanSu::where('MaTaiKhoan', $maTaiKhoan)
            ->where('LoaiDon', 'DI_MUON')
            ->whereDate('NgayApDung', $date)
            ->where('TrangThai', 'DA_DUYET')
            ->first();
        $excusedLateMinutes = (int) ($approvedLateRequest?->SoPhutDuocDuyet ?? 0);

        $status = ChamCongPolicy::statusFromTime(
            $record->GioCheckIn,
            $schedule?->GioBatDau ?? '08:00:00',
            $time,
            $expectedEndTime,
            $excusedLateMinutes,
            $excusedEarlyMinutes
        );

        $salaryPolicy = ChamCongPolicy::calculateDaySalary([
            'role' => $roleName,
            'loai_ca' => $record->LoaiCa ?? 'sang',
            'late_minutes' => $record->SoPhutTre,
            'excused_late_minutes' => $excusedLateMinutes,
            'early_minutes' => $earlyMinutes,
            'excused_early_minutes' => $excusedEarlyMinutes,
            'thuong' => $record->TienThuong,
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $record->GioCheckOut = $time;
        $record->SoPhutVeSom = $earlyMinutes;
        $record->TrangThai = $status;
        $record->TienPhat = $salaryPolicy['tien_phat'];
        $record->TongTien = $salaryPolicy['tong_tien'];
        if ($approvedEarlyRequest) {
            $record->MaDonTu = $approvedEarlyRequest->MaDonTu;
        }
        $record->save();

        $msg = 'Check-out ca làm việc thành công.';
        if ($earlyMinutes > 15 && $excusedEarlyMinutes >= $earlyMinutes) {
            $msg = "Check-out thành công. Bạn được miễn phạt về sớm theo đơn duyệt ({$excusedEarlyMinutes} phút).";
        } elseif ($earlyMinutes > 15 && $excusedEarlyMinutes > 0) {
            $excess = $earlyMinutes - $excusedEarlyMinutes;
            $msg = "Check-out thành công. Bạn về sớm {$earlyMinutes} phút (vượt {$excess} phút so với đơn duyệt {$excusedEarlyMinutes} phút).";
        } elseif ($earlyMinutes > 15) {
            $msg = "Check-out thành công. Bạn về sớm {$earlyMinutes} phút không phép (áp dụng trừ phạt).";
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', $msg);
        }

        return response()->json([
            'success' => true,
            'message' => $msg,
            'data' => $record->fresh()->load('donTu'),
        ]);
    }

    public function buildMonthlyPayroll(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));
        $targetRole = $request->input('role');
        $doctorId = $request->input('doctor_id');
        $accountId = $request->input('account_id');

        $records = [];

        // 1. Chốt lương Bác sĩ
        if (!$targetRole || $targetRole === 'BAC_SI') {
            $doctors = BacSi::query()
                ->when($doctorId, fn ($q) => $q->where('MaBacSi', $doctorId))
                ->when($accountId, fn ($q) => $q->where('MaTaiKhoan', $accountId))
                ->get();

            foreach ($doctors as $doctor) {
                $dailyRecords = ChamCong::where(function ($q) use ($doctor) {
                        $q->where('MaBacSi', $doctor->MaBacSi);
                        if ($doctor->MaTaiKhoan) {
                            $q->orWhere('MaTaiKhoan', $doctor->MaTaiKhoan);
                        }
                    })
                    ->where('NgayChamCong', 'like', "$month%")
                    ->get();

                $baseTotal = (int) $dailyRecords->sum('TienLuongCoBan');
                $allowanceTotal = (int) $dailyRecords->sum('PhuCapCa');
                $bonusTotal = (int) $dailyRecords->sum('TienThuong');
                $penaltyTotal = (int) $dailyRecords->sum('TienPhat');
                $salaryTotal = (int) $dailyRecords->sum('TongTien');

                $record = BangLuong::updateOrCreate(
                    ['MaBacSi' => $doctor->MaBacSi, 'ThangNam' => $month],
                    [
                        'MaTaiKhoan' => $doctor->MaTaiKhoan,
                        'SoNgayLam' => $dailyRecords->count(),
                        'SoCaLam' => $dailyRecords->count(),
                        'TienLuongCoBan' => $baseTotal,
                        'PhuCapCa' => $allowanceTotal,
                        'TienThuong' => $bonusTotal,
                        'TienPhat' => $penaltyTotal,
                        'TongTien' => $salaryTotal,
                        'TrangThai' => 'HOAN_TAT',
                    ]
                );

                $records[] = $record->fresh()->load('bacSi');
            }
        }

        // 2. Chốt lương Nhân viên Khác (Cận lâm sàng, Lễ tân)
        if (!$targetRole || in_array($targetRole, ['NHAN_VIEN_CAN_LAM_SANG', 'LE_TAN'])) {
            $staffRoles = $targetRole ? [$targetRole] : ['NHAN_VIEN_CAN_LAM_SANG', 'LE_TAN'];
            $staffAccounts = TaiKhoan::with('vaiTro')
                ->whereHas('vaiTro', fn ($q) => $q->whereIn('TenVaiTro', $staffRoles))
                ->when($accountId, fn ($q) => $q->where('MaTaiKhoan', $accountId))
                ->get();

            foreach ($staffAccounts as $staff) {
                $dailyRecords = ChamCong::where('MaTaiKhoan', $staff->MaTaiKhoan)
                    ->where('NgayChamCong', 'like', "$month%")
                    ->get();

                $baseTotal = (int) $dailyRecords->sum('TienLuongCoBan');
                $allowanceTotal = (int) $dailyRecords->sum('PhuCapCa');
                $bonusTotal = (int) $dailyRecords->sum('TienThuong');
                $penaltyTotal = (int) $dailyRecords->sum('TienPhat');
                $salaryTotal = (int) $dailyRecords->sum('TongTien');

                $record = BangLuong::updateOrCreate(
                    ['MaTaiKhoan' => $staff->MaTaiKhoan, 'ThangNam' => $month],
                    [
                        'MaBacSi' => null,
                        'SoNgayLam' => $dailyRecords->count(),
                        'SoCaLam' => $dailyRecords->count(),
                        'TienLuongCoBan' => $baseTotal,
                        'PhuCapCa' => $allowanceTotal,
                        'TienThuong' => $bonusTotal,
                        'TienPhat' => $penaltyTotal,
                        'TongTien' => $salaryTotal,
                        'TrangThai' => 'HOAN_TAT',
                    ]
                );

                $records[] = $record->fresh()->load('taiKhoan.vaiTro');
            }
        }

        $buildMsg = 'Đã chốt và tính toán bảng lương tháng ' . $month . ' thành công.';
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', $buildMsg);
        }

        return response()->json([
            'success' => true,
            'message' => $buildMsg,
            'data' => $records,
            'month' => $month,
        ]);
    }

    /**
     * TẠO ĐƠN TỪ NHÂN SỰ: Đổi ca, Đi muộn, Về sớm, Nghỉ phép
     * Quy trình đổi ca: Thỏa thuận thực tế -> Chọn đồng nghiệp -> Đồng nghiệp xác nhận -> Admin xét duyệt.
     */
    public function storeRequest(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Chưa đăng nhập.']);
            }
            return response()->json(['success' => false, 'message' => 'Chưa đăng nhập.'], 401);
        }

        $validated = $request->validate([
            'LoaiDon' => 'required|in:DOI_CA,DI_MUON,VE_SOM,NGHI_PHEP',
            'NgayApDung' => 'required|date',
            'MaLichLamViec' => 'nullable|integer',
            'SoPhutXinPhep' => 'nullable|integer|min:0|max:480',
            'MaLichDoiSang' => 'nullable|integer',
            'TaiKhoanDoiCung' => 'nullable|integer',
            'LyDo' => 'required|string|max:1000',
        ]);

        if ($validated['LoaiDon'] === 'DOI_CA') {
            if (empty($validated['TaiKhoanDoiCung'])) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors(['message' => 'Vui lòng chọn đồng nghiệp bạn đã thỏa thuận đổi ca.']);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng chọn đồng nghiệp bạn đã thỏa thuận đổi ca.'
                ], 422);
            }

            if ($validated['TaiKhoanDoiCung'] == $user->MaTaiKhoan) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors(['message' => 'Bạn không thể tự đổi ca với chính mình.']);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thể tự đổi ca với chính mình.'
                ], 422);
            }

            $initialStatus = 'CHO_DONG_NGHIEP_XAC_NHAN';
            $successMsg = 'Đã gửi yêu cầu đổi ca. Vui lòng nhắc đồng nghiệp đăng nhập để bấm "Xác nhận đồng ý" trước khi Admin phê duyệt.';
        } else {
            $initialStatus = 'CHO_DUYET';
            $successMsg = 'Gửi đơn thành công. Đơn của bạn đã được chuyển tới Quản trị viên phê duyệt.';
        }

        $donTu = DonTuNhanSu::create([
            'MaTaiKhoan' => $user->MaTaiKhoan,
            'LoaiDon' => $validated['LoaiDon'],
            'NgayApDung' => $validated['NgayApDung'],
            'MaLichLamViec' => $validated['MaLichLamViec'] ?? null,
            'SoPhutXinPhep' => $validated['SoPhutXinPhep'] ?? 0,
            'SoPhutDuocDuyet' => 0,
            'MaLichDoiSang' => $validated['MaLichDoiSang'] ?? null,
            'TaiKhoanDoiCung' => $validated['TaiKhoanDoiCung'] ?? null,
            'XacNhanDongNghiep' => false,
            'LyDo' => $validated['LyDo'],
            'TrangThai' => $initialStatus,
        ]);

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', $successMsg);
        }

        return response()->json([
            'success' => true,
            'message' => $successMsg,
            'data' => $donTu->fresh(['taiKhoan.vaiTro', 'taiKhoanDoiCung', 'lichLamViec']),
        ]);
    }

    /**
     * BƯỚC 1 CỦA ĐỔI CA: ĐỒNG NGHIỆP XÁC NHẬN / TỪ CHỐI ĐỔI CA
     */
    public function peerConfirmRequest(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Chưa đăng nhập.']);
            }
            return response()->json(['success' => false, 'message' => 'Chưa đăng nhập.'], 401);
        }

        $donTu = DonTuNhanSu::findOrFail($id);

        if ($donTu->TaiKhoanDoiCung != $user->MaTaiKhoan) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Bạn không phải là người được yêu cầu đổi ca trong đơn này.']);
            }
            return response()->json([
                'success' => false,
                'message' => 'Bạn không phải là người được yêu cầu đổi ca trong đơn này.'
            ], 403);
        }

        if ($donTu->TrangThai !== 'CHO_DONG_NGHIEP_XAC_NHAN') {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Đơn này không ở trạng thái chờ bạn xác nhận.']);
            }
            return response()->json([
                'success' => false,
                'message' => 'Đơn này không ở trạng thái chờ bạn xác nhận.'
            ], 422);
        }

        $action = $request->input('action', 'accept'); // 'accept' hoặc 'reject'
        $note = $request->input('note', '');

        if ($action === 'accept') {
            $donTu->TrangThai = 'CHO_ADMIN_DUYET';
            $donTu->XacNhanDongNghiep = true;
            $donTu->NgayDongNghiepXacNhan = now();
            $donTu->GhiChuDongNghiep = $note ?: 'Đồng nghiệp đã xác nhận đồng ý đổi ca.';
            $donTu->save();

            $msg = 'Bạn đã xác nhận đồng ý đổi ca. Đơn đã được chuyển lên Quản trị viên để phê duyệt hoàn tất.';
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data' => $donTu->fresh(['taiKhoan', 'lichLamViec', 'lichDoiSang']),
            ]);
        } else {
            $donTu->TrangThai = 'DONG_NGHIEP_TU_CHOI';
            $donTu->XacNhanDongNghiep = false;
            $donTu->NgayDongNghiepXacNhan = now();
            $donTu->GhiChuDongNghiep = $note ?: 'Đồng nghiệp từ chối đổi ca.';
            $donTu->save();

            $msg = 'Bạn đã từ chối yêu cầu đổi ca.';
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $msg);
            }

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data' => $donTu->fresh(['taiKhoan', 'lichLamViec', 'lichDoiSang']),
            ]);
        }
    }

    /**
     * BƯỚC 2: ADMIN PHÊ DUYỆT ĐƠN TỪ (CHỈ DUYỆT ĐƠN ĐÃ ĐƯỢC ĐỒNG NGHIỆP XÁC NHẬN)
     */
    public function approveRequest(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isQuanTriVien()) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Chỉ Quản trị viên mới có quyền phê duyệt.']);
            }
            return response()->json(['success' => false, 'message' => 'Chỉ Quản trị viên mới có quyền phê duyệt.'], 403);
        }

        $donTu = DonTuNhanSu::findOrFail($id);

        // Kiểm tra đối với đơn đổi ca: Bắt buộc đồng nghiệp phải xác nhận trước
        if ($donTu->LoaiDon === 'DOI_CA') {
            if ($donTu->TrangThai !== 'CHO_ADMIN_DUYET' && !$request->boolean('force')) {
                $errMsg = 'Đơn đổi ca này chưa được đồng nghiệp xác nhận đồng ý. Vui lòng chờ đồng nghiệp xác nhận hoặc chọn duyệt cưỡng chế.';
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors(['message' => $errMsg]);
                }
                return response()->json([
                    'success' => false,
                    'message' => $errMsg
                ], 422);
            }
        }

        $soPhutDuyet = $request->input('SoPhutDuocDuyet', $donTu->SoPhutXinPhep);
        $ghiChu = $request->input('GhiChuAdmin', 'Đã phê duyệt.');

        $donTu->TrangThai = 'DA_DUYET';
        $donTu->SoPhutDuocDuyet = max(0, (int) $soPhutDuyet);
        $donTu->MaAdminDuyet = $admin->MaTaiKhoan;
        $donTu->GhiChuAdmin = $ghiChu;
        $donTu->save();

        // NẾU LÀ ĐƠN ĐỔI CA: HOÁN ĐỔI LỊCH LÀM VIỆC CHÍNH THỨC TRÊN HỆ THỐNG
        if ($donTu->LoaiDon === 'DOI_CA') {
            $lichCu = $donTu->MaLichLamViec ? LichLamViec::find($donTu->MaLichLamViec) : null;
            $lichMoi = $donTu->MaLichDoiSang ? LichLamViec::find($donTu->MaLichDoiSang) : null;

            if ($lichCu && $lichMoi) {
                // Hoán đổi 2 ca trực cụ thể giữa 2 nhân sự
                $tempTaiKhoan = $lichCu->MaTaiKhoan;
                $tempBacSi = $lichCu->MaBacSi;

                $lichCu->MaTaiKhoan = $lichMoi->MaTaiKhoan;
                $lichCu->MaBacSi = $lichMoi->MaBacSi;
                $lichCu->save();

                $lichMoi->MaTaiKhoan = $tempTaiKhoan;
                $lichMoi->MaBacSi = $tempBacSi;
                $lichMoi->save();
            } elseif ($lichCu && $donTu->TaiKhoanDoiCung) {
                // Đồng nghiệp nhận trực thay ca này
                $dongNghiep = TaiKhoan::with('bacSi')->find($donTu->TaiKhoanDoiCung);
                if ($dongNghiep) {
                    $lichCu->MaTaiKhoan = $dongNghiep->MaTaiKhoan;
                    if ($dongNghiep->bacSi) {
                        $lichCu->MaBacSi = $dongNghiep->bacSi->MaBacSi;
                    }
                    $lichCu->save();
                }
            }
        }

        // TỰ ĐỘNG TÍNH LẠI LƯƠNG/PHẠT NẾU ĐÃ CÓ BẢN GHI CHẤM CÔNG CỦA NGÀY ĐÓ
        $chamCong = ChamCong::where('MaTaiKhoan', $donTu->MaTaiKhoan)
            ->whereDate('NgayChamCong', $donTu->NgayApDung)
            ->first();

        if ($chamCong) {
            $user = TaiKhoan::with('vaiTro')->find($donTu->MaTaiKhoan);
            $roleName = $user?->vaiTro?->TenVaiTro ?? 'BAC_SI';

            $salaryPolicy = ChamCongPolicy::calculateDaySalary([
                'role' => $roleName,
                'loai_ca' => $chamCong->LoaiCa ?? 'sang',
                'late_minutes' => $chamCong->SoPhutTre,
                'excused_late_minutes' => $donTu->LoaiDon === 'DI_MUON' ? $donTu->SoPhutDuocDuyet : 0,
                'early_minutes' => $chamCong->SoPhutVeSom,
                'excused_early_minutes' => $donTu->LoaiDon === 'VE_SOM' ? $donTu->SoPhutDuocDuyet : 0,
                'thuong' => $chamCong->TienThuong,
                'nghi_phep' => 0,
                'vang_mat' => 0,
            ]);

            $chamCong->TienPhat = $salaryPolicy['tien_phat'];
            $chamCong->TongTien = $salaryPolicy['tong_tien'];
            $chamCong->MaDonTu = $donTu->MaDonTu;
            $chamCong->save();
        }

        $approveMsg = 'Phê duyệt đơn thành công và đã tự động cập nhật lịch trực.';
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', $approveMsg);
        }

        return response()->json([
            'success' => true,
            'message' => $approveMsg,
            'data' => $donTu->fresh(['taiKhoan', 'taiKhoanDoiCung', 'adminDuyet', 'lichLamViec']),
        ]);
    }

    /**
     * ADMIN TỪ CHỐI ĐƠN TỪ
     */
    public function rejectRequest(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isQuanTriVien()) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['message' => 'Chỉ Quản trị viên mới có quyền từ chối.']);
            }
            return response()->json(['success' => false, 'message' => 'Chỉ Quản trị viên mới có quyền từ chối.'], 403);
        }

        $donTu = DonTuNhanSu::findOrFail($id);
        $donTu->TrangThai = 'ADMIN_TU_CHOI';
        $donTu->MaAdminDuyet = $admin->MaTaiKhoan;
        $donTu->GhiChuAdmin = $request->input('GhiChuAdmin', 'Quản trị viên từ chối phê duyệt.');
        $donTu->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Đã từ chối đơn thành công.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã từ chối đơn thành công.',
            'data' => $donTu->fresh(),
        ]);
    }

    /**
     * TRANG THỜI KHÓA BIỂU / LỊCH TRỰC CỦA LỄ TÂN
     */
    public function receptionistSchedulePage(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $from = $request->input('from_date', now()->startOfWeek()->toDateString());
        $to = $request->input('to_date', now()->endOfWeek()->toDateString());
        $date = $request->input('date');

        $query = LichLamViec::where('MaTaiKhoan', $user->MaTaiKhoan);

        if ($date) {
            $query->whereDate('NgayLamViec', $date);
        } else {
            $query->whereDate('NgayLamViec', '>=', $from)->whereDate('NgayLamViec', '<=', $to);
        }

        $schedules = $query->orderBy('NgayLamViec', 'asc')->orderBy('GioBatDau', 'asc')->get();

        $requestsForMe = DonTuNhanSu::with(['taiKhoan.vaiTro', 'lichLamViec', 'lichDoiSang'])
            ->where('TaiKhoanDoiCung', $user->MaTaiKhoan)
            ->where('TrangThai', 'CHO_DONG_NGHIEP_XAC_NHAN')
            ->orderBy('created_at', 'desc')
            ->get();

        $myRequests = DonTuNhanSu::with(['taiKhoanDoiCung', 'lichLamViec', 'lichDoiSang'])
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $colleagues = self::getEligibleColleagues($user);

        return Inertia::render('Receptionist/Schedule', [
            'user' => $user->load('vaiTro'),
            'schedules' => $schedules,
            'requestsForMe' => $requestsForMe,
            'myRequests' => $myRequests,
            'colleagues' => $colleagues,
            'filters' => [
                'date' => $date,
                'from_date' => $from,
                'to_date' => $to,
            ],
        ]);
    }

    /**
     * HELPER: DANH SÁCH ĐỒNG NGHIỆP CÙNG VAI TRÒ / CHUYÊN KHOA ĐỂ ĐỔI CA
     */
    public static function getEligibleColleagues($user)
    {
        if (!$user) return [];
        $roleName = $user->vaiTro?->TenVaiTro;

        if ($roleName === 'BAC_SI' || $user->bacSi) {
            $doctor = $user->bacSi;
            $chuyenKhoaId = $doctor?->MaChuyenKhoa;
            return TaiKhoan::with(['bacSi.chuyenKhoa', 'vaiTro'])
                ->where('MaTaiKhoan', '!=', $user->MaTaiKhoan)
                ->whereHas('vaiTro', fn ($q) => $q->where('TenVaiTro', 'BAC_SI'))
                ->get()
                ->map(function ($tk) use ($chuyenKhoaId) {
                    $bs = $tk->bacSi;
                    $isSameSpecialty = ($chuyenKhoaId && $bs && $bs->MaChuyenKhoa == $chuyenKhoaId);
                    return [
                        'MaTaiKhoan' => $tk->MaTaiKhoan,
                        'HoTen' => $bs ? (($bs->HocVi ? $bs->HocVi . '. ' : 'BS. ') . $bs->HoTen) : ($tk->name ?? $tk->TenDangNhap),
                        'TenDangNhap' => $tk->TenDangNhap,
                        'TenChuyenKhoa' => $bs?->chuyenKhoa?->TenChuyenKhoa ?? 'Đa khoa',
                        'isSameSpecialty' => $isSameSpecialty,
                        'role' => 'BAC_SI',
                    ];
                })
                ->sortByDesc('isSameSpecialty')
                ->values();
        }

        if ($roleName === 'NHAN_VIEN_CAN_LAM_SANG') {
            return TaiKhoan::with('vaiTro')
                ->where('MaTaiKhoan', '!=', $user->MaTaiKhoan)
                ->whereHas('vaiTro', fn ($q) => $q->where('TenVaiTro', 'NHAN_VIEN_CAN_LAM_SANG'))
                ->get()
                ->map(function ($tk) {
                    return [
                        'MaTaiKhoan' => $tk->MaTaiKhoan,
                        'HoTen' => 'KTV. ' . ($tk->name ?? $tk->TenDangNhap),
                        'TenDangNhap' => $tk->TenDangNhap,
                        'TenChuyenKhoa' => 'Cận lâm sàng / Xét nghiệm',
                        'isSameSpecialty' => true,
                        'role' => 'CLS',
                    ];
                })
                ->values();
        }

        if ($roleName === 'LE_TAN') {
            return TaiKhoan::with('vaiTro')
                ->where('MaTaiKhoan', '!=', $user->MaTaiKhoan)
                ->whereHas('vaiTro', fn ($q) => $q->where('TenVaiTro', 'LE_TAN'))
                ->get()
                ->map(function ($tk) {
                    return [
                        'MaTaiKhoan' => $tk->MaTaiKhoan,
                        'HoTen' => 'Lễ tân. ' . ($tk->name ?? $tk->TenDangNhap),
                        'TenDangNhap' => $tk->TenDangNhap,
                        'TenChuyenKhoa' => 'Tiếp đón & Thu ngân',
                        'isSameSpecialty' => true,
                        'role' => 'LE_TAN',
                    ];
                })
                ->values();
        }

        return [];
    }
}
