<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('nhan_vien')) {
            Schema::create('nhan_vien', function (Blueprint $table) {
                $table->id('MaNhanVien');
                $table->integer('MaTaiKhoan')->nullable()->unique();
                $table->string('HoTen', 150);
                $table->string('LoaiNhanVien', 50)->comment('LE_TAN, CAN_LAM_SANG, DUOC_SI, THU_NGAN, QUAN_TRI, KHAC');
                $table->string('SoDienThoai', 20)->nullable();
                $table->string('EmailLienHe', 150)->nullable();
                $table->string('CCCD', 20)->nullable();
                $table->date('NgaySinh')->nullable();
                $table->string('GioiTinh', 10)->default('NAM')->comment('NAM, NU, KHAC');
                $table->string('DiaChi', 255)->nullable();
                $table->date('NgayVaoLam')->nullable();
                $table->string('GhiChu', 500)->nullable();
                $table->string('TrangThai', 30)->default('DANG_LAM_VIEC')->comment('DANG_LAM_VIEC, NGHI_VIEC, TAM_NGHI');
                $table->timestamps();

                $table->foreign('MaTaiKhoan')
                      ->references('MaTaiKhoan')
                      ->on('tai_khoan')
                      ->onDelete('set null')
                      ->onUpdate('cascade');
            });
        }

        // Tự động seed hồ sơ ban đầu cho các tài khoản Lễ tân và CLS hiện có trong database
        if (Schema::hasTable('tai_khoan') && Schema::hasTable('vai_tro')) {
            $accounts = DB::table('tai_khoan')
                ->join('vai_tro', 'tai_khoan.MaVaiTro', '=', 'vai_tro.MaVaiTro')
                ->whereIn('vai_tro.TenVaiTro', ['LE_TAN', 'NHAN_VIEN_CAN_LAM_SANG'])
                ->select('tai_khoan.MaTaiKhoan', 'tai_khoan.TenDangNhap', 'tai_khoan.Email', 'vai_tro.TenVaiTro')
                ->get();

            foreach ($accounts as $acc) {
                $exists = DB::table('nhan_vien')->where('MaTaiKhoan', $acc->MaTaiKhoan)->exists();
                if (!$exists) {
                    $loai = ($acc->TenVaiTro === 'LE_TAN') ? 'LE_TAN' : 'CAN_LAM_SANG';
                    $hoTen = match($acc->TenDangNhap) {
                        'letan_demo' => 'Lê Thị Mai (Lễ tân 1)',
                        'letan_hoa' => 'Lê Thị Hoa',
                        'cls_duc' => 'Nguyễn Văn Đức (KTV Xét nghiệm)',
                        default => ($loai === 'LE_TAN' ? 'Nhân viên Lễ tân ' : 'Kỹ thuật viên CLS ') . ucfirst(str_replace(['letan_', 'cls_'], '', $acc->TenDangNhap))
                    };

                    DB::table('nhan_vien')->insert([
                        'MaTaiKhoan' => $acc->MaTaiKhoan,
                        'HoTen' => $hoTen,
                        'LoaiNhanVien' => $loai,
                        'SoDienThoai' => '09' . rand(10000000, 99999999),
                        'EmailLienHe' => $acc->Email,
                        'GioiTinh' => ($loai === 'LE_TAN') ? 'NU' : 'NAM',
                        'NgayVaoLam' => now()->subMonths(6)->toDateString(),
                        'TrangThai' => 'DANG_LAM_VIEC',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nhan_vien');
    }
};

