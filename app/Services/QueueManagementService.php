<?php

namespace App\Services;

use App\Models\BacSi;
use App\Models\BenhNhan;
use App\Models\CaKham;
use App\Models\ChuyenKhoa;
use App\Models\LichHen;
use App\Models\LuotKham;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use RuntimeException;

class QueueManagementService
{
    /**
     * Số lần thử lại tối đa khi gặp lỗi Deadlock (1213) hoặc Lock Wait Timeout (1205)
     */
    protected const MAX_DEADLOCK_RETRIES = 3;

    /**
     * 1. TIẾP NHẬN BỆNH NHÂN ĐẶT LỊCH HẸN (P2)
     *
     * @param int $maLichHen Mã lịch hẹn cần tiếp nhận
     * @param int|null $nguoiTiepNhanId Mã tài khoản nhân viên tiếp nhận
     * @return LuotKham
     * @throws ValidationException
     */
    public function checkInAppointment(int $maLichHen, ?int $nguoiTiepNhanId = null): LuotKham
    {
        return DB::transaction(function () use ($maLichHen, $nguoiTiepNhanId) {
            // A. Khóa bi quan bản ghi lịch hẹn để chống race condition 2 request check-in cùng lúc
            $lichHen = LichHen::with(['caKham.lichLamViec.bacSi'])
                ->where('MaLichHen', $maLichHen)
                ->lockForUpdate()
                ->first();

            if (!$lichHen) {
                throw ValidationException::withMessages([
                    'MaLichHen' => 'Không tìm thấy thông tin lịch hẹn trong hệ thống.',
                ]);
            }

            // B. Kiểm tra trạng thái lịch hẹn hợp lệ
            if ($nguoiTiepNhanId !== null && !DB::table('tai_khoan')->where('MaTaiKhoan', $nguoiTiepNhanId)->exists()) {
                throw ValidationException::withMessages([
                    'NguoiXacNhanUuTien' => 'Tài khoản người tiếp nhận không tồn tại trong hệ thống.',
                ]);
            }

            if ($lichHen->TrangThai === 'DA_TIEP_NHAN') {
                throw ValidationException::withMessages([
                    'MaLichHen' => 'Lịch hẹn này đã được tiếp nhận vào hàng đợi trước đó.',
                ]);
            }

            if (in_array($lichHen->TrangThai, ['DA_HUY', 'HOAN_THANH'])) {
                throw ValidationException::withMessages([
                    'MaLichHen' => "Lịch hẹn đang ở trạng thái '{$lichHen->TrangThai}', không thể tiếp nhận vào hàng đợi.",
                ]);
            }

            // C. Ngăn chặn check-in 2 lần: Kiểm tra ràng buộc duy nhất trong luot_kham
            $existingVisit = LuotKham::where('MaLichHen', $maLichHen)->lockForUpdate()->first();
            if ($existingVisit) {
                throw ValidationException::withMessages([
                    'MaLichHen' => 'Đã tồn tại lượt khám liên kết với lịch hẹn này.',
                ]);
            }

            // D. Kiểm tra ca khám và lịch làm việc
            $caKham = $lichHen->caKham;
            if (!$caKham || !$caKham->lichLamViec) {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Không tìm thấy ca khám hoặc lịch làm việc liên kết với lịch hẹn.',
                ]);
            }

            $lichLamViec = $caKham->lichLamViec;
            if ($caKham->TrangThai === 'DA_HUY' || $lichLamViec->TrangThai === 'DA_HUY') {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Ca khám hoặc lịch làm việc liên kết đã bị hủy, không thể tiếp nhận.',
                ]);
            }

            $maBacSi = $lichLamViec->MaBacSi;
            $bacSi = $lichLamViec->bacSi;
            if (!$bacSi || !$bacSi->MaChuyenKhoa) {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Không tìm thấy thông tin bác sĩ hoặc chuyên khoa phụ trách ca khám.',
                ]);
            }
            $maChuyenKhoa = $bacSi->MaChuyenKhoa;
            $ngayKham = $lichLamViec->NgayLamViec;

            // Kiểm tra ngày khám của lịch hẹn phải là ngày hôm nay (trừ khi môi trường test cho phép)
            $today = now()->toDateString();
            if ($ngayKham !== $today && !app()->runningUnitTests()) {
                throw ValidationException::withMessages([
                    'MaLichHen' => "Lịch hẹn này có ngày khám là {$ngayKham}, không phải ngày hôm nay ({$today}). Lễ tân chỉ tiếp nhận lịch hẹn trong ngày khám thực tế.",
                ]);
            }

            // E. Cấp số thứ tự nguyên tử cho hàng đợi
            $counterData = $this->generateNextTicketNumber($ngayKham, $caKham->MaCaKham, $maChuyenKhoa);
            $stt = $counterData['stt'];
            $soPhieu = $counterData['so_phieu'];

            // F. Tạo lượt khám với mức ưu tiên P2 (Đặt lịch đã check-in)
            $luotKham = LuotKham::create([
                'MaLichHen'          => $maLichHen,
                'MaBenhNhan'         => $lichHen->MaBenhNhan,
                'MaBacSi'            => $maBacSi,
                'MaChuyenKhoa'       => $maChuyenKhoa,
                'MaCaKham'           => $caKham->MaCaKham,
                'NgayKham'           => $ngayKham,
                'LoaiHangDoi'        => 'DAT_LICH',
                'MucUuTien'          => 2, // P2: Lịch hẹn hợp lệ
                'STTTrongNgay'       => $stt,
                'SoPhieu'            => $soPhieu,
                'ThoiGianTiepNhan'   => now(),
                'ThoiGianVaoHang'    => now(),
                'TrangThai'          => 'CHO_KHAM',
                'NguoiXacNhanUuTien' => $nguoiTiepNhanId,
                'MaTaiKhoanTiepNhan' => $nguoiTiepNhanId,
                'GhiChu'             => $lichHen->LyDoKham,
            ]);

            // G. Cập nhật trạng thái lịch hẹn sang DA_TIEP_NHAN
            $lichHen->update([
                'TrangThai' => 'DA_TIEP_NHAN',
            ]);

            return $luotKham;
        });
    }

    /**
     * 2. TIẾP NHẬN BỆNH NHÂN TRỰC TIẾP (P3)
     *
     * @param int $maBenhNhan Mã bệnh nhân
     * @param int $maChuyenKhoa Mã chuyên khoa khám
     * @param int $maCaKham Mã ca khám được phân bổ
     * @param int|null $nguoiTiepNhanId Mã tài khoản nhân viên tiếp nhận
     * @param int $mucUuTien Mức ưu tiên (Chỉ chấp nhận 3: P3 trong giai đoạn này)
     * @return LuotKham
     * @throws ValidationException|InvalidArgumentException
     */
    public function registerWalkIn(
        int $maBenhNhan,
        int $maChuyenKhoa,
        int $maCaKham,
        ?int $nguoiTiepNhanId = null,
        int $mucUuTien = 3,
        ?string $ghiChu = null
    ): LuotKham {
        // A. Chốt chặn quy tắc nghiệp vụ: Từ chối P0/P1 trong hàng đợi thông thường
        if ($mucUuTien !== 3) {
            throw new InvalidArgumentException(
                "Hàng đợi tiếp nhận thông thường chỉ cấp số cho bệnh nhân trực tiếp tiêu chuẩn (P3). " .
                "Cấp cứu (P0) phải chuyển sang luồng cấp cứu riêng, ưu tiên chính sách (P1) chưa được kích hoạt."
            );
        }

        return DB::transaction(function () use ($maBenhNhan, $maChuyenKhoa, $maCaKham, $nguoiTiepNhanId, $ghiChu) {
            // Kiểm tra người tiếp nhận nếu có
            if ($nguoiTiepNhanId !== null && !DB::table('tai_khoan')->where('MaTaiKhoan', $nguoiTiepNhanId)->exists()) {
                throw ValidationException::withMessages([
                    'NguoiXacNhanUuTien' => 'Tài khoản người tiếp nhận không tồn tại trong hệ thống.',
                ]);
            }

            // B. Kiểm tra bệnh nhân tồn tại
            $benhNhan = BenhNhan::find($maBenhNhan);
            if (!$benhNhan) {
                throw ValidationException::withMessages([
                    'MaBenhNhan' => 'Không tìm thấy hồ sơ bệnh nhân trong hệ thống.',
                ]);
            }

            // C. Kiểm tra chuyên khoa tồn tại
            $chuyenKhoa = ChuyenKhoa::find($maChuyenKhoa);
            if (!$chuyenKhoa) {
                throw ValidationException::withMessages([
                    'MaChuyenKhoa' => 'Chuyên khoa khám không tồn tại.',
                ]);
            }

            // D. Kiểm tra ca khám hợp lệ và thuộc chuyên khoa phù hợp
            $caKham = CaKham::with(['lichLamViec.bacSi'])->find($maCaKham);
            if (!$caKham || !$caKham->lichLamViec) {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Ca khám không tồn tại hoặc chưa được gắn lịch làm việc.',
                ]);
            }

            $lichLamViec = $caKham->lichLamViec;
            $bacSi = $lichLamViec->bacSi;
            if (!$bacSi || $bacSi->MaChuyenKhoa !== $maChuyenKhoa) {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Ca khám không thuộc chuyên khoa đã chọn.',
                ]);
            }

            // Kiểm tra trạng thái ca khám có mở tiếp nhận không
            if (!in_array($caKham->TrangThai, ['CON_TRONG', 'MO']) || $lichLamViec->TrangThai !== 'MO') {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Ca khám hiện không mở để tiếp nhận bệnh nhân.',
                ]);
            }

            $ngayKham = $lichLamViec->NgayLamViec;

            // E. Cấp số thứ tự nguyên tử
            $counterData = $this->generateNextTicketNumber($ngayKham, $maCaKham, $maChuyenKhoa);
            $stt = $counterData['stt'];
            $soPhieu = $counterData['so_phieu'];

            // F. Tạo lượt khám với mức ưu tiên P3 (Trực tiếp thông thường)
            $luotKham = LuotKham::create([
                'MaLichHen'          => null,
                'MaBenhNhan'         => $maBenhNhan,
                'MaBacSi'            => $bacSi->MaBacSi,
                'MaChuyenKhoa'       => $maChuyenKhoa,
                'MaCaKham'           => $maCaKham,
                'NgayKham'           => $ngayKham,
                'LoaiHangDoi'        => 'TRUC_TIEP',
                'MucUuTien'          => 3, // P3: Trực tiếp tiêu chuẩn
                'STTTrongNgay'       => $stt,
                'SoPhieu'            => $soPhieu,
                'ThoiGianTiepNhan'   => now(),
                'ThoiGianVaoHang'    => now(),
                'TrangThai'          => 'CHO_KHAM',
                'NguoiXacNhanUuTien' => $nguoiTiepNhanId,
                'MaTaiKhoanTiepNhan' => $nguoiTiepNhanId,
                'GhiChu'             => $ghiChu,
            ]);

            return $luotKham;
        });
    }

    /**
     * 3. BÁC SĨ GỌI BỆNH NHÂN TIẾP THEO (CALL NEXT PATIENT)
     *
     * @param int $maBacSi Mã bác sĩ đang trực
     * @param int $maCaKham Mã ca khám bác sĩ đang thực hiện
     * @return LuotKham|null Trả về lượt khám được gọi hoặc null nếu hàng đợi trống
     * @throws ValidationException|AuthorizationException|RuntimeException
     */
    public function callNextPatient(int $maBacSi, int $maCaKham): ?LuotKham
    {
        return DB::transaction(function () use ($maBacSi, $maCaKham) {
            // A. Khóa bi quan bản ghi bác sĩ để ngăn chặn race condition (double-click từ cùng 1 bác sĩ)
            $bacSi = BacSi::where('MaBacSi', $maBacSi)->lockForUpdate()->first();
            if (!$bacSi) {
                throw ValidationException::withMessages([
                    'MaBacSi' => 'Không tìm thấy hồ sơ bác sĩ trong hệ thống.',
                ]);
            }

            // B. Kiểm tra ca khám thuộc lịch làm việc của chính bác sĩ
            $caKham = CaKham::with('lichLamViec')->find($maCaKham);
            if (!$caKham || !$caKham->lichLamViec) {
                throw ValidationException::withMessages([
                    'MaCaKham' => 'Ca khám không tồn tại hoặc chưa được gắn lịch làm việc.',
                ]);
            }

            if ($caKham->lichLamViec->MaBacSi !== $maBacSi) {
                throw new AuthorizationException('Bác sĩ không phụ trách ca khám này.');
            }

            $ngayKham = $caKham->lichLamViec->NgayLamViec;
            $maChuyenKhoa = $bacSi->MaChuyenKhoa;

            // C. Quy định bác sĩ đơn ca: Bác sĩ không được có lượt khám khác đang DANG_KHAM
            $activeExaminingVisit = LuotKham::where('MaBacSi', $maBacSi)
                ->where('TrangThai', 'DANG_KHAM')
                ->first();

            if ($activeExaminingVisit) {
                throw new RuntimeException(
                    "Bác sĩ đang có ca khám #{$activeExaminingVisit->MaLuotKham} chưa hoàn tất. " .
                    "Vui lòng hoàn thành hoặc chỉ định cận lâm sàng trước khi gọi bệnh nhân tiếp theo."
                );
            }

            // D. Truy vấn ứng viên bệnh nhân tiếp theo với FOR UPDATE
            // Lọc đúng: Ngày khám, Ca khám, Chuyên khoa, và trạng thái CHO_KHAM / CHO_KHAM_LAI
            // CHÍNH SÁCH CHÍNH THỨC (PHASE 5.1): FIFO CHUNG THEO THỜI GIAN VÀO HÀNG (ThoiGianVaoHang ASC)
            // - P2 (Đặt lịch) và P3 (Trực tiếp) nằm chung một hàng đợi, KHÔNG ưu tiên P2 trước P3.
            // - Bệnh nhân tái khám CLS tham gia hàng đợi theo đúng thời điểm quay lại thực tế, KHÔNG ưu tiên hơn P2/P3.
            // - Tiêu chí phụ nếu cùng thời gian vào hàng: MaLuotKham ASC.
            $nextPatient = LuotKham::where('NgayKham', $ngayKham)
                ->where('MaCaKham', $maCaKham)
                ->where('MaChuyenKhoa', $maChuyenKhoa)
                ->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])
                ->orderBy('ThoiGianVaoHang', 'asc')
                ->orderBy('MaLuotKham', 'asc')
                ->lockForUpdate()
                ->first();

            if (!$nextPatient) {
                return null; // Hàng đợi không còn bệnh nhân chờ
            }

            // Ghi nhận sự kiện gọi khám vào lịch sử hàng đợi
            $callNumber = $this->getCallCount($nextPatient) + 1;
            $this->addQueueEvent($nextPatient, 'GOI_KHAM', $maBacSi, [
                'call_number' => $callNumber,
                'action'      => 'CALL_NEXT_PATIENT',
                'time'        => now()->toDateTimeString(),
            ]);

            // E. Cập nhật trạng thái chuyển sang DANG_KHAM
            $updateData = [
                'TrangThai'       => 'DANG_KHAM',
                'ThoiGianGoiKham' => now(),
                'MaBacSi'         => $maBacSi,
            ];
            if ($nextPatient->ThoiGianBatDauKham === null) {
                $updateData['ThoiGianBatDauKham'] = now();
            }

            $nextPatient->update($updateData);

            return $nextPatient->fresh();
        });
    }

    /**
     * GHI NHẬN MỖI LẦN GỌI BỆNH NHÂN (CALL HISTORY & SPEAKER CALL)
     * - Lưu vết chi tiết từng lần gọi: MaLuotKham, loại sự kiện, người thực hiện, thời điểm, idempotency token.
     * - Chống ghi nhận trùng lặp bằng Idempotency Token (UUID do client sinh per-click) thay cho debounce thời gian.
     *
     * @param int $maLuotKham Mã lượt khám
     * @param int $userId ID tài khoản người thực hiện thao tác gọi (Bác sĩ hoặc Lễ tân)
     * @param string|null $note Ghi chú bổ sung
     * @param string|null $token Khóa Idempotency Token chống trùng request mạng/retry
     * @return array ['call_count' => int, 'can_skip' => bool, 'visit' => LuotKham, 'deduplicated' => bool, 'token' => string]
     * @throws ValidationException
     */
    public function recordPatientCall(int $maLuotKham, int $userId, ?string $note = null, ?string $token = null): array
    {
        return DB::transaction(function () use ($maLuotKham, $userId, $note, $token) {
            $visit = LuotKham::where('MaLuotKham', $maLuotKham)->lockForUpdate()->first();
            if (!$visit) {
                throw ValidationException::withMessages([
                    'MaLuotKham' => 'Không tìm thấy lượt khám trong hệ thống.',
                ]);
            }

            // Chỉ ghi nhận cuộc gọi cho bệnh nhân đang trong trạng thái chờ
            if (!in_array($visit->TrangThai, ['CHO_KHAM', 'CHO_KHAM_LAI'])) {
                throw ValidationException::withMessages([
                    'TrangThai' => "Chỉ có thể gọi bệnh nhân đang ở trạng thái chờ khám (CHO_KHAM / CHO_KHAM_LAI). Trạng thái hiện tại: {$visit->TrangThai}",
                ]);
            }

            $events = $this->getQueueEvents($visit);

            // Chống ghi nhận trùng bằng Idempotency Token:
            // Nếu cùng một token đã được ghi nhận trong lịch sử sự kiện của lượt khám này, trả về kết quả cũ
            if (!empty($token)) {
                $existingCall = null;
                foreach ($events as $e) {
                    if (($e['event'] ?? '') === 'GOI_KHAM' && ($e['token'] ?? '') === $token) {
                        $existingCall = $e;
                        break;
                    }
                }

                if ($existingCall) {
                    $currentCount = $this->getCallCount($visit);
                    return [
                        'call_count'   => $currentCount,
                        'can_skip'     => ($currentCount >= 3),
                        'visit'        => $visit,
                        'deduplicated' => true,
                        'token'        => $token,
                    ];
                }
            }

            $effectiveToken = !empty($token) ? $token : (string) \Illuminate\Support\Str::uuid();
            $callNumber = $this->getCallCount($visit) + 1;
            $this->addQueueEvent($visit, 'GOI_KHAM', $userId, [
                'call_number' => $callNumber,
                'token'       => $effectiveToken,
                'action'      => 'SPEAKER_CALL',
                'note'        => $note,
                'time'        => now()->toDateTimeString(),
            ]);

            $visit->ThoiGianGoiKham = now();
            $visit->save();

            return [
                'call_count'   => $callNumber,
                'can_skip'     => ($callNumber >= 3),
                'visit'        => $visit->fresh(),
                'deduplicated' => false,
                'token'        => $effectiveToken,
            ];
        });
    }

    /**
     * TIẾP NHẬN BỆNH NHÂN QUAY LẠI SAU CẬN LÂM SÀNG (CLS RETURN)
     * - Dùng lại MaLuotKham cũ, giữ nguyên SoPhieu.
     * - KHÔNG tạo lượt khám mới, KHÔNG cấp số phiếu mới.
     * - Kiểm tra các dịch vụ CLS cần thiết đã có kết quả.
     * - Bảo toàn lịch sử thời điểm vào hàng ban đầu (lưu vết vào queue events).
     * - Cập nhật ThoiGianVaoHang = now() để xếp hàng theo đúng thời điểm thực tế quay lại (FIFO chung cùng P2/P3).
     * - Chặn tiếp nhận lặp nếu bệnh nhân đã được đưa lại vào hàng chờ khám lại.
     *
     * @param int $maLuotKham Mã lượt khám
     * @param int $userId ID tài khoản tiếp nhận (Lễ tân hoặc Bác sĩ)
     * @return LuotKham
     * @throws ValidationException
     */
    public function recordClsReturn(int $maLuotKham, int $userId): LuotKham
    {
        return DB::transaction(function () use ($maLuotKham, $userId) {
            $visit = LuotKham::with('chiDinhDichVus')->where('MaLuotKham', $maLuotKham)->lockForUpdate()->first();
            if (!$visit) {
                throw ValidationException::withMessages([
                    'MaLuotKham' => 'Không tìm thấy lượt khám.',
                ]);
            }

            // Chặn tiếp nhận lặp nếu lượt khám đã được đưa lại vào hàng chờ khám lại
            if ($visit->TrangThai === 'CHO_KHAM_LAI') {
                throw ValidationException::withMessages([
                    'TrangThai' => 'Bệnh nhân đã được tiếp nhận vào hàng chờ khám lại trước đó, không thể tiếp nhận lặp.',
                ]);
            }

            if ($visit->TrangThai !== 'CHO_KET_QUA') {
                throw ValidationException::withMessages([
                    'TrangThai' => "Chỉ áp dụng tiếp nhận quay lại sau CLS cho bệnh nhân đang chờ kết quả (CHO_KET_QUA). Trạng thái hiện tại: {$visit->TrangThai}",
                ]);
            }

            // Kiểm tra các chỉ định CLS chưa hủy phải có kết quả
            $pendingServices = $visit->chiDinhDichVus->filter(function ($item) {
                return !in_array($item->TrangThai, ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY']);
            });

            if ($pendingServices->count() > 0) {
                throw ValidationException::withMessages([
                    'chi_dinh_dich_vu' => "Bệnh nhân còn {$pendingServices->count()} dịch vụ cận lâm sàng chưa có kết quả.",
                ]);
            }

            // Bảo toàn lịch sử thời điểm vào hàng trước đó
            $this->addQueueEvent($visit, 'QUAY_LAI_CLS', $userId, [
                'previous_thoi_gian_vao_hang' => $visit->ThoiGianVaoHang,
                'thoi_gian_quay_lai'          => now()->toDateTimeString(),
            ]);

            // Cập nhật thời điểm vào lại hàng đợi theo đúng thời điểm thực tế quay lại
            $visit->ThoiGianVaoHang = now();
            $visit->TrangThai = 'CHO_KHAM_LAI';
            $visit->save();

            return $visit->fresh();
        });
    }

    /**
     * XÁC NHẬN BỎ LƯỢT THỦ CÔNG SAU ĐỦ 3 LẦN GỌI (SKIP PATIENT)
     * - Chỉ được xác nhận khi đã có đủ 3 lần gọi không có mặt.
     * - Chỉ áp dụng với bệnh nhân đang chờ (CHO_KHAM / CHO_KHAM_LAI).
     * - TUYỆT ĐỐI KHÔNG áp dụng với bệnh nhân DANG_KHAM.
     * - Lưu người xác nhận, thời điểm xác nhận và lý do vào lịch sử sự kiện.
     * - KHÔNG xóa lượt khám, KHÔNG xóa số phiếu.
     *
     * @param int $maLuotKham Mã lượt khám
     * @param int $userId ID tài khoản người xác nhận bỏ lượt
     * @param string $reason Lý do bỏ lượt
     * @return LuotKham
     * @throws ValidationException|RuntimeException
     */
    public function skipPatient(int $maLuotKham, int $userId, string $reason = 'Gọi 3 lần không có mặt'): LuotKham
    {
        return DB::transaction(function () use ($maLuotKham, $userId, $reason) {
            $visit = LuotKham::where('MaLuotKham', $maLuotKham)->lockForUpdate()->first();
            if (!$visit) {
                throw ValidationException::withMessages([
                    'MaLuotKham' => 'Không tìm thấy lượt khám.',
                ]);
            }

            // Chặn tuyệt đối nếu bệnh nhân đang khám trong phòng
            if ($visit->TrangThai === 'DANG_KHAM') {
                throw new RuntimeException('Không thể bỏ lượt bệnh nhân đang trong phòng khám (DANG_KHAM).');
            }

            if (!in_array($visit->TrangThai, ['CHO_KHAM', 'CHO_KHAM_LAI'])) {
                throw ValidationException::withMessages([
                    'TrangThai' => "Chỉ có thể bỏ lượt bệnh nhân đang ở trạng thái chờ khám. Trạng thái hiện tại: {$visit->TrangThai}",
                ]);
            }

            // Kiểm tra quy định: Phải có đủ 3 lần gọi
            $callCount = $this->getCallCount($visit);
            if ($callCount < 3) {
                throw ValidationException::withMessages([
                    'call_count' => "Bệnh nhân mới được gọi {$callCount}/3 lần. Cần gọi đủ 3 lần trước khi xác nhận bỏ lượt.",
                ]);
            }

            // Ghi lịch sử sự kiện bỏ lượt
            $this->addQueueEvent($visit, 'BO_LUOT', $userId, [
                'call_count' => $callCount,
                'reason'     => $reason,
                'time'       => now()->toDateTimeString(),
            ]);

            // Cập nhật trạng thái sang BO_LUOT (giữ nguyên MaLuotKham, SoPhieu, STTTrongNgay)
            $visit->TrangThai = 'BO_LUOT';
            $visit->save();

            return $visit->fresh();
        });
    }

    /**
     * LẤY TOÀN BỘ LỊCH SỬ SỰ KIỆN HÀNG ĐỢI CỦA LƯỢT KHÁM
     *
     * @param LuotKham $visit
     * @return array
     */
    public function getQueueEvents(LuotKham $visit): array
    {
        $raw = $visit->GhiChu ?? '';
        if (preg_match('/<!--QUEUE_EVENTS_JSON:(.*?)-->/s', $raw, $matches)) {
            $decoded = json_decode($matches[1], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return [];
    }

    /**
     * THÊM SỰ KIỆN VÀO LỊCH SỬ HÀNG ĐỢI (ĐẢM BẢO TÍNH TOÀN VẸN VÀ BẢO TOÀN GHI CHÚ)
     *
     * @param LuotKham $visit
     * @param string $eventType
     * @param int $userId
     * @param array $meta
     * @return void
     */
    public function addQueueEvent(LuotKham $visit, string $eventType, int $userId, array $meta = []): void
    {
        $events = $this->getQueueEvents($visit);
        $events[] = array_merge([
            'event'     => $eventType,
            'user_id'   => $userId,
            'timestamp' => now()->toDateTimeString(),
        ], $meta);

        $json = json_encode($events, JSON_UNESCAPED_UNICODE);
        $cleanRaw = preg_replace('/<!--QUEUE_EVENTS_JSON:.*?-->/s', '', $visit->GhiChu ?? '');
        $cleanRaw = trim($cleanRaw);

        $visit->GhiChu = ($cleanRaw !== '' ? $cleanRaw . "\n" : '') . "<!--QUEUE_EVENTS_JSON:{$json}-->";
    }

    /**
     * ĐẾM SỐ LẦN ĐÃ PHÁT LOA GỌI BỆNH NHÂN TRONG VÒNG CHỜ HIỆN TẠI
     *
     * @param LuotKham $visit
     * @return int
     */
    public function getCallCount(LuotKham $visit): int
    {
        $events = $this->getQueueEvents($visit);
        $calls = array_filter($events, fn($e) => ($e['event'] ?? '') === 'GOI_KHAM');
        return count($calls);
    }

    /**
     * CƠ CHẾ CẤP SỐ THỨ TỰ NGUYÊN TỬ (ATOMIC COUNTER WITH RETRY)
     * Sử dụng duy nhất một PDO Connection và câu lệnh Atomic Upsert kết hợp LAST_INSERT_ID()
     *
     * @param string $ngayKham Ngày khám (Y-m-d)
     * @param int $maCaKham Mã ca khám
     * @param int $maChuyenKhoa Mã chuyên khoa
     * @return array ['stt' => int, 'so_phieu' => string]
     */
    protected function generateNextTicketNumber(string $ngayKham, int $maCaKham, int $maChuyenKhoa): array
    {
        $attempts = 0;

        while ($attempts < self::MAX_DEADLOCK_RETRIES) {
            $attempts++;
            try {
                // Lấy đối tượng PDO trực tiếp trên cùng kết nối CSDL hiện hành
                $pdo = DB::connection()->getPdo();

                // Câu lệnh Atomic Upsert: Tự động khởi tạo 1 nếu chưa có, hoặc tăng +1 nếu đã tồn tại
                $sql = "INSERT INTO hang_doi_counter (NgayKham, MaCaKham, MaChuyenKhoa, SoHienTai, UpdatedAt)
                        VALUES (?, ?, ?, LAST_INSERT_ID(1), NOW())
                        ON DUPLICATE KEY UPDATE 
                            SoHienTai = LAST_INSERT_ID(SoHienTai + 1),
                            UpdatedAt = NOW()";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([$ngayKham, $maCaKham, $maChuyenKhoa]);

                // Lấy giá trị vừa tăng trên đúng phiên kết nối này
                $stmtId = $pdo->query("SELECT LAST_INSERT_ID();");
                $stt = (int) $stmtId->fetchColumn();

                if ($stt <= 0) {
                    throw new RuntimeException("Lỗi sinh số thứ tự từ bảng hang_doi_counter (STT <= 0).");
                }

                // Kiểm tra đồng bộ thực tế với luot_kham để đảm bảo không trùng khóa uq_lk_queue_scope_stt
                $maxSttInLuotKham = DB::table('luot_kham')
                    ->where('NgayKham', $ngayKham)
                    ->where('MaCaKham', $maCaKham)
                    ->where('MaChuyenKhoa', $maChuyenKhoa)
                    ->max('STTTrongNgay');

                if ($maxSttInLuotKham !== null && $stt <= $maxSttInLuotKham) {
                    $stt = (int)$maxSttInLuotKham + 1;
                    // Cập nhật lại counter để lần tiếp theo tiếp tục từ STT chuẩn
                    DB::table('hang_doi_counter')
                        ->where('NgayKham', $ngayKham)
                        ->where('MaCaKham', $maCaKham)
                        ->where('MaChuyenKhoa', $maChuyenKhoa)
                        ->update(['SoHienTai' => $stt, 'UpdatedAt' => now()]);
                }

                $soPhieu = $this->formatTicketNumber($maChuyenKhoa, $maCaKham, $stt);

                return [
                    'stt'      => $stt,
                    'so_phieu' => $soPhieu,
                ];
            } catch (\PDOException $e) {
                // Mã lỗi MySQL: 1213 = Deadlock, 1205 = Lock wait timeout
                $errorCode = $e->errorInfo[1] ?? 0;
                if (in_array($errorCode, [1213, 1205]) && $attempts < self::MAX_DEADLOCK_RETRIES) {
                    usleep(100000 * $attempts); // Chờ 100ms, 200ms trước khi thử lại
                    continue;
                }
                throw $e;
            }
        }

        throw new RuntimeException("Vượt quá số lần thử lại tối đa khi cấp số thứ tự do xung đột khóa CSDL.");
    }

    /**
     * ĐỊNH DẠNG SỐ PHIẾU HIỂN THỊ CHUẨN
     * Cấu trúc: [PREFIX]-C[MaCaKham]-[STT 3 chữ số]
     * Ví dụ: NTQ-C76-001 vs NTQ-C85-001
     *
     * @param int $maChuyenKhoa Mã chuyên khoa
     * @param int $maCaKham Mã ca khám
     * @param int $stt Số thứ tự trong ca
     * @return string
     */
    public function formatTicketNumber(int $maChuyenKhoa, int $maCaKham, int $stt): string
    {
        $ck = DB::table('chuyen_khoa')->where('MaChuyenKhoa', $maChuyenKhoa)->first();

        $prefix = 'KB';
        if ($ck && !empty($ck->TenChuyenKhoa)) {
            $asciiName = \Illuminate\Support\Str::ascii($ck->TenChuyenKhoa);
            $words = explode(' ', trim($asciiName));
            $abbr = '';
            foreach ($words as $w) {
                if (!empty($w)) {
                    $abbr .= substr($w, 0, 1);
                }
            }
            $cleanAbbr = preg_replace('/[^A-Za-z0-9]/', '', $abbr);
            $prefix = !empty($cleanAbbr) ? strtoupper(substr($cleanAbbr, 0, 3)) : 'K' . $maChuyenKhoa;
        } else {
            $prefix = 'K' . $maChuyenKhoa;
        }

        return sprintf("%s-C%d-%03d", $prefix, $maCaKham, $stt);
    }
}
