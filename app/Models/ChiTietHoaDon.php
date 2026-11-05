<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiTietHoaDon extends Model
{
    protected $table = 'chi_tiet_hoa_don';
    protected $primaryKey = 'MaChiTietHoaDon';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaChiTietHoaDon, MaHoaDon, LoaiChiPhi, NoiDung, SoLuong, DonGia, ThanhTien, MaChiDinh, MaChiTietDonThuoc
    // Lưu ý: cột ThanhTien là STORED GENERATED, không đưa vào $fillable
    protected $fillable = [
        'MaHoaDon',
        'LoaiChiPhi',
        'NoiDung',
        'SoLuong',
        'DonGia',
        'DuocBHYTChiTra',
        'TienBHYTChiTra',
        'TienBenhNhanChiTra',
        'MaChiDinh',
        'MaChiTietDonThuoc',
    ];

    // Quan hệ: ChiTietHoaDon thuộc về một HoaDon
    public function hoaDon()
    {
        return $this->belongsTo(HoaDon::class, 'MaHoaDon', 'MaHoaDon');
    }

    // Quan hệ: ChiTietHoaDon thuộc về một ChiDinhDichVu (nullable)
    public function chiDinhDichVu()
    {
        return $this->belongsTo(ChiDinhDichVu::class, 'MaChiDinh', 'MaChiDinh');
    }

    // Quan hệ: ChiTietHoaDon thuộc về một ChiTietDonThuoc (nullable)
    public function chiTietDonThuoc()
    {
        return $this->belongsTo(ChiTietDonThuoc::class, 'MaChiTietDonThuoc', 'MaChiTietDonThuoc');
    }
}
