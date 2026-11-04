<?php

namespace App\Services;

use App\Models\BenhNhan;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiMedicalAssistantService
{
    protected ?string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $this->model = config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-3.8-flash');
    }

    /**
     * Kiểm tra xem AI Service đã có cấu hình API Key hay chưa
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Xử lý câu hỏi của bệnh nhân với System Prompt y tế nghiêm ngặt
     */
    public function respond(string $question, ?BenhNhan $patient = null, array $conversationHistory = []): array
    {
        // 1. Kiểm tra quy tắc an toàn y tế và FAQ nội bộ trước khi gọi API
        $localFaq = $this->handleLocalFaq($question);
        if ($localFaq !== null) {
            return [
                'success' => true,
                'reply' => $localFaq,
                'source' => 'local_knowledge_base',
                'disclaimer' => $this->getDisclaimer(),
            ];
        }

        // 2. Nếu chưa cấu hình API Key bên ngoài
        if (!$this->isConfigured()) {
            return [
                'success' => true,
                'reply' => $this->getFallbackResponse($question),
                'source' => 'system_fallback_unconfigured',
                'disclaimer' => $this->getDisclaimer(),
            ];
        }

        // 3. Chuẩn bị ngữ cảnh thông tin phòng khám và hồ sơ bệnh nhân (ẩn danh hóa PII)
        $systemPrompt = $this->buildSystemPrompt($patient);

        try {
            // Gọi Google Gemini API với timeout 10 giây qua Header bảo mật (không để lộ API key trên query string URL)
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

            // Chuẩn hóa cấu trúc contents nghiêm ngặt theo chuẩn Gemini API (xen kẽ user/model, khử PII, chống parts rỗng)
            $contents = $this->buildContentsPayload($question, $conversationHistory);

            $response = Http::withHeaders([
                'x-goog-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($url, [
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.3, // Nhiệt độ thấp để giảm hallucination trong y tế
                    'maxOutputTokens' => 800,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // 1. Kiểm tra nếu prompt bị Google chặn bởi Safety Policy
                $blockReason = $data['promptFeedback']['blockReason'] ?? null;
                if ($blockReason) {
                    Log::warning("Gemini prompt blocked by Google Safety Policy: {$blockReason}");
                    return [
                        'success' => true,
                        'reply' => 'Nội dung câu hỏi chạm vào giới hạn an toàn thông tin y tế. Vui lòng đặt câu hỏi về các dịch vụ thăm khám tại SmartCare hoặc đặt lịch hẹn với Bác sĩ.',
                        'source' => 'system_fallback_safety_blocked',
                        'disclaimer' => $this->getDisclaimer(),
                    ];
                }

                // 2. Kiểm tra Candidate phản hồi
                $candidate = $data['candidates'][0] ?? null;
                if ($candidate) {
                    $finishReason = $candidate['finishReason'] ?? null;
                    if (in_array($finishReason, ['SAFETY', 'RECITATION', 'BLOCKLIST'])) {
                        Log::warning("Gemini response candidate blocked: finishReason = {$finishReason}");
                        return [
                            'success' => true,
                            'reply' => 'Nội dung phản hồi bị bộ lọc an toàn y tế giữ lại để bảo vệ người bệnh. Xin vui lòng liên hệ trực tiếp bác sĩ để được tư vấn an toàn.',
                            'source' => 'system_fallback_safety_blocked',
                            'disclaimer' => $this->getDisclaimer(),
                        ];
                    }

                    $replyText = $candidate['content']['parts'][0]['text'] ?? null;
                    if ($replyText && trim($replyText) !== '') {
                        return [
                            'success' => true,
                            'reply' => trim($replyText),
                            'source' => 'gemini_api',
                            'disclaimer' => $this->getDisclaimer(),
                        ];
                    }
                }

                Log::warning("Gemini API returned empty candidate content: " . mb_substr($response->body(), 0, 300));
            } else {
                Log::warning("Gemini API error ({$response->status()}): " . mb_substr($response->body(), 0, 300));
            }

            return [
                'success' => true,
                'reply' => $this->getFallbackResponse($question),
                'source' => 'system_fallback_on_api_error',
                'disclaimer' => $this->getDisclaimer(),
            ];

        } catch (\Exception $e) {
            Log::error('AI Medical Assistant Exception: ' . $e->getMessage());
            return [
                'success' => true,
                'reply' => $this->getFallbackResponse($question),
                'source' => 'system_fallback_on_exception',
                'disclaimer' => $this->getDisclaimer(),
            ];
        }
    }

    /**
     * System Prompt y tế chuẩn mực
     */
    protected function buildSystemPrompt(?BenhNhan $patient = null): string
    {
        $specialties = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')->pluck('TenChuyenKhoa')->implode(', ');
        $services = DichVu::where('TrangThai', 'HOAT_DONG')->pluck('TenDichVu')->implode(', ');

        $patientContext = "";
        if ($patient) {
            $tuoi = $patient->NgaySinh ? \Carbon\Carbon::parse($patient->NgaySinh)->age : null;
            $patientContext = "Người trao đổi (đã ẩn danh hóa): Giới tính {$patient->GioiTinh}" . ($tuoi ? ", {$tuoi} tuổi. " : ". ") . "(Nguyên tắc riêng tư y tế: Không thu thập hoặc tiết lộ họ tên thật, số điện thoại, CCCD hay số thẻ BHYT). ";
        }

        return <<<PROMPT
Bạn là SmartCare AI - Trợ lý y tế ảo thông minh của Hệ thống Phòng khám Đa khoa SmartCare.
{$patientContext}

QUY TẮC BẢO MẬT VÀ NGUYÊN TẮC Y TẾ BẮT BUỘC (CRITICAL MEDICAL SAFETY RULES):
1. BẠN LÀ TRỢ LÝ THÔNG TIN, BẠN KHÔNG PHẢI LÀ BÁC SĨ ĐIỀU TRỊ.
2. TUYỆT ĐỐI KHÔNG tự ý đưa ra chẩn đoán xác định bệnh hay kết luận y khoa thay cho bác sĩ.
3. TUYỆT ĐỐI KHÔNG tự ý kê đơn thuốc hoặc chỉ định liều lượng dược phẩm. Luôn hướng dẫn bệnh nhân dùng thuốc theo đúng chỉ dẫn trong đơn thuốc đã được bác sĩ ký.
4. NGUY CƠ CẤP CỨU: Nếu người dùng mô tả các triệu chứng nguy kịch (đau ngực dữ dội, khó thở, co giật, mất ý thức, nôn ra máu...), hãy khuyên họ gọi ngay 115 hoặc đến cơ sở cấp cứu gần nhất ngay lập tức.
5. BẢO MẬT THÔNG TIN: Không bao giờ tiết lộ thông tin cá nhân, hồ sơ bệnh án hay đơn thuốc của bất kỳ bệnh nhân nào khác.
6. THÔNG TIN PHÒNG KHÁM SMARTCARE:
   - Giờ làm việc: 07:30 - 17:30 từ Thứ Hai đến Thứ Bảy (Nghỉ Chủ Nhật).
   - Địa chỉ: Tầng 1, Tòa nhà SmartCare Medical Center, Số 9 Đường Giải Phóng, Hà Nội.
   - Hotline: 1900 6868.
   - Các chuyên khoa đang hoạt động: {$specialties}.
   - Dịch vụ khám: {$services}.
   - Cách đặt lịch hẹn: Bệnh nhân có thể vào mục "Đặt lịch khám" trên Cổng Bệnh nhân, chọn chuyên khoa, bác sĩ, ngày và ca khám còn trống.
7. PHONG CÁCH TRẢ LỜI: Ân cần, đồng cảm, ngắn gọn, khoa học và dễ hiểu bằng tiếng Việt chuẩn.
PROMPT;
    }

    /**
     * FAQ nội bộ xử lý tức thì các câu hỏi thường gặp
     */
    protected function handleLocalFaq(string $q): ?string
    {
        $norm = mb_strtolower(trim($q), 'UTF-8');

        // Hỏi giờ làm việc
        if (str_contains($norm, 'giờ làm việc') || str_contains($norm, 'mở cửa') || str_contains($norm, 'làm việc lúc mấy giờ') || str_contains($norm, 'thời gian làm việc')) {
            return "Phòng khám Đa khoa SmartCare mở cửa phục vụ từ **07:30 đến 17:30**, từ **Thứ Hai đến Thứ Bảy** (Chủ Nhật nghỉ). Bạn có thể đặt trước lịch khám trực tuyến trên Cổng Bệnh nhân để được ưu tiên tiếp nhận nhanh chóng.";
        }

        // Hỏi cách đặt lịch
        if (str_contains($norm, 'đặt lịch') || str_contains($norm, 'cách đặt lịch') || str_contains($norm, 'đăng ký khám') || str_contains($norm, 'hướng dẫn đặt lịch')) {
            return "Để đặt lịch khám tại SmartCare, bạn chỉ cần thực hiện 3 bước đơn giản:\n1. Đăng nhập tài khoản trên Cổng Bệnh nhân SmartCare.\n2. Vào mục **'Đặt lịch khám'**, chọn Chuyên khoa và Bác sĩ mong muốn.\n3. Chọn ngày khám và khung giờ ca khám còn trống, sau đó bấm **'Xác nhận đặt lịch'**.\nLễ tân sẽ duyệt và chuẩn bị hồ sơ sẵn sàng cho bạn!";
        }

        // Hỏi thông tin chuyên khoa
        if (str_contains($norm, 'chuyên khoa') || str_contains($norm, 'khoa khám') || str_contains($norm, 'các khoa')) {
            $specialties = ChuyenKhoa::where('TrangThai', 'HOAT_DONG')->pluck('TenChuyenKhoa')->implode(', ');
            return "Hiện tại Phòng khám Đa khoa SmartCare có các chuyên khoa đang hoạt động: **{$specialties}**. Mỗi chuyên khoa đều có đội ngũ Bác sĩ chuyên khoa giàu kinh nghiệm và trang thiết bị cận lâm sàng hiện đại.";
        }

        // Cố truy cập hồ sơ bệnh nhân khác
        if (str_contains($norm, 'hồ sơ của') || str_contains($norm, 'bệnh nhân khác') || str_contains($norm, 'xem đơn thuốc của người khác') || str_contains($norm, 'xem thông tin người khác')) {
            return "Vì lý do bảo mật y tế và quyền riêng tư cá nhân theo quy định của Luật Khám chữa bệnh, SmartCare AI không cung cấp thông tin hay hồ sơ bệnh án của bệnh nhân khác. Bạn chỉ có thể tra cứu lịch sử khám và đơn thuốc của chính tài khoản của mình.";
        }

        // Chống Prompt Injection & Yêu cầu tiết lộ System Instruction
        if ((str_contains($norm, 'bỏ qua') && (str_contains($norm, 'hướng dẫn') || str_contains($norm, 'chỉ dẫn') || str_contains($norm, 'lệnh'))) ||
            str_contains($norm, 'quên các chỉ dẫn') || str_contains($norm, 'ignore instructions') || str_contains($norm, 'disregard system') || 
            str_contains($norm, 'system prompt') || str_contains($norm, 'tiết lộ prompt') || str_contains($norm, 'bạn được cấu hình thế nào')) {
            return "SmartCare AI là trợ lý thông tin y tế chuyên trách của Phòng khám SmartCare, luôn hoạt động tuân thủ theo các nguyên tắc an toàn y tế và đạo đức nghề nghiệp. Tôi không thể thay đổi hoặc tiết lộ cấu hình hệ thống.";
        }

        // Ngăn chặn yêu cầu tự chẩn đoán chắc chắn hoặc tự ý kê đơn thuốc
        if (str_contains($norm, 'kê đơn') || str_contains($norm, 'kê thuốc') || str_contains($norm, 'bốc thuốc') || 
            str_contains($norm, 'tôi bị bệnh gì chắc chắn') || str_contains($norm, 'chẩn đoán xác định')) {
            return "Theo quy định y tế, trợ lý AI không được phép kê đơn thuốc hoặc đưa ra chẩn đoán xác định thay cho Bác sĩ điều trị. Để đảm bảo an toàn tính mạng và sức khỏe, xin vui lòng đặt lịch khám trực tiếp với Bác sĩ chuyên khoa tại SmartCare để được thăm khám và có phác đồ điều trị phù hợp.";
        }

        return null;
    }

    /**
     * Fallback thông minh khi chưa có API Key bên ngoài
     */
    protected function getFallbackResponse(string $q): string
    {
        return "Xin chào! Tôi là Trợ lý y tế SmartCare AI. Hiện tại tôi có thể hỗ trợ bạn giải đáp thông tin về:\n- **Giờ làm việc**: 07:30 - 17:30 (Thứ 2 - Thứ 7).\n- **Hướng dẫn đặt lịch khám**: Vào mục 'Đặt lịch khám' trên thanh điều hướng.\n- **Thông tin Chuyên khoa & Bác sĩ** tại SmartCare.\n\nNếu bạn có thắc mắc cụ thể về triệu chứng hoặc phác đồ điều trị, xin vui lòng đặt lịch khám trực tiếp để được Bác sĩ chuyên khoa thăm khám và tư vấn tận tình!";
    }

    /**
     * Cảnh báo y tế bắt buộc
     */
    public function getDisclaimer(): string
    {
        return "Lưu ý quan trọng: Thông tin từ trợ lý AI chỉ mang tính chất tham khảo và hỗ trợ thông tin, không thay thế cho chẩn đoán, tư vấn chuyên môn hoặc chỉ định điều trị của Bác sĩ.";
    }

    /**
     * Khử thông tin định danh cá nhân (PII Sanitization) trong nội dung tin nhắn người dùng
     */
    public function redactPiiFromText(string $text): string
    {
        // 1. Khử số điện thoại Việt Nam (10-11 số)
        $text = preg_replace('/\b(0[35789]\d{8}|02\d{9})\b/', '[SĐT_ĐÃ_LƯỢC_BỎ]', $text);

        // 2. Khử số CCCD / CMND (9 hoặc 12 số)
        $text = preg_replace('/\b(\d{12}|\d{9})\b/', '[CCCD_ĐÃ_LƯỢC_BỎ]', $text);

        // 3. Khử mã thẻ Bảo hiểm Y tế BHYT (2 chữ cái + 13 chữ số)
        $text = preg_replace('/\b([A-Z]{2}\d{13})\b/', '[BHYT_ĐÃ_LƯỢC_BỎ]', $text);

        // 4. Khử địa chỉ Email
        $text = preg_replace('/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/', '[EMAIL_ĐÃ_LƯỢC_BỎ]', $text);

        // 5. Khử địa chỉ nhà chi tiết (các tiền tố như số nhà, ngõ, ngách, đường)
        $text = preg_replace('/(số\s+\d+[\w\/\-]*|ngõ\s+\d+|ngách\s+\d+|hẻm\s+\d+)\s+[^,\.\n]+/ui', '[ĐỊA_CHỈ_ĐÃ_LƯỢC_BỎ]', $text);

        // 6. Khử các mẫu xưng tên trực tiếp
        $text = preg_replace('/(tôi tên là|tên tôi là|tôi là)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,3})/ui', '$1 [HỌ_TÊN_ĐÃ_LƯỢC_BỎ]', $text);

        return $text;
    }

    /**
     * Chuẩn hóa cấu trúc contents nghiêm ngặt theo chuẩn Gemini API:
     * - Chỉ chấp nhận role 'user' và 'model'
     * - Loại bỏ turn rỗng hoặc parts rỗng
     * - Đảm bảo các turn xen kẽ hợp lệ
     * - Đảm bảo turn cuối cùng kết thúc bằng câu hỏi của 'user'
     */
    public function buildContentsPayload(string $question, array $conversationHistory): array
    {
        $contents = [];
        $lastRole = null;

        // 1. Duyệt qua lịch sử hội thoại
        foreach ($conversationHistory as $msg) {
            if (!is_array($msg)) continue;

            $sender = $msg['VaiTroNguoiGui'] ?? '';
            $role = ($sender === 'AI' || $sender === 'model') ? 'model' : 'user';

            $rawText = $msg['NoiDung'] ?? '';
            $cleanText = trim($this->redactPiiFromText($rawText));

            if ($cleanText === '') continue; // Gemini cấm parts text rỗng

            // Nếu cùng role liên tiếp, gộp text lại
            if ($lastRole === $role && count($contents) > 0) {
                $lastIndex = count($contents) - 1;
                $contents[$lastIndex]['parts'][0]['text'] .= "\n" . $cleanText;
            } else {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $cleanText]],
                ];
                $lastRole = $role;
            }
        }

        // 2. Xử lý câu hỏi hiện tại
        $cleanQuestion = trim($this->redactPiiFromText($question));
        if ($cleanQuestion === '') {
            $cleanQuestion = 'Xin tư vấn thông tin phòng khám SmartCare.';
        }

        // Nếu turn cuối của history là 'user', gộp câu hỏi mới vào turn user đó để tránh 2 user turns liên tiếp
        if ($lastRole === 'user' && count($contents) > 0) {
            $lastIndex = count($contents) - 1;
            $contents[$lastIndex]['parts'][0]['text'] .= "\n" . $cleanQuestion;
        } else {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $cleanQuestion]],
            ];
        }

        // Đảm bảo turn đầu tiên luôn là 'user'
        if (count($contents) > 0 && $contents[0]['role'] === 'model') {
            array_shift($contents);
            // Nếu sau khi bỏ turn model đầu tiên mà mảng rỗng, thêm lại user turn
            if (count($contents) === 0) {
                $contents[] = [
                    'role' => 'user',
                    'parts' => [['text' => $cleanQuestion]],
                ];
            }
        }

        return $contents;
    }
}
