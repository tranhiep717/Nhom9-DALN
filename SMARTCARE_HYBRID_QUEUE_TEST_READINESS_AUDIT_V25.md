# SMARTCARE HYBRID QUEUE – TEST READINESS AUDIT V2.5
## BÁO CÁO KIỂM ĐỊNH TOÀN DIỆN TÍNH NHẤT QUÁN THIẾT KẾ: CLAIM LOGIC, LEASE RECOVERY, DEADLOCK GRAPH & GAP LOCK (B-37 ĐẾN B-42)

> **Tài liệu tham chiếu:**  
> - [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V24.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V24.md)  
> - [SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V24.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V24.md)  
> **Phiên bản:** 2.5 (Design Consistency & Architectural Refutation Audit)  
> **Ngày lập:** 04/11/2026  
> **Môi trường Database xác thực:** MySQL **8.0.26**, Storage Engine **InnoDB 100%**, Default Isolation **REPEATABLE-READ**, Laravel **12.0**  
> **Quy tắc an toàn bất biến:** READ-ONLY tuyệt đối. KHÔNG sửa code ứng dụng, KHÔNG tạo/sửa migration, KHÔNG chạy SQL ghi dữ liệu, KHÔNG tạo database clone, KHÔNG thay đổi database chính `phong_kham_thong_minh`.

---

### HỆ THỐNG PHÂN LOẠI TRẠNG THÁI MINH BẠCH (4 CẤP ĐỘ)

Mọi phân tích và kết luận trong tài liệu này bắt buộc gắn nhãn kiểm định minh bạch:
1. **`CODE VERIFIED`**: Đã đọc và đối soát trực tiếp từng file, class, method và dòng code trong mã nguồn hiện hữu.
2. **`SCHEMA VERIFIED`**: Đã truy vấn đối chiếu trực tiếp `INFORMATION_SCHEMA` trên live database `phong_kham_thong_minh`.
3. **`THEORETICAL`**: Suy luận kỹ thuật dựa trên nguyên lý hoạt động của MySQL 8.0 InnoDB Engine (MVCC, Lock Manager, Two-Phase Locking).
4. **`NOT VERIFIED`**: Chưa được kiểm chứng bằng thực nghiệm chạy thực tế trên môi trường độc lập.

Tuyệt đối KHÔNG sử dụng các từ "chắc chắn", "100% an toàn", "không thể deadlock" khi chưa có bằng chứng thực nghiệm thực tế.

---

### TÓM TẮT ĐIỀU HÀNH: ĐỐI CHIẾU THAY ĐỔI V2.5 SO VỚI V2.4

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| HẠNG MỤC PHÂN TÍCH | KẾT LUẬN V2.4 (CẦN PHẢN BIỆN / HOÀN THIỆN)         | KẾT LUẬN V2.5 (XÁC THỰC KỸ THUẬT & ĐÍNH CHÍNH)                  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-37: Claim &      | Dùng UPDATE FenceToken=LAST_INSERT_ID(Token+1)      | PHÁT HIỆN LỖ HỔNG: Nếu affected_rows = 0, LAST_INSERT_ID KHÔNG  |
| LAST_INSERT_ID     | rồi SELECT LAST_INSERT_ID().                        | được cập nhật và trả về giá trị rác của câu lệnh trước! Bắt buộc |
|                    |                                                     | kiểm tra affected_rows === 1 trước khi đọc token.               |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-38: Lease &      | Giả định Grace Period 5 phút đủ để tiến trình       | BÁC BỎ GIẢ ĐỊNH: Tiến trình PHP có thể bị treo swap, I/O hang   |
| Worker Recovery    | cũ kết thúc an toàn.                                | kéo dài > 5 phút. Phân biệt rõ Lease Expiration với Process     |
|                    |                                                     | Termination. Worker và Reclaim dùng conditional UPDATE nguyên tử|
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-39: Deadlock     | Tuyên bố có 2 chu trình Deadlock thực tế:           | ĐÍNH CHÍNH:                                                     |
| Proof vs Order     | 1) completeExamine vs store (LK <-> LH).            | 1) LK <-> LH: POTENTIAL DEADLOCK - NOT EXPERIMENTALLY VERIFIED   |
|                    | 2) savePhieuKham vs CDDV.store (PK->CDDV->LK).      |    (Chỉ xảy ra khi tiếp nhận lại lịch hẹn cũ đã có lượt khám).   |
|                    |                                                     | 2) BÁC BỎ DEADLOCK savePhieuKham: Hàm này chạy autocommit từng  |
|                    |                                                     |    câu lệnh riêng lẻ, không giữ lock chéo (No Hold-and-Wait)!   |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-40: Gap Lock &   | Cho rằng Grace Period 5 phút loại trừ 100% rủi ro  | BÁC BỎ 100%: Grace Period chỉ giảm xác suất (probabilistic).    |
| Grace Period       | Gap Lock Deadlock khi Worker chạy FOR SHARE.        | Nếu Tx kéo dài > 5m, Worker giữ Gap S-lock chặn Insert Intention|
|                    |                                                     | X-lock, vẫn gây Deadlock Error 1213! Cần thực nghiệm DB Clone.  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-41: Live Schema  | Mô tả các ràng buộc Unique như thể đã có trên live  | TÁCH BIỆT RÕ RÀNG: Live DB CHƯA HỀ CÓ SoPhieu, IdempotencyKey,  |
| vs Target Schema   | database để suy luận lỗi 1062.                      | so_cap_so_phieu (SCHEMA VERIFIED). Phân tích riêng timeline lỗi |
|                    |                                                     | 1062 khi có và không có Unique Index.                           |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-42: Test Case    | Lập bảng 56 test cốt lõi nhưng lệnh kiểm tra gặp lỗi| SỬA LỖI SCRIPT: Đã kiểm đếm thành công 100% bằng script Python  |
| Matrix Integrity   | syntax console PowerShell.                          | chuẩn (exit code 0): ĐÚNG 56 test cốt lõi, 11 test phụ lục,     |
|                    |                                                     | không trùng mã, không thiếu số, bảo toàn 100% test V2.3.        |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

