# SMARTCARE – BÁO CÁO RÀ SOÁT VÀ KHẮC PHỤC THIẾT KẾ CUỐI CÙNG (V2.6 $\rightarrow$ V2.7)
## HỆ THỐNG ĐIỀU PHỐI HÀNG ĐỢI KHÁM BỆNH HYBRID QUEUE

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md) (Phiên bản 2.7)  
> **Ngày lập:** 03/11/2026  
> **Mục tiêu:** Báo cáo chi tiết các lỗi logic đã khắc phục từ phiên bản 2.6 lên phiên bản 2.7 trước khi chuyển sang bước kiểm thử trên Database Clone.  
> **Cam kết an toàn tuyệt đối:** CHỈ đọc code/database, KHÔNG sửa code ứng dụng, KHÔNG tạo/chạy migration trên database chính, KHÔNG thay đổi dữ liệu hiện có.

---

## 1. CÁC LỖI VÀ MÂU THUẪN ĐÃ PHÁT HIỆN TRONG PHIÊN BẢN 2.6

1. **Lỗ hổng Trigger cho phép chuyển đổi `NULL -> A` trên `MaLichHen`:**
   - Trong v2.6, Trigger dùng chung điều kiện `OLD.col IS NOT NULL` cho cả 5 trường. Với lượt khám trực tiếp (`MaLichHen` ban đầu là `NULL`), điều kiện này làm Trigger bỏ qua, cho phép câu lệnh `UPDATE` gán thêm một lịch hẹn vào lượt khám trực tiếp sau khi đã tạo!
2. **Thiếu cơ chế quản lý Vòng đời Số phiếu và Idempotency:**
   - Khi tách cấp số thành Transaction độc lập (Autonomous Allocation), nếu client gửi lại request do timeout hoặc transaction tạo lượt khám bị deadlock retry, hệ thống có thể bị cấp thêm số phiếu mới làm nhảy số hoặc tạo số phiếu mồ côi mà không có cơ chế đối soát.
3. **Mô tả sai bản chất của cơ chế Barrier:**
   - Tài liệu v2.6 tuyên bố hai tiến trình bứt phá "chính xác cùng một mili-giây". Đây là kết luận thiếu căn cứ kỹ thuật vì hệ điều hành luôn có độ trễ lập lịch luồng (thread scheduling skew).
4. **Kết luận Deadlock chưa chuẩn xác:**
   - Tài liệu v2.6 dùng cụm từ "Bằng chứng xung đột chu trình Deadlock thực tế 100%", gộp chung phân tích tĩnh mã nguồn với việc MySQL đã ghi nhận lỗi runtime.

---

## 2. NỘI DUNG THIẾT KẾ ĐÃ CẬP NHẬT TRONG PHIÊN BẢN 2.7

1. **Tách biệt quy tắc bảo vệ của Trigger:**
   - `MaLichHen` được bảo vệ độc lập bằng biểu thức: `IF NOT (NEW.MaLichHen <=> OLD.MaLichHen) THEN SIGNAL ...`.
   - Cấm 100% việc gán thêm (`NULL -> A`), xóa bỏ (`A -> NULL`) hoặc tráo đổi (`A -> B`).
   - 4 trường cấp số (`MaPhamVi`, `STTTrongNgay`, `SoPhieu`, `MaChuyenKhoa`) giữ điều kiện `OLD IS NOT NULL` để cho phép khởi tạo một lần duy nhất lúc chạy script backfill.
2. **Bổ sung Sổ kiểm toán Cấp số (`so_cap_so_phieu`) và Idempotency Key:**
   - Mọi yêu cầu cấp số phải có `IdempotencyKey`. Nếu request bị gửi lại hoặc retry sau deadlock, hệ thống tái sử dụng số phiếu đã cấp trong sổ kiểm toán, không làm nhảy số.
   - Số phiếu không tạo được lượt khám sẽ nằm ở trạng thái `DA_CAP` mồ côi (Burned Gap) và được ghi nhận minh bạch trong công thức đối soát toàn vẹn.
3. **Thiết kế Two-Phase Rendezvous Barrier với Đo đạc Skew:**
   - Định nghĩa Barrier là đồng bộ logic. Bổ sung bảng `test_concurrency_barrier` với timeout 5 giây, đo đạc độ lệch $\Delta t = |\text{t1} - \text{t2}|$ bằng microsecond.
4. **Chuẩn hóa kết luận Deadlock:**
   - Phân định rõ 4 trạng thái kỹ thuật: Khóa ngược mã nguồn $\rightarrow$ Deadlock tiềm tàng $\rightarrow$ Deadlock runtime $\rightarrow$ Deadlock đã kiểm thử.
   - Kết luận chính xác: "Đã xác định thứ tự khóa ngược trong mã nguồn, tạo điều kiện hình thành chu trình deadlock tiềm tàng khi các transaction tranh chấp cùng tài nguyên."

