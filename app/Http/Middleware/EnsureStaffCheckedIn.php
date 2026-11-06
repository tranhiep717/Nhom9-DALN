<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ChamCong;

class EnsureStaffCheckedIn
{
    /**
     * Chặn nhân sự (Bác sĩ, Lễ tân, Cận lâm sàng) thực hiện các thao tác nghiệp vụ khi chưa điểm danh vào ca
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Bỏ qua nếu là Quản trị viên hoặc Bệnh nhân
        if ($user->isQuanTriVien() || $user->isBenhNhan()) {
            return $next($request);
        }

        // Chỉ kiểm tra Bác sĩ, Lễ tân, Nhân viên Cận lâm sàng
        if ($user->isBacSi() || $user->isLeTan() || $user->isNhanVienCanLamSang()) {
            $today = now()->toDateString();
            $maBacSi = $user->bacSi?->MaBacSi;
            $maTaiKhoan = $user->MaTaiKhoan;

            $attendance = ChamCong::query()
                ->when($maBacSi, fn ($q) => $q->where('MaBacSi', $maBacSi))
                ->when(!$maBacSi && $maTaiKhoan, fn ($q) => $q->where('MaTaiKhoan', $maTaiKhoan))
                ->whereDate('NgayChamCong', $today)
                ->whereNotNull('GioCheckIn')
                ->first();

            if (!$attendance) {
                $roleTitle = $user->isBacSi() ? 'Bác sĩ' : ($user->isLeTan() ? 'Lễ tân' : 'Kỹ thuật viên Cận lâm sàng');
                $msg = "{$roleTitle} chưa điểm danh vào ca trực hôm nay. Vui lòng bấm [Vào ca trực] để bắt đầu làm việc!";

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => $msg,
                        'need_checkin' => true,
                    ], 403);
                }

                if ($request->header('X-Inertia')) {
                    return redirect()->back()->withErrors([
                        'message' => $msg,
                    ])->with('error', $msg);
                }

                return redirect()->back()->with('error', $msg);
            }
        }

        return $next($request);
    }
}

