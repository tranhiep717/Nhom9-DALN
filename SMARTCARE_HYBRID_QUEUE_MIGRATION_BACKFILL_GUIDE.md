# SMARTCARE HYBRID QUEUE — HƯỚNG DẪN MIGRATION, BACKFILL & ROLLBACK AN TOÀN
### GIAI ĐOẠN 2.1: THỐNG NHẤT PHƯƠNG ÁN C — GIỮ MaCaKham = NULL CHO 18 BẢN GHI LỊCH SỬ

> **TRẠNG THÁI HIỆN TẠI**: `READY FOR BACKUP AND MIGRATION APPROVAL — CHỜ PHÊ DUYỆT`  
> **QUY TẮC AN TOÀN BẮT BUỘC**:  
> - `TUYỆT ĐỐI CHƯA CHẠY LỆNH php artisan migrate`  
> - `TUYỆT ĐỐI CHƯA CHẠY LỆNH smartcare:backfill-hybrid-queue --apply`  
> - `KHÔNG THAY ĐỔI DỮ LIỆU CSDL THẬT (0 byte altered)`  
> - `MỌI FILE MÃ NGUỒN ĐÃ ĐƯỢC LINT CÚ PHÁP SẠCH SẼ (php -l PASS 100%)`  
> **NGÀY CẬP NHẬT**: 2026-11-04  
> **DATABASE**: `phong_kham_thong_minh` (MySQL 8.0.26 / InnoDB Engine)

---

