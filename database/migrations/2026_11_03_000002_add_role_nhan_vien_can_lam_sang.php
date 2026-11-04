<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Thêm vai trò NHAN_VIEN_CAN_LAM_SANG vào bảng vai_tro (nếu chưa có)
        $existingRole = DB::table('vai_tro')->where('TenVaiTro', 'NHAN_VIEN_CAN_LAM_SANG')->first();
        if (!$existingRole) {
            DB::table('vai_tro')->insert([
                'MaVaiTro' => 5,
                'TenVaiTro' => 'NHAN_VIEN_CAN_LAM_SANG',
                'MoTa' => 'Nhan vien ky thuat can lam sang va xet nghiem',
            ]);
        }

        // 2. Tạo tài khoản mẫu demo/kiểm thử cho vai trò Cận lâm sàng
        $existingAccount = DB::table('tai_khoan')->where('Email', 'cls@smartcare.vn')->first();
        if (!$existingAccount) {
            DB::table('tai_khoan')->insert([
                'MaVaiTro' => 5,
                'TenDangNhap' => 'cls_nhom9',
                'MatKhau' => Hash::make('SmartCare@2026'),
                'Email' => 'cls@smartcare.vn',
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tai_khoan')->where('Email', 'cls@smartcare.vn')->delete();
        DB::table('vai_tro')->where('TenVaiTro', 'NHAN_VIEN_CAN_LAM_SANG')->delete();
    }
};
