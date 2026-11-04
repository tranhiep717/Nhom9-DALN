<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoaDon extends Model
{
    protected $table = 'hoa_don';
    protected $primaryKey = 'MaHoaDon';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaHoaDon, MaLuotKham, TongTien, GiamGia, BaoHiemChiTra, BenhNhanChiTra, TrangThai, NgayTao, GhiChu
    protected $fillable = [
        'MaLuotKham',
        'TongTien',
        'GiamGia',
        'BaoHiemChiTra',
        'BenhNhanChiTra',
        'TrangThai',
        'NgayTao',
        'GhiChu',
    ];

    protected $appends = ['DaThanhToan', 'ConLai'];

    public function getDaThanhToanAttribute(): float
    {
        if ($this->relationLoaded('thanhToans')) {
            return (float) $this->thanhToans->whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');
        }
        return (float) $this->thanhToans()->whereIn('TrangThai', ['DA_THANH_TOAN', 'THANH_CONG'])->sum('SoTien');
    }

    public function getConLaiAttribute(): float
    {
        $conLai = (float) $this->BenhNhanChiTra - $this->DaThanhToan;
        return max(0, round($conLai, 2));
    }

    // Quan hệ: HoaDon thuộc về một LuotKham
    public function luotKham()
    {
        return $this->belongsTo(LuotKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: HoaDon có nhiều ChiTietHoaDon
    public function chiTietHoaDons()
    {
        return $this->hasMany(ChiTietHoaDon::class, 'MaHoaDon', 'MaHoaDon');
    }

    public function chiTiet()
    {
        return $this->chiTietHoaDons();
    }

    // Quan hệ: HoaDon có nhiều ThanhToan
    public function thanhToans()
    {
        return $this->hasMany(ThanhToan::class, 'MaHoaDon', 'MaHoaDon');
    }
}
