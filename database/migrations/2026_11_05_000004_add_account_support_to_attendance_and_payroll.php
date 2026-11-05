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
        // 1. Cap nhat bang cham_cong: ho tro MaTaiKhoan va cho phep MaBacSi nullable
        Schema::table('cham_cong', function (Blueprint $table) {
            if (!Schema::hasColumn('cham_cong', 'MaTaiKhoan')) {
                $table->unsignedBigInteger('MaTaiKhoan')->nullable()->after('MaBacSi');
                $table->index(['MaTaiKhoan', 'NgayChamCong'], 'cham_cong_taikhoan_ngay_index');
            }
        });

        try {
            DB::statement("ALTER TABLE `cham_cong` MODIFY `MaBacSi` BIGINT UNSIGNED NULL");
        } catch (\Throwable $e) {
            // Bo qua neu da nullable hoac dang dung SQLite
        }

        // 2. Cap nhat bang bang_luong: ho tro MaTaiKhoan va cho phep MaBacSi nullable
        Schema::table('bang_luong', function (Blueprint $table) {
            if (!Schema::hasColumn('bang_luong', 'MaTaiKhoan')) {
                $table->unsignedBigInteger('MaTaiKhoan')->nullable()->after('MaBacSi');
                $table->index(['MaTaiKhoan', 'ThangNam'], 'bang_luong_taikhoan_thang_index');
            }
        });

        try {
            DB::statement("ALTER TABLE `bang_luong` MODIFY `MaBacSi` BIGINT UNSIGNED NULL");
        } catch (\Throwable $e) {
            // Bo qua neu da nullable hoac dang dung SQLite
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cham_cong', function (Blueprint $table) {
            if (Schema::hasColumn('cham_cong', 'MaTaiKhoan')) {
                $table->dropIndex('cham_cong_taikhoan_ngay_index');
                $table->dropColumn('MaTaiKhoan');
            }
        });

        Schema::table('bang_luong', function (Blueprint $table) {
            if (Schema::hasColumn('bang_luong', 'MaTaiKhoan')) {
                $table->dropIndex('bang_luong_taikhoan_thang_index');
                $table->dropColumn('MaTaiKhoan');
            }
        });
    }
};
