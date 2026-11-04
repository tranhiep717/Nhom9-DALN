<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Nâng cấp bảng phieu_kham với hai giai đoạn chẩn đoán
        Schema::table('phieu_kham', function (Blueprint $table) {
            if (!Schema::hasColumn('phieu_kham', 'ChanDoanBanDau')) {
                $table->text('ChanDoanBanDau')->nullable()->after('ChanDoan');
            }
            if (!Schema::hasColumn('phieu_kham', 'ChanDoanSauCLS')) {
                $table->text('ChanDoanSauCLS')->nullable()->after('ChanDoanBanDau');
            }
            if (!Schema::hasColumn('phieu_kham', 'KetLuan')) {
                $table->text('KetLuan')->nullable()->after('ChanDoanSauCLS');
            }
            if (!Schema::hasColumn('phieu_kham', 'TienSuBenh')) {
                $table->text('TienSuBenh')->nullable()->after('KetQuaKham');
            }
            if (!Schema::hasColumn('phieu_kham', 'GhiChu')) {
                $table->text('GhiChu')->nullable()->after('LoiDanBacSi');
            }
        });

        // 2. Nâng cấp bảng chi_dinh_dich_vu liên kết trực tiếp với phieu_kham
        Schema::table('chi_dinh_dich_vu', function (Blueprint $table) {
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'MaPhieuKham')) {
                $table->integer('MaPhieuKham')->unsigned()->nullable()->after('MaLuotKham')->index();
            }
        });

        // 3. Đồng bộ dữ liệu hiện có (backfill an toàn)
        DB::statement("
            UPDATE phieu_kham 
            SET ChanDoanBanDau = ChanDoan 
            WHERE ChanDoanBanDau IS NULL AND ChanDoan IS NOT NULL
        ");

        DB::statement("
            UPDATE chi_dinh_dich_vu c
            JOIN phieu_kham p ON c.MaLuotKham = p.MaLuotKham
            SET c.MaPhieuKham = p.MaPhieuKham
            WHERE c.MaPhieuKham IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('phieu_kham', function (Blueprint $table) {
            $cols = ['ChanDoanBanDau', 'ChanDoanSauCLS', 'KetLuan', 'TienSuBenh', 'GhiChu'];
            foreach ($cols as $c) {
                if (Schema::hasColumn('phieu_kham', $c)) {
                    $table->dropColumn($c);
                }
            }
        });

        Schema::table('chi_dinh_dich_vu', function (Blueprint $table) {
            if (Schema::hasColumn('chi_dinh_dich_vu', 'MaPhieuKham')) {
                $table->dropColumn('MaPhieuKham');
            }
        });
    }
};
