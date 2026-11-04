<?php

namespace App\Console\Commands;

use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LuotKhamController;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChuyenKhoa;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\LuotKham;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Response;

class TestLeTanHangCho extends Command
{
    protected $signature = 'test:letanhangcho';
    protected $description = 'Kiểm thử tích hợp Giai đoạn 4.1: Giao diện Hàng chờ & Tiếp nhận Lễ tân';

    public function handle(): int
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('   KIỂM THỬ GIAI ĐOẠN 4.1: HÀNG CHỜ & TIẾP NHẬN BỆNH NHÂN (LỄ TÂN)');
        $this->info('================================================================');
        $this->info('');

        $lichHenCtrl = new LichHenController();
        $luotKhamCtrl = new LuotKhamController();

        $passed = 0;
        $failed = 0;

        $createdVisits = [];
        $createdAppointments = [];
        $createdSlots = [];
        $createdSchedules = [];
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

            // Tạo Bác sĩ test
            $tkDoc = TaiKhoan::create([
                'TenDangNhap' => 'test_lt_doc_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'lt_doc_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBS->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkDoc->MaTaiKhoan;

            $doc = BacSi::create([
                'MaTaiKhoan' => $tkDoc->MaTaiKhoan,
                'MaChuyenKhoa' => $ck->MaChuyenKhoa,
                'HoTen' => 'BS. Test Hàng Chờ ' . time(),
                'HocVi' => 'ThS.BS',
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdDoctors[] = $doc->MaBacSi;
            $tkDoc->setRelation('vaiTro', $vaiTroBS);
            $tkDoc->setRelation('bacSi', $doc);

            // Tạo Bệnh nhân test 1
            $tkPat1 = TaiKhoan::create([
                'TenDangNhap' => 'test_lt_pat1_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'lt_pat1_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPat1->MaTaiKhoan;

            $pat1 = BenhNhan::create([
                'MaTaiKhoan' => $tkPat1->MaTaiKhoan,
                'HoTen' => 'Nguyễn Bệnh Nhân Chờ Khám ' . time(),
                'SoDienThoai' => '0981112233',
                'GioiTinh' => 'NAM',
            ]);
            $createdPatients[] = $pat1->MaBenhNhan;
            $tkPat1->setRelation('vaiTro', $vaiTroBN);
            $tkPat1->setRelation('benhNhan', $pat1);

            // Tạo Bệnh nhân test 2
            $tkPat2 = TaiKhoan::create([
                'TenDangNhap' => 'test_lt_pat2_' . time(),
                'MatKhau' => bcrypt('123456'),
                'Email' => 'lt_pat2_' . time() . '@smartcare.vn',
                'MaVaiTro' => $vaiTroBN->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
            ]);
            $createdAccounts[] = $tkPat2->MaTaiKhoan;

            $pat2 = BenhNhan::create([
                'MaTaiKhoan' => $tkPat2->MaTaiKhoan,
                'HoTen' => 'Trần Bệnh Nhân Hủy Hẹn ' . time(),
                'SoDienThoai' => '0984445566',
                'GioiTinh' => 'NU',
            ]);
            $createdPatients[] = $pat2->MaBenhNhan;
            $tkPat2->setRelation('vaiTro', $vaiTroBN);
            $tkPat2->setRelation('benhNhan', $pat2);

            // Tạo tài khoản Lễ tân & Admin
            $receptionistUser = new TaiKhoan([
                'MaTaiKhoan' => 88881,
                'MaVaiTro' => $vaiTroLT->MaVaiTro,
                'TenDangNhap' => 'letan_tester',
            ]);
            $receptionistUser->setRelation('vaiTro', $vaiTroLT);

            $adminUser = new TaiKhoan([
                'MaTaiKhoan' => 88882,
                'MaVaiTro' => $vaiTroAdmin->MaVaiTro,
                'TenDangNhap' => 'admin_tester',
            ]);
            $adminUser->setRelation('vaiTro', $vaiTroAdmin);

            // Tạo Lịch làm việc và Ca khám hôm nay
            $today = date('Y-m-d');
            $sched = LichLamViec::create([
                'MaBacSi' => $doc->MaBacSi,
                'NgayLamViec' => $today,
                'GioBatDau' => '08:00:00',
                'GioKetThuc' => '12:00:00',
                'SoLuongTiepNhan' => 10,
                'TrangThai' => 'MO',
            ]);
            $createdSchedules[] = $sched->MaLichLamViec;

            $ca = CaKham::create([
                'MaLichLamViec' => $sched->MaLichLamViec,
                'GioBatDau' => '08:30:00',
                'GioKetThuc' => '10:00:00',
                'SoLuongTiepNhan' => 5,
                'TrangThai' => 'CON_TRONG',
            ]);
            $createdSlots[] = $ca->MaCaKham;

            // Tạo Lịch hẹn 1 (Đã xác nhận - sẵn sàng tiếp nhận)
            $lh1 = LichHen::create([
                'MaCaKham' => $ca->MaCaKham,
                'MaBenhNhan' => $pat1->MaBenhNhan,
                'NgayDat' => now(),
                'TrangThai' => 'DA_XAC_NHAN',
                'LyDoKham' => 'Khám sức khỏe tổng quát',
            ]);
            $createdAppointments[] = $lh1->MaLichHen;

            // Tạo Lịch hẹn 2 (Đã hủy - không thể tiếp nhận)
            $lh2 = LichHen::create([
                'MaCaKham' => $ca->MaCaKham,
                'MaBenhNhan' => $pat2->MaBenhNhan,
                'NgayDat' => now(),
                'TrangThai' => 'DA_HUY',
                'LyDoKham' => 'Đã hủy vì bận',
            ]);
            $createdAppointments[] = $lh2->MaLichHen;

            // =========================================================
            // TEST 1: TRUY CẬP MÀN HÌNH HÀNG CHỜ LỄ TÂN (QUEUE VIEW)
            // =========================================================
            $this->info('--- PHẦN 1: KẾT NỐI MÀN HÌNH HÀNG CHỜ RECEPTIONIST/QUEUE ---');

            $this->line('1.1. Lễ tân truy cập màn hình /receptionist/queue (Inertia View)...');
            $req1_1 = Request::create('/receptionist/queue', 'GET', ['date' => $today]);
            $req1_1->setUserResolver(fn() => $receptionistUser);
            $res1_1 = $lichHenCtrl->queue($req1_1);

            if ($res1_1 instanceof Response) {
                $props = $res1_1->toResponse($req1_1)->getOriginalContent()['page']['props'];
                $hasAppointments = isset($props['appointments']);
                $hasDoctors = isset($props['doctors']);
                $hasSpecialties = isset($props['specialties']);
                $hasStats = isset($props['stats']);
                $hasFilters = isset($props['filters']);

                if ($hasAppointments && $hasDoctors && $hasSpecialties && $hasStats && $hasFilters) {
                    $this->info("   -> PASS: Render Inertia Receptionist/Queue thành công với đầy đủ props thực tế từ MySQL.");
                    $this->line("       Tổng lịch hẹn hôm nay: {$props['stats']['total_today']}, Đang chờ: {$props['stats']['waiting_checkin']}");
                    $passed++;
                } else {
                    $this->error('   -> FAIL: Thiếu props Inertia.');
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Controller không trả về Inertia Response.');
                $failed++;
            }

            // 1.2 Phân quyền: Bệnh nhân cố truy cập /receptionist/queue -> 403
            $this->line('1.2. Phân quyền: Bệnh nhân cố truy cập /receptionist/queue (403)...');
            $req1_2 = Request::create('/receptionist/queue', 'GET');
            $req1_2->setUserResolver(fn() => $tkPat1);

            try {
                $lichHenCtrl->queue($req1_2);
                $this->error('   -> FAIL: Cho phép Bệnh nhân truy cập hàng chờ lễ tân!');
                $failed++;
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                if ($e->getStatusCode() === 403) {
                    $this->info('   -> PASS: Chặn thành công Bệnh nhân truy cập trang Lễ tân (403 Forbidden)');
                    $passed++;
                } else {
                    $this->error('   -> FAIL: Lỗi status code: ' . $e->getStatusCode());
                    $failed++;
                }
            }

            // =========================================================
            // TEST 2: TÌM KIẾM VÀ BỘ LỌC HÀNG CHỜ
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 2: KIỂM THỬ BỘ LỌC & TÌM KIẾM HÀNG CHỜ ---');

            // 2.1 Lọc theo ngày hôm nay
            $this->line('2.1. Lọc danh sách theo ngày hôm nay...');
            $req2_1 = Request::create('/receptionist/queue', 'GET', ['date' => $today]);
            $req2_1->setUserResolver(fn() => $receptionistUser);
            $res2_1 = $lichHenCtrl->queue($req2_1);
            $props2_1 = $res2_1->toResponse($req2_1)->getOriginalContent()['page']['props'];
            $appIds = collect($props2_1['appointments'])->pluck('MaLichHen');

            if ($appIds->contains($lh1->MaLichHen)) {
                $this->info("   -> PASS: Lọc theo ngày hôm nay hiển thị đúng Lịch hẹn #{$lh1->MaLichHen}");
                $passed++;
            } else {
                $this->error('   -> FAIL: Không tìm thấy lịch hẹn theo ngày hôm nay');
                $failed++;
            }

            // 2.2 Tìm kiếm theo số điện thoại bệnh nhân 1
            $this->line('2.2. Tìm kiếm theo số điện thoại bệnh nhân: 0981112233...');
            $req2_2 = Request::create('/receptionist/queue', 'GET', [
                'date' => $today,
                'search' => '0981112233',
            ]);
            $req2_2->setUserResolver(fn() => $receptionistUser);
            $res2_2 = $lichHenCtrl->queue($req2_2);
            $props2_2 = $res2_2->toResponse($req2_2)->getOriginalContent()['page']['props'];

            $foundPat1 = collect($props2_2['appointments'])->contains('MaLichHen', $lh1->MaLichHen);
            $foundPat2 = collect($props2_2['appointments'])->contains('MaLichHen', $lh2->MaLichHen);

            if ($foundPat1 && !$foundPat2) {
                $this->info('   -> PASS: Tìm kiếm theo số điện thoại chính xác tuyệt đối');
                $passed++;
            } else {
                $this->error('   -> FAIL: Kết quả tìm kiếm không chính xác');
                $failed++;
            }

            // 2.3 Lọc theo trạng thái DA_XAC_NHAN
            $this->line('2.3. Lọc theo trạng thái DA_XAC_NHAN...');
            $req2_3 = Request::create('/receptionist/queue', 'GET', [
                'date' => $today,
                'status' => 'DA_XAC_NHAN',
            ]);
            $req2_3->setUserResolver(fn() => $receptionistUser);
            $res2_3 = $lichHenCtrl->queue($req2_3);
            $props2_3 = $res2_3->toResponse($req2_3)->getOriginalContent()['page']['props'];

            $hasLH1 = collect($props2_3['appointments'])->contains('MaLichHen', $lh1->MaLichHen);
            $hasLH2 = collect($props2_3['appointments'])->contains('MaLichHen', $lh2->MaLichHen);

            if ($hasLH1 && !$hasLH2) {
                $this->info('   -> PASS: Lọc theo trạng thái DA_XAC_NHAN chính xác (loại trừ DA_HUY)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Lọc trạng thái sai');
                $failed++;
            }

            // =========================================================
            // TEST 3: CHỨC NĂNG TIẾP NHẬN BỆNH NHÂN (POST /receptionist/visits)
            // =========================================================
            $this->info('');
            $this->info('--- PHẦN 3: CHỨC NĂNG TIẾP NHẬN BỆNH NHÂN ---');

            // 3.1 Bệnh nhân cố tự tiếp nhận bản thân -> 403
            $this->line('3.1. Phân quyền: Bệnh nhân cố tự gọi tiếp nhận bản thân (403)...');
            $req3_1 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh1->MaLichHen,
            ]);
            $req3_1->setUserResolver(fn() => $tkPat1);
            $res3_1 = $luotKhamCtrl->store($req3_1);

            if ($res3_1->getStatusCode() === 403) {
                $this->info('   -> PASS: Chặn thành công Bệnh nhân tự ý tiếp nhận (403 Forbidden)');
                $passed++;
            } else {
                $this->error('   -> FAIL: Bệnh nhân tự tiếp nhận được! Code: ' . $res3_1->getStatusCode());
                $failed++;
            }

            // 3.2 Lễ tân tiếp nhận lịch hẹn đã bị hủy (lh2) -> Bị chặn
            $this->line('3.2. Chặn tiếp nhận lịch hẹn không hợp lệ (Lịch hẹn đã hủy)...');
            $req3_2 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh2->MaLichHen,
            ]);
            $req3_2->setUserResolver(fn() => $receptionistUser);

            try {
                $luotKhamCtrl->store($req3_2);
                $this->error('   -> FAIL: Cho phép tiếp nhận lịch hẹn đã hủy!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn tiếp nhận lịch hẹn đã hủy thành công: ' . json_encode($e->errors(), JSON_UNESCAPED_UNICODE));
                $passed++;
            }

            // 3.3 Lễ tân tiếp nhận thành công lịch hẹn hợp lệ (lh1)
            $this->line('3.3. Lễ tân tiếp nhận bệnh nhân 1 từ Lịch hẹn #lh1...');
            $req3_3 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh1->MaLichHen,
            ]);
            $req3_3->setUserResolver(fn() => $receptionistUser);
            $res3_3 = $luotKhamCtrl->store($req3_3);
            $data3_3 = json_decode($res3_3->getContent(), true);

            if ($res3_3->getStatusCode() === 201 && $data3_3['success'] === true) {
                $createdVisitId = $data3_3['data']['MaLuotKham'];
                $createdVisits[] = $createdVisitId;
                $lh1Fresh = $lh1->fresh();

                if ($lh1Fresh->TrangThai === 'DA_TIEP_NHAN') {
                    $this->info("   -> PASS: Tiếp nhận thành công [Mã lượt khám: {$createdVisitId}]. Lịch hẹn chuyển 'DA_TIEP_NHAN'.");
                    $passed++;
                } else {
                    $this->error("   -> FAIL: Lịch hẹn không đổi trạng thái: {$lh1Fresh->TrangThai}");
                    $failed++;
                }
            } else {
                $this->error('   -> FAIL: Tiếp nhận thất bại: ' . $res3_3->getContent());
                $failed++;
                return 1;
            }

            // 3.4 Chặn tiếp nhận trùng lần 2 cho cùng lịch hẹn lh1
            $this->line('3.4. Kiểm tra chặn tiếp nhận trùng lần 2 cho Lịch hẹn #lh1...');
            $req3_4 = Request::create('/receptionist/visits', 'POST', [
                'MaLichHen' => $lh1->MaLichHen,
            ]);
            $req3_4->setUserResolver(fn() => $receptionistUser);

            try {
                $luotKhamCtrl->store($req3_4);
                $this->error('   -> FAIL: Cho phép tiếp nhận trùng lịch hẹn!');
                $failed++;
            } catch (ValidationException $e) {
                $this->info('   -> PASS: Chặn tiếp nhận trùng lặp thành công (ValidationException)');
                $passed++;
            }

            // 3.5 Tải lại hàng chờ: Kiểm tra Lịch hẹn #lh1 hiển thị trạng thái 'Đã vào hàng chờ'
            $this->line('3.5. Tải lại danh sách hàng chờ: Kiểm tra Lịch hẹn #lh1 đã có luot_kham...');
            $req3_5 = Request::create('/receptionist/queue', 'GET', ['date' => $today]);
            $req3_5->setUserResolver(fn() => $receptionistUser);
            $res3_5 = $lichHenCtrl->queue($req3_5);
            $props3_5 = $res3_5->toResponse($req3_5)->getOriginalContent()['page']['props'];

            $app1InQueue = collect($props3_5['appointments'])->firstWhere('MaLichHen', $lh1->MaLichHen);
            $appTrangThai = data_get($app1InQueue, 'TrangThai');
            $luotKham = data_get($app1InQueue, 'luot_kham') ?? data_get($app1InQueue, 'luotKham');
            $maLuotKham = data_get($luotKham, 'MaLuotKham');
            $trangThaiLuotKham = data_get($luotKham, 'TrangThai');

            if ($app1InQueue && $appTrangThai === 'DA_TIEP_NHAN' && !empty($luotKham)) {
                $this->info("   -> PASS: Hàng chờ cập nhật chính xác: Lịch hẹn #{$lh1->MaLichHen} đã có lượt khám #{$maLuotKham} (Trạng thái: {$trangThaiLuotKham})");
                $passed++;
            } else {
                $this->error('   -> FAIL: Dữ liệu hàng chờ sau khi tiếp nhận không khớp!');
                $failed++;
            }

        } catch (\Throwable $e) {
            $this->error('LỖI KHÔNG MONG MUỐN: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            $failed++;
        } finally {
            // DỌN DẸP AN TOÀN
            $this->info('');
            $this->info('--- DỌN DẸP DỮ LIỆU TEST ---');

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
        $this->info("   KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4.1: PASS: {$passed} | FAIL: {$failed}");
        $this->info('================================================================');
        $this->info('');

        return $failed === 0 ? 0 : 1;
    }
}
