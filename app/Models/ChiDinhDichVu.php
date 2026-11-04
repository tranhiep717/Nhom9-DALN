<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChiDinhDichVu extends Model
{
    protected $table = 'chi_dinh_dich_vu';
    protected $primaryKey = 'MaChiDinh';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaChiDinh, MaLuotKham, MaDichVu, MaBacSi, MaNhanVienThucHien, TrangThai, KetQua, KetLuan, DonViDo, KhoangThamChieu, TepDinhKem, NgayChiDinh, NgayThucHien, ThoiGianXacNhan, DonGia, GhiChu
    protected $fillable = [
        'MaLuotKham',
        'MaPhieuKham',
        'MaDichVu',
        'MaBacSi',
        'MaNhanVienThucHien',
        'TrangThai',
        'KetQua',
        'KetLuan',
        'DonViDo',
        'KhoangThamChieu',
        'TepDinhKem',
        'NgayChiDinh',
        'NgayThucHien',
        'ThoiGianXacNhan',
        'DonGia',
        'GhiChu',
    ];

    // Quan hệ: ChiDinhDichVu thuộc về một LuotKham
    public function luotKham()
    {
        return $this->belongsTo(LuotKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: ChiDinhDichVu thuộc về một PhieuKham
    public function phieuKham()
    {
        return $this->belongsTo(PhieuKham::class, 'MaPhieuKham', 'MaPhieuKham');
    }

    // Quan hệ: ChiDinhDichVu thuộc về một DichVu
    public function dichVu()
    {
        return $this->belongsTo(DichVu::class, 'MaDichVu', 'MaDichVu');
    }

    // Quan hệ: ChiDinhDichVu thuộc về một BacSi (người chỉ định)
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: ChiDinhDichVu có một NhanVienThucHien (TaiKhoan)
    public function nhanVienThucHien()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaNhanVienThucHien', 'MaTaiKhoan');
    }

    // Quan hệ: ChiDinhDichVu có nhiều ChiTietHoaDon
    public function chiTietHoaDons()
    {
        return $this->hasMany(ChiTietHoaDon::class, 'MaChiDinh', 'MaChiDinh');
    }
}
