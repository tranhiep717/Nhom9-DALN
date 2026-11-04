<?php

namespace App\Console\Commands;

use App\Http\Controllers\ChiDinhDichVuController;
use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\LuotKhamController;
use App\Http\Controllers\ThuocController;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChiDinhDichVu;
use App\Models\ChiTietDonThuoc;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\TaiKhoan;
use App\Models\Thuoc;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TestKhamBenhNghiepVu extends Command
{
    protected $signature = 'test:khambenh';
    protected $description = 'Kiểm thử toàn diện nghiệp vụ Giai đoạn 3.4: Khám bệnh và Hồ sơ điều trị';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ TOÀN DIỆN GIAI ĐOẠN 3.4: KHÁM BỆNH & HỒ SƠ ĐIỀU TRỊ');
        $this->info('================================================================');
        $this->info('');

        $luotKhamCtrl = new LuotKhamController();
        $thuocCtrl = new ThuocController();
        $donThuocCtrl = new DonThuocController();
        $chiDinhCtrl = new ChiDinhDichVuController();

        $passed = 0;
        $failed = 0;

        // Lưu danh sách ID để cleanup
        $createdServiceRequests = [];
        $createdPrescriptionDetails = [];
        $createdPrescriptions = [];
        $createdMedicalRecords = [];
        $createdVisits = [];
        $createdAppointments = [];
        $createdSlots = [];
        $createdSchedules = [];
        $createdMedicines = [];
        $createdServices = [];
        $createdDoctors = [];
        $createdPatients = [];
        $createdAccounts = [];

        try {
            // =========================================================
            // 0. CHUẨN BỊ DỮ LIỆU KIỂM THỬ
            // =========================================================
            $vaiTroAdmin = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->firstOrFail();
            $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->firstOrFail();
            $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->firstOrFail();
            $vaiTroLT = VaiTro::where('TenVaiTro', 'LE_TAN')->firstOrFail();

            $ck = ChuyenKhoa::first();
            if (!$ck) {
                $ck = ChuyenKhoa::create(['TenChuyenKhoa' => 'Nội Tổng Quát', 'TrangThai' => 'HOAT_DONG']);
            }

            // Bác sĩ A
            $tkDocA = TaiKhoan::create([
                'TenDangNhap' => 'test_kb_doc_a_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'kb_doc_a_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDocA->MaTaiKhoan;

            $docA = BacSi::create([
                'MaTaiKhoan' => $tkDocA->MaTaiKhoan,
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
                'HoTen' => 'BS. Lê Khám Bệnh A',
                'HocVi' => 'Thạc sĩ Bác sĩ',
                'KinhNghiem' => 8,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $docA->MaBacSi;
            $tkDocA->setRelation('vaiTro', $vaiTroBS);
            $tkDocA->setRelation('bacSi', $docA);

            // Bác sĩ B
            $tkDocB = TaiKhoan::create([
                'TenDangNhap' => 'test_kb_doc_b_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'kb_doc_b_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDocB->MaTaiKhoan;

            $docB = BacSi::create([
                'MaTaiKhoan' => $tkDocB->MaTaiKhoan,
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
                'HoTen' => 'BS. Vũ Khám Bệnh B',
                'HocVi' => 'Bác sĩ CKI',
                'KinhNghiem' => 5,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $docB->MaBacSi;
            $tkDocB->setRelation('vaiTro', $vaiTroBS);
            $tkDocB->setRelation('bacSi', $docB);

            // Bệnh nhân 1
            $tkPat1 = TaiKhoan::create([
                'TenDangNhap' => 'test_kb_pat_1_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'kb_pat_1_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPat1->MaTaiKhoan;

            $pat1 = BenhNhan::create([
                'MaTaiKhoan' => $tkPat1->MaTaiKhoan,
                'HoTen' => 'Bệnh Nhân Điều Trị 1',
                'SoDienThoai' => '0931234567',
                'EmailLienHe' => 'pat1_dt@gmail.com',
                'GioiTinh' => 'NAM',
            ]);
            $createdPatients[] = $pat1->MaBenhNhan;
            $tkPat1->setRelation('vaiTro', $vaiTroBN);
            $tkPat1->setRelation('benhNhan', $pat1);

            // Bệnh nhân 2
            $tkPat2 = TaiKhoan::create([
                'TenDangNhap' => 'test_kb_pat_2_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'kb_pat_2_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPat2->MaTaiKhoan;

            $pat2 = BenhNhan::create([
                'MaTaiKhoan' => $tkPat2->MaTaiKhoan,
                'HoTen' => 'Bệnh Nhân Điều Trị 2',
                'SoDienThoai' => '0937654321',
                'EmailLienHe' => 'pat2_dt@gmail.com',
                'GioiTinh' => 'NU',
            ]);
            $createdPatients[] = $pat2->MaBenhNhan;
            $tkPat2->setRelation('vaiTro', $vaiTroBN);
            $tkPat2->setRelation('benhNhan', $pat2);

            // Tài khoản Admin & Lễ tân
            $adminUser = new TaiKhoan([
                'MaTaiKhoan' => 99991,
                'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
                'TenDangNhap' => 'admin_kb_test',
            ]);
            $adminUser->setRelation('vaiTro', $vaiTroAdmin);

            $receptionistUser = new TaiKhoan([
                'MaTaiKhoan' => 99992,
                'MaVaiTro' => $vaiTroLT->MaVaiTro,
                'TenDangNhap' => 'letan_kb_test',
            ]);
            $receptionistUser->setRelation('vaiTro', $vaiTroLT);

            // Tạo Lịch làm việc & Ca khám cho Bác sĩ A
            $sched = LichLamViec::create([
                'MaBacSi' => $docA->MaBacSi,
                'NgayLamViec' => date('Y-m-d', strtotime('+5 days')),
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '12:00:00',
                'SoLuongTiepNhan' => 10,
                'TrangThai' => 'MO',
            ]);
            $createdSchedules[] = $sched->MaLichLamViec;

            $ca = CaKham::create([
                'MaLichLamViec' => $sched->MaLichLamViec,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '10:00:00',
                'SoLuongTiepNhan' => 5,
                'TrangThai' => 'CON_TRONG',
            ]);
            $createdSlots[] = $ca->MaCaKham;

            // Tạo Lịch hẹn của Bệnh nhân 1 (đã xác nhận)
            $lh1 = LichHen::create([
                'MaCaKham' => $ca->MaCaKham,
                'MaBenhNhan' => $pat1->MaBenhNhan,
                'NgayDat' => now(),
                'TrangThai' => 'DA_XAC_NHAN',
                'LyDoKham' => 'Đau thượng vị kèm ợ chua',
            ]);
            $createdAppointments[] = $lh1->MaLichHen;

            // =========================================================
            // BƯỚC 1: KIỂM THỬ LuotKhamController
            // =========================================================
            $this->info('--- BƯỚC 1: LUOT KHAM CONTROLLER ---');

            // 1.1 Tiếp nhận bệnh nhân từ lịch hẹn đã xác nhận
            $this->line('1.1. Lễ tân tiếp nhận bệnh nhân 1 từ lịch hẹn đã xác nhận...');
            $req1_1 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh1->MaLichHen,
            ]);
            $req1_1->setUserResolver(fn() => $receptionistUser);
            $res1_1 = $luotKhamCtrl->store($req1_1);
            $data1_1 = json_decode($res1_1->getContent(), true);

            if ($res1_1->getStatusCode() === 201 && $data1_1['success'] === true) {
                $visit1 = LuotKham::find($data1_1['data']['MaLuotKham']);
                $createdVisits[] = $visit1->MaLuotKham;
                $lh1Updated = $lh1->fresh();
                if ($lh1Updated->TrangThai === 'DA_TIEP_NHAN' && $visit1->TrangThai === 'CHO_KHAM') {
                    $this->info("   -> PASS: Tiếp nhận thành công. Lịch hẹn chuyển DA_TIEP_NHAN, Lượt khám ID: {$visit1->MaLuotKham} (CHO_KHAM)");
                    $passed++;
                } else {
                    $this->error('   -> FAIL: Trạng thái không đúng sau khi tiếp nhận.');
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Tiếp nhận bệnh nhân thất bại: ' . $res1_1->getContent());
                $failed++;
                return 1;
            }

            // 1.2 Chặn tạo trùng lượt khám cho cùng lịch hẹn
            $this->line('1.2. Kiểm tra chặn tạo trùng lượt khám cho cùng lịch hẹn...');
            $req1_2 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh1->MaLichHen,
            ]);
            $req1_2->setUserResolver(fn() => $receptionistUser);

            try {
                $luotKhamCtrl->store($req1_2);
                $this->error('   -> FAIL: Không chặn trùng lượt khám cho cùng lịch hẹn!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn tạo trùng lượt khám thành công (ValidationException)');
                $passed++;
            }

            // 1.3 Phân quyền: Bác sĩ chỉ xem lượt khám thuộc phạm vi phụ trách
            $this->line('1.3. Phân quyền: Bác sĩ A xem danh sách lượt khám của mình, Bác sĩ B không thấy...');
            $req1_3a = Request::create('/doctor/visits', 'GET');
            $req1_3a->headers->set('Accept', 'application/json');
            $req1_3a->setUserResolver(fn() => $tkDocA);
            $res1_3a = $luotKhamCtrl->index($req1_3a);
            $data1_3a = json_decode($res1_3a->getContent(), true)['data'];

            $req1_3b = Request::create('/doctor/visits', 'GET');
            $req1_3b->headers->set('Accept', 'application/json');
            $req1_3b->setUserResolver(fn() => $tkDocB);
            $res1_3b = $luotKhamCtrl->index($req1_3b);
            $data1_3b = json_decode($res1_3b->getContent(), true)['data'];

            $docAHasVisit = collect($data1_3a)->contains('MaLuotKham', $visit1->MaLuotKham);
            $docBHasVisit = collect($data1_3b)->contains('MaLuotKham', $visit1->MaLuotKham);

            if ($docAHasVisit && !$docBHasVisit) {
                $this->info('   -> PASS: Phân quyền danh sách lượt khám theo bác sĩ chính xác 100%');
                $passed++;
            } else {
                $this->error("   -> FAIL: Bác sĩ B thấy lượt khám của Bác sĩ A!");
                $failed++;
            }

            // 1.4 Bác sĩ B không thể can thiệp bắt đầu khám lượt khám của Bác sĩ A
            $this->line('1.4. Bảo mật: Bác sĩ B cố bắt đầu khám lượt khám của Bác sĩ A (403)...');
            $req1_4 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/start", 'POST');
            $req1_4->setUserResolver(fn() => $tkDocB);
            $res1_4 = $luotKhamCtrl->startExamine($req1_4, $visit1->MaLuotKham);

            if ($res1_4->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bác sĩ B can thiệp lượt khám của Bác sĩ A (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ B can thiệp được lượt khám!');
                $failed++;
            }

            // 1.5 Bác sĩ A bắt đầu khám
            $this->line('1.5. Bác sĩ A bắt đầu khám bệnh...');
            $req1_5 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/start", 'POST');
            $req1_5->setUserResolver(fn() => $tkDocA);
            $res1_5 = $luotKhamCtrl->startExamine($req1_5, $visit1->MaLuotKham);

            if ($res1_5->getStatusCode() === 200 && $visit1->fresh()->TrangThai === 'DANG_KHAM') {
                $this->info('   -> PASS: Bác sĩ A bắt đầu khám thành công (Trạng thái: DANG_KHAM)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bắt đầu khám thất bại: ' . $res1_5->getContent());
                $failed++;
            }

            // 1.6a Chặn hoàn thành lượt khám khi CHƯA có Phiếu khám / chẩn đoán
            $this->line('1.6a. Ràng buộc y tế: Chặn hoàn thành lượt khám khi chưa có chẩn đoán bệnh (422)...');
            $req1_6a = Request::create("/doctor/visits/{$visit1->MaLuotKham}/complete", 'POST');
            $req1_6a->setUserResolver(fn() => $tkDocA);
            $res1_6a = $luotKhamCtrl->completeExamine($req1_6a, $visit1->MaLuotKham);
            $data1_6a = json_decode($res1_6a->getContent(), true);

            if ($res1_6a->getStatusCode() === 422 && str_contains($data1_6a['message'], 'chưa có chẩn đoán')) {
                $this->info('   -> PASS: Chặn hoàn thành lượt khám khi thiếu chẩn đoán thành công: ' . $data1_6a['message']);
                $passed++;
            } else {
                $this->error('   -> FAIL: Cho phép hoàn thành khám dù chưa có chẩn đoán! Code: ' . $res1_6a->getStatusCode());
                $failed++;
            }

            // 1.6b Phân quyền: Lễ tân cố sửa/ghi phiếu khám (403)
            $this->line('1.6b. Phân quyền: Lễ tân cố ghi hồ sơ phiếu khám (403)...');
            $req1_6b = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => 'Triệu chứng giả mạo',
                'ChanDoan' => 'Chẩn đoán giả mạo',
            ]);
            $req1_6b->setUserResolver(fn() => $receptionistUser);
            $res1_6b = $luotKhamCtrl->savePhieuKham($req1_6b, $visit1->MaLuotKham);

            if ($res1_6b->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Lễ tân can thiệp hồ sơ phiếu khám (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Lễ tân ghi được phiếu khám!');
                $failed++;
            }

            // 1.6c Bác sĩ A ghi hồ sơ Phiếu khám (PhieuKham)
            $this->line('1.6c. Bác sĩ A ghi hồ sơ Phiếu khám chuẩn y khoa...');
            $req1_6c = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => 'Đau vùng thượng vị âm ỉ, buồn nôn sau khi ăn',
                'ChanDoan' => 'Viêm loét dạ dày tá tràng thể nhẹ',
                'KetQuaKham' => 'Bụng mềm, ấn đau tức thượng vị',
                'HuongDieuTri' => 'Điều trị nội khoa bằng thuốc giảm tiết axit và kháng sinh',
                'LoiDanBacSi' => 'Ăn đúng giờ, kiêng đồ chua cay, tái khám sau 2 tuần',
            ]);
            $req1_6c->setUserResolver(fn() => $tkDocA);
            $res1_6c = $luotKhamCtrl->savePhieuKham($req1_6c, $visit1->MaLuotKham);
            $data1_6c = json_decode($res1_6c->getContent(), true);

            if ($res1_6c->getStatusCode() === 200 && $data1_6c['success'] === true) {
                $pk = PhieuKham::where('MaLuotKham', $visit1->MaLuotKham)->first();
                $createdMedicalRecords[] = $pk->MaPhieuKham;
                $this->info("   -> PASS: Lưu phiếu khám thành công [Mã phiếu: {$pk->MaPhieuKham}, Chẩn đoán: {$pk->ChanDoan}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Lưu phiếu khám thất bại: ' . $res1_6c->getContent());
                $failed++;
            }

            // =========================================================
            // BƯỚC 2: KIỂM THỬ ThuocController
            // =========================================================
            $this->info('');
            $this->info('--- BƯỚC 2: THUOC CONTROLLER ---');

            // 2.1 Quản trị viên thêm thuốc mới
            $this->line('2.1. Quản trị viên thêm thuốc mới vào kho (Paracetamol Test)...');
            $req2_1 = Request::create('/admin/medicines', 'POST', [
                'TenThuoc' => 'Paracetamol 500mg Test ' . time(),
                'HoatChat' => 'Paracetamol',
                'HamLuong' => '500mg',
                'DonViTinh' => 'Viên',
                'DangBaoChe' => 'Viên nén',
                'DonGia' => 2000,
                'SoLuongTon' => 100,
                'HuongDanSuDung' => 'Uống sau ăn',
            ]);
            $req2_1->setUserResolver(fn() => $adminUser);
            $res2_1 = $thuocCtrl->store($req2_1);
            $data2_1 = json_decode($res2_1->getContent(), true);

            if ($res2_1->getStatusCode() === 201 && $data2_1['success'] === true) {
                $thuoc1 = Thuoc::find($data2_1['data']['MaThuoc']);
                $createdMedicines[] = $thuoc1->MaThuoc;
                $this->info("   -> PASS: Admin thêm thuốc thành công [ID: {$thuoc1->MaThuoc}, Tồn kho: {$thuoc1->SoLuongTon}, Đơn giá: {$thuoc1->DonGia}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Thêm thuốc thất bại: ' . $res2_1->getContent());
                $failed++;
                return 1;
            }

            // Thêm thuốc 2 (Omeprazol Test - tồn kho ít để test hết hàng)
            $req2_t2 = Request::create('/admin/medicines', 'POST', [
                'TenThuoc' => 'Omeprazol 20mg Test ' . time(),
                'HoatChat' => 'Omeprazol',
                'HamLuong' => '20mg',
                'DonViTinh' => 'Viên',
                'DangBaoChe' => 'Viên nang',
                'DonGia' => 5000,
                'SoLuongTon' => 5, // Tồn chỉ 5 viên
            ]);
            $req2_t2->setUserResolver(fn() => $adminUser);
            $res2_t2 = $thuocCtrl->store($req2_t2);
            $thuoc2 = Thuoc::find(json_decode($res2_t2->getContent(), true)['data']['MaThuoc']);
            $createdMedicines[] = $thuoc2->MaThuoc;

            // 2.2 Người dùng thường (Bệnh nhân) cố thêm thuốc -> 403
            $this->line('2.2. Phân quyền: Bệnh nhân cố thêm thuốc vào kho (403)...');
            $req2_2 = Request::create('/admin/medicines', 'POST', [
                'TenThuoc' => 'Thuoc Trai Quyen',
                'DonViTinh' => 'Viên',
                'DonGia' => 1000,
                'SoLuongTon' => 10,
            ]);
            $req2_2->setUserResolver(fn() => $tkPat1);
            $res2_2 = $thuocCtrl->store($req2_2);

            if ($res2_2->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công người không có quyền thêm thuốc (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bệnh nhân thêm được thuốc vào kho!');
                $failed++;
            }

            // 2.3 Tìm kiếm thuốc theo tên và hoạt chất
            $this->line('2.3. Tìm kiếm thuốc theo từ khóa tên hoặc hoạt chất...');
            $req2_3 = Request::create('/medicines', 'GET', [
                'search' => 'Paracetamol',
            ]);
            $res2_3 = $thuocCtrl->index($req2_3);
            $data2_3 = json_decode($res2_3->getContent(), true)['data'];

            if (collect($data2_3)->contains('MaThuoc', $thuoc1->MaThuoc)) {
                $this->info('   -> PASS: Tìm kiếm thuốc theo từ khóa chính xác');
                $passed++;
            } else {
                $this->error('   -> FAIL: Không tìm thấy thuốc theo từ khóa tìm kiếm');
                $failed++;
            }

            // =========================================================
            // BƯỚC 3: KIỂM THỬ DonThuocController
            // =========================================================
            $this->info('');
            $this->info('--- BƯỚC 3: DON THUOC CONTROLLER ---');

            // 3.1 Bác sĩ B cố kê đơn cho lượt khám của Bác sĩ A -> 403
            $this->line('3.1. Bảo mật: Bác sĩ B cố kê đơn cho lượt khám của Bác sĩ A (403)...');
            $req3_1 = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'items' => [
                    ['MaThuoc' => $thuoc1->MaThuoc, 'SoLuong' => 10, 'LieuDung' => '1 viên', 'TanSuat' => '2 lần/ngày'],
                ],
            ]);
            $req3_1->setUserResolver(fn() => $tkDocB);
            $res3_1 = $donThuocCtrl->store($req3_1);

            if ($res3_1->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bác sĩ B kê đơn lượt khám Bác sĩ A (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ B kê đơn được cho lượt khám người khác!');
                $failed++;
            }

            // 3.2 Kiểm tra kiểm soát tồn kho: Kê đơn vượt quá số lượng tồn
            $this->line('3.2. Kiểm tra chặn kê đơn vượt quá tồn kho (Omeprazol tồn: 5, kê: 10)...');
            $req3_2 = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'items' => [
                    ['MaThuoc' => $thuoc2->MaThuoc, 'SoLuong' => 10, 'LieuDung' => '1 viên', 'TanSuat' => '1 lần/ngày'],
                ],
            ]);
            $req3_2->setUserResolver(fn() => $tkDocA);

            try {
                $donThuocCtrl->store($req3_2);
                $this->error('   -> FAIL: Không chặn kê đơn vượt quá tồn kho!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn kê đơn vượt tồn kho thành công (ValidationException)');
                $passed++;
            }

            // 3.3 Bác sĩ A kê đơn ban đầu (10 viên Paracetamol @2.000đ + 3 viên Omeprazol @5.000đ)...
            $this->line('3.3. Bác sĩ A kê đơn ban đầu (10 viên Paracetamol @2.000đ + 3 viên Omeprazol @5.000đ)...');
            $req3_3 = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'LoiDan' => 'Uống đúng liều lượng, sau bữa ăn 30 phút',
                'items' => [
                    [
                        'MaThuoc' => $thuoc1->MaThuoc,
                        'SoLuong' => 10,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '2 lần/ngày',
                        'ThoiGianDung' => '5 ngày',
                        'CachDung' => 'Uống khi sốt trên 38.5 độ',
                    ],
                    [
                        'MaThuoc' => $thuoc2->MaThuoc,
                        'SoLuong' => 3,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '1 lần/ngày',
                        'ThoiGianDung' => '3 ngày',
                        'CachDung' => 'Uống sáng trước ăn 30 phút',
                    ],
                ],
            ]);
            $req3_3->setUserResolver(fn() => $tkDocA);
            $res3_3 = $donThuocCtrl->store($req3_3);
            $data3_3 = json_decode($res3_3->getContent(), true);

            if ($res3_3->getStatusCode() === 201 && $data3_3['success'] === true) {
                $dt1 = DonThuoc::find($data3_3['data']['MaDonThuoc']);
                $createdPrescriptions[] = $dt1->MaDonThuoc;

                $t1TonMoi = $thuoc1->fresh()->SoLuongTon; // 100 - 10 = 90
                $t2TonMoi = $thuoc2->fresh()->SoLuongTon; // 5 - 3 = 2
                $tongTien = $data3_3['data']['TongTienThuoc'];

                if ($t1TonMoi === 90 && $t2TonMoi === 2 && (float)$tongTien === 35000.0) {
                    $this->info("   -> PASS: Kê đơn thành công [Mã đơn: {$dt1->MaDonThuoc}]. Tồn kho: T1=90, T2=2, Tổng tiền: 35.000đ");
                    $passed++;
                } else {
                    $this->error("   -> FAIL: Tồn kho hoặc tổng tiền sai! T1: {$t1TonMoi}, T2: {$t2TonMoi}, Tổng: {$tongTien}");
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Kê đơn thuốc thất bại: ' . $res3_3->getContent());
                $failed++;
                return 1;
            }

            // 3.4 SỬA ĐƠN THUỐC SAU KHI TẠO (Tính toán Delta chênh lệch tồn kho chính xác)
            $this->line('3.4. Bác sĩ A sửa đơn thuốc: tăng Paracetamol từ 10 lên 15 viên (kho giảm thêm 5: 90 -> 85), giảm Omeprazol từ 3 xuống 1 (hoàn kho 2: 2 -> 4)...');
            $req3_4 = Request::create("/doctor/prescriptions/{$dt1->MaDonThuoc}", 'PUT', [
                'LoiDan' => 'Uống đều đặn hàng ngày',
                'items' => [
                    [
                        'MaThuoc' => $thuoc1->MaThuoc,
                        'SoLuong' => 15, // Tăng từ 10 lên 15
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '3 lần/ngày',
                        'ThoiGianDung' => '5 ngày',
                    ],
                    [
                        'MaThuoc' => $thuoc2->MaThuoc,
                        'SoLuong' => 1, // Giảm từ 3 xuống 1
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '1 lần/ngày',
                    ],
                ],
            ]);
            $req3_4->setUserResolver(fn() => $tkDocA);
            $res3_4 = $donThuocCtrl->update($req3_4, $dt1->MaDonThuoc);
            $data3_4 = json_decode($res3_4->getContent(), true);

            $t1SauSua = $thuoc1->fresh()->SoLuongTon; // 90 - 5 = 85
            $t2SauSua = $thuoc2->fresh()->SoLuongTon; // 2 + 2 = 4

            if ($res3_4->getStatusCode() === 200 && $t1SauSua === 85 && $t2SauSua === 4) {
                $this->info("   -> PASS: Sửa đơn thuốc thành công. Tồn kho tự động điều chỉnh chính xác (T1: 90->85, T2: 2->4)");
                $passed++;
            } else {
                $this->error("   -> FAIL: Sửa đơn thuốc tính sai delta tồn kho! T1: {$t1SauSua}, T2: {$t2SauSua}");
                $failed++;
            }

            // 3.5 Bệnh nhân 2 không thể xem đơn thuốc của Bệnh nhân 1 -> 403
            $this->line('3.5. Bảo mật: Bệnh nhân 2 cố xem đơn thuốc của Bệnh nhân 1 (403)...');
            $req3_5 = Request::create("/prescriptions/{$dt1->MaDonThuoc}", 'GET');
            $req3_5->setUserResolver(fn() => $tkPat2);
            $res3_5 = $donThuocCtrl->show($req3_5, $dt1->MaDonThuoc);

            if ($res3_5->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bệnh nhân 2 xem đơn thuốc Bệnh nhân 1 (403)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bệnh nhân 2 xem được đơn thuốc người khác!');
                $failed++;
            }

            // 3.6 HỦY ĐƠN THUỐC LẦN 1 (Hoàn kho đầy đủ)
            $this->line('3.6. Bác sĩ A hủy đơn thuốc lần 1 & kiểm tra hoàn trả số lượng tồn kho...');
            $req3_6 = Request::create("/doctor/prescriptions/{$dt1->MaDonThuoc}/cancel", 'POST');
            $req3_6->setUserResolver(fn() => $tkDocA);
            $res3_6 = $donThuocCtrl->cancel($req3_6, $dt1->MaDonThuoc);

            $t1SauHuy = $thuoc1->fresh()->SoLuongTon; // 85 + 15 = 100
            $t2SauHuy = $thuoc2->fresh()->SoLuongTon; // 4 + 1 = 5

            if ($res3_6->getStatusCode() === 200 && $t1SauHuy === 100 && $t2SauHuy === 5 && $dt1->fresh()->TrangThai === 'DA_HUY') {
                $this->info('   -> PASS: Hủy đơn thuốc lần 1 thành công. Tồn kho hoàn trả đầy đủ (T1: 100, T2: 5)');
                $passed++;
            } else {
                $this->error("   -> FAIL: Hoàn trả kho thất bại! T1: {$t1SauHuy}, T2: {$t2SauHuy}");
                $failed++;
            }

            // 3.7 HỦY ĐƠN THUỐC LẦN 2 (Kiểm tra Idempotency - Không được hoàn kho lần 2)
            $this->line('3.7. Kiểm tra Idempotency: Hủy đơn thuốc lần 2 (chặn 422, không hoàn kho lần 2)...');
            $req3_7 = Request::create("/doctor/prescriptions/{$dt1->MaDonThuoc}/cancel", 'POST');
            $req3_7->setUserResolver(fn() => $tkDocA);
            $res3_7 = $donThuocCtrl->cancel($req3_7, $dt1->MaDonThuoc);

            $t1SauHuy2 = $thuoc1->fresh()->SoLuongTon;
            $t2SauHuy2 = $thuoc2->fresh()->SoLuongTon;

            if ($res3_7->getStatusCode() === 422 && $t1SauHuy2 === 100 && $t2SauHuy2 === 5) {
                $this->info('   -> PASS: Chặn thành công hủy đơn lần 2 (422) và tồn kho giữ nguyên 100%, chống gian lận hoàn kho');
                $passed++;
            } else {
                $this->error("   -> FAIL: Lỗi Idempotency hủy đơn! Code: {$res3_7->getStatusCode()}, T1: {$t1SauHuy2}");
                $failed++;
            }

            // =========================================================
            // BƯỚC 4: KIỂM THỬ ChiDinhDichVuController
            // =========================================================
            $this->info('');
            $this->info('--- BƯỚC 4: CHI DINH DICH VU CONTROLLER ---');

            $dvTest = DichVu::create([
                'TenDichVu' => 'Nội soi dạ dày test ' . time(),
                'DonGia' => 350000,
                'MoTa' => 'Nội soi chẩn đoán viêm loét dạ dày',
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdServices[] = $dvTest->MaDichVu;

            // 4.1 Bác sĩ B cố chỉ định dịch vụ cho lượt khám của Bác sĩ A -> 403
            $this->line('4.1. Bảo mật: Bác sĩ B cố chỉ định dịch vụ cho lượt khám của Bác sĩ A (403)...');
            $req4_1 = Request::create('/doctor/service-requests', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'MaDichVu' => $dvTest->MaDichVu,
            ]);
            $req4_1->setUserResolver(fn() => $tkDocB);
            $res4_1 = $chiDinhCtrl->store($req4_1);

            if ($res4_1->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bác sĩ B chỉ định dịch vụ cho Bác sĩ A (403)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ B chỉ định được dịch vụ trái quyền!');
                $failed++;
            }

            // 4.2 Bác sĩ A chỉ định dịch vụ cho lượt khám
            $this->line('4.2. Bác sĩ A chỉ định dịch vụ Nội soi dạ dày (350.000đ)...');
            $req4_2 = Request::create('/doctor/service-requests', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'MaDichVu' => $dvTest->MaDichVu,
                'GhiChu' => 'Nội soi không gây mê, kiểm tra vi khuẩn HP',
            ]);
            $req4_2->setUserResolver(fn() => $tkDocA);
            $res4_2 = $chiDinhCtrl->store($req4_2);
            $data4_2 = json_decode($res4_2->getContent(), true);

            if ($res4_2->getStatusCode() === 201 && $data4_2['success'] === true) {
                $cd1 = ChiDinhDichVu::find($data4_2['data']['MaChiDinh']);
                $createdServiceRequests[] = $cd1->MaChiDinh;
                if ((float)$cd1->DonGia === 350000.0 && $cd1->TrangThai === 'CHO_THUC_HIEN') {
                    $this->info("   -> PASS: Chỉ định dịch vụ thành công [Mã CĐ: {$cd1->MaChiDinh}, Đơn giá: {$cd1->DonGia}, Trạng thái: CHO_THUC_HIEN]");
                    $passed++;
                } else {
                    $this->error('   -> FAIL: Thông tin chỉ định không khớp: ' . json_encode($cd1));
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Chỉ định dịch vụ thất bại: ' . $res4_2->getContent());
                $failed++;
                return 1;
            }

            // 4.3 Phân quyền: Lễ tân cố nhập kết quả kỹ thuật dịch vụ (403)
            $this->line('4.3. Phân quyền: Lễ tân cố cập nhật kết quả dịch vụ kỹ thuật (403)...');
            $req4_3 = Request::create("/doctor/service-requests/{$cd1->MaChiDinh}/result", 'POST', [
                'KetQua' => 'Kết quả do lễ tân gõ',
            ]);
            $req4_3->setUserResolver(fn() => $receptionistUser);
            $res4_3 = $chiDinhCtrl->updateResult($req4_3, $cd1->MaChiDinh);

            if ($res4_3->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Lễ tân cập nhật kết quả dịch vụ (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Lễ tân cập nhật được kết quả dịch vụ!');
                $failed++;
            }

            // 4.4 Bác sĩ A cập nhật kết quả dịch vụ
            $this->line('4.4. Bác sĩ A cập nhật kết quả dịch vụ chuẩn y khoa...');
            $req4_4 = Request::create("/doctor/service-requests/{$cd1->MaChiDinh}/result", 'POST', [
                'KetQua' => 'Dạ dày có vết trợt đỏ niêm mạc vùng hang vị, HP âm tính (-)',
            ]);
            $req4_4->setUserResolver(fn() => $tkDocA);
            $res4_4 = $chiDinhCtrl->updateResult($req4_4, $cd1->MaChiDinh);

            $cd1Fresh = $cd1->fresh();
            if ($res4_4->getStatusCode() === 200 && $cd1Fresh->TrangThai === 'HOAN_THANH' && !empty($cd1Fresh->NgayThucHien)) {
                $this->info("   -> PASS: Cập nhật kết quả dịch vụ thành công [Trạng thái: HOAN_THANH, Ngày thực hiện: {$cd1Fresh->NgayThucHien}]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Cập nhật kết quả thất bại: ' . $res4_3->getContent());
                $failed++;
            }

            // 4.5 Bệnh nhân 2 cố xem chỉ định của Bệnh nhân 1 -> 403
            $this->line('4.5. Bảo mật: Bệnh nhân 2 cố xem chỉ định dịch vụ của Bệnh nhân 1 (403)...');
            $req4_5 = Request::create("/service-requests/{$cd1->MaChiDinh}", 'GET');
            $req4_5->setUserResolver(fn() => $tkPat2);
            $res4_5 = $chiDinhCtrl->show($req4_5, $cd1->MaChiDinh);

            if ($res4_5->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bệnh nhân 2 xem chỉ định dịch vụ của Bệnh nhân 1 (403)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bệnh nhân 2 xem được chỉ định của người khác!');
                $failed++;
            }

            // 1.7 Hoàn thành lượt khám
            $this->line('1.7. Bác sĩ A hoàn thành lượt khám...');
            $req1_7 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/complete", 'POST');
            $req1_7->setUserResolver(fn() => $tkDocA);
            $res1_7 = $luotKhamCtrl->completeExamine($req1_7, $visit1->MaLuotKham);

            if ($res1_7->getStatusCode() === 200 && $visit1->fresh()->TrangThai === 'HOAN_THANH' && $lh1->fresh()->TrangThai === 'HOAN_THANH') {
                $this->info('   -> PASS: Hoàn thành lượt khám thành công. Lượt khám & Lịch hẹn đều chuyển HOAN_THANH.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Hoàn thành lượt khám thất bại: ' . $res1_7->getContent());
                $failed++;
            }

            // 1.8 CHẶN CHỈNH SỬA SAU KHI LƯỢT KHÁM ĐÃ HOÀN THÀNH
            $this->line('1.8. Khóa dữ liệu: Chặn sửa phiếu khám, kê thêm thuốc, hoặc chỉ định dịch vụ sau khi lượt khám đã hoàn thành...');
            
            // Cố sửa phiếu khám
            $reqLockPK = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => 'Sửa sau hoàn thành',
                'ChanDoan' => 'Chẩn đoán sửa',
            ]);
            $reqLockPK->setUserResolver(fn() => $tkDocA);
            $resLockPK = $luotKhamCtrl->savePhieuKham($reqLockPK, $visit1->MaLuotKham);

            // Cố kê đơn thuốc mới
            $reqLockDT = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'items' => [['MaThuoc' => $thuoc1->MaThuoc, 'SoLuong' => 1, 'LieuDung' => '1', 'TanSuat' => '1']],
            ]);
            $reqLockDT->setUserResolver(fn() => $tkDocA);
            $resLockDT = $donThuocCtrl->store($reqLockDT);

            // Cố chỉ định dịch vụ mới
            $reqLockCD = Request::create('/doctor/service-requests', 'POST', [
                'MaLuotKham' => $visit1->MaLuotKham,
                'MaDichVu' => $dvTest->MaDichVu,
            ]);
            $reqLockCD->setUserResolver(fn() => $tkDocA);
            $resLockCD = $chiDinhCtrl->store($reqLockCD);

            if ($resLockPK->getStatusCode() === 422 && $resLockDT->getStatusCode() === 422 && $resLockCD->getStatusCode() === 422) {
                $this->info('   -> PASS: Khóa bảo vệ thành công: Chặn toàn bộ thao tác sửa phiếu khám, kê đơn và chỉ định dịch vụ sau khi hoàn thành lượt khám (422)');
                $passed++;
            } else {
                $this->error("   -> FAIL: Không khóa được lượt khám đã hoàn thành! PK: {$resLockPK->getStatusCode()}, DT: {$resLockDT->getStatusCode()}, CD: {$resLockCD->getStatusCode()}");
                $failed++;
            }

        } catch (\Throwable $e) {
            $this->error('LỖI KHÔNG MONG MUỐN: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            $failed++;
        } finally {
            // =========================================================
            // DỌN DẸP DỮ LIỆU TEST (BẢO TOÀN DATABASE THẬT)
            // =========================================================
            $this->info('');
            $this->info('--- DỌN DẸP DỮ LIỆU TEST ---');

            if (!empty($createdServiceRequests)) {
                ChiDinhDichVu::whereIn('MaChiDinh', $createdServiceRequests)->delete();
                $this->line('   -> Đã xóa chỉ định dịch vụ test: ' . implode(', ', $createdServiceRequests));
            }
            if (!empty($createdPrescriptions)) {
                ChiTietDonThuoc::whereIn('MaDonThuoc', $createdPrescriptions)->delete();
                DonThuoc::whereIn('MaDonThuoc', $createdPrescriptions)->delete();
                $this->line('   -> Đã xóa đơn thuốc & chi tiết test: ' . implode(', ', $createdPrescriptions));
            }
            if (!empty($createdMedicalRecords)) {
                PhieuKham::whereIn('MaPhieuKham', $createdMedicalRecords)->delete();
                $this->line('   -> Đã xóa phiếu khám test: ' . implode(', ', $createdMedicalRecords));
            }
            if (!empty($createdVisits)) {
                LuotKham::whereIn('MaLuotKham', $createdVisits)->delete();
                $this->line('   -> Đã xóa lượt khám test: ' . implode(', ', $createdVisits));
            }
            if (!empty($createdAppointments)) {
                LichHen::whereIn('MaLichHen', $createdAppointments)->delete();
                $this->line('   -> Đã xóa lịch hẹn test: ' . implode(', ', $createdAppointments));
            }
            if (!empty($createdSlots)) {
                CaKham::whereIn('MaCaKham', $createdSlots)->delete();
                $this->line('   -> Đã xóa ca khám test: ' . implode(', ', $createdSlots));
            }
            if (!empty($createdSchedules)) {
                LichLamViec::whereIn('MaLichLamViec', $createdSchedules)->delete();
                $this->line('   -> Đã xóa lịch làm việc test: ' . implode(', ', $createdSchedules));
            }
            if (!empty($createdMedicines)) {
                Thuoc::whereIn('MaThuoc', $createdMedicines)->delete();
                $this->line('   -> Đã xóa thuốc test: ' . implode(', ', $createdMedicines));
            }
            if (!empty($createdServices)) {
                DichVu::whereIn('MaDichVu', $createdServices)->delete();
                $this->line('   -> Đã xóa dịch vụ test: ' . implode(', ', $createdServices));
            }
            if (!empty($createdPatients)) {
                BenhNhan::whereIn('MaBenhNhan', $createdPatients)->delete();
                $this->line('   -> Đã xóa bệnh nhân test: ' . implode(', ', $createdPatients));
            }
            if (!empty($createdDoctors)) {
                BacSi::whereIn('MaBacSi', $createdDoctors)->delete();
                $this->line('   -> Đã xóa bác sĩ test: ' . implode(', ', $createdDoctors));
            }
            if (!empty($createdAccounts)) {
                TaiKhoan::whereIn('MaTaiKhoan', $createdAccounts)->delete();
                $this->line('   -> Đã xóa tài khoản test: ' . implode(', ', $createdAccounts));
            }
        }

        $this->info('');
        $this->info('================================================================');
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 3.4: PASS: {$passed} | FAIL: {$failed}");
        $this->info('================================================================');
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