---

### PHẦN I. BLOCKER B-37: KIỂM ĐỊNH CLAIM TRANSACTION VÀ HÀM LAST_INSERT_ID()

#### 1. Phân Tích Chuyên Sâu 6 Câu Hỏi Kỹ Thuật

##### Câu hỏi 1: Khi `UPDATE` có `affected_rows = 0` thì xử lý thế nào?
- **Bản chất MySQL:** Hàm `LAST_INSERT_ID(expr)` chỉ được MySQL Engine đánh giá và ghi nhận giá trị mới khi có **ít nhất một dòng dữ liệu thỏa mãn điều kiện `WHERE` và được cập nhật**.
- Nếu câu lệnh `UPDATE` không tìm thấy bản ghi nào thỏa mãn (`affected_rows === 0`), MySQL Engine **HOÀN TOÀN BỎ QUA** việc đánh giá biểu thức trong hàm `LAST_INSERT_ID(expr)`.
- **Cạm bẫy:** Khi `affected_rows === 0`, nếu ứng dụng vẫn tiếp tục gọi `SELECT LAST_INSERT_ID()`, MySQL sẽ trả về **giá trị của lần gọi `LAST_INSERT_ID` thành công gần nhất trên session connection đó** (hoặc trả về 0 nếu chưa từng gọi). Nếu ứng dụng lấy giá trị rác này làm `assignedToken`, toàn bộ cơ chế Fencing Token sẽ bị phá vỡ!
- **Quy tắc bắt buộc:** Ứng dụng **BẮT BUỘC** phải kiểm tra `affected_rows === 1` ngay lập tức. Nếu `affected_rows === 0`, phải dừng lại ngay, kích hoạt ROLLBACK và tuyệt đối không được đọc `LAST_INSERT_ID()`.

##### Câu hỏi 2: `LAST_INSERT_ID` có thể còn giá trị từ câu lệnh trước trong cùng Session không?
- **CÓ (`THEORETICAL` / `CODE VERIFIED`).**
- Trong giao thức MySQL Client-Server, biến `last_insert_id` là một trạng thái gắn liền với **MySQL Connection Session**.
- Nếu trong cùng connection đó, trước đó đã có một câu lệnh `INSERT` vào bảng khác (ví dụ: tạo bản ghi `lich_hen` có auto-increment ID = 150), thì giá trị nội tại của session là `150`.
- Nếu câu lệnh Claim UPDATE thất bại (`affected_rows = 0`), việc chạy `SELECT LAST_INSERT_ID()` sẽ trả về giá trị cũ `150`. Đây là bằng chứng không thể chối cãi rằng không bao giờ được tin cậy `LAST_INSERT_ID()` khi chưa xác nhận `affected_rows > 0`.

##### Câu hỏi 3: `UPDATE` và `SELECT` có chắc chắn dùng cùng một PDO connection không?
- **Trong Laravel:** Khi chạy bên trong khối closure `DB::transaction(...)`, Laravel gán cứng toàn bộ các query bên trong vào cùng một PDO connection (Master Connection).
- **Tuy nhiên, rủi ro tiềm ẩn:** Nếu ứng dụng cấu hình Read/Write Splitting (tách DB đọc và DB ghi), và lập trình viên vô tình gọi `DB::table(...)->selectRaw('LAST_INSERT_ID()')` ở một scope không được bọc transaction, query SELECT sẽ bị định tuyến sang Replica (Slave). Tại Replica, `LAST_INSERT_ID()` sẽ trả về `0` vì câu lệnh UPDATE chỉ chạy trên Master!
- **Giải pháp:** Phải thực thi SELECT trên cùng PDO instance: `$pdo->lastInsertId()` hoặc gọi `SELECT LAST_INSERT_ID()` bên trong cùng transaction context trên Master.

##### Câu hỏi 4: Request B reclaim sau khi A commit thì A có thể đọc nhầm token không?
- Trong V2.4, nếu A chạy `SELECT` **sau khi đã COMMIT Tx1**:
  - Khi Tx1 của A commit, X-lock trên dòng ledger được giải phóng.
  - Ngay tại microsecond đó, Request B có thể nhảy vào chạy Claim Tx1 của B, nâng `FenceToken` từ 1 lên 2 và commit.
  - Sau đó Request A mới chạy SELECT $ightarrow$ A sẽ đọc được giá trị `2` của B!
- **Giải pháp triệt để:** A phải đọc token **KHI ĐANG NẰM TRONG TX1 TRƯỚC KHI COMMIT**. Vì A đang nắm giữ Exclusive Row Lock (X-lock) từ câu UPDATE, Request B bắt buộc bị Lock Wait. Do đó, token A đọc được bên trong Tx1 đảm bảo tính cô lập tuyệt đối (Isolation).

##### Câu hỏi 5: Claim từ `DA_CAP` và Reclaim từ `DANG_XU_LY` có được xử lý nhất quán không?
- Trong thiết kế cũ, nếu tách làm 2 query riêng biệt sẽ tạo ra kẽ hở phân nhánh logic.
- **Giải pháp V2.5:** Hợp nhất thành **MỘT CÂU LỆNH CONDITIONAL UPDATE DUY NHẤT** xử lý nguyên tử cả 2 trường hợp:
  ```sql
  UPDATE so_cap_so_phieu 
  SET TrangThai = 'DANG_XU_LY', 
      LockedByProcess = :processId, 
      LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND),
      FenceToken = LAST_INSERT_ID(FenceToken + 1)
  WHERE IdempotencyKey = :idempotencyKey 
    AND (
        TrangThai = 'DA_CAP' 
        OR (TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW())
    );
  ```
  - Nếu là ca mới tinh: `TrangThai = 'DA_CAP'` thỏa mãn $ightarrow$ Claim thành công.
  - Nếu là ca bị treo quá hạn lease: `TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW()` thỏa mãn $ightarrow$ Reclaim thành công, token tự động tăng.
  - Nếu ca đang có tiến trình khác xử lý hợp lệ trong hạn lease: Cả 2 nhánh đều FALSE $ightarrow$ `affected_rows = 0` $ightarrow$ Bị chặn đứng ngay lập tức!

