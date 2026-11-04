<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TaiKhoan;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\ChiDinhDichVu;
use App\Models\DichVu;
use App\Models\Thuoc;
use App\Models\DonThuoc;
use App\Models\ChiTietDonThuoc;
use App\Http\Controllers\LuotKhamController;
use App\Http\Controllers\ChiDinhDichVuController;
use App\Http\Controllers\CanLamSangController;
use App\Http\Controllers\DonThuocController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerifyDoctorExamClsMedicineCommand extends Command
{
    protected $signature = 'test:verify-doctor-exam-cls-medicine';
    protected $description = 'Chạy bộ kiểm thử nghiệm thu 12 ca kiểm thử cho liên kết Phiếu khám, Chỉ định CLS, Kết quả CLS và Danh mục Thuốc';

    public function handle()
    {
        $this->info("==========================================================================");
        $this->info("   SMARTCARE ACCEPTANCE TEST SUITE: DOCTOR - EXAM - CLS - MEDICINE        ");
        $this->info("==========================================================================");

        $passedCount = 0;
        $totalCount = 12;

        // 0. Chuẩn bị dữ liệu tài khoản
        $bacSiUser = TaiKhoan::with(['vaiTro', 'bacSi'])->where('Email', 'bacsi.nam@smartcare.vn')->orWhere('TenDangNhap', 'bacsi_nam')->first();
        if (!$bacSiUser) {
            $this->error("Không tìm thấy tài khoản bác sĩ bacsi.nam");
            return 1;
        }
        $bacSi = $bacSiUser->bacSi ?? BacSi::where('MaTaiKhoan', $bacSiUser->MaTaiKhoan)->first();

        // Bác sĩ thứ 2 để test IDOR
        $bacSiUser2 = TaiKhoan::with(['vaiTro', 'bacSi'])->where('MaVaiTro', 2)->where('MaTaiKhoan', '!=', $bacSiUser->MaTaiKhoan)->first();
        if (!$bacSiUser2) {
            $bacSiUser2 = TaiKhoan::create([
                'TenDangNhap' => 'bacsi.test_idor',
                'MatKhau' => bcrypt('SmartCare@2026'),
                'Email' => 'bacsi.idor@smartcare.vn',
                'SoDienThoai' => '0988776655',
                'MaVaiTro' => 2,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $bacSi2 = BacSi::create([
                'MaTaiKhoan' => $bacSiUser2->MaTaiKhoan,
                'HoTen' => 'BS Test IDOR',
                'ChuyenKhoa' => 'Nội tổng quát',
                'HocVi' => 'Bác sĩ CK I',
                'GiaKham' => 150000,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $bacSiUser2->load(['vaiTro', 'bacSi']);
        } else {
            $bacSi2 = $bacSiUser2->bacSi ?? BacSi::where('MaTaiKhoan', $bacSiUser2->MaTaiKhoan)->first();
        }

        $clsUser = TaiKhoan::with('vaiTro')->where('Email', 'cls@smartcare.vn')->orWhere('TenDangNhap', 'cls_nhom9')->first();
        if (!$clsUser) {
            $this->error("Không tìm thấy tài khoản cls");
            return 1;
        }

        $benhNhan = BenhNhan::first();
        if (!$benhNhan) {
            $this->error("Không tìm thấy bệnh nhân nào trong hệ thống");
            return 1;
        }

        $dichVus = DichVu::where('TrangThai', 'HOAT_DONG')->take(2)->get();
        if ($dichVus->count() < 2) {
            $this->error("Cần ít nhất 2 dịch vụ hoạt động trong bảng dich_vu");
            return 1;
        }

        $thuocs = Thuoc::where('TrangThai', 'HOAT_DONG')->where('SoLuongTon', '>', 5)->take(2)->get();
        if ($thuocs->count() < 2) {
            $this->error("Cần ít nhất 2 thuốc hoạt động và còn tồn kho trong bảng thuoc");
            return 1;
        }

        $luotKhamController = app(LuotKhamController::class);
        $doctorChiDinhController = app(ChiDinhDichVuController::class);
        $clsController = app(CanLamSangController::class);
        $prescriptionController = app(DonThuocController::class);

        // ---------------------------------------------------------------------
        // TEST CASE 1: Bác sĩ mở lượt khám thấy thông tin BN và phiếu khám ban đầu
        // ---------------------------------------------------------------------
        $this->line("\n[TC1] Kiểm tra Bác sĩ mở lượt khám thấy thông tin BN & Phiếu khám ban đầu...");
        $visit1 = LuotKham::create([
            'MaBenhNhan' => $benhNhan->MaBenhNhan,
            'MaBacSi' => $bacSi->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'CHO_KHAM',
            'GhiChu' => 'Khám đau dạ dày',
        ]);

        $request1 = Request::create("/doctor/examine", 'GET', ['visit_id' => $visit1->MaLuotKham]);
        $request1->headers->set('X-Inertia', 'true');
        $request1->setUserResolver(fn() => $bacSiUser);
        $response1 = $luotKhamController->index($request1);

        $jsonResp1 = $response1->toResponse($request1);
        $pageProps = method_exists($jsonResp1, 'getData') ? ($jsonResp1->getData(true)['props'] ?? []) : [];
        $selectedVisit = $pageProps['selectedVisit'] ?? null;
        $selVisitId = is_array($selectedVisit) ? ($selectedVisit['MaLuotKham'] ?? null) : ($selectedVisit?->MaLuotKham ?? null);
        $selBenhNhan = is_array($selectedVisit) ? ($selectedVisit['benhNhan'] ?? $selectedVisit['benh_nhan'] ?? null) : ($selectedVisit?->benhNhan ?? null);
        $tenBN = is_array($selBenhNhan) ? ($selBenhNhan['HoTen'] ?? '') : ($selBenhNhan?->HoTen ?? '');

        if ($selectedVisit && (int)$selVisitId === (int)$visit1->MaLuotKham && $selBenhNhan) {
            $this->info("  --> PASS: Lượt khám #{$visit1->MaLuotKham} tải thành công đầy đủ thông tin BN {$tenBN}.");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Không tải được selectedVisit hoặc thông tin bệnh nhân. (selVisitId: " . var_export($selVisitId, true) . ", expected: {$visit1->MaLuotKham})");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 2: Bác sĩ lưu chẩn đoán ban đầu và bảo toàn khi tải lại
        // ---------------------------------------------------------------------
        $this->line("\n[TC2] Kiểm tra Bác sĩ lưu chẩn đoán ban đầu (Giai đoạn 1)...");
        $initialData = [
            'TrieuChung' => 'Đau quặn thượng vị từng cơn sau khi ăn no 2 giờ',
            'TienSuBenh' => 'Có tiền sử đau dạ dày nhẹ cách đây 1 năm',
            'KetQuaKham' => 'Bụng mềm, ấn đau tức điểm thượng vị, không đề kháng thành bụng',
            'ChanDoanBanDau' => 'Theo dõi Viêm loét dạ dày tá tràng / Nghi trào ngược dạ dày thực quản',
        ];
        $request2 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', $initialData);
        $request2->setUserResolver(fn() => $bacSiUser);
        $response2 = $luotKhamController->savePhieuKham($request2, $visit1->MaLuotKham);

        $savedPhieu = PhieuKham::where('MaLuotKham', $visit1->MaLuotKham)->first();
        if ($savedPhieu && $savedPhieu->ChanDoanBanDau === $initialData['ChanDoanBanDau'] && $savedPhieu->TrieuChung === $initialData['TrieuChung']) {
            $this->info("  --> PASS: Đã lưu thành công phiếu khám ban đầu (ChanDoanBanDau: '{$savedPhieu->ChanDoanBanDau}').");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: ChanDoanBanDau không khớp hoặc chưa lưu vào DB.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 3: Bác sĩ tạo 2 chỉ định CLS và thấy cả 2 với MaPhieuKham liên kết
        // ---------------------------------------------------------------------
        $this->line("\n[TC3] Kiểm tra Bác sĩ chỉ định 2 dịch vụ cận lâm sàng (CLS)...");
        $dv1 = $dichVus[0];
        $dv2 = $dichVus[1];

        $request3 = Request::create("/doctor/service-requests", 'POST', [
            'MaLuotKham' => $visit1->MaLuotKham,
            'items' => [
                ['MaDichVu' => $dv1->MaDichVu, 'GhiChu' => 'Làm nhanh kiểm tra vi khuẩn HP'],
                ['MaDichVu' => $dv2->MaDichVu, 'GhiChu' => 'Kiểm tra niêm mạc dạ dày'],
            ],
        ]);
        $request3->setUserResolver(fn() => $bacSiUser);
        $doctorChiDinhController->store($request3);

        $chiDinhs = ChiDinhDichVu::where('MaLuotKham', $visit1->MaLuotKham)->get();
        $visit1->refresh();

        if ($chiDinhs->count() === 2 && 
            $chiDinhs->every(fn($cd) => $cd->MaPhieuKham === $savedPhieu->MaPhieuKham) &&
            $visit1->TrangThai === 'CHO_KET_QUA') {
            $this->info("  --> PASS: Tạo thành công 2 chỉ định CLS, cả 2 đều tự động liên kết MaPhieuKham #{$savedPhieu->MaPhieuKham}, lượt khám chuyển CHO_KET_QUA.");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Không đủ 2 chỉ định hoặc chưa liên kết MaPhieuKham hoặc trạng thái không phải CHO_KET_QUA.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 4: Nhân viên CLS tiếp nhận & nhập kết quả cho 2 chỉ định
        // ---------------------------------------------------------------------
        $this->line("\n[TC4] Kiểm tra Nhân viên CLS tiếp nhận và nhập kết quả xét nghiệm...");
        $cd1 = $chiDinhs[0];
        $cd2 = $chiDinhs[1];

        // KTV tiếp nhận
        $reqReceive1 = Request::create("/cls/requests/{$cd1->MaChiDinh}/receive", 'POST');
        $reqReceive1->setUserResolver(fn() => $clsUser);
        $clsController->receive($reqReceive1, $cd1->MaChiDinh);

        // KTV nhập KQ 1
        $reqResult1 = Request::create("/cls/requests/{$cd1->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Dương tính (+)',
            'DonViDo' => 'Titer',
            'KhoangThamChieu' => 'Âm tính (-)',
            'KetLuan' => 'Vi khuẩn HP phát triển mạnh',
        ]);
        $reqResult1->setUserResolver(fn() => $clsUser);
        $clsController->updateResult($reqResult1, $cd1->MaChiDinh);

        // KTV nhập KQ 2
        $reqResult2 = Request::create("/cls/requests/{$cd2->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Xung huyết hang vị dạ dày mức độ vừa',
            'DonViDo' => 'Hình ảnh',
            'KhoangThamChieu' => 'Niêm mạc nhẵn bóng',
            'KetLuan' => 'Viêm sung huyết niêm mạc hang vị',
        ]);
        $reqResult2->setUserResolver(fn() => $clsUser);
        $clsController->updateResult($reqResult2, $cd2->MaChiDinh);

        $cd1->refresh();
        $cd2->refresh();
        $visit1->refresh();

        if ($cd1->TrangThai === 'DA_CO_KET_QUA' && 
            $cd2->TrangThai === 'DA_CO_KET_QUA' && 
            $cd1->MaNhanVienThucHien === $clsUser->MaTaiKhoan &&
            $visit1->TrangThai === 'CHO_KHAM_LAI') {
            $this->info("  --> PASS: KTV nhập kết quả thành công, ghi nhận MaNhanVienThucHien #{$clsUser->MaTaiKhoan}, lượt khám tự động chuyển CHO_KHAM_LAI.");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Trạng thái chỉ định chưa DA_CO_KET_QUA hoặc lượt khám chưa sang CHO_KHAM_LAI.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 5: Bác sĩ nhìn thấy đầy đủ kết quả CLS trên đúng phiếu khám
        // ---------------------------------------------------------------------
        $this->line("\n[TC5] Kiểm tra Bác sĩ nhìn thấy đầy đủ kết quả CLS khi tải lượt khám...");
        $request5 = Request::create("/doctor/examine", 'GET', ['visit_id' => $visit1->MaLuotKham]);
        $request5->headers->set('X-Inertia', 'true');
        $request5->setUserResolver(fn() => $bacSiUser);
        $response5 = $luotKhamController->index($request5);

        $jsonResp5 = $response5->toResponse($request5);
        $pageProps5 = method_exists($jsonResp5, 'getData') ? ($jsonResp5->getData(true)['props'] ?? []) : [];
        $loadedVisit5 = $pageProps5['selectedVisit'] ?? null;
        $loadedChiDinhs = is_array($loadedVisit5) 
            ? ($loadedVisit5['chiDinhDichVus'] ?? $loadedVisit5['chi_dinh_dich_vus'] ?? []) 
            : ($loadedVisit5?->chiDinhDichVus ?? []);

        $allHaveResult = count($loadedChiDinhs) === 2 && collect($loadedChiDinhs)->every(function($c) {
            $kq = is_array($c) ? ($c['KetQua'] ?? '') : ($c->KetQua ?? '');
            $nv = is_array($c) ? ($c['nhanVienThucHien'] ?? $c['nhan_vien_thuc_hien'] ?? null) : ($c->nhanVienThucHien ?? null);
            return !empty($kq) && $nv !== null;
        });

        if ($allHaveResult) {
            $firstCd = $loadedChiDinhs[0];
            $nvObj = is_array($firstCd) ? ($firstCd['nhanVienThucHien'] ?? $firstCd['nhan_vien_thuc_hien'] ?? []) : ($firstCd->nhanVienThucHien ?? null);
            $ktvName = is_array($nvObj) ? ($nvObj['TenDangNhap'] ?? 'KTV') : ($nvObj?->TenDangNhap ?? 'KTV');
            $this->info("  --> PASS: Bác sĩ tải đúng 2 kết quả CLS kèm thông tin KTV thực hiện ({$ktvName}).");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Thiếu kết quả CLS hoặc chưa eager load nhanVienThucHien.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 6: Bác sĩ nhập chẩn đoán sau CLS, bảo toàn chẩn đoán ban đầu
        // ---------------------------------------------------------------------
        $this->line("\n[TC6] Kiểm tra Bác sĩ nhập chẩn đoán sau CLS và kiểm tra bảo toàn chẩn đoán ban đầu...");
        $conclusionData = [
            'ChanDoanSauCLS' => 'Viêm loét dạ dày tá tràng thể hoạt động do vi khuẩn HP',
            'KetLuan' => 'Bệnh nhân có ổ viêm trợt hang vị, test HP dương tính',
            'HuongDieuTri' => 'Điều trị tiệt trừ HP phác đồ 4 thuốc có Bismuth trong 14 ngày',
            'LoiDanBacSi' => 'Ăn chín uống sôi, kiêng chua cay, không thức khuya, tái khám sau 2 tuần',
            'GhiChu' => 'Đã giải thích rõ cách dùng thuốc cho bệnh nhân',
        ];
        $request6 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', $conclusionData);
        $request6->setUserResolver(fn() => $bacSiUser);
        $luotKhamController->savePhieuKham($request6, $visit1->MaLuotKham);

        $savedPhieu->refresh();
        if ($savedPhieu->ChanDoanBanDau === $initialData['ChanDoanBanDau'] &&
            $savedPhieu->ChanDoanSauCLS === $conclusionData['ChanDoanSauCLS'] &&
            $savedPhieu->KetLuan === $conclusionData['KetLuan']) {
            $this->info("  --> PASS: Chẩn đoán ban đầu ('{$savedPhieu->ChanDoanBanDau}') được BẢO TOÀN NGUYÊN VẸN, không bị ghi đè bởi ChanDoanSauCLS ('{$savedPhieu->ChanDoanSauCLS}').");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: ChanDoanBanDau bị mất hoặc ChanDoanSauCLS không được lưu.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 7: Bác sĩ xem danh mục thuốc thật từ database
        // ---------------------------------------------------------------------
        $this->line("\n[TC7] Kiểm tra Danh mục thuốc truyền cho Bác sĩ lấy từ database thật...");
        $availableMedicines = $pageProps5['availableMedicines'] ?? [];
        $dbCount = Thuoc::where('TrangThai', 'HOAT_DONG')->count();

        if (count($availableMedicines) === $dbCount && count($availableMedicines) > 0) {
            $firstMed = $availableMedicines[0];
            $hasRequiredFields = array_key_exists('MaThuoc', $firstMed) &&
                                 array_key_exists('TenThuoc', $firstMed) &&
                                 array_key_exists('HamLuong', $firstMed) &&
                                 array_key_exists('DonViTinh', $firstMed) &&
                                 array_key_exists('DonGia', $firstMed) &&
                                 array_key_exists('SoLuongTon', $firstMed);
            if ($hasRequiredFields) {
                $this->info("  --> PASS: Danh mục thuốc có " . count($availableMedicines) . " loại thuốc thật từ DB, đầy đủ HamLuong, DonViTinh, SoLuongTon.");
                $passedCount++;
            } else {
                $this->error("  --> FAIL: Thiếu trường dữ liệu trong danh mục thuốc. (Fields: " . implode(', ', array_keys($firstMed)) . ")");
            }
        } else {
            $this->error("  --> FAIL: Số lượng thuốc khả dụng không khớp database.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 8: Bác sĩ kê đơn thuốc và hiển thị lại sau khi tải trang
        // ---------------------------------------------------------------------
        $this->line("\n[TC8] Kiểm tra Bác sĩ kê đơn thuốc nhiều loại & trừ tồn kho chính xác...");
        $th1 = $thuocs[0];
        $th2 = $thuocs[1];
        $tonKhoBanDau1 = $th1->SoLuongTon;
        $tonKhoBanDau2 = $th2->SoLuongTon;

        $prescriptionData = [
            'MaLuotKham' => $visit1->MaLuotKham,
            'LoiDan' => 'Uống đúng liều lượng, sau ăn 30 phút',
            'items' => [
                [
                    'MaThuoc' => $th1->MaThuoc,
                    'SoLuong' => 2,
                    'LieuDung' => '1 viên/lần',
                    'TanSuat' => '2 lần/ngày',
                    'ThoiGianDung' => '5 ngày',
                    'CachDung' => 'Uống sau ăn no',
                ],
                [
                    'MaThuoc' => $th2->MaThuoc,
                    'SoLuong' => 3,
                    'LieuDung' => '1 viên/lần',
                    'TanSuat' => '3 lần/ngày',
                    'ThoiGianDung' => '7 ngày',
                    'CachDung' => 'Uống trước khi đi ngủ',
                ],
            ],
        ];

        $request8 = Request::create("/doctor/prescriptions", 'POST', $prescriptionData);
        $request8->setUserResolver(fn() => $bacSiUser);
        $prescriptionController->store($request8);

        $th1->refresh();
        $th2->refresh();
        $donThuoc = DonThuoc::where('MaLuotKham', $visit1->MaLuotKham)->with('chiTietDonThuocs.thuoc')->first();

        $stockDeducted = ($th1->SoLuongTon === $tonKhoBanDau1 - 2) && ($th2->SoLuongTon === $tonKhoBanDau2 - 3);

        if ($donThuoc && $donThuoc->chiTietDonThuocs->count() === 2 && $stockDeducted) {
            $this->info("  --> PASS: Kê đơn #{$donThuoc->MaDonThuoc} thành công, trừ kho chính xác (Thuốc 1: {$tonKhoBanDau1} -> {$th1->SoLuongTon}, Thuốc 2: {$tonKhoBanDau2} -> {$th2->SoLuongTon}).");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Đơn thuốc không được tạo hoặc số lượng tồn kho không giảm đúng.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 9: Luồng 1 - Bệnh nhân không cần CLS hoàn tất trực tiếp
        // ---------------------------------------------------------------------
        $this->line("\n[TC9] Kiểm tra Luồng 1: Bệnh nhân không cần CLS hoàn tất khám trực tiếp...");
        $visitNoCls = LuotKham::create([
            'MaBenhNhan' => $benhNhan->MaBenhNhan,
            'MaBacSi' => $bacSi->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'DANG_KHAM',
            'GhiChu' => 'Cảm cúm thông thường, không chỉ định CLS',
        ]);

        // Lưu phiếu khám
        $reqNoClsExam = Request::create("/doctor/visits/{$visitNoCls->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Hắt hơi sổ mũi, sốt nhẹ 37.8 độ',
            'KetQuaKham' => 'Họng hơi đỏ, phổi trong không rale',
            'ChanDoanBanDau' => 'Viêm đường hô hấp trên thể nhẹ',
            'KetLuan' => 'Nhiễm siêu vi đường hô hấp trên',
            'HuongDieuTri' => 'Nghỉ ngơi, bù nước điện giải, hạ sốt khi cần',
        ]);
        $reqNoClsExam->setUserResolver(fn() => $bacSiUser);
        $luotKhamController->savePhieuKham($reqNoClsExam, $visitNoCls->MaLuotKham);

        // Bác sĩ hoàn tất khám
        $reqCompleteNoCls = Request::create("/doctor/visits/{$visitNoCls->MaLuotKham}/complete", 'POST');
        $reqCompleteNoCls->setUserResolver(fn() => $bacSiUser);
        $respComplete = $luotKhamController->completeExamine($reqCompleteNoCls, $visitNoCls->MaLuotKham);

        $visitNoCls->refresh();
        if ($visitNoCls->TrangThai === 'HOAN_THANH') {
            $this->info("  --> PASS: Lượt khám không có CLS hoàn tất thành công trực tiếp sang HOAN_THANH.");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Không thể hoàn tất lượt khám không có CLS.");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 10: Chặn hoàn tất khi còn dịch vụ CLS chưa có kết quả
        // ---------------------------------------------------------------------
        $this->line("\n[TC10] Kiểm tra Chặn hoàn tất khi còn dịch vụ CLS chưa có kết quả...");
        $visitPendingCls = LuotKham::create([
            'MaBenhNhan' => $benhNhan->MaBenhNhan,
            'MaBacSi' => $bacSi->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'CHO_KET_QUA',
            'GhiChu' => 'Có chỉ định CLS đang làm',
        ]);
        PhieuKham::create([
            'MaLuotKham' => $visitPendingCls->MaLuotKham,
            'TrieuChung' => 'Đau ngực',
            'ChanDoan' => 'Theo dõi đau thắt ngực',
        ]);
        ChiDinhDichVu::create([
            'MaLuotKham' => $visitPendingCls->MaLuotKham,
            'MaDichVu' => $dv1->MaDichVu,
            'MaBacSi' => $bacSi->MaBacSi,
            'DonGia' => $dv1->DonGia,
            'TrangThai' => 'CHO_TIEP_NHAN', // Chưa có kết quả!
        ]);

        $reqBlockedComplete = Request::create("/doctor/visits/{$visitPendingCls->MaLuotKham}/complete", 'POST');
        $reqBlockedComplete->setUserResolver(fn() => $bacSiUser);
        $respBlocked = $luotKhamController->completeExamine($reqBlockedComplete, $visitPendingCls->MaLuotKham);

        $visitPendingCls->refresh();
        if ($respBlocked->getStatusCode() === 422 && $visitPendingCls->TrangThai !== 'HOAN_THANH') {
            $this->info("  --> PASS: Hệ thống chặn hoàn tất chuẩn xác (HTTP 422: 'Lượt khám vẫn còn 1 dịch vụ cận lâm sàng chưa có kết quả').");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Hệ thống cho phép hoàn tất dù dịch vụ CLS chưa xong!");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 11: Chống IDOR - Bác sĩ khác không can thiệp phiếu khám của nhau
        // ---------------------------------------------------------------------
        $this->line("\n[TC11] Kiểm tra Bảo mật Chống IDOR giữa các Bác sĩ...");
        $reqIdor = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', [
            'ChanDoanBanDau' => 'Hack sửa chẩn đoán của bác sĩ khác',
        ]);
        $reqIdor->setUserResolver(fn() => $bacSiUser2); // Bác sĩ khác gửi
        $respIdor = $luotKhamController->savePhieuKham($reqIdor, $visit1->MaLuotKham);

        if ($respIdor->getStatusCode() === 403) {
            $this->info("  --> PASS: Hệ thống từ chối truy cập trái quyền (HTTP 403: 'Chỉ Bác sĩ phụ trách mới có quyền ghi hồ sơ phiếu khám').");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Bác sĩ khác vẫn sửa được phiếu khám! (Status: " . $respIdor->getStatusCode() . ")");
        }

        // ---------------------------------------------------------------------
        // TEST CASE 12: Không tạo trùng phiếu khám hoặc lượt khám khi khám lại
        // ---------------------------------------------------------------------
        $this->line("\n[TC12] Kiểm tra Đảm bảo 1 Lượt khám duy nhất 1 Phiếu khám khi khám lại...");
        $countPhieuBefore = PhieuKham::where('MaLuotKham', $visit1->MaLuotKham)->count();
        $countVisitBefore = LuotKham::where('MaLuotKham', $visit1->MaLuotKham)->count();

        // Giả lập lưu lại nhiều lần
        $reqMultiSave = Request::create("/doctor/visits/{$visit1->MaLuotKham}/phieu-kham", 'POST', [
            'LoiDanBacSi' => 'Bổ sung lời dặn lần 2',
        ]);
        $reqMultiSave->setUserResolver(fn() => $bacSiUser);
        $luotKhamController->savePhieuKham($reqMultiSave, $visit1->MaLuotKham);

        $countPhieuAfter = PhieuKham::where('MaLuotKham', $visit1->MaLuotKham)->count();
        $countVisitAfter = LuotKham::where('MaLuotKham', $visit1->MaLuotKham)->count();

        if ($countPhieuBefore === 1 && $countPhieuAfter === 1 && $countVisitBefore === 1 && $countVisitAfter === 1) {
            $this->info("  --> PASS: Quan hệ 1-1 hoàn toàn bảo toàn. Không có bản ghi trùng lặp nào được tạo ra.");
            $passedCount++;
        } else {
            $this->error("  --> FAIL: Xuất hiện bản ghi phiếu khám hoặc lượt khám trùng lặp.");
        }

        // Hoàn tất lượt khám visit1 để dọn dẹp sạch
        $reqCompleteVisit1 = Request::create("/doctor/visits/{$visit1->MaLuotKham}/complete", 'POST');
        $reqCompleteVisit1->setUserResolver(fn() => $bacSiUser);
        $luotKhamController->completeExamine($reqCompleteVisit1, $visit1->MaLuotKham);

        $this->line("\n==========================================================================");
        $this->info("   KẾT QUẢ KIỂM THỬ: {$passedCount}/{$totalCount} CA ĐẠT 100% TIÊU CHUẨN ");
        $this->line("==========================================================================");

        return $passedCount === $totalCount ? 0 : 1;
    }
}
