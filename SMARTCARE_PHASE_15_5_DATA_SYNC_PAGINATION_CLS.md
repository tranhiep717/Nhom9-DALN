# SMARTCARE – PHASE 15.5 REPORT: ĐỒNG BỘ LỊCH BÁC SĨ, PHÂN TRANG VÀ QUẢN LÝ BỆNH NHÂN CHỜ CLS

> **Thời gian hoàn thành**: 2026-11-04 21:05 (GMT+7)  
> **Môi trường kiểm thử**: `phong_kham_rehearsal_test` (MySQL 127.0.0.1:3306)  
> **Database thật**: `phong_kham_thong_minh` (30 bảng, 23 lượt khám – **Nguyên vẹn 100%, tuyệt đối không can thiệp**)  
> **Bộ kiểm thử tự động**: `Phase155DataSyncPaginationClsTest` (6/6 PASS, 45 assertions), `Phase154DoctorUiQueueConsistencyTest` (10/10 PASS, 39 assertions), `Phase15SecurityCsrfSessionAuditTest` (21/21 PASS, 95 assertions)

---

## 1. ĐỐI CHIẾU DỮ LIỆU DASHBOARD & BÀN KHÁM VỚI DATABASE

### 1.1. Hiện trạng ảnh giao diện trước khi sửa
Ảnh chụp thực tế ghi nhận 5 thẻ thống kê:
- **Tổng lượt khám**: 146
- **Chờ khám**: 105
- **Đang khám**: 1
- **Chờ khám lại (CLS)**: 18
- **Đã hoàn thành**: 38

Nếu tính tổng các nhóm: $105 + 1 + 18 + 38 = 162 \neq 146$. Xuất hiện sai lệch **+16 lượt khám**.

---

### 1.2. Bảng đối chiếu SQL thực tế vs Kết quả giao diện

Thực hiện truy vấn SQL trực tiếp trên database `phong_kham_rehearsal_test` đối với Bác sĩ `MaBacSi = 140` vào ngày `2026-11-04`:

| Chỉ số | SQL thực tế trên CSDL Rehearsal | Kết quả DB | Giao diện cũ | Sai lệch | Nguyên nhân gốc | Trạng thái sau sửa |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| **Tổng tiếp nhận** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND NgayKham = '2026-11-04'` | **146** | 146 | **0** | Đếm đúng tổng số lượt khám tiếp nhận trong ngày của bác sĩ. | **146** |
| **Chờ khám lần đầu** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND NgayKham = '2026-11-04' AND TrangThai = 'CHO_KHAM'` | **87** | 105 | **+18** | **Đếm gộp trùng**: Giao diện cũ gộp cả `CHO_KHAM` (87) và `CHO_KHAM_LAI` (18) vào thẻ "Chờ khám" ($87 + 18 = 105$). | **87** |
| **Chờ khám lại (CLS)** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND NgayKham = '2026-11-04' AND TrangThai = 'CHO_KHAM_LAI'` | **18** | 18 | **0** | Đếm đúng các bệnh nhân đã hoàn thành CLS và đã quay lại phòng khám. | **18** |
| **Đang làm CLS / Chờ KQ** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND NgayKham = '2026-11-04' AND TrangThai = 'CHO_KET_QUA'` | **2** | *Không hiển thị* | **-2** | Bị bỏ sót trên thanh thẻ thống kê giao diện cũ. | **2** |
| **Đang khám** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND TrangThai = 'DANG_KHAM'` | **1** | 1 | **0** | 1 bệnh nhân duy nhất đang được bác sĩ khám tại phòng (#296). | **1** |
| **Đã hoàn thành** | `SELECT COUNT(DISTINCT MaLuotKham) FROM luot_kham WHERE MaBacSi = 140 AND NgayKham = '2026-11-04' AND TrangThai = 'HOAN_THANH'` | **38** | 38 | **0** | 38 bệnh nhân đã khám xong, có kết luận và đơn thuốc/hóa đơn. | **38** |

### 1.3. Kết luận đối chiếu
- **Tính toàn vẹn**: Toàn bộ $87 + 18 + 2 + 1 + 38 = 146$ lượt khám! Tổng các nhóm trạng thái rời rạc bằng **chính xác 100%** tổng lượt khám tiếp nhận trong ngày.
- **Không có bản ghi nhân bản**: `COUNT(*)` = `COUNT(DISTINCT MaLuotKham)` = 146. Không có hiện tượng nhân đôi do JOIN.
- **Khắc phục**: Tách biệt rõ thẻ "Chờ khám lần đầu" (`waitingInitial = 87`), thẻ "Chờ khám lại CLS" (`waitingReExam = 18`), và bổ sung chỉ số "Đang làm CLS" (`waitingCls = 2`).

---

## 2. ĐỒNG BỘ LỊCH LÀM VIỆC VỚI CA KHÁM

### 2.1. Nguyên nhân lịch làm việc báo "0 ca" trong khi thực tế có Ca 89, 90, 91, 92
Khi người dùng truy cập trang Lịch làm việc (`/doctor/schedule`), giao diện hiển thị:
- Giờ trực: `07:30 - 17:30`
- Chỉ tiêu: `20 lượt`
- Các ca khám trong ngày: **`0 ca`**

Truy vấn CSDL bảng `ca_kham` đối chiếu với `lich_lam_viec`:
```sql
SELECT llv.MaLichLamViec, ck.MaCaKham, ck.GioBatDau, ck.GioKetThuc, ck.SoLuongTiepNhan 
FROM lich_lam_viec llv 
LEFT JOIN ca_kham ck ON llv.MaLichLamViec = ck.MaLichLamViec 
WHERE llv.MaBacSi = 140 AND llv.NgayLamViec = '2026-11-04';
```
Kết quả CSDL: Lịch làm việc ID 69 có **đúng 4 ca khám**:
- Ca #89: `08:00 - 09:30` (Sức chứa: 5)
- Ca #90: `09:30 - 11:30` (Sức chứa: 5)
- Ca #91: `13:30 - 15:00` (Sức chứa: 5)
- Ca #92: `15:00 - 17:00` (Sức chứa: 5)

**Nguyên nhân gốc (Root Cause)**:
- Trong Eloquent model `LichLamViec`, quan hệ được đặt tên camelCase: `public function caKhams()`.
- Khi Laravel serialize Model sang JSON/Array để truyền qua Inertia props, Eloquent mặc định chuyển tên quan hệ thành snake_case: **`ca_khams`**.
- Giao diện `Doctor/Schedule.tsx` kiểm tra: `schedule.caKhams?.length || 0`.
- Do `schedule.caKhams` là `undefined`, biểu thức luôn trả về `0 ca`.

### 2.2. Giải pháp khắc phục
1. **Frontend `resources/js/Pages/Doctor/Schedule.tsx`**:
   - Cập nhật interface `LichLamViec` hỗ trợ cả `ca_khams` và `caKhams`.
   - Lấy danh sách ca: `const caList = schedule.ca_khams || schedule.caKhams || [];`.
   - Hiển thị đầy đủ thông tin từng ca con: Mã ca (`Ca #89`, `Ca #90`), khung giờ, sức chứa tiếp nhận, trạng thái khả dụng, và nút chuyển nhanh "Khám ca này".
2. **Backend `app/Http/Controllers/LichLamViecController.php`**:
   - Eager-load chuyên khoa bác sĩ: `with(['bacSi:MaBacSi,HoTen,HocVi,MaChuyenKhoa', 'bacSi.chuyenKhoa:MaChuyenKhoa,TenChuyenKhoa', 'caKhams'])`.
   - Hiển thị chính xác tên chuyên khoa (VD: *Nội tổng quát*) trên tiêu đề ca trực.

---

## 3. PHÂN TRANG DANH SÁCH KHÁM TRONG NGÀY

### 3.1. Đáp ứng yêu cầu phân trang
1. **Mặc định 10 bản ghi/trang**, cho phép tùy chọn `10`, `20`, `50` bản ghi/trang.
2. **Phân trang hoàn toàn phía server**: Sử dụng `paginate($perPage)->withQueryString()` của Laravel Eloquent, không tải toàn bộ 146 lượt khám về trình duyệt rồi cắt mảng.
3. **Thứ tự hàng đợi FIFO không bị phá vỡ**:
   - Nhóm 1: `DANG_KHAM` (Luôn hiển thị đầu tiên).
   - Nhóm 2: `CHO_KHAM` và `CHO_KHAM_LAI` (Sắp xếp nghiêm ngặt theo `ThoiGianVaoHang ASC, MaLuotKham ASC`).
   - Nhóm 3: `CHO_KET_QUA`.
   - Nhóm 4: `HOAN_THANH`.
   - Khi xem chung các ca khám, ca khám sớm ưu tiên xếp trước: `ca_kham.GioBatDau ASC`.
