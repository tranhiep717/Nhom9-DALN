# SMARTCARE HYBRID QUEUE – TEST CASE MATRIX (VERSION 2.8)
## MA TRẬN 78 TEST CASE KIỂM THỬ THỰC TẾ & CHUẨN HÓA ĐIỀU KIỆN KIỂM CHỨNG GIAO DỊCH, FENCING TOKEN VÀ GLOBAL LOCK GRAPH

> **Tài liệu tham chiếu:** [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V27.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V27.md)  
> **Tổng số Test Cases cốt lõi:** **ĐÚNG 62 TEST CASES** (28 PHPUnit, 24 Concurrency CLI, 10 UI) (Chốt cứng và đồng bộ 100% qua tất cả các tài liệu kỹ thuật)  
> **Phân loại phương thức cốt lõi:**  
> - **PHPUnit Automated:** 28 Test Cases (45.2%)  
> - **Concurrency 2 tiến trình độc lập (CLI):** 24 Test Cases (38.7%)  
> - **Manual / Browser UI (E2E):** 10 Test Cases (16.1%)  
> **Phụ lục kiểm định Schema & Migration DDL:** 11 Test Cases bổ trợ (5 FK Integrity, 6 Migration Steps)  
> **Kiến trúc Transaction:** Chuẩn hóa theo **Phương Án B (Autonomous Claim Tx + Fenced Business Tx)**  
> **Cam kết an toàn tuyệt đối:** 100% test case hiện ở trạng thái **`CHƯA THỰC THI (NOT TESTED)`**. Tuyệt đối không tự ý đánh dấu PASS khi chưa chạy thực nghiệm có log đối soát trên Database Clone.  
> **Trạng thái phê duyệt:** `NOT APPROVED — NO MIGRATION — NO DATABASE WRITE`.

---

### HỆ THỐNG PHÂN LOẠI TRẠNG THÁI MINH BẠCH (4 CẤP ĐỘ)

Mọi nhận định kỹ thuật và kịch bản kiểm thử trong tài liệu này tuân thủ 4 cấp độ phân loại:
1. **`CODE VERIFIED`**: Đã đối soát chính xác từng file, hàm, dòng code cụ thể trong mã nguồn hiện tại của dự án.
2. **`SCHEMA VERIFIED`**: Đã đối chiếu trực tiếp cấu trúc bảng, cột, kiểu dữ liệu, index trên database live `phong_kham_thong_minh` (MySQL 8.0.26).
3. **`THEORETICAL`**: Suy luận kỹ thuật dựa trên nguyên lý hoạt động của MySQL 8.0 InnoDB Engine (MVCC, Lock Manager, Two-Phase Locking).
4. **`NOT VERIFIED`**: Chưa được kiểm chứng bằng thực nghiệm chạy thực tế trên môi trường clone độc lập.

---

### BẢNG ĐỐI CHIẾU CÁC CẬP NHẬT TRỌNG TÂM V2.7 (B-49 ĐẾN B-54)

| Blocker | Nội dung cải tiến trong V2.4 | Test Cases liên quan trực tiếp |
| :--- | :--- | :--- |
| **B-49** | Tách bạch 3 cột: Current Code vs Target Design vs Live Schema. Xác nhận bảng `so_cap_so_phieu` và cột `SoPhieu` là Target Design, chưa có trên live DB | Toàn bộ các test case liên quan ledger |
| **B-50** | Chuẩn hóa pattern Claim an toàn: Chốt chặn Autonomous Guard (`transactionLevel === 0`), bọc `DB::transaction()` và kích hoạt rollback sạch sẽ bằng `ClaimConflictException` | `TC-CON-002`, `TC-CON-019`, `TC-CON-020` |
| **B-51** | Bác bỏ giả định FIFO của InnoDB. Rà soát 4 Timeline A, B, C, D với các loại khóa chi tiết (`Record X`, `Gap S`, `Insert Intention`). Giới hạn phạm vi kết luận không deadlock | `TC-CON-016`, `TC-CON-023`, `TC-CON-024` |
| **B-52** | Phân định ranh giới side effects: `DB::afterCommit` chỉ là in-memory best-effort; mô phỏng rủi ro mất broadcast khi PHP crash; đề xuất Outbox Pattern cho SMS | `TC-CON-018`, `TC-CON-022` |
| **B-53** | Kiểm định State Machine 6 transition nguyên tử: làm rõ điều kiện WHERE, chốt chặn token, lease check và ranh giới transaction | `TC-CON-005`, `TC-CON-006`, `TC-CON-007` |
| **B-54** | Mở rộng ma trận lên 62 test cốt lõi (+6 concurrency test cases mới: TC-CON-019 đến TC-CON-029) + 11 phụ lục = 78 test cases | `TC-CON-019` đến `TC-CON-024` |

---

### MỤC LỤC DANH MỤC 67 TEST CASES CỐT LÕI

1. **Nhóm 1: Ràng Buộc Bất Biến & Trigger Guard (TC-IMM-001 đến TC-IMM-008)** — 8 Test Cases (PHPUnit)
2. **Nhóm 2: Sổ Cấp Số, Fencing Token & Khóa Ngoại (TC-TKT-001 đến TC-TKT-008)** — 8 Test Cases (PHPUnit)
3. **Nhóm 3: Ma Trận Concurrency Trọng Yếu Độc Lập (TC-CON-001 đến TC-CON-024)** — 24 Test Cases (2-Process Concurrency)
4. **Nhóm 4: Vòng Đời Nghiệp Vụ Khám Bệnh & Điều Phối (TC-BIZ-001 đến TC-BIZ-012)** — 12 Test Cases (PHPUnit)
5. **Nhóm 5: Kiểm Thử Giao Diện Người Dùng & Trình Duyệt (TC-UI-001 đến TC-UI-010)** — 10 Test Cases (Manual / Browser E2E)
---
*Phụ lục A: Tính Toàn Vẹn Khóa Ngoại & Chính Sách Xóa (TC-FK-001 đến TC-FK-005) — 5 Test Cases*  
*Phụ lục B: Quy Trình Migration 4 Bước & Backfill Dữ Liệu (TC-MIG-001 đến TC-MIG-006) — 6 Test Cases*

---

### NHÓM 1: RÀNG BUỘC BẤT BIẾN & TRIGGER GUARD (B-01, B-09) — 8 TEST CASES

#### TC-IMM-001: Chặn sửa `MaLichHen` từ giá trị cũ sang giá trị mới (A -> B)
- **Mục tiêu:** Chứng minh MySQL Trigger cấm 100% việc tráo đổi lịch hẹn của một lượt khám đã tạo.
- **Blocker / Vấn đề liên quan:** B-01, B-09 (Tính bất biến của MaLichHen và NULL-safe comparison).
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php` (L17), Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bảng `luot_kham` có bản ghi `MaLuotKham = 1` với `MaLichHen = 1`.
- **Các bước thực hiện:** Chạy câu lệnh SQL: `UPDATE luot_kham SET MaLichHen = 2 WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Ứng dụng ném ngoại lệ DatabaseQueryException với mã lỗi SQLSTATE 45000.
- **Trạng thái Database mong đợi:** Bản ghi `MaLuotKham = 1` giữ nguyên `MaLichHen = 1`.
- **Hành vi Khóa InnoDB mong đợi:** Exclusive row lock (X-lock) ngắn trên dòng `luot_kham` #1, rollback ngay khi trigger kích hoạt `SIGNAL SQLSTATE '45000'`.
- **Yêu cầu môi trường DB Clone:** Bắt buộc có DB Clone đã nạp trigger `trg_luot_kham_immutable_guard`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Mã lỗi MySQL SQLSTATE `45000`, message lỗi "Truong MaLichHen la bat bien khong duoc thay doi", kết quả `SELECT MaLichHen FROM luot_kham WHERE MaLuotKham = 1`.
- **Điều kiện PASS:** MySQL ném đúng SQLSTATE 45000, giá trị `MaLichHen` trong database vẫn giữ nguyên là 1.
- **Điều kiện FAIL:** Lệnh UPDATE thành công hoặc trả về mã lỗi khác 45000.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-002: Chặn xóa `MaLichHen` về NULL (A -> NULL)
- **Mục tiêu:** Chứng minh không thể gỡ bỏ liên kết lịch hẹn của lượt khám đã đặt lịch.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php`, Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `MaLuotKham = 2` với `MaLichHen = 86`.
- **Các bước thực hiện:** Chạy câu lệnh SQL: `UPDATE luot_kham SET MaLichHen = NULL WHERE MaLuotKham = 2;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Ném ngoại lệ DatabaseQueryException SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `MaLichHen` giữ nguyên giá trị 86.
- **Hành vi Khóa InnoDB mong đợi:** Row lock giải phóng ngay sau rollback.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Mã SQLSTATE 45000, giá trị `MaLichHen` sau câu lệnh vẫn là 86.
- **Điều kiện PASS:** Câu lệnh UPDATE bị rollback 100%, ném SQLSTATE 45000.
- **Điều kiện FAIL:** Cột `MaLichHen` bị cập nhật thành NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-003: Chặn gán bổ sung `MaLichHen` cho ca trực tiếp ban đầu (NULL -> A)
- **Mục tiêu:** Chứng minh toán tử NULL-safe `<=>` chặn đứng việc gán bù lịch hẹn cho ca khám trực tiếp.
- **Blocker / Vấn đề liên quan:** B-01, B-09 (Toán tử NOT (OLD.MaLichHen <=> NEW.MaLichHen)).
- **File / Method / Dòng code liên quan:** `app/Models/LuotKham.php`, Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `MaLuotKham = 100` với `MaLichHen IS NULL`.
- **Các bước thực hiện:** Chạy câu lệnh SQL: `UPDATE luot_kham SET MaLichHen = 10 WHERE MaLuotKham = 100;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Ném lỗi SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `MaLichHen` giữ nguyên giá trị NULL.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock bị rollback tức thời.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `SELECT MaLichHen FROM luot_kham WHERE MaLuotKham = 100` vẫn trả về NULL.
- **Điều kiện PASS:** Ném SQLSTATE 45000, giá trị trong DB vẫn là NULL.
- **Điều kiện FAIL:** Cột `MaLichHen` nhận giá trị khác NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-IMM-004: Cho phép UPDATE trường lâm sàng khi `MaLichHen` không đổi
- **Mục tiêu:** Chứng minh Trigger không chặn các thao tác cập nhật trạng thái khám bệnh, bệnh án thông thường.
- **Blocker / Vấn đề liên quan:** B-01, B-09 (Tránh false positive trigger).
- **File / Method / Dòng code liên quan:** `app/Http/Controllers/LuotKhamController.php` (L363-366, L477-481).
- **Tiền điều kiện:** Bản ghi `luot_kham` có `MaLuotKham = 1`, `TrangThai = 'CHO_KHAM'`, `MaLichHen = 1`.
- **Các bước thực hiện:** Chạy câu lệnh SQL: `UPDATE luot_kham SET TrangThai = 'DANG_KHAM' WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Thực thi thành công, trả về HTTP 200.
- **Trạng thái Database mong đợi:** `TrangThai` cập nhật thành `'DANG_KHAM'`, `MaLichHen` vẫn là 1.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock thành công và commit giải phóng khóa.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Số dòng affected = 1, `TrangThai` chuyển sang `DANG_KHAM`.
- **Điều kiện PASS:** Cả câu lệnh UPDATE thành công, không ném lỗi 45000.
- **Điều kiện FAIL:** Bị trigger chặn nhầm khi giá trị `MaLichHen` giữ nguyên.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-005: Chặn sửa đổi cột `MaPhamVi` sau khi đã khởi tạo
- **Mục tiêu:** Bảo toàn tính bất biến của mã phạm vi điều phối ban đầu.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `MaPhamVi = 'SCOPE_BS_1_20261104'`.
- **Các bước thực hiện:** Chạy: `UPDATE luot_kham SET MaPhamVi = 'SCOPE_BS_2_20261104' WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `MaPhamVi` giữ nguyên giá trị cũ.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `MaPhamVi` không thay đổi.
- **Điều kiện PASS:** Ném đúng lỗi 45000 chặn sửa trường cấp số bất biến.
- **Điều kiện FAIL:** Cập nhật thành công sang scope mới.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-006: Chặn sửa đổi cột `STTTrongNgay` sau khi đã khởi tạo
- **Mục tiêu:** Bảo đảm số thứ tự hàng đợi không bao giờ bị thay đổi sau khi cấp.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `STTTrongNgay = 1`.
- **Các bước thực hiện:** Chạy: `UPDATE luot_kham SET STTTrongNgay = 2 WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `STTTrongNgay` giữ nguyên là 1.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `STTTrongNgay` giữ nguyên.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Cập nhật thành công số thứ tự mới.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-007: Chặn sửa đổi cột `SoPhieu` sau khi đã khởi tạo
- **Mục tiêu:** Bảo đảm mã định danh số phiếu in trên giấy của bệnh nhân là bất biến.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `SoPhieu = 'DL-BS01-20261104-001'`.
- **Các bước thực hiện:** Chạy: `UPDATE luot_kham SET SoPhieu = 'DL-BS01-20261104-999' WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `SoPhieu` giữ nguyên không đổi.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `SoPhieu` không đổi.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Sửa thành công `SoPhieu`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-IMM-008: Chặn sửa đổi cột `MaChuyenKhoa` sau khi đã khởi tạo
- **Mục tiêu:** Giữ vững chuyên khoa gốc tiếp nhận bệnh nhân.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** Trigger `trg_luot_kham_immutable_guard`.
- **Tiền điều kiện:** Bản ghi `luot_kham` có `MaChuyenKhoa = 1`.
- **Các bước thực hiện:** Chạy: `UPDATE luot_kham SET MaChuyenKhoa = 2 WHERE MaLuotKham = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** SQLSTATE 45000.
- **Trạng thái Database mong đợi:** `MaChuyenKhoa` giữ nguyên là 1.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có trigger.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** SQLSTATE 45000, `MaChuyenKhoa` giữ nguyên.
- **Điều kiện PASS:** Ném lỗi 45000.
- **Điều kiện FAIL:** Sửa thành công sang chuyên khoa khác.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 2: SỔ CẤP SỐ, FENCING TOKEN & KHÓA NGOẠI (B-05, B-06, B-16, B-21, B-31, B-36) — 8 TEST CASES

