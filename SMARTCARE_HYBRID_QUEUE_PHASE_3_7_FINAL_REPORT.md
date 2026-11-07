# BÁO CÁO TOÀN DIỆN PHASE 3.7 – FINAL REVIEW, FIX & VERIFICATION
**Dự án:** SmartCare Clinic Management – Hệ thống Quản lý Hàng đợi Lai (Hybrid Queue)  
**Thời gian hoàn thành:** 2026-11-04  
**Môi trường thực thi:** CSDL Thử nghiệm `phong_kham_hybrid_queue_test`  
**CSDL Thực tế `phong_kham_thong_minh`:** Được bảo vệ tuyệt đối (0 byte thay đổi, 23 lượt khám nguyên vẹn)

---

## 1. CÁC LỖI ĐÃ TÌM THẤY TRONG ĐỢT RÀ SOÁT CUỐI CÙNG

Trong quá trình rà soát mã nguồn chuyên sâu ở Phase 3.7, hệ thống phát hiện 5 vấn đề nghiệp vụ và kỹ thuật cần chấn chỉnh:

1. **Lỗi 1 (Tiền tố số phiếu bị mất ký tự khi tên chuyên khoa có dấu tiếng Việt):**  
   Hàm `formatTicketNumber()` trước đây bóc tách chữ cái đầu bằng `mb_substr` rồi chạy qua regex `[^A-Za-z0-9]`. Với các chuyên khoa có ký tự đầu là chữ cái tiếng Việt có dấu ngoài bảng ASCII chuẩn (như `Đa Khoa`, `Điều Dưỡng`), ký tự đầu bị regex lọc bỏ hoàn toàn, khiến tiền tố số phiếu bị khuyết hoặc sai định dạng.

2. **Lỗi 2 (Nguy cơ Race Condition khi cùng một bác sĩ gọi khám đồng thời):**  
   Trong `callNextPatient()`, đối tượng `BacSi` chưa được khóa bằng `lockForUpdate()`. Nếu bác sĩ nhấp đúp chuột (double-click) vào nút "Gọi khám" trong khoảng thời gian rất ngắn (vài chục mili-giây), hai transaction có thể cùng chạy qua bước kiểm tra `$activeExaminingVisit` trước khi transaction đầu tiên kịp lưu trạng thái `DANG_KHAM`, dẫn đến việc một bác sĩ bị gán hai ca khám song song.

3. **Lỗi 3 (Thiếu kiểm tra ca khám / lịch làm việc đã bị hủy khi tiếp nhận lịch hẹn):**  
   Trong `checkInAppointment()`, hệ thống chỉ kiểm tra trạng thái của lịch hẹn (`DA_TIEP_NHAN`, `DA_HUY`, `HOAN_THANH`), nhưng chưa kiểm tra trường hợp ca khám (`CaKham`) hoặc lịch trực của bác sĩ (`LichLamViec`) bị quản lý phòng khám hủy (`DA_HUY`). Điều này có thể khiến bệnh nhân check-in vào một ca khám không còn hoạt động.

4. **Lỗi 4 (Thiếu tham số ghi chú triệu chứng lâm sàng ban đầu cho bệnh nhân trực tiếp):**  
   Hàm `registerWalkIn()` chưa cho phép truyền tham số `$ghiChu`, khiến lễ tân không thể nhập lý do khám / triệu chứng ban đầu của bệnh nhân vào cột `luot_kham.GhiChu`.

5. **Lỗi 5 (Hạn chế về tính xác thực của kiểm thử Concurrency ở Phase 3.6):**  
   Ở Phase 3.6, Test 10 và Test 11 được thực thi tuần tự trong cùng một tiến trình PHP duy nhất bằng vòng lặp. Điều này mới chỉ chứng minh được tính đúng đắn về mặt thứ tự tuần tự (FIFO & sequentiality), chưa phải là kiểm thử tương tranh thực tế (True Multi-process / Multi-connection Concurrency) giữa nhiều luồng/tiến trình cạnh tranh tài nguyên CSDL tại cùng một thời điểm.

---

