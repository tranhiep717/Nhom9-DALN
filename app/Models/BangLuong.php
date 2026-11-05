<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BangLuong extends Model
{
    protected $table = 'bang_luong';
    protected $primaryKey = 'MaBangLuong';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'MaBacSi',
        'MaTaiKhoan',
        'ThangNam',
        'SoNgayLam',
        'SoCaLam',
        'TienLuongCoBan',
        'PhuCapCa',
        'TienThuong',
        'TienPhat',
        'TongTien',
        'TrangThai',
    ];

    protected $casts = [
        'SoNgayLam' => 'integer',
        'SoCaLam' => 'integer',
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
}
