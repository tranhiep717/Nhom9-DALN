<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class KiemTraModel extends Command
{
    protected $signature = 'kiemtra:model';
    protected $description = 'Kiểm tra cấu hình 20 Model: bảng, khóa chính, số bản ghi, và danh sách cột thực tế';

    // Danh sách 20 Model cần kiểm tra
    protected array $models = [
        \App\Models\TaiKhoan::class,
        \App\Models\VaiTro::class,
        \App\Models\BenhNhan::class,
        \App\Models\BacSi::class,
        \App\Models\ChuyenKhoa::class,
        \App\Models\LichLamViec::class,
        \App\Models\CaKham::class,
        \App\Models\LichHen::class,
        \App\Models\LuotKham::class,
        \App\Models\PhieuKham::class,
        \App\Models\DonThuoc::class,
        \App\Models\ChiTietDonThuoc::class,
        \App\Models\Thuoc::class,
        \App\Models\DichVu::class,
        \App\Models\ChiDinhDichVu::class,
        \App\Models\HoaDon::class,
        \App\Models\ChiTietHoaDon::class,
        \App\Models\ThanhToan::class,
        \App\Models\HoiThoaiAi::class,
        \App\Models\TinNhanAi::class,
    ];

    public function handle(): void
    {
        $this->info('');
        $this->info('================================================================');
        $this->info('  KIỂM TRA 20 MODEL - PHÒNG KHÁM THÔNG MINH');
        $this->info('================================================================');
        $this->info('');

        // Bước 1: Kiểm tra kết nối DB
        try {
            DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();
            $this->info("✅ Kết nối MySQL thành công → Database: {$dbName}");
        } catch (\Exception $e) {
            $this->error('❌ Kết nối MySQL THẤT BẠI: ' . $e->getMessage());
            return;
        }

        $this->info('');
        $this->line(str_repeat('─', 68));
        $this->info('  PHẦN 1: CẤU HÌNH MODEL vs BẢN GHI TRONG DATABASE');
        $this->line(str_repeat('─', 68));

        $pass = 0;
        $fail = 0;
        $fillableMismatches = [];

        foreach ($this->models as $modelClass) {
            $shortName = class_basename($modelClass);
            $instance  = new $modelClass();
            $table     = $instance->getTable();
            $pk        = $instance->getKeyName();
            $timestamps = $instance->usesTimestamps();

            // Kiểm tra bảng tồn tại
            $tableExists = Schema::hasTable($table);

            if (!$tableExists) {
                $this->error("  ❌ {$shortName} → bảng [{$table}] KHÔNG TỒN TẠI trong DB");
                $fail++;
                continue;
            }

            // Đếm bản ghi
            try {
                $count = $modelClass::count();
                $countStr = "{$count} bản ghi";
            } catch (\Exception $e) {
                $countStr = "Lỗi đếm: " . $e->getMessage();
            }

            // Lấy danh sách cột thực tế từ DB
            $dbColumns = Schema::getColumnListing($table);

            // Đối chiếu $fillable với cột thực tế
            $fillable = $instance->getFillable();
            $missingInDb = array_diff($fillable, $dbColumns);

            $status = $tableExists ? '✅' : '❌';
            $tsStatus = $timestamps ? '⚠️  có timestamps' : 'false ✓';

            $this->line('');
            $this->info("  {$status} {$shortName}");
            $this->line("     Bảng      : {$table}");
            $this->line("     Khóa chính: {$pk}");
            $this->line("     timestamps: {$tsStatus}");
            $this->line("     Bản ghi   : {$countStr}");
            $this->line("     Cột DB    : " . implode(', ', $dbColumns));
            $this->line("     \$fillable : " . implode(', ', $fillable));

            if (!empty($missingInDb)) {
                $this->warn("     ⚠️  Cột trong \$fillable KHÔNG CÓ trong DB: " . implode(', ', $missingInDb));
                $fillableMismatches[$shortName] = $missingInDb;
            } else {
                $this->line("     Đối chiếu : Tất cả cột fillable đều có trong DB ✓");
            }

            $pass++;
        }

        $this->info('');
        $this->line(str_repeat('─', 68));
        $this->info("  Kết quả Phần 1: {$pass} Model OK, {$fail} Model lỗi bảng");
        $this->line(str_repeat('─', 68));

        // Phần 2: Kiểm tra quan hệ
        $this->info('');
        $this->line(str_repeat('─', 68));
        $this->info('  PHẦN 2: KIỂM TRA QUAN HỆ ELOQUENT');
        $this->line(str_repeat('─', 68));
        $this->info('');

        $relations = [
            // [Model, method quan hệ, mô tả]
            [\App\Models\TaiKhoan::class,      'vaiTro',          'TaiKhoan → VaiTro (belongsTo)'],
            [\App\Models\TaiKhoan::class,      'benhNhan',        'TaiKhoan → BenhNhan (hasOne)'],
            [\App\Models\TaiKhoan::class,      'bacSi',           'TaiKhoan → BacSi (hasOne)'],
            [\App\Models\VaiTro::class,        'taiKhoans',       'VaiTro → TaiKhoan (hasMany)'],
            [\App\Models\BenhNhan::class,      'taiKhoan',        'BenhNhan → TaiKhoan (belongsTo)'],
            [\App\Models\BenhNhan::class,      'lichHens',        'BenhNhan → LichHen (hasMany)'],
            [\App\Models\BenhNhan::class,      'luotKhams',       'BenhNhan → LuotKham (hasMany)'],
            [\App\Models\BenhNhan::class,      'hoiThoaiAis',     'BenhNhan → HoiThoaiAi (hasMany)'],
            [\App\Models\BacSi::class,         'taiKhoan',        'BacSi → TaiKhoan (belongsTo)'],
            [\App\Models\BacSi::class,         'chuyenKhoa',      'BacSi → ChuyenKhoa (belongsTo)'],
            [\App\Models\BacSi::class,         'lichLamViecs',    'BacSi → LichLamViec (hasMany)'],
            [\App\Models\BacSi::class,         'luotKhams',       'BacSi → LuotKham (hasMany)'],
            [\App\Models\BacSi::class,         'donThuocs',       'BacSi → DonThuoc (hasMany)'],
            [\App\Models\BacSi::class,         'chiDinhDichVus',  'BacSi → ChiDinhDichVu (hasMany)'],
            [\App\Models\ChuyenKhoa::class,    'bacSis',          'ChuyenKhoa → BacSi (hasMany)'],
            [\App\Models\LichLamViec::class,   'bacSi',           'LichLamViec → BacSi (belongsTo)'],
            [\App\Models\LichLamViec::class,   'caKhams',         'LichLamViec → CaKham (hasMany)'],
            [\App\Models\CaKham::class,        'lichLamViec',     'CaKham → LichLamViec (belongsTo)'],
            [\App\Models\CaKham::class,        'lichHens',        'CaKham → LichHen (hasMany)'],
            [\App\Models\LichHen::class,       'benhNhan',        'LichHen → BenhNhan (belongsTo)'],
            [\App\Models\LichHen::class,       'caKham',          'LichHen → CaKham (belongsTo)'],
            [\App\Models\LichHen::class,       'luotKham',        'LichHen → LuotKham (hasOne)'],
            [\App\Models\LuotKham::class,      'lichHen',         'LuotKham → LichHen (belongsTo)'],
            [\App\Models\LuotKham::class,      'benhNhan',        'LuotKham → BenhNhan (belongsTo)'],
            [\App\Models\LuotKham::class,      'bacSi',           'LuotKham → BacSi (belongsTo)'],
            [\App\Models\LuotKham::class,      'phieuKham',       'LuotKham → PhieuKham (hasOne)'],
            [\App\Models\LuotKham::class,      'donThuoc',        'LuotKham → DonThuoc (hasOne)'],
            [\App\Models\LuotKham::class,      'hoaDon',          'LuotKham → HoaDon (hasOne)'],
            [\App\Models\LuotKham::class,      'chiDinhDichVus',  'LuotKham → ChiDinhDichVu (hasMany)'],
            [\App\Models\PhieuKham::class,     'luotKham',        'PhieuKham → LuotKham (belongsTo)'],
            [\App\Models\DonThuoc::class,      'luotKham',        'DonThuoc → LuotKham (belongsTo)'],
            [\App\Models\DonThuoc::class,      'bacSi',           'DonThuoc → BacSi (belongsTo)'],
            [\App\Models\DonThuoc::class,      'chiTietDonThuocs','DonThuoc → ChiTietDonThuoc (hasMany)'],
            [\App\Models\ChiTietDonThuoc::class,'donThuoc',       'ChiTietDonThuoc → DonThuoc (belongsTo)'],
            [\App\Models\ChiTietDonThuoc::class,'thuoc',          'ChiTietDonThuoc → Thuoc (belongsTo)'],
            [\App\Models\Thuoc::class,         'chiTietDonThuocs','Thuoc → ChiTietDonThuoc (hasMany)'],
            [\App\Models\DichVu::class,        'chiDinhDichVus',  'DichVu → ChiDinhDichVu (hasMany)'],
            [\App\Models\ChiDinhDichVu::class, 'luotKham',        'ChiDinhDichVu → LuotKham (belongsTo)'],
            [\App\Models\ChiDinhDichVu::class, 'dichVu',          'ChiDinhDichVu → DichVu (belongsTo)'],
            [\App\Models\ChiDinhDichVu::class, 'bacSi',           'ChiDinhDichVu → BacSi (belongsTo)'],
            [\App\Models\ChiDinhDichVu::class, 'chiTietHoaDons',  'ChiDinhDichVu → ChiTietHoaDon (hasMany)'],
            [\App\Models\HoaDon::class,        'luotKham',        'HoaDon → LuotKham (belongsTo)'],
            [\App\Models\HoaDon::class,        'chiTietHoaDons',  'HoaDon → ChiTietHoaDon (hasMany)'],
            [\App\Models\HoaDon::class,        'thanhToans',      'HoaDon → ThanhToan (hasMany)'],
            [\App\Models\ChiTietHoaDon::class, 'hoaDon',          'ChiTietHoaDon → HoaDon (belongsTo)'],
            [\App\Models\ChiTietHoaDon::class, 'chiDinhDichVu',   'ChiTietHoaDon → ChiDinhDichVu (belongsTo)'],
            [\App\Models\ChiTietHoaDon::class, 'chiTietDonThuoc', 'ChiTietHoaDon → ChiTietDonThuoc (belongsTo)'],
            [\App\Models\ThanhToan::class,     'hoaDon',          'ThanhToan → HoaDon (belongsTo)'],
            [\App\Models\HoiThoaiAi::class,    'benhNhan',        'HoiThoaiAi → BenhNhan (belongsTo)'],
            [\App\Models\HoiThoaiAi::class,    'tinNhanAis',      'HoiThoaiAi → TinNhanAi (hasMany)'],
            [\App\Models\TinNhanAi::class,     'hoiThoaiAi',      'TinNhanAi → HoiThoaiAi (belongsTo)'],
        ];

        $relPass = 0;
        $relFail = 0;

        foreach ($relations as [$modelClass, $method, $desc]) {
            try {
                $instance = new $modelClass();
                // Gọi method để lấy Eloquent Relation object (không thực thi query)
                $relation = $instance->{$method}();
                $relClass = class_basename(get_class($relation));
                $fk       = $relation->getForeignKeyName();
                $this->line("  ✅ {$desc}");
                $this->line("       Loại: {$relClass} | FK: {$fk}");
                $relPass++;
            } catch (\Exception $e) {
                $this->error("  ❌ {$desc}");
                $this->error("       Lỗi: " . $e->getMessage());
                $relFail++;
            }
        }

        $this->info('');
        $this->line(str_repeat('─', 68));
        $this->info("  Kết quả Phần 2: {$relPass} quan hệ OK, {$relFail} quan hệ lỗi");
        $this->line(str_repeat('─', 68));

        // Tổng kết
        $this->info('');
        $this->line(str_repeat('═', 68));
        $this->info("  TỔNG KẾT");
        $this->info("  Model hợp lệ : {$pass}/20");
        $this->info("  Quan hệ OK   : {$relPass}/" . count($relations));
        if (!empty($fillableMismatches)) {
            $this->warn('');
            $this->warn('  ⚠️  Cần cập nhật $fillable cho các Model sau:');
            foreach ($fillableMismatches as $model => $cols) {
                $this->warn("     {$model}: " . implode(', ', $cols));
            }
        }
        $this->line(str_repeat('═', 68));
        $this->info('');
    }
}
