<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuotKham extends Model
{
    protected $table = 'luot_kham';
    protected $primaryKey = 'MaLuotKham';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế kèm các cột Hybrid Queue
    protected $fillable = [
        'MaLichHen',
        'MaBenhNhan',
        'MaBacSi',
        'ThoiGianTiepNhan',
        'ThoiGianBatDauKham',
        'ThoiGianKetThucKham',
        'TrangThai',
        'CoBHYT',
        'SoTheBHYT',
        'MucHuongBHYT',
        'TuyenKCB',
        'GhiChu',
        'NgayKham',
        'LoaiHangDoi',
        'SoPhieu',
        'STTTrongNgay',
        'MaChuyenKhoa',
        'MaCaKham',
        'MucUuTien',
        'ThoiGianVaoHang',
        'ThoiGianGoiKham',
        'NguoiXacNhanUuTien',
        'LyDoUuTien',
        'MaTaiKhoanTiepNhan',
    ];

    // Quan hệ: LuotKham do một Lễ tân (TaiKhoan) tiếp nhận
    public function nguoiTiepNhan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoanTiepNhan', 'MaTaiKhoan');
    }

    // Quan hệ: LuotKham thuộc về một ChuyenKhoa
    public function chuyenKhoa()
    {
        return $this->belongsTo(ChuyenKhoa::class, 'MaChuyenKhoa', 'MaChuyenKhoa');
    }

    // Quan hệ: LuotKham thuộc về một CaKham
    public function caKham()
    {
        return $this->belongsTo(CaKham::class, 'MaCaKham', 'MaCaKham');
    }

    // Quan hệ: LuotKham thuộc về một LichHen
    public function lichHen()
    {
        return $this->belongsTo(LichHen::class, 'MaLichHen', 'MaLichHen');
    }

    // Quan hệ: LuotKham thuộc về một BenhNhan
    public function benhNhan()
    {
        return $this->belongsTo(BenhNhan::class, 'MaBenhNhan', 'MaBenhNhan');
    }

    // Quan hệ: LuotKham thuộc về một BacSi
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: LuotKham có một PhieuKham
    public function phieuKham()
    {
        return $this->hasOne(PhieuKham::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có một DonThuoc
    public function donThuoc()
    {
        return $this->hasOne(DonThuoc::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có một HoaDon
    public function hoaDon()
    {
        return $this->hasOne(HoaDon::class, 'MaLuotKham', 'MaLuotKham');
    }

    // Quan hệ: LuotKham có nhiều ChiDinhDichVu
    public function chiDinhDichVus()
    {
        return $this->hasMany(ChiDinhDichVu::class, 'MaLuotKham', 'MaLuotKham');
    }
}
