<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichLamViec extends Model
{
    protected $table = 'lich_lam_viec';
    protected $primaryKey = 'MaLichLamViec';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaLichLamViec, MaBacSi, NgayLamViec, GioBatDau, GioKetThuc, SoLuongTiepNhan, TrangThai
    protected $fillable = [
        'MaBacSi',
        'NgayLamViec',
        'LoaiCa',
        'GioBatDau',
        'GioKetThuc',
        'SoLuongTiepNhan',
        'TrangThai',
        'MaTaiKhoan',
    ];

    public static function normalizeShiftType(string $gioBatDau, string $gioKetThuc): string
    {
        $start = substr($gioBatDau, 0, 5);
        $end = substr($gioKetThuc, 0, 5);

        $map = [
            'sang' => ['08:00', '12:00'],
            'chieu' => ['13:00', '17:00'],
            'toi' => ['17:30', '20:30'],
            'dem' => ['19:00', '23:00'],
            'ngay' => ['08:00', '17:00'],
        ];

        foreach ($map as $type => [$expectedStart, $expectedEnd]) {
            if ($start === $expectedStart && $end === $expectedEnd) {
                return $type;
            }
        }

        return 'custom';
    }

    // Quan hệ: LichLamViec thuộc về một BacSi
    public function bacSi()
    {
        return $this->belongsTo(BacSi::class, 'MaBacSi', 'MaBacSi');
    }

    // Quan hệ: LichLamViec thuộc về một Nhân viên (Lễ tân / CLS - TaiKhoan)
    public function taiKhoan()
    {
        return $this->belongsTo(TaiKhoan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    // Quan hệ: LichLamViec có nhiều CaKham
    public function caKhams()
    {
        return $this->hasMany(CaKham::class, 'MaLichLamViec', 'MaLichLamViec');
    }
}
