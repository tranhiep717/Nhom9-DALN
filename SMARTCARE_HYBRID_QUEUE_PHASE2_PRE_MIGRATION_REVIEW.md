# SMARTCARE – BÁO CÁO RÀ SOÁT VÀ CHỐT THIẾT KẾ KỸ THUẬT TOÀN DIỆN
## HỆ THỐNG ĐIỀU PHỐI HÀNG ĐỢI KHÁM BỆNH HYBRID QUEUE (VERSION 2.9)

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_PHASE1_AUDIT_REPORT.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_PHASE1_AUDIT_REPORT.md)  
> **Phiên bản:** 2.9 (Comprehensive Deep Concurrency & Database Audit Review)  
> **Ngày lập:** 04/11/2026  
> **Môi trường Database xác thực:** MySQL **8.0.26**, Collation **utf8mb4_unicode_ci**, Storage Engine **InnoDB 100%**, Laravel **12.0**  
> **Cam kết an toàn tuyệt đối:** CHỈ đọc code/database, KHÔNG sửa code ứng dụng, KHÔNG tạo/chạy migration trên database chính, KHÔNG thay đổi dữ liệu hiện có.

---

## 1. THIẾT KẾ MYSQL TRIGGER VỚI TOÁN TỬ NULL-SAFE `<=>` BẢO VỆ 5 TRƯỜNG BẤT BIẾN (B-01, B-09)

### 1.1. Phân tích vòng đời và Tính bất biến tuyệt đối của `MaLichHen`
Trong phiên bản v2.6, việc dùng `OLD.MaLichHen IS NOT NULL` đã để lại một lỗ hổng: Nếu một lượt khám trực tiếp (`TRUC_TIEP`) được tạo với `MaLichHen = NULL`, thì câu lệnh `UPDATE` sau đó có thể gán `MaLichHen = A` mà không bị trigger chặn (vì `OLD.MaLichHen IS NOT NULL` là FALSE).

**Rà soát vòng đời thực tế của `luot_kham`:**
1. **Lượt khám đặt lịch (`DAT_LICH`):** Được tạo mới với `MaLichHen = A` (khác NULL).
2. **Lượt khám trực tiếp (`TRUC_TIEP`):** Được tạo mới với `MaLichHen = NULL`. Người bệnh khám trực tiếp tại phòng khám không bao giờ được phép "gán bổ sung" một lịch hẹn sau khi lượt khám đã khởi tạo.
3. **Lượt khám cũ cần Backfill:** Trong 23 bản ghi hiện có, 5 bản ghi đã có `MaLichHen` xác định, 18 bản ghi có `MaLichHen = NULL`.
4. **Quy tắc bất biến:** Một khi bản ghi `luot_kham` đã tồn tại, **`MaLichHen` KHÔNG BAO GIỜ ĐƯỢC PHÉP THAY ĐỔI** (cấm tuyệt đối: `NULL -> A`, `A -> NULL`, `A -> B`).

### 1.2. Phân biệt cơ chế bảo vệ: 4 trường khởi tạo Backfill vs `MaLichHen` (B-09)
- **Quy trình triển khai Migration 4 bước chuẩn hóa:**
  * *Bước 1 (Schema Add):* Thêm 4 cột `MaPhamVi`, `STTTrongNgay`, `SoPhieu`, `MaChuyenKhoa` dạng `NULLABLE`.
  * *Bước 2 (Data Backfill):* Chạy script cập nhật dữ liệu cho 23 bản ghi cũ (chuyển từ `NULL -> Giá trị hợp lệ`).
  * *Bước 3 (Schema Enforce):* Chạy câu lệnh `ALTER TABLE` chuyển 4 cột này sang `NOT NULL`.
  * *Bước 4 (Trigger Create):* Tạo trigger `trg_luot_kham_immutable_guard` **SAU KHI** đã hoàn tất backfill và enforce `NOT NULL`.
- **Hệ quả bảo mật:** Trong môi trường vận hành (production), nhờ có ràng buộc vật lý `NOT NULL`, mọi bản ghi mới tạo qua `INSERT` đều bắt buộc phải có đủ 4 trường. Trên câu lệnh `UPDATE`, `OLD.col` luôn khác NULL $\rightarrow$ Loại bỏ hoàn toàn lỗ hổng khởi tạo thiếu trường.

