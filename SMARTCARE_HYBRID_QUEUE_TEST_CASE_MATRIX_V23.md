# SMARTCARE HYBRID QUEUE – TEST CASE MATRIX (VERSION 2.3)
## MA TRẬN 56 TEST CASE KIỂM THỬ THỰC TẾ & CHUẨN HÓA ĐIỀU KIỆN KIỂM CHỨNG GIAO DỊCH

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V23.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V23.md)  
> **Tổng số Test Cases:** **ĐÚNG 56 TEST CASES** (Chốt cứng và đồng bộ 100% qua tất cả các tài liệu)  
> **Phân loại phương thức:** PHPUnit Automated: 28 | Concurrency 2 tiến trình độc lập: 18 | Manual / Browser UI: 10  
> **Kiến trúc Transaction:** Chuẩn hóa theo **Phương Án B (Autonomous Claim Tx + Fenced Business Tx)**  
> **Cam kết an toàn tuyệt đối:** 100% test case hiện ở trạng thái **`CHƯA THỰC THI (NOT TESTED)`**. Tuyệt đối không tự ý đánh dấu PASS khi chưa có log thực nghiệm trên DB Clone.  
> **Trạng thái phê duyệt:** `NOT APPROVED – MIGRATION MUST NOT BE CREATED`.

---

### MỤC LỤC DANH MỤC TEST CASES

1. **Nhóm 1: Ràng Buộc Bất Biến & Trigger Guard (TC-IMM-001 đến TC-IMM-008)** — 8 Test Cases
2. **Nhóm 2: Sổ Cấp Số, Fencing Token & Khóa Ngoại (TC-TKT-001 đến TC-TKT-008)** — 8 Test Cases
3. **Nhóm 3: Ma Trận Concurrency Trọng Yếu Độc Lập (TC-CON-001 đến TC-CON-018)** — 18 Test Cases
4. **Nhóm 4: Vòng Đời Nghiệp Vụ Khám Bệnh & Điều Phối (TC-BIZ-001 đến TC-BIZ-012)** — 12 Test Cases
5. **Nhóm 5: Tính Toàn Vẹn Khóa Ngoại & Chính Sách Xóa (TC-FK-001 đến TC-FK-005)** — 5 Test Cases
6. **Nhóm 6: Quy Trình Migration 4 Bước & Backfill Dữ Liệu (TC-MIG-001 đến TC-MIG-006)** — 6 Test Cases
7. **Nhóm 7: Kiểm Thử Thủ Công Giao Diện & Trình Duyệt (TC-UI-001 đến TC-UI-007)** — 7 Test Cases (Mở rộng tổng hợp 10 kịch bản kiểm tra UI)

---

### NHÓM 1: RÀNG BUỘC BẤT BIẾN & TRIGGER GUARD (B-01, B-09)

