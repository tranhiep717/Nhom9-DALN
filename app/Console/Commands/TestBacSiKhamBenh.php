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
use Illuminate\Validation\ValidationException;

class TestBacSiKhamBenh extends Command
{
    protected $signature = 'test:bacsikhambenh';
    protected $description = 'Kiểm thử tích hợp Giai đoạn 4.2: Giao diện Khám bệnh Bác sĩ & Nghiệp vụ liên kết';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ GIAI ĐOẠN 4.2: TÍCH HỢP GIAO DIỆN BÁC SĨ VỚI BACKEND');
        $this->info('================================================================');
        $this->info('');

        $luotKhamCtrl = new LuotKhamController();
        $donThuocCtrl = new DonThuocController();
        $chiDinhCtrl = new ChiDinhDichVuController();
        $thuocCtrl = new ThuocController();

        $passed = 0;
        $failed = 0;

        $createdVisits = [];
        $createdPrescriptions = [];
        $createdRequests = [];
        $createdPhieuKhams = [];
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
            // 0. CHUẨN BỊ DỮ LIỆU KIỂM THỬ AN TOÀN
            // =========================================================
            $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->firstOrFail();
            $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->firstOrFail();
            $chuyenKhoa = ChuyenKhoa::firstOrFail();

            // Bác sĩ 1 (Chính)
            $tkDoc1 = TaiKhoan::create([
                'TenDangNhap' => 'test_g42_doc1_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'doc1_g42_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDoc1->MaTaiKhoan;

            $doc1 = BacSi::create([
                'MaTaiKhoan' => $tkDoc1->MaTaiKhoan,
                'MaChuyenKhoa' => $chuyenKhoa->MaChuyenKhoa,
                'HoTen' => 'BS. Giai Đoạn 4.2 Khám Bệnh',
                'SoDienThoai' => '0912344321',
                'EmailLienHe' => 'doc1_g42@smartcare.vn',
                'HocVi' => 'Thạc sĩ Bác sĩ',
                'KinhNghiem' => 10,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $doc1->MaBacSi;
            $tkDoc1->setRelation('vaiTro', $vaiTroBS);
            $tkDoc1->setRelation('bacSi', $doc1);

            // Bác sĩ 2 (Khác phạm vi để kiểm tra bảo mật phân quyền)
            $tkDoc2 = TaiKhoan::create([
                'TenDangNhap' => 'test_g42_doc2_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'doc2_g42_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDoc2->MaTaiKhoan;

            $doc2 = BacSi::create([
                'MaTaiKhoan' => $tkDoc2->MaTaiKhoan,
                'MaChuyenKhoa' => $chuyenKhoa->MaChuyenKhoa,
                'HoTen' => 'BS. Ngoại Phạm Vi 4.2',
                'SoDienThoai' => '0988776655',
                'EmailLienHe' => 'doc2_g42@smartcare.vn',
                'HocVi' => 'Bác sĩ CKI',
                'KinhNghiem' => 7,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $doc2->MaBacSi;
            $tkDoc2->setRelation('vaiTro', $vaiTroBS);
            $tkDoc2->setRelation('bacSi', $doc2);

            // Bệnh nhân test
            $tkPat = TaiKhoan::create([
                'TenDangNhap' => 'test_g42_pat_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'pat_g42_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPat->MaTaiKhoan;

            $pat = BenhNhan::create([
                'MaTaiKhoan' => $tkPat->MaTaiKhoan,
                'HoTen' => 'Trần Văn Khám Test G4.2',
                'SoDienThoai' => '0933445566',
                'EmailLienHe' => 'pat_g42@gmail.com',
                'GioiTinh' => 'NAM',
                'NgaySinh' => '1985-06-15',
                'DiaChi' => '123 Đường Y Học, Quận 10, TP.HCM',
            ]);
            $createdPatients[] = $pat->MaBenhNhan;

            // Thuốc kiểm thử kê đơn (tồn kho: 20 viên, đơn giá: 5.000đ)
            $med = Thuoc::create([
                'TenThuoc' => 'Thuốc Kiểm Thử G4.2 Paracetamol 500mg',
                'HoatChat' => 'Paracetamol',
                'DonViTinh' => 'Viên',
                'DangBaoChe' => 'Viên nén',
                'DonGia' => 5000.00,
                'SoLuongTon' => 20,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdMedicines[] = $med->MaThuoc;

            // Dịch vụ cận lâm sàng kiểm thử (đơn giá: 150.000đ)
            $service = DichVu::create([
                'TenDichVu' => 'Dịch Vụ Cận Lâm Sàng G4.2 Test',
                'DonGia' => 150000.00,
                'MoTa' => 'Kiểm tra cận lâm sàng chuyên biệt Giai đoạn 4.2',
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdServices[] = $service->MaDichVu;

            // Lượt khám cũ trước đây của Bệnh nhân (để test Patient History)
            $oldVisit = LuotKham::create([
                'MaBenhNhan' => $pat->MaBenhNhan,
                'MaBacSi' => $doc1->MaBacSi,
                'ThoiGianTiepNhan' => now()->subDays(10),
                'ThoiGianBatDauKham' => now()->subDays(10),
                'ThoiGianKetThucKham' => now()->subDays(10),
                'TrangThai' => 'HOAN_THANH',
                'GhiChu' => 'Lần khám trước đó 10 ngày',
            ]);
            $createdVisits[] = $oldVisit->MaLuotKham;

            $oldPhieuKham = PhieuKham::create([
                'MaLuotKham' => $oldVisit->MaLuotKham,
                'TrieuChung' => 'Sốt nhẹ, ho khan',
                'ChanDoan' => 'Viêm họng cấp tính do thời tiết',
                'KetQuaKham' => 'Họng đỏ nhẹ, amidan không sưng',
                'HuongDieuTri' => 'Uống thuốc ngoại trú và nghỉ ngơi',
                'LoiDanBacSi' => 'Uống nhiều nước ấm, súc họng nước muối',
            ]);
            $createdPhieuKhams[] = $oldPhieuKham->MaPhieuKham;

            // Lượt khám hôm nay cần khám (Đang ở trạng thái CHO_KHAM)
            $currentVisit = LuotKham::create([
                'MaBenhNhan' => $pat->MaBenhNhan,
                'MaBacSi' => $doc1->MaBacSi,
                'ThoiGianTiepNhan' => now(),
                'TrangThai' => 'CHO_KHAM',
                'GhiChu' => 'Đau quặn bụng vùng thượng vị sau ăn',
            ]);
            $createdVisits[] = $currentVisit->MaLuotKham;

            // =========================================================
            // MỤC 1: KIỂM THỬ KẾT NỐI MÀN HÌNH KHÁM BỆNH & PROPS
            // =========================================================
            $this->info('--- PHẦN 1: KẾT NỐI MÀN HÌNH KHÁM BỆNH & PROPS THỰC TẾ ---');
            $this->line('1.1. Bác sĩ 1 truy cập /doctor/examine...');
            $req1_1 = Request::create('/doctor/examine', 'GET');
            $req1_1->setUserResolver(fn() => $tkDoc1);
            $res1_1 = $luotKhamCtrl->index($req1_1);

            $inertiaProps = $res1_1->toResponse($req1_1)->getOriginalContent()['page']['props'];

            $hasVisits = isset($inertiaProps['visits']);
            $hasSelectedVisit = isset($inertiaProps['selectedVisit']);
            $hasPatientHistory = isset($inertiaProps['patientHistory']);
            $hasMedicines = isset($inertiaProps['availableMedicines']);
            $hasServices = isset($inertiaProps['availableServices']);
            $hasStats = isset($inertiaProps['stats']);

            if ($hasVisits && $hasSelectedVisit && $hasPatientHistory && $hasMedicines && $hasServices && $hasStats) {
                $this->info('   -> PASS: Render Inertia Doctor/Examine đầy đủ props (visits, selectedVisit, patientHistory, availableMedicines, availableServices, stats)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Thiếu props khi render màn hình khám bệnh!');
                $failed++;
            }

            // 1.2 Kiểm tra Lịch sử khám trước đây của bệnh nhân
            $this->line('1.2. Kiểm tra dữ liệu lịch sử khám (Patient History) chỉ thuộc đúng bệnh nhân...');
            $historyItems = collect($inertiaProps['patientHistory']);
            $hasOldVisit = $historyItems->contains('MaLuotKham', $oldVisit->MaLuotKham);
            $hasCurrentVisitInHistory = $historyItems->contains('MaLuotKham', $currentVisit->MaLuotKham);

            if ($hasOldVisit && !$hasCurrentVisitInHistory) {
                $this->info("   -> PASS: Lịch sử khám bệnh nhân chuẩn xác (Hiển thị LK cũ #{$oldVisit->MaLuotKham}, loại trừ LK hiện tại)");
                $passed++;
            } else {
                $this->error('   -> FAIL: Lịch sử khám bệnh nhân không khớp!');
                $failed++;
            }

            // =========================================================
            // MỤC 2: PHÂN QUYỀN & BỘ LỌC HÀNG CHỜ BÁC SĨ
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 2: PHÂN QUYỀN VÀ BỘ LỌC HÀNG CHỜ BÁC SĨ ---');
            $this->line('2.1. Phân quyền: Bác sĩ 2 không thấy lượt khám của Bác sĩ 1...');
            $req2_1 = Request::create('/doctor/examine', 'GET');
            $req2_1->setUserResolver(fn() => $tkDoc2);
            $res2_1 = $luotKhamCtrl->index($req2_1);
            $props2_1 = $res2_1->toResponse($req2_1)->getOriginalContent()['page']['props'];

            $doc2Visits = collect($props2_1['visits']);
            if (!$doc2Visits->contains('MaLuotKham', $currentVisit->MaLuotKham)) {
                $this->info('   -> PASS: Phân quyền tuyệt đối: Bác sĩ 2 không thấy lượt khám của Bác sĩ 1.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Rò rỉ lượt khám của Bác sĩ 1 cho Bác sĩ 2!');
                $failed++;
            }

            // 2.1b Bác sĩ 2 cố truy cập trực tiếp ID lượt khám của Bác sĩ 1
            $this->line('2.1b. Bảo mật: Bác sĩ 2 cố truy cập trực tiếp ID lượt khám của Bác sĩ 1 (403)...');
            $reqShow2 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}", 'GET');
            $reqShow2->setUserResolver(fn() => $tkDoc2);
            $resShow2 = $luotKhamCtrl->show($reqShow2, $currentVisit->MaLuotKham);

            $reqExam2 = Request::create('/doctor/examine', 'GET', ['visit_id' => $currentVisit->MaLuotKham]);
            $reqExam2->setUserResolver(fn() => $tkDoc2);
            $blockedExamine = false;
            try {
                $luotKhamCtrl->index($reqExam2);
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                if ($e->getStatusCode() === 403) {
                    $blockedExamine = true;
                }
            }

            if ($resShow2->getStatusCode() === 403 && $blockedExamine) {
                $this->info('   -> PASS: Chặn thành công cả API show (403) và Inertia examine (403) khi truy cập lượt khám bác sĩ khác.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bác sĩ 2 truy cập được lượt khám của Bác sĩ 1!');
                $failed++;
            }

            $this->line('2.2. Tìm kiếm theo tên hoặc SĐT bệnh nhân...');
            $req2_2 = Request::create('/doctor/examine', 'GET', ['search' => '0933445566']);
            $req2_2->setUserResolver(fn() => $tkDoc1);
            $res2_2 = $luotKhamCtrl->index($req2_2);
            $props2_2 = $res2_2->toResponse($req2_2)->getOriginalContent()['page']['props'];

            $foundSearch = collect($props2_2['visits'])->contains('MaLuotKham', $currentVisit->MaLuotKham);
            if ($foundSearch) {
                $this->info('   -> PASS: Tìm kiếm bệnh nhân theo số điện thoại thành công.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Không tìm thấy bệnh nhân khi tìm kiếm SĐT');
                $failed++;
            }

            // =========================================================
            // MỤC 3: QUY TRÌNH BẮT ĐẦU KHÁM & LẬP PHIẾU KHÁM
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 3: BẮT ĐẦU KHÁM & LẬP PHIẾU KHÁM BỆNH ---');
            $this->line('3.1. Bác sĩ 1 bắt đầu khám lượt khám #currentVisit...');
            $req3_1 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/start", 'POST');
            $req3_1->setUserResolver(fn() => $tkDoc1);
            $res3_1 = $luotKhamCtrl->startExamine($req3_1, $currentVisit->MaLuotKham);

            if ($res3_1->getStatusCode() === 200 && $currentVisit->fresh()->TrangThai === 'DANG_KHAM') {
                $this->info('   -> PASS: Bắt đầu khám thành công, lượt khám chuyển sang DANG_KHAM.');
                $passed++;
            } else {
                $this->error('   -> FAIL: Không thể bắt đầu khám');
                $failed++;
            }

            $this->line('3.2. Validation: Lưu phiếu khám khi thiếu chẩn đoán hoặc triệu chứng (422)...');
            $req3_2 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => '',
                'ChanDoan' => '',
            ]);
            $req3_2->setUserResolver(fn() => $tkDoc1);
            try {
                $luotKhamCtrl->savePhieuKham($req3_2, $currentVisit->MaLuotKham);
                $this->error('   -> FAIL: Bỏ qua validation phiếu khám!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Bắt lỗi validation tiếng Việt thành công: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE));
                $passed++;
            }

            $this->line('3.3. Bác sĩ 1 lưu phiếu khám hợp lệ...');
            $req3_3 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => 'Đau rát vùng thượng vị, ợ chua nhiều sau ăn đồ chua cay',
                'ChanDoan' => 'Viêm dạ dày cấp tính',
                'KetQuaKham' => 'Bụng mềm, ấn đau tức nhẹ vùng thượng vị, không đề kháng',
                'HuongDieuTri' => 'Điều trị ngoại trú bằng thuốc ức chế tiết acid và bảo vệ niêm mạc',
                'LoiDanBacSi' => 'Ăn uống đúng giờ, tránh đồ cay nóng và rượu bia',
            ]);
            $req3_3->setUserResolver(fn() => $tkDoc1);
            $res3_3 = $luotKhamCtrl->savePhieuKham($req3_3, $currentVisit->MaLuotKham);
            $data3_3 = json_decode($res3_3->getContent(), true);

            if ($res3_3->getStatusCode() === 200 && $data3_3['success'] === true) {
                $createdPhieuKhams[] = $data3_3['data']['MaPhieuKham'];
                $this->info('   -> PASS: Lưu phiếu khám thành công: ' . $data3_3['data']['ChanDoan']);
                $passed++;
            } else {
                $this->error('   -> FAIL: Lưu phiếu khám thất bại');
                $failed++;
            }

            // =========================================================
            // MỤC 4: KÊ ĐƠN THUỐC VÀ TỒN KHO THUỐC
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 4: KÊ ĐƠN THUỐC VÀ TRỪ TỒN KHO TỰ ĐỘNG ---');
            $this->line('4.1. Bác sĩ 1 kê đơn 5 viên Paracetamol (Tồn kho: 20)...');
            $req4_1 = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $currentVisit->MaLuotKham,
                'LoiDan' => 'Uống 1 viên khi đau hoặc sốt cao',
                'items' => [
                    [
                        'MaThuoc' => $med->MaThuoc,
                        'SoLuong' => 5,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '2 lần/ngày khi đau',
                        'ThoiGianDung' => '3 ngày',
                        'CachDung' => 'Uống sau ăn',
                    ]
                ]
            ]);
            $req4_1->setUserResolver(fn() => $tkDoc1);
            $res4_1 = $donThuocCtrl->store($req4_1);
            $data4_1 = json_decode($res4_1->getContent(), true);

            if ($res4_1->getStatusCode() === 201 && $data4_1['success'] === true) {
                $createdPrescriptionId = $data4_1['data']['MaDonThuoc'];
                $createdPrescriptions[] = $createdPrescriptionId;
                $medFresh = $med->fresh();

                if ($medFresh->SoLuongTon === 15) {
                    $this->info("   -> PASS: Kê đơn thành công [Đơn #{$createdPrescriptionId}]. Tồn kho tự động trừ 5 viên: 20 -> 15.");
                    $passed++;
                } else {
                    $this->error("   -> FAIL: Tồn kho không trừ đúng: {$medFresh->SoLuongTon}");
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Kê đơn thuốc thất bại: ' . $res4_1->getContent());
                $failed++;
            }

            // 4.1b Chống double-submit / gửi request kê đơn 2 lần cho cùng lượt khám
            $this->line('4.1b. Chống double submit: Gửi yêu cầu kê đơn lần 2 cho cùng lượt khám...');
            try {
                $donThuocCtrl->store($req4_1);
                $this->error('   -> FAIL: Cho phép kê đơn trùng lặp 2 lần cho cùng lượt khám!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn double submit kê đơn thành công: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE));
                $passed++;
            }

            // 4.1c Cập nhật đơn thuốc tính toán Delta tồn kho: tăng 5 -> 8 viên (kho: 15 -> 12), giảm 8 -> 3 viên (kho: 12 -> 17)
            $this->line('4.1c. Cập nhật đơn thuốc: kiểm tra tính toán chênh lệch tồn kho Delta...');
            $reqUpdate = Request::create("/doctor/prescriptions/{$createdPrescriptionId}", 'PUT', [
                'items' => [
                    [
                        'MaThuoc' => $med->MaThuoc,
                        'SoLuong' => 8,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '2 lần/ngày',
                    ]
                ]
            ]);
            $reqUpdate->setUserResolver(fn() => $tkDoc1);
            $donThuocCtrl->update($reqUpdate, $createdPrescriptionId);
            $medAfterIncrease = $med->fresh();

            $reqUpdate2 = Request::create("/doctor/prescriptions/{$createdPrescriptionId}", 'PUT', [
                'items' => [
                    [
                        'MaThuoc' => $med->MaThuoc,
                        'SoLuong' => 3,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '1 lần/ngày',
                    ]
                ]
            ]);
            $reqUpdate2->setUserResolver(fn() => $tkDoc1);
            $donThuocCtrl->update($reqUpdate2, $createdPrescriptionId);
            $medAfterDecrease = $med->fresh();

            if ($medAfterIncrease->SoLuongTon === 12 && $medAfterDecrease->SoLuongTon === 17) {
                $this->info('   -> PASS: Cập nhật đơn thuốc điều chỉnh tồn kho chính xác theo Delta (15 -> 12 -> 17).');
                $passed++;
            } else {
                $this->error("   -> FAIL: Lệch tồn kho khi update: Tăng={$medAfterIncrease->SoLuongTon}, Giảm={$medAfterDecrease->SoLuongTon}");
                $failed++;
            }

            // 4.1d Hủy đơn thuốc & hoàn trả tồn kho (17 + 3 = 20)
            $this->line('4.1d. Hủy đơn thuốc & kiểm tra tồn kho hoàn trả đúng 1 lần...');
            $reqCancel = Request::create("/doctor/prescriptions/{$createdPrescriptionId}/cancel", 'POST');
            $reqCancel->setUserResolver(fn() => $tkDoc1);
            $donThuocCtrl->cancel($reqCancel, $createdPrescriptionId);
            $medAfterCancel = $med->fresh();

            // 4.1e Thử hủy lần 2 (Idempotency)
            $resCancel2 = $donThuocCtrl->cancel($reqCancel, $createdPrescriptionId);
            $medAfterCancel2 = $med->fresh();

            if ($medAfterCancel->SoLuongTon === 20 && $resCancel2->getStatusCode() === 422 && $medAfterCancel2->SoLuongTon === 20) {
                $this->info('   -> PASS: Hủy đơn thuốc hoàn kho an toàn tuyệt đối (20 viên) & Idempotent (chặn hủy lần 2, không hoàn kho trùng lặp).');
                $passed++;
            } else {
                $this->error("   -> FAIL: Hoàn kho sai lệch khi hủy đơn: {$medAfterCancel->SoLuongTon} -> {$medAfterCancel2->SoLuongTon}");
                $failed++;
            }

            // 4.1f Kê đơn mới 5 viên cho lượt khám chính (kho: 20 -> 15)
            $res4_1f = $donThuocCtrl->store($req4_1);
            $createdPrescriptions[] = json_decode($res4_1f->getContent(), true)['data']['MaDonThuoc'];

            // 4.2 Chặn kê đơn vượt quá tồn kho (yêu cầu 100 viên trong khi tồn chỉ còn 15)
            $this->line('4.2. Kiểm tra chặn kê đơn vượt quá số lượng tồn kho...');
            // Tạo lượt khám tạm khác để thử kê vượt kho
            $tempVisit = LuotKham::create([
                'MaBenhNhan' => $pat->MaBenhNhan,
                'MaBacSi' => $doc1->MaBacSi,
                'ThoiGianTiepNhan' => now(),
                'TrangThai' => 'DANG_KHAM',
            ]);
            $createdVisits[] = $tempVisit->MaLuotKham;

            $req4_2 = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $tempVisit->MaLuotKham,
                'items' => [
                    [
                        'MaThuoc' => $med->MaThuoc,
                        'SoLuong' => 100,
                        'LieuDung' => '1 viên/lần',
                        'TanSuat' => '2 lần/ngày',
                    ]
                ]
            ]);
            $req4_2->setUserResolver(fn() => $tkDoc1);
            try {
                $donThuocCtrl->store($req4_2);
                $this->error('   -> FAIL: Cho phép kê thuốc vượt quá tồn kho!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn kê vượt tồn kho thành công: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE));
                $passed++;
            }

            // =========================================================
            // MỤC 5: CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG & NHẬP KẾT QUẢ
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 5: CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG ---');
            $this->line('5.1. Bác sĩ 1 chỉ định dịch vụ cận lâm sàng...');
            $req5_1 = Request::create('/doctor/service-requests', 'POST', [
                'MaLuotKham' => $currentVisit->MaLuotKham,
                'MaDichVu' => $service->MaDichVu,
                'GhiChu' => 'Nghi ngờ tổn thương niêm mạc',
            ]);
            $req5_1->setUserResolver(fn() => $tkDoc1);
            $res5_1 = $chiDinhCtrl->store($req5_1);
            $data5_1 = json_decode($res5_1->getContent(), true);

            if ($res5_1->getStatusCode() === 201 && $data5_1['success'] === true) {
                $createdReqId = $data5_1['data']['MaChiDinh'];
                $createdRequests[] = $createdReqId;
                $this->info("   -> PASS: Chỉ định dịch vụ thành công [ID #{$createdReqId}, Giá: 150.000đ, Trạng thái: CHO_THUC_HIEN]");
                $passed++;
            } else {
                $this->error('   -> FAIL: Chỉ định dịch vụ thất bại: ' . $res5_1->getContent());
                $failed++;
            }

            // 5.1b Quy tắc nghiệp vụ: Chặn hoàn tất buổi khám khi còn dịch vụ cận lâm sàng chưa có kết quả (422)
            $this->line('5.1b. Quy tắc nghiệp vụ: Chặn hoàn tất buổi khám khi còn dịch vụ cận lâm sàng chưa có kết quả (422)...');
            $reqPrematureComplete = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/complete", 'POST');
            $reqPrematureComplete->setUserResolver(fn() => $tkDoc1);
            $resPremature = $luotKhamCtrl->completeExamine($reqPrematureComplete, $currentVisit->MaLuotKham);

            if ($resPremature->getStatusCode() === 422) {
                $this->info('   -> PASS: Chặn hoàn tất khi còn dịch vụ chưa có kết quả thành công: ' . json_decode($resPremature->getContent(), true)['message']);
                $passed++;
            } else {
                $this->error('   -> FAIL: Cho phép hoàn tất khám khi cận lâm sàng chưa có kết quả!');
                $failed++;
            }

            $this->line('5.2. Bác sĩ 1 cập nhật kết quả cận lâm sàng...');
            $req5_2 = Request::create("/doctor/service-requests/{$createdReqId}/result", 'POST', [
                'KetQua' => 'Niêm mạc hang vị xung huyết nhẹ, không thấy ổ loét sâu',
            ]);
            $req5_2->setUserResolver(fn() => $tkDoc1);
            $res5_2 = $chiDinhCtrl->updateResult($req5_2, $createdReqId);
            $data5_2 = json_decode($res5_2->getContent(), true);

            if ($res5_2->getStatusCode() === 200 && $data5_2['success'] === true && $data5_2['data']['TrangThai'] === 'HOAN_THANH') {
                $this->info('   -> PASS: Nhập kết quả dịch vụ cận lâm sàng thành công (Chuyển HOAN_THANH).');
                $passed++;
            } else {
                $this->error('   -> FAIL: Nhập kết quả cận lâm sàng thất bại');
                $failed++;
            }

            // =========================================================
            // MỤC 6: HOÀN THÀNH LƯỢT KHÁM & KHÓA DỮ LIỆU
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 6: HOÀN THÀNH LƯỢT KHÁM & KHÓA DỮ LIỆU BỆNH ÁN ---');
            $this->line('6.1. Bác sĩ 1 hoàn thành lượt khám #currentVisit...');
            $req6_1 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/complete", 'POST');
            $req6_1->setUserResolver(fn() => $tkDoc1);
            $res6_1 = $luotKhamCtrl->completeExamine($req6_1, $currentVisit->MaLuotKham);

            if ($res6_1->getStatusCode() === 200 && $currentVisit->fresh()->TrangThai === 'HOAN_THANH') {
                $this->info('   -> PASS: Hoàn tất buổi khám bệnh thành công (Chuyển HOAN_THANH).');
                $passed++;
            } else {
                $this->error('   -> FAIL: Hoàn thành lượt khám thất bại');
                $failed++;
            }

            $this->line('6.2. Kiểm tra khóa dữ liệu: Chặn sửa phiếu khám, kê đơn và chỉ định dịch vụ sau khi hoàn tất (422)...');
            $req6_2 = Request::create("/doctor/visits/{$currentVisit->MaLuotKham}/phieu-kham", 'POST', [
                'TrieuChung' => 'Sửa triệu chứng trái phép',
                'ChanDoan' => 'Sửa chẩn đoán trái phép',
            ]);
            $req6_2->setUserResolver(fn() => $tkDoc1);
            $res6_2 = $luotKhamCtrl->savePhieuKham($req6_2, $currentVisit->MaLuotKham);

            $reqPrescBlocked = Request::create('/doctor/prescriptions', 'POST', [
                'MaLuotKham' => $currentVisit->MaLuotKham,
                'items' => [['MaThuoc' => $med->MaThuoc, 'SoLuong' => 1, 'LieuDung' => '1 viên', 'TanSuat' => '1 lần']]
            ]);
            $reqPrescBlocked->setUserResolver(fn() => $tkDoc1);
            $resPrescBlocked = $donThuocCtrl->store($reqPrescBlocked);

            $reqServiceBlocked = Request::create('/doctor/service-requests', 'POST', [
                'MaLuotKham' => $currentVisit->MaLuotKham,
                'MaDichVu' => $service->MaDichVu,
            ]);
            $reqServiceBlocked->setUserResolver(fn() => $tkDoc1);
            $resServiceBlocked = $chiDinhCtrl->store($reqServiceBlocked);

            if ($res6_2->getStatusCode() === 422 && $resPrescBlocked->getStatusCode() === 422 && $resServiceBlocked->getStatusCode() === 422) {
                $this->info('   -> PASS: Hồ sơ đã được khóa an toàn tuyệt đối (Chặn sửa phiếu khám, chặn kê thêm thuốc, chặn chỉ định thêm dịch vụ 422).');
                $passed++;
            } else {
                $this->error('   -> FAIL: Cho phép sửa dữ liệu sau khi lượt khám đã hoàn thành!');
                $failed++;
            }

        } catch (\Throwable $e) {
            $this->error('LỖI KHÔNG MONG MUỐN: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            $failed++;
        } finally {
            // =========================================================
            // DỌN DẸP DỮ LIỆU TEST AN TOÀN
            // =========================================================
            $this->info('');
            $this->info('--- DỌN DẸP DỮ LIỆU TEST ---');

            if (!empty($createdRequests)) {
                ChiDinhDichVu::whereIn('MaChiDinh', $createdRequests)->delete();
                $this->line('   -> Đã xóa chỉ định dịch vụ test: ' . implode(', ', $createdRequests));
            }
            if (!empty($createdPrescriptions)) {
                \App\Models\ChiTietDonThuoc::whereIn('MaDonThuoc', $createdPrescriptions)->delete();
                DonThuoc::whereIn('MaDonThuoc', $createdPrescriptions)->delete();
                $this->line('   -> Đã xóa đơn thuốc test: ' . implode(', ', $createdPrescriptions));
            }
            if (!empty($createdPhieuKhams)) {
                PhieuKham::whereIn('MaPhieuKham', $createdPhieuKhams)->delete();
                $this->line('   -> Đã xóa phiếu khám test: ' . implode(', ', $createdPhieuKhams));
            }
            if (!empty($createdVisits)) {
                LuotKham::whereIn('MaLuotKham', $createdVisits)->delete();
                $this->line('   -> Đã xóa lượt khám test: ' . implode(', ', $createdVisits));
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
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4.2: PASS: {$passed} | FAIL: {$failed}");
        $this->info('================================================================');
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
