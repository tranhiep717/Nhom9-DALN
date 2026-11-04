<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichLamViec extends Model
{
    protected $table = 'lich_lam_viec';
    protected $primaryKey = 'MaLichLamViec';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaLichLamViec, MaBacSi, NgayLamViec, GioBatDau, GioKetThuc, SoLuongTiepNhan, TrangThai
    protected $fillable = [
        'MaBacSi',
        'NgayLamViec',
        'GioBatDau',
        'GioKetThuc',
        'SoLuongTiepNhan',
        'TrangThai',
    ];

    // Quan hệ: LichLamViec thuộc về một BacSi
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: LichLamViec có nhiều CaKham
    public function caKhams()
    {
        return $this->hasMany(CaKham::class, 'MaLichLamViec', 'MaLichLamViec');
    }
}
