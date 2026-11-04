<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Kiểm tra vai trò của người dùng đang đăng nhập
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Danh sách vai trò được phép (ví dụ: 'QUAN_TRI_VIEN', 'BAC_SI')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Chưa đăng nhập.'], 401);
            }
            return redirect()->route('login');
        }

        // Tải vai trò nếu chưa tải
        if (!$user->relationLoaded('vaiTro')) {
            $user->load('vaiTro');
        }

        $userRole = strtoupper($user->vaiTro?->TenVaiTro ?? '');

        // Kiểm tra xem vai trò của user có nằm trong danh sách cho phép không
        $allowedRoles = array_map('strtoupper', $roles);

        if (!in_array($userRole, $allowedRoles, true)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Bạn không có quyền truy cập chức năng này.',
                    'required_roles' => $roles,
                    'current_role' => $userRole,
                ], 403);
            }

            abort(403, 'Bạn không có quyền truy cập vào phân hệ này.');
        }

        return $next($request);
    }
}
