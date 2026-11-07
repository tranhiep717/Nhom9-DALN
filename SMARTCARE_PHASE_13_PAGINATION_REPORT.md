# BÁO CÁO NGHIỆM THU PHASE 13: QUEUE PAGINATION & TICKET DISPLAY

---

## 1. TỔNG QUAN HẠNG MỤC PHASE 13

Phase 13 đã hoàn thành toàn bộ các yêu cầu nâng cấp và chuẩn hóa bảng Hàng đợi khám bệnh (Hybrid Queue) tại cả hai giao diện **Lễ tân (`Receptionist/Queue.tsx`)** và **Bác sĩ (`Doctor/Examine.tsx`)**:

1. **Phân trang Server-side bằng Laravel `paginate()`**:
   - Mặc định 10 bản ghi/trang.
   - Hỗ trợ tùy chọn 10, 20, 50 bản ghi/trang (`per_page`).
   - Có đầy đủ nút: Trang trước (`ChevronLeft`), Trang sau (`ChevronRight`), và danh sách các số trang kèm dấu chấm lửng (`...`) khi có nhiều trang.
   - Hiển thị rõ ràng khoảng bản ghi và tổng số: `Hiển thị X - Y trên tổng số Z bản ghi`.
   - Phân trang diễn ra tại backend database qua Laravel Eloquent `paginate()->withQueryString()`, hoàn toàn không tải toàn bộ dữ liệu rồi mới cắt mảng ở frontend.
   - Bộ lọc (Ngày khám, Ca khám, Chuyên khoa, Bác sĩ, Trạng thái) và Từ khóa tìm kiếm được giữ nguyên 100% khi chuyển trang.
   - Thứ tự FIFO chung (`DANG_KHAM` trước, sau đó sắp xếp theo `ThoiGianVaoHang ASC, MaLuotKham ASC`) được bảo toàn tuyệt đối xuyên suốt các trang.
   - Khi làm mới dữ liệu hoặc có thao tác thay đổi số lượng bản ghi: Nếu số trang yêu cầu vượt quá trang cuối cùng (`page > lastPage`), hệ thống tự động fallback về trang hợp lệ gần nhất (`lastPage`) mà không gây rỗng dữ liệu.

2. **Chuẩn hóa Hiển thị Số phiếu và STT Trong Ngày**:
   - **SoPhieu**: Hiển thị nổi bật ở vị trí trung tâm cột phiếu khám với font monospace, viền màu và màu chữ đậm (ví dụ: `NTQ-C89-001`, `TMH-C89-015`).
   - **STTTrongNgay**: Hiển thị nhỏ bên dưới Số phiếu dạng `STT: [X]` (ví dụ `STT: 1`, `STT: 15`).
   - **Bản chất dữ liệu**: `STTTrongNgay` là số thứ tự được cấp trong phạm vi `(NgayKham + MaCaKham + MaChuyenKhoa)` quản lý bởi bảng nguyên tử `hang_doi_counter`, tuyệt đối **không phải số thứ tự dòng trên trang (row index)**. Khi chuyển từ trang 1 sang trang 2, bản ghi thứ 11 vẫn giữ nguyên `STT: 11` và `SoPhieu: ...-011`.
   - **Tính bất biến (Invariance)**: Không đánh lại STT khi phân trang, lọc dữ liệu, hủy lượt hoặc làm mới. Số thứ tự đã sử dụng không bao giờ bị cấp lại cho người khác.
   - **Tính nhất quán**: Số đuôi trong `SoPhieu` luôn tương ứng với `STTTrongNgay`.
   - **Phân loại P2/P3**: Phân loại nghiêm ngặt theo `LoaiHangDoi` (`DAT_LICH` -> Badge Xanh lá `P2 Đặt lịch`, `TRUC_TIEP` -> Badge Tím `P3 Trực tiếp`). Tuyệt đối không để phiếu P3 mang nhãn P2 hoặc ngược lại.

3. **Đồng bộ giữa Lễ tân và Bác sĩ**:
   - Cùng nguồn dữ liệu backend `luot_kham` kết hợp bảng cấu hình `ca_kham`, `chuyen_khoa`, `bac_si`.
   - Cùng thứ tự FIFO sắp xếp theo thời gian vào hàng đợi.
   - Cùng bộ lọc `date`, `shift_id`, `specialty_id`, `doctor_id`, `status`, `search`.
   - Bác sĩ được bổ sung dropdown chọn lọc theo Ca khám (`doctorShifts`) khi có lịch làm việc trong ngày.
   - Khi bác sĩ gọi bệnh nhân hoặc lễ tân tiếp nhận/bỏ lượt, dữ liệu phân trang cập nhật đồng bộ tức thời.

---

## 2. Ý NGHĨA VÀ NGUỒN DỮ LIỆU CÁC TRƯỜNG CỐT LÕI

