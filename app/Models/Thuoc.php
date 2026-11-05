<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Thuoc extends Model
{
    protected $table = 'thuoc';
    protected $primaryKey = 'MaThuoc';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaThuoc, TenThuoc, HoatChat, HamLuong, DonViTinh, DangBaoChe, DonGia, SoLuongTon, HuongDanSuDung, ChongChiDinh, TrangThai, NgayTao
    protected $fillable = [
        'TenThuoc',
        'HoatChat',
        'HamLuong',
        'DonViTinh',
        'DangBaoChe',
        'DonGia',
        'ApDungBHYT',
        'SoLuongTon',
        'HuongDanSuDung',
        'ChongChiDinh',
        'TrangThai',
    ];

    protected $appends = ['GiaBan'];

    public function getGiaBanAttribute(): float
    {
        return (float) ($this->attributes['DonGia'] ?? 0);
    }

    // Quan hệ: Thuoc có nhiều ChiTietDonThuoc
    public function chiTietDonThuocs()
    {
        return $this->hasMany(ChiTietDonThuoc::class, 'MaThuoc', 'MaThuoc');
    }
}
