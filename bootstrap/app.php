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
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