##### Câu hỏi 6: Nếu Claim gặp Deadlock 1213 hoặc Lock Wait Timeout 1205 thì xử lý Retry thế nào?
- Khi 2 tiến trình cùng tranh chấp X-lock trên bản ghi ledger, một tiến trình có thể gặp lỗi `SQLSTATE[40001]: Serialization failure: 1213 Deadlock found` hoặc `SQLSTATE[HY000]: General error: 1205 Lock wait timeout exceeded`.
- **Chiến lược Retry chuẩn:** Bắt các mã lỗi này, thực hiện rollback Tx1, áp dụng **Exponential Backoff kết hợp Full Jitter**:
  $$	ext{SleepTime} = 	ext{random}(10	ext{ms}, 30	ext{ms}) 	imes 2^{	ext{attempt}}$$
  Giới hạn tối đa 3 lần thử lại trước khi trả về HTTP 409/503.

---

#### 2. Pseudocode Hoàn Chỉnh Cho Claim Transaction (Phương Án B - V2.5)

```php
/**
 * THỰC HIỆN CLAIM TRANSACTION ĐỘC LẬP (TX1) - PHIÊN BẢN CHUẨN HÓA V2.5
 * Quyền hạn: Độc lập hoàn toàn, bọc trong Try-Catch xử lý Deadlock 1213/1205
 */
function claimTicketLedger(string $idempotencyKey, string $processId, int $maxRetries = 3): ?int 
{
    $attempt = 0;
    while ($attempt < $maxRetries) {
        $attempt++;
        try {
            return DB::transaction(function () use ($idempotencyKey, $processId) {
                // 1. Câu lệnh Atomic Conditional UPDATE thống nhất (Cả ca mới lẫn reclaim hết hạn)
                $affected = DB::update("
                    UPDATE so_cap_so_phieu 
                    SET TrangThai = 'DANG_XU_LY',
                        LockedByProcess = :processId,
                        LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND),
                        FenceToken = LAST_INSERT_ID(FenceToken + 1)
                    WHERE IdempotencyKey = :idempotencyKey 
                      AND (
                          TrangThai = 'DA_CAP' 
                          OR (TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW())
                      )
                ", [
                    'processId' => $processId,
                    'idempotencyKey' => $idempotencyKey,
                ]);

                // 2. Chốt kiểm tra sinh tử: affected_rows bắt buộc phải là 1
                if ($affected !== 1) {
                    // Không có bản ghi nào được cập nhật -> Thất bại trong tranh chấp Claim
                    // Kích hoạt rollback ngầm định bằng cách return null
                    return null;
                }

                // 3. Đọc FenceToken ngay lập tức KHI ĐANG TRONG TRANSACTION trên cùng PDO connection
                $tokenRow = DB::selectOne("SELECT LAST_INSERT_ID() AS assignedToken");
                $assignedToken = (int) ($tokenRow->assignedToken ?? 0);

                if ($assignedToken <= 0) {
                    throw new RuntimeException("CRITICAL: Failed to retrieve valid FenceToken after atomic claim update.");
                }

                // 4. Tx1 commit tại đây, giải phóng X-lock. $assignedToken được bảo toàn trong biến PHP
                return $assignedToken;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $errorCode = $e->errorInfo[1] ?? 0;
            // Xử lý Deadlock 1213 hoặc Lock Wait Timeout 1205
            if (in_array($errorCode, [1213, 1205]) && $attempt < $maxRetries) {
                $jitterMs = random_int(10, 30) * (2 ** ($attempt - 1));
                usleep($jitterMs * 1000);
                continue; // Thử lại
            }
            throw $e; // Lỗi khác hoặc hết lượt retry -> ném ngoại lệ
        }
    }
    return null;
}
```

---

### PHẦN II. BLOCKER B-38: PHẢN BIỆN GIẢ ĐỊNH THỜI GIAN & WORKER RECOVERY TIMELINE

#### 1. Phản Biện Giả Định "Grace Period 5 Phút Đảm Bảo Request Cũ Đã Kết Thúc"
- **Thực tế vận hành:** Trong môi trường ảo hóa đám mây (Cloud / Container), một tiến trình PHP Worker có thể bị:
  1. **Stop-The-World Pause:** Dọn rác bộ nhớ hoặc Swap Thrashing trên máy chủ quá tải.
  2. **I/O Hang:** Bị treo khi kết nối hệ thống file lưu trữ mạng (NFS/EFS) hoặc socket logging.
  3. **Zombie Worker:** Tiến trình bị treo vô thời hạn vượt quá 5 phút.
- **Khẳng định nguyên lý kiến trúc:**
  - **Lease Expiration** chỉ là *điều kiện cần* để hệ thống cho phép reclaim/void.
  - **Process Termination** là sự kiện vật lý của hệ điều hành, cơ sở dữ liệu KHÔNG THỂ giả định tiến trình đã chết.
  - **Fencing Token** là *chốt chặn duy nhất và tuyệt đối* loại trừ tiến trình cũ bất kể nó còn sống hay đã chết.

---

#### 2. Timeline Toàn Diện Về Cạnh Tranh Giữa Request Treo, Worker Và Request Reclaim

