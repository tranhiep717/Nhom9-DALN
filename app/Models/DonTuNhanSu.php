<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonTuNhanSu extends Model
{
    protected $table = 'don_tu_nhan_su';
    protected $primaryKey = 'MaDonTu';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'MaTaiKhoan',
        'LoaiDon',
        'NgayApDung',
        'MaLichLamViec',
        'SoPhutXinPhep',
        'SoPhutDuocDuyet',
        'MaLichDoiSang',
        'TaiKhoanDoiCung',
        'XacNhanDongNghiep',
        'NgayDongNghiepXacNhan',
        'GhiChuDongNghiep',
        'LyDo',
        'TrangThai',
        'MaAdminDuyet',
        'GhiChuAdmin',
    ];

    protected $casts = [
        'NgayApDung' => 'date',
        'SoPhutXinPhep' => 'integer',
        'SoPhutDuocDuyet' => 'integer',
        'XacNhanDongNghiep' => 'boolean',
        'NgayDongNghiepXacNhan' => 'datetime',
    ];

    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    public function taiKhoanDoiCung()
    {
        return $this->belongsTo(TaiKhoan::class, 'TaiKhoanDoiCung', 'MaTaiKhoan');
    }

    public function adminDuyet()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaAdminDuyet', 'MaTaiKhoan');
    }

    public function lichLamViec()
    {
        return $this->belongsTo(LichLamViec::class, 'MaLichLamViec', 'MaLichLamViec');
    }

    public function lichDoiSang()
    {
        return $this->belongsTo(LichLamViec::class, 'MaLichDoiSang', 'MaLichLamViec');
    }
}
