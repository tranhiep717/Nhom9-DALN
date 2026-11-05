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
        Schema::table('lich_lam_viec', function (Blueprint $table) {
            if (!Schema::hasColumn('lich_lam_viec', 'LoaiCa')) {
                $table->string('LoaiCa', 20)->default('custom')->after('NgayLamViec');
            }
        });

        // Dùng cho truy vấn nhanh theo ngày làm việc của bác sĩ
        Schema::table('lich_lam_viec', function (Blueprint $table) {
            $table->index(['MaBacSi', 'NgayLamViec'], 'idx_lich_lam_viec_doctor_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lich_lam_viec', function (Blueprint $table) {
            $table->dropIndex('idx_lich_lam_viec_doctor_date');
        });

        Schema::table('lich_lam_viec', function (Blueprint $table) {
            if (Schema::hasColumn('lich_lam_viec', 'LoaiCa')) {
                $table->dropColumn('LoaiCa');
            }
        });
    }
};
