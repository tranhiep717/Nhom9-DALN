<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class TaiKhoan extends Authenticatable
{
    use Notifiable;

    protected $table = 'tai_khoan';
    protected $primaryKey = 'MaTaiKhoan';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = false;

    // Cột DB thực tế: MaTaiKhoan, MaVaiTro, TenDangNhap, MatKhau, Email, TrangThai, NgayTao
    protected $fillable = [
        'MaVaiTro',
        'TenDangNhap',
        'MatKhau',
        'Email',
        'TrangThai',
        'NgayTao',
    ];

    protected $hidden = [
        'MatKhau',
    ];

    protected $appends = [
        'name',
        'id',
        'email',
    ];

    public function getNameAttribute(): string
    {
        return $this->benhNhan?->HoTen 
            ?? $this->bacSi?->HoTen 
            ?? $this->nhanVien?->HoTen 
            ?? $this->TenDangNhap 
            ?? 'Người dùng';
    }

    public function getIdAttribute(): int
    {
        return (int) $this->MaTaiKhoan;
    }

    public function getEmailAttribute(): ?string
    {
        return $this->attributes['Email'] ?? null;
    }

    public function setEmailAttribute($value): void
    {
        $this->attributes['Email'] = $value;
    }

    public function setPasswordAttribute($value): void
    {
        $this->attributes['MatKhau'] = $value;
    }

    /**
     * Tên cột định danh khóa chính cho Auth
     */
    public function getAuthIdentifierName()
    {
        return 'MaTaiKhoan';
    }

    /**
     * Mật khẩu cho Auth
     */
    public function getAuthPassword()
    {
        return $this->MatKhau;
    }

    public function getAuthPasswordName()
    {
        return 'MatKhau';
    }

    /**
     * Bảng tai_khoan không có cột remember_token
     */
    public function getRememberToken()
    {
        return null;
    }

    public function setRememberToken($value)
    {
        // No-op
    }

    public function getRememberTokenName()
    {
        return null;
    }

    // Quan hệ: TaiKhoan thuộc về một VaiTro (mỗi tài khoản chỉ có 1 vai trò duy nhất)
    public function vaiTro()
    {
        return $this->belongsTo(VaiTro::class, 'MaVaiTro', 'MaVaiTro');
    }

    // Quan hệ: TaiKhoan có một BenhNhan
    public function benhNhan()
    {
        return $this->hasOne(BenhNhan::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    // Quan hệ: TaiKhoan có một BacSi
    public function bacSi()
    {
        return $this->hasOne(BacSi::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    // Quan hệ: TaiKhoan có một NhanVien (Lễ tân, Cận lâm sàng...)
    public function nhanVien()
    {
        return $this->hasOne(NhanVien::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    /**
     * Kiểm tra vai trò của tài khoản
     */
    public function hasRole(string $tenVaiTro): bool
    {
        return strtoupper($this->vaiTro?->TenVaiTro ?? '') === strtoupper($tenVaiTro);
    }

    public function isQuanTriVien(): bool
    {
        return $this->hasRole('QUAN_TRI_VIEN');
    }

    public function isBacSi(): bool
    {
        return $this->hasRole('BAC_SI');
    }

    public function isBenhNhan(): bool
    {
        return $this->hasRole('BENH_NHAN');
    }

    public function isLeTan(): bool
    {
        return $this->hasRole('LE_TAN');
    }

    public function isNhanVienCanLamSang(): bool
    {
        return $this->hasRole('NHAN_VIEN_CAN_LAM_SANG');
    }

    // Quan hệ: TaiKhoan có nhiều ThongBao
    public function thongBaos()
    {
        return $this->hasMany(ThongBao::class, 'MaTaiKhoan', 'MaTaiKhoan')->orderBy('NgayTao', 'desc');
    }

    public function chamCongs()
    {
        return $this->hasMany(ChamCong::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    public function bangLuongs()
    {
        return $this->hasMany(BangLuong::class, 'MaTaiKhoan', 'MaTaiKhoan');
    }

    public function donTuNhanSus()
    {
        return $this->hasMany(DonTuNhanSu::class, 'MaTaiKhoan', 'MaTaiKhoan')->orderBy('created_at', 'desc');
    }
}

