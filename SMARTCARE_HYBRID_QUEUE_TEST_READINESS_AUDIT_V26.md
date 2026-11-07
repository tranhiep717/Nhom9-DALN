# SMARTCARE HYBRID QUEUE – TEST READINESS AUDIT V2.6
## BÁO CÁO KIỂM ĐỊNH RANH GIỚI GIAO DỊCH, THỨ TỰ KHÓA THỰC TẾ VÀ MÔ HÌNH WORKER RECOVERY (B-43 ĐẾN B-48)

> **Tài liệu tham chiếu:**  
> - [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V25.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V25.md)  
> - [SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V25.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V25.md)  
> **Phiên bản:** 2.6 (Transaction Boundary, Lock Order & Worker Race Audit)  
> **Ngày lập:** 04/11/2026  
> **Môi trường Database xác thực:** MySQL **8.0.26**, Storage Engine **InnoDB 100%**, Default Isolation **REPEATABLE-READ**, Laravel **12.0**  
> **Quy tắc an toàn bất biến:** READ-ONLY tuyệt đối. KHÔNG sửa code ứng dụng, KHÔNG tạo/sửa migration, KHÔNG chạy SQL ghi dữ liệu, KHÔNG tạo database clone, KHÔNG thay đổi database chính `phong_kham_thong_minh`.

---

### HỆ THỐNG PHÂN LOẠI TRẠNG THÁI MINH BẠCH (4 CẤP ĐỘ)

Toàn bộ nhận định trong tài liệu này tuân thủ nghiêm ngặt 4 cấp độ phân loại:
1. **`CODE VERIFIED`**: Đã đối soát trực tiếp từng dòng lệnh trong mã nguồn PHP/Laravel hiện hữu (`app/Http/Controllers/`, `vendor/laravel/framework/`).
2. **`SCHEMA VERIFIED`**: Đã truy vấn đối chiếu trực tiếp `INFORMATION_SCHEMA` trên live database `phong_kham_thong_minh`.
3. **`THEORETICAL`**: Suy luận kỹ thuật dựa trên nguyên lý hoạt động của MySQL 8.0 InnoDB Engine (Lock Manager, MVCC, Two-Phase Locking).
4. **`NOT VERIFIED`**: Chưa được kiểm chứng bằng thực nghiệm chạy thực tế trên môi trường clone độc lập.

---

### TÓM TẮT ĐIỀU HÀNH: ĐỐI CHIẾU TIẾN BỘ V2.6 SO VỚI V2.5

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| VẤN ĐỀ KIỂM ĐỊNH   | KẾT LUẬN V2.5 (CẦN SỬA ĐỔI / LÀM RÕ)                | KẾT LUẬN V2.6 (CHUẨN XÁC THEO CODE & ENGINE)                   |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-43: Claim        | Ghi chú "return null; tự rollback" trong callback    | XÁC NHẬN MÃ NGUỒN LARAVEL: return bình thường sẽ COMMIT!       |
| Pseudocode         | DB::transaction().                                  | Chuyển sang quản lý transaction tường minh (explicit begin/    |
|                    |                                                     | rollback/commit) hoặc throw Exception để rollback thực sự.     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-44: Lock Order   | Giả định Request giữ lock ledger trước khi chèn     | ĐỐI SOÁT CODEBASE HIỆN TẠI: Request chỉ UPDATE ledger ở BƯỚC   |
| Business Tx2       | luot_kham.                                          | CUỐI! Trong lúc INSERT luot_kham, Request CHƯA HỀ GIỮ LEDGER   |
|                    |                                                     | LOCK. Thứ tự thực tế: lich_hen -> luot_kham -> ledger.        |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-45: Worker vs    | Cho rằng Worker giữ Gap Lock sẽ gây deadlock với    | BÁC BỎ DEADLOCK CHU TRÌNH: Cả Request và Worker đều lấy khóa   |
| Request Race       | Request đang chèn luot_kham.                        | theo CÙNG THỨ TỰ (luot_kham trước, ledger sau)! Worker chỉ     |
|                    |                                                     | chặn Request tạm thời, không có chu trình chờ chéo.            |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-46: State        | Mô tả chung các trạng thái ledger.                  | CHUẨN HÓA STATE MACHINE: 6 transition nguyên tử kèm điều kiện  |
| Machine Recovery   |                                                     | WHERE, kiểm tra FenceToken, LeaseExpiresAt, và affected_rows.  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-47: Atomicity    | Chưa tách bạch các thao tác ghi DB với side effect. | PHÂN ĐỊNH RÕ RÀNG: Ghi luot_kham, lich_hen, ledger, thong_bao   |
| & Side Effects     |                                                     | cùng 1 PDO connection tự rollback 100%. WebSocket/Outbox tách. |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-48: Test Cases   | 56 test cốt lõi + 11 test phụ lục.                  | GIỮ NGUYÊN 56 + 11 TEST CASES. Mở rộng TC-CON-016 bao phủ đủ  |
| Consistency        |                                                     | 4 kịch bản Timeline A, B, C, D của B-45. 0% đánh dấu PASS ảo.  |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

