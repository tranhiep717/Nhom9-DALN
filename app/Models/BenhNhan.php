<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BenhNhan extends Model
{
    protected $table = 'benh_nhan';
    protected $primaryKey = 'MaBenhNhan';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'MaTaiKhoan',
        'HoTen',
        'NgaySinh',
        'GioiTinh',
        'SoDienThoai',
        'SoTheBHYT',
        'MucHuongBHYT',
        'DiaChi',
        'EmailLienHe',
    ];

    // Quan hệ: BenhNhan thuộc về một TaiKhoan
    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    // Quan hệ: BenhNhan có nhiều LichHen
    public function lichHens()
    {
        return $this->hasMany(LichHen::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: BenhNhan có nhiều LuotKham
    public function luotKhams()
    {
        return $this->hasMany(LuotKham::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: BenhNhan có nhiều HoiThoaiAi
    public function hoiThoaiAis()
    {
        return $this->hasMany(HoiThoaiAi::class, 'MaBenhNhan', 'MaBenhNhan');
    }
}
