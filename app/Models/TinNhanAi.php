<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinNhanAi extends Model
{
    protected $table = 'tin_nhan_ai';
    protected $primaryKey = 'MaTinNhan';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaTinNhan, MaHoiThoai, VaiTroNguoiGui, NoiDung, ThoiGianGui, TrangThai, GhiChu
    protected $fillable = [
        'MaHoiThoai',
        'VaiTroNguoiGui',
        'NoiDung',
        'ThoiGianGui',
        'TrangThai',
        'GhiChu',
    ];

    // Quan hệ: TinNhanAi thuộc về một HoiThoaiAi
    public function hoiThoaiAi()
    {
        return $this->belongsTo(HoiThoaiAi::class, 'MaHoiThoai', 'MaHoiThoai');
    }
}
