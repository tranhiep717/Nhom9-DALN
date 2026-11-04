<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThanhToan extends Model
{
    protected $table = 'thanh_toan';
    protected $primaryKey = 'MaThanhToan';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaThanhToan, MaHoaDon, SoTien, PhuongThucThanhToan, ThoiGianThanhToan, TrangThai, MaGiaoDich, GhiChu, NgayTao
    protected $fillable = [
        'MaHoaDon',
        'SoTien',
        'PhuongThucThanhToan',
        'ThoiGianThanhToan',
        'TrangThai',
        'MaGiaoDich',
        'GhiChu',
        'NgayTao',
    ];

    // Quan hệ: ThanhToan thuộc về một HoaDon
    public function hoaDon()
    {
        return $this->belongsTo(HoaDon::class, 'MaHoaDon', 'MaHoaDon');
    }
}