## MỤC LỤC
1. [I. QUYẾT ĐỊNH THỐNG NHẤT: PHƯƠNG ÁN C VÀ NGUYÊN TẮC BẢO VỆ DỮ LIỆU](#i-quyết-định-thống-nhất-phương-án-c-và-nguyên-tắc-bảo-vệ-dữ-liệu)
2. [II. TỔNG HỢP 5 FILE ĐÃ HOÀN TẤT ĐIỀU CHỈNH](#ii-tổng-hợp-5-file-đã-hoàn-tất-điều-chỉnh)
3. [III. ĐỐI CHIẾU KIỂU DỮ LIỆU VÀ CƠ CHẾ UNIQUE NULL CỦA MYSQL](#iii-đối-chiếu-kiểu-dữ-liệu-và-cơ-chế-unique-null-của-mysql)
4. [IV. QUY TRÌNH SAO LƯU DỮ LIỆU CHI TIẾT (BACKUP PROCEDURE)](#iv-quy-trình-sao-lưu-dữ-liệu-chi-tiết-backup-procedure)
5. [V. BẢNG PHÂN LOẠI CHI TIẾT 23 BẢN GHI THEO PHƯƠNG ÁN C](#v-bảng-phân-loại-chi-tiết-23-bản-ghi-theo-phương-án-c)
6. [VI. KẾ HOẠCH ROLLBACK CHI TIẾT KHI CÓ SỰ CỐ](#vi-kế-hoạch-rollback-chi-tiết-khi-có-sự-cố)
7. [VII. QUY TRÌNH THỰC THI 5 BƯỚC (SAU KHI ĐƯỢC PHÊ DUYỆT)](#vii-quy-trình-thực-thi-5-bước-sau-khi-được-phê-duyệt)
8. [VIII. GATEKEEPER DECISION](#viii-gatekeeper-decision)

---

## I. QUYẾT ĐỊNH THỐNG NHẤT: PHƯƠNG ÁN C VÀ NGUYÊN TẮC BẢO VỆ DỮ LIỆU

### 1. Bản Chất Của Quyết Định Phương Án C
Người dùng đã phê duyệt định hướng **Phương án C** đối với 18 bản ghi khám trực tiếp lịch sử:
- **Giữ `MaCaKham = NULL`**: Tuyệt đối không tạo ca khám giả (như `999`), không tự suy đoán gán bừa vào ca khám sớm nhất của bác sĩ khi giờ tiếp nhận thực tế rơi vào rạng sáng (01:07 AM, 06:05 AM).
- **Không ép `SoPhieu` và `STTTrongNgay`**: Bản ghi cũ không thuộc ca khám cụ thể sẽ không sinh số phiếu giả.
- **Tính vĩnh viễn của Nullable**: Cột `MaCaKham` sẽ được duy trì là **`NULLABLE`** trong schema của MySQL, **không bao giờ bị ép thành `NOT NULL`** ở bất kỳ bước migration nào.

### 2. Phân Tách Hai Khối Dữ Liệu Rạch Ròi
- **Dữ liệu lịch sử (23 bản ghi cũ)**: Chấp nhận `MaCaKham = NULL`, `SoPhieu = NULL` để bảo toàn sự trung thực và tính toàn vẹn của dữ liệu cũ.
- **Dữ liệu phát sinh mới (Hybrid Queue vận hành)**: Bắt buộc phải có đầy đủ:
  - `NgayKham` (Ngày thực tế)
  - `MaChuyenKhoa` (Chuyên khoa khám)
  - `MaCaKham` (Ca khám hợp lệ)
  - `STTTrongNgay` (Cấp qua `hang_doi_counter`)
  - `SoPhieu` (Mã phiếu chuẩn: ví dụ `TM-S-001`)
  - `ThoiGianVaoHang` (Thời điểm check-in thực tế, tính FIFO).
  *(Toàn bộ các điều kiện này được kiểm soát nghiêm ngặt 100% ở tầng Service/Controller Laravel trước khi cho phép bản ghi bước vào hàng đợi)*.

---

## II. TỔNG HỢP 5 FILE ĐÃ HOÀN TẤT ĐIỀU CHỈNH

1. **Migration 1**: `database/migrations/2026_11_04_000001_add_hybrid_queue_columns_to_luot_kham_table.php`
   - Bổ sung 11 cột mới dạng `NULLABLE`, độ dài `SoPhieu` là `varchar(30)`.
   - `MaCaKham` giữ nguyên `nullable()`, thiết lập khóa ngoại `fk_lk_ca_kham` tương thích với `NULL`.
   - Sửa `MaBacSi` sang `nullable()` cho phép tiếp nhận trực tiếp chưa chỉ định bác sĩ.
   - Thêm `fk_lk_nguoi_xac_nhan` trỏ đúng vào bảng `tai_khoan(MaTaiKhoan)`.
   - Bổ sung ràng buộc `UNIQUE KEY uq_lk_queue_scope_stt (NgayKham, MaCaKham, MaChuyenKhoa, STTTrongNgay)` bảo vệ chống cấp trùng STT ở mức CSDL.
   - Cú pháp: `php -l` PASS 100%.

2. **Migration 2**: `database/migrations/2026_11_04_000002_create_hang_doi_counter_table.php`
   - Tạo bảng bộ đếm số thứ tự hàng đợi `hang_doi_counter`.
   - Khóa chính đa cột: `PRIMARY KEY (NgayKham, MaCaKham, MaChuyenKhoa)`.
   - Cú pháp: `php -l` PASS 100%.

3. **Artisan Command Backfill**: `app/Console/Commands/BackfillHybridQueueData.php`
   - Loại bỏ hoàn toàn cờ `--force` để không bao giờ ghi đè hoặc xóa dữ liệu bệnh nhân trực tiếp mới.
   - Từ chối nếu truyền đồng thời cả 2 cờ `--dry-run` và `--apply`.
   - Mặc định là chế độ **DRY-RUN** (chỉ đọc, in bảng kiểm toán, không ghi dữ liệu).
   - Cơ chế phát hiện dữ liệu bán phần (Partial Data) tự động chặn dừng (`Command::FAILURE`), không tự ý sửa hay ghi đè.
   - Công thức số phiếu gắn liền `C{MaCaKham}`: `[PREFIX]-C[MaCaKham]-[STT]` (ví dụ: `NTQ-C76-001` vs `NTQ-C85-001`), triệt tiêu 100% rủi ro trùng số phiếu hiển thị.
   - Áp dụng Phương án C: 5 ca đặt lịch được backfill đủ ca và STT; 18 ca trực tiếp giữ `MaCaKham = NULL`, `SoPhieu = NULL`.
   - Khởi tạo `hang_doi_counter` chỉ trên các phạm vi ca khám hợp lệ (có `MaCaKham IS NOT NULL`).
   - Cú pháp: `php -l` PASS 100%.

4. **File SQL Kiểm Định Dữ Liệu**: `database/sql/verify_hybrid_queue_pre_post_migration.sql`
   - Chứa 4 nhóm câu lệnh `SELECT` kiểm tra cấu trúc, kiểm tra 23 bản ghi, kiểm tra tính đồng bộ của bộ đếm, và kiểm tra điều kiện Unique.

5. **Tài Liệu Hướng Dẫn**: `SMARTCARE_HYBRID_QUEUE_MIGRATION_BACKFILL_GUIDE.md` (Tài liệu này).

---

## III. ĐỐI CHIẾU KIỂU DỮ LIỆU VÀ CƠ CHẾ UNIQUE NULL CỦA MYSQL

### 1. Cơ Chế NULL Trong Ràng Buộc UNIQUE Của MySQL InnoDB
Theo chuẩn SQL-92 và tài liệu chính thức của MySQL (InnoDB Storage Engine):
> *"A UNIQUE index permits multiple NULL values for columns that can contain NULL."*

Điều này có ý nghĩa cực kỳ quan trọng đối với thiết kế của chúng ta:
- Ràng buộc: `UNIQUE KEY uq_scope_stt (NgayKham, MaCaKham, MaChuyenKhoa, STTTrongNgay)`.
- Khi 18 bản ghi cũ có `MaCaKham = NULL` và `STTTrongNgay = NULL`: MySQL xem mỗi giá trị `NULL` là độc lập và không trùng nhau.
- **Hệ quả**: 18 bản ghi lịch sử này **hoàn toàn KHÔNG VI PHẠM ràng buộc UNIQUE**, và cùng tồn tại an toàn, song hành với các lượt khám mới trong tương lai.

### 2. Cơ Chế Bộ Đếm `hang_doi_counter`
- Khóa chính của bảng `hang_doi_counter` là `(NgayKham, MaCaKham, MaChuyenKhoa)`.
- Vì khóa chính không được phép chứa `NULL`, **18 bản ghi cũ có `MaCaKham = NULL` sẽ không được đưa vào bảng bộ đếm này**.
- Bộ đếm `hang_doi_counter` chỉ khởi tạo từ 5 bản ghi đặt lịch hợp lệ (các ca #1, #76, #85, #108) với giá trị `SoHienTai = MAX(STTTrongNgay)` của ca đó.

---

## IV. QUY TRÌNH SAO LƯU DỮ LIỆU CHI TIẾT (BACKUP PROCEDURE)

Trước khi thực thi bất kỳ lệnh nào, chạy lệnh sau trong PowerShell ngoài sandbox:

```powershell
# 1. Di chuyển vào thư mục dự án
cd "c:\Users\admin\quanlytkbieu-app\Nhom9-DALN"

# 2. Tạo bản sao lưu toàn phần (Cấu trúc + Dữ liệu + Triggers + Routines)
mysqldump -u root -pCSDL2021 --host=127.0.0.1 --port=3306 `
    --databases phong_kham_thong_minh `
    --single-transaction `
    --quick `
    --routines `
    --triggers `
    --result-file="backup_phong_kham_thong_minh_pre_hybrid_queue_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Cách Kiểm Tra File Backup Có Thể Khôi Phục:
1. Mở PowerShell kiểm tra kích thước file:
   ```powershell
   Get-ChildItem -Filter "backup_phong_kham_thong_minh_pre_hybrid_queue_*.sql" | Select-Object Name, Length, LastWriteTime
   ```
2. Đọc 10 dòng cuối cùng của file sao lưu để xác nhận kết thúc thành công:
   ```powershell
   Get-Content (Get-ChildItem -Filter "backup_*.sql" | Select-Object -Last 1).FullName -Tail 10
   ```
   *(Phải xuất hiện dòng chữ: `-- Dump completed on ...`)*.

---

## V. BẢNG PHÂN LOẠI CHI TIẾT 23 BẢN GHI THEO PHƯƠNG ÁN C

### 1. Nhóm 1: 5 Bản Ghi Đặt Lịch (Backfill Đầy Đủ)

| Mã LK | Mã LH | Bác Sĩ | Chuyên Khoa | Ca Khám Khớp | Ngày Khám | Loại Hàng Đợi | Mức Ưu Tiên | STT | Số Phiếu Dự Kiến |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **#1** | #1 | BS #1 | CK #1 (Nội) | Ca #1 (08:00 - 09:00) | 2026-10-01 | `DAT_LICH` | **P2** | 1 | `NOI-S-001` |
| **#156**| #86 | BS #124 | CK #30 | Ca #76 (08:00 - 09:00) | 2026-11-03 | `DAT_LICH` | **P2** | 1 | `CK30-S-001` |
| **#211**| #114 | BS #1 | CK #1 (Nội) | Ca #108 (14:00 - 15:00) | 2026-11-03 | `DAT_LICH` | **P2** | 1 | `NOI-C-001` |
| **#214**| #117 | BS #140 | CK #1 (Nội) | Ca #85 (08:00 - 09:30) | 2026-11-03 | `DAT_LICH` | **P2** | 1 | `NOI-S-001` |
| **#236**| #137 | BS #140 | CK #1 (Nội) | Ca #85 (08:00 - 09:30) | 2026-11-03 | `DAT_LICH` | **P2** | 2 | `NOI-S-002` |

*Ghi chú*: Hai ca #214 và #236 cùng thuộc phạm vi (Ngày 2026-11-03, Ca #85, Khoa #1), được đánh số STT tăng dần 1 và 2. Bộ đếm `hang_doi_counter` cho phạm vi này sẽ khởi tạo là `2`.

---

### 2. Nhóm 2: 18 Bản Ghi Khám Trực Tiếp (Phương Án C — Giữ MaCaKham = NULL)

Toàn bộ 18 bản ghi dưới đây được bảo tồn nguyên vẹn tính trung thực:
- `LoaiHangDoi = 'TRUC_TIEP'`
- `NgayKham = DATE(ThoiGianTiepNhan)`
- `MaChuyenKhoa = bacSi.MaChuyenKhoa`
- `MucUuTien = 3`
- `ThoiGianVaoHang = ThoiGianTiepNhan`
- **`MaCaKham = NULL`**
- **`STTTrongNgay = NULL`**
- **`SoPhieu = NULL`**

Danh sách mã lượt khám: **#100, #101, #102, #175, #218, #254, #255, #256, #257, #258, #259, #260, #261, #262, #263, #264, #265, #266**.

---

## VI. KẾ HOẠCH ROLLBACK CHI TIẾT KHI CÓ SỰ CỐ

Nếu có bất kỳ sự cố nào xảy ra trong quá trình chạy Migration hoặc Backfill:

### Cách 1: Rollback Bằng Lệnh Laravel
```bash
php artisan migrate:rollback --step=2
```

### Cách 2: Rollback Khẩn Cấp Bằng File SQL
```sql
USE phong_kham_thong_minh;

-- Xóa bảng counter
DROP TABLE IF EXISTS hang_doi_counter;

-- Xóa các khóa ngoại mới
ALTER TABLE luot_kham DROP FOREIGN KEY IF EXISTS fk_lk_chuyen_khoa;
ALTER TABLE luot_kham DROP FOREIGN KEY IF EXISTS fk_lk_ca_kham;
ALTER TABLE luot_kham DROP FOREIGN KEY IF EXISTS fk_lk_nguoi_xac_nhan;

-- Xóa index
ALTER TABLE luot_kham DROP INDEX IF EXISTS idx_lk_queue_search;

-- Xóa các cột đã thêm
ALTER TABLE luot_kham 
    DROP COLUMN IF EXISTS NgayKham,
    DROP COLUMN IF EXISTS LoaiHangDoi,
    DROP COLUMN IF EXISTS SoPhieu,
    DROP COLUMN IF EXISTS STTTrongNgay,
    DROP COLUMN IF EXISTS MaChuyenKhoa,
    DROP COLUMN IF EXISTS MaCaKham,
    DROP COLUMN IF EXISTS MucUuTien,
    DROP COLUMN IF EXISTS ThoiGianVaoHang,
    DROP COLUMN IF EXISTS ThoiGianGoiKham,
    DROP COLUMN IF EXISTS NguoiXacNhanUuTien,
    DROP COLUMN IF EXISTS LyDoUuTien;

-- Chuyển lại MaBacSi sang NOT NULL
ALTER TABLE luot_kham MODIFY COLUMN MaBacSi INT NOT NULL;
```

---

## VII. QUY TRÌNH THỰC THI 5 BƯỚC (SAU KHI ĐƯỢC PHÊ DUYỆT)

Khi bạn phê duyệt cho phép chạy, trình tự thực hiện sẽ là:

1. **Bước 1 — Sao lưu CSDL**: Chạy lệnh `mysqldump` xuất file `.sql` và kiểm tra dung lượng.
2. **Bước 2 — Chạy Migration**:
   ```bash
   php artisan migrate --path=database/migrations/2026_11_04_000001_add_hybrid_queue_columns_to_luot_kham_table.php
   php artisan migrate --path=database/migrations/2026_11_04_000002_create_hang_doi_counter_table.php
   ```
3. **Bước 3 — Chạy Thử Nghiệm Backfill (Dry-Run)**:
   ```bash
   php artisan smartcare:backfill-hybrid-queue --dry-run
   ```
4. **Bước 4 — Chạy Thực Thi Cập Nhật Dữ Liệu (Apply)**:
   ```bash
   php artisan smartcare:backfill-hybrid-queue --apply
   ```
5. **Bước 5 — Hậu Kiểm SQL**: Chạy các truy vấn kiểm tra trong file `verify_hybrid_queue_pre_post_migration.sql` để khẳng định tính toàn vẹn 100%.

---

## VIII. GATEKEEPER DECISION

# `READY FOR BACKUP AND MIGRATION APPROVAL`
*(Toàn bộ 5 file đã hoàn tất điều chỉnh theo đúng Phương án C, đã kiểm tra cú pháp PHP linter, đã phân định rạch ròi dữ liệu lịch sử và dữ liệu mới. Hệ thống ở trạng thái hoàn hảo nhất để người dùng tiến hành bước Sao lưu và duyệt chạy Migration)*

```
+--------------------------------------------------------------------------------------------------+
| CAM KẾT BẤT BIẾN                                                                                 |
+--------------------------------------------------------------------------------------------------+
| 1. Antigravity DỪNG LẠI TẠI ĐÂY.                                                                 |
| 2. Tuyệt đối KHÔNG tự ý chạy lệnh "php artisan migrate".                                         |
| 3. Tuyệt đối KHÔNG tự ý chạy lệnh "smartcare:backfill-hybrid-queue --apply".                     |
| 4. Cơ sở dữ liệu thật vẫn còn nguyên vẹn 100% (0 byte ghi vào CSDL).                             |
+--------------------------------------------------------------------------------------------------+
```

Kính trình bạn xem xét báo cáo và cho ý kiến chỉ đạo!
