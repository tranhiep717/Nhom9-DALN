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
        Schema::create('cham_cong', function (Blueprint $table) {
            $table->id('MaChamCong');
            $table->unsignedBigInteger('MaBacSi');
            $table->unsignedBigInteger('MaLichLamViec')->nullable();
            $table->date('NgayChamCong');
            $table->string('LoaiCa')->nullable();
            $table->time('GioCheckIn')->nullable();
            $table->time('GioCheckOut')->nullable();
            $table->string('TrangThai')->default('CO_MAT');
            $table->integer('SoPhutTre')->default(0);
            $table->decimal('TienLuongCoBan', 12, 0)->default(0);
            $table->decimal('PhuCapCa', 12, 0)->default(0);
            $table->decimal('TienThuong', 12, 0)->default(0);
            $table->decimal('TienPhat', 12, 0)->default(0);
            $table->decimal('TongTien', 12, 0)->default(0);
            $table->text('GhiChu')->nullable();
            $table->timestamps();

            $table->index(['MaBacSi', 'NgayChamCong'], 'cham_cong_bacsi_ngay_index');
        });

        Schema::create('bang_luong', function (Blueprint $table) {
            $table->id('MaBangLuong');
            $table->unsignedBigInteger('MaBacSi');
            $table->string('ThangNam', 7);
            $table->integer('SoNgayLam')->default(0);
            $table->integer('SoCaLam')->default(0);
            $table->decimal('TienLuongCoBan', 12, 0)->default(0);
            $table->decimal('PhuCapCa', 12, 0)->default(0);
            $table->decimal('TienThuong', 12, 0)->default(0);
            $table->decimal('TienPhat', 12, 0)->default(0);
            $table->decimal('TongTien', 12, 0)->default(0);
            $table->string('TrangThai')->default('CHO_XAC_NHAN');
            $table->timestamps();

            $table->unique(['MaBacSi', 'ThangNam'], 'bang_luong_bacsi_thang_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bang_luong');
        Schema::dropIfExists('cham_cong');
    }
};
