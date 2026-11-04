<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThongBao extends Model
{
    protected $table = 'thong_bao';
    protected $primaryKey = 'MaThongBao';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'MaTaiKhoan',
        'LoaiThongBao',
        'TieuDe',
        'NoiDung',
        'DuongDan',
        'DaDoc',
        'ThoiGianDoc',
        'NgayTao',
    ];

    protected $casts = [
        'DaDoc' => 'boolean',
        'NgayTao' => 'datetime',
        'ThoiGianDoc' => 'datetime',
    ];

    /**
     * Quan hệ: Thông báo thuộc về một Tài khoản
     */
    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }
}