### 1.3. Mã Trigger hoàn thiện bảo vệ 5 trường
```sql
DELIMITER $$

CREATE TRIGGER trg_luot_kham_immutable_guard
BEFORE UPDATE ON luot_kham
FOR EACH ROW
BEGIN
    -- 1. BẢO VỆ TUYỆT ĐỐI MaLichHen: Cấm mọi thay đổi (kể cả từ NULL -> A, A -> NULL, A -> B)
    IF NOT (NEW.MaLichHen <=> OLD.MaLichHen) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vi pham toan ven: Khong duoc phep gan them, huy bo hoac thay doi MaLichHen sau khi luot kham da tao.';
    END IF;

    -- 2. BẢO VỆ 4 TRƯỜNG CẤP SỐ: Cấm sửa đổi khi đã có giá trị
    IF (OLD.MaPhamVi IS NOT NULL AND NOT (NEW.MaPhamVi <=> OLD.MaPhamVi)) OR
       (OLD.STTTrongNgay IS NOT NULL AND NOT (NEW.STTTrongNgay <=> OLD.STTTrongNgay)) OR
       (OLD.SoPhieu IS NOT NULL AND NOT (NEW.SoPhieu <=> OLD.SoPhieu)) OR
       (OLD.MaChuyenKhoa IS NOT NULL AND NOT (NEW.MaChuyenKhoa <=> OLD.MaChuyenKhoa)) THEN
        
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vi pham toan ven: Khong duoc sua doi cac truong cap so bat bien (MaPhamVi, STTTrongNgay, SoPhieu, MaChuyenKhoa).';
    END IF;
END$$

DELIMITER ;
```

---

## 2. THIẾT KẾ SỔ KIỂM TOÁN CẤP SỐ PHIẾU (`so_cap_so_phieu`) VÀ TOÀN VẸN GIAO DỊCH (B-05, B-06, B-07, B-08, B-11, B-12, B-13)

### 2.1. Chuẩn hóa Unique Key của Sổ Cấp Số (B-05)
Trong phiên bản cũ, unique key `(MaPhamVi, STTTrongNgay)` chưa thể hiện rõ ràng thành tố ngày độc lập. Phiên bản 2.9 chuẩn hóa thành:
$$\mathbf{UNIQUE\ KEY\ uq\_pham\_vi\_ngay\_stt\ (MaPhamVi,\ Ngay,\ STTTrongNgay)}$$
- Đảm bảo tính duy nhất theo Ngày và Phạm vi. Khi sang ngày mới (`Ngay = '2026-11-04'`), `STTTrongNgay` reset về 1 hoàn toàn không bị xung đột.

### 2.2. Schema Bảng Sổ Cấp Số, Đối Chiếu Kiểu Dữ Liệu và Chính Sách Khóa Ngoại (B-06, B-13)
> [!IMPORTANT] ĐỐI CHIẾU KIỂU DỮ LIỆU VÀ CHÍNH SÁCH XÓA (B-06, B-13):
> - Khảo sát trực tiếp từ `INFORMATION_SCHEMA.COLUMNS`: cột `luot_kham.MaLuotKham` có kiểu **`int(11) signed`**.
> - Do đó, cột `so_cap_so_phieu.MaLuotKham` **BẮT BUỘC PHẢI KHAI BÁO LÀ `INT NULL (signed)`**, tuyệt đối không dùng `BIGINT UNSIGNED` để tránh lỗi MySQL 1215/150.
> - **Chính sách Khóa ngoại (B-13):** Sử dụng **`ON DELETE RESTRICT`** thay vì `ON DELETE SET NULL`.
>   * *Lý do chuyên môn y tế (HIS):* Nếu dùng `SET NULL`, khi một lượt khám bị xóa vật lý, sổ cấp số sẽ bị xóa vết tham chiếu `MaLuotKham = NULL`, làm phá vỡ tính toàn vẹn kiểm toán y tế.
>   * *Quy tắc vận hành:* Hệ thống phòng khám cấm xóa vật lý (Hard Delete) các lượt khám đã phát sinh số phiếu. Mọi nghiệp vụ dừng/hủy khám phải chuyển trạng thái `TrangThai = 'DA_HUY'`. Khóa ngoại `RESTRICT` sẽ là chốt chặn kỹ thuật ngăn ngừa sai sót xóa nhầm dữ liệu.

