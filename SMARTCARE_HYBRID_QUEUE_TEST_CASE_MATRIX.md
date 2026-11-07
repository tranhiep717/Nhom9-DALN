# SMARTCARE HYBRID QUEUE – TEST CASE MATRIX (V2.9)
## MA TRẬN 53 TEST CASE KIỂM THỬ THỰC TẾ HỆ THỐNG ĐIỀU PHỐI HÀNG ĐỢI

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT.md)  
> **Tổng số Test Cases:** **53** (Tự động PHPUnit: 27 | Concurrency 2 tiến trình: 16 | Browser UI/Manual: 10)  
> **Cam kết an toàn:** 100% test case hiện ở trạng thái **`NOT TESTED`**. Tuyệt đối không đánh dấu PASS khi chưa thực nghiệm trên DB Clone.  
> **Trạng thái phê duyệt:** `NOT APPROVED – MIGRATION MUST NOT BE CREATED`.

---

### MỤC LỤC DANH MỤC TEST CASES

1. **Nhóm 1: Ràng Buộc Bất Biến & Trigger Guard (TC-IMM-001 đến TC-IMM-008)** — 8 Test Cases
2. **Nhóm 2: Sổ Cấp Số & Cấp Phiếu Độc Lập (TC-TKT-001 đến TC-TKT-008)** — 8 Test Cases
3. **Nhóm 3: Ma Trận Concurrency Trọng Yếu 8 Kịch Bản (TC-CON-001 đến TC-CON-014)** — 14 Test Cases
4. **Nhóm 4: Vòng Đời Nghiệp Vụ Khám Bệnh & Điều Phối (TC-BIZ-001 đến TC-BIZ-012)** — 12 Test Cases
5. **Nhóm 5: Tính Toàn Vẹn Khóa Ngoại & Chính Sách Xóa (TC-FK-001 đến TC-FK-005)** — 5 Test Cases
6. **Nhóm 6: Quy Trình Migration 4 Bước & Backfill Dữ Liệu (TC-MIG-001 đến TC-MIG-006)** — 6 Test Cases

---

### NHÓM 1: RÀNG BUỘC BẤT BIẾN & TRIGGER GUARD (B-01, B-09)

#### TC-IMM-001: Chặn sửa `MaLichHen` từ giá trị cũ sang giá trị mới (A -> B)
- **Liên quan:** Blocker B-01 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `luot_kham` #1 đã tồn tại với `MaLichHen = 1`. Trigger `trg_luot_kham_immutable_guard` đã được tạo trên DB Clone.
- **Dữ liệu kiểm thử:** `MaLuotKham = 1`, `OLD.MaLichHen = 1`, giá trị update thử nghiệm `NEW.MaLichHen = 2`.
- **Các bước thực hiện:**
  1. Kết nối DB Clone.
  2. Chạy câu lệnh: `UPDATE luot_kham SET MaLichHen = 2 WHERE MaLuotKham = 1;`
  3. Bắt ngoại lệ PDOException.
- **Kết quả mong đợi:** MySQL ném ngoại lệ SQLSTATE `45000` với thông báo: `Vi pham toan ven: Khong duoc phep gan them, huy bo hoac thay doi MaLichHen sau khi luot kham da tao.` Cột `MaLichHen` trong database vẫn giữ nguyên giá trị 1.
- **Bằng chứng cần thu thập:** Mã SQLSTATE trả về, Error Message, kết quả `SELECT MaLichHen FROM luot_kham WHERE MaLuotKham = 1`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-002: Chặn xóa `MaLichHen` về NULL (A -> NULL)
- **Liên quan:** Blocker B-01 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `luot_kham` #156 có `MaLichHen = 86`.
- **Dữ liệu kiểm thử:** `MaLuotKham = 156`, `NEW.MaLichHen = NULL`.
- **Các bước thực hiện:**
  1. Chạy câu lệnh: `UPDATE luot_kham SET MaLichHen = NULL WHERE MaLuotKham = 156;`
  2. Bắt ngoại lệ PDOException.
- **Kết quả mong đợi:** MySQL ném ngoại lệ SQLSTATE `45000`. Lệnh update bị rollback hoàn toàn.
- **Bằng chứng cần thu thập:** Mã lỗi SQLSTATE 45000, giá trị sau truy vấn vẫn là 86.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-003: Chặn gán bổ sung `MaLichHen` cho lượt khám trực tiếp ban đầu (NULL -> A)
- **Liên quan:** Blocker B-01 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `luot_kham` #100 là ca khám trực tiếp (`MaLichHen = NULL`).
- **Dữ liệu kiểm thử:** `MaLuotKham = 100`, `NEW.MaLichHen = 5`.
- **Các bước thực hiện:**
  1. Chạy câu lệnh: `UPDATE luot_kham SET MaLichHen = 5 WHERE MaLuotKham = 100;`
  2. Bắt ngoại lệ PDOException.
- **Kết quả mong đợi:** MySQL ném ngoại lệ SQLSTATE `45000` do điều kiện `NOT (NEW.MaLichHen <=> OLD.MaLichHen)` bắt được sự thay đổi từ NULL sang khác NULL.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, kiểm tra `MaLichHen IS NULL` vẫn đúng.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-004: Cho phép UPDATE các trường lâm sàng khi `MaLichHen` không đổi (NULL -> NULL hoặc A -> A)
- **Liên quan:** Blocker B-01 / Nhóm nghiệp vụ 06, 07.
- **Tiền điều kiện:** Lượt khám #1 (`MaLichHen = 1`) và Lượt khám #100 (`MaLichHen = NULL`).
- **Dữ liệu kiểm thử:** Cập nhật `TrangThai = 'DANG_KHAM'`, `ThoiGianBatDauKham = NOW()`.
- **Các bước thực hiện:**
  1. Chạy `UPDATE luot_kham SET TrangThai = 'DANG_KHAM' WHERE MaLuotKham = 1;`
  2. Chạy `UPDATE luot_kham SET TrangThai = 'DANG_KHAM' WHERE MaLuotKham = 100;`
- **Kết quả mong đợi:** Cả 2 câu lệnh UPDATE đều thành công (1 row affected), không bị trigger chặn.
- **Bằng chứng cần thu thập:** Số dòng bị ảnh hưởng = 1, `TrangThai` cập nhật thành công.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-005: Chặn sửa đổi cột `MaPhamVi` sau khi đã khởi tạo
- **Liên quan:** Blocker B-09 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `luot_kham` đã có `MaPhamVi = 'SCOPE_DL_1_20261104'`.
- **Dữ liệu kiểm thử:** `NEW.MaPhamVi = 'SCOPE_TT_1_20261104'`.
- **Các bước thực hiện:**
  1. Chạy: `UPDATE luot_kham SET MaPhamVi = 'SCOPE_TT_1_20261104' WHERE MaLuotKham = 1;`
- **Kết quả mong đợi:** Bị trigger ném SQLSTATE `45000` chặn sửa đổi trường cấp số bất biến.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `MaPhamVi` không bị đổi.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-006: Chặn sửa đổi cột `STTTrongNgay` sau khi đã khởi tạo
- **Liên quan:** Blocker B-09 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi có `STTTrongNgay = 1`.
- **Dữ liệu kiểm thử:** `NEW.STTTrongNgay = 2`.
- **Các bước thực hiện:**
  1. Chạy: `UPDATE luot_kham SET STTTrongNgay = 2 WHERE MaLuotKham = 1;`
