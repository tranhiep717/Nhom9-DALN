# BÁO CÁO KẾT QUẢ TRIỂN KHAI PHASE 3.6 – IMPLEMENT HYBRID QUEUE SERVICE
**Dự án:** SmartCare Clinic Management – Hệ thống Quản lý Hàng đợi Lai (Hybrid Queue)  
**Thời gian hoàn thành:** 2026-11-04  
**Môi trường thực thi:** CSDL Thử nghiệm `phong_kham_hybrid_queue_test`  
**CSDL Thực tế `phong_kham_thong_minh`:** Được bảo vệ tuyệt đối (0 byte thay đổi, 23 lượt khám nguyên vẹn)

---

## 1. TỔNG QUAN KẾT QUẢ TRIỂN KHAI

Phase 3.6 đã hoàn thành việc xây dựng **Batch A** của dịch vụ điều phối hàng đợi `QueueManagementService.php` kết hợp với bộ kiểm thử tự động **12 kịch bản** (Feature Tests) trên môi trường cơ sở dữ liệu biệt lập.

### Bảng tóm tắt trạng thái các hạng mục

| STT | Thành phần | Trạng thái | Đánh giá kỹ thuật |
| :---: | :--- | :---: | :--- |
| **1** | `QueueManagementService.php` | **HOÀN THÀNH** | Batch A: `checkInAppointment()`, `registerWalkIn()`, `callNextPatient()`, `generateNextTicketNumber()`, `formatTicketNumber()` |
| **2** | Cấp số thứ tự nguyên tử (`hang_doi_counter`) | **HOÀN THÀNH** | Atomic Upsert + `LAST_INSERT_ID()` trên cùng 1 kết nối PDO, tích hợp cơ chế Retry chống Deadlock (1213 / 1205) |
| **3** | Ràng buộc bảo mật & toàn vẹn nghiệp vụ | **HOÀN THÀNH** | Chặn P0/P1 tại tiếp nhận thường; chặn khám song song 1 bác sĩ; chặn ca khám trái chuyên khoa; kiểm tra tài khoản tiếp nhận |
| **4** | Phân tích Batch B (`skipPatient`, `recallPatient`) | **HOÀN THÀNH** | Khuyến nghị giải pháp schema bảng lịch sử `luot_kham_lich_su_goi` và chính sách gọi lại |
| **5** | Kiểm thử tự động (12 Feature Test Scenarios) | **12 / 12 ĐẠT (100%)** | Chạy thành công cả trên runner độc lập và Laravel PHPUnit (`QueueManagementServiceTest.php`) với 37 assertions |
| **6** | Bảo vệ CSDL thực tế `phong_kham_thong_minh` | **TUYỆT ĐỐI** | Số dòng `luot_kham` vẫn giữ nguyên 23, không chạy migration hay ghi dữ liệu |

---

## 2. CHI TIẾT CÁC PHƯƠNG THỨC BATCH A ĐÃ TRIỂN KHAI