```sql
CREATE TABLE so_cap_so_phieu (
    MaCapSo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    IdempotencyKey VARCHAR(64) NOT NULL,
    MaPhamVi VARCHAR(64) NOT NULL,
    Ngay DATE NOT NULL,
    STTTrongNgay INT UNSIGNED NOT NULL,
    SoPhieu VARCHAR(64) NOT NULL,
    TrangThai ENUM('DA_CAP', 'DANG_XU_LY', 'DA_SU_DUNG', 'DA_HUY') NOT NULL DEFAULT 'DA_CAP',
    MaLuotKham INT NULL, -- Đúng chuẩn int(11) signed khớp với luot_kham.MaLuotKham
    LockedByProcess VARCHAR(64) NULL,
    LeaseExpiresAt DATETIME NULL,
    ThoiGianCap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ThoiGianSuDung DATETIME NULL,
    GhiChu VARCHAR(255) NULL,

    UNIQUE KEY uq_idempotency_key (IdempotencyKey),
    UNIQUE KEY uq_so_phieu (SoPhieu),
    UNIQUE KEY uq_pham_vi_ngay_stt (MaPhamVi, Ngay, STTTrongNgay),
    UNIQUE KEY uq_scsp_ma_luot_kham (MaLuotKham), -- Quan hệ 1-1 chặt chẽ
    INDEX idx_lookup_ngay (Ngay, MaPhamVi, TrangThai),
    INDEX idx_reconcile (TrangThai, ThoiGianCap, LeaseExpiresAt),
    CONSTRAINT fk_scsp_luot_kham FOREIGN KEY (MaLuotKham) REFERENCES luot_kham (MaLuotKham) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Bảng `luot_kham` cũng được bổ sung ràng buộc duy nhất vật lý:
```sql
ALTER TABLE luot_kham ADD CONSTRAINT uq_luot_kham_so_phieu UNIQUE (SoPhieu);
```

### 2.3. Cơ Chế Chống Tạo Hai Lượt Khám Từ Cùng Một `IdempotencyKey` (B-07, B-11)
**Nguy cơ thực tế (B-11):** Khi client gửi đồng thời 2 request (A và B) cùng `IdempotencyKey`:
- Request A thực thi `INSERT INTO so_cap_so_phieu` thành công ở trạng thái `DA_CAP`.
- Request B gặp ngoại lệ MySQL 1062 trên `uq_idempotency_key`, sau đó đọc lại bản ghi vừa cấp (`DA_CAP`).
- Nếu không có cơ chế phân quyền xử lý, cả Request A và Request B sẽ cùng gọi câu lệnh `INSERT INTO luot_kham` song song $\rightarrow$ Nguy cơ tạo ra 2 lượt khám cùng sở hữu một số phiếu hoặc làm hỏng dữ liệu.

**Giải pháp Kiến trúc 3 tầng (B-11):**
1. **Tầng 1: Trạng thái Chuyển tiếp `DANG_XU_LY` với Lease Thời hạn:**
   Để được phép tạo lượt khám trong `luot_kham`, tiến trình phải Claim độc quyền bản ghi cấp số bằng câu lệnh nguyên tử:
   ```sql
   UPDATE so_cap_so_phieu
   SET TrangThai = 'DANG_XU_LY',
       LockedByProcess = :process_id,
       LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND)
   WHERE IdempotencyKey = :key
     AND (TrangThai = 'DA_CAP' OR (TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW()));
   ```
   - **Nếu `affected_rows === 1`:** Tiến trình này là người duy nhất thắng quyền sở hữu (ownership), được tiếp tục bước tạo `luot_kham`.
   - **Nếu `affected_rows === 0`:** Tiến trình kia đang xử lý hoặc đã hoàn tất. Tiến trình thua cuộc sẽ thực hiện vòng lặp poll có backoff (tối đa 5 lần, mỗi lần 200ms) để chờ đọc kết quả `MaLuotKham` đã hoàn tất từ tiến trình thắng cuộc.
2. **Tầng 2: Hoàn tất liên kết nguyên tử:**
   Sau khi tạo xong `luot_kham`, tiến trình cập nhật sổ cấp số:
   ```sql
   UPDATE so_cap_so_phieu
   SET TrangThai = 'DA_SU_DUNG',
       MaLuotKham = :maLuotKham,
       ThoiGianSuDung = NOW(),
       LockedByProcess = NULL,
       LeaseExpiresAt = NULL
   WHERE IdempotencyKey = :key AND TrangThai = 'DANG_XU_LY';
   ```
3. **Tầng 3: Ràng buộc chốt chặn vật lý Database:**
   - Ràng buộc **`UNIQUE KEY uq_luot_kham_so_phieu (SoPhieu)`** trên `luot_kham` và **`UNIQUE KEY uq_scsp_ma_luot_kham (MaLuotKham)`** trên `so_cap_so_phieu` bảo đảm rằng dù logic ứng dụng có bị bypass, Database Engine vẫn chặn đứng 100% nỗ lực chèn lượt khám trùng số phiếu.

### 2.4. Cơ Chế Chống Worker Đối Soát Hủy Nhầm Request Đang Xử Lý (B-08, B-12)
**Nguy cơ thực tế (B-12):** Worker background đối soát (`queue:reconcile-ticket-ledger`) định kỳ quét các phiếu `DA_CAP` có tuổi $> 15$ phút. Nếu hệ thống bị nghẽn mạng hoặc transaction của người dùng kéo dài, worker có thể chuyển số phiếu sang `DA_HUY` đúng lúc transaction người dùng vừa ghi vào `luot_kham`, dẫn đến số phiếu bị void oan.

**Giải pháp Kiến trúc 3 bước kiểm soát (B-12):**
1. **Kiểm tra Lease thời hạn:** Worker chỉ xét các bản ghi có `LeaseExpiresAt IS NULL` hoặc `LeaseExpiresAt < NOW()` (nghĩa là không có tiến trình nào đang giữ lease hợp lệ).
2. **Khóa bi quan (Pessimistic Lock):** Worker bắt buộc phải sử dụng `SELECT ... FOR UPDATE`:
   ```sql
   SELECT MaCapSo, SoPhieu, IdempotencyKey 
   FROM so_cap_so_phieu 
   WHERE TrangThai = 'DA_CAP' 
     AND ThoiGianCap < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
     AND (LeaseExpiresAt IS NULL OR LeaseExpiresAt < NOW())
   FOR UPDATE;
   ```
3. **Kiểm tra chéo Bảng `luot_kham` trước khi quyết định Hủy:**
   Đối với từng dòng khóa được, worker chạy truy vấn kiểm tra:
   ```sql
   SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = :soPhieu;
   ```
   - **Trường hợp A (Đã có `luot_kham`):** Chứng tỏ request của người dùng đã ghi thành công nhưng bước cập nhật `so_cap_so_phieu` bị gián đoạn. Worker **TUYỆT ĐỐI KHÔNG ĐƯỢC HỦY**, mà tự động chữa lành dữ liệu:
     `UPDATE so_cap_so_phieu SET TrangThai = 'DA_SU_DUNG', MaLuotKham = :maLuotKham, ThoiGianSuDung = NOW(), GhiChu = 'RECONCILED_BY_WORKER' WHERE MaCapSo = :maCapSo;`
   - **Trường hợp B (Không có `luot_kham`):** Xác nhận chắc chắn đây là số phiếu mồ côi (orphaned ticket do crash/rollback). Khi đó mới an toàn thực hiện hủy:
     `UPDATE so_cap_so_phieu SET TrangThai = 'DA_HUY', GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS' WHERE MaCapSo = :maCapSo;`

