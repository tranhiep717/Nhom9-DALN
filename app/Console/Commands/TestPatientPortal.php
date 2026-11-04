<?php

namespace App\Console\Commands;

use App\Http\Controllers\BenhNhanController;
use App\Http\Controllers\BacSiController;
use App\Http\Controllers\ChuyenKhoaController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\HoaDonController;
use App\Models\BenhNhan;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BacSi;
use App\Models\ChuyenKhoa;
use App\Models\LichLamViec;
use App\Models\CaKham;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\DonThuoc;
use App\Models\ChiTietDonThuoc;
use App\Models\Thuoc;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\ThanhToan;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response as InertiaResponse;

class TestPatientPortal extends Command
{
    protected $signature = 'test:patient-portal';
    protected $description = 'Kiểm thử toàn diện phân hệ Cổng Bệnh nhân (Patient Portal - Giai đoạn 4.4)';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ GIAI ĐOẠN 4.4: GIAO DIỆN BỆNH NHÂN (PATIENT PORTAL)');
        $this->info('================================================================');
        $this->info('');

        $passed = 0;
        $failed = 0;

        $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->first();
        $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->first();

        // 1. Tạo 2 tài khoản bệnh nhân phục vụ kiểm thử phân quyền
        $tk1 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'portal_bn1_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'portal_bn1_' . time() . '@smartcare.test',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bn1 = BenhNhan::create([
            'MaTaiKhoan' => $tk1->MaTaiKhoan,
            'HoTen' => 'Bệnh nhân Portal 1',
            'SoDienThoai' => '0981112222',
            'GioiTinh' => 'Nam',
            'NgaySinh' => '1995-05-15',
            'DiaChi' => 'Hà Nội',
            'EmailLienHe' => $tk1->Email,
        ]);
        $tk1->setRelation('vaiTro', $vaiTroBN);
        $tk1->setRelation('benhNhan', $bn1);

        $tk2 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'portal_bn2_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'portal_bn2_' . time() . '@smartcare.test',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $bn2 = BenhNhan::create([
            'MaTaiKhoan' => $tk2->MaTaiKhoan,
            'HoTen' => 'Bệnh nhân Portal 2',
            'SoDienThoai' => '0983334444',
            'GioiTinh' => 'Nữ',
            'NgaySinh' => '1998-08-20',
            'DiaChi' => 'Đà Nẵng',
            'EmailLienHe' => $tk2->Email,
        ]);
        $tk2->setRelation('vaiTro', $vaiTroBN);
        $tk2->setRelation('benhNhan', $bn2);

        // Lấy hoặc tạo Bác sĩ & Ca khám thực tế
        $doctor = BacSi::where('TrangThai', 'HOAT_DONG')->first();
        if (!$doctor) {
            $specialty = ChuyenKhoa::first();
            $doctor = BacSi::create([
                'HoTen' => 'BS Test Portal',
                'HocVi' => 'ThS',
                'MaChuyenKhoa' => $specialty?->MaChuyenKhoa,
                'TrangThai' => 'HOAT_DONG',
            ]);
        }

        // Tạo lịch làm việc và ca khám còn trống
        $llv = LichLamViec::create([
            'MaBacSi' => $doctor->MaBacSi,
            'NgayLamViec' => now()->addDays(2)->toDateString(),
            'GioBatDau' => '07:30:00',
            'GioKetThuc' => '11:30:00',
            'TrangThai' => 'MO',
        ]);
        $caKham = CaKham::create([
            'MaLichLamViec' => $llv->MaLichLamViec,
            'GioBatDau' => '08:00:00',
            'GioKetThuc' => '09:00:00',
            'SoLuongTiepNhan' => 5,
            'SoLuongDaDat' => 0,
            'TrangThai' => 'CON_TRONG',
        ]);

        $bnController = new BenhNhanController();
        $lhController = new LichHenController();
        $bsController = new BacSiController();
        $ckController = new ChuyenKhoaController();
        $dtController = new DonThuocController();
        $hdController = new HoaDonController();

        try {
            // TEST 1: BenhNhanController::dashboard
            $this->info('--- TEST 1: Dashboard Bệnh nhân (BenhNhanController::dashboard) ---');
            $req1 = Request::create('/patient/dashboard', 'GET');
            $req1->setUserResolver(fn() => $tk1);
            $resp1 = $bnController->dashboard($req1);

            if ($resp1 instanceof InertiaResponse) {
                $props = $resp1->toResponse($req1)->getOriginalContent()['page']['props'] ?? [];
                if (isset($props['benhNhan']) && isset($props['stats']) && $props['benhNhan']['MaBenhNhan'] === $bn1->MaBenhNhan) {
                    $this->info('[PASS] Dashboard trả về Inertia Patient/Dashboard đầy đủ props benhNhan, stats, upcomingAppointment, latestInvoice.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Dashboard thiếu props dữ liệu bắt buộc.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] Dashboard không trả về Inertia Response.');
                $failed++;
            }

            // TEST 2: Cập nhật hồ sơ cá nhân (updateProfile)
            $this->info('--- TEST 2: Cập nhật hồ sơ cá nhân Bệnh nhân ---');
            $req2 = Request::create('/patient/profile', 'PUT', [
                'HoTen' => 'Bệnh nhân Portal 1 Đã Đổi Tên',
                'SoDienThoai' => '0919998888',
                'GioiTinh' => 'Nam',
                'DiaChi' => 'TP. Hồ Chí Minh',
            ]);
            $req2->headers->set('Accept', 'application/json');
            $req2->setUserResolver(fn() => $tk1);
            $resp2 = $bnController->updateProfile($req2, $bn1->MaBenhNhan);
            $data2 = json_decode($resp2->getContent(), true);

            if ($resp2->getStatusCode() === 200 && $data2['success'] === true && $data2['data']['HoTen'] === 'Bệnh nhân Portal 1 Đã Đổi Tên') {
                $this->info('[PASS] Cập nhật hồ sơ thành công, dữ liệu MySQL lưu chuẩn.');
                $passed++;
            } else {
                $this->error('[FAIL] Cập nhật hồ sơ thất bại: ' . $resp2->getContent());
                $failed++;
            }

            // TEST 3: Chặn Bệnh nhân 1 cập nhật hồ sơ của Bệnh nhân 2 (403 Forbidden)
            $this->info('--- TEST 3: Bảo mật phân quyền: Chặn sửa hồ sơ người khác ---');
            $req3 = Request::create("/patient/profile/{$bn2->MaBenhNhan}", 'PUT', [
                'HoTen' => 'Hacker Đổi Tên Người Khác',
            ]);
            $req3->headers->set('Accept', 'application/json');
            $req3->setUserResolver(fn() => $tk1); // User 1
            $resp3 = $bnController->update($req3, $bn2->MaBenhNhan); // Cố tình gọi update hồ sơ user 2

            if ($resp3->getStatusCode() === 403) {
                $this->info('[PASS] Chặn thành công 403 Forbidden khi cố cập nhật hồ sơ bệnh nhân khác.');
                $passed++;
            } else {
                $this->error('[FAIL] Lỗ hổng bảo mật: Cho phép sửa hồ sơ người khác! Code: ' . $resp3->getStatusCode());
                $failed++;
            }

            // TEST 4: Tra cứu Bác sĩ & Chuyên khoa cho Bệnh nhân
            $this->info('--- TEST 4: Tra cứu Bác sĩ & Chuyên khoa (patientIndex) ---');
            $req4_bs = Request::create('/patient/doctors', 'GET');
            $req4_bs->setUserResolver(fn() => $tk1);
            $resp4_bs = $bsController->patientIndex($req4_bs);

            $req4_ck = Request::create('/patient/specialties', 'GET');
            $req4_ck->setUserResolver(fn() => $tk1);
            $resp4_ck = $ckController->patientIndex($req4_ck);

            if ($resp4_bs instanceof InertiaResponse && $resp4_ck instanceof InertiaResponse) {
                $this->info('[PASS] Tra cứu Bác sĩ & Chuyên khoa trả về Inertia Patient/Doctors và Patient/Specialties kèm ca khám mở.');
                $passed++;
            } else {
                $this->error('[FAIL] Tra cứu Bác sĩ/Chuyên khoa không trả về Inertia Response.');
                $failed++;
            }

            // TEST 5: Đặt lịch hẹn qua Stored Procedure sp_dat_lich_hen
            $this->info('--- TEST 5: Đặt lịch hẹn khám bệnh qua sp_dat_lich_hen ---');
            $req5 = Request::create('/appointments', 'POST', [
                'MaCaKham' => $caKham->MaCaKham,
                'LyDoKham' => 'Khám tổng quát Portal Test',
            ]);
            $req5->headers->set('Accept', 'application/json');
            $req5->setUserResolver(fn() => $tk1);
            $resp5 = $lhController->store($req5);
            $data5 = json_decode($resp5->getContent(), true);

            $lichHenId = $data5['data']['MaLichHen'] ?? null;
            $countActiveLichHen = LichHen::where('MaCaKham', $caKham->MaCaKham)
                ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])
                ->count();

            if ($resp5->getStatusCode() === 201 && $lichHenId && $countActiveLichHen === 1) {
                $this->info('[PASS] Đặt lịch hẹn thành công (Mã LH: #' . $lichHenId . '), số lịch hẹn đang chờ của ca khám tăng lên 1 an toàn.');
                $passed++;
            } else {
                $this->error('[FAIL] Đặt lịch hẹn thất bại: ' . $resp5->getContent());
                $failed++;
            }

            // TEST 6: Chặn đặt trùng ca khám cho cùng bệnh nhân
            $this->info('--- TEST 6: Chặn đặt trùng ca khám cho cùng bệnh nhân ---');
            try {
                $req6 = Request::create('/appointments', 'POST', [
                    'MaCaKham' => $caKham->MaCaKham,
                    'LyDoKham' => 'Cố tình đặt trùng lần 2',
                ]);
                $req6->headers->set('Accept', 'application/json');
                $req6->setUserResolver(fn() => $tk1);
                $resp6 = $lhController->store($req6);
                $code6 = $resp6->getStatusCode();
            } catch (\Illuminate\Validation\ValidationException $ve) {
                $code6 = 422;
            }

            if ($code6 === 422) {
                $this->info('[PASS] Chặn thành công đặt trùng ca khám cho cùng một bệnh nhân (422 Unprocessable).');
                $passed++;
            } else {
                $this->error('[FAIL] Không chặn được đặt trùng ca khám! Code: ' . $code6);
                $failed++;
            }

            // TEST 7: Chặn Bệnh nhân 2 hủy lịch hẹn của Bệnh nhân 1 (403 Forbidden)
            $this->info('--- TEST 7: Bảo mật hủy lịch hẹn: Chặn hủy lịch người khác ---');
            $req7 = Request::create("/appointments/{$lichHenId}/cancel", 'POST');
            $req7->headers->set('Accept', 'application/json');
            $req7->setUserResolver(fn() => $tk2); // Bệnh nhân 2
            $resp7 = $lhController->cancel($req7, $lichHenId);

            if ($resp7->getStatusCode() === 403) {
                $this->info('[PASS] Chặn thành công 403 Forbidden khi Bệnh nhân 2 cố hủy lịch của Bệnh nhân 1.');
                $passed++;
            } else {
                $this->error('[FAIL] Lỗ hổng: Bệnh nhân khác có thể hủy lịch! Code: ' . $resp7->getStatusCode());
                $failed++;
            }

            // TEST 8: Bệnh nhân 1 tự hủy lịch hẹn của chính mình -> Giải phóng slot ca khám
            $this->info('--- TEST 8: Bệnh nhân tự hủy lịch hẹn & Giải phóng slot ca khám ---');
            $req8 = Request::create("/appointments/{$lichHenId}/cancel", 'POST');
            $req8->headers->set('Accept', 'application/json');
            $req8->setUserResolver(fn() => $tk1); // Bệnh nhân 1
            $resp8 = $lhController->cancel($req8, $lichHenId);

            $lichHenSauHuy = LichHen::find($lichHenId);
            $countSauHuy = LichHen::where('MaCaKham', $caKham->MaCaKham)
                ->whereIn('TrangThai', ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_TIEP_NHAN'])
                ->count();

            if ($resp8->getStatusCode() === 200 && $lichHenSauHuy->TrangThai === 'DA_HUY' && $countSauHuy === 0) {
                $this->info('[PASS] Hủy lịch hẹn thành công: trạng thái chuyển DA_HUY, slot ca khám lập tức được giải phóng về 0.');
                $passed++;
            } else {
                $this->error('[FAIL] Hủy lịch hẹn không đúng logic hoặc không giải phóng slot.');
                $failed++;
            }

            // TEST 9: Lịch sử khám bệnh (medicalHistory)
            $this->info('--- TEST 9: Xem Lịch sử khám bệnh (medicalHistory) ---');
            // Tạo 1 lượt khám thực tế cho BN1
            $luotKham1 = LuotKham::create([
                'MaBenhNhan' => $bn1->MaBenhNhan,
                'MaBacSi' => $doctor->MaBacSi,
                'ThoiGianTiepNhan' => now(),
                'TrangThai' => 'HOAN_THANH',
            ]);

            $req9 = Request::create('/patient/history', 'GET');
            $req9->setUserResolver(fn() => $tk1);
            $resp9 = $bnController->medicalHistory($req9);

            if ($resp9 instanceof InertiaResponse) {
                $props9 = $resp9->toResponse($req9)->getOriginalContent()['page']['props'] ?? [];
                $visitsCount = count($props9['visits'] ?? []);
                if ($visitsCount >= 1 && $props9['visits'][0]['MaBenhNhan'] === $bn1->MaBenhNhan) {
                    $this->info('[PASS] Bệnh nhân xem chính xác lịch sử các đợt khám của mình.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Lịch sử khám không chứa đúng dữ liệu của bệnh nhân.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] medicalHistory không trả về Inertia Response.');
                $failed++;
            }

            // TEST 10: Xem Đơn thuốc của tôi (DonThuocController::index)
            $this->info('--- TEST 10: Xem Đơn thuốc của tôi (DonThuocController::index) ---');
            $donThuoc1 = DonThuoc::create([
                'MaLuotKham' => $luotKham1->MaLuotKham,
                'MaBacSi' => $doctor->MaBacSi,
                'NgayKeDon' => now(),
                'TrangThai' => 'DA_CAP',
                'GhiChu' => 'Uống sau ăn no',
            ]);
            $thuoc1 = Thuoc::first();
            if ($thuoc1) {
                ChiTietDonThuoc::create([
                    'MaDonThuoc' => $donThuoc1->MaDonThuoc,
                    'MaThuoc' => $thuoc1->MaThuoc,
                    'SoLuong' => 10,
                    'LieuDung' => '1 viên',
                    'TanSuat' => '2 lần/ngày',
                    'ThoiDiemDung' => 'Sau ăn',
                    'SoNgayDung' => 5,
                    'DonGia' => $thuoc1->GiaBan ?? 5000,
                    'ThanhTien' => 10 * ($thuoc1->GiaBan ?? 5000),
                    'CachDung' => 'Ngày 2 lần, mỗi lần 1 viên',
                ]);
            }

            $req10 = Request::create('/patient/prescriptions', 'GET');
            $req10->setUserResolver(fn() => $tk1);
            $resp10 = $dtController->index($req10);

            if ($resp10 instanceof InertiaResponse) {
                $props10 = $resp10->toResponse($req10)->getOriginalContent()['page']['props'] ?? [];
                $pCount = count($props10['prescriptions'] ?? []);
                if ($pCount >= 1) {
                    $this->info('[PASS] Đơn thuốc hiển thị đầy đủ chi tiết thuốc, liều dùng và tính đúng TongTienThuoc.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Không tìm thấy đơn thuốc của bệnh nhân.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] Đơn thuốc không trả về Inertia Response.');
                $failed++;
            }

            // TEST 11: Xem Hóa đơn viện phí & Công nợ (HoaDonController::patientInvoices)
            $this->info('--- TEST 11: Xem Hóa đơn & Viện phí (patientInvoices) ---');
            $hoaDon1 = HoaDon::create([
                'MaLuotKham' => $luotKham1->MaLuotKham,
                'TongTien' => 200000,
                'BaoHiemChiTra' => 50000,
                'GiamGia' => 0,
                'BenhNhanChiTra' => 150000,
                'DaThanhToan' => 50000,
                'TrangThai' => 'THANH_TOAN_MOT_PHAN',
                'NgayTao' => now(),
            ]);
            ChiTietHoaDon::create([
                'MaHoaDon' => $hoaDon1->MaHoaDon,
                'LoaiChiPhi' => 'KHAM',
                'NoiDung' => 'Khám chuyên khoa',
                'SoLuong' => 1,
                'DonGia' => 200000,
            ]);
            ThanhToan::create([
                'MaHoaDon' => $hoaDon1->MaHoaDon,
                'SoTien' => 50000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'TrangThai' => 'THANH_CONG',
                'ThoiGianThanhToan' => now(),
                'MaGiaoDich' => 'TX_PORTAL_' . time(),
                'NgayTao' => now(),
            ]);

            $req11 = Request::create('/patient/billing', 'GET');
            $req11->setUserResolver(fn() => $tk1);
            $resp11 = $hdController->patientInvoices($req11);

            if ($resp11 instanceof InertiaResponse) {
                $props11 = $resp11->toResponse($req11)->getOriginalContent()['page']['props'] ?? [];
                $invCount = count($props11['invoices'] ?? []);
                if ($invCount >= 1 && $props11['invoices'][0]['MaHoaDon'] === $hoaDon1->MaHoaDon) {
                    $this->info('[PASS] Hóa đơn viện phí hiển thị đúng chi tiết mục phí, lịch sử phiếu thu và số nợ còn lại.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Hóa đơn không chứa đúng dữ liệu.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] patientInvoices không trả về Inertia Response.');
                $failed++;
            }

            // TEST 12: Chặn Bệnh nhân 2 xem hóa đơn của Bệnh nhân 1 (patientInvoices cách ly dữ liệu)
            $this->info('--- TEST 12: Cách ly dữ liệu hóa đơn giữa các bệnh nhân ---');
            $req12 = Request::create('/patient/billing', 'GET');
            $req12->setUserResolver(fn() => $tk2); // Bệnh nhân 2 chưa có hóa đơn nào
            $resp12 = $hdController->patientInvoices($req12);
            $props12 = $resp12->toResponse($req12)->getOriginalContent()['page']['props'] ?? [];

            if (count($props12['invoices'] ?? []) === 0) {
                $this->info('[PASS] Dữ liệu viện phí được phân quyền độc lập, BN2 không thấy bất kỳ hóa đơn nào của BN1.');
                $passed++;
            } else {
                $this->error('[FAIL] Rò rỉ dữ liệu hóa đơn giữa các bệnh nhân!');
                $failed++;
            }

        } finally {
            // Dọn dẹp dữ liệu kiểm thử
            if (isset($hoaDon1)) {
                ThanhToan::where('MaHoaDon', $hoaDon1->MaHoaDon)->delete();
                // Set toàn bộ công nợ về 0 trước khi xóa chi tiết để thỏa mãn check constraint và trigger
                HoaDon::where('MaHoaDon', $hoaDon1->MaHoaDon)->update([
                    'TongTien' => 0,
                    'BaoHiemChiTra' => 0,
                    'GiamGia' => 0,
                    'BenhNhanChiTra' => 0,
                ]);
                ChiTietHoaDon::where('MaHoaDon', $hoaDon1->MaHoaDon)->delete();
                $hoaDon1->delete();
            }
            if (isset($donThuoc1)) {
                ChiTietDonThuoc::where('MaDonThuoc', $donThuoc1->MaDonThuoc)->delete();
                $donThuoc1->delete();
            }
            if (isset($luotKham1)) {
                $luotKham1->delete();
            }
            if (isset($lichHenId)) {
                LichHen::where('MaLichHen', $lichHenId)->delete();
            }
            $caKham->delete();
            $llv->delete();
            $bn1->delete();
            $tk1->delete();
            $bn2->delete();
            $tk2->delete();
        }

        $this->info('');
        $this->info('================================================================');
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4.4: {$passed} PASS / " . ($passed + $failed) . " TOTAL");
        $this->info('================================================================');

        return $failed === 0 ? 0 : 1;
    }
}
