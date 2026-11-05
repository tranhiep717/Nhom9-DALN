<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DichVu extends Model
{
    protected $table = 'dich_vu';
    protected $primaryKey = 'MaDichVu';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'TenDichVu',
        'DonGia',
        'ApDungBHYT',
        'MoTa',
        'TrangThai',
    ];

    // Quan hệ: DichVu có nhiều ChiDinhDichVu
    public function chiDinhDichVus()
    {
        return $this->hasMany(ChiDinhDichVu::class, 'MaDichVu', 'MaDichVu');
    }
}
