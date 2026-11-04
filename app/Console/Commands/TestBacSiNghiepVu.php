<?php

namespace App\Console\Commands;

use App\Http\Controllers\BacSiController;
use App\Models\BacSi;
use App\Models\ChuyenKhoa;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestBacSiNghiepVu extends Command
{
    protected $signature = 'test:bacsi';
    protected $description = 'Kiểm thử toàn diện nghiệp vụ BacSiController theo 6 yêu cầu';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ BƯỚC 3: BacSiController');
        $this->info('================================================================');
        $this->info('');

        $controller = new BacSiController();
        $passed = 0;
        $failed = 0;

        // Chuẩn bị dữ liệu mẫu cho test
        $ck = ChuyenKhoa::first();
        if (!$ck) {
            $ck = ChuyenKhoa::create([
                'TenChuyenKhoa' => 'Chuyên Khoa Test',
                'MoTa' => 'Mô tả chuyên khoa test',
                'TrangThai' => 'HOAT_DONG',
            ]);
        }

        // Tạo 1 bác sĩ thử nghiệm
        $testDoc = BacSi::create([
            'MaChuyenKhoa' => $ck->MaChuyenKhoa,
            'HoTen' => 'BS. Test Tên Độc Đáo ' . time(),
            'HocVi' => 'Tiến sĩ Y khoa',
            'KinhNghiem' => 15,
            'MoTa' => 'Chuyên gia tim mạch hàng đầu',
            'SoDienThoai' => '0987654321',
            'EmailLienHe' => 'bstest@smartcare.vn',
            'TrangThai' => 'HOAT_DONG',
        ]);

        // Tạo 1 tài khoản Bệnh nhân giả lập
        $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->first();
        $patientUser = new TaiKhoan([
            'MaTaiKhoan' => 101,
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'patient_tester',
        ]);
        $patientUser->setRelation('vaiTro', $vaiTroBN);

        // Tạo 1 tài khoản Admin giả lập
        $vaiTroAdmin = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
        $adminUser = new TaiKhoan([
            'MaTaiKhoan' => 102,
            'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
            'TenDangNhap' => 'admin_tester',
        ]);
        $adminUser->setRelation('vaiTro', $vaiTroAdmin);

        try {
            // -------------------------------------------------------------
            // YÊU CẦU 1: HIỂN THỊ DANH SÁCH BÁC SĨ (KÈM CHUYÊN KHOA)
            // -------------------------------------------------------------
            $this->line('1. Hiển thị danh sách bác sĩ công khai (index)...');
            $req1 = Request::create('/doctors', 'GET');
            $req1->headers->set('Accept', 'application/json');

            $res1 = $controller->index($req1);
            $data1 = json_decode($res1->getContent(), true);

            if ($res1->getStatusCode() === 200 && ($data1['success'] ?? false) && count($data1['data']) > 0) {
                $hasSpecRelation = !empty($data1['data'][0]['chuyen_khoa']);
                if ($hasSpecRelation) {
                    $this->info("   ✅ PASS: Danh sách bác sĩ tải thành công ({$data1['total']} bác sĩ) kèm quan hệ chuyenKhoa.");
                    $passed++;
                } else {
                    $this->error('   ❌ FAIL: Danh sách bác sĩ thiếu quan hệ chuyenKhoa.');
                    $failed++;
                }
            } else {
                $this->error('   ❌ FAIL: Không tải được danh sách bác sĩ.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 2: XEM CHI TIẾT BÁC SĨ
            // -------------------------------------------------------------
            $this->line('2. Xem chi tiết bác sĩ (show)...');
            $req2 = Request::create("/doctors/{$testDoc->MaBacSi}", 'GET');
            $req2->headers->set('Accept', 'application/json');

            $res2 = $controller->show($req2, $testDoc->MaBacSi);
            $data2 = json_decode($res2->getContent(), true);

            if ($res2->getStatusCode() === 200 && ($data2['data']['HoTen'] ?? '') === $testDoc->HoTen) {
                $this->info("   ✅ PASS: Chi tiết bác sĩ tải thành công: {$data2['data']['HoTen']}");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Không tải được chi tiết bác sĩ.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 3: TÌM KIẾM BÁC SĨ THEO TÊN
            // -------------------------------------------------------------
            $this->line('3. Tìm kiếm bác sĩ theo tên (HoTen)...');
            $req3 = Request::create('/doctors', 'GET', [
                'search' => 'Tên Độc Đáo',
            ]);
            $req3->headers->set('Accept', 'application/json');

            $res3 = $controller->index($req3);
            $data3 = json_decode($res3->getContent(), true);

            $foundSearch = false;
            foreach ($data3['data'] ?? [] as $doc) {
                if ($doc['MaBacSi'] === $testDoc->MaBacSi) {
                    $foundSearch = true;
                    break;
                }
            }

            if ($foundSearch) {
                $this->info('   ✅ PASS: Tìm kiếm bác sĩ theo từ khóa tên thành công.');
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Tìm kiếm theo tên không ra kết quả.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 4: LỌC BÁC SĨ THEO CHUYÊN KHOA
            // -------------------------------------------------------------
            $this->line('4. Lọc bác sĩ theo chuyên khoa (specialty_id)...');
            $req4 = Request::create('/doctors', 'GET', [
                'specialty_id' => $ck->MaChuyenKhoa,
            ]);
            $req4->headers->set('Accept', 'application/json');

            $res4 = $controller->index($req4);
            $data4 = json_decode($res4->getContent(), true);

            $filterOk = true;
            foreach ($data4['data'] ?? [] as $doc) {
                if ($doc['MaChuyenKhoa'] !== $ck->MaChuyenKhoa) {
                    $filterOk = false;
                    break;
                }
            }

            if ($filterOk && count($data4['data'] ?? []) > 0) {
                $this->info("   ✅ PASS: Lọc đúng các bác sĩ thuộc chuyên khoa MaChuyenKhoa={$ck->MaChuyenKhoa}.");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Lọc theo chuyên khoa không chính xác.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 5: HIỂN THỊ HỌC VỊ, KINH NGHIỆM, MÔ TẢ & LIÊN HỆ
            // -------------------------------------------------------------
            $this->line('5. Hiển thị học vị, kinh nghiệm, mô tả và thông tin liên hệ...');
            $docDetail = $data2['data'] ?? [];
            $hasHocVi = !empty($docDetail['HocVi']);
            $hasKinhNghiem = !empty($docDetail['KinhNghiem']);
            $hasMoTa = !empty($docDetail['MoTa']);
            $hasPhone = !empty($docDetail['SoDienThoai']);
            $hasEmail = !empty($docDetail['EmailLienHe']);

            if ($hasHocVi && $hasKinhNghiem && $hasMoTa && $hasPhone && $hasEmail) {
                $this->info("   ✅ PASS: Đầy đủ các trường: Học vị ({$docDetail['HocVi']}), KN ({$docDetail['KinhNghiem']}), SĐT ({$docDetail['SoDienThoai']}), Email ({$docDetail['EmailLienHe']}).");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Thiếu một trong các thông tin học vị, kinh nghiệm, mô tả hoặc liên hệ.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 6: KHÔNG ĐỂ NGƯỜI DÙNG TRUY CẬP DỮ LIỆU QUẢN TRỊ NGOÀI QUYỀN HẠN
            // -------------------------------------------------------------
            $this->line('6. Chặn người dùng thường can thiệp thao tác quản trị bác sĩ (403)...');

            // 6.1 Bệnh nhân cố truy cập trang danh sách quản trị bác sĩ
            $reqAdminIndex = Request::create('/admin/doctors', 'GET');
            $reqAdminIndex->headers->set('Accept', 'application/json');
            $reqAdminIndex->setUserResolver(fn () => $patientUser);
            $resAdminIndex = $controller->adminIndex($reqAdminIndex);

            // 6.2 Bệnh nhân cố thêm bác sĩ mới
            $reqStoreDoc = Request::create('/admin/doctors', 'POST', [
                'HoTen' => 'Bác Sĩ Giả Mạo',
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
            ]);
            $reqStoreDoc->headers->set('Accept', 'application/json');
            $reqStoreDoc->setUserResolver(fn () => $patientUser);
            $resStoreDoc = $controller->store($reqStoreDoc);

            // 6.3 Quản trị viên truy cập trang quản trị bác sĩ (Hợp lệ)
            $reqAdminAllowed = Request::create('/admin/doctors', 'GET');
            $reqAdminAllowed->headers->set('Accept', 'application/json');
            $reqAdminAllowed->setUserResolver(fn () => $adminUser);
            $resAdminAllowed = $controller->adminIndex($reqAdminAllowed);

            $blockIndex = $resAdminIndex->getStatusCode() === 403;
            $blockStore = $resStoreDoc->getStatusCode() === 403;
            $allowAdmin = $resAdminAllowed->getStatusCode() === 200;

            if ($blockIndex && $blockStore && $allowAdmin) {
                $this->info('   ✅ PASS: Chặn thành công người dùng thường (403). Quản trị viên được cấp phép (200 OK).');
                $passed++;
            } else {
                $this->error("   ❌ FAIL: Phân quyền quản trị lỗi. BlockIndex: {$resAdminIndex->getStatusCode()}, BlockStore: {$resStoreDoc->getStatusCode()}, AllowAdmin: {$resAdminAllowed->getStatusCode()}");
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 7: DỮ LIỆU TRẢ VỀ REACT / INERTIA
            // -------------------------------------------------------------
            $this->line('7. Kiểm tra dữ liệu trả về Inertia / React...');
            $reqInertiaDoc = Request::create('/doctors', 'GET');
            $resInertiaDoc = $controller->index($reqInertiaDoc);

            if ($resInertiaDoc instanceof \Inertia\Response) {
                $propsDoc = $resInertiaDoc->toResponse($reqInertiaDoc)->getOriginalContent()['page']['props'];
                if (isset($propsDoc['doctors']) && isset($propsDoc['chuyenKhoas'])) {
                    $this->info('   ✅ PASS: Props Inertia (doctors, chuyenKhoas) kết nối hoàn hảo với React.');
                    $passed++;
                } else {
                    $this->error('   ❌ FAIL: Inertia response thiếu prop doctors hoặc chuyenKhoas.');
                    $failed++;
                }
            } else {
                $this->error('   ❌ FAIL: Phản hồi không phải là Inertia Response.');
                $failed++;
            }

        } finally {
            // DỌN DẸP BẢN GHI TEST
            BacSi::where('MaBacSi', $testDoc->MaBacSi)->delete();
            $this->line('   [Dọn dẹp bản ghi test bác sĩ an toàn, bảo toàn database]');
        }

        $this->info('');
        $this->line(str_repeat('═', 64));
        $this->info("  KẾT QUẢ BƯỚC 3 (BacSiController): {$passed}/7 Yêu cầu ĐẠT (PASS), {$failed} Thất bại");
        $this->line(str_repeat('═', 64));
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
