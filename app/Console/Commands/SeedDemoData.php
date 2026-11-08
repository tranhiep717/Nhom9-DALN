<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\ChuyenKhoa;
use App\Models\CaKham;
use App\Models\LichHen;
use App\Models\LichLamViec;
use App\Models\Thuoc;
use App\Models\DichVu;
use App\Models\LuotKham;
use App\Models\PhieuKham;
use App\Models\ChiDinhDichVu;
use App\Models\DonThuoc;
use App\Models\ChiTietDonThuoc;
use App\Models\HoaDon;
use App\Models\ChiTietHoaDon;
use App\Models\ThanhToan;
use App\Models\ChamCong;
use App\Models\BangLuong;
use App\Models\DonTuNhanSu;
use App\Models\NhanVien;

class SeedDemoData extends Command
{
    protected $signature = 'smartcare:seed-demo {--force : Cho phép chạy trên môi trường production}';
    protected $description = 'Chuẩn hóa toàn diện dữ liệu Demo SmartCare: Làm sạch rác, BHYT chuẩn quy tắc, 30 ngày lịch sử thực tế';

    public function handle()
    {
        if (app()->environment('production') && !$this->option('force')) {
            $this->error("LƯU Ý AN TOÀN: Sử dụng cờ --force nếu bạn muốn tiếp tục.");
            return 1;
        }

        $this->info("================================================================================");
        $this->info("   CHUẨN HÓA DỮ LIỆU SMARTCARE: LÀM SẠCH RÁC, BHYT & DỮ LIỆU LỊCH SỬ 30 NGÀY");
        $this->info("================================================================================");

        $demoPassword = env('DEMO_PASSWORD', 'SmartCare@2026');
        $hashedPass = Hash::make($demoPassword);

        DB::beginTransaction();
        try {
            // -------------------------------------------------------------------------
            // BƯỚC 1: DỌN DẸP DỮ LIỆU RÁC (TÀI KHOẢN TẠP, TEST, E2E, BS TEST, BN TEST)
            // -------------------------------------------------------------------------
            $this->info("1. Đang thanh lọc triệt để dữ liệu rác (BS test, BN test, tài khoản mồ côi)...");

            // Xóa tài khoản mồ côi #510 (cls_nhom9) và các đơn từ mồ côi liên quan
            DonTuNhanSu::where('MaTaiKhoan', 510)->orWhere('TaiKhoanDoiCung', 510)->delete();
            ChamCong::where('MaTaiKhoan', 510)->delete();
            BangLuong::where('MaTaiKhoan', 510)->delete();
            TaiKhoan::where('TenDangNhap', 'cls_nhom9')->orWhere('MaTaiKhoan', 510)->delete();

            // Xóa các tài khoản tạp test/e2e
            $junkAccounts = TaiKhoan::where(function ($q) {
                $q->where('TenDangNhap', 'LIKE', 'p154_%')
                  ->orWhere('TenDangNhap', 'LIKE', 'p155_%')
                  ->orWhere('TenDangNhap', 'LIKE', 'test_%')
                  ->orWhere('TenDangNhap', 'LIKE', 'e2e_%')
                  ->orWhere('TenDangNhap', 'LIKE', 'portal_%')
                  ->orWhere('Email', 'LIKE', '%@example.com')
                  ->orWhere('Email', 'LIKE', '%@test.com')
                  ->orWhere('Email', 'LIKE', '%@smartcare.test');
            })->pluck('MaTaiKhoan');

            if ($junkAccounts->isNotEmpty()) {
                ChamCong::whereIn('MaTaiKhoan', $junkAccounts)->delete();
                BangLuong::whereIn('MaTaiKhoan', $junkAccounts)->delete();
                DonTuNhanSu::whereIn('MaTaiKhoan', $junkAccounts)->orWhereIn('TaiKhoanDoiCung', $junkAccounts)->delete();
                TaiKhoan::whereIn('MaTaiKhoan', $junkAccounts)->delete();
            }

            // Dọn các đơn từ mồ côi (tài khoản không còn tồn tại)
            $existingUserIds = TaiKhoan::pluck('MaTaiKhoan');
            DonTuNhanSu::whereNotIn('MaTaiKhoan', $existingUserIds)->delete();
            DonTuNhanSu::whereNotNull('TaiKhoanDoiCung')->whereNotIn('TaiKhoanDoiCung', $existingUserIds)->delete();

            // Helper xóa cascade lượt khám an toàn tuyệt đối
            $deleteVisitsCascade = function($visitIds) {
                if (empty($visitIds) || (is_object($visitIds) && $visitIds->isEmpty())) return;
                $hdIds = HoaDon::whereIn('MaLuotKham', $visitIds)->pluck('MaHoaDon');
                if ($hdIds->isNotEmpty()) {
                    ThanhToan::whereIn('MaHoaDon', $hdIds)->delete();
                    HoaDon::whereIn('MaHoaDon', $hdIds)->update([
                        'BaoHiemChiTra' => 0,
                        'GiamGia' => 0,
                        'TongTien' => 0,
                        'BenhNhanChiTra' => 0,
                    ]);
                    ChiTietHoaDon::whereIn('MaHoaDon', $hdIds)->delete();
                    HoaDon::whereIn('MaHoaDon', $hdIds)->delete();
                }
                DB::table('hang_doi_lich_su')->whereIn('MaLuotKham', $visitIds)->delete();
                $dtIds = DonThuoc::whereIn('MaLuotKham', $visitIds)->pluck('MaDonThuoc');
                if ($dtIds->isNotEmpty()) {
                    ChiTietDonThuoc::whereIn('MaDonThuoc', $dtIds)->delete();
                    DonThuoc::whereIn('MaDonThuoc', $dtIds)->delete();
                }
                ChiDinhDichVu::whereIn('MaLuotKham', $visitIds)->delete();
                PhieuKham::whereIn('MaLuotKham', $visitIds)->delete();
                LuotKham::whereIn('MaLuotKham', $visitIds)->update(['MaLichHen' => null, 'MaCaKham' => null]);
                LuotKham::whereIn('MaLuotKham', $visitIds)->delete();
            };

            // Whitelist 4 Bác sĩ chuyên khoa chuẩn
            $allowedDoctorAccounts = ['bacsi_nam', 'bacsi_huong', 'bacsi_tuan', 'bacsi_lan'];
            $allowedDocAccountIds = TaiKhoan::whereIn('TenDangNhap', $allowedDoctorAccounts)->pluck('MaTaiKhoan');
            $allowedDoctorIds = BacSi::whereIn('MaTaiKhoan', $allowedDocAccountIds)->pluck('MaBacSi');

            // Danh sách Bác sĩ rác cần xóa (bất kỳ ai không thuộc 4 BS chuẩn hoặc chứa từ khóa test)
            $junkDoctors = BacSi::whereNotIn('MaBacSi', $allowedDoctorIds)
                ->orWhere('HoTen', 'LIKE', '%Test%')
                ->orWhere('HoTen', 'LIKE', '%P15%')
                ->pluck('MaBacSi');
            if ($junkDoctors->isNotEmpty()) {
                $junkDoctorVisits = LuotKham::whereIn('MaBacSi', $junkDoctors)->pluck('MaLuotKham');
                $deleteVisitsCascade($junkDoctorVisits);

                $junkLichIds = LichLamViec::whereIn('MaBacSi', $junkDoctors)->pluck('MaLichLamViec');
                if ($junkLichIds->isNotEmpty()) {
                    $junkCaKhamIds = CaKham::whereIn('MaLichLamViec', $junkLichIds)->pluck('MaCaKham');
                    if ($junkCaKhamIds->isNotEmpty()) {
                        LuotKham::whereIn('MaCaKham', $junkCaKhamIds)->update(['MaCaKham' => null]);
                        DB::table('hang_doi_counter')->whereIn('MaCaKham', $junkCaKhamIds)->delete();
                        LichHen::whereIn('MaCaKham', $junkCaKhamIds)->delete();
                        CaKham::whereIn('MaCaKham', $junkCaKhamIds)->delete();
                    }
                    LichLamViec::whereIn('MaLichLamViec', $junkLichIds)->delete();
                }

                $orphanDt = DonThuoc::whereIn('MaBacSi', $junkDoctors)->pluck('MaDonThuoc');
                if ($orphanDt->isNotEmpty()) {
                    ChiTietDonThuoc::whereIn('MaDonThuoc', $orphanDt)->delete();
                    DonThuoc::whereIn('MaDonThuoc', $orphanDt)->delete();
                }
                ChiDinhDichVu::whereIn('MaBacSi', $junkDoctors)->delete();

                ChamCong::whereIn('MaBacSi', $junkDoctors)->delete();
                BangLuong::whereIn('MaBacSi', $junkDoctors)->delete();
                BacSi::whereIn('MaBacSi', $junkDoctors)->delete();
                $this->info("   -> Đã xóa triệt để " . count($junkDoctors) . " bác sĩ test (P15.5, P15.4,...) và lịch làm việc của họ.");
            }

            // Whitelist 17 Bệnh nhân chuẩn (4 demo + 12 lịch sử + sinh viên)
            $officialPatientPhones = [
                '0901234567', '0902345678', '0903456789', '0904567890',
                '0905111222', '0905222333', '0905333444', '0905444555',
                '0905555666', '0905666777', '0905777888', '0905888999',
                '0905999000', '0906111333', '0906222444', '0906333555',
            ];
            $allowedPatientIds = BenhNhan::whereIn('SoDienThoai', $officialPatientPhones)
                ->orWhere('EmailLienHe', 'LIKE', '%phenikaa%')
                ->orWhere('HoTen', 'LIKE', '%Ngô Thị Thùy Trang%')
                ->pluck('MaBenhNhan');

            // Xóa triệt để các lượt khám rác (không thuộc bệnh nhân chuẩn hoặc thiếu thông tin)
            $orphanVisits = LuotKham::whereNotIn('MaBenhNhan', $allowedPatientIds)
                ->orWhereNull('MaBenhNhan')
                ->pluck('MaLuotKham');
            if ($orphanVisits->isNotEmpty()) {
                $deleteVisitsCascade($orphanVisits);
                $this->info("   -> Đã xóa triệt để " . count($orphanVisits) . " lượt khám test/mồ côi còn sót lại.");
            }

            // Xóa bệnh nhân rác (bất kỳ ai không thuộc danh sách chuẩn)
            $junkPatients = BenhNhan::whereNotIn('MaBenhNhan', $allowedPatientIds)->pluck('MaBenhNhan');
            if ($junkPatients->isNotEmpty()) {
                $junkPatientVisits = LuotKham::whereIn('MaBenhNhan', $junkPatients)->pluck('MaLuotKham');
                $deleteVisitsCascade($junkPatientVisits);
                DB::table('hoi_thoai_ai')->whereIn('MaBenhNhan', $junkPatients)->delete();
                LichHen::whereIn('MaBenhNhan', $junkPatients)->delete();
                BenhNhan::whereIn('MaBenhNhan', $junkPatients)->delete();
                $this->info("   -> Đã xóa triệt để " . count($junkPatients) . " bệnh nhân test mồ côi (BN Chờ Khám, Test CLS,...).");
            }

            // Xóa các lượt khám cũ của bệnh nhân demo để seeder có tính idempotent (chạy lại an toàn)
            if ($allowedPatientIds->isNotEmpty()) {
                $oldDemoVisits = LuotKham::whereIn('MaBenhNhan', $allowedPatientIds)->pluck('MaLuotKham');
                $deleteVisitsCascade($oldDemoVisits);
                LichHen::whereIn('MaBenhNhan', $allowedPatientIds)->delete();
            }

            // Dọn sạch queue và lịch cũ để khởi tạo đồng bộ
            DB::table('hang_doi_counter')->delete();
            DB::table('hang_doi_lich_su')->delete();
            LuotKham::whereNotNull('MaLichHen')->update(['MaLichHen' => null]);
            LichHen::query()->delete();
            LuotKham::whereNotNull('MaCaKham')->update(['MaCaKham' => null]);
            CaKham::query()->delete();
            LichLamViec::query()->delete();

            // Xóa thuốc test
            $junkThuocIds = Thuoc::where('TenThuoc', 'LIKE', '%Test%')
                ->orWhere('TenThuoc', 'LIKE', '%E2E%')
                ->orWhere('TenThuoc', 'Thuoc mau A')
                ->pluck('MaThuoc');
            if ($junkThuocIds->isNotEmpty()) {
                ChiTietDonThuoc::whereIn('MaThuoc', $junkThuocIds)->delete();
                Thuoc::whereIn('MaThuoc', $junkThuocIds)->delete();
            }

            // -------------------------------------------------------------------------
            // BƯỚC 2: KHỞI TẠO VAI TRÒ & CHUYÊN KHOA
            // -------------------------------------------------------------------------
            $this->info("2. Chuẩn hóa Vai trò & Chuyên khoa...");
            $vtAdmin = VaiTro::firstOrCreate(['TenVaiTro' => 'QUAN_TRI_VIEN'], ['MoTa' => 'Quản trị viên hệ thống']);
            $vtDoc   = VaiTro::firstOrCreate(['TenVaiTro' => 'BAC_SI'], ['MoTa' => 'Bác sĩ khám và điều trị']);
            $vtRecep = VaiTro::firstOrCreate(['TenVaiTro' => 'LE_TAN'], ['MoTa' => 'Lễ tân tiếp nhận và điều phối']);
            $vtPat   = VaiTro::firstOrCreate(['TenVaiTro' => 'BENH_NHAN'], ['MoTa' => 'Bệnh nhân sử dụng dịch vụ']);
            $vtCls   = VaiTro::firstOrCreate(['TenVaiTro' => 'NHAN_VIEN_CAN_LAM_SANG'], ['MoTa' => 'Kỹ thuật viên xét nghiệm và chẩn đoán hình ảnh']);

            $ckNoi = ChuyenKhoa::updateOrCreate(['TenChuyenKhoa' => 'Nội Tổng Quát'], ['MoTa' => 'Khám chữa bệnh nội khoa người lớn', 'TrangThai' => 'HOAT_DONG']);
            $ckTMH = ChuyenKhoa::updateOrCreate(['TenChuyenKhoa' => 'Tai Mũi Họng'], ['MoTa' => 'Khám và nội soi tai mũi họng kỹ thuật số', 'TrangThai' => 'HOAT_DONG']);
            $ckRHM = ChuyenKhoa::updateOrCreate(['TenChuyenKhoa' => 'Răng Hàm Mặt'], ['MoTa' => 'Khám nha khoa tổng quát, nhổ răng, phục hình', 'TrangThai' => 'HOAT_DONG']);
            $ckNhi = ChuyenKhoa::updateOrCreate(['TenChuyenKhoa' => 'Nhi Khoa'], ['MoTa' => 'Khám và điều trị bệnh nhi dưới 16 tuổi', 'TrangThai' => 'HOAT_DONG']);

            // -------------------------------------------------------------------------
            // BƯỚC 3: DANH MỤC THUỐC & DỊCH VỤ CÓ PHÂN ĐỊNH BHYT
            // -------------------------------------------------------------------------
            $this->info("3. Cập nhật Danh mục Thuốc & Dịch vụ chuẩn hóa BHYT...");

            $medData = [
                ['TenThuoc' => 'Paracetamol 500mg', 'HoatChat' => 'Paracetamol', 'DonViTinh' => 'Viên', 'DonGia' => 1200, 'ApDungBHYT' => 1, 'SoLuongTon' => 5000],
                ['TenThuoc' => 'Amoxicillin 500mg', 'HoatChat' => 'Amoxicillin', 'DonViTinh' => 'Viên', 'DonGia' => 2500, 'ApDungBHYT' => 1, 'SoLuongTon' => 3000],
                ['TenThuoc' => 'Cefuroxime 500mg', 'HoatChat' => 'Cefuroxime axetil', 'DonViTinh' => 'Viên', 'DonGia' => 8500, 'ApDungBHYT' => 1, 'SoLuongTon' => 2000],
                ['TenThuoc' => 'Loratadine 10mg', 'HoatChat' => 'Loratadine', 'DonViTinh' => 'Viên', 'DonGia' => 1800, 'ApDungBHYT' => 1, 'SoLuongTon' => 1500],
                ['TenThuoc' => 'Omeprazole 20mg', 'HoatChat' => 'Omeprazole', 'DonViTinh' => 'Viên', 'DonGia' => 3200, 'ApDungBHYT' => 1, 'SoLuongTon' => 2500],
                ['TenThuoc' => 'Amlodipine 5mg', 'HoatChat' => 'Amlodipine', 'DonViTinh' => 'Viên', 'DonGia' => 2800, 'ApDungBHYT' => 1, 'SoLuongTon' => 2000],
                ['TenThuoc' => 'Metformin 850mg', 'HoatChat' => 'Metformin HCl', 'DonViTinh' => 'Viên', 'DonGia' => 2200, 'ApDungBHYT' => 1, 'SoLuongTon' => 2500],
                ['TenThuoc' => 'Vitamin C 500mg', 'HoatChat' => 'Acid ascorbic', 'DonViTinh' => 'Viên', 'DonGia' => 1500, 'ApDungBHYT' => 0, 'SoLuongTon' => 1000],
                ['TenThuoc' => 'Hoạt huyết dưỡng não Ginkgo', 'HoatChat' => 'Ginkgo Biloba 120mg', 'DonViTinh' => 'Viên', 'DonGia' => 12000, 'ApDungBHYT' => 0, 'SoLuongTon' => 800],
                ['TenThuoc' => 'Men vi sinh Enterogermina', 'HoatChat' => 'Bacillus clausii', 'DonViTinh' => 'Ống', 'DonGia' => 15000, 'ApDungBHYT' => 0, 'SoLuongTon' => 600],
            ];
            foreach ($medData as $m) {
                Thuoc::updateOrCreate(
                    ['TenThuoc' => $m['TenThuoc']],
                    [
                        'HoatChat' => $m['HoatChat'],
                        'DonViTinh' => $m['DonViTinh'],
                        'DonGia' => $m['DonGia'],
                        'ApDungBHYT' => $m['ApDungBHYT'],
                        'SoLuongTon' => $m['SoLuongTon'],
                        'HuongDanSuDung' => 'Điều trị theo chỉ định của bác sĩ',
                        'ChongChiDinh' => 'Mẫn cảm với thành phần của thuốc',
                        'TrangThai' => 'HOAT_DONG',
                    ]
                );
            }

            $srvData = [
                ['TenDichVu' => 'Khám bệnh Nội tổng quát', 'DonGia' => 80000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['TenDichVu' => 'Khám chuyên khoa Tai Mũi Họng', 'DonGia' => 100000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckTMH->MaChuyenKhoa],
                ['TenDichVu' => 'Khám chuyên khoa Răng Hàm Mặt', 'DonGia' => 100000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckRHM->MaChuyenKhoa],
                ['TenDichVu' => 'Khám Nhi khoa tổng quát', 'DonGia' => 90000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNhi->MaChuyenKhoa],
                ['TenDichVu' => 'Nội soi Tai Mũi Họng ống mềm', 'DonGia' => 180000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckTMH->MaChuyenKhoa],
                ['TenDichVu' => 'Chụp X-Quang ngực thẳng kỹ thuật số', 'DonGia' => 120000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['TenDichVu' => 'Xét nghiệm Công thức máu toàn phần (24 thông số)', 'DonGia' => 95000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['TenDichVu' => 'Siêu âm ổ bụng tổng quát màu Doppler', 'DonGia' => 190000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['TenDichVu' => 'Đo điện tim ECG kỹ thuật số 12 cần', 'DonGia' => 75000, 'ApDungBHYT' => 1, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['TenDichVu' => 'Tẩy trắng răng thẩm mỹ Laser Whitening', 'DonGia' => 850000, 'ApDungBHYT' => 0, 'ChuyenKhoa' => $ckRHM->MaChuyenKhoa],
                ['TenDichVu' => 'Gói tầm soát ung thư sớm toàn diện VIP', 'DonGia' => 1600000, 'ApDungBHYT' => 0, 'ChuyenKhoa' => $ckNoi->MaChuyenKhoa],
            ];
            foreach ($srvData as $s) {
                DichVu::updateOrCreate(
                    ['TenDichVu' => $s['TenDichVu']],
                    [
                        'DonGia' => $s['DonGia'],
                        'ApDungBHYT' => $s['ApDungBHYT'],
                        'MoTa' => 'Dịch vụ chẩn đoán và điều trị kỹ thuật cao',
                        'TrangThai' => 'HOAT_DONG',
                    ]
                );
            }

            // -------------------------------------------------------------------------
            // BƯỚC 4: TÀI KHOẢN VÀ HỒ SƠ CỐT LÕI (ADMIN, BÁC SĨ, LỄ TÂN, CLS, BỆNH NHÂN)
            // -------------------------------------------------------------------------
            $this->info("4. Khởi tạo tài khoản nhân sự và bệnh nhân chuẩn demo...");

            // Admin
            $tkAdmin = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'admin_demo'],
                ['Email' => 'admin@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtAdmin->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );

            // Bác sĩ 1 (Nội)
            $tkDocNam = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'bacsi_nam'],
                ['Email' => 'bacsi.nam@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtDoc->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bsNam = BacSi::updateOrCreate(
                ['MaTaiKhoan' => $tkDocNam->MaTaiKhoan],
                [
                    'HoTen' => 'BS. CK1 Trần Văn Nam',
                    'MaChuyenKhoa' => $ckNoi->MaChuyenKhoa,
                    'SoDienThoai' => '0912345678',
                    'EmailLienHe' => 'bacsi.nam@smartcare.vn',
                    'HocVi' => 'Bác sĩ Chuyên khoa 1',
                    'KinhNghiem' => 12,
                    'MoTa' => '12 năm kinh nghiệm chẩn đoán Nội tổng quát & Tim mạch',
                    'TrangThai' => 'HOAT_DONG',
                ]
            );

            // Bác sĩ 2 (TMH)
            $tkDocHuong = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'bacsi_huong'],
                ['Email' => 'bacsi.huong@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtDoc->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bsHuong = BacSi::updateOrCreate(
                ['MaTaiKhoan' => $tkDocHuong->MaTaiKhoan],
                [
                    'HoTen' => 'ThS. BS Nguyễn Thu Hương',
                    'MaChuyenKhoa' => $ckTMH->MaChuyenKhoa,
                    'SoDienThoai' => '0923456789',
                    'EmailLienHe' => 'bacsi.huong@smartcare.vn',
                    'HocVi' => 'Thạc sĩ Y khoa',
                    'KinhNghiem' => 8,
                    'MoTa' => '8 năm kinh nghiệm nội soi Tai Mũi Họng công nghệ cao',
                    'TrangThai' => 'HOAT_DONG',
                ]
            );

            // Bác sĩ 3 (RHM)
            $tkDocTuan = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'bacsi_tuan'],
                ['Email' => 'bacsi.tuan@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtDoc->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bsTuan = BacSi::updateOrCreate(
                ['MaTaiKhoan' => $tkDocTuan->MaTaiKhoan],
                [
                    'HoTen' => 'BS. CK2 Lê Anh Tuấn',
                    'MaChuyenKhoa' => $ckRHM->MaChuyenKhoa,
                    'SoDienThoai' => '0934567890',
                    'EmailLienHe' => 'bacsi.tuan@smartcare.vn',
                    'HocVi' => 'Bác sĩ Chuyên khoa 2',
                    'KinhNghiem' => 15,
                    'MoTa' => '15 năm kinh nghiệm Nha khoa phục hình & phẫu thuật RHM',
                    'TrangThai' => 'HOAT_DONG',
                ]
            );

            // Bác sĩ 4 (Nhi)
            $tkDocLan = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'bacsi_lan'],
                ['Email' => 'bacsi.lan@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtDoc->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bsLan = BacSi::updateOrCreate(
                ['MaTaiKhoan' => $tkDocLan->MaTaiKhoan],
                [
                    'HoTen' => 'BS. Hoàng Mai Lan',
                    'MaChuyenKhoa' => $ckNhi->MaChuyenKhoa,
                    'SoDienThoai' => '0945678901',
                    'EmailLienHe' => 'bacsi.lan@smartcare.vn',
                    'HocVi' => 'Bác sĩ Đa khoa',
                    'KinhNghiem' => 7,
                    'MoTa' => '7 năm kinh nghiệm Nhi khoa và Tư vấn tiêm chủng',
                    'TrangThai' => 'HOAT_DONG',
                ]
            );

            // Lễ tân 1 (Chính)
            $tkRecepMai = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'letan_demo'],
                ['Email' => 'letan@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtRecep->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $nvMai = NhanVien::updateOrCreate(
                ['MaTaiKhoan' => $tkRecepMai->MaTaiKhoan],
                [
                    'HoTen' => 'Lê Thị Mai (Lễ tân 1)',
                    'LoaiNhanVien' => 'LE_TAN',
                    'SoDienThoai' => '0918112233',
                    'EmailLienHe' => 'letan@smartcare.vn',
                    'GioiTinh' => 'NU',
                    'NgayVaoLam' => '2025-05-15',
                    'TrangThai' => 'DANG_LAM_VIEC',
                ]
            );

            // Lễ tân 2 (Phối hợp đổi ca)
            $tkRecepHoa = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'letan_hoa'],
                ['Email' => 'letan.hoa@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtRecep->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $nvHoa = NhanVien::updateOrCreate(
                ['MaTaiKhoan' => $tkRecepHoa->MaTaiKhoan],
                [
                    'HoTen' => 'Lê Thị Hoa',
                    'LoaiNhanVien' => 'LE_TAN',
                    'SoDienThoai' => '0928223344',
                    'EmailLienHe' => 'letan.hoa@smartcare.vn',
                    'GioiTinh' => 'NU',
                    'NgayVaoLam' => '2025-08-20',
                    'TrangThai' => 'DANG_LAM_VIEC',
                ]
            );

            // Cận lâm sàng (Kỹ thuật viên)
            $tkClsDuc = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'cls_duc'],
                ['Email' => 'cls.duc@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtCls->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $nvDuc = NhanVien::updateOrCreate(
                ['MaTaiKhoan' => $tkClsDuc->MaTaiKhoan],
                [
                    'HoTen' => 'Nguyễn Văn Đức (KTV Xét nghiệm)',
                    'LoaiNhanVien' => 'CAN_LAM_SANG',
                    'SoDienThoai' => '0938334455',
                    'EmailLienHe' => 'cls.duc@smartcare.vn',
                    'GioiTinh' => 'NAM',
                    'NgayVaoLam' => '2024-11-10',
                    'TrangThai' => 'DANG_LAM_VIEC',
                ]
            );