```mermaid
sequenceDiagram
    autonumber
    participant A as Tiến trình A (Chậm / Treo)
    participant DB as MySQL InnoDB (Ledger & LuotKham)
    participant W as Worker Đối Soát (5 Phút)
    participant B as Tiến trình B (Reclaim)

    Note over A, DB: T0: A claim thành công Token 1
    A->>DB: Tx1_A: UPDATE ... FenceToken = 1 (COMMIT)
    
    Note over A, DB: T1: A mở Tx2_A, INSERT luot_kham nhưng CHƯA COMMIT
    A->>DB: Tx2_A: BEGIN; INSERT INTO luot_kham ...
    Note over A: A bị đóng băng bộ nhớ (Freeze 6 phút)!
    
    Note over DB: T2 (T0 + 60s): Lease 60s hết hạn
    Note over DB: T3 (T0 + 5m): Grace Period 5 phút hết hạn
    
    Note over W, DB: T4: Worker chạy đối soát
    W->>DB: SELECT MaLuotKham FROM luot_kham WHERE SoPhieu=:sp FOR SHARE
    Note over W, DB: WORKER BỊ BLOCK (Lock Wait trên X-Lock của A)!
    
    Note over B, DB: T5: B gửi request tới và Reclaim
    B->>DB: Tx1_B: UPDATE so_cap_so_phieu SET FenceToken=2 WHERE ...
    DB-->>B: affected_rows = 1 (B nhận Token = 2)
    B->>DB: Tx1_B: COMMIT;
    
    Note over A: T6: A tỉnh dậy sau 6 phút, cố hoàn tất Tx2_A
    A->>DB: Tx2_A: UPDATE so_cap_so_phieu SET TrangThai='DA_SU_DUNG' WHERE FenceToken=1
    DB-->>A: affected_rows = 0 (Do token hiện tại đã là 2)!
    Note over A: A PHÁT HIỆN BỊ MẤT QUYỀN -> ROLLBACK Tx2_A!
    A->>DB: Tx2_A: ROLLBACK; (Giải phóng X-Lock luot_kham)
    
    Note over W, DB: T7: Worker hết bị block, đọc được kết quả sau Rollback
    DB-->>W: Record không tồn tại (Vì A đã rollback)!
    W->>DB: UPDATE so_cap_so_phieu SET TrangThai='DA_HUY' WHERE FenceToken=:readToken
    Note over W: Worker conditional update thất bại vì B đã đổi Token=2!
```

#### 3. Trả Lời Chi Tiết Các Câu Hỏi Kiểm Định

| Câu hỏi kiểm định | Câu trả lời chính xác | Bằng chứng kỹ thuật InnoDB |
| :--- | :---: | :--- |
| **Worker có bị Lock Wait không?** | **CÓ** | Nếu A đã thực hiện INSERT/UPDATE trên `luot_kham` trong Tx2 mà chưa commit, câu lệnh `SELECT ... FOR SHARE` của Worker sẽ bị **LOCK WAIT** xin Shared Lock chờ X-lock của A giải phóng. |
| **B có bị Lock Wait không?** | **KHÔNG** *(trên `luot_kham`)* | B chỉ thao tác Claim trên bảng `so_cap_so_phieu`. B không đụng chạm tới dòng `luot_kham` của A cho đến khi B bắt đầu mở Tx2 riêng của B. |
| **A có thể commit dữ liệu nghiệp vụ không?** | **KHÔNG** | Chốt chặn cuối cùng trong Tx2 của A bắt buộc kiểm tra `affected_rows` của câu lệnh UPDATE sổ cấp số với điều kiện `FenceToken = 1`. Do B đã nâng token lên 2, câu lệnh trả về `0`, buộc A phải `DB::rollBack()`. |
| **A có thể tạo thông báo hoặc side-effect không?** | **CÓ THỂ NẾU VIẾT SAI VỊ TRÍ** | Nếu A gọi `NotificationService` hoặc bắn socket **TRƯỚC KHI** câu lệnh Fencing Token trả về kết quả, side effect sẽ bị lọt ra ngoài! Bắt buộc: **Side-effect chỉ được phát sau khi Fencing Token UPDATE thành công và Tx2 đã commit**. |
| **Worker và B có thể cùng thắng không?** | **TUYỆT ĐỐI KHÔNG** | Cả Worker và B đều thực hiện câu lệnh UPDATE có điều kiện dựa trên `FenceToken` đã đọc. Nếu B đã nâng token lên 2, câu lệnh UPDATE của Worker với token cũ sẽ nhận `affected_rows = 0` và tự hủy bỏ. |

---

### PHẦN III. BLOCKER B-39: CHỨNG MINH DEADLOCK TỪ MÃ NGUỒN — BÁC BỎ SUY DIỄN THỨ TỰ

#### 1. Rà Soát Cặp 1: `completeExamine` vs `store` (Lịch Hẹn vs Lượt Khám)

##### Khảo sát mã nguồn thực tế:
- `LuotKhamController@store` ([LuotKhamController.php L244-298](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L244-L298)):
  1. L250: `$lichHen = LichHen::with(...)->lockForUpdate()->find($maLichHen);`  
     $ightarrow$ Câu lệnh: `SELECT * FROM lich_hen WHERE MaLichHen = :id FOR UPDATE;`  
     $ightarrow$ Khóa: **Exclusive Record Lock (X-lock) trên Clustered Index PK của bảng `lich_hen`**.
  2. L258: `$existingVisit = LuotKham::where('MaLichHen', $maLichHen)->lockForUpdate()->first();`  
     $ightarrow$ Câu lệnh: `SELECT * FROM luot_kham WHERE MaLichHen = :id FOR UPDATE;`  
     $ightarrow$ Khóa: **Xin X-lock trên dòng `luot_kham`**.
  3. L281: `$lichHen->update(['TrangThai' => 'DA_TIEP_NHAN']);`  
  4. L291: `LuotKham::create([...]);` (Commit).

- `LuotKhamController@completeExamine` ([LuotKhamController.php L497-552](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L497-L552)):
  1. L500: `$visit = LuotKham::with('lichHen')->find($id);` (Consistent Read ngoài transaction, không khóa).
  2. L540: `DB::transaction(...)` $ightarrow$ Mở transaction.
  3. L541: `$visit->update(['TrangThai' => 'HOAN_THANH', ...]);`  
     $ightarrow$ Câu lệnh: `UPDATE luot_kham SET TrangThai = 'HOAN_THANH' WHERE MaLuotKham = :id;`  
     $ightarrow$ Khóa: **Exclusive Record Lock (X-lock) trên Clustered Index PK của bảng `luot_kham`**.
  4. L548: `$visit->lichHen->update(['TrangThai' => 'HOAN_THANH']);`  
     $ightarrow$ Câu lệnh: `UPDATE lich_hen SET TrangThai = 'HOAN_THANH' WHERE MaLichHen = :maLichHen;`  
     $ightarrow$ Khóa: **Xin Exclusive Record Lock (X-lock) trên Clustered Index PK của bảng `lich_hen`**.