### 2.5. Xử Lý Số Phiếu Bị Bỏ Trống (Burned Tickets) (B-02)
- Theo chuẩn HIS y tế, một số thứ tự đã phát hành ra sổ cấp số mà không sử dụng sẽ được ghi nhận là **Burned Ticket (`DA_HUY`)**.
- Tuyệt đối không tái cấp số này cho bệnh nhân khác để bảo đảm tính liên tục thời gian và tránh nhầm lẫn trên bảng hiển thị điện tử phòng khám.

---

## 3. THIẾT KẾ KIỂM THỬ CONCURRENCY ĐỘC LẬP VÀ ĐO LƯỜNG CHÍNH XÁC (B-04, B-10, B-14)

### 3.1. Chuẩn Hóa 4 Mốc Thời Gian Đo Lường (B-14)
Hệ thống phân định rành mạch 4 mốc thời gian kỹ thuật để đánh giá tranh chấp đồng thời:
1. **$t_{ready}$ (Worker Ready Timestamp):** Thời điểm worker sẵn sàng tại Barrier (đo phía PHP app).
2. **$t_{send\_sql}$ (Driver Send Timestamp):** Thời điểm worker bắt đầu gọi lệnh `PDOStatement::execute()` (đo phía PHP app bằng `microtime(true)` đơn vị microsecond).
3. **$t_{lock\_wait}$ (InnoDB Lock Wait Started):** Thời điểm InnoDB đưa transaction vào hàng đợi chờ khóa (truy vấn từ `information_schema.innodb_trx.trx_wait_started`).
4. **$t_{deadlock}$ (Deadlock Detection Timestamp):** Thời điểm MySQL Engine phát hiện chu trình vòng tròn, ném Error 1213 và ghi log vào `SHOW ENGINE INNODB STATUS`.

