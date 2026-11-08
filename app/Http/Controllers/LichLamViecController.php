<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\LichLamViec;
use App\Models\ThongBao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LichLamViecController extends Controller
{
    /**
     * Danh sách lịch làm việc
     * - Bác sĩ xem lịch của chính mình
     * - Quản trị viên xem lịch của các bác sĩ (lọc theo bác sĩ, ngày)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LichLamViec::query()->with([
            'bacSi:MaBacSi,MaTaiKhoan,HoTen,HocVi,MaChuyenKhoa,SoDienThoai,EmailLienHe,KinhNghiem,MoTa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,MaVaiTro',
            'taiKhoan.vaiTro:MaVaiTro,TenVaiTro',
            'taiKhoan.nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai',
            'caKhams'
        ]);

        // Phân quyền: Bác sĩ chỉ xem lịch của chính mình
        if ($user && $user->isBacSi()) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Tài khoản chưa được liên kết với hồ sơ Bác sĩ.'], 403);
            }
            $query->where('MaBacSi', $maBacSi);
        } elseif ($maBacSi = $request->input('doctor_id')) {
            // Admin hoặc người dùng lọc theo bác sĩ
            $query->where('MaBacSi', $maBacSi);
        }

        // Lọc theo ngày: Mặc định lấy tuần hiện tại (startOfWeek đến endOfWeek) nếu không lọc ngày cụ thể
        $from = $request->input('from_date');
        $to = $request->input('to_date');
        $date = $request->input('date');

        if ($date) {
            $query->whereDate('NgayLamViec', $date);
        } elseif ($from) {
            $query->whereDate('NgayLamViec', '>=', $from);
            if ($to) {
                $query->whereDate('NgayLamViec', '<=', $to);
            }
        } else {
            // Mặc định cả Admin và Bác sĩ đều xem tuần hiện tại để tránh tràn lịch quá khứ
            $from = now()->startOfWeek()->toDateString();
            $to = now()->endOfWeek()->toDateString();
            $query->whereDate('NgayLamViec', '>=', $from)->whereDate('NgayLamViec', '<=', $to);
        }

        // Lọc theo trạng thái
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $schedules = $query->orderBy('NgayLamViec', 'asc')->orderBy('GioBatDau', 'asc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $schedules,
                'total' => $schedules->count(),
            ]);
        }

        if ($user && $user->isQuanTriVien()) {
            $doctors = \App\Models\BacSi::whereIn('TrangThai', ['HOAT_DONG', 'DANG_LAM_VIEC'])
                ->with('chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa')
                ->orderBy('HoTen', 'asc')
                ->get();

            $clsStaff = \App\Models\TaiKhoan::with(['vaiTro:MaVaiTro,TenVaiTro', 'nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai'])
                ->whereHas('vaiTro', fn ($query) => $query->where('TenVaiTro', 'NHAN_VIEN_CAN_LAM_SANG'))
                ->orderBy('Email', 'asc')
                ->get()
                ->map(function ($staff) {
                    return [
                        'MaTaiKhoan' => $staff->MaTaiKhoan,
                        'TenDangNhap' => $staff->TenDangNhap,
                        'HoTen' => $staff->nhanVien?->HoTen ?? $staff->name ?? $staff->TenDangNhap,
                        'Email' => $staff->Email,
                        'TrangThai' => $staff->TrangThai,
                        'role' => 'CLS',
                    ];
                });

            $receptionStaff = \App\Models\TaiKhoan::with(['vaiTro:MaVaiTro,TenVaiTro', 'nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai'])
                ->whereHas('vaiTro', fn ($query) => $query->where('TenVaiTro', 'LE_TAN'))
                ->orderBy('Email', 'asc')
                ->get()
                ->map(function ($staff) {
                    return [
                        'MaTaiKhoan' => $staff->MaTaiKhoan,
                        'TenDangNhap' => $staff->TenDangNhap,
                        'HoTen' => $staff->nhanVien?->HoTen ?? $staff->name ?? $staff->TenDangNhap,
                        'Email' => $staff->Email,
                        'TrangThai' => $staff->TrangThai,
                        'role' => 'RECEPTION',
                    ];
                });

            return Inertia::render('Admin/Schedules', [
                'schedules' => $schedules,
                'doctors' => $doctors,
                'staffGroups' => [
                    'cls' => $clsStaff,
                    'reception' => $receptionStaff,
                ],
                'filters' => [
                    'date' => $date,
                    'from_date' => $from,
                    'to_date' => $to,
                    'doctor_id' => $request->input('doctor_id'),
                    'status' => $request->input('status'),
                ],
            ]);
        }

        // Dành cho bác sĩ: Lấy đơn đổi ca chờ bác sĩ xác nhận + danh sách đồng nghiệp
        $requestsForMe = \App\Models\DonTuNhanSu::with(['taiKhoan.vaiTro', 'taiKhoan.bacSi.chuyenKhoa', 'taiKhoan.nhanVien', 'lichLamViec', 'lichDoiSang'])
            ->where('TaiKhoanDoiCung', $user->MaTaiKhoan)
            ->where('TrangThai', 'CHO_DONG_NGHIEP_XAC_NHAN')
            ->orderBy('created_at', 'desc')
            ->get();

        $myRequests = \App\Models\DonTuNhanSu::with(['taiKhoanDoiCung.bacSi', 'taiKhoanDoiCung.nhanVien', 'lichLamViec', 'lichDoiSang'])
            ->where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $colleagues = \App\Http\Controllers\ChamCongController::getEligibleColleagues($user);

        return Inertia::render('Doctor/Schedule', [
            'schedules' => $schedules,
            'requestsForMe' => $requestsForMe,
            'myRequests' => $myRequests,
            'colleagues' => $colleagues,
            'filters' => [
                'date' => $date,
                'from_date' => $from,
                'to_date' => $to,
                'doctor_id' => $request->input('doctor_id'),
            ],
        ]);
    }

    /**
     * Xem chi tiết một lịch làm việc
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = LichLamViec::with([
            'bacSi:MaBacSi,MaTaiKhoan,HoTen,HocVi,MaChuyenKhoa,SoDienThoai,EmailLienHe,KinhNghiem,MoTa',
            'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
            'taiKhoan:MaTaiKhoan,TenDangNhap,Email,MaVaiTro',
            'taiKhoan.vaiTro:MaVaiTro,TenVaiTro',
            'taiKhoan.nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai',
            'caKhams'
        ])->find($id);

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch làm việc.'], 404);
        }

        // Bác sĩ không được xem chi tiết lịch của bác sĩ khác ngoài phạm vi
        if ($user && $user->isBacSi() && $user->bacSi?->MaBacSi !== $schedule->MaBacSi) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem lịch làm việc của bác sĩ khác.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    /**
     * Tạo lịch làm việc mới
     * - Bác sĩ tạo lịch cho chính mình
     * - Quản trị viên có thể tạo lịch cho bất kỳ bác sĩ nào
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Phân quyền
        $isAdmin = $user && $user->isQuanTriVien();
        $isDoctor = $user && $user->isBacSi();

        if (!$isAdmin && !$isDoctor) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo lịch làm việc.'], 403);
        }

        // Xác định MaBacSi hoặc MaTaiKhoan (nhân sự Lễ tân / CLS)
        $maTaiKhoan = null;
        if ($isDoctor) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Hồ sơ bác sĩ chưa hợp lệ.'], 400);
            }
        } else {
            // Admin có thể chọn Bác sĩ HOẶC Tài khoản nhân viên (CLS, Lễ tân)
            if ($request->filled('MaTaiKhoan')) {
                $request->validate([
                    'MaTaiKhoan' => ['required', 'exists:tai_khoan,MaTaiKhoan'],
                ], [
                    'MaTaiKhoan.required' => 'Vui lòng chọn nhân viên.',
                    'MaTaiKhoan.exists' => 'Tài khoản nhân viên không tồn tại.',
                ]);
                $maTaiKhoan = (int)$request->input('MaTaiKhoan');
                $maBacSi = null;
            } else {
                $request->validate([
                    'MaBacSi' => ['required', 'exists:bac_si,MaBacSi'],
                ], [
                    'MaBacSi.required' => 'Vui lòng chọn bác sĩ hoặc nhân sự.',
                    'MaBacSi.exists' => 'Bác sĩ được chọn không tồn tại.',
                ]);
                $maBacSi = (int)$request->input('MaBacSi');
                $maTaiKhoan = null;
            }
        }

        // 2. Validate dữ liệu
        $validated = $request->validate([
            'NgayLamViec' => ['required', 'date', 'after_or_equal:today'],
            'LoaiCa' => ['nullable', 'string', 'in:sang,chieu,toi,dem,ngay,custom'],
            'GioBatDau' => ['required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['required', 'date_format:H:i,H:i:s', 'after:GioBatDau'],
            'SoLuongTiepNhan' => ['nullable', 'integer', 'min:1'],
            'TrangThai' => ['nullable', 'string', 'in:MO,DONG,NGHI'],
        ], [
            'NgayLamViec.required' => 'Vui lòng chọn ngày làm việc.',
            'NgayLamViec.after_or_equal' => 'Ngày làm việc không thể ở quá khứ.',
            'LoaiCa.in' => 'Loại ca không hợp lệ.',
            'GioBatDau.required' => 'Vui lòng nhập giờ bắt đầu.',
            'GioKetThuc.required' => 'Vui lòng nhập giờ kết thúc.',
            'GioKetThuc.after' => 'Giờ kết thúc phải sau giờ bắt đầu.',
        ]);

        $validated['LoaiCa'] = $validated['LoaiCa'] ?? \App\Models\LichLamViec::normalizeShiftType($validated['GioBatDau'], $validated['GioKetThuc']);

        if ($maBacSi) {
            // 3. Mỗi bác sĩ chỉ được có tối đa 1 ca làm việc trong 1 ngày
            $this->checkDoctorDailyScheduleLimit($maBacSi, $validated['NgayLamViec']);

            // 4. Kiểm tra lịch bị trùng khung giờ của bác sĩ trong cùng ngày
            $this->checkScheduleConflict($maBacSi, $validated['NgayLamViec'], $validated['GioBatDau'], $validated['GioKetThuc']);
        } elseif ($maTaiKhoan) {
            // Kiểm tra nhân sự không trùng ca trong cùng ngày và cùng loại ca
            $exists = LichLamViec::where('MaTaiKhoan', $maTaiKhoan)
                ->where('NgayLamViec', $validated['NgayLamViec'])
                ->where('LoaiCa', $validated['LoaiCa'])
                ->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nhân sự đã được phân công ca làm việc này trong ngày ' . $validated['NgayLamViec'],
                ], 422);
            }
        }

        $schedule = LichLamViec::create([
            'MaBacSi' => $maBacSi,
            'MaTaiKhoan' => $maTaiKhoan,
            'NgayLamViec' => $validated['NgayLamViec'],
            'LoaiCa' => $validated['LoaiCa'],
            'GioBatDau' => $validated['GioBatDau'],
            'GioKetThuc' => $validated['GioKetThuc'],
            'SoLuongTiepNhan' => $validated['SoLuongTiepNhan'] ?? 10,
            'TrangThai' => $validated['TrangThai'] ?? 'MO',
        ]);

        if ($schedule->MaBacSi) {
            $schedule->syncCaKhams();
        }

        // Tự động tạo thông báo gửi tới nhân sự được phân ca
        $targetTaiKhoanId = $maTaiKhoan;
        if (!$targetTaiKhoanId && $maBacSi) {
            $targetTaiKhoanId = BacSi::where('MaBacSi', $maBacSi)->value('MaTaiKhoan');
        }

        if ($targetTaiKhoanId) {
            $shiftLabel = match ($validated['LoaiCa'] ?? '') {
                'sang' => 'Ca sáng',
                'chieu' => 'Ca chiều',
                'toi' => 'Ca tối',
                'dem' => 'Ca đêm',
                'ngay' => 'Ca cả ngày',
                default => 'Ca trực'
            };
            $gioStart = substr($validated['GioBatDau'], 0, 5);
            $gioEnd = substr($validated['GioKetThuc'], 0, 5);

            ThongBao::create([
                'MaTaiKhoan' => $targetTaiKhoanId,
                'TieuDe' => 'Phân công ca trực mới',
                'NoiDung' => "Bạn vừa được Quản trị viên phân công {$shiftLabel} ngày {$validated['NgayLamViec']} ({$gioStart} - {$gioEnd}). Vui lòng kiểm tra thời khóa biểu!",
                'Loai' => 'LICH_LAM_VIEC',
                'DuongDan' => $maBacSi ? '/doctor/schedule' : '/staff/schedule',
                'TrangThai' => 'CHUA_DOC',
                'NgayTao' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo lịch làm việc thành công.',
            'data' => $schedule->load([
                'bacSi:MaBacSi,MaTaiKhoan,HoTen,HocVi,MaChuyenKhoa,SoDienThoai,EmailLienHe,KinhNghiem,MoTa',
                'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
                'taiKhoan:MaTaiKhoan,TenDangNhap,Email,MaVaiTro',
                'taiKhoan.vaiTro:MaVaiTro,TenVaiTro',
                'taiKhoan.nhanVien:MaNhanVien,MaTaiKhoan,HoTen,LoaiNhanVien,SoDienThoai',
                'caKhams'
            ]),
        ], 201);
    }

    /**
     * Cập nhật lịch làm việc
     * - Bác sĩ chỉ được sửa lịch của chính mình
     * - Quản trị viên có toàn quyền sửa
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = LichLamViec::find($id);

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch làm việc.'], 404);
        }

        $isAdmin = $user && $user->isQuanTriVien();
        $isOwnerDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $schedule->MaBacSi;

        if (!$isAdmin && !$isOwnerDoctor) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền chỉnh sửa lịch làm việc của người khác.'], 403);
        }

        $validated = $request->validate([
            'NgayLamViec' => ['sometimes', 'required', 'date'],
            'LoaiCa' => ['sometimes', 'nullable', 'string', 'in:sang,chieu,toi,dem,ngay,custom'],
            'GioBatDau' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'SoLuongTiepNhan' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'TrangThai' => ['sometimes', 'nullable', 'string', 'in:MO,DONG,NGHI'],
        ]);

        $ngay = $validated['NgayLamViec'] ?? $schedule->NgayLamViec;
        $gioBD = $validated['GioBatDau'] ?? $schedule->GioBatDau;
        $gioKT = $validated['GioKetThuc'] ?? $schedule->GioKetThuc;
        $loaiCa = $validated['LoaiCa'] ?? ($schedule->LoaiCa ?? \App\Models\LichLamViec::normalizeShiftType($gioBD, $gioKT));

        if (strtotime($gioKT) <= strtotime($gioBD)) {
            throw ValidationException::withMessages([
                'GioKetThuc' => 'Giờ kết thúc phải sau giờ bắt đầu.',
            ]);
        }

        if (isset($validated['TrangThai']) && in_array($validated['TrangThai'], ['DONG', 'NGHI']) && $schedule->TrangThai !== $validated['TrangThai']) {
            $hasAppointments = \App\Models\LichHen::whereHas('caKham', function ($q) use ($id) {
                $q->where('MaLichLamViec', $id);
            })->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])->exists();

            if ($hasAppointments) {
                throw ValidationException::withMessages([
                    'TrangThai' => 'Lịch làm việc này đang có ca khám chứa lịch hẹn chờ khám của bệnh nhân, không thể chuyển sang ĐÓNG/NGHỈ.',
                ]);
            }
        }

        // Mỗi bác sĩ chỉ được có tối đa 1 ca làm việc trong 1 ngày
        $this->checkDoctorDailyScheduleLimit($schedule->MaBacSi, $ngay, $schedule->MaLichLamViec);

        // Kiểm tra trùng lịch (trừ chính bản ghi này)
        $this->checkScheduleConflict($schedule->MaBacSi, $ngay, $gioBD, $gioKT, $schedule->MaLichLamViec);

        $schedule->update([
            'NgayLamViec' => $ngay,
            'LoaiCa' => $loaiCa,
            'GioBatDau' => $gioBD,
            'GioKetThuc' => $gioKT,
            'SoLuongTiepNhan' => $validated['SoLuongTiepNhan'] ?? $schedule->SoLuongTiepNhan,
            'TrangThai' => $validated['TrangThai'] ?? $schedule->TrangThai,
        ]);

        if ($schedule->MaBacSi) {
            $schedule->syncCaKhams();
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật lịch làm việc thành công.',
            'data' => $schedule->fresh(),
        ]);
    }

    /**
     * Hủy / Xóa lịch làm việc
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = LichLamViec::withCount('caKhams')->find($id);

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy lịch làm việc.'], 404);
        }

        $isAdmin = $user && $user->isQuanTriVien();
        $isOwnerDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $schedule->MaBacSi;

        if (!$isAdmin && !$isOwnerDoctor) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy lịch làm việc này.'], 403);
        }

        // Nếu đã có ca khám bên dưới, chuyển trạng thái sang ĐÓNG thay vì xóa cứng
        if ($schedule->ca_khams_count > 0) {
            $schedule->update(['TrangThai' => 'DONG']);
            return response()->json([
                'success' => true,
                'message' => 'Lịch làm việc đã có ca khám nên đã được chuyển sang trạng thái ĐÓNG.',
            ]);
        }

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa lịch làm việc thành công.',
        ]);
    }

    /**
     * Kiểm tra trùng lặp lịch làm việc trong cùng ngày của bác sĩ
     */
    protected function checkDoctorDailyScheduleLimit(int $maBacSi, string $ngayLamViec, ?int $ignoreId = null): void
    {
        $query = LichLamViec::where('MaBacSi', $maBacSi)
            ->whereDate('NgayLamViec', $ngayLamViec)
            ->where('TrangThai', '<>', 'DONG');

        if ($ignoreId) {
            $query->where('MaLichLamViec', '<>', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'NgayLamViec' => 'Mỗi bác sĩ chỉ được phân công tối đa 1 ca làm việc trong 1 ngày. Vui lòng chọn ca cố định hoặc điều chỉnh lịch hiện có.',
            ]);
        }
    }

    protected function checkScheduleConflict(int $maBacSi, string $ngayLamViec, string $gioBatDau, string $gioKetThuc, ?int $ignoreId = null): void
    {
        $query = LichLamViec::where('MaBacSi', $maBacSi)
            ->whereDate('NgayLamViec', $ngayLamViec)
            ->where('TrangThai', '<>', 'DONG')
            ->where(function ($q) use ($gioBatDau, $gioKetThuc) {
                // Điều kiện giao nhau giữa [GioBatDau, GioKetThuc]
                $q->where('GioBatDau', '<', $gioKetThuc)
                  ->where('GioKetThuc', '>', $gioBatDau);
            });

        if ($ignoreId) {
            $query->where('MaLichLamViec', '<>', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'GioBatDau' => 'Bác sĩ đã có lịch làm việc khác trùng hoặc giao thoa khung giờ trong ngày này.',
            ]);
        }
    }
}
