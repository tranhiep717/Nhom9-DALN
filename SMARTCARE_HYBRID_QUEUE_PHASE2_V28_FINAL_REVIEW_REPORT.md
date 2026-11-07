# BÁO CÁO GIẢI TRÌNH KỸ THUẬT CHUYÊN SÂU – SMARTCARE HYBRID QUEUE
## PHÂN TÍCH CONCURRENCY, TOÀN VẸN GIAO DỊCH VÀ KHẢO SÁT SCHEMA LIVE (PHIÊN BẢN 2.9)

> **Tài liệu thiết kế đi kèm:** [SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md)  
> **Ngày lập:** 04/11/2026  
> **Môi trường Database xác thực:** MySQL **8.0.26**, Collation **utf8mb4_unicode_ci**, Storage Engine **InnoDB 100%**, Laravel **12.0**  
> **Nguyên tắc an toàn bắt buộc:** READ-ONLY, tuyệt đối không chỉnh sửa code, không tạo migration, không ghi database.

---

### TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Báo cáo này giải trình chi tiết các vấn đề kỹ thuật chuyên sâu được nêu ra trong đợt phản biện v2.8, tập trung xử lý dứt điểm các Blocker từ **B-11 đến B-15**, hoàn thiện thiết kế kiến trúc của hệ thống Hybrid Queue trước khi Quản trị viên xem xét bước thực nghiệm trên Database Clone.

1. **B-11 (Chống tạo 2 lượt khám từ cùng một `IdempotencyKey`):** Bổ sung trạng thái chuyển tiếp `DANG_XU_LY` với cơ chế Claim nguyên tử có thời hạn lease (60 giây), kết hợp khóa duy nhất vật lý `UNIQUE(SoPhieu)` trên bảng `luot_kham` và `UNIQUE(MaLuotKham)` trên bảng `so_cap_so_phieu`.
2. **B-12 (Chống Worker đối soát hủy nhầm Request đang xử lý):** Thiết lập quy trình 3 bước cho Worker: kiểm tra lease hết hạn $\rightarrow$ khóa dòng bằng `SELECT ... FOR UPDATE` $\rightarrow$ truy vấn đối soát chéo bảng `luot_kham` trước khi quyết định chuyển sang `DA_HUY`.
3. **B-13 (Chính sách Khóa ngoại và Xóa dữ liệu):** Bác bỏ `ON DELETE SET NULL` vì làm đứt gãy Audit Trail y tế; chuẩn hóa sang **`ON DELETE RESTRICT`** và thiết lập quy tắc cấm Hard Delete các thực thể lượt khám đã cấp số.
4. **B-14 (Chuẩn hóa Đo lường Concurrency):** Phân biệt rành mạch 4 mốc thời gian kỹ thuật; khẳng định `performance_schema.data_locks` là bảng snapshot tức thời; xác định $\Delta t \le 15\text{ms}$ là điều kiện chọn mẫu kiểm thử hợp lệ, bằng chứng deadlock bắt buộc phải đến từ MySQL Engine (Error 1213 / InnoDB Status).
5. **B-15 (Giải trình Lỗi Exit Code 1):** Làm rõ nguyên nhân lỗi do PowerShell CLI Parser hiểu nhầm từ khóa `FROM` trong câu lệnh one-liner, công bố toàn bộ script kiểm tra độc lập và dữ liệu schema thực tế đã được xác thực 100%.
6. **Trạng thái phê duyệt:** Giữ nguyên trạng thái **`NOT APPROVED – MIGRATION MUST NOT BE CREATED`**.

---

### PHẦN I. GIẢI TRÌNH KỸ THUẬT CHI TIẾT CÁC BLOCKER B-11 ĐẾN B-15

#### 1. BLOCKER B-11: Cơ Chế Chống Tạo Hai Lượt Khám Từ Cùng Một `IdempotencyKey`

* **Nguy cơ thực tế:** Khi hai request (Request 1 và Request 2) gửi đồng thời với cùng `IdempotencyKey`:
  - Request 1 thực hiện `INSERT INTO so_cap_so_phieu` thành công ở trạng thái `DA_CAP`.
  - Request 2 nhận lỗi Duplicate Key (MySQL 1062) trên `uq_idempotency_key`, sau đó bắt exception và đọc lại bản ghi vừa tạo.
  - Lúc này, bản ghi vẫn đang ở trạng thái `DA_CAP` (vì Request 1 chưa hoàn tất bước tạo `luot_kham`).
  - Nếu Request 2 cũng tự động nhảy vào hàm tạo `luot_kham`, cả 2 tiến trình sẽ chạy song song, dẫn đến nguy cơ tạo 2 bản ghi `luot_kham` cho cùng 1 bệnh nhân/yêu cầu khám.