### 3.2. Bản Chất Bảng `performance_schema.data_locks` và Tiêu Chí Hợp Lệ (B-10, B-14)
- **Làm rõ bản chất (B-14):** Trong MySQL 8.0.26, bảng `performance_schema.data_locks` là **BẢNG TRẠNG THÁI TỨC THỜI (Point-in-time Snapshot)**. Bảng này không lưu trữ lịch sử theo chuỗi thời gian, mà chỉ phản ánh danh sách các khóa đang giữ (granted) hoặc đang chờ (waiting) tại đúng thời điểm lệnh `SELECT` diễn ra.
- **Tiêu chí Execution Skew hợp lệ ($\Delta t \le 15\text{ms}$):**
  $$\Delta t = |t_{\text{worker1\_send}} - t_{\text{worker2\_send}}| \times 1000 \le \mathbf{15\text{ ms}}$$
  > [!NOTE] Ý NGHĨA KỸ THUẬT CỦA EXECUTION SKEW:
  > $\Delta t \le 15\text{ms}$ **CHỈ LÀ ĐIỀU KIỆN TIÊN QUYẾT ĐỂ XÁC NHẬN MẪU KIỂM THỬ HỢP LỆ (Sample Validity Criterion)**.
  > Nó chứng minh rằng hai tiến trình đã kích hoạt xung đột gần như đồng thời. Nó **KHÔNG PHẢI LÀ BẰNG CHỨNG RẰNG DEADLOCK ĐÃ XẢY RA**.
  > Bằng chứng thực tế về deadlock chỉ được công nhận khi:
  > 1. Client bắt được Error 1213 (ER_LOCK_DEADLOCK) hoặc Error 1205 (ER_LOCK_WAIT_TIMEOUT).
  > 2. `SHOW ENGINE INNODB STATUS` xuất hiện khối `LATEST DETECTED DEADLOCK`.

### 3.3. Cấu trúc Bảng Điều Phối Two-Phase Rendezvous Barrier (Chỉ dùng trong DB Clone)
```sql
CREATE TABLE test_concurrency_barrier (
    test_id VARCHAR(64) PRIMARY KEY,
    worker1_pid INT NULL,
    worker2_pid INT NULL,
    worker1_ready_at DECIMAL(16,4) NULL,
    worker2_ready_at DECIMAL(16,4) NULL,
    start_signal_at DECIMAL(16,4) NULL,
    worker1_send_sql_at DECIMAL(16,4) NULL,
    worker2_send_sql_at DECIMAL(16,4) NULL,
    execution_skew_ms DECIMAL(8,3) NULL,
    status ENUM('INIT', 'READY', 'RUNNING', 'COMPLETED', 'TIMEOUT', 'FAILED') NOT NULL DEFAULT 'INIT'
) ENGINE=InnoDB;
```

---

## 4. BẢN ĐỒ THỨ TỰ KHÓA VÀ KẾT LUẬN VỀ DEADLOCK TRONG CODEBASE (B-03)

### 4.1. Phân Định Rõ 4 Trạng Thái Kỹ Thuật Của Deadlock
1. **Khóa ngược xác định từ mã nguồn (Inverted lock order in code):** Đã phát hiện tại `store` ($LH \rightarrow LK$) so với `completeExamine` ($LK \rightarrow LH$).
2. **Deadlock tiềm tàng theo phân tích tĩnh (Potential deadlock by static analysis):** Tồn tại nguy cơ chu trình khóa khi hai tiến trình thao tác đồng thời trên cùng một ca bệnh.
3. **Deadlock thực tế được MySQL ghi nhận (Actual deadlock logged):** Chưa phát sinh trong dữ liệu 23 bản ghi hiện tại do lưu lượng thấp.
4. **Deadlock đã được kiểm thử và xử lý thành công (Deadlock tested & verified):** Đang chờ môi trường DB Clone để thực nghiệm kịch bản 2 worker.

