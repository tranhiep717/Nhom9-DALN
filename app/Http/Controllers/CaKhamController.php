<?php

namespace App\Http\Controllers;

use App\Models\CaKham;
use App\Models\LichLamViec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CaKhamController extends Controller
{
    /**
     * 1. Hiển thị danh sách ca khám
     * 2. Lọc ca khám theo bác sĩ, chuyên khoa và ngày
     * 3. Hiển thị số lượng đã đặt và số lượng còn nhận
     */
    public function index(Request $request): JsonResponse
    {
        $query = CaKham::query()->with([
            'lichLamViec:MaLichLamViec,MaBacSi,NgayLamViec,GioBatDau,GioKetThuc,TrangThai',
            'lichLamViec.bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'lichLamViec.bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
        ])->withCount([
            'lichHens as so_luong_da_dat' => function ($q) {
                // Chỉ đếm các trạng thái đang chiếm chỗ (giống stored procedure sp_dat_lich_hen)
                $q->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN']);
            },
        ]);

        // Lọc theo lịch làm việc
        if ($scheduleId = $request->input('schedule_id')) {
            $query->where('MaLichLamViec', $scheduleId);
        }

        // Lọc theo Bác sĩ
        if ($doctorId = $request->input('doctor_id')) {
            $query->whereHas('lichLamViec', function ($q) use ($doctorId) {
                $q->where('MaBacSi', $doctorId);
            });
        }

        // Lọc theo Chuyên khoa
        if ($specialtyId = $request->input('specialty_id')) {
            $query->whereHas('lichLamViec.bacSi', function ($q) use ($specialtyId) {
                $q->where('MaChuyenKhoa', $specialtyId);
            });
        }

        // Lọc theo Ngày khám
        if ($date = $request->input('date')) {
            $query->whereHas('lichLamViec', function ($q) use ($date) {
                $q->whereDate('NgayLamViec', $date);
            });
        }

        // Lọc theo Trạng thái ca
        if ($status = $request->input('status')) {
            $query->where('TrangThai', $status);
        }

        $caKhams = $query->orderBy('GioBatDau', 'asc')->get();

        // 3. Tính toán số lượng còn nhận cho từng ca khám
        $data = $caKhams->map(function ($ca) {
            $daDat = $ca->so_luong_da_dat ?? 0;
            $sucChua = $ca->SoLuongTiepNhan;
            $conNhan = max(0, $sucChua - $daDat);
            $khaDung = ($ca->TrangThai === 'CON_TRONG') && ($conNhan > 0);

            return [
                'MaCaKham' => $ca->MaCaKham,
                'MaLichLamViec' => $ca->MaLichLamViec,
                'GioBatDau' => $ca->GioBatDau,
                'GioKetThuc' => $ca->GioKetThuc,
                'KhungGio' => substr($ca->GioBatDau, 0, 5) . ' - ' . substr($ca->GioKetThuc, 0, 5),
                'SoLuongTiepNhan' => $sucChua,
                'SoLuongDaDat' => $daDat,
                'SoLuongConNhan' => $conNhan,
                'TrangThai' => $ca->TrangThai,
                'KhaDung' => $khaDung,
                'lich_lam_viec' => $ca->lichLamViec,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'total' => $data->count(),
        ]);
    }

    /**
     * Xem chi tiết một ca khám
     */
    public function show(int $id): JsonResponse
    {
        $ca = CaKham::with([
            'lichLamViec:MaLichLamViec,MaBacSi,NgayLamViec,GioBatDau,GioKetThuc,TrangThai',
            'lichLamViec.bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa',
            'lichLamViec.bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa',
        ])->withCount([
            'lichHens as so_luong_da_dat' => function ($q) {
                $q->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN']);
            },
        ])->find($id);

        if (!$ca) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ca khám.'], 404);
        }

        $daDat = $ca->so_luong_da_dat ?? 0;
        $sucChua = $ca->SoLuongTiepNhan;
        $conNhan = max(0, $sucChua - $daDat);

        return response()->json([
            'success' => true,
            'data' => [
                'MaCaKham' => $ca->MaCaKham,
                'MaLichLamViec' => $ca->MaLichLamViec,
                'GioBatDau' => $ca->GioBatDau,
                'GioKetThuc' => $ca->GioKetThuc,
                'KhungGio' => substr($ca->GioBatDau, 0, 5) . ' - ' . substr($ca->GioKetThuc, 0, 5),
                'SoLuongTiepNhan' => $sucChua,
                'SoLuongDaDat' => $daDat,
                'SoLuongConNhan' => $conNhan,
                'TrangThai' => $ca->TrangThai,
                'KhaDung' => ($ca->TrangThai === 'CON_TRONG') && ($conNhan > 0),
                'lich_lam_viec' => $ca->lichLamViec,
            ],
        ]);
    }

    /**
     * 5. Tạo ca khám mới
     * - Kiểm tra lịch làm việc của bác sĩ trước khi tạo ca
     * - Giờ bắt đầu, kết thúc phải nằm trong giờ làm việc
     * - Không trùng với ca khám khác trong cùng lịch làm việc
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'MaLichLamViec' => ['required', 'exists:lich_lam_viec,MaLichLamViec'],
            'GioBatDau' => ['required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['required', 'date_format:H:i,H:i:s', 'after:GioBatDau'],
            'SoLuongTiepNhan' => ['required', 'integer', 'min:1'],
            'TrangThai' => ['nullable', 'string', 'in:CON_TRONG,DA_DAY,DONG'],
        ], [
            'MaLichLamViec.required' => 'Vui lòng chọn lịch làm việc.',
            'MaLichLamViec.exists' => 'Lịch làm việc không tồn tại.',
            'GioBatDau.required' => 'Vui lòng nhập giờ bắt đầu ca.',
            'GioKetThuc.required' => 'Vui lòng nhập giờ kết thúc ca.',
            'GioKetThuc.after' => 'Giờ kết thúc ca phải sau giờ bắt đầu.',
            'SoLuongTiepNhan.min' => 'Số lượng tiếp nhận tối thiểu là 1.',
        ]);

        $schedule = LichLamViec::find($validated['MaLichLamViec']);

        // Phân quyền: Bác sĩ chỉ tạo ca cho lịch của mình, Admin tạo được cho tất cả
        $isOwnerDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $schedule->MaBacSi;
        $isAdmin = $user && $user->isQuanTriVien();

        if (!$isOwnerDoctor && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo ca khám cho lịch làm việc này.'], 403);
        }

        // Kiểm tra giờ ca khám nằm trong khung giờ của lịch làm việc (khớp với Trigger DB)
        if (strtotime($validated['GioBatDau']) < strtotime($schedule->GioBatDau) ||
            strtotime($validated['GioKetThuc']) > strtotime($schedule->GioKetThuc)) {
            throw ValidationException::withMessages([
                'GioBatDau' => "Giờ ca khám phải nằm trong giờ làm việc ({$schedule->GioBatDau} - {$schedule->GioKetThuc}).",
            ]);
        }

        // Kiểm tra trùng giờ với ca khám khác trong cùng lịch
        $overlap = CaKham::where('MaLichLamViec', $schedule->MaLichLamViec)
            ->where(function ($q) use ($validated) {
                $q->where('GioBatDau', '<', $validated['GioKetThuc'])
                  ->where('GioKetThuc', '>', $validated['GioBatDau']);
            })->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'GioBatDau' => 'Đã có ca khám khác trùng hoặc giao thoa khung giờ trong lịch làm việc này.',
            ]);
        }

        $caKham = CaKham::create([
            'MaLichLamViec' => $schedule->MaLichLamViec,
            'GioBatDau' => $validated['GioBatDau'],
            'GioKetThuc' => $validated['GioKetThuc'],
            'SoLuongTiepNhan' => $validated['SoLuongTiepNhan'],
            'TrangThai' => $validated['TrangThai'] ?? 'CON_TRONG',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo ca khám thành công.',
            'data' => $caKham,
        ], 201);
    }

    /**
     * Cập nhật ca khám
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $caKham = CaKham::with('lichLamViec')->find($id);

        if (!$caKham) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy ca khám.'], 404);
        }

        $schedule = $caKham->lichLamViec;
        $isOwnerDoctor = $user && $user->isBacSi() && $user->bacSi?->MaBacSi === $schedule->MaBacSi;
        $isAdmin = $user && $user->isQuanTriVien();

        if (!$isOwnerDoctor && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền sửa ca khám này.'], 403);
        }

        $validated = $request->validate([
            'GioBatDau' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'GioKetThuc' => ['sometimes', 'required', 'date_format:H:i,H:i:s'],
            'SoLuongTiepNhan' => ['sometimes', 'required', 'integer', 'min:1'],
            'TrangThai' => ['sometimes', 'required', 'string', 'in:CON_TRONG,DA_DAY,DONG'],
        ]);

        $gioBD = $validated['GioBatDau'] ?? $caKham->GioBatDau;
        $gioKT = $validated['GioKetThuc'] ?? $caKham->GioKetThuc;

        if (strtotime($gioKT) <= strtotime($gioBD)) {
            throw ValidationException::withMessages([
                'GioKetThuc' => 'Giờ kết thúc ca phải sau giờ bắt đầu.',
            ]);
        }

        if (strtotime($gioBD) < strtotime($schedule->GioBatDau) || strtotime($gioKT) > strtotime($schedule->GioKetThuc)) {
            throw ValidationException::withMessages([
                'GioBatDau' => "Giờ ca khám phải nằm trong giờ làm việc ({$schedule->GioBatDau} - {$schedule->GioKetThuc}).",
            ]);
        }

        // Kiểm tra trùng giờ
        $overlap = CaKham::where('MaLichLamViec', $schedule->MaLichLamViec)
            ->where('MaCaKham', '<>', $caKham->MaCaKham)
            ->where(function ($q) use ($gioBD, $gioKT) {
                $q->where('GioBatDau', '<', $gioKT)
                  ->where('GioKetThuc', '>', $gioBD);
            })->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'GioBatDau' => 'Khung giờ này trùng với ca khám khác trong cùng lịch.',
            ]);
        }

        // Kiểm tra số lượng lịch hẹn đang hoạt động của ca khám
        $activeAppointmentsCount = $caKham->lichHens()
            ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])
            ->count();

        if (isset($validated['TrangThai']) && $validated['TrangThai'] === 'DONG' && $caKham->TrangThai !== 'DONG') {
            if ($activeAppointmentsCount > 0) {
                throw ValidationException::withMessages([
                    'TrangThai' => "Ca khám đang có {$activeAppointmentsCount} lịch hẹn của bệnh nhân, không thể chuyển sang trạng thái ĐÓNG.",
                ]);
            }
        }

        if (isset($validated['SoLuongTiepNhan']) && $validated['SoLuongTiepNhan'] < $activeAppointmentsCount) {
            throw ValidationException::withMessages([
                'SoLuongTiepNhan' => "Số lượng tiếp nhận mới ({$validated['SoLuongTiepNhan']}) không thể nhỏ hơn số lịch hẹn đã đặt ({$activeAppointmentsCount}).",
            ]);
        }

        $caKham->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ca khám thành công.',
            'data' => $caKham->fresh(),
        ]);
    }
}