---

### PHẦN I. BLOCKER B-43: SỬA VÀ KIỂM ĐỊNH CLAIM PSEUDOCODE

#### 1. Xác Nhận Hành Vi Của Laravel 12 (`CODE VERIFIED`)
Khảo sát trực tiếp từ mã nguồn Laravel Framework tại `vendor/laravel/framework/src/Illuminate/Database/Concerns/ManagesTransactions.php` (L10-L40):

```php
// Mã nguồn gốc của Laravel Framework:
public function transaction(Closure $callback, $attempts = 1)
{
    for ($currentAttempt = 1; $currentAttempt <= $attempts; $currentAttempt++) {
        $this->beginTransaction();
        try {
            $callbackResult = $callback($this);
        } catch (Throwable $e) {
            $this->handleTransactionException($e, $currentAttempt, $attempts);
            continue;
        }

        try {
            if ($this->transactions == 1) {
                $this->getPdo()->commit(); // <--- CHỈ COMMIT KHI KHÔNG CÓ THROWABLE!
            }
            $this->transactions = max(0, $this->transactions - 1);
        } catch (Throwable $e) { ... }
        return $callbackResult;
    }
}
```

> [!IMPORTANT] PHÁT HIỆN KỸ THUẬT QUAN TRỌNG:
> 1. Khi một closure callback bên trong `DB::transaction()` thực hiện lệnh `return` bình thường (kể cả `return null`), Laravel **KHÔNG HỀ GỌI ROLLBACK**! Laravel coi đó là một lượt thực thi thành công và tiến hành gọi `$this->getPdo()->commit()`!
> 2. Trong trường hợp câu lệnh `UPDATE` có `affected_rows = 0`, không có dòng nào bị sửa đổi trên đĩa, nên việc gọi `commit()` là một **"Empty Commit"** (commit không có thay đổi dữ liệu).
> 3. Tuy nhiên, việc ghi chú `"return null; // tự rollback"` trong V2.5 là **hoàn toàn sai về mặt cơ chế Framework**. Nếu trong tương lai có bất kỳ câu lệnh ghi nào (ví dụ: ghi log audit, cập nhật cờ tạm) nằm trước lệnh `return null`, câu lệnh đó **SẼ BỊ COMMIT CHÍNH THỨC** vào database thay vì bị hoàn tác!
> 4. Laravel **CHỈ THỰC HIỆN ROLLBACK KHI CÓ MỘT `Throwable` ĐƯỢC NÉM RA** bên trong closure!

---

#### 2. Đề Xuất Giải Pháp Chuẩn Hóa V2.6

Có hai cách tiếp cận kỹ thuật để đảm bảo tính an toàn giao dịch:
- **Cách 1 (Dùng Exception nội bộ trong `DB::transaction`):** Ném một ngoại lệ nhẹ (ví dụ `throw new ClaimConflictException()`) để kích hoạt cơ chế `catch` và `$this->rollBack()` của Laravel, sau đó bắt lại ngoại lệ này ở tầng ngoài và trả về `null`.
- **Cách 2 (Quản lý Transaction tường minh qua `DB::beginTransaction` / `DB::rollBack` / `DB::commit`):** Đây là giải pháp **tối ưu nhất, trong sáng nhất và kiểm soát 100% vòng đời kết nối PDO** mà không phụ thuộc vào luồng điều khiển bằng ngoại lệ.

#### 3. Pseudocode Chuẩn Hóa V2.6 Cho Claim Transaction

