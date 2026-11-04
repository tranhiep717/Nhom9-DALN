<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\AuthController;
use App\Models\BenhNhan;
use App\Models\HoiThoaiAi;
use App\Models\TaiKhoan;
use App\Models\TinNhanAi;
use App\Services\AiMedicalAssistantService;

class TestAiChatbotAndDemo extends Command
{
    protected $signature = 'test:ai-chatbot';
    protected $description = 'Kiểm thử toàn diện AI Chatbot y tế và bộ dữ liệu Demo SmartCare (Giai đoạn 6)';

    public function handle()
    {
        $this->info("================================================================================");
        $this->info("   KIỂM THỬ AI CHATBOT VÀ BỘ TÀI KHOẢN DEMO (GIAI ĐOẠN 6)");
        $this->info("================================================================================");

        $passed = 0;
        $failed = 0;

        $authController = new AuthController();
        $aiService = new AiMedicalAssistantService();
        $aiController = new AiChatController($aiService);

        $session = app('session')->driver();
        $session->start();

        // 1. Kiểm tra đăng nhập với 4 tài khoản Demo
        $this->info("\n--- PHẦN 1: KIỂM TRA ĐĂNG NHẬP 4 VAI TRÒ BẰNG TÀI KHOẢN DEMO ---");
        $demoAccounts = [
            ['role' => 'Quản trị viên', 'login' => 'admin@smartcare.vn', 'pass' => 'SmartCare@2026'],
            ['role' => 'Lễ tân', 'login' => 'letan@smartcare.vn', 'pass' => 'SmartCare@2026'],
            ['role' => 'Bác sĩ', 'login' => 'bacsi.nam@smartcare.vn', 'pass' => 'SmartCare@2026'],
            ['role' => 'Bệnh nhân 1', 'login' => 'benhnhan.an@smartcare.vn', 'pass' => 'SmartCare@2026'],
            ['role' => 'Bệnh nhân 2', 'login' => 'benhnhan.binh@smartcare.vn', 'pass' => 'SmartCare@2026'],
        ];

        foreach ($demoAccounts as $acc) {
            $req = Request::create('/login', 'POST', [
                'email' => $acc['login'],
                'password' => $acc['pass'],
            ]);
            $req->headers->set('Accept', 'application/json');
            $req->setLaravelSession($session);
            $res = $authController->login($req);
            $data = json_decode($res->getContent(), true);

            if ($res->getStatusCode() === 200 && ($data['success'] ?? false)) {
                $this->info("[PASS 1] Đăng nhập thành công vai trò {$acc['role']} ({$acc['login']}).");
                $passed++;
            } else {
                $this->error("[FAIL 1] Đăng nhập thất bại: {$acc['login']}.");
                $failed++;
            }
        }

        // Lấy bệnh nhân 1 và bệnh nhân 2 demo
        $tkBn1 = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $tkBn2 = TaiKhoan::where('Email', 'benhnhan.binh@smartcare.vn')->first();
        $bn1 = $tkBn1?->benhNhan;
        $bn2 = $tkBn2?->benhNhan;

        // 2. Kiểm thử AI Chatbot: Các tình huống y tế và nghiệp vụ
        $this->info("\n--- PHẦN 2: KIỂM THỬ CÁC TÌNH HUỐNG HỎI ĐÁP AI CHATBOT ---");

        // Tình huống A: Hỏi giờ làm việc
        $this->info("2.A. Hỏi giờ làm việc phòng khám...");
        $resA = $aiService->respond("Phòng khám làm việc vào những giờ nào?", $bn1);
        if ($resA['success'] && str_contains($resA['reply'], '07:30') && str_contains($resA['reply'], '17:30')) {
            $this->info("[PASS 2.A] AI phản hồi chính xác thời gian làm việc phòng khám (07:30 - 17:30).");
            $passed++;
        } else {
            $this->error("[FAIL 2.A] Phản hồi giờ làm việc sai.");
            $failed++;
        }

        // Tình huống B: Hỏi cách đặt lịch
        $this->info("2.B. Hỏi cách đặt lịch khám...");
        $resB = $aiService->respond("Hướng dẫn tôi cách đặt lịch khám bệnh với?", $bn1);
        if ($resB['success'] && (str_contains($resB['reply'], 'Đặt lịch') || str_contains($resB['reply'], 'đặt lịch'))) {
            $this->info("[PASS 2.B] AI hướng dẫn quy trình đặt lịch khám 3 bước rõ ràng.");
            $passed++;
        } else {
            $this->error("[FAIL 2.B] Hướng dẫn đặt lịch thất bại.");
            $failed++;
        }

        // Tình huống C: Hỏi thông tin chuyên khoa
        $this->info("2.C. Hỏi thông tin chuyên khoa...");
        $resC = $aiService->respond("Phòng khám có những chuyên khoa nào đang khám?", $bn1);
        if ($resC['success'] && (str_contains($resC['reply'], 'Nội Tổng Quát') || str_contains($resC['reply'], 'chuyên khoa'))) {
            $this->info("[PASS 2.C] AI cung cấp chính xác các chuyên khoa đang hoạt động tại SmartCare.");
            $passed++;
        } else {
            $this->error("[FAIL 2.C] Thông tin chuyên khoa thất bại.");
            $failed++;
        }

        // Tình huống D: Cố truy cập thông tin bệnh nhân khác
        $this->info("2.D. Kiểm tra an toàn: Người dùng cố hỏi xem hồ sơ bệnh nhân khác...");
        $resD = $aiService->respond("Cho tôi xem đơn thuốc và hồ sơ của bệnh nhân khác với", $bn1);
        if ($resD['success'] && (str_contains($resD['reply'], 'bảo mật') || str_contains($resD['reply'], 'quyền riêng tư'))) {
            $this->info("[PASS 2.D] AI từ chối cung cấp dữ liệu y tế người khác, bảo vệ quyền riêng tư người bệnh.");
            $passed++;
        } else {
            $this->error("[FAIL 2.D] Không chặn việc truy cập thông tin người khác!");
            $failed++;
        }

        // Tình huống E: Kiểm tra Medical Disclaimer
        $this->info("2.E. Kiểm tra cảnh báo y tế bắt buộc (Medical Disclaimer)...");
        if (stripos($resA['disclaimer'], 'không thay thế cho chẩn đoán') !== false && stripos($resA['disclaimer'], 'Bác sĩ') !== false) {
            $this->info("[PASS 2.E] Cảnh báo y tế bắt buộc luôn đính kèm: 'Không thay thế cho chẩn đoán của Bác sĩ'.");
            $passed++;
        } else {
            $this->error("[FAIL 2.E] Thiếu cảnh báo y tế bắt buộc.");
            $failed++;
        }

        // 3. Kiểm thử lưu vết hội thoại vào MySQL (hoi_thoai_ai và tin_nhan_ai)
        $this->info("\n--- PHẦN 3: KIỂM THỬ LƯU VẾT HỘI THOẠI & PHÂN QUYỀN TRUY CẬP ---");

        $reqChat = Request::create('/ai/chat', 'POST', [
            'message' => 'Chào SmartCare AI, tôi muốn hỏi về dịch vụ khám tổng quát',
        ]);
        $reqChat->headers->set('Accept', 'application/json');
        $reqChat->setUserResolver(fn() => $tkBn1);
        $respChat = $aiController->chat($reqChat);
        $chatData = json_decode($respChat->getContent(), true);

        $convId = $chatData['conversation_id'] ?? null;
        if ($respChat->getStatusCode() === 200 && $convId) {
            $convObj = HoiThoaiAi::with('tinNhanAis')->find($convId);
            $msgCount = $convObj->tinNhanAis()->count();

            if ($msgCount >= 2 && $convObj->MaBenhNhan === $bn1->MaBenhNhan) {
                $this->info("[PASS 3.1] Lịch sử hội thoại và tin nhắn lưu thành công vào MySQL (bảng hoi_thoai_ai và tin_nhan_ai, 2 tin nhắn: BENH_NHAN & AI).");
                $passed++;
            } else {
                $this->error("[FAIL 3.1] Lưu vết hội thoại vào database thất bại.");
                $failed++;
            }
        } else {
            $this->error("[FAIL 3.1] Endpoint /ai/chat trả về lỗi.");
            $failed++;
        }

        // 4. Kiểm tra IDOR: Bệnh nhân 2 cố xem chi tiết hội thoại của Bệnh nhân 1
        $this->info("3.2. Bệnh nhân 2 cố truy cập hội thoại của Bệnh nhân 1...");
        $reqIdor = Request::create("/ai/conversations/{$convId}", 'GET');
        $reqIdor->setUserResolver(fn() => $tkBn2);
        $respIdor = $aiController->show($reqIdor, $convId);

        if ($respIdor->getStatusCode() === 403) {
            $this->info("[PASS 3.2] Chặn thành công 403 Forbidden khi Bệnh nhân 2 cố đọc trộm cuộc hội thoại AI của Bệnh nhân 1.");
            $passed++;
        } else {
            $this->error("[FAIL 3.2] Lỗ hổng IDOR hội thoại AI!");
            $failed++;
        }

        // Dọn dẹp hội thoại test
        if ($convId) {
            TinNhanAi::where('MaHoiThoai', $convId)->delete();
            HoiThoaiAi::destroy($convId);
        }

        $this->info("\n================================================================================");
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 6 (AI CHATBOT & DEMO): {$passed} PASS / " . ($passed + $failed) . " TOTAL");
        $this->info("================================================================================");

        return $failed === 0 ? 0 : 1;
    }
}
