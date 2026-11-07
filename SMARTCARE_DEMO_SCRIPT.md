# SMARTCARE – KỊCH BẢN TRÌNH DIỄN BẢO VỆ ĐỒ ÁN (DEMO SCRIPT)
## THỜI LƯỢNG TRÌNH DIỄN: 15 – 20 PHÚT

> **Mục tiêu**: Hướng dẫn nhóm sinh viên trình diễn trực quan, mạch lạc toàn bộ luồng hoạt động của hệ thống SmartCare trước Hội đồng chấm Đồ án tốt nghiệp.  
> **Điểm nhấn cốt lõi**: Cơ chế điều phối Hàng đợi thông minh Hybrid Queue, trải nghiệm người dùng không tải lại trang trên Inertia.js, và quy trình khám chữa bệnh khép kín.  

---

## BẢNG TỔNG HỢP TÀI KHOẢN VÀ DỮ LIỆU DEMO

| Vai trò | Tên đăng nhập | Mật khẩu Demo | Tên hiển thị thực tế | Mục đích sử dụng trong Demo |
| :--- | :--- | :--- | :--- | :--- |
| **Bệnh nhân** | `benhnhan_an` | `SmartCare@2026` | Nguyễn Văn An | Đặt lịch khám trực tuyến, xem hồ sơ, xem kết quả CLS & đơn thuốc |
| **Lễ tân** | `letan_demo` | `SmartCare@2026` | Lễ tân phòng khám | Check-in lịch hẹn (P2), cấp số vãng lai (P3), gọi loa, tiếp nhận CLS, thu ngân |
| **Bác sĩ** | `bacsi_nam` | `SmartCare@2026` | BS. CK1 Trần Văn Nam | Tiếp nhận ca khám FIFO, ghi phiếu khám, chỉ định CLS, kê đơn thuốc |
| **Kỹ thuật viên CLS** | `cls_nhom9` | `SmartCare@2026` | KTV Cận lâm sàng | Tiếp nhận chỉ định xét nghiệm/X-quang, cập nhật kết quả |
| **Quản trị viên** | `admin_demo` | `SmartCare@2026` | Admin SmartCare | Thống kê dashboard, quản lý kho thuốc, tài khoản, doanh thu |

---

## TIẾN TRÌNH TRÌNH DIỄN CHI TIẾT (9 BƯỚC)

```
[00:00 - 02:00] BƯỚC 1: Giới thiệu bài toán & Trang chủ SmartCare
      │
[02:00 - 04:00] BƯỚC 2: Bệnh nhân tra cứu Bác sĩ & Đặt lịch khám (P2)
      │
[04:00 - 06:30] BƯỚC 3: Lễ tân tiếp nhận lịch hẹn (P2) & Khách vãng lai (P3)
      │
[06:30 - 09:00] BƯỚC 4: Trình diễn thuật toán Hàng đợi Hybrid Queue
      │
[09:00 - 12:00] BƯỚC 5: Bác sĩ gọi ca kế tiếp & Chỉ định Cận lâm sàng (CLS)
      │
[12:00 - 14:00] BƯỚC 6: Kỹ thuật viên nhập kết quả & Bệnh nhân CLS quay lại
      │
[14:00 - 16:30] BƯỚC 7: Bác sĩ xem kết quả CLS, Kê đơn thuốc & Hoàn tất ca khám
      │
[16:30 - 18:30] BƯỚC 8: Thu ngân Viện phí & Quản trị hệ thống (Admin)
      │
[18:30 - 20:00] BƯỚC 9: Trợ lý AI, Tổng kết & Trả lời câu hỏi Hội đồng
```

---