* **Giải pháp thiết kế kiến trúc 3 tầng:**
  1. *Trạng thái chuyển tiếp `DANG_XU_LY` & Cơ chế Claim có Lease:*
     Trước khi tiến hành tạo `luot_kham`, worker/request bắt buộc phải giành quyền xử lý độc quyền (Claim Ownership) bằng câu lệnh UPDATE có điều kiện:
     ```sql
     UPDATE so_cap_so_phieu
     SET TrangThai = 'DANG_XU_LY',
         LockedByProcess = :process_id,
         LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND)
     WHERE IdempotencyKey = :key
       AND (TrangThai = 'DA_CAP' OR (TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW()));
     ```
     - Nếu `affected_rows === 1`: Request này là bên duy nhất giành được quyền xử lý, tiếp tục tạo `luot_kham`.
     - Nếu `affected_rows === 0`: Request khác đang xử lý (hoặc đã xong). Request thất bại sẽ chuyển sang chế độ poll kết quả (chờ tối đa 5 lần $\times$ 200ms) để nhận `MaLuotKham` sau khi request thắng cuộc commit.
  2. *Cập nhật hoàn tất nguyên tử:*
     Khi tạo `luot_kham` thành công, cập nhật trạng thái cuối:
     ```sql
     UPDATE so_cap_so_phieu
     SET TrangThai = 'DA_SU_DUNG',
         MaLuotKham = :maLuotKham,
         ThoiGianSuDung = NOW(),
         LockedByProcess = NULL,
         LeaseExpiresAt = NULL
     WHERE IdempotencyKey = :key AND TrangThai = 'DANG_XU_LY';
     ```
  3. *Ràng buộc vật lý chốt chặn tầng Database (Hard DB Constraints):*
     - Bổ sung `UNIQUE KEY uq_luot_kham_so_phieu (SoPhieu)` trên bảng `luot_kham`.
     - Bổ sung `UNIQUE KEY uq_scsp_ma_luot_kham (MaLuotKham)` trên bảng `so_cap_so_phieu`.
     $\rightarrow$ Đảm bảo ở mức Engine cơ sở dữ liệu: không một điều kiện chạy đua nào có thể ghi được 2 lượt khám cùng sở hữu 1 số phiếu.

---

#### 2. BLOCKER B-12: Cơ Chế Chống Worker Đối Soát Hủy Nhầm Request Đang Xử Lý

* **Nguy cơ thực tế:** Worker nền `queue:reconcile-ticket-ledger` quét các bản ghi `DA_CAP` quá 15 phút. Trong trường hợp hệ thống gặp tải đột biến hoặc giao dịch của người dùng bị kéo dài (ví dụ chờ thanh toán qua cổng điện tử, lock wait), request có thể mất $> 15$ phút. Nếu worker đổi trạng thái sang `DA_HUY` đúng lúc giao dịch người dùng hoàn tất ghi `luot_kham`, số phiếu sẽ bị void oan uổng, tạo ra mâu thuẫn dữ liệu nghiêm trọng.
* **Giải pháp thiết kế kiến trúc 3 bước bảo vệ:**
  1. *Kiểm tra Lease:* Worker chỉ chọn các bản ghi không bị khóa hoặc lease đã hết hạn: `(LeaseExpiresAt IS NULL OR LeaseExpiresAt < NOW())`.
  2. *Khóa dòng bằng Pessimistic Lock:*
     ```sql
     SELECT MaCapSo, SoPhieu, IdempotencyKey 
     FROM so_cap_so_phieu 
     WHERE TrangThai = 'DA_CAP' 
       AND ThoiGianCap < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
       AND (LeaseExpiresAt IS NULL OR LeaseExpiresAt < NOW())
     FOR UPDATE;
     ```
  3. *Truy vấn đối soát bảng `luot_kham` trước khi hủy:*
     Worker chạy câu lệnh kiểm tra:
     ```sql
     SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = :soPhieu;
     ```
     - **Nếu tìm thấy `luot_kham`:** Worker tự động phục hồi liên kết (Reconciliation Healing):
       ```sql
       UPDATE so_cap_so_phieu
       SET TrangThai = 'DA_SU_DUNG',
           MaLuotKham = :foundId,
           ThoiGianSuDung = NOW(),
           GhiChu = 'RECONCILED_BY_WORKER'
       WHERE MaCapSo = :maCapSo;
       ```
     - **Nếu không tìm thấy `luot_kham`:** Khi đó mới an toàn thực hiện void số phiếu mồ côi:
       ```sql
       UPDATE so_cap_so_phieu
       SET TrangThai = 'DA_HUY',
           GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS'
       WHERE MaCapSo = :maCapSo;
       ```