> [!CAUTION] KẾT LUẬN KỸ THUẬT CHÍNH XÁC:
> Code hiện tại (`store` vs `completeExamine`) chưa được chỉnh sửa. Do đó, **NGUY CƠ DEADLOCK TIỀM TÀNG DO KHÓA NGƯỢC VẪN TỒN TẠI** trong mã nguồn và sẽ được chuẩn hóa đồng bộ theo cơ chế Two-Phase Read & Lock ở Giai đoạn 3.

---

## 5. BÁO CÁO KHẢO SÁT DỮ LIỆU LIVE VÀ GIẢI TRÌNH KỸ THUẬT SCHEMA (B-06, B-15)

### 5.1. Giải Trình Nguyên Nhân Lệnh Kiểm Tra Bị Exit Code 1 (B-15)
- **Hiện tượng:** Trong phiên review trước, lệnh kiểm tra schema chạy qua PowerShell bị trả về Exit Code 1.
- **Nguyên nhân kỹ thuật chính xác:**
  Lệnh được gọi dưới dạng one-liner:
  `powershell -Command "php -r \"... FROM INFORMATION_SCHEMA.COLUMNS ...\""`
  Bộ phân tích cú pháp của PowerShell (PowerShell Parser) hiểu nhầm từ khóa `FROM` là từ khóa dành riêng trong cú pháp nội bộ PowerShell (`The 'from' keyword is not supported in this version of the language`).