### BƯỚC 1: GIỚI THIỆU BÀI TOÁN & TRANG CHỦ SMARTCARE (Thời lượng: ~2 phút)
- **Người trình bày**: Trưởng nhóm / Thành viên phụ trách thuyết trình.
- **Màn hình**: Trang chủ công khai `http://localhost:8000/`.
- **Thao tác**:
  1. Trình chiếu giao diện Trang chủ SmartCare:
     - Header điều hướng: Trang chủ, Chuyên khoa, Bác sĩ, Dịch vụ y tế.
     - Banner chính: Nút "Đặt lịch khám" và "Tìm bác sĩ".
     - Thanh tìm kiếm thông minh nhanh ở giữa trang.
     - 3 thẻ truy cập nhanh: Đặt lịch khám, Lịch hẹn của tôi, Hồ sơ khám bệnh.
  2. Bấm vào link **Chuyên khoa** (`/specialties`):
     - Giới thiệu danh mục các khoa: Nội tổng quát, Nhi khoa, Tai mũi họng, Da liễu...
     - Bấm nút **"Chi tiết khoa"** khoa Nội tổng quát (`/specialties/1`) -> Xem thông tin khoa và danh sách bác sĩ trực thuộc.
  3. Bấm vào link **Bác sĩ** (`/doctors`):
     - Lọc bác sĩ theo chuyên khoa.
     - Bấm nút **"Chi tiết"** vào hồ sơ bác sĩ `BS. CK1 Trần Văn Nam` (`/doctors/140`) -> Giới thiệu học vị, kinh nghiệm, các ca khám bệnh trong tuần và nút đặt hẹn.
- **Lời thoại gợi ý**:
  > *"Kính thưa quý Thầy Cô trong Hội đồng, SmartCare là hệ thống quản lý phòng khám thông minh giải quyết triệt để vấn đề ùn tắc hàng đợi. Người bệnh có thể dễ dàng tiếp cận danh bạ chuyên gia y tế, tra cứu lịch làm việc và chủ động đặt hẹn trực tuyến chỉ với vài thao tác trên giao diện hiện đại."*

---

### BƯỚC 2: BỆNH NHÂN ĐĂNG KÝ & ĐẶT LỊCH KHÁM TRỰC TUYẾN (Thời lượng: ~2 phút)
- **Tài khoản sử dụng**: `benhnhan_an` / `SmartCare@2026`.
- **Màn hình**: Đăng nhập (`/login`) -> Patient Portal (`/patient/book`).
- **Thao tác**:
  1. Đăng nhập tài khoản bệnh nhân `benhnhan_an`.
  2. Hệ thống đưa vào **Patient Dashboard**: Hiển thị thẻ BHYT điện tử, lịch hẹn sắp tới, lịch sử khám bệnh.
  3. Chọn mục **"Đặt lịch khám"** trên thanh menu:
     - Chọn Chuyên khoa: *Nội tổng quát*.
     - Chọn Bác sĩ: *BS. CK1 Trần Văn Nam*.
     - Chọn Ngày khám: *Hôm nay*.
     - Chọn Ca khám: *Ca chiều (13:30 - 17:00)*.
     - Nhập lý do khám: *"Đau bụng âm ỉ vùng thượng vị, đầy hơi khó tiêu"*.
     - Bấm **"Xác nhận đặt lịch"**.
  4. Hệ thống chuyển sang trang **"Lịch hẹn của tôi"** (`/appointments`): Hiển thị lịch hẹn vừa tạo ở trạng thái `CHO_XAC_NHAN` hoặc `DA_XAC_NHAN`.
- **Kết quả mong đợi**: Lịch hẹn được ghi nhận vào cơ sở dữ liệu với mã lịch hẹn rõ ràng.

---

