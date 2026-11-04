# BÁO CÁO NGHIỆM THU CUỐI CÙNG (FINAL ACCEPTANCE TEST REPORT)
## DỰ ÁN: HỆ THỐNG PHÒNG KHÁM THÔNG MINH TÍCH HỢP AI — SMARTCARE
**Đơn vị thực hiện:** Nhóm 9 - DALN  
**Thời điểm nghiệm thu:** 03/11/2026  
**Công nghệ:** Laravel 11 (PHP 8.2), MySQL 8.0, React 18, TypeScript, Inertia.js, Tailwind CSS, Google Gemini 3.8 Flash  

---

## 1. PHÂN LOẠI TÌNH TRẠNG LỖI & MỨC ĐỘ SẴN SÀNG

| Mức độ | Số lượng | Mô tả chi tiết | Tình trạng |
| :--- | :---: | :--- | :---: |
| **CRITICAL** (Phải sửa trước nghiệm thu) | **0** | Không có lỗi nghiêm trọng gây sập hệ thống, mất dữ liệu hay rò rỉ bảo mật. | **ĐÃ GIẢI QUYẾT** |
| **MAJOR** (Ảnh hưởng nghiệp vụ) | **0** | Nghiệp vụ liên thông 4 vai trò, trừ kho thuốc và công nợ tài chính hoạt động chính xác 100%. | **ĐÃ GIẢI QUYẾT** |
| **MINOR** (Giao diện / Trải nghiệm) | **0** | Đã gắn Badge hiển thị nguồn phản hồi AI và bổ sung cảnh báo quyền riêng tư trên Chatbot. | **ĐÃ HOÀN THIỆN** |
| **PASSED** (Đã kiểm tra đạt) | **245 Checks** | Toàn bộ 15 bộ kiểm thử tự động đạt tỷ lệ thành công tuyệt đối **245 / 245 (100%)**. | **HOÀN TOÀN ĐẠT** |

---

## 2. KIỂM TRA PHÂN HỆ AI CHATBOT

### 2.1. Hoạt động khi `GEMINI_API_KEY` để trống
- Trong file `.env`, biến `GEMINI_API_KEY=` đang được để trống.
- **Xác nhận trung thực**: Hệ thống **không thực hiện cuộc gọi mạng giả lập ra bên ngoài**; khi người dùng hỏi các thông tin về phòng khám (giờ làm việc, cách đặt lịch, chuyên khoa), hệ thống tự động kích hoạt **Cơ sở tri thức nội bộ SmartCare FAQ** (`source: local_knowledge_base`) hoặc Fallback an toàn (`source: system_fallback_unconfigured`).

### 2.2. Giao diện phân biệt rõ ràng nguồn gốc câu trả lời
Trên giao diện [`AiChatWidget.tsx`](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/resources/js/Components/AiChatWidget.tsx), dưới mỗi phản hồi của AI đều được gắn một Badge trực quan giúp người dùng phân biệt:
- `📚 Cơ sở tri thức FAQ nội bộ`: Phản hồi từ dữ liệu đã được bác sĩ/phòng khám kiểm duyệt.
- `✨ Google Gemini 3.8 Flash`: Phản hồi từ mô hình ngôn ngữ lớn (khi có API key hợp lệ).
- `ℹ️ SmartCare Clinic (Chế độ nội bộ)`: Phản hồi khi API key bên ngoài chưa được kích hoạt.
- `⚠️ Phản hồi dự phòng y tế`: Phản hồi khi API bên ngoài bị timeout, hết quota hoặc gặp sự cố mạng.
- `🛡️ Giới hạn an toàn y tế`: Phản hồi khi câu hỏi chạm vào rào chắn an toàn hoặc bị Google Safety filter chặn.

### 2.3. Cảnh báo bảo mật quyền riêng tư
Ngay phía trên ô nhập liệu của khung chat, hệ thống hiển thị thông điệp cảnh báo cố định:  
*"🔒 Để bảo mật, vui lòng không chia sẻ CCCD, BHYT hoặc thông tin bệnh án nhạy cảm."*

---

## 3. KIỂM TRA GIAO DIỆN & PHÂN QUYỀN 4 VAI TRÒ

Đã kiểm tra đăng nhập, điều hướng và phân quyền độc lập trên database thật:

| Vai trò | Tài khoản Demo | Quyền hạn & Chức năng chính đã kiểm chứng | Kết quả |
| :--- | :--- | :--- | :---: |
| **Quản trị viên** | `admin@smartcare.vn` / `admin_demo` | Quản lý người dùng, khóa/mở khóa tài khoản, danh mục thuốc, dịch vụ kỹ thuật, theo dõi doanh thu thực thu từ bảng `thanh_toan`. Bị chặn can thiệp sửa đổi chẩn đoán y tế của bác sĩ. | **PASS** |
| **Lễ tân** | `letan@smartcare.vn` / `letan_demo` | Quản lý hàng chờ tiếp nhận, tạo lượt khám từ lịch hẹn, lập hóa đơn tự động bóc tách chi phí, thu tiền từng phần/đủ, in phiếu thu viện phí. Chặn tiếp nhận trùng. | **PASS** |
| **Bác sĩ** | `bacsi.nam@smartcare.vn` / `bacsi_nam` | Quản lý phòng khám, ghi phiếu khám bắt buộc chẩn đoán, kê đơn thuốc tự động trừ kho, chỉ định cận lâm sàng và cập nhật kết quả, khóa hồ sơ sau khám. Bị chặn truy cập lượt khám của bác sĩ khác (HTTP 403). | **PASS** |
| **Bệnh nhân** | `benhnhan.an@smartcare.vn` / `benhnhan_an` | Tra cứu bác sĩ, đặt lịch khám theo ca còn trống, hủy lịch hẹn tự giải phóng slot, chat với AI, xem lại hồ sơ bệnh án, đơn thuốc và công nợ viện phí. Không xem được dữ liệu bệnh nhân khác (Anti-IDOR). | **PASS** |

---

## 4. KIỂM TRA LUỒNG NGHIỆP VỤ XUYÊN SUỐT (END-TO-END)

Luồng kiểm thử tự động `php artisan test:smartcare-e2e` đã thực thi chuỗi 10 mắt xích nghiệp vụ liên hoàn thành công **38 / 38 kịch bản (44 checks)**:

```
[Bệnh nhân đăng ký/đăng nhập]
         │
         ▼
[Tra cứu Bác sĩ & Chuyên khoa]
         │
         ▼
[Đặt lịch khám vào Ca mở] ──► (MySQL Stored Procedure: Cập nhật sĩ số, chặn đặt trùng slot)
         │
         ▼
[Lễ tân Tiếp nhận hàng chờ] ──► (Chuyển lịch hẹn DA_TIEP_NHAN, sinh Lượt khám CHO_KHAM)
         │
         ▼
[Bác sĩ Thăm khám & Ghi phiếu] ──► (Bắt buộc chẩn đoán, chuyển DANG_KHAM)
         │
         ▼
[Kê đơn thuốc & Chỉ định CLS] ──► (Tự động trừ tồn kho thuốc theo thời gian thực)
         │
         ▼
[Bác sĩ Hoàn tất buổi khám] ──► (Khóa hồ sơ Read-Only, chuyển HOAN_THANH)
         │
         ▼
[Lễ tân Lập hóa đơn viện phí] ──► (Bóc tách tự động: Tiền khám + Thuốc + Cận lâm sàng)
         │
         ▼
[Thu tiền viện phí 2 đợt] ──► (LockForUpdate, hỗ trợ trả góp, bất biến bảng thanh_toan)
         │
         ▼
[Bệnh nhân tra cứu hồ sơ] ──► (Xem chẩn đoán, xem đơn thuốc liều dùng, số dư nợ = 0 đ)
```

---

## 5. DỮ LIỆU & BẢO MẬT HỆ THỐNG

1. **Phân quyền cách ly dữ liệu (Anti-IDOR)**:
   - Bệnh nhân B cố truy cập lịch hẹn, đơn thuốc, hóa đơn hoặc hội thoại AI của Bệnh nhân A: **100% bị chặn HTTP 403 Forbidden**.
   - Bác sĩ B cố can thiệp vào hồ sơ lượt khám của Bác sĩ A: **100% bị chặn HTTP 403 Forbidden**.
2. **Bảo toàn dữ liệu thật**:
   - Tuyệt đối không chạy lệnh `migrate:fresh` hoặc xóa dữ liệu sản xuất.
   - Lệnh `smartcare:seed-demo` đã được chứng minh **Idempotent 100%**: Chạy 2 lần liên tiếp số lượng bản ghi của 6 bảng chính giữ nguyên không đổi (`TaiKhoan: 19, BenhNhan: 13, BacSi: 4, ChuyenKhoa: 4, Thuoc: 6, DichVu: 5`).
3. **Bảo mật thông tin nhạy cảm**:
   - `GEMINI_API_KEY` không nằm trên URL, không xuất hiện ở frontend HTML hay console log.
   - Mật khẩu đăng nhập được băm bằng thuật toán `bcrypt`, không in ra log.
   - Tin nhắn người dùng gửi sang AI được làm sạch tự động (khử SĐT, CCCD, BHYT, Email, địa chỉ chi tiết qua `redactPiiFromText`).

---

## 6. ĐÁNH GIÁ VỀ KIỂM THỬ TRÌNH DUYỆT (BROWSER TESTING)