##### Phân tích Wait-For Graph:
- **Tình huống xảy ra chu trình:** Chỉ xảy ra khi Lễ tân cố tình (hoặc do lỗi client double-click) gửi request tiếp nhận lại cho một lịch hẹn $LH_1$ **vốn dĩ đã có lượt khám $LK_1$ đang khám hoặc sắp hoàn thành**:
  - $Tx_1$ (`store` trên $LH_1$): Giữ X-lock $LH_1$, đang chờ X-lock trên $LK_1$ tại dòng 258.
  - $Tx_2$ (`completeExamine` trên $LK_1$): Giữ X-lock $LK_1$ tại dòng 541, đang chờ X-lock trên $LH_1$ tại dòng 548.
  - **Wait-For Graph Cycle:** $Tx_1 ightarrow Tx_2 ightarrow Tx_1$.
- **Đánh giá kiểm định:**  
  > **Gắn nhãn:** `POTENTIAL DEADLOCK — NOT EXPERIMENTALLY VERIFIED`.  
  > Lý do: Trong luồng nghiệp vụ thông thường, không ai tiếp nhận một lịch hẹn đã hoàn thành khám. Tuy nhiên kẽ hở khóa ngược vẫn tồn tại trong mã nguồn nếu có request gửi nhầm ID lịch hẹn cũ. Bắt buộc phải refactor chuẩn hóa phân cấp khóa $LH ightarrow LK$ trong Giai đoạn 3.

---

#### 2. Rà Soát Cặp 2: `savePhieuKham` vs `ChiDinhDichVuController@store` — BÁC BỎ DEADLOCK

##### Khảo sát mã nguồn thực tế:
- `LuotKhamController@savePhieuKham` ([LuotKhamController.php L391-480](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L391-L480)):
  - **KHẢO SÁT QUAN TRỌNG:** Phương thức này **HOÀN TOÀN KHÔNG SỬ DỤNG `DB::transaction()`**!
  - L454: `PhieuKham::updateOrCreate(...)` $ightarrow$ Chạy 1 autocommit transaction riêng biệt, **giải phóng khóa ngay**.
  - L471: `ChiDinhDichVu::where(...)->update(['MaPhieuKham' => ...]);` $ightarrow$ Chạy 1 câu UPDATE autocommit độc lập, **giải phóng khóa ngay**.
  - L477: `$visit->update(['TrangThai' => 'DANG_KHAM']);` $ightarrow$ Chạy 1 câu UPDATE autocommit độc lập, **giải phóng khóa ngay**.

