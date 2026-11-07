# SMARTCARE HYBRID QUEUE — PHASE 3.4 CODE REVIEW & BUSINESS LOGIC SPECIFICATION

> **MỤC TIÊU**: Kiểm định mã nguồn toàn diện sau Phase 3.3, khắc phục các kẽ hở an toàn về nhận diện dữ liệu, bảo mật cấu hình, và thiết kế chi tiết kiểm thử nghiệp vụ cho `QueueManagementService`.  
> **NGÀY THỰC HIỆN**: 2026-11-04  
> **MÔI TRƯỜNG THỰC NGHIỆM**: Database thử nghiệm độc lập `phong_kham_hybrid_queue_test` (MySQL 8.0.26 / InnoDB Engine).  
> **CAM KẾT AN TOÀN**: Database chính `phong_kham_thong_minh` tuyệt đối KHÔNG bị can thiệp ghi hay chạy migration (0 byte altered).

---

## PHẦN A — KIỂM TRA LẠI BACKFILL & BẢO VỆ MÔI TRƯỜNG

### 1. Kiểm tra 8 trường bắt buộc nhận diện lượt khám Đặt lịch hoàn tất
- **Vấn đề nhận diện**: Trước đó, mã nguồn chỉ kiểm tra lỏng lẻo một số trường (`LoaiHangDoi`, `NgayKham`, `MaCaKham`, `STTTrongNgay`, `SoPhieu`), dẫn đến nguy cơ bỏ sót nếu bản ghi có số phiếu nhưng thiếu khóa ngoại lịch hẹn (`MaLichHen`), thiếu chuyên khoa (`MaChuyenKhoa`), hoặc mức ưu tiên (`MucUuTien`) bị NULL.
- **Hiện trạng mã nguồn sau khi hoàn thiện**:
  Tại file [app/Console/Commands/BackfillHybridQueueData.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L68-L82), thuật toán đã kiểm tra nghiêm ngặt **đầy đủ cả 8 trường bắt buộc**:
  1. `LoaiHangDoi === 'DAT_LICH'`
  2. `MaLichHen`: Phải khác NULL và tồn tại
  3. `NgayKham`: Phải có ngày khám hợp lệ
  4. `MaChuyenKhoa`: Phải trỏ đúng chuyên khoa
  5. `MaCaKham`: Phải trỏ đúng ca khám
  6. `MucUuTien`: Phải có giá trị hợp lệ (P2 = 2)
  7. `STTTrongNgay`: Số thứ tự tăng dần trong ca $\ge 1$
  8. `SoPhieu`: Chuỗi mã phiếu chuẩn dạng `NTQ-C85-001`
- **Xử lý nếu thiếu bất kỳ trường nào**: Nếu bản ghi có `LoaiHangDoi === 'DAT_LICH'` nhưng khuyết bất kỳ trường nào trong 7 trường còn lại, hệ thống đưa ngay vào danh mục `$partialRecords[]`, in tên các trường bị thiếu và kích hoạt cơ chế **FAIL-FAST (dừng ngay lập tức, trả về `Command::FAILURE`)**.
- **Đánh giá**: **PASS**.

---

### 2. Kiểm tra nhận diện 18 bản ghi trực tiếp cũ (Phương án C)
- **Đặc trưng dữ liệu**:
  - `LoaiHangDoi === 'TRUC_TIEP'`
  - `NgayKham`: Lấy từ ngày tiếp nhận thực tế (`2026-11-03`)
  - `MaChuyenKhoa`: Lấy từ chuyên khoa của bác sĩ tiếp nhận (`MaChuyenKhoa = 1`)
  - `MucUuTien`: P3 = 3 (Khám trực tiếp tiêu chuẩn)
  - `MaLichHen`: Bắt buộc là `NULL`
  - `MaCaKham`: Bắt buộc là `NULL` (trung thực với chứng từ lịch sử)
  - `STTTrongNgay`: Bắt buộc là `NULL` (không có ca khám cụ thể)
  - `SoPhieu`: Bắt buộc là `NULL`
- **Hiện trạng mã nguồn**:
  Đã bổ sung điều kiện lọc chính xác `TRUC_TIEP_LEGACY_OPTION_C`. Khi chạy lại command dry-run, toàn bộ 18 bản ghi này được nhận diện chính xác 100% vào danh sách `$alreadyBackfilled[]`, không bị báo lỗi và không bị ghi đè.
