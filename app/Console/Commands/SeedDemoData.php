<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

class SeedDemoData extends Command
{
    protected $signature = 'smartcare:seed-demo {--force : Cho phép chạy trên môi trường production}';
    protected $description = 'Khởi tạo bộ dữ liệu và tài khoản demo chuẩn cho hội đồng nghiệm thu SmartCare';

    public function handle()
    {
        if (app()->environment('production') && !$this->option('force')) {
            $this->error("LƯU Ý AN TOÀN: Không được tự ý nạp tài khoản demo trên môi trường PRODUCTION. Sử dụng cờ --force nếu bạn thực sự muốn tiếp tục.");
            return 1;
        }
        $this->info("================================================================================");
        $this->info("   KHỞI TẠO BỘ DỮ LIỆU & TÀI KHOẢN DEMO SMARTCARE (GIAI ĐOẠN 6)");
        $this->info("================================================================================");

        $demoPassword = env('DEMO_PASSWORD', 'SmartCare@2026');
        $hashedPass = Hash::make($demoPassword);

        // 1. Kiểm tra các vai trò cốt lõi
        $vtAdmin = VaiTro::firstOrCreate(['TenVaiTro' => 'QUAN_TRI_VIEN'], ['MoTa' => 'Quản trị viên hệ thống']);
        $vtDoc   = VaiTro::firstOrCreate(['TenVaiTro' => 'BAC_SI'], ['MoTa' => 'Bác sĩ khám và điều trị']);
        $vtRecep = VaiTro::firstOrCreate(['TenVaiTro' => 'LE_TAN'], ['MoTa' => 'Lễ tân tiếp nhận và điều phối']);
        $vtPat   = VaiTro::firstOrCreate(['TenVaiTro' => 'BENH_NHAN'], ['MoTa' => 'Bệnh nhân sử dụng dịch vụ']);

        // 2. Chuyên khoa Demo
        $ckNoi = ChuyenKhoa::firstOrCreate(
            ['TenChuyenKhoa' => 'Nội Tổng Quát'],
            ['MoTa' => 'Khám và điều trị các bệnh lý nội khoa người lớn', 'TrangThai' => 'HOAT_DONG']
        );
        $ckTMH = ChuyenKhoa::firstOrCreate(
            ['TenChuyenKhoa' => 'Tai Mũi Họng'],
            ['MoTa' => 'Khám và nội soi các bệnh lý tai, mũi, họng', 'TrangThai' => 'HOAT_DONG']
        );
        $ckRHM = ChuyenKhoa::firstOrCreate(
            ['TenChuyenKhoa' => 'Răng Hàm Mặt'],
            ['MoTa' => 'Khám nha khoa tổng quát và phục hình răng', 'TrangThai' => 'HOAT_DONG']
        );
        $this->info("-> Đã chuẩn bị 3 Chuyên khoa mẫu: Nội Tổng Quát, Tai Mũi Họng, Răng Hàm Mặt.");

        // 3. Tài khoản và Hồ sơ Bác sĩ Demo
        $tkDoc = TaiKhoan::updateOrCreate(
            ['Email' => 'bacsi.nam@smartcare.vn'],
            [
                'TenDangNhap' => 'bacsi_nam',
                'MatKhau' => $hashedPass,
                'MaVaiTro' => $vtDoc->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]
        );
        $doc = BacSi::updateOrCreate(
            ['MaTaiKhoan' => $tkDoc->MaTaiKhoan],
            [
                'HoTen' => 'BS. CK1 Trần Văn Nam',
                'MaChuyenKhoa' => $ckNoi->MaChuyenKhoa,
                'HocVi' => 'Bác sĩ Chuyên khoa 1',
                'GiaKham' => 150000,
                'SoDienThoai' => '0988112233',
                'EmailLienHe' => 'bacsi.nam@smartcare.vn',
                'TrangThai' => 'HOAT_DONG',
            ]
        );
        $this->info("-> Đã chuẩn bị Bác sĩ Demo: {$doc->HoTen} ({$tkDoc->Email}).");

        // 4. Lịch làm việc & Ca khám Demo cho hôm nay và ngày mai
        $today = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();

        foreach ([$today, $tomorrow] as $date) {
            $lich = LichLamViec::firstOrCreate(
                ['MaBacSi' => $doc->MaBacSi, 'NgayLamViec' => $date],
                [
                    'GioBatDau' => '07:30:00',
                    'GioKetThuc' => '17:30:00',
                    'SoLuongTiepNhan' => 20,
                    'TrangThai' => 'MO',
                ]
            );

            // Ca sáng
            CaKham::firstOrCreate(
                ['MaLichLamViec' => $lich->MaLichLamViec, 'GioBatDau' => '08:00:00', 'GioKetThuc' => '09:30:00'],
                ['SoLuongTiepNhan' => 5, 'TrangThai' => 'CON_TRONG']
            );
            CaKham::firstOrCreate(
                ['MaLichLamViec' => $lich->MaLichLamViec, 'GioBatDau' => '09:30:00', 'GioKetThuc' => '11:30:00'],
                ['SoLuongTiepNhan' => 5, 'TrangThai' => 'CON_TRONG']
            );
            // Ca chiều
            CaKham::firstOrCreate(
                ['MaLichLamViec' => $lich->MaLichLamViec, 'GioBatDau' => '13:30:00', 'GioKetThuc' => '15:00:00'],
                ['SoLuongTiepNhan' => 5, 'TrangThai' => 'CON_TRONG']
            );
            CaKham::firstOrCreate(
                ['MaLichLamViec' => $lich->MaLichLamViec, 'GioBatDau' => '15:00:00', 'GioKetThuc' => '17:00:00'],
                ['SoLuongTiepNhan' => 5, 'TrangThai' => 'CON_TRONG']
            );
        }
        $this->info("-> Đã mở các Ca khám sáng/chiều khả dụng cho ngày hôm nay ({$today}) và ngày mai ({$tomorrow}).");

        // 5. Bệnh nhân Demo
        // Bệnh nhân 1: Nguyễn Văn An
        $tkBn1 = TaiKhoan::updateOrCreate(
            ['Email' => 'benhnhan.an@smartcare.vn'],
            [
                'TenDangNhap' => 'benhnhan_an',
                'MatKhau' => $hashedPass,
                'MaVaiTro' => $vtPat->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]
        );
        $bn1 = BenhNhan::updateOrCreate(
            ['MaTaiKhoan' => $tkBn1->MaTaiKhoan],
            [
                'HoTen' => 'Nguyễn Văn An',
                'NgaySinh' => '1990-03-12',
                'GioiTinh' => 'NAM',
                'SoDienThoai' => '0901234567',
                'DiaChi' => 'Ba Đình, Hà Nội',
                'SoBHYT' => 'DN4010120199999',
            ]
        );

        // Bệnh nhân 2: Lê Thị Bình
        $tkBn2 = TaiKhoan::updateOrCreate(
            ['Email' => 'benhnhan.binh@smartcare.vn'],
            [
                'TenDangNhap' => 'benhnhan_binh',
                'MatKhau' => $hashedPass,
                'MaVaiTro' => $vtPat->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]
        );
        $bn2 = BenhNhan::updateOrCreate(
            ['MaTaiKhoan' => $tkBn2->MaTaiKhoan],
            [
                'HoTen' => 'Lê Thị Bình',
                'NgaySinh' => '1995-07-25',
                'GioiTinh' => 'NU',
                'SoDienThoai' => '0907654321',
                'DiaChi' => 'Đống Đa, Hà Nội',
                'SoBHYT' => 'GD4010120288888',
            ]
        );
        $this->info("-> Đã chuẩn bị 2 Bệnh nhân Demo: {$bn1->HoTen} và {$bn2->HoTen}.");

        // 6. Lễ tân Demo
        $tkRecep = TaiKhoan::updateOrCreate(
            ['Email' => 'letan@smartcare.vn'],
            [
                'TenDangNhap' => 'letan_demo',
                'MatKhau' => $hashedPass,
                'MaVaiTro' => $vtRecep->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]
        );
        $this->info("-> Đã chuẩn bị Lễ tân Demo: {$tkRecep->Email} (username: {$tkRecep->TenDangNhap}).");

        // 7. Quản trị viên Demo
        $tkAdmin = TaiKhoan::updateOrCreate(
            ['Email' => 'admin@smartcare.vn'],
            [
                'TenDangNhap' => 'admin_demo',
                'MatKhau' => $hashedPass,
                'MaVaiTro' => $vtAdmin->MaVaiTro,
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]
        );
        $this->info("-> Đã chuẩn bị Quản trị viên Demo: {$tkAdmin->Email} (username: {$tkAdmin->TenDangNhap}).");

        // 8. Danh mục Thuốc tồn kho lớn
        $thuocs = [
            ['TenThuoc' => 'Paracetamol 500mg', 'HoatChat' => 'Paracetamol', 'DonViTinh' => 'Viên', 'DonGia' => 2000, 'SoLuongTon' => 500],
            ['TenThuoc' => 'Amoxicillin 500mg', 'HoatChat' => 'Amoxicillin Trihydrate', 'DonViTinh' => 'Viên', 'DonGia' => 4500, 'SoLuongTon' => 300],
            ['TenThuoc' => 'Vitamin C 500mg', 'HoatChat' => 'Acid Ascorbic', 'DonViTinh' => 'Viên', 'DonGia' => 1500, 'SoLuongTon' => 400],
            ['TenThuoc' => 'Men vi sinh Bioflora 250mg', 'HoatChat' => 'Saccharomyces boulardii', 'DonViTinh' => 'Gói', 'DonGia' => 7000, 'SoLuongTon' => 200],
        ];
        foreach ($thuocs as $t) {
            Thuoc::updateOrCreate(
                ['TenThuoc' => $t['TenThuoc']],
                [
                    'HoatChat' => $t['HoatChat'],
                    'DonViTinh' => $t['DonViTinh'],
                    'DonGia' => $t['DonGia'],
                    'SoLuongTon' => $t['SoLuongTon'],
                    'TrangThai' => 'HOAT_DONG',
                ]
            );
        }
        $this->info("-> Đã chuẩn bị 4 loại thuốc tồn kho dồi dào phục vụ kê đơn.");

        // 9. Danh mục Dịch vụ khám & Cận lâm sàng
        $dichVus = [
            ['TenDichVu' => 'Khám Nội Tổng Quát', 'DonGia' => 150000, 'LoaiDichVu' => 'KHAM'],
            ['TenDichVu' => 'Xét nghiệm Tổng phân tích tế bào máu ngoại vi', 'DonGia' => 180000, 'LoaiDichVu' => 'XET_NGHIEM'],
            ['TenDichVu' => 'Chụp X-Quang Ngực Thẳng KTS', 'DonGia' => 250000, 'LoaiDichVu' => 'CHAN_DOAN_HINH_ANH'],
            ['TenDichVu' => 'Siêu âm Ổ bụng Tổng quát', 'DonGia' => 200000, 'LoaiDichVu' => 'CHAN_DOAN_HINH_ANH'],
        ];
        foreach ($dichVus as $dv) {
            DichVu::updateOrCreate(
                ['TenDichVu' => $dv['TenDichVu']],
                [
                    'DonGia' => $dv['DonGia'],
                    'LoaiDichVu' => $dv['LoaiDichVu'],
                    'TrangThai' => 'HOAT_DONG',
                ]
            );
        }
        $this->info("-> Đã chuẩn bị 4 Dịch vụ khám & Cận lâm sàng.");

        // 10. Tạo 1 Lịch hẹn mẫu (chờ duyệt) và 1 Lượt khám mẫu (chờ khám)
        $caKhamToday = CaKham::whereHas('lichLamViec', fn($q) => $q->where('NgayLamViec', $today)->where('MaBacSi', $doc->MaBacSi))->first();
        if ($caKhamToday) {
            $sampleApp = LichHen::firstOrCreate(
                ['MaCaKham' => $caKhamToday->MaCaKham, 'MaBenhNhan' => $bn2->MaBenhNhan],
                [
                    'NgayDat' => now(),
                    'TrangThai' => 'CHO_XAC_NHAN',
                    'LyDoKham' => 'Kiểm tra sức khỏe định kỳ và tư vấn huyết áp',
                ]
            );

            // Tạo lượt khám mẫu cho BN1 ở trạng thái CHO_KHAM
            LuotKham::firstOrCreate(
                ['MaBenhNhan' => $bn1->MaBenhNhan, 'MaBacSi' => $doc->MaBacSi, 'TrangThai' => 'CHO_KHAM'],
                [
                    'ThoiGianTiepNhan' => now(),
                    'LyDoKham' => 'Đau rát họng, ho khan về đêm',
                ]
            );
        }

        $this->info("\n================================================================================");
        $this->info("   BẢNG TÀI KHOẢN ĐĂNG NHẬP DEMO (MẬT KHẨU CHUNG: {$demoPassword})");
        $this->info("================================================================================");
        $this->table(
            ['Vai trò', 'Họ tên hiển thị', 'Tên đăng nhập', 'Email', 'Mật khẩu'],
            [
                ['Quản trị viên', 'Ban Giám Đốc / Admin', 'admin_demo', 'admin@smartcare.vn', $demoPassword],
                ['Lễ tân', 'Lễ tân Tiếp đón', 'letan_demo', 'letan@smartcare.vn', $demoPassword],
                ['Bác sĩ', 'BS. CK1 Trần Văn Nam', 'bacsi_nam', 'bacsi.nam@smartcare.vn', $demoPassword],
                ['Bệnh nhân 1', 'Nguyễn Văn An', 'benhnhan_an', 'benhnhan.an@smartcare.vn', $demoPassword],
                ['Bệnh nhân 2', 'Lê Thị Bình', 'benhnhan_binh', 'benhnhan.binh@smartcare.vn', $demoPassword],
            ]
        );

        $this->info("\n-> Khởi tạo dữ liệu demo hoàn tất thành công 100%!");
        return 0;
    }
}
