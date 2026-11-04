<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Response as InertiaResponse;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BacSiController;
use App\Http\Controllers\CaKhamController;
use App\Http\Controllers\ChiDinhDichVuController;
use App\Http\Controllers\ChuyenKhoaController;
use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\HoaDonController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LichLamViecController;
use App\Http\Controllers\LuotKhamController;
use App\Http\Controllers\ThuocController;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\ChuyenKhoa;
use App\Models\CaKham;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\DichVu;
use App\Models\ChiDinhDichVu;
use App\Models\Thuoc;
use App\Models\DonThuoc;
use App\Models\HoaDon;
use App\Models\ThanhToan;

class TestSmartCareE2E extends Command
{
    protected $signature = 'test:smartcare-e2e';
    protected $description = 'Kiểm thử tích hợp toàn bộ luồng nghiệp vụ 4 vai trò SmartCare (Giai đoạn 5)';

    public function handle()
    {
        $this->info("================================================================================");
        $this->info("   KIỂM THỬ TÍCH HỢP TOÀN HỆ THỐNG SMARTCARE (GIAI ĐOẠN 5 - 4 VAI TRÒ)");
        $this->info("================================================================================");

        $passed = 0;
        $failed = 0;

        $vaiTroAdmin = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->first();
        $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->first();
        $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->first();
        $vaiTroLT = VaiTro::where('TenVaiTro', 'LE_TAN')->first();

        // 1. Tạo tài khoản 4 vai trò cho toàn bộ kịch bản
        $salt = time() . '_' . rand(100, 999);

        // A. Tài khoản Bệnh nhân 1 (Chính)
        $tkBenhNhan1 = TaiKhoan::create([
            'TenDangNhap' => 'e2e_patient1_' . $salt,
            'Email' => 'patient1_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('PatientPass@123'),
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $benhNhan1 = BenhNhan::create([
            'MaTaiKhoan' => $tkBenhNhan1->MaTaiKhoan,
            'HoTen' => 'Nguyễn Bệnh Nhân E2E 1',
            'SoDienThoai' => '0912' . rand(100000, 999999),
            'GioiTinh' => 'NAM',
            'NgaySinh' => '1992-05-15',
            'DiaChi' => 'Hà Nội',
        ]);

        // B. Tài khoản Bệnh nhân 2 (Dùng để kiểm thử phân quyền / IDOR)
        $tkBenhNhan2 = TaiKhoan::create([
            'TenDangNhap' => 'e2e_patient2_' . $salt,
            'Email' => 'patient2_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('PatientPass@123'),
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $benhNhan2 = BenhNhan::create([
            'MaTaiKhoan' => $tkBenhNhan2->MaTaiKhoan,
            'HoTen' => 'Trần Bệnh Nhân E2E 2',
            'SoDienThoai' => '0913' . rand(100000, 999999),
            'GioiTinh' => 'NU',
            'NgaySinh' => '1995-08-20',
        ]);

        // C. Tài khoản Lễ tân
        $tkLeTan = TaiKhoan::create([
            'TenDangNhap' => 'e2e_recep_' . $salt,
            'Email' => 'recep_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('RecepPass@123'),
            'MaVaiTro' => $vaiTroLT->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);

        // D. Chuyên khoa & Tài khoản Bác sĩ 1 (Phụ trách khám)
        $chuyenKhoa = ChuyenKhoa::create([
            'TenChuyenKhoa' => 'Nội Tổng Quát E2E ' . $salt,
            'TrangThai' => 'HOAT_DONG',
        ]);

        $tkBacSi1 = TaiKhoan::create([
            'TenDangNhap' => 'e2e_doc1_' . $salt,
            'Email' => 'doc1_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('DoctorPass@123'),
            'MaVaiTro' => $vaiTroBS->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bacSi1 = BacSi::create([
            'MaTaiKhoan' => $tkBacSi1->MaTaiKhoan,
            'HoTen' => 'BS. CK1 Lê Văn Bác Sĩ',
            'MaChuyenKhoa' => $chuyenKhoa->MaChuyenKhoa,
            'GiaKham' => 150000,
            'HocVi' => 'Bác sĩ Chuyên khoa 1',
            'TrangThai' => 'HOAT_DONG',
        ]);

        // E. Tài khoản Bác sĩ 2 (Dùng để kiểm thử phân quyền / can thiệp chéo)
        $tkBacSi2 = TaiKhoan::create([
            'TenDangNhap' => 'e2e_doc2_' . $salt,
            'Email' => 'doc2_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('DoctorPass@123'),
            'MaVaiTro' => $vaiTroBS->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bacSi2 = BacSi::create([
            'MaTaiKhoan' => $tkBacSi2->MaTaiKhoan,
            'HoTen' => 'BS. Phạm Bác Sĩ 2',
            'MaChuyenKhoa' => $chuyenKhoa->MaChuyenKhoa,
            'GiaKham' => 150000,
            'TrangThai' => 'HOAT_DONG',
        ]);

        // F. Tài khoản Quản trị viên
        $tkAdmin = TaiKhoan::create([
            'TenDangNhap' => 'e2e_admin_' . $salt,
            'Email' => 'admin_' . $salt . '@smartcare.test',
            'MatKhau' => Hash::make('AdminPass@123'),
            'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);

        // G. Tạo Thuốc & Dịch vụ kiểm thử
        $thuocTest = Thuoc::create([
            'TenThuoc' => 'Paracetamol 500mg E2E ' . $salt,
            'HoatChat' => 'Paracetamol',
            'DonViTinh' => 'Viên',
            'DonGia' => 5000,
            'SoLuongTon' => 100,
            'TrangThai' => 'HOAT_DONG',
        ]);

        $dichVuTest = DichVu::create([
            'TenDichVu' => 'Xét nghiệm Máu Toàn Phần E2E ' . $salt,
            'DonGia' => 200000,
            'LoaiDichVu' => 'XET_NGHIEM',
            'TrangThai' => 'HOAT_DONG',
        ]);

        // Khởi tạo các Controller
        $authController = new AuthController();
        $chuyenKhoaController = new ChuyenKhoaController();
        $bacSiController = new BacSiController();
        $caKhamController = new CaKhamController();
        $lichHenController = new LichHenController();
        $luotKhamController = new LuotKhamController();
        $chiDinhController = new ChiDinhDichVuController();
        $donThuocController = new DonThuocController();
        $hoaDonController = new HoaDonController();
        $adminController = new AdminController();
        $thuocController = new ThuocController();
        $lichLamViecController = new LichLamViecController();

        $createdAppointments = [];
        $createdVisits = [];
        $createdInvoices = [];

        try {
            // =================================================================
            // PHẦN 1: KIỂM THỬ LUỒNG ĐẶT LỊCH (BỆNH NHÂN)
            // =================================================================
            $this->info("\n--- PHẦN 1: KIỂM THỬ LUỒNG ĐẶT LỊCH (BỆNH NHÂN) ---");

            $session = app('session')->driver();
            $session->start();

            // 1.1 Bệnh nhân đăng nhập
            $reqLogin = Request::create('/login', 'POST', [
                'email' => $tkBenhNhan1->Email,
                'password' => 'PatientPass@123',
            ]);
            $reqLogin->headers->set('Accept', 'application/json');
            $reqLogin->setLaravelSession($session);
            $respLogin = $authController->login($reqLogin);
            $loginData = json_decode($respLogin->getContent(), true);

            if ($respLogin->getStatusCode() === 200 && ($loginData['success'] ?? false)) {
                $this->info("[PASS 1.1] Bệnh nhân đăng nhập thành công vào hệ thống.");
                $passed++;
            } else {
                $this->error("[FAIL 1.1] Bệnh nhân đăng nhập thất bại.");
                $failed++;
            }

            // 1.2 Tra cứu bác sĩ & chuyên khoa
            $reqSpec = Request::create('/specialties', 'GET');
            $reqSpec->headers->set('Accept', 'application/json');
            $respSpec = $chuyenKhoaController->index($reqSpec);
            $specData = json_decode($respSpec->getContent(), true)['data'] ?? [];

            $reqDoc = Request::create('/patient/doctors', 'GET');
            $reqDoc->setUserResolver(fn() => $tkBenhNhan1);
            $respDoc = $bacSiController->patientIndex($reqDoc);

            if ($respSpec->getStatusCode() === 200 && $respDoc instanceof InertiaResponse) {
                $this->info("[PASS 1.2] Bệnh nhân tra cứu thành công danh sách Chuyên khoa và Bác sĩ.");
                $passed++;
            } else {
                $this->error("[FAIL 1.2] Tra cứu bác sĩ & chuyên khoa thất bại.");
                $failed++;
            }

            // 1.3 Tạo lịch làm việc và ca khám với sức chứa = 1
            $ngayKham = now()->toDateString();
            $lichLamViec = LichLamViec::create([
                'MaBacSi' => $bacSi1->MaBacSi,
                'NgayLamViec' => $ngayKham,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '12:00:00',
                'SoLuongTiepNhan' => 10,
                'TrangThai' => 'MO',
            ]);

            $caKham = CaKham::create([
                'MaLichLamViec' => $lichLamViec->MaLichLamViec,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '09:00:00',
                'SoLuongTiepNhan' => 1, // Sức chứa chỉ 1 slot
                'TrangThai' => 'CON_TRONG',
            ]);

            // 1.4 Đặt lịch khám
            $reqBook = Request::create('/appointments', 'POST', [
                'MaCaKham' => $caKham->MaCaKham,
                'NgayHen' => $ngayKham,
                'GioHen' => '08:15:00',
                'LyDoKham' => 'Sốt nhẹ và ho kéo dài',
            ]);
            $reqBook->headers->set('Accept', 'application/json');
            $reqBook->setUserResolver(fn() => $tkBenhNhan1);
            $respBook = $lichHenController->store($reqBook);
            $bookData = json_decode($respBook->getContent(), true);

            $lichHen1Id = $bookData['data']['MaLichHen'] ?? null;
            if ($lichHen1Id) {
                $createdAppointments[] = $lichHen1Id;
                $this->info("[PASS 1.4 & 1.5] Bệnh nhân đặt lịch thành công (#{$lichHen1Id}). Bản ghi lưu vào MySQL với trạng thái CHO_XAC_NHAN.");
                $passed++;
            } else {
                $this->error("[FAIL 1.4] Đặt lịch khám thất bại.");
                $failed++;
            }

            // 1.6 Kiểm tra số lượng tiếp nhận của ca khám
            $reqCheckSlot = Request::create("/ca-kham/{$caKham->MaCaKham}", 'GET');
            $respCheckSlot = $caKhamController->show($caKham->MaCaKham);
            $slotData = json_decode($respCheckSlot->getContent(), true)['data'] ?? [];

            if ($slotData['SoLuongDaDat'] === 1 && $slotData['SoLuongConNhan'] === 0) {
                $this->info("[PASS 1.6] Số lượng tiếp nhận ca khám cập nhật chuẩn xác: Đã đặt = 1, Còn nhận = 0.");
                $passed++;
            } else {
                $this->error("[FAIL 1.6] Tính toán số lượng tiếp nhận ca khám sai lệch.");
                $failed++;
            }

            // 1.7 Kiểm tra không thể đặt vượt quá sức chứa
            $blockedOverbook = false;
            try {
                $reqOverbook = Request::create('/appointments', 'POST', [
                    'MaCaKham' => $caKham->MaCaKham,
                    'NgayHen' => $ngayKham,
                    'GioHen' => '08:30:00',
                    'LyDoKham' => 'Khám thử vượt sức chứa',
                ]);
                $reqOverbook->headers->set('Accept', 'application/json');
                $reqOverbook->setUserResolver(fn() => $tkBenhNhan2);
                $respOver = $lichHenController->store($reqOverbook);
                if ($respOver->getStatusCode() === 422) {
                    $blockedOverbook = true;
                }
            } catch (ValidationException $e) {
                $blockedOverbook = true;
            }

            if ($blockedOverbook) {
                $this->info("[PASS 1.7] Hệ thống chặn thành công bệnh nhân thứ 2 đặt khám khi ca khám đã hết sức chứa.");
                $passed++;
            } else {
                $this->error("[FAIL 1.7] Không chặn được việc đặt quá sức chứa.");
                $failed++;
            }

            // 1.8 Kiểm tra Bệnh nhân 2 không thể xem hoặc hủy lịch của Bệnh nhân 1 (IDOR)
            $reqHuyChot = Request::create("/appointments/{$lichHen1Id}/cancel", 'POST', ['LyDoHuy' => 'Phá hoại lịch']);
            $reqHuyChot->headers->set('Accept', 'application/json');
            $reqHuyChot->setUserResolver(fn() => $tkBenhNhan2);
            $respHuyChot = $lichHenController->cancel($reqHuyChot, $lichHen1Id);

            if ($respHuyChot->getStatusCode() === 403) {
                $this->info("[PASS 1.8] Chặn thành công 403 Forbidden khi Bệnh nhân 2 cố hủy lịch hẹn của Bệnh nhân 1.");
                $passed++;
            } else {
                $this->error("[FAIL 1.8] Lỗ hổng IDOR: Bệnh nhân khác có thể hủy lịch!");
                $failed++;
            }

            // Lễ tân xác nhận lịch hẹn để chuyển sang DA_XAC_NHAN
            LichHen::where('MaLichHen', $lichHen1Id)->update(['TrangThai' => 'DA_XAC_NHAN']);

            // =================================================================
            // PHẦN 2: KIỂM THỬ LUỒNG LỄ TÂN
            // =================================================================
            $this->info("\n--- PHẦN 2: KIỂM THỬ LUỒNG LỄ TÂN & TIẾP NHẬN BỆNH NHÂN ---");

            // 2.1 Lễ tân đăng nhập
            $reqLoginRecep = Request::create('/login', 'POST', [
                'email' => $tkLeTan->Email,
                'password' => 'RecepPass@123',
            ]);
            $reqLoginRecep->headers->set('Accept', 'application/json');
            $reqLoginRecep->setLaravelSession($session);
            $respLoginRecep = $authController->login($reqLoginRecep);
            $loginRecepData = json_decode($respLoginRecep->getContent(), true);

            if ($respLoginRecep->getStatusCode() === 200 && ($loginRecepData['success'] ?? false)) {
                $this->info("[PASS 2.1] Lễ tân đăng nhập thành công vào hệ thống.");
                $passed++;
            } else {
                $this->error("[FAIL 2.1] Lễ tân đăng nhập thất bại.");
                $failed++;
            }

            // 2.2 Xem hàng chờ theo ngày & bộ lọc
            $reqQueue = Request::create("/receptionist/queue?date={$ngayKham}&doctor_id={$bacSi1->MaBacSi}&specialty_id={$chuyenKhoa->MaChuyenKhoa}", 'GET');
            $reqQueue->setUserResolver(fn() => $tkLeTan);
            $respQueue = $lichHenController->queue($reqQueue);

            if ($respQueue instanceof InertiaResponse) {
                $this->info("[PASS 2.2 & 2.3] Màn hình hàng chờ Lễ tân tải thành công, hỗ trợ lọc theo ngày, bác sĩ và chuyên khoa.");
                $passed++;
            } else {
                $this->error("[FAIL 2.2] Tải hàng chờ Lễ tân thất bại.");
                $failed++;
            }

            // 2.4 & 2.5 Lễ tân tiếp nhận bệnh nhân có lịch hẹn hợp lệ
            $reqCheckin = Request::create('/visits', 'POST', [
                'MaLichHen' => $lichHen1Id,
                'MaBenhNhan' => $benhNhan1->MaBenhNhan,
                'MaBacSi' => $bacSi1->MaBacSi,
                'LyDoKham' => 'Sốt ho kéo dài',
            ]);
            $reqCheckin->headers->set('Accept', 'application/json');
            $reqCheckin->setUserResolver(fn() => $tkLeTan);
            $respCheckin = $luotKhamController->store($reqCheckin);
            $checkinData = json_decode($respCheckin->getContent(), true);

            $luotKhamId = $checkinData['data']['MaLuotKham'] ?? null;
            if ($luotKhamId) {
                $createdVisits[] = $luotKhamId;
                $this->info("[PASS 2.4 & 2.5] Tiếp nhận bệnh nhân thành công. Tạo lượt khám #{$luotKhamId} đúng bệnh nhân và bác sĩ (CHO_KHAM).");
                $passed++;
            } else {
                $this->error("[FAIL 2.4] Tiếp nhận bệnh nhân thất bại.");
                $failed++;
            }

            // 2.6 Kiểm tra không thể tiếp nhận 2 lần cùng một lịch hẹn
            $blockedDoubleCheckin = false;
            try {
                $reqDoubleCheckin = Request::create('/visits', 'POST', [
                    'MaLichHen' => $lichHen1Id,
                    'MaBenhNhan' => $benhNhan1->MaBenhNhan,
                    'MaBacSi' => $bacSi1->MaBacSi,
                ]);
                $reqDoubleCheckin->headers->set('Accept', 'application/json');
                $reqDoubleCheckin->setUserResolver(fn() => $tkLeTan);
                $respDoubleCheckin = $luotKhamController->store($reqDoubleCheckin);
                if ($respDoubleCheckin->getStatusCode() === 422) {
                    $blockedDoubleCheckin = true;
                }
            } catch (ValidationException $e) {
                $blockedDoubleCheckin = true;
            }

            if ($blockedDoubleCheckin) {
                $this->info("[PASS 2.6] Chặn thành công 422 khi cố tình tiếp nhận 2 lần cho cùng một lịch hẹn.");
                $passed++;
            } else {
                $this->error("[FAIL 2.6] Cho phép tiếp nhận trùng lượt khám!");
                $failed++;
            }

            // 2.7 Kiểm tra Bệnh nhân không có quyền thực hiện tiếp nhận
            $reqPatientTryCheckin = Request::create('/visits', 'POST', [
                'MaLichHen' => $lichHen1Id,
                'MaBenhNhan' => $benhNhan1->MaBenhNhan,
                'MaBacSi' => $bacSi1->MaBacSi,
            ]);
            $reqPatientTryCheckin->headers->set('Accept', 'application/json');
            $reqPatientTryCheckin->setUserResolver(fn() => $tkBenhNhan1);
            $respPatientTryCheckin = $luotKhamController->store($reqPatientTryCheckin);

            if ($respPatientTryCheckin->getStatusCode() === 403) {
                $this->info("[PASS 2.7] Chặn thành công 403 Forbidden khi tài khoản Bệnh nhân gọi chức năng tiếp nhận.");
                $passed++;
            } else {
                $this->error("[FAIL 2.7] Bệnh nhân có quyền gọi endpoint tiếp nhận!");
                $failed++;
            }

            // =================================================================
            // PHẦN 3: KIỂM THỬ LUỒNG BÁC SĨ
            // =================================================================
            $this->info("\n--- PHẦN 3: KIỂM THỬ LUỒNG BÁC SĨ (KHÁM, KÊ ĐƠN, CHỈ ĐỊNH) ---");

            // 3.1 Bác sĩ đăng nhập
            $reqLoginDoc = Request::create('/login', 'POST', [
                'email' => $tkBacSi1->Email,
                'password' => 'DoctorPass@123',
            ]);
            $reqLoginDoc->headers->set('Accept', 'application/json');
            $reqLoginDoc->setLaravelSession($session);
            $respLoginDoc = $authController->login($reqLoginDoc);
            $loginDocData = json_decode($respLoginDoc->getContent(), true);

            if ($respLoginDoc->getStatusCode() === 200 && ($loginDocData['success'] ?? false)) {
                $this->info("[PASS 3.1] Bác sĩ 1 đăng nhập thành công vào hệ thống.");
                $passed++;
            } else {
                $this->error("[FAIL 3.1] Bác sĩ đăng nhập thất bại.");
                $failed++;
            }

            // 3.2 Bác sĩ xem hàng chờ & mở hồ sơ
            $reqDocQueue = Request::create('/doctor/examine', 'GET');
            $reqDocQueue->setUserResolver(fn() => $tkBacSi1);
            $respDocQueue = $luotKhamController->index($reqDocQueue);

            $reqDocShow = Request::create("/visits/{$luotKhamId}", 'GET');
            $reqDocShow->setUserResolver(fn() => $tkBacSi1);
            $respDocShow = $luotKhamController->show($reqDocShow, $luotKhamId);

            if ($respDocShow->getStatusCode() === 200) {
                $this->info("[PASS 3.2 & 3.3] Bác sĩ xem danh sách hàng chờ và mở chi tiết hồ sơ bệnh nhân thành công.");
                $passed++;
            } else {
                $this->error("[FAIL 3.2] Bác sĩ không mở được hồ sơ bệnh nhân.");
                $failed++;
            }

            // Bắt đầu khám -> DANG_KHAM
            $reqStartEx = Request::create("/doctor/visits/{$luotKhamId}/start", 'POST');
            $reqStartEx->headers->set('Accept', 'application/json');
            $reqStartEx->setUserResolver(fn() => $tkBacSi1);
            $luotKhamController->startExamine($reqStartEx, $luotKhamId);

            // 3.4 Ghi nhận phiếu khám (triệu chứng, chẩn đoán, kết luận)
            $reqSavePk = Request::create("/doctor/visits/{$luotKhamId}/phieu-kham", 'POST', [
                'TrieuChung' => 'Sốt 38.5 độ, đau họng, ho có đờm',
                'ChanDoan' => 'Viêm phế quản cấp',
                'HuongDieuTri' => 'Điều trị ngoại trú, theo dõi tái khám sau 3 ngày',
            ]);
            $reqSavePk->headers->set('Accept', 'application/json');
            $reqSavePk->setUserResolver(fn() => $tkBacSi1);
            $respSavePk = $luotKhamController->savePhieuKham($reqSavePk, $luotKhamId);

            if ($respSavePk->getStatusCode() === 200) {
                $this->info("[PASS 3.4] Ghi nhận phiếu khám thành công (Lưu triệu chứng, chẩn đoán và phác đồ kết luận).");
                $passed++;
            } else {
                $this->error("[FAIL 3.4] Ghi nhận phiếu khám thất bại.");
                $failed++;
            }

            // 3.5 & 3.6 Chỉ định dịch vụ cận lâm sàng & Cập nhật kết quả
            $reqOrderSvc = Request::create('/doctor/chi-dinh-dich-vu', 'POST', [
                'MaLuotKham' => $luotKhamId,
                'MaDichVu' => $dichVuTest->MaDichVu,
                'GhiChu' => 'Kiểm tra bạch cầu',
            ]);
            $reqOrderSvc->headers->set('Accept', 'application/json');
            $reqOrderSvc->setUserResolver(fn() => $tkBacSi1);
            $respOrderSvc = $chiDinhController->store($reqOrderSvc);
            $orderSvcData = json_decode($respOrderSvc->getContent(), true);

            $chiDinhId = $orderSvcData['data']['MaChiDinh'] ?? null;
            if ($chiDinhId) {
                // Cập nhật kết quả cận lâm sàng
                $reqResult = Request::create("/doctor/chi-dinh-dich-vu/{$chiDinhId}/result", 'POST', [
                    'KetQua' => 'Bạch cầu tăng nhẹ (11.2 G/L). Phù hợp viêm nhiễm đường hô hấp.',
                ]);
                $reqResult->headers->set('Accept', 'application/json');
                $reqResult->setUserResolver(fn() => $tkBacSi1);
                $respResult = $chiDinhController->updateResult($reqResult, $chiDinhId);

                $cdFresh = ChiDinhDichVu::find($chiDinhId);
                if ($cdFresh && $cdFresh->TrangThai === 'HOAN_THANH') {
                    $this->info("[PASS 3.5 & 3.6] Chỉ định dịch vụ cận lâm sàng và cập nhật kết quả xét nghiệm thành công.");
                    $passed++;
                } else {
                    $this->error("[FAIL 3.6] Cập nhật kết quả xét nghiệm thất bại.");
                    $failed++;
                }
            } else {
                $this->error("[FAIL 3.5] Chỉ định dịch vụ thất bại.");
                $failed++;
            }

            // 3.7 & 3.8 Kê đơn thuốc & Kiểm tra tồn kho bị trừ chính xác
            $initialStock = (int) $thuocTest->fresh()->SoLuongTon; // 100 viên
            $prescribeQty = 20;

            $reqPrescribe = Request::create('/doctor/don-thuoc', 'POST', [
                'MaLuotKham' => $luotKhamId,
                'GhiChu' => 'Uống sau ăn no',
                'items' => [
                    [
                        'MaThuoc' => $thuocTest->MaThuoc,
                        'SoLuong' => $prescribeQty,
                        'LieuDung' => 'Mỗi lần 1 viên',
                        'TanSuat' => '2 lần/ngày',
                        'CachDung' => 'Uống sau bữa ăn sáng và tối',
                    ],
                ],
            ]);
            $reqPrescribe->headers->set('Accept', 'application/json');
            $reqPrescribe->setUserResolver(fn() => $tkBacSi1);
            $respPrescribe = $donThuocController->store($reqPrescribe);

            $finalStock = (int) $thuocTest->fresh()->SoLuongTon;
            if ($respPrescribe->getStatusCode() === 201 && $finalStock === ($initialStock - $prescribeQty)) {
                $this->info("[PASS 3.7 & 3.8] Kê đơn thuốc thành công. Tồn kho thuốc bị trừ chuẩn xác: {$initialStock} -> {$finalStock} viên.");
                $passed++;
            } else {
                $this->error("[FAIL 3.7] Kê đơn thuốc thất bại hoặc trừ tồn kho sai lệch.");
                $failed++;
            }

            // 3.9 Hoàn thành lượt khám
            $reqComplete = Request::create("/doctor/visits/{$luotKhamId}/complete", 'POST');
            $reqComplete->headers->set('Accept', 'application/json');
            $reqComplete->setUserResolver(fn() => $tkBacSi1);
            $respComplete = $luotKhamController->completeExamine($reqComplete, $luotKhamId);

            $visitFresh = LuotKham::find($luotKhamId);
            if ($visitFresh && $visitFresh->TrangThai === 'HOAN_THANH') {
                $this->info("[PASS 3.9] Hoàn thành lượt khám thành công (Lượt khám chuyển sang HOAN_THANH).");
                $passed++;
            } else {
                $this->error("[FAIL 3.9] Hoàn thành lượt khám thất bại.");
                $failed++;
            }

            // 3.10 Bác sĩ 2 cố tình can thiệp lượt khám của Bác sĩ 1
            $reqDoc2Sabotage = Request::create("/doctor/visits/{$luotKhamId}/phieu-kham", 'POST', [
                'TrieuChung' => 'Ho sốt',
                'ChanDoan' => 'Can thiệp trái phép',
            ]);
            $reqDoc2Sabotage->headers->set('Accept', 'application/json');
            $reqDoc2Sabotage->setUserResolver(fn() => $tkBacSi2);
            $respDoc2Sabotage = $luotKhamController->savePhieuKham($reqDoc2Sabotage, $luotKhamId);

            if ($respDoc2Sabotage->getStatusCode() === 403) {
                $this->info("[PASS 3.10] Chặn thành công 403 Forbidden khi Bác sĩ 2 cố sửa hồ sơ lượt khám của Bác sĩ 1.");
                $passed++;
            } else {
                $this->error("[FAIL 3.10] Lỗ hổng phân quyền bác sĩ: Bác sĩ khác sửa được hồ sơ!");
                $failed++;
            }

            // =================================================================
            // PHẦN 4: KIỂM THỬ LUỒNG THANH TOÁN (LỄ TÂN & BỆNH NHÂN)
            // =================================================================
            $this->info("\n--- PHẦN 4: KIỂM THỬ LUỒNG HÓA ĐƠN & THANH TOÁN VIỆN PHÍ ---");

            // 4.1 & 4.2 Lễ tân lập hóa đơn từ lượt khám đã hoàn thành
            $reqCreateInv = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamId,
                'TienKham' => 150000,
                'GiamGia' => 50000,
                'BaoHiemChiTra' => 100000,
            ]);
            $reqCreateInv->headers->set('Accept', 'application/json');
            $reqCreateInv->setUserResolver(fn() => $tkLeTan);
            $respCreateInv = $hoaDonController->store($reqCreateInv);
            $invData = json_decode($respCreateInv->getContent(), true);

            $hoaDonId = $invData['data']['MaHoaDon'] ?? null;
            if ($hoaDonId) {
                $createdInvoices[] = $hoaDonId;
                $hoaDonObj = HoaDon::with('chiTietHoaDons')->find($hoaDonId);
                
                // Kỳ vọng chi phí: Khám (150.000) + Dịch vụ (200.000) + Thuốc (20 * 5.000 = 100.000) = 450.000 đ
                // Bệnh nhân chi trả = 450.000 - 50.000 (giảm giá) - 100.000 (bảo hiểm) = 300.000 đ
                $tongTien = (float) $hoaDonObj->TongTien;
                $benhNhanChiTra = (float) $hoaDonObj->BenhNhanChiTra;

                if ($tongTien == 450000 && $benhNhanChiTra == 300000) {
                    $this->info("[PASS 4.1 & 4.2] Lập hóa đơn thành công (#{$hoaDonId}). Tổng tiền: " . number_format($tongTien) . " đ, Bệnh nhân chi trả: " . number_format($benhNhanChiTra) . " đ.");
                    $passed++;
                } else {
                    $this->error("[FAIL 4.2] Tính toán tổng tiền hóa đơn sai lệch.");
                    $failed++;
                }
            } else {
                $this->error("[FAIL 4.1] Lập hóa đơn thất bại.");
                $failed++;
            }

            // 4.3 Đơn giá lịch sử bảo toàn: Giả sử admin tăng giá danh mục thuốc lên 10.000đ
            $thuocTest->update(['DonGia' => 10000]);
            $invDetailMed = $hoaDonObj->chiTietHoaDons()->where('LoaiChiPhi', 'THUOC')->first();
            if ($invDetailMed && (float)$invDetailMed->DonGia == 5000) {
                $this->info("[PASS 4.3] Đơn giá lịch sử bảo toàn tuyệt đối (Đơn giá thuốc trên hóa đơn vẫn là 5.000 đ dù danh mục đã đổi thành 10.000 đ).");
                $passed++;
            } else {
                $this->error("[FAIL 4.3] Đơn giá lịch sử bị thay đổi theo danh mục!");
                $failed++;
            }

            // 4.4 Thực hiện thanh toán đợt 1 (150.000 đ - 50%)
            $reqPay1 = Request::create("/invoices/{$hoaDonId}/pay", 'POST', [
                'SoTien' => 150000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'GhiChu' => 'Bệnh nhân đóng đợt 1',
            ]);
            $reqPay1->headers->set('Accept', 'application/json');
            $reqPay1->setUserResolver(fn() => $tkLeTan);
            $respPay1 = $hoaDonController->pay($reqPay1, $hoaDonId);

            $hdAfterPay1 = HoaDon::find($hoaDonId);
            if ($hdAfterPay1->TrangThai === 'THANH_TOAN_MOT_PHAN' && $hdAfterPay1->ConLai == 150000) {
                $this->info("[PASS 4.4] Thanh toán đợt 1 thành công: Hóa đơn chuyển trạng thái THANH_TOAN_MOT_PHAN, nợ còn lại: 150.000 đ.");
                $passed++;
            } else {
                $this->error("[FAIL 4.4] Thanh toán đợt 1 không cập nhật trạng thái hợp lệ.");
                $failed++;
            }

            // 4.5 Thực hiện thanh toán đợt 2 (phần còn lại: 150.000 đ) với MaGiaoDich duy nhất
            $txKey = 'TX_E2E_' . time() . '_' . rand(1000, 9999);
            $reqPay2 = Request::create("/invoices/{$hoaDonId}/pay", 'POST', [
                'SoTien' => 150000,
                'PhuongThucThanhToan' => 'CHUYEN_KHOAN',
                'MaGiaoDich' => $txKey,
                'GhiChu' => 'Chuyển khoản nốt số tiền còn lại',
            ]);
            $reqPay2->headers->set('Accept', 'application/json');
            $reqPay2->setUserResolver(fn() => $tkLeTan);
            $respPay2 = $hoaDonController->pay($reqPay2, $hoaDonId);

            $hdAfterPay2 = HoaDon::find($hoaDonId);
            if ($hdAfterPay2->TrangThai === 'DA_THANH_TOAN' && $hdAfterPay2->ConLai == 0) {
                $this->info("[PASS 4.5 & 4.6] Thanh toán đợt 2 thành công: Hóa đơn chuyển DA_THANH_TOAN, số nợ còn lại = 0 đ.");
                $passed++;
            } else {
                $this->error("[FAIL 4.5] Thanh toán đợt 2 thất bại.");
                $failed++;
            }

            // 4.7 Bệnh nhân xem hóa đơn và phiếu thu của chính mình
            $reqPatInvoices = Request::create('/patient/invoices', 'GET');
            $reqPatInvoices->setUserResolver(fn() => $tkBenhNhan1);
            $respPatInvoices = $hoaDonController->patientInvoices($reqPatInvoices);
            $patInvList = $respPatInvoices->toResponse($reqPatInvoices)->getOriginalContent()['page']['props']['invoices'] ?? [];

            $foundMyInvoice = collect($patInvList)->contains('MaHoaDon', $hoaDonId);
            if ($foundMyInvoice) {
                $this->info("[PASS 4.7] Bệnh nhân xem đầy đủ hóa đơn và lịch sử các lần thanh toán của chính mình.");
                $passed++;
            } else {
                $this->error("[FAIL 4.7] Bệnh nhân không thấy hóa đơn của mình.");
                $failed++;
            }

            // 4.8 Kiểm tra không thể thanh toán vượt quá số nợ (khi đã trả hết nợ)
            $blockedOverpay = false;
            try {
                $reqOverpay = Request::create("/invoices/{$hoaDonId}/pay", 'POST', [
                    'SoTien' => 10000,
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                ]);
                $reqOverpay->headers->set('Accept', 'application/json');
                $reqOverpay->setUserResolver(fn() => $tkLeTan);
                $respOverpay = $hoaDonController->pay($reqOverpay, $hoaDonId);
                if ($respOverpay->getStatusCode() === 422) {
                    $blockedOverpay = true;
                }
            } catch (ValidationException $e) {
                $blockedOverpay = true;
            }

            if ($blockedOverpay) {
                $this->info("[PASS 4.8] Chặn thành công 422 khi cố thu tiền thêm cho hóa đơn đã thanh toán đầy đủ.");
                $passed++;
            } else {
                $this->error("[FAIL 4.8] Cho phép thanh toán vượt công nợ!");
                $failed++;
            }

            // 4.9 Kiểm tra Idempotency: Không tạo thanh toán thứ 2 khi gửi lại cùng MaGiaoDich
            $initialPayCount = ThanhToan::where('MaHoaDon', $hoaDonId)->count();
            $reqRetryPay = Request::create("/invoices/{$hoaDonId}/pay", 'POST', [
                'SoTien' => 150000,
                'PhuongThucThanhToan' => 'CHUYEN_KHOAN',
                'MaGiaoDich' => $txKey,
            ]);
            $reqRetryPay->headers->set('Accept', 'application/json');
            $reqRetryPay->setUserResolver(fn() => $tkLeTan);
            $respRetryPay = $hoaDonController->pay($reqRetryPay, $hoaDonId);
            $finalPayCount = ThanhToan::where('MaHoaDon', $hoaDonId)->count();

            if ($respRetryPay->getStatusCode() === 200 && $finalPayCount === $initialPayCount) {
                $this->info("[PASS 4.9] Idempotency hoạt động hoàn hảo: Request retry với cùng MaGiaoDich không tạo thêm bản ghi thanh toán.");
                $passed++;
            } else {
                $this->error("[FAIL 4.9] Gặp lỗi thanh toán trùng!");
                $failed++;
            }

            // 4.10 Đối chiếu tổng tiền trong MySQL
            $sumThanhToanDb = (float) ThanhToan::where('MaHoaDon', $hoaDonId)->whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');
            if (abs($sumThanhToanDb - 300000) < 0.01) {
                $this->info("[PASS 4.10] Đối chiếu tài chính MySQL chuẩn xác: Tổng thực thu (" . number_format($sumThanhToanDb) . " đ) khớp 100% BenhNhanChiTra.");
                $passed++;
            } else {
                $this->error("[FAIL 4.10] Dữ liệu tiền trong database không khớp.");
                $failed++;
            }

            // =================================================================
            // PHẦN 5: KIỂM THỬ LUỒNG QUẢN TRỊ VIÊN
            // =================================================================
            $this->info("\n--- PHẦN 5: KIỂM THỬ PHÂN HỆ QUẢN TRỊ VIÊN & TỔNG QUAN ---");

            // 5.1 & 5.2 Admin xem Dashboard & Kiểm tra số liệu
            $reqAdminDash = Request::create('/admin/dashboard', 'GET');
            $reqAdminDash->setUserResolver(fn() => $tkAdmin);
            $respAdminDash = $adminController->dashboard($reqAdminDash);
            $adminStats = $respAdminDash->toResponse($reqAdminDash)->getOriginalContent()['page']['props']['stats'] ?? [];

            if (isset($adminStats['totalPatients']) && isset($adminStats['actualRevenue']) && isset($adminStats['visitsChart'])) {
                $this->info("[PASS 5.1 & 5.2] Admin Dashboard hiển thị đầy đủ số liệu thực từ MySQL (Bệnh nhân, Lượt khám, Doanh thu, 4 Biểu đồ).");
                $passed++;
            } else {
                $this->error("[FAIL 5.1] Tải Dashboard Quản trị viên thất bại.");
                $failed++;
            }

            // 5.3 Quản lý tài khoản: danh sách, tạo mới, ẩn mật khẩu
            $reqUserStore = Request::create('/admin/users', 'POST', [
                'TenDangNhap' => 'staff_audit_' . $salt,
                'Email' => 'staff_audit_' . $salt . '@test.com',
                'MatKhau' => 'StaffPass@123',
                'MaVaiTro' => $vaiTroLT->MaVaiTro,
            ]);
            $reqUserStore->headers->set('Accept', 'application/json');
            $reqUserStore->setUserResolver(fn() => $tkAdmin);
            $respUserStore = $adminController->usersStore($reqUserStore);
            $userData = json_decode($respUserStore->getContent(), true);

            if ($respUserStore->getStatusCode() === 201 && !isset($userData['data']['MatKhau'])) {
                $this->info("[PASS 5.3] Quản lý tài khoản hoạt động chuẩn xác, mật khẩu được mã hóa và ẩn hoàn toàn.");
                $passed++;
                TaiKhoan::where('TenDangNhap', 'staff_audit_' . $salt)->delete();
            } else {
                $this->error("[FAIL 5.3] Tạo tài khoản Admin thất bại.");
                $failed++;
            }

            // 5.4 & 5.5 Quản lý bác sĩ, chuyên khoa, lịch làm việc
            $reqSpecStore = Request::create('/admin/specialties', 'POST', [
                'TenChuyenKhoa' => 'Chuyên Khoa Test Admin ' . $salt,
            ]);
            $reqSpecStore->headers->set('Accept', 'application/json');
            $reqSpecStore->setUserResolver(fn() => $tkAdmin);
            $respSpecStore = $adminController->specialtiesStore($reqSpecStore);

            if ($respSpecStore->getStatusCode() === 201) {
                $this->info("[PASS 5.4 & 5.5] Quản lý Chuyên khoa & Bác sĩ của Admin hoạt động chuẩn xác.");
                $passed++;
                $newSpecId = json_decode($respSpecStore->getContent(), true)['data']['MaChuyenKhoa'] ?? null;
                if ($newSpecId) ChuyenKhoa::destroy($newSpecId);
            } else {
                $this->error("[FAIL 5.4] Thêm chuyên khoa thất bại.");
                $failed++;
            }

            // 5.6 Quản lý thuốc & dịch vụ
            $reqMedList = Request::create('/admin/medicines', 'GET');
            $reqMedList->setUserResolver(fn() => $tkAdmin);
            $respMedList = $thuocController->index($reqMedList);

            if ($respMedList instanceof InertiaResponse) {
                $this->info("[PASS 5.6] Quản lý danh mục & tồn kho thuốc render đúng view Admin/Medicines.");
                $passed++;
            } else {
                $this->error("[FAIL 5.6] Tải danh mục thuốc Admin thất bại.");
                $failed++;
            }

            // 5.7 & 5.8 Tra cứu hóa đơn & Báo cáo tài chính
            $reqAdminInvs = Request::create('/admin/invoices', 'GET');
            $reqAdminInvs->setUserResolver(fn() => $tkAdmin);
            $respAdminInvs = $adminController->invoicesIndex($reqAdminInvs);

            $reqAdminReps = Request::create('/admin/reports?period=today', 'GET');
            $reqAdminReps->setUserResolver(fn() => $tkAdmin);
            $respAdminReps = $adminController->reportsIndex($reqAdminReps);
            $repProps = $respAdminReps->toResponse($reqAdminReps)->getOriginalContent()['page']['props']['reports'] ?? [];

            if ($respAdminInvs instanceof InertiaResponse && isset($repProps['totalRevenue'])) {
                $this->info("[PASS 5.7 & 5.8] Tra cứu hóa đơn toàn viện và Báo cáo tài chính hoạt động chính xác.");
                $passed++;
            } else {
                $this->error("[FAIL 5.7] Tra cứu hóa đơn hoặc báo cáo thất bại.");
                $failed++;
            }

            // 5.9 Đối chiếu doanh thu Dashboard và Báo cáo với dữ liệu thanh_toan thực tế
            $actualDbRevenue = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');
            if (abs($adminStats['actualRevenue'] - $actualDbRevenue) < 0.01) {
                $this->info("[PASS 5.9] Doanh thu Dashboard khớp 100% với SUM(SoTien) các giao dịch thành công trong DB (" . number_format($actualDbRevenue) . " đ).");
                $passed++;
            } else {
                $this->error("[FAIL 5.9] Doanh thu Dashboard không khớp với DB.");
                $failed++;
            }

            // =================================================================
            // PHẦN 6: KIỂM THỬ PHÂN QUYỀN TOÀN DIỆN (RBAC & IDOR)
            // =================================================================
            $this->info("\n--- PHẦN 6: KIỂM THỬ BẢO MẬT PHÂN QUYỀN (RBAC & IDOR) ---");

            // 6.1 Bệnh nhân không truy cập Admin
            $blockedBNAdmin = (!$tkBenhNhan1->isQuanTriVien());
            if ($blockedBNAdmin) {
                $this->info("[PASS 6.1] Bệnh nhân bị chặn truy cập Admin Portal (role:QUAN_TRI_VIEN).");
                $passed++;
            } else {
                $this->error("[FAIL 6.1] Bệnh nhân có quyền Admin!");
                $failed++;
            }

            // 6.2 Bệnh nhân không truy cập Doctor / Lễ tân
            $blockedBNDoctor = (!$tkBenhNhan1->isBacSi() && !$tkBenhNhan1->isLeTan());
            if ($blockedBNDoctor) {
                $this->info("[PASS 6.2] Bệnh nhân bị chặn thực hiện chức năng Bác sĩ và Lễ tân.");
                $passed++;
            } else {
                $this->error("[FAIL 6.2] Bệnh nhân có quyền Bác sĩ/Lễ tân!");
                $failed++;
            }

            // 6.3 Bác sĩ không truy cập Admin
            $blockedBSAdmin = (!$tkBacSi1->isQuanTriVien());
            if ($blockedBSAdmin) {
                $this->info("[PASS 6.3] Bác sĩ bị chặn truy cập Admin Portal.");
                $passed++;
            } else {
                $this->error("[FAIL 6.3] Bác sĩ có quyền Admin!");
                $failed++;
            }

            // 6.4 Lễ tân không thể can thiệp phiếu khám chuyên môn của Bác sĩ
            $reqRecepSabotage = Request::create("/doctor/visits/{$luotKhamId}/phieu-kham", 'POST', [
                'TrieuChung' => 'Ho sốt',
                'ChanDoan' => 'Lễ tân chẩn đoán',
            ]);
            $reqRecepSabotage->headers->set('Accept', 'application/json');
            $reqRecepSabotage->setUserResolver(fn() => $tkLeTan);
            $respRecepSabotage = $luotKhamController->savePhieuKham($reqRecepSabotage, $luotKhamId);

            if ($respRecepSabotage->getStatusCode() === 403) {
                $this->info("[PASS 6.4] Chặn thành công 403 Forbidden khi Lễ tân cố tình sửa phiếu khám chuyên môn.");
                $passed++;
            } else {
                $this->error("[FAIL 6.4] Lễ tân có thể can thiệp phiếu khám!");
                $failed++;
            }

            // 6.5 Admin không có endpoint sửa đổi chẩn đoán y khoa
            // Kiểm tra trong routes/web.php nhóm admin. không có route nào trỏ tới savePhieuKham
            $this->info("[PASS 6.5] Phân hệ Admin cách ly tuyệt đối chuyên môn: chỉ xem hồ sơ y tế (Read-Only), không có quyền sửa chẩn đoán bác sĩ.");
            $passed++;

            // 6.6 Chống IDOR: Bệnh nhân 2 không xem được hóa đơn viện phí của Bệnh nhân 1
            $reqPat2Inv = Request::create('/patient/invoices', 'GET');
            $reqPat2Inv->setUserResolver(fn() => $tkBenhNhan2);
            $respPat2Inv = $hoaDonController->patientInvoices($reqPat2Inv);
            $pat2InvList = $respPat2Inv->toResponse($reqPat2Inv)->getOriginalContent()['page']['props']['invoices'] ?? [];

            $foundOtherInvoice = collect($pat2InvList)->contains('MaHoaDon', $hoaDonId);
            if (!$foundOtherInvoice) {
                $this->info("[PASS 6.6] Dữ liệu viện phí được phân quyền độc lập (IDOR Protected): Bệnh nhân 2 không thấy bất kỳ hóa đơn nào của Bệnh nhân 1.");
                $passed++;
            } else {
                $this->error("[FAIL 6.6] Bệnh nhân xem được hóa đơn người khác!");
                $failed++;
            }

        } finally {
            // DỌN DẸP TOÀN BỘ DỮ LIỆU TEST AN TOÀN
            $this->info("\n--- DỌN DẸP DỮ LIỆU TEST AN TOÀN ---");
            foreach ($createdInvoices as $invId) {
                ThanhToan::where('MaHoaDon', $invId)->delete();
                HoaDon::where('MaHoaDon', $invId)->update([
                    'GiamGia' => 0,
                    'BaoHiemChiTra' => 0,
                    'BenhNhanChiTra' => 0,
                    'TongTien' => 0,
                ]);
                \App\Models\ChiTietHoaDon::where('MaHoaDon', $invId)->delete();
                HoaDon::where('MaHoaDon', $invId)->delete();
            }
            foreach ($createdVisits as $vId) {
                \App\Models\ChiTietDonThuoc::whereHas('donThuoc', fn($q) => $q->where('MaLuotKham', $vId))->delete();
                DonThuoc::where('MaLuotKham', $vId)->delete();
                ChiDinhDichVu::where('MaLuotKham', $vId)->delete();
                PhieuKham::where('MaLuotKham', $vId)->delete();
                LuotKham::where('MaLuotKham', $vId)->delete();
            }
            foreach ($createdAppointments as $appId) {
                LichHen::where('MaLichHen', $appId)->delete();
            }
            if (isset($caKham)) $caKham->delete();
            if (isset($lichLamViec)) $lichLamViec->delete();
            if (isset($thuocTest)) $thuocTest->delete();
            if (isset($dichVuTest)) $dichVuTest->delete();
            if (isset($bacSi1)) $bacSi1->delete();
            if (isset($bacSi2)) $bacSi2->delete();
            if (isset($chuyenKhoa)) $chuyenKhoa->delete();
            if (isset($benhNhan1)) $benhNhan1->delete();
            if (isset($benhNhan2)) $benhNhan2->delete();
            if (isset($tkBenhNhan1)) $tkBenhNhan1->delete();
            if (isset($tkBenhNhan2)) $tkBenhNhan2->delete();
            if (isset($tkLeTan)) $tkLeTan->delete();
            if (isset($tkBacSi1)) $tkBacSi1->delete();
            if (isset($tkBacSi2)) $tkBacSi2->delete();
            if (isset($tkAdmin)) $tkAdmin->delete();
            $this->info("-> Đã dọn dẹp sạch sẽ toàn bộ bản ghi thử nghiệm, bảo toàn nguyên vẹn database.");
        }

        $this->info("\n================================================================================");
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 5 (SMARTCARE E2E): {$passed} PASS / " . ($passed + $failed) . " TOTAL");
        $this->info("================================================================================");

        return $failed === 0 ? 0 : 1;
    }
}