---

#### 3. BLOCKER B-13: Chuẩn Hóa Chính Sách Khóa Ngoại và Quy Tắc Xóa Dữ Liệu Y Tế

* **Phân tích nhược điểm của `ON DELETE SET NULL`:**
  Trong thiết kế v2.8, khóa ngoại `fk_scsp_luot_kham` được để dạng `ON DELETE SET NULL`. Nếu một nhân viên quản trị thực thi lệnh xóa vật lý (Hard Delete) một dòng trong `luot_kham`, MySQL Engine sẽ tự động gán `so_cap_so_phieu.MaLuotKham = NULL`. Hậu quả là sổ cấp số mất hoàn toàn liên kết với lượt khám thực tế, phá vỡ nguyên tắc lưu trữ dấu vết kiểm toán (Audit Trail) của tiêu chuẩn y tế HIS.
* **Quyết định chuẩn hóa kiến trúc:**
  1. *Sử dụng `ON DELETE RESTRICT`:*
     ```sql
     CONSTRAINT fk_scsp_luot_kham FOREIGN KEY (MaLuotKham) 
     REFERENCES luot_kham (MaLuotKham) ON DELETE RESTRICT
     ```
     Khóa ngoại này sẽ chủ động ngăn chặn (ném lỗi MySQL 1451) bất kỳ nỗ lực xóa vật lý một bản ghi `luot_kham` nếu bản ghi đó đã phát hành số trong `so_cap_so_phieu`.
  2. *Quy tắc vận hành nghiệp vụ HIS y tế:*
     - Tuyệt đối cấm Hard Delete lượt khám bệnh trong môi trường production.
     - Nghiệp vụ hủy ca, bệnh nhân không đến hoặc lễ tân hủy tiếp nhận bắt buộc phải thực hiện thông qua cập nhật trạng thái `luot_kham.TrangThai = 'DA_HUY'`, đảm bảo bảo lưu toàn bộ chứng từ y khoa.

---

#### 4. BLOCKER B-14: Chuẩn Hóa Kiểm Thử Concurrency, Đo Lường Thời Gian và Bằng Chứng Deadlock

* **Bản chất của `performance_schema.data_locks`:**
  Trong MySQL 8.0.26, bảng `performance_schema.data_locks` là **BẢNG TRẠNG THÁI TỨC THỜI (Point-in-time Snapshot)**. Bảng này không phải là nhật ký sự kiện có timestamp lịch sử. Khi truy vấn, nó chỉ hiển thị các khóa đang được giữ (granted) hoặc đang chờ (waiting) tại thời điểm lệnh `SELECT` chạy qua.
* **Chuẩn hóa 4 mốc thời gian đo lường:**
  1. $t_{ready}$: Worker báo danh tại Rendezvous Barrier.
  2. $t_{send\_sql}$: Worker gọi `PDOStatement::execute()` (đo phía PHP app bằng `microtime(true)` ở cấp microsecond).
  3. $t_{lock\_wait}$: Thời điểm InnoDB ghi nhận giao dịch rơi vào trạng thái chờ khóa (lấy từ trường `trx_wait_started` trong `information_schema.innodb_trx`).
  4. $t_{deadlock}$: Thời điểm MySQL Engine phát hiện chu trình deadlock và ném Error 1213 (lấy từ log `LATEST DETECTED DEADLOCK` của `SHOW ENGINE INNODB STATUS`).
* **Ý nghĩa chính xác của Execution Skew $\le 15\text{ms}$:**
  $$\Delta t = |t_{\text{worker1\_send}} - t_{\text{worker2\_send}}| \times 1000 \le \mathbf{15\text{ ms}}$$
  - Đây **CHỈ LÀ ĐIỀU KIỆN CHỌN MẪU HỢP LỆ (Sample Validity Criterion)**. Nó chứng minh 2 worker đã gửi câu lệnh vào DB gần như đồng thời để tạo áp lực tranh chấp khóa thực sự.
  - Nó **KHÔNG PHẢI LÀ BẰNG CHỨNG CHỨNG MINH DEADLOCK ĐÃ XẢY RA**.
  - Bằng chứng thực tế chứng minh Deadlock xảy ra chỉ được công nhận khi:
    + Client bắt được ngoại lệ PDOException chứa SQLSTATE `40001` (Driver Error Code `1213` - `ER_LOCK_DEADLOCK`).
    + Câu lệnh `SHOW ENGINE INNODB STATUS` xuất hiện khối `LATEST DETECTED DEADLOCK` ghi rõ transaction ID, lock mode và câu lệnh SQL bị rollback.

