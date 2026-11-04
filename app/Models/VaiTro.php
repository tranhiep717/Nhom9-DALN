<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaiTro extends Model
{
    protected $table = 'vai_tro';
    protected $primaryKey = 'MaVaiTro';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'TenVaiTro',
        'MoTa',
    ];

    // Quan hệ: VaiTro có nhiều TaiKhoan
    public function taiKhoans()
    {
        return $this->hasMany(TaiKhoan::class, 'MaVaiTro', 'MaVaiTro');
    }
}
