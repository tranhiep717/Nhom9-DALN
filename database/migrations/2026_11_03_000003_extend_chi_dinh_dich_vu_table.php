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
        Schema::table('chi_dinh_dich_vu', function (Blueprint $table) {
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'MaNhanVienThucHien')) {
                $table->integer('MaNhanVienThucHien')->nullable()->after('MaBacSi');
            }
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'KetLuan')) {
                $table->text('KetLuan')->nullable()->after('KetQua');
            }
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'DonViDo')) {
                $table->string('DonViDo', 50)->nullable()->after('KetLuan');
            }
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'KhoangThamChieu')) {
                $table->string('KhoangThamChieu', 100)->nullable()->after('DonViDo');
            }
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'TepDinhKem')) {
                $table->string('TepDinhKem', 255)->nullable()->after('KhoangThamChieu');
            }
            if (!Schema::hasColumn('chi_dinh_dich_vu', 'ThoiGianXacNhan')) {
                $table->dateTime('ThoiGianXacNhan')->nullable()->after('NgayThucHien');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chi_dinh_dich_vu', function (Blueprint $table) {
            $columns = ['MaNhanVienThucHien', 'KetLuan', 'DonViDo', 'KhoangThamChieu', 'TepDinhKem', 'ThoiGianXacNhan'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('chi_dinh_dich_vu', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
