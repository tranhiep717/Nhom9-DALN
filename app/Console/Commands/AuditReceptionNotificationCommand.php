<?php

namespace App\Console\Commands;

use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\HoaDonController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LuotKhamController;
use App\Http\Controllers\ThongBaoController;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChiTietDonThuoc;
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
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuditReceptionNotificationCommand extends Command
{
    protected $signature = 'test:audit-reception-notification';
    protected $description = 'Kiểm thử toàn diện Tiếp nhận bệnh nhân & Hệ thống Thông báo';

    private int $passCount = 0;
    private int $failCount = 0;

    public function handle()
    {
        $this->info("================================================================================");
        $this->info("   SMARTCARE AUDIT: TIẾP NHẬN BỆNH NHÂN & HỆ THỐNG THÔNG BÁO TOÀN DIỆN");
        $this->info("================================================================================");

        $this->testNotificationCrudAndService();
        $this->testNotificationIdorSecurity();
        $this->testReceptionCheckInSuccess();
        $this->testReceptionDoubleCheckInProtection();
        $this->testReceptionCancelledOrCompletedProtection();
        $this->testReceptionRbacSecurity();
        $this->testReceptionTriggersNotifications();
        $this->testMedicalWorkflowTriggersNotifications();

        $this->info("--------------------------------------------------------------------------------");
        $this->info("TỔNG KẾT KIỂM THỬ: {$this->passCount} PASS / " . ($this->passCount + $this->failCount) . " CHECKS");
        if ($this->failCount === 0) {
            $this->info(">>> TẤT CẢ CÁC KIỂM THỬ TIẾP NHẬN & THÔNG BÁO ĐÃ VƯỢT QUA 100% <<<");
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
     * Test 1: Service Thông báo và CRUD API cơ bản
     */
    private function testNotificationCrudAndService()
    {
        $this->info("\n--- 1. KIỂM THỬ NOTIFICATION SERVICE & CRUD API ---");

        $patientUser = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $this->record($patientUser !== null, "Tìm thấy tài khoản bệnh nhân An ({$patientUser?->Email})");

        // Gửi thông báo test qua Service
        $notif = NotificationService::send(
            $patientUser->MaTaiKhoan,
            'HE_THONG',
            'Chào mừng đến với SmartCare',
            'Nội dung kiểm thử thông báo hệ thống',
            '/appointments'
        );

        $this->record($notif !== null && $notif->MaThongBao > 0, "NotificationService::send tạo thành công bản ghi #{$notif?->MaThongBao}");
        $this->record($notif?->DaDoc === false, "Thông báo mới có DaDoc = 0 (chưa đọc)");
        $this->record($notif?->MaTaiKhoan === $patientUser->MaTaiKhoan, "Thông báo gán đúng MaTaiKhoan của người nhận");

        // Test API index & unread count
        $controller = new ThongBaoController();
        $req = Request::create('/notifications', 'GET');
        $req->setUserResolver(fn () => $patientUser);

        $response = $controller->index($req);
        $data = $response->getData(true);

        $this->record($data['success'] === true, "API GET /notifications trả về success = true");
        $this->record(count($data['data']) > 0, "API GET /notifications trả về danh sách thông báo không rỗng");
        $this->record($data['unread_count'] > 0, "API GET /notifications trả về unread_count > 0");

        // Test API unread-count
        $resCount = $controller->unreadCount($req);
        $dataCount = $resCount->getData(true);
        $this->record($dataCount['count'] === $data['unread_count'], "API GET /notifications/unread-count trả về số đếm chính xác ({$dataCount['count']})");

        // Test API mark as read
        $markReq = Request::create("/notifications/{$notif->MaThongBao}/read", 'POST');
        $markReq->setUserResolver(fn () => $patientUser);
        $resMark = $controller->markAsRead($markReq, $notif->MaThongBao);
        $dataMark = $resMark->getData(true);

        $this->record($dataMark['success'] === true, "API POST /notifications/{id}/read đánh dấu đã đọc thành công");
        $refreshed = ThongBao::find($notif->MaThongBao);
        $this->record($refreshed->DaDoc === true && $refreshed->ThoiGianDoc !== null, "Bản ghi trong MySQL đã cập nhật DaDoc = 1 và có ThoiGianDoc");

        // Test API mark all as read
        $notif2 = NotificationService::send($patientUser->MaTaiKhoan, 'HE_THONG', 'Test 2', 'Nội dung test 2');
        $markAllReq = Request::create('/notifications/read-all', 'POST');
        $markAllReq->setUserResolver(fn () => $patientUser);
        $resMarkAll = $controller->markAllAsRead($markAllReq);
        $this->record($resMarkAll->getData(true)['success'] === true, "API POST /notifications/read-all trả về success");
        $unreadRemaining = ThongBao::where('MaTaiKhoan', $patientUser->MaTaiKhoan)->where('DaDoc', false)->count();
        $this->record($unreadRemaining === 0, "Tất cả thông báo của user đã chuyển sang đã đọc (unreadRemaining = 0)");

        // Dọn dẹp bản ghi test
        ThongBao::whereIn('MaThongBao', [$notif->MaThongBao, $notif2->MaThongBao])->delete();
    }

    /**
     * Test 2: Chống IDOR trên API Thông báo
     */
    private function testNotificationIdorSecurity()
    {
        $this->info("\n--- 2. KIỂM THỬ BẢO MẬT & CHỐNG IDOR THÔNG BÁO ---");

        $userA = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $userB = TaiKhoan::where('Email', 'benhnhan.binh@smartcare.vn')->first();

        // Tạo thông báo cho user A
        $notifA = NotificationService::send($userA->MaTaiKhoan, 'HE_THONG', 'Bí mật của A', 'Không cho B xem hoặc sửa');

        // User B cố tình đánh dấu đã đọc thông báo của User A
        $controller = new ThongBaoController();
        $attackReq = Request::create("/notifications/{$notifA->MaThongBao}/read", 'POST');
        $attackReq->setUserResolver(fn () => $userB);

        $attackRes = $controller->markAsRead($attackReq, $notifA->MaThongBao);
        $this->record($attackRes->getStatusCode() === 403, "Chặn IDOR: User B không thể mark-as-read thông báo của User A (HTTP 403 Forbidden)");

        $checkNotif = ThongBao::find($notifA->MaThongBao);
        $this->record($checkNotif->DaDoc === false, "Trạng thái thông báo của User A vẫn giữ nguyên DaDoc = 0");

        // Dọn dẹp
        $notifA->delete();
    }

    /**
     * Test 3: Tiếp nhận bệnh nhân thành công
     */
    private function testReceptionCheckInSuccess()
    {
        $this->info("\n--- 3. KIỂM THỬ TIẾP NHẬN BỆNH NHÂN THÀNH CÔNG (CHECK-IN) ---");

        $receptionist = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $patient = BenhNhan::first();
        $doctor = BacSi::first();

        // Tạo 1 ca khám và 1 lịch hẹn hợp lệ
        $lichLamViec = LichLamViec::where('MaBacSi', $doctor->MaBacSi)->first();
        $caKham = CaKham::where('MaLichLamViec', $lichLamViec->MaLichLamViec)->first();

        $lichHen = LichHen::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_XAC_NHAN',
            'LyDoKham' => 'Kiểm tra sức khỏe tổng quát',
        ]);

        $this->record($lichHen->MaLichHen > 0, "Tạo lịch hẹn mẫu #{$lichHen->MaLichHen} ở trạng thái DA_XAC_NHAN");

        // Giả lập Lễ tân gọi POST /receptionist/visits
        $controller = new LuotKhamController();
        $req = Request::create('/receptionist/visits', 'POST', [
            'MaLichHen' => $lichHen->MaLichHen,
            'GhiChu' => 'Tiếp nhận tại quầy 1',
        ]);
        $req->setUserResolver(fn () => $receptionist);

        $response = $controller->store($req);
        $this->record($response->getStatusCode() === 201 || $response->isRedirection(), "Gọi tiếp nhận trả về response thành công (Status: {$response->getStatusCode()})");

        // Kiểm tra cơ sở dữ liệu
        $refreshedLichHen = LichHen::find($lichHen->MaLichHen);
        $this->record($refreshedLichHen->TrangThai === 'DA_TIEP_NHAN', "Lịch hẹn #{$lichHen->MaLichHen} chuyển trạng thái thành DA_TIEP_NHAN");

        $visit = LuotKham::where('MaLichHen', $lichHen->MaLichHen)->first();
        $this->record($visit !== null, "Đã tạo thành công Lượt khám #{$visit?->MaLuotKham} gắn với MaLichHen = {$lichHen->MaLichHen}");
        $this->record($visit?->TrangThai === 'CHO_KHAM', "Lượt khám có TrangThai = 'CHO_KHAM' (vào hàng chờ khám)");
        $this->record($visit?->MaBacSi === $doctor->MaBacSi, "Lượt khám gán đúng MaBacSi phụ trách ca ({$doctor->MaBacSi})");
        $this->record($visit?->MaBenhNhan === $patient->MaBenhNhan, "Lượt khám gán đúng MaBenhNhan ({$patient->MaBenhNhan})");

        // Dọn dẹp
        $visit->delete();
        $lichHen->delete();
    }

    /**
     * Test 4: Chống tiếp nhận trùng (Double Check-in Protection)
     */
    private function testReceptionDoubleCheckInProtection()
    {
        $this->info("\n--- 4. KIỂM THỬ CHỐNG TIẾP NHẬN TRÙNG (DOUBLE CHECK-IN) ---");

        $receptionist = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $patient = BenhNhan::first();
        $doctor = BacSi::first();
        $caKham = CaKham::first();

        $lichHen = LichHen::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_XAC_NHAN',
        ]);

        $controller = new LuotKhamController();
        $req = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $lichHen->MaLichHen]);
        $req->setUserResolver(fn () => $receptionist);

        // Lần 1: Thành công
        $controller->store($req);

        // Lần 2: Thử tiếp nhận lại
        $hasThrown = false;
        try {
            $controller->store($req);
        } catch (ValidationException $e) {
            $hasThrown = true;
            $this->record(true, "Chặn tiếp nhận trùng: Ném ValidationException ('" . ($e->errors()['MaLichHen'][0] ?? '') . "')");
        }

        $this->record($hasThrown, "Request tiếp nhận lần 2 bị chặn tuyệt đối, không tạo lượt khám thứ 2");
        $visitCount = LuotKham::where('MaLichHen', $lichHen->MaLichHen)->count();
        $this->record($visitCount === 1, "Số lượng lượt khám tồn tại duy nhất là 1");

        // Dọn dẹp
        LuotKham::where('MaLichHen', $lichHen->MaLichHen)->delete();
        $lichHen->delete();
    }

    /**
     * Test 5: Chống tiếp nhận lịch đã hủy hoặc đã hoàn thành
     */
    private function testReceptionCancelledOrCompletedProtection()
    {
        $this->info("\n--- 5. KIỂM THỬ CHỐNG TIẾP NHẬN LỊCH HẸN ĐÃ HỦY HOẶC HOÀN THÀNH ---");

        $receptionist = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $caKham = CaKham::first();

        // 1. Lịch đã hủy
        $cancelledLichHen = LichHen::create([
            'MaBenhNhan' => 1,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_HUY',
        ]);

        $controller = new LuotKhamController();
        $reqCancelled = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $cancelledLichHen->MaLichHen]);
        $reqCancelled->setUserResolver(fn () => $receptionist);

        $threwCancelled = false;
        try {
            $controller->store($reqCancelled);
        } catch (ValidationException $e) {
            $threwCancelled = true;
        }
        $this->record($threwCancelled, "Chặn tiếp nhận lịch hẹn có TrangThai = 'DA_HUY'");

        // 2. Lịch đã hoàn thành
        $completedLichHen = LichHen::create([
            'MaBenhNhan' => 1,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'HOAN_THANH',
        ]);

        $reqCompleted = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $completedLichHen->MaLichHen]);
        $reqCompleted->setUserResolver(fn () => $receptionist);

        $threwCompleted = false;
        try {
            $controller->store($reqCompleted);
        } catch (ValidationException $e) {
            $threwCompleted = true;
        }
        $this->record($threwCompleted, "Chặn tiếp nhận lịch hẹn có TrangThai = 'HOAN_THANH'");

        // Dọn dẹp
        $cancelledLichHen->delete();
        $completedLichHen->delete();
    }

    /**
     * Test 6: Phân quyền RBAC khi tiếp nhận
     */
    private function testReceptionRbacSecurity()
    {
        $this->info("\n--- 6. KIỂM THỬ PHÂN QUYỀN RBAC TIẾP NHẬN ---");

        $patientUser = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $controller = new LuotKhamController();

        $req = Request::create('/receptionist/visits', 'POST', ['MaBenhNhan' => 1, 'MaBacSi' => 1]);
        $req->setUserResolver(fn () => $patientUser);

        $res = $controller->store($req);
        $this->record($res->getStatusCode() === 403, "Tài khoản Bệnh nhân gọi tiếp nhận bị từ chối 403 Forbidden");

        $reqGuest = Request::create('/receptionist/visits', 'POST', ['MaBenhNhan' => 1, 'MaBacSi' => 1]);
        $reqGuest->setUserResolver(fn () => null);
        $resGuest = $controller->store($reqGuest);
        $this->record($resGuest->getStatusCode() === 403, "Khách chưa đăng nhập gọi tiếp nhận bị từ chối 403 Forbidden");
    }

    /**
     * Test 7: Tiếp nhận tạo thông báo tự động cho Bác sĩ và Bệnh nhân
     */
    private function testReceptionTriggersNotifications()
    {
        $this->info("\n--- 7. KIỂM THỬ TIẾP NHẬN BỆNH NHÂN TỰ ĐỘNG PHÁT THÔNG BÁO ---");

        $receptionist = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $patientAccount = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorAccount = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();

        $patient = BenhNhan::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)->first();
        $caKham = CaKham::whereHas('lichLamViec', fn ($q) => $q->where('MaBacSi', $doctor->MaBacSi))->first();

        $lichHen = LichHen::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_XAC_NHAN',
        ]);

        $controller = new LuotKhamController();
        $req = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $lichHen->MaLichHen]);
        $req->setUserResolver(fn () => $receptionist);

        $controller->store($req);

        // Kiểm tra thông báo của Bác sĩ
        $docNotif = ThongBao::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'TIEP_NHAN')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($docNotif !== null, "Bác sĩ phụ trách nhận được thông báo TIEP_NHAN");
        $this->record(str_contains($docNotif?->NoiDung ?? '', $patient->HoTen), "Nội dung thông báo Bác sĩ chứa tên bệnh nhân ({$patient->HoTen})");

        // Kiểm tra thông báo của Bệnh nhân
        $patientNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'TIEP_NHAN')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($patientNotif !== null, "Bệnh nhân nhận được thông báo TIEP_NHAN");
        $this->record(str_contains($patientNotif?->NoiDung ?? '', $doctor->HoTen), "Nội dung thông báo Bệnh nhân chứa tên bác sĩ ({$doctor->HoTen})");

        // Dọn dẹp
        LuotKham::where('MaLichHen', $lichHen->MaLichHen)->delete();
        $lichHen->delete();
        if ($docNotif) $docNotif->delete();
        if ($patientNotif) $patientNotif->delete();
    }

    /**
     * Test 8: Toàn bộ quy trình y tế phát thông báo đúng sự kiện
     */
    private function testMedicalWorkflowTriggersNotifications()
    {
        $this->info("\n--- 8. KIỂM THỬ CÁC ĐIỂM KÍCH HOẠT THÔNG BÁO TRONG QUY TRÌNH Y TẾ ---");

        $patientAccount = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorAccount = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $patient = BenhNhan::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)->first();

        // 1. Khám bệnh (startExamine)
        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'CHO_KHAM',
        ]);

        $controller = new LuotKhamController();
        $startReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $startReq->setUserResolver(fn () => $doctorAccount);
        $controller->startExamine($startReq, $visit->MaLuotKham);

        $startNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'KHAM_BENH')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($startNotif !== null, "Bác sĩ bắt đầu khám -> Bệnh nhân nhận được thông báo KHAM_BENH");

        // 2. Kê đơn thuốc (DonThuocController::store)
        $thuoc = Thuoc::where('TrangThai', 'HOAT_DONG')->where('SoLuongTon', '>', 5)->first();
        $donThuocController = new DonThuocController();
        $donThuocReq = Request::create('/prescriptions', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                [
                    'MaThuoc' => $thuoc->MaThuoc,
                    'SoLuong' => 2,
                    'LieuDung' => '1 viên/lần',
                    'TanSuat' => '2 lần/ngày',
                ]
            ],
            'LoiDan' => 'Uống sau ăn',
        ]);
        $donThuocReq->setUserResolver(fn () => $doctorAccount);
        $donThuocController->store($donThuocReq);

        $donThuocNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'DON_THUOC')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($donThuocNotif !== null, "Bác sĩ kê đơn -> Bệnh nhân nhận được thông báo DON_THUOC");

        // 3. Hoàn thành khám (completeExamine)
        PhieuKham::create([
            'MaLuotKham' => $visit->MaLuotKham,
            'TrieuChung' => 'Sốt nhẹ',
            'ChanDoan' => 'Cảm cúm thông thường',
        ]);
        $compReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/complete", 'POST');
        $compReq->setUserResolver(fn () => $doctorAccount);
        $controller->completeExamine($compReq, $visit->MaLuotKham);

        $compNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'KHAM_BENH')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($compNotif !== null && str_contains($compNotif->TieuDe, 'hoàn tất'), "Bác sĩ hoàn thành khám -> Bệnh nhân nhận thông báo hoàn tất");

        // 4. Lập hóa đơn và thanh toán
        $receptionist = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $hoaDonController = new HoaDonController();
        $hdReq = Request::create('/receptionist/invoices', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'TienKham' => 150000,
            'items' => [
                [
                    'LoaiChiPhi' => 'TIEN_KHAM',
                    'NoiDung' => 'Phí khám bệnh chuyên khoa',
                    'SoLuong' => 1,
                    'DonGia' => 150000,
                    'MaChiDinh' => null,
                    'MaChiTietDonThuoc' => null,
                ]
            ],
            'GiamGia' => 0,
            'BaoHiemChiTra' => 0,
        ]);
        $hdReq->setUserResolver(fn () => $receptionist);
        $hdRes = $hoaDonController->store($hdReq);
        $hdData = $hdRes->getData(true);
        $maHoaDon = $hdData['data']['MaHoaDon'] ?? null;

        $hdNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
            ->where('LoaiThongBao', 'HOA_DON')
            ->orderBy('MaThongBao', 'desc')
            ->first();
        $this->record($hdNotif !== null, "Lập hóa đơn -> Bệnh nhân nhận được thông báo HOA_DON");

        // Thanh toán hóa đơn
        if ($maHoaDon) {
            $payReq = Request::create("/receptionist/invoices/{$maHoaDon}/pay", 'POST', [
                'SoTien' => 150000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
            ]);
            $payReq->setUserResolver(fn () => $receptionist);
            $hoaDonController->pay($payReq, $maHoaDon);

            $payNotif = ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)
                ->where('LoaiThongBao', 'THANH_TOAN')
                ->orderBy('MaThongBao', 'desc')
                ->first();
            $this->record($payNotif !== null, "Thanh toán viện phí -> Bệnh nhân nhận được thông báo THANH_TOAN");
        }

        // Dọn dẹp
        if ($maHoaDon) {
            ThanhToan::where('MaHoaDon', $maHoaDon)->delete();
            \App\Models\ChiTietHoaDon::where('MaHoaDon', $maHoaDon)->delete();
            HoaDon::where('MaHoaDon', $maHoaDon)->delete();
        }
        $dt = DonThuoc::where('MaLuotKham', $visit->MaLuotKham)->first();
        if ($dt) {
            ChiTietDonThuoc::where('MaDonThuoc', $dt->MaDonThuoc)->delete();
            $dt->delete();
        }
        PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->delete();
        $visit->delete();
        ThongBao::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->delete();
    }
}