- **Kết quả mong đợi:** Bị trigger ném SQLSTATE `45000` chặn đứng.
- **Bằng chứng cần thu thập:** SQLSTATE 45000.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-007: Chặn sửa đổi cột `SoPhieu` sau khi đã khởi tạo
- **Liên quan:** Blocker B-09 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi có `SoPhieu = 'DL-BS01-20261104-001'`.
- **Dữ liệu kiểm thử:** `NEW.SoPhieu = 'DL-BS01-20261104-999'`.
- **Các bước thực hiện:**
  1. Chạy: `UPDATE luot_kham SET SoPhieu = 'DL-BS01-20261104-999' WHERE MaLuotKham = 1;`
- **Kết quả mong đợi:** Bị trigger ném SQLSTATE `45000` chặn đứng.
- **Bằng chứng cần thu thập:** SQLSTATE 45000.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-IMM-008: Chặn sửa đổi cột `MaChuyenKhoa` sau khi đã khởi tạo
- **Liên quan:** Blocker B-09 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi có `MaChuyenKhoa = 1`.
- **Dữ liệu kiểm thử:** `NEW.MaChuyenKhoa = 30`.
- **Các bước thực hiện:**
  1. Chạy: `UPDATE luot_kham SET MaChuyenKhoa = 30 WHERE MaLuotKham = 1;`
- **Kết quả mong đợi:** Bị trigger ném SQLSTATE `45000` chặn đứng.
- **Bằng chứng cần thu thập:** SQLSTATE 45000.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 2: SỔ CẤP SỐ & CẤP PHIẾU ĐỘC LẬP (B-05, B-06)

#### TC-TKT-001: Cấp số thứ tự đầu tiên trong ngày cho Bác sĩ (STT = 1)
- **Liên quan:** Blocker B-05 / Nhóm nghiệp vụ 03, 04.
- **Tiền điều kiện:** Ngày mới `2026-11-04`, chưa có bản ghi cấp số nào cho BS #1.
- **Dữ liệu kiểm thử:** `Scope = 'SCOPE_DL_1_20261104'`, `Ngay = '2026-11-04'`.
- **Các bước thực hiện:**
  1. Gọi service cấp số `TicketLedgerService::issueTicket('IDEMP-001', 'SCOPE_DL_1_20261104', '2026-11-04', ...)`.
- **Kết quả mong đợi:** Bản ghi `so_cap_so_phieu` được tạo với `STTTrongNgay = 1`, `SoPhieu = 'DL-BS01-20261104-001'`, `TrangThai = 'DA_CAP'`.
- **Bằng chứng cần thu thập:** Dòng dữ liệu trong `so_cap_so_phieu` với `STTTrongNgay = 1`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-002: Cấp số liên tiếp trong cùng ngày (STT = 2, 3...) độc lập theo bác sĩ
- **Liên quan:** Blocker B-05 / Nhóm nghiệp vụ 03, 04.
- **Tiền điều kiện:** Đã có STT = 1 cho BS #1 ngày `2026-11-04`.
- **Dữ liệu kiểm thử:** `IdempotencyKey = 'IDEMP-002'`.
- **Các bước thực hiện:**
  1. Gọi tiếp hàm cấp số cho BS #1.
- **Kết quả mong đợi:** Cấp thành công với `STTTrongNgay = 2`, `SoPhieu = 'DL-BS01-20261104-002'`.
- **Bằng chứng cần thu thập:** Bản ghi có `STTTrongNgay = 2`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-003: Cấp số khám trực tiếp độc lập theo Chuyên khoa
- **Liên quan:** Blocker B-05 / Nhóm nghiệp vụ 02, 03.
- **Tiền điều kiện:** Chuyên khoa 1 ngày `2026-11-04`.
- **Dữ liệu kiểm thử:** `Scope = 'SCOPE_TT_1_20261104'`.
- **Các bước thực hiện:**
  1. Cấp số trực tiếp cho bệnh nhân tại quầy.
- **Kết quả mong đợi:** Cấp số `STTTrongNgay = 1`, `SoPhieu = 'TT-CK01-20261104-001'`.
- **Bằng chứng cần thu thập:** Bản ghi trong sổ với scope `SCOPE_TT_1_20261104`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-004: Hai bác sĩ khác nhau có cùng STT = 1 trong cùng một ngày không bị trùng khóa
- **Liên quan:** Blocker B-05 / Nhóm nghiệp vụ 03.
- **Tiền điều kiện:** BS #1 đã có STT = 1 ngày `2026-11-04`.
- **Dữ liệu kiểm thử:** Cấp số cho BS #140 ngày `2026-11-04`.
- **Các bước thực hiện:**
  1. Cấp số cho BS #140 (`SCOPE_DL_140_20261104`).
- **Kết quả mong đợi:** Cấp thành công `STTTrongNgay = 1` cho BS #140 mà không bị lỗi trùng Unique key `(MaPhamVi, Ngay, STTTrongNgay)`.
- **Bằng chứng cần thu thập:** 2 bản ghi cùng `STTTrongNgay = 1`, khác `MaPhamVi`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-005: Sang ngày mới (00:00:00), STT tự động reset về 1 cho cùng một bác sĩ
- **Liên quan:** Blocker B-05 / Nhóm nghiệp vụ 03.
- **Tiền điều kiện:** BS #1 đã có STT = 10 ngày `2026-11-04`.
- **Dữ liệu kiểm thử:** Ngày mới `2026-11-05`.
- **Các bước thực hiện:**
  1. Cấp số cho BS #1 với `Ngay = '2026-11-05'`.
- **Kết quả mong đợi:** STT được tính lại từ 1 (`STTTrongNgay = 1`), không bị cộng dồn sang ngày cũ.
- **Bằng chứng cần thu thập:** Bản ghi ngày `2026-11-05` có `STTTrongNgay = 1`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-006: Kiểm tra độ dài `SoPhieu` không vượt quá giới hạn VARCHAR(64)
- **Liên quan:** Nhóm nghiệp vụ 04.
- **Tiền điều kiện:** Bác sĩ mã số lớn, chuyên khoa mã số lớn, STT = 9999.
- **Dữ liệu kiểm thử:** Scope `SCOPE_DL_999999_20261104`.
- **Các bước thực hiện:**
  1. Sinh `SoPhieu` và đo độ dài chuỗi (`strlen`).
- **Kết quả mong đợi:** Độ dài chuỗi $\le 35$ ký tự, nằm gọn trong định dạng `VARCHAR(64)`.
- **Bằng chứng cần thu thập:** Giá trị `strlen($soPhieu) <= 64`.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-007: Ràng buộc vật lý `UNIQUE(SoPhieu)` trên bảng `luot_kham`
- **Liên quan:** Blocker B-11 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Đã có lượt khám mang `SoPhieu = 'TT-CK01-20261104-001'`.
- **Dữ liệu kiểm thử:** Tạo lượt khám thứ hai cố tình gán cùng `SoPhieu`.
- **Các bước thực hiện:**
  1. Chạy câu lệnh INSERT trực tiếp vào `luot_kham` với cùng `SoPhieu`.