#### TC-IMM-001: Chặn sửa `MaLichHen` từ giá trị cũ sang giá trị mới (A -> B)
- **Mục tiêu:** Chứng minh Trigger cấm 100% việc tráo đổi lịch hẹn của một lượt khám đã tạo.
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php` (L17), Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `MaLichHen` giữ nguyên giá trị 1.
- **Hành vi Khóa mong đợi:** Exclusive row lock ngắn trên dòng `luot_kham` #1, rollback ngay khi trigger ném signal.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Mã lỗi MySQL SQLSTATE `45000`, message lỗi tiếng Việt, kết quả `SELECT MaLichHen FROM luot_kham WHERE MaLuotKham = 1`.
- **Điều kiện PASS:** MySQL ném đúng SQLSTATE 45000, giá trị `MaLichHen` trong database vẫn giữ nguyên là 1.
- **Điều kiện FAIL:** Lệnh UPDATE thành công hoặc trả về lỗi khác 45000.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-002: Chặn xóa `MaLichHen` về NULL (A -> NULL)
- **Mục tiêu:** Chứng minh không thể gỡ bỏ liên kết lịch hẹn của lượt khám đặt lịch.
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php`, Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `MaLichHen` giữ nguyên giá trị 86.
- **Hành vi Khóa mong đợi:** Row lock giải phóng ngay sau rollback.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Mã SQLSTATE 45000, giá trị `MaLichHen` sau câu lệnh vẫn là 86.
- **Điều kiện PASS:** Câu lệnh UPDATE bị rollback 100%, ném SQLSTATE 45000.
- **Điều kiện FAIL:** Cột `MaLichHen` bị cập nhật thành NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-003: Chặn gán bổ sung `MaLichHen` cho ca trực tiếp ban đầu (NULL -> A)
- **Mục tiêu:** Chứng minh toán tử NULL-safe `<=>` chặn đứng việc gán bù lịch hẹn cho ca trực tiếp.
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php`, Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `MaLichHen` giữ nguyên giá trị NULL.
- **Hành vi Khóa mong đợi:** Row lock giải phóng ngay sau rollback.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `SELECT MaLichHen FROM luot_kham WHERE MaLuotKham = 100` vẫn trả về NULL.
- **Điều kiện PASS:** Ném SQLSTATE 45000, giá trị vẫn là NULL.
- **Điều kiện FAIL:** Cột `MaLichHen` nhận giá trị khác NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-004: Cho phép UPDATE trường lâm sàng khi `MaLichHen` không đổi
- **Mục tiêu:** Chứng minh Trigger không chặn các thao tác cập nhật trạng thái khám bệnh thông thường.
- **File / Method / Dòng code liên quan:** `app/Http/Controllers/LuotKhamController.php` (L363-366, L477-481).
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `TrangThai = 'DANG_KHAM'`.
- **Hành vi Khóa mong đợi:** Row lock thành công và commit.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Số dòng affected = 1, `TrangThai` chuyển sang `DANG_KHAM`.
- **Điều kiện PASS:** Cả 2 câu lệnh UPDATE thành công, không ném lỗi 45000.
- **Điều kiện FAIL:** Bị trigger chặn nhầm khi giá trị `MaLichHen` giữ nguyên.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-005: Chặn sửa đổi cột `MaPhamVi` sau khi đã khởi tạo
- **Mục tiêu:** Bảo toàn tính bất biến của mã phạm vi điều phối ban đầu.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `MaPhamVi` giữ nguyên giá trị cũ.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `MaPhamVi` không thay đổi.
- **Điều kiện PASS:** Ném đúng lỗi 45000 chặn sửa trường cấp số bất biến.
- **Điều kiện FAIL:** Cập nhật thành công sang scope mới.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-006: Chặn sửa đổi cột `STTTrongNgay` sau khi đã khởi tạo
- **Mục tiêu:** Bảo đảm số thứ tự hàng đợi không bao giờ bị thay đổi sau khi cấp.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `STTTrongNgay` giữ nguyên.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `STTTrongNgay` giữ nguyên.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Cập nhật thành công số thứ tự mới.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-007: Chặn sửa đổi cột `SoPhieu` sau khi đã khởi tạo
- **Mục tiêu:** Bảo đảm mã định danh số phiếu in trên giấy của bệnh nhân là bất biến.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `SoPhieu` giữ nguyên.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `SoPhieu` không đổi.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Sửa thành công `SoPhieu`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-008: Chặn sửa đổi cột `MaChuyenKhoa` sau khi đã khởi tạo
- **Mục tiêu:** Giữ vững chuyên khoa gốc tiếp nhận bệnh nhân.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Ranh giới Transaction:** Đơn giao dịch UPDATE.
- **Trạng thái DB mong đợi:** `MaChuyenKhoa` giữ nguyên.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `MaChuyenKhoa` giữ nguyên.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Sửa thành công sang chuyên khoa khác.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 2: SỔ CẤP SỐ, FENCING TOKEN & KHÓA NGOẠI (B-05, B-06, B-16, B-21)

#### TC-TKT-001: Cấp số thứ tự đầu tiên khởi tạo `FenceToken = 0` (B-21)
- **Mục tiêu:** Chứng minh quy ước B-21: khi sinh phiếu `DA_CAP`, `FenceToken` nhận giá trị 0.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Ranh giới Transaction:** Transaction 1 (Allocation Tx) commit ngay.
- **Trạng thái DB mong đợi:** `STTTrongNgay = 1`, `FenceToken = 0`, `TrangThai = 'DA_CAP'`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi trong `so_cap_so_phieu` có `STTTrongNgay = 1`, `FenceToken = 0`, `TrangThai = 'DA_CAP'`.
- **Điều kiện PASS:** `STTTrongNgay === 1` VÀ `FenceToken === 0` VÀ `TrangThai === 'DA_CAP'`.
- **Điều kiện FAIL:** `FenceToken` khởi tạo khác 0 hoặc STT khác 1.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-002: Cấp số liên tiếp trong cùng ngày (STT = 2, 3...) độc lập theo bác sĩ
- **Mục tiêu:** Kiểm tra bộ đếm tăng đơn điệu cho các yêu cầu tiếp theo của cùng bác sĩ.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Ranh giới Transaction:** Transaction 1 commit ngay.
- **Trạng thái DB mong đợi:** Bản ghi thứ 2 có `STTTrongNgay = 2`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Dòng dữ liệu thứ 2 có `STTTrongNgay = 2`, `SoPhieu = 'DL-BS01-20261104-002'`.
- **Điều kiện PASS:** `STTTrongNgay === 2`.
- **Điều kiện FAIL:** STT bị trùng 1 hoặc nhảy cóc số không có lý do.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-TKT-003: Cấp số khám trực tiếp độc lập theo Chuyên khoa
- **Mục tiêu:** Chứng minh chuỗi STT trực tiếp không bị ảnh hưởng bởi chuỗi STT đặt lịch.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Ranh giới Transaction:** Transaction 1 commit ngay.
- **Trạng thái DB mong đợi:** Bản ghi có `MaPhamVi = 'SCOPE_TT_1_20261104'`, `STTTrongNgay = 1`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi trong sổ với scope `SCOPE_TT_1_20261104`.
- **Điều kiện PASS:** STT = 1 cho chuyên khoa 1 dù bác sĩ thuộc chuyên khoa đó đã có STT đặt lịch là 5.
- **Điều kiện FAIL:** Bị cộng dồn STT giữa 2 hàng đợi.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-TKT-004: Hai bác sĩ khác nhau cùng có STT = 1 trong ngày không bị trùng khóa (B-05)
- **Mục tiêu:** Kiểm tra ràng buộc `UNIQUE(MaPhamVi, Ngay, STTTrongNgay)` cho phép cùng STT khác scope.
- **File / Method / Dòng code liên quan:** `uq_pham_vi_ngay_stt`.
- **Ranh giới Transaction:** 2 Transaction 1 độc lập.
- **Trạng thái DB mong đợi:** 2 bản ghi cùng ngày, cùng `STTTrongNgay = 1`, khác `MaPhamVi`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 2 bản ghi cùng ngày, cùng `STTTrongNgay = 1`, khác `MaPhamVi`.
- **Điều kiện PASS:** Cả 2 bản ghi được chèn thành công không lỗi 1062.
- **Điều kiện FAIL:** Ném lỗi trùng khóa duy nhất.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-005: Sang ngày mới (00:00:00), STT tự động reset về 1 cho cùng bác sĩ
- **Mục tiêu:** Kiểm tra cơ chế reset theo ngày độc lập.
- **File / Method / Dòng code liên quan:** `uq_pham_vi_ngay_stt`.
- **Ranh giới Transaction:** Transaction 1 cho ngày mới.
- **Trạng thái DB mong đợi:** Bản ghi ngày hôm sau có `STTTrongNgay = 1`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi ngày `2026-11-05` có `STTTrongNgay = 1`.
- **Điều kiện PASS:** Cấp thành công STT = 1 cho ngày mới mà không bị lỗi trùng lặp với ngày cũ.
- **Điều kiện FAIL:** Lỗi Duplicate key hoặc STT bị đếm tiếp thành 11.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-006: Kiểm tra độ dài `SoPhieu` nằm gọn trong VARCHAR(64)
- **Mục tiêu:** Kiểm tra không xảy ra lỗi truncation chuỗi số phiếu.
- **File / Method / Dòng code liên quan:** Schema definition `SoPhieu VARCHAR(64)`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `strlen($soPhieu)` với các ID lớn nhất.
- **Điều kiện PASS:** `strlen($soPhieu) <= 35` ký tự ($< 64$).
- **Điều kiện FAIL:** Vượt quá 64 ký tự.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-TKT-007: Ràng buộc vật lý `UNIQUE(SoPhieu)` trên bảng `luot_kham`
- **Mục tiêu:** Chốt chặn vật lý ngăn ngừa 2 lượt khám cùng mang 1 số phiếu.
- **File / Method / Dòng code liên quan:** `uq_luot_kham_so_phieu`.
- **Ranh giới Transaction:** Transaction chèn thứ hai.
- **Trạng thái DB mong đợi:** Chỉ 1 dòng được lưu.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Mã lỗi MySQL 1062 trên `uq_luot_kham_so_phieu`.
- **Điều kiện PASS:** Câu lệnh INSERT thứ hai bị chặn và rollback bởi lỗi 1062.
- **Điều kiện FAIL:** Chèn thành công 2 dòng cùng `SoPhieu`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-008: Ràng buộc duy nhất `UNIQUE(MaLuotKham)` trên sổ cấp số
- **Mục tiêu:** Bảo đảm quan hệ 1-1 chặt chẽ giữa 1 lần cấp số và 1 lượt khám sử dụng.
- **File / Method / Dòng code liên quan:** `uq_scsp_ma_luot_kham`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Lỗi MySQL 1062 khi gán trùng `MaLuotKham`.
- **Điều kiện PASS:** Ném lỗi 1062.
- **Điều kiện FAIL:** Hai bản ghi cấp số cùng liên kết tới một `MaLuotKham`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 3: MA TRẬN CONCURRENCY TRỌNG YẾU ĐỘC LẬP (B-07, B-10, B-11, B-12, B-14, B-16, B-17, B-18, B-19, B-21, B-22, B-23, B-24, B-26, B-27, B-28, B-29, B-30)

#### TC-CON-001: Hai request cùng `IdempotencyKey` gửi đồng thời vào `so_cap_so_phieu` ($\Delta t \le 15\text{ms}$)
- **Mục tiêu:** Bắt trọn vẹn lỗi MySQL 1062 trên tầng ứng dụng khi client double-click trong Tx1.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.uq_idempotency_key`.
- **Ranh giới Transaction:** Hai Tx1 độc lập chạy song song qua Barrier.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Barrier log ($\Delta t \le 15\text{ms}$), 1 worker HTTP 201, 1 worker bắt lỗi 1062 chuyển sang poll.
- **Điều kiện PASS:** Không xuất hiện lỗi HTTP 500, cả 2 client đều nhận cùng 1 số phiếu hợp lệ.
- **Điều kiện FAIL:** Văng lỗi 500 ra client hoặc sinh 2 bản ghi trong database.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-002: Hai request cùng `IdempotencyKey` tranh chấp Claim độc lập (Phương án B)
- **Mục tiêu:** Chứng minh trong Tx Claim độc lập, chỉ đúng 1 tiến trình nhận `affected_rows = 1` và `FenceToken = 1`.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, câu lệnh atomic UPDATE claim.
- **Ranh giới Transaction:** Hai Autonomous Claim Tx chạy song song và commit ngay.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Worker 1 nhận `affected_rows = 1, FenceToken = 1`; Worker 2 nhận `affected_rows = 0`.
- **Điều kiện PASS:** Đúng 1 tiến trình được quyền tạo `luot_kham` trong Tx tiếp theo.
- **Điều kiện FAIL:** Cả 2 tiến trình cùng nhận `affected_rows = 1`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-003: Request thua cuộc poll kết quả và nhận lại đúng `MaLuotKham` đã tạo
- **Mục tiêu:** Đảm bảo client bị chậm vẫn nhận lại đầy đủ dữ liệu khi request thắng cuộc commit.
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`.
- **Ranh giới Transaction:** Worker 1 commit Tx2, Worker 2 chạy vòng lặp Read poll.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `CODE PATH IDENTIFIED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** JSON response của Request 2 trùng khớp 100% với Request 1.
- **Điều kiện PASS:** Request 2 trả về HTTP 200 kèm `MaLuotKham` của Request 1 sau chu kỳ poll.
- **Điều kiện FAIL:** Request 2 timeout hoặc trả về null.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-004: Hai request khác `IdempotencyKey` cấp số đồng thời — Cho phép Audited Gaps (B-18)
- **Mục tiêu:** Kiểm tra tính tăng đơn điệu của STT và bảo đảm mọi khoảng trống (gap) đều có bản ghi giải trình.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Ranh giới Transaction:** Hai Tx1 độc lập commit ngay.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Dữ liệu 2 bản ghi, $\Delta t \le 15\text{ms}$.
- **Điều kiện PASS:** $STT_2 > STT_1$, không trùng số, nếu có gap giữa các số sử dụng thì gap đó bắt buộc phải có dòng `DA_HUY` tương ứng trong bảng.
- **Điều kiện FAIL:** Trùng STT hoặc phát sinh gap không thể truy vết.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-005: Worker đối soát chạy đồng thời với request cấp số đang trong hạn Lease
- **Mục tiêu:** Chứng minh Worker bỏ qua bản ghi đang giữ lease hợp lệ, không void nhầm.
- **File / Method / Dòng code liên quan:** Worker đối soát `queue:reconcile-ticket-ledger`.
- **Ranh giới Transaction:** Worker Tx quét với Grace period 5 phút.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Log quét của Worker, trạng thái bản ghi vẫn là `DANG_XU_LY`.
- **Điều kiện PASS:** Worker không cập nhật bản ghi này sang `DA_HUY`.
- **Điều kiện FAIL:** Worker void nhầm bản ghi đang có lease hợp lệ.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-006: Worker đối soát tự phục hồi liên kết khi tìm thấy `SoPhieu` trong `luot_kham`
- **Mục tiêu:** Tự động chữa lành dữ liệu khi request đã tạo `luot_kham` nhưng bị crash ở bước cập nhật cuối.
- **File / Method / Dòng code liên quan:** Worker đối soát, `luot_kham`.
- **Ranh giới Transaction:** Worker Tx chạy Locking Read `FOR SHARE`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi chuyển sang `TrangThai = 'DA_SU_DUNG'`, `GhiChu = 'RECONCILED_FROM_ORPHAN_DANG_XU_LY'`.
- **Điều kiện PASS:** Phục hồi thành công `DA_SU_DUNG`, gắn đúng `MaLuotKham`.
- **Điều kiện FAIL:** Bị void sang `DA_HUY`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-007: Xử lý khi Request bị treo quá thời hạn Lease (65 giây)
- **Mục tiêu:** Kiểm tra Request mới chiếm lại lease thành công khi request cũ bị treo mạng trong Phương án B.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, `luot_kham`.
- **Ranh giới Transaction:** Request 2 chạy Claim Tx độc lập thành công.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Request 2 claim thành công với `FenceToken = 2`.
- **Điều kiện PASS:** Chỉ có đúng 1 lượt khám duy nhất tồn tại trên hệ thống.
- **Điều kiện FAIL:** Cả 2 request cùng tạo được 2 lượt khám.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-008: Bác sĩ gọi khám đồng thời Lễ tân hủy lượt ($\Delta t \le 15\text{ms}$)
- **Mục tiêu:** Kiểm chứng tính toàn vẹn trạng thái khi 2 vai trò cùng thao tác chéo trên 1 ca khám.
- **File / Method / Dòng code liên quan:** `LuotKhamController@startExamine` (L340), `LichHenController@cancel` (L260).
- **Ranh giới Transaction:** Hai Tx độc lập cạnh tranh khóa `luot_kham`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 1 bên nhận HTTP 200, 1 bên nhận HTTP 422 hợp lệ.
- **Điều kiện PASS:** Không bị deadlock, trạng thái cuối nhất quán (`DANG_KHAM` hoặc `DA_HUY`).
- **Điều kiện FAIL:** Cả 2 bên cùng báo thành công dẫn đến trạng thái vừa khám vừa hủy.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-009: Bác sĩ hoàn thành khám đồng thời Lễ tân điều phối ca khám
- **Mục tiêu:** Ngăn chặn việc chuyển bác sĩ khi ca khám đã hoàn tất.
- **File / Method / Dòng code liên quan:** `LuotKhamController@completeExamine` (L497).
- **Ranh giới Transaction:** Hai Tx cạnh tranh tài nguyên lượt khám.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Trạng thái cuối là `HOAN_THANH`, lệnh điều phối bị từ chối 422.
- **Điều kiện PASS:** Không phát sinh deadlock, bảo toàn kết quả khám.
- **Điều kiện FAIL:** Lượt khám bị đổi bác sĩ sau khi đã khám xong.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-010: KTV CLS cập nhật kết quả đồng thời Bác sĩ ghi bệnh án
- **Mục tiêu:** Bảo toàn chẩn đoán ban đầu và cập nhật trạng thái `CHO_KHAM_LAI` không bị ghi đè.
- **File / Method / Dòng code liên quan:** `CanLamSangController@updateResult` (L195), `LuotKhamController@savePhieuKham` (L391).
- **Ranh giới Transaction:** Tx Cận lâm sàng vs Tx Bệnh án.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `TrangThai = 'CHO_KHAM_LAI'`, `ChanDoanBanDau` nguyên vẹn.
- **Điều kiện PASS:** Dữ liệu cả 2 bên đều được ghi nhận đầy đủ.
- **Điều kiện FAIL:** Bác sĩ ghi bệnh án làm mất cờ `CHO_KHAM_LAI` hoặc mất kết quả CLS.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-011: Thực nghiệm Deadlock thực tế với 2 transaction cố tình khóa ngược $LH$ và $LK$ ($\Delta t \le 15\text{ms}$)
- **Mục tiêu:** Kích hoạt có chủ đích lỗi MySQL Error 1213 từ điểm khóa ngược phát hiện tại `completeExamine` (L541-548).
- **File / Method / Dòng code liên quan:** `LuotKhamController@store` vs `completeExamine`.
- **Ranh giới Transaction:** Tx Tiếp nhận ($LH \rightarrow LK$) vs Tx Hoàn tất ($LK \rightarrow LH$).
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Ngoại lệ SQLSTATE `40001` (Driver Error Code 1213), khối `LATEST DETECTED DEADLOCK` trong `SHOW ENGINE INNODB STATUS`.
- **Điều kiện PASS:** MySQL Engine ném đúng lỗi 1213, log InnoDB ghi nhận chu trình khóa ngược $LH \leftrightarrow LK$.
- **Điều kiện FAIL:** Không phát hiện deadlock do 2 tiến trình chạy lệch thời gian ($>15$ms).
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-012: Kiểm chứng cơ chế Two-Phase Read & Lock ngăn ngừa hoàn toàn Deadlock sau Refactor
- **Mục tiêu:** Chứng minh tuân thủ thứ tự toàn cục $LH \rightarrow LK$ trong `completeExamine` loại trừ 100% deadlock.
- **File / Method / Dòng code liên quan:** `LuotKhamController@completeExamine` sau khi refactor khóa $LH$ trước.
- **Ranh giới Transaction:** Cả 2 Tx đều khóa $LH$ trước rồi mới khóa $LK$.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 2 worker hoàn tất tuần tự an toàn, `SHOW ENGINE INNODB STATUS` không có deadlock mới.
- **Điều kiện PASS:** 0% Error 1213.
- **Điều kiện FAIL:** Vẫn phát sinh Error 1213.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-013: Crash mô phỏng sau khi cấp số nhưng trước khi tạo lượt $\rightarrow$ Chuyển Burned Ticket
- **Mục tiêu:** Xác nhận số phiếu bị bỏ dở được chuyển an toàn sang `DA_HUY` sau 15 phút.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Ranh giới Transaction:** Tx1 đã commit, không có Tx2.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi mang `TrangThai = 'DA_HUY'`, `GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS'`.
- **Điều kiện PASS:** Chuyển đúng `DA_HUY`, không cấp lại số này.
- **Điều kiện FAIL:** Bản ghi bị treo vĩnh viễn ở `DA_CAP`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-014: Đo lường độ trễ Barrier: Hủy mẫu kiểm thử nếu Execution Skew $\Delta t > 15\text{ms}$
- **Mục tiêu:** Bảo đảm tính hợp lệ toán học của các mẫu kiểm thử đồng thời.
- **File / Method / Dòng code liên quan:** `test_concurrency_barrier`.
- **Ranh giới Transaction:** Barrier coordination.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Trạng thái `status = 'INVALID_SAMPLE'` trong bảng barrier.
- **Điều kiện PASS:** Tự động hủy và đánh dấu mẫu không hợp lệ khi $\Delta t > 15\text{ms}$.
- **Điều kiện FAIL:** Chấp nhận mẫu test bị lệch thời gian quá lớn.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-CON-015: Fencing Token chặn đứng Request cũ commit sau khi Lease đã bị chiếm lại (B-16, B-21, B-26)
- **Mục tiêu:** Chứng minh trong Phương án B, Request A bị lag $>60$s nhận `affected_rows = 0` và tự động rollback khi Request B đã claim `FenceToken = 2`.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.FenceToken`, Business Tx2.
- **Ranh giới Transaction:** Request A chạy Tx2 với token 1, Request B chạy Tx2 với token 2.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Request A nhận `affected_rows = 0`, rollback toàn bộ Tx2, ném HTTP 409 Conflict. Request B commit thành công với `FenceToken = 2`.
- **Điều kiện PASS:** Request A bị chặn đứng 100%, không xảy ra Split-Brain.
- **Điều kiện FAIL:** Request A vẫn commit được đè lên Request B.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-016: Worker đối soát với Locking Read `FOR SHARE` và Grace Period 5 phút (B-17, B-23, B-28)
- **Mục tiêu:** Chứng minh dưới `REPEATABLE READ`, Worker dùng Locking Read không bị che khuất bởi MVCC Snapshot, không bị Gap Lock chặn nhầm.
- **File / Method / Dòng code liên quan:** Worker đối soát `queue:reconcile-ticket-ledger`.
- **Ranh giới Transaction:** Worker Tx độc lập có Grace period 5 phút.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Truy vấn `SELECT ... FOR SHARE` của Worker chờ Request commit và đọc được dữ liệu mới nhất.
- **Điều kiện PASS:** Worker phát hiện `luot_kham` và tự phục hồi `DA_SU_DUNG`, 0% void nhầm.
- **Điều kiện FAIL:** Worker đọc snapshot cũ trả về null và void nhầm sang `DA_HUY`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-017: Đồng bộ thứ tự khóa giữa Worker và Request tạo lượt khám (B-19, B-22, B-30)
- **Mục tiêu:** Kiểm chứng phân cấp khóa $SCSP \rightarrow LK$: Worker khóa $SCSP$ trước rồi đọc $LK$, Request khóa $SCSP$ rồi ghi $LK$.
- **File / Method / Dòng code liên quan:** Worker đối soát, `LuotKhamController@store`.
- **Ranh giới Transaction:** Worker Tx vs Request Business Tx.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Log khóa InnoDB, không phát sinh Error 1213 giữa Worker và Request.
- **Điều kiện PASS:** Hai tiến trình chạy tuần tự an toàn, 0% deadlock.
- **Điều kiện FAIL:** Phát sinh deadlock chu trình giữa Worker và Request.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-018: Kiểm tra Transactional Outbox ngăn chặn Side-Effects khi mất FenceToken (B-24, B-29)
- **Mục tiêu:** Chứng minh nếu Request bị mất FenceToken và rollback Tx2, KHÔNG CÓ bản ghi nào được ghi vào bảng Outbox, không phát sinh thông báo rác ra ngoài.
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`, bảng `outbox_messages`.
- **Ranh giới Transaction:** Tx2 chứa cả `luot_kham` và `outbox_messages`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa (Đang đề xuất).
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Tx2 rollback, bảng `outbox_messages` không có bản ghi mới.
- **Điều kiện PASS:** 0 thông báo được gửi khi transaction rollback do lỗi FenceToken.
- **Điều kiện FAIL:** Bản ghi outbox vẫn tồn tại hoặc thông báo vẫn được gửi.
- **Mức độ nghiêm trọng:** **BLOCKER**.

