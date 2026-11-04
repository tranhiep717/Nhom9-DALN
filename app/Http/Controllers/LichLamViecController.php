<?php

namespace App\Http\Controllers;

use App\Models\BacSi;
use App\Models\LichLamViec;
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
        $query = LichLamViec::query()->with(['bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa', 'caKhams']);

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

        // Lọc theo ngày
        if ($date = $request->input('date')) {
            $query->whereDate('NgayLamViec', $date);
        } elseif ($from = $request->input('from_date')) {
            $query->whereDate('NgayLamViec', '>=', $from);
            if ($to = $request->input('to_date')) {
                $query->whereDate('NgayLamViec', '<=', $to);
            }
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

            return Inertia::render('Admin/Schedules', [
                'schedules' => $schedules,
                'doctors' => $doctors,
                'filters' => $request->only(['date', 'from_date', 'to_date', 'doctor_id', 'status']),
            ]);
        }

        return Inertia::render('Doctor/Schedule', [
            'schedules' => $schedules,
            'filters' => $request->only(['date', 'from_date', 'to_date', 'doctor_id']),
        ]);
    }

    /**
     * Xem chi tiết một lịch làm việc
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $schedule = LichLamViec::with(['bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa', 'caKhams'])->find($id);

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

        // Xác định MaBacSi
        if ($isDoctor) {
            $maBacSi = $user->bacSi?->MaBacSi;
            if (!$maBacSi) {
                return response()->json(['success' => false, 'message' => 'Hồ sơ bác sĩ chưa hợp lệ.'], 400);
            }
        } else {
            // Admin chỉ định bác sĩ
            $request->validate([
                'MaBacSi' => ['required', 'exists:bac_si,MaBacSi'],
            ], [
                'MaBacSi.required' => 'Vui lòng chọn bác sĩ.',
                'MaBacSi.exists' => 'Bác sĩ được chọn không tồn tại.',
            ]);
            $maBacSi = $request->input('MaBacSi');
        }

        // 2. Validate dữ liệu
        $validated = $request->validate([
            'NgayLamViec' => ['required', 'date', 'after_or_equal:today'],
            'GioBatDau' => ['required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['required', 'date_format:H:i,H:i:s', 'after:GioBatDau'],
            'SoLuongTiepNhan' => ['nullable', 'integer', 'min:1'],
            'TrangThai' => ['nullable', 'string', 'in:MO,DONG,NGHI'],
        ], [
            'NgayLamViec.required' => 'Vui lòng chọn ngày làm việc.',
            'NgayLamViec.after_or_equal' => 'Ngày làm việc không thể ở quá khứ.',
            'GioBatDau.required' => 'Vui lòng nhập giờ bắt đầu.',
            'GioKetThuc.required' => 'Vui lòng nhập giờ kết thúc.',
            'GioKetThuc.after' => 'Giờ kết thúc phải sau giờ bắt đầu.',
        ]);

        // 3. Kiểm tra lịch bị trùng khung giờ của bác sĩ trong cùng ngày
        $this->checkScheduleConflict($maBacSi, $validated['NgayLamViec'], $validated['GioBatDau'], $validated['GioKetThuc']);

        $schedule = LichLamViec::create([
            'MaBacSi' => $maBacSi,
            'NgayLamViec' => $validated['NgayLamViec'],
            'GioBatDau' => $validated['GioBatDau'],
            'GioKetThuc' => $validated['GioKetThuc'],
            'SoLuongTiepNhan' => $validated['SoLuongTiepNhan'] ?? 10,
            'TrangThai' => $validated['TrangThai'] ?? 'MO',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo lịch làm việc thành công.',
            'data' => $schedule->load('bacSi:MaBacSi,HoTen'),
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
            'GioBatDau' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'SoLuongTiepNhan' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'TrangThai' => ['sometimes', 'nullable', 'string', 'in:MO,DONG,NGHI'],
        ]);

        $ngay = $validated['NgayLamViec'] ?? $schedule->NgayLamViec;
        $gioBD = $validated['GioBatDau'] ?? $schedule->GioBatDau;
        $gioKT = $validated['GioKetThuc'] ?? $schedule->GioKetThuc;

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

        // Kiểm tra trùng lịch (trừ chính bản ghi này)
        $this->checkScheduleConflict($schedule->MaBacSi, $ngay, $gioBD, $gioKT, $schedule->MaLichLamViec);

        $schedule->update([
            'NgayLamViec' => $ngay,
            'GioBatDau' => $gioBD,
            'GioKetThuc' => $gioKT,
            'SoLuongTiepNhan' => $validated['SoLuongTiepNhan'] ?? $schedule->SoLuongTiepNhan,
            'TrangThai' => $validated['TrangThai'] ?? $schedule->TrangThai,
        ]);

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
