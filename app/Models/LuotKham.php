<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuotKham extends Model
{
    protected $table = 'luot_kham';
    protected $primaryKey = 'MaLuotKham';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaLuotKham, MaLichHen, MaBenhNhan, MaBacSi, ThoiGianTiepNhan, ThoiGianBatDauKham, ThoiGianKetThucKham, TrangThai, GhiChu
    protected $fillable = [
        'MaLichHen',
        'MaBenhNhan',
        'MaBacSi',
        'ThoiGianTiepNhan',
        'ThoiGianBatDauKham',
        'ThoiGianKetThucKham',
        'TrangThai',
        'GhiChu',
    ];

    // Quan hệ: LuotKham thuộc về một LichHen
    public function lichHen()
    {
        return $this->belongsTo(LichHen::class, 'MaLichHen', 'MaLichHen');
    }

    // Quan hệ: LuotKham thuộc về một BenhNhan
    public function benhNhan()
    {
        return $this->belongsTo(BenhNhan::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: LuotKham thuộc về một BacSi
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: LuotKham có một PhieuKham
    public function phieuKham()
    {
        return $this->hasOne(PhieuKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có một DonThuoc
    public function donThuoc()
    {
        return $this->hasOne(DonThuoc::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có một HoaDon
    public function hoaDon()
    {
        return $this->hasOne(HoaDon::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có nhiều ChiDinhDichVu
    public function chiDinhDichVus()
    {
        return $this->hasMany(ChiDinhDichVu::class, 'MaLuotKham', 'MaLuotKham');
    }
}