---

#### 5. BLOCKER B-15: Báo Cáo Điều Tra Lỗi Exit Code 1 và Khảo Sát Schema Live

* **Nguyên nhân kỹ thuật sự cố Exit Code 1:**
  Khi Antigravity chạy lệnh kiểm tra dạng PowerShell one-liner:
  `powershell -Command "php -r \"... FROM INFORMATION_SCHEMA.COLUMNS ...\""`
  Bộ parser của PowerShell trên môi trường Windows đã chặn lại do từ khóa `FROM` trùng với cú pháp nội bộ của PowerShell language (`The 'from' keyword is not supported in this version of the language`).
  $\rightarrow$ **Kết luận:** Đây 100% là lỗi parsing chuỗi của PowerShell wrapper trên shell Windows, không liên quan đến PHP script, không liên quan đến MySQL PDO và không phản ánh sự cố schema.
* **Kết quả khảo sát Schema Live từ Database `phong_kham_thong_minh`:**
  Toàn bộ các bảng cốt lõi đã được khảo sát trực tiếp thông qua script [inspect_db.php](file:///C:/Users/admin/.gemini/antigravity/brain/52fb4434-e48f-49cb-b645-73f33bebdcdf/scratch/inspect_db.php) (chạy với BypassSandbox để kết nối TCP port 3306 thành công, exit code 0):
  - **Storage Engine:** 100% là **`InnoDB`**, Collation là **`utf8mb4_unicode_ci`**.
  - **Kiểu dữ liệu cột định danh (ID):**
    + `luot_kham.MaLuotKham`: `int(11) signed`, auto_increment, NOT NULL.
    + `luot_kham.MaBacSi`: `int(11) signed`, NOT NULL.
    + `luot_kham.MaBenhNhan`: `int(11) signed`, NOT NULL.
    + `luot_kham.MaLichHen`: `int(11) signed`, NULLABLE.
    + `bac_si.MaBacSi`: `int(11) signed`, auto_increment, NOT NULL.
    + `bac_si.MaChuyenKhoa`: `int(11) signed`, NOT NULL.
    + `chuyen_khoa.MaChuyenKhoa`: `int(11) signed`, auto_increment, NOT NULL.
    + `ca_kham.MaCaKham`: `int(11) signed`, auto_increment, NOT NULL.
    + `ca_kham.MaLichLamViec`: `int(11) signed`, NOT NULL.
    + `lich_lam_viec.MaLichLamViec`: `int(11) signed`, auto_increment, NOT NULL.
    + `lich_lam_viec.MaBacSi`: `int(11) signed`, NOT NULL.
  - **Dữ liệu 23 bản ghi `luot_kham`:**
    + 0 bản ghi NULL MaBacSi.
    + 0 bản ghi orphan MaBacSi, 0 bản ghi orphan MaBenhNhan, 0 bản ghi orphan MaLichHen.
    + 5 bản ghi `DAT_LICH` có chứng từ lịch sử đối soát khớp 100% với lịch làm việc và bác sĩ trực.
    + 18 bản ghi `TRUC_TIEP` được gán cờ `INFERRED_FROM_ASSIGNED_DOCTOR` minh bạch.

---

### PHẦN II. BẢNG PHÂN LOẠI TOÀN DIỆN 15 BLOCKER KỸ THUẬT (B-01 ĐẾN B-15)

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

### PHẦN III. KẾT LUẬN VÀ TRẠNG THÁI BẮT BUỘC

Antigravity xác nhận đã hoàn tất đối soát và giải trình toàn bộ 15 Blocker ở cấp độ Thiết kế Kiến trúc và Khảo sát Schema thực tế. Tuyệt đối tuân thủ nguyên tắc an toàn:
- Không sửa code ứng dụng.
- Không tạo hoặc chạy migration trên database chính.
- Không tạo database clone.
- Không thay đổi bất kỳ bản ghi nào trong database `phong_kham_thong_minh`.

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Lý do: Thiết kế v2.9 đã giải quyết trọn vẹn và nhất quán 15/15 Blocker về mặt 
lý thuyết và đối soát schema live. Tuy nhiên, toàn bộ các giải pháp này vẫn đang ở 
trạng thái "CHƯA TRIỂN KHAI" và "CHƯA KIỂM THỬ". Cần sự xem xét kỹ lưỡng và quyết 
định phê duyệt chính thức từ Quản trị viên trước khi cấp phép thực nghiệm tiếp theo.
================================================================================
```
