<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing(['vaiTro', 'benhNhan', 'bacSi', 'nhanVien']);
        }

        $todaySchedule = null;
        $todayAttendance = null;

        if ($user && ($user->isBacSi() || $user->isLeTan() || $user->isNhanVienCanLamSang())) {
            $today = now()->toDateString();
            $maBacSi = $user->bacSi?->MaBacSi;
            $maTaiKhoan = $user->MaTaiKhoan;

            $todaySchedule = \App\Models\LichLamViec::query()
                ->when($maBacSi, fn ($q) => $q->where('MaBacSi', $maBacSi))
                ->when(!$maBacSi && $maTaiKhoan, fn ($q) => $q->where('MaTaiKhoan', $maTaiKhoan))
                ->whereDate('NgayLamViec', $today)
                ->first();

            $todayAttendance = \App\Models\ChamCong::query()
                ->with('donTu')
                ->when($maBacSi, fn ($q) => $q->where('MaBacSi', $maBacSi))
                ->when(!$maBacSi && $maTaiKhoan, fn ($q) => $q->where('MaTaiKhoan', $maTaiKhoan))
                ->whereDate('NgayChamCong', $today)
                ->first();
        }

        return [
            ...parent::share($request),
            'csrf_token' => fn () => csrf_token(),
            'auth' => [
                'user' => $user,
                'todaySchedule' => $todaySchedule,
                'todayAttendance' => $todayAttendance,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
