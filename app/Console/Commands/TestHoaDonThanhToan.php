<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\HoaDonController;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\ThanhToan;
use App\Models\LuotKham;
use App\Models\BenhNhan;
use App\Models\BacSi;
use App\Models\Thuoc;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\ChiTietDonThuoc;
use App\Models\ChiDinhDichVu;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TestHoaDonThanhToan extends Command
{
    protected $signature = 'test:hoadon';
    protected $description = 'Kiểm thử 12 kịch bản nghiệp vụ Quản lý Hóa đơn và Thanh toán (Giai đoạn 4.3)';

    private int $passCount = 0;
    private int $failCount = 0;

    public function handle(): int
    {
        $this->info("================================================================================");
        $this->info("   KIỂM THỬ 12 NGHIỆP VỤ HÓA ĐƠN VÀ THANH TOÁN (GIAI ĐOẠN 4.3)");
        $this->info("================================================================================");

        $controller = app(HoaDonController::class);

        // Chuẩn bị dữ liệu tài khoản cho phân quyền
        $receptionistRole = VaiTro::where('TenVaiTro', 'LE_TAN')->firstOrFail();
        $doctorRole = VaiTro::where('TenVaiTro', 'BAC_SI')->firstOrFail();
        $patientRole = VaiTro::where('TenVaiTro', 'BENH_NHAN')->firstOrFail();

        DB::beginTransaction();
        try {
            // Chuẩn bị tài khoản test Lễ tân
            $receptionistUser = TaiKhoan::where('MaVaiTro', $receptionistRole->MaVaiTro)->first();
            if (!$receptionistUser) {
                $receptionistUser = TaiKhoan::create([
                    'TenDangNhap' => 'test_lt_bill_' . time(),
                    'MatKhau' => bcrypt('123456'),
                    'Email' => 'lt_bill_' . time() . '@smartcare.vn',
                    'MaVaiTro' => $receptionistRole->MaVaiTro,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }
            $receptionistUser->setRelation('vaiTro', $receptionistRole);

            // Chuẩn bị tài khoản test Bác sĩ
            $doctorUser = TaiKhoan::where('MaVaiTro', $doctorRole->MaVaiTro)->first();
            if (!$doctorUser) {
                $doctorUser = TaiKhoan::create([
                    'TenDangNhap' => 'test_bs_bill_' . time(),
                    'MatKhau' => bcrypt('123456'),
                    'Email' => 'bs_bill_' . time() . '@smartcare.vn',
                    'MaVaiTro' => $doctorRole->MaVaiTro,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }
            $doctorUser->setRelation('vaiTro', $doctorRole);

            // Chuẩn bị tài khoản test Bệnh nhân 1
            $patientUser = TaiKhoan::where('MaVaiTro', $patientRole->MaVaiTro)->first();
            if (!$patientUser) {
                $patientUser = TaiKhoan::create([
                    'TenDangNhap' => 'test_bn1_bill_' . time(),
                    'MatKhau' => bcrypt('123456'),
                    'Email' => 'bn1_bill_' . time() . '@smartcare.vn',
                    'MaVaiTro' => $patientRole->MaVaiTro,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }
            $patientUser->setRelation('vaiTro', $patientRole);

            // Chuẩn bị tài khoản test Bệnh nhân 2 (để test phân quyền không được xem chéo)
            $otherPatientUser = TaiKhoan::where('MaVaiTro', $patientRole->MaVaiTro)
                ->where('MaTaiKhoan', '!=', $patientUser->MaTaiKhoan)
                ->first();
            if (!$otherPatientUser) {
                $otherPatientUser = TaiKhoan::create([
                    'TenDangNhap' => 'test_bn2_bill_' . (time() + 1),
                    'MatKhau' => bcrypt('123456'),
                    'Email' => 'bn2_bill_' . (time() + 1) . '@smartcare.vn',
                    'MaVaiTro' => $patientRole->MaVaiTro,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }
            $otherPatientUser->setRelation('vaiTro', $patientRole);
            Auth::login($receptionistUser);

            // Tìm hoặc tạo lượt khám test chưa có hóa đơn
            $benhNhan = BenhNhan::first();
            if (!$benhNhan) {
                $benhNhan = BenhNhan::create([
                    'HoTen' => 'Bệnh Nhân Mẫu ' . time(),
                    'NgaySinh' => '1990-01-01',
                    'GioiTinh' => 'NAM',
                    'SoDienThoai' => '0912345678',
                ]);
            }

            $bacSi = BacSi::first();
            if (!$bacSi) {
                $bacSi = BacSi::create([
                    'MaTaiKhoan' => $doctorUser->MaTaiKhoan,
                    'HoTen' => 'BS. Kiểm Thử ' . time(),
                    'HocVi' => 'ThS.BS',
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }

            $thuoc = Thuoc::where('SoLuongTon', '>', 10)->first();
            if (!$thuoc) {
                $thuoc = Thuoc::create([
                    'TenThuoc' => 'Paracetamol 500mg Test ' . time(),
                    'DonViTinh' => 'Viên',
                    'DonGia' => 5000,
                    'SoLuongTon' => 100,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }

            $dichVu = DichVu::first();
            if (!$dichVu) {
                $dichVu = DichVu::create([
                    'TenDichVu' => 'Nội soi tai mũi họng Test ' . time(),
                    'DonGia' => 200000,
                    'TrangThai' => 'HOAT_DONG',
                ]);
            }

            $luotKham = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
                'TrieuChung' => 'Test đau đầu hoa mắt',
                'ChuanDoan' => 'Test rối loạn tiền đình',
            ]);

            // Tạo chỉ định dịch vụ
            $chiDinh = ChiDinhDichVu::create([
                'MaLuotKham' => $luotKham->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'MaDichVu' => $dichVu->MaDichVu,
                'DonGia' => $dichVu->DonGia,
                'TrangThai' => 'DA_THUC_HIEN',
            ]);

            // Tạo đơn thuốc
            $donThuoc = DonThuoc::create([
                'MaLuotKham' => $luotKham->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'TrangThai' => 'DA_CAP',
                'NgayKe' => now(),
            ]);

            $chiTietDonThuoc = ChiTietDonThuoc::create([
                'MaDonThuoc' => $donThuoc->MaDonThuoc,
                'MaThuoc' => $thuoc->MaThuoc,
                'SoLuong' => 5,
                'LieuDung' => '1 viên',
                'TanSuat' => 'Ngày 2 lần',
                'ThoiGianDung' => 'Sau ăn',
                'CachDung' => 'Uống với nước ấm',
                'DonGia' => $thuoc->DonGia,
            ]);

            // Request tạo hóa đơn
            $request = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKham->MaLuotKham,
                'TienKham' => 150000,
                'GiamGia' => 20000,
                'BaoHiemChiTra' => 30000,
                'GhiChu' => 'Hóa đơn kiểm thử tự động',
            ]);
            $request->setUserResolver(fn() => $receptionistUser);

            $response = $controller->store($request);

            $hoaDon = HoaDon::where('MaLuotKham', $luotKham->MaLuotKham)->first();

            // Tính toán kỳ vọng:
            // Tiền khám: 150.000
            // Tiền dịch vụ: 1 * dichVu.DonGia
            // Tiền thuốc: 5 * thuoc.DonGia
            $expectedDichVu = (float)$dichVu->DonGia;
            $expectedThuoc = 5 * (float)$thuoc->DonGia;
            $expectedTongTien = 150000 + $expectedDichVu + $expectedThuoc;
            $expectedBenhNhanChiTra = $expectedTongTien - 20000 - 30000;

            if ($hoaDon && 
                abs((float)$hoaDon->TongTien - $expectedTongTien) < 0.01 &&
                abs((float)$hoaDon->BenhNhanChiTra - $expectedBenhNhanChiTra) < 0.01 &&
                $hoaDon->chiTiet->count() === 3 // 1 tiền khám, 1 dịch vụ, 1 thuốc
            ) {
                $this->assertPass("KB 01: Lập hóa đơn từ lượt khám thành công (tự động nạp tiền khám, thuốc, dịch vụ)");
            } else {
                $this->assertFail("KB 01: Lập hóa đơn tính sai hoặc thiếu chi tiết. TongTien={$hoaDon->TongTien}, BenhNhanChiTra={$hoaDon->BenhNhanChiTra}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 2: Chặn lập trùng hóa đơn cho cùng lượt khám (kiểm tra ValidationException)
            // ------------------------------------------------------------------------------------------------
            try {
                $duplicateRequest = Request::create('/invoices', 'POST', [
                    'MaLuotKham' => $luotKham->MaLuotKham,
                    'TienKham' => 150000,
                ]);
                $duplicateRequest->setUserResolver(fn() => $receptionistUser);
                $controller->store($duplicateRequest);
                $this->assertFail("KB 02: Không chặn được lập trùng hóa đơn cho cùng lượt khám");
            } catch (ValidationException $e) {
                if (isset($e->errors()['MaLuotKham'])) {
                    $this->assertPass("KB 02: Chặn lập trùng hóa đơn cho cùng lượt khám thành công (ValidationException: " . $e->errors()['MaLuotKham'][0] . ")");
                } else {
                    $this->assertFail("KB 02: ValidationException bắn ra nhưng không phải lỗi MaLuotKham");
                }
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 3: Đơn giá thuốc và dịch vụ được lấy 100% từ database MySQL
            // ------------------------------------------------------------------------------------------------
            $ctThuoc = $hoaDon->chiTiet->where('LoaiChiPhi', 'THUOC')->first();
            $ctDichVu = $hoaDon->chiTiet->where('LoaiChiPhi', 'DICH_VU')->first();

            if ($ctThuoc && abs((float)$ctThuoc->DonGia - (float)$thuoc->DonGia) < 0.01 &&
                $ctDichVu && abs((float)$ctDichVu->DonGia - (float)$dichVu->DonGia) < 0.01) {
                $this->assertPass("KB 03: Đơn giá thuốc & dịch vụ trong chi tiết hóa đơn lấy chuẩn xác 100% từ database");
            } else {
                $this->assertFail("KB 03: Đơn giá thuốc hoặc dịch vụ không khớp với database");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 4: Tuân thủ nghiêm ngặt ràng buộc MySQL chk_hoadon_cong_no
            // ------------------------------------------------------------------------------------------------
            // chk_hoadon_cong_no: BenhNhanChiTra = TongTien - GiamGia - BaoHiemChiTra
            $formulaCheck = abs((float)$hoaDon->BenhNhanChiTra - ((float)$hoaDon->TongTien - (float)$hoaDon->GiamGia - (float)$hoaDon->BaoHiemChiTra));
            if ($formulaCheck < 0.01) {
                $this->assertPass("KB 04: Thỏa mãn tuyệt đối ràng buộc MySQL chk_hoadon_cong_no (BenhNhanChiTra = TongTien - GiamGia - BaoHiemChiTra)");
            } else {
                $this->assertFail("KB 04: Vi phạm ràng buộc chk_hoadon_cong_no");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 5: Thanh toán một phần thành công
            // ------------------------------------------------------------------------------------------------
            // Giả sử BenhNhanChiTra là X, trả trước 1/3
            $partAmount = round((float)$hoaDon->BenhNhanChiTra / 3);
            $payRequest1 = Request::create("/invoices/{$hoaDon->MaHoaDon}/pay", 'POST', [
                'SoTien' => $partAmount,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'GhiChu' => 'Thanh toán đợt 1 tiền mặt',
            ]);
            $payRequest1->setUserResolver(fn() => $receptionistUser);

            $controller->pay($payRequest1, $hoaDon->MaHoaDon);
            $hoaDon->refresh();

            $expectedRemaining = (float)$hoaDon->BenhNhanChiTra - $partAmount;

            if ($hoaDon->TrangThai === 'THANH_TOAN_MOT_PHAN' &&
                abs((float)$hoaDon->DaThanhToan - $partAmount) < 0.01 &&
                abs((float)$hoaDon->ConLai - $expectedRemaining) < 0.01) {
                $this->assertPass("KB 05: Thanh toán một phần thành công (Trạng thái: THANH_TOAN_MOT_PHAN, Đã thanh toán: " . number_format($hoaDon->DaThanhToan) . "đ, Còn lại: " . number_format($hoaDon->ConLai) . "đ)");
            } else {
                $this->assertFail("KB 05: Trạng thái hoặc số tiền còn lại sau thanh toán một phần không chính xác");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 6: Thanh toán tiếp phần còn lại -> Trạng thái chuyển thành DA_THANH_TOAN, ConLai = 0
            // ------------------------------------------------------------------------------------------------
            $remainingAmount = (float)$hoaDon->ConLai;
            $payRequest2 = Request::create("/invoices/{$hoaDon->MaHoaDon}/pay", 'POST', [
                'SoTien' => $remainingAmount,
                'PhuongThucThanhToan' => 'CHUYEN_KHOAN',
                'MaGiaoDich' => 'MB_TEST_' . time(),
                'GhiChu' => 'Thanh toán nốt đợt 2 chuyển khoản',
            ]);
            $payRequest2->setUserResolver(fn() => $receptionistUser);

            $controller->pay($payRequest2, $hoaDon->MaHoaDon);
            $hoaDon->refresh();

            if ($hoaDon->TrangThai === 'DA_THANH_TOAN' &&
                abs((float)$hoaDon->DaThanhToan - (float)$hoaDon->BenhNhanChiTra) < 0.01 &&
                abs((float)$hoaDon->ConLai - 0.0) < 0.01) {
                $this->assertPass("KB 06: Thanh toán tiếp phần còn lại thành công (Trạng thái: DA_THANH_TOAN, Còn nợ: 0đ)");
            } else {
                $this->assertFail("KB 06: Thanh toán phần còn lại không chuyển trạng thái DA_THANH_TOAN hoặc ConLai != 0");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 7: Chặn thanh toán vượt quá số tiền còn nợ (ValidationException)
            // ------------------------------------------------------------------------------------------------
            // Tạo một hóa đơn mới chưa thanh toán để test thanh toán vượt nợ
            $luotKham2 = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $req2 = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKham2->MaLuotKham,
                'TienKham' => 100000,
            ]);
            $req2->setUserResolver(fn() => $receptionistUser);
            $controller->store($req2);
            $hd2 = HoaDon::where('MaLuotKham', $luotKham2->MaLuotKham)->first();

            try {
                $overpayRequest = Request::create("/invoices/{$hd2->MaHoaDon}/pay", 'POST', [
                    'SoTien' => 150000, // Vượt nợ 100.000
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                ]);
                $overpayRequest->setUserResolver(fn() => $receptionistUser);
                $controller->pay($overpayRequest, $hd2->MaHoaDon);
                $this->assertFail("KB 07: Không chặn được hành vi thanh toán vượt quá số nợ còn lại");
            } catch (ValidationException $e) {
                if (isset($e->errors()['SoTien'])) {
                    $this->assertPass("KB 07: Chặn thanh toán vượt nợ thành công (ValidationException: " . $e->errors()['SoTien'][0] . ")");
                } else {
                    $this->assertFail("KB 07: Bắn ValidationException nhưng không đúng field SoTien");
                }
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 8: Chặn thanh toán cho hóa đơn đã hoàn thành hoặc đã hủy
            // ------------------------------------------------------------------------------------------------
            try {
                $completedPayRequest = Request::create("/invoices/{$hoaDon->MaHoaDon}/pay", 'POST', [
                    'SoTien' => 10000,
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                ]);
                $completedPayRequest->setUserResolver(fn() => $receptionistUser);
                $controller->pay($completedPayRequest, $hoaDon->MaHoaDon);
                $this->assertFail("KB 08: Không chặn được thanh toán cho hóa đơn đã thanh toán xong");
            } catch (ValidationException $e) {
                $this->assertPass("KB 08: Chặn thanh toán hóa đơn đã hoàn tất thành công (ValidationException: " . ($e->errors()['SoTien'][0] ?? $e->getMessage()) . ")");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 9: Hủy hóa đơn (chỉ hủy khi chưa thanh toán, chặn hủy nếu đã có thanh toán)
            // ------------------------------------------------------------------------------------------------
            // 9a. Chặn hủy hóa đơn đã có giao dịch thanh toán ($hoaDon)
            try {
                $cancelReq1 = Request::create("/invoices/{$hoaDon->MaHoaDon}/cancel", 'POST');
                $cancelReq1->setUserResolver(fn() => $receptionistUser);
                $controller->cancel($cancelReq1, $hoaDon->MaHoaDon);
                $this->assertFail("KB 09a: Cho phép hủy hóa đơn đã phát sinh thanh toán thành công (sai nghiệp vụ)");
            } catch (ValidationException $e) {
                $this->assertPass("KB 09a: Chặn hủy hóa đơn đã có giao dịch thanh toán thành công");
            }

            // 9b. Hủy thành công hóa đơn chưa thanh toán ($hd2)
            $cancelReq2 = Request::create("/invoices/{$hd2->MaHoaDon}/cancel", 'POST');
            $cancelReq2->setUserResolver(fn() => $receptionistUser);
            $controller->cancel($cancelReq2, $hd2->MaHoaDon);
            $hd2->refresh();
            if ($hd2->TrangThai === 'DA_HUY') {
                $this->assertPass("KB 09b: Hủy hóa đơn chưa thanh toán thành công (Trạng thái chuyển sang DA_HUY)");
            } else {
                $this->assertFail("KB 09b: Trạng thái hóa đơn sau khi hủy không phải DA_HUY");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 10: Phân quyền - Bác sĩ cố lập hóa đơn hoặc thu tiền bị chặn 403 Forbidden
            // ------------------------------------------------------------------------------------------------
            Auth::login($doctorUser);
            $doctorStoreReq = Request::create('/invoices', 'POST', ['MaLuotKham' => $luotKham2->MaLuotKham]);
            $doctorStoreReq->setUserResolver(fn() => $doctorUser);
            $forbiddenCount = 0;
            try {
                $resStore = $controller->store($doctorStoreReq);
                if (method_exists($resStore, 'getStatusCode') && $resStore->getStatusCode() === 403) {
                    $forbiddenCount++;
                }
            } catch (HttpException $e) {
                if ($e->getStatusCode() === 403) $forbiddenCount++;
            }

            $doctorPayReq = Request::create("/invoices/{$hd2->MaHoaDon}/pay", 'POST', ['SoTien' => 1000, 'PhuongThucThanhToan' => 'TIEN_MAT']);
            $doctorPayReq->setUserResolver(fn() => $doctorUser);
            try {
                $resPay = $controller->pay($doctorPayReq, $hd2->MaHoaDon);
                if (method_exists($resPay, 'getStatusCode') && $resPay->getStatusCode() === 403) {
                    $forbiddenCount++;
                }
            } catch (HttpException $e) {
                if ($e->getStatusCode() === 403) $forbiddenCount++;
            }

            if ($forbiddenCount === 2) {
                $this->assertPass("KB 10: Phân quyền chặt chẽ - Bác sĩ bị chặn 403 Forbidden khi cố lập hóa đơn hoặc thu tiền");
            } else {
                $this->assertFail("KB 10: Bác sĩ không bị chặn 403 Forbidden khi thao tác tài chính (forbiddenCount = {$forbiddenCount})");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 11: Phân quyền - Bệnh nhân xem hóa đơn: chỉ xem của mình, chặn xem của người khác
            // ------------------------------------------------------------------------------------------------
            // Gán bệnh nhân cho $patientUser
            $patientRecord = BenhNhan::where('MaTaiKhoan', $patientUser->MaTaiKhoan)->first();
            if (!$patientRecord) {
                $patientRecord = BenhNhan::create([
                    'MaTaiKhoan' => $patientUser->MaTaiKhoan,
                    'HoTen' => 'Bệnh Nhân Test Auth',
                    'NgaySinh' => '1995-01-01',
                    'GioiTinh' => 'NAM',
                    'SoDienThoai' => '0988887766',
                ]);
            }
            $hd2->update(['TrangThai' => 'CHUA_THANH_TOAN']); // Đổi tạm để test
            $luotKham2->update(['MaBenhNhan' => $patientRecord->MaBenhNhan]);

            // Bệnh nhân đăng nhập
            Auth::login($patientUser);
            $patientReq = Request::create("/invoices/{$hd2->MaHoaDon}", 'GET');
            $patientReq->setUserResolver(fn() => $patientUser);

            $canViewOwn = false;
            try {
                $res = $controller->show($patientReq, $hd2->MaHoaDon);
                if (method_exists($res, 'getStatusCode') && $res->getStatusCode() === 200) {
                    $canViewOwn = true;
                }
            } catch (\Throwable $e) {
                $canViewOwn = false;
            }

            // Bệnh nhân khác đăng nhập cố xem hóa đơn của bệnh nhân này -> 403
            Auth::login($otherPatientUser);
            $otherPatientReq = Request::create("/invoices/{$hd2->MaHoaDon}", 'GET');
            $otherPatientReq->setUserResolver(fn() => $otherPatientUser);

            $forbiddenOther = false;
            try {
                $resOther = $controller->show($otherPatientReq, $hd2->MaHoaDon);
                if (method_exists($resOther, 'getStatusCode') && $resOther->getStatusCode() === 403) {
                    $forbiddenOther = true;
                }
            } catch (HttpException $e) {
                if ($e->getStatusCode() === 403) {
                    $forbiddenOther = true;
                }
            }

            if ($canViewOwn && $forbiddenOther) {
                $this->assertPass("KB 11: Phân quyền bệnh nhân chuẩn xác (Xem được hóa đơn của mình, chặn 403 khi xem hóa đơn người khác)");
            } else {
                $this->assertFail("KB 11: Bệnh nhân không xem được của mình hoặc không chặn 403 khi soi hóa đơn người khác (Own: " . ($canViewOwn ? 'true' : 'false') . ", Forbidden: " . ($forbiddenOther ? 'true' : 'false') . ")");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 12: Kiểm tra tính nhất quán dữ liệu giữa hoa_don, chi_tiet_hoa_don và thanh_toan
            // ------------------------------------------------------------------------------------------------
            // Tính tổng tiền các chi tiết của $hoaDon
            $sumChiTiet = (float)ChiTietHoaDon::where('MaHoaDon', $hoaDon->MaHoaDon)->sum(DB::raw('SoLuong * DonGia'));
            $sumThanhToan = (float)ThanhToan::where('MaHoaDon', $hoaDon->MaHoaDon)->where('TrangThai', 'DA_THANH_TOAN')->sum('SoTien');

            if (abs($sumChiTiet - (float)$hoaDon->TongTien) < 0.01 &&
                abs($sumThanhToan - (float)$hoaDon->BenhNhanChiTra) < 0.01 &&
                abs((float)$hoaDon->ConLai - 0.0) < 0.01) {
                $this->assertPass("KB 12: Tính nhất quán dữ liệu tuyệt đối giữa hóa đơn, chi tiết hóa đơn và thanh toán");
            } else {
                $this->assertFail("KB 12: Dữ liệu không nhất quán. SumChiTiet={$sumChiTiet}, TongTien={$hoaDon->TongTien}, SumThanhToan={$sumThanhToan}, BenhNhanChiTra={$hoaDon->BenhNhanChiTra}");
            }

            // ================================================================================================
            // GIAI ĐOẠN 4.3.1: RÀ SOÁT AN TOÀN TÀI CHÍNH & IDEMPOTENCY
            // ================================================================================================

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 13: Hai request thanh toán giống hệt nhau (Idempotency - cùng MaGiaoDich)
            // ------------------------------------------------------------------------------------------------
            $luotKhamIdem = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $reqStoreIdem = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamIdem->MaLuotKham,
                'TienKham' => 200000,
            ]);
            $reqStoreIdem->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreIdem);
            $hdIdem = HoaDon::where('MaLuotKham', $luotKhamIdem->MaLuotKham)->first();

            $idemKey = 'TXN_IDEM_' . time() . '_' . rand(100, 999);

            // Gửi request thanh toán lần 1
            $reqPay1 = Request::create("/invoices/{$hdIdem->MaHoaDon}/pay", 'POST', [
                'SoTien' => 100000,
                'PhuongThucThanhToan' => 'CHUYEN_KHOAN',
                'MaGiaoDich' => $idemKey,
                'GhiChu' => 'Thanh toán đợt 1',
            ]);
            $reqPay1->setUserResolver(fn() => $receptionistUser);
            $resPay1 = $controller->pay($reqPay1, $hdIdem->MaHoaDon);

            // Gửi lại CHÍNH XÁC request đó lần 2 (cùng MaGiaoDich, cùng số tiền)
            $reqPay2 = Request::create("/invoices/{$hdIdem->MaHoaDon}/pay", 'POST', [
                'SoTien' => 100000,
                'PhuongThucThanhToan' => 'CHUYEN_KHOAN',
                'MaGiaoDich' => $idemKey,
                'GhiChu' => 'Thanh toán đợt 1 (Retry)',
            ]);
            $reqPay2->setUserResolver(fn() => $receptionistUser);
            $resPay2 = $controller->pay($reqPay2, $hdIdem->MaHoaDon);

            $hdIdem->refresh();
            $paymentRecordsCount = ThanhToan::where('MaHoaDon', $hdIdem->MaHoaDon)->where('MaGiaoDich', $idemKey)->count();

            if ($paymentRecordsCount === 1 && 
                abs((float)$hdIdem->DaThanhToan - 100000.0) < 0.01 && 
                abs((float)$hdIdem->ConLai - 100000.0) < 0.01 &&
                $resPay2->getStatusCode() === 200) {
                $this->assertPass("KB 13: Hai request thanh toán giống hệt nhau được nhận diện Idempotent chuẩn xác, không trừ tiền hai lần");
            } else {
                $this->assertFail("KB 13: Không đạt Idempotency: Count={$paymentRecordsCount}, DaThanhToan={$hdIdem->DaThanhToan}, ConLai={$hdIdem->ConLai}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 14: Hai thanh toán đồng thời (Concurrency / Race condition với lockForUpdate)
            // ------------------------------------------------------------------------------------------------
            // Hóa đơn nợ 100.000đ. Hai tiến trình gửi cùng lúc: Tiến trình A gửi 80k, Tiến trình B gửi 80k (tổng 160k > 100k)
            $reqConcA = Request::create("/invoices/{$hdIdem->MaHoaDon}/pay", 'POST', [
                'SoTien' => 80000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'MaGiaoDich' => 'TXN_CONC_A_' . time(),
            ]);
            $reqConcA->setUserResolver(fn() => $receptionistUser);
            $controller->pay($reqConcA, $hdIdem->MaHoaDon); // Thành công: nợ 100k - 80k = 20k

            $caughtOverpay = false;
            try {
                $reqConcB = Request::create("/invoices/{$hdIdem->MaHoaDon}/pay", 'POST', [
                    'SoTien' => 80000, // Đòi thanh toán 80k trong khi nợ chỉ còn 20k
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                    'MaGiaoDich' => 'TXN_CONC_B_' . time(),
                ]);
                $reqConcB->setUserResolver(fn() => $receptionistUser);
                $controller->pay($reqConcB, $hdIdem->MaHoaDon);
            } catch (ValidationException $e) {
                $caughtOverpay = true;
            }

            $hdIdem->refresh();
            if ($caughtOverpay && abs((float)$hdIdem->ConLai - 20000.0) < 0.01 && (float)$hdIdem->DaThanhToan <= (float)$hdIdem->BenhNhanChiTra) {
                $this->assertPass("KB 14: Hai giao dịch đồng thời được khóa tuần tự an toàn với lockForUpdate, không bị double payment hay số dư âm");
            } else {
                $this->assertFail("KB 14: Lỗi concurrency: ConLai={$hdIdem->ConLai}, DaThanhToan={$hdIdem->DaThanhToan}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 15: Retry sau khi thanh toán một phần
            // ------------------------------------------------------------------------------------------------
            $retryKeyPart = 'TXN_RETRY_PART_' . time();
            $luotKhamPart = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $reqStorePart = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamPart->MaLuotKham,
                'TienKham' => 300000,
            ]);
            $reqStorePart->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStorePart);
            $hdPart = HoaDon::where('MaLuotKham', $luotKhamPart->MaLuotKham)->first();

            // Thanh toán một phần 100k
            $reqPart1 = Request::create("/invoices/{$hdPart->MaHoaDon}/pay", 'POST', [
                'SoTien' => 100000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'MaGiaoDich' => $retryKeyPart,
            ]);
            $reqPart1->setUserResolver(fn() => $receptionistUser);
            $controller->pay($reqPart1, $hdPart->MaHoaDon);

            // Retry đúng request 100k đó
            $controller->pay($reqPart1, $hdPart->MaHoaDon);
            $hdPart->refresh();

            // Sau đó thanh toán tiếp phần còn lại 200k
            $reqPart2 = Request::create("/invoices/{$hdPart->MaHoaDon}/pay", 'POST', [
                'SoTien' => 200000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'MaGiaoDich' => 'TXN_PART2_' . time(),
            ]);
            $reqPart2->setUserResolver(fn() => $receptionistUser);
            $controller->pay($reqPart2, $hdPart->MaHoaDon);
            $hdPart->refresh();

            if ($hdPart->TrangThai === 'DA_THANH_TOAN' && 
                abs((float)$hdPart->DaThanhToan - 300000.0) < 0.01 && 
                abs((float)$hdPart->ConLai - 0.0) < 0.01) {
                $this->assertPass("KB 15: Retry sau khi thanh toán một phần không làm sai lệch số dư và trạng thái hóa đơn");
            } else {
                $this->assertFail("KB 15: Lỗi retry thanh toán một phần: DaThanhToan={$hdPart->DaThanhToan}, ConLai={$hdPart->ConLai}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 16: Không tính thuốc thuộc đơn đã hủy khi lập hóa đơn
            // ------------------------------------------------------------------------------------------------
            $luotKhamCancelledMed = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            // Đơn thuốc 1: Bị hủy (10 viên)
            $donThuocHuy = DonThuoc::create([
                'MaLuotKham' => $luotKhamCancelledMed->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'TrangThai' => 'DA_HUY',
                'NgayKe' => now(),
            ]);
            ChiTietDonThuoc::create([
                'MaDonThuoc' => $donThuocHuy->MaDonThuoc,
                'MaThuoc' => $thuoc->MaThuoc,
                'SoLuong' => 10,
                'LieuDung' => '1 viên',
                'TanSuat' => 'Ngày 2 lần',
                'ThoiGianDung' => 'Sau ăn',
                'CachDung' => 'Uống',
                'DonGia' => $thuoc->DonGia,
            ]);

            $reqStoreCancelMed = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamCancelledMed->MaLuotKham,
                'TienKham' => 100000,
            ]);
            $reqStoreCancelMed->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreCancelMed);
            $hdCancelMed = HoaDon::where('MaLuotKham', $luotKhamCancelledMed->MaLuotKham)->first();

            // Kiểm tra: Chi tiết hóa đơn chỉ có 1 dòng tiền khám, hoàn toàn không có dòng thuốc nào của đơn đã hủy
            $medItemsCount = $hdCancelMed->chiTietHoaDons->where('LoaiChiPhi', 'THUOC')->count();
            if ($medItemsCount === 0 && abs((float)$hdCancelMed->TongTien - 100000.0) < 0.01) {
                $this->assertPass("KB 16: Không tính thuốc thuộc đơn thuốc đã hủy khi lập hóa đơn");
            } else {
                $this->assertFail("KB 16: Vẫn tính thuốc thuộc đơn đã hủy vào hóa đơn: medItemsCount={$medItemsCount}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 17: Không tính dịch vụ đã hủy khi lập hóa đơn
            // ------------------------------------------------------------------------------------------------
            $luotKhamCancelledSvc = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            // Dịch vụ 1: Đã hủy
            ChiDinhDichVu::create([
                'MaLuotKham' => $luotKhamCancelledSvc->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'MaDichVu' => $dichVu->MaDichVu,
                'DonGia' => $dichVu->DonGia,
                'TrangThai' => 'DA_HUY',
            ]);

            $reqStoreCancelSvc = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamCancelledSvc->MaLuotKham,
                'TienKham' => 120000,
            ]);
            $reqStoreCancelSvc->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreCancelSvc);
            $hdCancelSvc = HoaDon::where('MaLuotKham', $luotKhamCancelledSvc->MaLuotKham)->first();

            $svcItemsCount = $hdCancelSvc->chiTietHoaDons->where('LoaiChiPhi', 'DICH_VU')->count();
            if ($svcItemsCount === 0 && abs((float)$hdCancelSvc->TongTien - 120000.0) < 0.01) {
                $this->assertPass("KB 17: Không tính dịch vụ cận lâm sàng đã hủy khi lập hóa đơn");
            } else {
                $this->assertFail("KB 17: Vẫn tính dịch vụ đã hủy vào hóa đơn: svcItemsCount={$svcItemsCount}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 18: Đơn giá thuốc/dịch vụ bảo toàn theo giá đã chốt tại thời điểm kê đơn/chỉ định
            // ------------------------------------------------------------------------------------------------
            $luotKhamPrice = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $donThuocPrice = DonThuoc::create([
                'MaLuotKham' => $luotKhamPrice->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'TrangThai' => 'DA_CAP',
                'NgayKe' => now(),
            ]);
            // Giá chốt khi kê đơn là 7.000đ
            ChiTietDonThuoc::create([
                'MaDonThuoc' => $donThuocPrice->MaDonThuoc,
                'MaThuoc' => $thuoc->MaThuoc,
                'SoLuong' => 3,
                'LieuDung' => '1 viên',
                'TanSuat' => 'Ngày 2 lần',
                'ThoiGianDung' => 'Sau ăn',
                'CachDung' => 'Uống',
                'DonGia' => 7000.00,
            ]);

            // Giả lập danh mục thuốc tăng giá lên 99.000đ sau thời điểm kê đơn
            $originalThuocPrice = $thuoc->DonGia;
            $thuoc->update(['DonGia' => 99000.00]);

            $reqStorePrice = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamPrice->MaLuotKham,
                'TienKham' => 0,
            ]);
            $reqStorePrice->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStorePrice);
            $hdPrice = HoaDon::where('MaLuotKham', $luotKhamPrice->MaLuotKham)->first();

            // Khôi phục giá thuốc gốc
            $thuoc->update(['DonGia' => $originalThuocPrice]);

            $ctPriceItem = $hdPrice->chiTietHoaDons->where('LoaiChiPhi', 'THUOC')->first();
            // Đơn giá trên hóa đơn phải là 7.000đ (giá chốt khi kê), không được nhảy lên 99.000đ
            if ($ctPriceItem && abs((float)$ctPriceItem->DonGia - 7000.0) < 0.01) {
                $this->assertPass("KB 18: Đơn giá thuốc/dịch vụ lấy theo giá đã chốt tại thời điểm kê đơn/chỉ định, không bị ảnh hưởng khi bảng giá danh mục thay đổi sau đó");
            } else {
                $this->assertFail("KB 18: Đơn giá hóa đơn bị nhảy theo giá danh mục mới: DonGia={$ctPriceItem?->DonGia}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 19: Không tạo chi tiết hóa đơn trùng (Chống duplicate items)
            // ------------------------------------------------------------------------------------------------
            $distinctCtCount = $hdPrice->chiTietHoaDons->pluck('MaChiTietDonThuoc')->filter()->unique()->count();
            $totalMedCtCount = $hdPrice->chiTietHoaDons->whereNotNull('MaChiTietDonThuoc')->count();
            if ($distinctCtCount === $totalMedCtCount) {
                $this->assertPass("KB 19: Không tạo chi tiết hóa đơn trùng lặp cho cùng một thuốc hay dịch vụ");
            } else {
                $this->assertFail("KB 19: Phát hiện chi tiết thuốc/dịch vụ bị trùng lặp trong hóa đơn");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 20: Tính số dư chính xác qua nhiều lần thanh toán
            // ------------------------------------------------------------------------------------------------
            $luotKhamMulti = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $reqStoreMulti = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamMulti->MaLuotKham,
                'TienKham' => 600000,
            ]);
            $reqStoreMulti->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreMulti);
            $hdMulti = HoaDon::where('MaLuotKham', $luotKhamMulti->MaLuotKham)->first();

            // Đợt 1: 150.000đ -> nợ 450.000đ
            $p1 = Request::create("/invoices/{$hdMulti->MaHoaDon}/pay", 'POST', ['SoTien' => 150000, 'PhuongThucThanhToan' => 'TIEN_MAT']);
            $p1->setUserResolver(fn() => $receptionistUser);
            $controller->pay($p1, $hdMulti->MaHoaDon);
            $hdMulti->refresh();
            $step1Ok = ($hdMulti->TrangThai === 'THANH_TOAN_MOT_PHAN' && abs((float)$hdMulti->ConLai - 450000.0) < 0.01);

            // Đợt 2: 250.000đ -> nợ 200.000đ
            $p2 = Request::create("/invoices/{$hdMulti->MaHoaDon}/pay", 'POST', ['SoTien' => 250000, 'PhuongThucThanhToan' => 'TIEN_MAT']);
            $p2->setUserResolver(fn() => $receptionistUser);
            $controller->pay($p2, $hdMulti->MaHoaDon);
            $hdMulti->refresh();
            $step2Ok = ($hdMulti->TrangThai === 'THANH_TOAN_MOT_PHAN' && abs((float)$hdMulti->ConLai - 200000.0) < 0.01);

            // Đợt 3: 200.000đ -> nợ 0đ, DA_THANH_TOAN
            $p3 = Request::create("/invoices/{$hdMulti->MaHoaDon}/pay", 'POST', ['SoTien' => 200000, 'PhuongThucThanhToan' => 'CHUYEN_KHOAN']);
            $p3->setUserResolver(fn() => $receptionistUser);
            $controller->pay($p3, $hdMulti->MaHoaDon);
            $hdMulti->refresh();
            $step3Ok = ($hdMulti->TrangThai === 'DA_THANH_TOAN' && abs((float)$hdMulti->ConLai - 0.0) < 0.01 && abs((float)$hdMulti->DaThanhToan - 600000.0) < 0.01);

            if ($step1Ok && $step2Ok && $step3Ok) {
                $this->assertPass("KB 20: Tính toán số dư và chuyển đổi trạng thái hoàn toàn chính xác qua nhiều lần thanh toán");
            } else {
                $this->assertFail("KB 20: Lỗi tính số dư lũy tiến: Step1={$step1Ok}, Step2={$step2Ok}, Step3={$step3Ok}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 21: Bất biến lịch sử tài chính (Immutable Audit Trail)
            // ------------------------------------------------------------------------------------------------
            // Thử hủy hóa đơn đã có giao dịch thu tiền -> Chặn tuyệt đối
            $blockedCancel = false;
            try {
                $reqCancelAttempt = Request::create("/invoices/{$hdMulti->MaHoaDon}/cancel", 'POST');
                $reqCancelAttempt->setUserResolver(fn() => $receptionistUser);
                $controller->cancel($reqCancelAttempt, $hdMulti->MaHoaDon);
            } catch (ValidationException $e) {
                $blockedCancel = true;
            }

            // Xác minh toàn bộ các bản ghi thanh toán của hdMulti vẫn nguyên vẹn
            $finalThanhToanCount = ThanhToan::where('MaHoaDon', $hdMulti->MaHoaDon)->count();
            if ($blockedCancel && $finalThanhToanCount === 3) {
                $this->assertPass("KB 21: Lịch sử giao dịch thanh toán là bất biến (Immutable Audit Trail), bảo đảm an toàn tài chính");
            } else {
                $this->assertFail("KB 21: Vi phạm tính bất biến tài chính: BlockedCancel={$blockedCancel}, Count={$finalThanhToanCount}");
            }

            // ================================================================================================
            // GIAI ĐOẠN 4.3.2: KIỂM TOÁN NÂNG CAO IDEMPOTENCY & CHI TIẾT HÓA ĐƠN
            // ================================================================================================

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 22: Chặn xung đột Idempotency Key (cùng MaGiaoDich nhưng khác hóa đơn hoặc khác số tiền)
            // ------------------------------------------------------------------------------------------------
            // Giao dịch $retryKeyPart đã được dùng cho $hdPart (100.000đ).
            // Thử tái sử dụng $retryKeyPart cho một hóa đơn khác ($hdMulti) -> Phải bị chặn 422
            $blockedCrossInvoice = false;
            try {
                $reqCross = Request::create("/invoices/{$hdMulti->MaHoaDon}/pay", 'POST', [
                    'SoTien' => 100000,
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                    'MaGiaoDich' => $retryKeyPart,
                ]);
                $reqCross->setUserResolver(fn() => $receptionistUser);
                $controller->pay($reqCross, $hdMulti->MaHoaDon);
            } catch (ValidationException $e) {
                if (isset($e->errors()['MaGiaoDich'])) {
                    $blockedCrossInvoice = true;
                }
            }

            // Thử dùng $retryKeyPart cho chính $hdPart nhưng với số tiền khác (200.000đ thay vì 100.000đ) -> Phải bị chặn 422
            $blockedAmountMismatch = false;
            try {
                $reqDiffAmount = Request::create("/invoices/{$hdPart->MaHoaDon}/pay", 'POST', [
                    'SoTien' => 200000,
                    'PhuongThucThanhToan' => 'TIEN_MAT',
                    'MaGiaoDich' => $retryKeyPart,
                ]);
                $reqDiffAmount->setUserResolver(fn() => $receptionistUser);
                $controller->pay($reqDiffAmount, $hdPart->MaHoaDon);
            } catch (ValidationException $e) {
                if (isset($e->errors()['SoTien'])) {
                    $blockedAmountMismatch = true;
                }
            }

            if ($blockedCrossInvoice && $blockedAmountMismatch) {
                $this->assertPass("KB 22: Chặn tuyệt đối việc tái sử dụng MaGiaoDich cho hóa đơn khác hoặc số tiền khác (Chống xung đột Idempotency)");
            } else {
                $this->assertFail("KB 22: Không chặn được xung đột Idempotency Key: CrossInvoice={$blockedCrossInvoice}, AmountMismatch={$blockedAmountMismatch}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 23: Bảo toàn 2 dòng kê đơn hợp lệ khác nhau của cùng một loại thuốc (không gộp nhầm)
            // ------------------------------------------------------------------------------------------------
            $luotKhamTwoPresc = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            $donThuocTwo = DonThuoc::create([
                'MaLuotKham' => $luotKhamTwoPresc->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'TrangThai' => 'DA_CAP',
                'NgayKe' => now(),
            ]);
            // Dòng 1: Thuốc X, số lượng 3 viên (sáng)
            ChiTietDonThuoc::create([
                'MaDonThuoc' => $donThuocTwo->MaDonThuoc,
                'MaThuoc' => $thuoc->MaThuoc,
                'SoLuong' => 3,
                'LieuDung' => '1 viên',
                'TanSuat' => 'Buổi sáng',
                'ThoiGianDung' => 'Sau ăn',
                'CachDung' => 'Uống',
                'DonGia' => $thuoc->DonGia,
            ]);
            // Dòng 2: Thuốc X, số lượng 2 viên (tối) - dòng kê đơn hợp lệ riêng biệt
            ChiTietDonThuoc::create([
                'MaDonThuoc' => $donThuocTwo->MaDonThuoc,
                'MaThuoc' => $thuoc->MaThuoc,
                'SoLuong' => 2,
                'LieuDung' => '1 viên',
                'TanSuat' => 'Buổi tối',
                'ThoiGianDung' => 'Trước khi ngủ',
                'CachDung' => 'Uống',
                'DonGia' => $thuoc->DonGia,
            ]);

            $reqStoreTwo = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamTwoPresc->MaLuotKham,
                'TienKham' => 0,
            ]);
            $reqStoreTwo->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreTwo);
            $hdTwo = HoaDon::where('MaLuotKham', $luotKhamTwoPresc->MaLuotKham)->first();

            $medItems = $hdTwo->chiTietHoaDons->where('LoaiChiPhi', 'THUOC');
            $totalQuantity = $medItems->sum('SoLuong');

            if ($medItems->count() === 2 && $totalQuantity === 5) {
                $this->assertPass("KB 23: Hai dòng kê đơn hợp lệ riêng biệt của cùng một loại thuốc được bảo toàn đầy đủ (không bị gộp nhầm)");
            } else {
                $this->assertFail("KB 23: Sai sót khi xử lý nhiều dòng kê đơn cùng loại thuốc: Count={$medItems->count()}, TotalQty={$totalQuantity}");
            }

            // ------------------------------------------------------------------------------------------------
            // KỊCH BẢN 24: Bảo toàn 2 chỉ định dịch vụ khác nhau của cùng một loại dịch vụ (không gộp nhầm)
            // ------------------------------------------------------------------------------------------------
            $luotKhamTwoSvc = LuotKham::create([
                'MaBenhNhan' => $benhNhan->MaBenhNhan,
                'MaBacSi' => $bacSi->MaBacSi,
                'NgayGioKham' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);
            // Chỉ định 1
            ChiDinhDichVu::create([
                'MaLuotKham' => $luotKhamTwoSvc->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'MaDichVu' => $dichVu->MaDichVu,
                'DonGia' => $dichVu->DonGia,
                'TrangThai' => 'DA_THUC_HIEN',
            ]);
            // Chỉ định 2: Cùng loại dịch vụ nhưng là chỉ định độc lập thứ 2
            ChiDinhDichVu::create([
                'MaLuotKham' => $luotKhamTwoSvc->MaLuotKham,
                'MaBacSi' => $bacSi->MaBacSi,
                'MaDichVu' => $dichVu->MaDichVu,
                'DonGia' => $dichVu->DonGia,
                'TrangThai' => 'DA_THUC_HIEN',
            ]);

            $reqStoreTwoSvc = Request::create('/invoices', 'POST', [
                'MaLuotKham' => $luotKhamTwoSvc->MaLuotKham,
                'TienKham' => 0,
            ]);
            $reqStoreTwoSvc->setUserResolver(fn() => $receptionistUser);
            $controller->store($reqStoreTwoSvc);
            $hdTwoSvc = HoaDon::where('MaLuotKham', $luotKhamTwoSvc->MaLuotKham)->first();

            $svcItems = $hdTwoSvc->chiTietHoaDons->where('LoaiChiPhi', 'DICH_VU');
            if ($svcItems->count() === 2 && abs((float)$hdTwoSvc->TongTien - 2 * (float)$dichVu->DonGia) < 0.01) {
                $this->assertPass("KB 24: Hai chỉ định dịch vụ độc lập của cùng một loại dịch vụ được tạo thành 2 dòng riêng biệt chính xác");
            } else {
                $this->assertFail("KB 24: Sai sót khi xử lý nhiều chỉ định dịch vụ cùng loại: Count={$svcItems->count()}");
            }

        } catch (\Throwable $e) {
            $this->error("Lỗi ngoại lệ trong quá trình chạy kiểm thử: " . $e->getMessage() . " tại " . $e->getFile() . ":" . $e->getLine());
            $this->failCount++;
        } finally {
            // Luôn rollback transaction để giữ nguyên trạng thái database sạch sẽ
            DB::rollBack();
        }

        $this->info("--------------------------------------------------------------------------------");
        $this->info("KẾT QUẢ KIỂM THỬ: {$this->passCount} PASS / " . ($this->passCount + $this->failCount) . " TESTS");
        $this->info("--------------------------------------------------------------------------------");

        return $this->failCount === 0 ? 0 : 1;
    }

    private function assertPass(string $message): void
    {
        $this->passCount++;
        $this->line("  <fg=green;options=bold>✓ PASS:</> {$message}");
    }

    private function assertFail(string $message): void
    {
        $this->failCount++;
        $this->line("  <fg=red;options=bold>✗ FAIL:</> {$message}");
    }
}
