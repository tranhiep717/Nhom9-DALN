<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichHen extends Model
{
    protected $table = 'lich_hen';
    protected $primaryKey = 'MaLichHen';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaLichHen, MaBenhNhan, MaCaKham, LyDoKham, NgayDat, TrangThai
    protected $fillable = [
        'MaBenhNhan',
        'MaCaKham',
        'LyDoKham',
        'NgayDat',
        'TrangThai',
    ];

    // Quan hệ: LichHen thuộc về một BenhNhan
    public function benhNhan()
    {
        return $this->belongsTo(BenhNhan::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: LichHen thuộc về một CaKham
    public function caKham()
    {
        return $this->belongsTo(CaKham::class, 'MaCaKham', 'MaCaKham');
    }

    // Quan hệ: LichHen có một LuotKham
    public function luotKham()
    {
        return $this->hasOne(LuotKham::class, 'MaLichHen', 'MaLichHen');
    }
}
