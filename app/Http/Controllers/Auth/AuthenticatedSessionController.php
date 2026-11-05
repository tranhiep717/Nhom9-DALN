<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        if ($user) {
            if (!$user->relationLoaded('vaiTro')) {
                $user->load('vaiTro');
            }
            $role = strtoupper($user->vaiTro?->TenVaiTro ?? '');
            $targetUrl = match ($role) {
                'QUAN_TRI_VIEN' => route('admin.dashboard'),
                'BAC_SI' => route('doctor.dashboard'),
                'LE_TAN' => route('receptionist.dashboard'),
                'NHAN_VIEN_CAN_LAM_SANG' => route('cls.dashboard'),
                default => route('dashboard'),
            };
            return redirect()->intended($targetUrl);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