- **Kết quả mong đợi:** MySQL Engine ném lỗi Duplicate entry 1062 trên `uq_luot_kham_so_phieu`.
- **Bằng chứng cần thu thập:** Mã lỗi MySQL 1062, transaction bị rollback.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-TKT-008: Ràng buộc duy nhất `UNIQUE(MaLuotKham)` trên sổ cấp số bảo đảm quan hệ 1-1
- **Liên quan:** Blocker B-11 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `so_cap_so_phieu` #1 đã liên kết `MaLuotKham = 100`.
- **Dữ liệu kiểm thử:** Cập nhật bản ghi `so_cap_so_phieu` #2 cũng trỏ tới `MaLuotKham = 100`.
- **Các bước thực hiện:**
  1. `UPDATE so_cap_so_phieu SET MaLuotKham = 100 WHERE MaCapSo = 2;`
- **Kết quả mong đợi:** MySQL ném lỗi 1062 trên `uq_scsp_ma_luot_kham`.
- **Bằng chứng cần thu thập:** Mã lỗi MySQL 1062.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 3: MA TRẬN CONCURRENCY TRỌNG YẾU 8 KỊCH BẢN (B-07, B-10, B-11, B-12, B-14)

#### TC-CON-001: Hai request cùng `IdempotencyKey` gửi đồng thời vào `so_cap_so_phieu` ($\Delta t \le 15\text{ms}$)
- **Liên quan:** Blocker B-07 / Kịch bản Concurrency 1.
- **Tiền điều kiện:** Hai worker PHP CLI độc lập kết nối DB Clone qua Rendezvous Barrier.
- **Dữ liệu kiểm thử:** Cùng `IdempotencyKey = 'IDEMP-RACE-001'`.
- **Các bước thực hiện:**
  1. Worker 1 và Worker 2 báo danh sẵn sàng tại Barrier.
  2. Barrier phát tín hiệu kích hoạt cùng thời điểm ($t_{send\_sql}$).
  3. Cả 2 worker cùng thực thi `INSERT INTO so_cap_so_phieu`.
- **Kết quả mong đợi:**
  * $\Delta t = |t_{\text{worker1}} - t_{\text{worker2}}| \le 15\text{ms}$.
  * Đúng 1 worker thành công (HTTP 201 / Inserted).
  * Worker thứ hai nhận lỗi MySQL 1062 trên `uq_idempotency_key` và được ứng dụng bắt trọn vẹn, không văng lỗi 500.
- **Bằng chứng cần thu thập:** Log Barrier ($\Delta t$), PDO exception message chứa `uq_idempotency_key`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-002: Hai request cùng `IdempotencyKey` tranh chấp claim trạng thái `DANG_XU_LY`
- **Liên quan:** Blocker B-11 / Kịch bản Concurrency 1.
- **Tiền điều kiện:** Bản ghi `so_cap_so_phieu` đã được tạo ở trạng thái `DA_CAP`. Hai worker cùng chạy câu lệnh UPDATE claim.
- **Dữ liệu kiểm thử:** Cùng `IdempotencyKey = 'IDEMP-CLAIM-001'`, `pid_1 = 101`, `pid_2 = 102`.
- **Các bước thực hiện:**
  1. Worker 1 và 2 kích hoạt đồng thời câu lệnh:
     `UPDATE so_cap_so_phieu SET TrangThai = 'DANG_XU_LY', LockedByProcess = :pid, LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND) WHERE IdempotencyKey = :key AND TrangThai = 'DA_CAP';`
- **Kết quả mong đợi:**
  * Worker thắng: `affected_rows === 1` $\rightarrow$ Tiếp tục gọi `INSERT luot_kham`.
  * Worker thua: `affected_rows === 0` $\rightarrow$ Không được gọi `INSERT luot_kham`, chuyển sang chờ poll.
  * Tuyệt đối không sinh 2 lượt khám song song.
- **Bằng chứng cần thu thập:** Số affected rows của từng worker, log quá trình xử lý.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-003: Request thua cuộc poll kết quả và nhận lại đúng `MaLuotKham` đã tạo
- **Liên quan:** Blocker B-11 / Kịch bản Concurrency 1.
- **Tiền điều kiện:** Worker 1 đang tạo `luot_kham`, Worker 2 đang poll.
- **Dữ liệu kiểm thử:** `IdempotencyKey = 'IDEMP-POLL-001'`.
- **Các bước thực hiện:**
  1. Worker 1 hoàn tất tạo `luot_kham` #500 và cập nhật `TrangThai = 'DA_SU_DUNG'`, `MaLuotKham = 500`.
  2. Worker 2 poll lần thứ 2 (sau 200ms) đọc thấy `TrangThai === 'DA_SU_DUNG'`.
- **Kết quả mong đợi:** Worker 2 trả về ngay lập tức dữ liệu lượt khám #500 của Worker 1 cho client với HTTP 200.
- **Bằng chứng cần thu thập:** JSON response của Worker 2 khớp hoàn toàn với Worker 1.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-004: Hai request khác `IdempotencyKey` cùng cấp số trong một phạm vi ($\Delta t \le 15\text{ms}$)
- **Liên quan:** Kịch bản Concurrency 2.
- **Tiền điều kiện:** Hai bệnh nhân khác nhau cùng tiếp nhận vào BS #1 tại cùng thời điểm.
- **Dữ liệu kiểm thử:** `Key1 = 'IDEMP-A'`, `Key2 = 'IDEMP-B'`, cùng Scope `SCOPE_DL_1_20261104`.
- **Các bước thực hiện:**
  1. Kích hoạt đồng thời 2 tiến trình cấp số qua Barrier.
- **Kết quả mong đợi:**
  * Cả 2 request đều thành công.
  * STT nhận được là 2 số nguyên liên tiếp (ví dụ STT = 5 và STT = 6).
  * Không có hiện tượng nhảy cóc số (gap) hoặc trùng số (duplicate).
- **Bằng chứng cần thu thập:** 2 bản ghi trong `so_cap_so_phieu` có STT liên tiếp, `execution_skew_ms <= 15`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-005: Worker đối soát chạy đồng thời với request cấp số đang xử lý
- **Liên quan:** Blocker B-12 / Kịch bản Concurrency 3.
- **Tiền điều kiện:** Bản ghi `DA_CAP` được tạo lúc $T_0$. Sau 15 phút, Request người dùng bắt đầu claim `DANG_XU_LY` (giữ Lease 60s). Đúng lúc đó Worker đối soát chạy.
- **Dữ liệu kiểm thử:** `LeaseExpiresAt = NOW() + 50s`.
- **Các bước thực hiện:**
  1. Worker đối soát chạy truy vấn `SELECT ... WHERE TrangThai = 'DA_CAP' AND (LeaseExpiresAt IS NULL OR LeaseExpiresAt < NOW()) FOR UPDATE`.
- **Kết quả mong đợi:** Worker đối soát bỏ qua bản ghi này (vì Lease còn hiệu lực), tuyệt đối không void sang `DA_HUY`.
- **Bằng chứng cần thu thập:** Bản ghi không bị đổi trạng thái bởi worker, log worker scan.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-006: Worker đối soát tự động phục hồi liên kết khi tìm thấy `SoPhieu` trong `luot_kham`
- **Liên quan:** Blocker B-12 / Kịch bản Concurrency 3.
- **Tiền điều kiện:** Một bản ghi `so_cap_so_phieu` bị treo `DA_CAP > 15m`, nhưng trong `luot_kham` đã có bản ghi mang `SoPhieu` tương ứng (do crash ở bước cập nhật cuối).
- **Dữ liệu kiểm thử:** `SoPhieu = 'DL-BS01-20261104-088'`.
- **Các bước thực hiện:**
  1. Chạy Artisan command `queue:reconcile-ticket-ledger`.
