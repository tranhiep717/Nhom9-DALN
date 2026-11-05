<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Thêm cột BHYT vào bảng benh_nhan
        Schema::table('benh_nhan', function (Blueprint $table) {
            if (!Schema::hasColumn('benh_nhan', 'SoTheBHYT')) {
                $table->string('SoTheBHYT', 15)->nullable()->after('SoDienThoai');
            }
            if (!Schema::hasColumn('benh_nhan', 'MucHuongBHYT')) {
                $table->unsignedTinyInteger('MucHuongBHYT')->default(0)->after('SoTheBHYT')->comment('Mức hưởng BHYT: 0, 80, 95, 100%');
            }
        });

        // 2. Thêm cột BHYT vào bảng luot_kham (Lưu snapshot cho từng ca khám)
        Schema::table('luot_kham', function (Blueprint $table) {
            if (!Schema::hasColumn('luot_kham', 'CoBHYT')) {
                $table->boolean('CoBHYT')->default(false)->after('TrangThai');
            }
            if (!Schema::hasColumn('luot_kham', 'SoTheBHYT')) {
                $table->string('SoTheBHYT', 15)->nullable()->after('CoBHYT');
            }
            if (!Schema::hasColumn('luot_kham', 'MucHuongBHYT')) {
                $table->unsignedTinyInteger('MucHuongBHYT')->default(0)->after('SoTheBHYT');
            }
            if (!Schema::hasColumn('luot_kham', 'TuyenKCB')) {
                $table->string('TuyenKCB', 20)->default('KHONG_BHYT')->after('MucHuongBHYT')->comment('DUNG_TUYEN, TRAI_TUYEN, KHONG_BHYT');
            }
        });

        // 3. Phân loại danh mục BHYT trong bảng thuốc
        Schema::table('thuoc', function (Blueprint $table) {
            if (!Schema::hasColumn('thuoc', 'ApDungBHYT')) {
                $table->boolean('ApDungBHYT')->default(true)->after('DonGia')->comment('1 = Nằm trong danh mục BHYT, 0 = Tự túc');
            }
        });

        // 4. Phân loại danh mục BHYT trong bảng dịch vụ
        Schema::table('dich_vu', function (Blueprint $table) {
            if (!Schema::hasColumn('dich_vu', 'ApDungBHYT')) {
                $table->boolean('ApDungBHYT')->default(true)->after('DonGia')->comment('1 = Nằm trong danh mục BHYT, 0 = Tự túc');
            }
        });

        // 5. Thêm chi tiết phân bổ BHYT vào bảng chi_tiet_hoa_don
        Schema::table('chi_tiet_hoa_don', function (Blueprint $table) {
            if (!Schema::hasColumn('chi_tiet_hoa_don', 'DuocBHYTChiTra')) {
                $table->boolean('DuocBHYTChiTra')->default(false)->after('DonGia');
            }
            if (!Schema::hasColumn('chi_tiet_hoa_don', 'TienBHYTChiTra')) {
                $table->decimal('TienBHYTChiTra', 12, 2)->default(0)->after('DuocBHYTChiTra');
            }
            if (!Schema::hasColumn('chi_tiet_hoa_don', 'TienBenhNhanChiTra')) {
                $table->decimal('TienBenhNhanChiTra', 12, 2)->default(0)->after('TienBHYTChiTra');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chi_tiet_hoa_don', function (Blueprint $table) {
            $table->dropColumn(['DuocBHYTChiTra', 'TienBHYTChiTra', 'TienBenhNhanChiTra']);
        });

        Schema::table('dich_vu', function (Blueprint $table) {
            $table->dropColumn(['ApDungBHYT']);
        });

        Schema::table('thuoc', function (Blueprint $table) {
            $table->dropColumn(['ApDungBHYT']);
        });

        Schema::table('luot_kham', function (Blueprint $table) {
            $table->dropColumn(['CoBHYT', 'SoTheBHYT', 'MucHuongBHYT', 'TuyenKCB']);
        });

        Schema::table('benh_nhan', function (Blueprint $table) {
            $table->dropColumn(['SoTheBHYT', 'MucHuongBHYT']);
        });
    }
};