---

### NHÓM 4: VÒNG ĐỜI NGHIỆP VỤ KHÁM BỆNH & ĐIỀU PHỐI (B-02, B-03, B-30)

#### TC-BIZ-001: Tiếp nhận Lịch hẹn hợp lệ chuyển sang `CHO_KHAM` và đồng bộ `lich_hen`
- **Mục tiêu:** Kiểm tra luồng tiếp nhận tiêu chuẩn từ lịch hẹn đã xác nhận.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L244-283).
- **Ranh giới Transaction:** Tx2 cập nhật đồng bộ $LH$ và $LK$.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KHAM'`, `lich_hen.TrangThai = 'DA_TIEP_NHAN'`.
- **Điều kiện PASS:** Cả 2 bảng cập nhật đúng trạng thái trong cùng transaction.
- **Điều kiện FAIL:** Lượt khám tạo nhưng lịch hẹn không đổi hoặc ngược lại.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-002: Chặn tiếp nhận lịch hẹn đang ở trạng thái `DA_HUY` hoặc `HOAN_THANH`
- **Mục tiêu:** Ngăn chặn việc tiếp nhận các lịch hẹn không còn hợp lệ.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L265-269).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** ValidationException, HTTP 422.
- **Điều kiện PASS:** Trả về lỗi 422, không tạo lượt khám.
- **Điều kiện FAIL:** Vẫn tạo lượt khám cho lịch đã hủy.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-003: Chặn tiếp nhận trùng lặp cho một lịch hẹn đã tiếp nhận trước đó
- **Mục tiêu:** Ngăn chặn việc 1 lịch hẹn tạo ra 2 lượt khám khác nhau.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L258-263).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** HTTP 422: "Lịch hẹn này đã được tiếp nhận tạo lượt khám trước đó."
- **Điều kiện PASS:** Bị từ chối với lỗi 422.
- **Điều kiện FAIL:** Tạo thêm lượt khám thứ hai.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-004: Tiếp nhận khám trực tiếp không qua lịch hẹn (`MaLichHen = NULL`)
- **Mục tiêu:** Kiểm tra luồng tiếp nhận vãng lai tại quầy lễ tân.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L284-289).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bản ghi `luot_kham` có `MaLichHen IS NULL`, gán đúng `MaChuyenKhoa`.
- **Điều kiện PASS:** Tạo lượt khám thành công với `MaLichHen = NULL`.
- **Điều kiện FAIL:** Báo lỗi thiếu `MaLichHen` hoặc gán sai chuyên khoa.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-005: Kiểm tra phân quyền: Bác sĩ khác không được thao tác trên ca của bác sĩ được phân công
- **Mục tiêu:** Bảo đảm an toàn dữ liệu và quyền riêng tư y tế theo chuẩn RBAC.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L349-354).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** HTTP 403 Forbidden.
- **Điều kiện PASS:** Bị từ chối với mã lỗi 403.
- **Điều kiện FAIL:** Bác sĩ khác vẫn mở được phiên khám.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-006: Ghi hồ sơ bệnh án ban đầu bảo toàn `ChanDoanBanDau`
- **Mục tiêu:** Đảm bảo chẩn đoán sơ bộ ban đầu không bị mất đi trong suốt quá trình điều trị.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L434-437, L454-468).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bảng `phieu_kham` lưu đúng `ChanDoanBanDau`.
- **Điều kiện PASS:** Bản ghi lưu thành công.
- **Điều kiện FAIL:** `ChanDoanBanDau` bị null hoặc bị ghi đè.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-007: Chỉ định cận lâm sàng chuyển lượt khám sang `CHO_KET_QUA`
- **Mục tiêu:** Tự động đồng bộ trạng thái luồng khám khi phát sinh dịch vụ xét nghiệm.
- **File / Method / Dòng code liên quan:** `ChiDinhDichVuController.php` (L178-192).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE PATH IDENTIFIED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KET_QUA'`.
- **Điều kiện PASS:** Lượt khám chuyển đúng trạng thái chờ kết quả.
- **Điều kiện FAIL:** Vẫn ở trạng thái đang khám.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-008: Kỹ thuật viên CLS tiếp nhận chỉ định và thực hiện kỹ thuật
- **Mục tiêu:** Kiểm tra quy trình xử lý dịch vụ kỹ thuật tại phòng xét nghiệm.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L114-186).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Trạng thái chỉ định chuyển `DA_TIEP_NHAN` $\rightarrow$ `DANG_THUC_HIEN`.
- **Điều kiện PASS:** Cập nhật trạng thái thành công kèm nhân viên thực hiện.
- **Điều kiện FAIL:** Lỗi phân quyền hoặc không lưu được nhân viên thực hiện.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-BIZ-009: Cập nhật kết quả một phần khi còn chỉ định khác chưa xong
- **Mục tiêu:** Kiểm tra lượt khám không bị nhảy trạng thái sớm khi bệnh nhân còn dịch vụ khác.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L241-275).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai` vẫn giữ nguyên là `CHO_KET_QUA`.
- **Điều kiện PASS:** Giữ nguyên `CHO_KET_QUA` khi `pendingCount > 0`.
- **Điều kiện FAIL:** Chuyển sớm sang `CHO_KHAM_LAI`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-010: Cập nhật kết quả chỉ định cuối cùng tự động chuyển lượt khám sang `CHO_KHAM_LAI`
- **Mục tiêu:** Tự động đưa bệnh nhân vào danh sách ưu tiên tái khám khi có đủ kết quả.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L241-248).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KHAM_LAI'`, thông báo ưu tiên gửi tới Bác sĩ.
- **Điều kiện PASS:** Chuyển sang `CHO_KHAM_LAI` ngay khi `pendingCount === 0`.
- **Điều kiện FAIL:** Bệnh nhân vẫn bị treo ở `CHO_KET_QUA`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-011: Bác sĩ ghi chẩn đoán kết luận sau CLS không làm mất `ChanDoanBanDau`
- **Mục tiêu:** Kiểm tra tính toàn vẹn của hồ sơ bệnh án 2 giai đoạn.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L434-442).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bảng `phieu_kham` có đủ cả `ChanDoanBanDau` và `ChanDoanSauCLS`.
- **Điều kiện PASS:** Cả 2 trường đều lưu đúng giá trị tương ứng.
- **Điều kiện FAIL:** `ChanDoanBanDau` bị ghi đè bởi `ChanDoanSauCLS`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-012: Hoàn tất lượt khám (`completeExamine`) chặn tuyệt đối nếu còn dịch vụ CLS chưa có kết quả
- **Mục tiêu:** Chốt chặn an toàn y khoa: không đóng hồ sơ bệnh án khi còn dịch vụ chưa có kết quả.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L530-538).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** HTTP 422: "Lượt khám vẫn còn X dịch vụ cận lâm sàng chưa có kết quả."
- **Điều kiện PASS:** Bị từ chối với mã lỗi 422.
- **Điều kiện FAIL:** Vẫn hoàn thành được ca khám khi còn xét nghiệm treo.
- **Mức độ nghiêm trọng:** **BLOCKER**.

