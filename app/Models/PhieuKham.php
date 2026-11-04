<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhieuKham extends Model
{
    protected $table = 'phieu_kham';
    protected $primaryKey = 'MaPhieuKham';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaPhieuKham, MaLuotKham, TrieuChung, KetQuaKham, ChanDoan, HuongDieuTri, LoiDanBacSi, NgayTao, NgayCapNhat
    protected $fillable = [
        'MaLuotKham',
        'TrieuChung',
        'KetQuaKham',
        'TienSuBenh',
        'ChanDoan',
        'ChanDoanBanDau',
        'ChanDoanSauCLS',
        'KetLuan',
        'HuongDieuTri',
        'LoiDanBacSi',
        'GhiChu',
    ];

    // Quan hệ: PhieuKham thuộc về một LuotKham
    public function luotKham()
    {
        return $this->belongsTo(LuotKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: PhieuKham liên kết trực tiếp với các ChiDinhDichVu qua MaLuotKham
    public function chiDinhDichVus()
    {
        return $this->hasMany(ChiDinhDichVu::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: PhieuKham có một DonThuoc qua MaLuotKham
    public function donThuoc()
    {
        return $this->hasOne(DonThuoc::class, 'MaLuotKham', 'MaLuotKham');
    }
}
