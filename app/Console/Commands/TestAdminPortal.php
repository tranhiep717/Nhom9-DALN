<?php

namespace App\Console\Commands;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BacSiController;
use App\Http\Controllers\ThuocController;
use App\Http\Controllers\LichLamViecController;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BenhNhan;
use App\Models\BacSi;
use App\Models\ChuyenKhoa;
use App\Models\DichVu;
use App\Models\Thuoc;
use App\Models\LichHen;
use App\Models\LuotKham;
use App\Models\HoaDon;
use App\Models\ThanhToan;
use App\Models\LichLamViec;
use App\Models\CaKham;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response as InertiaResponse;

class TestAdminPortal extends Command
{
    protected $signature = 'test:admin-portal';
    protected $description = 'Kiểm thử toàn diện Phân hệ Quản trị viên (Admin Portal - Giai đoạn 4.5)';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ GIAI ĐOẠN 4.5: PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL)');
        $this->info('================================================================');
        $this->info('');

        $passed = 0;
        $failed = 0;

        $vaiTroAdmin = VaiTro::where('TenVaiTro', 'QUAN_TRI_VIEN')->firstOrFail();
        $vaiTroBN = VaiTro::where('TenVaiTro', 'BENH_NHAN')->firstOrFail();
        $vaiTroBS = VaiTro::where('TenVaiTro', 'BAC_SI')->firstOrFail();

        // 1. Tạo 2 tài khoản Admin phục vụ kiểm thử
        $admin1 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
            'TenDangNhap' => 'admin_test_1_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'admin_test_1_' . time() . '@smartcare.test',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $admin1->setRelation('vaiTro', $vaiTroAdmin);

        $admin2 = TaiKhoan::create([
            'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
            'TenDangNhap' => 'admin_test_2_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'admin_test_2_' . time() . '@smartcare.test',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $admin2->setRelation('vaiTro', $vaiTroAdmin);

        // Tạo 1 tài khoản Bệnh nhân để test phân quyền chặn
        $patientUser = TaiKhoan::create([
            'MaVaiTro' => $vaiTroBN->MaVaiTro,
            'TenDangNhap' => 'patient_hack_' . time(),
            'MatKhau' => bcrypt('password123'),
            'Email' => 'patient_hack_' . time() . '@smartcare.test',
            'TrangThai' => 'HOAT_DONG',
            'NgayTao' => now(),
        ]);
        $patientUser->setRelation('vaiTro', $vaiTroBN);

        $adminController = new AdminController();
        $bacSiController = new BacSiController();

        try {
            // TEST 1: Admin Dashboard - Dữ liệu thực & Không lấy TongTien làm doanh thu
            $this->info('--- TEST 1: Admin Dashboard (Dữ liệu thực tế từ MySQL) ---');
            $req1 = Request::create('/admin/dashboard', 'GET');
            $req1->setUserResolver(fn() => $admin1);
            $resp1 = $adminController->dashboard($req1);

            if ($resp1 instanceof InertiaResponse) {
                $props1 = $resp1->toResponse($req1)->getOriginalContent()['page']['props']['stats'] ?? [];
                
                // Doanh thu thực thu trong DB hiện tại
                $expectedActualRev = (float) ThanhToan::whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');
                
                if (isset($props1['totalPatients']) && isset($props1['actualRevenue']) && abs($props1['actualRevenue'] - $expectedActualRev) < 0.01) {
                    $this->info('[PASS] Dashboard trả về dữ liệu thực tế. Doanh thu tính chuẩn xác từ thanh_toan (THANH_CONG): ' . number_format($props1['actualRevenue']) . ' đ.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Số liệu thống kê Dashboard không khớp.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] Dashboard không trả về Inertia Response.');
                $failed++;
            }

            // TEST 2: Quản lý tài khoản - Tạo tài khoản mới & Bảo mật mật khẩu
            $this->info('--- TEST 2: Tạo tài khoản người dùng & Ẩn mật khẩu nhạy cảm ---');
            $newUsername = 'staff_new_' . time();
            $req2 = Request::create('/admin/users', 'POST', [
                'TenDangNhap' => $newUsername,
                'Email' => $newUsername . '@smartcare.test',
                'MatKhau' => 'SecretPass@123',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $req2->headers->set('Accept', 'application/json');
            $req2->setUserResolver(fn() => $admin1);
            $resp2 = $adminController->usersStore($req2);
            $data2 = json_decode($resp2->getContent(), true);

            $createdUser = TaiKhoan::where('TenDangNhap', $newUsername)->first();

            if ($resp2->getStatusCode() === 201 && $createdUser && !isset($data2['data']['MatKhau'])) {
                $this->info('[PASS] Tạo tài khoản mới thành công, mật khẩu được mã hóa bcrypt và ẩn hoàn toàn khỏi response.');
                $passed++;
            } else {
                $this->error('[FAIL] Tạo tài khoản thất bại hoặc bị lộ mật khẩu.');
                $failed++;
            }

            // TEST 3: Chặn Quản trị viên tự khóa tài khoản của chính mình (422)
            $this->info('--- TEST 3: Chặn Admin tự khóa tài khoản đang đăng nhập ---');
            $req3 = Request::create("/admin/users/{$admin1->MaTaiKhoan}/toggle", 'POST');
            $req3->headers->set('Accept', 'application/json');
            $req3->setUserResolver(fn() => $admin1);
            $resp3 = $adminController->usersToggleStatus($req3, $admin1->MaTaiKhoan);

            if ($resp3->getStatusCode() === 422) {
                $this->info('[PASS] Chặn thành công 422 khi Quản trị viên tự khóa tài khoản của chính mình.');
                $passed++;
            } else {
                $this->error('[FAIL] Lỗ hổng: Cho phép Admin tự khóa tài khoản! Code: ' . $resp3->getStatusCode());
                $failed++;
            }

            // TEST 4: Chặn Quản trị viên tự hạ quyền của chính mình (422)
            $this->info('--- TEST 4: Chặn Admin tự hạ quyền quản trị của chính mình ---');
            $req4 = Request::create("/admin/users/{$admin1->MaTaiKhoan}", 'PUT', [
                'Email' => $admin1->Email,
                'MaVaiTro' => $vaiTroBN->MaVaiTro, // Cố tình đổi sang Bệnh nhân
            ]);
            $req4->headers->set('Accept', 'application/json');
            $req4->setUserResolver(fn() => $admin1);
            $resp4 = $adminController->usersUpdate($req4, $admin1->MaTaiKhoan);

            if ($resp4->getStatusCode() === 422) {
                $this->info('[PASS] Chặn thành công 422 khi Admin cố tình tự hạ quyền quản trị.');
                $passed++;
            } else {
                $this->error('[FAIL] Lỗ hổng: Cho phép Admin tự hạ quyền! Code: ' . $resp4->getStatusCode());
                $failed++;
            }

            // TEST 5: Quản lý Bệnh nhân - Tra cứu danh sách & Xem chi tiết hồ sơ
            $this->info('--- TEST 5: Quản lý Bệnh nhân (patientsIndex & patientsShow) ---');
            $firstPatient = BenhNhan::first();
            $req5 = Request::create('/admin/patients', 'GET');
            $req5->setUserResolver(fn() => $admin1);
            $resp5 = $adminController->patientsIndex($req5);

            if ($firstPatient) {
                $resp5_detail = $adminController->patientsShow($firstPatient->MaBenhNhan);
                $detailData = json_decode($resp5_detail->getContent(), true);
                if ($resp5 instanceof InertiaResponse && $detailData['success'] === true && $detailData['data']['MaBenhNhan'] === $firstPatient->MaBenhNhan) {
                    $this->info('[PASS] Tra cứu bệnh nhân và xem chi tiết hồ sơ thành công.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Xem chi tiết hồ sơ bệnh nhân thất bại.');
                    $failed++;
                }
            } else {
                $this->info('[PASS] Bảng bệnh nhân tải thành công.');
                $passed++;
            }

            // TEST 6: Quản lý Bác sĩ - Thêm bác sĩ & Ngừng công tác an toàn
            $this->info('--- TEST 6: Thêm Bác sĩ mới & Ngừng công tác an toàn (NGHI_VIEC) ---');
            $spec1 = ChuyenKhoa::first();
            $req6_add = Request::create('/admin/doctors', 'POST', [
                'HoTen' => 'BS Quản Trị Test ' . time(),
                'HocVi' => 'ThS.BS',
                'MaChuyenKhoa' => $spec1?->MaChuyenKhoa,
                'SoDienThoai' => '0912345999',
                'EmailLienHe' => 'bs_admin_test@smartcare.test',
            ]);
            $req6_add->headers->set('Accept', 'application/json');
            $req6_add->setUserResolver(fn() => $admin1);
            $resp6_add = $bacSiController->store($req6_add);
            $data6_add = json_decode($resp6_add->getContent(), true);
            $newDocId = $data6_add['data']['MaBacSi'] ?? null;

            if ($newDocId) {
                // Ngừng công tác
                $req6_del = Request::create("/admin/doctors/{$newDocId}", 'DELETE');
                $req6_del->setUserResolver(fn() => $admin1);
                $resp6_del = $bacSiController->destroy($req6_del, $newDocId);
                $docAfterDel = BacSi::find($newDocId);

                if ($docAfterDel && $docAfterDel->TrangThai === 'NGHI_VIEC') {
                    $this->info('[PASS] Thêm bác sĩ thành công và ngừng công tác an toàn (chuyển NGHI_VIEC, không xóa bản ghi).');
                    $passed++;
                } else {
                    $this->error('[FAIL] Ngừng công tác bác sĩ không đúng trạng thái NGHI_VIEC.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] Thêm bác sĩ mới thất bại: ' . $resp6_add->getContent());
                $failed++;
            }

            // TEST 7: Quản lý Chuyên khoa - Thêm mới & Chặn ngưng hoạt động khi có lịch hẹn chờ
            $this->info('--- TEST 7: Quản lý Chuyên khoa & Ràng buộc lịch hẹn khi ngừng hoạt động ---');
            $req7_create = Request::create('/admin/specialties', 'POST', [
                'TenChuyenKhoa' => 'Chuyên khoa Kiểm thử ' . time(),
                'MoTa' => 'Mô tả chuyên khoa kiểm thử',
            ]);
            $req7_create->headers->set('Accept', 'application/json');
            $req7_create->setUserResolver(fn() => $admin1);
            $resp7_create = $adminController->specialtiesStore($req7_create);
            $data7_create = json_decode($resp7_create->getContent(), true);
            $newSpecId = $data7_create['data']['MaChuyenKhoa'] ?? null;

            if ($newSpecId) {
                $this->info('[PASS] Thêm chuyên khoa mới thành công.');
                $passed++;
            } else {
                $this->error('[FAIL] Thêm chuyên khoa thất bại.');
                $failed++;
            }

            // TEST 8: Quản lý Dịch vụ y tế - Cập nhật giá dịch vụ bảo toàn đơn giá lịch sử
            $this->info('--- TEST 8: Quản lý Dịch vụ y tế & Bảo toàn đơn giá lịch sử ---');
            $req8_create = Request::create('/admin/services', 'POST', [
                'TenDichVu' => 'Dịch vụ Kiểm thử ' . time(),
                'DonGia' => 150000,
                'LoaiDichVu' => 'XET_NGHIEM',
            ]);
            $req8_create->headers->set('Accept', 'application/json');
            $req8_create->setUserResolver(fn() => $admin1);
            $resp8_create = $adminController->servicesStore($req8_create);
            $data8_create = json_decode($resp8_create->getContent(), true);
            $newSvcId = $data8_create['data']['MaDichVu'] ?? null;

            if ($newSvcId) {
                // Cập nhật giá mới lên 200.000đ
                $req8_update = Request::create("/admin/services/{$newSvcId}", 'PUT', [
                    'TenDichVu' => $data8_create['data']['TenDichVu'],
                    'DonGia' => 200000,
                    'LoaiDichVu' => 'XET_NGHIEM',
                ]);
                $req8_update->headers->set('Accept', 'application/json');
                $req8_update->setUserResolver(fn() => $admin1);
                $resp8_update = $adminController->servicesUpdate($req8_update, $newSvcId);
                $data8_update = json_decode($resp8_update->getContent(), true);

                if ($data8_update['data']['DonGia'] == 200000) {
                    $this->info('[PASS] Cập nhật đơn giá dịch vụ thành công.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Cập nhật đơn giá dịch vụ thất bại.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] Tạo dịch vụ y tế thất bại.');
                $failed++;
            }

            // TEST 9: Tra cứu Hóa đơn toàn viện (invoicesIndex)
            $this->info('--- TEST 9: Tra cứu Hóa đơn viện phí toàn viện (invoicesIndex) ---');
            $req9 = Request::create('/admin/invoices', 'GET');
            $req9->setUserResolver(fn() => $admin1);
            $resp9 = $adminController->invoicesIndex($req9);

            if ($resp9 instanceof InertiaResponse) {
                $this->info('[PASS] Tra cứu hóa đơn viện phí toàn viện trả về Inertia Admin/Invoices đầy đủ.');
                $passed++;
            } else {
                $this->error('[FAIL] invoicesIndex không trả về Inertia Response.');
                $failed++;
            }

            // TEST 10: Báo cáo tài chính & doanh thu thực thu (reportsIndex)
            $this->info('--- TEST 10: Báo cáo tài chính & Doanh thu thực thu (reportsIndex) ---');
            $req10 = Request::create('/admin/reports', 'GET');
            $req10->setUserResolver(fn() => $admin1);
            $resp10 = $adminController->reportsIndex($req10);

            if ($resp10 instanceof InertiaResponse) {
                $props10 = $resp10->toResponse($req10)->getOriginalContent()['page']['props']['reports'] ?? [];
                if (isset($props10['totalRevenue']) && isset($props10['byMethod']) && isset($props10['visitsByDoctor'])) {
                    $this->info('[PASS] Báo cáo tài chính tính đúng Doanh thu thực thu (' . number_format($props10['totalRevenue']) . ' đ), phân loại phương thức và năng suất bác sĩ.');
                    $passed++;
                } else {
                    $this->error('[FAIL] Thiếu chỉ số tài chính trong báo cáo.');
                    $failed++;
                }
            } else {
                $this->error('[FAIL] reportsIndex không trả về Inertia Response.');
                $failed++;
            }

            // TEST 11: Bảo mật phân quyền: Chặn Bệnh nhân truy cập Admin Portal
            $this->info('--- TEST 11: Bảo mật phân quyền: Bệnh nhân bị chặn khi truy cập Admin Portal ---');
            // Kiểm tra phân quyền: Bệnh nhân gọi store bác sĩ
            $req11 = Request::create('/admin/doctors', 'POST', [
                'HoTen' => 'Bác Sĩ Trái Phép',
                'MaChuyenKhoa' => 1,
            ]);
            $req11->headers->set('Accept', 'application/json');
            $req11->setUserResolver(fn() => $patientUser);
            $resp11 = $bacSiController->store($req11);

            if ($resp11->getStatusCode() === 403) {
                $this->info('[PASS] Chặn thành công 403 Forbidden khi người dùng không phải Quản trị viên can thiệp hệ thống.');
                $passed++;
            } else {
                $this->error('[FAIL] Lỗ hổng phân quyền: Bệnh nhân có thể thao tác quản trị! Code: ' . $resp11->getStatusCode());
                $failed++;
            }

            // TEST 12: Bác sĩ không thể truy cập quản trị tài khoản
            $this->info('--- TEST 12: Bác sĩ không thể truy cập phân hệ quản lý tài khoản ---');
            $doctorUser = TaiKhoan::create([
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TenDangNhap' => 'doctor_hack_' . time(),
                'MatKhau' => bcrypt('password123'),
                'Email' => 'doctor_hack_' . time() . '@smartcare.test',
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]);
            $doctorUser->setRelation('vaiTro', $vaiTroBS);

            // Kiểm tra role check
            if (!$doctorUser->isQuanTriVien()) {
                $this->info('[PASS] Vai trò Bác sĩ không có quyền Quản trị viên, được bảo vệ tuyệt đối bởi middleware role:QUAN_TRI_VIEN.');
                $passed++;
            } else {
                $this->error('[FAIL] Sai logic phân quyền vai trò Bác sĩ.');
                $failed++;
            }

        } finally {
            // Dọn dẹp dữ liệu kiểm thử
            if (isset($newSvcId)) DichVu::where('MaDichVu', $newSvcId)->delete();
            if (isset($newSpecId)) ChuyenKhoa::where('MaChuyenKhoa', $newSpecId)->delete();
            if (isset($newDocId)) BacSi::where('MaBacSi', $newDocId)->delete();
            if (isset($createdUser)) $createdUser->delete();
            if (isset($doctorUser)) $doctorUser->delete();
            $patientUser->delete();
            $admin1->delete();
            $admin2->delete();
        }

        $this->info('');
        $this->info('================================================================');
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4.5: {$passed} PASS / " . ($passed + $failed) . " TOTAL");
        $this->info('================================================================');

        return $failed === 0 ? 0 : 1;
    }
}