---

### NHÓM 5: TÍNH TOÀN VẸN KHÓA NGOẠI & CHÍNH SÁCH XÓA (B-06, B-13)

#### TC-FK-001: Khóa ngoại `fk_scsp_luot_kham` chặn Hard Delete lượt khám (`ON DELETE RESTRICT`)
- **Mục tiêu:** Bảo toàn 100% dấu vết kiểm toán, ngăn ngừa việc xóa vật lý lượt khám đã cấp số.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.fk_scsp_luot_kham`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** MySQL Error 1451 (`Cannot delete or update a parent row: a foreign key constraint fails`).
- **Điều kiện PASS:** MySQL ném đúng lỗi 1451, dòng dữ liệu không bị xóa.
- **Điều kiện FAIL:** Lệnh xóa thành công hoặc làm set null cột khóa ngoại.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-FK-002: Hủy nghiệp vụ lượt khám bằng cách cập nhật `TrangThai = 'DA_HUY'` thành công
- **Mục tiêu:** Xác nhận nghiệp vụ hủy ca bệnh sử dụng Soft Status, không làm mất liên kết kiểm toán.
- **File / Method / Dòng code liên quan:** `LichHenController.php` (L293-297).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'DA_HUY'`, sổ cấp số vẫn giữ nguyên liên kết `MaLuotKham`.
- **Điều kiện PASS:** Cập nhật thành công, liên kết khóa ngoại nguyên vẹn.
- **Điều kiện FAIL:** Bị lỗi khóa ngoại chặn cập nhật trạng thái.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-FK-003: Khóa ngoại chặn xóa Bác sĩ khi đang có lượt khám liên kết
- **Mục tiêu:** Bảo đảm không làm mất thông tin bác sĩ phụ trách ca bệnh trong lịch sử.
- **File / Method / Dòng code liên quan:** Khóa ngoại `luot_kham.MaBacSi`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** MySQL Error 1451.
- **Điều kiện PASS:** Bị chặn bởi lỗi 1451.
- **Điều kiện FAIL:** Xóa thành công bác sĩ làm mồ côi lượt khám.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-FK-004: Khóa ngoại chặn xóa Bệnh nhân khi đang có hồ sơ lượt khám
- **Mục tiêu:** Bảo vệ hồ sơ sức khỏe và lịch sử khám bệnh của bệnh nhân.
- **File / Method / Dòng code liên quan:** Khóa ngoại `luot_kham.MaBenhNhan`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** MySQL Error 1451.
- **Điều kiện PASS:** Bị chặn bởi lỗi 1451.
- **Điều kiện FAIL:** Bệnh nhân bị xóa mất hồ sơ.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-FK-005: Đối chiếu 100% cột khóa ngoại kiểu `INT signed` không bị cảnh báo truncation
- **Mục tiêu:** Xác nhận tính tương thích kiểu dữ liệu giữa các bảng theo đúng schema live.
- **File / Method / Dòng code liên quan:** `INFORMATION_SCHEMA.COLUMNS`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 100% các cột ID và FK đều có `DATA_TYPE = 'int'`.
- **Điều kiện PASS:** Khớp hoàn toàn kiểu dữ liệu `INT(11) signed`.
- **Điều kiện FAIL:** Lệch kiểu dữ liệu giữa khóa chính và khóa ngoại.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 6: QUY TRÌNH MIGRATION 4 BƯỚC & BACKFILL DỮ LIỆU (B-06, B-09, B-15)

