<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoiThoaiAi extends Model
{
    protected $table = 'hoi_thoai_ai';
    protected $primaryKey = 'MaHoiThoai';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'MaBenhNhan',
        'TieuDe',
        'ThoiGianBatDau',
        'ThoiGianKetThuc',
        'TrangThai',
    ];

    // Quan hệ: HoiThoaiAi thuộc về một BenhNhan
    public function benhNhan()
    {
        return $this->belongsTo(BenhNhan::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: HoiThoaiAi có nhiều TinNhanAi
    public function tinNhanAis()
    {
        return $this->hasMany(TinNhanAi::class, 'MaHoiThoai', 'MaHoiThoai');
    }
}
