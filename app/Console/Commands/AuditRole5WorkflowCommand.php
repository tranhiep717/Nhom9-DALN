<?php

namespace App\Console\Commands;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CanLamSangController;
use App\Http\Controllers\ChiDinhDichVuController;
use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\HoaDonController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LuotKhamController;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChiDinhDichVu;
use App\Models\ChiTietDonThuoc;
use App\Models\ChiTietHoaDon;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\HoaDon;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\TaiKhoan;
use App\Models\ThanhToan;
use App\Models\ThongBao;
use App\Models\Thuoc;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuditRole5WorkflowCommand extends Command
{
    protected $signature = 'test:audit-role5-workflow';
    protected $description = 'Kiểm thử toàn diện Vai trò 5 (Nhân viên Cận lâm sàng) và Quy trình Khám bệnh mới';

    private int $passCount = 0;
    private int $failCount = 0;

    public function handle()
    {
        $this->info("================================================================================");
        $this->info("   SMARTCARE AUDIT: VAI TRÒ 5 NHÂN VIÊN CẬN LÂM SÀNG & QUY TRÌNH KHÁM BỆNH MỚI");
        $this->info("================================================================================");

        $this->testRoleAndAccountCreation();
        $this->testAuthenticationAndRedirect();
        $this->testAuthorizationRbacMatrix();
        $this->testCompleteMedicalWorkflowWithCls();
        $this->testBlockCompleteWhenPendingCls();
        $this->testIdorPrivacyProtection();

        $this->info("--------------------------------------------------------------------------------");
        $this->info("TỔNG KẾT KIỂM THỬ: {$this->passCount} PASS / " . ($this->passCount + $this->failCount) . " CHECKS");
        if ($this->failCount === 0) {
            $this->info(">>> TẤT CẢ CÁC KIỂM THỬ VAI TRÒ 5 & QUY TRÌNH MỚI ĐÃ ĐẠT 100% <<<");
            return 0;
        } else {
            $this->error(">>> CÓ {$this->failCount} KIỂM THỬ THẤT BẠI. VUI LÒNG KIỂM TRA LẠI! <<<");
            return 1;
        }
    }

    private function record(bool $condition, string $message)
    {
        if ($condition) {
            $this->passCount++;
            $this->line("  [PASS] {$message}");
        } else {
            $this->failCount++;
            $this->error("  [FAIL] {$message}");
        }
    }

    /**
     * Test 1: Bảng vai trò và Tài khoản nhân viên cận lâm sàng
     */
    private function testRoleAndAccountCreation()
    {
        $this->info("\n--- 1. KIỂM THỬ BẢNG VAI TRÒ & TẠO TÀI KHOẢN NHÂN VIÊN CẬN LÂM SÀNG ---");

        $role = VaiTro::find(5);
        $this->record($role !== null && $role->TenVaiTro === 'NHAN_VIEN_CAN_LAM_SANG', "Vai trò [5] NHAN_VIEN_CAN_LAM_SANG tồn tại chính xác trong database");

        $oldRoles = VaiTro::whereIn('MaVaiTro', [1, 2, 3, 4])->pluck('TenVaiTro', 'MaVaiTro')->toArray();
        $this->record(
            $oldRoles[1] === 'QUAN_TRI_VIEN' &&
            $oldRoles[2] === 'BAC_SI' &&
            $oldRoles[3] === 'BENH_NHAN' &&
            $oldRoles[4] === 'LE_TAN',
            "Các vai trò cũ (1: Admin, 2: Bác sĩ, 3: Bệnh nhân, 4: Lễ tân) được bảo toàn 100%"
        );

        $clsUser = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();
        $this->record($clsUser !== null, "Tài khoản mẫu nhân viên CLS (cls@smartcare.vn) tồn tại trong database");
        $this->record($clsUser?->isNhanVienCanLamSang() === true, "Method TaiKhoan::isNhanVienCanLamSang() trả về true");

        // Admin tạo tài khoản nhân viên CLS mới qua AdminController
        $admin = TaiKhoan::where('Email', 'admin@smartcare.vn')->first();
        $adminCtrl = new AdminController();
        $newClsUsername = 'cls_test_' . time();
        $newClsEmail = 'cls_test_' . time() . '@smartcare.vn';
        $createReq = Request::create('/admin/users', 'POST', [
            'TenDangNhap' => $newClsUsername,
            'Email' => $newClsEmail,
            'MatKhau' => 'SmartCare@2026',
            'MaVaiTro' => 5,
        ]);
        $createReq->setUserResolver(fn () => $admin);
        $res = $adminCtrl->usersStore($createReq);
        $this->record($res->getStatusCode() === 200 || $res->getStatusCode() === 201, "Quản trị viên tạo thành công tài khoản Nhân viên CLS mới qua AdminController");

        // Dọn dẹp tài khoản test vừa tạo
        TaiKhoan::where('Email', $newClsEmail)->delete();
    }

    /**
     * Test 2: Đăng nhập & Điều hướng đúng Dashboard
     */
    private function testAuthenticationAndRedirect()
    {
        $this->info("\n--- 2. KIỂM THỬ AUTHENTICATION & ĐIỀU HƯỚNG DASHBOARD NHÂN VIÊN CLS ---");

        $session = app('session')->driver();
        $session->start();

        $authCtrl = new AuthController();
        $loginReq = Request::create('/login', 'POST', [
            'email' => 'cls@smartcare.vn',
            'password' => 'SmartCare@2026',
        ]);
        $loginReq->setLaravelSession($session);

        $res = $authCtrl->login($loginReq);
        $data = $res->isRedirection() ? null : $res->getData(true);
        $targetUrl = $res->isRedirection() ? $res->getTargetUrl() : ($data['redirect'] ?? '');

        $this->record(str_contains($targetUrl, '/cls/dashboard'), "Nhân viên CLS đăng nhập chuyển hướng chính xác đến /cls/dashboard (Target: {$targetUrl})");
        $this->record(!str_contains($targetUrl, '/dashboard') || str_contains($targetUrl, '/cls/dashboard'), "Nhân viên CLS không bị chuyển nhầm sang Dashboard Bệnh nhân");

        // Kiểm tra showLogin khi đã có session
        $clsUser = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();
        Auth::login($clsUser);
        $showLoginReq = Request::create('/login', 'GET');
        $showLoginReq->setLaravelSession($session);
        $showLoginRes = $authCtrl->showLogin();
        $this->record(
            $showLoginRes->isRedirection() && str_contains($showLoginRes->getTargetUrl(), '/cls/dashboard'),
            "Nhân viên CLS đã có session truy cập /login được redirect an toàn về /cls/dashboard (Không bị 403)"
        );
        Auth::logout();
    }

    /**
     * Test 3: Ma trận phân quyền RBAC 5 vai trò
     */
    private function testAuthorizationRbacMatrix()
    {
        $this->info("\n--- 3. KIỂM THỬ MA TRẬN PHÂN QUYỀN RBAC 5 VAI TRÒ ---");

        $clsUser = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();
        $patientUser = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorUser = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $recepUser = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();

        $clsCtrl = new CanLamSangController();
        $luotKhamCtrl = new LuotKhamController();

        // 3.1 Bệnh nhân truy cập dashboard CLS -> Bị chặn 403
        $reqBn = Request::create('/cls/dashboard', 'GET');
        $reqBn->setUserResolver(fn () => $patientUser);
        $threw403 = false;
        try {
            $clsCtrl->dashboard($reqBn);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $threw403 = $e->getStatusCode() === 403;
        }
        $this->record($threw403, "Bệnh nhân truy cập /cls/dashboard bị chặn HTTP 403 Forbidden");

        // 3.2 Lễ tân không thể bắt đầu khám bệnh -> Bị chặn 403
        $startReqRecep = Request::create('/doctor/visits/1/start', 'POST');
        $startReqRecep->setUserResolver(fn () => $recepUser);
        $startResRecep = $luotKhamCtrl->startExamine($startReqRecep, 1);
        $this->record($startResRecep->getStatusCode() === 403, "Lễ tân gọi bắt đầu khám bệnh bị chặn HTTP 403 Forbidden");

        // 3.3 Nhân viên CLS truy cập Dashboard Bác sĩ -> Bị chặn 403
        $reqClsDoctor = Request::create('/doctor/dashboard', 'GET');
        $reqClsDoctor->setUserResolver(fn () => $clsUser);
        // Kiểm tra qua middleware CheckRole
        $middleware = new \App\Http\Middleware\CheckRole();
        $threwMiddleware = false;
        try {
            $middleware->handle($reqClsDoctor, fn () => response('OK'), 'BAC_SI');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $threwMiddleware = $e->getStatusCode() === 403;
        }
        $this->record($threwMiddleware, "Nhân viên CLS truy cập phân hệ Bác sĩ bị chặn HTTP 403 Forbidden");

        // 3.4 Nhân viên CLS truy cập hợp lệ dashboard CLS
        $reqClsValid = Request::create('/cls/dashboard', 'GET');
        $reqClsValid->setUserResolver(fn () => $clsUser);
        $resValid = $clsCtrl->dashboard($reqClsValid);
        $isValidResponse = ($resValid instanceof \Inertia\Response) || ($resValid->toResponse($reqClsValid)->getStatusCode() === 200);
        $this->record($isValidResponse, "Nhân viên CLS truy cập hợp lệ /cls/dashboard (HTTP 200 OK)");
    }

    /**
     * Test 4: Toàn bộ quy trình khám bệnh khép kín mới
     * BN Đặt lịch -> Lễ tân tiếp nhận -> Bác sĩ bắt đầu -> Lưu phiếu khám -> Bác sĩ chỉ định CLS ->
     * Lượt khám sang CHO_KET_QUA -> KTV tiếp nhận & nhập kết quả -> Lượt khám sang CHO_KHAM_LAI ->
     * Bác sĩ tiếp tục khám trên ĐÚNG lượt khám cũ -> Cập nhật chẩn đoán -> Kê đơn -> Hoàn tất -> Lễ tân lập hóa đơn
     */
    private function testCompleteMedicalWorkflowWithCls()
    {
        $this->info("\n--- 4. KIỂM THỬ TOÀN DIỆN QUY TRÌNH KHÁM BỆNH MỚI 5 VAI TRÒ ---");

        $patientAccount = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorAccount = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $recepAccount = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $clsAccount = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();

        $patient = BenhNhan::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)->first();
        $dichVu1 = DichVu::where('TrangThai', 'HOAT_DONG')->first();
        $dichVu2 = DichVu::where('TrangThai', 'HOAT_DONG')->skip(1)->first() ?? $dichVu1;

        // BƯỚC 1: Lễ tân tiếp nhận bệnh nhân vào hàng chờ
        $caKham = CaKham::whereHas('lichLamViec', fn ($q) => $q->where('MaBacSi', $doctor->MaBacSi))->first();
        $lichHen = LichHen::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_XAC_NHAN',
            'LyDoKham' => 'Đau bụng hạ vị, sốt',
        ]);

        $luotKhamCtrl = new LuotKhamController();
        $checkinReq = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $lichHen->MaLichHen]);
        $checkinReq->setUserResolver(fn () => $recepAccount);
        $checkinRes = $luotKhamCtrl->store($checkinReq);

        $visit = LuotKham::where('MaLichHen', $lichHen->MaLichHen)->first();
        $this->record($visit !== null && $visit->TrangThai === 'CHO_KHAM', "[Bước 1] Lễ tân tiếp nhận -> Lượt khám #{$visit?->MaLuotKham} ở trạng thái CHO_KHAM");

        // BƯỚC 2: Bác sĩ bắt đầu khám
        $startReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $startReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->startExamine($startReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->TrangThai === 'DANG_KHAM', "[Bước 2] Bác sĩ bắt đầu khám -> Lượt khám chuyển sang DANG_KHAM");

        // BƯỚC 3: Bác sĩ lưu phiếu khám (chẩn đoán sơ bộ)
        $phieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Đau quặn bụng vùng thượng vị, buồn nôn',
            'ChanDoan' => 'Theo dõi viêm loét dạ dày / Nghi ngờ xuất huyết',
            'KetQuaKham' => 'Bụng mềm, ấn đau vùng thượng vị',
        ]);
        $phieuReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->savePhieuKham($phieuReq, $visit->MaLuotKham);

        $phieuKham = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->first();
        $this->record($phieuKham !== null && str_contains($phieuKham->ChanDoan, 'Theo dõi'), "[Bước 3] Bác sĩ lưu phiếu khám sơ bộ thành công vào MySQL");

        // BƯỚC 4: Bác sĩ chỉ định nhiều dịch vụ cận lâm sàng cùng lúc
        $chiDinhCtrl = new ChiDinhDichVuController();
        $cdReq = Request::create('/doctor/service-requests', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                ['MaDichVu' => $dichVu1->MaDichVu, 'GhiChu' => 'Kiểm tra đường huyết và chức năng gan'],
                ['MaDichVu' => $dichVu2->MaDichVu, 'GhiChu' => 'Chụp X-quang hoặc nội soi'],
            ]
        ]);
        $cdReq->setUserResolver(fn () => $doctorAccount);
        $chiDinhCtrl->store($cdReq);

        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KET_QUA', "[Bước 4.1] Bác sĩ chỉ định CLS -> Lượt khám tự động chuyển sang CHO_KET_QUA");

        $assignedServices = ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->get();
        $this->record($assignedServices->count() === 2, "[Bước 4.2] Đã tạo thành công 2 phiếu chỉ định cận lâm sàng trong MySQL");

        // Kiểm tra thông báo gửi tới Nhân viên Cận lâm sàng
        $clsNotif = ThongBao::where('MaTaiKhoan', $clsAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'KHAM_BENH')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($clsNotif !== null, "[Bước 4.3] Nhân viên CLS nhận được thông báo về chỉ định mới");

        // BƯỚC 5: Nhân viên Cận lâm sàng tiếp nhận & bắt đầu thực hiện dịch vụ
        $clsCtrl = new CanLamSangController();
        $firstCd = $assignedServices->first();
        $receiveReq = Request::create("/cls/requests/{$firstCd->MaChiDinh}/receive", 'POST');
        $receiveReq->setUserResolver(fn () => $clsAccount);
        $clsCtrl->receive($receiveReq, $firstCd->MaChiDinh);

        $firstCd->refresh();
        $this->record($firstCd->TrangThai === 'DA_TIEP_NHAN' && $firstCd->MaNhanVienThucHien === $clsAccount->MaTaiKhoan, "[Bước 5] KTV tiếp nhận chỉ định 1 thành công (DA_TIEP_NHAN, lưu MaNhanVienThucHien)");

        // BƯỚC 6: KTV nhập kết quả cho dịch vụ 1 (dịch vụ 2 vẫn chưa có kết quả)
        $resReq1 = Request::create("/cls/requests/{$firstCd->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Chỉ số glucose: 5.6 mmol/L, SGOT: 28 U/L',
            'KetLuan' => 'Các chỉ số sinh hóa nằm trong giới hạn bình thường',
            'DonViDo' => 'mmol/L',
            'KhoangThamChieu' => '3.9 - 6.4 mmol/L',
        ]);
        $resReq1->setUserResolver(fn () => $clsAccount);
        $clsCtrl->updateResult($resReq1, $firstCd->MaChiDinh);

        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KET_QUA', "[Bước 6] Dịch vụ 1 có kết quả nhưng DV 2 chưa xong -> Lượt khám VẪN ở trạng thái CHO_KET_QUA");

        // BƯỚC 7: KTV hoàn thành nốt kết quả cho dịch vụ 2
        $secondCd = $assignedServices->last();
        $resReq2 = Request::create("/cls/requests/{$secondCd->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Hình ảnh niêm mạc dạ dày phù nề nhẹ, có vết trợt nông 2mm',
            'KetLuan' => 'Viêm trợt niêm mạc dạ dày mức độ nhẹ',
        ]);
        $resReq2->setUserResolver(fn () => $clsAccount);
        $clsCtrl->updateResult($resReq2, $secondCd->MaChiDinh);

        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KHAM_LAI', "[Bước 7] TẤT CẢ chỉ định CLS hoàn tất -> Lượt khám TỰ ĐỘNG chuyển sang CHO_KHAM_LAI");

        // Bác sĩ nhận thông báo đầy đủ kết quả CLS
        $docNotif = ThongBao::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'KHAM_BENH')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record(str_contains($docNotif?->TieuDe ?? '', 'đầy đủ kết quả'), "[Bước 7.1] Bác sĩ nhận được thông báo: Đã có đầy đủ kết quả cận lâm sàng");

        // BƯỚC 8: Bác sĩ tiếp tục khám trên ĐÚNG lượt khám cũ
        $resumeReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $resumeReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->startExamine($resumeReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->TrangThai === 'DANG_KHAM', "[Bước 8.1] Bác sĩ tiếp tục khám -> Lượt khám chuyển lại DANG_KHAM trên ĐÚNG ID cũ (#{$visit->MaLuotKham})");

        // Bác sĩ cập nhật chẩn đoán xác định bệnh cuối cùng
        $updatePhieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Đau quặn bụng vùng thượng vị, buồn nôn',
            'ChanDoan' => 'Viêm trợt niêm mạc dạ dày cấp tính',
            'HuongDieuTri' => 'Điều trị nội khoa ngoại trú, uống thuốc 7 ngày',
            'LoiDanBacSi' => 'Kiêng cay nóng, ăn đúng giờ, tái khám sau 1 tuần',
        ]);
        $updatePhieuReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->savePhieuKham($updatePhieuReq, $visit->MaLuotKham);

        $phieuKham->refresh();
        $this->record($phieuKham->ChanDoan === 'Viêm trợt niêm mạc dạ dày cấp tính', "[Bước 8.2] Cập nhật chẩn đoán cuối cùng thành công (không tạo phiếu khám trùng)");

        // BƯỚC 9: Bác sĩ kê đơn thuốc
        $thuoc = Thuoc::where('TrangThai', 'HOAT_DONG')->where('SoLuongTon', '>', 5)->first();
        $donThuocCtrl = new DonThuocController();
        $dtReq = Request::create('/doctor/prescriptions', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                [
                    'MaThuoc' => $thuoc->MaThuoc,
                    'SoLuong' => 2,
                    'LieuDung' => '1 viên/lần',
                    'TanSuat' => '2 lần/ngày',
                ]
            ],
            'LoiDan' => 'Uống trước bữa ăn 30 phút',
        ]);
        $dtReq->setUserResolver(fn () => $doctorAccount);
        $donThuocCtrl->store($dtReq);

        $donThuoc = DonThuoc::where('MaLuotKham', $visit->MaLuotKham)->first();
        $this->record($donThuoc !== null, "[Bước 9] Bác sĩ kê đơn thuốc thành công cho lượt khám");

        // BƯỚC 10: Bác sĩ hoàn thành lượt khám
        $completeReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/complete", 'POST');
        $completeReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->completeExamine($completeReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->TrangThai === 'HOAN_THANH', "[Bước 10] Bác sĩ hoàn thành lượt khám -> TrangThai = HOAN_THANH");

        // BƯỚC 11: Lễ tân lập hóa đơn tổng hợp viện phí
        $hoaDonCtrl = new HoaDonController();
        $hdReq = Request::create('/receptionist/invoices', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'TienKham' => 150000,
            'items' => [
                ['LoaiChiPhi' => 'TIEN_KHAM', 'NoiDung' => 'Tiền khám bác sĩ chuyên khoa', 'SoLuong' => 1, 'DonGia' => 150000, 'MaChiDinh' => null, 'MaChiTietDonThuoc' => null],
                ['LoaiChiPhi' => 'DICH_VU', 'NoiDung' => $dichVu1->TenDichVu, 'SoLuong' => 1, 'DonGia' => $dichVu1->DonGia, 'MaChiDinh' => $firstCd->MaChiDinh, 'MaChiTietDonThuoc' => null],
                ['LoaiChiPhi' => 'DICH_VU', 'NoiDung' => $dichVu2->TenDichVu, 'SoLuong' => 1, 'DonGia' => $dichVu2->DonGia, 'MaChiDinh' => $secondCd->MaChiDinh, 'MaChiTietDonThuoc' => null],
            ],
            'GiamGia' => 0,
            'BaoHiemChiTra' => 0,
        ]);
        $hdReq->setUserResolver(fn () => $recepAccount);
        $hdRes = $hoaDonCtrl->store($hdReq);
        $maHoaDon = $hdRes->getData(true)['data']['MaHoaDon'] ?? null;

        $this->record($maHoaDon !== null, "[Bước 11] Lễ tân lập hóa đơn viện phí #{$maHoaDon} tổng hợp đầy đủ tiền khám và cận lâm sàng");

        // Dọn dẹp dữ liệu bài test an toàn
        if ($maHoaDon) {
            ChiTietHoaDon::where('MaHoaDon', $maHoaDon)->delete();
            HoaDon::where('MaHoaDon', $maHoaDon)->delete();
        }
        if ($donThuoc) {
            ChiTietDonThuoc::where('MaDonThuoc', $donThuoc->MaDonThuoc)->delete();
            $donThuoc->delete();
        }
        ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->delete();
        PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->delete();
        $visit->delete();
        $lichHen->delete();
    }

    /**
     * Test 5: Chặn tuyệt đối không thể hoàn thành khám khi còn chỉ định CLS chưa có kết quả
     */
    private function testBlockCompleteWhenPendingCls()
    {
        $this->info("\n--- 5. KIỂM THỬ CHẶN HOÀN THÀNH LƯỢT KHÁM KHI CÒN CHỈ ĐỊNH ĐANG CHỜ ---");

        $patientAccount = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorAccount = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $patient = BenhNhan::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)->first();
        $dichVu = DichVu::where('TrangThai', 'HOAT_DONG')->first();

        // Tạo lượt khám và phiếu khám
        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'DANG_KHAM',
        ]);

        PhieuKham::create([
            'MaLuotKham' => $visit->MaLuotKham,
            'TrieuChung' => 'Sốt ho',
            'ChanDoan' => 'Viêm phế quản cấp',
        ]);

        // Tạo 1 chỉ định dịch vụ đang ở trạng thái CHO_TIEP_NHAN
        $chiDinh = ChiDinhDichVu::create([
            'MaLuotKham' => $visit->MaLuotKham,
            'MaDichVu' => $dichVu->MaDichVu,
            'MaBacSi' => $doctor->MaBacSi,
            'TrangThai' => 'CHO_TIEP_NHAN',
            'DonGia' => $dichVu->DonGia,
            'NgayChiDinh' => now(),
        ]);

        // Bác sĩ cố tình gọi completeExamine
        $luotKhamCtrl = new LuotKhamController();
        $compReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/complete", 'POST');
        $compReq->setUserResolver(fn () => $doctorAccount);

        $res = $luotKhamCtrl->completeExamine($compReq, $visit->MaLuotKham);
        $this->record($res->getStatusCode() === 422, "Chặn hoàn thành lượt khám: Trả về HTTP 422 Unprocessable Entity");

        $visit->refresh();
        $this->record($visit->TrangThai !== 'HOAN_THANH', "Trạng thái lượt khám KHÔNG bị chuyển sang HOAN_THANH (vẫn được giữ nguyên)");

        // Dọn dẹp
        $chiDinh->delete();
        PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->delete();
        $visit->delete();
    }

    /**
     * Test 6: Quyền riêng tư & Chống IDOR xem kết quả CLS
     */
    private function testIdorPrivacyProtection()
    {
        $this->info("\n--- 6. KIỂM THỬ QUYỀN RIÊNG TƯ & CHỐNG IDOR TRÊN DỮ LIỆU CẬN LÂM SÀNG ---");

        $userAn = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $userBinh = TaiKhoan::where('Email', 'benhnhan.binh@smartcare.vn')->first();
        $patientAn = BenhNhan::where('MaTaiKhoan', $userAn->MaTaiKhoan)->first();
        $doctor = BacSi::first();
        $dichVu = DichVu::first();

        // Tạo lượt khám và chỉ định của Bệnh nhân An
        $visitAn = LuotKham::create([
            'MaBenhNhan' => $patientAn->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'DANG_KHAM',
        ]);

        $chiDinhAn = ChiDinhDichVu::create([
            'MaLuotKham' => $visitAn->MaLuotKham,
            'MaDichVu' => $dichVu->MaDichVu,
            'MaBacSi' => $doctor->MaBacSi,
            'TrangThai' => 'DA_CO_KET_QUA',
            'KetQua' => 'Kết quả bí mật của bệnh nhân An',
            'DonGia' => $dichVu->DonGia,
            'NgayChiDinh' => now(),
        ]);

        // Bệnh nhân Bình cố tình xem chỉ định của Bệnh nhân An
        $chiDinhCtrl = new ChiDinhDichVuController();
        $attackReq = Request::create("/service-requests/{$chiDinhAn->MaChiDinh}", 'GET');
        $attackReq->setUserResolver(fn () => $userBinh);

        $attackRes = $chiDinhCtrl->show($attackReq, $chiDinhAn->MaChiDinh);
        $this->record($attackRes->getStatusCode() === 403, "Chống IDOR: Bệnh nhân B không thể xem kết quả cận lâm sàng của Bệnh nhân A (HTTP 403 Forbidden)");

        // Bệnh nhân An xem chỉ định của chính mình
        $validReq = Request::create("/service-requests/{$chiDinhAn->MaChiDinh}", 'GET');
        $validReq->setUserResolver(fn () => $userAn);
        $validRes = $chiDinhCtrl->show($validReq, $chiDinhAn->MaChiDinh);
        $this->record($validRes->getStatusCode() === 200, "Bệnh nhân A xem hợp lệ chỉ định của chính mình (HTTP 200 OK)");

        // Dọn dẹp
        $chiDinhAn->delete();
        $visitAn->delete();
    }
}