            // 4 Bệnh nhân demo trực tiếp (có tài khoản để đăng nhập kiểm tra)
            $tkBnAn = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'benhnhan_an'],
                ['Email' => 'an.nguyen@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtPat->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bnAn = BenhNhan::updateOrCreate(
                ['MaTaiKhoan' => $tkBnAn->MaTaiKhoan],
                [
                    'SoDienThoai' => '0901234567',
                    'HoTen' => 'Nguyễn Văn An',
                    'NgaySinh' => '1988-04-12',
                    'GioiTinh' => 'Nam',
                    'DiaChi' => '142 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
                    'SoTheBHYT' => 'DN4010123456789',
                    'MucHuongBHYT' => 80,
                ]
            );

            $tkBnBinh = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'benhnhan_binh'],
                ['Email' => 'binh.le@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtPat->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bnBinh = BenhNhan::updateOrCreate(
                ['MaTaiKhoan' => $tkBnBinh->MaTaiKhoan],
                [
                    'SoDienThoai' => '0902345678',
                    'HoTen' => 'Lê Thị Bình',
                    'NgaySinh' => '1995-09-20',
                    'GioiTinh' => 'Nữ',
                    'DiaChi' => '78 Lê Văn Sỹ, Q.Phú Nhuận, TP.HCM',
                    'SoTheBHYT' => 'GD4010987654321',
                    'MucHuongBHYT' => 80,
                ]
            );

            $tkBnCuong = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'benhnhan_cuong'],
                ['Email' => 'cuong.tran@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtPat->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bnCuong = BenhNhan::updateOrCreate(
                ['MaTaiKhoan' => $tkBnCuong->MaTaiKhoan],
                [
                    'SoDienThoai' => '0903456789',
                    'HoTen' => 'Trần Quốc Cường',
                    'NgaySinh' => '1960-03-15',
                    'GioiTinh' => 'Nam',
                    'DiaChi' => '25 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
                    'SoTheBHYT' => 'HT2010112233445',
                    'MucHuongBHYT' => 95,
                ]
            );

            $tkBnDung = TaiKhoan::updateOrCreate(
                ['TenDangNhap' => 'benhnhan_dung'],
                ['Email' => 'dung.vu@smartcare.vn', 'MatKhau' => $hashedPass, 'MaVaiTro' => $vtPat->MaVaiTro, 'TrangThai' => 'HOAT_DONG']
            );
            $bnDung = BenhNhan::updateOrCreate(
                ['MaTaiKhoan' => $tkBnDung->MaTaiKhoan],
                [
                    'SoDienThoai' => '0904567890',
                    'HoTen' => 'Vũ Hoàng Dũng',
                    'NgaySinh' => '2002-11-08',
                    'GioiTinh' => 'Nam',
                    'DiaChi' => '369 Cách Mạng Tháng 8, Q.10, TP.HCM',
                    'SoTheBHYT' => null,
                    'MucHuongBHYT' => 0,
                ]
            );

            // 12 Bệnh nhân lịch sử thực tế
            $historicalPatients = [
                ['HoTen' => 'Phạm Thị Lan', 'GioiTinh' => 'Nữ', 'NgaySinh' => '1982-05-14', 'SoDienThoai' => '0905111222', 'BHYT' => 'DN4010111222333', 'Muc' => 80],
                ['HoTen' => 'Hoàng Minh Tuấn', 'GioiTinh' => 'Nam', 'NgaySinh' => '1975-08-22', 'SoDienThoai' => '0905222333', 'BHYT' => 'DN4010222333444', 'Muc' => 80],
                ['HoTen' => 'Đỗ Thị Thu', 'GioiTinh' => 'Nữ', 'NgaySinh' => '1990-12-01', 'SoDienThoai' => '0905333444', 'BHYT' => 'GD4010333444555', 'Muc' => 80],
                ['HoTen' => 'Bùi Quang Hải', 'GioiTinh' => 'Nam', 'NgaySinh' => '1986-03-30', 'SoDienThoai' => '0905444555', 'BHYT' => 'DN4010444555666', 'Muc' => 80],
                ['HoTen' => 'Ngô Bảo Ngọc', 'GioiTinh' => 'Nữ', 'NgaySinh' => '2016-06-18', 'SoDienThoai' => '0905555666', 'BHYT' => 'TE1010555666777', 'Muc' => 100],
                ['HoTen' => 'Võ Đình Trọng', 'GioiTinh' => 'Nam', 'NgaySinh' => '1954-01-10', 'SoDienThoai' => '0905666777', 'BHYT' => 'HT2010666777888', 'Muc' => 95],
                ['HoTen' => 'Đinh Thị Mai', 'GioiTinh' => 'Nữ', 'NgaySinh' => '1998-07-25', 'SoDienThoai' => '0905777888', 'BHYT' => null, 'Muc' => 0],
                ['HoTen' => 'Lý Quốc Bảo', 'GioiTinh' => 'Nam', 'NgaySinh' => '1992-04-05', 'SoDienThoai' => '0905888999', 'BHYT' => 'DN4010888999000', 'Muc' => 80],
                ['HoTen' => 'Trịnh Thị Nga', 'GioiTinh' => 'Nữ', 'NgaySinh' => '1984-10-19', 'SoDienThoai' => '0905999000', 'BHYT' => 'DN4010999000111', 'Muc' => 80],
                ['HoTen' => 'Cao Văn Phúc', 'GioiTinh' => 'Nam', 'NgaySinh' => '1978-02-14', 'SoDienThoai' => '0906111333', 'BHYT' => null, 'Muc' => 0],
                ['HoTen' => 'Lâm Mỹ Duyên', 'GioiTinh' => 'Nữ', 'NgaySinh' => '2000-09-09', 'SoDienThoai' => '0906222444', 'BHYT' => 'GD4010222444555', 'Muc' => 80],
                ['HoTen' => 'Dương Hữu Tài', 'GioiTinh' => 'Nam', 'NgaySinh' => '1967-11-28', 'SoDienThoai' => '0906333555', 'BHYT' => 'HT2010333555666', 'Muc' => 95],
            ];
            $savedPatients = [];
            foreach ($historicalPatients as $hp) {
                $savedPatients[] = BenhNhan::updateOrCreate(
                    ['SoDienThoai' => $hp['SoDienThoai']],
                    [
                        'HoTen' => $hp['HoTen'],
                        'GioiTinh' => $hp['GioiTinh'],
                        'NgaySinh' => $hp['NgaySinh'],
                        'DiaChi' => 'Quận Bình Thạnh, TP.HCM',
                        'SoTheBHYT' => $hp['BHYT'],
                        'MucHuongBHYT' => $hp['Muc'],
                    ]
                );
            }

            // Gộp 4 bệnh nhân demo và 12 bệnh nhân lịch sử để ai đăng nhập cũng có lịch sử khám bệnh
            $timelinePatients = array_merge([$bnAn, $bnBinh, $bnCuong, $bnDung], $savedPatients);

            // -------------------------------------------------------------------------
            // BƯỚC 5: TẠO LỊCH SỬ KHÁM BỆNH & HÓA ĐƠN TRẢI DÀI 30 NGÀY
            // -------------------------------------------------------------------------
            $this->info("5. Khởi tạo dữ liệu lâm sàng, chỉ định CLS, đơn thuốc, lịch hẹn và hóa đơn 30 ngày qua...");

            $allDocs = [$bsNam, $bsHuong, $bsTuan, $bsLan];
            $allServices = DichVu::all()->keyBy('TenDichVu');
            $allMeds = Thuoc::all()->keyBy('TenThuoc');

            $clinicalCases = [
                [
                    'lyDo' => 'Đau quặn bụng thượng vị, ợ hơi, khó tiêu',
                    'chanDoan' => 'Viêm loét dạ dày tá tràng cấp tính',
                    'services' => ['Khám bệnh Nội tổng quát', 'Siêu âm ổ bụng tổng quát màu Doppler'],
                    'meds' => [
                        ['name' => 'Omeprazole 20mg', 'qty' => 30, 'lieu' => '1 viên/lần x 2 lần/ngày trước ăn 30 phút'],
                        ['name' => 'Amoxicillin 500mg', 'qty' => 40, 'lieu' => '2 viên/lần x 2 lần/ngày sau ăn'],
                    ],
                ],
                [
                    'lyDo' => 'Đau rát họng, ho có đờm, nghẹt mũi 4 ngày',
                    'chanDoan' => 'Viêm họng cấp / Viêm xoang sàng nhẹ',
                    'services' => ['Khám chuyên khoa Tai Mũi Họng', 'Nội soi Tai Mũi Họng ống mềm'],
                    'meds' => [
                        ['name' => 'Cefuroxime 500mg', 'qty' => 14, 'lieu' => '1 viên/lần x 2 lần/ngày sau ăn'],
                        ['name' => 'Paracetamol 500mg', 'qty' => 20, 'lieu' => '1 viên khi sốt trên 38.5 độ C'],
                        ['name' => 'Loratadine 10mg', 'qty' => 10, 'lieu' => '1 viên/ngày buổi tối trước khi ngủ'],
                    ],
                ],
                [
                    'lyDo' => 'Đau nhức răng hàm dưới, chảy máu chân răng khi đánh răng',
                    'chanDoan' => 'Viêm nướu răng mức độ vừa - Sâu răng men R46',
                    'services' => ['Khám chuyên khoa Răng Hàm Mặt'],
                    'meds' => [
                        ['name' => 'Paracetamol 500mg', 'qty' => 15, 'lieu' => '1 viên/lần x 3 lần/ngày khi đau'],
                        ['name' => 'Vitamin C 500mg', 'qty' => 20, 'lieu' => '1 viên/ngày buổi sáng sau ăn'],
                    ],
                ],
                [
                    'lyDo' => 'Chóng mặt, đau đầu vùng chẩm, kiểm tra định kỳ',
                    'chanDoan' => 'Tăng huyết áp nguyên phát độ 1 - Rối loạn tuần hoàn não',
                    'services' => ['Khám bệnh Nội tổng quát', 'Đo điện tim ECG kỹ thuật số 12 cần', 'Xét nghiệm Công thức máu toàn phần (24 thông số)'],
                    'meds' => [
                        ['name' => 'Amlodipine 5mg', 'qty' => 30, 'lieu' => '1 viên/ngày vào buổi sáng cố định'],
                        ['name' => 'Hoạt huyết dưỡng não Ginkgo', 'qty' => 60, 'lieu' => '1 viên/lần x 2 lần/ngày'],
                    ],
                ],
                [
                    'lyDo' => 'Trẻ sốt cao từng cơn, ho húng hắng, quấy khóc',
                    'chanDoan' => 'Viêm tiểu phế quản cấp ở trẻ nhỏ',
                    'services' => ['Khám Nhi khoa tổng quát'],
                    'meds' => [
                        ['name' => 'Paracetamol 500mg', 'qty' => 10, 'lieu' => 'Dùng 1/2 viên khi sốt > 38.5 độ C'],
                        ['name' => 'Men vi sinh Enterogermina', 'qty' => 10, 'lieu' => '1 ống/lần x 2 lần/ngày uống sau ăn'],
                    ],
                ],
            ];

            $totalInvoicesCreated = 0;
            $totalRevenueGenerated = 0;
            $currentDate = Carbon::create(2026, 10, 6, 8, 30, 0);
            $endDate = Carbon::create(2026, 11, 4, 16, 30, 0);
            $pIdx = 0;

            while ($currentDate->lessThanOrEqualTo($endDate)) {
                if ($currentDate->isSunday()) {
                    $currentDate->addDay();
                    continue;
                }

                $casesToday = ($currentDate->day % 2 === 0) ? 2 : 1;
                for ($c = 0; $c < $casesToday; $c++) {
                    $patient = $timelinePatients[$pIdx % count($timelinePatients)];
                    $pIdx++;

                    $case = $clinicalCases[($pIdx + $c) % count($clinicalCases)];
                    $doc = $allDocs[($pIdx) % count($allDocs)];

                    $timeReception = $currentDate->copy()->addMinutes($c * 90);
                    $timeFinish = $timeReception->copy()->addMinutes(45);

                    $hasBhyt = !empty($patient->SoTheBHYT) && $patient->MucHuongBHYT > 0;
                    $mucHuong = $hasBhyt ? (int) $patient->MucHuongBHYT : 0;

                    // Tạo lịch làm việc và ca khám tương ứng cho bác sĩ ngày hôm đó
                    $histLlv = LichLamViec::firstOrCreate(
                        [
                            'MaBacSi' => $doc->MaBacSi,
                            'NgayLamViec' => $timeReception->toDateString(),
                        ],
                        [
                            'MaTaiKhoan' => $doc->MaTaiKhoan,
                            'GioBatDau' => '08:00:00',
                            'GioKetThuc' => '17:00:00',
                            'SoLuongTiepNhan' => 30,
                            'TrangThai' => 'CON_TRONG',
                            'LoaiCa' => 'ngay',
                        ]
                    );

                    $histCa = CaKham::firstOrCreate(
                        [
                            'MaLichLamViec' => $histLlv->MaLichLamViec,
                            'GioBatDau' => '08:00:00',
                            'GioKetThuc' => '12:00:00',
                        ],
                        [
                            'SoLuongTiepNhan' => 15,
                            'TrangThai' => 'CON_TRONG',
                        ]
                    );

                    // Tạo lịch hẹn tương ứng cho hồ sơ lịch sử
                    $histLh = LichHen::create([
                        'MaBenhNhan' => $patient->MaBenhNhan,
                        'MaCaKham' => $histCa->MaCaKham,
                        'LyDoKham' => $case['lyDo'],
                        'NgayDat' => $timeReception->toDateString(),
                        'TrangThai' => 'HOAN_THANH',
                    ]);

                    // 1. LuotKham
                    $luotKham = LuotKham::create([
                        'MaBenhNhan' => $patient->MaBenhNhan,
                        'MaBacSi' => $doc->MaBacSi,
                        'ThoiGianTiepNhan' => $timeReception,
                        'ThoiGianBatDauKham' => $timeReception->copy()->addMinutes(10),
                        'ThoiGianKetThucKham' => $timeFinish,
                        'TrangThai' => 'HOAN_THANH',
                        'CoBHYT' => $hasBhyt,
                        'SoTheBHYT' => $patient->SoTheBHYT,
                        'MucHuongBHYT' => $mucHuong,
                        'TuyenKCB' => $hasBhyt ? 'DUNG_TUYEN' : 'TRAI_TUYEN',
                        'NgayKham' => $timeReception->toDateString(),
                        'ThoiGianVaoHang' => $timeReception,
                        'LoaiHangDoi' => 'TIÊU_CHUẨN',
                        'SoPhieu' => 'A' . str_pad($pIdx, 3, '0', STR_PAD_LEFT),
                        'STTTrongNgay' => $c + 1,
                        'MaChuyenKhoa' => $doc->MaChuyenKhoa,
                        'MaCaKham' => $histCa->MaCaKham,
                        'MaLichHen' => $histLh->MaLichHen,
                        'MaTaiKhoanTiepNhan' => $tkRecepMai->MaTaiKhoan,
                        'GhiChu' => $case['lyDo'],
                    ]);

                    // 2. PhieuKham
                    $phieuKham = PhieuKham::create([
                        'MaLuotKham' => $luotKham->MaLuotKham,
                        'TrieuChung' => $case['lyDo'],
                        'KetQuaKham' => 'Bệnh nhân tỉnh táo, tiếp xúc tốt, niêm mạc hồng hào, tim phổi đều.',
                        'TienSuBenh' => $patient->TienSuBenh,
                        'ChanDoan' => $case['chanDoan'],
                        'HuongDieuTri' => 'Điều trị nội khoa bằng thuốc kết hợp nghỉ ngơi và tái khám sau 5 ngày.',
                        'LoiDanBacSi' => 'Uống thuốc đúng liều lượng, kiêng đồ chua cay dầu mỡ và tái khám nếu có triệu chứng nặng hơn.',
                    ]);

                    $totalBillAmount = 0;
                    $totalBhytAmount = 0;
                    $chiTietRows = [];

                    // 3. ChiDinhDichVu
                    foreach ($case['services'] as $srvName) {
                        if (isset($allServices[$srvName])) {
                            $srv = $allServices[$srvName];
                            $cd = ChiDinhDichVu::create([
                                'MaLuotKham' => $luotKham->MaLuotKham,
                                'MaPhieuKham' => $phieuKham->MaPhieuKham,
                                'MaDichVu' => $srv->MaDichVu,
                                'MaBacSi' => $doc->MaBacSi,
                                'MaNhanVienThucHien' => $tkClsDuc->MaTaiKhoan,
                                'TrangThai' => 'DA_HOAN_THANH',
                                'KetQua' => 'Kết quả trong giới hạn bình thường, không ghi nhận tổn thương khu trú ác tính.',
                                'KetLuan' => 'Phù hợp với chẩn đoán ' . $case['chanDoan'],
                                'DonGia' => $srv->DonGia,
                                'NgayChiDinh' => $timeReception,
                                'NgayThucHien' => $timeReception->copy()->addMinutes(20),
                            ]);

                            $srvThanhTien = (float) $srv->DonGia;
                            $srvBhyt = ($hasBhyt && $srv->ApDungBHYT) ? round($srvThanhTien * ($mucHuong / 100), 2) : 0;
                            $srvBn = $srvThanhTien - $srvBhyt;

                            $totalBillAmount += $srvThanhTien;
                            $totalBhytAmount += $srvBhyt;

                            $chiTietRows[] = [
                                'LoaiChiPhi' => 'DICH_VU',
                                'NoiDung' => $srv->TenDichVu,
                                'SoLuong' => 1,
                                'DonGia' => $srv->DonGia,
                                'DuocBHYTChiTra' => ($hasBhyt && $srv->ApDungBHYT),
                                'TienBHYTChiTra' => $srvBhyt,
                                'TienBenhNhanChiTra' => $srvBn,
                                'MaChiDinh' => $cd->MaChiDinh,
                                'MaChiTietDonThuoc' => null,
                            ];
                        }
                    }

                    // 4. DonThuoc & ChiTietDonThuoc
                    $donThuoc = DonThuoc::create([
                        'MaLuotKham' => $luotKham->MaLuotKham,
                        'MaBacSi' => $doc->MaBacSi,
                        'NgayKeDon' => $timeReception->toDateString(),
                        'LoiDan' => 'Uống thuốc đúng theo hướng dẫn, kiêng rượu bia.',
                        'TrangThai' => 'DA_CAP',
                    ]);

                    foreach ($case['meds'] as $mItem) {
                        if (isset($allMeds[$mItem['name']])) {
                            $med = $allMeds[$mItem['name']];
                            $ctDt = ChiTietDonThuoc::create([
                                'MaDonThuoc' => $donThuoc->MaDonThuoc,
                                'MaThuoc' => $med->MaThuoc,
                                'SoLuong' => $mItem['qty'],
                                'LieuDung' => $mItem['lieu'],
                                'TanSuat' => 'Theo chỉ định',
                                'ThoiGianDung' => '5 ngày',
                                'CachDung' => 'Uống sau ăn',
                                'DonGia' => $med->DonGia,
                            ]);

                            $medThanhTien = (float) ($med->DonGia * $mItem['qty']);
                            $medBhyt = ($hasBhyt && $med->ApDungBHYT) ? round($medThanhTien * ($mucHuong / 100), 2) : 0;
                            $medBn = $medThanhTien - $medBhyt;

                            $totalBillAmount += $medThanhTien;
                            $totalBhytAmount += $medBhyt;

                            $chiTietRows[] = [
                                'LoaiChiPhi' => 'THUOC',
                                'NoiDung' => $med->TenThuoc,
                                'SoLuong' => $mItem['qty'],
                                'DonGia' => $med->DonGia,
                                'DuocBHYTChiTra' => ($hasBhyt && $med->ApDungBHYT),
                                'TienBHYTChiTra' => $medBhyt,
                                'TienBenhNhanChiTra' => $medBn,
                                'MaChiDinh' => null,
                                'MaChiTietDonThuoc' => $ctDt->MaChiTietDonThuoc,
                            ];
                        }
                    }

                    // 5. HoaDon
                    $benhNhanTra = max(0, $totalBillAmount - $totalBhytAmount);
                    $hoaDon = HoaDon::create([
                        'MaLuotKham' => $luotKham->MaLuotKham,
                        'TongTien' => 0,
                        'GiamGia' => 0,
                        'BaoHiemChiTra' => 0,
                        'BenhNhanChiTra' => 0,
                        'TrangThai' => 'DA_THANH_TOAN',
                        'NgayTao' => $timeFinish,
                        'GhiChu' => $hasBhyt ? "Hóa đơn thanh toán (BHYT {$mucHuong}%)" : 'Hóa đơn dịch vụ tự túc',
                        'MaTaiKhoanThu' => $tkRecepMai->MaTaiKhoan,
                    ]);

                    foreach ($chiTietRows as $ct) {
                        ChiTietHoaDon::create(array_merge($ct, ['MaHoaDon' => $hoaDon->MaHoaDon]));
                    }

                    DB::table('hoa_don')->where('MaHoaDon', $hoaDon->MaHoaDon)->update([
                        'BaoHiemChiTra' => $totalBhytAmount,
                        'BenhNhanChiTra' => $benhNhanTra,
                    ]);

                    ThanhToan::create([
                        'MaHoaDon' => $hoaDon->MaHoaDon,
                        'SoTien' => $benhNhanTra,
                        'PhuongThucThanhToan' => ($pIdx % 3 === 0) ? 'CHUYEN_KHOAN' : 'TIEN_MAT',
                        'ThoiGianThanhToan' => $timeFinish->copy()->addMinutes(5),
                        'TrangThai' => 'DA_THANH_TOAN',
                        'MaGiaoDich' => 'TXN' . $hoaDon->MaHoaDon . rand(1000, 9999),
                        'GhiChu' => 'Thanh toán hoàn tất tại quầy lễ tân',
                        'NgayTao' => $timeFinish,
                        'MaTaiKhoanThu' => $tkRecepMai->MaTaiKhoan,
                    ]);

                    $totalInvoicesCreated++;
                    $totalRevenueGenerated += $benhNhanTra;
                }

                $currentDate->addDays(1);
            }

            $this->info("   -> Đã sinh " . $totalInvoicesCreated . " lượt khám hoàn thành có đầy đủ hồ sơ bệnh án, lịch hẹn và hóa đơn.");
            $this->info("   -> Tổng doanh thu thực tế thu từ bệnh nhân: " . number_format($totalRevenueGenerated, 0, ',', '.') . " VNĐ.");

            // -------------------------------------------------------------------------
            // BƯỚC 6: CHẤM CÔNG & TÍNH LƯƠNG THÁNG 10/2026 CHO TOÀN BỘ NHÂN SỰ
            // -------------------------------------------------------------------------
            $this->info("6. Khởi tạo dữ liệu Chấm công và Bảng lương tháng 10/2026...");

            $staffAccounts = [
                ['acc' => $tkDocNam, 'role' => 'BAC_SI', 'luongCoBan' => 22000000, 'phuCap' => 3000000],
                ['acc' => $tkDocHuong, 'role' => 'BAC_SI', 'luongCoBan' => 20000000, 'phuCap' => 2500000],
                ['acc' => $tkDocTuan, 'role' => 'BAC_SI', 'luongCoBan' => 24000000, 'phuCap' => 3500000],
                ['acc' => $tkDocLan, 'role' => 'BAC_SI', 'luongCoBan' => 18000000, 'phuCap' => 2000000],
                ['acc' => $tkRecepMai, 'role' => 'LE_TAN', 'luongCoBan' => 9500000, 'phuCap' => 1200000],
                ['acc' => $tkRecepHoa, 'role' => 'LE_TAN', 'luongCoBan' => 9000000, 'phuCap' => 1000000],
                ['acc' => $tkClsDuc, 'role' => 'NHAN_VIEN_CAN_LAM_SANG', 'luongCoBan' => 11000000, 'phuCap' => 1500000],
            ];

            foreach ($staffAccounts as $st) {
                for ($d = 1; $d <= 31; $d++) {
                    $dayDate = Carbon::create(2026, 10, $d, 0, 0, 0);
                    if ($dayDate->isSunday()) continue;

                    $checkIn = $dayDate->copy()->setTime(7, rand(20, 32), 0);
                    $checkOut = $dayDate->copy()->setTime(17, rand(30, 45), 0);
                    $isLate = ($checkIn->minute > 30);
                    $lateMinutes = $isLate ? ($checkIn->minute - 30) : 0;

                    ChamCong::updateOrCreate(
                        [
                            'MaTaiKhoan' => $st['acc']->MaTaiKhoan,
                            'NgayChamCong' => $dayDate->toDateString(),
                        ],
                        [
                            'LoaiCa' => 'ngay',
                            'GioCheckIn' => $checkIn,
                            'GioCheckOut' => $checkOut,
                            'TrangThai' => $isLate ? 'TRE' : 'DUNG_GIO',
                            'SoPhutTre' => $lateMinutes,
                            'SoPhutVeSom' => 0,
                            'TienLuongCoBan' => round($st['luongCoBan'] / 26),
                            'PhuCapCa' => round($st['phuCap'] / 26),
                            'TienThuong' => 0,
                            'TienPhat' => $isLate ? 50000 : 0,
                            'TongTien' => round(($st['luongCoBan'] + $st['phuCap']) / 26) - ($isLate ? 50000 : 0),
                            'GhiChu' => 'Chấm công vân tay tiêu chuẩn',
                        ]
                    );
                }

                $phepKhauTru = 50000;
                $thucLinh = $st['luongCoBan'] + $st['phuCap'] - $phepKhauTru;
                BangLuong::updateOrCreate(
                    [
                        'MaTaiKhoan' => $st['acc']->MaTaiKhoan,
                        'ThangNam' => '2026-10',
                    ],
                    [
                        'SoNgayLam' => 26,
                        'SoCaLam' => 26,
                        'TienLuongCoBan' => $st['luongCoBan'],
                        'PhuCapCa' => $st['phuCap'],
                        'TienThuong' => 0,
                        'TienPhat' => $phepKhauTru,
                        'TongTien' => $thucLinh,
                        'TrangThai' => 'DA_CHOT',
                    ]
                );
            }
            $this->info("   -> Đã chốt thành công 7 bảng lương tháng 10/2026 cho toàn bộ đội ngũ bác sĩ và nhân viên.");

            // -------------------------------------------------------------------------
            // BƯỚC 7: CÁC CA DEMO TRỰC TIẾP HÔM NAY VỚI ĐỦ 4 BÁC SĨ & CA KHÁM
            // -------------------------------------------------------------------------
            $today = Carbon::today()->setHour(8)->setMinute(0)->setSecond(0);
            $todayDateStr = $today->toDateString();
            $this->info("7. Chuẩn bị 4 ca bệnh trực quan hôm nay ({$todayDateStr}) cho Hội đồng kiểm tra...");

            // Khởi tạo Lịch làm việc và Ca khám Sáng + Chiều hôm nay cho cả 4 bác sĩ
            $todayDoctors = [$bsNam, $bsHuong, $bsTuan, $bsLan];
            $todayCaKhams = [];

            foreach ($todayDoctors as $d) {
                $todayLlv = LichLamViec::updateOrCreate(
                    [
                        'MaBacSi' => $d->MaBacSi,
                        'NgayLamViec' => $todayDateStr,
                    ],
                    [
                        'MaTaiKhoan' => $d->MaTaiKhoan,
                        'GioBatDau' => '08:00:00',
                        'GioKetThuc' => '17:00:00',
                        'SoLuongTiepNhan' => 30,
                        'TrangThai' => 'CON_TRONG',
                        'LoaiCa' => 'ngay',
                    ]
                );

                $caSang = CaKham::updateOrCreate(
                    [
                        'MaLichLamViec' => $todayLlv->MaLichLamViec,
                        'GioBatDau' => '08:00:00',
                        'GioKetThuc' => '12:00:00',
                    ],
                    [
                        'SoLuongTiepNhan' => 15,
                        'TrangThai' => 'CON_TRONG',
                    ]
                );

                $caChieu = CaKham::updateOrCreate(
                    [
                        'MaLichLamViec' => $todayLlv->MaLichLamViec,
                        'GioBatDau' => '13:30:00',
                        'GioKetThuc' => '17:00:00',
                    ],
                    [
                        'SoLuongTiepNhan' => 15,
                        'TrangThai' => 'CON_TRONG',
                    ]
                );

                $todayCaKhams[$d->MaBacSi] = [
                    'sang' => $caSang,
                    'chieu' => $caChieu,
                ];
            }

            $caNamSang = $todayCaKhams[$bsNam->MaBacSi]['sang'];
            $caHuongSang = $todayCaKhams[$bsHuong->MaBacSi]['sang'];
            $caTuanSang = $todayCaKhams[$bsTuan->MaBacSi]['sang'];
            $caLanSang = $todayCaKhams[$bsLan->MaBacSi]['sang'];

            // Lịch hẹn hôm nay cho 4 ca bệnh trực quan
            $lh1 = LichHen::create([
                'MaBenhNhan' => $bnAn->MaBenhNhan,
                'MaCaKham' => $caNamSang->MaCaKham,
                'LyDoKham' => 'Đau rát họng, ho có đờm trắng về đêm',
                'NgayDat' => $todayDateStr,
                'TrangThai' => 'DA_TIEP_NHAN',
            ]);

            $lh2 = LichHen::create([
                'MaBenhNhan' => $bnBinh->MaBenhNhan,
                'MaCaKham' => $caHuongSang->MaCaKham,
                'LyDoKham' => 'Nghẹt mũi, khó thở bên phải, ù tai',
                'NgayDat' => $todayDateStr,
                'TrangThai' => 'DA_TIEP_NHAN',
            ]);

            $lh3 = LichHen::create([
                'MaBenhNhan' => $bnCuong->MaBenhNhan,
                'MaCaKham' => $caNamSang->MaCaKham,
                'LyDoKham' => 'Tức ngực nhẹ khi leo cầu thang, tiền sử huyết áp',
                'NgayDat' => $todayDateStr,
                'TrangThai' => 'DA_TIEP_NHAN',
            ]);

            $lh4 = LichHen::create([
                'MaBenhNhan' => $bnDung->MaBenhNhan,
                'MaCaKham' => $caTuanSang->MaCaKham,
                'LyDoKham' => 'Lấy cao răng định kỳ',
                'NgayDat' => $todayDateStr,
                'TrangThai' => 'HOAN_THANH',
            ]);

            // Ca 1: Chờ khám (CHO_KHAM) - BN Nguyễn Văn An (BHYT 80%), BS Trần Văn Nam (Khoa Nội)
            $lk1 = LuotKham::updateOrCreate(
                ['MaBenhNhan' => $bnAn->MaBenhNhan, 'NgayKham' => $todayDateStr],
                [
                    'MaBacSi' => $bsNam->MaBacSi,
                    'ThoiGianTiepNhan' => $today->copy()->setTime(8, 10, 0),
                    'ThoiGianVaoHang' => $today->copy()->setTime(8, 10, 0),
                    'TrangThai' => 'CHO_KHAM',
                    'CoBHYT' => true,
                    'SoTheBHYT' => $bnAn->SoTheBHYT,
                    'MucHuongBHYT' => 80,
                    'TuyenKCB' => 'DUNG_TUYEN',
                    'LoaiHangDoi' => 'TIÊU_CHUẨN',
                    'SoPhieu' => sprintf("NTQ-C%d-001", $caNamSang->MaCaKham),
                    'STTTrongNgay' => 1,
                    'MaChuyenKhoa' => $ckNoi->MaChuyenKhoa,
                    'MaCaKham' => $caNamSang->MaCaKham,
                    'MaLichHen' => $lh1->MaLichHen,
                    'MaTaiKhoanTiepNhan' => $tkRecepMai->MaTaiKhoan,
                    'GhiChu' => 'Đau rát họng, ho có đờm trắng về đêm',
                ]
            );

            // Ca 2: Đang khám & Chờ cận lâm sàng (DANG_KHAM) - BN Lê Thị Bình (BHYT 80%), BS Nguyễn Thu Hương (TMH)
            $lk2 = LuotKham::updateOrCreate(
                ['MaBenhNhan' => $bnBinh->MaBenhNhan, 'NgayKham' => $todayDateStr],
                [
                    'MaBacSi' => $bsHuong->MaBacSi,
                    'ThoiGianTiepNhan' => $today->copy()->setTime(8, 20, 0),
                    'ThoiGianVaoHang' => $today->copy()->setTime(8, 20, 0),
                    'ThoiGianBatDauKham' => $today->copy()->setTime(8, 30, 0),
                    'TrangThai' => 'DANG_KHAM',
                    'CoBHYT' => true,
                    'SoTheBHYT' => $bnBinh->SoTheBHYT,
                    'MucHuongBHYT' => 80,
                    'TuyenKCB' => 'DUNG_TUYEN',
                    'LoaiHangDoi' => 'TIÊU_CHUẨN',
                    'SoPhieu' => sprintf("TMH-C%d-001", $caHuongSang->MaCaKham),
                    'STTTrongNgay' => 1,
                    'MaChuyenKhoa' => $ckTMH->MaChuyenKhoa,
                    'MaCaKham' => $caHuongSang->MaCaKham,
                    'MaLichHen' => $lh2->MaLichHen,
                    'MaTaiKhoanTiepNhan' => $tkRecepMai->MaTaiKhoan,
                    'GhiChu' => 'Nghẹt mũi, khó thở bên phải, ù tai',
                ]
            );
            $pk2 = PhieuKham::updateOrCreate(
                ['MaLuotKham' => $lk2->MaLuotKham],
                [
                    'TrieuChung' => 'Nghẹt mũi, khó thở bên phải, ù tai',
                    'KetQuaKham' => 'Niêm mạc hốc mũi sung huyết, cuốn mũi dưới quá phát độ 2.',
                    'TienSuBenh' => 'Không',
                    'ChanDoan' => 'Theo dõi Viêm mũi xoang cấp / Phì đại cuốn mũi',
                    'HuongDieuTri' => 'Chỉ định nội soi TMH kiểm tra sâu',
                ]
            );
            ChiDinhDichVu::updateOrCreate(
                ['MaLuotKham' => $lk2->MaLuotKham, 'MaDichVu' => $allServices['Nội soi Tai Mũi Họng ống mềm']->MaDichVu],
                [
                    'MaPhieuKham' => $pk2->MaPhieuKham,
                    'MaBacSi' => $bsHuong->MaBacSi,
                    'TrangThai' => 'CHO_THUC_HIEN',
                    'DonGia' => 180000,
                    'NgayChiDinh' => $today->copy()->setTime(8, 35, 0),
                    'GhiChu' => 'Nội soi đánh giá vách ngăn và hốc mủ xoang',
                ]
            );

            // Ca 3: ĐÃ KHÁM XONG - ĐANG CHỜ LỄ TÂN LẬP HÓA ĐƠN (DA_KHAM_XONG) - BN Trần Quốc Cường (BHYT 95%), BS Nam (Nội)
            $lk3 = LuotKham::updateOrCreate(
                ['MaBenhNhan' => $bnCuong->MaBenhNhan, 'NgayKham' => $todayDateStr],
                [
                    'MaBacSi' => $bsNam->MaBacSi,
                    'ThoiGianTiepNhan' => $today->copy()->setTime(8, 0, 0),
                    'ThoiGianVaoHang' => $today->copy()->setTime(8, 0, 0),
                    'ThoiGianBatDauKham' => $today->copy()->setTime(8, 15, 0),
                    'ThoiGianKetThucKham' => $today->copy()->setTime(8, 50, 0),
                    'TrangThai' => 'DA_KHAM_XONG',
                    'CoBHYT' => true,
                    'SoTheBHYT' => $bnCuong->SoTheBHYT,
                    'MucHuongBHYT' => 95,
                    'TuyenKCB' => 'DUNG_TUYEN',
                    'LoaiHangDoi' => 'TIÊU_CHUẨN',
                    'SoPhieu' => sprintf("NTQ-C%d-002", $caNamSang->MaCaKham),
                    'STTTrongNgay' => 2,
                    'MaChuyenKhoa' => $ckNoi->MaChuyenKhoa,
                    'MaCaKham' => $caNamSang->MaCaKham,
                    'MaLichHen' => $lh3->MaLichHen,
                    'MaTaiKhoanTiepNhan' => $tkRecepMai->MaTaiKhoan,
                    'GhiChu' => 'Tức ngực nhẹ khi leo cầu thang, tiền sử huyết áp',
                ]
            );
            $pk3 = PhieuKham::updateOrCreate(
                ['MaLuotKham' => $lk3->MaLuotKham],
                [
                    'TrieuChung' => 'Tức ngực nhẹ khi gắng sức, huyết áp đo tại phòng 138/85 mmHg',
                    'KetQuaKham' => 'Tim đều rõ, T1 T2 nghe bình thường, không có âm thổi bệnh lý',
                    'TienSuBenh' => 'Tăng huyết áp 3 năm',
                    'ChanDoan' => 'Tăng huyết áp độ 1 - Cơn đau thắt ngực ổn định',
                    'HuongDieuTri' => 'Duy trì thuốc hạ áp hàng ngày kết hợp kiểm soát mỡ máu',
                    'LoiDanBacSi' => 'Giảm ăn mặn, tập thể dục nhẹ nhàng 30 phút mỗi ngày',
                ]
            );
            $cd3 = ChiDinhDichVu::updateOrCreate(
                ['MaLuotKham' => $lk3->MaLuotKham, 'MaDichVu' => $allServices['Đo điện tim ECG kỹ thuật số 12 cần']->MaDichVu],
                [
                    'MaPhieuKham' => $pk3->MaPhieuKham,
                    'MaBacSi' => $bsNam->MaBacSi,
                    'MaNhanVienThucHien' => $tkClsDuc->MaTaiKhoan,
                    'TrangThai' => 'DA_HOAN_THANH',
                    'KetQua' => 'Nhịp xoang đều tần số 74ck/p. Trục trung gian. Chưa thấy biến đổi ST-T cấp tính.',
                    'KetLuan' => 'ECG trong giới hạn bình thường',
                    'DonGia' => 75000,
                    'NgayChiDinh' => $today->copy()->setTime(8, 20, 0),
                    'NgayThucHien' => $today->copy()->setTime(8, 35, 0),
                ]
            );
            $dt3 = DonThuoc::updateOrCreate(
                ['MaLuotKham' => $lk3->MaLuotKham],
                [
                    'MaBacSi' => $bsNam->MaBacSi,
                    'NgayKeDon' => $todayDateStr,
                    'LoiDan' => 'Uống thuốc đều đặn vào lúc 8h sáng hàng ngày.',
                    'TrangThai' => 'DA_CAP',
                ]
            );
            ChiTietDonThuoc::updateOrCreate(
                ['MaDonThuoc' => $dt3->MaDonThuoc, 'MaThuoc' => $allMeds['Amlodipine 5mg']->MaThuoc],
                [
                    'SoLuong' => 30,
                    'LieuDung' => '1 viên/ngày',
                    'TanSuat' => '1 lần/ngày',
                    'ThoiGianDung' => '30 ngày',
                    'CachDung' => 'Uống buổi sáng sau ăn',
                    'DonGia' => 2800,
                ]
            );
            ChiTietDonThuoc::updateOrCreate(
                ['MaDonThuoc' => $dt3->MaDonThuoc, 'MaThuoc' => $allMeds['Hoạt huyết dưỡng não Ginkgo']->MaThuoc],
                [
                    'SoLuong' => 60,
                    'LieuDung' => '1 viên/lần x 2 lần/ngày',
                    'TanSuat' => '2 lần/ngày',
                    'ThoiGianDung' => '30 ngày',
                    'CachDung' => 'Uống sau ăn (Thuốc hỗ trợ tự túc)',
                    'DonGia' => 12000,
                ]
            );

            // Ca 4: ĐÃ HOÀN THÀNH & ĐÃ THANH TOÁN SÁNG NAY (HOAN_THANH) - BN Vũ Hoàng Dũng (Tự túc), BS Tuấn (RHM)
            $lk4 = LuotKham::updateOrCreate(
                ['MaBenhNhan' => $bnDung->MaBenhNhan, 'NgayKham' => $todayDateStr],
                [
                    'MaBacSi' => $bsTuan->MaBacSi,
                    'ThoiGianTiepNhan' => $today->copy()->setTime(8, 5, 0),
                    'ThoiGianVaoHang' => $today->copy()->setTime(8, 5, 0),
                    'ThoiGianBatDauKham' => $today->copy()->setTime(8, 15, 0),
                    'ThoiGianKetThucKham' => $today->copy()->setTime(8, 45, 0),
                    'TrangThai' => 'HOAN_THANH',
                    'CoBHYT' => false,
                    'SoTheBHYT' => null,
                    'MucHuongBHYT' => 0,
                    'TuyenKCB' => 'TRAI_TUYEN',
                    'LoaiHangDoi' => 'TIÊU_CHUẨN',
                    'SoPhieu' => sprintf("RHM-C%d-001", $caTuanSang->MaCaKham),
                    'STTTrongNgay' => 1,
                    'MaChuyenKhoa' => $ckRHM->MaChuyenKhoa,
                    'MaCaKham' => $caTuanSang->MaCaKham,
                    'MaLichHen' => $lh4->MaLichHen,
                    'MaTaiKhoanTiepNhan' => $tkRecepMai->MaTaiKhoan,
                    'GhiChu' => 'Lấy cao răng định kỳ',
                ]
            );
            $pk4 = PhieuKham::updateOrCreate(
                ['MaLuotKham' => $lk4->MaLuotKham],
                [
                    'TrieuChung' => 'Cao răng bám mảng bề mặt răng cửa dưới',
                    'KetQuaKham' => 'Vôi răng độ 1, không viêm quanh chóp',
                    'TienSuBenh' => 'Không',
                    'ChanDoan' => 'Vôi răng mức độ nhẹ',
                    'HuongDieuTri' => 'Đã cạo vôi và đánh bóng 2 hàm',
                ]
            );
            $cd4 = ChiDinhDichVu::updateOrCreate(
                ['MaLuotKham' => $lk4->MaLuotKham, 'MaDichVu' => $allServices['Khám chuyên khoa Răng Hàm Mặt']->MaDichVu],
                [
                    'MaPhieuKham' => $pk4->MaPhieuKham,
                    'MaBacSi' => $bsTuan->MaBacSi,
                    'TrangThai' => 'DA_HOAN_THANH',
                    'DonGia' => 100000,
                    'NgayChiDinh' => $today->copy()->setTime(8, 15, 0),
                    'NgayThucHien' => $today->copy()->setTime(8, 30, 0),
                ]
            );
            $existingHd4 = HoaDon::where('MaLuotKham', $lk4->MaLuotKham)->first();
            if ($existingHd4) {
                ThanhToan::where('MaHoaDon', $existingHd4->MaHoaDon)->delete();
                $existingHd4->delete();
            }

            $hd4 = HoaDon::create([
                'MaLuotKham' => $lk4->MaLuotKham,
                'TongTien' => 0,
                'GiamGia' => 0,
                'BaoHiemChiTra' => 0,
                'BenhNhanChiTra' => 0,
                'TrangThai' => 'DA_THANH_TOAN',
                'NgayTao' => $today->copy()->setTime(8, 50, 0),
                'GhiChu' => 'Hóa đơn khám răng tự túc đã thu tiền mặt',
                'MaTaiKhoanThu' => $tkRecepMai->MaTaiKhoan,
            ]);
            ChiTietHoaDon::create([
                'MaHoaDon' => $hd4->MaHoaDon,
                'LoaiChiPhi' => 'DICH_VU',
                'NoiDung' => 'Khám chuyên khoa Răng Hàm Mặt',
                'SoLuong' => 1,
                'DonGia' => 100000,
                'DuocBHYTChiTra' => false,
                'TienBHYTChiTra' => 0,
                'TienBenhNhanChiTra' => 100000,
                'MaChiDinh' => $cd4->MaChiDinh,
                'MaChiTietDonThuoc' => null,
            ]);
            DB::table('hoa_don')->where('MaHoaDon', $hd4->MaHoaDon)->update([
                'BaoHiemChiTra' => 0,
                'BenhNhanChiTra' => 100000,
            ]);

            ThanhToan::create([
                'MaHoaDon' => $hd4->MaHoaDon,
                'SoTien' => 100000,
                'PhuongThucThanhToan' => 'TIEN_MAT',
                'ThoiGianThanhToan' => $today->copy()->setTime(8, 52, 0),
                'TrangThai' => 'DA_THANH_TOAN',
                'MaGiaoDich' => 'TXN_CASH_0511_' . $hd4->MaHoaDon,
                'GhiChu' => 'Thu tiền mặt tại quầy',
                'NgayTao' => $today->copy()->setTime(8, 50, 0),
                'MaTaiKhoanThu' => $tkRecepMai->MaTaiKhoan,
            ]);

            // Khởi tạo hàng đợi hôm nay
            DB::table('hang_doi_counter')->updateOrInsert(
                ['NgayKham' => $todayDateStr, 'MaCaKham' => $caNamSang->MaCaKham, 'MaChuyenKhoa' => $ckNoi->MaChuyenKhoa],
                ['SoHienTai' => 2, 'UpdatedAt' => now()]
            );
            DB::table('hang_doi_counter')->updateOrInsert(
                ['NgayKham' => $todayDateStr, 'MaCaKham' => $caHuongSang->MaCaKham, 'MaChuyenKhoa' => $ckTMH->MaChuyenKhoa],
                ['SoHienTai' => 1, 'UpdatedAt' => now()]
            );
            DB::table('hang_doi_counter')->updateOrInsert(
                ['NgayKham' => $todayDateStr, 'MaCaKham' => $caTuanSang->MaCaKham, 'MaChuyenKhoa' => $ckRHM->MaChuyenKhoa],
                ['SoHienTai' => 1, 'UpdatedAt' => now()]
            );
            DB::table('hang_doi_counter')->updateOrInsert(
                ['NgayKham' => $todayDateStr, 'MaCaKham' => $caLanSang->MaCaKham, 'MaChuyenKhoa' => $ckNhi->MaChuyenKhoa],
                ['SoHienTai' => 0, 'UpdatedAt' => now()]
            );

            // Ghi nhật ký gọi số hàng đợi hôm nay
            DB::table('hang_doi_lich_su')->insert([
                ['MaLuotKham' => $lk1->MaLuotKham, 'LoaiSuKien' => 'TIEP_NHAN', 'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan, 'ThongTin' => 'Tiếp nhận bệnh nhân tại quầy', 'ThoiGian' => $today->copy()->setTime(8, 10, 0)],
                ['MaLuotKham' => $lk2->MaLuotKham, 'LoaiSuKien' => 'TIEP_NHAN', 'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan, 'ThongTin' => 'Tiếp nhận bệnh nhân tại quầy', 'ThoiGian' => $today->copy()->setTime(8, 20, 0)],
                ['MaLuotKham' => $lk2->MaLuotKham, 'LoaiSuKien' => 'GOI_SO', 'MaTaiKhoan' => $tkDocHuong->MaTaiKhoan, 'ThongTin' => 'Bác sĩ gọi vào phòng khám TMH', 'ThoiGian' => $today->copy()->setTime(8, 30, 0)],
                ['MaLuotKham' => $lk3->MaLuotKham, 'LoaiSuKien' => 'TIEP_NHAN', 'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan, 'ThongTin' => 'Tiếp nhận bệnh nhân tại quầy', 'ThoiGian' => $today->copy()->setTime(8, 0, 0)],
                ['MaLuotKham' => $lk3->MaLuotKham, 'LoaiSuKien' => 'GOI_SO', 'MaTaiKhoan' => $tkDocNam->MaTaiKhoan, 'ThongTin' => 'Bác sĩ gọi vào phòng khám Nội', 'ThoiGian' => $today->copy()->setTime(8, 15, 0)],
                ['MaLuotKham' => $lk4->MaLuotKham, 'LoaiSuKien' => 'TIEP_NHAN', 'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan, 'ThongTin' => 'Tiếp nhận bệnh nhân tại quầy', 'ThoiGian' => $today->copy()->setTime(8, 5, 0)],
                ['MaLuotKham' => $lk4->MaLuotKham, 'LoaiSuKien' => 'GOI_SO', 'MaTaiKhoan' => $tkDocTuan->MaTaiKhoan, 'ThongTin' => 'Bác sĩ gọi vào phòng khám RHM', 'ThoiGian' => $today->copy()->setTime(8, 15, 0)],
            ]);

            // Điểm danh vào ca trực hôm nay cho các nhân sự demo trực tiếp để không bị chặn bởi Middleware EnsureStaffCheckedIn
            $todayCheckInStaff = [
                ['acc' => $tkDocNam, 'bacSi' => $bsNam, 'role' => 'BAC_SI'],
                ['acc' => $tkDocHuong, 'bacSi' => $bsHuong, 'role' => 'BAC_SI'],
                ['acc' => $tkDocTuan, 'bacSi' => $bsTuan, 'role' => 'BAC_SI'],
                ['acc' => $tkDocLan, 'bacSi' => $bsLan, 'role' => 'BAC_SI'],
                ['acc' => $tkRecepMai, 'bacSi' => null, 'role' => 'LE_TAN'],
                ['acc' => $tkClsDuc, 'bacSi' => null, 'role' => 'NHAN_VIEN_CAN_LAM_SANG'],
            ];
            foreach ($todayCheckInStaff as $item) {
                ChamCong::updateOrCreate(
                    [
                        'MaTaiKhoan' => $item['acc']->MaTaiKhoan,
                        'NgayChamCong' => $todayDateStr,
                    ],
                    [
                        'MaBacSi' => $item['bacSi']?->MaBacSi,
                        'LoaiCa' => 'sang',
                        'GioCheckIn' => '07:50:00',
                        'TrangThai' => 'DUNG_GIO',
                        'SoPhutTre' => 0,
                        'SoPhutVeSom' => 0,
                        'TienLuongCoBan' => 400000,
                        'PhuCapCa' => 50000,
                        'TienThuong' => 0,
                        'TienPhat' => 0,
                        'TongTien' => 450000,
                    ]
                );
            }

            // -------------------------------------------------------------------------
            // BƯỚC 8: LỊCH TRỰC 7 NGÀY TỚI CHO BÁC SĨ & NHÂN SỰ + LỊCH HẸN TƯƠNG LAI
            // -------------------------------------------------------------------------
            $this->info("8. Phân bổ lịch trực 7 ngày tới (Bác sĩ, Lễ tân, CLS) và tạo lịch hẹn sắp tới...");

            $activeDoctors = [$bsNam, $bsHuong, $bsTuan, $bsLan];
            $futureCaKhamsByDoc = [];

            for ($offset = 0; $offset < 7; $offset++) {
                $shiftDate = Carbon::today()->addDays($offset);
                // Giữ nguyên lịch trực cho ngày hôm nay kể cả khi là Chủ Nhật để phục vụ demo trực quan
                if ($offset > 0 && $shiftDate->isSunday()) continue;

                // 1. Lịch làm việc và Ca khám cho 4 Bác sĩ
                foreach ($activeDoctors as $d) {
                    $docLlv = LichLamViec::updateOrCreate(
                        [
                            'MaBacSi' => $d->MaBacSi,
                            'NgayLamViec' => $shiftDate->toDateString(),
                        ],
                        [
                            'MaTaiKhoan' => $d->MaTaiKhoan,
                            'GioBatDau' => '08:00:00',
                            'GioKetThuc' => '17:00:00',
                            'SoLuongTiepNhan' => 30,
                            'TrangThai' => 'MO',
                            'LoaiCa' => 'ngay',
                        ]
                    );

                    $caS = CaKham::updateOrCreate(
                        [
                            'MaLichLamViec' => $docLlv->MaLichLamViec,
                            'GioBatDau' => '08:00:00',
                            'GioKetThuc' => '12:00:00',
                        ],
                        [
                            'SoLuongTiepNhan' => 15,
                            'TrangThai' => 'CON_TRONG',
                        ]
                    );

                    $caC = CaKham::updateOrCreate(
                        [
                            'MaLichLamViec' => $docLlv->MaLichLamViec,
                            'GioBatDau' => '13:30:00',
                            'GioKetThuc' => '17:00:00',
                        ],
                        [
                            'SoLuongTiepNhan' => 15,
                            'TrangThai' => 'CON_TRONG',
                        ]
                    );

                    $futureCaKhamsByDoc[$d->MaBacSi][$shiftDate->toDateString()] = [
                        'sang' => $caS,
                        'chieu' => $caC,
                    ];
                }

                // 2. Lịch làm việc cho Kỹ thuật viên Cận Lâm Sàng (cls_duc)
                LichLamViec::updateOrCreate(
                    [
                        'MaTaiKhoan' => $tkClsDuc->MaTaiKhoan,
                        'NgayLamViec' => $shiftDate->toDateString(),
                    ],
                    [
                        'MaBacSi' => null,
                        'GioBatDau' => '08:00:00',
                        'GioKetThuc' => '17:00:00',
                        'SoLuongTiepNhan' => 40,
                        'TrangThai' => 'MO',
                        'LoaiCa' => 'ngay',
                    ]
                );

                // 3. Lịch làm việc cho Lễ tân 1 (letan_demo) - Ca sáng
                LichLamViec::updateOrCreate(
                    [
                        'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan,
                        'NgayLamViec' => $shiftDate->toDateString(),
                    ],
                    [
                        'MaBacSi' => null,
                        'GioBatDau' => '07:30:00',
                        'GioKetThuc' => '12:30:00',
                        'SoLuongTiepNhan' => 50,
                        'TrangThai' => 'MO',
                        'LoaiCa' => 'sang',
                    ]
                );

                // 4. Lịch làm việc cho Lễ tân 2 (letan_hoa) - Ca chiều
                LichLamViec::updateOrCreate(
                    [
                        'MaTaiKhoan' => $tkRecepHoa->MaTaiKhoan,
                        'NgayLamViec' => $shiftDate->toDateString(),
                    ],
                    [
                        'MaBacSi' => null,
                        'GioBatDau' => '12:30:00',
                        'GioKetThuc' => '17:30:00',
                        'SoLuongTiepNhan' => 50,
                        'TrangThai' => 'MO',
                        'LoaiCa' => 'chieu',
                    ]
                );
            }

            // Đơn đổi ca mẫu: Lễ tân Mai (letan_demo) gửi đề xuất đổi ca cho Lễ tân Hoa
            $tomorrowStr = Carbon::today()->addDay()->toDateString();
            DonTuNhanSu::updateOrCreate(
                [
                    'MaTaiKhoan' => $tkRecepMai->MaTaiKhoan,
                    'LoaiDon' => 'DOI_CA',
                    'NgayApDung' => $tomorrowStr,
                ],
                [
                    'TaiKhoanDoiCung' => $tkRecepHoa->MaTaiKhoan,
                    'XacNhanDongNghiep' => false,
                    'SoPhutXinPhep' => 0,
                    'SoPhutDuocDuyet' => 0,
                    'LyDo' => 'Tôi có lịch thi nâng bậc nghiệp vụ, đề xuất đổi ca sáng với đồng nghiệp Hoa trực ca chiều.',
                    'TrangThai' => 'CHO_DONG_NGHIEP_XAC_NHAN',
                ]
            );

            // Tạo các lịch hẹn sắp tới trong 1 - 3 ngày tới
            // 1. Ngày mai: BN An đặt hẹn tái khám TMH tại BS Hương (ĐÃ XÁC NHẬN)
            $tmrDate = Carbon::today()->addDay()->toDateString();
            if (isset($futureCaKhamsByDoc[$bsHuong->MaBacSi][$tmrDate]['sang'])) {
                LichHen::create([
                    'MaBenhNhan' => $bnAn->MaBenhNhan,
                    'MaCaKham' => $futureCaKhamsByDoc[$bsHuong->MaBacSi][$tmrDate]['sang']->MaCaKham,
                    'LyDoKham' => 'Tái khám nội soi kiểm tra họng và theo dõi điều trị',
                    'NgayDat' => $todayDateStr,
                    'TrangThai' => 'DA_XAC_NHAN',
                ]);
            }

            // 2. Ngày kia: BN Bình đặt hẹn khám Nội tại BS Nam (CHỜ XÁC NHẬN)
            $satDate = Carbon::today()->addDays(2)->toDateString();
            if (isset($futureCaKhamsByDoc[$bsNam->MaBacSi][$satDate]['sang'])) {
                LichHen::create([
                    'MaBenhNhan' => $bnBinh->MaBenhNhan,
                    'MaCaKham' => $futureCaKhamsByDoc[$bsNam->MaBacSi][$satDate]['sang']->MaCaKham,
                    'LyDoKham' => 'Tư vấn kết quả điều trị viêm dạ dày và kiểm tra tiêu hóa định kỳ',
                    'NgayDat' => $todayDateStr,
                    'TrangThai' => 'CHO_XAC_NHAN',
                ]);
            }

            // 3. Ngày thứ 3: BN Cường đặt hẹn Nhi khoa tại BS Lan (CHỜ XÁC NHẬN)
            $monDate = Carbon::today()->addDays(3)->toDateString();
            if (isset($futureCaKhamsByDoc[$bsLan->MaBacSi][$monDate]['sang'])) {
                LichHen::create([
                    'MaBenhNhan' => $bnCuong->MaBenhNhan,
                    'MaCaKham' => $futureCaKhamsByDoc[$bsLan->MaBacSi][$monDate]['sang']->MaCaKham,
                    'LyDoKham' => 'Khám tổng quát và tư vấn dinh dưỡng cho cháu nội',
                    'NgayDat' => $todayDateStr,
                    'TrangThai' => 'CHO_XAC_NHAN',
                ]);
            }

            DB::commit();

            $this->info("\n================================================================================");
            $this->info("   KHỞI TẠO DỮ LIỆU DEMO HOÀN TẤT THÀNH CÔNG (100%)");
            $this->info("================================================================================");

            $this->table(
                ['Vai trò', 'Họ tên nhân sự / Bệnh nhân', 'Tên đăng nhập', 'Email', 'Mật khẩu', 'Ghi chú'],
                [
                    ['Quản trị viên', 'Ban Giám Đốc SmartCare', 'admin_demo', 'admin@smartcare.vn', $demoPassword, 'Xem Dashboard, Doanh thu, BHYT, Nhân sự'],
                    ['Lễ tân 1', 'Trần Thị Mai', 'letan_demo', 'letan@smartcare.vn', $demoPassword, 'Tiếp đón, BHYT, Thu tiền & Đổi ca'],
                    ['Lễ tân 2', 'Lê Thị Hoa', 'letan_hoa', 'letan.hoa@smartcare.vn', $demoPassword, 'Đồng nghiệp xác nhận đổi ca'],
                    ['Bác sĩ 1', 'BS. CK1 Trần Văn Nam', 'bacsi_nam', 'bacsi.nam@smartcare.vn', $demoPassword, 'Khoa Nội (Có BN chờ khám & BN chờ thu tiền)'],
                    ['Bác sĩ 2', 'ThS. BS Nguyễn Thu Hương', 'bacsi_huong', 'bacsi.huong@smartcare.vn', $demoPassword, 'Khoa TMH (Có ca chỉ định CLS & Lịch hẹn mai)'],
                    ['Bác sĩ 3', 'BS. CK2 Lê Anh Tuấn', 'bacsi_tuan', 'bacsi.tuan@smartcare.vn', $demoPassword, 'Khoa RHM (Có ca khám hoàn tất)'],
                    ['Bác sĩ 4', 'BS. Hoàng Mai Lan', 'bacsi_lan', 'bacsi.lan@smartcare.vn', $demoPassword, 'Khoa Nhi (Lịch trực đầy đủ & Lịch hẹn thứ Hai)'],
                    ['Cận lâm sàng', 'KTV. Phạm Minh Đức', 'cls_duc', 'cls.duc@smartcare.vn', $demoPassword, 'Lịch trực 7 ngày & Thực hiện nội soi, ECG'],
                    ['Bệnh nhân 1', 'Nguyễn Văn An (BHYT 80%)', 'benhnhan_an', 'an.nguyen@smartcare.vn', $demoPassword, 'Đang chờ khám tại BS Nam + Lịch sử khám'],
                    ['Bệnh nhân 2', 'Lê Thị Bình (BHYT 80%)', 'benhnhan_binh', 'binh.le@smartcare.vn', $demoPassword, 'Đang chờ kết quả CLS tại BS Hương + Lịch sử'],
                    ['Bệnh nhân 3', 'Trần Quốc Cường (BHYT 95%)', 'benhnhan_cuong', 'cuong.tran@smartcare.vn', $demoPassword, 'ĐÃ KHÁM XONG -> Chờ Lễ tân thu tiền BHYT'],
                    ['Bệnh nhân 4', 'Vũ Hoàng Dũng (Tự túc 0%)', 'benhnhan_dung', 'dung.vu@smartcare.vn', $demoPassword, 'Đã khám xong & đã trả tiền mặt + Lịch sử'],
                ]
            );

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("LỖI KHI KHỞI TẠO DỮ LIỆU: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}