- **Kết quả mong đợi:** Worker phát hiện `luot_kham` đã tồn tại $\rightarrow$ Tự động cập nhật `so_cap_so_phieu.TrangThai = 'DA_SU_DUNG'`, gắn `MaLuotKham`, `GhiChu = 'RECONCILED_BY_WORKER'`. KHÔNG HỦY PHIẾU.
- **Bằng chứng cần thu thập:** Dữ liệu sau đối soát có `TrangThai = 'DA_SU_DUNG'`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-007: Xử lý khi Request bị treo quá thời hạn Lease (65 giây)
- **Liên quan:** Blocker B-11, B-12 / Kịch bản Concurrency 1.
- **Tiền điều kiện:** Request 1 claim lease nhưng bị sleep 65 giây (vượt lease 60s).
- **Dữ liệu kiểm thử:** `IdempotencyKey = 'IDEMP-TIMEOUT-001'`.
- **Các bước thực hiện:**
  1. Request 2 kiểm tra: thấy lease đã hết hạn $\rightarrow$ Request 2 claim lại quyền xử lý và tạo `luot_kham`.
  2. Request 1 thức dậy cố INSERT `luot_kham` với cùng `SoPhieu`.
- **Kết quả mong đợi:** Request 1 bị chặn lại bởi `UNIQUE(SoPhieu)` trên `luot_kham`. Hệ thống bảo toàn tính toàn vẹn, chỉ có 1 lượt khám duy nhất tồn tại.
- **Bằng chứng cần thu thập:** Request 2 thành công, Request 1 rollback với lỗi 1062.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-008: Bác sĩ gọi khám (`startExamine`) đồng thời Lễ tân hủy lượt (`cancel`) ($\Delta t \le 15\text{ms}$)
- **Liên quan:** Kịch bản Concurrency 4 / Nhóm nghiệp vụ 06, 13.
- **Tiền điều kiện:** Lượt khám #200 ở trạng thái `CHO_KHAM`.
- **Dữ liệu kiểm thử:** Hai worker gọi đồng thời 2 API.
- **Các bước thực hiện:**
  1. Worker 1 (Bác sĩ) gọi `POST /visits/200/start`.
  2. Worker 2 (Lễ tân) gọi `POST /visits/200/cancel`.
- **Kết quả mong đợi:**
  * Giao dịch nào đến trước sẽ khóa dòng bằng `lockForUpdate()`.
  * Nếu Bác sĩ thắng: Lượt khám chuyển `DANG_KHAM`, Lễ tân nhận lỗi 422 ("Lượt khám đang diễn ra, không thể hủy").
  * Nếu Lễ tân thắng: Lượt khám chuyển `DA_HUY`, Bác sĩ nhận lỗi 422 ("Lượt khám đã bị hủy").
  * Không bao giờ xảy ra tình trạng trạng thái bị đè lẫn nhau hoặc không nhất quán.
- **Bằng chứng cần thu thập:** Một bên trả về 200, một bên trả về 422, log trạng thái cuối.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-009: Bác sĩ hoàn thành khám (`completeExamine`) đồng thời Lễ tân điều phối lại ca khám
- **Liên quan:** Kịch bản Concurrency 5 / Nhóm nghiệp vụ 12, 13.
- **Tiền điều kiện:** Lượt khám #201 đang `DANG_KHAM` có phiếu khám hợp lệ.
- **Dữ liệu kiểm thử:** Hai worker kích hoạt đồng thời qua Barrier.
- **Các bước thực hiện:**
  1. Worker 1 gọi `completeExamine`.
  2. Worker 2 gọi lệnh điều phối chuyển bác sĩ.
- **Kết quả mong đợi:** Không phát sinh deadlock. Lệnh điều phối bị chặn nếu lượt khám đã `HOAN_THANH`.
- **Bằng chứng cần thu thập:** Không có lỗi MySQL 1213, trạng thái cuối là `HOAN_THANH`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-010: Kỹ thuật viên CLS cập nhật kết quả đồng thời Bác sĩ ghi bệnh án
- **Liên quan:** Kịch bản Concurrency 6 / Nhóm nghiệp vụ 07, 09, 10.
- **Tiền điều kiện:** Lượt khám #202 đang ở `CHO_KET_QUA`, chỉ định CLS cuối cùng đang chờ kết quả.
- **Dữ liệu kiểm thử:** KTV gọi `updateResult`, Bác sĩ gọi `savePhieuKham`.
- **Các bước thực hiện:**
  1. Kích hoạt đồng thời 2 worker.
- **Kết quả mong đợi:**
  * KTV cập nhật kết quả CLS thành công, tự động chuyển lượt khám sang `CHO_KHAM_LAI`.
  * Bác sĩ lưu hồ sơ bệnh án thành công mà không làm mất trạng thái `CHO_KHAM_LAI` và không làm mất `ChanDoanBanDau`.
- **Bằng chứng cần thu thập:** Lượt khám có `TrangThai = 'CHO_KHAM_LAI'`, `ChanDoanBanDau` nguyên vẹn.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-011: Thực nghiệm Deadlock thực tế với 2 transaction cố tình khóa ngược $LH$ và $LK$ ($\Delta t \le 15\text{ms}$)
- **Liên quan:** Blocker B-03, B-14 / Kịch bản Concurrency 7.
- **Tiền điều kiện:** Cùng ca bệnh gồm Lịch hẹn #50 và Lượt khám #50.
- **Dữ liệu kiểm thử:**
  * Worker 1: `SELECT * FROM lich_hen WHERE MaLichHen = 50 FOR UPDATE; sleep(0.05); SELECT * FROM luot_kham WHERE MaLuotKham = 50 FOR UPDATE;`
  * Worker 2: `SELECT * FROM luot_kham WHERE MaLuotKham = 50 FOR UPDATE; sleep(0.05); SELECT * FROM lich_hen WHERE MaLichHen = 50 FOR UPDATE;`
- **Các bước thực hiện:**
  1. Phóng đồng thời 2 worker qua Barrier với $\Delta t \le 15\text{ms}$.
- **Kết quả mong đợi:**
  * MySQL InnoDB phát hiện chu trình vòng tròn (Deadlock Cycle).
  * Một worker thành công, worker kia bị MySQL ném ngoại lệ Driver Error Code `1213` (ER_LOCK_DEADLOCK) và tự động rollback.
  * Câu lệnh `SHOW ENGINE INNODB STATUS` xuất hiện khối `LATEST DETECTED DEADLOCK`.
