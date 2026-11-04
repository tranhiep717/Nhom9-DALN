<?php

namespace App\Console\Commands;

use App\Http\Controllers\ChuyenKhoaController;
use App\Models\ChuyenKhoa;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestChuyenKhoaNghiepVu extends Command
{
    protected $signature = 'test:chuyenkhoa';
    protected $description = 'Kiểm thử toàn diện nghiệp vụ ChuyenKhoaController theo 4 yêu cầu';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ BƯỚC 2: ChuyenKhoaController');
        $this->info('================================================================');
        $this->info('');

        $controller = new ChuyenKhoaController();
        $passed = 0;
        $failed = 0;

        // Tạo chuyên khoa mẫu để test tìm kiếm nếu cần
        $ckTest = ChuyenKhoa::create([
            'TenChuyenKhoa' => 'Nhi Khoa Chuyên Sâu ' . time(),
            'MoTa' => 'Khám và chăm sóc toàn diện cho trẻ sơ sinh và trẻ nhỏ',
            'TrangThai' => 'HOAT_DONG',
        ]);

        try {
            // -------------------------------------------------------------
            // YÊU CẦU 1: HIỂN THỊ DANH SÁCH CHUYÊN KHOA
            // -------------------------------------------------------------
            $this->line('1. Hiển thị danh sách chuyên khoa (index)...');
            $req1 = Request::create('/specialties', 'GET');
            $req1->headers->set('Accept', 'application/json');

            $res1 = $controller->index($req1);
            $data1 = json_decode($res1->getContent(), true);

            if ($res1->getStatusCode() === 200 && ($data1['success'] ?? false) && count($data1['data']) > 0) {
                $this->info("   ✅ PASS: Danh sách chuyên khoa tải thành công ({$data1['total']} chuyên khoa)");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Không tải được danh sách chuyên khoa.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 2: XEM CHI TIẾT CHUYÊN KHOA
            // -------------------------------------------------------------
            $this->line('2. Xem chi tiết chuyên khoa (show)...');
            $ckFirst = ChuyenKhoa::first();
            $req2 = Request::create("/specialties/{$ckFirst->MaChuyenKhoa}", 'GET');
            $req2->headers->set('Accept', 'application/json');

            $res2 = $controller->show($req2, $ckFirst->MaChuyenKhoa);
            $data2 = json_decode($res2->getContent(), true);

            if ($res2->getStatusCode() === 200 && ($data2['data']['TenChuyenKhoa'] ?? '') === $ckFirst->TenChuyenKhoa) {
                $this->info("   ✅ PASS: Xem chi tiết chuyên khoa thành công: {$data2['data']['TenChuyenKhoa']}");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Không xem được chi tiết chuyên khoa.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 3: TÌM KIẾM CHUYÊN KHOA
            // -------------------------------------------------------------
            $this->line('3. Tìm kiếm chuyên khoa theo từ khóa...');
            $req3 = Request::create('/specialties', 'GET', [
                'search' => 'Nhi Khoa Chuyên Sâu',
            ]);
            $req3->headers->set('Accept', 'application/json');

            $res3 = $controller->index($req3);
            $data3 = json_decode($res3->getContent(), true);

            $foundSearch = false;
            foreach ($data3['data'] ?? [] as $item) {
                if (str_contains($item['TenChuyenKhoa'], 'Nhi Khoa Chuyên Sâu')) {
                    $foundSearch = true;
                    break;
                }
            }

            if ($foundSearch) {
                $this->info('   ✅ PASS: Tìm kiếm chuyên khoa theo từ khóa chính xác.');
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Tìm kiếm không trả về kết quả mong đợi.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 4: HIỂN THỊ SỐ LƯỢNG BÁC SĨ THUỘC TỪNG CHUYÊN KHOA
            // -------------------------------------------------------------
            $this->line('4. Hiển thị số lượng bác sĩ thuộc chuyên khoa (withCount bacSis)...');
            $hasCountField = true;
            foreach ($data1['data'] ?? [] as $item) {
                if (!array_key_exists('bac_sis_count', $item)) {
                    $hasCountField = false;
                    break;
                }
            }

            if ($hasCountField) {
                $sampleCount = $data1['data'][0]['bac_sis_count'] ?? 0;
                $this->info("   ✅ PASS: Thuộc tính 'bac_sis_count' có mặt đầy đủ trong tất cả bản ghi (Mẫu: {$sampleCount} bác sĩ)");
                $passed++;
            } else {
                $this->error("   ❌ FAIL: Thiếu trường đếm 'bac_sis_count'.");
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 5: TRẢ DỮ LIỆU INERTIA / REACT
            // -------------------------------------------------------------
            $this->line('5. Kiểm tra dữ liệu trả về Inertia / React...');
            $reqInertia = Request::create('/specialties', 'GET');
            $resInertia = $controller->index($reqInertia);

            if ($resInertia instanceof \Inertia\Response) {
                $props = $resInertia->toResponse($reqInertia)->getOriginalContent()['page']['props'];
                if (isset($props['chuyenKhoas'])) {
                    $this->info('   ✅ PASS: Dữ liệu truyền vào Inertia props (chuyenKhoas) sẵn sàng cho React render.');
                    $passed++;
                } else {
                    $this->error('   ❌ FAIL: Inertia response thiếu prop chuyenKhoas.');
                    $failed++;
                }
            } else {
                $this->error('   ❌ FAIL: Phản hồi không phải là Inertia Response.');
                $failed++;
            }

        } finally {
            // DỌN DẸP BẢN GHI TEST
            ChuyenKhoa::where('MaChuyenKhoa', $ckTest->MaChuyenKhoa)->delete();
            $this->line('   [Dọn dẹp bản ghi test chuyên khoa an toàn]');
        }

        $this->info('');
        $this->line(str_repeat('═', 64));
        $this->info("  KẾT QUẢ BƯỚC 2 (ChuyenKhoaController): {$passed}/5 Yêu cầu ĐẠT (PASS), {$failed} Thất bại");
        $this->line(str_repeat('═', 64));
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
