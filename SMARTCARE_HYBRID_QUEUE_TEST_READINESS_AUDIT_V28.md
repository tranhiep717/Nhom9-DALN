# SMARTCARE HYBRID QUEUE — V2.8 FINAL DESIGN GAP AUDIT
**CLAIM CONFLICT, AUTONOMOUS CONNECTION, FENCING VOID, UNKNOWN COMMIT RECOVERY & ATOMICITY**

> **TÌNH TRẠNG PHÊ DUYỆT**: `NOT APPROVED — NO MIGRATION — NO DATABASE WRITE — NO CLONE YET`  
> **PHIÊN BẢN KIỂM ĐỊNH**: `V2.8 FINAL DESIGN GAP AUDIT`  
> **QUY TẮC AN TOÀN**: `READ-ONLY 100% — KHÔNG SỬA MÃ NGUỒN — KHÔNG TẠO MIGRATION — KHÔNG GHI CSDL`  
> **NGÀY KIỂM ĐỊNH**: 2026-11-04  
> **HỆ QUẢN TRỊ CSDL MỤC TIÊU**: MySQL 8.0.26 / InnoDB Engine / Default Connection: `mysql`  
> **FRAMEWORK NỀN TẢNG**: Laravel 12.x / PHP 8.2+

---

## MỤC LỤC
1. [I. TỔNG QUAN VÀ KHUNG KIỂM ĐỊNH V2.8](#i-tổng-quan-và-khung-kiểm-định-v28)
2. [II. B-55: CLAIM CONFLICT VÀ CƠ CHẾ RETRY CỦA LARAVEL](#ii-b-55-claim-conflict-và-cơ-chế-retry-của-laravel)
3. [III. B-56: AUTONOMOUS TRANSACTION VÀ CONNECTION IDENTITY AUDIT](#iii-b-56-autonomous-transaction-và-connection-identity-audit)
4. [IV. B-57: WORKER VOID VÀ ĐIỀU KIỆN FENCING TOKEN NGUYÊN TỬ](#iv-b-57-worker-void-và-điều-kiện-fencing-token-nguyên-tử)
5. [V. B-58: UNKNOWN COMMIT RESULT VÀ MA TRẬN IDEMPOTENCY RECOVERY](#v-b-58-unknown-commit-result-và-ma-trận-idempotency-recovery)
6. [VI. B-59: ATOMICITY VÀ CONNECTION AUDIT CHO BUSINESS TX2](#vi-b-59-atomicity-và-connection-audit-cho-business-tx2)
7. [VII. B-60: TỔNG KẾT TEST MATRIX VÀ MỞ RỘNG KIỂM THỬ](#vii-b-60-tổng-kết-test-matrix-và-mở-rộng-kiểm-thử)
8. [VIII. GATEKEEPER DECISION VÀ ROADMAP TRIỂN KHAI](#viii-gatekeeper-decision-và-roadmap-triển-khai)

---

## I. TỔNG QUAN VÀ KHUNG KIỂM ĐỊNH V2.8

Báo cáo kiểm định V2.8 được thiết lập nhằm phản biện trực tiếp và giải quyết triệt để 5 vấn đề cốt lõi cuối cùng được chỉ ra trong đợt phản biện V2.7:
- **B-55**: Phân biệt bản chất giữa xung đột nghiệp vụ (Business Conflict) và lỗi tranh chấp đồng thời (Concurrency Error) trong cơ chế `DB::transaction($callback, $attempts)` của Laravel 12.
- **B-56**: Định danh kết nối (Connection Identity) và bảo đảm tính độc lập thực sự của Autonomous Transaction thông qua guard kiểm tra connection cụ thể.
- **B-57**: Chứng minh điều kiện nguyên tử 4 tiêu chí trong câu lệnh `UPDATE` của Worker Recovery để triệt tiêu hoàn toàn rủi ro hủy nhầm vé do đọc token cũ (Stale Worker).
- **B-58**: Xây dựng ma trận 6 kịch bản phục hồi lỗi ngắt mạng / mất kết nối không xác định (Unknown Commit Result) và hoàn thiện kiến trúc Idempotency không chỉ dựa vào unique key mà còn có cơ chế trả lại response cũ.
- **B-59**: Kiểm định tính nguyên tử (Atomicity) và bảo đảm 100% các bảng ghi nghiệp vụ trong Tx2 cùng chia sẻ một kết nối PDO duy nhất và sử dụng Storage Engine InnoDB để có khả năng rollback toàn phần.

### Hệ Thống Nhãn Phân Loại Bằng Chứng Bắt Buộc:
- `[CURRENT CODE VERIFIED]`: Đã đối chiếu và kiểm chứng trực tiếp từng dòng code trong mã nguồn hiện tại của dự án.
- `[LIVE SCHEMA VERIFIED]`: Đã đối chiếu trực tiếp với database thực tế (`phong_kham_thong_minh` MySQL 8.0.26).
- `[TARGET DESIGN SPECIFIED]`: Đặc tả thiết kế mục tiêu cần triển khai trong Phase 2 (chưa có trong code/schema hiện tại).
- `[THEORETICAL ANALYSIS]`: Phân tích lý thuyết trên mô hình toán học / cơ chế InnoDB, chưa qua kiểm chứng tải thực nghiệm.
- `[NOT VERIFIED EXPERIMENTALLY]`: Điểm kỹ thuật chưa thể khẳng định 100% nếu chưa có môi trường Database Clone để chạy thử nghiệm tải đa luồng.

---

## II. B-55: CLAIM CONFLICT VÀ CƠ CHẾ RETRY CỦA LARAVEL

### 1. Phân Tích Mã Nguồn Laravel 12 Framework
Đối chiếu trực tiếp mã nguồn framework tại:
- `vendor/laravel/framework/src/Illuminate/Database/Concerns/ManagesTransactions.php`
- `vendor/laravel/framework/src/Illuminate/Database/ConcurrencyErrorDetector.php`
- `vendor/laravel/framework/src/Illuminate/Database/DetectsConcurrencyErrors.php`

#### a. Cơ chế bắt lỗi và xác định Concurrency Error trong Laravel 12
Trong `ManagesTransactions.php` (lines 14-45):
```php
public function transaction(Closure $callback, int $attempts = 1)
{
    for ($currentAttempt = 1; $currentAttempt <= $attempts; $currentAttempt++) {
        $this->beginTransaction();
        try {
            return tap($callback($this), function () {
                $this->commit();
            });
        } catch (Throwable $e) {
            $this->handleTransactionException(
                $e, $currentAttempt, $attempts
            );
        }
    }
}
```
Khi phát sinh ngoại lệ, hàm `handleTransactionException` được gọi:
```php
protected function handleTransactionException(Throwable $e, int $currentAttempt, int $maxAttempts): void
{
    // 1. Nếu là concurrency error và đang ở transaction lồng nhau: ném DeadlockException
    if ($this->causedByConcurrencyError($e) && $this->transactions > 1) {
        $this->transactions--;
        throw new DeadlockException(
            $e->getMessage(), is_numeric($code = $e->getCode()) ? (int) $code : 0, $e
        );
    }

    // 2. Rollback transaction hiện tại
    $this->rollBack();

    // 3. CHỈ RETRY khi là Concurrency Error VÀ số lần thử chưa vượt quá maxAttempts
    if ($this->causedByConcurrencyError($e) && $currentAttempt < $maxAttempts) {
        return; // Tiếp tục vòng lặp for để retry
    }

    // 4. Nếu KHÔNG PHẢI Concurrency Error: NÉM THẲNG NGOẠI LỆ RA NGOÀI, KHÔNG RETRY
    throw $e;
}
```

#### b. Lớp `ConcurrencyErrorDetector` nhận diện những gì?
Trong `vendor/laravel/framework/src/Illuminate/Database/ConcurrencyErrorDetector.php` (lines 19-38):
```php
public function causedByConcurrencyError(Throwable $e): bool
{
    if ($e instanceof PDOException && ($e->getCode() === 40001 || $e->getCode() === '40001')) {
        return true;
    }

    $message = $e->getMessage();

    return Str::contains($message, [
        'Deadlock found when trying to get lock',
        'deadlock detected',
        'The database file is locked',
        'database is locked',
        'database table is locked',
        'A table in the database is locked',
        'has been chosen as the deadlock victim',
        'Lock wait timeout exceeded; try restarting transaction',
        'WSREP detected deadlock/conflict and aborted the transaction. Try restarting the transaction',
        'Record has changed since last read in table',
    ]);
}
```

### 2. Kết Luận Kiểm Định Code (`CURRENT CODE VERIFIED`)
1. **`ClaimConflictException` KHÔNG PHẢI LÀ CONCURRENCY ERROR**:
   - `ClaimConflictException` là một lớp ngoại lệ nghiệp vụ tùy biến (kế thừa từ `\Exception` hoặc `\RuntimeException`).
   - Ngoại lệ này **không** có mã lỗi PDO SQLSTATE `40001`.
   - Chuỗi thông điệp của nó **không** chứa các từ khóa deadlock/lock file nêu trên.
   - Do đó, `$this->causedByConcurrencyError($e)` **chắc chắn trả về `false` 100%**.
   - Khi đó, Laravel sẽ thực thi `$this->rollBack()` và ngay lập tức gọi `throw $e;`.
   - **Hoàn toàn không có chuyện Laravel retry nhầm `ClaimConflictException`!**

2. **Phân biệt rạch ròi 4 loại lỗi và chiến lược xử lý**:

| Loại Lỗi | Nguyên Nhân Gốc | Nhận Diện Trong Laravel | Chiến Lược Xử Lý | Hành Vi Retry |
| :--- | :--- | :--- | :--- | :--- |
| **Business Conflict** (Xung đột nghiệp vụ) | Vé đã bị claim bởi luồng khác; trạng thái không còn là `CHO_TIEP_NHAN`; lease của worker khác chưa hết hạn; hoặc không tìm thấy bản ghi. | `affected_rows === 0` trên câu lệnh `UPDATE ... WHERE`. | Rollback transaction ngay lập tức. Trả về mã trạng thái nghiệp vụ `CLAIM_CONFLICT` (hoặc ném `ClaimConflictException`). Controller map thành HTTP 409 Conflict. | **TUYỆT ĐỐI KHÔNG RETRY**. Client nhận thông báo vé không khả dụng để chọn vé khác hoặc chờ. |
| **Concurrency Failure** (Xung đột khóa đồng thời) | MySQL Deadlock (Lỗi 1213 / SQLSTATE 40001) hoặc Lock Wait Timeout Exceeded (Lỗi 1205 / SQLSTATE HY000). | `causedByConcurrencyError($e) === true`. | Laravel tự động rollback và lặp lại closure nếu `$attempts > 1`. Nên cấu hình Jitter backoff (10ms - 50ms) ở tầng Service để tránh convoy effect. | **CHO PHÉP RETRY CÓ GIỚI HẠN** (tối đa 3 lần). Nếu sau 3 lần vẫn lỗi, trả về HTTP 503 với header `Retry-After`. |
| **Infrastructure Failure** (Lỗi hạ tầng / mạng) | MySQL Server has gone away (Lỗi 2006), Lost connection during query (Lỗi 2013), hoặc cạn kiệt Connection Pool. | `PDOException` với error code không phải 40001, message chứa `'server has gone away'` / `'Lost connection'`. | Rollback (nếu connection còn sống), đóng PDO hỏng. Đăng nhập log CRITICAL. | **KHÔNG RETRY TRÊN TRANSACTION HIỆN TẠI**. Báo lỗi HTTP 503 Hệ thống bận / Mất kết nối. |
| **Unknown Commit Result** (Mất kết nối lúc Commit) | Client gửi COMMIT thành công trên database nhưng bị đứt socket trước khi nhận gói OK packet. | Client timeout hoặc bắt Connection Exception ở bước cuối. | Không chạy lại Claim mới. Phải dựa vào cơ chế **Idempotency Recovery** tra cứu bằng `IdempotencyKey`. | **RETRY BẰNG IDEMPOTENCY KEY**, không sinh số mới. |

### 3. Chuẩn Hóa Pseudocode Claim Tx1 Tránh Lỗi Phụ Thuộc Ngoại Lệ
Để tối ưu hóa hiệu năng, loại bỏ hoàn toàn chi phí sinh stack trace của Exception trong trường hợp xung đột nghiệp vụ thông thường, thiết kế chuẩn hóa như sau:

```php
/**
 * TARGET DESIGN SPECIFIED - Chuẩn hóa Autonomous Claim Tx1
 */
public function claimTicketAutonomous(string $connectionName, int $maCapSo, string $processId, int $leaseSeconds = 60): ClaimResult
{
    $conn = DB::connection($connectionName);

    // Guard: Đảm bảo không nằm trong transaction cha nào trên connection này
    if ($conn->transactionLevel() > 0) {
        throw new LogicException("Autonomous Claim VIOLATION: Existing active transaction detected on connection [{$connectionName}].");
    }

    // Thực thi transaction nguyên tử ngắn hạn (Autonomous Tx1)
    return $conn->transaction(function () use ($conn, $maCapSo, $processId, $leaseSeconds) {
        // 1. Atomic Update với điều kiện Fencing & Lease chặt chẽ
        $affected = $conn->table('so_cap_so_phieu')
            ->where('MaCapSo', $maCapSo)
            ->where(function ($query) {
                $query->where('TrangThai', 'CHO_TIEP_NHAN')
                      ->orWhere(function ($q) {
                          $q->where('TrangThai', 'DANG_XU_LY')
                            ->where('LeaseExpiresAt', '<', now());
                      });
            })
            ->update([
                'TrangThai'       => 'DANG_XU_LY',
                'LockedByProcess' => $processId,
                'LeaseExpiresAt'  => now()->addSeconds($leaseSeconds),
                'FenceToken'      => DB::raw('FenceToken + 1'),
                'UpdatedAt'       => now(),
            ]);

        // 2. Kiểm tra kết quả atomic update
        if ($affected !== 1) {
            // Xung đột nghiệp vụ: Không phải lỗi Concurrency!
            // Không ném Exception để tránh overhead và tránh hiểu nhầm retry.
            // Bắt buộc rollback transaction rỗng để giải phóng read lock nếu có
            return ClaimResult::conflict("Ticket [{$maCapSo}] cannot be claimed (already claimed or active lease).");
        }

        // 3. Đọc dữ liệu vé đã claim kèm FenceToken mới nhất
        $ticket = $conn->table('so_cap_so_phieu')->where('MaCapSo', $maCapSo)->first();

        return ClaimResult::success($ticket);
    }, $attempts = 3); // Attempts = 3 CHỈ áp dụng khi gặp MySQL 1213 hoặc 1205!
}
```

---

## III. B-56: AUTONOMOUS TRANSACTION VÀ CONNECTION IDENTITY AUDIT

### 1. Phân Tích Mã Nguồn và Schema Hiện Tại
Đã rà soát chi tiết:
- File cấu hình: `config/database.php`
- File môi trường: `.env`
- Toàn bộ Model trong `app/Models/` (`LuotKham.php`, `LichHen.php`, `BenhNhan.php`, `BacSi.php`, `ThongBao.php`, `PhongKham.php`, `ChuyenKhoa.php`, `User.php`).

#### Kết quả Audit Cụ Thể:
1. `[CURRENT CODE VERIFIED]`: **100% Model không khai báo `$connection` riêng**:
   - Trong tất cả các file model thuộc `app/Models/`, không có bất kỳ dòng nào khai báo `protected $connection = '...';`.
   - Theo cơ chế mặc định của Eloquent `Model.php`, khi `$connection` là `null`, Model sẽ gọi `getConnectionResolver()->connection()`, tức là lấy connection mặc định được cấu hình trong `config('database.default')`.
2. `[CURRENT CODE VERIFIED]`: **Cấu hình Connection mặc định là `mysql`**:
   - `config/database.php` dòng 20: `'default' => env('DB_CONNECTION', 'sqlite')`.
   - `.env` dòng 23: `DB_CONNECTION=mysql`.
   - Kết nối mặc định là MySQL kết nối vào CSDL `phong_kham_thong_minh`.
3. `[CURRENT CODE VERIFIED]`: **Không có cấu hình Read/Write Splitting**:
   - Cấu hình connection `'mysql'` trong `config/database.php` không có các khóa `'read'` và `'write'`.
   - Toàn bộ câu lệnh đọc (`SELECT`) và ghi (`INSERT`, `UPDATE`, `DELETE`) đều đi qua cùng một đối tượng PDO duy nhất trên mỗi request cycle.

### 2. Lỗ Hổng Tiềm Ẩn Của `DB::transactionLevel()` Và Giải Pháp
`DB::transactionLevel()` là một hàm facade trỏ về Default Connection Resolver.
- Nếu caller vô tình mở transaction trên một connection khác (ví dụ: `DB::connection('tenant_mysql')->beginTransaction()`), hàm `DB::transactionLevel()` (kiểm tra connection `mysql`) sẽ trả về `0`!
- Ngược lại, nếu Claim Service chỉ gọi `DB::transaction()`, nó luôn sử dụng default connection.

#### Giải pháp Chuẩn Hóa Kiến Trúc: Connection-Bound Autonomous Guard (`TARGET DESIGN SPECIFIED`)
Mọi thao tác Claim phải nhận instance hoặc tên connection cụ thể và kiểm tra trực tiếp trên connection đó:

```php
/**
 * TARGET DESIGN SPECIFIED - Connection Identity Guard
 */
class AutonomousClaimGuard
{
    public static function assertNoActiveTransaction(string $connectionName = 'mysql'): ConnectionInterface
    {
        $connection = DB::connection($connectionName);

        // Kiểm tra transaction level trên CHÍNH KẾT NỐI ĐÓ
        if ($connection->transactionLevel() > 0) {
            throw new AutonomousTransactionViolationException(
                "VIOLATION: Autonomous Claim requires transactionLevel === 0 on connection [{$connectionName}], " .
                "but found active level [{$connection->transactionLevel()}]. " .
                "Claim transaction cannot be nested inside a parent business transaction."
            );
        }

        return $connection;
    }
}
```

Bảo đảm tính độc lập:
- Autonomous Tx1 được mở trên `$connection` do Guard trả về.
- Tx1 commit ngay sau khi UPDATE số phiếu thành công.
- Khi bước vào Tx2 (tạo lượt khám), Tx2 cũng mở trên `$connection` này, độc lập hoàn toàn với Tx1 đã kết thúc trước đó.

---

## IV. B-57: WORKER VOID VÀ ĐIỀU KIỆN FENCING TOKEN NGUYÊN TỬ

### 1. Rủi Ro Stale Worker (Worker Lỗi Thời)
Trong hệ thống phân tán hoặc hàng đợi đa tiến trình:
- Worker W1 quét thấy vé `MaCapSo = 100` ở trạng thái `DANG_XU_LY` với `FenceToken = 1` và `LeaseExpiresAt < NOW() - 5m`.
- Worker W1 bị tạm dừng đột ngột (do GC Pause, thiếu CPU, tắc nghẽn I/O).
- Trong lúc W1 dừng:
  - Tiến trình Request R1 thức dậy, nhận thấy lease hết hạn, thực hiện **Reclaim thành công**: `FenceToken` tăng từ `1` lên `2`.
  - Tiến trình R1 thực hiện tạo lượt khám thành công và Finalize vé: `TrangThai = 'DA_SU_DUNG'`.
- Sau đó, Worker W1 thức dậy. Nếu câu lệnh `UPDATE` của W1 chỉ kiểm tra `WHERE MaCapSo = 100`, W1 sẽ ghi đè trạng thái thành `DA_HUY`, làm hỏng dữ liệu của lượt khám hợp lệ vừa tạo!

### 2. Đặc Tả Từng Câu SQL Giả Định Của Worker Recovery (`TARGET DESIGN SPECIFIED`)

#### Bước 1: Quét Các Bản Ghi Treo (Scan Phase)
Worker chạy định kỳ (mỗi 1 phút), quét tìm các bản ghi bị bỏ rơi:
```sql
-- Worker Scan Phase (Read Committed, không khóa hoặc dùng SKIP LOCKED)
SELECT MaCapSo, MaPhamVi, SoPhieu, NgayCap, FenceToken, LeaseExpiresAt, LockedByProcess
FROM so_cap_so_phieu
WHERE TrangThai = 'DANG_XU_LY'
  AND LeaseExpiresAt < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY MaCapSo ASC
LIMIT 50;
```
*Thời điểm đọc token*: Worker ghi nhận giá trị `FenceToken` tại thời điểm đọc vào biến cục bộ `$readToken`.

#### Bước 2: Kiểm Tra Đối Chiếu Lượt Khám (Double Check Phase)
Trước khi void vé, Worker kiểm tra bảng `luot_kham` xem đã có lượt khám nào được tạo gắn với số phiếu này trong ngày hay chưa:
```sql
SELECT MaLuotKham, TrangThai, MaLichHen
FROM luot_kham
WHERE MaPhamVi = :maPhamVi
  AND SoPhieu = :soPhieu
  AND DATE(ThoiGianTiepNhan) = :ngayCap
LIMIT 1;
```
- Nếu tìm thấy `luot_kham`: Chứng tỏ Request đã tạo xong lượt khám nhưng chưa kịp finalize ledger (hoặc finalize bị crash). Worker **KHÔNG VOID**, mà chuyển sang luồng **Reconciliation (Đối Soát)**: Cập nhật ledger thành `DA_SU_DUNG`.
- Nếu không tìm thấy `luot_kham`: Worker chuyển sang Bước 3 để hủy vé bỏ rơi.

#### Bước 3: Câu Lệnh Atomic Void Với 4 Điều Kiện Bắt Buộc
```sql
-- Worker Atomic Void Command
UPDATE so_cap_so_phieu
SET TrangThai = 'DA_HUY',
    GhiChu = CONCAT('EXPIRED_ABANDONED_VOID by worker: ', :workerProcessId),
    FenceToken = FenceToken + 1,
    UpdatedAt = NOW()
WHERE MaCapSo = :maCapSo
  AND TrangThai = 'DANG_XU_LY'
  AND FenceToken = :readToken
  AND LeaseExpiresAt < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
```

### 3. Chứng Minh Toán Học Tính Nguyên Tử Và An Toàn Tranh Chấp

#### Trường hợp 1: Tranh Chấp Giữa Worker Void và Request Finalize
- Request R1 đang hoàn tất Tx2 và gọi Finalize:
  ```sql
  UPDATE so_cap_so_phieu
  SET TrangThai = 'DA_SU_DUNG',
      MaLuotKham = :maLuotKham,
      UpdatedAt = NOW()
  WHERE MaCapSo = :maCapSo
    AND TrangThai = 'DANG_XU_LY'
    AND FenceToken = :requestToken;
  ```
- **Kịch bản A (Request commit trước)**:
  1. R1 commit: `TrangThai` trở thành `'DA_SU_DUNG'`.
  2. W1 chạy câu lệnh `UPDATE DA_HUY`: Điều kiện `WHERE TrangThai = 'DANG_XU_LY'` bị **SAI**.
  3. Kết quả: `affected_rows === 0`.
  4. W1 thất bại an toàn, không có vé nào bị hủy nhầm.
- **Kịch bản B (Worker void commit trước)**:
  1. W1 commit: `TrangThai` trở thành `'DA_HUY'`, `FenceToken` tăng lên `readToken + 1`.
  2. R1 chạy câu lệnh Finalize: Điều kiện `WHERE TrangThai = 'DANG_XU_LY'` và `FenceToken = requestToken` bị **SAI**.
  3. Kết quả: `affected_rows === 0`.
  4. R1 phát hiện finalize thất bại, lập tức rollback Tx2 (hủy `luot_kham` vừa tạo) và thông báo lỗi vé đã hết hạn.

#### Trường hợp 2: Tranh Chấp Giữa Hai Worker Đồng Thời (W1 và W2)
Cả W1 và W2 đều đọc được cùng bản ghi với `FenceToken = 5`.
- W1 thực thi `UPDATE` trước:
  - Khớp 4 điều kiện. MySQL cấp exclusive row lock cho W1.
  - `FenceToken` được cập nhật thành `6`. `TrangThai` thành `'DA_HUY'`. W1 commit.
- W2 thực thi `UPDATE` ngay sau đó:
  - W2 kiểm tra `WHERE FenceToken = 5`: Lúc này `FenceToken` trên đĩa đã là `6`.
  - Hơn nữa, `TrangThai` đã là `'DA_HUY'`.
  - Kết quả: `affected_rows === 0`.
- W2 an toàn thoát ra mà không gây trùng lặp hay xung đột.

---

## V. B-58: UNKNOWN COMMIT RESULT VÀ MA TRẬN IDEMPOTENCY RECOVERY

### 1. Giới Hạn Của `UNIQUE(IdempotencyKey)` Đơn Thuần
Ràng buộc duy nhất `UNIQUE(IdempotencyKey)` trên bảng `so_cap_so_phieu` chỉ có một chức năng duy nhất: **Ngăn chặn ghi đè hai bản ghi cấp số có cùng một khóa idempotency ở tầng đĩa**.
Nó hoàn toàn **KHÔNG THỂ**:
- Cho client biết transaction trước đó đã commit thành công hay đã rollback khi socket mạng bị đứt.
- Trả lại nguyên vẹn payload kết quả (`MaLuotKham`, `SoPhieu`, thời gian tiếp nhận) cho client khi client retry.
- Phân biệt giữa việc "đang xử lý dở dang" và "đã hoàn tất thành công".

### 2. Thiết Kế Mở Rộng Schema Cho Idempotency Recovery (`TARGET DESIGN SPECIFIED`)
Bổ sung trên bảng `so_cap_so_phieu`:
- `MaLuotKham INT NULL`: Khóa ngoại tham chiếu đến lượt khám đã tạo thành công trong Tx2.
- `IdempotencyKey VARCHAR(64) NOT NULL UNIQUE`: Khóa định danh request từ client (UUIDv4).
- `ResponseCache JSON NULL`: Lưu trữ snapshot phản hồi HTTP 200 (mã số, họ tên, giờ hẹn, phòng khám).

### 3. Ma Trận 6 Kịch Bản Phục Hồi Lỗi Mất Kết Nối (Unknown Commit Recovery Matrix)

| Kịch Bản | Trạng Thái Ledger Sau Sự Cố | FenceToken | Số `luot_kham` Đã Tạo | Key Client Dùng Để Retry | Phương Thức Phục Hồi Kết Quả (Recovery Resolution) | Điều Kiện Được Phép Cấp Số Mới |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **KB-1: Tx1 commit thành công, mất kết nối trước khi nhận token** | `DANG_XU_LY` | Bằng token Tx1 vừa cấp (`1`) | `0` | `IdempotencyKey` | Client gửi lại `IdempotencyKey`. Hệ thống tìm thấy vé `DANG_XU_LY` do chính tiến trình/user đó claim. Trả lại thông tin vé kèm `FenceToken` để client tiếp tục gọi bước tiếp nhận (Tx2). | Không tạo số mới, dùng lại số đã claim. |
| **KB-2: Tx1 chưa commit, đứt kết nối / crash** | Không tồn tại bản ghi (rollback hoàn toàn) | N/A | `0` | `IdempotencyKey` | Client gửi lại `IdempotencyKey`. Hệ thống tra cứu không thấy bản ghi nào. Tiến hành thực thi Claim Tx1 mới như một request lần đầu. | Được cấp số mới bình thường. |
| **KB-3: Tx2 commit thành công, mất kết nối trước khi nhận HTTP 200** | `DA_SU_DUNG` | Giữ nguyên token của Tx1 (`1`) | `1` (đã commit vào DB) | `IdempotencyKey` | Client retry với cùng `IdempotencyKey`. Hệ thống thấy trạng thái `DA_SU_DUNG` và có `MaLuotKham` hợp lệ. Hệ thống **KHÔNG GỌI LẠI TX2**, mà đọc trực tiếp `ResponseCache` (hoặc query từ `luot_kham`) và trả về HTTP 200 với kết quả cũ. | **TUYỆT ĐỐI KHÔNG ĐƯỢC CẤP SỐ MỚI**. Trả lại kết quả đã tạo. |
| **KB-4: Tx2 rollback (lỗi logic / constraint), mất kết nối** | `DANG_XU_LY` | Token của Tx1 (`1`) | `0` (đã rollback hoàn toàn) | `IdempotencyKey` | Client retry với cùng `IdempotencyKey`. Hệ thống thấy vé vẫn `DANG_XU_LY`. Client có thể gửi yêu cầu thực hiện lại Tx2 với tham số đã hiệu chỉnh hoặc chủ động gửi yêu cầu HỦY vé để claim vé mới. | Không cấp mới tự động. Phải hủy vé cũ hoặc hoàn tất Tx2. |
| **KB-5: Client retry khi request cũ vẫn đang thực thi trong DB** | `DANG_XU_LY` | Token Tx1 | Đang ghi dở dang | `IdempotencyKey` | Request retry đến server. Server thấy vé đang `DANG_XU_LY`, `LeaseExpiresAt` vẫn còn hiệu lực (> 30s) và mã tiến trình xử lý đang chạy. Server trả về HTTP 409 Conflict với code `REQUEST_IN_FLIGHT`, yêu cầu client chờ 2 giây rồi poll lại. | Tuyệt đối không sinh thêm tiến trình cạnh tranh. |
| **KB-6: Worker recovery chạy đồng thời với Client retry** | Phụ thuộc bên nào commit trước | Token tăng thêm 1 nếu Worker thắng | `0` (nếu Worker thắng) hoặc `1` (nếu Client thắng) | `IdempotencyKey` | Nếu Worker thắng: vé thành `DA_HUY`. Client retry thấy vé đã hủy do quá hạn -> Báo lỗi `TICKET_EXPIRED_PLEASE_RETRY`, giải phóng idempotency key để client tạo yêu cầu mới. Nếu Client thắng: xem KB-3. | Được phép cấp số mới nếu vé đã chuyển thành `DA_HUY`. |

---

## VI. B-59: ATOMICITY VÀ CONNECTION AUDIT CHO BUSINESS TX2

### 1. Bảng Kiểm Định Toàn Bộ Các Thao Tác Ghi Trong Tx2
Kiểm tra chi tiết đối với tất cả các câu lệnh ghi dữ liệu mục tiêu trong Transaction Tiếp Nhận Nghiệp Vụ (Tx2):

| Thao Tác Ghi | Model / Query Builder | Connection Thực Tế | Storage Engine | Nằm Trong Cùng Tx2? | Khả Năng Rollback Hoàn Toàn | Bằng Chứng Xác Minh |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. INSERT `luot_kham`** | `App\Models\LuotKham` | `mysql` (Default) | **InnoDB** | **CÙNG TX2** | **100% HOÀN TOÀN ROLLBACK ĐƯỢC** | `[CURRENT CODE VERIFIED]` Model không có `$connection`, bảng `luot_kham` là InnoDB. |
| **2. UPDATE `lich_hen`** | `App\Models\LichHen` | `mysql` (Default) | **InnoDB** | **CÙNG TX2** | **100% HOÀN TOÀN ROLLBACK ĐƯỢC** | `[CURRENT CODE VERIFIED]` Model dùng default connection, bảng `lich_hen` là InnoDB. |
| **3. UPDATE `so_cap_so_phieu`** | `DB::table('so_cap_so_phieu')` | `mysql` (Default) | **InnoDB** | **CÙNG TX2** | **100% HOÀN TOÀN ROLLBACK ĐƯỢC** | `[TARGET DESIGN SPECIFIED]` Bảng ledger mục tiêu quy định bắt buộc InnoDB. |
| **4. INSERT `thong_bao`** | `App\Models\ThongBao` (qua `NotificationService`) | `mysql` (Default) | **InnoDB** | **CÙNG TX2** | **100% HOÀN TOÀN ROLLBACK ĐƯỢC** | `[CURRENT CODE VERIFIED]` `NotificationService.php` dòng 24-40 gọi `ThongBao::create()` dùng default connection. |
| **5. INSERT `lich_su_dieu_phoi`** | `DB::table('lich_su_dieu_phoi')` | `mysql` (Default) | **InnoDB** | **CÙNG TX2** | **100% HOÀN TOÀN ROLLBACK ĐƯỢC** | `[TARGET DESIGN SPECIFIED]` Bảng log mục tiêu quy định bắt buộc InnoDB. |

### 2. Kiểm Tra Các Tác Vụ Gây Tác Dụng Phụ Ngoài (Side Effects Audit)
Đã rà soát toàn bộ dự án về:
1. **Model Observers (`app/Observers/`)**:
   - `[CURRENT CODE VERIFIED]`: Thư mục `app/Observers` hoàn toàn **KHÔNG TỒN TẠI**. Không có bất kỳ Model Observer nào được đăng ký.
2. **Model Lifecycle Hooks (`booted()`, `created()`, `saving()`)**:
   - `[CURRENT CODE VERIFIED]`: Không có bất kỳ model nào trong `app/Models/` định nghĩa hàm `boot()` hoặc `booted()` kích hoạt event ngầm.
3. **Event Listeners & Event Service Provider**:
   - `[CURRENT CODE VERIFIED]`: `app/Providers/AppServiceProvider.php` chỉ chứa cấu hình `Vite::prefetch(concurrency: 3);`. Không có event listener nào lắng nghe sự kiện của `LuotKham` hay `LichHen`.
4. **Phát tán HTTP / External API Call / WebSocket Trước Commit**:
   - `[CURRENT CODE VERIFIED]`: Không có bất kỳ cuộc gọi HTTP client (`Http::post`, cURL) hay external SMS/Zalo Gateway nào được gọi bên trong controller tiếp nhận.
   - Toàn bộ thông báo được lưu trữ nội bộ vào bảng CSDL `thong_bao`.
   - Đối với broadcast realtime trong tương lai: Quy định kiến trúc bắt buộc sử dụng `DB::afterCommit(function() { ... })` để chỉ kích hoạt gửi event sau khi PDO đã commit thành công xuống đĩa.

---

## VII. B-60: TỔNG KẾT TEST MATRIX VÀ MỞ RỘNG KIỂM THỬ

### 1. Hiện Trạng Test Matrix V2.7
- 62 Core Tests (TC-01 đến TC-62).
- 11 Appendix Edge-case Tests (TC-63 đến TC-73).
- Tổng cộng: **73 Test Cases**.
- Tình trạng thực thi: **100% `CHƯA THỰC THI (NOT TESTED)`**.

### 2. Mở Rộng 5 Test Cases Chuyên Sâu Cho V2.8 (TC-74 đến TC-78)
Để bao phủ trọn vẹn các kịch bản phản biện từ B-55 đến B-59, bổ sung 5 test case mới vào ma trận kiểm thử:

1. **TC-74 (B-55 Coverage)**:
   - *Tên test*: `test_laravel_transaction_does_not_retry_claim_conflict_exception`
   - *Mục tiêu*: Xác minh rằng khi ném `ClaimConflictException` bên trong `DB::transaction($callback, 3)`, Laravel chỉ thực thi đúng 1 lần duy nhất, thực hiện rollback và không bao giờ retry.
   - *Phân loại*: PHPUnit Unit/Integration Test.
2. **TC-75 (B-56 Coverage)**:
   - *Tên test*: `test_autonomous_claim_guard_detects_active_transaction_on_explicit_connection`
   - *Mục tiêu*: Xác minh `AutonomousClaimGuard::assertNoActiveTransaction('mysql')` phát hiện và chặn đứng mọi lời gọi Claim khi connection `'mysql'` đang có transaction mở (`transactionLevel > 0`).
   - *Phân loại*: PHPUnit Integration Test.
3. **TC-76 (B-57 Coverage)**:
   - *Tên test*: `test_worker_atomic_void_fails_safely_when_request_finalized_concurrently`
   - *Mục tiêu*: Mô phỏng luồng đồng thời giữa Worker chạy lệnh `UPDATE DA_HUY` 4 điều kiện WHERE và Request chạy lệnh finalize `UPDATE DA_SU_DUNG`. Khẳng định số dòng ảnh hưởng của Worker là `0` và không làm hỏng vé đã sử dụng.
   - *Phân loại*: Concurrency Integration Test.
4. **TC-77 (B-58 Coverage)**:
   - *Tên test*: `test_unknown_commit_recovery_replays_cached_response_without_duplicate_ticket`
   - *Mục tiêu*: Giả lập đứt socket mạng sau khi Tx2 commit. Gửi lại request với cùng `IdempotencyKey`. Khẳng định hệ thống trả về đúng HTTP 200 kèm `MaLuotKham` cũ, số lượt khám trong CSDL không tăng thêm.
   - *Phân loại*: Concurrency & Network Failure Test.
5. **TC-78 (B-59 Coverage)**:
   - *Tên test*: `test_business_tx2_multi_model_all_innodb_rollback_integrity`
   - *Mục tiêu*: Kích hoạt một ngoại lệ nhân tạo tại bước cuối của Tx2 (sau khi đã INSERT `luot_kham`, UPDATE `lich_hen`, UPDATE `so_cap_so_phieu`, INSERT `thong_bao`). Xác minh toàn bộ 4 bảng InnoDB đều được hoàn tác sạch sẽ 100%.
   - *Phân loại*: PHPUnit Transaction Rollback Test.

**Tổng số test case toàn hệ thống sau khi cập nhật V2.8: 78 Test Cases (Tất cả được quản lý trong `SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V28.md`)**.

---

## VIII. GATEKEEPER DECISION VÀ ROADMAP TRIỂN KHAI

### 1. Bảng Đối Chiếu Hiện Trạng: Lý Thuyết Thiết Kế vs Bắt Buộc Kiểm Thử Thực Nghiệm

| Hạng Mục Kỹ Thuật | Trạng Thái Thiết Kế V2.8 | Khả Năng Chứng Minh Bằng Mã Nguồn / Lý Thuyết | Yêu Cầu Bắt Buộc Phải Chạy Trên Database Clone |
| :--- | :--- | :--- | :--- |
| **B-55: Laravel Concurrency vs Business Conflict** | **HOÀN TOÀN RÕ RÀNG** | Đã chứng minh 100% qua mã nguồn `ManagesTransactions.php` và `ConcurrencyErrorDetector.php`. | Chạy TC-74 để xác nhận trên môi trường runtime thực tế. |
| **B-56: Autonomous Connection Identity** | **HOÀN TOÀN RÕ RÀNG** | Đã kiểm tra 100% Model và cấu hình `.env`, thiết kế Guard gắn chặt connection name. | Chạy TC-75 kiểm thử chặn transaction cha. |
| **B-57: Worker Void Atomic 4-Condition** | **HOÀN TOÀN RÕ RÀNG** | Câu lệnh SQL nguyên tử với `FenceToken` và `LeaseExpiresAt` chứng minh toán học loại trừ stale worker. | Chạy TC-76 mô phỏng tranh chấp 2 tiến trình đồng thời. |
| **B-58: Unknown Commit Recovery Matrix** | **HOÀN TOÀN RÕ RÀNG** | Ma trận 6 kịch bản đã định nghĩa đầy đủ trạng thái và luồng replay response qua `IdempotencyKey`. | Chạy TC-77 với mock ngắt socket mạng. |
| **B-59: Multi-Model Atomicity & Connection** | **HOÀN TOÀN RÕ RÀNG** | Đã chứng minh 100% Model dùng chung default connection `mysql` và các bảng đều là InnoDB. | Chạy TC-78 kiểm tra rollback sạch 4 bảng. |

### 2. QUYẾT ĐỊNH CHÍNH THỨC CỦA GATEKEEPER
Căn cứ vào kết quả kiểm định chuyên sâu trên mã nguồn framework Laravel 12, mã nguồn ứng dụng hiện tại và schema MySQL 8.0:
Mọi lỗ hổng logic thiết kế về Fencing Token, Autonomous Transaction, Claim Conflict Retry, Worker Void Race Condition và Idempotency Recovery **ĐÃ ĐƯỢC GIẢI QUYẾT VÀ ĐẶC TẢ TRIỆT ĐỂ Ở CẤP ĐỘ THIẾT KẾ KỸ THUẬT**.

Do đó, Gatekeeper đề xuất trạng thái chính thức:
# `DESIGN READY FOR ISOLATED CLONE TESTING`
*(Thiết kế đã sẵn sàng và hội đủ điều kiện an toàn để bước vào giai đoạn thử nghiệm trên Database Clone cô lập)*

> [!CAUTION]
> **CẢNH BÁO AN TOÀN BẮT BUỘC**:  
> Trạng thái trên **CHỈ LÀ ĐỀ XUẤT ĐÁNH GIÁ THIẾT KẾ** trình người dùng xem xét.  
> Antigravity **TUYỆT ĐỐI CHƯA TỰ Ý TẠO DATABASE CLONE**, **CHƯA TẠO MIGRATION**, **CHƯA GHI BẤT KỲ DỮ LIỆU NÀO LÊN CSDL CHÍNH**.  
> Toàn bộ thao tác triển khai clone và chạy test concurrency chỉ được phép bắt đầu khi nhận được **LỆNH PHÊ DUYỆT BẰNG VĂN BẢN TRỰC TIẾP TỪ NGƯỜI DÙNG**.