- **Bằng chứng cần thu thập:** Exception SQLSTATE `40001` (Error 1213), nội dung trích xuất từ `SHOW ENGINE INNODB STATUS`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-012: Kiểm chứng cơ chế Two-Phase Read & Lock ngăn ngừa hoàn toàn Deadlock
- **Liên quan:** Blocker B-03 / Kịch bản Concurrency 7.
- **Tiền điều kiện:** Chuẩn hóa cả 2 worker cùng tuân thủ thứ tự khóa toàn cục: Luôn khóa `lich_hen` TRƯỚC `luot_kham`.
- **Dữ liệu kiểm thử:** Cùng cặp ID #50.
- **Các bước thực hiện:**
  1. Cả 2 worker cùng thực thi theo thứ tự $LH \rightarrow LK$ qua Barrier ($\Delta t \le 15\text{ms}$).
- **Kết quả mong đợi:**
  * Worker thứ hai xếp hàng chờ khóa (Lock Wait) trên `lich_hen`, sau đó thực thi tuần tự an toàn.
  * **0% DEADLOCK** (Không phát sinh Error 1213).
- **Bằng chứng cần thu thập:** Cả 2 worker hoàn thành thành công, `SHOW ENGINE INNODB STATUS` không có deadlock mới.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-013: Crash mô phỏng sau khi cấp số nhưng trước khi tạo lượt khám $\rightarrow$ Chuyển Burned Ticket
- **Liên quan:** Blocker B-02, B-08 / Kịch bản Concurrency 8.
- **Tiền điều kiện:** Bản ghi `so_cap_so_phieu` tạo thành công nhưng tiến trình bị kill đột ngột (hoặc ném RuntimeException).
- **Dữ liệu kiểm thử:** `IdempotencyKey = 'IDEMP-CRASH-001'`.
- **Các bước thực hiện:**
  1. Mock exception sau khi commit bảng cấp số.
  2. Bản ghi ở trạng thái `DA_CAP`. Tua thời gian giả định qua 15 phút.
  3. Kích hoạt Worker đối soát `queue:reconcile-ticket-ledger`.
- **Kết quả mong đợi:** Worker chuyển bản ghi sang `TrangThai = 'DA_HUY'`, `GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS'`. Không cấp lại số này.
- **Bằng chứng cần thu thập:** Bản ghi có `TrangThai = 'DA_HUY'`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-CON-014: Đo lường độ trễ Barrier: Hủy mẫu kiểm thử nếu Execution Skew $\Delta t > 15\text{ms}$
- **Liên quan:** Blocker B-10, B-14.
- **Tiền điều kiện:** Hai worker chạy trên môi trường có tải CPU đột biến.
- **Dữ liệu kiểm thử:** Cố tình delay worker 2 thêm 25ms.
- **Các bước thực hiện:**
  1. Barrier ghi nhận: `skew_ms = 25.120`.
- **Kết quả mong đợi:** Barrier đánh dấu trạng thái `status = 'INVALID_SAMPLE'`, tự động hủy kết quả test run và kích hoạt chạy lại lần sau.
- **Bằng chứng cần thu thập:** Bảng `test_concurrency_barrier` ghi nhận `INVALID_SAMPLE`.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `2-Process Concurrency`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 4: VÒNG ĐỜI NGHIỆP VỤ KHÁM BỆNH & ĐIỀU PHỐI (B-02, B-03)

#### TC-BIZ-001: Tiếp nhận Lịch hẹn hợp lệ chuyển sang `CHO_KHAM` và đồng bộ `lich_hen`
- **Liên quan:** Nhóm nghiệp vụ 01, 03.
- **Tiền điều kiện:** Lịch hẹn #10 ở trạng thái `DA_XAC_NHAN`.
- **Dữ liệu kiểm thử:** Lễ tân tiếp nhận lịch hẹn #10.
- **Các bước thực hiện:**
  1. Gửi `POST /visits` với `MaLichHen = 10`.
- **Kết quả mong đợi:**
  * Lượt khám mới được tạo với `TrangThai = 'CHO_KHAM'`, `MaLichHen = 10`.
  * Lịch hẹn #10 chuyển sang `TrangThai = 'DA_TIEP_NHAN'`.
- **Bằng chứng cần thu thập:** Dữ liệu trong `luot_kham` và `lich_hen`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-002: Chặn tiếp nhận lịch hẹn đang ở trạng thái `DA_HUY` hoặc `HOAN_THANH`
- **Liên quan:** Nhóm nghiệp vụ 01.
- **Tiền điều kiện:** Lịch hẹn #11 có `TrangThai = 'DA_HUY'`.
- **Dữ liệu kiểm thử:** `MaLichHen = 11`.
- **Các bước thực hiện:**
  1. Gửi request tiếp nhận lịch #11.
- **Kết quả mong đợi:** Bị từ chối với lỗi ValidationException 422. Không tạo lượt khám.
- **Bằng chứng cần thu thập:** HTTP Status 422, validation message.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-003: Chặn tiếp nhận trùng lặp cho một lịch hẹn đã tiếp nhận trước đó
- **Liên quan:** Nhóm nghiệp vụ 01.
- **Tiền điều kiện:** Lịch hẹn #10 đã có `TrangThai = 'DA_TIEP_NHAN'`.
- **Dữ liệu kiểm thử:** Gửi tiếp nhận lại lịch #10.
- **Các bước thực hiện:**
  1. Gửi `POST /visits` với `MaLichHen = 10`.
- **Kết quả mong đợi:** Bị từ chối với lỗi ValidationException 422: "Lịch hẹn này đã được tiếp nhận tạo lượt khám trước đó."
- **Bằng chứng cần thu thập:** HTTP Status 422.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-004: Tiếp nhận khám trực tiếp không qua lịch hẹn (`MaLichHen = NULL`)
- **Liên quan:** Nhóm nghiệp vụ 02.
- **Tiền điều kiện:** Bệnh nhân #5 đến khám trực tiếp, chọn BS #1 (Chuyên khoa 1).
- **Dữ liệu kiểm thử:** `MaBenhNhan = 5`, `MaBacSi = 1`, `MaLichHen = null`.
- **Các bước thực hiện:**
  1. Gửi `POST /visits` với thông tin bệnh nhân và bác sĩ.
- **Kết quả mong đợi:**
  * Lượt khám được tạo với `MaLichHen = NULL`, `MaChuyenKhoa = 1`.
  * Cấp số phiếu trực tiếp thành công.
- **Bằng chứng cần thu thập:** Bản ghi `luot_kham` mới có `MaLichHen IS NULL`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-005: Kiểm tra phân quyền: Bác sĩ khác không được thao tác trên lượt khám không được phân công
- **Liên quan:** Nhóm nghiệp vụ 06.
- **Tiền điều kiện:** Lượt khám #100 được phân công cho BS #1. BS #140 đăng nhập vào hệ thống.
- **Dữ liệu kiểm thử:** BS #140 gửi request bắt đầu khám lượt #100.
- **Các bước thực hiện:**
  1. Gọi `POST /visits/100/start` với tài khoản BS #140.
- **Kết quả mong đợi:** Bị chặn với HTTP Status 403: "Chỉ Bác sĩ phụ trách mới có quyền bắt đầu phiên khám bệnh."
- **Bằng chứng cần thu thập:** HTTP Status 403.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-006: Ghi hồ sơ bệnh án ban đầu (`PhieuKham`) bảo toàn `ChanDoanBanDau`
- **Liên quan:** Nhóm nghiệp vụ 07.
- **Tiền điều kiện:** Lượt khám đang ở `DANG_KHAM`.
- **Dữ liệu kiểm thử:** Bác sĩ nhập chẩn đoán sơ bộ: "Viêm họng cấp nghi do liên cầu".
- **Các bước thực hiện:**
  1. Gửi `POST /visits/100/phieu-kham` với `ChanDoanBanDau = 'Viêm họng cấp nghi do liên cầu'`.