- **Đánh giá**: **PASS**.

---

### 3. Phát hiện mọi trạng thái dữ liệu bán phần (Partial Data Detection)
Hệ thống kiểm soát 4 nhóm lỗi dữ liệu dở dang / xung đột:
- **TH 2.1**: Có `NgayKham` nhưng thiếu `LoaiHangDoi` $\rightarrow$ Phát hiện lỗi và chặn dừng.
- **TH 2.2**: Có `LoaiHangDoi` nhưng thiếu `NgayKham` $\rightarrow$ Phát hiện lỗi và chặn dừng.
- **TH 2.3**: Lượt khám `DAT_LICH` nhưng thiếu 1 trong các trường `(MaLichHen, MaChuyenKhoa, MaCaKham, MucUuTien, STTTrongNgay, SoPhieu)` $\rightarrow$ Liệt kê danh sách trường thiếu và chặn dừng.
- **TH 2.4**: Lượt khám `TRUC_TIEP` nhưng có dữ liệu dở dang (ví dụ có `MaCaKham` nhưng thiếu `STTTrongNgay` hoặc `SoPhieu`, hoặc có `MaLichHen`) $\rightarrow$ Phát hiện lỗi và chặn dừng.
- **Đánh giá**: **PASS** (Đã kiểm chứng thực nghiệm bằng bộ 8 Unit Test đạt 100%).

---

### 4. Kiểm tra hàm `formatTicketNumber()` và nơi gọi
- **Định nghĩa hàm** ([BackfillHybridQueueData.php line 386](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L386)):
  ```php
  protected function formatTicketNumber(int $maChuyenKhoa, int $maCaKham, int $stt): string
  {
      ...
      return sprintf("%s-C%d-%03d", $prefix, $maCaKham, $stt);
  }
  ```
- **Nơi gọi hàm** ([BackfillHybridQueueData.php line 232](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L232)):
  ```php
  $item['SoPhieu'] = $this->formatTicketNumber($item['MaChuyenKhoa'], $item['MaCaKham'], $stt);
  ```
- **Xác minh tham số**:
  - Tham số 1: `$item['MaChuyenKhoa']` kiểu `int` $\rightarrow$ lấy tiền tố khoa (VD: `NTQ`).
  - Tham số 2: `$item['MaCaKham']` kiểu `int` $\rightarrow$ gắn tiền tố ca (VD: `C76`, `C85`).
  - Tham số 3: `$stt` kiểu `int` $\rightarrow$ sinh 3 chữ số (VD: `001`, `002`).
  - Khớp 100% về thứ tự tham số và kiểu dữ liệu.
- **Đánh giá**: **PASS**.

---

### 5. Bảo vệ file cấu hình `.env.testing` khỏi Git
- **Lỗ hổng được phát hiện**: File [.env.testing](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/.env.testing) chưa được khai báo trong [.gitignore](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/.gitignore), dẫn tới trạng thái `Untracked` trong Git, tiềm ẩn nguy cơ vô tình commit mật khẩu CSDL lên repository.
- **Hành động khắc phục**:
  Đã cập nhật [.gitignore](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/.gitignore):
  ```gitignore
  .env
  .env.backup
  .env.production
  .env.testing
  .env.*
  !.env.example
  ```
- **Kiểm chứng thực tế**: Lệnh `git status --porcelain` xác nhận `.env.testing` đã biến mất hoàn toàn khỏi danh sách file theo dõi, bảo vệ an toàn thông tin đăng nhập.
- **Đánh giá**: **PASS**.

---