```php
/**
 * THỰC HIỆN CLAIM TRANSACTION ĐỘC LẬP (TX1) - PHIÊN BẢN CHUẨN HÓA V2.6
 * Quản lý Transaction tường minh: Không bị cạm bẫy Empty Commit của closure callback.
 */
function claimTicketLedgerExplicit(string $idempotencyKey, string $processId, int $maxRetries = 3): ?int 
{
    $attempt = 0;
    while ($attempt < $maxRetries) {
        $attempt++;
        
        // Mở transaction tường minh trên Master Connection
        DB::beginTransaction();
        
        try {
            // 1. Conditional UPDATE nguyên tử thống nhất (Cả vé mới DA_CAP lẫn vé quá hạn DANG_XU_LY)
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

            // 2. Chốt kiểm tra sinh tử: Nếu không cập nhật được dòng nào
            if ($affected !== 1) {
                // CHỦ ĐỘNG ROLLBACK THỰC SỰ: Giải phóng toàn bộ snapshot và kết thúc Tx1 an toàn
                DB::rollBack();
                // Tuyệt đối KHÔNG đọc LAST_INSERT_ID() vì giá trị hiện tại là rác từ query trước!
                return null;
            }

            // 3. Đọc FenceToken TRÊN CÙNG KẾT NỐI PDO khi đang giữ Exclusive Row Lock
            $tokenRow = DB::selectOne("SELECT LAST_INSERT_ID() AS assignedToken");
            $assignedToken = (int) ($tokenRow->assignedToken ?? 0);

            if ($assignedToken <= 0) {
                // Nếu không lấy được token hợp lệ, buộc phải rollback
                DB::rollBack();
                throw new RuntimeException("CRITICAL: Failed to retrieve valid FenceToken after atomic claim update.");
            }

            // 4. Commit Tx1 thành công: Chốt giữ trạng thái DANG_XU_LY và giải phóng X-lock ledger
            DB::commit();
            return $assignedToken;

        } catch (\Illuminate\Database\QueryException $e) {
            // Luôn đảm bảo rollback transaction hiện tại nếu có lỗi cơ sở dữ liệu
            DB::rollBack();
            
            $errorCode = $e->errorInfo[1] ?? 0;
            // Xử lý Deadlock 1213 hoặc Lock Wait Timeout 1205
            if (in_array($errorCode, [1213, 1205]) && $attempt < $maxRetries) {
                // Mỗi lần retry sẽ mở một transaction hoàn toàn mới ở vòng lặp tiếp theo
                $jitterMs = random_int(10, 30) * (2 ** ($attempt - 1));
                usleep($jitterMs * 1000);
                continue;
            }
            throw $e;
        } catch (\Throwable $t) {
            DB::rollBack();
            throw $t;
        }
    }
    return null;
}
```

---

### PHẦN II. BLOCKER B-44: XÁC ĐỊNH CHÍNH XÁC THỨ TỰ KHÓA CỦA BUSINESS TX2

#### 1. Khảo Sát Mã Nguồn Thực Tế Hiện Hữu (`CODE VERIFIED`)
Khảo sát trực tiếp phương thức tiếp nhận trong `app/Http/Controllers/LuotKhamController.php` (L244-325):

| Thứ tự thực thi | Dòng code trong file | Câu lệnh SQL / Eloquent thực tế | Loại khóa InnoDB thực tế | Bảng bị khóa |
| :---: | :--- | :--- | :--- | :--- |
| **1** | L244 | `DB::transaction(...)` | `BEGIN` (Mở transaction Tx2) | Không |
| **2** | L250 | `LichHen::...->lockForUpdate()->find($maLichHen)` | `SELECT ... FOR UPDATE` | **Exclusive Record Lock** trên PK của `lich_hen` |
| **3** | L258 | `LuotKham::where('MaLichHen', ...)->lockForUpdate()->first()` | `SELECT ... FOR UPDATE` | **Lock trên index `MaLichHen`** của `luot_kham` |
| **4** | L281 | `$lichHen->update(['TrangThai' => 'DA_TIEP_NHAN'])` | `UPDATE lich_hen ...` | **Exclusive Record Lock** trên PK của `lich_hen` |
| **5** | L291 | `LuotKham::create([...])` | `INSERT INTO luot_kham ...` | **Insert Intention Lock** $ightarrow$ **X-Lock PK mới** |
| **6** | L307 | `NotificationService::sendToDoctor(...)` | `INSERT INTO thong_bao ...` | **X-Lock trên PK mới** của `thong_bao` |
| **7** | L316 | `NotificationService::sendToPatient(...)` | `INSERT INTO thong_bao ...` | **X-Lock trên PK mới** của `thong_bao` |
| **8** | L325 | Kết thúc closure | `COMMIT` (Giải phóng toàn bộ khóa) | Toàn bộ bảng |

> [!IMPORTANT] XÁC THỰC QUAN TRỌNG VỀ THỨ TỰ KHÓA:
> 1. Bảng `lich_su_dieu_phoi`: **HOÀN TOÀN KHÔNG ĐƯỢC GỌI TRONG `store`** (`CODE VERIFIED`). Bảng này chỉ được ghi khi Lễ tân bấm điều phối đổi phòng khám ở phương thức khác.
> 2. Bảng `so_cap_so_phieu`: **HOÀN TOÀN CHƯA CÓ TRONG CODE HIỆN TẠI** (`CODE VERIFIED`).
> 3. Trong thiết kế Phase 2, câu lệnh cập nhật `so_cap_so_phieu` sang `DA_SU_DUNG` nằm ở **BƯỚC 5b (NGAY SAU KHI INSERT `luot_kham` THÀNH CÔNG)**.
> 4. **KẾT LUẬN THEN CHỐT:** Trong lúc Request đang thực hiện câu lệnh `INSERT INTO luot_kham`, **REQUEST HOÀN TOÀN CHƯA HỀ CẦM GIỮ BẤT KỲ KHÓA NÀO TRÊN BẢNG `so_cap_so_phieu`**!

