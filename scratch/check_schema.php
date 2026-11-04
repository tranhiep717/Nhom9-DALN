<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = Illuminate\Support\Facades\DB::select("
    SELECT table_name, column_name, column_type 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND column_name IN ('TrangThai', 'PhuongThuc')
    ORDER BY table_name
");

$tables = ['lich_hen', 'luot_kham', 'hoa_don', 'thanh_toan', 'ca_kham', 'lich_lam_viec', 'bac_si'];
foreach ($tables as $t) {
    $vals = Illuminate\Support\Facades\DB::table($t)->distinct()->pluck('TrangThai')->toArray();
    echo "{$t}.TrangThai values in DB: " . implode(', ', $vals) . "\n";
}
