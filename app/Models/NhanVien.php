<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhanVien extends Model
{
    protected $table = 'nhan_vien';
    protected $primaryKey = 'MaNhanVien';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'MaTaiKhoan',
        'HoTen',
        'LoaiNhanVien',
        'SoDienThoai',
        'EmailLienHe',
        'CCCD',
        'NgaySinh',
        'GioiTinh',
        'DiaChi',
        'NgayVaoLam',
        'GhiChu',
        'TrangThai',
    ];

    protected $casts = [
        'NgaySinh' => 'date',
        'NgayVaoLam' => 'date',
    ];

    // Quan hệ: NhanVien thuộc về một TaiKhoan
    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }
}

