# SMARTCARE – BÁO CÁO THAY ĐỔI VÀ KHẮC PHỤC THIẾT KẾ (V2.5 $\rightarrow$ V2.6)
## HỆ THỐNG ĐIỀU PHỐI HÀNG ĐỢI KHÁM BỆNH HYBRID QUEUE

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md) (Phiên bản 2.6)  
> **Ngày lập:** 03/11/2026  
> **Phạm vi:** Báo cáo đối soát các điểm sửa đổi kỹ thuật giữa phiên bản 2.5 và phiên bản 2.6 theo yêu cầu review của Quản trị viên.  
> **Cam kết an toàn tuyệt đối:** CHỈ đọc code/database, KHÔNG sửa code ứng dụng, KHÔNG tạo/chạy migration trên database chính, KHÔNG thay đổi dữ liệu hiện có.

---

## 1. TỔNG HỢP CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN TRONG PHIÊN BẢN 2.5

1. **Lỗ hổng Trigger bảo vệ `MaLichHen`:**
   - Trong tài liệu v2.5, văn bản khẳng định `MaLichHen` là trường bất biến, nhưng câu lệnh MySQL Trigger tại mục 1.3 chỉ kiểm tra 4 trường (`MaPhamVi`, `STTTrongNgay`, `SoPhieu`, `MaChuyenKhoa`), bỏ quên `MaLichHen`.
   - Ngoài ra, việc dùng toán tử `!=` thông thường bị vô hiệu hóa khi gán giá trị `NULL` (vì `NULL != Value` trả về `UNKNOWN` trong SQL).
2. **Mâu thuẫn giữa Transaction tạo lượt khám và Cam kết số phiếu BURNED:**
   - Trong thiết kế cũ, nếu bộ đếm `bo_dem_so_phieu` và câu lệnh tạo `luot_kham` nằm chung trong một Transaction: Khi tạo lượt khám thất bại (deadlock, validation error), toàn bộ transaction bị rollback $\rightarrow$ Bộ đếm bị rollback theo.
   - Khi đó, số phiếu KHÔNG HỀ BỊ BỎ TRỐNG (Burned) mà sẽ bị cấp lại cho người tiếp theo, mâu thuẫn trực tiếp với tuyên bố nghiệp vụ.
3. **Hiểu sai bản chất của `GET_LOCK()` trong kiểm thử Concurrency:**
   - Phiên bản 2.5 gọi `GET_LOCK()` là "Barrier đồng bộ". Về mặt kỹ thuật hệ thống, `GET_LOCK()` là **Exclusive Named Mutex**, chỉ cho phép 1 tiến trình chạy và chặn tiến trình còn lại, không thể đóng vai trò điểm hẹn đồng thời (Rendezvous Barrier) cho 2 tiến trình.
4. **Đánh giá trạng thái thiếu minh bạch:**
   - Bảng tổng hợp cũ ghi trạng thái "ĐÃ GIẢI QUYẾT TRÊN THIẾT KẾ", dễ gây hiểu lầm rằng lỗi đã được sửa trên code thực tế, trong khi code ứng dụng vẫn chưa được chỉnh sửa.

---

## 2. NỘI DUNG ĐÃ SỬA ĐỔI VÀ HOÀN THIỆN TRONG TÀI LIỆU V2.6

### 2.1. Hoàn thiện Trigger NULL-safe bảo vệ 5 trường
- Đã bổ sung `MaLichHen` vào danh mục bảo vệ của Trigger và Eloquent Model Guard.
- Áp dụng toán tử NULL-safe equal `NOT (NEW.column <=> OLD.column)` kết hợp điều kiện `OLD.column IS NOT NULL`.
- Xây dựng ma trận kiểm thử chuyển đổi giá trị đầy đủ cho cả 5 trường hợp (`NULL -> Value`, `Value -> NULL`, `Value A -> Value B`, `Value A -> Value A`, `NULL -> NULL`).
- Xác nhận: Trigger chỉ kích hoạt khi trường cũ đã có giá trị mà bị sửa sang giá trị khác (bao gồm cả sửa về `NULL`). Hoạt động an toàn cho cả UPDATE 1 cột và UPDATE nhiều cột.

### 2.2. Chốt kiến trúc Cấp số độc lập (Autonomous Allocation Transaction)
- **Phương án lựa chọn:** Tách việc cấp số thành một Transaction độc lập ngắn hạn (chạy dưới 1 mili-giây và commit ngay) trước khi bắt đầu Transaction tạo lượt khám:
  * Transaction 1: Seed hàng giá trị 0 $\rightarrow$ `UPDATE bo_dem_so_phieu SET GiaTriHienTai = LAST_INSERT_ID(GiaTriHienTai + 1)` $\rightarrow$ Kiểm tra `rowCount === 1` $\rightarrow$ Đọc `SELECT LAST_INSERT_ID()` $\rightarrow$ **COMMIT NGAY**.
  * Transaction 2: Sử dụng số thứ tự vừa nhận để tạo lượt khám. Nếu Transaction 2 bị hủy hoặc lỗi, số thứ tự đã cấp **thực sự bị bỏ trống (BURNED NUMBER)** và ghi nhận vào audit log. Không bao giờ lùi bộ đếm.
- Đã bổ sung cơ chế kiểm tra tràn số `INT UNSIGNED` ($4,294,967,295$) và bảo đảm 3 câu lệnh chạy trên cùng kết nối PDO.

