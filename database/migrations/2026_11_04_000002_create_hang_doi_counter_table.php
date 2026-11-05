<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng bộ đếm số thứ tự hàng đợi theo phạm vi: [Ngày khám + Ca khám + Chuyên khoa]
     * Sử dụng cho kỹ thuật Pessimistic Locking (SELECT ... FOR UPDATE) chống cấp trùng số
     */
    public function up(): void
    {
        Schema::create('hang_doi_counter', function (Blueprint $table) {
            $table->date('NgayKham');
            $table->integer('MaCaKham');
            $table->integer('MaChuyenKhoa');
            $table->integer('SoHienTai')->default(0);
            $table->dateTime('UpdatedAt')->useCurrent();

            // Khóa chính đa cột định danh duy nhất phạm vi hàng đợi
            $table->primary(['NgayKham', 'MaCaKham', 'MaChuyenKhoa'], 'pk_hang_doi_counter');

            // Khóa ngoại toàn vẹn tham chiếu
            $table->foreign('MaCaKham', 'fk_hdc_ca_kham')
                  ->references('MaCaKham')->on('ca_kham')
                  ->onDelete('restrict');

            $table->foreign('MaChuyenKhoa', 'fk_hdc_chuyen_khoa')
                  ->references('MaChuyenKhoa')->on('chuyen_khoa')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hang_doi_counter');
    }
};