- **Kết quả mong đợi:** Bản ghi `phieu_kham` được lưu với đúng `ChanDoanBanDau`.
- **Bằng chứng cần thu thập:** Dữ liệu trong bảng `phieu_kham`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-007: Chỉ định cận lâm sàng chuyển lượt khám sang `CHO_KET_QUA`
- **Liên quan:** Nhóm nghiệp vụ 08.
- **Tiền điều kiện:** Lượt khám đang `DANG_KHAM`.
- **Dữ liệu kiểm thử:** Chỉ định dịch vụ Nội soi tai mũi họng (DV #1).
- **Các bước thực hiện:**
  1. Gửi `POST /chi-dinh-dich-vu` tạo chỉ định.
- **Kết quả mong đợi:**
  * Phiếu chỉ định được tạo ở trạng thái `CHO_TIEP_NHAN`.
  * Lượt khám tự động chuyển sang `CHO_KET_QUA`.
- **Bằng chứng cần thu thập:** Trạng thái lượt khám trong DB là `CHO_KET_QUA`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-008: Kỹ thuật viên CLS tiếp nhận chỉ định và thực hiện kỹ thuật
- **Liên quan:** Nhóm nghiệp vụ 09.
- **Tiền điều kiện:** Phiếu chỉ định ở trạng thái `CHO_TIEP_NHAN`.
- **Dữ liệu kiểm thử:** KTV bấm tiếp nhận và bắt đầu làm.
- **Các bước thực hiện:**
  1. `POST /can-lam-sang/{id}/receive` $\rightarrow$ Chuyển `DA_TIEP_NHAN`.
  2. `POST /can-lam-sang/{id}/start` $\rightarrow$ Chuyển `DANG_THUC_HIEN`.
- **Kết quả mong đợi:** Các bước chuyển trạng thái đúng quy trình.
- **Bằng chứng cần thu thập:** Log trạng thái trong `chi_dinh_dich_vu`.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-009: Cập nhật kết quả một phần khi còn chỉ định khác chưa xong
- **Liên quan:** Nhóm nghiệp vụ 09, 10.
- **Tiền điều kiện:** Lượt khám có 2 chỉ định (X-Quang và Xét nghiệm máu).
- **Dữ liệu kiểm thử:** KTV cập nhật kết quả cho X-Quang.
- **Các bước thực hiện:**
  1. Gọi `POST /can-lam-sang/{xquang_id}/result`.
- **Kết quả mong đợi:**
  * Chỉ định X-Quang chuyển `DA_CO_KET_QUA`.
  * Do Xét nghiệm máu chưa xong (`pendingCount = 1`), lượt khám **VẪN GIỮ NGUYÊN `CHO_KET_QUA`**.
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai` vẫn là `CHO_KET_QUA`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-010: Cập nhật kết quả chỉ định cuối cùng tự động chuyển lượt khám sang `CHO_KHAM_LAI`
- **Liên quan:** Nhóm nghiệp vụ 10.
- **Tiền điều kiện:** Tiếp tục từ TC-BIZ-009, Xét nghiệm máu là chỉ định cuối cùng.
- **Dữ liệu kiểm thử:** KTV cập nhật kết quả Xét nghiệm máu.
- **Các bước thực hiện:**
  1. Gọi `POST /can-lam-sang/{blood_id}/result`.
- **Kết quả mong đợi:**
  * `pendingCount === 0`.
  * Lượt khám tự động chuyển sang `CHO_KHAM_LAI`.
  * Phát thông báo ưu tiên cho Bác sĩ.
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KHAM_LAI'`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-011: Bác sĩ ghi chẩn đoán kết luận sau CLS không làm mất `ChanDoanBanDau`
- **Liên quan:** Nhóm nghiệp vụ 07, 10.
- **Tiền điều kiện:** Lượt khám đang ở `CHO_KHAM_LAI`, đã có `ChanDoanBanDau` từ trước.
- **Dữ liệu kiểm thử:** Bác sĩ nhập `ChanDoanSauCLS = 'Viêm amidan hốc mủ mạn tính'`.
- **Các bước thực hiện:**
  1. Gửi `POST /visits/100/phieu-kham` với `ChanDoanSauCLS`.
- **Kết quả mong đợi:**
  * `ChanDoanSauCLS` được lưu giá trị mới.
  * `ChanDoanBanDau` vẫn được bảo toàn nguyên vẹn giá trị ban đầu.
- **Bằng chứng cần thu thập:** Truy vấn bản ghi `phieu_kham` có đủ cả 2 trường.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-BIZ-012: Hoàn tất lượt khám (`completeExamine`) chặn tuyệt đối nếu còn dịch vụ CLS chưa có kết quả
- **Liên quan:** Nhóm nghiệp vụ 12.
- **Tiền điều kiện:** Lượt khám vẫn còn 1 chỉ định CLS ở trạng thái `DANG_THUC_HIEN`.
- **Dữ liệu kiểm thử:** Bác sĩ bấm "Hoàn tất khám bệnh".
- **Các bước thực hiện:**
  1. Gửi `POST /visits/100/complete`.
- **Kết quả mong đợi:** Bị từ chối với HTTP Status 422: "Lượt khám vẫn còn 1 dịch vụ cận lâm sàng chưa có kết quả." Lượt khám không bị đóng.
- **Bằng chứng cần thu thập:** HTTP Status 422, error message.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 5: TÍNH TOÀN VẸN KHÓA NGOẠI & CHÍNH SÁCH XÓA (B-06, B-13)

#### TC-FK-001: Khóa ngoại `fk_scsp_luot_kham` chặn Hard Delete lượt khám (`ON DELETE RESTRICT`)
- **Liên quan:** Blocker B-13 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bản ghi `so_cap_so_phieu` đã liên kết tới `luot_kham` #100.
- **Dữ liệu kiểm thử:** Chạy lệnh xóa vật lý `DELETE FROM luot_kham WHERE MaLuotKham = 100`.
- **Các bước thực hiện:**
  1. Thực thi câu lệnh DELETE trên.
- **Kết quả mong đợi:** MySQL InnoDB ném ngoại lệ Error 1451: `Cannot delete or update a parent row: a foreign key constraint fails`. Lượt khám không bị xóa.
- **Bằng chứng cần thu thập:** Mã lỗi MySQL 1451, dòng dữ liệu vẫn tồn tại.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-FK-002: Hủy nghiệp vụ lượt khám bằng cách cập nhật `TrangThai = 'DA_HUY'` thành công
- **Liên quan:** Blocker B-13 / Nhóm nghiệp vụ 13.
- **Tiền điều kiện:** Lượt khám #100 đang ở `CHO_KHAM`.
- **Dữ liệu kiểm thử:** Cập nhật trạng thái hủy.
- **Các bước thực hiện:**
  1. `UPDATE luot_kham SET TrangThai = 'DA_HUY' WHERE MaLuotKham = 100;`
- **Kết quả mong đợi:** Cập nhật thành công. Sổ cấp số vẫn giữ nguyên liên kết `MaLuotKham = 100`, không làm mất dấu vết kiểm toán.
- **Bằng chứng cần thu thập:** Cả 2 bảng đều giữ nguyên dữ liệu và quan hệ.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-FK-003: Khóa ngoại chặn xóa Bác sĩ khi đang có lượt khám liên kết
- **Liên quan:** Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** BS #1 đang có 5 lượt khám trong hệ thống.
- **Dữ liệu kiểm thử:** `DELETE FROM bac_si WHERE MaBacSi = 1`.
- **Các bước thực hiện:**
  1. Chạy lệnh DELETE bác sĩ #1.
- **Kết quả mong đợi:** Bị MySQL chặn bởi ràng buộc khóa ngoại (Error 1451).
- **Bằng chứng cần thu thập:** Error 1451.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-FK-004: Khóa ngoại chặn xóa Bệnh nhân khi đang có hồ sơ lượt khám
- **Liên quan:** Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** Bệnh nhân #2 đang có lịch sử khám.
- **Dữ liệu kiểm thử:** `DELETE FROM benh_nhan WHERE MaBenhNhan = 2`.
- **Các bước thực hiện:**
  1. Chạy lệnh DELETE bệnh nhân #2.
- **Kết quả mong đợi:** Bị MySQL chặn bởi ràng buộc khóa ngoại.
- **Bằng chứng cần thu thập:** Error 1451.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-FK-005: Đối chiếu 100% cột khóa ngoại kiểu `INT signed` không bị cảnh báo truncation
- **Liên quan:** Blocker B-06 / Nhóm nghiệp vụ 15.
- **Tiền điều kiện:** DB Clone với schema mới.
- **Dữ liệu kiểm thử:** Chèn bản ghi với giá trị ID lớn (ví dụ `2147483647`).
- **Các bước thực hiện:**
  1. Kiểm tra kiểu dữ liệu `DATA_TYPE = 'int'` trong `INFORMATION_SCHEMA.COLUMNS`.
- **Kết quả mong đợi:** 100% các cột khớp hoàn hảo kiểu dữ liệu `INT signed`, không phát sinh warning.
- **Bằng chứng cần thu thập:** Kết quả truy vấn `INFORMATION_SCHEMA`.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 6: QUY TRÌNH MIGRATION 4 BƯỚC & BACKFILL DỮ LIỆU (B-06, B-09, B-15)

#### TC-MIG-001: Bước 1 Migration — Thêm 4 cột dạng Nullable thành công
- **Liên quan:** Blocker B-09 / Giai đoạn 2.1.
- **Tiền điều kiện:** Chạy trên DB Clone.
- **Dữ liệu kiểm thử:** Migration thêm `MaPhamVi`, `STTTrongNgay`, `SoPhieu`, `MaChuyenKhoa`.
- **Các bước thực hiện:**
  1. Chạy `php artisan migrate --path=database/migrations/..._step1.php`.
- **Kết quả mong đợi:** Schema được cập nhật, 23 bản ghi cũ có 4 trường này mang giá trị NULL, ứng dụng vẫn đọc bình thường.
- **Bằng chứng cần thu thập:** Bảng `luot_kham` có thêm 4 cột nullable.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-MIG-002: Bước 2 Backfill — Cập nhật 5 bản ghi `DAT_LICH` khớp 100% lịch sử
- **Liên quan:** Blocker B-09 / Giai đoạn 2.1.
- **Tiền điều kiện:** 5 bản ghi LK #1, #156, #211, #214, #236.
- **Dữ liệu kiểm thử:** Script backfill theo chuỗi `lich_hen` $\rightarrow$ `ca_kham` $\rightarrow$ `lich_lam_viec`.
- **Các bước thực hiện:**
  1. Chạy script backfill dữ liệu.
- **Kết quả mong đợi:** Cả 5 bản ghi được điền đầy đủ 4 cột, `MaPhamVi` đúng định dạng `SCOPE_DL_{MaBacSi}_{DATE}`, `MaChuyenKhoa` khớp chuyên khoa bác sĩ trực.
- **Bằng chứng cần thu thập:** 5 dòng dữ liệu sau backfill không còn NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-MIG-003: Bước 2 Backfill — Cập nhật 18 bản ghi `TRUC_TIEP` gán cờ Audit
- **Liên quan:** Blocker B-09 / Giai đoạn 2.1.
- **Tiền điều kiện:** 18 bản ghi khám trực tiếp không có `MaLichHen`.
- **Dữ liệu kiểm thử:** Script suy luận từ bác sĩ tiếp nhận thực tế.
- **Các bước thực hiện:**
  1. Chạy script backfill nhóm trực tiếp.
- **Kết quả mong đợi:** 18 bản ghi được cập nhật đầy đủ, bảng `lich_su_dieu_phoi` ghi nhận cờ `INFERRED_FROM_ASSIGNED_DOCTOR`.
- **Bằng chứng cần thu thập:** 18 dòng dữ liệu trong `luot_kham` và log audit tương ứng.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-MIG-004: Bước 3 Migration — Chuyển 4 cột sang `NOT NULL` sau Backfill
- **Liên quan:** Blocker B-09 / Giai đoạn 2.1.
- **Tiền điều kiện:** Toàn bộ 23 bản ghi hiện tại không còn cột nào bị NULL.
- **Dữ liệu kiểm thử:** Câu lệnh ALTER TABLE MODIFY COLUMN ... NOT NULL.
- **Các bước thực hiện:**
  1. Chạy migration bước 3 enforce NOT NULL.
- **Kết quả mong đợi:** Thực thi thành công không có lỗi `Data truncated for column` hoặc `Invalid use of NULL value`.
- **Bằng chứng cần thu thập:** Cột mang thuộc tính `IS_NULLABLE = 'NO'`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-MIG-005: Bước 4 Migration — Khởi tạo Trigger bảo vệ 5 trường trên DB Clone
- **Liên quan:** Blocker B-01, B-09 / Giai đoạn 2.1.
- **Tiền điều kiện:** Bảng đã có cấu trúc NOT NULL.
- **Dữ liệu kiểm thử:** Script tạo trigger `trg_luot_kham_immutable_guard`.
- **Các bước thực hiện:**
  1. Chạy câu lệnh CREATE TRIGGER.
- **Kết quả mong đợi:** Trigger được biên dịch thành công trong MySQL 8.0.26.
- **Bằng chứng cần thu thập:** Trigger xuất hiện trong `SHOW TRIGGERS LIKE 'luot_kham'`.
- **Mức độ nghiêm trọng:** **BLOCKER**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-MIG-006: Thử nghiệm Rollback Migration: Hoàn trả schema sạch sẽ
- **Liên quan:** Giai đoạn 2.1.
- **Tiền điều kiện:** Đã hoàn thành 4 bước migration trên DB Clone.
- **Dữ liệu kiểm thử:** Lệnh `php artisan migrate:rollback`.
- **Các bước thực hiện:**
  1. Chạy rollback từng bước từ bước 4 về bước 1.
- **Kết quả mong đợi:** Trigger được drop sạch sẽ, các cột mới được gỡ bỏ an toàn, 23 bản ghi gốc trở về cấu trúc ban đầu không bị mất mát dữ liệu.
- **Bằng chứng cần thu thập:** Schema sau rollback khớp 100% với schema gốc trước khi test.
- **Mức độ nghiêm trọng:** **CRITICAL**.
- **Phương thức thực thi:** `PHPUnit Automated`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### NHÓM 7: KIỂM THỬ THỦ CÔNG GIAO DIỆN & TRÌNH DUYỆT (BROWSER UI / E2E)

#### TC-UI-001: Lễ tân tiếp nhận lịch hẹn trên giao diện `Receptionist/Queue.tsx`
- **Liên quan:** Nhóm nghiệp vụ 01, 13.
- **Tiền điều kiện:** Trình duyệt đăng nhập tài khoản Lễ tân (`letan@smartcare.vn`).
- **Dữ liệu kiểm thử:** Bệnh nhân Nguyễn Văn B có lịch hẹn hôm nay.
- **Các bước thực hiện:**
  1. Truy cập `/receptionist/queue`.
  2. Bấm nút "Tiếp nhận" tại hàng lịch hẹn của bệnh nhân.
  3. Quan sát thông báo Toast và popup số phiếu.
- **Kết quả mong đợi:** Hiển thị thông báo thành công, số phiếu in ra đúng định dạng `DL-BS...`, lịch chuyển tab "Đã tiếp nhận".
- **Bằng chứng cần thu thập:** Ảnh chụp màn hình giao diện (Screenshot) và Toast message.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-002: Lễ tân tiếp nhận bệnh nhân khám trực tiếp tại quầy
- **Liên quan:** Nhóm nghiệp vụ 02.
- **Tiền điều kiện:** Giao diện tiếp nhận trực tiếp.
- **Dữ liệu kiểm thử:** Chọn bệnh nhân có sẵn hoặc tạo nhanh, chọn Chuyên khoa/Bác sĩ.
- **Các bước thực hiện:**
  1. Nhập thông tin, bấm "Cấp số khám trực tiếp".
- **Kết quả mong đợi:** Sinh số phiếu dạng `TT-CK...`, bệnh nhân xuất hiện trong hàng chờ khám của Bác sĩ được chỉ định.
- **Bằng chứng cần thu thập:** Screenshot phiếu cấp số trên giao diện.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-003: Bác sĩ gọi bệnh nhân vào khám trên giao diện `Doctor/Examine.tsx`
- **Liên quan:** Nhóm nghiệp vụ 06.
- **Tiền điều kiện:** Đăng nhập tài khoản Bác sĩ, có bệnh nhân trong tab "Chờ khám".
- **Dữ liệu kiểm thử:** Bấm "Bắt đầu khám".
- **Các bước thực hiện:**
  1. Bác sĩ bấm nút "Bắt đầu khám".
- **Kết quả mong đợi:** Bệnh nhân chuyển sang trạng thái "Đang khám", bộ đếm thời gian bắt đầu chạy.
- **Bằng chứng cần thu thập:** Screenshot giao diện khám bệnh.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-004: Bác sĩ kê đơn thuốc và kiểm tra hiển thị tồn kho
- **Liên quan:** Nhóm nghiệp vụ 11.
- **Tiền điều kiện:** Đang trong phiên khám bệnh.
- **Dữ liệu kiểm thử:** Chọn thuốc Paracetamol 500mg, số lượng tồn: 100, kê: 20 viên.
- **Các bước thực hiện:**
  1. Thêm thuốc vào đơn, nhập liều dùng, bấm "Lưu đơn thuốc".
- **Kết quả mong đợi:** Đơn thuốc lưu thành công, hiển thị tổng tiền thuốc.
- **Bằng chứng cần thu thập:** Screenshot đơn thuốc đã lưu.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-005: Kỹ thuật viên thao tác trên Dashboard Cận lâm sàng `CanLamSang/Dashboard.tsx`
- **Liên quan:** Nhóm nghiệp vụ 08, 09.
- **Tiền điều kiện:** Đăng nhập tài khoản Nhân viên Cận lâm sàng.
- **Dữ liệu kiểm thử:** Có chỉ định xét nghiệm máu từ phòng khám.
- **Các bước thực hiện:**
  1. Bấm "Tiếp nhận", bấm "Bắt đầu", sau đó bấm "Nhập kết quả".
  2. Điền kết quả định lượng và bấm "Xác nhận kết quả".
- **Kết quả mong đợi:** Chỉ định hoàn thành, hiển thị trạng thái xanh "Đã có kết quả".
- **Bằng chứng cần thu thập:** Screenshot dashboard CLS.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-006: Hiển thị tự động bệnh nhân chờ khám lại trên màn hình Bác sĩ
- **Liên quan:** Nhóm nghiệp vụ 10.
- **Tiền điều kiện:** Bệnh nhân vừa hoàn tất CLS.
- **Dữ liệu kiểm thử:** Màn hình `Doctor/Examine.tsx`.
- **Các bước thực hiện:**
  1. Quan sát tab "Chờ khám lại" của Bác sĩ.
- **Kết quả mong đợi:** Bệnh nhân tự động xuất hiện với huy hiệu ưu tiên (badge màu cam nổi bật), kèm chuông thông báo.
- **Bằng chứng cần thu thập:** Screenshot tab "Chờ khám lại".
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

#### TC-UI-007: Bác sĩ hoàn thành khám và chuyển thanh toán
- **Liên quan:** Nhóm nghiệp vụ 12.
- **Tiền điều kiện:** Đã có chẩn đoán xác định, không còn chỉ định CLS chờ.
- **Dữ liệu kiểm thử:** Bấm "Hoàn tất ca khám".
- **Các bước thực hiện:**
  1. Bác sĩ bấm nút "Hoàn tất ca khám".
- **Kết quả mong đợi:** Ca khám đóng lại, giao diện chuyển trạng thái "Đã hoàn thành", gửi thông báo tới Lễ tân thu ngân.
- **Bằng chứng cần thu thập:** Screenshot ca khám hoàn tất.
- **Mức độ nghiêm trọng:** **MAJOR**.
- **Phương thức thực thi:** `Browser UI / Manual E2E`.
- **Trạng thái hiện tại:** `NOT TESTED`.

---

### TỔNG HỢP VÀ KẾT LUẬN CUỐI CÙNG

1. **Tổng số test cases:** **53 Test Cases**.
2. **Phân bổ theo phương thức:**
   - **Tự động hóa PHPUnit:** **27 Test Cases** (Chiếm 50.9%)
   - **Concurrency 2 tiến trình độc lập:** **16 Test Cases** (Chiếm 30.2%)
   - **Thao tác trình duyệt UI / E2E:** **10 Test Cases** (Chiếm 18.9%)
3. **Phân bổ theo mức độ nghiêm trọng:**
   - **BLOCKER:** **21 Test Cases** (Chặn 100% việc tạo migration nếu chưa test PASS).
   - **CRITICAL:** **22 Test Cases** (Cần thiết cho tính toàn vẹn nghiệp vụ).
   - **MAJOR:** **10 Test Cases** (Trải nghiệm người dùng và quy trình UI).
4. **Các Blocker còn tồn tại:** Toàn bộ B-01 đến B-15 đã hoàn thiện Thiết kế và Đối chiếu Mã nguồn, nhưng đều đang ở trạng thái **`NOT TESTED`**.
5. **Điều kiện tối thiểu chuyển sang DB Clone:** Quản trị viên duyệt Kế hoạch Kiểm thử này và cho phép chạy script tạo Database Clone độc lập.

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]
================================================================================
```
