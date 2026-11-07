# SMARTCARE — THIẾT KẾ TRIỂN KHAI HYBRID QUEUE THỰC TẾ (BẢN HOÀN THIỆN)
### PRACTICAL ARCHITECTURE & MINIMAL IMPLEMENTATION DESIGN — FINALIZED
*(TẬN DỤNG KIẾN TRÚC HIỆN TẠI — ĐƠN GIẢN HÓA HỆ THỐNG — LOẠI BỎ OVERENGINEERING)*

> **TÌNH TRẠNG**: `THIẾT KẾ ĐÃ HOÀN THIỆN — CHỜ NGƯỜI DÙNG DUYỆT ĐỂ BẮT ĐẦU TRIỂN KHAI`  
> **PHIÊN BẢN**: `PHASE 1.1 FINAL PRACTICAL DESIGN`  
> **QUY TẮC AN TOÀN**: `READ-ONLY 100% — KHÔNG SỬA CODE — KHÔNG TẠO MIGRATION — KHÔNG GHI CSDL`  
> **NGÀY HOÀN THIỆN**: 2026-11-04  
> **MÔ HÌNH HÀNG ĐỢI**: `SmartCare Practical Monolithic Hybrid Queue (Laravel 12 + MySQL 8.0)`  
> **PHẠM VI ĐIỀU PHỐI**: `[Ngày khám + Ca khám + Chuyên khoa]`

---