### BƯỚC 3: LỄ TÂN TIẾP NHẬN TẠI QUẦY & CẤP SỐ PHIẾU (Thời lượng: ~2.5 phút)
- **Tài khoản sử dụng**: Mở tab ẩn danh / trình duyệt khác, đăng nhập `letan_demo` / `SmartCare@2026`.
- **Màn hình**: Bàn lễ tân (`/receptionist/queue`).
- **Thao tác**:
  1. **Tiếp nhận bệnh nhân có lịch hẹn (P2 - Check-in)**:
     - Lễ tân thấy lịch hẹn của bệnh nhân *Nguyễn Văn An* trong danh sách chờ tiếp nhận.
     - Bấm nút **"Tiếp nhận / Check-in"**.
     - Hệ thống cấp số phiếu có tiền tố **`A-xxx`** (Appointment), gán mức ưu tiên `P2`, ghi nhận `ThoiGianCheckIn` và đưa bệnh nhân vào Hàng đợi phòng khám.
  2. **Đăng ký bệnh nhân đến khám trực tiếp (P3 - Walk-in)**:
     - Có một bệnh nhân vãng lai đến quầy không hẹn trước (VD: *Lê Thị Bình*).
     - Lễ tân bấm **"Tiếp nhận trực tiếp"** -> Chọn bệnh nhân -> Chọn BS. Nam -> Chọn ca khám chiều.
     - Bấm **"Cấp số phiếu"**.
     - Hệ thống cấp số phiếu có tiền tố **`T-xxx`** (Ticket), gán mức ưu tiên `P3`, trạng thái `CHO_KHAM`.
- **Kết quả mong đợi**: Bảng hàng đợi hiển thị cả 2 bệnh nhân sẵn sàng vào khám.

---

### BƯỚC 4: MINH HỌA THUẬT TOÁN HÀNG ĐỢI HYBRID QUEUE (Thời lượng: ~2.5 phút)
- **Tài khoản sử dụng**: `letan_demo`.
- **Màn hình**: Màn hình Hàng đợi (`/receptionist/queue`).
- **Thao tác trình diễn điểm sáng**:
  1. **Chứng minh chính sách FIFO chung P2/P3**:
     - Cho Hội đồng quan sát danh sách chờ: Thứ tự sắp xếp hoàn toàn dựa trên thời điểm vào hàng thực tế (`ThoiGianVaoHang ASC`). Bệnh nhân nào có mặt trước được xếp trước, không xảy ra tình trạng P2 nhảy cóc P3 nếu P3 đã vào hàng đợi trước.
  2. **Minh họa Gọi loa phát thanh (Speaker Call) có Token UUID chống trùng**:
     - Lễ tân bấm nút **"Gọi loa"** lần 1 cho bệnh nhân đầu hàng -> Hệ thống hiển thị: *"Đã phát loa gọi lượt khám. Lần gọi: 1/3"*.
     - Bấm tiếp lần 2 và lần 3 -> Hiển thị: *"Lần gọi: 3/3. Có thể xác nhận bỏ lượt"*.
     - Nhấn mạnh với Thầy Cô: Mỗi lần bấm Frontend sinh kèm một UUID ngẫu nhiên; nếu bấm liên tục trong 1 giây, Backend tự động lọc trùng qua Token, không ghi nhận tăng lần gọi giả tạo.
  3. **Minh họa Bỏ lượt thủ công (Skip Patient)**:
     - Khi đã gọi đủ 3 lần mà bệnh nhân không vào: Nút **"Bỏ lượt"** sáng lên.
     - Lễ tân bấm "Bỏ lượt" -> Nhập lý do: *"Gọi 3 lần không có mặt tại sảnh"* -> Trạng thái chuyển sang `BO_LUOT`.

---

