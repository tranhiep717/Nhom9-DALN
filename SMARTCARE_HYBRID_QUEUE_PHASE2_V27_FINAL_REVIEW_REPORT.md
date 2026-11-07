# SMARTCARE – BÁO CÁO GIẢI TRÌNH THAY ĐỔI VÀ ĐỐI SOÁT BLOCKER B-01 ĐẾN B-10 (V2.7 $\rightarrow$ V2.8)
## HỆ THỐNG ĐIỀU PHỐI HÀNG ĐỢI KHÁM BỆNH HYBRID QUEUE

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_PHASE2_PRE_MIGRATION_REVIEW.md) (Phiên bản 2.8)  
> **Ngày lập:** 03/11/2026  
> **Mục tiêu:** Báo cáo chi tiết các phát hiện mới, đối soát schema trực tiếp từ database và giải trình phương án khắc phục cho 10 Blocker (B-01 đến B-10).  
> **Cam kết an toàn tuyệt đối:** CHỈ đọc code/database, KHÔNG sửa code ứng dụng, KHÔNG tạo/chạy migration trên database chính, KHÔNG thay đổi dữ liệu hiện có.

---

## 1. CÁC PHÁT HIỆN MỚI TỪ RÀ SOÁT SCHEMA VÀ LOGIC HỆ THỐNG

1. **Phát hiện Lệch Kiểu dữ liệu Khóa ngoại (B-06):**
   - Truy vấn trực tiếp từ `INFORMATION_SCHEMA.COLUMNS`: Cột `luot_kham.MaLuotKham` hiện là **`int(11) signed`**.
   - Trong thiết kế cũ, cột `so_cap_so_phieu.MaLuotKham` và `lich_su_dieu_phoi.MaLuotKham` khai báo là `BIGINT UNSIGNED`.
   - Nếu thực thi tạo khóa ngoại, MySQL InnoDB sẽ lập tức ném lỗi **Error 1215: Cannot add foreign key constraint** do không tương thích kiểu dữ liệu và thuộc tính signedness.
2. **Lỗ hổng Unique Key thiếu Ngày trên Bảng Sổ cấp số (B-05):**
   - Khóa `UNIQUE (MaPhamVi, STTTrongNgay)` cũ bỏ qua trường `Ngay`. Để bộ đếm reset theo ngày một cách tường minh và an toàn, khóa chính thức phải là:
     `UNIQUE (MaPhamVi, Ngay, STTTrongNgay)`.
3. **Cơ chế Idempotency khi 2 Request cùng Key (B-07):**
   - Phân biệt chính xác giữa lỗi MySQL 1062 do trùng `IdempotencyKey` với lỗi vi phạm các Unique constraint khác. Khi trùng `IdempotencyKey`, request thua cuộc đọc lại bản ghi của request thắng cuộc, không sinh thêm số mới và không trả lỗi 500 ra client.
4. **Quy trình 4 bước bảo vệ 4 trường bất biến (B-09):**
   - Phân định rõ ràng: Migration thêm cột `Nullable` $\rightarrow$ Backfill dữ liệu 23 bản ghi $\rightarrow$ Enforce `NOT NULL` $\rightarrow$ Tạo Trigger.
   - Nhờ đó, trong môi trường vận hành, `OLD.col` luôn khác NULL, loại bỏ hoàn toàn khả năng lọt qua Trigger.

---

## 2. BẰNG CHỨNG SOURCE CODE VÀ LIVE SCHEMA ĐÃ ĐỐI SOÁT

1. **Bảng đối soát kiểu dữ liệu các cột ID:**
   - `bac_si.MaBacSi`: `int(11)` (signed), PK, auto_increment.
   - `chuyen_khoa.MaChuyenKhoa`: `int(11)` (signed), PK, auto_increment.
   - `ca_kham.MaCaKham`: `int(11)` (signed), PK, auto_increment.
   - `lich_hen.MaLichHen`: `int(11)` (signed), PK, auto_increment.
   - `luot_kham.MaLuotKham`: `int(11)` (signed), PK, auto_increment.
   - `phieu_kham.MaPhieuKham`: `int(11)` (signed), PK, auto_increment.
   - $\rightarrow$ Toàn bộ các cột khóa ngoại tham chiếu đến các bảng này đều phải là `INT NULL` hoặc `INT NOT NULL` (signed).
