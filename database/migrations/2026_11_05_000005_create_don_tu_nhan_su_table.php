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
        // 1. Bang quan ly don tu nhan su (Doi ca, Di muon, Ve som, Nghi phep)
        if (!Schema::hasTable('don_tu_nhan_su')) {
            Schema::create('don_tu_nhan_su', function (Blueprint $table) {
                $table->id('MaDonTu');
                $table->unsignedBigInteger('MaTaiKhoan');
                $table->string('LoaiDon', 30); // DOI_CA, DI_MUON, VE_SOM, NGHI_PHEP
                $table->date('NgayApDung');
                $table->unsignedBigInteger('MaLichLamViec')->nullable();
                $table->integer('SoPhutXinPhep')->default(0);
                $table->integer('SoPhutDuocDuyet')->default(0);
                $table->unsignedBigInteger('MaLichDoiSang')->nullable();
                $table->unsignedBigInteger('TaiKhoanDoiCung')->nullable();
                $table->text('LyDo')->nullable();
                $table->string('TrangThai', 30)->default('CHO_DUYET'); // CHO_DUYET, DA_DUYET, TU_CHOI
                $table->unsignedBigInteger('MaAdminDuyet')->nullable();
                $table->text('GhiChuAdmin')->nullable();
                $table->timestamps();

                $table->index(['MaTaiKhoan', 'NgayApDung'], 'idx_dontu_user_date');
                $table->index(['TrangThai', 'LoaiDon'], 'idx_dontu_status_type');
            });
        }

        // 2. Cap nhat bang cham_cong: them SoPhutVeSom va MaDonTu
        Schema::table('cham_cong', function (Blueprint $table) {
            if (!Schema::hasColumn('cham_cong', 'SoPhutVeSom')) {
                $table->integer('SoPhutVeSom')->default(0)->after('SoPhutTre');
            }
            if (!Schema::hasColumn('cham_cong', 'MaDonTu')) {
                $table->unsignedBigInteger('MaDonTu')->nullable()->after('GhiChu');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cham_cong', function (Blueprint $table) {
            if (Schema::hasColumn('cham_cong', 'MaDonTu')) {
                $table->dropColumn('MaDonTu');
            }
            if (Schema::hasColumn('cham_cong', 'SoPhutVeSom')) {
                $table->dropColumn('SoPhutVeSom');
            }
        });

        Schema::dropIfExists('don_tu_nhan_su');
    }
};
