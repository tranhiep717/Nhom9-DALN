<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng lưu vết lịch sử sự kiện hàng đợi (Queue Event Log) phục vụ kiểm toán và giám sát
     * Lưu ý: File migration này được chuẩn bị cho Phase 6 triển khai chính thức.
     * TUYỆT ĐỐI KHÔNG CHẠY TRONG GIAI ĐOẠN PHASE 5.1.
     */
    public function up(): void
    {
        Schema::create('hang_doi_lich_su', function (Blueprint $table) {
            $table->increments('MaLichSu');
            $table->integer('MaLuotKham');
            $table->string('LoaiSuKien', 30); // GOI_KHAM, BO_LUOT, QUAY_LAI_CLS, VAO_HANG
            $table->integer('MaTaiKhoan')->nullable();
            $table->text('ThongTin')->nullable();
            $table->dateTime('ThoiGian')->useCurrent();

            $table->index(['MaLuotKham', 'LoaiSuKien'], 'idx_hdls_luot_kham');
            $table->index('ThoiGian', 'idx_hdls_thoi_gian');

            $table->foreign('MaLuotKham', 'fk_hdls_luot_kham')
                  ->references('MaLuotKham')->on('luot_kham')
                  ->onDelete('cascade');

            $table->foreign('MaTaiKhoan', 'fk_hdls_tai_khoan')
                  ->references('MaTaiKhoan')->on('tai_khoan')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hang_doi_lich_su');
    }
};