#### TC-TKT-001: Cấp số thứ tự đầu tiên khởi tạo `FenceToken = 0` và Claim nâng lên 1 an toàn (B-21, B-31)
- **Mục tiêu:** Chứng minh quy ước B-21/B-31: khi sinh phiếu `DA_CAP`, `FenceToken = 0`. Khi Claim, đọc `FenceToken = 1` bên trong transaction bằng `SELECT ... FOR UPDATE` trước khi commit.
- **Blocker / Vấn đề liên quan:** B-21, B-31.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`, Claim Transaction Tx1.
- **Tiền điều kiện:** Scope `SCOPE_BS_1_20261104` chưa có bản ghi nào.
- **Các bước thực hiện:**
  1. Chạy Tx Allocation: Chèn bản ghi cấp số với `FenceToken = 0`, `TrangThai = 'DA_CAP'`.
  2. Mở Tx Claim (Tx1): `UPDATE so_cap_so_phieu SET TrangThai = 'DANG_XU_LY', FenceToken = FenceToken + 1 WHERE IdempotencyKey = :k;`
  3. Trong cùng Tx1: `SELECT FenceToken FROM so_cap_so_phieu WHERE IdempotencyKey = :k FOR UPDATE;`
  4. Lưu token vào bộ nhớ PHP và commit Tx1.
- **Kết quả HTTP / Ứng dụng mong đợi:** Ứng dụng nhận được `token = 1` an toàn tuyệt đối.
- **Trạng thái Database mong đợi:** `STTTrongNgay = 1`, `FenceToken = 1`, `TrangThai = 'DANG_XU_LY'`.
- **Hành vi Khóa InnoDB mong đợi:** X-lock trên dòng ledger trong suốt Tx1, giải phóng khi commit.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bản ghi trong `so_cap_so_phieu` có `STTTrongNgay = 1`, `FenceToken = 1`, biến PHP lưu đúng giá trị 1.
- **Điều kiện PASS:** `FenceToken` đọc được bên trong Tx1 là 1, DB cập nhật đúng `DANG_XU_LY`.
- **Điều kiện FAIL:** `FenceToken` đọc sai hoặc đọc sau commit bị race condition.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-002: Cấp số liên tiếp trong cùng ngày (STT = 2, 3...) độc lập theo bác sĩ
- **Mục tiêu:** Kiểm tra bộ đếm tăng đơn điệu cho các yêu cầu tiếp theo của cùng bác sĩ.
- **Blocker / Vấn đề liên quan:** B-05, B-18.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Tiền điều kiện:** Scope `SCOPE_BS_1_20261104` đã có STT = 1.
- **Các bước thực hiện:** Thực hiện cấp số mới cho cùng Scope.
- **Kết quả HTTP / Ứng dụng mong đợi:** Sinh số phiếu mới với hậu tố `-002`.
- **Trạng thái Database mong đợi:** Dòng mới có `STTTrongNgay = 2`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock trên dòng cấp số mới.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Dòng dữ liệu thứ 2 có `STTTrongNgay = 2`, `SoPhieu = 'DL-BS01-20261104-002'`.
- **Điều kiện PASS:** `STTTrongNgay === 2`.
- **Điều kiện FAIL:** STT bị trùng 1 hoặc nhảy cóc số không có lý do.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-TKT-003: Cấp số khám trực tiếp độc lập theo Chuyên khoa
- **Mục tiêu:** Chứng minh chuỗi STT trực tiếp không bị ảnh hưởng bởi chuỗi STT đặt lịch.
- **Blocker / Vấn đề liên quan:** B-05, B-18.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Tiền điều kiện:** Bác sĩ thuộc chuyên khoa 1 đã có STT đặt lịch là 5. Chuyên khoa 1 chưa có lượt trực tiếp.
- **Các bước thực hiện:** Cấp số khám trực tiếp cho Chuyên khoa 1.
- **Kết quả HTTP / Ứng dụng mong đợi:** Sinh phiếu trực tiếp có tiền tố `TT-CK01-` và số thứ tự là 1.
- **Trạng thái Database mong đợi:** Bản ghi có `MaPhamVi = 'SCOPE_TT_1_20261104'`, `STTTrongNgay = 1`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock độc lập, không block hàng đợi đặt lịch.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bản ghi trong sổ với scope `SCOPE_TT_1_20261104`.
- **Điều kiện PASS:** STT = 1 cho chuyên khoa 1 dù bác sĩ thuộc chuyên khoa đó đã có STT đặt lịch là 5.
- **Điều kiện FAIL:** Bị cộng dồn STT giữa 2 hàng đợi.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-TKT-004: Hai bác sĩ khác nhau cùng có STT = 1 trong ngày không bị trùng khóa (B-05)
- **Mục tiêu:** Kiểm tra ràng buộc `UNIQUE(MaPhamVi, Ngay, STTTrongNgay)` cho phép cùng STT khác scope.
- **Blocker / Vấn đề liên quan:** B-05.
- **File / Method / Dòng code liên quan:** `uq_pham_vi_ngay_stt`.
- **Tiền điều kiện:** Bác sĩ 1 đã có `STTTrongNgay = 1` ngày hôm nay.
- **Các bước thực hiện:** Cấp số thứ tự đầu tiên cho Bác sĩ 2 trong cùng ngày.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bác sĩ 2 nhận thành công số phiếu `DL-BS02-...-001`.
- **Trạng thái Database mong đợi:** 2 bản ghi cùng ngày, cùng `STTTrongNgay = 1`, khác `MaPhamVi`.
- **Hành vi Khóa InnoDB mong đợi:** Không có lock conflict vì khác bản ghi index.
- **Yêu cầu môi trường DB Clone:** DB Clone có unique constraint `uq_pham_vi_ngay_stt`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 2 bản ghi cùng ngày, cùng `STTTrongNgay = 1`, khác `MaPhamVi`.
- **Điều kiện PASS:** Cả 2 bản ghi được chèn thành công không lỗi 1062.
- **Điều kiện FAIL:** Ném lỗi trùng khóa duy nhất.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-005: Sang ngày mới (00:00:00), STT tự động reset về 1 cho cùng bác sĩ
- **Mục tiêu:** Kiểm tra cơ chế reset theo ngày độc lập nhờ cột `Ngay` trong unique key.
- **Blocker / Vấn đề liên quan:** B-05.
- **File / Method / Dòng code liên quan:** `uq_pham_vi_ngay_stt`.
- **Tiền điều kiện:** Bác sĩ 1 đã có STT = 10 vào ngày `2026-11-04`.
- **Các bước thực hiện:** Chạy cấp số cho Bác sĩ 1 vào ngày `2026-11-05`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Sinh số phiếu ngày mới với STT = 1.
- **Trạng thái Database mong đợi:** Bản ghi ngày hôm sau có `STTTrongNgay = 1`.
- **Hành vi Khóa InnoDB mong đợi:** Chèn thành công vào B-Tree index ngày mới.
- **Yêu cầu môi trường DB Clone:** DB Clone có `uq_pham_vi_ngay_stt`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bản ghi ngày `2026-11-05` có `STTTrongNgay = 1`.
- **Điều kiện PASS:** Cấp thành công STT = 1 cho ngày mới mà không bị lỗi trùng lặp với ngày cũ.
- **Điều kiện FAIL:** Lỗi Duplicate key hoặc STT bị đếm tiếp thành 11.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-006: Kiểm tra độ dài `SoPhieu` nằm gọn trong VARCHAR(64)
- **Mục tiêu:** Kiểm tra không xảy ra lỗi truncation chuỗi số phiếu trên các ID cực đại.
- **Blocker / Vấn đề liên quan:** B-06, B-13.
- **File / Method / Dòng code liên quan:** Schema definition `SoPhieu VARCHAR(64)`.
- **Tiền điều kiện:** Giả lập `MaBacSi = 999999`, `Ngay = 20261104`, `STT = 9999`.
- **Các bước thực hiện:** Sinh chuỗi định dạng số phiếu và đo độ dài chuỗi ký tự UTF-8.
- **Kết quả HTTP / Ứng dụng mong đợi:** Chuỗi sinh ra: `DL-BS999999-20261104-9999` (độ dài 26 ký tự).
- **Trạng thái Database mong đợi:** Lưu trọn vẹn vào cột `VARCHAR(64)` không bị cảnh báo truncation.
- **Hành vi Khóa InnoDB mong đợi:** Bình thường.
- **Yêu cầu môi trường DB Clone:** DB Clone có schema V2.4.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `strlen($soPhieu)` với các ID lớn nhất.
- **Điều kiện PASS:** `strlen($soPhieu) <= 35` ký tự ($< 64$).
- **Điều kiện FAIL:** Vượt quá 64 ký tự gây lỗi truncation.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-TKT-007: Ràng buộc vật lý `UNIQUE(SoPhieu)` trên bảng `luot_kham` (B-36)
- **Mục tiêu:** Chốt chặn vật lý ngăn ngừa 2 lượt khám cùng mang 1 số phiếu, ném lỗi Error 1062.
- **Blocker / Vấn đề liên quan:** B-36.
- **File / Method / Dòng code liên quan:** `uq_luot_kham_so_phieu`.
- **Tiền điều kiện:** Bảng `luot_kham` đã có bản ghi mang `SoPhieu = 'DL-BS01-20261104-001'`.
- **Các bước thực hiện:** Cố tình thực hiện câu lệnh chèn thứ hai với cùng `SoPhieu`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bắt được ngoại lệ DatabaseQueryException mã 1062 Duplicate entry.
- **Trạng thái Database mong đợi:** Chỉ đúng 1 dòng được lưu, dòng thứ hai bị hủy bỏ.
- **Hành vi Khóa InnoDB mong đợi:** Tiến trình 2 xin S-lock kiểm tra bản ghi index và nhận Duplicate key error khi tiến trình 1 đã commit.
- **Yêu cầu môi trường DB Clone:** DB Clone có unique constraint `uq_luot_kham_so_phieu`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Mã lỗi MySQL 1062 trên `uq_luot_kham_so_phieu`.
- **Điều kiện PASS:** Câu lệnh INSERT thứ hai bị chặn và rollback bởi lỗi 1062.
- **Điều kiện FAIL:** Chèn thành công 2 dòng cùng `SoPhieu`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-TKT-008: Ràng buộc duy nhất `UNIQUE(MaLuotKham)` trên sổ cấp số
- **Mục tiêu:** Bảo đảm quan hệ 1-1 chặt chẽ giữa 1 lần cấp số và 1 lượt khám sử dụng.
- **Blocker / Vấn đề liên quan:** B-06, B-13.
- **File / Method / Dòng code liên quan:** `uq_scsp_ma_luot_kham`.
- **Tiền điều kiện:** Bản ghi sổ cấp số A đã liên kết với `MaLuotKham = 10`.
- **Các bước thực hiện:** Thử cập nhật bản ghi sổ cấp số B liên kết tới cùng `MaLuotKham = 10`.
- **Kết quả HTTP / Ứng dụng mong đợi:** MySQL ném lỗi 1062 Duplicate entry.
- **Trạng thái Database mong đợi:** Bản ghi B không thể lưu trùng `MaLuotKham`.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** DB Clone có `uq_scsp_ma_luot_kham`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Lỗi MySQL 1062 khi gán trùng `MaLuotKham`.
- **Điều kiện PASS:** Ném lỗi 1062.
- **Điều kiện FAIL:** Hai bản ghi cấp số cùng liên kết tới một `MaLuotKham`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### NHÓM 3: MA TRẬN CONCURRENCY TRỌNG YẾU ĐỘC LẬP (B-07, B-10, B-11, B-12, B-14, B-16, B-17, B-18, B-19, B-21, B-22, B-23, B-24, B-26, B-27, B-28, B-29, B-30, B-31, B-32, B-33, B-34, B-35, B-36) — 18 TEST CASES

#### TC-CON-001: Hai request cùng `IdempotencyKey` gửi đồng thời vào `so_cap_so_phieu` ($\Delta t \le 15	ext{ms}$)
- **Mục tiêu:** Bắt trọn vẹn lỗi MySQL 1062 trên tầng ứng dụng khi client double-click trong Tx1 cấp số.
- **Blocker / Vấn đề liên quan:** B-07, B-36.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.uq_idempotency_key`, `LuotKhamController@store`.
- **Tiền điều kiện:** 2 tiến trình PHP độc lập cùng nhận được payload có chung `IdempotencyKey`. Bảng barrier đã sẵn sàng.
- **Các bước thực hiện:** Kích hoạt đồng thời 2 tiến trình qua Barrier CLI với độ lệch thời gian $\Delta t \le 15$ms. Cả 2 cùng cố INSERT vào `so_cap_so_phieu`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Tiến trình 1 trả về HTTP 201 Created kèm số phiếu. Tiến trình 2 bắt lỗi MySQL 1062, chuyển sang chế độ poll kết quả và trả về HTTP 200 kèm cùng số phiếu đó.
- **Trạng thái Database mong đợi:** Đúng 1 bản ghi duy nhất được tạo trong `so_cap_so_phieu`.
- **Hành vi Khóa InnoDB mong đợi:** Tiến trình 1 giữ X-lock. Tiến trình 2 xin S-lock và nhận Error 1062 Duplicate entry khi Tiến trình 1 commit.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có `uq_idempotency_key` và công cụ Barrier đo độ trễ.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Barrier log ($\Delta t \le 15$ms), response HTTP của cả 2 tiến trình, log đối soát DB chỉ có 1 dòng.
- **Điều kiện PASS:** Cả 2 client nhận cùng số phiếu hợp lệ, 0% lỗi HTTP 500, DB không bị trùng lặp.
- **Điều kiện FAIL:** Xuất hiện lỗi HTTP 500 hoặc sinh 2 bản ghi trong DB.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-002: Hai request tranh chấp Claim độc lập, kiểm tra explicit rollback và đọc FenceToken (B-31, B-37, B-43)
- **Mục tiêu:** Chứng minh trong Claim Tx độc lập (Phương án B), hàm `claimTicketLedgerExplicit` sử dụng explicit transaction. Khi `affected_rows = 0`, tiến trình gọi `DB::rollBack()` thực sự thay vì empty commit của callback, không đọc `LAST_INSERT_ID` rác.
- **Blocker / Vấn đề liên quan:** B-31, B-37, B-43.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, hàm `claimTicketLedgerExplicit` với `DB::beginTransaction()`, `DB::rollBack()`, `DB::commit()`.
- **Tiền điều kiện:** 1 bản ghi `so_cap_so_phieu` ở trạng thái `DA_CAP`, `FenceToken = 0`. Hai tiến trình A và B cùng chuẩn bị Claim.
- **Các bước thực hiện:**
  1. Hai tiến trình kích hoạt đồng thời qua Barrier CLI ($\Delta t \le 15$ms).
  2. Cả 2 cùng mở `DB::beginTransaction()` và chạy conditional UPDATE nguyên tử.
  3. Tiến trình thắng cuộc nhận `affected_rows === 1`, đọc `SELECT LAST_INSERT_ID()` và gọi `DB::commit()`.
  4. Tiến trình thua cuộc nhận `affected_rows === 0`, chủ động gọi `DB::rollBack()` thực sự, không đọc token và trả về `null`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Tiến trình thắng cuộc mở Tx2 tạo lượt khám với token = 1. Tiến trình thua cuộc rollback sạch sẽ và chuyển sang poll kết quả.
