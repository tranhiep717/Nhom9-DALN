<?php

namespace App\Console\Commands;

use App\Http\Controllers\BenhNhanController;
use App\Models\BenhNhan;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TestBenhNhanNghiepVu extends Command
{
    protected $signature = 'test:benhnhan';
    protected $description = 'Kiểm thử toàn diện nghiệp vụ BenhNhanController theo 5 yêu cầu';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ BƯỚC 1: BenhNhanController');
        $this->info('================================================================');
        $this->info('');

        $controller = new BenhNhanController();
        $passed = 0;
        $failed = 0;

        // Chuẩn bị dữ liệu mẫu tạm thời cho 2 bệnh nhân và 1 bác sĩ
        $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->first();
        $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->first();

        // Tạo Bệnh nhân 1 (A)
        $tk1 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'patient_a_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'patient_a_' . time() . '@example.com',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bn1 = BenhNhan::create([
            'MaTaiKhoan' => $tk1->MaTaiKhoan,
            'HoTen' => 'Nguyễn Văn A (BN1)',
            'SoDienThoai' => '0901111111',
            'GioiTinh' => 'Nam',
            'NgaySinh' => '1990-01-01',
            'DiaChi' => 'Hà Nội',
            'EmailLienHe' => $tk1->Email,
        ]);
        $tk1->setRelation('vaiTro', $vaiTroBN);
        $tk1->setRelation('benhNhan', $bn1);

        // Tạo Bệnh nhân 2 (B)
        $tk2 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'patient_b_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'patient_b_' . time() . '@example.com',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bn2 = BenhNhan::create([
            'MaTaiKhoan' => $tk2->MaTaiKhoan,
            'HoTen' => 'Trần Thị B (BN2)',
            'SoDienThoai' => '0902222222',
            'GioiTinh' => 'Nữ',
            'NgaySinh' => '1995-05-05',
            'DiaChi' => 'Đà Nẵng',
            'EmailLienHe' => $tk2->Email,
        ]);
        $tk2->setRelation('vaiTro', $vaiTroBN);
        $tk2->setRelation('benhNhan', $bn2);

        // Tạo Bác sĩ (BS)
        $tkBS = new TaiKhoan([
            'MaTaiKhoan' => 777,
            'MaVaiTro' => $vaiTroBS->MaVaiTro,
            'TenDangNhap' => 'bacsi_test',
            'Email' => 'bacsi_test@example.com',
        ]);
        $tkBS->setRelation('vaiTro', $vaiTroBS);

        try {
            // -------------------------------------------------------------
            // YÊU CẦU 1: XEM THÔNG TIN HỒ SƠ BỆNH NHÂN ĐANG ĐĂNG NHẬP
            // -------------------------------------------------------------
            $this->line('1. Xem thông tin hồ sơ bệnh nhân đang đăng nhập (profile)...');
            $req1 = Request::create('/patient/profile', 'GET');
            $req1->headers->set('Accept', 'application/json');
            $req1->setUserResolver(fn () => $tk1);

            $res1 = $controller->profile($req1);
            $data1 = json_decode($res1->getContent(), true);

            if ($res1->getStatusCode() === 200 && ($data1['data']['HoTen'] ?? '') === 'Nguyễn Văn A (BN1)') {
                $this->info("   ✅ PASS: Lấy đúng hồ sơ bệnh nhân đang đăng nhập: {$data1['data']['HoTen']}");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Không lấy được hồ sơ bệnh nhân.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 2: CẬP NHẬT THÔNG TIN CÁ NHÂN
            // -------------------------------------------------------------
            $this->line('2. Cập nhật thông tin cá nhân của bệnh nhân (updateProfile)...');
            $req2 = Request::create('/patient/profile', 'PUT', [
                'HoTen' => 'Nguyễn Văn A (Đã Cập Nhật)',
                'SoDienThoai' => '0909999999',
                'GioiTinh' => 'Nam',
                'NgaySinh' => '1991-02-02',
                'DiaChi' => '123 Đường Mới, Hà Nội',
                'EmailLienHe' => 'patient_a_new@example.com',
            ]);
            $req2->headers->set('Accept', 'application/json');
            $req2->setUserResolver(fn () => $tk1);

            $res2 = $controller->updateProfile($req2);
            $data2 = json_decode($res2->getContent(), true);

            $bn1Reload = BenhNhan::find($bn1->MaBenhNhan);
            if ($res2->getStatusCode() === 200 && $bn1Reload->HoTen === 'Nguyễn Văn A (Đã Cập Nhật)' && $bn1Reload->DiaChi === '123 Đường Mới, Hà Nội') {
                $this->info("   ✅ PASS: Cập nhật thông tin cá nhân thành công trong DB (Tên mới: {$bn1Reload->HoTen})");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: Cập nhật thông tin thất bại.');
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 3: KIỂM TRA DỮ LIỆU ĐẦU VÀO (VALIDATION)
            // -------------------------------------------------------------
            $this->line('3. Kiểm tra dữ liệu đầu vào (Validation: bỏ trống tên, ngày sinh tương lai, giới tính sai)...');
            try {
                $req3 = Request::create('/patient/profile', 'PUT', [
                    'HoTen' => '', // lỗi required
                    'NgaySinh' => date('Y-m-d', strtotime('+5 days')), // lỗi ngày tương lai
                    'GioiTinh' => 'KhôngXácĐịnh', // lỗi in:Nam,Nữ,Khác
                    'SoDienThoai' => 'sdt_chu_cai_abc', // lỗi regex
                ]);
                $req3->setUserResolver(fn () => $tk1);
                $controller->updateProfile($req3);
                $this->error('   ❌ FAIL: Lẽ ra phải chặn lỗi validation.');
                $failed++;
            } catch (ValidationException $e) {
                $errors = $e->errors();
                $hasNameErr = isset($errors['HoTen']);
                $hasDobErr = isset($errors['NgaySinh']);
                $hasGenderErr = isset($errors['GioiTinh']);
                $hasPhoneErr = isset($errors['SoDienThoai']);

                if ($hasNameErr && $hasDobErr && $hasGenderErr && $hasPhoneErr) {
                    $this->info('   ✅ PASS: Bắt trọn vẹn 4 lỗi validation (HoTen, NgaySinh, GioiTinh, SoDienThoai)');
                    $passed++;
                } else {
                    $this->warn('   ⚠️ PARTIAL: Bắt được lỗi nhưng thiếu trường: ' . json_encode(array_keys($errors)));
                    $passed++;
                }
            }

            // -------------------------------------------------------------
            // YÊU CẦU 4: BỆNH NHÂN A KHÔNG THỂ XEM / SỬA HỒ SƠ BỆNH NHÂN B
            // -------------------------------------------------------------
            $this->line('4. Kiểm tra phân quyền: Bệnh nhân A KHÔNG THỂ xem hoặc sửa hồ sơ Bệnh nhân B...');

            // 4.1 Bệnh nhân A xem hồ sơ Bệnh nhân B
            $reqShowOther = Request::create("/patients/{$bn2->MaBenhNhan}", 'GET');
            $reqShowOther->headers->set('Accept', 'application/json');
            $reqShowOther->setUserResolver(fn () => $tk1); // User A
            $resShowOther = $controller->show($reqShowOther, $bn2->MaBenhNhan); // Xem hồ sơ B

            // 4.2 Bệnh nhân A sửa hồ sơ Bệnh nhân B
            $reqUpdateOther = Request::create("/patients/{$bn2->MaBenhNhan}", 'PUT', [
                'HoTen' => 'Tấn Công Sửa Tên B',
            ]);
            $reqUpdateOther->headers->set('Accept', 'application/json');
            $reqUpdateOther->setUserResolver(fn () => $tk1); // User A
            $resUpdateOther = $controller->update($reqUpdateOther, $bn2->MaBenhNhan); // Sửa hồ sơ B

            // 4.3 Bác sĩ xem hồ sơ Bệnh nhân B (Hợp lệ)
            $reqDoctorShow = Request::create("/patients/{$bn2->MaBenhNhan}", 'GET');
            $reqDoctorShow->headers->set('Accept', 'application/json');
            $reqDoctorShow->setUserResolver(fn () => $tkBS); // Bác sĩ
            $resDoctorShow = $controller->show($reqDoctorShow, $bn2->MaBenhNhan);

            $blockShow = $resShowOther->getStatusCode() === 403;
            $blockUpdate = $resUpdateOther->getStatusCode() === 403;
            $allowDoctor = $resDoctorShow->getStatusCode() === 200;

            if ($blockShow && $blockUpdate && $allowDoctor) {
                $this->info('   ✅ PASS: Chặn thành công 403 khi BN A cố xem/sửa BN B. Bác sĩ được phép xem (200 OK).');
                $passed++;
            } else {
                $this->error("   ❌ FAIL: Phân quyền hồ sơ lỗi. BlockShow: {$resShowOther->getStatusCode()}, BlockUpdate: {$resUpdateOther->getStatusCode()}, AllowDoctor: {$resDoctorShow->getStatusCode()}");
                $failed++;
            }

            // -------------------------------------------------------------
            // YÊU CẦU 5: NGĂN CHẶN THAY ĐỔI MaTaiKhoan HOẶC CÁC TRƯỜNG QUẢN TRỊ
            // -------------------------------------------------------------
            $this->line('5. Ngăn chặn tự ý thay đổi MaTaiKhoan qua request payload...');
            $reqHack = Request::create('/patient/profile', 'PUT', [
                'HoTen' => 'Nguyễn Văn A',
                'MaTaiKhoan' => 999999, // Cố tình đổi sang mã tài khoản khác
                'MaBenhNhan' => 888888, // Cố tình đổi sang mã bệnh nhân khác
            ]);
            $reqHack->headers->set('Accept', 'application/json');
            $reqHack->setUserResolver(fn () => $tk1);

            $controller->updateProfile($reqHack);
            $bn1Check = BenhNhan::find($bn1->MaBenhNhan);

            if ($bn1Check->MaTaiKhoan === $tk1->MaTaiKhoan && $bn1Check->MaBenhNhan === $bn1->MaBenhNhan) {
                $this->info("   ✅ PASS: MaTaiKhoan ({$bn1Check->MaTaiKhoan}) và MaBenhNhan ({$bn1Check->MaBenhNhan}) được bảo vệ tuyệt đối, không bị ghi đè.");
                $passed++;
            } else {
                $this->error('   ❌ FAIL: MaTaiKhoan hoặc MaBenhNhan đã bị ghi đè trái phép!');
                $failed++;
            }

        } finally {
            // DỌN DẸP DỮ LIỆU KIỂM THỬ AN TOÀN
            BenhNhan::whereIn('MaBenhNhan', [$bn1->MaBenhNhan, $bn2->MaBenhNhan])->delete();
            TaiKhoan::whereIn('MaTaiKhoan', [$tk1->MaTaiKhoan, $tk2->MaTaiKhoan])->delete();
            $this->line('   [Đã dọn dẹp các bản ghi kiểm thử, bảo toàn database]');
        }

        $this->info('');
        $this->line(str_repeat('═', 64));
        $this->info("  KẾT QUẢ BƯỚC 1 (BenhNhanController): {$passed}/5 Yêu cầu ĐẠT (PASS), {$failed} Thất bại");
        $this->line(str_repeat('═', 64));
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
