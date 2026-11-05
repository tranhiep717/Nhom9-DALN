<?php

namespace App\Services;

class ChamCongPolicy
{
    public const BASE_BY_ROLE = [
        'BAC_SI' => [
            'sang' => 300000,
            'chieu' => 300000,
            'toi' => 300000,
            'ngay' => 350000,
            'dem' => 350000,
            'custom' => 300000,
        ],
        'LE_TAN' => [
            'sang' => 220000,
            'chieu' => 220000,
            'toi' => 220000,
            'ngay' => 250000,
            'dem' => 260000,
            'custom' => 220000,
        ],
        'NHAN_VIEN_CAN_LAM_SANG' => [
            'sang' => 240000,
            'chieu' => 240000,
            'toi' => 240000,
            'ngay' => 280000,
            'dem' => 290000,
            'custom' => 240000,
        ],
        'QUAN_TRI_VIEN' => [
            'sang' => 420000,
            'chieu' => 420000,
            'toi' => 420000,
            'ngay' => 500000,
            'dem' => 520000,
            'custom' => 420000,
        ],
    ];

    public const SHIFT_ALLOWANCE = [
        'sang' => 0,
        'chieu' => 50000,
        'toi' => 75000,
        'dem' => 120000,
        'ngay' => 100000,
        'custom' => 0,
    ];

    public static function normalizeRole(string $role): string
    {
        $normalized = strtoupper(trim((string) $role));

        return match ($normalized) {
            'LE_TAN' => 'LE_TAN',
            'NHAN_VIEN_CAN_LAM_SANG' => 'NHAN_VIEN_CAN_LAM_SANG',
            'QUAN_TRI_VIEN' => 'QUAN_TRI_VIEN',
            default => 'BAC_SI',
        };
    }

    public static function normalizeShift(string $loaiCa): string
    {
        $value = strtolower(trim((string) $loaiCa));

        return array_key_exists($value, self::SHIFT_ALLOWANCE) ? $value : 'custom';
    }

    public static function dailyBaseRate(string $role, ?string $loaiCa = 'sang'): int
    {
        $roleKey = self::normalizeRole($role);
        $shift = self::normalizeShift((string) ($loaiCa ?? 'sang'));

        return self::BASE_BY_ROLE[$roleKey][$shift] ?? self::BASE_BY_ROLE[$roleKey]['custom'];
    }

    public static function shiftAllowance(string $loaiCa): int
    {
        return self::SHIFT_ALLOWANCE[self::normalizeShift($loaiCa)] ?? 0;
    }

    public static function lateMinutes(string $actualTime, string $expectedTime): int
    {
        $actual = self::toMinutes($actualTime);
        $expected = self::toMinutes($expectedTime);

        if ($actual <= 0 || $expected <= 0) {
            return 0;
        }

        if ($actual <= $expected) {
            return 0;
        }

        return $actual - $expected;
    }

    public static function earlyMinutes(string $actualTime, string $expectedEndTime): int
    {
        $actual = self::toMinutes($actualTime);
        $expected = self::toMinutes($expectedEndTime);

        if ($actual <= 0 || $expected <= 0) {
            return 0;
        }

        if ($actual >= $expected) {
            return 0;
        }

        return $expected - $actual;
    }

    /**
     * Mức phạt nhân văn theo tỷ lệ hợp lý:
     * - Dưới 15 phút: 0 VNĐ (ân hạn y tế)
     * - Từ 16 - 30 phút: 20.000 VNĐ
     * - Từ 31 - 60 phút: 40.000 VNĐ
     * - Trên 60 phút: 80.000 VNĐ (tối đa)
     */
    public static function calculatePenaltyByMinutes(int $minutes): int
    {
        if ($minutes <= 15) {
            return 0;
        }

        if ($minutes <= 30) {
            return 20000;
        }

        if ($minutes <= 60) {
            return 40000;
        }

        return 80000;
    }

