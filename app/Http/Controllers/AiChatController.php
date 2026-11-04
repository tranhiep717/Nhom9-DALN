<?php

namespace App\Http\Controllers;

use App\Models\HoiThoaiAi;
use App\Models\TinNhanAi;
use App\Services\AiMedicalAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiChatController extends Controller
{
    protected AiMedicalAssistantService $aiService;

    public function __construct(AiMedicalAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Lấy danh sách các cuộc hội thoại AI của bệnh nhân đang đăng nhập
     */
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $patient = $user?->benhNhan;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Tài khoản chưa được liên kết với hồ sơ bệnh nhân.'], 403);
        }

        $conversations = HoiThoaiAi::where('MaBenhNhan', $patient->MaBenhNhan)
            ->with(['tinNhanAis' => fn($q) => $q->latest('ThoiGianGui')->limit(1)])
            ->orderBy('ThoiGianBatDau', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Lấy chi tiết tin nhắn trong một cuộc hội thoại
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $patient = $user?->benhNhan;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Tài khoản chưa được liên kết với hồ sơ bệnh nhân.'], 403);
        }

        $conversation = HoiThoaiAi::with('tinNhanAis')->find($id);

        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy cuộc hội thoại.'], 404);
        }

        // Kiểm tra phân quyền cách ly dữ liệu: Bệnh nhân chỉ xem được hội thoại của chính mình
        if ($conversation->MaBenhNhan !== $patient->MaBenhNhan) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền truy cập cuộc hội thoại của bệnh nhân khác.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $conversation,
        ]);
    }

    /**
     * Gửi tin nhắn mới tới AI Chatbot và nhận phản hồi
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:hoi_thoai_ai,MaHoiThoai'],
        ], [
            'message.required' => 'Vui lòng nhập nội dung câu hỏi.',
            'message.max' => 'Nội dung câu hỏi không được vượt quá 2000 ký tự.',
        ]);

        $user = $request->user();
        $patient = $user?->benhNhan;

        // Nếu người dùng đã đăng nhập vai trò Bệnh nhân -> lưu vết hội thoại vào MySQL
        if ($patient) {
            return DB::transaction(function () use ($validated, $patient) {
                // 1. Tìm hoặc tạo cuộc hội thoại
                $conversation = null;
                if (!empty($validated['conversation_id'])) {
                    $conversation = HoiThoaiAi::find($validated['conversation_id']);
                    // Phân quyền: Kiểm tra sở hữu
                    if ($conversation && $conversation->MaBenhNhan !== $patient->MaBenhNhan) {
                        return response()->json(['success' => false, 'message' => 'Bạn không thể gửi tin nhắn vào hội thoại của bệnh nhân khác.'], 403);
                    }
                }

                if (!$conversation) {
                    // Tái sử dụng cuộc hội thoại đang hoạt động trong vòng 2 giờ của bệnh nhân để chống tạo hội thoại rác
                    $conversation = HoiThoaiAi::where('MaBenhNhan', $patient->MaBenhNhan)
                        ->where('TrangThai', 'DANG_HOAT_DONG')
                        ->where('ThoiGianBatDau', '>=', now()->subHours(2))
                        ->latest('ThoiGianBatDau')
                        ->first();

                    if (!$conversation) {
                        $tieuDe = mb_substr($validated['message'], 0, 50, 'UTF-8') . (mb_strlen($validated['message'], 'UTF-8') > 50 ? '...' : '');
                        $conversation = HoiThoaiAi::create([
                            'MaBenhNhan' => $patient->MaBenhNhan,
                            'TieuDe' => $tieuDe,
                            'ThoiGianBatDau' => now(),
                            'TrangThai' => 'DANG_HOAT_DONG',
                            'NgayTao' => now(),
                        ]);
                    }
                }

                // 2. Lưu tin nhắn của bệnh nhân
                $patientMsg = TinNhanAi::create([
                    'MaHoiThoai' => $conversation->MaHoiThoai,
                    'VaiTroNguoiGui' => 'BENH_NHAN',
                    'NoiDung' => $validated['message'],
                    'ThoiGianGui' => now(),
                    'TrangThai' => 'DA_GUI',
                ]);

                // 3. Lấy ngữ cảnh các tin nhắn gần nhất
                $history = TinNhanAi::where('MaHoiThoai', $conversation->MaHoiThoai)
                    ->where('MaTinNhan', '!=', $patientMsg->MaTinNhan)
                    ->orderBy('ThoiGianGui', 'desc')
                    ->limit(6)
                    ->get()
                    ->reverse()
                    ->toArray();

                // 4. Gọi AI Service
                $aiResult = $this->aiService->respond($validated['message'], $patient, $history);

                // 5. Lưu phản hồi của AI vào database
                $aiMsg = TinNhanAi::create([
                    'MaHoiThoai' => $conversation->MaHoiThoai,
                    'VaiTroNguoiGui' => 'AI',
                    'NoiDung' => $aiResult['reply'],
                    'ThoiGianGui' => now(),
                    'TrangThai' => 'DA_GUI',
                    'GhiChu' => $aiResult['source'] ?? null,
                ]);

                return response()->json([
                    'success' => true,
                    'conversation_id' => $conversation->MaHoiThoai,
                    'reply' => $aiResult['reply'],
                    'source' => $aiResult['source'],
                    'disclaimer' => $aiResult['disclaimer'],
                    'patient_message' => $patientMsg,
                    'ai_message' => $aiMsg,
                ]);
            });
        }

        // Trường hợp khách chưa đăng nhập: Phản hồi thông tin hỗ trợ chung không lưu database
        $aiResult = $this->aiService->respond($validated['message'], null, []);

        return response()->json([
            'success' => true,
            'reply' => $aiResult['reply'],
            'source' => $aiResult['source'],
            'disclaimer' => $aiResult['disclaimer'],
        ]);
    }
}