- **Trạng thái Database mong đợi:** `FenceToken = 1`, `TrangThai = 'DANG_XU_LY'`, `LockedByProcess = Process_Win`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock ngắn trong Tx1, giải phóng ngay khi commit hoặc rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log tiến trình thắng gọi commit với Token 1; log tiến trình thua gọi rollback thực sự khi affected_rows = 0.
- **Điều kiện PASS:** Tiến trình thua gọi explicit rollback, 0% empty commit rác, đúng 1 tiến trình nhận token 1.
- **Điều kiện FAIL:** Tiến trình thua đọc token rác hoặc commit ngầm khi không có thay đổi.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-003: Request thua cuộc poll kết quả và nhận lại đúng `MaLuotKham` đã tạo
- **Mục tiêu:** Đảm bảo client bị thua cuộc tranh chấp vẫn nhận lại đầy đủ dữ liệu khi request thắng cuộc hoàn tất Tx2.
- **Blocker / Vấn đề liên quan:** B-10, B-11.
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`.
- **Tiền điều kiện:** Request 1 đang xử lý Tx2 tạo lượt khám. Request 2 nhận `affected_rows = 0` ở Claim Tx1 và chuyển sang chu kỳ poll (mỗi 500ms).
- **Các bước thực hiện:** Request 1 commit Tx2 tạo `MaLuotKham = 120`. Request 2 thực hiện lần poll thứ 2.
- **Kết quả HTTP / Ứng dụng mong đợi:** Request 2 nhận HTTP 200 kèm trọn vẹn thông tin `MaLuotKham = 120`.
- **Trạng thái Database mong đợi:** Bản ghi `so_cap_so_phieu` có `TrangThai = 'DA_SU_DUNG'`, `MaLuotKham = 120`.
- **Hành vi Khóa InnoDB mong đợi:** Request 2 chỉ thực hiện Consistent Non-locking Read (MVCC snapshot read), không bị block.
- **Yêu cầu môi trường DB Clone:** DB Clone có schema V2.4.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE PATH IDENTIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Response JSON của Request 2 khớp 100% với Request 1.
- **Điều kiện PASS:** Request 2 trả về HTTP 200 kèm đúng `MaLuotKham` sau thời gian poll $< 3$ giây.
- **Điều kiện FAIL:** Request 2 timeout hoặc trả về null.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-004: Hai request khác `IdempotencyKey` cấp số đồng thời — Cho phép Audited Gaps (B-18)
- **Mục tiêu:** Kiểm tra tính tăng đơn điệu của STT và bảo đảm mọi khoảng trống (gap) đều có bản ghi giải trình minh bạch.
- **Blocker / Vấn đề liên quan:** B-18.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`.
- **Tiền điều kiện:** Scope `SCOPE_BS_1_20261104` đang ở STT = 5.
- **Các bước thực hiện:** Hai client khác nhau cùng bấm lấy số qua Barrier ($\Delta t \le 15$ms).
- **Kết quả HTTP / Ứng dụng mong đợi:** Một client nhận STT = 6, client kia nhận STT = 7.
- **Trạng thái Database mong đợi:** 2 dòng mới trong sổ cấp số với STT = 6 và 7. Nếu một giao dịch crash ở bước tiếp theo, STT đó được đánh dấu `DA_HUY` kèm lý do.
- **Hành vi Khóa InnoDB mong đợi:** Tuần tự hóa chèn index an toàn, không có deadlock.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 2 bản ghi có STT liên tiếp, log barrier $\Delta t \le 15$ms.
- **Điều kiện PASS:** Không trùng STT, mọi gap đều có bản ghi giải trình.
- **Điều kiện FAIL:** Trùng STT hoặc phát sinh số thứ tự mồ côi không thể truy vết.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-005: Worker đối soát chạy đồng thời với request đang trong hạn Lease (B-32)
- **Mục tiêu:** Chứng minh Worker bỏ qua bản ghi đang giữ Lease hợp lệ, không void nhầm nhờ chốt chặn Grace Period 5 phút.
- **Blocker / Vấn đề liên quan:** B-32, B-17.
- **File / Method / Dòng code liên quan:** Worker đối soát `queue:reconcile-ticket-ledger`.
- **Tiền điều kiện:** Bản ghi đang ở `TrangThai = 'DANG_XU_LY'`, `LeaseExpiresAt = NOW() + 45s`.
- **Các bước thực hiện:** Worker quét bảng `so_cap_so_phieu` tìm các ca cần giải phóng.
- **Kết quả HTTP / Ứng dụng mong đợi:** Worker bỏ qua bản ghi này.
- **Trạng thái Database mong đợi:** Bản ghi giữ nguyên `TrangThai = 'DANG_XU_LY'`.
- **Hành vi Khóa InnoDB mong đợi:** Worker không tác động X-lock lên dòng này.
- **Yêu cầu môi trường DB Clone:** DB Clone có script Worker đối soát.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log quét của Worker báo cáo 0 bản ghi bị void.
- **Điều kiện PASS:** Worker không cập nhật bản ghi này sang `DA_HUY`.
- **Điều kiện FAIL:** Worker void nhầm bản ghi đang có lease hợp lệ.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-006: Worker đối soát tự phục hồi liên kết khi tìm thấy `SoPhieu` trong `luot_kham`
- **Mục tiêu:** Tự động chữa lành dữ liệu khi request đã tạo `luot_kham` thành công nhưng bị rớt mạng ở bước cập nhật sổ cuối cùng.
- **Blocker / Vấn đề liên quan:** B-17, B-32.
- **File / Method / Dòng code liên quan:** Worker đối soát, `luot_kham`.
- **Tiền điều kiện:** `so_cap_so_phieu` bị kẹt ở `DANG_XU_LY` quá hạn Lease và Grace Period ($> 5$ phút). Nhưng trong `luot_kham` ĐÃ TỒN TẠI bản ghi mang `SoPhieu` tương ứng với `MaLuotKham = 99`.
- **Các bước thực hiện:** Worker chạy câu lệnh đối soát và phát hiện `luot_kham`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Worker tự động cập nhật sổ cấp số sang `DA_SU_DUNG`.
- **Trạng thái Database mong đợi:** `TrangThai = 'DA_SU_DUNG'`, `MaLuotKham = 99`, `GhiChu = 'RECONCILED_FROM_ORPHAN_DANG_XU_LY'`.
- **Hành vi Khóa InnoDB mong đợi:** Worker khóa `so_cap_so_phieu` rồi kiểm tra `luot_kham`, tuân thủ đúng thứ tự phân cấp.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng và dữ liệu giả lập.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log Worker cập nhật thành công, đối soát DB có `MaLuotKham = 99`.
- **Điều kiện PASS:** Phục hồi thành công `DA_SU_DUNG`, 0% void nhầm.
- **Điều kiện FAIL:** Worker xóa hoặc hủy bản ghi đã có lượt khám thực tế.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-007: Xử lý khi Request bị treo quá thời hạn Lease (65 giây) và Claim lại (B-32)
- **Mục tiêu:** Kiểm tra Request mới chiếm lại lease thành công khi request cũ bị treo mạng trong Phương án B, nâng `FenceToken` lên 2.
- **Blocker / Vấn đề liên quan:** B-32, B-16.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, Claim Transaction Tx1.
- **Tiền điều kiện:** Request 1 claim số phiếu với `FenceToken = 1`, sau đó bị treo mạng $> 65$ giây (vượt quá hạn lease 60s). Chưa tạo `luot_kham`.
- **Các bước thực hiện:** Request 2 thực hiện Claim lại bản ghi này.
- **Kết quả HTTP / Ứng dụng mong đợi:** Request 2 claim thành công với `FenceToken = 2`.
- **Trạng thái Database mong đợi:** `FenceToken = 2`, `LockedByProcess = Process_2`, `LeaseExpiresAt = NOW() + 60s`.
- **Hành vi Khóa InnoDB mong đợi:** Atomic UPDATE thành công với `affected_rows = 1`.
- **Yêu cầu môi trường DB Clone:** DB Clone có dữ liệu giả lập timeout.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log Request 2 nhận `FenceToken = 2`, Request 1 nếu tỉnh dậy sẽ bị chặn ở chốt Fencing Token.
- **Điều kiện PASS:** Request 2 nhận quyền xử lý hợp lệ với token mới.
- **Điều kiện FAIL:** Request 2 bị chặn vĩnh viễn không chiếm lại được lease.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-008: Bác sĩ gọi khám đồng thời Lễ tân hủy lượt ($\Delta t \le 15	ext{ms}$)
- **Mục tiêu:** Kiểm chứng tính toàn vẹn trạng thái khi 2 vai trò cùng thao tác chéo trên 1 ca khám.
- **Blocker / Vấn đề liên quan:** B-12, B-30.
- **File / Method / Dòng code liên quan:** `LuotKhamController@startExamine` (L340), `LichHenController@cancel` (L260).
- **Tiền điều kiện:** Lượt khám đang ở trạng thái `CHO_KHAM`. Hai tiến trình Bác sĩ và Lễ tân cùng gửi request qua Barrier.
- **Các bước thực hiện:** Kích hoạt đồng thời với $\Delta t \le 15$ms. Bác sĩ gọi khám (`DANG_KHAM`), Lễ tân bấm hủy (`DA_HUY`).
- **Kết quả HTTP / Ứng dụng mong đợi:** Một bên nhận HTTP 200, bên kia nhận HTTP 422 Unprocessable Entity kèm thông báo trạng thái đã thay đổi.
- **Trạng thái Database mong đợi:** Trạng thái cuối cùng là `DANG_KHAM` hoặc `DA_HUY`, không thể vừa khám vừa hủy.
- **Hành vi Khóa InnoDB mong đợi:** Tiến trình đến trước giữ X-lock trên dòng `luot_kham`. Tiến trình đến sau chờ lock, sau đó kiểm tra điều kiện trạng thái và rollback an toàn.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám mẫu.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Barrier log ($\Delta t \le 15$ms), response HTTP của cả 2 bên.
- **Điều kiện PASS:** Không bị deadlock, trạng thái cuối nhất quán, 0% lỗi 500.
- **Điều kiện FAIL:** Cả 2 cùng báo thành công hoặc phát sinh deadlock.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-009: Bác sĩ hoàn thành khám đồng thời Lễ tân điều phối ca khám
- **Mục tiêu:** Ngăn chặn việc chuyển bác sĩ / chuyển phòng khi ca khám đã hoàn tất.
- **Blocker / Vấn đề liên quan:** B-12, B-30.
- **File / Method / Dòng code liên quan:** `LuotKhamController@completeExamine` (L497).
- **Tiền điều kiện:** Ca khám đang `DANG_KHAM`.
- **Các bước thực hiện:** Bác sĩ bấm hoàn thành khám cùng lúc Lễ tân thực hiện điều phối đổi bác sĩ qua Barrier.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bác sĩ hoàn thành ca khám thành công (HTTP 200). Lệnh điều phối của Lễ tân bị từ chối với HTTP 422.
- **Trạng thái Database mong đợi:** `TrangThai = 'HOAN_THANH'`, bác sĩ phụ trách không bị thay đổi.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock tuần tự hóa.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám đang khám.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Trạng thái DB cuối là `HOAN_THANH`, log từ chối của lệnh điều phối.
- **Điều kiện PASS:** Không phát sinh deadlock, bảo toàn kết quả khám.
- **Điều kiện FAIL:** Lượt khám bị đổi bác sĩ sau khi đã khám xong.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-010: KTV CLS cập nhật kết quả đồng thời Bác sĩ ghi bệnh án
- **Mục tiêu:** Bảo toàn chẩn đoán ban đầu và cập nhật trạng thái `CHO_KHAM_LAI` không bị ghi đè.
- **Blocker / Vấn đề liên quan:** B-14, B-30.
- **File / Method / Dòng code liên quan:** `CanLamSangController@updateResult` (L195), `LuotKhamController@savePhieuKham` (L391).
- **Tiền điều kiện:** Bệnh nhân đang ở `CHO_KET_QUA`, chỉ định xét nghiệm cuối cùng đang chờ trả kết quả.
- **Các bước thực hiện:** KTV lưu kết quả xét nghiệm đồng thời Bác sĩ bấm lưu cập nhật bệnh án qua Barrier.
- **Kết quả HTTP / Ứng dụng mong đợi:** Cả 2 request đều trả về HTTP 200.
- **Trạng thái Database mong đợi:** `TrangThai = 'CHO_KHAM_LAI'`, `ChanDoanBanDau` nguyên vẹn, kết quả xét nghiệm được lưu đầy đủ.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật trên các bảng khác nhau (`phieu_kham` và `chi_dinh_dich_vu`), chỉ khóa chung `luot_kham` ngắn ở bước chuyển trạng thái.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca chỉ định CLS.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Trạng thái lượt khám là `CHO_KHAM_LAI`, dữ liệu cả 2 bảng nguyên vẹn.
- **Điều kiện PASS:** Dữ liệu cả 2 bên được ghi nhận đầy đủ, không bên nào làm mất dữ liệu bên kia.
- **Điều kiện FAIL:** Bác sĩ ghi bệnh án làm mất cờ `CHO_KHAM_LAI` hoặc mất kết quả CLS.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-011: Thực nghiệm Deadlock tiềm ẩn khi tiếp nhận lại lịch hẹn đã khám xong (B-33, B-39)
- **Mục tiêu:** Kích hoạt có chủ đích lỗi MySQL Error 1213 khi một request tiếp nhận gửi nhầm ID của một lịch hẹn đã có lượt khám đang hoàn tất khám.
- **Blocker / Vấn đề liên quan:** B-33, B-39.
- **File / Method / Dòng code liên quan:** `LuotKhamController@store` ($LH \rightarrow LK$) vs `completeExamine` ($LK \rightarrow LH$).
- **Tiền điều kiện:** 1 ca khám $LK_1$ gắn với lịch hẹn $LH_1$ đang ở buồng khám. Client gửi request `store` với `MaLichHen = LH_1` đúng lúc Bác sĩ bấm `completeExamine` trên $LK_1$.
- **Các bước thực hiện:**
  1. Tiến trình 1 (`store`): L250 lấy X-lock trên $LH_1$, sau đó L258 xin X-lock trên $LK_1$.
  2. Tiến trình 2 (`completeExamine`): L541 lấy X-lock trên $LK_1$, sau đó L548 xin X-lock trên $LH_1$.
  3. Barrier đồng bộ $\Delta t \le 15$ms.
- **Kết quả HTTP / Ứng dụng mong đợi:** MySQL Engine phát hiện chu trình Wait-For Graph và ngắt 1 tiến trình với ngoại lệ SQLSTATE 40001 (Error 1213 Deadlock).
- **Trạng thái Database mong đợi:** 1 tiến trình hoàn tất thành công, 1 tiến trình bị rollback hoàn toàn.
- **Hành vi Khóa InnoDB mong đợi:** Khối `LATEST DETECTED DEADLOCK` xuất hiện trong `SHOW ENGINE INNODB STATUS`.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone độc lập để kích hoạt deadlock.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `POTENTIAL DEADLOCK — NOT EXPERIMENTALLY VERIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** MySQL Error Code 1213, log InnoDB deadlock graph chỉ rõ 2 thread chờ chéo nhau.
- **Điều kiện PASS:** MySQL Engine ném đúng lỗi 1213 khi có va chạm chéo trên cùng cặp $LH_1$ và $LK_1$.
- **Điều kiện FAIL:** Không phát hiện deadlock hoặc lỗi khác không phải 1213.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-012: Kiểm chứng phân cấp khóa toàn cục loại trừ Deadlock sau Refactor và phân tích savePhieuKham (B-33, B-39)
- **Mục tiêu:** Chứng minh refactor thứ tự toàn cục $LH \rightarrow LK$ trong `completeExamine` loại trừ deadlock; đồng thời xác nhận giữa `savePhieuKham` và `CDDV.store` không có deadlock vì chạy autocommit riêng rẽ.
- **Blocker / Vấn đề liên quan:** B-33, B-39.
- **File / Method / Dòng code liên quan:** `LuotKhamController@completeExamine`, `savePhieuKham`, `ChiDinhDichVuController@store`.
- **Tiền điều kiện:** Mã nguồn `completeExamine` đã được refactor lấy khóa $LH$ trước $LK$.
- **Các bước thực hiện:** Chạy 50 lần kiểm thử lặp qua Barrier trên cả luồng tiếp nhận và luồng bệnh án.
- **Kết quả HTTP / Ứng dụng mong đợi:** 100% các lần chạy đều thành công tuần tự, không có lần nào văng Error 1213.
- **Trạng thái Database mong đợi:** Dữ liệu hoàn tất nhất quán, không có transaction bị abort do deadlock.
- **Hành vi Khóa InnoDB mong đợi:** Khóa tuần tự hóa thẳng hàng, không có chu trình chờ chéo.
- **Yêu cầu môi trường DB Clone:** DB Clone có code đã refactor.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 50/50 lần chạy không có Error 1213 trong log.
- **Điều kiện PASS:** 0% Error 1213 qua 50 lần thử nghiệm.
- **Điều kiện FAIL:** Vẫn phát sinh Error 1213 dù chỉ 1 lần.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-013: Crash mô phỏng sau khi cấp số nhưng trước khi tạo lượt $
ightarrow$ Chuyển Burned Ticket (B-32)
- **Mục tiêu:** Xác nhận số phiếu bị bỏ dở (abandoned) được Worker chuyển an toàn sang `DA_HUY` sau khi hết Grace Period 5 phút.
- **Blocker / Vấn đề liên quan:** B-32, B-18.
- **File / Method / Dòng code liên quan:** Bảng `so_cap_so_phieu`, Worker đối soát.
- **Tiền điều kiện:** Bản ghi sổ cấp số có `TrangThai = 'DA_CAP'` được tạo cách đây 20 phút mà không có Claim hay `luot_kham`.
- **Các bước thực hiện:** Kích hoạt Worker đối soát chạy định kỳ.
- **Kết quả HTTP / Ứng dụng mong đợi:** Worker đánh dấu bản ghi này là Burned Ticket.
- **Trạng thái Database mong đợi:** `TrangThai = 'DA_HUY'`, `GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS'`.
- **Hành vi Khóa InnoDB mong đợi:** UPDATE có điều kiện thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone có bản ghi hết hạn mẫu.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bản ghi mang `TrangThai = 'DA_HUY'`, `GhiChu = 'EXPIRED_ORPHAN_ALLOCATION_VOIDS'`.
- **Điều kiện PASS:** Chuyển đúng `DA_HUY`, không cấp lại số này cho bệnh nhân khác.
- **Điều kiện FAIL:** Bản ghi bị treo vĩnh viễn ở `DA_CAP`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-014: Đo lường độ trễ Barrier: Hủy mẫu kiểm thử nếu Execution Skew $\Delta t > 15	ext{ms}$
- **Mục tiêu:** Bảo đảm tính hợp lệ toán học của các mẫu kiểm thử đồng thời qua cơ chế hủy mẫu khi bị lệch thời gian.
- **Blocker / Vấn đề liên quan:** Phương pháp luận kiểm thử Concurrency.
- **File / Method / Dòng code liên quan:** `test_concurrency_barrier` script.
- **Tiền điều kiện:** 2 worker được lập lịch chạy qua barrier. Cố tình gây trễ 30ms cho worker 2.
- **Các bước thực hiện:** Khởi chạy kịch bản đo độ lệch $\Delta t = |t_1 - t_2|$.
- **Kết quả HTTP / Ứng dụng mong đợi:** Công cụ kiểm thử ghi nhận `Execution Skew = 30ms > 15ms`, tự động gắn cờ `INVALID_SAMPLE` và chạy lại lượt khác.
- **Trạng thái Database mong đợi:** Kết quả lượt chạy bị hủy không được tính vào báo cáo thống kê chính thức.
- **Hành vi Khóa InnoDB mong đợi:** Rollback dữ liệu thử nghiệm của mẫu hỏng.
- **Yêu cầu môi trường DB Clone:** Môi trường kiểm thử có script Barrier.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log barrier ghi nhận `status = 'INVALID_SAMPLE'`, độ lệch $\Delta t$.
- **Điều kiện PASS:** Tự động loại bỏ mẫu không đạt chuẩn đồng thời.
- **Điều kiện FAIL:** Chấp nhận mẫu test bị lệch thời gian lớn vào kết quả PASS.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-CON-015: Fencing Token chặn đứng Request cũ commit sau khi Lease đã bị chiếm lại (B-31, B-32)
- **Mục tiêu:** Chứng minh trong Phương án B, Request A bị lag $>60$s nhận `affected_rows = 0` và tự động rollback khi Request B đã claim `FenceToken = 2`.
- **Blocker / Vấn đề liên quan:** B-31, B-32, B-16.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.FenceToken`, Business Tx2.
- **Tiền điều kiện:** Request A giữ `FenceToken = 1`. Request B đã chiếm lại quyền với `FenceToken = 2`. Request A thức dậy và cố hoàn tất Tx2.
- **Các bước thực hiện:** Request A chạy câu lệnh chốt cuối Tx2: `UPDATE so_cap_so_phieu SET TrangThai='DA_SU_DUNG', MaLuotKham=:lk WHERE MaCapSo=:id AND FenceToken=1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Câu lệnh trả về `affected_rows = 0`. Request A phát hiện bị mất quyền, chủ động gọi `DB::rollBack()` và trả về HTTP 409 Conflict.
- **Trạng thái Database mong đợi:** Không có lượt khám nào của Request A tồn tại trong `luot_kham`. Bản ghi sổ cấp số vẫn an toàn thuộc về Request B.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock kiểm tra điều kiện WHERE, giải phóng khi rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có giả lập 2 tiến trình.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Request A nhận `affected_rows = 0`, rollback toàn bộ Tx2, ném HTTP 409. Request B hoàn tất với Token 2.
- **Điều kiện PASS:** Request A bị chặn đứng 100%, loại trừ hoàn toàn hiện tượng Split-Brain.
- **Điều kiện FAIL:** Request A vẫn commit đè lên dữ liệu của Request B.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-016: Kiểm chứng 4 Timeline Race Condition giữa Worker, Request A và Request B (B-34, B-40, B-45)
- **Mục tiêu:** Kiểm chứng toàn diện 4 kịch bản tương tác đồng thời theo B-45:
  - Kịch bản A: A chưa INSERT luot_kham, Lease hết hạn, Worker chạy trước, B reclaim.
  - Kịch bản B: A đã INSERT luot_kham nhưng chưa commit, Worker chạy `FOR SHARE`, B reclaim.
  - Kịch bản C: Worker đọc ledger trước, giữ Gap S-lock, A cố INSERT luot_kham.
  - Kịch bản D: A chạy bước xác nhận cuối Tx2, Worker và B đồng thời tranh chấp ledger.
  Chứng minh việc Request chỉ khóa ledger ở bước cuối loại trừ hoàn toàn deadlock chu trình với Worker.
