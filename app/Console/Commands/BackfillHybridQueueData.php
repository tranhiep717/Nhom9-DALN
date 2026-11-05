<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillHybridQueueData extends Command
{
    /**
     * The name and signature of the console command.
     * Lưu ý: Đã loại bỏ hoàn toàn cờ --force để bảo vệ dữ liệu bệnh nhân mới.
     *
     * @var string
     */
    protected $signature = 'smartcare:backfill-hybrid-queue 
                            {--dry-run : Chế độ kiểm toán an toàn (chỉ đọc, phân tích và xuất báo cáo, KHÔNG ghi CSDL)}
                            {--apply : Thực thi cập nhật dữ liệu vào CSDL sau khi đã được phê duyệt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kiểm toán và chuyển đổi dữ liệu lịch sử theo Phương án C cho tính năng SmartCare Hybrid Queue';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // 1. Kiểm tra mâu thuẫn tùy chọn: Từ chối nếu truyền đồng thời cả 2 cờ
        if ($this->option('dry-run') && $this->option('apply')) {
            $this->error("LỖI XUNG ĐỘT TÙY CHỌN: Không được truyền đồng thời cả 2 cờ [--dry-run] và [--apply].");
            $this->line(" - Dùng [--dry-run] (hoặc không truyền cờ nào) để kiểm toán an toàn, chỉ đọc CSDL.");
            $this->line(" - Dùng [--apply] khi đã sẵn sàng thực thi cập nhật vào CSDL.");
            return Command::FAILURE;
        }

        $isApply = $this->option('apply');
        $isDryRun = !$isApply; // Mặc định luôn là dry-run nếu không có cờ --apply

        // 2. Xác thực database đang kết nối thực tế ngay trong tiến trình Artisan
        $activeDb = DB::connection()->getDatabaseName();
        $conn = config('database.default');
        $host = config("database.connections.{$conn}.host");
        $port = config("database.connections.{$conn}.port");

        $this->info("======================================================================");
        $this->info("SMARTCARE HYBRID QUEUE — BACKFILL & AUDIT DATA COMMAND (PHƯƠNG ÁN C)");
        $this->info("Chế độ thực thi: " . ($isDryRun ? "DRY-RUN (CHỈ ĐỌC / AN TOÀN TUYỆT ĐỐI)" : "APPLY (CẬP NHẬT DỮ LIỆU THẬT)"));
        $this->info("Thời gian: " . now()->toDateTimeString());
        $this->line("KẾT NỐI CSDL THỰC TẾ TRONG ARTISAN:");
        $this->line(" - Connection: {$conn}");
        $this->line(" - Host:       {$host}:{$port}");
        $this->line(" - Database:   {$activeDb}");
        $this->info("======================================================================\n");

        // Chốt chặn an toàn tuyệt đối: Không cho phép chạy --apply trên phong_kham_thong_minh ở giai đoạn này
        if ($isApply && $activeDb === 'phong_kham_thong_minh') {
            $this->error("CHẶN AN TOÀN TUYỆT ĐỐI: Database hiện tại là [phong_kham_thong_minh]. Lệnh --apply bị TỪ CHỐI!");
            $this->error("Chỉ được phép thực thi trên database thử nghiệm [phong_kham_hybrid_queue_test].");
            return Command::FAILURE;
        }

        // 3. Đọc toàn bộ các bản ghi luot_kham hiện có
        $records = DB::table('luot_kham')->orderBy('MaLuotKham', 'asc')->get();
        $total = $records->count();
        $this->info("Tổng số bản ghi luot_kham hiện có trong CSDL: {$total}");

        $group1_Appointments = []; // Ca đặt lịch đủ căn cứ cần backfill
        $group2_WalkIns = [];      // Ca trực tiếp cũ theo Phương án C (giữ MaCaKham = NULL) cần backfill
        $alreadyBackfilled = [];   // Đã có dữ liệu hợp lệ đầy đủ trước đó (bỏ qua an toàn)
        $partialRecords = [];      // Dữ liệu bán phần / không nhất quán -> BÁO LỖI VÀ CHẶN DỪNG
        $unresolvable = [];        // Không thể xác định bác sĩ / chuyên khoa

        // 4. Phân loại dữ liệu chi tiết
        foreach ($records as $r) {
            // Kiểm tra xem bảng luot_kham hiện tại đã có các cột Hybrid Queue chưa
            $hasQueueCols = property_exists($r, 'LoaiHangDoi') && property_exists($r, 'NgayKham');

            if ($hasQueueCols) {
                // KIỂM TRA 1: Bản ghi đã có dữ liệu hàng đợi hoàn chỉnh
                // TH1.1: Đặt lịch đã có đủ 8 thông tin bắt buộc
                if ($r->LoaiHangDoi === 'DAT_LICH' 
                    && !empty($r->MaLichHen)
                    && !empty($r->NgayKham)
                    && !empty($r->MaChuyenKhoa)
                    && !empty($r->MaCaKham)
                    && !is_null($r->MucUuTien)
                    && !empty($r->STTTrongNgay)
                    && !empty($r->SoPhieu)) {
                    $alreadyBackfilled[] = [
                        'record' => $r,
                        'type'   => 'DAT_LICH_FULL',
                    ];
                    continue;
                }

                // TH1.2: Trực tiếp cũ theo Phương án C (đầy đủ các trường theo chuẩn Phương án C)
                if ($r->LoaiHangDoi === 'TRUC_TIEP' 
                    && !empty($r->NgayKham) 
                    && !empty($r->MaChuyenKhoa)
                    && !is_null($r->MucUuTien)
                    && is_null($r->MaCaKham) 
                    && is_null($r->STTTrongNgay) 
                    && is_null($r->SoPhieu) 
                    && is_null($r->MaLichHen)) {
                    $alreadyBackfilled[] = [
                        'record' => $r,
                        'type'   => 'TRUC_TIEP_LEGACY_OPTION_C',
                    ];
                    continue;
                }

                // TH1.3: Trực tiếp MỚI do hệ thống mới cấp số (có đủ MaCaKham, STTTrongNgay, SoPhieu, MaChuyenKhoa, MucUuTien)
                // Tuyệt đối không được xóa hay ghi đè
                if ($r->LoaiHangDoi === 'TRUC_TIEP' 
                    && !empty($r->NgayKham) 
                    && !empty($r->MaChuyenKhoa)
                    && !empty($r->MaCaKham) 
                    && !is_null($r->MucUuTien)
                    && !empty($r->STTTrongNgay) 
                    && !empty($r->SoPhieu)
                    && is_null($r->MaLichHen)) {
                    $alreadyBackfilled[] = [
                        'record' => $r,
                        'type'   => 'TRUC_TIEP_NEW_RUNTIME',
                    ];
                    continue;
                }

                // KIỂM TRA 2: Bản ghi có dữ liệu BÁN PHẦN / BẤT THƯỜNG (PARTIAL DATA)
                // TH2.1: Có NgayKham nhưng thiếu LoaiHangDoi
                if (!empty($r->NgayKham) && empty($r->LoaiHangDoi)) {
                    $partialRecords[] = [
                        'record' => $r,
                        'reason' => 'Có NgayKham nhưng thiếu LoaiHangDoi',
                    ];
                    continue;
                }

                // TH2.2: Có LoaiHangDoi nhưng thiếu NgayKham
                if (!empty($r->LoaiHangDoi) && empty($r->NgayKham)) {
                    $partialRecords[] = [
                        'record' => $r,
                        'reason' => 'Có LoaiHangDoi nhưng thiếu NgayKham',
                    ];
                    continue;
                }

                // TH2.3: Bản ghi DAT_LICH nhưng thiếu một trong các trường bắt buộc
                if ($r->LoaiHangDoi === 'DAT_LICH') {
                    $missing = [];
                    if (empty($r->MaLichHen)) $missing[] = 'MaLichHen';
                    if (empty($r->NgayKham)) $missing[] = 'NgayKham';
                    if (empty($r->MaChuyenKhoa)) $missing[] = 'MaChuyenKhoa';
                    if (empty($r->MaCaKham)) $missing[] = 'MaCaKham';
                    if (is_null($r->MucUuTien)) $missing[] = 'MucUuTien';
                    if (empty($r->STTTrongNgay)) $missing[] = 'STTTrongNgay';
                    if (empty($r->SoPhieu)) $missing[] = 'SoPhieu';
                    $partialRecords[] = [
                        'record' => $r,
                        'reason' => 'Lượt khám DAT_LICH bị thiếu trường: ' . implode(', ', $missing),
                    ];
                    continue;
                }

                // TH2.4: Bản ghi TRUC_TIEP nhưng không nhất quán
                if ($r->LoaiHangDoi === 'TRUC_TIEP') {
                    $missing = [];
                    if (empty($r->NgayKham)) $missing[] = 'NgayKham';
                    if (empty($r->MaChuyenKhoa)) $missing[] = 'MaChuyenKhoa';
                    if (is_null($r->MucUuTien)) $missing[] = 'MucUuTien';
                    if (!is_null($r->MaLichHen)) $missing[] = 'MaLichHen (phải là NULL)';
                    
                    $hasCa = !empty($r->MaCaKham);
                    $hasStt = !empty($r->STTTrongNgay);
                    $hasPhieu = !empty($r->SoPhieu);
                    if (($hasCa || $hasStt || $hasPhieu) && !($hasCa && $hasStt && $hasPhieu)) {
                        $missing[] = 'Bộ ba Ca/STT/Số phiếu dở dang';
                    }

                    if (!empty($missing)) {
                        $partialRecords[] = [
                            'record' => $r,
                            'reason' => 'Lượt khám TRUC_TIEP không nhất quán: ' . implode(', ', $missing),
                        ];
                        continue;
                    }
                }
            }

            // KIỂM TRA 3: Bản ghi chưa từng được gắn dữ liệu hàng đợi -> Tiến hành phân tích backfill
            // A. Nhóm 1: Bệnh nhân Đặt lịch trước (MaLichHen != NULL)
            if ($r->MaLichHen !== null) {
                $lh = DB::table('lich_hen')->where('MaLichHen', $r->MaLichHen)->first();
                if ($lh && $lh->MaCaKham) {
                    $ck = DB::table('ca_kham')->where('MaCaKham', $lh->MaCaKham)->first();
                    $llv = $ck ? DB::table('lich_lam_viec')->where('MaLichLamViec', $ck->MaLichLamViec)->first() : null;
                    $bs = $r->MaBacSi ? DB::table('bac_si')->where('MaBacSi', $r->MaBacSi)->first() : null;
                    $maChuyenKhoa = $bs?->MaChuyenKhoa ?? 1;
                    $ngayKham = $llv?->NgayLamViec ?? substr($r->ThoiGianTiepNhan, 0, 10);

                    $group1_Appointments[] = [
                        'record'          => $r,
                        'MaCaKham'        => $lh->MaCaKham,
                        'MaChuyenKhoa'    => $maChuyenKhoa,
                        'NgayKham'        => $ngayKham,
                        'LoaiHangDoi'     => 'DAT_LICH',
                        'MucUuTien'       => 2, // P2: Lịch hẹn hợp lệ
                        'ThoiGianVaoHang' => $r->ThoiGianTiepNhan, // FIFO theo thời điểm check-in thực tế
                    ];
                    continue;
                }
            }

            // B. Nhóm 2: Bệnh nhân Khám trực tiếp cũ (MaLichHen IS NULL) — PHƯƠNG ÁN C
            $bs = $r->MaBacSi ? DB::table('bac_si')->where('MaBacSi', $r->MaBacSi)->first() : null;
            if ($bs && $bs->MaChuyenKhoa) {
                $group2_WalkIns[] = [
                    'record'          => $r,
                    'MaBacSi'         => $r->MaBacSi,
                    'MaChuyenKhoa'    => $bs->MaChuyenKhoa,
                    'NgayKham'        => substr($r->ThoiGianTiepNhan, 0, 10),
                    'MaCaKham'        => null, // PHƯƠNG ÁN C: Giữ nguyên NULL vì không có chứng từ ca lịch sử
                    'LoaiHangDoi'     => 'TRUC_TIEP',
                    'MucUuTien'       => 3, // P3: Trực tiếp tiêu chuẩn
                    'ThoiGianVaoHang' => $r->ThoiGianTiepNhan,
                    'STTTrongNgay'    => null, // Không cấp số thứ tự ca cho ca không rõ
                    'SoPhieu'         => null, // Không cấp số phiếu ca cho ca không rõ
                ];
            } else {
                $unresolvable[] = $r;
            }
        }

        // 4. CHẶN DỪNG NẾU CÓ DỮ LIỆU BÁN PHẦN (FAIL-FAST AN TOÀN)
        if (count($partialRecords) > 0) {
            $this->error("\n======================================================================");
            $this->error("LỖI DỮ LIỆU BÁN PHẦN / BẤT THƯỜNG (PARTIAL DATA CORRUPTION DETECTED)!");
            $this->error("Phát hiện " . count($partialRecords) . " bản ghi có dữ liệu Hybrid Queue không nhất quán.");
            $this->error("Để đảm bảo an toàn tuyệt đối, tiến trình TỪ CHỐI thực thi và dừng lại ngay lập tức.");
            $this->error("Vui lòng kiểm tra và xử lý thủ công các bản ghi sau trước khi chạy lại command:");
            $this->error("======================================================================");
            $this->table(
                ['Mã LK', 'Mã BN', 'Ngày Khám', 'Loại Hàng Đợi', 'Mã Ca', 'STT', 'Số Phiếu', 'Lý do cảnh báo'],
                array_map(function ($p) {
                    $rec = $p['record'];
                    return [
                        $rec->MaLuotKham,
                        $rec->MaBenhNhan,
                        $rec->NgayKham ?? 'NULL',
                        $rec->LoaiHangDoi ?? 'NULL',
                        $rec->MaCaKham ?? 'NULL',
                        $rec->STTTrongNgay ?? 'NULL',
                        $rec->SoPhieu ?? 'NULL',
                        $p['reason'],
                    ];
                }, $partialRecords)
            );
            return Command::FAILURE;
        }

        // 5. Tính toán STTTrongNgay và SoPhieu cho Nhóm 1 (Đặt lịch)
        $scopeCounters = []; // Lưu trữ [NgayKham_MaCaKham_MaChuyenKhoa] => int
        foreach ($group1_Appointments as &$item) {
            $scopeKey = $item['NgayKham'] . '_' . $item['MaCaKham'] . '_' . $item['MaChuyenKhoa'];
            if (!isset($scopeCounters[$scopeKey])) {
                $scopeCounters[$scopeKey] = 0;
            }
            $scopeCounters[$scopeKey]++;
            $stt = $scopeCounters[$scopeKey];

            $item['STTTrongNgay'] = $stt;
            $item['SoPhieu'] = $this->formatTicketNumber($item['MaChuyenKhoa'], $item['MaCaKham'], $stt);
        }
        unset($item);

        // 6. Báo cáo Nhóm 1: Có thể chuyển đổi đầy đủ
        $this->info("----------------------------------------------------------------------");
        $this->info("NHÓM 1: CÓ THỂ BACKFILL ĐẦY ĐỦ CẢ CA KHÁM VÀ SỐ THỨ TỰ (" . count($group1_Appointments) . " bản ghi)");
        $this->info("----------------------------------------------------------------------");
        $this->table(
            ['Mã LK', 'Mã LH', 'Mã BN', 'Mã BS', 'Mã Khoa', 'Mã Ca', 'Ngày Khám', 'Loại Hàng Đợi', 'Ưu Tiên', 'STT', 'Số Phiếu'],
            array_map(function ($item) {
                return [
                    $item['record']->MaLuotKham,
                    $item['record']->MaLichHen,
                    $item['record']->MaBenhNhan,
                    $item['record']->MaBacSi,
                    $item['MaChuyenKhoa'],
                    $item['MaCaKham'],
                    $item['NgayKham'],
                    $item['LoaiHangDoi'],
                    $item['MucUuTien'],
                    $item['STTTrongNgay'],
                    $item['SoPhieu'],
                ];
            }, $group1_Appointments)
        );

        // 7. Báo cáo Nhóm 2: Phương án C (Giữ MaCaKham = NULL)
        $this->warn("\n----------------------------------------------------------------------");
        $this->warn("NHÓM 2: PHƯƠNG ÁN C — GIỮ MaCaKham = NULL, SoPhieu = NULL (" . count($group2_WalkIns) . " bản ghi)");
        $this->warn("Lý do: Không có chứng từ ca khám lịch sử; bảo toàn tính trung thực của dữ liệu cũ.");
        $this->warn("----------------------------------------------------------------------");
        $this->table(
            ['Mã LK', 'Mã BN', 'Mã BS', 'Mã Khoa', 'Mã Ca', 'Ngày Khám', 'Loại Hàng Đợi', 'Ưu Tiên', 'STT', 'Số Phiếu', 'Ghi Chú'],
            array_map(function ($item) {
                return [
                    $item['record']->MaLuotKham,
                    $item['record']->MaBenhNhan,
                    $item['MaBacSi'],
                    $item['MaChuyenKhoa'],
                    'NULL',
                    $item['NgayKham'],
                    $item['LoaiHangDoi'],
                    $item['MucUuTien'],
                    'NULL',
                    'NULL',
                    'Giữ nguyên NULL theo Phương án C',
                ];
            }, $group2_WalkIns)
        );

        // 8. Báo cáo các bản ghi đã backfill trước đó (nếu có)
        if (count($alreadyBackfilled) > 0) {
            $this->line("\n[BẢN GHI ĐÃ XỬ LÝ TRƯỚC ĐÓ]: " . count($alreadyBackfilled) . " bản ghi đã có dữ liệu hàng đợi hoàn chỉnh. Bỏ qua để bảo toàn tính toàn vẹn.");
        }

        // 9. Báo cáo các bản ghi không thể xử lý (nếu có)
        if (count($unresolvable) > 0) {
            $this->error("\n[BẢN GHI LỖI]: " . count($unresolvable) . " bản ghi thiếu thông tin bác sĩ/chuyên khoa không thể xác định.");
        }

        // 10. Báo cáo tổng hợp số bộ đếm hang_doi_counter dự kiến khởi tạo
        $this->info("\n----------------------------------------------------------------------");
        $this->info("BẢNG BỘ ĐẾM hang_doi_counter DỰ KIẾN ĐƯỢC KHỞI TẠO (" . count($scopeCounters) . " phạm vi ca khám)");
        $this->info("Lưu ý: CHỈ khởi tạo từ các bản ghi có đầy đủ (NgayKham + MaCaKham + MaChuyenKhoa).");
        $this->info("----------------------------------------------------------------------");
        $counterRows = [];
        foreach ($scopeCounters as $k => $maxStt) {
            [$ngay, $ca, $khoa] = explode('_', $k);
            $counterRows[] = [
                'NgayKham'     => $ngay,
                'MaCaKham'     => $ca,
                'MaChuyenKhoa' => $khoa,
                'SoHienTai'    => $maxStt,
                'GhiChu'       => "MAX(STTTrongNgay) của dữ liệu cũ",
            ];
        }
        $this->table(['Ngày Khám', 'Mã Ca Khám', 'Mã Chuyên Khoa', 'Số Hiện Tại', 'Ghi Chú'], $counterRows);

        // 11. Xử lý chế độ DRY-RUN
        if ($isDryRun) {
            $this->info("\n======================================================================");
            $this->info("[KẾT THÚC DRY-RUN AN TOÀN]");
            $this->info(" - Tổng số bản ghi phân tích: {$total}");
            $this->info(" - Bản ghi Nhóm 1 (Đặt lịch - Cần backfill): " . count($group1_Appointments));
            $this->info(" - Bản ghi Nhóm 2 (Trực tiếp - Giữ MaCaKham NULL theo Phương án C): " . count($group2_WalkIns));
            $this->info(" - Bản ghi đã xử lý trước đó (Bỏ qua an toàn): " . count($alreadyBackfilled));
            $this->info(" - Bản ghi lỗi dữ liệu bán phần: " . count($partialRecords));
            $this->info(" - Bản ghi không xác định: " . count($unresolvable));
            $this->info(" - Dữ liệu CSDL thật: HOÀN TOÀN KHÔNG BỊ THAY ĐỔI (0 byte written).");
            $this->info("======================================================================\n");
            return Command::SUCCESS;
        }

        // 12. Xử lý chế độ APPLY (Có transaction bảo vệ)
        $this->warn("\n======================================================================");
        $this->warn("[CẢNH BÁO CHẾ ĐỘ APPLY]: Chuẩn bị cập nhật dữ liệu vào CSDL!");
        $this->warn("======================================================================");
        if (!$this->confirm("Bạn có chắc chắn 100% muốn thực thi cập nhật các bản ghi trên không?")) {
            $this->info("Thao tác bị hủy bỏ bởi người dùng.");
            return Command::SUCCESS;
        }

        DB::transaction(function () use ($group1_Appointments, $group2_WalkIns, $counterRows) {
            // A. Cập nhật Nhóm 1 (Đặt lịch)
            foreach ($group1_Appointments as $item) {
                DB::table('luot_kham')->where('MaLuotKham', $item['record']->MaLuotKham)->update([
                    'NgayKham'        => $item['NgayKham'],
                    'LoaiHangDoi'     => $item['LoaiHangDoi'],
                    'MaChuyenKhoa'    => $item['MaChuyenKhoa'],
                    'MaCaKham'        => $item['MaCaKham'],
                    'MucUuTien'       => $item['MucUuTien'],
                    'ThoiGianVaoHang' => $item['ThoiGianVaoHang'],
                    'STTTrongNgay'    => $item['STTTrongNgay'],
                    'SoPhieu'         => $item['SoPhieu'],
                ]);
            }

            // B. Cập nhật Nhóm 2 (Trực tiếp - Phương án C: MaCaKham = NULL)
            foreach ($group2_WalkIns as $item) {
                DB::table('luot_kham')->where('MaLuotKham', $item['record']->MaLuotKham)->update([
                    'NgayKham'        => $item['NgayKham'],
                    'LoaiHangDoi'     => $item['LoaiHangDoi'],
                    'MaChuyenKhoa'    => $item['MaChuyenKhoa'],
                    'MaCaKham'        => null,
                    'MucUuTien'       => $item['MucUuTien'],
                    'ThoiGianVaoHang' => $item['ThoiGianVaoHang'],
                    'STTTrongNgay'    => null,
                    'SoPhieu'         => null,
                ]);
            }

            // C. Khởi tạo bảng hang_doi_counter
            foreach ($counterRows as $c) {
                DB::statement("
                    INSERT INTO hang_doi_counter (NgayKham, MaCaKham, MaChuyenKhoa, SoHienTai, UpdatedAt)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        SoHienTai = GREATEST(SoHienTai, VALUES(SoHienTai)),
                        UpdatedAt = NOW()
                ", [$c['NgayKham'], $c['MaCaKham'], $c['MaChuyenKhoa'], $c['SoHienTai']]);
            }
        });

        $this->info("[APPLY HOÀN TẤT]: Đã cập nhật thành công và đồng bộ an toàn 100% dữ liệu.");
        return Command::SUCCESS;
    }

    /**
     * Định dạng số phiếu hiển thị thân thiện, phân biệt rõ ràng giữa các ca khám độc lập
     * Cấu trúc: [PREFIX_KHOA]-C[Mã Ca Khám]-[STT 3 chữ số]
     * Ví dụ: NTQ-C76-001 (Khoa NTQ, Ca khám 76, STT 1)
     *        NTQ-C85-001 (Khoa NTQ, Ca khám 85, STT 1)
     */
    protected function formatTicketNumber(int $maChuyenKhoa, int $maCaKham, int $stt): string
    {
        $ck = DB::table('chuyen_khoa')->where('MaChuyenKhoa', $maChuyenKhoa)->first();

        // Ký hiệu chuyên khoa (3 chữ cái viết tắt hoặc K{ID})
        $prefix = 'KB';
        if ($ck && !empty($ck->TenChuyenKhoa)) {
            $words = explode(' ', trim($ck->TenChuyenKhoa));
            $abbr = '';
            foreach ($words as $w) {
                if (!empty($w)) $abbr .= mb_substr($w, 0, 1);
            }
            $cleanAbbr = preg_replace('/[^A-Za-z0-9]/', '', $abbr);
            $prefix = !empty($cleanAbbr) ? mb_strtoupper(mb_substr($cleanAbbr, 0, 3)) : 'K' . $maChuyenKhoa;
        } else {
            $prefix = 'K' . $maChuyenKhoa;
        }

        // Định dạng số phiếu gắn liền với Mã Ca Khám C{MaCaKham} để triệt tiêu hoàn toàn trùng số
        return sprintf("%s-C%d-%03d", $prefix, $maCaKham, $stt);
    }
}
