<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Luot kham: nguoi tiep nhan tai sanh
        Schema::table('luot_kham', function (Blueprint $table) {
            if (!Schema::hasColumn('luot_kham', 'MaTaiKhoanTiepNhan')) {
                $table->integer('MaTaiKhoanTiepNhan')->nullable()->after('MaBacSi');
            }
        });

        // 2. Hoa don: nguoi lap/thu tien
        Schema::table('hoa_don', function (Blueprint $table) {
            if (!Schema::hasColumn('hoa_don', 'MaTaiKhoanThu')) {
                $table->integer('MaTaiKhoanThu')->nullable()->after('TrangThai');
            }
        });

        // 3. Thanh toan: thu ngan xac nhan giao dich
        Schema::table('thanh_toan', function (Blueprint $table) {
            if (!Schema::hasColumn('thanh_toan', 'MaTaiKhoanThu')) {
                $table->integer('MaTaiKhoanThu')->nullable()->after('TrangThai');
            }
        });

        // 4. Lich lam viec: ho tro xep lich nhan vien CLS & Le Tan
        Schema::table('lich_lam_viec', function (Blueprint $table) {
            if (!Schema::hasColumn('lich_lam_viec', 'MaTaiKhoan')) {
                $table->integer('MaTaiKhoan')->nullable()->after('MaBacSi');
            }
        });

        try {
            DB::statement("ALTER TABLE `lich_lam_viec` MODIFY `MaBacSi` INT NULL");
        } catch (\Throwable $e) {
            // Bo qua neu da nullable
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('luot_kham', function (Blueprint $table) {
            if (Schema::hasColumn('luot_kham', 'MaTaiKhoanTiepNhan')) {
                $table->dropColumn('MaTaiKhoanTiepNhan');
            }
        });

        Schema::table('hoa_don', function (Blueprint $table) {
            if (Schema::hasColumn('hoa_don', 'MaTaiKhoanThu')) {
                $table->dropColumn('MaTaiKhoanThu');
            }
        });

        Schema::table('thanh_toan', function (Blueprint $table) {
            if (Schema::hasColumn('thanh_toan', 'MaTaiKhoanThu')) {
                $table->dropColumn('MaTaiKhoanThu');
            }
        });

        Schema::table('lich_lam_viec', function (Blueprint $table) {
            if (Schema::hasColumn('lich_lam_viec', 'MaTaiKhoan')) {
                $table->dropColumn('MaTaiKhoan');
            }
        });
    }
};
