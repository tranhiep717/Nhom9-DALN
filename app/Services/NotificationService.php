<?php

namespace App\Services;

use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\TaiKhoan;
use App\Models\ThongBao;
use App\Models\VaiTro;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Gửi thông báo cho một tài khoản cụ thể (theo MaTaiKhoan)
     */
    public static function send(int $maTaiKhoan, string $type, string $title, string $content, ?string $url = null): ?ThongBao
    {
        try {
            return ThongBao::create([
                'MaTaiKhoan' => $maTaiKhoan,
                'LoaiThongBao' => $type,
                'TieuDe' => $title,
                'NoiDung' => $content,
                'DuongDan' => $url,
                'DaDoc' => false,
                'NgayTao' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("NotificationService::send error: " . $e->getMessage(), [
                'MaTaiKhoan' => $maTaiKhoan,
                'LoaiThongBao' => $type,
            ]);
            return null;
        }
    }

    /**
     * Gửi thông báo cho Bác sĩ qua MaBacSi
     */
    public static function sendToDoctor(int $maBacSi, string $type, string $title, string $content, ?string $url = null): ?ThongBao
    {
        try {
            $bacSi = BacSi::find($maBacSi);
            if ($bacSi && $bacSi->MaTaiKhoan) {
                return self::send($bacSi->MaTaiKhoan, $type, $title, $content, $url);
            }
        } catch (\Throwable $e) {
            Log::warning("NotificationService::sendToDoctor error: " . $e->getMessage());
        }
        return null;
    }

    /**
     * Gửi thông báo cho Bệnh nhân qua MaBenhNhan
     */
    public static function sendToPatient(int $maBenhNhan, string $type, string $title, string $content, ?string $url = null): ?ThongBao
    {
        try {
            $benhNhan = BenhNhan::find($maBenhNhan);
            if ($benhNhan && $benhNhan->MaTaiKhoan) {
                return self::send($benhNhan->MaTaiKhoan, $type, $title, $content, $url);
            }
        } catch (\Throwable $e) {
            Log::warning("NotificationService::sendToPatient error: " . $e->getMessage());
        }
        return null;
    }

    /**
     * Gửi thông báo cho tất cả người dùng thuộc một vai trò nhất định (QUAN_TRI_VIEN, LE_TAN, BAC_SI, BENH_NHAN)
     */
    public static function sendToRole(string $roleName, string $type, string $title, string $content, ?string $url = null): int
    {
        try {
            $vaiTro = VaiTro::where('TenVaiTro', $roleName)->first();
            if (!$vaiTro) {
                return 0;
            }

            $taiKhoans = TaiKhoan::where('MaVaiTro', $vaiTro->MaVaiTro)
                ->where('TrangThai', 'HOAT_DONG')
                ->pluck('MaTaiKhoan');

            $count = 0;
            $now = now();
            $batch = [];
            foreach ($taiKhoans as $maTaiKhoan) {
                $batch[] = [
                    'MaTaiKhoan' => $maTaiKhoan,
                    'LoaiThongBao' => $type,
                    'TieuDe' => $title,
                    'NoiDung' => $content,
                    'DuongDan' => $url,
                    'DaDoc' => false,
                    'NgayTao' => $now,
                ];
                $count++;
            }

            if (!empty($batch)) {
                ThongBao::insert($batch);
            }

            return $count;
        } catch (\Throwable $e) {
            Log::warning("NotificationService::sendToRole error: " . $e->getMessage());
            return 0;
        }
    }
}