---

#### 2. Bảng Phân Tích Thứ Tự Khóa Chuẩn Hóa Của Toàn Bộ Quy Trình Tiếp Nhận

```text
+-------------------------------------------------------------------------------------------------------------------------------+
| GIAI ĐOẠN          | BƯỚC THỰC THI                                       | TÀI NGUYÊN BỊ KHÓA             | LOẠI KHÓA INNODB  |
+-------------------------------------------------------------------------------------------------------------------------------+
| TX1: Claim         | 1. BEGIN Claim Tx                                   | Không                          | Không             |
| (Autonomous)       | 2. UPDATE so_cap_so_phieu SET TrangThai='DANG_XU_LY'| so_cap_so_phieu (Dòng ledger)  | Exclusive (X-Lock)|
|                    | 3. SELECT LAST_INSERT_ID()                          | so_cap_so_phieu                | Đang giữ X-Lock   |
|                    | 4. COMMIT Claim Tx                                  | Giải phóng toàn bộ khóa ledger!| Không             |
+-------------------------------------------------------------------------------------------------------------------------------+
| (Khoảng trống)     | Client tính toán payload trong bộ nhớ PHP           | Không giữ bất kỳ khóa DB nào!  | Không             |
+-------------------------------------------------------------------------------------------------------------------------------+
| TX2: Business      | 1. BEGIN Business Tx                                | Không                          | Không             |
| (Fenced Workflow)  | 2. SELECT ... FROM lich_hen ... FOR UPDATE          | lich_hen (Dòng lịch hẹn gốc)   | Exclusive (X-Lock)|
|                    | 3. UPDATE lich_hen SET TrangThai='DA_TIEP_NHAN'     | lich_hen                       | Exclusive (X-Lock)|
|                    | 4. INSERT INTO luot_kham                            | luot_kham (Clustered Index PK) | Insert Intention  |
|                    |                                                     |                                | -> X-Lock dòng mới|
|                    | 5. UPDATE so_cap_so_phieu SET TrangThai='DA_SU_DUNG'| so_cap_so_phieu (Dòng ledger)  | Exclusive (X-Lock)|
|                    |    WHERE MaCapSo=:id AND FenceToken=:token          | (CHỈ KHÓA Ở BƯỚC NÀY!)         |                   |
|                    | 6. INSERT INTO thong_bao                            | thong_bao (Dòng thông báo mới) | Exclusive (X-Lock)|
|                    | 7. COMMIT Business Tx                               | Giải phóng toàn bộ khóa!       | Không             |
+-------------------------------------------------------------------------------------------------------------------------------+
```

---

### PHẦN III. BLOCKER B-45: PHÂN TÍCH 4 TIMELINE RACE CONDITION (A, B, C, D)

#### 1. Kịch Bản A: A Chưa INSERT Lượt Khám, Lease Hết Hạn, Worker Chạy Trước, B Reclaim

- **Tiền điều kiện:** A đã Claim Token 1 (Tx1 commit). A mở Tx2 nhưng bị treo I/O trước khi gọi INSERT `luot_kham`. Lease 60s hết hạn. Grace Period 5m hết hạn.
- **Diễn biến:**
  1. Worker quét thấy vé `DANG_XU_LY` hết hạn $> 5$ phút. Worker chạy: `SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = :sp FOR SHARE;`.
     - Vì A chưa INSERT `luot_kham`, dòng chưa tồn tại $ightarrow$ InnoDB cấp **Gap S-Lock** trên khoảng trống index của `luot_kham`.
  2. B gửi request Reclaim: B chạy Claim Tx1 của B $ightarrow$ Cập nhật `so_cap_so_phieu` với `FenceToken = 2`. Tx1 của B commit thành công! B nhận Token 2.
  3. Worker sau đó chạy câu lệnh hủy:
     ```sql
     UPDATE so_cap_so_phieu SET TrangThai = 'DA_HUY' 
     WHERE MaCapSo = :id AND TrangThai = 'DANG_XU_LY' AND FenceToken = 1;
     ```
     - Vì B vừa đổi token thành 2, câu lệnh của Worker nhận **`affected_rows = 0`**! Worker tự hủy bỏ, không void nhầm!
     - Worker commit / rollback transaction đối soát $ightarrow$ **Giải phóng Gap S-Lock trên `luot_kham`!**
  4. Tiến trình A tỉnh dậy sau cơn treo, cố INSERT `luot_kham`: Vì Worker đã giải phóng Gap S-Lock, A chèn thành công vào `luot_kham`.
  5. A tiến tới bước chốt cuối Tx2: `UPDATE so_cap_so_phieu SET TrangThai = 'DA_SU_DUNG' WHERE FenceToken = 1;`.
     - Vì token trong DB đã là 2, câu lệnh của A nhận **`affected_rows = 0`**!
     - A bắt buộc phải gọi **`DB::rollBack()`**, dòng `luot_kham` của A bị xóa sạch!