- `ChiDinhDichVuController@store` ([ChiDinhDichVuController.php L157-193](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/ChiDinhDichVuController.php#L157-L193)):
  - L157: Bọc trong `DB::transaction(...)`.
  - L178: `ChiDinhDichVu::create(...)` $ightarrow$ Giữ X-lock trên `chi_dinh_dich_vu`.
  - L192: `$luotKham->update(['TrangThai' => 'CHO_KET_QUA']);` $ightarrow$ Xin X-lock trên `luot_kham`.

##### Kết luận phản biện kiến trúc:
> [!IMPORTANT] BÁC BỎ KẾT LUẬN DEADLOCK V2.4 ĐỐI VỚI CẶP NÀY:
> - Trong khoa học cơ sở dữ liệu, Deadlock theo mô hình Coffman bắt buộc phải thỏa mãn đồng thời 4 điều kiện, trong đó điều kiện cốt lõi là **Hold and Wait** (Tiến trình đang giữ tài nguyên A và chờ cấp phát thêm tài nguyên B).
> - Vì `savePhieuKham` chạy từng câu lệnh ở chế độ autocommit độc lập, nó **KHÔNG HỀ GIỮ KHÓA** trên bảng trước trong khi chờ bảng sau!
> - Khi `savePhieuKham` cập nhật `chi_dinh_dich_vu`, nó có thể phải chờ `CDDV.store` commit. Khi `CDDV.store` commit xong, `savePhieuKham` chạy tiếp và sau đó mới cập nhật `luot_kham`. **Không có chu trình chờ chéo nào tồn tại!**
> - **Gắn nhãn:** `REFUTED THEORETICAL DEADLOCK — NO HOLD-AND-WAIT CYCLE`.

---

### PHẦN IV. BLOCKER B-40: GAP LOCK VÀ BÁC BỎ TUYÊN BỐ "LOẠI TRỪ 100%"

#### 1. Nguyên Lý Khóa Của InnoDB Ở Mức REPEATABLE READ
Khi thực hiện Locking Read (`SELECT ... FOR SHARE` hoặc `FOR UPDATE`) trên Unique Index bằng phép so sánh bằng (`WHERE SoPhieu = :val`):
1. **Trường hợp bản ghi ĐÃ TỒN TẠI:**
   - InnoDB định vị chính xác Record trên B-Tree leaf node.
   - InnoDB chỉ thiết lập **Record Lock** (khóa duy nhất bản ghi đó), **KHÔNG CÓ GAP LOCK**.
2. **Trường hợp bản ghi CHƯA TỒN TẠI:**
   - InnoDB không tìm thấy bản ghi.
   - Để ngăn chặn Phantom Row (ngăn transaction khác chèn bản ghi có cùng giá trị trong khi transaction hiện tại đang đọc), InnoDB **BẮT BUỘC THIẾT LẬP GAP LOCK** trên khoảng trống index giữa bản ghi liền trước và bản ghi liền sau!

#### 2. Kịch Bản Xung Đột Gap Lock Giữa Worker Và Request Tạo Lượt Khám
Giả sử bản ghi `SoPhieu = 'DL-005'` chưa được commit vào bảng `luot_kham`:
1. Worker chạy: `SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = 'DL-005' FOR SHARE;`
   - Vì bản ghi chưa có, InnoDB cấp **Gap S-Lock** trên khoảng trống chứa `'DL-005'`.
2. Đồng thời, Request của Client đang chạy Tx2: `INSERT INTO luot_kham (SoPhieu) VALUES ('DL-005');`
   - Lệnh INSERT bắt buộc phải xin **Insert Intention X-Lock** trên cùng khoảng trống đó.
   - **Ma trận tương thích khóa InnoDB:** Gap Lock (bất kể S hay X) **LUÔN LUÔN XUNG ĐỘT VÀ CHẶN** Insert Intention Lock!
   - $ightarrow$ Request INSERT bị block (Lock Wait) chờ Worker!
3. Nếu tiếp theo Worker lại cố cập nhật `so_cap_so_phieu` mà Request đang giữ X-lock:
   - Worker chờ Request giải phóng `so_cap_so_phieu`.
   - Request chờ Worker giải phóng Gap Lock trên `luot_kham`.
   - $ightarrow$ **DEADLOCK CHU TRÌNH PHÁT SINH (Error 1213)!**

```
+-------------------------------------------------------------------------------------------------------+
|                                    WAIT-FOR GRAPH: GAP LOCK DEADLOCK                                  |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|    [ Tiến trình Request Tx2 ]                                               [ Worker Đối Soát ]      |
|    - Đang giữ: X-Lock trên so_cap_so_phieu                                  - Đang giữ: Gap S-Lock    |
|                                                                                         trên luot_kham|
|             |                                                                         |               |
|             | Xin Insert Intention Lock trên luot_kham                                | Xin X-Lock    |
|             | (BỊ CHẶN BỞI GAP S-LOCK CỦA WORKER!)                                    | trên so_cap_  |
|             v                                                                         |   so_phieu    |
|       Chờ Worker giải phóng Gap Lock <------------------------------------------------+               |
|             |                                                                                         |
|             +------------------------------------------------------------------------> Chờ Request    |
|                                                                                                       |
|    ===> KẾT QUẢ: INNODB PHÁT HIỆN DEADLOCK 1213, BUỘC PHẢI ROLLBACK 1 TIẾN TRÌNH!                    |
+-------------------------------------------------------------------------------------------------------+
```

#### 3. Kết Luận Về Grace Period 5 Phút
- Tuyên bố của V2.4 "Grace period 5 phút loại bỏ 100% rủi ro Gap Lock" là **SAI VỀ MẶT KỸ THUẬT**.
- Grace Period 5 phút chỉ là một **giải pháp giảm xác suất (probabilistic reduction)** dựa trên giả định thực tế là hầu hết các request hoàn thành trong vài trăm millisecond.
- **Nếu một request bị treo I/O vượt quá 5 phút**, xung đột Gap Lock Deadlock như trên **HOÀN TOÀN CÓ THỂ XẢY RA**.
- **Yêu cầu bắt buộc:** Phải chạy thực nghiệm mô phỏng độ trễ trên Database Clone để thu thập log `SHOW ENGINE INNODB STATUS` trước khi đưa ra kết luận cuối cùng.

---

### PHẦN V. BLOCKER B-41: TÁCH BẠCH TUYỆT ĐỐI LIVE SCHEMA VÀ TARGET SCHEMA

Nhằm sửa triệt để sự mâu thuẫn trong các phiên bản trước (suy luận lỗi 1062 như thể Unique Index đã có trên live database), V2.5 phân định tuyệt đối:

#### 1. LIVE SCHEMA (Database `phong_kham_thong_minh` Hiện Hữu — `SCHEMA VERIFIED`)

```sql
-- TRẠNG THÁI THỰC TẾ 100% TRÊN LIVE DATABASE (MySQL 8.0.26):
-- 1. Bảng so_cap_so_phieu: HOÀN TOÀN CHƯA TỒN TẠI!
-- 2. Bảng luot_kham:
--    - Cột SoPhieu: CHƯA TỒN TẠI.
--    - Cột MaPhamVi: CHƯA TỒN TẠI.
--    - Cột STTTrongNgay: CHƯA TỒN TẠI.
--    - Cột MaChuyenKhoa: CHƯA TỒN TẠI.
-- 3. Toàn bộ các Index duy nhất sau: CHƯA TỒN TẠI:
--    - uq_luot_kham_so_phieu: CHƯA CÓ.
--    - uq_idempotency_key: CHƯA CÓ.
--    - uq_pham_vi_ngay_stt: CHƯA CÓ.
-- 4. Trigger trg_luot_kham_immutable_guard: CHƯA TỒN TẠI.
```
> [!WARNING] CẢNH BÁO TOÀN VẸN TRÊN LIVE SCHEMA:
> Nếu hiện tại có 2 request gửi đồng thời cùng số phiếu vào hệ thống, **MySQL KHÔNG NÉM LỖI 1062** vì Unique Index chưa hề tồn tại! Cả 2 bản ghi sẽ được chèn âm thầm, tạo ra dữ liệu trùng lặp rác trên đĩa cứng!

---

#### 2. TARGET SCHEMA (Dự Kiến Thiết Lập Trong Migration Trên Database Clone)

```sql
-- SCHEMA MỤC TIÊU CẦN TẠO QUA MIGRATION 4 BƯỚC:
-- 1. Thêm cột vào luot_kham:
ALTER TABLE luot_kham 
    ADD COLUMN MaPhamVi VARCHAR(50) NOT NULL,
    ADD COLUMN STTTrongNgay INT NOT NULL,
    ADD COLUMN SoPhieu VARCHAR(64) NOT NULL,
    ADD COLUMN MaChuyenKhoa INT NOT NULL,
    ADD CONSTRAINT uq_luot_kham_so_phieu UNIQUE (SoPhieu);

-- 2. Tạo bảng sổ cấp số:
CREATE TABLE so_cap_so_phieu (
    MaCapSo INT AUTO_INCREMENT PRIMARY KEY,
    IdempotencyKey VARCHAR(64) NOT NULL,
    MaPhamVi VARCHAR(50) NOT NULL,
    Ngay DATE NOT NULL,
    STTTrongNgay INT NOT NULL,
    SoPhieu VARCHAR(64) NOT NULL,
    TrangThai ENUM('DA_CAP', 'DANG_XU_LY', 'DA_SU_DUNG', 'DA_HUY') NOT NULL,
    FenceToken INT NOT NULL DEFAULT 0,
    LockedByProcess VARCHAR(64) NULL,
    LeaseExpiresAt DATETIME NULL,
    MaLuotKham INT NULL,
    GhiChu VARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_idempotency_key UNIQUE (IdempotencyKey),
    CONSTRAINT uq_pham_vi_ngay_stt UNIQUE (MaPhamVi, Ngay, STTTrongNgay),
    CONSTRAINT uq_so_phieu UNIQUE (SoPhieu),
    CONSTRAINT uq_scsp_ma_luot_kham UNIQUE (MaLuotKham),
    CONSTRAINT fk_scsp_luot_kham FOREIGN KEY (MaLuotKham) REFERENCES luot_kham (MaLuotKham) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### 3. Bảng Đối Chiếu Timeline Concurrent Insert Giữa Live Schema Và Target Schema

| Thời điểm | Luồng thực thi của Request 1 | Luồng thực thi của Request 2 | Hành vi trên LIVE SCHEMA (Chưa có Unique Index) | Hành vi trên TARGET SCHEMA (Đã có Unique Index) |
| :---: | :--- | :--- | :--- | :--- |
| **$T_1$** | `BEGIN;` | `BEGIN;` | Cả 2 mở transaction độc lập. | Cả 2 mở transaction độc lập. |
| **$T_2$** | `INSERT INTO luot_kham (SoPhieu) VALUES ('DL-001');` | Đang tính toán... | Chèn thành công, giữ X-lock dòng mới. | Chèn thành công, giữ X-lock trên index `uq_luot_kham_so_phieu`. |
| **$T_3$** | Đang chuẩn bị commit... | `INSERT INTO luot_kham (SoPhieu) VALUES ('DL-001');` | **CHÈN THÀNH CÔNG NGAY!** Không có index duy nhất kiểm tra trùng lặp. | **BỊ LOCK WAIT!** Request 2 xin Shared Lock kiểm tra index và bị chặn bởi X-lock của Request 1. |
| **$T_4$** | `COMMIT;` (Request 1 thành công) | Nhận kết quả từ Engine... | Cả 2 dòng cùng tồn tại trong bảng `luot_kham`. **DỮ LIỆU BỊ TRÙNG LẶP RÁC!** | Request 1 giải phóng X-lock. Request 2 nhận thấy bản ghi đã commit $ightarrow$ MySQL ném **`Error 1062 Duplicate entry`**. Request 2 bị rollback! |

---

### PHẦN VI. BLOCKER B-42: KIỂM TRA ĐỘC LẬP MA TRẬN TEST CASE

Đã thực thi kiểm tra toàn vẹn tự động bằng script Python độc lập trên tệp [SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V24.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V24.md).

#### 1. Bảng Kết Quả Kiểm Đếm Chi Tiết Từng Nhóm

```text
+--------------------------------------------------------------------------------------------------------------------+
| NHÓM TEST CASE                                  | MÃ ĐẦU / CUỐI            | SỐ LƯỢNG | TRÙNG MÃ | THIẾU SỐ | LIÊN TỤC |
+--------------------------------------------------------------------------------------------------------------------+
| Nhóm 1: Ràng Buộc Bất Biến (IMM)                | TC-IMM-001 -> TC-IMM-008 | 8        | Không    | Không    | 100%     |
| Nhóm 2: Sổ Cấp Số & Fencing Token (TKT)         | TC-TKT-001 -> TC-TKT-008 | 8        | Không    | Không    | 100%     |
| Nhóm 3: Ma Trận Concurrency (CON)               | TC-CON-001 -> TC-CON-018 | 18       | Không    | Không    | 100%     |
| Nhóm 4: Vòng Đời Nghiệp Vụ Khám Bệnh (BIZ)      | TC-BIZ-001 -> TC-BIZ-012 | 12       | Không    | Không    | 100%     |
| Nhóm 5: Giao Diện Người Dùng / Manual UI (UI)   | TC-UI-001 -> TC-UI-010   | 10       | Không    | Không    | 100%     |
+--------------------------------------------------------------------------------------------------------------------+
| TỔNG SỐ TEST CASES CỐT LÕI (CORE TEST SUITE)                               | 56       | KHÔNG TRÙNG / ĐỦ SỐ LƯỢNG    |
+--------------------------------------------------------------------------------------------------------------------+
| Phụ lục A: Toàn Vẹn Khóa Ngoại (FK)             | TC-FK-001 -> TC-FK-005   | 5        | Không    | Không    | 100%     |
| Phụ lục B: Quy Trình Migration 4 Bước (MIG)     | TC-MIG-001 -> TC-MIG-006 | 6        | Không    | Không    | 100%     |
+--------------------------------------------------------------------------------------------------------------------+
| TỔNG SỐ TEST CASES PHỤ LỤC (APPENDIX SUITE)                                | 11       | NẰM NGOÀI 56 TEST CỐT LÕI    |
+--------------------------------------------------------------------------------------------------------------------+
| TỔNG TOÀN BỘ CÁC ĐỊNH NGHĨA KIỂM THỬ TRONG FILE                            | 67       | KHỚP HOÀN TOÀN TỪNG MỤC     |
+--------------------------------------------------------------------------------------------------------------------+
```

#### 2. Đối Chiếu Tính Toàn Vẹn Với Phiên Bản V2.3
- **Số test case từ V2.3 bị mất trong V2.4:** **0 test case** (Toàn bộ 64 test case định danh từ V2.3 được bảo toàn 100%).
- **Số test case mới bổ sung trong V2.4:** **3 test cases** (`TC-UI-008`, `TC-UI-009`, `TC-UI-010` bổ sung đủ 10 kịch bản kiểm thử giao diện E2E).
- **Phân loại ranh giới rõ ràng:**
  - **56 Test Cases cốt lõi:** 28 PHPUnit (IMM 8 + TKT 8 + BIZ 12) + 18 Concurrency (CON 18) + 10 UI Manual (UI 10).
  - **11 Test Cases phụ lục DDL/Schema:** 5 Foreign Key (FK 5) + 6 Migration Steps (MIG 6).

#### 3. Đối Chiếu Độ Phủ Cho Các Blocker B-31 Đến B-36

| Blocker kỹ thuật | Test Cases tương ứng trong Ma trận | Trạng thái sẵn sàng kịch bản |
| :--- | :--- | :---: |
| **B-31** (Claim & Safe FenceToken Fetching) | `TC-CON-002`, `TC-TKT-001`, `TC-CON-015` | SẴN SÀNG |
| **B-32** (Lease Expiration & Worker Recovery) | `TC-CON-005`, `TC-CON-006`, `TC-CON-007`, `TC-CON-013` | SẴN SÀNG |
| **B-33** (Global Lock Graph & Deadlock Audit) | `TC-CON-011`, `TC-CON-012`, `TC-CON-017` | SẴN SÀNG |
| **B-34** (Current Read Gap Lock Risk) | `TC-CON-016` | SẴN SÀNG |
| **B-35** (Fencing Token & Side-Effects Control) | `TC-CON-018` | SẴN SÀNG |
| **B-36** (Unique Constraint & Duplicate Key) | `TC-TKT-007`, `TC-CON-001`, `TC-TKT-004` | SẴN SÀNG |

---

### PHẦN VII. ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI TẠO DATABASE CLONE

Để bảo đảm tính an toàn tuyệt đối khi chuyển sang bước thiết lập Database Clone thực nghiệm, hệ thống cần đáp ứng 5 điều kiện kỹ thuật:

1. **Chuẩn hóa Pseudocode Claim:** Triển khai câu lệnh atomic conditional UPDATE có kiểm tra `affected_rows === 1` trước khi đọc token.
2. **Loại trừ giả định thời gian:** Cấu hình Worker Recovery dựa trên Fencing Token và conditional UPDATE, không dựa vào việc tiến trình PHP tự chết.
3. **Kế hoạch Refactor Lock Hierarchy:** Lập lịch refactor chuẩn hóa phân cấp khóa $LH ightarrow SCSP ightarrow LK ightarrow PK ightarrow CDDV ightarrow Thuoc$ trong Giai đoạn 3 để triệt tiêu potential deadlock.
4. **Môi trường DB Clone độc lập:** Database Clone phải là một database hoàn toàn riêng biệt (ví dụ: `phong_kham_thong_minh_clone`), không dùng chung connection pool với database chính.
5. **Công cụ Concurrency Barrier CLI:** Cài đặt kịch bản CLI kiểm soát barrier với cơ chế tự hủy mẫu khi $\Delta t > 15$ms.

---

### PHẦN VIII. TỔNG KẾT BẢNG GATEKEEPER & QUYẾT ĐỊNH CHUYỂN BƯỚC

```text
+------------------------------------------------------------------------------------------------------------------------------------------------+
| BLOCKER | BẰNG CHỨNG XÁC THỰC                   | TRẠNG THÁI KIỂM ĐỊNH             | HÀNH ĐỘNG BẮT BUỘC                              | QUYẾT ĐỊNH GATEKEEPER  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-37    | Phân tích MySQL LAST_INSERT_ID spec   | THEORETICAL / CODE VERIFIED      | Áp dụng kiểm tra affected_rows === 1 trước SELECT | CHỜ THỰC NGHIỆM CLONE  |
| B-38    | Timeline Process Freeze vs Worker     | THEORETICAL / CODE VERIFIED      | Sử dụng Fencing Token làm chốt chặn loại trừ     | CHỜ THỰC NGHIỆM CLONE  |
| B-39    | Khảo sát LuotKhamController L391-552  | CODE VERIFIED (1 Potential, 1 Bác)| Refactor LuotKhamController@completeExamine GĐ 3 | CHỜ REFACTOR GIAI ĐOẠN 3|
| B-40    | InnoDB B-Tree Gap Lock Specification  | THEORETICAL / NOT VERIFIED       | Thực nghiệm chạy FOR SHARE trên DB Clone         | CHỜ THỰC NGHIỆM CLONE  |
| B-41    | Khảo sát INFORMATION_SCHEMA live      | SCHEMA VERIFIED (Cột chưa có)    | Phân định rạch ròi Live Schema vs Target Schema   | ĐÃ ĐỐI SOÁT HOÀN TẤT   |
| B-42    | Script Python kiểm đếm ma trận        | CODE VERIFIED (Đúng 56 + 11)     | Giữ nguyên ma trận 56 test cốt lõi               | ĐÃ KIỂM ĐẾM THÀNH CÔNG |
+------------------------------------------------------------------------------------------------------------------------------------------------+
```

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC HIỆN TẠI:
[ NOT APPROVED — NO MIGRATION — NO DATABASE WRITE ]

Lý do giữ nguyên trạng thái: Báo cáo V2.5 đã hoàn thành kiểm định độc lập toàn diện 
B-37 đến B-42: phát hiện cạm bẫy của LAST_INSERT_ID() khi affected_rows = 0, bác bỏ giả định 
thời gian của Grace Period, làm sáng tỏ bản chất Gap Lock của InnoDB, bác bỏ nhận định 
deadlock sai giữa savePhieuKham và CDDV, đồng thời phân định rạch ròi giữa Live Schema và 
Target Schema.

Toàn bộ tài liệu thiết kế và 56 test cases cốt lõi đã đạt mức độ nhất quán cao nhất về 
mặt lý thuyết và mã nguồn. Tuân thủ nghiêm ngặt nguyên tắc an toàn: Dừng lại ở cổng 
kiểm soát (Gatekeeper) chờ quyết định phê duyệt chính thức từ Quản trị viên để cấp phép 
thiết lập Database Clone thực nghiệm.
================================================================================
```