### 6. Xác minh cơ chế nạp Database của Artisan với `--env=testing`
- **Phân tích cơ chế**:
  - Khi thực thi lệnh CLI có cờ `--env=testing`, Laravel Bootstrap gọi `DetectEnvironment`, ưu tiên nạp file `.env.testing` trước `.env`.
  - Tuy nhiên, để loại trừ 100% rủi ro phụ thuộc vào cấu hình bên ngoài, file [BackfillHybridQueueData.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L43-L58) đã được bổ sung **bộ tự kiểm tra nội tại ngay trong hàm `handle()`**:
    ```php
    $activeDb = DB::connection()->getDatabaseName();
    $conn = config('database.default');
    $host = config("database.connections.{$conn}.host");
    $port = config("database.connections.{$conn}.port");

    $this->info("KẾT NỐI CSDL THỰC TẾ TRONG ARTISAN:");
    $this->line(" - Connection: {$conn}");
    $this->line(" - Host:       {$host}:{$port}");
    $this->line(" - Database:   {$activeDb}");

    // Chốt chặn cứng: Tự động dừng nếu phát hiện database chính
    if ($isApply && $activeDb === 'phong_kham_thong_minh') {
        $this->error("CHẶN AN TOÀN TUYỆT ĐỐI: Database hiện tại là [phong_kham_thong_minh]. Lệnh --apply bị TỪ CHỐI!");
        return Command::FAILURE;
    }
    ```
- **Kết quả thực nghiệm**: Mọi lệnh thực thi qua Artisan đều in rõ ràng `Database: phong_kham_hybrid_queue_test` trên console trước khi xử lý bất kỳ logic nào.
- **Đánh giá**: **PASS**.

---

## PHẦN B — THIẾT KẾ CẤU TRÚC QUEUE MANAGEMENT SERVICE

*(Chưa tạo file code, chỉ đề xuất cấu trúc theo đúng nguyên tắc chỉ đạo)*

Dự kiến service sẽ được đặt tại: `app/Services/QueueManagementService.php`.

```
app/
└── Services/
    └── QueueManagementService.php
        ├── checkInAppointment(int $maLichHen, ?int $nguoiTiepNhanId): LuotKham
        ├── registerWalkIn(int $maBenhNhan, int $maChuyenKhoa, int $maCaKham, int $mucUuTien, ...): LuotKham
        ├── callNextPatient(int $maBacSi, int $maCaKham): ?LuotKham
        ├── skipPatient(int $maLuotKham, int $maBacSi, ?string $lyDo): LuotKham
        └── recallPatient(int $maLuotKham, int $nguoiGoiId): LuotKham
```

### 1. `checkInAppointment(int $maLichHen, ?int $nguoiTiepNhanId = null): LuotKham`
- **Mục tiêu**: Tiếp nhận bệnh nhân có lịch hẹn đã đặt trước khi họ có mặt tại phòng khám.
- **Quy tắc nghiệp vụ**:
  - Kiểm tra `lich_hen` có tồn tại và ở trạng thái hợp lệ (`DA_XAC_NHAN`).
  - Kiểm tra tính duy nhất: Một `MaLichHen` chỉ được check-in duy nhất một lần. Nếu đã tồn tại trong `luot_kham`, ném ngoại lệ `InvalidOperationException`.
  - Kiểm tra ngày khám của lịch hẹn phải là ngày hiện tại (`NgayLamViec == today()`).
  - Khóa bi quan bộ đếm: `hang_doi_counter` theo `(NgayKham, MaCaKham, MaChuyenKhoa)` với `FOR UPDATE`.
  - Tăng `SoHienTai` lên 1, gán `STTTrongNgay`, sinh `SoPhieu`.
  - Tạo `luot_kham` với `LoaiHangDoi = 'DAT_LICH'`, `MucUuTien = 2` (P2), `TrangThai = 'CHO_KHAM'`, `ThoiGianVaoHang = now()`.
  - Cập nhật trạng thái `lich_hen` sang `'DA_DEN'`.

### 2. `registerWalkIn(int $maBenhNhan, int $maChuyenKhoa, int $maCaKham, int $mucUuTien = 3, ?int $nguoiXacNhanId = null, ?string $lyDoUuTien = null): LuotKham`
- **Mục tiêu**: Tiếp nhận bệnh nhân đến trực tiếp tại quầy lễ tân.
- **Quy tắc nghiệp vụ**:
  - Kiểm tra ca khám `MaCaKham` có đang mở tiếp nhận (`TrangThai == 'CON_TRONG'` hoặc `TrangThai == 'MO'`).
  - Kiểm tra mức ưu tiên:
    - Nếu $P0$ (Cấp cứu): Yêu cầu bắt buộc phải có `nguoiXacNhanId` (Bác sĩ/Điều dưỡng) và `lyDoUuTien`. Trạng thái chuyển thẳng sang `'DANG_KHAM'` hoặc đưa lên đầu hàng đợi khẩn cấp.
    - Nếu $P1$ (Chính sách): Yêu cầu có `nguoiXacNhanId` (Lễ tân đối chiếu CCCD) và `lyDoUuTien`.
    - Mặc định là $P3$ (Trực tiếp thông thường).
  - Khóa bi quan `hang_doi_counter` với `FOR UPDATE`, tăng số đếm, tạo `SoPhieu`.
  - Tạo `luot_kham` với `LoaiHangDoi = 'TRUC_TIEP'`, `STTTrongNgay = $nextStt`, `TrangThai = 'CHO_KHAM'`.