| Tên trường | Kiểu dữ liệu | Nguồn gốc & Bản chất | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `SoPhieu` | `VARCHAR(50)` | Sinh bởi `QueueManagementService::generateNextTicketNumber` theo định dạng `[PREFIX]-C[MaCaKham]-[STT]`. | Mã định danh phiếu khám hiển thị cho bệnh nhân, bác sĩ và trên hệ thống loa gọi/bảng điện tử. |
| `STTTrongNgay` | `INT UNSIGNED` | Cấp tăng dần nguyên tử từ bảng `hang_doi_counter` theo phạm vi Ngày + Ca + Khoa. | Thứ tự ưu tiên khám bệnh trong ngày của bệnh nhân trong ca/khoa, bất biến không thay đổi. |
| `MaCaKham` | `INT UNSIGNED` | Khóa ngoại tham chiếu bảng `ca_kham`. | Xác định khung giờ khám (vd: 07:00 - 11:30) và bác sĩ phụ trách ca thông qua `lich_lam_viec`. |
| `NgayKham` | `DATE` | Ngày bệnh nhân thực tế đến khám hoặc tiếp nhận. | Phạm vi chu kỳ đếm số thứ tự hàng ngày (reset STT mỗi ngày mới). |
| `MaChuyenKhoa`| `INT UNSIGNED` | Khóa ngoại tham chiếu bảng `chuyen_khoa`. | Xác định chuyên khoa khám bệnh, tiền tố mã khoa trên số phiếu (`NTQ`, `TMH`, `RHM`...) và cách ly hàng đợi. |
| `LoaiHangDoi` | `ENUM` | `DAT_LICH` (P2) hoặc `TRUC_TIEP` (P3) hoặc `CAP_CUU` (P1). | Xác định kênh tiếp nhận, hiển thị huy hiệu phân loại chính xác, xếp vào hàng đợi FIFO chung. |

---

## 3. DANH SÁCH FILE THỰC HIỆN THAY ĐỔI

### 3.1. Backend Controllers
1. [app/Http/Controllers/LichHenController.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LichHenController.php):
   - Thêm tham số `per_page` (10, 20, 50, mặc định 10) và `page` cho `$activeQueueQuery`.
   - Bổ sung bộ lọc `shift_id` (hoặc `ca_kham_id`) và lọc `status` cho hàng đợi.
   - Triển khai phân trang server-side với `paginate($perPage, ['*'], 'page', $page)->withQueryString()`.
   - Cơ chế tự động kiểm tra và chuyển về `$activeQueue->lastPage()` nếu `page > lastPage`.
   - Gán `call_count` và `can_skip` trên `getCollection()`.
   - Cập nhật số liệu `stats` để không bị giới hạn trong 10 dòng của trang hiện tại.
2. [app/Http/Controllers/LuotKhamController.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/app/Http/Controllers/LuotKhamController.php):
   - Phân trang server-side cho giao diện Bác sĩ (`Doctor/Examine`) với `paginate($perPage)`.
   - Bổ sung bộ lọc `date`, `shift_id`, `specialty_id`, `status`, `search`.
   - Đồng bộ hoàn toàn thứ tự FIFO với màn hình Lễ tân.
   - Xử lý nạp `selectedVisit` an toàn ngay cả khi lượt khám được chọn nằm ở trang khác.

### 3.2. Frontend Views
1. [resources/js/Pages/Receptionist/Queue.tsx](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Pages/Receptionist/Queue.tsx):
   - Định nghĩa interface `PaginatedData<Visit>`.
   - Hỗ trợ nhận dữ liệu phân trang `PaginatedData<Visit> | Visit[]`.
   - Thiết kế thanh phân trang responsive chuyên nghiệp:
     - Chọn số bản ghi: 10, 20, 50 bản ghi/trang.
     - Hiển thị khoảng bản ghi: `Hiển thị X - Y trên tổng số Z bản ghi`.
     - Nút "Trang trước", các nút số trang kèm ellipsis, nút "Trang sau".
   - Logic `handlePageChange` và `handlePerPageChange` bảo toàn nguyên vẹn bộ lọc tìm kiếm.
   - Hiển thị `SoPhieu` nổi bật và `STT: [X]` nhỏ bên dưới.
   - Chuẩn hóa logic nhận diện P2/P3 nghiêm ngặt theo `LoaiHangDoi`.
2. [resources/js/Pages/Doctor/Examine.tsx](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Pages/Doctor/Examine.tsx):
   - Định nghĩa interface `PaginatedData<LuotKham>`.
   - Thêm dropdown lọc Ca khám của Bác sĩ (`doctorShifts`).
   - Tích hợp thanh phân trang gọn gàng dưới danh sách hàng chờ bệnh nhân (chọn 10/20/50, nút Trước/Sau, hiển thị trang X / Y).
   - Hiển thị `SoPhieu` và `STT: [X]` nhỏ bên dưới trong từng mục hàng chờ.
   - Bổ sung hiển thị `STT: [X]` trên thanh tiêu đề thẻ hồ sơ người khám đang chọn.
   - Phân loại P2/P3 đúng chuẩn.

