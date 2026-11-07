<?php

namespace Tests\Unit;

use App\Services\ChamCongPolicy;
use PHPUnit\Framework\TestCase;

class ChamCongPolicyTest extends TestCase
{
    public function test_it_calculates_fixed_shift_daily_salary(): void
    {
        $payload = ChamCongPolicy::calculateDaySalary([
            'role' => 'BAC_SI',
            'loai_ca' => 'sang',
            'late_minutes' => 0,
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $this->assertSame(300000, $payload['tong_tien']);
        $this->assertSame(300000, $payload['luong_co_ban']);
        $this->assertSame(0, $payload['tien_phat']);
    }

    public function test_it_applies_humane_late_penalty_and_night_shift_allowance(): void
    {
        $payload = ChamCongPolicy::calculateDaySalary([
            'role' => 'BAC_SI',
            'loai_ca' => 'dem',
            'late_minutes' => 20, // 16 - 30p: 20.000d
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $this->assertSame(350000, $payload['luong_co_ban']);
        $this->assertSame(120000, $payload['phu_cap_ca']);
        $this->assertSame(20000, $payload['tien_phat']);
        $this->assertSame(450000, $payload['tong_tien']);
    }

    public function test_it_waives_penalty_when_late_is_excused(): void
    {
        $payload = ChamCongPolicy::calculateDaySalary([
            'role' => 'BAC_SI',
            'loai_ca' => 'sang',
            'late_minutes' => 25,
            'excused_late_minutes' => 30, // Đã được Admin duyệt 30p
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $this->assertSame(0, $payload['tien_phat']);
        $this->assertSame(300000, $payload['tong_tien']);
    }

    public function test_it_penalizes_only_excess_minutes_when_exceeding_approved_excuse(): void
    {
        $payload = ChamCongPolicy::calculateDaySalary([
            'role' => 'LE_TAN',
            'loai_ca' => 'sang',
            'early_minutes' => 60, // Về sớm 60p
            'excused_early_minutes' => 30, // Admin chỉ duyệt 30p -> Vượt 30p -> Phạt 20k
            'nghi_phep' => 0,
            'vang_mat' => 0,
        ]);

        $this->assertSame(220000, $payload['luong_co_ban']);
        $this->assertSame(20000, $payload['tien_phat']);
        $this->assertSame(200000, $payload['tong_tien']);
    }
}
