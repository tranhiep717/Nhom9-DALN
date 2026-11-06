<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(function (\Illuminate\Http\Request $request) {
            $user = $request->user();
            if (!$user) {
                return '/';
            }
            if (!$user->relationLoaded('vaiTro')) {
                $user->load('vaiTro');
            }
            $role = strtoupper($user->vaiTro?->TenVaiTro ?? '');
            return match ($role) {
                'QUAN_TRI_VIEN' => route('admin.dashboard'),
                'BAC_SI' => route('doctor.dashboard'),
                'LE_TAN' => route('receptionist.dashboard'),
                'NHAN_VIEN_CAN_LAM_SANG' => route('cls.dashboard'),
                default => route('dashboard'), // BENH_NHAN
            };
        });

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'staff.checked_in' => \App\Http\Middleware\EnsureStaffCheckedIn::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            if ($response->getStatusCode() === 419) {
                // Nếu là Inertia SPA request, redirect back để Inertia tự làm mới trang với session & CSRF token mới
                if ($request->header('X-Inertia')) {
                    return back()->with([
                        'error' => 'Phiên làm việc hoặc mã bảo mật đã được làm mới. Vui lòng thử lại thao tác.',
                    ]);
                }

                // Nếu là AJAX / JSON request (như Axios, fetch, XMLHttpRequest)
                if ($request->expectsJson() || $request->ajax() || $request->wantsJson() || $request->isJson()) {
                    return response()->json([
                        'message' => 'Phiên làm việc hoặc mã bảo mật (CSRF) đã hết hạn. Vui lòng tải lại trang để tiếp tục.',
                        'status' => 419,
                    ], 419);
                }

                // Nếu là request trình duyệt thông thường bị 419, tự động redirect back
                // Tuyệt đối không hiển thị màn hình lỗi thô "419 | PAGE EXPIRED"
                return back()->with([
                    'error' => 'Phiên làm việc hoặc mã bảo mật đã được làm mới. Vui lòng thử lại thao tác.',
                ]);
            }

            return $response;
        });
    })->create();
