<?php

namespace App\Console\Commands;

use App\Http\Controllers\BacSiController;
use App\Http\Controllers\CaKhamController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LichLamViecController;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChuyenKhoa;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TestLichKhamNghiepVu extends Command
{
    protected $signature = 'test:lichkham';
    protected $description = 'Kiểm thử nghiệp vụ Giai đoạn 3.3: Lịch làm việc - Ca khám - Lịch hẹn';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ GIAI ĐOẠN 3.3: LỊCH LÀM VIỆC - CA KHÁM - LỊCH HẸN');
        $this->info('================================================================');
        $this->info('');

        $lichLamViecCtrl = new LichLamViecController();
        $caKhamCtrl = new CaKhamController();
        $lichHenCtrl = new LichHenController();

        $passed = 0;
        $failed = 0;

        // Lưu danh sách ID để cleanup
        $createdAppointments = [];
        $createdSlots = [];
        $createdSchedules = [];
        $createdDoctors = [];
        $createdPatients = [];
        $createdAccounts = [];

        try {
            // =========================================================
            // 0. CHUẨN BỊ DỮ LIỆU KIỂM THỬ GIẢ LẬP
            // =========================================================
            $vaiTroAdmin = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->firstOrFail();
            $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->firstOrFail();
            $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->firstOrFail();
            $vaiTroLT = VaiTro::where('TenVaiTro', 'LE_TAN')->firstOrFail();

            $ck = ChuyenKhoa::first();
            if (!$ck) {
                $ck = ChuyenKhoa::create(['TenChuyenKhoa' => 'Nhi Khoa', 'TrangThai' => 'HOAT_DONG']);
            }

            // Tạo Bác sĩ A
            $tkDocA = TaiKhoan::create([
                'TenDangNhap' => 'test_doc_a_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'doc_a_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDocA->MaTaiKhoan;

            $docA = BacSi::create([
                'MaTaiKhoan' => $tkDocA->MaTaiKhoan,
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
                'HoTen' => 'BS. Nguyễn Văn A Test',
                'HocVi' => 'Bác sĩ CKII',
                'KinhNghiem' => 10,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $docA->MaBacSi;
            $tkDocA->setRelation('vaiTro', $vaiTroBS);
            $tkDocA->setRelation('bacSi', $docA);

            // Tạo Bác sĩ B
            $tkDocB = TaiKhoan::create([
                'TenDangNhap' => 'test_doc_b_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'doc_b_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDocB->MaTaiKhoan;

            $docB = BacSi::create([
                'MaTaiKhoan' => $tkDocB->MaTaiKhoan,
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
                'HoTen' => 'BS. Trần Văn B Test',
                'HocVi' => 'Thạc sĩ',
                'KinhNghiem' => 5,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $docB->MaBacSi;
            $tkDocB->setRelation('vaiTro', $vaiTroBS);
            $tkDocB->setRelation('bacSi', $docB);

            // Tạo Bệnh nhân 1
            $tkPatient1 = TaiKhoan::create([
                'TenDangNhap' => 'test_pat_1_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'pat_1_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPatient1->MaTaiKhoan;

            $pat1 = BenhNhan::create([
                'MaTaiKhoan' => $tkPatient1->MaTaiKhoan,
                'HoTen' => 'Bệnh Nhân Một Test',
                'SoDienThoai' => '0901111111',
                'EmailLienHe' => 'pat1@gmail.com',
                'GioiTinh' => 'NAM',
            ]);
            $createdPatients[] = $pat1->MaBenhNhan;
            $tkPatient1->setRelation('vaiTro', $vaiTroBN);
            $tkPatient1->setRelation('benhNhan', $pat1);

            // Tạo Bệnh nhân 2
            $tkPatient2 = TaiKhoan::create([
                'TenDangNhap' => 'test_pat_2_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'pat_2_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPatient2->MaTaiKhoan;

            $pat2 = BenhNhan::create([
                'MaTaiKhoan' => $tkPatient2->MaTaiKhoan,
                'HoTen' => 'Bệnh Nhân Hai Test',
                'SoDienThoai' => '0902222222',
                'EmailLienHe' => 'pat2@gmail.com',
                'GioiTinh' => 'NU',
            ]);
            $createdPatients[] = $pat2->MaBenhNhan;
            $tkPatient2->setRelation('vaiTro', $vaiTroBN);
            $tkPatient2->setRelation('benhNhan', $pat2);

            // Tạo Admin & Lễ tân
            $adminUser = new TaiKhoan([
                'MaTaiKhoan' => 9991,
                'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
                'TenDangNhap' => 'admin_test',
            ]);
            $adminUser->setRelation('vaiTro', $vaiTroAdmin);

            $receptionistUser = new TaiKhoan([
                'MaTaiKhoan' => 9992,
                'MaVaiTro' => $vaiTroLT->MaVaiTro,
                'TenDangNhap' => 'letan_test',
            ]);
            $receptionistUser->setRelation('vaiTro', $vaiTroLT);

            $ngayTest = date('Y-m-d', strtotime('+3 days'));

            // =========================================================
            // BƯỚC 1: KIỂM THỬ LichLamViecController
            // =========================================================
            $this->info('--- BƯỚC 1: LICH LAM VIEC CONTROLLER ---');

            // 1.1 Bác sĩ A tạo lịch làm việc
            $this->line('1.1. Bác sĩ A tạo lịch làm việc mới (08:00 - 12:00)...');
            $req1_1 = Request::create('/doctor/schedules', 'POST', [
                'NgayLamViec' => $ngayTest,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '12:00:00',
                'SoLuongTiepNhan' => 10,
            ]);
            $req1_1->setUserResolver(fn() => $tkDocA);
            $res1_1 = $lichLamViecCtrl->store($req1_1);
            $data1_1 = json_decode($res1_1->getContent(), true);

            if ($res1_1->getStatusCode() === 201 && $data1_1['success'] === true) {
                $schedA = LichLamViec::find($data1_1['data']['MaLichLamViec']);
                $createdSchedules[] = $schedA->MaLichLamViec;
                $this->info("   -> PASS: Bác sĩ A tạo lịch thành công [ID: {$schedA->MaLichLamViec}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Tạo lịch làm việc thất bại: ' . $res1_1->getContent());
                $failed++;
                return 1;
            }

            // 1.2 Kiểm tra phát hiện trùng lịch của cùng bác sĩ
            $this->line('1.2. Kiểm tra chặn tạo lịch trùng khung giờ của Bác sĩ A...');
            $req1_2 = Request::create('/doctor/schedules', 'POST', [
                'NgayLamViec' => $ngayTest,
                'GioBatDau' => '09:00:00',
                'GioKetThuc' => '11:00:00', // Trùng nằm trong 08:00 - 12:00
            ]);
            $req1_2->setUserResolver(fn() => $tkDocA);

            try {
                $lichLamViecCtrl->store($req1_2);
                $this->error('   -> FAIL: Hệ thống không chặn lịch bị trùng!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn trùng lịch thành công (ValidationException: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE) . ')');
                $passed++;
            }

            // 1.3 Phân quyền: Bác sĩ B không thể sửa lịch của Bác sĩ A
            $this->line('1.3. Phân quyền: Bác sĩ B cố sửa lịch của Bác sĩ A...');
            $req1_3 = Request::create("/doctor/schedules/{$schedA->MaLichLamViec}", 'PUT', [
                'GioKetThuc' => '12:30:00',
            ]);
            $req1_3->setUserResolver(fn() => $tkDocB);
            $res1_3 = $lichLamViecCtrl->update($req1_3, $schedA->MaLichLamViec);

            if ($res1_3->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bác sĩ B sửa lịch Bác sĩ A (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ B sửa được lịch Bác sĩ A! Code: ' . $res1_3->getStatusCode());
                $failed++;
            }

            // 1.4 Admin có quyền sửa lịch của Bác sĩ A
            $this->line('1.4. Quản trị viên quản lý: Admin cập nhật số lượng tiếp nhận lịch của Bác sĩ A...');
            $req1_4 = Request::create("/admin/schedules/{$schedA->MaLichLamViec}", 'PUT', [
                'SoLuongTiepNhan' => 15,
            ]);
            $req1_4->setUserResolver(fn() => $adminUser);
            $res1_4 = $lichLamViecCtrl->update($req1_4, $schedA->MaLichLamViec);

            if ($res1_4->getStatusCode() === 200 && $schedA->fresh()->SoLuongTiepNhan === 15) {
                $this->info('   -> PASS: Admin cập nhật lịch thành công.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Admin cập nhật thất bại: ' . $res1_4->getContent());
                $failed++;
            }

            // =========================================================
            // BƯỚC 2: KIỂM THỬ CaKhamController
            // =========================================================
            $this->info('');
            $this->info('--- BƯỚC 2: CA KHAM CONTROLLER ---');

            // 2.1 Tạo ca khám nằm trong khung giờ lịch làm việc
            $this->line('2.1. Bác sĩ A tạo ca khám 1 (08:00 - 09:30, tiếp nhận 2)...');
            $req2_1 = Request::create('/doctor/ca-kham', 'POST', [
                'MaLichLamViec' => $schedA->MaLichLamViec,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '09:30:00',
                'SoLuongTiepNhan' => 2,
            ]);
            $req2_1->setUserResolver(fn() => $tkDocA);
            $res2_1 = $caKhamCtrl->store($req2_1);
            $data2_1 = json_decode($res2_1->getContent(), true);

            if ($res2_1->getStatusCode() === 201 && $data2_1['success'] === true) {
                $ca1 = CaKham::find($data2_1['data']['MaCaKham']);
                $createdSlots[] = $ca1->MaCaKham;
                $this->info("   -> PASS: Tạo ca khám 1 thành công [ID: {$ca1->MaCaKham}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Tạo ca khám thất bại: ' . $res2_1->getContent());
                $failed++;
                return 1;
            }

            // 2.2 Chặn tạo ca khám vượt ngoài giờ của lịch làm việc
            $this->line('2.2. Kiểm tra chặn ca khám ngoài khung giờ lịch làm việc (07:00 - 08:30)...');
            $req2_2 = Request::create('/doctor/ca-kham', 'POST', [
                'MaLichLamViec' => $schedA->MaLichLamViec,
                'GioBatDau' => '07:00:00', // Sớm hơn 08:00
                'GioKetThuc' => '08:30:00',
                'SoLuongTiepNhan' => 2,
            ]);
            $req2_2->setUserResolver(fn() => $tkDocA);

            try {
                $caKhamCtrl->store($req2_2);
                $this->error('   -> FAIL: Không chặn ca khám ngoài giờ làm việc!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn ca khám ngoài giờ làm việc thành công');
                $passed++;
            }

            // 2.3 Chặn tạo ca khám trùng giờ với ca 1
            $this->line('2.3. Kiểm tra chặn ca khám trùng giờ với ca 1 (09:00 - 10:00)...');
            $req2_3 = Request::create('/doctor/ca-kham', 'POST', [
                'MaLichLamViec' => $schedA->MaLichLamViec,
                'GioBatDau' => '09:00:00', // Trùng giao thoa với ca 1 (08:00 - 09:30)
                'GioKetThuc' => '10:00:00',
                'SoLuongTiepNhan' => 2,
            ]);
            $req2_3->setUserResolver(fn() => $tkDocA);

            try {
                $caKhamCtrl->store($req2_3);
                $this->error('   -> FAIL: Không chặn ca khám trùng giờ!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn ca khám trùng giờ thành công');
                $passed++;
            }

            // Tạo thêm ca khám 2 (09:30 - 11:00, tiếp nhận 1)
            $req2_ca2 = Request::create('/doctor/ca-kham', 'POST', [
                'MaLichLamViec' => $schedA->MaLichLamViec,
                'GioBatDau' => '09:30:00',
                'GioKetThuc' => '11:00:00',
                'SoLuongTiepNhan' => 1,
            ]);
            $req2_ca2->setUserResolver(fn() => $tkDocA);
            $res2_ca2 = $caKhamCtrl->store($req2_ca2);
            $ca2 = CaKham::find(json_decode($res2_ca2->getContent(), true)['data']['MaCaKham']);
            $createdSlots[] = $ca2->MaCaKham;

            // 2.4 Tra cứu và tính toán SoLuongDaDat & SoLuongConNhan
            $this->line('2.4. Tra cứu danh sách ca khám và tính toán chỗ còn nhận...');
            $req2_4 = Request::create('/ca-kham', 'GET', [
                'doctor_id' => $docA->MaBacSi,
                'date' => $ngayTest,
            ]);
            $res2_4 = $caKhamCtrl->index($req2_4);
            $data2_4 = json_decode($res2_4->getContent(), true)['data'];

            $ca1Data = collect($data2_4)->firstWhere('MaCaKham', $ca1->MaCaKham);
            if ($ca1Data && $ca1Data['SoLuongTiepNhan'] === 2 && $ca1Data['SoLuongDaDat'] === 0 && $ca1Data['SoLuongConNhan'] === 2 && $ca1Data['KhaDung'] === true) {
                $this->info('   -> PASS: Ca khám 1 hiển thị đúng: Sức chứa=2, Đã đặt=0, Còn nhận=2, Khả dụng=true');
                $passed++;
            } else {
                $this->error('   -> FAIL: Dữ liệu ca khám không khớp: ' . json_encode($ca1Data));
                $failed++;
            }

            // =========================================================
            // BƯỚC 3: KIỂM THỬ LichHenController
            // =========================================================
            $this->info('');
            $this->info('--- BƯỚC 3: LICH HEN CONTROLLER ---');

            // 3.1 Bệnh nhân 1 đặt lịch khám vào Ca 2 qua sp_dat_lich_hen
            $this->line('3.1. Bệnh nhân 1 đặt lịch khám vào Ca 2 (tiếp nhận 1)...');
            $req3_1 = Request::create('/appointments', 'POST', [
                'MaCaKham' => $ca2->MaCaKham,
                'LyDoKham' => 'Ho sốt kéo dài 3 ngày',
            ]);
            $req3_1->setUserResolver(fn() => $tkPatient1);
            $res3_1 = $lichHenCtrl->store($req3_1);
            $data3_1 = json_decode($res3_1->getContent(), true);

            if ($res3_1->getStatusCode() === 201 && $data3_1['success'] === true) {
                $lh1 = LichHen::find($data3_1['data']['MaLichHen']);
                $createdAppointments[] = $lh1->MaLichHen;
                $this->info("   -> PASS: Bệnh nhân 1 đặt lịch thành công qua stored procedure [ID: {$lh1->MaLichHen}, Trạng thái: {$lh1->TrangThai}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Đặt lịch thất bại: ' . $res3_1->getContent());
                $failed++;
                return 1;
            }

            // 3.2 Chặn bệnh nhân 1 đặt lịch trùng vào cùng ca khám
            $this->line('3.2. Kiểm tra chặn Bệnh nhân 1 đặt thêm lần nữa vào cùng ca 2...');
            $req3_2 = Request::create('/appointments', 'POST', [
                'MaCaKham' => $ca2->MaCaKham,
                'LyDoKham' => 'Đặt lại',
            ]);
            $req3_2->setUserResolver(fn() => $tkPatient1);

            try {
                $lichHenCtrl->store($req3_2);
                $this->error('   -> FAIL: Không chặn bệnh nhân đặt trùng!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn đặt trùng ca thành công');
                $passed++;
            }

            // 3.3 Đặt lịch khi ca khám đã hết chỗ (Ca 2 sức chứa 1, BN 1 đã đặt)
            $this->line('3.3. Bệnh nhân 2 đặt lịch vào Ca 2 đã đầy (kiểm tra Stored Procedure trigger error)...');
            $req3_3 = Request::create('/appointments', 'POST', [
                'MaCaKham' => $ca2->MaCaKham,
                'LyDoKham' => 'Khám tổng quát',
            ]);
            $req3_3->setUserResolver(fn() => $tkPatient2);
            $res3_3 = $lichHenCtrl->store($req3_3);
            $data3_3 = json_decode($res3_3->getContent(), true);

            if ($res3_3->getStatusCode() === 422 && (str_contains($data3_3['message'], 'hết số lượng') || str_contains($data3_3['message'], 'het so luong'))) {
                $this->info('   -> PASS: Chặn ca đã đầy thành công: ' . $data3_3['message']);
                $passed++;
            } else {
                $this->error('   -> FAIL: Stored Procedure không chặn khi ca đầy! Response: ' . $res3_3->getContent());
                $failed++;
            }

            // 3.4 Bệnh nhân 2 không thể xem lịch của Bệnh nhân 1
            $this->line('3.4. Bảo mật: Bệnh nhân 2 cố xem chi tiết lịch hẹn của Bệnh nhân 1...');
            $req3_4 = Request::create("/appointments/{$lh1->MaLichHen}", 'GET');
            $req3_4->setUserResolver(fn() => $tkPatient2);
            $res3_4 = $lichHenCtrl->show($req3_4, $lh1->MaLichHen);

            if ($res3_4->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn Bệnh nhân 2 xem hồ sơ lịch hẹn của Bệnh nhân 1 (403)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Lộ lịch hẹn giữa các bệnh nhân! Code: ' . $res3_4->getStatusCode());
                $failed++;
            }

            // 3.5 Bác sĩ A xem được lịch hẹn của bệnh nhân thuộc ca của mình
            $this->line('3.5. Bác sĩ A xem lịch hẹn thuộc ca khám của mình...');
            $req3_5 = Request::create("/appointments/{$lh1->MaLichHen}", 'GET');
            $req3_5->setUserResolver(fn() => $tkDocA);
            $res3_5 = $lichHenCtrl->show($req3_5, $lh1->MaLichHen);

            if ($res3_5->getStatusCode() === 200) {
                $this->info('   -> PASS: Bác sĩ A xem được chi tiết lịch hẹn đúng quyền hạn');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ A không xem được lịch của ca mình: ' . $res3_5->getContent());
                $failed++;
            }

            // 3.6 Bác sĩ B không thể xem lịch hẹn của Bác sĩ A
            $this->line('3.6. Bảo mật: Bác sĩ B cố xem lịch hẹn thuộc ca khám của Bác sĩ A...');
            $req3_6 = Request::create("/appointments/{$lh1->MaLichHen}", 'GET');
            $req3_6->setUserResolver(fn() => $tkDocB);
            $res3_6 = $lichHenCtrl->show($req3_6, $lh1->MaLichHen);

            if ($res3_6->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn Bác sĩ B xem lịch hẹn của Bác sĩ A (403)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ B xem được lịch hẹn của Bác sĩ khác!');
                $failed++;
            }

            // 3.7 Lễ tân cập nhật trạng thái lịch hẹn
            $this->line('3.7. Lễ tân xác nhận lịch hẹn (CHO_XAC_NHAN -> DA_XAC_NHAN)...');
            $req3_7 = Request::create("/receptionist/appointments/{$lh1->MaLichHen}/status", 'POST', [
                'TrangThai' => 'DA_XAC_NHAN',
            ]);
            $req3_7->setUserResolver(fn() => $receptionistUser);
            $res3_7 = $lichHenCtrl->updateStatus($req3_7, $lh1->MaLichHen);

            if ($res3_7->getStatusCode() === 200 && $lh1->fresh()->TrangThai === 'DA_XAC_NHAN') {
                $this->info('   -> PASS: Lễ tân cập nhật trạng thái thành công (DA_XAC_NHAN)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Cập nhật trạng thái thất bại: ' . $res3_7->getContent());
                $failed++;
            }

            // 3.8 Bệnh nhân 1 hủy lịch hẹn và giải phóng slot
            $this->line('3.8. Bệnh nhân 1 hủy lịch hẹn & kiểm tra slot ca khám được giải phóng...');
            $req3_8 = Request::create("/appointments/{$lh1->MaLichHen}/cancel", 'POST');
            $req3_8->setUserResolver(fn() => $tkPatient1);
            $res3_8 = $lichHenCtrl->cancel($req3_8, $lh1->MaLichHen);

            if ($res3_8->getStatusCode() === 200 && $lh1->fresh()->TrangThai === 'DA_HUY') {
                $this->info('   -> PASS: Hủy lịch hẹn thành công (Trạng thái: DA_HUY)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Hủy lịch thất bại: ' . $res3_8->getContent());
                $failed++;
            }

            // 3.9 Sau khi hủy, Bệnh nhân 2 đặt vào Ca 2 thành công (slot đã được giải phóng)
            $this->line('3.9. Bệnh nhân 2 đặt vào Ca 2 sau khi có slot giải phóng...');
            $req3_9 = Request::create('/appointments', 'POST', [
                'MaCaKham' => $ca2->MaCaKham,
                'LyDoKham' => 'Khám tổng quát sau khi có chỗ trống',
            ]);
            $req3_9->setUserResolver(fn() => $tkPatient2);
            $res3_9 = $lichHenCtrl->store($req3_9);
            $data3_9 = json_decode($res3_9->getContent(), true);

            if ($res3_9->getStatusCode() === 201 && $data3_9['success'] === true) {
                $lh2 = LichHen::find($data3_9['data']['MaLichHen']);
                $createdAppointments[] = $lh2->MaLichHen;
                $this->info("   -> PASS: Bệnh nhân 2 đặt thành công sau khi slot được giải phóng [ID: {$lh2->MaLichHen}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Không đặt được lịch dù slot đã giải phóng: ' . $res3_9->getContent());
                $failed++;
            }

            // 3.10 Hủy lịch làm việc có ca khám -> tự động chuyển sang ĐÓNG
            $this->line('3.10. Kiểm tra an toàn: Xóa lịch làm việc đã có ca khám -> chuyển sang DONG...');
            $req3_10 = Request::create("/doctor/schedules/{$schedA->MaLichLamViec}", 'DELETE');
            $req3_10->setUserResolver(fn() => $tkDocA);
            $res3_10 = $lichLamViecCtrl->destroy($req3_10, $schedA->MaLichLamViec);

            if ($res3_10->getStatusCode() === 200 && $schedA->fresh()->TrangThai === 'DONG') {
                $this->info('   -> PASS: Lịch làm việc chuyển sang trạng thái DONG an toàn mà không làm mất dữ liệu liên kết.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Chuyển trạng thái lịch làm việc thất bại: ' . $res3_10->getContent());
                $failed++;
            }

        } catch (\Throwable $e) {
            $this->error('LỖI KHÔNG MONG MUỐN: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            $failed++;
        } finally {
            // =========================================================
            // DỌN DẸP DỮ LIỆU TEST (AN TOÀN TUYỆT ĐỐI)
            // =========================================================
            $this->info('');
            $this->info('--- DỌN DẸP DỮ LIỆU TEST ---');

            if (!empty($createdAppointments)) {
                LichHen::whereIn('MaLichHen', $createdAppointments)->delete();
                $this->line('   -> Đã xóa các lịch hẹn test: ' . implode(', ', $createdAppointments));
            }
            if (!empty($createdSlots)) {
                CaKham::whereIn('MaCaKham', $createdSlots)->delete();
                $this->line('   -> Đã xóa các ca khám test: ' . implode(', ', $createdSlots));
            }
            if (!empty($createdSchedules)) {
                LichLamViec::whereIn('MaLichLamViec', $createdSchedules)->delete();
                $this->line('   -> Đã xóa các lịch làm việc test: ' . implode(', ', $createdSchedules));
            }
            if (!empty($createdPatients)) {
                BenhNhan::whereIn('MaBenhNhan', $createdPatients)->delete();
                $this->line('   -> Đã xóa các hồ sơ bệnh nhân test: ' . implode(', ', $createdPatients));
            }
            if (!empty($createdDoctors)) {
                BacSi::whereIn('MaBacSi', $createdDoctors)->delete();
                $this->line('   -> Đã xóa các hồ sơ bác sĩ test: ' . implode(', ', $createdDoctors));
            }
            if (!empty($createdAccounts)) {
                TaiKhoan::whereIn('MaTaiKhoan', $createdAccounts)->delete();
                $this->line('   -> Đã xóa các tài khoản test: ' . implode(', ', $createdAccounts));
            }
        }

        $this->info('');
        $this->info('================================================================');
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 3.3: PASS: {$passed} | FAIL: {$failed}");
        $this->info('================================================================');
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
