<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuyenKhoa extends Model
{
    protected $table = 'chuyen_khoa';
    protected $primaryKey = 'MaChuyenKhoa';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'TenChuyenKhoa',
        'MoTa',
        'TrangThai',
    ];

    // Quan hệ: ChuyenKhoa có nhiều BacSi
    public function bacSis()
    {
        return $this->hasMany(BacSi::class, 'MaChuyenKhoa', 'MaChuyenKhoa');
    }
}