## MỤC LỤC
1. [I. TỔNG QUAN & NGUYÊN TẮC CỐT LÕI](#i-tổng-quan--nguyên-tắc-cốt-lõi)
2. [II. B-01: CHÍNH SÁCH PHÂN LOẠI & ĐIỀU PHỐI ƯU TIÊN (PRIORITY POLICY)](#ii-b-01-chính-sách-phân-loại--điều-phối-ưu-tiên-priority-policy)
3. [III. B-02: QUY TRÌNH CHECK-IN LỊCH HẸN & ĐÓN TIẾP](#iii-b-02-quy-trình-check-in-lịch-hẹn--đón-tiếp)
4. [IV. B-03: PHẠM VI, ĐỊNH DẠNG & CƠ CHẾ CẤP SỐ THỨ TỰ (QUEUE NUMBER)](#iv-b-03-phạm-vi-định-dạng--cơ-chế-cấp-số-thứ-tự-queue-number)
5. [V. B-04: THIẾT KẾ MIGRATION & BACKFILL DỮ LIỆU AN TOÀN 7 BƯỚC](#v-b-04-thiết-kế-migration--backfill-dữ-liệu-an-toàn-7-bước)
6. [VI. B-05: HOÀN THIỆN THIẾT KẾ ĐIỀU KHIỂN GỌI KHÁM (CALL NEXT PATIENT)](#vi-b-05-hoàn-thiện-thiết-kế-điều-khiển-gọi-khám-call-next-patient)
7. [VII. B-06: ĐIỀU PHỐI BỆNH NHÂN TRỰC TIẾP (WALK-IN ASSIGNMENT)](#vii-b-06-điều-phối-bệnh-nhân-trực-tiếp-walk-in-assignment)
8. [VIII. B-07: MA TRẬN AUDIT MINH BẠCH FILE & BẢNG CƠ SỞ DỮ LIỆU](#viii-b-07-ma-trận-audit-minh-bạch-file--bảng-cơ-sở-dữ-liệu)
9. [IX. BỐN MÀN HÌNH GIAO DIỆN NGHIỆP VỤ](#ix-bốn-màn-hình-giao-diện-nghiệp-vụ)
10. [X. BỘ 7 TEST CASE NGHIỆP VỤ SỐNG CÒN](#x-bộ-7-test-case-nghiệp-vụ-sống-còn)
11. [XI. GATEKEEPER DECISION & LỘ TRÌNH THỰC TẾ](#xi-gatekeeper-decision--lộ-trình-thực-tế)

---

## I. TỔNG QUAN & NGUYÊN TẮC CỐT LÕI

Dự án SmartCare chính thức đóng lại các thiết kế phân tán phức tạp không cần thiết (Claim Ledger, Fencing Token, Autonomous Transaction, Background Worker Recovery, Redis/RabbitMQ) để tập trung vào mục tiêu sản phẩm thực tế:
- **Bản chất**: SmartCare là hệ thống quản lý phòng khám có chức năng xếp hàng thông minh, phục vụ quy trình khám chữa bệnh tại chỗ.
- **Thứ tự ưu tiên**: `Đúng nghiệp vụ -> Chạy được -> Dữ liệu chính xác -> Giao diện tốt -> Tối ưu hiệu năng`.
- **Hội tụ hai nguồn**: Bệnh nhân Đặt lịch trước (`lich_hen`) và Bệnh nhân Đến trực tiếp (`TRUC_TIEP`) cùng tham gia vào **Một Hàng Đợi Điều Phối Duy Nhất** trong phạm vi:
  $$\text{Phạm vi hàng đợi} = \text{Ngày khám} + \text{Ca khám} + \text{Chuyên khoa}$$

---

## II. B-01: CHÍNH SÁCH PHÂN LOẠI & ĐIỀU PHỐI ƯU TIÊN (PRIORITY POLICY)

### 1. Phân Định Rạch Ròi 4 Cấp Độ Ưu Tiên

| Mức | Tên Mức | Đối Tượng Áp Dụng | Nguyên Tắc Điều Phối | Cơ Chế Xác Nhận & Giám Sát |
| :---: | :---: | :--- | :--- | :--- |
| **P0** | **Cấp cứu** | Bệnh nhân có dấu hiệu đe dọa tính mạng, khó thở cấp, ngất xỉu, sốc, chấn thương nặng. | **KHÔNG VÀO HÀNG ĐỢI THÔNG THƯỜNG**. Bác sĩ/Điều dưỡng kích hoạt tiếp nhận cấp cứu và vào khám ngay lập tức (`DANG_KHAM`). | **Bắt buộc do Nhân viên Y tế / Bác sĩ xác nhận**. Lưu `NguoiXacNhanUuTien` và `LyDoUuTien`. Tuyệt đối không để bệnh nhân tự chọn hay hệ thống tự gán. |
| **P1** | **Chính sách phòng khám** | Người cao tuổi ($\ge 75$ tuổi), trẻ em dưới 6 tuổi, phụ nữ có thai tháng cuối, người khuyết tật nặng. | Được xếp trước bệnh nhân đặt lịch (P2) và trực tiếp thông thường (P3). | **Do Lễ tân xác nhận** đối chiếu giấy tờ thực tế (CCCD/thẻ bảo hiểm). Lưu `NguoiXacNhanUuTien` và `LyDoUuTien`. |
| **P2** | **Lịch hẹn hợp lệ** | Bệnh nhân đã đặt lịch trước, đến đúng khung giờ hẹn (trong khoảng từ 15 phút trước giờ hẹn đến đúng giờ). | Xếp trước bệnh nhân trực tiếp thông thường (P3). Giữ đúng Bác sĩ và khung giờ đã chọn. | Hệ thống tự động gán khi Lễ tân bấm Check-in thành công. |
| **P3** | **Trực tiếp thông thường** | Bệnh nhân đến khám trực tiếp không thuộc diện P0/P1. | Điều phối theo nguyên tắc **FIFO (First-In, First-Out)** dựa trên thời điểm cấp số `ThoiGianVaoHang`. | Hệ thống tự động gán mặc định khi tiếp nhận tại quầy. |

### 2. Quan Hệ Giữa Cấp Cứu, Tái Khám Cận Lâm Sàng và Hàng Chờ
- **Bệnh nhân Cấp cứu (P0)**: Được đưa thẳng vào phòng xử trí/phòng khám, **không bao giờ phải bốc số xếp hàng** như bệnh nhân ngoại trú thông thường.
- **Bệnh nhân Tái khám sau Cận lâm sàng (`CHO_KHAM_LAI`)**:
  * Là bệnh nhân đã vào khám đợt 1, được bác sĩ chỉ định đi xét nghiệm/X-quang, nay đã có đầy đủ kết quả quay lại phòng khám.
  * **Thứ tự điều phối**: Được xếp ưu tiên cao nhất trong danh sách chờ thông thường (đứng trước P1, P2, P3), nhưng phải đứng sau ca cấp cứu P0 nếu có.
- **Thứ tự lấy bệnh nhân tiếp theo của Bác sĩ**:
  1. Ca cấp cứu P0 (nếu được chuyển vào phòng khám).
  2. Bệnh nhân tái khám CLS (`CHO_KHAM_LAI`).
  3. Bệnh nhân diện chính sách P1.
  4. Bệnh nhân có lịch hẹn P2.
  5. Bệnh nhân trực tiếp thông thường P3.
  *(Trong cùng một mức: Bệnh nhân nào có `ThoiGianVaoHang` sớm hơn sẽ được gọi trước)*.

---

## III. B-02: QUY TRÌNH CHECK-IN LỊCH HẸN & ĐÓN TIẾP

### 1. Nguyên Tắc Bất Biến: Đặt Lịch Chưa Phải Là Cấp Số
- Bản ghi `lich_hen` chỉ ghi nhận nguyện vọng và kế hoạch khám trong tương lai của bệnh nhân.
- **Tuyệt đối không cấp số thứ tự hay tạo `luot_kham` khi bệnh nhân đặt lịch qua Web/App**.
- Chỉ khi bệnh nhân thực sự có mặt tại cơ sở y tế và Lễ tân thực hiện thao tác **Check-in thành công** trên hệ thống $\rightarrow$ Mới chính thức cấp `STTTrongNgay`, sinh `SoPhieu` và tạo bản ghi `luot_kham` tham gia hàng đợi.

### 2. Kiểm Soát Tính Toàn Vẹn Của Lịch Hẹn Khi Tiếp Nhận
Khi Lễ tân bấm tiếp nhận lịch hẹn:
```php
// Trong DB::transaction:
$lichHen = LichHen::lockForUpdate()->find($maLichHen);

// 1. Kiểm tra trạng thái hợp lệ
if (!in_array($lichHen->TrangThai, ['CHO_XAC_NHAN', 'DA_XAC_NHAN'])) {
    throw ValidationException::withMessages([
        'MaLichHen' => "Lịch hẹn đang ở trạng thái '{$lichHen->TrangThai}', không thể tiếp nhận."
    ]);
}

// 2. Chống tạo trùng lượt khám (Phòng ngừa double-click)
$existingVisit = LuotKham::where('MaLichHen', $maLichHen)->lockForUpdate()->first();
if ($existingVisit || $lichHen->TrangThai === 'DA_TIEP_NHAN') {
    throw ValidationException::withMessages([
        'MaLichHen' => "Lịch hẹn này đã được tiếp nhận tạo lượt khám trước đó."
    ]);
}
```

### 3. Xử Lý Bệnh Nhân Đến Sớm, Đúng Giờ Và Đến Muộn
- **Đến đúng giờ** (Từ 15 phút trước giờ hẹn đến đúng giờ): Gán `MucUuTien = 2` (P2), `ThoiGianVaoHang = now()`.
- **Đến quá sớm** (Trước hơn 30 phút so với giờ bắt đầu ca): Hệ thống vẫn cho phép check-in lấy số, nhưng `ThoiGianVaoHang` được ghi nhận bằng **thời điểm bắt đầu ca khám đã đặt**. Bệnh nhân không được tự động nhảy lên đầu hàng của các bệnh nhân thuộc ca đang diễn ra.
- **Đến muộn** (Muộn quá 15 phút so với khung giờ hẹn):
  - Hệ thống hiển thị cảnh báo cho Lễ tân: *"Lịch hẹn đã quá giờ 15 phút"*.
  - Tự động hạ mức ưu tiên xuống **P3 (Trực tiếp)** để nhường lượt cho các bệnh nhân đến đúng giờ.

---

## IV. B-03: PHẠM VI, ĐỊNH DẠNG & CƠ CHẾ CẤP SỐ THỨ TỰ (QUEUE NUMBER)

### 1. Phạm Vi Cấp Số Thống Nhất
Phạm vi cấp số thứ tự được chốt cố định là:
$$\text{Scope} = (\text{NgayKham}, \text{MaCaKham}, \text{MaChuyenKhoa})$$
- **Chu kỳ Reset**: Bộ đếm tự động reset về 1 vào đầu mỗi ngày mới (`00:00:00`).
- **Phân tách ca khám**: Hai ca khám khác nhau trong cùng chuyên khoa (ví dụ: Ca Sáng và Ca Chiều) **KHÔNG DÙNG CHUNG DÃY SỐ**. Ca sáng có dải số riêng, Ca chiều có dải số riêng.

### 2. Quy Chuẩn Định Dạng Số Phiếu (`SoPhieu`)
Định dạng số phiếu hiển thị thân thiện, trực quan:
$$\text{SoPhieu} = \text{[Mã Chuyên Khoa]} - \text{[Ký Hiệu Ca]} - \text{[STT 3 Chữ Số]}$$
- Ví dụ:
  - `TM-S-001`: Chuyên khoa Tim Mạch, Ca Sáng, Số thứ tự 01.
  - `TM-C-002`: Chuyên khoa Tim Mạch, Ca Chiều, Số thứ tự 02.
  - `DL-S-005`: Chuyên khoa Da Liễu, Ca Sáng, Số thứ tự 05.

### 3. Cơ Chế Cấp Số Đồng Thời & Bảng `hang_doi_counter`
- **Nguyên tắc**: Sử dụng bảng bộ đếm `hang_doi_counter` kết hợp với `SELECT ... FOR UPDATE` bên trong transaction của MySQL InnoDB.
- **Xử lý số bị hủy hoặc bỏ lượt**:
  - Dãy số cấp ra là **dãy số tăng đơn điệu (Monotonic Sequence)**.
  - Nếu bệnh nhân số `005` bị hủy hoặc bỏ lượt, số `005` **TUYỆT ĐỐI KHÔNG CẤP LẠI CHO BỆNH NHÂN KHÁC**. Điều này nhằm tránh nhầm lẫn trên phiếu giấy đã in và hệ thống loa gọi tự động.
- **Khởi tạo bộ đếm an toàn**: Khi một ca khám mới bắt đầu, nếu trong CSDL đã có bản ghi lượt khám lịch sử thuộc phạm vi đó, `hang_doi_counter` **bắt buộc phải khởi tạo bằng $\max(\text{STTTrongNgay})$ hiện có**, tuyệt đối không reset về 0 làm trùng lặp số cũ.

---

## V. B-04: THIẾT KẾ MIGRATION & BACKFILL DỮ LIỆU AN TOÀN 7 BƯỚC

Hiện tại bảng `luot_kham` đang có **23 bản ghi thực tế** (5 lượt từ lịch hẹn, 18 lượt trực tiếp). Do đó, **tuyệt đối không được thêm các cột `NOT NULL` trực tiếp** vì sẽ gây lỗi migration.

Quy trình migration chuẩn gồm 7 bước tuần tự:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Thêm toàn bộ các cột mới dưới dạng NULLABLE                     │
│ (NgayKham, LoaiHangDoi, SoPhieu, STTTrongNgay, MaChuyenKhoa, MaCaKham) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Chuyển đổi cột MaBacSi sang NULLABLE                            │
│ (ALTER TABLE luot_kham MODIFY COLUMN MaBacSi INT NULL)                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Backfill dữ liệu cho 23 bản ghi lịch sử                        │
│ - 5 ca đặt lịch: Điền từ lich_hen -> ca_kham -> bac_si -> chuyen_khoa  │
│ - 18 ca trực tiếp: Điền từ bacSi.chuyenKhoa, TIME(ThoiGianTiepNhan)    │
│ - Đánh số STT tăng dần 1, 2, 3... theo ThoiGianTiepNhan & sinh SoPhieu │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Tạo bảng hang_doi_counter & Khởi tạo giá trị                   │
│ - Chèn SoHienTai = MAX(STTTrongNgay) cho từng phạm vi đã có dữ liệu    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 5: Kiểm tra tính nhất quán (Consistency Verification)              │
│ - Khẳng định 0 bản ghi nào bị NULL ở các cột nghiệp vụ bắt buộc        │
│ - Khẳng định 0 bản ghi nào bị trùng (Scope + STT)                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 6: Chuyển các cột nghiệp vụ sang NOT NULL                         │
│ (NgayKham, LoaiHangDoi, SoPhieu, STTTrongNgay, MaChuyenKhoa, MaCaKham) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 7: Bổ sung Unique Constraints & Indexes                           │
│ - UNIQUE (NgayKham, MaCaKham, MaChuyenKhoa, STTTrongNgay)              │
│ - UNIQUE (MaLichHen)                                                   │
│ - INDEX idx_queue_call_next                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Chi Tiết Kế Hoạch Backfill 23 Bản Ghi Lịch Sử:
1. **5 bản ghi có `MaLichHen` (LK #1, #156, #211, #214, #236)**:
   - `LoaiHangDoi = 'DAT_LICH'`, `MucUuTien = 2`.
   - `NgayKham = DATE(ca_kham.lichLamViec.NgayLamViec)`.
   - `MaCaKham = lich_hen.MaCaKham`.
   - `MaChuyenKhoa = bac_si.MaChuyenKhoa`.
   - `ThoiGianVaoHang = ThoiGianTiepNhan`.
2. **18 bản ghi trực tiếp (`MaLichHen IS NULL`)**:
   - `LoaiHangDoi = 'TRUC_TIEP'`, `MucUuTien = 3`.
   - `NgayKham = DATE(ThoiGianTiepNhan)`.
   - `MaChuyenKhoa = bac_si.MaChuyenKhoa` (lấy từ bác sĩ đã tiếp nhận lúc đó).
   - `MaCaKham`: Khớp với ca khám của bác sĩ đó có khung giờ chứa `TIME(ThoiGianTiepNhan)` (nếu không khớp ca cụ thể, gán ca đầu tiên trong ngày của bác sĩ đó).
   - `ThoiGianVaoHang = ThoiGianTiepNhan`.
3. **Sinh số thứ tự và số phiếu**:
   - Chạy hàm đánh số `ROW_NUMBER() OVER (PARTITION BY NgayKham, MaCaKham, MaChuyenKhoa ORDER BY ThoiGianTiepNhan ASC)` để cập nhật `STTTrongNgay`.
   - Ghép `SoPhieu` theo định dạng chuẩn.

---

## VI. B-05: HOÀN THIỆN THIẾT KẾ ĐIỀU KHIỂN GỌI KHÁM (CALL NEXT PATIENT)

Hàm `callNextPatient` trong `QueueManagementService` được thiết kế có đầy đủ các chốt chặn an toàn:

```php
public function callNextPatient(int $maBacSi, int $maCaKham): ?LuotKham
{
    return DB::transaction(function () use ($maBacSi, $maCaKham) {
        $bacSi = DB::table('bac_si')->where('MaBacSi', $maBacSi)->first();
        if (!$bacSi) {
            throw new InvalidArgumentException("Bác sĩ #{$maBacSi} không tồn tại.");
        }

        // 1. CHỐT CHẶN: Kiểm tra Bác sĩ có đang bận khám ca nào không
        $activeVisit = LuotKham::where('MaBacSi', $maBacSi)
            ->whereIn('TrangThai', ['DANG_GOI', 'DANG_KHAM'])
            ->first();

        if ($activeVisit) {
            throw ValidationException::withMessages([
                'doctor' => "Bác sĩ đang có lượt khám #{$activeVisit->SoPhieu} ở trạng thái '{$activeVisit->TrangThai}'. Vui lòng hoàn tất hoặc bỏ lượt ca hiện tại trước khi gọi bệnh nhân tiếp theo."
            ]);
        }

        $today = date('Y-m-d');

        // 2. CHỌN BỆNH NHÂN ƯU TIÊN CAO NHẤT BẰNG PESSIMISTIC LOCK
        $nextVisit = LuotKham::where('MaChuyenKhoa', $bacSi->MaChuyenKhoa)
            ->where('NgayKham', $today)
            ->where('MaCaKham', $maCaKham)
            ->whereIn('TrangThai', ['CHO_KHAM', 'CHO_KHAM_LAI'])
            ->where(function ($q) use ($maBacSi) {
                // Chỉ nhận: bệnh nhân trực tiếp chưa phân bác sĩ HOẶC bệnh nhân đã chọn đúng bác sĩ này
                $q->whereNull('MaBacSi')
                  ->orWhere('MaBacSi', $maBacSi);
            })
            // Ưu tiên 1: Tái khám sau CLS đứng đầu
            ->orderByRaw("CASE WHEN TrangThai = 'CHO_KHAM_LAI' THEN 0 ELSE 1 END")
            // Ưu tiên 2: Cấp cứu P0 -> Chính sách P1 -> Hẹn P2 -> Trực tiếp P3
            ->orderBy('MucUuTien', 'asc')
            // Ưu tiên 3: Đến trước vào trước (FIFO)
            ->orderBy('ThoiGianVaoHang', 'asc')
            ->lockForUpdate()
            ->first();

        if (!$nextVisit) {
            return null; // Hàng đợi đang trống
        }

        // 3. CẬP NHẬT TRẠNG THÁI VÀ GÁN BÁC SĨ (NẾU TRƯỚC ĐÓ LÀ NULL)
        $nextVisit->update([
            'TrangThai'       => 'DANG_GOI',
            'MaBacSi'         => $maBacSi,
            'ThoiGianGoiKham' => now(),
        ]);

        // 4. KÍCH HOẠT THÔNG BÁO VÀ GHI LOG
        NotificationService::sendToPatient(
            $nextVisit->MaBenhNhan,
            'GOI_KHAM',
            'Mời bạn vào phòng khám',
            "Số phiếu {$nextVisit->SoPhieu}: Mời bạn vào phòng khám của BS. {$bacSi->HoTen}."
        );

        return $nextVisit;
    });
}
```

---

## VII. B-06: ĐIỀU PHỐI BỆNH NHÂN TRỰC TIẾP (WALK-IN ASSIGNMENT)

### 1. `MaBacSi` Có Thể NULL Lúc Tiếp Nhận Ban Đầu
- Bệnh nhân đến trực tiếp tại quầy thường chỉ đăng ký theo Chuyên khoa (ví dụ: muốn khám Tai Mũi Họng hoặc Nội tổng quát), chưa biết bác sĩ nào đang trống lịch.
- Do đó, tại thời điểm tiếp nhận, trường `MaBacSi` **hoàn toàn được phép là `NULL`**. Bệnh nhân được xếp vào hàng đợi chung của Chuyên khoa đó.

### 2. Tìm Bác Sĩ Đang Trực Ca
- Hệ thống xác định danh sách bác sĩ trực ca hiện tại bằng truy vấn:
  ```sql
  SELECT bs.MaBacSi, bs.HoTen, ck.TenChuyenKhoa
  FROM bac_si bs
  JOIN lich_lam_viec llv ON bs.MaBacSi = llv.MaBacSi
  JOIN ca_kham ck ON llv.MaLichLamViec = ck.MaLichLamViec
  WHERE bs.MaChuyenKhoa = :maChuyenKhoa
    AND llv.NgayLamViec = CURRENT_DATE
    AND ck.MaCaKham = :maCaKham
    AND bs.TrangThai = 'HOAT_DONG';
  ```

### 3. Nguyên Tắc Bắt Buộc Khi Bắt Đầu Khám (`startExamine`)
- Khi một bác sĩ bấm "Gọi bệnh nhân tiếp theo", hệ thống **tự động gán `MaBacSi = $doctorId`** vào bản ghi lượt khám.
- **Quy tắc bất biến**: Khi chuyển trạng thái từ `DANG_GOI` sang `DANG_KHAM` (vào khám), trường `MaBacSi` **BẮT BUỘC PHẢI KHÁC NULL**. Không có bất kỳ lượt khám lâm sàng nào được phép diễn ra mà không gắn với một bác sĩ chịu trách nhiệm chuyên môn.

---

## VIII. B-07: MA TRẬN AUDIT MINH BẠCH FILE & BẢNG CƠ SỞ DỮ LIỆU

### 1. Danh Mục Các File Mã Nguồn (Codebase Audit)

| Thành Phần | Tên File / Đường Dẫn | Hiện Trạng Thực Tế | Hành Động Cần Thực Hiện |
| :--- | :--- | :--- | :--- |
| **Controller** | `app/Http/Controllers/LuotKhamController.php` | Đang xử lý `index`, `store`, `startExamine`, `completeExamine`. Chưa có gọi tiếp theo và bỏ lượt. | **CẦN SỬA**: Tích hợp `QueueManagementService`, bổ sung action `callNext`, `skip`, và sửa query index hiển thị cả bệnh nhân `MaBacSi = NULL` của khoa. |
| **Controller** | `app/Http/Controllers/LichHenController.php` | `queue()` hiện chỉ query bảng `lich_hen`. | **CẦN SỬA**: Cập nhật query `queue()` để tải danh sách hỗn hợp cả lịch hẹn và lượt khám trực tiếp. |
| **Controller** | `app/Http/Controllers/CaKhamController.php` | Quản lý ca khám, kiểm tra sức chứa. | **GIỮ NGUYÊN 100%**. |
| **Controller** | `app/Http/Controllers/BacSiController.php` | Quản lý danh mục bác sĩ, dashboard bác sĩ. | **GIỮ NGUYÊN 100%**. |
| **Controller** | `app/Http/Controllers/BenhNhanController.php` | Quản lý hồ sơ bệnh nhân. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/LuotKham.php` | `$fillable` hiện có 8 trường, `$timestamps = false`. | **CẦN SỬA**: Bổ sung các cột mới vào `$fillable`, thêm quan hệ `chuyenKhoa()`, `caKham()`. |
| **Model** | `app/Models/LichHen.php` | Quản lý lịch hẹn, quan hệ `hasOne(LuotKham)`. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/CaKham.php` | Quản lý ca khám, quan hệ `lichLamViec`. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/LichLamViec.php`| Quản lý ngày trực và bác sĩ. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/BacSi.php` | Thông tin bác sĩ. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/BenhNhan.php` | Thông tin bệnh nhân. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/ChuyenKhoa.php` | Danh mục chuyên khoa. | **GIỮ NGUYÊN 100%**. |
| **Model** | `app/Models/ThongBao.php` | Thông báo nội bộ. | **GIỮ NGUYÊN 100%**. |
| **Service** | `app/Services/QueueManagementService.php` | Chưa tồn tại. | **TẠO MỚI**: Chứa toàn bộ logic cấp số, check-in, gọi số, bỏ lượt. |
| **Service** | `app/Services/NotificationService.php` | Gửi thông báo đến bác sĩ và bệnh nhân. | **GIỮ NGUYÊN 100%** (Tái sử dụng các hàm hiện có). |
| **Frontend** | `resources/js/Pages/Receptionist/Queue.tsx` | Đang hiển thị danh sách lịch hẹn. | **CẦN SỬA**: Bổ sung hiển thị cả 2 nguồn Đặt lịch & Trực tiếp, thêm badge mức ưu tiên P0-P3, thêm nút Check-in/Gọi lại. |
| **Frontend** | `resources/js/Pages/Doctor/Examine.tsx` | Đang chọn bệnh nhân thủ công ở thanh bên. | **CẦN SỬA**: Thêm nút nổi bật "GỌI BỆNH NHÂN TIẾP THEO" (F2) và nút "BỎ LƯỢT". |
| **Migration** | `database/migrations/..._add_hybrid_queue_fields.php` | Chưa tồn tại. | **TẠO MỚI**: Migration 7 bước an toàn cho `luot_kham` và `hang_doi_counter`. |

### 2. Danh Mục Các Bảng Cơ Sở Dữ Liệu (Database Audit)

| Tên Bảng | Hiện Trạng Dữ Liệu | Hành Động Kỹ Thuật Cần Thực Hiện |
| :--- | :--- | :--- |
| **`luot_kham`** | Đang có 23 bản ghi thực tế. `MaBacSi` đang là NOT NULL. | **THAY ĐỔI SCHEMA**: Thêm 10 cột mới (ban đầu nullable), sửa `MaBacSi` sang NULL, backfill 23 bản ghi cũ, sau đó chuyển NOT NULL và thêm Unique Constraints. |
| **`hang_doi_counter`** | Chưa tồn tại. | **TẠO MỚI**: Bảng lưu trữ bộ đếm STT cho từng phạm vi `[Ngày + Ca + Khoa]`. Khởi tạo từ `MAX(STT)` của 23 bản ghi cũ. |
| **`lich_hen`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. Không thêm sửa xóa cột nào. |
| **`ca_kham`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`lich_lam_viec`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`bac_si`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`benh_nhan`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`chuyen_khoa`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`thong_bao`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`phieu_kham`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`don_thuoc`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |
| **`chi_dinh_dich_vu`** | Đang có dữ liệu hoạt động bình thường. | **GIỮ NGUYÊN 100% CẤU TRÚC**. |

---

## IX. BỐN MÀN HÌNH GIAO DIỆN NGHIỆP VỤ

1. **Màn hình Hàng đợi Lễ tân (`/receptionist/queue`)**:
   - Hiển thị danh sách tổng hợp toàn bộ bệnh nhân đang chờ theo từng chuyên khoa và ca khám.
   - Huy hiệu phân biệt nguồn gốc: `[Đặt lịch]` (Xanh dương) vs `[Trực tiếp]` (Tím).
   - Huy hiệu mức ưu tiên: `[P0 Cấp cứu]` (Đỏ nhấp nháy), `[P1 Ưu tiên]` (Cam), `[P2 Lịch hẹn]` (Xanh lục), `[P3 Tiêu chuẩn]` (Xám).
   - Thao tác nhanh: Check-in lịch hẹn, Sửa mức ưu tiên (kèm lý do), Khôi phục bệnh nhân bỏ lượt.
2. **Màn hình Khám bệnh của Bác sĩ (`/doctor/examine`)**:
   - Nút hành động chính: **`[GỌI BỆNH NHÂN TIẾP THEO]`** (Phím tắt `F2`).
   - Danh sách hàng chờ bên trái tự động sắp xếp theo thứ tự ưu tiên chuẩn.
   - Nút **`[BỎ LƯỢT / VẮNG MẶT]`** khi bệnh nhân gọi không vào phòng.
3. **Form Tiếp nhận trực tiếp tại quầy Lễ tân (`Modal/Form trong Queue.tsx`)**:
   - Nhập SĐT bệnh nhân $\rightarrow$ Auto-fill thông tin bệnh nhân cũ.
   - Chọn Chuyên khoa & Ca khám.
   - Chọn mức ưu tiên (Mặc định P3, checkbox chọn P1 kèm ô nhập lý do xác nhận).
   - Bấm "Tiếp nhận & Cấp số".
4. **Màn hình hiển thị TV phòng chờ (`/queue/display` - Public)**:
   - Hiển thị Số phiếu đang khám, Số phiếu đang gọi, và 3 số chuẩn bị theo từng chuyên khoa.

---

## X. BỘ 7 TEST CASE NGHIỆP VỤ SỐNG CÒN

1. **TC-PRAC-01 (Chống trùng số khi cấp đồng thời)**: 2 lễ tân tiếp nhận 2 bệnh nhân trực tiếp vào cùng 1 ca khám chuyên khoa tại cùng 1 tích tắc $\rightarrow$ Cấp ra 2 số thứ tự liên tiếp (`STT = 1` và `STT = 2`), không bao giờ bị trùng số.
2. **TC-PRAC-02 (Hội tụ hai nguồn vào hàng đợi)**: Bệnh nhân đặt lịch (P2) và trực tiếp (P3) cùng vào ca khám $\rightarrow$ Cùng xuất hiện trong danh sách, bệnh nhân đặt lịch P2 được xếp trước bệnh nhân P3.
3. **TC-PRAC-03 (Ưu tiên cấp cứu P0 & chính sách P1)**: Đang có 5 bệnh nhân P2/P3 chờ, tiếp nhận 1 ca cấp cứu P0 hoặc người già P1 $\rightarrow$ P0 được vào khám ngay; P1 đứng trước toàn bộ P2 và P3.
4. **TC-PRAC-04 (Chống gọi trùng giữa 2 bác sĩ)**: 2 bác sĩ cùng chuyên khoa bấm "Gọi bệnh nhân tiếp theo" cùng lúc $\rightarrow$ Bác sĩ 1 nhận bệnh nhân A, Bác sĩ 2 nhận bệnh nhân B, tuyệt đối không nhận chung 1 người.
5. **TC-PRAC-05 (Chặn gọi khi bác sĩ đang bận)**: Bác sĩ đang có ca khám ở trạng thái `DANG_GOI` hoặc `DANG_KHAM` bấm gọi tiếp $\rightarrow$ Bị chặn lại với thông báo yêu cầu hoàn thành ca hiện tại.
6. **TC-PRAC-06 (Chống tiếp nhận trùng lịch hẹn)**: Lễ tân bấm check-in 2 lần liên tiếp do lag $\rightarrow$ Chỉ 1 lượt khám được tạo, request 2 bị từ chối với lỗi 422.
7. **TC-PRAC-07 (Ưu tiên tái khám sau CLS)**: Bệnh nhân đã làm xong xét nghiệm có kết quả (`CHO_KHAM_LAI`) $\rightarrow$ Được gọi trước các bệnh nhân mới đang chờ khám lần đầu.

---

## XI. GATEKEEPER DECISION & LỘ TRÌNH THỰC TẾ

### 1. Quyết Định Chính Thức Của Gatekeeper

# `READY FOR IMPLEMENTATION DESIGN APPROVAL`
*(Thiết kế chi tiết đã xử lý trọn vẹn 7 blocker, quy trình nghiệp vụ rõ ràng, quy trình migration 7 bước an toàn và sẵn sàng để chuyển sang giai đoạn triển khai code)*

### 2. Cam Kết An Toàn Bắt Buộc:
- Hệ thống vẫn đang ở trạng thái **READ-ONLY 100%**.
- Chưa sửa bất kỳ dòng mã nguồn PHP hay React nào.
- Chưa tạo file migration và chưa ghi bất kỳ dữ liệu nào lên CSDL chính.
- Mọi thao tác triển khai sẽ chỉ bắt đầu khi nhận được sự phê duyệt chính thức từ người dùng.

### 3. Lộ Trình Triển Khai Thực Tế 5 Bước:
1. **Bước 1**: Tạo Migration mở rộng bảng `luot_kham` và tạo bảng `hang_doi_counter` theo đúng 7 bước an toàn (có lệnh backfill 23 bản ghi cũ).
2. **Bước 2**: Xây dựng service `app/Services/QueueManagementService.php` và viết Unit Test PHPUnit kiểm tra cấp số + chọn bệnh nhân.
3. **Bước 3**: Cập nhật `LuotKhamController.php`, `LichHenController.php` và định tuyến routes trong `routes/web.php`.
4. **Bước 4**: Nâng cấp giao diện React `Receptionist/Queue.tsx` và `Doctor/Examine.tsx`.
5. **Bước 5**: Chạy nghiệm thu toàn diện 7 test case nghiệp vụ.