## 2. CÁC LỖI ĐÃ SỬA VÀ NÂNG CẤP KỸ THUẬT

1. **Sửa Lỗi 1 – Chuyển đổi tên chuyên khoa sang ASCII chuẩn:**  
   Sử dụng `\Illuminate\Support\Str::ascii()` để loại bỏ toàn bộ dấu tiếng Việt trước khi tách các từ và trích xuất chữ cái đầu (ví dụ: `Đa Khoa` -> `Da Khoa` -> `DK`, `Ngoại Tổng Quát` -> `NTQ`, `Nhi Khoa` -> `NK`). Bảo đảm tiền tố số phiếu luôn chuẩn xác và không bao giờ rỗng.

2. **Sửa Lỗi 2 – Khóa bi quan bản ghi Bác sĩ (`lockForUpdate` trên `BacSi`):**  
   Bổ sung `$bacSi = BacSi::where('MaBacSi', $maBacSi)->lockForUpdate()->first();` ngay đầu transaction `callNextPatient()`. Đồng thời mở rộng kiểm tra `$activeExaminingVisit` trên phạm vi toàn diện mà không phụ thuộc ngày khám. Nhờ đó, nếu có nhiều yêu cầu gọi khám đồng thời từ cùng một bác sĩ, chỉ có duy nhất một yêu cầu chiếm được khóa để gán ca khám, yêu cầu đến sau phải chờ và sẽ bị chặn an toàn với `RuntimeException` ("Bác sĩ đang có ca khám chưa hoàn tất").

3. **Sửa Lỗi 3 – Chặn tiếp nhận lịch hẹn vào ca/lịch làm việc đã hủy:**  
   Bổ sung kiểm tra:
   ```php
   if ($caKham->TrangThai === 'DA_HUY' || $lichLamViec->TrangThai === 'DA_HUY') {
       throw ValidationException::withMessages([
           'MaCaKham' => 'Ca khám hoặc lịch làm việc liên kết đã bị hủy, không thể tiếp nhận.',
       ]);
   }
   ```

4. **Sửa Lỗi 4 – Bổ sung tham số `$ghiChu` cho tiếp nhận trực tiếp:**  
   Thêm tham số `?string $ghiChu = null` vào `registerWalkIn()` và gán giá trị vào `luot_kham.GhiChu`.

5. **Sửa Lỗi 5 – Xây dựng hệ thống kiểm thử Concurrency đa tiến trình thực tế:**  
   Tạo thư mục `tests/Feature/Workers/` chứa 2 script worker độc lập (`worker_call.php` và `worker_ticket.php`).  
   Tái cấu trúc Test 10 và Test 11 trong `tests/Feature/QueueManagementServiceTest.php` sử dụng `proc_open` để khởi chạy đồng thời nhiều tiến trình PHP CLI độc lập kết nối song song vào MySQL:
   - **Test 10:** 2 tiến trình song song cùng gọi khám cho cùng 1 bác sĩ -> 1 tiến trình thành công, 1 tiến trình bị chặn bởi quy tắc đơn ca.
   - **Test 11:** 5 tiến trình song song cùng sinh số thứ tự trên cùng ca khám -> Cấp phát 5 STT hoàn toàn duy nhất, không trùng lặp, không có deadlock chưa xử lý.

---

## 3. DANH SÁCH FILE ĐÃ THAY ĐỔI