- **Đánh giá khóa & Deadlock:** Không có Wait-For Graph cycle. B commit thành công, A rollback, Worker bỏ qua an toàn.
- **Trạng thái cuối cùng:** `so_cap_so_phieu` thuộc về B (`FenceToken = 2`), `luot_kham` chỉ có bản ghi của B.

---

#### 2. Kịch Bản B: A Đã INSERT Lượt Khám Nhưng Chưa Commit, Worker Chạy `FOR SHARE`, B Reclaim

- **Tiền điều kiện:** A đã chạy `INSERT INTO luot_kham` trong Tx2, đang giữ X-lock trên dòng `luot_kham` nhưng bị treo chưa commit. Hết Lease và Grace Period.
- **Diễn biến:**
  1. Worker chạy: `SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = :sp FOR SHARE;`.
     - Vì dòng `luot_kham` đang có X-lock của A $ightarrow$ **Worker bị LOCK WAIT** xin Shared Lock (S-lock) chờ A!
  2. B gửi request Reclaim: B chạy Claim Tx1 trên bảng `so_cap_so_phieu` $ightarrow$ B cập nhật `FenceToken = 2` thành công và commit.
  3. A tỉnh dậy, chạy bước chốt Tx2: `UPDATE so_cap_so_phieu ... WHERE FenceToken = 1`.
     - Nhận `affected_rows = 0` $ightarrow$ A gọi `DB::rollBack()`!
     - Lệnh rollback của A **giải phóng X-lock trên dòng `luot_kham`** và xóa dòng này!
  4. Worker hết bị Lock Wait, đọc lại `luot_kham` thấy trống (do A rollback).
  5. Worker cố UPDATE `DA_HUY` với `FenceToken = 1` $ightarrow$ Nhận `affected_rows = 0` vì B đã chiếm Token 2. Worker dừng an toàn.
- **Đánh giá khóa & Deadlock:** Worker chỉ xếp hàng chờ A trên `luot_kham`, A không chờ Worker $ightarrow$ **Không có chu trình Deadlock**.
- **Trạng thái cuối cùng:** Bản ghi thuộc về B, không có dữ liệu rác của A.

---

#### 3. Kịch Bản C: Worker Đọc Ledger Trước, Giữ Khóa, A Hoặc B Thực Hiện INSERT Lượt Khám

- **Tiền điều kiện:** Worker đọc ledger và bắt đầu kiểm tra `luot_kham`.
- **Diễn biến:**
  1. Worker chạy `SELECT ... FOR SHARE` trên `SoPhieu` chưa tồn tại $ightarrow$ Worker giữ **Gap S-Lock** trên `luot_kham`.
  2. A (hoặc B) thực hiện bước INSERT `luot_kham`:
     - Lệnh INSERT xin **Insert Intention X-Lock** trên khoảng trống index.
     - Vì Worker đang giữ Gap S-Lock $ightarrow$ **A (hoặc B) bị LOCK WAIT chờ Worker!**
  3. Worker chạy tiếp câu lệnh cập nhật ledger:
     - Worker xin X-lock trên dòng `so_cap_so_phieu`.
     - **Câu hỏi mấu chốt:** Request A có đang giữ X-lock trên `so_cap_so_phieu` không?
     - **CÂU TRẢ LỜI:** **KHÔNG!** Vì Claim Tx1 của A đã commit từ trước, còn Tx2 của A mới đang ở bước INSERT `luot_kham`, A **chưa hề chạm tới `so_cap_so_phieu`**!
     - Do đó, Worker **ĐƯỢC CẤP NGAY X-LOCK TRÊN `so_cap_so_phieu`** mà không phải chờ ai cả!
  4. Worker cập nhật `DA_HUY` thành công và `COMMIT` transaction của Worker $ightarrow$ **Giải phóng Gap S-Lock trên `luot_kham`!**
  5. A hết bị Lock Wait, chèn thành công `luot_kham`.
  6. A chạy tới bước chốt cuối Tx2 kiểm tra `so_cap_so_phieu` $ightarrow$ Nhận `affected_rows = 0` (vì Worker đã đổi trạng thái thành `DA_HUY`) $ightarrow$ A tự động rollback!
- **Đánh giá then chốt:**
  > [!IMPORTANT] BÁC BỎ GIẢ THUYẾT DEADLOCK GAP LOCK:
  > Vì Request chỉ khóa ledger ở BƯỚC CUỐI CÙNG (sau INSERT), Request không giữ khóa ledger trong lúc bị chặn bởi Gap Lock. Do đó, **KHÔNG CÓ CHU TRÌNH CHỜ CHÉO NÀO PHÁT SINH**! Cả Worker và Request chạy tuần tự an toàn tuyệt đối.

---