#### TC-MIG-001: Bước 1 Migration — Thêm 4 cột dạng Nullable thành công
- **Mục tiêu:** Nâng cấp schema mà không làm gián đoạn các luồng đọc/ghi hiện tại của ứng dụng.
- **File / Method / Dòng code liên quan:** Migration Step 1 file.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Bảng `luot_kham` có thêm 4 cột mới mang giá trị NULL trên 23 bản ghi cũ.
- **Điều kiện PASS:** Migration chạy thành công với exit code 0.
- **Điều kiện FAIL:** Lỗi cú pháp hoặc làm khóa bảng kéo dài.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-002: Bước 2 Backfill — Cập nhật 5 bản ghi `DAT_LICH` khớp 100% lịch sử
- **Mục tiêu:** Điền dữ liệu lịch sử chuẩn xác cho 5 bản ghi đặt lịch có đầy đủ chứng từ.
- **File / Method / Dòng code liên quan:** Seeder/Backfill script.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 5 bản ghi (LK #1, #156, #211, #214, #236) có đủ 4 trường không bị NULL.
- **Điều kiện PASS:** 5 bản ghi khớp 100% chuyên khoa và bác sĩ trực gốc.
- **Điều kiện FAIL:** Có bản ghi bị gán sai hoặc còn NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-003: Bước 2 Backfill — Cập nhật 18 bản ghi `TRUC_TIEP` gán cờ Audit
- **Mục tiêu:** Điền dữ liệu suy luận minh bạch cho 18 bản ghi khám trực tiếp không có lịch hẹn.
- **File / Method / Dòng code liên quan:** Seeder/Backfill script.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** 18 bản ghi được điền đủ 4 trường, log audit ghi nhận `INFERRED_FROM_ASSIGNED_DOCTOR`.
- **Điều kiện PASS:** 100% 18 bản ghi không còn NULL và có cờ audit.
- **Điều kiện FAIL:** Bị sót bản ghi NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-004: Bước 3 Migration — Chuyển 4 cột sang `NOT NULL` sau Backfill
- **Mục tiêu:** Áp đặt ràng buộc vật lý bắt buộc đủ dữ liệu sau khi dữ liệu cũ đã được lấp đầy.
- **File / Method / Dòng code liên quan:** Migration Step 3 file.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Cột mang thuộc tính `IS_NULLABLE = 'NO'`.
- **Điều kiện PASS:** ALTER TABLE thành công không có lỗi `Invalid use of NULL value`.
- **Điều kiện FAIL:** Bị lỗi do còn bản ghi NULL lọt qua.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-005: Bước 4 Migration — Khởi tạo Trigger bảo vệ 5 trường trên DB Clone
- **Mục tiêu:** Kích hoạt lớp bảo vệ tầng cơ sở dữ liệu sau khi schema đã hoàn thiện.
- **File / Method / Dòng code liên quan:** Migration Step 4 file.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Trigger xuất hiện trong `SHOW TRIGGERS LIKE 'luot_kham'`.
- **Điều kiện PASS:** Biên dịch trigger thành công trong MySQL 8.0.26.
- **Điều kiện FAIL:** Lỗi cú pháp trigger.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-006: Thử nghiệm Rollback Migration: Hoàn trả schema sạch sẽ
- **Mục tiêu:** Đảm bảo đường lui an toàn (Rollback safety) nếu có sự cố xảy ra.
- **File / Method / Dòng code liên quan:** 4 migration steps (down method).
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích:** `DESIGN REVIEWED`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Schema sau rollback khớp 100% với schema gốc, 23 bản ghi nguyên vẹn.
- **Điều kiện PASS:** Rollback sạch sẽ không để lại rác trigger hay cột thừa.
- **Điều kiện FAIL:** Rollback bị lỗi làm hỏng cấu trúc bảng.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 7: KIỂM THỬ THỦ CÔNG GIAO DIỆN & TRÌNH DUYỆT (BROWSER UI / E2E)

#### TC-UI-001: Lễ tân tiếp nhận lịch hẹn trên giao diện `Receptionist/Queue.tsx`
- **Mục tiêu:** Kiểm tra trải nghiệm người dùng thực tế khi bấm tiếp nhận lịch hẹn.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Ảnh chụp màn hình popup số phiếu, toast thông báo thành công.
- **Điều kiện PASS:** Hiển thị số phiếu đúng định dạng `DL-BS...`, lịch hẹn chuyển tab đã tiếp nhận.
- **Điều kiện FAIL:** Báo lỗi hoặc không hiện số phiếu.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-002: Lễ tân tiếp nhận bệnh nhân khám trực tiếp tại quầy
- **Mục tiêu:** Kiểm tra giao diện cấp số khám vãng lai.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot phiếu cấp số trực tiếp `TT-CK...`.
- **Điều kiện PASS:** Sinh số thành công và đưa vào hàng chờ bác sĩ.
- **Điều kiện FAIL:** Không chọn được bác sĩ/chuyên khoa.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-003: Bác sĩ gọi bệnh nhân vào khám trên giao diện `Doctor/Examine.tsx`
- **Mục tiêu:** Kiểm tra thao tác bắt đầu khám của Bác sĩ.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot ca khám chuyển sang trạng thái "Đang khám".
- **Điều kiện PASS:** Bộ đếm thời gian khám chạy, nút hoàn thành khả dụng.
- **Điều kiện FAIL:** Không cập nhật được trạng thái trên giao diện.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-004: Bác sĩ kê đơn thuốc và kiểm tra hiển thị tồn kho
- **Mục tiêu:** Đảm bảo bác sĩ không kê vượt quá số lượng tồn kho dược.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot đơn thuốc đã lưu, tổng tiền hiển thị đúng.
- **Điều kiện PASS:** Lưu đơn thuốc thành công khi số lượng hợp lệ; báo đỏ khi vượt tồn kho.
- **Điều kiện FAIL:** Kê được thuốc khi tồn kho bằng 0.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-005: Kỹ thuật viên thao tác trên Dashboard Cận lâm sàng `CanLamSang/Dashboard.tsx`
- **Mục tiêu:** Kiểm tra quy trình tiếp nhận, thực hiện và nhập kết quả xét nghiệm.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/CanLamSang/Dashboard.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot trạng thái xanh "Đã có kết quả".
- **Điều kiện PASS:** Nhập và xác nhận kết quả thành công.
- **Điều kiện FAIL:** Không lưu được kết quả hoặc bị lỗi phân quyền.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-006: Hiển thị tự động bệnh nhân chờ khám lại trên màn hình Bác sĩ
- **Mục tiêu:** Kiểm tra chuông thông báo và badge ưu tiên khi bệnh nhân hoàn tất xét nghiệm.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot tab "Chờ khám lại" có badge màu cam nổi bật.
- **Điều kiện PASS:** Bệnh nhân tự động xuất hiện không cần F5 tải lại trang.
- **Điều kiện FAIL:** Bệnh nhân không xuất hiện trong tab chờ khám lại.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-007: Bác sĩ hoàn thành khám và chuyển thanh toán
- **Mục tiêu:** Đóng ca khám và kiểm tra thông báo chuyển sang bộ phận thu ngân.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Đã có test tự động trong tests/:** Chưa.
- **Đã thực thi:** Chưa (`NOT TESTED`).
- **Bằng chứng cần thu thập:** Screenshot ca khám đóng lại, hóa đơn sẵn sàng ở bàn Lễ tân.
- **Điều kiện PASS:** Ca khám chuyển `HOAN_THANH`, dữ liệu xuất hiện ở quầy thanh toán.
- **Điều kiện FAIL:** Lỗi khi đóng ca khám.
- **Mức độ nghiêm trọng:** **MAJOR**.

---

### TỔNG HỢP VÀ ĐIỀU KIỆN TIÊN QUYẾT BƯỚC SANG DB CLONE

```text
+-------------------------------------------------------------------------------+
|             BẢNG TỔNG KẾT MA TRẬN KIỂM THỬ THỰC TẾ (VERSION 2.3)              |
+-------------------------------------------------------------------------------+
|  1. Tổng số Test Cases chi tiết:                       56 Test Cases          |
|  2. Số test tự động hóa bằng PHPUnit:                  28 Test Cases (50.0%)  |
|  3. Số test Concurrency 2 tiến trình độc lập (CLI):     18 Test Cases (32.1%)  |
|  4. Số test Kiểm thử Thủ công / Browser UI (E2E):      10 Test Cases (17.9%)  |
|                                                                               |
|  Phân loại theo mức độ nghiêm trọng:                                          |
|  - BLOCKER (Chặn 100% nếu chưa test PASS):             24 Test Cases          |
|  - CRITICAL (Cần thiết cho toàn vẹn dữ liệu):          22 Test Cases          |
|  - MAJOR (Quy trình nghiệp vụ & Giao diện):            10 Test Cases          |
|                                                                               |
|  Trạng thái phân tích mã nguồn (Static Readiness):                            |
|  - CODE VERIFIED BY STATIC INSPECTION:                 21 / 56 (37.5%)        |
|  - DESIGN REVIEWED / CODE PATH IDENTIFIED:             35 / 56 (62.5%)        |
|                                                                               |
|  Trạng thái thực thi thực nghiệm (Execution Status):                          |
|  - CHƯA THỰC THI (NOT TESTED):                         56 / 56 (100%)         |
|  - TEST PASSED:                                         0 / 56 (0%)           |
+-------------------------------------------------------------------------------+
```

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC HIỆN TẠI:
[ NOT APPROVED – MIGRATION MUST NOT BE CREATED ]

Lý do: Ma trận V2.3 đã chốt cứng đúng 56 test cases đồng bộ 100% với kiến trúc 
Transaction Phương án B, Fencing Token và Global Lock Hierarchy. Toàn bộ kịch bản 
đang ở trạng thái sẵn sàng cao nhất, dừng lại ở cổng kiểm soát (Gatekeeper) chờ 
quyết định phê duyệt chính thức từ Quản trị viên để cấp phép thiết lập Database 
Clone thực nghiệm.
================================================================================
```