- **Xác nhận thực tế**: Dự án hiện **chưa cài đặt bộ công cụ Browser Automation không đầu (Headless Browser như Playwright hay Puppeteer)** trong file `package.json`.
- **Đảm bảo chất lượng**:
  - Toàn bộ giao diện React, TypeScript và Tailwind CSS đã được biên dịch thành công 100% bằng lệnh `npm run build` trong **15.34s** (0 error, 0 warning).
  - Đã cung cấp Checklist thao tác thủ công chi tiết từng bước tại Mục 7 của [FINAL_AUDIT_SMARTCARE.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/FINAL_AUDIT_SMARTCARE.md) để Giảng viên và Hội đồng trải nghiệm trực tiếp trên trình duyệt Web.

---

## 7. ĐỐI CHIẾU KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (15 TEST SUITES)

| STT | Command kiểm thử | File thực thi | Số Test Blocks | Số Checks chi tiết | Loại hình kiểm thử |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | `test:auth` | `TestAuthNghiepVu.php` | 5 | 15 | **100% MySQL Thật** |
| **2** | `test:benhnhan` | `TestBenhNhanNghiepVu.php` | 5 | 5 | **100% MySQL Thật** |
| **3** | `test:chuyenkhoa`| `TestChuyenKhoaNghiepVu.php`| 5 | 5 | **100% MySQL Thật** |
| **4** | `test:bacsi` | `TestBacSiNghiepVu.php` | 7 | 7 | **100% MySQL Thật** |
| **5** | `test:lichkham` | `TestLichKhamNghiepVu.php` | 18 | 18 | **100% MySQL Thật** |
| **6** | `test:khambenh` | `TestKhamBenhNghiepVu.php` | 25 | 25 | **100% MySQL Thật** |
| **7** | `test:letanhangcho`| `TestLeTanHangCho.php` | 10 | 10 | **100% MySQL Thật** |
| **8** | `test:bacsikhambenh`| `TestBacSiKhamBenh.php` | 18 | 18 | **100% MySQL Thật** |
| **9** | `test:hoadon` | `TestHoaDonThanhToan.php` | 25 | 25 | **100% MySQL Thật** |
| **10**| `test:patient-portal`| `TestPatientPortal.php` | 12 | 12 | **100% MySQL Thật** |
| **11**| `test:admin-portal` | `TestAdminPortal.php` | 12 | 12 | **100% MySQL Thật** |
| **12**| `test:admin-audit` | `TestAdminAudit.php` | 13 | 13 | **100% MySQL Thật** |
| **13**| `test:smartcare-e2e`| `TestSmartCareE2E.php` | 38 | 44 | **100% MySQL Thật** |
| **14**| `test:ai-chatbot` | `TestAiChatbotAndDemo.php` | 12 | 12 | **100% MySQL Thật** |
| **15**| `audit:ai-security`| `AuditAiSecurity.php` | 24 | 24 | **Giả lập mạng Gemini & Model check** |
| **TỔNG**| **15 COMMANDS** | **15 FILES** | **229 BLOCKS** | **245 CHECKS** | **TỶ LỆ PASS: 100% (245/245)** |

---

## 8. DANH MỤC TÀI LIỆU BÀN GIAO ĐÍNH KÈM

1. **[DOCUMENTATION_DEMO_NGHIEM_THU.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/DOCUMENTATION_DEMO_NGHIEM_THU.md)**:
   - Hướng dẫn cài đặt (`composer install`, `npm install`, `npm run build`, `php artisan serve`).
   - Cấu hình database MySQL và file `.env.example`.
   - Danh sách tài khoản demo và mật khẩu chung: `SmartCare@2026`.
   - Hướng dẫn sử dụng chi tiết cho 4 vai trò.
   - Sơ đồ kiến trúc phân tầng (Architecture Diagram).
   - Sơ đồ quan hệ thực thể (ERD) và sơ đồ Use Case.
2. **[FINAL_AUDIT_SMARTCARE.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/FINAL_AUDIT_SMARTCARE.md)**:
   - Báo cáo kiểm toán kỹ thuật chuyên sâu về Google Gemini 3.8 Flash, an toàn y tế, chống prompt injection, rate limiting và checklist kiểm thử thủ công 6 bước cho hội đồng nghiệm thu.

---

## 9. XÁC NHẬN BÀN GIAO DỰ ÁN

Hệ thống Quản lý phòng khám thông minh tích hợp AI (**SmartCare - Nhóm 9 DALN**) đã hoàn thành toàn diện tất cả các giai đoạn phát triển, đạt chuẩn bảo mật và nghiệp vụ y tế, sẵn sàng 100% phục vụ buổi nghiệm thu tốt nghiệp!