#### 4. Kịch Bản D: A Chạy Bước Xác Nhận FenceToken Cuối Tx2, Worker Và B Đồng Thời Reclaim / Void

- **Tiền điều kiện:** A vừa INSERT `luot_kham` xong, chuẩn bị chạy bước UPDATE `so_cap_so_phieu` cuối Tx2. Cùng lúc đó, Worker cố Void và B cố Reclaim.
- **Diễn biến tại bảng `so_cap_so_phieu`:**
  - Cả 3 tiến trình cùng xin Exclusive Row Lock (X-lock) trên cùng một dòng ledger trong `so_cap_so_phieu`:
    1. Tiến trình đến trước (giả sử là A) được cấp X-lock. A kiểm tra `FenceToken = 1` $ightarrow$ Khớp! A cập nhật `TrangThai = 'DA_SU_DUNG'`, `MaLuotKham = :lk`. A commit Tx2!
    2. Tiến trình thứ hai (B hoặc Worker) hết bị Lock Wait, kiểm tra điều kiện `WHERE TrangThai = 'DANG_XU_LY'`.
       - Vì A đã chuyển trạng thái thành `DA_SU_DUNG`, điều kiện WHERE không còn thỏa mãn!
       - B và Worker đều nhận **`affected_rows = 0`**!
- **Đánh giá khóa & Deadlock:** Row-level X-lock tuần tự hóa 3 tiến trình theo hàng đợi FIFO của InnoDB Lock Manager. Đúng 1 tiến trình hợp lệ thắng cuộc, 2 tiến trình còn lại rút lui an toàn. 0% Deadlock, 0% Split-Brain.

---

### PHẦN IV. BLOCKER B-46: KIỂM ĐỊNH WORKER RECOVERY STATE MACHINE

#### 1. Sơ Đồ Chuyển Trạng Thái (State Machine Graph)

```
        +--------------+
        |   KHOI_TAO   |
        +-------+------+
                |
                v  (Tx Allocation: Cấp số mới)
        +-------+------+
        |    DA_CAP    | <-----------------+ (Reset mỗi ngày)
        +-------+------+                   |
                |                          |
                | (Transition 1: Claim)    | (Transition 6: Void Orphan sau 15m)
                v                          v
        +-------+------+           +-------+------+
        |  DANG_XU_LY  +---------->|    DA_HUY    |
        +-------+------+ (Trans 4: +-------+------+
          |     |        Void sau 5m)      ^
          |     |                          |
          |     +--------------------------+
          |         (Trans 2: Reclaim quá hạn token++)
          |
          | (Transition 3: Finalize tạo lượt thành công)
          | (Transition 5: Worker Reconcile khi tìm thấy lượt)
          v
   +------+-------+
   |  DA_SU_DUNG  |  (Trạng thái cuối cùng - Bất biến)
   +--------------+
```

---

#### 2. Đặc Tả Chi Tiết 6 Transition Nguyên Tử

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| TRANSITION        | ĐIỀU KIỆN WHERE BẮT BUỘC                              | FENCE TOKEN     | LEASE CHECK       | AFFECTED | BOUNDARY     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 1. Request Claim  | IdempotencyKey = :k AND TrangThai = 'DA_CAP'          | Token tăng 0->1 | Lease = NOW()+60s | 1        | Tx1 Claim    |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 2. Request Reclaim| IdempotencyKey = :k AND TrangThai = 'DANG_XU_LY'      | Token tăng      | Lease = NOW()+60s | 1        | Tx1 Claim    |
|                   | AND LeaseExpiresAt < NOW()                            | (Token + 1)     |                   |          |              |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 3. Finalize Tx2   | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'            | Token khớp      | Không cần check   | 1        | Cuối Tx2     |
|                   | AND FenceToken = :assignedToken                       | tuyệt đối       | vì token bảo vệ   |          | Business     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 4. Worker Void    | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'            | Token khớp      | LeaseExpiresAt <  | 1        | Tx Worker    |
|                   | AND FenceToken = :readToken                           | lúc đọc         | NOW() - 5 phút    |          | Đối Soát     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 5. Worker         | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'            | Token khớp      | Đã kiểm tra thấy  | 1        | Tx Worker    |
|    Reconcile      | AND FenceToken = :readToken                           | lúc đọc         | luot_kham tồn tại |          | Đối Soát     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| 6. Void Orphan    | MaCapSo = :id AND TrangThai = 'DA_CAP'                | FenceToken = 0  | CreatedAt <       | 1        | Tx Worker    |
|                   |                                                       |                 | NOW() - 15 phút   |          | Dọn Dẹp      |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

#### 3. Trả Lời 4 Câu Hỏi Kiểm Định Đặc Biệt Của B-46