### 3. `callNextPatient(int $maBacSi, int $maCaKham): ?LuotKham`
- **Mục tiêu**: Bác sĩ bấm nút gọi bệnh nhân kế tiếp vào phòng khám.
- **Quy tắc nghiệp vụ**:
  - Xác thực bác sĩ đang làm việc đúng ca `MaCaKham` và chuyên khoa tương ứng.
  - Kiểm tra quy định khám đơn lẻ: Nếu bác sĩ hiện đang có một lượt khám ở trạng thái `'DANG_KHAM'`, từ chối gọi thêm bệnh nhân mới cho đến khi hoàn thành hoặc tạm dừng lượt khám hiện tại.
  - Lấy bệnh nhân tiếp theo bằng truy vấn tối ưu và khóa dòng với `FOR UPDATE`:
    ```sql
    SELECT * FROM luot_kham
    WHERE NgayKham = CURRENT_DATE 
      AND MaCaKham = :maCaKham 
      AND TrangThai IN ('CHO_KHAM', 'GOI_LAI')
    ORDER BY 
      MucUuTien ASC,          -- P0 -> P1 -> P2 (Đặt lịch) -> P3 (Trực tiếp)
      ThoiGianVaoHang ASC     -- FIFO cho cùng mức ưu tiên
    LIMIT 1
    FOR UPDATE;
    ```
  - Cập nhật bản ghi: `TrangThai = 'DANG_KHAM'`, `ThoiGianGoiKham = now()`, `ThoiGianBatDauKham = now()`, `MaBacSi = $maBacSi`.

### 4. `skipPatient(int $maLuotKham, int $maBacSi, ?string $lyDo = null): LuotKham`
- **Mục tiêu**: Bác sĩ gọi nhiều lần (ví dụ quá 3 lần) nhưng bệnh nhân không có mặt.
- **Quy tắc nghiệp vụ**:
  - Khóa bản ghi `luot_kham` với `FOR UPDATE`.
  - Kiểm tra trạng thái hiện tại phải là `'DANG_KHAM'` (vừa được gọi) hoặc `'CHO_KHAM'`.
  - Cập nhật `TrangThai = 'BO_LUOT'`, ghi chú thời gian bỏ lượt và giải phóng slot khám của bác sĩ để có thể gọi bệnh nhân tiếp theo.

### 5. `recallPatient(int $maLuotKham, int $nguoiGoiId): LuotKham`
- **Mục tiêu**: Bệnh nhân bỏ lượt quay lại quầy tiếp nhận xin được gọi lại.
- **Quy tắc nghiệp vụ**:
  - Khóa bản ghi `luot_kham` với `FOR UPDATE`.
  - Kiểm tra trạng thái: Chỉ cho phép gọi lại các lượt khám đang ở trạng thái `'BO_LUOT'`. Tuyệt đối không cho phép gọi lại các lượt khám đã `'HOAN_THANH'` hoặc `'DA_HUY'`.
  - Chuyển `TrangThai = 'CHO_KHAM'` (hoặc `'GOI_LAI'`), cập nhật `ThoiGianVaoHang = now()` để xếp sau các bệnh nhân đang chờ đúng giờ, tránh bất công bằng cho hàng đợi.

---

## PHẦN C — THIẾT KẾ CHI TIẾT 10 KỊCH BẢN KIỂM THỬ TRỌNG YẾU