---

## 3. BẰNG CHỨNG SOURCE CODE VÀ SCHEMA ĐÃ ĐỐI SOÁT

1. **Schema Cột ID và Giới hạn:**
   - `bac_si.MaBacSi`, `chuyen_khoa.MaChuyenKhoa`, `luot_kham.MaLuotKham`: Kiểu `INT` (tối đa 10 chữ số).
   - `SoPhieu` có độ dài tối đa là 34 ký tự $\rightarrow$ Chốt kiểu dữ liệu `VARCHAR(64)` trong migration.
2. **Source Code xung đột khóa:**
   - [LuotKhamController.php:250-258](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L250-L258): `store()` khóa $lich\_hen \rightarrow luot\_kham$.
   - [LuotKhamController.php:541-548](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L541-L548): `completeExamine()` cập nhật $luot\_kham \rightarrow lich\_hen$.
   - $\rightarrow$ Bằng chứng khóa ngược đã được xác định rõ ràng tại từng dòng code.
3. **Chuỗi dữ liệu 23 bản ghi:**
   - 5 ca đặt lịch có chuỗi lịch sử nguyên vẹn 100% qua `lich_hen` $\rightarrow$ `ca_kham` $\rightarrow$ `lich_lam_viec`.
   - 18 ca trực tiếp không có nhật ký tiếp nhận trong schema cũ $\rightarrow$ Đã ghi nhận minh bạch là dữ liệu suy luận từ bác sĩ thực khám.

---

## 4. CÁC TÌNH HUỐNG CHƯA THỂ XÁC MINH (GIỚI HẠN READ-ONLY)

1. **Thời gian khóa thực tế và độ lệch Rendezvous:** Chưa thể đo lường độ lệch $\Delta t$ thực tế trên CPU vì chưa khởi chạy tiến trình CLI kiểm thử.
2. **Hành vi cạnh tranh khóa trên bảng `bo_dem_so_phieu`:** Chưa thể chạy kiểm thử 50 concurrent connections để đo TPS thực tế của cơ chế Autonomous Allocation.

---

## 5. CÁC QUYẾT ĐỊNH CẦN QUẢN TRỊ VIÊN PHÊ DUYỆT

1. **Phê duyệt Bổ sung Bảng Sổ kiểm toán `so_cap_so_phieu`:** Thống nhất tạo bảng này trong migration Giai đoạn 2 để bảo đảm tính bất biến, idempotency và khả năng kiểm toán các số phiếu bị bỏ trống (Burned Tickets).
2. **Phê duyệt Cấm tuyệt đối thay đổi `MaLichHen` sau khi tạo:** Thống nhất khóa cứng trường `MaLichHen` ở tầng Database Trigger đối với mọi câu lệnh UPDATE.
3. **Phê duyệt Chuẩn hóa thứ tự khóa 2 pha trong Giai đoạn 3:** Đồng ý sửa đổi code `completeExamine()` để khóa `lich_hen` trước `luot_kham`.

---

## 6. BẢNG TRẠNG THÁI TỪNG BLOCKER

| Mã Blocker | Tên Blocker kỹ thuật | Trạng thái kỹ thuật hiện tại | Ghi chú an toàn |
| :---: | :--- | :---: | :--- |
| **B-01** | Trigger cho phép sửa `MaLichHen` từ `NULL -> A` | **ĐÃ CÓ THIẾT KẾ KHẮC PHỤC** | Chưa triển khai code / Chưa chạy test |
| **B-02** | Mâu thuẫn Rollback và Quản lý số phiếu Burned | **ĐÃ CÓ THIẾT KẾ KHẮC PHỤC** | Đã thiết kế Sổ kiểm toán & Idempotency Key |
| **B-03** | Khóa ngược gây Deadlock tiềm tàng `store` vs `complete` | **ĐÃ CÓ THIẾT KẾ KHẮC PHỤC** | Đã thiết kế giao thức 2-Phase Read & Lock |
| **B-04** | Hiểu sai `GET_LOCK()` là Rendezvous Barrier | **ĐÃ CÓ THIẾT KẾ KHẮC PHỤC** | Đã thiết kế Barrier bảng điều phối kèm đo Skew |

---

### KẾT LUẬN TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Cam kết an toàn tuyệt đối:
- Codebase ứng dụng hiện tại: GIỮ NGUYÊN VẸN 100%, KHÔNG CHỈNH SỬA.
- Database chính thức (phong_kham_thong_minh): GIỮ NGUYÊN VẸN 100%, KHÔNG GHI/XÓA.
- File Migration: CHƯA ĐƯỢC TẠO HOẶC CHẠY.
- Database Clone: CHƯA ĐƯỢC TẠO HOẶC THAO TÁC.
================================================================================
```