| STT | Đường dẫn file | Thao tác | Mô tả thay đổi |
| :---: | :--- | :---: | :--- |
| 1 | [`app/Services/QueueManagementService.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Services/QueueManagementService.php) | **Cập nhật** | Sửa `formatTicketNumber`, khóa `BacSi` bi quan, kiểm tra ca/lịch bị hủy, thêm `$ghiChu` |
| 2 | [`tests/Feature/QueueManagementServiceTest.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/QueueManagementServiceTest.php) | **Cập nhật** | Nâng cấp toàn bộ 12 test; tích hợp multi-process concurrency qua `proc_open` |
| 3 | [`tests/Feature/Workers/worker_call.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/Workers/worker_call.php) | **Tạo mới** | Worker tiến trình con phục vụ kiểm thử bác sĩ gọi khám đồng thời |
| 4 | [`tests/Feature/Workers/worker_ticket.php`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/Workers/worker_ticket.php) | **Tạo mới** | Worker tiến trình con phục vụ kiểm thử cấp số thứ tự đồng thời |

---

## 4. KẾT QUẢ TỪNG TEST TRONG BỘ KIỂM THỬ (12/12 PASSED)

```bash
php artisan test tests/Feature/QueueManagementServiceTest.php

   PASS  Tests\Feature\QueueManagementServiceTest
  ✓ 01 check in valid appointment creates p2 visit                   0.35s  
  ✓ 02 check in duplicate appointment throws validation exception    0.06s  
  ✓ 03 check in canceled or completed appointment is rejected        0.03s  
  ✓ 04 register walk in valid p3 patient                             0.06s  
  ✓ 05 register walk in invalid department or shift is rejected      0.04s  
  ✓ 06 register walk in rejects p0 and p1                            0.03s  
  ✓ 07 call next patient valid doctor and shift prioritizes p2       0.07s  
  ✓ 08 call next patient doctor not in shift throws authorization    0.04s  
  ✓ 09 call next patient doctor with active exam throws runtime      0.04s  
  ✓ 10 concurrency real multi process doctor call                    0.65s  
  ✓ 11 concurrency real multi process atomic counter                 0.67s  
  ✓ 12 transaction rollback preserves atomic consistency             0.06s  

  Tests:    12 passed (45 assertions)
  Duration: 2.33s
```

### Bảng chi tiết kết quả 12 kịch bản

| ID | Tên kịch bản | Thao tác kiểm tra | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **01** | `test_01_check_in_valid_appointment` | Check-in lịch hẹn hợp lệ #96 | Tạo lượt khám P2, số phiếu `NTQ-C85-003`, LH đổi sang `DA_TIEP_NHAN` | **PASS** |
| **02** | `test_02_check_in_duplicate_appointment` | Check-in lại lịch hẹn #96 | Bắt `ValidationException`: "Lịch hẹn này đã được tiếp nhận..." | **PASS** |
| **03** | `test_03_check_in_canceled_or_completed` | Check-in lịch hẹn đã hủy #54 | Bắt `ValidationException` | **PASS** |
| **04** | `test_04_register_walk_in_valid_p3` | Tiếp nhận bệnh nhân trực tiếp tiêu chuẩn | Tạo lượt khám P3, STT nguyên tử, `MaLichHen = NULL`, lưu `GhiChu` | **PASS** |
| **05** | `test_05_register_walk_in_invalid_dept` | Tiếp nhận trái chuyên khoa | Bắt `ValidationException`: "Ca khám không thuộc chuyên khoa đã chọn" | **PASS** |
| **06** | `test_06_register_walk_in_rejects_p0_p1` | Tiếp nhận với `mucUuTien` = 0 hoặc 1 | Bắt `InvalidArgumentException` giải thích rõ quy định phân luồng | **PASS** |
| **07** | `test_07_call_next_patient_prioritizes_p2` | Bác sĩ gọi khám khi có cả P3 và P2 | Bệnh nhân P2 được gọi trước dù vào hàng sau 10 phút, đổi sang `DANG_KHAM` | **PASS** |
| **08** | `test_08_call_next_patient_wrong_doctor` | Bác sĩ 124 gọi ca 108 của Bác sĩ 1 | Bắt `AuthorizationException`: "Bác sĩ không phụ trách ca khám này" | **PASS** |
| **09** | `test_09_call_next_patient_active_exam` | Bác sĩ 140 đang có ca #256 `DANG_KHAM` | Bắt `RuntimeException`: "Bác sĩ đang có ca khám #256 chưa hoàn tất..." | **PASS** |
| **10** | `test_10_concurrency_real_multi_process` | 2 tiến trình độc lập đồng thời gọi khám | Đúng 1 tiến trình thành công, 1 tiến trình bị từ chối an toàn | **VERIFIED PASS** |
| **11** | `test_11_concurrency_real_atomic_counter` | 5 tiến trình độc lập song song phát số | 5 STT sinh ra hoàn toàn duy nhất, không lỗi deadlock, không trùng STT | **VERIFIED PASS** |
| **12** | `test_12_transaction_rollback` | Giả lập lỗi giữa chừng trong transaction | Rollback 100%, số dòng không đổi, trạng thái lịch hẹn giữ nguyên | **PASS** |

---

## 5. KẾT QUẢ KIỂM THỬ CONCURRENCY ĐA TIẾN TRÌNH

### 5.1. Kiểm thử phát hành số phiếu song song (Test 11)
- **Thiết lập:** 5 tiến trình độc lập (`worker_ticket.php`) cùng chạy trong 0.82 giây trên ca khám #108.
- **Kết quả:**
  ```
  Worker 1: STT=14, SoPhieu=NTQ-C108-014, LK=#296
  Worker 2: STT=18, SoPhieu=NTQ-C108-018, LK=#300
  Worker 3: STT=16, SoPhieu=NTQ-C108-016, LK=#298
  Worker 4: STT=15, SoPhieu=NTQ-C108-015, LK=#297
  Worker 5: STT=17, SoPhieu=NTQ-C108-017, LK=#299
  Tổng STT phát hành: 5 | Số STT duy nhất: 5 / 5 (100% Unique)
  ```
- **Đánh giá:** Câu lệnh Atomic Upsert kết hợp `LAST_INSERT_ID()` hoạt động hoàn hảo, không xảy ra xung đột khóa chết (Deadlock) và bảo đảm tính duy nhất tuyệt đối theo ràng buộc `uq_lk_queue_scope_stt`.

### 5.2. Kiểm thử an toàn bác sĩ đơn ca đồng thời (Test 10)
- **Thiết lập:** 2 tiến trình độc lập (`worker_call.php`) cùng gửi lệnh `callNextPatient` cho Bác sĩ 1 tại cùng một thời điểm.
- **Kết quả:**
  - `Worker 2`: Thành công, nhận lượt khám và chuyển trạng thái sang `DANG_KHAM`.
  - `Worker 1`: Chờ khóa trên `BacSi`, sau đó kiểm tra thấy Bác sĩ 1 đã có ca đang khám -> Ném `RuntimeException` an toàn.
  - **Không bao giờ xảy ra tình trạng bác sĩ nhận 2 ca khám cùng lúc.**

### 5.3. Kiểm thử 2 bác sĩ ở 2 chuyên khoa gọi khám đồng thời
- **Thiết lập:** Bác sĩ 1 (Khoa 1, Ca 108) và Bác sĩ 124 (Khoa 30, Ca 76) cùng gọi khám song song.
- **Kết quả:** Cả hai đều thành công song song mà không khóa lẫn nhau, mỗi bác sĩ nhận đúng bệnh nhân thuộc ca khám của mình.

---

## 6. NHỮNG VẤN ĐỀ CHƯA XÁC MINH (NOT VERIFIED)

1. **Kiểm thử tải trọng cực lớn (High Concurrency Stress Test 500–1000 requests/giây):**  
   Môi trường phát triển cục bộ (XAMPP / Windows 11) chưa mô phỏng được điều kiện hạ tầng sản xuất với Load Balancer và hàng nghìn người dùng đồng thời. Cần kiểm thử tải bổ sung ở giai đoạn Staging.
2. **Trải nghiệm giao diện người dùng (UI / Real-time WebSocket):**  
   Giai đoạn này tập trung vào lớp Dịch vụ CSDL (Service Layer). Khả năng cập nhật màn hình chờ theo thời gian thực (Pusher / Laravel Reverb) cần được kiểm chứng khi xây dựng giao diện.

---

## 7. NHỮNG CHÍNH SÁCH CẦN XÁC NHẬN NGHIỆP VỤ (NEED BUSINESS CONFIRMATION)

Hệ thống ghi nhận 3 vấn đề chính sách cần sự phê duyệt của Hội đồng phòng khám / Nhóm dự án trước khi triển khai thực tế:

> [!IMPORTANT]
> ### 1. Tiêu chí cụ thể để kích hoạt Ưu tiên Chính sách (P1)
> - **NEED BUSINESS CONFIRMATION:** Độ tuổi người cao tuổi được ưu tiên là từ bao nhiêu tuổi trở lên (ví dụ: từ 75 hay 80 tuổi)? Trẻ em dưới mấy tuổi? Phụ nữ mang thai từ tháng thứ mấy? Giấy tờ chứng nhận đối tượng khuyết tật hoặc có công với cách mạng là gì?  
> - *Hiện trạng hệ thống:* Đang chặn $P1$ tại bàn tiếp nhận tiêu chuẩn cho tới khi có chính sách văn bản rõ ràng.

> [!IMPORTANT]
> ### 2. Vị trí tái khám sau khi có kết quả Cận lâm sàng (CLS)
> - **NEED BUSINESS CONFIRMATION:** Khi bệnh nhân hoàn thành xét nghiệm/chụp chiếu và có kết quả (`CHO_KHAM_LAI`), lượt khám cũ được dùng lại. Tuy nhiên, bệnh nhân này sẽ được xếp vào hàng đợi như thế nào:
>   - *Phương án 1:* Khám xen kẽ (Cứ 1 bệnh nhân mới thì đến 1 bệnh nhân tái khám CLS).
>   - *Phương án 2:* Ưu tiên khám ngay sau bệnh nhân đang khám dở.
>   - *Phương án 3 (Hiện tại):* Xếp vào hàng đợi theo mức ưu tiên ban đầu và mốc thời gian vào hàng ban đầu.

> [!IMPORTANT]
> ### 3. Quy định Bỏ lượt (`skipPatient`) và Gọi lại (`recallPatient`) (Batch B)
> - **NEED BUSINESS CONFIRMATION:**
>   - Bác sĩ/y tá phải bấm gọi loa bao nhiêu lần (ví dụ: 3 lần, cách nhau 30 giây) trước khi được phép đánh dấu `BO_LUOT`?
>   - Khi bệnh nhân bị bỏ lượt quay lại trình diện tại quầy lễ tân: bệnh nhân sẽ được chèn sau bao nhiêu lượt tiếp theo (ví dụ: sau 2 lượt tiếp theo) hay phải xếp xuống cuối cùng của hàng đợi ca đó?

---

## 8. XÁC NHẬN BẢO VỆ CƠ SỞ DỮ LIỆU THẬT

Kết quả kiểm tra trực tiếp CSDL thật `phong_kham_thong_minh`:

```
====================================================================
 KIỂM TRA BẢO TOÀN CSDL THỰC TẾ: phong_kham_thong_minh
====================================================================
- Tên CSDL kết nối: phong_kham_thong_minh
- Tổng số bản ghi luot_kham: 23 (Chính xác 100% so với bản backup ban đầu)
- Mã lượt khám lớn nhất (Max ID): 266 (Chính xác 100%)
- Các cột Hybrid Queue mới: KHÔNG TỒN TẠI (Chưa chạy migration trên DB thật)
- Bảng hang_doi_counter: KHÔNG TỒN TẠI (Chưa tạo trên DB thật)
- Dữ liệu bị chỉnh sửa / ghi đè: 0 byte (An toàn tuyệt đối)
====================================================================
```

---

## 9. KẾT LUẬN VÀ TRẠNG THÁI CUỐI CÙNG

Dịch vụ lõi `QueueManagementService.php` đã được kiểm tra, vá các lỗi tiềm ẩn, hoàn thiện tính an toàn đa tiến trình và vượt qua toàn bộ 12 kịch bản kiểm thử nghiêm ngặt trên môi trường CSDL độc lập.

Trạng thái phê duyệt:

### **READY FOR UI INTEGRATION**

*(Đủ điều kiện chuyển sang giai đoạn tích hợp Controller và Giao diện Lễ tân / Bác sĩ. Tuyệt đối không tự ý chạy migration lên CSDL thật `phong_kham_thong_minh` khi chưa có phê duyệt chính thức).*
