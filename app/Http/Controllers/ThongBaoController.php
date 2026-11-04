<?php

namespace App\Http\Controllers;

use App\Models\ThongBao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThongBaoController extends Controller
{
    /**
     * Lấy danh sách thông báo của tài khoản hiện tại (tối đa 20 thông báo gần nhất)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Chưa xác thực.'], 401);
        }

        $limit = min((int)$request->input('limit', 20), 50);
        $notifications = ThongBao::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->orderBy('NgayTao', 'desc')
            ->limit($limit)
            ->get();

        $unreadCount = ThongBao::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->where('DaDoc', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'count' => 0], 401);
        }

        $unreadCount = ThongBao::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->where('DaDoc', false)
            ->count();

        return response()->json([
            'success' => true,
            'count' => $unreadCount,
        ]);
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc (IDOR Protection: chỉ được đánh dấu thông báo của chính mình)
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Chưa xác thực.'], 401);
        }

        $thongBao = ThongBao::where('MaThongBao', $id)->first();
        if (!$thongBao) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thông báo.'], 404);
        }

        // Chống IDOR
        if ($thongBao->MaTaiKhoan !== $user->MaTaiKhoan) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền thao tác trên thông báo này.'], 403);
        }

        if (!$thongBao->DaDoc) {
            $thongBao->update([
                'DaDoc' => true,
                'ThoiGianDoc' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu thông báo là đã đọc.',
            'data' => $thongBao,
        ]);
    }

    /**
     * Đánh dấu tất cả thông báo của tài khoản hiện tại là đã đọc
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Chưa xác thực.'], 401);
        }

        ThongBao::where('MaTaiKhoan', $user->MaTaiKhoan)
            ->where('DaDoc', false)
            ->update([
                'DaDoc' => true,
                'ThoiGianDoc' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu tất cả thông báo là đã đọc.',
        ]);
    }
}
