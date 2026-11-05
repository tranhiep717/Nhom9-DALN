<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChamCong extends Model
{
    protected $table = 'cham_cong';
    protected $primaryKey = 'MaChamCong';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'MaBacSi',
        'MaTaiKhoan',
        'MaLichLamViec',
        'NgayChamCong',
        'LoaiCa',
        'GioCheckIn',
        'GioCheckOut',
        'TrangThai',
        'SoPhutTre',
        'SoPhutVeSom',
        'TienLuongCoBan',
        'PhuCapCa',
        'TienThuong',
        'TienPhat',
        'TongTien',
        'GhiChu',
        'MaDonTu',
    ];

    protected $casts = [
        'NgayChamCong' => 'date',
        'SoPhutTre' => 'integer',
        'SoPhutVeSom' => 'integer',
        'TienLuongCoBan' => 'integer',
        'PhuCapCa' => 'integer',
        'TienThuong' => 'integer',
        'TienPhat' => 'integer',
        'TongTien' => 'integer',
    ];

    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    public function lichLamViec()
    {
        return $this->belongsTo(LichLamViec::class, 'MaLichLamViec', 'MaLichLamViec');
    }

    public function donTu()
    {
        return $this->belongsTo(DonTuNhanSu::class, 'MaDonTu', 'MaDonTu');
    }
}