    public static function calculateLatePenalty(int $lateMinutes, int $excusedMinutes = 0): int
    {
        $violationMinutes = max(0, $lateMinutes - $excusedMinutes);

        return self::calculatePenaltyByMinutes($violationMinutes);
    }

    public static function calculateEarlyPenalty(int $earlyMinutes, int $excusedMinutes = 0): int
    {
        $violationMinutes = max(0, $earlyMinutes - $excusedMinutes);

        return self::calculatePenaltyByMinutes($violationMinutes);
    }

    public static function statusFromTime(
        string $checkInTime,
        string $expectedStartTime,
        ?string $checkOutTime = null,
        ?string $expectedEndTime = null,
        int $excusedLateMinutes = 0,
        int $excusedEarlyMinutes = 0
    ): string {
        $late = self::lateMinutes($checkInTime, $expectedStartTime);
        $violationLate = max(0, $late - $excusedLateMinutes);

        $early = 0;
        $violationEarly = 0;
        if ($checkOutTime && $expectedEndTime) {
            $early = self::earlyMinutes($checkOutTime, $expectedEndTime);
            $violationEarly = max(0, $early - $excusedEarlyMinutes);
        }

        if ($late > 15) {
            if ($violationLate === 0) {
                return 'DI_MUON_CO_PHEP';
            }
            return 'MUON';
        }

        if ($early > 15) {
            if ($violationEarly === 0) {
                return 'VE_SOM_CO_PHEP';
            }
            return 'VE_SOM';
        }

        return 'CO_MAT';
    }

    public static function calculateDaySalary(array $payload): array
    {
        $role = self::normalizeRole((string) ($payload['role'] ?? 'BAC_SI'));
        $shift = self::normalizeShift((string) ($payload['loai_ca'] ?? $payload['LoaiCa'] ?? 'sang'));
        $base = self::dailyBaseRate($role, $shift);
        $allowance = self::shiftAllowance($shift);
        $lateMinutes = max(0, (int) ($payload['late_minutes'] ?? 0));
        $earlyMinutes = max(0, (int) ($payload['early_minutes'] ?? 0));
        $excusedLate = max(0, (int) ($payload['excused_late_minutes'] ?? 0));
        $excusedEarly = max(0, (int) ($payload['excused_early_minutes'] ?? 0));
        $thuong = max(0, (int) ($payload['thuong'] ?? 0));
        $nghiPhep = (int) ($payload['nghi_phep'] ?? 0);
        $vangMat = (int) ($payload['vang_mat'] ?? 0);

        $tienPhatLate = self::calculateLatePenalty($lateMinutes, $excusedLate);
        $tienPhatEarly = self::calculateEarlyPenalty($earlyMinutes, $excusedEarly);
        $tienPhat = $tienPhatLate + $tienPhatEarly;

        if ($vangMat > 0) {
            $tienPhat += $base;
        }

        if ($nghiPhep > 0) {
            $tienPhat += 0;
        }

        $tongTien = $base + $allowance + $thuong - $tienPhat;

        return [
            'role' => $role,
            'loai_ca' => $shift,
            'luong_co_ban' => $base,
            'phu_cap_ca' => $allowance,
            'tien_thuong' => $thuong,
            'tien_phat' => $tienPhat,
            'tien_phat_tre' => $tienPhatLate,
            'tien_phat_ve_som' => $tienPhatEarly,
            'tong_tien' => max(0, $tongTien),
        ];
    }

    protected static function toMinutes(?string $time): int
    {
        if ($time === null || $time === '') {
            return 0;
        }

        $normalized = trim((string) $time);

        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $normalized, $matches)) {
            $hours = (int) $matches[1];
            $minutes = (int) $matches[2];
            $seconds = isset($matches[3]) ? (int) $matches[3] : 0;

            return ($hours * 60) + $minutes + (int) round($seconds / 60);
        }

        return 0;
    }
}
