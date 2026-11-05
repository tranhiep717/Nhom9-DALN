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
        Schema::table('don_tu_nhan_su', function (Blueprint $table) {
            if (!Schema::hasColumn('don_tu_nhan_su', 'XacNhanDongNghiep')) {
                $table->boolean('XacNhanDongNghiep')->default(false)->after('TrangThai');
            }
            if (!Schema::hasColumn('don_tu_nhan_su', 'NgayDongNghiepXacNhan')) {
                $table->dateTime('NgayDongNghiepXacNhan')->nullable()->after('XacNhanDongNghiep');
            }
            if (!Schema::hasColumn('don_tu_nhan_su', 'GhiChuDongNghiep')) {
                $table->text('GhiChuDongNghiep')->nullable()->after('NgayDongNghiepXacNhan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('don_tu_nhan_su', function (Blueprint $table) {
            if (Schema::hasColumn('don_tu_nhan_su', 'GhiChuDongNghiep')) {
                $table->dropColumn('GhiChuDongNghiep');
            }
            if (Schema::hasColumn('don_tu_nhan_su', 'NgayDongNghiepXacNhan')) {
                $table->dropColumn('NgayDongNghiepXacNhan');
            }
            if (Schema::hasColumn('don_tu_nhan_su', 'XacNhanDongNghiep')) {
                $table->dropColumn('XacNhanDongNghiep');
            }
        });
    }
};
