<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BacSi extends Model
{
    protected $table = 'bac_si';
    protected $primaryKey = 'MaBacSi';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaBacSi, MaTaiKhoan, MaChuyenKhoa, HoTen, SoDienThoai, EmailLienHe, HocVi, KinhNghiem, MoTa, TrangThai
    protected $fillable = [
        'MaTaiKhoan',
        'MaChuyenKhoa',
        'HoTen',
        'SoDienThoai',
        'EmailLienHe',
        'HocVi',
        'KinhNghiem',
        'MoTa',
        'TrangThai',
    ];

    // Quan hệ: BacSi thuộc về một TaiKhoan
    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    // Quan hệ: BacSi thuộc về một ChuyenKhoa
    public function chuyenKhoa()
    {
        return $this->belongsTo(ChuyenKhoa::class, 'MaChuyenKhoa', 'MaChuyenKhoa');
    }

    // Quan hệ: BacSi có nhiều LichLamViec
    public function lichLamViecs()
    {
        return $this->hasMany(LichLamViec::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: BacSi có nhiều LuotKham
    public function luotKhams()
    {
        return $this->hasMany(LuotKham::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: BacSi có nhiều DonThuoc (đã kê)
    public function donThuocs()
    {
        return $this->hasMany(DonThuoc::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: BacSi có nhiều ChiDinhDichVu
    public function chiDinhDichVus()
    {
        return $this->hasMany(ChiDinhDichVu::class, 'MaBacSi', 'MaBacSi');
    }
}
