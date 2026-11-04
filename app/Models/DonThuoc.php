<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonThuoc extends Model
{
    protected $table = 'don_thuoc';
    protected $primaryKey = 'MaDonThuoc';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaDonThuoc, MaLuotKham, MaBacSi, NgayKeDon, LoiDan, TrangThai, GhiChu
    protected $fillable = [
        'MaLuotKham',
        'MaBacSi',
        'NgayKeDon',
        'LoiDan',
        'TrangThai',
        'GhiChu',
    ];

    // Quan hệ: DonThuoc thuộc về một LuotKham
    public function luotKham()
    {
        return $this->belongsTo(LuotKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: DonThuoc thuộc về một BacSi
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: DonThuoc có nhiều ChiTietDonThuoc
    public function chiTietDonThuocs()
    {
        return $this->hasMany(ChiTietDonThuoc::class, 'MaDonThuoc', 'MaDonThuoc');
    }
}
