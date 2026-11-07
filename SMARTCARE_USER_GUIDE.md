# SMARTCARE – CẨM NANG HƯỚNG DẪN SỬ DỤNG HỆ THỐNG
## HƯỚNG DẪN CHI TIẾT THEO TỪNG VAI TRÒ (USER MANUAL)

---

## MỤC LỤC
1. [HƯỚNG DẪN DÀNH CHO BỆNH NHÂN (PATIENT PORTAL)](#1-hướng-dẫn-dành-cho-bệnh-nhân-patient-portal)
2. [HƯỚNG DẪN DÀNH CHO NHÂN VIÊN LỄ TÂN (RECEPTIONIST PORTAL)](#2-hướng-dẫn-dành-cho-nhân-viên-lễ-tân-receptionist-portal)
3. [HƯỚNG DẪN DÀNH CHO BÁC SĨ (DOCTOR PORTAL)](#3-hướng-dẫn-dành-cho-bác-sĩ-doctor-portal)
4. [HƯỚNG DẪN DÀNH CHO KỸ THUẬT VIÊN CẬN LÂM SÀNG (CLS PORTAL)](#4-hướng-dẫn-dành-cho-kỹ-thuật-viên-cận-lâm-sàng-cls-portal)
5. [HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN PORTAL)](#5-hướng-dành-cho-quản-trị-viên-hệ-thống-admin-portal)

---

## 1. HƯỚNG DẪN DÀNH CHO BỆNH NHÂN (PATIENT PORTAL)

### 1.1. Đăng ký & Đăng nhập
1. Truy cập địa chỉ trang chủ SmartCare: `http://localhost:8000/`.
2. Bấm nút **"Đăng nhập"** ở góc phải trên cùng màn hình.
3. Nhập **Tên đăng nhập / Email** và **Mật khẩu** -> Bấm **"Đăng nhập"**.
4. Nếu chưa có tài khoản, bấm **"Đăng ký ngay"** -> Điền đầy đủ Họ tên, Ngày sinh, Số điện thoại, Địa chỉ, Email và Mật khẩu. Hệ thống tự động tạo mã hồ sơ y tế bệnh nhân (`BNxxxxxx`).

### 1.2. Tra cứu Bác sĩ & Chuyên khoa
- **Xem chuyên khoa**: Bấm menu **"Chuyên khoa"** (`/patient/specialties`) -> Chọn chuyên khoa để đọc thông tin và xem danh sách bác sĩ trực thuộc.
- **Xem bác sĩ**: Bấm menu **"Đội ngũ Bác sĩ"** (`/patient/doctors`) -> Sử dụng ô tìm kiếm theo tên hoặc lọc theo chuyên khoa -> Bấm **"Chi tiết"** để xem học vị, năm kinh nghiệm, tiểu sử và lịch khám trong tuần của bác sĩ.

### 1.3. Đặt lịch khám trực tuyến
1. Bấm menu **"Đặt lịch khám"** (`/patient/book`) hoặc nút **"Đặt lịch"** tại hồ sơ bác sĩ.
2. Chọn thông tin khám:
   - *Chuyên khoa* (VD: Nội tổng quát).
   - *Bác sĩ phụ trách* (VD: BS. CK1 Trần Văn Nam).
   - *Ngày khám* mong muốn.
   - *Ca khám* (Sáng: 08:00 - 11:30 | Chiều: 13:30 - 17:00).
   - *Mô tả triệu chứng / Lý do khám*.
3. Bấm **"Xác nhận đặt lịch"**.
4. Hệ thống hiển thị lịch hẹn tại trang **"Lịch hẹn của tôi"** (`/appointments`). Khi đến ngày khám, bệnh nhân chỉ cần đến quầy lễ tân để check-in nhận số ưu tiên P2.

### 1.4. Tra cứu Bệnh án, Đơn thuốc & Viện phí
- **Lịch sử khám bệnh**: Bấm menu **"Lịch sử khám bệnh"** (`/patient/history`) -> Xem danh sách các lần khám trước đây kèm chẩn đoán, kết quả xét nghiệm, lời dặn bác sĩ.
- **Đơn thuốc**: Bấm menu **"Đơn thuốc"** (`/patient/prescriptions`) -> Xem chi tiết các loại thuốc, liều lượng, số lượng và cách dùng mỗi ngày.
- **Hóa đơn viện phí**: Bấm menu **"Viện phí & Hóa đơn"** (`/patient/billing`) -> Xem chi tiết tiền khám, tiền thuốc, phí xét nghiệm và trạng thái thanh toán.

### 1.5. Trò chuyện với Trợ lý AI SmartCare
- Tại góc phải dưới màn hình, bấm vào biểu tượng bong bóng chat để mở **SmartCare AI Assistant**.
- Nhập các câu hỏi về triệu chứng (VD: *"Tôi bị đau đầu, sốt nhẹ thì nên khám chuyên khoa nào?"*). AI sẽ phân tích và gợi ý chuyên khoa phù hợp.

---

## 2. HƯỚNG DẪN DÀNH CHO NHÂN VIÊN LỄ TÂN (RECEPTIONIST PORTAL)

### 2.1. Đăng nhập phân hệ Lễ tân
- Đăng nhập tài khoản có quyền Lễ tân (`LE_TAN`). Hệ thống tự động chuyển hướng về `/receptionist/dashboard`.

### 2.2. Tiếp nhận bệnh nhân có lịch hẹn (Check-in P2)
1. Tại màn hình Hàng đợi (`/receptionist/queue`), nhìn danh sách **"Chờ tiếp nhận lịch hẹn hôm nay"**.
2. Tìm bệnh nhân theo Tên hoặc Số điện thoại.
3. Bấm nút **"Tiếp nhận / Check-in"**:
   - Hệ thống tự động cấp số phiếu có tiền tố **`A-xxx`** (Appointment).
   - Lượt khám được đưa vào Hàng đợi phòng khám của bác sĩ với mức ưu tiên `P2`.
   - In hoặc đọc số phiếu cho bệnh nhân di chuyển đến sảnh chờ trước phòng khám.

### 2.3. Đăng ký bệnh nhân đến trực tiếp (Vãng lai P3)
1. Tại màn hình Hàng đợi, bấm nút **"Tiếp nhận bệnh nhân mới"**.
2. Tìm kiếm bệnh nhân theo SĐT hoặc tạo mới nếu bệnh nhân đến khám lần đầu.
3. Chọn Bác sĩ và Ca khám đang mở.
4. Bấm **"Cấp số phiếu"**:
   - Hệ thống cấp số phiếu có tiền tố **`T-xxx`** (Ticket).
   - Lượt khám được đưa vào hàng đợi với mức ưu tiên `P3`.

### 2.4. Điều phối Hàng đợi & Phát loa gọi số (Speaker Call)
- Bảng hàng đợi sắp xếp hoàn toàn công bằng theo **thời điểm vào hàng thực tế (`ThoiGianVaoHang ASC`)**.
- Bấm nút **"Gọi loa"** (biểu tượng loa phát thanh):
  - Hệ thống tự động phát âm thanh thông báo mời bệnh nhân vào phòng khám.
  - Số lần gọi được ghi nhận tăng dần: `1/3`, `2/3`, `3/3`.
  - Có cơ chế Token UUID tự động chống click trùng lặp.
- **Xử lý bỏ lượt (Skip Call)**:
  - Khi đã phát loa gọi đủ 3 lần mà bệnh nhân không có mặt, nút **"Bỏ lượt"** sáng lên.
  - Bấm "Bỏ lượt" -> Nhập lý do (VD: *"Gọi 3 lần không có mặt"*) -> Lượt khám chuyển sang trạng thái `BO_LUOT`.

### 2.5. Tiếp nhận bệnh nhân Cận lâm sàng (CLS) quay lại
1. Khi bệnh nhân làm xong xét nghiệm/X-quang quay lại bàn lễ tân, tên bệnh nhân xuất hiện tại mục **"Bệnh nhân có kết quả CLS"**.
2. Bấm nút **"Tiếp nhận CLS quay lại"**:
   - Lượt khám chuyển trạng thái sang `CHO_KHAM_LAI`.
   - Bệnh nhân giữ nguyên mã số phiếu `A-xxx` / `T-xxx` ban đầu, được xếp vào hàng đợi bác sĩ để đọc kết quả.

### 2.6. Thu ngân & Xuất hóa đơn Viện phí
1. Bấm menu **"Thu ngân & Viện phí"** (`/receptionist/payment`).
2. Tìm lượt khám của bệnh nhân vừa khám xong (trạng thái `CHO_THANH_TOAN`).
3. Kiểm tra chi tiết viện phí (Tiền khám + Chi phí CLS + Tiền thuốc).
4. Chọn hình thức: *Tiền mặt* hoặc *Chuyển khoản QR* -> Bấm **"Xác nhận thanh toán"** -> Hóa đơn chuyển trạng thái `DA_THANH_TOAN`.

---

## 3. HƯỚNG DẪN DÀNH CHO BÁC SĨ (DOCTOR PORTAL)

### 3.1. Đăng nhập & Quản lý Lịch làm việc
- Đăng nhập tài khoản Bác sĩ (`BAC_SI`).
- Mở menu **"Lịch làm việc"** (`/doctor/schedule`) để kiểm tra các ca trực và ca khám bệnh được phân công trong tuần.

### 3.2. Quy trình Khám bệnh tại Buồng khám (`/doctor/examine`)
1. **Gọi bệnh nhân vào phòng**:
   - Mở màn hình **"Khám bệnh"**.
   - Bấm nút **"Gọi ca tiếp theo"**: Hệ thống tự động lấy đúng bệnh nhân kế tiếp theo thứ tự FIFO (không phân biệt P2 hay P3) và chuyển trạng thái sang **`DANG_KHAM`**.
   - *Lưu ý*: Bác sĩ đang khám 1 ca không thể bấm gọi thêm ca khác (Quy tắc đơn ca bảo đảm an toàn y tế).
2. **Ghi nhận Phiếu khám bệnh lâm sàng**:
   - Xem tiền sử bệnh và lịch sử các lần khám trước ở cột bên phải.
   - Nhập thông tin: *Triệu chứng lâm sàng*, *Chẩn đoán sơ bộ*, *Lời khuyên điều trị*.
   - Bấm **"Lưu phiếu khám"**.
3. **Chỉ định Cận lâm sàng (Nếu cần)**:
   - Chọn dịch vụ y tế (Xét nghiệm máu, Nước tiểu, Chụp X-quang, Siêu âm...).
   - Nhập ghi chú cho Kỹ thuật viên -> Bấm **"Lưu chỉ định"**.
   - Trạng thái ca khám tự động chuyển sang `CHO_KET_QUA_CLS`. Bác sĩ có thể bấm gọi bệnh nhân tiếp theo trong lúc chờ kết quả.
4. **Đọc kết quả CLS & Kê đơn thuốc**:
   - Khi bệnh nhân CLS quay lại phòng khám, bác sĩ mở hồ sơ: Kết quả và hình ảnh xét nghiệm được hiển thị trực tiếp.
   - Bác sĩ kết luận chẩn đoán xác định.
   - **Kê đơn thuốc**: Bấm *"Kê đơn thuốc"* -> Tìm tên thuốc từ kho dược -> Nhập số lượng, liều dùng, tần suất và cách dùng -> Bấm **"Lưu đơn thuốc"** (hệ thống tự động trừ kho).
5. **Hoàn tất ca khám**:
   - Bác sĩ bấm nút **"Hoàn thành ca khám"** -> Lượt khám chuyển trạng thái `HOAN_THANH` và đẩy sang quầy thu ngân.

---

## 4. HƯỚNG DẪN DÀNH CHO KỸ THUẬT VIÊN CẬN LÂM SÀNG (CLS PORTAL)

1. Đăng nhập tài khoản Kỹ thuật viên (`NHAN_VIEN_CAN_LAM_SANG`).
2. Mở màn hình **"Quản lý chỉ định CLS"** (`/cls/dashboard`).
3. Danh sách yêu cầu được hiển thị theo thời gian thực:
   - Bệnh nhân đến phòng kỹ thuật: Bấm **"Tiếp nhận / Bắt đầu"** -> Chuyển trạng thái `DANG_THUC_HIEN`.
   - Thực hiện kỹ thuật xét nghiệm / chẩn đoán hình ảnh.
4. Bấm **"Nhập kết quả"**:
   - Điền kết luận chi tiết (VD: các chỉ số sinh hóa, mô tả hình ảnh X-quang).
   - Bấm **"Xác nhận hoàn thành"**.
   - Hướng dẫn bệnh nhân quay lại quầy lễ tân để được điều phối khám lại với bác sĩ.

---

## 5. HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN PORTAL)

### 5.1. Dashboard Quản trị (`/admin/dashboard`)
- Xem các chỉ số tổng quan thời gian thực: Tổng số bệnh nhân, Bác sĩ đang hoạt động, Lịch hẹn hôm nay, Doanh thu trong ngày/tháng.
- Biểu đồ phân bổ lượt khám theo chuyên khoa và xu hướng doanh thu.

### 5.2. Quản lý Tài khoản người dùng (`/admin/users`)
- Xem danh sách toàn bộ tài khoản trong hệ thống.
- Thêm mới tài khoản, phân vai trò (`QUAN_TRI_VIEN`, `BAC_SI`, `LE_TAN`, `NHAN_VIEN_CAN_LAM_SANG`, `BENH_NHAN`).
- Khóa tài khoản hoặc mở khóa trạng thái tài khoản.

### 5.3. Quản lý Đội ngũ Bác sĩ & Chuyên khoa
- **Bác sĩ** (`/admin/doctors`): Thêm bác sĩ mới, cập nhật học vị, chuyên khoa, số điện thoại, kinh nghiệm công tác và trạng thái hoạt động.
- **Chuyên khoa** (`/admin/specialties`): Thêm/sửa chuyên khoa, cập nhật mô tả và hình ảnh biểu trưng.

### 5.4. Quản lý Kho thuốc & Dịch vụ y tế
- **Kho thuốc** (`/admin/medicines`): Quản lý danh mục biệt dược, đơn vị tính, đơn giá bán và số lượng tồn kho. Hệ thống tự động cảnh báo khi tồn kho thuốc chạm ngưỡng tối thiểu.
- **Dịch vụ y tế** (`/admin/services`): Quản lý bảng giá khám, giá xét nghiệm, chụp chiếu cận lâm sàng.

### 5.5. Quản lý Lịch biểu & Ca khám toàn viện (`/admin/schedules`)
- Phân công lịch làm việc theo ngày và theo ca cho từng bác sĩ trong toàn phòng khám.
- Mở hoặc đóng các ca khám trực tuyến phục vụ phân hệ đặt lịch của bệnh nhân.

### 5.6. Báo cáo & Thống kê tài chính (`/admin/reports`)
- Xuất báo cáo tài chính chi tiết: Doanh thu khám chữa bệnh, doanh thu thuốc, doanh thu dịch vụ cận lâm sàng.
- Lọc báo cáo linh hoạt theo khoảng thời gian: Hôm nay, 7 ngày qua, Tháng này, hoặc Tùy chọn ngày.
