<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietDonThuoc extends Model
{
    protected $table = 'chi_tiet_don_thuoc';
    protected $primaryKey = 'MaChiTietDonThuoc';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaChiTietDonThuoc, MaDonThuoc, MaThuoc, SoLuong, LieuDung, TanSuat, ThoiGianDung, CachDung, DonGia, ThanhTien
    // Lưu ý: cột ThanhTien là STORED GENERATED, không đưa vào $fillable
    protected $fillable = [
        'MaDonThuoc',
        'MaThuoc',
        'SoLuong',
        'LieuDung',
        'TanSuat',
        'ThoiGianDung',
        'CachDung',
        'DonGia',
    ];

    // Quan hệ: ChiTietDonThuoc thuộc về một DonThuoc
    public function donThuoc()
    {
        return $this->belongsTo(DonThuoc::class, 'MaDonThuoc', 'MaDonThuoc');
    }

    // Quan hệ: ChiTietDonThuoc thuộc về một Thuoc
    public function thuoc()
    {
        return $this->belongsTo(Thuoc::class, 'MaThuoc', 'MaThuoc');
    }
}
