# BÁO CÁO AUDIT: TIẾP NHẬN BỆNH NHÂN & THANH THÔNG BÁO SMARTCARE
**Dự án:** Hệ thống quản lý phòng khám thông minh tích hợp AI — SmartCare (Nhóm 9 DALN)  
**Thời điểm thực hiện:** 03/11/2026  
**Môi trường:** PHP 8.2 / Laravel 11 / MySQL 8.0 / React 18 / TypeScript / Inertia.js  

---

## 1. PHÂN TÍCH HIỆN TRẠNG & NGUYÊN NHÂN LỖI

### 1.1. Chức năng Tiếp nhận bệnh nhân (`Receptionist Check-in`)
- **Vị trí code liên quan:**
  - Route: `POST /receptionist/visits` trỏ tới `LuotKhamController::store`.
  - Frontend: `resources/js/Pages/Receptionist/Queue.tsx` (hàm `handleCheckIn`).
  - Backend: `app/Http/Controllers/LuotKhamController.php`.
- **Nguyên nhân lỗi cốt lõi:**
  1. **Lỗi nghiêm trọng về PHP 8 Return Type (`TypeError`):**  
     Signature của hàm `store` được định nghĩa là:
     ```php
     public function store(Request $request): JsonResponse
     ```
     Tuy nhiên, khi Lễ tân bấm "Tiếp nhận" từ màn hình Inertia (`Queue.tsx`), request mang header `X-Inertia: true`. Ở cuối hàm `store`, logic xử lý:
     ```php
     if ($request->header('X-Inertia')) {
         return redirect()->back()->with('success', '...');
     }
     ```
     Hàm `redirect()->back()` trả về một instance của `Illuminate\Http\RedirectResponse`. Do hàm bị ép kiểu `: JsonResponse`, PHP lập tức ném lỗi fatal:
     `TypeError: LuotKhamController::store(): Return value must be of type JsonResponse, RedirectResponse returned`.  
     Hậu quả: Toàn bộ thao tác tiếp nhận từ giao diện Lễ tân bị sập với lỗi HTTP 500, không thể chuyển hướng hoặc load lại hàng chờ.
  2. **Tương tự ở hàm `startExamine`:**  
     Method `startExamine` cũng bị khai báo `: JsonResponse` nhưng lại chứa `return redirect()->back()` khi gặp Inertia request, dẫn đến sập tương tự khi bác sĩ bắt đầu khám từ giao diện.
  3. **Thiếu thông báo nghiệp vụ thời gian thực:**  
     Khi tiếp nhận thành công, hệ thống chưa phát tín hiệu thông báo đến Bác sĩ trực phòng khám để biết có bệnh nhân mới vào hàng chờ, cũng như chưa gửi thông báo xác nhận tiếp nhận đến tài khoản Bệnh nhân.

---

### 1.2. Thanh thông báo (Notification System)
- **Vị trí code liên quan:**
  - Layouts: `resources/js/Layouts/DashboardLayout.tsx` (dòng 153-156) và `resources/js/Layouts/PatientLayout.tsx`.
- **Nguyên nhân & Khiếm khuyết:**
  1. **Chỉ là giao diện giả tĩnh (Mock UI):**  
     Nút chuông trên Header chỉ là thẻ `<button>` chứa icon `<Bell />` kèm theo thẻ `<span className="... bg-red-500 rounded-full"></span>` cứng, không hề có dropdown xem danh sách, không có state, không có tương tác click.
  2. **Chưa có cấu trúc Database cho thông báo:**  
     Trong MySQL chưa có bảng lưu trữ thông báo người dùng (`thong_bao`).
  3. **Không có Model, Service và API xử lý:**  
     Không có API lấy số lượng chưa đọc (`unread-count`), danh sách thông báo phân trang, hay API đánh dấu đã đọc (`markAsRead`, `markAllAsRead`).
  4. **Các sự kiện nghiệp vụ chưa gắn Trigger thông báo:**  
     Các nghiệp vụ quan trọng trong phòng khám (Đặt lịch thành công, Tiếp nhận bệnh nhân, Bác sĩ bắt đầu khám, Hoàn tất khám bệnh, Kê đơn thuốc, Lập hóa đơn viện phí, Thanh toán thành công) chưa hề phát thông báo đến các bên liên quan.

---

## 2. PHẠM VI & GIẢI PHÁP ĐỀ XUẤT

| STT | Hạng mục | Giải pháp xử lý |
|---|---|---|
| 1 | **Tiếp nhận bệnh nhân** | Gỡ bỏ ràng buộc `: JsonResponse`, hỗ trợ đa hình `RedirectResponse` (Inertia) lẫn `JsonResponse` (API/JSON). Áp dụng Pessimistic Locking (`lockForUpdate`) trên `LichHen` và `LuotKham` để chống double check-in. |
| 2 | **Database Thông báo** | Tạo Migration an toàn tạo bảng `thong_bao` với khóa ngoại trỏ về `tai_khoan.MaTaiKhoan` (INT), index tối ưu theo `(MaTaiKhoan, DaDoc)` và `(MaTaiKhoan, NgayTao)`. |
| 3 | **Model & Backend Service** | Xây dựng Model `ThongBao`, bổ sung quan hệ `thongBaos()` trên `TaiKhoan`, viết `NotificationService` hỗ trợ gửi theo user, theo vai trò (`sendToRole`), theo Bác sĩ (`sendToDoctor`), theo Bệnh nhân (`sendToPatient`). |
| 4 | **Controller & Chống IDOR** | Xây dựng `ThongBaoController` với 4 endpoints. Kiểm tra nghiêm ngặt quyền sở hữu `MaTaiKhoan === Auth::id()` khi đánh dấu đã đọc (trả về 403 nếu vi phạm IDOR). |
| 5 | **Kích hoạt thông báo nghiệp vụ** | Tích hợp gửi thông báo tại tất cả các điểm mấu chốt trong luồng: Đặt lịch $\rightarrow$ Tiếp nhận $\rightarrow$ Khám $\rightarrow$ Kê đơn $\rightarrow$ Hoàn thành $\rightarrow$ Hóa đơn $\rightarrow$ Thanh toán. |
| 6 | **Frontend Component** | Xây dựng `NotificationDropdown.tsx` với icon theo loại, badge số lượng chưa đọc animate, popover dropdown, polling 30 giây, đánh dấu đã đọc khi click và điều hướng tới trang tương ứng. Thay thế nút chuông tĩnh trên tất cả Layout. |