4. **Tìm kiếm đa năng**:
   - Tìm theo Mã bệnh nhân: Hỗ trợ cả định dạng `BN001` lẫn số nguyên `1`.
   - Tìm theo Họ tên bệnh nhân.
   - Tìm theo Số điện thoại.
   - Tìm theo Số phiếu khám (`NTQ-C89-001`) và Mã lượt khám (`#273`).
5. **Duy trì bộ lọc khi chuyển trang**: Giữ nguyên `date`, `status`, `shift_id`, `search`, `per_page` thông qua `withQueryString()`.

---

## 4. GIAO DIỆN RIÊNG CHO BỆNH NHÂN CHỜ CLS

### 4.1. Cấu hình điều hướng & Phân quyền
- Bổ sung mục **"Bệnh nhân chờ CLS"** vào thanh menu dùng chung `DOCTOR_NAV_ITEMS` (`resources/js/constants/navigation.ts`).
- Route đăng ký: `GET /doctor/cls-patients` trong nhóm middleware `auth`, `role:BAC_SI`.

### 4.2. Tính năng màn hình `Doctor/ClsPatients.tsx`
1. **Thẻ tóm tắt tiến độ CLS**:
   - Tổng số chỉ định CLS.
   - Chờ thực hiện CLS (chưa đến phòng xét nghiệm / CĐHA).
   - Đang làm & Chờ kết quả (đang chụp / chờ ký duyệt kết quả).
   - Đã có kết quả (chờ bệnh nhân quay lại bàn khám).
   - Đã quay lại hàng đợi tái khám (đang trong hàng chờ FIFO).
2. **Bộ lọc chuyên sâu**:
   - Lọc theo ngày khám (Hôm nay / Tất cả).
   - Lọc theo từng giai đoạn CLS (`CHO_THUC_HIEN`, `DANG_THUC_HIEN`, `CHO_KET_QUA`, `DA_CO_KET_QUA`, `DA_QUAY_LAI`).
   - Lọc theo loại Dịch vụ CLS (Siêu âm, X-quang, Xét nghiệm máu...).
   - Lọc theo Chuyên khoa.
   - Ô tìm kiếm theo tên, SĐT, mã BN, số phiếu.
3. **Bảng dữ liệu chi tiết**:
   - Mã bệnh nhân (`BNxxx`), Họ tên, Tuổi, Giới tính, SĐT.
   - Số phiếu và Mã lượt khám gốc.
   - Danh sách dịch vụ chỉ định kèm trạng thái từng dịch vụ.
   - Thời gian chỉ định (`NgayChiDinh`) và thời gian có kết quả (`ThoiGianXacNhan`).
   - Nút **"Xem chi tiết kết quả"**: Mở modal xem thông số đo lường, kết luận bác sĩ CLS và tệp đính kèm.
4. **Nghiệp vụ xác nhận bệnh nhân quay lại sau CLS**:
   - Khi tất cả dịch vụ đã có kết quả (`DA_CO_KET_QUA`) và bệnh nhân thực tế quay lại phòng khám, bác sĩ bấm **"Xác nhận quay lại"**.
   - Hệ thống gửi request `POST /doctor/queue/cls-return` với `{ MaLuotKham }`:
     - Giữ nguyên `MaLuotKham` và `SoPhieu` ban đầu.
     - Cập nhật `TrangThai = 'CHO_KHAM_LAI'`.
     - Cập nhật `ThoiGianVaoHang = now()` (thời điểm thực tế quay lại).
     - Bệnh nhân tham gia hàng đợi tái khám tuân thủ FIFO công bằng, không chen ngang người đang đợi trước.

---

## 5. BÁO CÁO AUDIT VÀ ĐỀ XUẤT LÀM SẠCH DỮ LIỆU TEST

> [!IMPORTANT]
> **Cam kết an toàn tuyệt đối**: Chưa có bất kỳ thao tác xóa nào được thực hiện trên CSDL. Bảng dưới đây phân loại dữ liệu và đề xuất phương án làm sạch để người dùng xem xét, phê duyệt trước.

