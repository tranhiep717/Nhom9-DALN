<?php

namespace App\Console\Commands;

use App\Models\LichLamViec;
use Illuminate\Console\Command;

class NormalizeDoctorScheduleData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'smartcare:normalize-schedules {--apply : Apply the cleanup to the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Chuẩn hóa dữ liệu lịch làm việc theo mô hình 1 bác sĩ - 1 ca/ngày và gán loại ca cố định.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $records = LichLamViec::query()
            ->orderBy('NgayLamViec', 'asc')
            ->orderBy('GioBatDau', 'asc')
            ->get();

        $count = 0;
        $duplicateCount = 0;

        foreach ($records->groupBy(fn ($item) => $item->MaBacSi . '|' . $item->NgayLamViec) as $groupKey => $groupItems) {
            $active = $groupItems->where('TrangThai', '!=', 'DONG')->sortBy('GioBatDau')->values();
            $keepers = $active->isNotEmpty() ? $active->take(1) : $groupItems->sortBy('GioBatDau')->take(1);

            foreach ($groupItems as $item) {
                $normalizedType = LichLamViec::normalizeShiftType($item->GioBatDau, $item->GioKetThuc);
                $item->LoaiCa = $normalizedType;

                if ($this->option('apply')) {
                    $item->saveQuietly();
                }

                $count++;
            }

            if ($groupItems->count() > 1) {
                $duplicateCount += ($groupItems->count() - 1);

                if ($this->option('apply')) {
                    foreach ($groupItems as $item) {
                        $isKeep = $keepers->contains(fn ($keep) => (int) $keep->MaLichLamViec === (int) $item->MaLichLamViec);

                        if (!$isKeep) {
                            $item->update([
                                'TrangThai' => 'DONG',
                                'LoaiCa' => 'custom',
                            ]);
                        }
                    }
                }
            }
        }

        $this->info("Đã chuẩn hóa {$count} lịch làm việc.");
        $this->info('Số lịch trùng trong cùng ngày và cùng bác sĩ: ' . $duplicateCount);

        if ($this->option('apply')) {
            $this->info('Dữ liệu đã được áp dụng vào database.');
        } else {
            $this->warn('Chưa áp dụng chỉnh sửa. Chạy lệnh với --apply để lưu dữ liệu đã chuẩn hóa.');
        }

        return self::SUCCESS;
    }
}
