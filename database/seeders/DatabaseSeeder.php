<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Chúng tôi không tạo dữ liệu mẫu ngẫu nhiên ở đây nữa.
     * Tất cả dữ liệu demo nghiệp vụ (bệnh nhân, bác sĩ, lịch làm việc, thuốc, dịch vụ)
     * phải được tạo từ lệnh smartcare:seed-demo để tránh trùng và sai lệch dữ liệu.
     */
    public function run(): void
    {
        $this->command->call('smartcare:seed-demo', ['--force' => true]);
    }
}