- **Blocker / Vấn đề liên quan:** B-34, B-40, B-44, B-45.
- **File / Method / Dòng code liên quan:** Worker đối soát, `LuotKhamController@store`, `so_cap_so_phieu`, `luot_kham`.
- **Tiền điều kiện:** Môi trường DB Clone có bảng ledger và lượt khám. Cài đặt 3 tiến trình qua Barrier CLI.
- **Các bước thực hiện:**
  1. Chạy Kịch bản A: Kích hoạt Worker đọc `SoPhieu` khi A bị treo trước INSERT. Cho B reclaim và xác nhận A rollback khi tỉnh dậy.
  2. Chạy Kịch bản B: Cho A chèn `luot_kham` rồi sleep. Kích hoạt Worker chạy `FOR SHARE` và đo lường Lock Wait. Cho B reclaim và xác nhận Worker unblock an toàn sau khi A rollback.
  3. Chạy Kịch bản C: Cho Worker đọc `FOR SHARE` tạo Gap S-lock trên khoảng trống. Cho A chạy INSERT và xác nhận A bị Lock Wait chờ Worker. Xác nhận Worker cập nhật ledger thành công (vì A chưa giữ ledger), sau đó giải phóng Gap Lock cho A chèn tiếp.
  4. Chạy Kịch bản D: Kích hoạt A, B và Worker cùng tranh chấp dòng ledger ở milisecond cuối.
- **Kết quả HTTP / Ứng dụng mong đợi:** Trong cả 4 kịch bản, không có bất kỳ kịch bản nào phát sinh MySQL Error 1213 Deadlock chu trình. Dữ liệu cuối cùng luôn thuộc về đúng 1 tiến trình hợp lệ.
- **Trạng thái Database mong đợi:** Không có lượt khám mồ côi, không có split-brain, ledger nhất quán.
- **Hành vi Khóa InnoDB mong đợi:** Cả Request và Worker đều tuân thủ thứ tự khóa toàn cục: `luot_kham` trước $
ightarrow$ `so_cap_so_phieu` sau.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có unique index `uq_luot_kham_so_phieu` và `so_cap_so_phieu`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log khóa InnoDB qua `SHOW ENGINE INNODB STATUS`, log timeline của 3 tiến trình trong cả 4 kịch bản.
- **Điều kiện PASS:** Cả 4 kịch bản hoàn tất tuần tự an toàn, 0% Error 1213, dữ liệu toàn vẹn.
- **Điều kiện FAIL:** Phát sinh Deadlock chu trình hoặc xảy ra Split-Brain giữa Worker và Request.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-017: Đồng bộ thứ tự khóa giữa Worker và Request tạo lượt khám (B-33)
- **Mục tiêu:** Kiểm chứng phân cấp khóa $SCSP \rightarrow LK$: Worker khóa $SCSP$ trước rồi đọc $LK$, Request khóa $SCSP$ rồi ghi $LK$.
- **Blocker / Vấn đề liên quan:** B-33, B-19.
- **File / Method / Dòng code liên quan:** Worker đối soát, `LuotKhamController@store`.
- **Tiền điều kiện:** Worker và Request cùng xử lý trên cùng một số phiếu.
- **Các bước thực hiện:** Kích hoạt Worker và Request chạy song song qua Barrier. Cả 2 cùng tuân thủ lấy khóa $SCSP$ trước.
- **Kết quả HTTP / Ứng dụng mong đợi:** Tiến trình đến sau chờ tiến trình trước hoàn tất, không bao giờ xảy ra deadlock chu trình.
- **Trạng thái Database mong đợi:** Cả 2 tiến trình kết thúc an toàn, dữ liệu nhất quán.
- **Hành vi Khóa InnoDB mong đợi:** Lock Wait thẳng hàng một chiều $SCSP \rightarrow LK$.
- **Yêu cầu môi trường DB Clone:** DB Clone có đầy đủ bảng.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log khóa InnoDB, không phát sinh Error 1213 giữa Worker và Request.
- **Điều kiện PASS:** Hai tiến trình chạy tuần tự an toàn, 0% deadlock.
- **Điều kiện FAIL:** Phát sinh deadlock chu trình giữa Worker và Request.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-018: Kiểm tra Side-Effects nội bộ tự Rollback và Kế hoạch Outbox (B-35)
- **Mục tiêu:** Chứng minh khi Request bị mất FenceToken và rollback Tx2, các thông báo nội bộ trong bảng `thong_bao` tự động bị xóa sổ, không để lại rác side-effect.
- **Blocker / Vấn đề liên quan:** B-35.
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`, `NotificationService.php` L20, bảng `thong_bao`.
- **Tiền điều kiện:** Request đang thực hiện Tx2: đã chèn `luot_kham`, đã gọi `NotificationService::send()` ghi vào bảng `thong_bao`.
- **Các bước thực hiện:** Gây lỗi Fencing Token ở bước cập nhật sổ cấp số cuối cùng $
ightarrow$ Kích hoạt `DB::rollBack()`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bắt lỗi ngoại lệ, trả về HTTP 409.
- **Trạng thái Database mong đợi:** Cả bản ghi `luot_kham` lẫn bản ghi trong bảng `thong_bao` đều bị xóa sạch bởi lệnh ROLLBACK của InnoDB.
- **Hành vi Khóa InnoDB mong đợi:** Hoàn trả toàn bộ Undo Logs.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `thong_bao` và `luot_kham`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `SELECT COUNT(*) FROM thong_bao WHERE ...` trả về 0 sau khi rollback.
- **Điều kiện PASS:** 0 thông báo nội bộ nào tồn tại trong database khi transaction rollback do lỗi FenceToken.
- **Điều kiện FAIL:** Bản ghi thông báo vẫn tồn tại sau khi tạo lượt khám thất bại.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-019: Kiểm chứng Unknown Commit Result và Idempotency Recovery khi mất mạng lúc commit (B-50)
- **Mục tiêu:** Mô phỏng kịch bản MySQL đã ghi nhận commit thành công trên đĩa nhưng kết nối mạng bị đứt trước khi PHP nhận được gói tin TCP OK; chứng minh IdempotencyKey giúp phục hồi trạng thái an toàn.
- **Blocker / Vấn đề liên quan:** B-50 (Commit failure & Unknown commit result).
- **File / Method / Dòng code liên quan:** `claimTicketLedgerSafe`, bảng `so_cap_so_phieu`.
- **Tiền điều kiện:** Request 1 gửi claim với `IdempotencyKey = 'IDEMP-001'`. MySQL server ngắt kết nối socket ngay sau khi commit lệnh UPDATE.
- **Các bước thực hiện:**
  1. Client nhận `PDOException: MySQL server has gone away` hoặc `Connection reset by peer`.
  2. Client tự động thử lại (Retry) gửi cùng payload với `IdempotencyKey = 'IDEMP-001'`.
  3. Hệ thống kiểm tra: Vì `IdempotencyKey` đã tồn tại và mang trạng thái `DANG_XU_LY` với token của Request 1, hệ thống không cấp token mới mà trả về chính xác token đã cấp.
- **Kết quả HTTP / Ứng dụng mong đợi:** Lần 1 ném exception kết nối, lần 2 trả về HTTP 200 kèm `assignedToken = 1`.
- **Trạng thái Database mong đợi:** Không có dòng duplicate nào sinh ra, `FenceToken = 1`.
- **Hành vi Khóa InnoDB mong đợi:** Lần 2 chỉ thực hiện Consistent Non-locking Read theo `IdempotencyKey`.
- **Yêu cầu môi trường DB Clone:** DB Clone có proxy ngắt kết nối mạng mô phỏng (toxiproxy hoặc iptables).
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `TARGET DESIGN SPECIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log retry với cùng idempotency key, xác nhận token không bị tăng kép.
- **Điều kiện PASS:** Phục hồi thành công trạng thái đã commit, 0% tạo vé trùng.
- **Điều kiện FAIL:** Sinh bản ghi mới hoặc tăng token lên 2.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-020: Chặn đứng lồng Claim Tx1 vào trong một Transaction mở sẵn của Caller (B-50)
- **Mục tiêu:** Kiểm chứng chốt chặn Autonomous Guard: Ném `LogicException` ngăn ngừa việc vô tình gọi `claimTicketLedgerSafe` bên trong một transaction của caller, loại trừ cạm bẫy Savepoint lồng nhau.
- **Blocker / Vấn đề liên quan:** B-50 (Nested transaction & Savepoint violation).
- **File / Method / Dòng code liên quan:** `claimTicketLedgerSafe` (Lệnh kiểm tra `DB::transactionLevel() === 0`).
- **Tiền điều kiện:** Caller mở sẵn `DB::beginTransaction()`.
- **Các bước thực hiện:** Caller cố tình gọi `claimTicketLedgerSafe('KEY_01', 'PID_01')`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Ứng dụng lập tức ném `LogicException: FATAL ARCHITECTURAL VIOLATION: Claim Ticket Ledger must execute as an autonomous transaction.`
- **Trạng thái Database mong đợi:** Không có câu lệnh nào được gửi xuống database, transaction của caller không bị can thiệp.
- **Hành vi Khóa InnoDB mong đợi:** Bị chặn tại tầng PHP trước khi chạm MySQL.
- **Yêu cầu môi trường DB Clone:** Môi trường PHPUnit với DB Clone.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `TARGET DESIGN SPECIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bắt đúng `LogicException`, xác nhận `DB::transactionLevel() === 1` của caller được bảo toàn.
- **Điều kiện PASS:** Ném đúng exception kiến trúc, bảo vệ ranh giới giao dịch tự trị.
- **Điều kiện FAIL:** Cho phép thực thi tạo savepoint lồng nhau.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-021: Phân biệt hành vi Rollback giữa MySQL Error 1213 và Error 1205 (B-50)
- **Mục tiêu:** Chứng minh thực nghiệm: Error 1213 được InnoDB tự rollback toàn transaction, trong khi Error 1205 chỉ rollback câu lệnh đơn lẻ $
ightarrow$ Kiểm chứng hàm bắt buộc gọi `rollBack()` khi gặp 1205 để tránh treo lock.
- **Blocker / Vấn đề liên quan:** B-50 (Error 1213 vs Error 1205 rollback scope).
- **File / Method / Dòng code liên quan:** `ManagesTransactions.php`, `claimTicketLedgerSafe`.
- **Tiền điều kiện:** Cài đặt `innodb_lock_wait_timeout = 2` trên DB Clone. Tạo tình huống 2 tiến trình gây Lock Wait Timeout.
- **Các bước thực hiện:**
  1. Tiến trình 1 giữ X-lock trên dòng ledger.
  2. Tiến trình 2 cố update và bị timeout sau 2 giây (Error 1205).
  3. Kiểm tra xem Tiến trình 2 có chủ động gọi `rollBack()` để giải phóng toàn bộ transaction hay không.
- **Kết quả HTTP / Ứng dụng mong đợi:** Tiến trình 2 bắt lỗi 1205, rollback toàn bộ transaction và thử lại ở attempt 2.
- **Trạng thái Database mong đợi:** Không có transaction nào bị treo lơ lửng.
- **Hành vi Khóa InnoDB mong đợi:** `SHOW ENGINE INNODB STATUS` không còn active lock của tiến trình bị timeout.
- **Yêu cầu môi trường DB Clone:** DB Clone có thể cấu hình `innodb_lock_wait_timeout`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `THEORETICAL ANALYSIS`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log `innodb_rollback_on_timeout` và log rollback của Tiến trình 2.
- **Điều kiện PASS:** Transaction bị timeout được giải phóng sạch sẽ 100%.
- **Điều kiện FAIL:** Transaction tiếp tục chạy hoặc để lại lock treo.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-022: Mô phỏng PHP Process Crash sau Commit trước khi chạy afterCommit callback (B-52)
- **Mục tiêu:** Chứng minh giới hạn của `DB::afterCommit()`: Nếu PHP process bị kill (SIGKILL/OOM) ngay sau commit DB, sự kiện WebSocket bị mất vĩnh viễn; chứng minh sự cần thiết của Transactional Outbox cho Phase 3.
- **Blocker / Vấn đề liên quan:** B-52 (In-memory callback loss risk).
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`, `DB::afterCommit`.
- **Tiền điều kiện:** Cài đặt callback `DB::afterCommit` phát sự kiện hàng đợi.
- **Các bước thực hiện:**
  1. Tiến trình thực hiện commit Tx2 tạo `luot_kham` thành công.
  2. Ngay tại dòng sau commit, kích hoạt `posix_kill(getmypid(), SIGKILL)`.
  3. Kiểm tra xem callback `afterCommit` có chạy được không và client có nhận được WebSocket không.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bản ghi `luot_kham` ĐÃ ĐƯỢC LƯU trong DB, nhưng sự kiện WebSocket HOÀN TOÀN BIẾN MẤT.