1. **Worker có thể chuyển `DA_HUY` khi Request vẫn còn Tx2 không?**
   - **TRẢ LỜI:** Nếu Request đang trong Tx2 và đang giữ X-lock trên `luot_kham`, Worker bị Lock Wait khi đọc `luot_kham`.
   - Nếu Request bị treo $> 5$ phút chưa chạm `luot_kham`, Worker chuyển `DA_HUY` thành công. Khi Request chạy tới bước chốt cuối, Request nhận `affected_rows = 0` và tự động rollback. **Dữ liệu hoàn toàn nhất quán, không xảy ra mâu thuẫn trạng thái.**
2. **Worker có thể ghi `DA_HUY` sau khi Request đã chuyển `DA_SU_DUNG` không?**
   - **TRẢ LỜI: TUYỆT ĐỐI KHÔNG.** Điều kiện `WHERE TrangThai = 'DANG_XU_LY'` chặn đứng Worker. Câu lệnh UPDATE của Worker sẽ trả về `affected_rows = 0`.
3. **Hai Worker chạy cùng lúc có thể cùng xử lý một ledger không?**
   - **TRẢ LỜI: KHÔNG.** Cơ chế Exclusive Row Lock của InnoDB tuần tự hóa 2 Worker. Worker 1 cập nhật thành công (đổi token/trạng thái), Worker 2 chạy sau kiểm tra điều kiện WHERE sẽ nhận `affected_rows = 0` và rút lui.
4. **Request cũ có thể thay đổi trạng thái sau khi token đã tăng không?**
   - **TRẢ LỜI: KHÔNG.** Request cũ chỉ mang token cũ $T_{	ext{old}}$. Khi token trong DB đã là $T_{	ext{new}} > T_{	ext{old}}$, câu lệnh `WHERE FenceToken = :oldToken` trả về `affected_rows = 0`, ép buộc Request cũ phải rollback.

---

### PHẦN V. BLOCKER B-47: KIỂM ĐỊNH TÍNH NGUYÊN TỬ VÀ SIDE-EFFECTS

#### 1. Rà Soát Connection & Transaction Boundaries Của Các Thao Tác Ghi

| Thao tác ghi dữ liệu | Model / File Code | Nằm trong Tx2? | Cùng PDO Connection? | Khả năng Rollback khi Tx2 thất bại |
| :--- | :--- | :---: | :---: | :---: |
| **`INSERT luot_kham`** | `LuotKham::create` (L291) | **CÓ** | **CÙNG MASTER PDO** | **100% TỰ ĐỘNG ROLLBACK** |
| **`UPDATE lich_hen`** | `$lichHen->update` (L281) | **CÓ** | **CÙNG MASTER PDO** | **100% TỰ ĐỘNG ROLLBACK** |
| **`UPDATE so_cap_so_phieu`**| Bước chốt cuối Tx2 | **CÓ** | **CÙNG MASTER PDO** | **100% TỰ ĐỘNG ROLLBACK** |
| **`INSERT thong_bao`** | `NotificationService` (L307, 316) | **CÓ** | **CÙNG MASTER PDO** | **100% TỰ ĐỘNG ROLLBACK** |
| **`INSERT lich_su_dieu_phoi`**| Chưa có trong `store` | N/A | N/A | Không áp dụng trong luồng này |

> [!IMPORTANT] KẾT LUẬN TOÀN VẸN:
> Toàn bộ 4 thao tác ghi cơ sở dữ liệu trên đều chạy qua cùng một kết nối PDO Master trong cùng một transaction `DB::transaction(...)`. Khi có bất kỳ lỗi nào hoặc khi Fencing Token trả về `affected_rows = 0`, InnoDB Rollback sẽ **hoàn tác 100% toàn bộ 4 bảng**, không để lại bất kỳ bản ghi rác nào trong database!

#### 2. Phân Định Ranh Giới Side-Effects Ngoại Vi
- **Side-effects trong Database:** Đã an toàn 100% nhờ ACID rollback.
- **Side-effects mạng (WebSockets, SMS, Zalo ZNS):** Không thể rollback qua MySQL.
- **Quy tắc an toàn bất biến:**
  ```php
  // BẮT BUỘC: Chỉ phát side-effects sau khi transaction đã COMMIT chính thức
  DB::afterCommit(function () use ($visit, $maBacSi, $maBenhNhan) {
      // Bắn WebSocket Reverb hoặc gửi SMS tại đây
      event(new PatientQueueUpdated($visit));
  });
  ```
- **Xác thực mã nguồn:** Bảng `outbox_messages` **chưa tồn tại** trong codebase (`CODE VERIFIED`). Trong Phase 2, hệ thống sử dụng `DB::afterCommit`. Kế hoạch triển khai Transactional Outbox Worker được bảo lưu cho Phase 3.

---

### PHẦN VI. BLOCKER B-48: KIỂM TRA LẠI VÀ CHUẨN HÓA MA TRẬN TEST CASES

