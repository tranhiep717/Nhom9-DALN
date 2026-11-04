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
        if (!Schema::hasTable('thong_bao')) {
            Schema::create('thong_bao', function (Blueprint $table) {
                $table->increments('MaThongBao');
                $table->integer('MaTaiKhoan');
                $table->string('LoaiThongBao', 50)->default('HE_THONG');
                $table->string('TieuDe', 255);
                $table->text('NoiDung');
                $table->string('DuongDan', 255)->nullable();
                $table->boolean('DaDoc')->default(false);
                $table->dateTime('ThoiGianDoc')->nullable();
                $table->dateTime('NgayTao')->useCurrent();

                // Foreign key và Indexes
                $table->foreign('MaTaiKhoan')->references('MaTaiKhoan')->on('tai_khoan')->onDelete('cascade');
                $table->index(['MaTaiKhoan', 'DaDoc']);
                $table->index(['MaTaiKhoan', 'NgayTao']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thong_bao');
    }
};