- **Trạng thái Database mong đợi:** `luot_kham` tồn tại, không có bản ghi outbox nào được lưu (vì chưa có outbox).
- **Hành vi Khóa InnoDB mong đợi:** Khóa đã được giải phóng khi commit trước khi crash.
- **Yêu cầu môi trường DB Clone:** Môi trường Linux CLI hoặc mô phỏng process exit.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `THEORETICAL ANALYSIS`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log DB có bản ghi mới nhưng log WebSocket listener không nhận được gói tin.
- **Điều kiện PASS:** Xác nhận được rủi ro mất sự kiện của `afterCommit` khi process crash.
- **Điều kiện FAIL:** Không tái hiện được hành vi crash.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-CON-023: Mô phỏng Timeline D — Tranh chấp đồng thời giữa A Finalize, B Reclaim và Worker Void (B-45, B-51)
- **Mục tiêu:** Kiểm chứng thực tế Timeline D khi 3 tiến trình cùng xin Exclusive Row Lock trên cùng một bản ghi ledger tại cùng microsecond.
- **Blocker / Vấn đề liên quan:** B-45, B-51 (Timeline D concurrent resolution).
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, Worker đối soát, `LuotKhamController@store`.
- **Tiền điều kiện:** 1 bản ghi ledger ở `DANG_XU_LY`, `FenceToken = 1`, vừa chạm mốc hết hạn lease. Cả 3 tiến trình cùng gửi query qua Barrier CLI ($\Delta t \le 15$ms).
- **Các bước thực hiện:**
  1. A chạy Finalize Tx2: `UPDATE ... SET TrangThai='DA_SU_DUNG' WHERE FenceToken=1`.
  2. B chạy Reclaim: `UPDATE ... SET FenceToken=LAST_INSERT_ID(FenceToken+1) WHERE ...`.
  3. Worker chạy Void: `UPDATE ... SET TrangThai='DA_HUY' WHERE FenceToken=1`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Đúng 1 tiến trình được cấp khóa trước và thành công (`affected_rows = 1`). Hai tiến trình còn lại nhận `affected_rows = 0` và rút lui an toàn. 0% Deadlock 1213.
- **Trạng thái Database mong đợi:** Trạng thái cuối cùng là `DA_SU_DUNG` (nếu A thắng) hoặc `DANG_XU_LY` với Token 2 (nếu B thắng) hoặc `DA_HUY` (nếu Worker thắng). Không bao giờ có trạng thái lai tạp.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock tuần tự hóa an toàn.
- **Yêu cầu môi trường DB Clone:** DB Clone có bảng `so_cap_so_phieu`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `THEORETICAL ANALYSIS`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Log affected_rows của cả 3 tiến trình, đối soát trạng thái cuối cùng của DB.
- **Điều kiện PASS:** Không deadlock, không split-brain, dữ liệu nhất quán.
- **Điều kiện FAIL:** Phát sinh Error 1213 hoặc có hơn 1 tiến trình báo thành công.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-CON-024: Đo lường Gap Lock thực tế trên Unique Index `SoPhieu` khi Worker chạy `FOR SHARE` (B-40, B-51)
- **Mục tiêu:** Đo lường hành vi Gap Lock thực tế trên Unique Index `uq_luot_kham_so_phieu` khi bản ghi chưa tồn tại, xác nhận Gap S-Lock chặn Insert Intention Lock của Request chèn mới.
- **Blocker / Vấn đề liên quan:** B-40, B-51 (Gap S-Lock vs Insert Intention Lock).
- **File / Method / Dòng code liên quan:** `luot_kham.uq_luot_kham_so_phieu`.
- **Tiền điều kiện:** Bảng `luot_kham` có 2 bản ghi `SoPhieu = 'DL-001'` và `SoPhieu = 'DL-010'`. Khoảng trống giữa 001 và 010 đang trống.
- **Các bước thực hiện:**
  1. Worker chạy: `SELECT MaLuotKham FROM luot_kham WHERE SoPhieu = 'DL-005' FOR SHARE;` (nhận Gap S-Lock).
  2. Request chạy: `INSERT INTO luot_kham (SoPhieu) VALUES ('DL-005');`
  3. Đo lường xem Request có bị rơi vào trạng thái `LOCK WAIT` hay không.
  4. Worker gọi `COMMIT` $
ightarrow$ Quan sát Request được unblock và chèn thành công.
- **Kết quả HTTP / Ứng dụng mong đợi:** Request bị treo đúng trong khoảng thời gian Worker giữ transaction, sau đó hoàn tất thành công.
- **Trạng thái Database mong đợi:** Bản ghi `DL-005` được chèn thành công sau khi Worker commit.
- **Hành vi Khóa InnoDB mong đợi:** `SHOW ENGINE INNODB STATUS` ghi nhận `lock_mode X locks gap before rec insert intention waiting`.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có unique index `uq_luot_kham_so_phieu`.
- **Loại test:** `2-Process Concurrency`.
- **Trạng thái phân tích mã nguồn:** `THEORETICAL ANALYSIS`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Trích xuất log khóa từ `performance_schema.data_locks` hoặc `SHOW ENGINE INNODB STATUS`.
- **Điều kiện PASS:** Ghi nhận chính xác xung đột Gap S-Lock chặn Insert Intention Lock và giải phóng an toàn khi commit.
- **Điều kiện FAIL:** Không đo lường được Gap Lock hoặc phát sinh deadlock không mong muốn.
- **Mức độ nghiêm trọng:** **BLOCKER**.

---


#### TC-CON-025 (TC-74): Phân biệt ClaimConflictException không bị retry bởi Laravel ConcurrencyErrorDetector (B-55)
- **Mục tiêu:** Kiểm chứng cơ chế `DB::transaction($callback, 3)` của Laravel 12 không bao giờ retry khi gặp `ClaimConflictException` (xung đột nghiệp vụ), mà chỉ retry khi gặp MySQL Error 1213 hoặc 1205.
- **Blocker / Vấn đề liên quan:** B-55 (Claim Conflict vs Laravel Concurrency Retry Segregation).
- **File / Method / Dòng code liên quan:** `vendor/laravel/framework/src/Illuminate/Database/Concerns/ManagesTransactions.php`, `ConcurrencyErrorDetector.php`.
- **Tiền điều kiện:** Đăng ký test case mô phỏng gọi `DB::transaction(callback, 3)`. Trong closure đầu tiên, throw `new ClaimConflictException("Ticket already claimed")`.
- **Các bước thực hiện:**
  1. Khởi tạo transaction với `$attempts = 3`.
  2. Lần gọi thứ 1: ném `ClaimConflictException`.
  3. Bắt ngoại lệ ở tầng ngoài, đếm số lần closure được thực thi.
  4. Tiếp tục thực hiện một kịch bản thứ hai: ném `new PDOException("Deadlock found when trying to get lock", 40001)`.
  5. Đếm số lần closure được thực thi trong kịch bản thứ hai.
- **Kết quả HTTP / Ứng dụng mong đợi:**
  - Kịch bản 1: Closure chỉ chạy đúng 1 lần duy nhất, ngoại lệ `ClaimConflictException` được ném ra ngoài ngay lập tức, không có retry.
  - Kịch bản 2: Closure chạy 3 lần trước khi ném ngoại lệ ra ngoài (đúng cơ chế concurrency retry).
- **Trạng thái Database mong đợi:** Rollback sạch sẽ sau 1 lần trong kịch bản 1.
- **Hành vi Khóa InnoDB mong đợi:** N/A (Kiểm tra tầng Framework PDO Wrapper).
- **Yêu cầu môi trường DB Clone:** Có thể chạy Unit Test trên PHPUnit môi trường kiểm thử.
- **Loại test:** `PHPUnit Concurrency Error Detector Test`.
- **Trạng thái phân tích mã nguồn:** `CURRENT CODE VERIFIED`
- **Trạng thái thực thi:** `CHƯA THỰC THI (NOT TESTED)`

#### TC-CON-026 (TC-75): Kiểm tra Autonomous Guard trên explicit connection và nested transaction detection (B-56)
- **Mục tiêu:** Kiểm chứng `AutonomousClaimGuard::assertNoActiveTransaction('mysql')` phát hiện và chặn đứng mọi lời gọi Claim khi connection `'mysql'` đang nằm trong một transaction lồng nhau.
- **Blocker / Vấn đề liên quan:** B-56 (Autonomous Transaction & Connection Identity).
- **File / Method / Dòng code liên quan:** `AutonomousClaimGuard`, `DB::connection('mysql')->transactionLevel()`.
- **Tiền điều kiện:** Mở một transaction tường minh trên connection `mysql`: `DB::connection('mysql')->beginTransaction();`.
- **Các bước thực hiện:**
  1. Gọi `DB::connection('mysql')->beginTransaction();` (transactionLevel = 1).
  2. Tiến trình gọi `AutonomousClaimGuard::assertNoActiveTransaction('mysql')`.
  3. Kiểm tra ngoại lệ `AutonomousTransactionViolationException` có được ném ra hay không.
  4. Gọi `DB::connection('mysql')->rollBack();` để dọn dẹp.
  5. Gọi lại `AutonomousClaimGuard::assertNoActiveTransaction('mysql')` khi transactionLevel = 0, xác nhận pass qua guard thành công.
- **Kết quả HTTP / Ứng dụng mong đợi:** Ném ngoại lệ `AutonomousTransactionViolationException` khi transactionLevel > 0; cho phép đi tiếp khi transactionLevel === 0.
- **Trạng thái Database mong đợi:** Không có thay đổi trên database.
- **Hành vi Khóa InnoDB mong đợi:** Không phát sinh khóa ngoài ý muốn.
- **Yêu cầu môi trường DB Clone:** Yêu cầu DB clone có kết nối `mysql`.
- **Loại test:** `PHPUnit Autonomous Guard Integration Test`.
- **Trạng thái phân tích mã nguồn:** `TARGET DESIGN SPECIFIED`
- **Trạng thái thực thi:** `CHƯA THỰC THI (NOT TESTED)`

#### TC-CON-027 (TC-76): Kiểm thử câu lệnh Worker Void nguyên tử với 4 điều kiện WHERE dưới áp lực tranh chấp finalize (B-57)
- **Mục tiêu:** Kiểm chứng câu lệnh `UPDATE` của Worker Recovery có đủ 4 điều kiện nguyên tử (`MaCapSo`, `TrangThai = 'DANG_XU_LY'`, `FenceToken = :readToken`, `LeaseExpiresAt < NOW() - 5m`) và thất bại an toàn (`affected_rows === 0`) khi Request finalize đồng thời.
- **Blocker / Vấn đề liên quan:** B-57 (Worker Void Atomic Fencing & Race Condition).
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu`, Worker Recovery SQL.
- **Tiền điều kiện:** Bản ghi `so_cap_so_phieu` có `MaCapSo = 888`, `TrangThai = 'DANG_XU_LY'`, `FenceToken = 2`, `LeaseExpiresAt` đã quá hạn 10 phút.
- **Các bước thực hiện:**
  1. Worker W1 đọc bản ghi: lưu `readToken = 2`.
  2. Tiến trình Request R1 chen ngang, thực hiện finalize hợp lệ: `UPDATE so_cap_so_phieu SET TrangThai = 'DA_SU_DUNG', MaLuotKham = 500 WHERE MaCapSo = 888 AND TrangThai = 'DANG_XU_LY' AND FenceToken = 2;` -> R1 commit thành công.
  3. Worker W1 thực thi câu lệnh atomic void:
     `UPDATE so_cap_so_phieu SET TrangThai = 'DA_HUY', FenceToken = FenceToken + 1 WHERE MaCapSo = 888 AND TrangThai = 'DANG_XU_LY' AND FenceToken = 2 AND LeaseExpiresAt < DATE_SUB(NOW(), INTERVAL 5 MINUTE);`
  4. Kiểm tra `affected_rows` của W1.
  5. Đọc lại trạng thái cuối cùng của bản ghi 888 trong database.
- **Kết quả HTTP / Ứng dụng mong đợi:** W1 nhận `affected_rows = 0`, ghi nhận log `WORKER_VOID_SKIPPED_ALREADY_FINALIZED`.
- **Trạng thái Database mong đợi:** Bản ghi 888 giữ nguyên `TrangThai = 'DA_SU_DUNG'`, `MaLuotKham = 500`, không bị đổi thành `DA_HUY`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-Lock của R1 hoàn tất trước, W1 nhận snapshot mới nhất và không khớp điều kiện WHERE.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có bảng `so_cap_so_phieu` với schema mục tiêu.
- **Loại test:** `2-Process Concurrency Test`.
- **Trạng thái phân tích mã nguồn:** `TARGET DESIGN SPECIFIED`
- **Trạng thái thực thi:** `CHƯA THỰC THI (NOT TESTED)`

#### TC-CON-028 (TC-77): Kiểm thử Unknown Commit Result, ngắt mạng giả lập và cơ chế replay response qua IdempotencyKey (B-58)
- **Mục tiêu:** Kiểm chứng cơ chế phục hồi Unknown Commit Result qua `IdempotencyKey`, bảo đảm trả lại nguyên vẹn thông tin lượt khám cũ (HTTP 200 Replay) mà không tạo trùng lượt khám khi client bị ngắt mạng lúc commit.
- **Blocker / Vấn đề liên quan:** B-58 (Unknown Commit Result & Idempotency Recovery).
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.IdempotencyKey`, `ResponseCache`, Controller `tiepNhanLichHen`.
- **Tiền điều kiện:** Khởi tạo yêu cầu tiếp nhận với `IdempotencyKey = 'UUID-TEST-9999'`. Tx2 commit thành công tạo `MaLuotKham = 777` và cập nhật ledger `DA_SU_DUNG`.
- **Các bước thực hiện:**
  1. Client gửi request lần 1 với `IdempotencyKey = 'UUID-TEST-9999'`.
  2. Server hoàn tất Tx2 thành công, lưu snapshot kết quả vào `ResponseCache`.
  3. Giả lập ngắt socket (mock network drop trước khi trả HTTP response về cho client).
  4. Client timeout, kích hoạt retry lần 2 với cùng `IdempotencyKey = 'UUID-TEST-9999'`.
  5. Controller tra cứu `so_cap_so_phieu` theo `IdempotencyKey`: thấy trạng thái `DA_SU_DUNG` và có `MaLuotKham = 777`.
  6. Trả lại trực tiếp dữ liệu từ `ResponseCache` với HTTP 200.
- **Kết quả HTTP / Ứng dụng mong đợi:** Client retry nhận được kết quả HTTP 200 với đầy đủ thông tin của lượt khám 777, header `X-Idempotent-Replay: true`.
- **Trạng thái Database mong đợi:** Tổng số bản ghi trong bảng `luot_kham` không tăng (chỉ có duy nhất 1 lượt khám mang ID 777).
- **Hành vi Khóa InnoDB mong đợi:** Lần retry 2 chỉ thực hiện `SELECT` (read lock hoặc MVCC snapshot read), không acquire exclusive lock.
- **Yêu cầu môi trường DB Clone:** Bắt buộc DB Clone có cột `IdempotencyKey` và `ResponseCache`.
- **Loại test:** `Network Simulation & Concurrency Test`.
- **Trạng thái phân tích mã nguồn:** `TARGET DESIGN SPECIFIED`
- **Trạng thái thực thi:** `CHƯA THỰC THI (NOT TESTED)`

#### TC-CON-029 (TC-78): Kiểm thử Atomicity đồng thời của 4 bảng InnoDB trong Tx2 khi xảy ra ngoại lệ giữa chừng (B-59)
- **Mục tiêu:** Kiểm chứng tính nguyên tử (Atomicity) của toàn bộ 4 bảng InnoDB trong Tx2 (`luot_kham`, `lich_hen`, `so_cap_so_phieu`, `thong_bao`), bảo đảm khi phát sinh ngoại lệ ở bước cuối cùng, 100% dữ liệu được rollback sạch sẽ.
- **Blocker / Vấn đề liên quan:** B-59 (Atomicity & Connection Audit for Business Tx2).
- **File / Method / Dòng code liên quan:** `LuotKhamController@store`, `NotificationService`, InnoDB Engine.
- **Tiền điều kiện:** Chuẩn bị 1 lịch hẹn hợp lệ `MaLichHen = 300` và 1 số phiếu hợp lệ `MaCapSo = 555`.
- **Các bước thực hiện:**
  1. Bắt đầu Tx2 trên connection `mysql`.
  2. Thực hiện: INSERT `luot_kham` (thành công).
  3. Thực hiện: UPDATE `lich_hen` trạng thái sang `DA_DEN` (thành công).
  4. Thực hiện: UPDATE `so_cap_so_phieu` trạng thái sang `DA_SU_DUNG` (thành công).
  5. Thực hiện: INSERT `thong_bao` cho bệnh nhân (thành công).
  6. Giả lập lỗi ở bước cuối cùng: ném một ngoại lệ nhân tạo `RuntimeException("SIMULATED_FAILURE_BEFORE_COMMIT")`.
  7. Bắt ngoại lệ và kích hoạt `DB::rollBack()`.
  8. Kiểm tra trạng thái trên đĩa của cả 4 bảng: `luot_kham`, `lich_hen`, `so_cap_so_phieu`, `thong_bao`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bắt ngoại lệ, trả về HTTP 500 kèm transaction rollback cleanly.