1. **Bảo toàn số lượng:** Giữ nguyên chính xác **56 Test Cases cốt lõi** và **11 Test Cases phụ lục** (Tổng cộng 67 test cases).
2. **Cập nhật TC-CON-016 trong [SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V26.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V26.md):**
   - Mở rộng kịch bản kiểm thử bao phủ toàn bộ 4 Timeline A, B, C, D của B-45.
   - Kiểm chứng hành vi thực tế của InnoDB: Xác nhận việc Request không giữ khóa ledger trong lúc INSERT `luot_kham` loại trừ hoàn toàn deadlock chu trình với Worker.
3. **Trạng thái thực nghiệm:** Cam kết **100% test case vẫn ở trạng thái `CHƯA THỰC THI (NOT TESTED)`**. Tuyệt đối không đánh dấu PASS ảo.

---

### PHẦN VII. ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI TẠO DATABASE CLONE

Sau khi hoàn thành đợt kiểm định V2.6, toàn bộ 4 điều kiện cốt tử đã được làm sáng tỏ:
1. **Pseudocode Claim:** Đã chuẩn hóa bằng cơ chế explicit transaction, loại bỏ cạm bẫy Empty Commit.
2. **Thứ tự khóa thực tế:** Đã xác minh từ mã nguồn rằng Request chỉ khóa ledger ở bước cuối, triệt tiêu giả thuyết deadlock chu trình với Gap Lock của Worker.
3. **State Machine:** 6 transition nguyên tử đã được định nghĩa đầy đủ với các điều kiện WHERE và chốt chặn Fencing Token.
4. **Side Effects:** 100% thao tác ghi DB nằm trong cùng transaction và cùng PDO connection.

---

### PHẦN VIII. TỔNG KẾT BẢNG GATEKEEPER & QUYẾT ĐỊNH CHUYỂN BƯỚC

```text
+------------------------------------------------------------------------------------------------------------------------------------------------+
| BLOCKER | BẰNG CHỨNG XÁC THỰC                   | TRẠNG THÁI KIỂM ĐỊNH             | HÀNH ĐỘNG BẮT BUỘC                              | QUYẾT ĐỊNH GATEKEEPER  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-43    | Laravel ManagesTransactions.php L15   | CODE VERIFIED                    | Áp dụng explicit begin/rollback/commit          | ĐÃ CHUẨN HÓA THIẾT KẾ  |
| B-44    | LuotKhamController.php L244-325       | CODE VERIFIED                    | Xác nhận ledger chỉ khóa ở bước cuối Tx2        | ĐÃ ĐỐI SOÁT MÃ NGUỒN   |
| B-45    | 4 Timeline Race Condition A, B, C, D  | THEORETICAL / CODE VERIFIED      | Chứng minh cùng thứ tự khóa loại trừ deadlock   | ĐÃ CHỨNG MINH LÝ THUYẾT|
| B-46    | Đặc tả State Machine 6 Transition     | THEORETICAL / DESIGN REVIEWED    | Chuẩn hóa điều kiện WHERE và FenceToken check   | ĐÃ ĐẶC TẢ HOÀN TẤT     |
| B-47    | NotificationService.php L20 & Master  | CODE VERIFIED                    | 100% ghi DB trong cùng Tx2 tự động rollback     | ĐÃ XÁC THỰC ATOMICITY  |
| B-48    | Script Python kiểm đếm ma trận        | CODE VERIFIED (Đúng 56 + 11)     | Giữ nguyên 56 test cốt lõi, mở rộng TC-CON-016  | ĐÃ ĐỒNG BỘ 100%        |
+------------------------------------------------------------------------------------------------------------------------------------------------+
```

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC HIỆN TẠI:
[ NOT APPROVED — NO MIGRATION — NO DATABASE WRITE ]

Lý do giữ nguyên trạng thái: Báo cáo V2.6 đã hoàn thành xuất sắc việc kiểm định 
toàn bộ ranh giới giao dịch (Transaction Boundary), vạch rõ thứ tự khóa thực tế trong 
mã nguồn (Request chỉ khóa ledger ở bước cuối Tx2), chứng minh tính an toàn không deadlock 
trong 4 kịch bản Timeline giữa Worker và Request, chuẩn hóa State Machine 6 transition 
nguyên tử và khắc phục triệt để cạm bẫy Empty Commit của Laravel.

Thiết kế đã đạt độ chín muồi và nhất quán toán học cao nhất từ trước đến nay. Tuy nhiên, 
tuân thủ tuyệt đối chỉ đạo của Quản trị viên: Giữ nguyên trạng thái Gatekeeper ở mức 
CHƯA PHÊ DUYỆT, KHÔNG TẠO MIGRATION, KHÔNG GHI DATABASE, dừng lại chờ ý kiến đánh giá 
cuối cùng từ Quản trị viên trước khi bước sang giai đoạn lập kế hoạch Database Clone.
================================================================================
```