- **Khẳng định:** Đây là **LỖI PHÂN TÍCH CÚ PHÁP CỦA POWERSHELL CLI**, hoàn toàn KHÔNG PHẢI lỗi cú pháp PHP, không phải lỗi MySQL PDO, và không có sự cố schema nào trên database!
- **Khắc phục:** Toàn bộ lệnh kiểm tra đã được chuyển thành file script PHP độc lập ([inspect_db.php](file:///C:/Users/admin/.gemini/antigravity/brain/52fb4434-e48f-49cb-b645-73f33bebdcdf/scratch/inspect_db.php)) và chạy thành công 100% với Exit Code 0.

### 5.2. Khảo Sát Chi Tiết Kiểu Dữ Liệu Khóa Ngoại Live Database (B-06, B-15)
Khảo sát trực tiếp qua `INFORMATION_SCHEMA.COLUMNS` trên database `phong_kham_thong_minh`:

| Bảng | Cột | Kiểu Dữ Liệu Thực Tế | Nullable | Khóa / Thuộc Tính |
| :--- | :--- | :--- | :---: | :--- |
| `luot_kham` | `MaLuotKham` | **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `luot_kham` | `MaLichHen` | **`int(11) signed`** | YES | FOREIGN KEY trỏ `lich_hen` |
| `luot_kham` | `MaBacSi` | **`int(11) signed`** | NO | FOREIGN KEY trỏ `bac_si` |
| `luot_kham` | `MaBenhNhan` | **`int(11) signed`** | NO | FOREIGN KEY trỏ `benh_nhan` |
| `bac_si` | `MaBacSi` | **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `bac_si` | `MaChuyenKhoa` | **`int(11) signed`** | NO | FOREIGN KEY trỏ `chuyen_khoa` |
| `chuyen_khoa`| `MaChuyenKhoa`| **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `lich_hen` | `MaLichHen` | **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `ca_kham` | `MaCaKham` | **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `lich_lam_viec`| `MaLichLamViec`| **`int(11) signed`** | NO | PRIMARY KEY, auto_increment |
| `phieu_kham` | `MaLuotKham` | **`int(11) signed`** | NO | FOREIGN KEY trỏ `luot_kham` |

> $\rightarrow$ **Kết luận kiến trúc bắt buộc:** 100% các cột định danh và khóa ngoại liên quan trong hệ thống đều là kiểu **`INT (signed)`**, Storage Engine là **`InnoDB 100%`**, Collation là **`utf8mb4_unicode_ci`**. Bảng mới `so_cap_so_phieu` bắt buộc dùng `MaLuotKham INT NULL (signed)` để đảm bảo tương thích khóa ngoại.

### 5.3. Minh Bạch Dữ Liệu 23 Bản Ghi Lịch Sử Cần Backfill
- **Nhóm 1 (5 bản ghi `DAT_LICH`):** Có chứng từ lịch sử nguyên vẹn 100% qua chuỗi liên kết `lich_hen` $\rightarrow$ `ca_kham` $\rightarrow$ `lich_lam_viec` $\rightarrow$ `bac_si`. (LK #1, #156, #211, #214, #236).
- **Nhóm 2 (18 bản ghi `TRUC_TIEP`):** Không có `MaLichHen` (NULL). Suy luận từ bác sĩ thực tế ghi nhận lúc tiếp nhận (BS #1, BS #140 đều thuộc Chuyên khoa 1).
  * *Xác nhận minh bạch:* Schema cũ không có cột `MaChuyenKhoa` và chưa có bảng nhật ký tiếp nhận, nên không thể chứng minh lịch sử 100% chuyên khoa gốc bệnh nhân yêu cầu ban đầu.
  * *Chính sách audit:* Toàn bộ 18 bản ghi này khi backfill sẽ được ghi nhận cờ audit rõ ràng: `INFERRED_FROM_ASSIGNED_DOCTOR` trong bảng `lich_su_dieu_phoi`.

---

## 6. BẢNG PHÂN LOẠI VÀ THEO DÕI TOÀN DIỆN 15 BLOCKER (B-01 ĐẾN B-15)

| Mã | Tên Blocker Kỹ Thuật | Bằng Chứng Thực Tế (Code / Schema / DB) | Phân Tích Kỹ Thuật | Giải Pháp Thiết Kế Kiến Trúc | Trạng Thái Thiết Kế | Trạng Thái Triển Khai | Trạng Thái Kiểm Thử |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **B-01** | Trigger cho phép sửa `MaLichHen` từ `NULL -> A` | Trigger v2.6 dùng điều kiện `OLD.MaLichHen IS NOT NULL`. | Khi OLD là NULL, điều kiện FALSE khiến lệnh UPDATE gán bổ sung `MaLichHen` lọt qua. | Dùng toán tử NULL-safe `NOT (NEW.MaLichHen <=> OLD.MaLichHen)` cấm 100% thay đổi. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-02** | Mâu thuẫn Rollback và Quản lý số phiếu Burned | Transaction đơn làm rollback lùi bộ đếm hoặc mất số phiếu. | Rollback tầng DB hủy luôn số phiếu nhưng bệnh nhân đã cầm phiếu in giấy trên tay. | Tách cấp số thành Autonomous Transaction + Bảng sổ kiểm toán `so_cap_so_phieu`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-03** | Khóa ngược gây Deadlock tiềm tàng `store` vs `complete` | `store`: $LH \rightarrow LK$; `completeExamine`: $LK \rightarrow LH$ (L541-548). | Hai giao dịch thao tác chéo trên cùng ca bệnh sẽ hình thành chu trình khóa chéo. | Chuẩn hóa toàn hệ thống theo 2-Phase Read & Lock: Luôn khóa $LH$ trước $LK$. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-04** | Hiểu sai `GET_LOCK()` là Rendezvous Barrier | Mã giả kiểm thử v2.7 dùng `GET_LOCK('barrier')`. | `GET_LOCK` là khóa loại trừ tương hỗ (Mutex), tuần tự hóa worker chứ không phóng đồng thời. | Thiết kế Two-Phase Rendezvous Barrier bảng DB có đo độ lệch $\Delta t$ microsecond. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-05** | Unique Key của `so_cap_so_phieu` thiếu cột `Ngay` | Phiên bản cũ khai báo `UNIQUE (MaPhamVi, STTTrongNgay)`. | `STTTrongNgay` được reset theo ngày, sang ngày mới sẽ bị lỗi Duplicate 1062. | Chuẩn hóa thành `UNIQUE KEY uq_pham_vi_ngay_stt (MaPhamVi, Ngay, STTTrongNgay)`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-06** | Lệch kiểu dữ liệu Khóa ngoại (INT vs BIGINT) | `luot_kham.MaLuotKham` là `int(11) signed`, FK cũ khai BIGINT. | MySQL InnoDB ném lỗi 1215 (Cannot add foreign key constraint) do lệch kiểu dữ liệu. | Sửa tất cả cột FK trỏ tới `MaLuotKham` thành `INT NULL signed`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-07** | Race condition khi 2 request cùng `IdempotencyKey` | Trùng `IdempotencyKey` gây lỗi MySQL 1062. | Nếu không xử lý exception, client nhận lỗi 500 dù một request đã thành công. | Bắt lỗi 1062 trên `uq_idempotency_key` và đọc lại bản ghi thắng cuộc. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-08** | Thiếu cơ chế phục hồi số phiếu treo `DA_CAP` | Server crash giữa chừng làm số phiếu mồ côi không có lượt khám. | Sổ cấp số tồn đọng phiếu `DA_CAP` vĩnh viễn không bao giờ chuyển sang `DA_SU_DUNG`. | Background worker quét bản ghi `DA_CAP > 15m` và đối soát hoặc hủy sang `DA_HUY`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-09** | Quyền khởi tạo 4 trường bất biến chưa chặt chẽ | Cột mới thêm dạng Nullable nếu không enforce NOT NULL sẽ bị thiếu. | Dữ liệu tạo mới có thể bị bỏ trống nếu tầng DB không có ràng buộc vật lý. | Trình tự Migration 4 bước: Nullable $\rightarrow$ Backfill $\rightarrow$ Enforce NOT NULL $\rightarrow$ Trigger. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-10** | Thiếu công thức định lượng Execution Skew của Barrier | Tài liệu v2.7 chỉ nêu khái niệm barrier chung chung. | Không có tiêu chí toán học xác định worker có thực sự chạy đồng thời hay không. | Bổ sung công thức $\Delta t = \|t1 - t2\| \le 15\text{ms}$ dựa trên microsecond. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-11** | Chống tạo 2 lượt khám từ cùng một `IdempotencyKey` | Hai request cùng đọc `DA_CAP` rồi cùng gọi `INSERT luot_kham`. | Client double-click sinh 2 lượt khám cùng chung một yêu cầu/phiếu khám. | Trạng thái `DANG_XU_LY` kèm Lease Lock nguyên tử + `UNIQUE(SoPhieu)` trên `luot_kham`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-12** | Chống Worker đối soát hủy nhầm Request đang xử lý | Request kéo dài $>15$ phút bị Worker quét và chuyển `DA_HUY`. | Lượt khám vừa tạo xong thì số phiếu đã bị worker hủy, gây lệch dữ liệu audit. | Worker khóa dòng `FOR UPDATE` + Kiểm tra sự tồn tại trong `luot_kham` trước khi hủy. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-13** | Phá vỡ Audit Trail nếu dùng `ON DELETE SET NULL` | Thiết kế v2.8 khai báo `ON DELETE SET NULL` trên khóa ngoại `MaLuotKham`. | Hard delete lượt khám làm sổ cấp số mất vết liên kết (`MaLuotKham = NULL`). | Chuẩn hóa `ON DELETE RESTRICT` + Cấm Hard Delete trên toàn hệ sinh thái HIS. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-14** | Mơ hồ giữa Execution Skew và Bằng chứng Deadlock | Nhầm lẫn $\Delta t \le 15\text{ms}$ là bằng chứng chứng minh deadlock. | Skew chỉ đo độ đồng thời gửi lệnh, không đo được lock engine bên trong MySQL. | Phân định rõ 4 mốc thời gian; bằng chứng deadlock bắt buộc từ Error 1213 / InnoDB Status. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-15** | PowerShell CLI Exit Code 1 gây nghi ngờ schema | One-liner PowerShell bắt lỗi từ khóa reserved `from` trong câu lệnh SQL. | Lỗi cú pháp của PowerShell Parser khi xử lý chuỗi command line, không phải lỗi DB. | Chuyển toàn bộ kiểm tra sang script PHP độc lập; xác thực 100% schema và FK thành công. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |

---

## 7. KẾT LUẬN VÀ TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC

Theo đúng nguyên tắc an toàn bất biến:
- Toàn bộ các giải pháp trên hiện dừng lại ở cấp độ **HOÀN THIỆN TÀI LIỆU THIẾT KẾ ĐỂ CON NGƯỜI XEM XÉT**.
- Tuyệt đối chưa có dòng code ứng dụng nào bị sửa đổi.
- Tuyệt đối chưa có migration nào được tạo hoặc chạy.
- Database chính `phong_kham_thong_minh` được giữ nguyên vẹn 100%.

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Lý do giữ trạng thái: Toàn bộ 15 Blocker (B-01 đến B-15) đã hoàn thiện giải pháp 
toàn diện ở cấp độ Thiết kế kiến trúc, nhưng 100% đều đang ở trạng thái 
"CHƯA TRIỂN KHAI" và "CHƯA KIỂM THỬ". Cần sự xem xét và phê duyệt chính thức 
từ Quản trị viên trước khi chuyển sang bước tạo Database Clone để thực nghiệm.
================================================================================
```