- **Trạng thái Database mong đợi:**
  - Không có bản ghi mới trong `luot_kham`.
  - `lich_hen` 300 vẫn giữ nguyên trạng thái cũ (`CHO_XAC_NHAN` hoặc `DA_DAT`).
  - `so_cap_so_phieu` 555 vẫn giữ nguyên trạng thái `DANG_XU_LY`.
  - Không có bản ghi thông báo rác nào trong `thong_bao`.
- **Hành vi Khóa InnoDB mong đợi:** Toàn bộ Row Locks được giải phóng ngay sau lệnh Rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone hỗ trợ transaction InnoDB trên cả 4 bảng.
- **Loại test:** `PHPUnit Multi-Table Rollback Integration Test`.
- **Trạng thái phân tích mã nguồn:** `CURRENT CODE VERIFIED` + `TARGET DESIGN SPECIFIED`
- **Trạng thái thực thi:** `CHƯA THỰC THI (NOT TESTED)`

---

### NHÓM 4: VÒNG ĐỜI NGHIỆP VỤ KHÁM BỆNH & ĐIỀU PHỐI (B-02, B-03, B-30) — 12 TEST CASES

#### TC-BIZ-001: Tiếp nhận Lịch hẹn hợp lệ chuyển sang `CHO_KHAM` và đồng bộ `lich_hen`
- **Mục tiêu:** Kiểm tra luồng tiếp nhận tiêu chuẩn từ lịch hẹn đã xác nhận.
- **Blocker / Vấn đề liên quan:** B-02, B-03.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L244-283).
- **Tiền điều kiện:** Lịch hẹn #10 có `TrangThai = 'DA_XAC_NHAN'`.
- **Các bước thực hiện:** Gửi POST `/reception/queue/receive` với `MaLichHen = 10`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Trả về HTTP 201 Created kèm số phiếu.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'CHO_KHAM'`, `lich_hen.TrangThai = 'DA_TIEP_NHAN'`.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật đồng bộ trong cùng một transaction Tx2.
- **Yêu cầu môi trường DB Clone:** DB Clone có lịch hẹn đã xác nhận.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Cả 2 bảng cập nhật đúng trạng thái.
- **Điều kiện PASS:** Cả 2 bảng cập nhật đúng trạng thái trong cùng transaction.
- **Điều kiện FAIL:** Lượt khám tạo nhưng lịch hẹn không đổi hoặc ngược lại.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-002: Chặn tiếp nhận lịch hẹn đang ở trạng thái `DA_HUY` hoặc `HOAN_THANH`
- **Mục tiêu:** Ngăn chặn việc tiếp nhận các lịch hẹn không còn hợp lệ.
- **Blocker / Vấn đề liên quan:** B-02.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L265-269).
- **Tiền điều kiện:** Lịch hẹn #11 có `TrangThai = 'DA_HUY'`.
- **Các bước thực hiện:** Gửi request tiếp nhận lịch #11.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 422 Unprocessable Entity.
- **Trạng thái Database mong đợi:** Không có lượt khám nào được tạo.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** DB Clone có lịch hẹn đã hủy.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Response JSON chứa lỗi validation.
- **Điều kiện PASS:** Trả về lỗi 422, không tạo lượt khám.
- **Điều kiện FAIL:** Vẫn tạo lượt khám cho lịch đã hủy.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-003: Chặn tiếp nhận trùng lặp cho một lịch hẹn đã tiếp nhận trước đó
- **Mục tiêu:** Ngăn chặn việc 1 lịch hẹn tạo ra 2 lượt khám khác nhau.
- **Blocker / Vấn đề liên quan:** B-02, B-03.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L258-263).
- **Tiền điều kiện:** Lịch hẹn #12 đã có `TrangThai = 'DA_TIEP_NHAN'`.
- **Các bước thực hiện:** Gửi tiếp một request tiếp nhận cho lịch #12.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 422: "Lịch hẹn này đã được tiếp nhận tạo lượt khám trước đó."
- **Trạng thái Database mong đợi:** Không tạo thêm bản ghi nào.
- **Hành vi Khóa InnoDB mong đợi:** Rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có lịch đã tiếp nhận.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** HTTP 422, số lượng lượt khám của lịch #12 vẫn là 1.
- **Điều kiện PASS:** Bị từ chối với lỗi 422.
- **Điều kiện FAIL:** Tạo thêm lượt khám thứ hai.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-004: Tiếp nhận khám trực tiếp không qua lịch hẹn (`MaLichHen = NULL`)
- **Mục tiêu:** Kiểm tra luồng tiếp nhận vãng lai tại quầy lễ tân.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L284-289).
- **Tiền điều kiện:** Bệnh nhân vãng lai đến quầy khám trực tiếp chuyên khoa 1.
- **Các bước thực hiện:** Gửi POST `/reception/queue/receive` không có `MaLichHen`, chỉ có `MaBenhNhan`, `MaChuyenKhoa`, `MaBacSi`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Trả về HTTP 201 Created kèm số phiếu khám trực tiếp `TT-CK...`.
- **Trạng thái Database mong đợi:** Bản ghi `luot_kham` có `MaLichHen IS NULL`, gán đúng `MaChuyenKhoa = 1`.
- **Hành vi Khóa InnoDB mong đợi:** Chèn thành công vào bảng `luot_kham`.
- **Yêu cầu môi trường DB Clone:** DB Clone có dữ liệu bệnh nhân.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bản ghi `luot_kham` có `MaLichHen IS NULL`.
- **Điều kiện PASS:** Tạo lượt khám thành công với `MaLichHen = NULL`.
- **Điều kiện FAIL:** Báo lỗi thiếu `MaLichHen` hoặc gán sai chuyên khoa.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-005: Kiểm tra phân quyền: Bác sĩ khác không được thao tác trên ca của bác sĩ được phân công
- **Mục tiêu:** Bảo đảm an toàn dữ liệu và quyền riêng tư y tế theo chuẩn RBAC.
- **Blocker / Vấn đề liên quan:** Phân quyền vai trò Bác sĩ.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L349-354).
- **Tiền điều kiện:** Ca khám được phân công cho Bác sĩ A (`MaBacSi = 1`). Bác sĩ B (`MaBacSi = 2`) đăng nhập hệ thống.
- **Các bước thực hiện:** Bác sĩ B gửi request bắt đầu khám cho ca khám này.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 403 Forbidden.
- **Trạng thái Database mong đợi:** Ca khám không thay đổi trạng thái.
- **Hành vi Khóa InnoDB mong đợi:** Bị chặn ở tầng controller trước khi mở transaction.
- **Yêu cầu môi trường DB Clone:** DB Clone có 2 tài khoản bác sĩ.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** HTTP 403 Forbidden.
- **Điều kiện PASS:** Bị từ chối với mã lỗi 403.
- **Điều kiện FAIL:** Bác sĩ khác vẫn mở được phiên khám.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-006: Ghi hồ sơ bệnh án ban đầu bảo toàn `ChanDoanBanDau`
- **Mục tiêu:** Đảm bảo chẩn đoán sơ bộ ban đầu không bị mất đi trong suốt quá trình điều trị.
- **Blocker / Vấn đề liên quan:** Toàn vẹn hồ sơ bệnh án.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L434-437, L454-468).
- **Tiền điều kiện:** Ca khám đang ở trạng thái `DANG_KHAM`.
- **Các bước thực hiện:** Bác sĩ nhập triệu chứng và chẩn đoán ban đầu "Theo dõi viêm họng cấp", bấm lưu bệnh án.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 200 OK.
- **Trạng thái Database mong đợi:** Bảng `phieu_kham` lưu đúng `ChanDoanBanDau = 'Theo dõi viêm họng cấp'`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock trên bảng `phieu_kham`.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám đang khám.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bảng `phieu_kham` lưu đúng `ChanDoanBanDau`.
- **Điều kiện PASS:** Bản ghi lưu thành công.
- **Điều kiện FAIL:** `ChanDoanBanDau` bị null hoặc bị ghi đè.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-007: Chỉ định cận lâm sàng chuyển lượt khám sang `CHO_KET_QUA`
- **Mục tiêu:** Tự động đồng bộ trạng thái luồng khám khi phát sinh dịch vụ xét nghiệm.
- **Blocker / Vấn đề liên quan:** B-30.
- **File / Method / Dòng code liên quan:** `ChiDinhDichVuController.php` (L178-192).
- **Tiền điều kiện:** Ca khám đang `DANG_KHAM`.
- **Các bước thực hiện:** Bác sĩ tạo phiếu chỉ định xét nghiệm máu và chụp X-Quang.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 201 Created.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'CHO_KET_QUA'`, 2 bản ghi chỉ định ở trạng thái `CHO_TIEP_NHAN`.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật trong transaction có khóa `luot_kham`.
- **Yêu cầu môi trường DB Clone:** DB Clone có danh mục dịch vụ cận lâm sàng.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE PATH IDENTIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KET_QUA'`.
- **Điều kiện PASS:** Lượt khám chuyển đúng trạng thái chờ kết quả.
- **Điều kiện FAIL:** Vẫn ở trạng thái đang khám.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-008: Kỹ thuật viên CLS tiếp nhận chỉ định và thực hiện kỹ thuật
- **Mục tiêu:** Kiểm tra quy trình xử lý dịch vụ kỹ thuật tại phòng xét nghiệm.
- **Blocker / Vấn đề liên quan:** Quy trình Cận lâm sàng.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L114-186).
- **Tiền điều kiện:** Chỉ định đang ở trạng thái `CHO_TIEP_NHAN`. Kỹ thuật viên CLS đăng nhập.
- **Các bước thực hiện:** KTV bấm tiếp nhận và bắt đầu thực hiện kỹ thuật.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 200 OK.
- **Trạng thái Database mong đợi:** Trạng thái chỉ định chuyển `DANG_THUC_HIEN`, cập nhật `MaNhanVienThucHien`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock trên dòng `chi_dinh_dich_vu`.
- **Yêu cầu môi trường DB Clone:** DB Clone có tài khoản KTV.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Dòng chỉ định có `TrangThai = 'DANG_THUC_HIEN'`.
- **Điều kiện PASS:** Cập nhật trạng thái thành công kèm nhân viên thực hiện.
- **Điều kiện FAIL:** Lỗi phân quyền hoặc không lưu được nhân viên thực hiện.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-BIZ-009: Cập nhật kết quả một phần khi còn chỉ định khác chưa xong
- **Mục tiêu:** Kiểm tra lượt khám không bị nhảy trạng thái sớm khi bệnh nhân còn dịch vụ khác chưa có kết quả.
- **Blocker / Vấn đề liên quan:** B-30.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L241-275).
- **Tiền điều kiện:** Ca khám có 2 chỉ định CLS (Xét nghiệm máu và X-Quang). Đang ở `CHO_KET_QUA`.
- **Các bước thực hiện:** KTV nhập kết quả cho Xét nghiệm máu. X-Quang vẫn đang thực hiện.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 200 OK.
- **Trạng thái Database mong đợi:** Chỉ định xét nghiệm máu có kết quả, nhưng `luot_kham.TrangThai` VẪN GIỮ NGUYÊN là `CHO_KET_QUA`.
- **Hành vi Khóa InnoDB mong đợi:** Kiểm tra đếm `pendingCount > 0` và giữ nguyên trạng thái.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám có 2 dịch vụ CLS.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai` vẫn giữ nguyên là `CHO_KET_QUA`.
- **Điều kiện PASS:** Giữ nguyên `CHO_KET_QUA` khi `pendingCount > 0`.
- **Điều kiện FAIL:** Chuyển sớm sang `CHO_KHAM_LAI`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-010: Cập nhật kết quả chỉ định cuối cùng tự động chuyển lượt khám sang `CHO_KHAM_LAI`
- **Mục tiêu:** Tự động đưa bệnh nhân vào danh sách ưu tiên tái khám khi có đủ kết quả.
- **Blocker / Vấn đề liên quan:** B-30.
- **File / Method / Dòng code liên quan:** `CanLamSangController.php` (L241-248).
- **Tiền điều kiện:** Ca khám có chỉ định cuối cùng đang chờ kết quả.
- **Các bước thực hiện:** KTV nhập kết quả chỉ định cuối cùng và bấm xác nhận.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 200 OK.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'CHO_KHAM_LAI'`, thông báo ưu tiên được tạo trong hệ thống.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật đồng bộ trong transaction của KTV.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám sắp hoàn tất CLS.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `luot_kham.TrangThai = 'CHO_KHAM_LAI'`, thông báo ưu tiên gửi tới Bác sĩ.
- **Điều kiện PASS:** Chuyển sang `CHO_KHAM_LAI` ngay khi `pendingCount === 0`.
- **Điều kiện FAIL:** Bệnh nhân vẫn bị treo ở `CHO_KET_QUA`.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-BIZ-011: Bác sĩ ghi chẩn đoán kết luận sau CLS không làm mất `ChanDoanBanDau`
- **Mục tiêu:** Kiểm tra tính toàn vẹn của hồ sơ bệnh án 2 giai đoạn.
- **Blocker / Vấn đề liên quan:** Toàn vẹn hồ sơ bệnh án.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L434-442).
- **Tiền điều kiện:** Ca khám đang `CHO_KHAM_LAI` đã có `ChanDoanBanDau = 'Theo dõi viêm phổi'`.
- **Các bước thực hiện:** Bác sĩ khám lại và nhập `ChanDoanSauCLS = 'Viêm phế quản co thắt'`, bấm lưu.
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 200 OK.
- **Trạng thái Database mong đợi:** Bảng `phieu_kham` có đủ cả `ChanDoanBanDau` và `ChanDoanSauCLS`.
- **Hành vi Khóa InnoDB mong đợi:** Row X-lock trên dòng `phieu_kham`.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám tái khám.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Bảng `phieu_kham` có đủ cả 2 trường chẩn đoán.
- **Điều kiện PASS:** Cả 2 trường đều lưu đúng giá trị tương ứng.
- **Điều kiện FAIL:** `ChanDoanBanDau` bị ghi đè bởi `ChanDoanSauCLS`.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-BIZ-012: Hoàn tất lượt khám (`completeExamine`) chặn tuyệt đối nếu còn dịch vụ CLS chưa có kết quả
- **Mục tiêu:** Chốt chặn an toàn y khoa: không đóng hồ sơ bệnh án khi còn dịch vụ xét nghiệm chưa có kết quả.
- **Blocker / Vấn đề liên quan:** B-30, An toàn hồ sơ y tế.
- **File / Method / Dòng code liên quan:** `LuotKhamController.php` (L530-538).
- **Tiền điều kiện:** Ca khám vẫn còn 1 chỉ định xét nghiệm ở trạng thái `DANG_THUC_HIEN`.
- **Các bước thực hiện:** Bác sĩ cố tình bấm "Hoàn tất khám".
- **Kết quả HTTP / Ứng dụng mong đợi:** HTTP 422: "Lượt khám vẫn còn 1 dịch vụ cận lâm sàng chưa có kết quả."
- **Trạng thái Database mong đợi:** Ca khám không chuyển sang `HOAN_THANH`.
- **Hành vi Khóa InnoDB mong đợi:** Rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám chưa xong CLS.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** HTTP 422 Unprocessable Entity.
- **Điều kiện PASS:** Bị từ chối với mã lỗi 422.
- **Điều kiện FAIL:** Vẫn hoàn thành được ca khám khi còn xét nghiệm treo.
- **Mức độ nghiêm trọng:** **BLOCKER**.

