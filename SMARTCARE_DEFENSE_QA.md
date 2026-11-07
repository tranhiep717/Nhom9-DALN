# SMARTCARE – BỘ CÂU HỎI VÀ HƯỚNG DẪN TRẢ LỜI BẢO VỆ ĐỒ ÁN (DEFENSE Q&A)

> **Mục tiêu**: Trang bị cho sinh viên kiến thức chuyên sâu và phản xạ tự tin trước các câu hỏi phản biện của Hội đồng chấm Đồ án tốt nghiệp (bao gồm Giảng viên hướng dẫn, Giảng viên phản biện và Chủ tịch hội đồng).  
> **Nguyên tắc trả lời**: Điềm tĩnh, tự tin, bám sát kiến trúc thực tế của hệ thống, dẫn chứng số liệu kiểm thử cụ thể và thành thật về các giới hạn kỹ thuật thay vì ngụy tạo thông tin.  

---

## MỤC LỤC CÁC NHÓM CÂU HỎI
1. [NHÓM 1: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ (ARCHITECTURE & STACK)](#nhóm-1-kiến-trúc-hệ-thống-và-công-nghệ)
2. [NHÓM 2: THIẾT KẾ CƠ SỞ DỮ LIỆU & HIỆU NĂNG (DATABASE & CONCURRENCY)](#nhóm-2-thiết-kế-cơ-sở-dữ-liệu--hiệu-năng)
3. [NHÓM 3: NGHIỆP VỤ HÀNG ĐỢI HYBRID QUEUE & Y TẾ (BUSINESS LOGIC)](#nhóm-3-nghiệp-vụ-hàng-đợi-hybrid-queue--y-tế)
4. [NHÓM 4: BẢO MẬT & KIỂM THỬ PHẦN MỀM (SECURITY & TESTING)](#nhóm-4-bảo-mật--kiểm-thử-phần-mềm)
5. [NHÓM 5: TRÍ TUỆ NHÂN TẠO & ĐẠO ĐỨC Y KHOA (AI & ETHICS)](#nhóm-5-trí-tuệ-nhân-tạo--đạo-đức-y-khoa)
6. [NHÓM 6: HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN (LIMITATIONS & FUTURE SCOPE)](#nhóm-6-hạn-chế-và-hướng-phát-triển)

---

## NHÓM 1: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ

### Câu 1: Tại sao nhóm lại lựa chọn Inertia.js kết hợp Laravel và React thay vì tách biệt hoàn toàn thành Backend RESTful API và Frontend SPA độc lập?
- **Trả lời**:
  - *Lý do 1: Tối ưu năng suất phát triển (Productivity)*: Trong mô hình REST API truyền thống, lập trình viên phải định nghĩa Route, viết Controller, tạo Resource DTO ở Backend; sau đó sang Frontend phải viết Redux/Axios client, định nghĩa lại TypeScript Interface và xử lý State Management phức tạp. Inertia.js đóng vai trò là "chất keo" (glue) kết nối thẳng Controller Laravel với React Component thông qua JSON Props mà không cần xây dựng API trung gian.
  - *Lý do 2: Trải nghiệm người dùng mượt mà (SPA UX)*: Inertia chặn các sự kiện click link hoặc submit form truyền thống, chỉ nạp dữ liệu JSON cần thiết mà không tải lại toàn bộ trang (Zero Full Page Reload), giúp tốc độ chuyển trang đạt dưới 100ms.
  - *Lý do 3: Tối ưu bảo mật Session-based*: Khác với API lưu JWT Token ở LocalStorage dễ bị tấn công XSS đánh cắp thông tin, SmartCare tận dụng cơ chế Cookie HttpOnly + CSRF Token bảo mật mặc định của Laravel, an toàn hơn rất nhiều cho dữ liệu y tế nhạy cảm.

### Câu 2: Trong màn hình Hàng đợi của Lễ tân và Bác sĩ, hệ thống cập nhật dữ liệu bằng cơ chế nào? Có dùng WebSocket không?
- **Trả lời**:
  - Hiện tại, hệ thống sử dụng cơ chế **Polling có kiểm soát và reactive refresh của Inertia** (`router.reload({ only: ['queue', 'stats'] })`). Khi nhân viên thao tác (như gọi số, check-in hoặc hoàn thành ca), Inertia tự động làm mới phần dữ liệu hàng đợi.
  - Nhóm không triển khai WebSocket (Pusher/Soketi) ở giai đoạn này để giữ kiến trúc đơn giản, giảm tải hạ tầng máy chủ và bảo đảm tính tương thích tối đa trên mọi trình duyệt mà không lo đứt kết nối Socket. Trong giai đoạn mở rộng tiếp theo, nhóm đã dự trù kiến trúc để tích hợp Laravel Reverb (WebSocket server thuần PHP của Laravel 11/12) cho các bảng điện tử LED hiển thị số tại sảnh chờ.

---

## NHÓM 2: THIẾT KẾ CƠ SỞ DỮ LIỆU & HIỆU NĂNG

### Câu 3: Khi có hàng chục lượt khám được tạo đồng thời tại các quầy lễ tân khác nhau, làm thế nào hệ thống đảm bảo số phiếu (A-001, T-001) không bị trùng lặp (Race Condition)?
- **Trả lời**:
  - Nhóm thiết kế một bảng riêng biệt là `hang_doi_counter` với khóa phân đoạn `scope_key` duy nhất theo ngày, chuyên khoa và ca khám:
    $$\text{scope\_key} = \text{NgayKham} + \text{"\_CK"} + \text{MaChuyenKhoa} + \text{"\_CA"} + \text{MaCaKham}$$
  - Trong Service `QueueManagementService`, thao tác cấp số được bọc trong một **Database Transaction** sử dụng kỹ thuật khóa dòng bi quan (**Pessimistic Locking - `SELECT ... FOR UPDATE`**):
    ```php
    DB::transaction(function () use ($scopeKey, $prefix) {
        $counter = HangDoiCounter::where('scope_key', $scopeKey)->lockForUpdate()->first();
        $nextNumber = ($counter ? $counter->current_number : 0) + 1;
        // Cập nhật counter và cấp số phiếu
    });
    ```
  - Khi một request đang cấp số, các request khác cùng ca khám sẽ phải xếp hàng chờ trong hàng đợi của MySQL cho đến khi transaction kết thúc (chỉ mất vài mili-giây). Nhờ đó, số phiếu được cấp luôn luôn tăng tuần tự và không bao giờ bị trùng lặp.

### Câu 4: Sơ đồ ERD có những mối quan hệ nào đáng chú ý? Tại sao `tai_khoan` lại tách riêng khỏi `benh_nhan` và `bac_si`?
- **Trả lời**:
  - Đây là mẫu thiết kế **Role-Entity Decoupling**:
    - `tai_khoan` đại diện cho định danh xác thực (Authentication), chỉ chứa thông tin đăng nhập: Email, Tên đăng nhập, Mật khẩu băm (Bcrypt), Vai trò (`MaVaiTro`) và Trạng thái.
    - `benh_nhan` và `bac_si` là các thực thể nghiệp vụ (Domain Entities) chứa các thuộc tính chuyên môn: Học vị, chuyên khoa, kinh nghiệm (đối với Bác sĩ) hoặc BHYT, tiền sử bệnh, ngày sinh, địa chỉ (đối với Bệnh nhân).
  - *Lợi ích*:
    1. Giúp bảng tài khoản gọn nhẹ, truy vấn xác thực đăng nhập cực nhanh.
    2. Một bác sĩ nghỉ việc hoặc một nhân viên đổi vai trò không làm hỏng dữ liệu lịch sử các ca khám trước đó.
    3. Hỗ trợ trường hợp một người dùng vừa là bệnh nhân đi khám, vừa có thể là nhân viên phòng khám trong tương lai nếu cần mở rộng.

---

## NHÓM 3: NGHIỆP VỤ HÀNG ĐỢI HYBRID QUEUE & Y TẾ

### Câu 5: Tại sao nhóm lại chọn chính sách FIFO chung cho P2 (Đặt lịch) và P3 (Khách vãng lai) thay vì luôn luôn ưu tiên P2 khám trước P3?
- **Trả lời**:
  - Đây là bài toán thực tế đã được nhóm khảo sát kỹ lưỡng và thống nhất trong **Chính sách nghiệp vụ Phase 5.1**:
    1. **Bảo đảm công bằng y đức**: Giả sử một bệnh nhân vãng lai P3 (người già, người ở xa) đã đến ngồi chờ tại phòng khám từ 7h30 sáng; nếu một bệnh nhân P2 đặt lịch 8h30 đến lúc 8h29 mà được chen ngang khám ngay trước mặt bệnh nhân P3 thì sẽ gây bức xúc, tranh cãi lớn tại sảnh chờ.
    2. **Quy tắc xếp hàng chuẩn**: P2 mang lại lợi ích là **được giữ chỗ trước trong khung ca khám** (không sợ bị hết chỉ tiêu nhận bệnh). Nhưng khi đã có mặt tại cơ sở y tế (đã check-in), cả P2 và P3 đều tham gia hàng đợi chung theo thời điểm có mặt thực tế:
       $$\text{ORDER BY } ThoiGianVaoHang \text{ ASC}, MaLuotKham \text{ ASC}$$
    3. Trừ trường hợp cấp cứu khẩn cấp (P1) có buồng riêng, nguyên tắc thời gian vào hàng bảo đảm tính nhân văn và trật tự công cộng cao nhất.

### Câu 6: Quy trình xử lý bệnh nhân Cận lâm sàng (CLS) quay lại phòng khám diễn ra như thế nào? Bệnh nhân có được số phiếu mới không?
- **Trả lời**:
  - **Không cấp số mới**: Bệnh nhân tái khám CLS được **tái sử dụng 100% `MaLuotKham` và `SoPhieu` ban đầu** (`A-xxx` hoặc `T-xxx`).
  - **Quy trình 2 bước chống gọi hớ**:
    1. Khi kỹ thuật viên nhập kết quả xét nghiệm/X-quang, hệ thống **không tự ý** đưa bệnh nhân vào hàng đợi khám lại ngay lập tức (vì bệnh nhân có thể còn đang thay đồ, đi vệ sinh hoặc chưa kịp di chuyển từ tầng xét nghiệm về phòng khám).
    2. Khi bệnh nhân thực sự cầm tờ kết quả quay lại quầy tiếp tân, nhân viên lễ tân mới bấm nút **"Tiếp nhận CLS quay lại"** (`recordClsReturn`). Lúc này, lượt khám mới chuyển sang trạng thái `CHO_KHAM_LAI` và tham gia vào hàng đợi theo đúng thời điểm có mặt thực tế tại phòng khám.

### Câu 7: Cơ chế Token chống gọi trùng loa phát thanh (Idempotency Token) hoạt động ra sao?
- **Trả lời**:
  - Tại giao diện Lễ tân, mỗi khi người dùng click nút "Gọi loa", code React tự động sinh ra một chuỗi UUID duy nhất (`crypto.randomUUID()`) và gửi kèm Header `Idempotency-Token` lên Server.
  - Phía Backend lưu vết token này vào mảng sự kiện JSON trong `GhiChuDieuPhoi`.
  - Nếu lễ tân vô tình click chuột 2 lần trong 1 giây hoặc mạng bị lag dẫn đến request gửi lặp lại, Backend kiểm tra thấy token đã tồn tại thì sẽ trả về kết quả thành công của lần gọi trước kèm cờ `deduplicated: true` mà **không tăng số lần gọi giả mạo**.
  - Chỉ khi đủ 3 lần gọi hợp lệ thực sự mà bệnh nhân không có mặt, nút "Bỏ lượt" mới được phép kích hoạt.

---

## NHÓM 4: BẢO MẬT & KIỂM THỬ PHẦN MỀM

### Câu 8: Hệ thống phòng chống lỗ hổng IDOR (Insecure Direct Object Reference) như thế nào trong hồ sơ bệnh án?
- **Trả lời**:
  - Nhóm áp dụng **kiểm tra phân quyền kép (Two-Layer Authorization)**:
    1. *Tầng Middleware*: Kiểm tra vai trò của người dùng (`role:BENH_NHAN`, `role:BAC_SI`...).
    2. *Tầng Controller*: Kiểm tra quyền sở hữu bản ghi dựa trên ID trong Session (`$request->user()`), tuyệt đối không tin tưởng ID truyền lên từ Client URL:
       ```php
       // Bệnh nhân chỉ xem được lượt khám của chính mình
       if ($user->isBenhNhan() && $user->benhNhan->MaBenhNhan !== $visit->MaBenhNhan) {
           abort(403, 'Bạn không có quyền xem thông tin lượt khám của bệnh nhân khác.');
       }
       // Bác sĩ chỉ xem được lượt khám do mình phụ trách
       if ($user->isBacSi() && $user->bacSi->MaBacSi !== $visit->MaBacSi) {
           abort(403, 'Bạn không có quyền xem lượt khám của bác sĩ khác.');
       }
       ```

### Câu 9: Nhóm đã thực hiện kiểm thử hệ thống như thế nào? Tại sao lại dùng database diễn tập (`phong_kham_rehearsal_test`) mà không chạy trực tiếp trên database thật?
- **Trả lời**:
  - Hệ thống đã xây dựng và vượt qua **64 bài kiểm thử tự động (Feature Tests) với 1.066 assertions**:
    - Kiểm thử nghiệp vụ Hybrid Queue (Policy 5.1 & 5.3).
    - Kiểm thử hồi quy tích hợp Controller và Middleware.
    - Kiểm thử luồng trình duyệt End-to-End (Browser Smoke Test).
  - **Nguyên tắc an toàn dữ liệu y tế (Data Governance)**: Database thật `phong_kham_thong_minh` chứa dữ liệu bệnh nhân lịch sử. Trong kỹ nghệ phần mềm chuyên nghiệp, môi trường Production không bao giờ được dùng làm bãi thử nghiệm (Testing Sandbox). Nhóm đã tạo một bản sao diễn tập độc lập (`phong_kham_rehearsal_test`) để chạy migration, backfill dữ liệu và kiểm thử smoke test. Nhờ đó, database thật được bảo toàn nguyên vẹn 100% trong khi hệ thống vẫn được kiểm chứng hoạt động hoàn hảo trước khi chính thức go-live.

---

## NHÓM 5: TRÍ TUỆ NHÂN TẠO & ĐẠO ĐỨC Y KHOA

### Câu 10: Trợ lý AI trong SmartCare có khả năng chẩn đoán bệnh thay bác sĩ không? Nếu AI tư vấn sai thì trách nhiệm thuộc về ai?
- **Trả lời**:
  - Nhóm khẳng định dứt khoát: **SmartCare AI Assistant KHÔNG chẩn đoán bệnh thay Bác sĩ và KHÔNG kê đơn thuốc**.
  - **Định vị chức năng của AI**:
    1. Đóng vai trò là một **Trợ lý tiếp đón ban đầu (Triage & Navigation Assistant)**: Lắng nghe mô tả triệu chứng của bệnh nhân (VD: *"Tôi bị đau vùng thượng vị và buồn nôn"*) -> Trích xuất từ khóa y khoa -> Gợi ý đặt lịch tại chuyên khoa phù hợp (Khoa Nội tiêu hóa).
    2. Giải thích thuật ngữ y tế cơ bản để bệnh nhân bớt hoang mang khi đọc kết quả xét nghiệm.
  - **Đạo đức y tế & Pháp lý**:
    - Mọi câu trả lời của AI đều gắn kèm tuyên bố miễn trừ trách nhiệm y tế rõ ràng.
    - Bác sĩ chuyên khoa luôn là người duy nhất có thẩm quyền thăm khám, ra kết luận chẩn đoán và ký tên trên đơn thuốc.

---

## NHÓM 6: HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

### Câu 11: Những điểm còn hạn chế của đồ án hiện tại là gì?
- **Trả lời**:
  1. *Thanh toán trực tuyến*: Hiện hệ thống hỗ trợ ghi nhận thanh toán tiền mặt và quét mã chuyển khoản tại quầy thu ngân của Lễ tân, chưa tích hợp Webhook Callback tự động từ cổng thanh toán bên thứ ba (như VNPAY / MoMo).
  2. *Thiết bị ngoại vi phần cứng*: Chưa kết nối vật lý với cây bốc số Kiosk tự động (máy in nhiệt cấp phiếu) và bảng LED ma trận gọi số tại cửa buồng khám (hiện tại hiển thị trực tiếp trên giao diện màn hình sảnh chờ).
  3. *Chuẩn trao đổi dữ liệu y tế*: Chưa hỗ trợ đầy đủ các chuẩn định dạng dữ liệu y tế quốc tế như HL7 hoặc FHIR để liên thông bệnh án với các bệnh viện tuyến trên.

### Câu 12: Hướng phát triển tiếp theo của hệ thống nếu được đầu tư thương mại hóa?
- **Trả lời**:
  1. **Tích hợp Kiosk phần cứng & Thẻ căn cước công dân gắn chip (CCCD/VNeID)**: Bệnh nhân tự quét mã QR trên CCCD tại Kiosk để check-in và nhận số phiếu trong 5 giây mà không cần qua quầy lễ tân.
  2. **Tích hợp Cổng thanh toán quốc gia**: Tự động sinh mã VietQR động theo từng hóa đơn, nhận IPN webhook để tự động gạch nợ viện phí theo thời gian thực.
  3. **Khám bệnh từ xa (Telemedicine)**: Tích hợp WebRTC gọi video trực tuyến giữa Bác sĩ và Bệnh nhân cho các ca tái khám định kỳ hoặc tư vấn sức khỏe mãn tính.
  4. **Triển khai chuẩn liên thông dữ liệu y tế HL7/FHIR** phục vụ chia sẻ hồ sơ bệnh án điện tử quốc gia.