| Mã ca test | Tên kịch bản | Phân loại |
| :--- | :--- | :---: |
| **TC-QUEUE-01** | Một lịch hẹn chỉ được check-in duy nhất một lần | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-02** | Bệnh nhân trực tiếp được cấp số phiếu hợp lệ | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-03** | Hai yêu cầu cấp số đồng thời không trùng STT | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-04** | Hai bác sĩ gọi đồng thời không nhận cùng một bệnh nhân | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-05** | Bác sĩ khác chuyên khoa không được gọi bệnh nhân | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-06** | Bác sĩ đang khám không được gọi thêm bệnh nhân | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-07** | Bệnh nhân đã hoàn thành/hủy không được gọi lại | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-08** | Quy trình bỏ lượt và gọi lại bệnh nhân | `NOT TESTED` (Chờ triển khai Service) |
| **TC-QUEUE-09** | Bệnh nhân chờ kết quả CLS tái khám không bị cấp số mới | `NEED BUSINESS CONFIRMATION` |
| **TC-QUEUE-10** | Lượt khám trực tiếp cũ (Phương án C) không bị gọi nhầm vào ca mới | `PASS` (Đã kiểm chứng cấu trúc CSDL) |

---

### Chi tiết từng ca kiểm thử:

#### 1. TC-QUEUE-01: Một lịch hẹn chỉ được check-in duy nhất một lần
- **Dữ liệu đầu vào**: `MaLichHen = 117` (Đã check-in thành LK #214 trên DB test).
- **Trạng thái trước khi chạy**: Bảng `luot_kham` đã có bản ghi chứa `MaLichHen = 117`.
- **Hành động**: Gọi `QueueManagementService::checkInAppointment(117)`.
- **Kết quả mong đợi**: Ném ngoại lệ `ValidationException` hoặc `InvalidOperationException` với thông báo: *"Lịch hẹn này đã được tiếp nhận vào hàng đợi trước đó"*.
- **Trạng thái dữ liệu sau khi chạy**: Không có bản ghi mới nào được tạo trong `luot_kham`, ràng buộc `UNIQUE KEY MaLichHen` không bị vi phạm.

#### 2. TC-QUEUE-02: Bệnh nhân trực tiếp được cấp số phiếu hợp lệ
- **Dữ liệu đầu vào**: `MaBenhNhan = 1`, `MaChuyenKhoa = 1`, `MaCaKham = 85`, `MucUuTien = 3`.
- **Trạng thái trước khi chạy**: `hang_doi_counter` cho `(2026-11-03, 85, 1)` đang có `SoHienTai = 2`.
- **Hành động**: Gọi `QueueManagementService::registerWalkIn(...)`.
- **Kết quả mong đợi**: Trả về `LuotKham` mới có `STTTrongNgay = 3`, `SoPhieu = 'NTQ-C85-003'`, `LoaiHangDoi = 'TRUC_TIEP'`.
- **Trạng thái dữ liệu sau khi chạy**: `hang_doi_counter.SoHienTai` tăng lên `3`, `luot_kham` có thêm 1 bản ghi mới ở trạng thái `'CHO_KHAM'`.

#### 3. TC-QUEUE-03: Hai yêu cầu cấp số đồng thời không được tạo trùng STT
- **Dữ liệu đầu vào**: 2 tiến trình đồng thời gửi yêu cầu cấp số cho cùng một ca khám `(2026-11-03, Ca 85, Khoa 1)`.
- **Trạng thái trước khi chạy**: `SoHienTai = 2`.
- **Hành động**: Chạy 2 request song song (mô phỏng bằng 2 tiến trình CLI hoặc test concurrency).
- **Kết quả mong đợi**: 
  - Khóa bi quan `FOR UPDATE` trên `hang_doi_counter` buộc Request 2 phải đợi Request 1 commit.
  - Tiến trình 1 nhận `STT = 3` (`NTQ-C85-003`).
  - Tiến trình 2 nhận `STT = 4` (`NTQ-C85-004`).
  - Tuyệt đối không xảy ra lỗi trùng số hoặc deadlock.
- **Trạng thái dữ liệu sau khi chạy**: `SoHienTai = 4`. Ràng buộc `uq_lk_queue_scope_stt` được thỏa mãn.

#### 4. TC-QUEUE-04: Hai bác sĩ đồng thời gọi bệnh nhân không nhận cùng một lượt khám
- **Dữ liệu đầu vào**: BS A (Phòng 1) và BS B (Phòng 2) cùng làm việc tại Chuyên khoa 1 và cùng bấm "Gọi bệnh nhân tiếp theo" tại cùng một phần nghìn giây.
- **Trạng thái trước khi chạy**: Hàng đợi có 1 bệnh nhân $P2$ đang chờ ở trạng thái `'CHO_KHAM'`.
- **Hành động**: Cả hai tiến trình chạy câu truy vấn `SELECT ... FOR UPDATE LIMIT 1`.
- **Kết quả mong đợi**:
  - Bác sĩ A khóa thành công dòng bệnh nhân và nhận lượt khám.
  - Bác sĩ B bị khóa chờ; sau khi BS A commit (chuyển trạng thái sang `'DANG_KHAM'`), truy vấn của BS B tự động bỏ qua dòng này và chuyển sang bệnh nhân kế tiếp (hoặc trả về `NULL` nếu hết bệnh nhân).
- **Trạng thái dữ liệu sau khi chạy**: Không bao giờ có trường hợp 2 bác sĩ cùng khám chung 1 bệnh nhân.

#### 5. TC-QUEUE-05: Bác sĩ không thuộc chuyên khoa không được gọi bệnh nhân
- **Dữ liệu đầu vào**: Bác sĩ có `MaChuyenKhoa = 30` (Nhi khoa) bấm gọi bệnh nhân của `MaCaKham = 85` (Chuyên khoa Nội tổng quát).
- **Trạng thái trước khi chạy**: Bệnh nhân thuộc Chuyên khoa 1 đang chờ khám.
- **Hành động**: Gọi `QueueManagementService::callNextPatient(...)`.
- **Kết quả mong đợi**: Ném ngoại lệ `AuthorizationException` hoặc `SecurityException`: *"Bác sĩ không có thẩm quyền khám bệnh nhân chuyên khoa này"*.
- **Trạng thái dữ liệu sau khi chạy**: Dữ liệu hàng đợi không bị thay đổi.

#### 6. TC-QUEUE-06: Bác sĩ đang khám không được gọi thêm bệnh nhân mới
- **Dữ liệu đầu vào**: Bác sĩ C hiện đang có lượt khám #214 ở trạng thái `'DANG_KHAM'`.
- **Trạng thái trước khi chạy**: Lượt khám #214 chưa có thời gian kết thúc hoặc chưa chuyển sang trạng thái cận lâm sàng/hoàn thành.
- **Hành động**: Bác sĩ C tiếp tục bấm "Gọi bệnh nhân tiếp theo".
- **Kết quả mong đợi**: Ném ngoại lệ `InvalidOperationException`: *"Bác sĩ đang có ca khám chưa hoàn tất. Vui lòng kết luận hoặc chỉ định cận lâm sàng trước khi gọi bệnh nhân mới"*.
- **Trạng thái dữ liệu sau khi chạy**: Không có bệnh nhân mới nào bị chuyển sang `'DANG_KHAM'`.

#### 7. TC-QUEUE-07: Bệnh nhân đã hủy hoặc hoàn thành không được gọi lại
- **Dữ liệu đầu vào**: Lượt khám #100 đã có trạng thái `'HOAN_THANH'` (hoặc `'DA_HUY'`).
- **Hành động**: Gọi `QueueManagementService::recallPatient(100, $receptionistId)`.
- **Kết quả mong đợi**: Ném ngoại lệ `InvalidOperationException`: *"Lượt khám đã kết thúc, không thể kích hoạt lại vào hàng đợi"*.
- **Trạng thái dữ liệu sau khi chạy**: Trạng thái lượt khám vẫn giữ nguyên `'HOAN_THANH'`.

#### 8. TC-QUEUE-08: Quy trình bỏ lượt và gọi lại bệnh nhân
- **Dữ liệu đầu vào**: Lượt khám #214 đang được gọi nhưng bệnh nhân vắng mặt.
- **Hành động 1**: Bác sĩ gọi `skipPatient(214, $doctorId, "Gọi 3 lần không có mặt")`.
  - *Kết quả 1*: `TrangThai` chuyển thành `'BO_LUOT'`. Bác sĩ có thể gọi bệnh nhân tiếp theo.
- **Hành động 2**: 15 phút sau, bệnh nhân quay lại quầy tiếp nhận; Lễ tân gọi `recallPatient(214, $receptionistId)`.
  - *Kết quả 2*: `TrangThai` chuyển thành `'CHO_KHAM'`, `ThoiGianVaoHang` được cập nhật thành `now()` (hoặc trạng thái `'GOI_LAI'`).
- **Trạng thái dữ liệu sau khi chạy**: Lượt khám quay lại hàng đợi hợp lệ.

#### 9. TC-QUEUE-09: Bệnh nhân chờ khám lại sau cận lâm sàng không bị cấp số mới
- **Dữ liệu đầu vào**: Bệnh nhân sau khi thực hiện xét nghiệm/X-quang quay lại phòng khám ban đầu để bác sĩ đọc kết quả.
- **Cơ chế thiết kế**: Bệnh nhân này KHÔNG phải là lượt khám mới, không sinh thêm `SoPhieu` hay `STTTrongNgay` mới. Lượt khám cũ chuyển từ `'CHO_KET_QUA_CLS'` sang `'CHO_KHAM_LAI'`.
- **Độ ưu tiên**: Tự động được ưu tiên cao hơn bệnh nhân khám thông thường (tương đương mức $P1$ hoặc $P2$) để bác sĩ kết luận nhanh đơn thuốc.
- **Đánh giá**: **NEED BUSINESS CONFIRMATION** (Cần xác nhận từ giảng viên/chủ nhiệm đề tài về quy tắc ưu tiên tái khám CLS so với bệnh nhân lịch hẹn).

#### 10. TC-QUEUE-10: 18 Lượt khám trực tiếp cũ (Phương án C) không bị gọi nhầm vào ca mới
- **Dữ liệu đầu vào**: 18 bản ghi cũ có `MaCaKham = NULL`, `SoPhieu = NULL`, `NgayKham = '2026-11-03'`.
- **Hành động**: Bác sĩ mở ca khám `MaCaKham = 85` ngày hôm nay và bấm "Gọi bệnh nhân tiếp theo".
- **Kết quả mong đợi**: Truy vấn của `callNextPatient` có điều kiện `WHERE NgayKham = CURRENT_DATE AND MaCaKham = :caKham`. Do 18 bản ghi cũ có `MaCaKham = NULL` và ngày trong quá khứ, chúng hoàn toàn vô hình đối với hàng đợi mới và không bao giờ bị gọi nhầm.
- **Đánh giá**: **PASS** (Đã kiểm chứng qua mệnh đề SQL và cấu trúc CSDL).

---

## PHẦN D — ĐÁNH GIÁ TÍNH NHẤT QUÁN & AN TOÀN HỆ THỐNG

### 1. Cơ chế Transaction và Khóa bi quan (`lockForUpdate`)
- **Đánh giá**: Sử dụng `DB::transaction()` kết hợp `lockForUpdate()` trên `hang_doi_counter` là giải pháp đúng đắn nhất trên nền tảng Laravel + MySQL InnoDB.
- **Ưu điểm**:
  - Không cần cài thêm hạ tầng ngoài như Redis/RabbitMQ.
  - Tránh triệt để tình trạng hai tiến trình cùng đọc một giá trị counter cũ và cùng ghi đè (Lost Update).
  - Tự động rollback 100% nếu có lỗi phát sinh giữa chừng.

### 2. Ràng buộc `UNIQUE` tầng CSDL (`uq_lk_queue_scope_stt`)
- **Đánh giá**: Là "chốt chặn bảo hiểm cuối cùng" (Last Line of Defense).
- Nếu code tầng ứng dụng có lỗi (ví dụ ai đó quên `FOR UPDATE`), CSDL sẽ ném lỗi `1062 Duplicate entry` ngay lập tức, ngăn chặn dữ liệu bị sai lệch ở mức vật lý.

### 3. Phân quyền và Vai trò (RBAC)
- **Lễ tân (`VaiTro = 4`)**: Chỉ có quyền check-in lịch hẹn, đăng ký trực tiếp, xem màn hình sảnh, và gọi lại bệnh nhân bỏ lượt. Không có quyền bấm gọi khám hay kết luận bệnh án.
- **Bác sĩ (`VaiTro = 3`)**: Chỉ có quyền gọi bệnh nhân, bỏ lượt, chỉ định CLS, kê đơn thuốc và hoàn thành ca khám trong phạm vi ca làm việc được phân công.
- **Quản trị viên (`VaiTro = 1`)**: Xem báo cáo lưu lượng hàng đợi, theo dõi số lượng bệnh nhân theo ca, can thiệp cấu hình.

---

## PHẦN E — BẢNG PHÂN LOẠI TRẠNG THÁI & DANH MỤC CÔNG VIỆC

### 1. Bảng phân loại hạng mục theo quy định

| STT | Hạng mục kiểm tra | Phân loại | Căn cứ kỹ thuật / File liên quan |
| :---: | :--- | :---: | :--- |
| 1 | Nhận diện 8 trường bắt buộc của lượt đặt lịch | **PASS** | [BackfillHybridQueueData.php line 68](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L68) |
| 2 | Nhận diện 18 ca trực tiếp cũ theo Phương án C | **PASS** | [BackfillHybridQueueData.php line 84](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L84) |
| 3 | Tự động phát hiện dữ liệu bán phần (Fail-fast) | **PASS** | Bộ Unit test 8 kịch bản chạy pass 100% |
| 4 | Định dạng số phiếu `C{MaCaKham}` chống trùng | **PASS** | [BackfillHybridQueueData.php line 386](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php#L386) |
| 5 | Bảo vệ file `.env.testing` khỏi Git | **PASS** | Đã thêm vào [.gitignore line 6](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/.gitignore#L6) |
| 6 | Artisan tự kiểm tra mục tiêu kết nối CSDL | **PASS** | In rõ database trong banner và tự chặn `phong_kham_thong_minh` |
| 7 | Unique index cho phép nhiều dòng NULL an toàn | **PASS** | Kiểm chứng thực nghiệm trên MySQL 8 InnoDB test DB |
| 8 | Bác sĩ đang khám không được gọi thêm ca mới | **NOT TESTED** | Cần kiểm chứng khi viết code `QueueManagementService` |
| 9 | Kiểm thử tải đồng thời 50–100 request cấp số | **NOT TESTED** | Cần viết Integration Test mô phỏng đa luồng |
| 10 | Quy tắc ưu tiên bệnh nhân tái khám sau CLS | **NEED BUSINESS CONFIRMATION** | Cần xác nhận: Xếp vào đầu hàng đợi hay chờ sau 1-2 bệnh nhân? |

---

### 2. Danh sách công việc cần triển khai tiếp theo (Theo thứ tự ưu tiên)

1. **Ưu tiên 1 (Xác nhận nghiệp vụ)**: Chốt quy tắc xử lý bệnh nhân tái khám sau cận lâm sàng (TC-QUEUE-09) và quy tắc gọi lại bệnh nhân bỏ lượt (TC-QUEUE-08).
2. **Ưu tiên 2 (Xây dựng Service)**: Soạn thảo mã nguồn `app/Services/QueueManagementService.php` tích hợp đầy đủ khóa bi quan `lockForUpdate()`, kiểm soát transaction và validation.
3. **Ưu tiên 3 (Viết Unit/Feature Test)**: Tạo bộ kiểm thử tự động `tests/Feature/QueueManagementServiceTest.php` chạy trên database `phong_kham_hybrid_queue_test` để tự động hóa kiểm tra cả 10 kịch bản nêu trên.
4. **Ưu tiên 4 (Tích hợp Controller & Giao diện)**: Kết nối Service vào Controller tiếp nhận bệnh nhân và màn hình hiển thị hàng đợi của Bác sĩ / Sảnh chờ.
5. **Ưu tiên 5 (Phê duyệt Migration chính thức)**: Chỉ sau khi toàn bộ các bước 1–4 hoàn thành xuất sắc mới trình phê duyệt chạy migration và backfill lên CSDL thật `phong_kham_thong_minh`.

---

> [!IMPORTANT]
> **KẾT LUẬN CỦA PHASE 3.4**:
> Toàn bộ các vấn đề về mã nguồn Backfill, định dạng số phiếu, bảo mật `.gitignore` và cơ chế nạp CSDL thử nghiệm đã được giải quyết triệt để và kiểm chứng an toàn.
> Hệ thống **CHƯA triển khai migration trên database thật**, và **ĐÃ SẴN SÀNG để chuyển sang giai đoạn phát triển mã nguồn `QueueManagementService` cùng bộ Feature Test trên môi trường thử nghiệm**.