### BƯỚC 5: BÁC SĨ GỌI KHÁM & CHỈ ĐỊNH CẬN LÂM SÀNG (CLS) (Thời lượng: ~3 phút)
- **Tài khoản sử dụng**: Chuyển sang trình duyệt đăng nhập `bacsi_nam` / `SmartCare@2026`.
- **Màn hình**: Phòng khám Bác sĩ (`/doctor/examine`).
- **Thao tác**:
  1. Bác sĩ thấy số lượng bệnh nhân đang chờ tại ca khám hiện tại.
  2. Bấm nút **"Gọi ca tiếp theo"**:
     - Hệ thống tự động gọi đúng bệnh nhân kế tiếp theo FIFO.
     - Trạng thái lượt khám chuyển sang **`DANG_KHAM`** (Đang khám).
     - Minh họa quy định Bác sĩ đơn ca: Bấm "Gọi ca tiếp theo" lần nữa -> Hệ thống từ chối và báo lỗi vì bác sĩ đang có ca chưa hoàn tất.
  3. **Nhập thông tin khám lâm sàng**:
     - Nhập Triệu chứng: *"Đau rát vùng thượng vị, ợ hơi"* -> Bấm Lưu phiếu khám.
  4. **Chỉ định Cận lâm sàng (CLS)**:
     - Bác sĩ chỉ định dịch vụ: Chọn *"Nội soi dạ dày"* hoặc *"Chụp X-quang"*.
     - Bấm **"Lưu chỉ định"**.
     - Trạng thái lượt khám của bệnh nhân chuyển sang **`CHO_KET_QUA_CLS`**.
     - Bác sĩ có thể giải phóng phòng khám để tiếp nhận ca tiếp theo.
- **Kết quả mong đợi**: Chỉ định CLS được tạo thành công và xuất hiện trên phân hệ Cận lâm sàng.

---

### BƯỚC 6: KỸ THUẬT VIÊN NHẬP KẾT QUẢ & BỆNH NHÂN CLS QUAY LẠI (Thời lượng: ~2 phút)
- **Tài khoản sử dụng**: `cls_nhom9` và `letan_demo`.
- **Màn hình**: Phân hệ CLS (`/cls/dashboard`) -> Quầy lễ tân (`/receptionist/queue`).
- **Thao tác**:
  1. Đăng nhập Kỹ thuật viên `cls_nhom9`:
     - Thấy yêu cầu chỉ định xét nghiệm của bệnh nhân vừa gửi tới.
     - Bấm **"Nhập kết quả"**: Điền kết luận *"Hình ảnh niêm mạc xung huyết nhẹ, không có ổ loét"* -> Bấm Hoàn thành.
     - **Nhấn mạnh với Hội đồng**: Lượt khám **KHÔNG tự động** nhảy vào hàng đợi bác sĩ lúc này để tránh bác sĩ gọi tên khi bệnh nhân chưa kịp đi về phòng khám.
  2. Chuyển sang màn hình Lễ tân `letan_demo`:
     - Bệnh nhân cầm tờ kết quả quay lại bàn tiếp tân.
     - Lễ tân thấy nút **"Tiếp nhận CLS quay lại"** sáng lên.
     - Bấm tiếp nhận: Lượt khám chuyển sang trạng thái **`CHO_KHAM_LAI`**.
     - Cho Hội đồng xem số phiếu: **Số phiếu `A-xxx` hoặc `T-xxx` và `MaLuotKham` được giữ nguyên 100%**, không sinh số phiếu mới làm sai lệch bộ đếm.

---

### BƯỚC 7: BÁC SĨ ĐỌC KẾT QUẢ CLS, KÊ ĐƠN THUỐC & HOÀN TẤT (Thời lượng: ~2.5 phút)
- **Tài khoản sử dụng**: `bacsi_nam`.
- **Màn hình**: Phòng khám Bác sĩ (`/doctor/examine`).
- **Thao tác**:
  1. Bác sĩ thấy bệnh nhân tái khám CLS trong danh sách chờ. Bấm gọi vào phòng khám đọc kết quả.
  2. Màn hình hiển thị chi tiết kết quả CLS mà Kỹ thuật viên vừa nhập.
  3. Bác sĩ đưa ra Chẩn đoán xác định: *"Viêm dạ dày tá tràng cấp tính"*.
  4. **Kê đơn thuốc điện tử**:
     - Chọn thuốc từ kho dược: *Omeprazole 20mg* (14 viên, ngày uống 2 lần, mỗi lần 1 viên trước ăn).
     - Thêm thuốc thứ 2: *Phosphalugel* (20 gói, uống khi đau).
     - Nhập Lời dặn: *"Hạn chế đồ cay nóng, kiêng bia rượu, tái khám sau 2 tuần"*.
     - Bấm **"Kê đơn thuốc"** -> Hệ thống tự động trừ tồn kho qua Database Transaction.
  5. Bấm **"Hoàn thành lượt khám"**:
     - Trạng thái chuyển sang **`HOAN_THANH`**.
     - Hồ sơ được đóng gói lưu trữ và tự động đẩy sang phân hệ Thu ngân viện phí.