2. **Bằng chứng khóa ngược trong Controller:**
   - [LuotKhamController.php:250-258](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L250-L258): `store()` khóa $lich\_hen \rightarrow luot\_kham$.
   - [LuotKhamController.php:541-548](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php#L541-L548): `completeExamine()` cập nhật $luot\_kham \rightarrow lich\_hen$.
   - $\rightarrow$ Khẳng định thứ tự khóa ngược trong code tạo điều kiện hình thành Deadlock tiềm tàng khi có tranh chấp đồng thời.

---

## 3. BẢNG TỔNG HỢP VÀ ĐỐI SOÁT TOÀN DIỆN CÁC BLOCKER (B-01 ĐẾN B-10)

| Mã Blocker | Vấn đề kỹ thuật | Bằng chứng Code / Schema thực tế | Phương án kỹ thuật đã chốt | Trạng thái Thiết kế | Trạng thái Triển khai | Trạng thái Kiểm thử |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **B-01** | Trigger cho phép sửa `MaLichHen` từ `NULL -> A` | Trigger v2.6 dùng `OLD IS NOT NULL` bỏ sót khi OLD là NULL. | Dùng `NOT (NEW.MaLichHen <=> OLD.MaLichHen)` cấm 100% thay đổi `MaLichHen`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-02** | Mâu thuẫn Rollback và Quản lý số phiếu Burned | Single transaction rollback làm lùi bộ đếm, không có số burned. | Cấp số trong Transaction độc lập kèm Bảng sổ kiểm toán `so_cap_so_phieu`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-03** | Khóa ngược gây Deadlock tiềm tàng `store` vs `complete` | `store`: $LH \rightarrow LK$; `complete`: $LK \rightarrow LH$ (L541-548). | Chuẩn hóa toàn hệ thống theo 2-Phase Read & Lock: Khóa $LH$ trước $LK$. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-04** | Hiểu sai `GET_LOCK()` là Rendezvous Barrier | `GET_LOCK()` là Exclusive Mutex, không phải Rendezvous Barrier. | Thiết kế Two-Phase Rendezvous Barrier có đo độ lệch $\Delta t$ microsecond. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-05** | Unique Key của `so_cap_so_phieu` thiếu `Ngay` | Reset theo ngày đòi hỏi Unique key phải chứa đủ Ngày và Scope. | Đổi thành `UNIQUE (MaPhamVi, Ngay, STTTrongNgay)` loại bỏ xung đột. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-06** | Lệch kiểu dữ liệu Khóa ngoại (INT vs BIGINT UNSIGNED) | Schema gốc `luot_kham.MaLuotKham` là `int(11) signed`, FK cũ khai báo BIGINT gây lỗi 1215. | Sửa tất cả cột FK trỏ tới `MaLuotKham` thành `INT NULL (signed)`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-07** | Race condition khi 2 request cùng `IdempotencyKey` | Trùng key ném lỗi 1062, nếu không xử lý sẽ văng 500 ra client. | Bắt lỗi 1062 trên `uq_idempotency_key` và đọc lại bản ghi thắng cuộc. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-08** | Thiếu cơ chế phục hồi số phiếu treo `DA_CAP` | Server sập làm số phiếu mồ côi không có lượt khám. | Background worker quét bản ghi `DA_CAP` quá 15p và void sang `DA_HUY`. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-09** | Quyền khởi tạo 4 trường bất biến chưa chặt chẽ | Khởi tạo thiếu trường hoặc sửa đè nếu không enforce NOT NULL. | Migration 4 bước: Nullable $\rightarrow$ Backfill $\rightarrow$ Enforce NOT NULL $\rightarrow$ Trigger. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |
| **B-10** | Thiếu công thức định lượng Execution Skew của Barrier | Không đo lường được độ đồng thời thực tế của 2 tiến trình. | Bổ sung công thức $\Delta t = \|t1 - t2\| \le 15\text{ms}$ bằng microsecond. | **ĐÃ HOÀN TẤT** | **CHƯA TRIỂN KHAI** | **CHƯA KIỂM THỬ** |

---

## 4. NỘI DUNG CHƯA THỂ XÁC MINH VÀ GIẢ ĐỊNH KỸ THUẬT

1. **Hành vi cạnh tranh thực tế của 50 kết nối song song:** Chưa thể đo lường throughput (TPS) và độ trễ chờ khóa (Lock Latency) trên môi trường thực tế vì chưa khởi chạy tiến trình CLI kiểm thử.
2. **Nguồn gốc chuyên khoa ban đầu của 18 ca trực tiếp cũ:** Do database cũ không có bảng nhật ký tiếp nhận, chúng tôi **không thể chứng minh lịch sử 100%** chuyên khoa gốc mà bệnh nhân yêu cầu tại quầy lễ tân (chỉ suy luận từ chuyên khoa của bác sĩ thực khám lúc đó).

---

## 5. CÁC QUYẾT ĐỊNH CẦN QUẢN TRỊ VIÊN PHÊ DUYỆT

1. **Phê duyệt Bổ sung Bảng Sổ kiểm toán `so_cap_so_phieu` với FK kiểu `INT`:** Thống nhất tạo bảng này trong migration Giai đoạn 2 để bảo đảm tính bất biến, idempotency và khả năng kiểm toán các số phiếu bị bỏ trống (Burned Tickets).
2. **Phê duyệt Cấm tuyệt đối thay đổi `MaLichHen` sau khi tạo:** Thống nhất khóa cứng trường `MaLichHen` ở tầng Database Trigger đối với mọi câu lệnh UPDATE.
3. **Phê duyệt Chuẩn hóa thứ tự khóa 2 pha trong Giai đoạn 3:** Đồng ý sửa đổi code `completeExamine()` để khóa `lich_hen` trước `luot_kham`.

---

### KẾT LUẬN TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Cam kết an toàn tuyệt đối:
- Toàn bộ source code ứng dụng: CHƯA BỊ SỬA ĐỔI BẤT KỲ DÒNG NÀO.
- Database chính thức (phong_kham_thong_minh): GIỮ NGUYÊN VẸN 100%.
- File Migration: CHƯA ĐƯỢC TẠO HOẶC CHẠY.
- Database Clone: CHƯA ĐƯỢC TẠO HOẶC THAO TÁC.
================================================================================
```