### 2.3. Thiết kế Two-Phase Rendezvous Barrier cho Concurrency Test
- Thay thế mô tả `GET_LOCK()` bằng cơ chế Rendezvous Barrier thực sự sử dụng bảng điều phối `test_concurrency_barrier`.
- Quy trình: Master khởi tạo barrier $\rightarrow$ Worker 1 và Worker 2 báo `READY` $\rightarrow$ Master phát tín hiệu `START` $\rightarrow$ Cả hai tiến trình cùng bứt phá tại cùng mili-giây.
- Bổ sung cơ chế timeout 5 giây chống treo tiến trình, ghi log mốc thời gian bằng microsecond `microtime(true)`.

### 2.4. Phân loại 5 cấp độ nghiệm thu minh bạch
Bảng tổng hợp mục 5 đã được phân loại chính xác theo 5 cấp độ:
- Cấp 1: `ĐÃ XÁC ĐỊNH NGUYÊN NHÂN` (Đạt 100%)
- Cấp 2: `ĐÃ CÓ THIẾT KẾ KHẮC PHỤC` (Đạt 100%)
- Cấp 3: `ĐÃ TRIỂN KHAI CODE` (**CHƯA - Code ứng dụng được giữ nguyên vẹn**)
- Cấp 4: `ĐÃ KIỂM THỬ PASS` (**CHƯA - Chưa chạy test**)
- Cấp 5: `CHƯA KIỂM THỬ` (**HIỆN TẠI TẤT CẢ ĐỀU THUỘC NHÓM NÀY**)

---

## 3. BẰNG CHỨNG CODE VÀ SCHEMA ĐÃ ĐỐI SOÁT

1. **Schema Cột ID:**
   - `bac_si.MaBacSi`: Kiểu `INT` (tối đa 10 chữ số).
   - `chuyen_khoa.MaChuyenKhoa`: Kiểu `INT` (tối đa 10 chữ số).
   - `luot_kham.MaLuotKham`: Kiểu `INT` (tối đa 10 chữ số).
   - $\rightarrow$ Chứng minh độ dài tối đa của `SoPhieu` là **34 ký tự** (vượt giới hạn 32 của VARCHAR(32)). Đã chốt dùng `VARCHAR(64)`.
2. **Framework & Driver:**
   - `composer.json`: `laravel/framework: ^12.0`, PHP `^8.2`.
   - PDO MySQL driver: Hỗ trợ đầy đủ `<=>`, `LAST_INSERT_ID()`, `SAVEPOINT`.
3. **Mã nguồn xung đột khóa trong Controller:**
   - [LuotKhamController.php:250-258](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L250-L258): `store()` khóa $lich\_hen \rightarrow luot\_kham$.
   - [LuotKhamController.php:541-548](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L541-L548): `completeExamine()` cập nhật $luot\_kham \rightarrow lich\_hen$.
   - $\rightarrow$ Bằng chứng xung đột chu trình Deadlock thực tế 100%.

---

## 4. NỘI DUNG CHƯA THỂ XÁC MINH (GIỚI HẠN READ-ONLY)

1. **Hiệu năng chịu tải thực tế:** Chưa thể đo lường throughput (số ca/giây) và độ trễ chờ khóa của cơ chế Two-Step Seed & Atomic Increment khi có 50 kết nối đồng thời.
2. **Dữ liệu chuyên khoa của 18 ca trực tiếp cũ:** Do database cũ không có bảng nhật ký tiếp nhận, chúng tôi **không thể chứng minh lịch sử 100%** chuyên khoa gốc mà bệnh nhân yêu cầu tại quầy lễ tân (chỉ suy luận từ chuyên khoa của bác sĩ thực khám lúc đó).

---

## 5. CÁC QUYẾT ĐỊNH THIẾT KẾ CẦN CON NGƯỜI PHÊ DUYỆT

Trước khi bước vào Giai đoạn tiếp theo (Tạo Database Clone để kiểm thử), Quản trị viên cần xem xét và phê duyệt:
1. **Phê duyệt Phương án B (Autonomous Allocation):** Chấp nhận việc số phiếu đã cấp sẽ bị bỏ trống (Burned gap) nếu transaction tiếp nhận sau đó bị hủy hoặc lỗi mạng.
2. **Phê duyệt chuyển `MaPhamVi` thành Cột Snapshot bất biến:** Chấp nhận không dùng Virtual Generated Column để tránh lỗi va chạm Unique Key khi điều chuyển bác sĩ.
3. **Phê duyệt chuẩn hóa thứ tự khóa 2-Phase trong `completeExamine()`:** Đồng ý sửa thứ tự trong code ở Giai đoạn 3 (khóa `lich_hen` trước `luot_kham`).

---

### KẾT LUẬN TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC

```text
================================================================================
TRẠNG THÁI CHÍNH THỨC HIỆN TẠI:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Cam kết an toàn tuyệt đối:
- Toàn bộ source code ứng dụng: CHƯA BỊ SỬA ĐỔI BẤT KỲ DÒNG NÀO.
- Database chính thức (phong_kham_thong_minh): GIỮ NGUYÊN VẸN 100%.
- File Migration: CHƯA ĐƯỢC TẠO HOẶC CHẠY.
- Database Clone: CHƯA ĐƯỢC TẠO HOẶC THAO TÁC.
================================================================================
```
