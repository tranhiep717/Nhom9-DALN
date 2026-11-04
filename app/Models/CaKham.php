<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaKham extends Model
{
    protected $table = 'ca_kham';
    protected $primaryKey = 'MaCaKham';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaCaKham, MaLichLamViec, GioBatDau, GioKetThuc, SoLuongTiepNhan, TrangThai
    protected $fillable = [
        'MaLichLamViec',
        'GioBatDau',
        'GioKetThuc',
        'SoLuongTiepNhan',
        'TrangThai',
    ];

    // Quan hệ: CaKham thuộc về một LichLamViec
    public function lichLamViec()
    {
        return $this->belongsTo(LichLamViec::class, 'MaLichLamViec', 'MaLichLamViec');
    }

    // Quan hệ: CaKham có nhiều LichHen
    public function lichHens()
    {
        return $this->hasMany(LichHen::class, 'MaCaKham', 'MaCaKham');
    }
}