### 3.3. Test Suites
1. [tests/Feature/Phase13QueuePaginationTest.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/Phase13QueuePaginationTest.php):
   - 10 test cases toàn diện kiểm tra phân trang 10/20/50, bảo toàn bộ lọc, bảo toàn STT, thứ tự FIFO, tìm kiếm kết hợp phân trang, fallback trang hợp lệ, đồng bộ bác sĩ và bảo toàn DB thật.
2. [tests/Feature/HybridQueueControllerIntegrationTest.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/HybridQueueControllerIntegrationTest.php):
   - Chuẩn hóa regex số phiếu hỗ trợ STT $\ge 1000$ (`\d{3,}`).
3. [tests/Feature/Phase10BrowserSmokeTest.php](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/tests/Feature/Phase10BrowserSmokeTest.php):
   - Tự động bù tồn kho thuốc mẫu trước khi kê đơn, đảm bảo test chạy độc lập và ổn định.

---

## 4. KẾT QUẢ KIỂM THỬ TỔNG HỢP

### 4.1. Automated Test Suite (Toàn bộ hệ thống)

Tất cả **9 nhóm kiểm thử** với **82 tests** đều đạt chuẩn **PASS (100%)** với **1.895 assertions**:

```text
   PASS  Tests\Feature\HybridQueueAcceptancePhase6Test (3 tests)
   PASS  Tests\Feature\HybridQueueControllerIntegrationTest (7 tests)
   PASS  Tests\Feature\HybridQueuePolicy51Test (15 tests)
   PASS  Tests\Feature\HybridQueuePolicy53Test (16 tests)
   PASS  Tests\Feature\Phase10BrowserSmokeTest (9 tests)
   PASS  Tests\Feature\Phase12ReceptionQueueCorrectionTest (8 tests)
   PASS  Tests\Feature\Phase13QueuePaginationTest (10 tests)
   PASS  Tests\Feature\Phase9IntegrationFixesTest (5 tests)
   PASS  Tests\Feature\QueueManagementServiceTest (12 tests)

   Tests:    82 passed (1.895 assertions)
   Duration: 9.69s
```

### 4.2. Chi tiết 10 Test Cases của Phase 13

| STT | Tên Test Case | Mục đích kiểm tra | Kết quả |
| :---: | :--- | :--- | :---: |
| 01 | `test_01_queue_pagination_defaults_to_10_records` | Trên 10 bản ghi: phân trang tự kích hoạt, mặc định 10 bản ghi/trang | **PASS** |
| 02 | `test_02_queue_pagination_page_2_retains_persistent_stt` | Chuyển sang trang 2: lấy 5 bản ghi tiếp theo, STT và Số phiếu không bị thay đổi | **PASS** |
| 03 | `test_03_queue_pagination_switch_per_page_to_20` | Chuyển per_page từ 10 sang 20: hiển thị toàn bộ 15 bản ghi trong 1 trang | **PASS** |
| 04 | `test_04_fifo_order_preserved_across_pagination` | Thứ tự FIFO giữa P2 và P3 được bảo toàn qua các trang (trang 1 vào trước trang 2) | **PASS** |
| 05 | `test_05_search_works_with_pagination` | Tìm kiếm theo số phiếu/tên hoạt động chính xác kết hợp phân trang | **PASS** |
| 06 | `test_06_page_change_preserves_filters` | Chuyển trang giữ nguyên toàn bộ bộ lọc ngày, bác sĩ, ca khám, chuyên khoa | **PASS** |
| 07 | `test_07_invalid_page_beyond_last_page_fallback` | Nhập page vượt quá last_page (vd: 999): tự động fallback về trang hợp lệ cuối | **PASS** |
| 08 | `test_08_doctor_examine_queue_pagination_and_ticket_display` | Hàng chờ Bác sĩ (/doctor/examine) phân trang đồng bộ, hiển thị Số phiếu & STT | **PASS** |
| 09 | `test_09_stt_invariance_on_cancellation_or_status_change` | Hủy hoặc bỏ lượt không làm đánh lại STT của bất kỳ lượt khám nào khác | **PASS** |
| 10 | `test_10_real_database_untouched` | Database thật `phong_kham_thong_minh` nguyên vẹn 100% | **PASS** |

### 4.3. Frontend Build Assets
- Lệnh thực thi: `npm run build` (`tsc && vite build`).
- Kết quả: **Thành công 100%, 0 lỗi TypeScript, 0 lỗi Vite** (Thời gian build: 22.70s).
- Các bundle `Queue-Cp-fYCrY.js` và `Examine-O_0jB5Jj.js` được tạo thành công với đầy đủ chức năng phân trang.

---

## 5. CAM KẾT AN TOÀN DATABASE THẬT (`phong_kham_thong_minh`)

Đã kiểm tra xác nhận độc lập tại Test 10:
- **Tên Database**: `phong_kham_thong_minh`
- **Số lượng bảng**: **30 bảng** (không thêm bảng mới)
- **Số lượng lượt khám**: **23 bản ghi** (nguyên vẹn)
- **Cột `LoaiHangDoi`**: **Chưa tồn tại trên database thật**
- Mọi hoạt động kiểm thử Phase 13 chạy hoàn toàn trên database test `phong_kham_hybrid_queue_test`.