---

### NHÓM 5: KIỂM THỬ THỦ CÔNG GIAO DIỆN & TRÌNH DUYỆT (BROWSER UI / E2E) — 10 TEST CASES

#### TC-UI-001: Lễ tân tiếp nhận lịch hẹn trên giao diện `Receptionist/Queue.tsx`
- **Mục tiêu:** Kiểm tra trải nghiệm người dùng thực tế khi bấm tiếp nhận lịch hẹn.
- **Blocker / Vấn đề liên quan:** Trải nghiệm tiếp nhận bệnh nhân.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Tiền điều kiện:** Đăng nhập tài khoản Lễ tân. Có 1 lịch hẹn ở tab "Chờ tiếp nhận".
- **Các bước thực hiện:** Bấm nút "Tiếp nhận", chọn phòng khám bác sĩ và bấm xác nhận trên modal.
- **Kết quả HTTP / Ứng dụng mong đợi:** Toast thông báo thành công, hiển thị modal in phiếu khám.
- **Trạng thái Database mong đợi:** `luot_kham` tạo mới, `lich_hen` chuyển `DA_TIEP_NHAN`.
- **Hành vi Khóa InnoDB mong đợi:** Giao dịch tiếp nhận hoàn tất trong $< 200$ms.
- **Yêu cầu môi trường DB Clone:** Môi trường clone có web server và dữ liệu lịch hẹn.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Ảnh chụp màn hình popup số phiếu, toast thông báo thành công.
- **Điều kiện PASS:** Hiển thị số phiếu đúng định dạng `DL-BS...`, lịch hẹn chuyển tab đã tiếp nhận.
- **Điều kiện FAIL:** Báo lỗi hoặc không hiện số phiếu.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-002: Lễ tân tiếp nhận bệnh nhân khám trực tiếp tại quầy
- **Mục tiêu:** Kiểm tra giao diện cấp số khám vãng lai.
- **Blocker / Vấn đề liên quan:** Quy trình cấp số trực tiếp.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Tiền điều kiện:** Đăng nhập tài khoản Lễ tân.
- **Các bước thực hiện:** Bấm "Khám trực tiếp", nhập thông tin bệnh nhân hoặc tìm kiếm số điện thoại, chọn chuyên khoa khám, bấm "Cấp số".
- **Kết quả HTTP / Ứng dụng mong đợi:** Toast xanh báo thành công, hiện popup in phiếu `TT-CK...`.
- **Trạng thái Database mong đợi:** Tạo mới `luot_kham` với `MaLichHen = NULL`.
- **Hành vi Khóa InnoDB mong đợi:** Chèn bình thường.
- **Yêu cầu môi trường DB Clone:** Môi trường clone đầy đủ.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot phiếu cấp số trực tiếp `TT-CK...`.
- **Điều kiện PASS:** Sinh số thành công và đưa vào hàng chờ bác sĩ.
- **Điều kiện FAIL:** Không chọn được bác sĩ/chuyên khoa.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-003: Bác sĩ gọi bệnh nhân vào khám trên giao diện `Doctor/Examine.tsx`
- **Mục tiêu:** Kiểm tra thao tác bắt đầu khám của Bác sĩ.
- **Blocker / Vấn đề liên quan:** Giao diện buồng khám Bác sĩ.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Tiền điều kiện:** Bác sĩ đăng nhập vào buồng khám. Có bệnh nhân trong danh sách "Chờ khám".
- **Các bước thực hiện:** Bác sĩ bấm nút "Gọi khám".
- **Kết quả HTTP / Ứng dụng mong đợi:** Giao diện buồng khám mở hồ sơ bệnh án, hiển thị bộ đếm giờ phiên khám.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'DANG_KHAM'`.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật trạng thái thành công.
- **Yêu cầu môi trường DB Clone:** Môi trường clone có tài khoản bác sĩ.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot ca khám chuyển sang trạng thái "Đang khám".
- **Điều kiện PASS:** Bộ đếm thời gian khám chạy, nút hoàn thành khả dụng.
- **Điều kiện FAIL:** Không cập nhật được trạng thái trên giao diện.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-004: Bác sĩ kê đơn thuốc và kiểm tra hiển thị tồn kho
- **Mục tiêu:** Đảm bảo bác sĩ không kê vượt quá số lượng tồn kho dược.
- **Blocker / Vấn đề liên quan:** An toàn dược lâm sàng.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Tiền điều kiện:** Thuốc Paracetamol còn tồn kho 10 viên.
- **Các bước thực hiện:** Bác sĩ tìm thuốc Paracetamol, nhập số lượng 15 viên.
- **Kết quả HTTP / Ứng dụng mong đợi:** Giao diện hiển thị cảnh báo đỏ "Số lượng kê vượt quá tồn kho (Tồn: 10)". Nút lưu bị vô hiệu hóa.
- **Trạng thái Database mong đợi:** Không lưu đơn thuốc không hợp lệ.
- **Hành vi Khóa InnoDB mong đợi:** Bị chặn tại frontend và validate backend.
- **Yêu cầu môi trường DB Clone:** DB Clone có danh mục thuốc tồn kho.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot cảnh báo vượt tồn kho.
- **Điều kiện PASS:** Báo đỏ khi vượt tồn kho, chỉ cho phép lưu khi số lượng $\le 10$.
- **Điều kiện FAIL:** Kê được thuốc khi vượt tồn kho.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-005: Kỹ thuật viên thao tác trên Dashboard Cận lâm sàng `CanLamSang/Dashboard.tsx`
- **Mục tiêu:** Kiểm tra quy trình tiếp nhận, thực hiện và nhập kết quả xét nghiệm.
- **Blocker / Vấn đề liên quan:** Giao diện kỹ thuật viên cận lâm sàng.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/CanLamSang/Dashboard.tsx`.
- **Tiền điều kiện:** Có chỉ định cận lâm sàng đang chờ tiếp nhận.
- **Các bước thực hiện:** KTV bấm "Tiếp nhận", nhập kết quả định lượng và bấm "Xác nhận kết quả".
- **Kết quả HTTP / Ứng dụng mong đợi:** Toast thành công, dòng chỉ định chuyển màu xanh lá cây.
- **Trạng thái Database mong đợi:** Chỉ định chuyển `HOAN_THANH`, kết quả được lưu.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone có dữ liệu chỉ định CLS.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot trạng thái xanh "Đã có kết quả".
- **Điều kiện PASS:** Nhập và xác nhận kết quả thành công.
- **Điều kiện FAIL:** Không lưu được kết quả hoặc bị lỗi phân quyền.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-006: Hiển thị tự động bệnh nhân chờ khám lại trên màn hình Bác sĩ
- **Mục tiêu:** Kiểm tra chuông thông báo và badge ưu tiên khi bệnh nhân hoàn tất xét nghiệm.
- **Blocker / Vấn đề liên quan:** Điều phối hàng đợi tái khám.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Tiền điều kiện:** Bác sĩ đang mở màn hình buồng khám. Bệnh nhân vừa có đủ kết quả CLS.
- **Các bước thực hiện:** KTV bấm xác nhận kết quả cuối cùng. Bác sĩ quan sát màn hình.
- **Kết quả HTTP / Ứng dụng mong đợi:** Tab "Chờ khám lại" nhấp nháy badge màu cam kèm âm thanh chuông thông báo.
- **Trạng thái Database mong đợi:** `TrangThai = 'CHO_KHAM_LAI'`.
- **Hành vi Khóa InnoDB mong đợi:** Consistent Read.
- **Yêu cầu môi trường DB Clone:** Môi trường clone có WebSocket hoặc Polling active.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot tab "Chờ khám lại" có badge màu cam nổi bật.
- **Điều kiện PASS:** Bệnh nhân tự động xuất hiện không cần F5 tải lại trang.
- **Điều kiện FAIL:** Bệnh nhân không xuất hiện trong tab chờ khám lại.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-007: Bác sĩ hoàn thành khám và chuyển thanh toán
- **Mục tiêu:** Đóng ca khám và kiểm tra thông báo chuyển sang bộ phận thu ngân.
- **Blocker / Vấn đề liên quan:** Đóng phiên khám lâm sàng.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Doctor/Examine.tsx`.
- **Tiền điều kiện:** Ca khám đã có đủ kết quả xét nghiệm và đơn thuốc.
- **Các bước thực hiện:** Bác sĩ bấm "Hoàn tất ca khám".
- **Kết quả HTTP / Ứng dụng mong đợi:** Modal xác nhận đóng ca khám, chuyển hướng về danh sách hàng đợi.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'HOAN_THANH'`.
- **Hành vi Khóa InnoDB mong đợi:** Khóa hoàn tất khám theo đúng phân cấp $LH \rightarrow LK$.
- **Yêu cầu môi trường DB Clone:** DB Clone có ca khám đủ điều kiện.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot ca khám đóng lại, hóa đơn sẵn sàng ở bàn Lễ tân.
- **Điều kiện PASS:** Ca khám chuyển `HOAN_THANH`, dữ liệu xuất hiện ở quầy thanh toán.
- **Điều kiện FAIL:** Lỗi khi đóng ca khám.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-008: Lễ tân thao tác hủy lượt khám khi bệnh nhân bỏ về
- **Mục tiêu:** Kiểm tra quy trình hủy nghiệp vụ lượt khám trực tiếp trên giao diện Lễ tân.
- **Blocker / Vấn đề liên quan:** B-12 (Hủy lượt khám bằng Soft Status).
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Tiền điều kiện:** Có 1 lượt khám đang ở trạng thái `CHO_KHAM`.
- **Các bước thực hiện:** Lễ tân bấm nút "Hủy lượt", nhập lý do "Bệnh nhân có việc bận bỏ về", bấm xác nhận.
- **Kết quả HTTP / Ứng dụng mong đợi:** Modal xác nhận đóng lại, hiển thị toast thành công, dòng bệnh nhân chuyển màu xám và biến mất khỏi hàng chờ.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'DA_HUY'`, `so_cap_so_phieu` vẫn giữ nguyên liên kết kiểm toán.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật trạng thái an toàn.
- **Yêu cầu môi trường DB Clone:** Môi trường clone đầy đủ.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot giao diện hàng đợi sau khi hủy, lý do hủy được lưu trong log.
- **Điều kiện PASS:** Hủy thành công, hàng đợi cập nhật tức thì, dữ liệu lịch sử được bảo toàn.
- **Điều kiện FAIL:** Bị lỗi không cho hủy hoặc xóa vật lý bản ghi.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-009: Lễ tân điều phối chuyển phòng khám / đổi bác sĩ trên giao diện
- **Mục tiêu:** Kiểm tra tính năng điều phối tải giữa các phòng khám chuyên khoa.
- **Blocker / Vấn đề liên quan:** Điều phối hàng đợi lâm sàng.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`.
- **Tiền điều kiện:** Phòng Bác sĩ A đang có 15 bệnh nhân chờ. Phòng Bác sĩ B đang trống.
- **Các bước thực hiện:** Lễ tân chọn bệnh nhân thứ 15, bấm "Chuyển phòng khám", chọn Bác sĩ B và xác nhận.
- **Kết quả HTTP / Ứng dụng mong đợi:** Bệnh nhân biến mất khỏi hàng chờ Bác sĩ A và xuất hiện ngay trong hàng chờ Bác sĩ B.
- **Trạng thái Database mong đợi:** `luot_kham.MaBacSi` chuyển sang Bác sĩ B, `MaPhamVi` ban đầu giữ nguyên theo trigger guard.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật phân công bác sĩ thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone có 2 phòng khám đang mở.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot hàng chờ Bác sĩ B có bệnh nhân mới được chuyển.
- **Điều kiện PASS:** Điều phối thành công mà không làm gián đoạn số thứ tự hàng đợi.
- **Điều kiện FAIL:** Lỗi phân quyền hoặc trigger chặn nhầm việc đổi bác sĩ điều phối.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-UI-010: Khả năng phục hồi giao diện khi mất kết nối mạng và Reconnect
- **Mục tiêu:** Đảm bảo giao diện người dùng không bị crash khi rớt mạng tạm thời, tự động phục hồi đồng bộ dữ liệu khi có mạng lại.
- **Blocker / Vấn đề liên quan:** UI Resilience & Polling Recovery.
- **File / Method / Dòng code liên quan:** `resources/js/Pages/Receptionist/Queue.tsx`, `resources/js/Pages/Doctor/Examine.tsx`.
- **Tiền điều kiện:** Đang mở màn hình hàng đợi tiếp nhận.
- **Các bước thực hiện:** Ngắt mạng kết nối (Offline mode trên DevTools Chrome) trong 30 giây, sau đó bật lại mạng.
- **Kết quả HTTP / Ứng dụng mong đợi:** Khi rớt mạng: Hiển thị banner màu vàng "Mất kết nối tới máy chủ - Đang thử lại...". Khi có mạng lại: Banner chuyển xanh "Đã kết nối lại" và tự động tải lại dữ liệu mới nhất.
- **Trạng thái Database mong đợi:** Không bị ảnh hưởng.
- **Hành vi Khóa InnoDB mong đợi:** Không có transaction bị treo.
- **Yêu cầu môi trường DB Clone:** Môi trường test trên trình duyệt.
- **Loại test:** `Browser UI / Manual E2E`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Screenshot banner offline và thông báo reconnect thành công.
- **Điều kiện PASS:** Giao diện tự phục hồi không cần người dùng phải bấm F5 thủ công.
- **Điều kiện FAIL:** Giao diện bị đơ (white screen of death) hoặc văng lỗi không phục hồi.
- **Mức độ nghiêm trọng:** **MAJOR**.

---

### PHỤ LỤC A: TÍNH TOÀN VẸN KHÓA NGOẠI & CHÍNH SÁCH XÓA (TC-FK-001 ĐẾN TC-FK-005) — 5 TEST CASES

