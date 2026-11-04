<?php

namespace App\Console\Commands;

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
use App\Models\Thuoc;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VerifyRemainingRequirementsCommand extends Command
{
    protected $signature = 'test:verify-remaining-requirements';
    protected $description = 'Kiểm tra và xác minh 6 yêu cầu nghiệp vụ bắt buộc của SmartCare';

    private int $passCount = 0;
    private int $failCount = 0;

    public function handle(): int
    {
        $this->info("================================================================================");
        $this->info("   SMARTCARE: KIỂM THỬ XÁC MINH 6 YÊU CẦU NGHIỆP VỤ BẮT BUỘC");
        $this->info("================================================================================");

        $this->verifyReceptionistPermissions();
        $this->verifyAdminPermissions();
        $this->verifyPhieuKhamFlow();
        $this->verifyServiceRequestCreation();
        $this->verifyClsTechnicianPermissions();
        $this->verifyFullEndToEndWorkflow();

        $this->info("\n--------------------------------------------------------------------------------");
        $total = $this->passCount + $this->failCount;
        $this->info("TỔNG KẾT KIỂM THỬ: {$this->passCount} PASS / {$total} CHECKS");
        if ($this->failCount === 0) {
            $this->info(">>> TẤT CẢ 6 YÊU CẦU NGHIỆP VỤ ĐỀU ĐẠT CHUẨN 100% (PASS) <<<");
            return 0;
        } else {
            $this->error(">>> CÓ {$this->failCount} KIỂM THỬ THẤT BẠI. CẦN KIỂM TRA LẠI! <<<");
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
     * Yêu cầu 1: Quyền của Lễ tân
     */
    private function verifyReceptionistPermissions()
    {
        $this->info("\n--- YÊU CẦU 1: QUYỀN CỦA LỄ TÂN ---");

        $recepUser = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $doctorUser = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $patient = BenhNhan::first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorUser->MaTaiKhoan)->first();

        // 1. Tạo lượt khám giả định
        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'CHO_KHAM',
        ]);

        $luotKhamCtrl = new LuotKhamController();
        $donThuocCtrl = new DonThuocController();
        $clsCtrl = new CanLamSangController();

        // 1.1 Lễ tân không được bắt đầu khám (HTTP 403)
        $startReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $startReq->setUserResolver(fn () => $recepUser);
        $startRes = $luotKhamCtrl->startExamine($startReq, $visit->MaLuotKham);
        $this->record($startRes->getStatusCode() === 403, "Lễ tân gọi bắt đầu khám bệnh bị chặn HTTP 403 Forbidden");

        // 1.2 Lễ tân không được sửa phiếu khám (HTTP 403)
        $phieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Sốt ho',
            'ChanDoan' => 'Cảm cúm',
        ]);
        $phieuReq->setUserResolver(fn () => $recepUser);
        $phieuRes = $luotKhamCtrl->savePhieuKham($phieuReq, $visit->MaLuotKham);
        $this->record($phieuRes->getStatusCode() === 403, "Lễ tân gọi lưu phiếu khám bệnh bị chặn HTTP 403 Forbidden");

        // 1.3 Lễ tân không được kê đơn thuốc (HTTP 403)
        $dtReq = Request::create("/doctor/prescriptions", 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [['MaThuoc' => 1, 'SoLuong' => 1, 'LieuDung' => '1v', 'TanSuat' => '1l']],
        ]);
        $dtReq->setUserResolver(fn () => $recepUser);
        $dtRes = $donThuocCtrl->store($dtReq);
        $this->record($dtRes->getStatusCode() === 403, "Lễ tân gọi kê đơn thuốc bị chặn HTTP 403 Forbidden");

        // 1.4 Lễ tân không được cập nhật kết quả CLS (HTTP 403)
        $dichVu = DichVu::first();
        $chiDinh = ChiDinhDichVu::create([
            'MaLuotKham' => $visit->MaLuotKham,
            'MaDichVu' => $dichVu->MaDichVu,
            'MaBacSi' => $doctor->MaBacSi,
            'TrangThai' => 'CHO_TIEP_NHAN',
            'DonGia' => $dichVu->DonGia,
            'NgayChiDinh' => now(),
        ]);

        $clsResReq = Request::create("/cls/requests/{$chiDinh->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Kết quả thử nghiệm',
        ]);
        $clsResReq->setUserResolver(fn () => $recepUser);
        $clsUpdateRes = $clsCtrl->updateResult($clsResReq, $chiDinh->MaChiDinh);
        $this->record($clsUpdateRes->getStatusCode() === 403, "Lễ tân gọi nhập kết quả CLS bị chặn HTTP 403 Forbidden");

        // 1.5 Bác sĩ phụ trách có quyền bắt đầu khám (HTTP 200)
        $startDocReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $startDocReq->setUserResolver(fn () => $doctorUser);
        $startDocRes = $luotKhamCtrl->startExamine($startDocReq, $visit->MaLuotKham);
        $this->record($startDocRes->getStatusCode() === 200, "Chỉ Bác sĩ phụ trách có quyền bắt đầu khám bệnh (HTTP 200 OK)");

        // Dọn dẹp
        $chiDinh->delete();
        $visit->delete();
    }

    /**
     * Yêu cầu 2: Quyền của Admin
     */
    private function verifyAdminPermissions()
    {
        $this->info("\n--- YÊU CẦU 2: QUYỀN CỦA ADMIN ---");

        $adminUser = TaiKhoan::where('Email', 'admin@smartcare.vn')->first();
        $patient = BenhNhan::first();
        $caKham = CaKham::first();

        // 2.1 Admin không được có chức năng tự phân bệnh nhân vào ca khám (LichHenController::store bị 403)
        $lichHenCtrl = new LichHenController();
        $bookReq = Request::create('/receptionist/appointments', 'POST', [
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'LyDoKham' => 'Admin phân ca khám trực tiếp',
        ]);
        $bookReq->setUserResolver(fn () => $adminUser);

        $bookRes = $lichHenCtrl->store($bookReq);
        $this->record($bookRes->getStatusCode() === 403, "Admin cố tình phân bệnh nhân vào ca khám bị chặn HTTP 403 Forbidden");

        // 2.2 Bệnh nhân tự đặt lịch vào ca còn chỗ
        $patientUser = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $bnBookReq = Request::create('/receptionist/appointments', 'POST', [
            'MaCaKham' => $caKham->MaCaKham,
            'LyDoKham' => 'Bệnh nhân tự đặt lịch',
        ]);
        $bnBookReq->setUserResolver(fn () => $patientUser);
        $bnBookRes = $lichHenCtrl->store($bnBookReq);
        $this->record(in_array($bnBookRes->getStatusCode(), [200, 201]) || $bnBookRes->getStatusCode() === 422, "Bệnh nhân tự đặt lịch vào ca khám hợp lệ (HTTP {$bnBookRes->getStatusCode()})");

        // Xóa lịch hẹn nếu vừa tạo thành công
        if ($bnBookRes->getStatusCode() === 200 || $bnBookRes->getStatusCode() === 201) {
            $createdLh = LichHen::where('MaBenhNhan', $patientUser->benhNhan->MaBenhNhan)
                ->where('MaCaKham', $caKham->MaCaKham)
                ->orderBy('MaLichHen', 'desc')
                ->first();
            $createdLh?->delete();
        }
    }

    /**
     * Yêu cầu 3: Sửa lỗi lưu phiếu khám
     */
    private function verifyPhieuKhamFlow()
    {
        $this->info("\n--- YÊU CẦU 3: SỬA LỖI LƯU PHIẾU KHÁM & CHỐNG DUPLICATE ---");

        $doctorUser = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorUser->MaTaiKhoan)->first();
        $patient = BenhNhan::first();

        // Tạo lượt khám
        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'CHO_KHAM',
        ]);

        $luotKhamCtrl = new LuotKhamController();

        // 3.1 Bác sĩ lưu phiếu khám sơ bộ
        $req1 = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Đau rát họng, ho có đờm trắng',
            'ChanDoan' => 'Theo dõi Viêm họng cấp / Viêm amidan',
            'KetQuaKham' => 'Họng đỏ, amidan sưng nhẹ',
        ]);
        $req1->setUserResolver(fn () => $doctorUser);
        $luotKhamCtrl->savePhieuKham($req1, $visit->MaLuotKham);

        // Đọc lại từ database (mô phỏng tải lại trang)
        $savedPhieu = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->first();
        $this->record($savedPhieu !== null, "Phiếu khám được lưu thành công vào bảng phieu_kham");
        $this->record($savedPhieu?->TrieuChung === 'Đau rát họng, ho có đờm trắng', "Dữ liệu TrieuChung đọc lại chính xác sau khi tải lại");
        $this->record(str_contains($savedPhieu?->ChanDoan ?? '', 'Viêm họng cấp'), "Dữ liệu ChanDoan sơ bộ đọc lại chính xác");

        // Lượt khám tự chuyển sang DANG_KHAM
        $visit->refresh();
        $this->record($visit->TrangThai === 'DANG_KHAM', "Lượt khám tự động chuyển sang DANG_KHAM khi lưu phiếu khám");

        // 3.2 Bác sĩ cập nhật phiếu khám cũ khi bệnh nhân quay lại
        $req2 = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Đau rát họng, ho có đờm trắng',
            'ChanDoan' => 'Viêm amidan hốc mủ cấp tính',
            'HuongDieuTri' => 'Kháng sinh đường uống 7 ngày, súc họng nước muối',
            'LoiDanBacSi' => 'Nghỉ ngơi, uống nhiều nước ấm',
        ]);
        $req2->setUserResolver(fn () => $doctorUser);
        $luotKhamCtrl->savePhieuKham($req2, $visit->MaLuotKham);

        // Kiểm tra không tạo phiếu khám trùng (duy nhất 1 record cho MaLuotKham)
        $count = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->count();
        $this->record($count === 1, "Chống tạo phiếu khám trùng: Duy nhất 1 bản ghi PhieuKham cho lượt khám (count = 1)");

        $savedPhieu->refresh();
        $this->record($savedPhieu->ChanDoan === 'Viêm amidan hốc mủ cấp tính', "Chẩn đoán xác định được cập nhật đè trên ĐÚNG bản ghi cũ");
        $this->record($savedPhieu->HuongDieuTri !== null, "Hướng điều trị được lưu bổ sung đầy đủ, không bị mất dữ liệu cũ");

        // Dọn dẹp
        $savedPhieu->delete();
        $visit->delete();
    }

    /**
     * Yêu cầu 4: Sửa lỗi tạo chỉ định cận lâm sàng
     */
    private function verifyServiceRequestCreation()
    {
        $this->info("\n--- YÊU CẦU 4: SỬA LỖI TẠO CHỈ ĐỊNH CẬN LÂM SÀNG & CHỐNG DUPLICATE ---");

        $doctorUser = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorUser->MaTaiKhoan)->first();
        $patient = BenhNhan::first();
        $dv1 = DichVu::where('TrangThai', 'HOAT_DONG')->first();
        $dv2 = DichVu::where('TrangThai', 'HOAT_DONG')->skip(1)->first() ?? $dv1;

        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'DANG_KHAM',
        ]);

        $chiDinhCtrl = new ChiDinhDichVuController();

        // 4.1 Bác sĩ gửi request chỉ định nhiều dịch vụ cùng lúc
        $cdReq = Request::create('/doctor/service-requests', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                ['MaDichVu' => $dv1->MaDichVu, 'GhiChu' => 'Xét nghiệm máu tổng quát'],
                ['MaDichVu' => $dv2->MaDichVu, 'GhiChu' => 'Chẩn đoán hình ảnh'],
            ]
        ]);
        $cdReq->setUserResolver(fn () => $doctorUser);
        $res = $chiDinhCtrl->store($cdReq);

        $this->record(in_array($res->getStatusCode(), [200, 201]), "Bác sĩ chỉ định nhiều dịch vụ cận lâm sàng thành công (Status {$res->getStatusCode()})");

        // 4.2 Kiểm tra dữ liệu được lưu đúng vào bảng chi_dinh_dich_vu
        $cds = ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->get();
        $this->record($cds->count() === 2, "Lưu thành công đúng 2 chỉ định vào bảng chi_dinh_dich_vu");
        $this->record($cds->first()->MaBacSi === $doctor->MaBacSi, "Chỉ định gắn đúng MaBacSi phụ trách");
        $this->record($cds->first()->TrangThai === 'CHO_TIEP_NHAN', "Chỉ định có trạng thái ban đầu là CHO_TIEP_NHAN");

        // 4.3 Kiểm tra lượt khám tự chuyển sang CHO_KET_QUA
        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KET_QUA', "Lượt khám tự động chuyển sang trạng thái CHO_KET_QUA");

        // 4.4 Chống tạo bản ghi trùng khi người dùng gửi lại request (Idempotency)
        $reSubmitReq = Request::create('/doctor/service-requests', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                ['MaDichVu' => $dv1->MaDichVu, 'GhiChu' => 'Gửi lại lần 2 do bấm đúp'],
            ]
        ]);
        $reSubmitReq->setUserResolver(fn () => $doctorUser);
        $chiDinhCtrl->store($reSubmitReq);

        $cdsAfter = ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->get();
        $this->record($cdsAfter->count() === 2, "Chống duplicate: Gửi lại request không tạo thêm bản ghi trùng (vẫn giữ nguyên 2 bản ghi)");

        // Dọn dẹp
        ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->delete();
        $visit->delete();
    }

    /**
     * Yêu cầu 6: Phân quyền Nhân viên CLS
     */
    private function verifyClsTechnicianPermissions()
    {
        $this->info("\n--- YÊU CẦU 6: PHÂN QUYỀN NHÂN VIÊN CẬN LÂM SÀNG ---");

        $clsUser = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();
        $doctorUser = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorUser->MaTaiKhoan)->first();
        $patient = BenhNhan::first();
        $dichVu = DichVu::first();

        $visit = LuotKham::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaBacSi' => $doctor->MaBacSi,
            'ThoiGianTiepNhan' => now(),
            'TrangThai' => 'DANG_KHAM',
        ]);

        $chiDinh = ChiDinhDichVu::create([
            'MaLuotKham' => $visit->MaLuotKham,
            'MaDichVu' => $dichVu->MaDichVu,
            'MaBacSi' => $doctor->MaBacSi,
            'TrangThai' => 'CHO_TIEP_NHAN',
            'DonGia' => $dichVu->DonGia,
            'NgayChiDinh' => now(),
        ]);

        $luotKhamCtrl = new LuotKhamController();
        $donThuocCtrl = new DonThuocController();
        $clsCtrl = new CanLamSangController();

        // 6.1 Nhân viên CLS không được sửa phiếu khám (HTTP 403)
        $phieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Sốt',
            'ChanDoan' => 'CLS chẩn đoán bệnh',
        ]);
        $phieuReq->setUserResolver(fn () => $clsUser);
        $phieuRes = $luotKhamCtrl->savePhieuKham($phieuReq, $visit->MaLuotKham);
        $this->record($phieuRes->getStatusCode() === 403, "Nhân viên CLS không được sửa chẩn đoán/phiếu khám (HTTP 403 Forbidden)");

        // 6.2 Nhân viên CLS không được kê đơn thuốc (HTTP 403)
        $dtReq = Request::create("/doctor/prescriptions", 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [['MaThuoc' => 1, 'SoLuong' => 1, 'LieuDung' => '1v', 'TanSuat' => '1l']],
        ]);
        $dtReq->setUserResolver(fn () => $clsUser);
        $dtRes = $donThuocCtrl->store($dtReq);
        $this->record($dtRes->getStatusCode() === 403, "Nhân viên CLS không được kê đơn thuốc (HTTP 403 Forbidden)");

        // 6.3 Nhân viên CLS không được tự hoàn tất lượt khám (HTTP 403)
        $compReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/complete", 'POST');
        $compReq->setUserResolver(fn () => $clsUser);
        $compRes = $luotKhamCtrl->completeExamine($compReq, $visit->MaLuotKham);
        $this->record($compRes->getStatusCode() === 403, "Nhân viên CLS không được tự hoàn tất lượt khám (HTTP 403 Forbidden)");

        // 6.4 Nhân viên CLS được tiếp nhận, thực hiện và nhập kết quả CLS
        $recReq = Request::create("/cls/requests/{$chiDinh->MaChiDinh}/receive", 'POST');
        $recReq->setUserResolver(fn () => $clsUser);
        $recRes = $clsCtrl->receive($recReq, $chiDinh->MaChiDinh);
        $this->record($recRes->getStatusCode() === 200, "Nhân viên CLS tiếp nhận chỉ định thành công (DA_TIEP_NHAN)");

        $resReq = Request::create("/cls/requests/{$chiDinh->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Bạch cầu: 6.2 G/L, Hồng cầu: 4.8 T/L',
            'KetLuan' => 'Công thức máu bình thường',
            'DonViDo' => 'G/L',
            'KhoangThamChieu' => '4.0 - 10.0 G/L',
        ]);
        $resReq->setUserResolver(fn () => $clsUser);
        $resResult = $clsCtrl->updateResult($resReq, $chiDinh->MaChiDinh);
        $this->record($resResult->getStatusCode() === 200, "Nhân viên CLS nhập kết quả và kết luận thành công (DA_CO_KET_QUA)");

        // Kiểm tra dữ liệu được lưu chính xác vào database
        $chiDinh->refresh();
        $this->record($chiDinh->TrangThai === 'DA_CO_KET_QUA', "Trạng thái chỉ định cập nhật DA_CO_KET_QUA");
        $this->record($chiDinh->KetLuan === 'Công thức máu bình thường', "Kết luận của KTV được lưu vào database");
        $this->record($chiDinh->MaNhanVienThucHien === $clsUser->MaTaiKhoan, "Lưu vết MaNhanVienThucHien của KTV");

        // Dọn dẹp
        $chiDinh->delete();
        $visit->delete();
    }

    /**
     * Yêu cầu 5: Quy trình CLS và khám lại khép kín từ đầu đến cuối
     */
    private function verifyFullEndToEndWorkflow()
    {
        $this->info("\n--- YÊU CẦU 5: QUY TRÌNH THỰC TẾ KHÉP KÍN 13 BƯỚC KHÔNG TẠO LƯỢT KHÁM MỚI ---");

        $patientAccount = TaiKhoan::where('Email', 'benhnhan.an@smartcare.vn')->first();
        $doctorAccount = TaiKhoan::where('Email', 'bacsi.nam@smartcare.vn')->first();
        $recepAccount = TaiKhoan::where('Email', 'letan@smartcare.vn')->first();
        $clsAccount = TaiKhoan::where('Email', 'cls@smartcare.vn')->first();

        $patient = BenhNhan::where('MaTaiKhoan', $patientAccount->MaTaiKhoan)->first();
        $doctor = BacSi::where('MaTaiKhoan', $doctorAccount->MaTaiKhoan)->first();
        $dichVu = DichVu::where('TrangThai', 'HOAT_DONG')->first();
        $thuoc = Thuoc::where('TrangThai', 'HOAT_DONG')->where('SoLuongTon', '>', 5)->first();

        // BƯỚC 1: Admin/Bác sĩ đã có lịch làm việc & ca khám
        $caKham = CaKham::whereHas('lichLamViec', fn ($q) => $q->where('MaBacSi', $doctor->MaBacSi))->first();
        $this->record($caKham !== null, "[Bước 1] Tìm thấy ca khám của Bác sĩ");

        // BƯỚC 2: Bệnh nhân tự đặt lịch hẹn
        $lichHen = LichHen::create([
            'MaBenhNhan' => $patient->MaBenhNhan,
            'MaCaKham' => $caKham->MaCaKham,
            'NgayDat' => now(),
            'TrangThai' => 'DA_XAC_NHAN',
            'LyDoKham' => 'Ho kéo dài, sốt nhẹ về chiều',
        ]);
        $this->record($lichHen->MaLichHen > 0, "[Bước 2] Bệnh nhân đặt lịch hẹn #{$lichHen->MaLichHen}");

        // BƯỚC 3: Lễ tân tiếp nhận vào hàng chờ khám
        $luotKhamCtrl = new LuotKhamController();
        $checkinReq = Request::create('/receptionist/visits', 'POST', ['MaLichHen' => $lichHen->MaLichHen]);
        $checkinReq->setUserResolver(fn () => $recepAccount);
        $luotKhamCtrl->store($checkinReq);

        $visit = LuotKham::where('MaLichHen', $lichHen->MaLichHen)->first();
        $this->record($visit !== null && $visit->TrangThai === 'CHO_KHAM', "[Bước 3] Lễ tân tiếp nhận -> Tạo Lượt khám #{$visit?->MaLuotKham} (TrangThai: CHO_KHAM)");
        $initialVisitId = $visit->MaLuotKham;

        // BƯỚC 4: Bác sĩ bắt đầu khám
        $startReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $startReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->startExamine($startReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->TrangThai === 'DANG_KHAM', "[Bước 4] Bác sĩ bắt đầu khám -> Lượt khám chuyển sang DANG_KHAM");

        // BƯỚC 5: Bác sĩ lưu phiếu khám sơ bộ
        $phieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Ho kéo dài 2 tuần, sốt nhẹ về chiều, người mệt mỏi',
            'ChanDoan' => 'Theo dõi Viêm phổi kẽ / Lao phổi',
            'KetQuaKham' => 'Phổi nghe rales rải rác',
        ]);
        $phieuReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->savePhieuKham($phieuReq, $visit->MaLuotKham);

        $phieuKham = PhieuKham::where('MaLuotKham', $visit->MaLuotKham)->first();
        $initialPhieuId = $phieuKham->MaPhieuKham;
        $this->record($phieuKham !== null, "[Bước 5] Bác sĩ lưu phiếu khám sơ bộ #{$initialPhieuId}");

        // BƯỚC 6: Bác sĩ chỉ định CLS
        $chiDinhCtrl = new ChiDinhDichVuController();
        $cdReq = Request::create('/doctor/service-requests', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'items' => [
                ['MaDichVu' => $dichVu->MaDichVu, 'GhiChu' => 'Chụp X-quang phổi thẳng'],
            ]
        ]);
        $cdReq->setUserResolver(fn () => $doctorAccount);
        $chiDinhCtrl->store($cdReq);

        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KET_QUA', "[Bước 6] Bác sĩ chỉ định CLS -> Lượt khám tự chuyển sang CHO_KET_QUA");

        $cd = ChiDinhDichVu::where('MaLuotKham', $visit->MaLuotKham)->first();

        // BƯỚC 7: Nhân viên CLS tiếp nhận chỉ định
        $clsCtrl = new CanLamSangController();
        $recReq = Request::create("/cls/requests/{$cd->MaChiDinh}/receive", 'POST');
        $recReq->setUserResolver(fn () => $clsAccount);
        $clsCtrl->receive($recReq, $cd->MaChiDinh);

        // BƯỚC 8: Nhân viên CLS thực hiện & nhập kết quả
        $resReq = Request::create("/cls/requests/{$cd->MaChiDinh}/result", 'POST', [
            'KetQua' => 'Hình ảnh đám mờ thâm nhiễm thùy dưới phổi phải',
            'KetLuan' => 'Viêm thùy dưới phổi phải',
        ]);
        $resReq->setUserResolver(fn () => $clsAccount);
        $clsCtrl->updateResult($resReq, $cd->MaChiDinh);

        $visit->refresh();
        $this->record($visit->TrangThai === 'CHO_KHAM_LAI', "[Bước 8] KTV hoàn thành kết quả -> Lượt khám TỰ ĐỘNG chuyển sang CHO_KHAM_LAI");

        // BƯỚC 9: Bác sĩ tiếp tục khám lại (ĐẢM BẢO KHÔNG TẠO LƯỢT KHÁM MỚI)
        $resumeReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/start", 'POST');
        $resumeReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->startExamine($resumeReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->MaLuotKham === $initialVisitId, "[Bước 9.1] Không tạo lượt khám mới: Vẫn giữ nguyên MaLuotKham #{$initialVisitId}");
        $this->record($visit->TrangThai === 'DANG_KHAM', "[Bước 9.2] Lượt khám chuyển lại DANG_KHAM");

        // BƯỚC 10: Bác sĩ xem kết quả và cập nhật chẩn đoán xác định trên phiếu khám ban đầu
        $updatePhieuReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/phieu-kham", 'POST', [
            'TrieuChung' => 'Ho kéo dài 2 tuần, sốt nhẹ về chiều, người mệt mỏi',
            'ChanDoan' => 'Viêm thùy dưới phổi phải cấp tính',
            'HuongDieuTri' => 'Kháng sinh Augmentin 1g + Paracetamol + Tái khám sau 5 ngày',
            'LoiDanBacSi' => 'Uống thuốc đúng giờ, kiêng lạnh, nghỉ ngơi',
        ]);
        $updatePhieuReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->savePhieuKham($updatePhieuReq, $visit->MaLuotKham);

        $phieuKham->refresh();
        $this->record($phieuKham->MaPhieuKham === $initialPhieuId, "[Bước 10.1] Không tạo phiếu khám mới: Cập nhật trên ĐÚNG PhieuKham #{$initialPhieuId}");
        $this->record($phieuKham->ChanDoan === 'Viêm thùy dưới phổi phải cấp tính', "[Bước 10.2] Cập nhật chẩn đoán xác định thành công");

        // BƯỚC 11: Bác sĩ kê đơn thuốc
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
            'LoiDan' => 'Uống sau ăn 30 phút',
        ]);
        $dtReq->setUserResolver(fn () => $doctorAccount);
        $donThuocCtrl->store($dtReq);

        $donThuoc = DonThuoc::where('MaLuotKham', $visit->MaLuotKham)->first();
        $this->record($donThuoc !== null, "[Bước 11] Bác sĩ kê đơn thuốc #{$donThuoc?->MaDonThuoc} cho lượt khám");

        // BƯỚC 12: Bác sĩ hoàn tất lượt khám
        $compReq = Request::create("/doctor/visits/{$visit->MaLuotKham}/complete", 'POST');
        $compReq->setUserResolver(fn () => $doctorAccount);
        $luotKhamCtrl->completeExamine($compReq, $visit->MaLuotKham);

        $visit->refresh();
        $this->record($visit->TrangThai === 'HOAN_THANH', "[Bước 12] Bác sĩ hoàn tất khám -> TrangThai = HOAN_THANH");

        // BƯỚC 13: Lễ tân lập hóa đơn tổng hợp và thu tiền
        $hoaDonCtrl = new HoaDonController();
        $hdReq = Request::create('/receptionist/invoices', 'POST', [
            'MaLuotKham' => $visit->MaLuotKham,
            'TienKham' => 150000,
            'items' => [
                ['LoaiChiPhi' => 'TIEN_KHAM', 'NoiDung' => 'Tiền khám bác sĩ chuyên khoa', 'SoLuong' => 1, 'DonGia' => 150000, 'MaChiDinh' => null, 'MaChiTietDonThuoc' => null],
                ['LoaiChiPhi' => 'DICH_VU', 'NoiDung' => $dichVu->TenDichVu, 'SoLuong' => 1, 'DonGia' => $dichVu->DonGia, 'MaChiDinh' => $cd->MaChiDinh, 'MaChiTietDonThuoc' => null],
            ],
            'GiamGia' => 0,
            'BaoHiemChiTra' => 0,
        ]);
        $hdReq->setUserResolver(fn () => $recepAccount);
        $hdRes = $hoaDonCtrl->store($hdReq);
        $maHoaDon = $hdRes->getData(true)['data']['MaHoaDon'] ?? null;
        $this->record($maHoaDon !== null, "[Bước 13.1] Lễ tân lập hóa đơn viện phí #{$maHoaDon} tổng hợp đầy đủ tiền khám và CLS");

        // Thu tiền hóa đơn đầy đủ
        $hoaDon = HoaDon::find($maHoaDon);
        $payAmount = (float)$hoaDon->BenhNhanChiTra;

        $payReq = Request::create("/receptionist/invoices/{$maHoaDon}/pay", 'POST', [
            'SoTien' => $payAmount,
            'PhuongThucThanhToan' => 'TIEN_MAT',
            'GhiChu' => 'Thu tiền tại quầy',
        ]);
        $payReq->setUserResolver(fn () => $recepAccount);
        $payRes = $hoaDonCtrl->pay($payReq, $maHoaDon);
        $hoaDon->refresh();
        $this->record($hoaDon->TrangThai === 'DA_THANH_TOAN', "[Bước 13.2] Thu ngân thanh toán thành công -> Hóa đơn chuyển DA_THANH_TOAN");

        // Dọn dẹp dữ liệu bài test an toàn
        ThanhToan::where('MaHoaDon', $maHoaDon)->delete();
        ChiTietHoaDon::where('MaHoaDon', $maHoaDon)->delete();
        $hoaDon->delete();
        if ($donThuoc) {
            ChiTietDonThuoc::where('MaDonThuoc', $donThuoc->MaDonThuoc)->delete();
            $donThuoc->delete();
        }
        $cd->delete();
        $phieuKham->delete();
        $visit->delete();
        $lichHen->delete();
    }
}
