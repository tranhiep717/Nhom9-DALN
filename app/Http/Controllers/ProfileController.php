<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing(['vaiTro', 'benhNhan', 'bacSi']);
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => false,
            'status' => session('status'),
            'account' => [
                'MaTaiKhoan' => $user->MaTaiKhoan,
                'TenDangNhap' => $user->TenDangNhap,
                'Email' => $user->Email,
                'TrangThai' => $user->TrangThai,
                'NgayTao' => $user->NgayTao,
                'VaiTro' => $user->vaiTro?->TenVaiTro,
                'HoTen' => $user->benhNhan?->HoTen ?? $user->bacSi?->HoTen ?? $user->TenDangNhap,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // 1. Cập nhật Email nếu có
        if (!empty($validated['email'])) {
            $user->Email = $validated['email'];
        }

        // 2. Cập nhật Tên đăng nhập nếu có
        if (!empty($validated['TenDangNhap'])) {
            $user->TenDangNhap = $validated['TenDangNhap'];
        }

        $user->save();

        // 3. Đồng bộ Họ tên sang hồ sơ thực thể nếu có
        if (!empty($validated['name'])) {
            if ($user->benhNhan) {
                $user->benhNhan->update(['HoTen' => $validated['name']]);
            } elseif ($user->bacSi) {
                $user->bacSi->update(['HoTen' => $validated['name']]);
            }
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