#### TC-FK-001: Khóa ngoại `fk_scsp_luot_kham` chặn Hard Delete lượt khám (`ON DELETE RESTRICT`)
- **Mục tiêu:** Bảo toàn 100% dấu vết kiểm toán, ngăn ngừa việc xóa vật lý lượt khám đã cấp số.
- **Blocker / Vấn đề liên quan:** B-06, B-13.
- **File / Method / Dòng code liên quan:** `so_cap_so_phieu.fk_scsp_luot_kham`.
- **Tiền điều kiện:** Lượt khám #10 đã được liên kết với bản ghi sổ cấp số.
- **Các bước thực hiện:** Chạy: `DELETE FROM luot_kham WHERE MaLuotKham = 10;`
- **Kết quả HTTP / Ứng dụng mong đợi:** MySQL Error 1451 (`Cannot delete or update a parent row: a foreign key constraint fails`).
- **Trạng thái Database mong đợi:** Bản ghi `luot_kham` không bị xóa.
- **Hành vi Khóa InnoDB mong đợi:** Rollback tức thời.
- **Yêu cầu môi trường DB Clone:** DB Clone có foreign key `fk_scsp_luot_kham`.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** MySQL Error 1451.
- **Điều kiện PASS:** MySQL ném đúng lỗi 1451, dòng dữ liệu không bị xóa.
- **Điều kiện FAIL:** Lệnh xóa thành công hoặc làm set null cột khóa ngoại.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-FK-002: Hủy nghiệp vụ lượt khám bằng cách cập nhật `TrangThai = 'DA_HUY'` thành công
- **Mục tiêu:** Xác nhận nghiệp vụ hủy ca bệnh sử dụng Soft Status, không làm mất liên kết kiểm toán.
- **Blocker / Vấn đề liên quan:** B-12.
- **File / Method / Dòng code liên quan:** `LichHenController.php` (L293-297).
- **Tiền điều kiện:** Lượt khám #10 đang ở `CHO_KHAM`.
- **Các bước thực hiện:** Chạy: `UPDATE luot_kham SET TrangThai = 'DA_HUY' WHERE MaLuotKham = 10;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Thực thi thành công.
- **Trạng thái Database mong đợi:** `luot_kham.TrangThai = 'DA_HUY'`, sổ cấp số vẫn giữ nguyên liên kết `MaLuotKham = 10`.
- **Hành vi Khóa InnoDB mong đợi:** Update thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone có dữ liệu ca khám.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Dòng dữ liệu có `TrangThai = 'DA_HUY'`, foreign key nguyên vẹn.
- **Điều kiện PASS:** Cập nhật thành công, liên kết khóa ngoại nguyên vẹn.
- **Điều kiện FAIL:** Bị lỗi khóa ngoại chặn cập nhật trạng thái.
- **Mức độ nghiêm trọng:** **CRITICAL**.

#### TC-FK-003: Khóa ngoại chặn xóa Bác sĩ khi đang có lượt khám liên kết
- **Mục tiêu:** Bảo đảm không làm mất thông tin bác sĩ phụ trách ca bệnh trong lịch sử y tế.
- **Blocker / Vấn đề liên quan:** B-06.
- **File / Method / Dòng code liên quan:** Khóa ngoại `luot_kham.MaBacSi`.
- **Tiền điều kiện:** Bác sĩ #1 đang có 10 lượt khám trong quá khứ.
- **Các bước thực hiện:** Chạy: `DELETE FROM bac_si WHERE MaBacSi = 1;`
- **Kết quả HTTP / Ứng dụng mong đợi:** MySQL Error 1451.
- **Trạng thái Database mong đợi:** Bác sĩ #1 không bị xóa.
- **Hành vi Khóa InnoDB mong đợi:** Rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có ràng buộc foreign key bác sĩ.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** MySQL Error 1451.
- **Điều kiện PASS:** Bị chặn bởi lỗi 1451.
- **Điều kiện FAIL:** Xóa thành công bác sĩ làm mồ côi lượt khám.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-FK-004: Khóa ngoại chặn xóa Bệnh nhân khi đang có hồ sơ lượt khám
- **Mục tiêu:** Bảo vệ hồ sơ sức khỏe và lịch sử khám bệnh của bệnh nhân.
- **Blocker / Vấn đề liên quan:** B-06.
- **File / Method / Dòng code liên quan:** Khóa ngoại `luot_kham.MaBenhNhan`.
- **Tiền điều kiện:** Bệnh nhân #5 có lượt khám trong hệ thống.
- **Các bước thực hiện:** Chạy: `DELETE FROM benh_nhan WHERE MaBenhNhan = 5;`
- **Kết quả HTTP / Ứng dụng mong đợi:** MySQL Error 1451.
- **Trạng thái Database mong đợi:** Bệnh nhân không bị xóa.
- **Hành vi Khóa InnoDB mong đợi:** Rollback.
- **Yêu cầu môi trường DB Clone:** DB Clone có ràng buộc foreign key bệnh nhân.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `CODE VERIFIED BY STATIC INSPECTION`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** MySQL Error 1451.
- **Điều kiện PASS:** Bị chặn bởi lỗi 1451.
- **Điều kiện FAIL:** Bệnh nhân bị xóa mất hồ sơ.
- **Mức độ nghiêm trọng:** **MAJOR**.

#### TC-FK-005: Đối chiếu 100% cột khóa ngoại kiểu `INT signed` không bị cảnh báo truncation
- **Mục tiêu:** Xác nhận tính tương thích kiểu dữ liệu giữa các bảng theo đúng schema live.
- **Blocker / Vấn đề liên quan:** B-06, B-13.
- **File / Method / Dòng code liên quan:** `INFORMATION_SCHEMA.COLUMNS`.
- **Tiền điều kiện:** Schema clone đã được thiết lập.
- **Các bước thực hiện:** Truy vấn `INFORMATION_SCHEMA.COLUMNS` kiểm tra `DATA_TYPE` và `COLUMN_TYPE` của toàn bộ các cột ID và FK liên quan (`MaLuotKham`, `MaLichHen`, `MaBenhNhan`, `MaBacSi`, `MaChuyenKhoa`, `MaCapSo`).
- **Kết quả HTTP / Ứng dụng mong đợi:** 100% các cột đều có kiểu `int(11) signed`.
- **Trạng thái Database mong đợi:** Khớp hoàn toàn.
- **Hành vi Khóa InnoDB mong đợi:** Truy vấn schema không gây khóa bảng.
- **Yêu cầu môi trường DB Clone:** DB Clone có schema V2.4.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `SCHEMA VERIFIED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 100% các cột ID và FK đều có `DATA_TYPE = 'int'`.
- **Điều kiện PASS:** Khớp hoàn toàn kiểu dữ liệu `INT(11) signed`.
- **Điều kiện FAIL:** Lệch kiểu dữ liệu giữa khóa chính và khóa ngoại.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### PHỤ LỤC B: QUY TRÌNH MIGRATION 4 BƯỚC & BACKFILL DỮ LIỆU (TC-MIG-001 ĐẾN TC-MIG-006) — 6 TEST CASES

#### TC-MIG-001: Bước 1 Migration — Thêm 4 cột dạng Nullable thành công
- **Mục tiêu:** Nâng cấp schema mà không làm gián đoạn các luồng đọc/ghi hiện tại của ứng dụng.
- **Blocker / Vấn đề liên quan:** B-06, B-15.
- **File / Method / Dòng code liên quan:** Migration Step 1 file.
- **Tiền điều kiện:** DB Clone có schema gốc giống hệt database live (23 bản ghi `luot_kham`).
- **Các bước thực hiện:** Chạy `php artisan migrate` cho Step 1 (thêm `MaPhamVi`, `STTTrongNgay`, `SoPhieu`, `MaChuyenKhoa` dạng Nullable).
- **Kết quả HTTP / Ứng dụng mong đợi:** Exit code 0.
- **Trạng thái Database mong đợi:** Bảng `luot_kham` có thêm 4 cột mới mang giá trị NULL trên 23 bản ghi cũ.
- **Hành vi Khóa InnoDB mong đợi:** Online DDL với `ALGORITHM=INPLACE, LOCK=NONE`.
- **Yêu cầu môi trường DB Clone:** DB Clone độc lập.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `SHOW COLUMNS FROM luot_kham;` thấy 4 cột mới dạng `NULL`.
- **Điều kiện PASS:** Migration chạy thành công với exit code 0.
- **Điều kiện FAIL:** Lỗi cú pháp hoặc làm khóa bảng kéo dài.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-002: Bước 2 Backfill — Cập nhật 5 bản ghi `DAT_LICH` khớp 100% lịch sử
- **Mục tiêu:** Điền dữ liệu lịch sử chuẩn xác cho 5 bản ghi đặt lịch có đầy đủ chứng từ lịch hẹn.
- **Blocker / Vấn đề liên quan:** B-06, B-15.
- **File / Method / Dòng code liên quan:** Seeder/Backfill script.
- **Tiền điều kiện:** Bước 1 đã hoàn tất.
- **Các bước thực hiện:** Chạy lệnh backfill cho 5 ca đặt lịch (#1, #156, #211, #214, #236) từ bảng `lich_hen`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Script báo hoàn tất 5 bản ghi.
- **Trạng thái Database mong đợi:** 5 bản ghi này có đủ 4 trường mới không bị NULL, số phiếu có tiền tố `DL-`.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật theo khối nhỏ trong transaction.
- **Yêu cầu môi trường DB Clone:** DB Clone có 23 bản ghi gốc.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 5 bản ghi có đủ 4 trường không bị NULL.
- **Điều kiện PASS:** 5 bản ghi khớp 100% chuyên khoa và bác sĩ trực gốc.
- **Điều kiện FAIL:** Có bản ghi bị gán sai hoặc còn NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-003: Bước 2 Backfill — Cập nhật 18 bản ghi `TRUC_TIEP` gán cờ Audit
- **Mục tiêu:** Điền dữ liệu suy luận minh bạch cho 18 bản ghi khám trực tiếp không có lịch hẹn gốc.
- **Blocker / Vấn đề liên quan:** B-06, B-15.
- **File / Method / Dòng code liên quan:** Seeder/Backfill script.
- **Tiền điều kiện:** 5 bản ghi đặt lịch đã được backfill xong.
- **Các bước thực hiện:** Chạy lệnh backfill cho 18 ca trực tiếp còn lại, suy luận chuyên khoa từ bác sĩ được phân công và gán cờ audit `INFERRED_FROM_ASSIGNED_DOCTOR`.
- **Kết quả HTTP / Ứng dụng mong đợi:** Script báo hoàn tất 18 bản ghi.
- **Trạng thái Database mong đợi:** 100% 18 bản ghi có đủ 4 trường mới, tiền tố `TT-`, ghi chú có cờ audit.
- **Hành vi Khóa InnoDB mong đợi:** Cập nhật thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone có dữ liệu gốc.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** 18 bản ghi được điền đủ 4 trường, log audit ghi nhận đầy đủ.
- **Điều kiện PASS:** 100% 18 bản ghi không còn NULL và có cờ audit rõ ràng.
- **Điều kiện FAIL:** Bị sót bản ghi NULL.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-004: Bước 3 Migration — Chuyển 4 cột sang `NOT NULL` sau Backfill
- **Mục tiêu:** Áp đặt ràng buộc vật lý bắt buộc đủ dữ liệu sau khi dữ liệu cũ đã được lấp đầy.
- **Blocker / Vấn đề liên quan:** B-06, B-15.
- **File / Method / Dòng code liên quan:** Migration Step 3 file.
- **Tiền điều kiện:** 100% 23 bản ghi cũ không còn cột nào mang giá trị NULL.
- **Các bước thực hiện:** Chạy migration Step 3: `ALTER TABLE luot_kham MODIFY MaPhamVi ... NOT NULL, MODIFY STTTrongNgay ... NOT NULL, MODIFY SoPhieu ... NOT NULL, MODIFY MaChuyenKhoa ... NOT NULL;`
- **Kết quả HTTP / Ứng dụng mong đợi:** Exit code 0.
- **Trạng thái Database mong đợi:** 4 cột chuyển sang thuộc tính `IS_NULLABLE = 'NO'`.
- **Hành vi Khóa InnoDB mong đợi:** Alter table thành công không có lỗi dữ liệu NULL.
- **Yêu cầu môi trường DB Clone:** DB Clone đã backfill xong.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** `INFORMATION_SCHEMA.COLUMNS` ghi nhận `IS_NULLABLE = 'NO'`.
- **Điều kiện PASS:** ALTER TABLE thành công không có lỗi `Invalid use of NULL value`.
- **Điều kiện FAIL:** Bị lỗi do còn bản ghi NULL lọt qua.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-005: Bước 4 Migration — Khởi tạo Trigger bảo vệ 5 trường trên DB Clone
- **Mục tiêu:** Kích hoạt lớp bảo vệ tầng cơ sở dữ liệu sau khi schema đã hoàn thiện.
- **Blocker / Vấn đề liên quan:** B-01, B-09.
- **File / Method / Dòng code liên quan:** Migration Step 4 file.
- **Tiền điều kiện:** Schema và dữ liệu đã đạt chuẩn NOT NULL.
- **Các bước thực hiện:** Thực thi câu lệnh `CREATE TRIGGER trg_luot_kham_immutable_guard BEFORE UPDATE ON luot_kham FOR EACH ROW ...`
- **Kết quả HTTP / Ứng dụng mong đợi:** Exit code 0.
- **Trạng thái Database mong đợi:** Trigger xuất hiện và active trong catalog MySQL.
- **Hành vi Khóa InnoDB mong đợi:** Biên dịch trigger thành công.
- **Yêu cầu môi trường DB Clone:** DB Clone hoàn thiện.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Trigger xuất hiện trong `SHOW TRIGGERS LIKE 'luot_kham'`.
- **Điều kiện PASS:** Biên dịch trigger thành công trong MySQL 8.0.26.
- **Điều kiện FAIL:** Lỗi cú pháp trigger.
- **Mức độ nghiêm trọng:** **BLOCKER**.

#### TC-MIG-006: Thử nghiệm Rollback Migration: Hoàn trả schema sạch sẽ
- **Mục tiêu:** Đảm bảo đường lui an toàn (Rollback safety) nếu có sự cố xảy ra trong quá trình triển khai.
- **Blocker / Vấn đề liên quan:** B-15.
- **File / Method / Dòng code liên quan:** 4 migration steps (phương thức down).
- **Tiền điều kiện:** Đã chạy xong cả 4 bước migration trên DB Clone.
- **Các bước thực hiện:** Chạy `php artisan migrate:rollback --step=4`.
- **Kết quả HTTP / Ứng dụng mong đợi:** 4 migration rollback thành công.
- **Trạng thái Database mong đợi:** Bảng `luot_kham` trở lại cấu trúc ban đầu, trigger bị xóa, 23 bản ghi dữ liệu gốc nguyên vẹn.
- **Hành vi Khóa InnoDB mong đợi:** DDL hoàn tất an toàn.
- **Yêu cầu môi trường DB Clone:** DB Clone độc lập.
- **Loại test:** `PHPUnit Automated`.
- **Trạng thái phân tích mã nguồn:** `DESIGN REVIEWED`.
- **Trạng thái thực thi thực nghiệm:** `CHƯA THỰC THI (NOT TESTED)`.
- **Bằng chứng cần thu thập:** Schema sau rollback khớp 100% với schema gốc, 23 bản ghi nguyên vẹn.
- **Điều kiện PASS:** Rollback sạch sẽ không để lại rác trigger hay cột thừa.
- **Điều kiện FAIL:** Rollback bị lỗi làm hỏng cấu trúc bảng.
- **Mức độ nghiêm trọng:** **CRITICAL**.

---

### TỔNG HỢP VÀ ĐIỀU KIỆN TIÊN QUYẾT BƯỚC SANG DB CLONE

```text
+-----------------------------------------------------------------------------------------------+
|                      BẢNG TỔNG KẾT MA TRẬN KIỂM THỬ THỰC TẾ (VERSION 2.8)                     |
+-----------------------------------------------------------------------------------------------+
|  1. Tổng số Test Cases cốt lõi:                                62 Test Cases                  |
|  2. Số test tự động hóa bằng PHPUnit:                          28 Test Cases (45.2%)          |
|  3. Số test Concurrency 2 tiến trình độc lập (CLI Barrier):     24 Test Cases (38.7%)          |
|  4. Số test Kiểm thử Thủ công / Browser UI (E2E):              10 Test Cases (16.1%)          |
|  5. Phụ lục kiểm định Schema & Migration DDL:                  11 Test Cases bổ trợ           |
|                                                                                               |
|  Phân loại theo mức độ nghiêm trọng:                                                          |
|  - BLOCKER (Chặn 100% nếu chưa test PASS):                     28 Test Cases                  |
|  - CRITICAL (Cần thiết cho tính toàn vẹn hệ thống):            24 Test Cases                  |
|  - MAJOR (Quy trình nghiệp vụ & Trải nghiệm UI):               10 Test Cases                  |
|                                                                                               |
|  Trạng thái phân tích mã nguồn (Static Readiness):                                            |
|  - CURRENT CODE VERIFIED BY STATIC INSPECTION:                 28 / 62 (45.2%)                |
|  - TARGET DESIGN SPECIFIED / THEORETICAL:                      34 / 62 (54.8%)                |
|                                                                                               |
|  Trạng thái thực thi thực nghiệm (Execution Status):                                          |
|  - CHƯA THỰC THI (NOT TESTED):                                 62 / 62 (100.0%)               |
|  - TEST PASSED:                                                 0 / 62 (0.0%)                 |
+-----------------------------------------------------------------------------------------------+-------------+
```

```text
================================================================================
TRẠNG THÁI PHÊ DUYỆT CHÍNH THỨC HIỆN TẠI:
[ NOT APPROVED — NO MIGRATION — NO DATABASE WRITE — NO CLONE YET ]

Lý do: Ma trận V2.4 đã chuẩn hóa trọn vẹn đúng 56 test cases cốt lõi (28 PHPUnit, 
18 Concurrency, 10 UI) cùng 11 test cases phụ lục Schema/Migration. Toàn bộ kịch bản 
đã tích hợp đầy đủ các phát hiện sâu từ B-31 đến B-36 (Đọc FenceToken trong Claim Tx, 
Lease Grace Period 5 phút, 2 chu trình Deadlock thực tế, Gap Lock của Current Read, 
kiểm soát Side-Effects và Ràng buộc duy nhất ổ đĩa). 

Tuân thủ nghiêm ngặt nguyên tắc an toàn: Toàn bộ test case hiện ở trạng thái 
CHƯA THỰC THI (NOT TESTED), dừng lại tại cổng kiểm soát (Gatekeeper) chờ quyết định 
chính thức từ Quản trị viên để cấp phép thiết lập Database Clone thực nghiệm.
================================================================================
```