### 5.1. Thống kê dữ liệu hiện tại trong Rehearsal DB (`phong_kham_rehearsal_test`)

| Ngày khám | Tổng lượt khám | Hoàn thành | Đang khám | Chờ khám ban đầu | Chờ tái khám CLS | Chờ KQ CLS | Đánh giá dữ liệu |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **2026-11-04** | **204** | 50 | 3 | 115 | 20 | 2 | Nhiều lượt khám tạo tự động theo vòng lặp rehearsal test. |
| **2026-11-03** | **22** | 15 | 0 | 3 | 1 | 3 | Dữ liệu kiểm thử tích hợp ca ngày hôm trước. |
| **2026-10-01** | **7** | 5 | 0 | 0 | 0 | 0 | Dữ liệu mẫu nguyên bản. |

Trong ngày **2026-11-04** đối với Bác sĩ `MaBacSi = 140` có **146 lượt khám**:
- 38 lượt `HOAN_THANH` (có bệnh án, đơn thuốc, chỉ định CLS).
- 1 lượt `DANG_KHAM` (ID #296 – Đang khám demo).
- 2 lượt `CHO_KET_QUA` (ID #292, #454 – Đang làm CLS).
- 18 lượt `CHO_KHAM_LAI` (Đã hoàn thành CLS, đang chờ tái khám).
- 87 lượt `CHO_KHAM` (Chờ khám lần đầu – Trong đó phần lớn là dữ liệu seed tạo hàng loạt).

---

### 5.2. Đề xuất danh sách giữ lại phục vụ Demo chuẩn

Để một buổi demo diễn ra tự nhiên, gọn gàng và đầy đủ tất cả tình huống nghiệp vụ, đề xuất giữ lại **16 lượt khám đại diện**:

| Mục đích Demo | Mã Lượt Khám (`MaLuotKham`) | Bệnh nhân | Phân loại | Ca khám | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **1. Đang khám tại phòng** | `#296` | Trần Văn Khang | P2 (Đặt lịch) | Ca 90 | `DANG_KHAM` |
| **2. Bệnh nhân chờ kết quả CLS** | `#292` | Lê Thị Mai | P2 (Đặt lịch) | Ca 89 | `CHO_KET_QUA` |
| **3. Bệnh nhân chờ kết quả CLS** | `#454` | Hoàng Minh Tuấn | P3 (Trực tiếp) | Ca 91 | `CHO_KET_QUA` |
| **4. Bệnh nhân tái khám CLS (FIFO)** | `#307`, `#313`, `#320` | BN Tái khám CLS | P2 / P3 | Ca 89, 90 | `CHO_KHAM_LAI` |
| **5. Hàng chờ khám ban đầu (P2)** | `#297`, `#298`, `#299` | BN Đặt lịch hẹn | P2 (Ưu tiên 2) | Ca 89 | `CHO_KHAM` |
| **6. Hàng chờ khám ban đầu (P3)** | `#302`, `#304`, `#308` | BN Vãng lai | P3 (Ưu tiên 3) | Ca 89 | `CHO_KHAM` |
| **7. Ca chiều (Ca 91)** | `#314`, `#315` | BN Khám ca chiều | P2 / P3 | Ca 91 | `CHO_KHAM` |
| **8. Đã hoàn thành mẫu** | `#273`, `#276` | BN Đã có đơn thuốc | P2 / P3 | Ca 89 | `HOAN_THANH` |

### 5.3. Đề xuất danh sách dọn dẹp (Cần người dùng xác nhận)
- **Đối tượng**: 78 lượt khám `CHO_KHAM` tạo tự động dư thừa trong ngày `2026-11-04` (không có đơn thuốc, không có phiếu khám lâm sàng).
- **Hành động đề xuất**: Xóa mềm/dọn dẹp các lượt khám dư thừa này trên `phong_kham_rehearsal_test` sau khi người dùng phê duyệt lệnh:
  `Xác nhận dọn dẹp dữ liệu test dư thừa ngày 2026-11-04`.
- **Tuyệt đối an toàn**: Không chạm vào `phong_kham_thong_minh`.

---

## 6. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

Chạy toàn bộ 3 test suite liên quan đến An toàn hệ thống, Nhất quán giao diện bác sĩ, và Tính năng Phase 15.5:

```powershell
php artisan test --filter="Phase155DataSyncPaginationClsTest|Phase154DoctorUiQueueConsistencyTest|Phase15SecurityCsrfSessionAuditTest"
```

**Kết quả thực thi**:
```
   PASS  Tests\Feature\Phase155DataSyncPaginationClsTest
  ✓ 01 stats are mutually exclusive and sum to total                                    1.52s  
  ✓ 02 schedule returns shifts and specialty                                             0.21s  
  ✓ 03 search by patient id and phone                                                    0.27s  
  ✓ 04 cls patients endpoint and stages                                                  0.37s  
  ✓ 05 cls return preserves ticket and updates queue time                                0.29s  
  ✓ 06 real database untouched                                                           0.26s  

   PASS  Tests\Feature\Phase154DoctorUiQueueConsistencyTest
  ✓ 01 dashboard queue strictly orders fifo by thoi gian vao hang                        0.65s  
  ✓ 02 dashboard separates active examining patient from waiting queue                   0.09s  
  ✓ 03 stats waiting count includes both initial and cls reexam patients                 0.10s  
  ✓ 04 patient age calculated correctly or falls back to na                              0.12s  
  ✓ 05 examine screen orders early shift before later shift                              0.16s  
  ✓ 06 filter by shift id isolates queue properly                                        0.12s  
  ✓ 07 call next patient with shift id calls from correct shift                          0.14s  
  ✓ 08 schedule endpoint returns real schedules and shifts                               0.10s  
  ✓ 09 doctor cannot access visits belonging to another doctor                           0.10s  
  ✓ 10 real database untouched                                                           0.06s  

   PASS  Tests\Feature\Phase15SecurityCsrfSessionAuditTest
  ✓ 21 passed (95 assertions)                                                            3.54s  

  Tests:    37 passed (179 assertions)
  Duration: 9.29s
```

### Kiểm tra tính bất biến của Database Thật
```sql
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema = 'phong_kham_thong_minh';
-- Kết quả: 30 bảng

SELECT count(*) as total_visits FROM phong_kham_thong_minh.luot_kham;
-- Kết quả: 23 lượt khám
```
Database thật `phong_kham_thong_minh` **nguyên vẹn 100%**.

---

## 7. TỔNG KẾT FILE ĐÃ CHỈNH SỬA & TẠO MỚI

1. `app/Http/Controllers/BacSiController.php`:
   - Bổ sung `waitingInitial`, `waitingReExam`, `waitingCls` vào `$stats` độc lập, triệt tiêu sai lệch số liệu.
   - Thêm phương thức `clsPatients(Request $request)` phục vụ màn hình quản lý bệnh nhân chờ CLS.
2. `app/Http/Controllers/LuotKhamController.php`:
   - Phân rã độc lập các trạng thái trong `$stats`.
   - Nâng cấp bộ lọc tìm kiếm theo Mã bệnh nhân (`BNxxx` / số ID), SĐT, Họ tên, Số phiếu, Mã lượt khám.
3. `app/Http/Controllers/LichLamViecController.php`:
   - Eager-load chuyên khoa bác sĩ `bacSi.chuyenKhoa`.
4. `resources/js/constants/navigation.ts`:
   - Thêm menu `Bệnh nhân chờ CLS` vào `DOCTOR_NAV_ITEMS`.
5. `resources/js/Pages/Doctor/Schedule.tsx`:
   - Khắc phục lỗi đọc relation snake_case (`ca_khams`), hiển thị chuẩn xác 4 ca khám cùng chỉ tiêu tiếp nhận và chuyên khoa.
6. `resources/js/Pages/Doctor/Examine.tsx`:
   - Hiển thị 6 thẻ thống kê phân rã hoàn toàn độc lập, khớp 100% với CSDL.
7. `resources/js/Pages/Doctor/ClsPatients.tsx` *(Mới)*:
   - Giao diện chuyên biệt theo dõi 5 giai đoạn CLS, xem kết quả và xác nhận bệnh nhân tái khám.
8. `routes/web.php`:
   - Khai báo route `GET /doctor/cls-patients`.
9. `tests/Feature/Phase155DataSyncPaginationClsTest.php` *(Mới)*:
   - 6 test case tự động kiểm thử toàn diện các yêu cầu của Phase 15.5.