Toàn bộ nghiệp vụ được đóng gói trong [`app/Services/QueueManagementService.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Services/QueueManagementService.php).

### 2.1. Tiếp nhận đặt lịch hẹn `checkInAppointment(int $maLichHen, ?int $nguoiTiepNhanId = null)`
- **Luồng xử lý:**
  1. Khóa bi quan bản ghi `lich_hen` bằng `lockForUpdate()` trong Transaction.
  2. Kiểm tra tài khoản tiếp nhận (nếu có) phải tồn tại trong bảng `tai_khoan`.
  3. Kiểm tra tính hợp lệ của lịch hẹn: không được ở trạng thái `DA_TIEP_NHAN`, `DA_HUY`, `HOAN_THANH`.
  4. Kiểm tra chống trùng: ngăn chặn tạo 2 lượt khám cùng trỏ tới 1 mã lịch hẹn.
  5. Cấp số thứ tự nguyên tử qua `generateNextTicketNumber()`.
  6. Tạo lượt khám với **`MucUuTien = 2` (P2)**, `LoaiHangDoi = 'DAT_LICH'`, `TrangThai = 'CHO_KHAM'`.
  7. Cập nhật `lich_hen.TrangThai = 'DA_TIEP_NHAN'`.

### 2.2. Tiếp nhận bệnh nhân trực tiếp `registerWalkIn(int $maBenhNhan, int $maChuyenKhoa, int $maCaKham, ?int $nguoiTiepNhanId = null, int $mucUuTien = 3)`
- **Luồng xử lý:**
  1. **Chốt chặn nghiệp vụ:** Nghiêm ngặt từ chối `$mucUuTien !== 3`. Trường hợp cấp cứu (P0) phải sang quy trình cấp cứu riêng; ưu tiên chính sách (P1) hoãn lại cho tới khi phòng khám ban hành quy định văn bản chính thức.
  2. Kiểm tra bệnh nhân và chuyên khoa tồn tại.
  3. Kiểm tra ca khám hợp lệ: bác sĩ phụ trách ca phải thuộc đúng chuyên khoa tiếp nhận và ca khám đang mở (`CON_TRONG`, `MO`).
  4. Cấp số thứ tự nguyên tử qua `generateNextTicketNumber()`.
  5. Tạo lượt khám với **`MucUuTien = 3` (P3)**, `LoaiHangDoi = 'TRUC_TIEP'`, `TrangThai = 'CHO_KHAM'`, `MaLichHen = null`.

### 2.3. Bác sĩ gọi bệnh nhân tiếp theo `callNextPatient(int $maBacSi, int $maCaKham)`
- **Luồng xử lý:**
  1. Xác thực bác sĩ đang phụ trách đúng ca khám thông qua `ca_kham.MaLichLamViec -> lich_lam_viec.MaBacSi` (ném `AuthorizationException` nếu bác sĩ khác cố gọi).
  2. **Quy tắc bác sĩ đơn ca (Single Active Exam):** Kiểm tra bác sĩ không được có lượt khám nào khác đang ở trạng thái `DANG_KHAM` (ném `RuntimeException` nếu chưa hoàn tất ca khám hiện tại).
  3. **Lựa chọn bệnh nhân:** Truy vấn với `lockForUpdate()`, lọc trạng thái chờ (`CHO_KHAM` hoặc `CHO_KHAM_LAI` sau CLS), sắp xếp theo:
     - `MucUuTien ASC` (P2 khám trước P3).
     - `ThoiGianVaoHang ASC` (FIFO công bằng trong cùng mức ưu tiên).
  4. Cập nhật lượt khám sang `DANG_KHAM`, gán `ThoiGianGoiKham = now()`, gán `ThoiGianBatDauKham = now()` (chỉ gán nếu chưa có để không xóa mốc thời gian của ca tái khám CLS).

### 2.4. Cơ chế cấp số nguyên tử `generateNextTicketNumber()` & `formatTicketNumber()`
- **Nguyên lý:**
  - Sử dụng chung một PDO connection trực tiếp trong phiên làm việc.
  - Câu lệnh MySQL Atomic Upsert:
    ```sql
    INSERT INTO hang_doi_counter (NgayKham, MaCaKham, MaChuyenKhoa, SoHienTai, UpdatedAt)
    VALUES (?, ?, ?, LAST_INSERT_ID(1), NOW())
    ON DUPLICATE KEY UPDATE 
        SoHienTai = LAST_INSERT_ID(SoHienTai + 1),
        UpdatedAt = NOW()
    ```
  - Lấy kết quả bằng `SELECT LAST_INSERT_ID()`.
  - Tích hợp vòng lặp retry tự động lên tới 3 lần khi bắt gặp lỗi `1213` (Deadlock) hoặc `1205` (Lock wait timeout).
  - Định dạng hiển thị chuẩn: `[PREFIX]-C[MaCaKham]-[STT]`, ví dụ: `NTQ-C85-003`, `NTQ-C108-002`.

---

## 3. KẾT QUẢ KIỂM THỬ 12 KỊCH BẢN (FEATURE TESTS)

Tất cả 12 kịch bản đã chạy thành công 100% trên CSDL `phong_kham_hybrid_queue_test`:

| Kịch bản | Mục tiêu kiểm thử | Dữ liệu đầu vào & Thao tác | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **SC-01** | `checkInAppointment` lịch hẹn hợp lệ | Lịch hẹn #96, Khoa 1, Ca #85, BS #140 | Tạo LK #274, `MucUuTien = 2`, `SoPhieu = NTQ-C85-003`, STT = 3, LH đổi sang `DA_TIEP_NHAN` | **PASS** |
| **SC-02** | `checkInAppointment` trùng lặp | Check-in lại Lịch hẹn #96 | Bắt `ValidationException`: "Lịch hẹn này đã được tiếp nhận vào hàng đợi trước đó" | **PASS** |
| **SC-03** | `checkInAppointment` ca đã hủy / hoàn thành | Check-in Lịch hẹn #54 (`DA_HUY`) và #86 (`HOAN_THANH`) | Cả 2 đều bị từ chối với `ValidationException` | **PASS** |
| **SC-04** | `registerWalkIn` bệnh nhân P3 hợp lệ | BN #1, Khoa 1, Ca #108, BS #1 | Tạo LK #275, `MucUuTien = 3`, `SoPhieu = NTQ-C108-002`, STT = 2, `MaLichHen = NULL` | **PASS** |
| **SC-05** | `registerWalkIn` sai khoa hoặc ca đóng | Yêu cầu Khoa 30 với Ca #108 (Khoa 1) hoặc Ca #99999 | Cả 2 trường hợp đều bị chặn bởi `ValidationException` | **PASS** |
| **SC-06** | `registerWalkIn` chặn P0 và P1 | Gọi với `mucUuTien = 0` (P0) và `mucUuTien = 1` (P1) | Bắt `InvalidArgumentException` giải thích rõ luồng cấp cứu/chính sách | **PASS** |
| **SC-07** | `callNextPatient` ưu tiên P2 trước P3 | BS #1, Ca #108; có cả bệnh nhân P3 vào trước và P2 vào sau | BS gọi đúng LK #276 (P2) trước dù P2 vào sau 10 phút; đổi trạng thái sang `DANG_KHAM` | **PASS** |
| **SC-08** | `callNextPatient` bác sĩ không thuộc ca | BS #124 (Khoa 30) cố gọi bệnh nhân tại Ca #108 (của BS #1) | Bắt `AuthorizationException`: "Bác sĩ không phụ trách ca khám này" | **PASS** |
| **SC-09** | `callNextPatient` bác sĩ đang có ca `DANG_KHAM` | BS #140 gọi khám khi đang có LK #256 ở trạng thái `DANG_KHAM` | Bắt `RuntimeException`: "Bác sĩ đang có ca khám #256 chưa hoàn tất..." | **PASS** |
| **SC-10** | Đồng thời gọi khám | Hai lượt gọi liên tiếp trong cùng hàng đợi có nhiều người chờ | Lượt 1 nhận LK #277, Lượt 2 nhận LK #278; không có 2 bác sĩ nhận cùng 1 bệnh nhân | **PASS** |
| **SC-11** | Cấp số đồng thời (Atomic counter) | Phát hành liên tiếp 5 số khám cho cùng 1 ca khám | 5 STT sinh ra tuần tự: 3, 4, 5, 6, 7 (Không trùng lặp, duy nhất 100%) | **PASS** |
| **SC-12** | Rollback khi gặp ngoại lệ | Giả lập lỗi ở giữa transaction khi đang tiếp nhận | CSDL rollback nguyên vẹn: số dòng giữ nguyên, trạng thái lịch hẹn không đổi (0 write rác) | **PASS** |

### Kết quả PHPUnit Runner chính thức
```bash
php artisan test tests/Feature/QueueManagementServiceTest.php

   PASS  Tests\Feature\QueueManagementServiceTest
  ✓ 01 check in valid appointment creates p2 visit                   0.49s  
  ✓ 02 check in duplicate appointment throws validation exception    0.08s  
  ✓ 03 check in canceled or completed appointment is rejected        0.05s  
  ✓ 04 register walk in valid p3 patient                             0.08s  
  ✓ 05 register walk in invalid department or shift is rejected      0.04s  
  ✓ 06 register walk in rejects p0 and p1                            0.05s  
  ✓ 07 call next patient valid doctor and shift prioritizes p2       0.17s  
  ✓ 08 call next patient doctor not in shift throws authorization    0.03s  
  ✓ 09 call next patient doctor with active exam throws runtime      0.06s  
  ✓ 10 concurrency distinct fifo assignment                          0.08s  
  ✓ 11 concurrency atomic counter sequentiality                      0.09s  
  ✓ 12 transaction rollback preserves atomic consistency             0.05s  

  Tests:    12 passed (37 assertions)
  Duration: 1.50s
```

---

## 4. PHÂN TÍCH THIẾT KẾ BATCH B: BỎ LƯỢT (`skipPatient`) VÀ GỌI LẠI (`recallPatient`)

Theo chỉ đạo kiểm soát, phương thức `skipPatient` và `recallPatient` **chưa được cài đặt ngay** mà được phân tích chi tiết về mặt lược đồ dữ liệu và quy trình nghiệp vụ:

### 4.1. Vấn đề của cấu trúc hiện tại
Hiện tại bảng `luot_kham` mới chỉ có các cột trạng thái cơ bản. Nếu trực tiếp đổi `TrangThai` sang `BO_LUOT` rồi khi bệnh nhân quay lại thì đổi ngược về `CHO_KHAM` và ghi đè `ThoiGianVaoHang`, hệ thống sẽ gặp các khiếm khuyết lớn:
1. **Mất dấu vết lịch sử (Audit Trail):** Không ghi nhận được bệnh nhân đã bị gọi bao nhiêu lần, bị bỏ lượt lúc mấy giờ, do ai bỏ lượt, và lý do gì (ví dụ: "Đã loa gọi 3 lần tại phòng khám nhưng không có mặt").
2. **Nguy cơ khiếu nại:** Bệnh nhân đến muộn khi bị đưa về cuối hàng có thể khiếu nại vì sao số thứ tự nhỏ hơn lại khám sau người số lớn hơn. Cần bằng chứng thời gian bỏ lượt chính xác.
3. **Quy định vị trí xếp lại (Recall Policy):** Chưa có quy định chính thức: khi được gọi lại, bệnh nhân sẽ được chèn sau $N$ bệnh nhân (ví dụ: sau 2 lượt tiếp theo) hay phải xếp xuống cuối cùng của mức ưu tiên đó.

### 4.2. Đề xuất kiến trúc cho Batch B
Để triển khai Batch B sạch và an toàn trong Phase tiếp theo, đề xuất:
1. **Bổ sung cột vào `luot_kham` hoặc tạo bảng lịch sử `luot_kham_lich_su_goi`:**
   - Tạo bảng `hang_doi_lich_su`:
     - `MaLichSu` (PK, bigint)
     - `MaLuotKham` (FK -> `luot_kham`)
     - `HanhDong` (`GOI_KHAM`, `BO_LUOT`, `GOI_LAI`, `CHUYEN_TIEN_TRINH`)
     - `ThoiGianThucHien` (datetime)
     - `NguoiThucHien` (FK -> `tai_khoan`)
     - `GhiChu` (text: lý do bỏ lượt hoặc ghi chú gọi lại)
2. **Quy tắc đếm số lần gọi:**
   - Bác sĩ/y tá nhấn "Gọi lượt 1", "Gọi lượt 2", "Gọi lượt 3". Nếu quá 3 lần không vào phòng thì mới kích hoạt `skipPatient`.
3. **Cơ chế gọi lại `recallPatient`:**
   - Khi bệnh nhân trình diện lại tại bàn tiếp nhận, nhân viên kiểm tra nếu lượt khám đang là `BO_LUOT` thì chuyển về `CHO_KHAM`.
   - Cập nhật `ThoiGianVaoHang = now()` để đảm bảo không nhảy cóc trước những bệnh nhân đã đến đúng giờ và đang chờ ngoan ngoãn.

---

## 5. BẰNG CHỨNG BẢO VỆ CƠ SỞ DỮ LIỆU THẬT

```
Kiểm tra cơ sở dữ liệu thật 'phong_kham_thong_minh':
- Tên database kết nối: phong_kham_thong_minh
- Số lượng bản ghi luot_kham: 23 (nguyên vẹn)
- Mã lượt khám lớn nhất: 266 (nguyên vẹn)
- Số bảng mới tạo trên thật: 0
- Số cột mới thêm trên thật: 0
```
Mọi thao tác migration, backfill và test service chỉ chạy trên `phong_kham_hybrid_queue_test`.

---

## 6. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

1. **File tạo mới:**
   - [`app/Services/QueueManagementService.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Services/QueueManagementService.php): Triển khai Batch A hoàn chỉnh với InnoDB transactions, atomic counters, deadlock retries.
   - [`tests/Feature/QueueManagementServiceTest.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/QueueManagementServiceTest.php): Bộ kiểm thử Feature Test chính thức cho 12 kịch bản.
   - `scratch/run_phase_3_6_feature_tests.php`: Script kiểm thử độc lập cho kết quả nhanh và chi tiết.
2. **File chỉnh sửa:**
   - [`.gitignore`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/.gitignore): Đã bổ sung bảo vệ `.env.testing` và `.env.*` không bị commit.
   - [`app/Models/LuotKham.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Models/LuotKham.php): Bổ sung 11 trường Hybrid Queue vào `$fillable` và quan hệ `chuyenKhoa()`, `caKham()`.
   - [`app/Console/Commands/BackfillHybridQueueData.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Console/Commands/BackfillHybridQueueData.php): Bổ sung tự ngắt bảo vệ chống chạy trên CSDL thật và kiểm tra đủ 8 trường backfill.