---

### BƯỚC 8: THU NGÂN VIỆN PHÍ & QUẢN TRỊ VIÊN HỆ THỐNG (Thời lượng: ~2 phút)
- **Tài khoản sử dụng**: `letan_demo` và `admin_demo`.
- **Màn hình**: Thu ngân (`/receptionist/payment`) -> Admin Dashboard (`/admin/dashboard`).
- **Thao tác**:
  1. **Lễ tân thu ngân**:
     - Mở mục "Thu ngân & Viện phí": Thấy hóa đơn của bệnh nhân vừa hoàn tất.
     - Hóa đơn tự động gom đầy đủ: Tiền khám + Phí dịch vụ CLS + Tiền thuốc kê đơn.
     - Chọn phương thức: *Tiền mặt* hoặc *Chuyển khoản QR* -> Bấm **"Xác nhận thanh toán"**.
     - Hóa đơn chuyển trạng thái `DA_THANH_TOAN`. Bệnh nhân có thể xem hóa đơn này ngay trên điện thoại.
  2. **Quản trị viên (Admin Portal)**:
     - Đăng nhập `admin_demo`:
     - Trình chiếu **Dashboard Quản trị**: Biểu đồ doanh thu trong ngày, biểu đồ số lượng bệnh nhân theo chuyên khoa (vẽ bằng thư viện Recharts).
     - Lướt nhanh các trang quản lý: Kho thuốc (`/admin/medicines`), Đội ngũ Bác sĩ (`/admin/doctors`), Quản lý tài khoản (`/admin/users`).
     - Trình diễn cơ chế bảo mật RBAC: Bệnh nhân hoặc Bác sĩ gõ URL `/admin/users` vào thanh địa chỉ sẽ lập tức bị chặn bằng màn hình lỗi `403 Forbidden`.

---

### BƯỚC 9: TRỢ LÝ Y TẾ AI, TỔNG KẾT & HỎI ĐÁP (Thời lượng: ~1.5 phút)
- **Màn hình**: Widget AI Chatbot ở góc phải màn hình (`PublicLayout` hoặc `Patient Portal`).
- **Thao tác**:
  1. Bấm mở biểu tượng bong bóng Chatbot AI SmartCare:
  2. Đặt câu hỏi thử nghiệm: *"Tôi bị đau bụng thượng vị và buồn nôn thì nên khám chuyên khoa nào?"*
  3. AI phản hồi tự động trong 1 giây:
     - Phân tích triệu chứng liên quan đến dạ dày, hệ tiêu hóa.
     - Gợi ý đặt lịch khám tại Chuyên khoa Nội tổng quát của phòng khám.
     - Hiển thị tuyên bố miễn trừ y khoa rõ ràng: *"Thông tin chỉ mang tính chất tham khảo, không thay thế chẩn đoán của bác sĩ chuyên khoa."*
  4. **Tổng kết bài trình bày**:
     - Tóm tắt 3 giá trị đạt được: Tối ưu hàng đợi, số hóa bệnh án, an toàn y khoa và dữ liệu.
     - Cảm ơn Hội đồng và chuyển sang phần Hỏi - Đáp (Q&A).
