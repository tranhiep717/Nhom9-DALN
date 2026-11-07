<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BenhNhanController;
use App\Http\Controllers\ChuyenKhoaController;
use App\Http\Controllers\BacSiController;
use App\Http\Controllers\LichLamViecController;
use App\Http\Controllers\CaKhamController;
use App\Http\Controllers\LichHenController;
use App\Http\Controllers\LuotKhamController;
use App\Http\Controllers\ThuocController;
use App\Http\Controllers\DonThuocController;
use App\Http\Controllers\ChiDinhDichVuController;
use App\Http\Controllers\HoaDonController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\CanLamSangController;
use App\Http\Controllers\ChamCongController;
use App\Http\Controllers\ThongBaoController;
use App\Http\Controllers\NhanVienController;

// Public routes
Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/book', [BenhNhanController::class, 'bookAppointmentView'])->name('book');

Route::get('/specialties', [ChuyenKhoaController::class, 'index'])->name('specialties.index');
Route::get('/specialties/{id}', [ChuyenKhoaController::class, 'show'])->name('specialties.show');

Route::get('/doctors', [BacSiController::class, 'index'])->name('doctors.index');
Route::get('/doctors/{id}', [BacSiController::class, 'show'])->name('doctors.show');

Route::get('/services', function () {
    return Inertia::render('Services/Index');
});
Route::get('/services/list', [ChiDinhDichVuController::class, 'services'])->name('services.list');

// Tra cứu Thuốc công khai
Route::get('/medicines', [ThuocController::class, 'index'])->name('medicines.index');
Route::get('/medicines/{id}', [ThuocController::class, 'show'])->name('medicines.show');

// Tra cứu Ca khám (Công khai hoặc phân hệ đặt lịch)
Route::get('/ca-kham', [CaKhamController::class, 'index'])->name('ca-kham.index');
Route::get('/ca-kham/{id}', [CaKhamController::class, 'show'])->name('ca-kham.show');

// Lịch hẹn khám (Bệnh nhân & Người dùng đăng nhập)
Route::middleware('auth')->group(function () {
    Route::get('/appointments', [LichHenController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [LichHenController::class, 'store'])->name('appointments.store');
    Route::get('/appointments/{id}', [LichHenController::class, 'show'])->name('appointments.show');
    Route::post('/appointments/{id}/cancel', [LichHenController::class, 'cancel'])->name('appointments.cancel');
    Route::delete('/appointments/{id}', [LichHenController::class, 'cancel'])->name('appointments.destroy');
});

// Dashboard chung (tự động điều hướng theo vai trò người dùng)
Route::middleware('auth')->get('/dashboard', [BenhNhanController::class, 'dashboard'])->name('dashboard');

// Patient Routes (Bệnh nhân Portal)
Route::middleware(['auth', 'role:BENH_NHAN'])->group(function () {
    Route::prefix('patient')->name('patient.')->group(function () {
        Route::get('/dashboard', [BenhNhanController::class, 'dashboard'])->name('dashboard');
        Route::get('/profile', [BenhNhanController::class, 'profileView'])->name('profile');
        Route::put('/profile', [BenhNhanController::class, 'updateProfile'])->name('profile.update');
        Route::get('/appointments', [LichHenController::class, 'index'])->name('appointments');
        Route::get('/history', [BenhNhanController::class, 'medicalHistory'])->name('history');
        Route::get('/medical-history', [BenhNhanController::class, 'medicalHistory'])->name('medical-history');
        Route::get('/prescriptions', [DonThuocController::class, 'index'])->name('prescriptions');
        Route::get('/billing', [HoaDonController::class, 'patientInvoices'])->name('billing');
        Route::get('/book', [BenhNhanController::class, 'bookAppointmentView'])->name('book');
        Route::get('/doctors', [BacSiController::class, 'patientIndex'])->name('doctors');
        Route::get('/specialties', [ChuyenKhoaController::class, 'patientIndex'])->name('specialties');

        Route::get('/records', function () { return redirect()->route('patient.history'); })->name('records');
        Route::get('/tests', function () { return redirect()->route('patient.history'); })->name('tests');
    });
});

// Doctor Routes (Bác sĩ)
Route::prefix('doctor')->name('doctor.')->middleware(['auth', 'role:BAC_SI'])->group(function () {
    Route::get('/dashboard', [BacSiController::class, 'dashboard'])->name('dashboard');
    Route::get('/cls-patients', [BacSiController::class, 'clsPatients'])->name('cls-patients');
    
    // Khám bệnh & Lượt khám
    Route::get('/examine', [LuotKhamController::class, 'index'])->name('examine');
    Route::get('/visits', [LuotKhamController::class, 'index'])->name('visits.index');
    Route::get('/visits/{id}', [LuotKhamController::class, 'show'])->name('visits.show');
    Route::post('/visits/{id}/start', [LuotKhamController::class, 'startExamine'])->name('visits.start')->middleware('staff.checked_in');
    Route::post('/visits/{id}/phieu-kham', [LuotKhamController::class, 'savePhieuKham'])->name('visits.phieu-kham')->middleware('staff.checked_in');
    Route::post('/visits/{id}/complete', [LuotKhamController::class, 'completeExamine'])->name('visits.complete')->middleware('staff.checked_in');
    Route::post('/queue/call-next', [LuotKhamController::class, 'callNextPatient'])->name('queue.call-next')->middleware('staff.checked_in');
    Route::post('/queue/call-speaker', [LuotKhamController::class, 'recordPatientCall'])->name('queue.call-speaker')->middleware('staff.checked_in');
    Route::post('/queue/skip-patient', [LuotKhamController::class, 'skipPatient'])->name('queue.skip-patient')->middleware('staff.checked_in');
    Route::post('/queue/cls-return', [LuotKhamController::class, 'recordClsReturn'])->name('queue.cls-return')->middleware('staff.checked_in');

    // Kê đơn thuốc
    Route::get('/medicines', [ThuocController::class, 'index'])->name('medicines.index');
    Route::post('/prescriptions', [DonThuocController::class, 'store'])->name('prescriptions.store')->middleware('staff.checked_in');
    Route::put('/prescriptions/{id}', [DonThuocController::class, 'update'])->name('prescriptions.update')->middleware('staff.checked_in');
    Route::post('/prescriptions/{id}/cancel', [DonThuocController::class, 'cancel'])->name('prescriptions.cancel')->middleware('staff.checked_in');

    // Chỉ định dịch vụ cận lâm sàng
    Route::get('/services', [ChiDinhDichVuController::class, 'services'])->name('services.index');
    Route::get('/service-requests', [ChiDinhDichVuController::class, 'index'])->name('service-requests.index');
    Route::post('/service-requests', [ChiDinhDichVuController::class, 'store'])->name('service-requests.store')->middleware('staff.checked_in');
    Route::post('/service-requests/{id}/result', [ChiDinhDichVuController::class, 'updateResult'])->name('service-requests.result')->middleware('staff.checked_in');
    Route::post('/service-requests/{id}/status', [ChiDinhDichVuController::class, 'updateStatus'])->name('service-requests.status')->middleware('staff.checked_in');
    
    // Quản lý Lịch làm việc
    Route::get('/schedule', [LichLamViecController::class, 'index'])->name('schedule');
    Route::get('/schedules', [LichLamViecController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}', [LichLamViecController::class, 'show'])->name('schedules.show');
    Route::post('/schedules', [LichLamViecController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{id}', [LichLamViecController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}', [LichLamViecController::class, 'destroy'])->name('schedules.destroy');

    // Chấm công & Lương
    Route::get('/attendance', [ChamCongController::class, 'index'])->name('attendance.index');
    Route::get('/payroll', [ChamCongController::class, 'doctorPayrollPage'])->name('payroll.index');
    Route::post('/attendance/check-in', [ChamCongController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/check-out', [ChamCongController::class, 'checkOut'])->name('attendance.check-out');
    Route::get('/payroll-data', [ChamCongController::class, 'payroll'])->name('payroll.data');
    Route::post('/payroll/build-month', [ChamCongController::class, 'buildMonthlyPayroll'])->name('payroll.build-month');
    Route::post('/requests', [ChamCongController::class, 'storeRequest'])->name('requests.store');
    Route::post('/requests/{id}/peer-confirm', [ChamCongController::class, 'peerConfirmRequest'])->name('requests.peer-confirm');

    // Quản lý Ca khám
    Route::post('/ca-kham', [CaKhamController::class, 'store'])->name('ca-kham.store');
    Route::put('/ca-kham/{id}', [CaKhamController::class, 'update'])->name('ca-kham.update');

    // Xem Lịch hẹn khám của bác sĩ
    Route::get('/appointments', [LichHenController::class, 'index'])->name('appointments');

    Route::get('/patients', function () { return redirect()->route('doctor.examine'); })->name('patients');
    Route::get('/stats', function () { return redirect()->route('doctor.dashboard'); })->name('stats');
});

// Receptionist Routes (Lễ tân)
Route::prefix('receptionist')->name('receptionist.')->middleware(['auth', 'role:LE_TAN,QUAN_TRI_VIEN'])->group(function () {
    Route::get('/dashboard', [LichHenController::class, 'receptionistDashboard'])->name('dashboard');
    Route::get('/queue', [LichHenController::class, 'queue'])->name('queue');
    Route::get('/records', [BenhNhanController::class, 'receptionistIndex'])->name('records');
    Route::get('/records/{id}', [BenhNhanController::class, 'receptionistShow'])->name('records.show');

    // Quản lý Hóa đơn & Thu ngân
    Route::get('/payment', [HoaDonController::class, 'index'])->name('payment');
    Route::get('/invoices', [HoaDonController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{id}', [HoaDonController::class, 'show'])->name('invoices.show');
    Route::post('/invoices', [HoaDonController::class, 'store'])->name('invoices.store')->middleware('staff.checked_in');
    Route::post('/invoices/{id}/pay', [HoaDonController::class, 'pay'])->name('invoices.pay')->middleware('staff.checked_in');
    Route::post('/invoices/{id}/cancel', [HoaDonController::class, 'cancel'])->name('invoices.cancel')->middleware('staff.checked_in');

    // Quản lý Tiếp nhận bệnh nhân & Lượt khám
    Route::get('/patients/search', [BenhNhanController::class, 'search'])->name('patients.search');
    Route::post('/patients', [BenhNhanController::class, 'store'])->name('patients.store')->middleware('staff.checked_in');
    Route::get('/visits', [LuotKhamController::class, 'index'])->name('visits.index');
    Route::post('/visits', [LuotKhamController::class, 'store'])->name('visits.store')->middleware('staff.checked_in');
    Route::post('/queue/cls-return', [LuotKhamController::class, 'recordClsReturn'])->name('queue.cls-return')->middleware('staff.checked_in');
    Route::post('/queue/call-speaker', [LuotKhamController::class, 'recordPatientCall'])->name('queue.call-speaker')->middleware('staff.checked_in');
    Route::post('/queue/skip-patient', [LuotKhamController::class, 'skipPatient'])->name('queue.skip-patient')->middleware('staff.checked_in');

    // Quản lý Lịch hẹn & Tiếp nhận
    Route::get('/appointments', [LichHenController::class, 'index'])->name('appointments');
    Route::post('/appointments', [LichHenController::class, 'store'])->name('appointments.store');
    Route::post('/appointments/{id}/status', [LichHenController::class, 'updateStatus'])->name('appointments.status');
    Route::put('/appointments/{id}/status', [LichHenController::class, 'updateStatus'])->name('appointments.status.put');
    Route::post('/appointments/{id}/cancel', [LichHenController::class, 'cancel'])->name('appointments.cancel');

    // Lịch trực & Chấm công Lễ tân
    Route::get('/schedule', [ChamCongController::class, 'receptionistSchedulePage'])->name('schedule');
    Route::get('/attendance', [ChamCongController::class, 'staffAttendancePage'])->name('attendance');
    Route::get('/payroll', [ChamCongController::class, 'staffAttendancePage'])->name('payroll');
    Route::post('/attendance/check-in', [ChamCongController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/check-out', [ChamCongController::class, 'checkOut'])->name('attendance.check-out');
    Route::post('/requests', [ChamCongController::class, 'storeRequest'])->name('requests.store');
    Route::post('/requests/{id}/peer-confirm', [ChamCongController::class, 'peerConfirmRequest'])->name('requests.peer-confirm');
});

// Cận lâm sàng Routes (Kỹ thuật viên xét nghiệm & Chẩn đoán hình ảnh)
Route::prefix('cls')->name('cls.')->middleware(['auth', 'role:NHAN_VIEN_CAN_LAM_SANG,QUAN_TRI_VIEN'])->group(function () {
    Route::get('/dashboard', [CanLamSangController::class, 'dashboard'])->name('dashboard');
    Route::get('/schedule', [CanLamSangController::class, 'schedule'])->name('schedule');
    Route::get('/requests', [CanLamSangController::class, 'dashboard'])->name('requests');
    Route::get('/pending', [CanLamSangController::class, 'pending'])->name('pending');
    Route::get('/processing', [CanLamSangController::class, 'processing'])->name('processing');
    Route::get('/results', [CanLamSangController::class, 'results'])->name('results');
    Route::post('/requests/{id}/receive', [CanLamSangController::class, 'receive'])->name('requests.receive')->middleware('staff.checked_in');
    Route::post('/requests/{id}/start', [CanLamSangController::class, 'start'])->name('requests.start')->middleware('staff.checked_in');
    Route::post('/requests/{id}/result', [CanLamSangController::class, 'updateResult'])->name('requests.result')->middleware('staff.checked_in');
    Route::post('/requests/{id}/cancel', [CanLamSangController::class, 'cancel'])->name('requests.cancel')->middleware('staff.checked_in');

    // Chấm công & Bảng lương Cận lâm sàng
    Route::get('/attendance', [ChamCongController::class, 'staffAttendancePage'])->name('attendance');
    Route::get('/payroll', [ChamCongController::class, 'staffAttendancePage'])->name('payroll');
    Route::post('/attendance/check-in', [ChamCongController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/check-out', [ChamCongController::class, 'checkOut'])->name('attendance.check-out');
    Route::post('/requests', [ChamCongController::class, 'storeRequest'])->name('requests.store');
    Route::post('/requests/{id}/peer-confirm', [ChamCongController::class, 'peerConfirmRequest'])->name('requests.peer-confirm');
});

// Admin Routes (Quản trị viên)
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:QUAN_TRI_VIEN'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');

    // Quản lý Nhân sự tập trung (Bác sĩ, Lễ tân, Cận lâm sàng, Dược sĩ)
    Route::get('/staff-management', [AdminController::class, 'staffManagementIndex'])->name('staff-management');
    Route::get('/personnel', function() { return redirect()->route('admin.staff-management'); })->name('personnel');

    // Quản lý Bác sĩ (hỗ trợ chuyển hướng & tương thích ngược)
    Route::get('/doctors', [BacSiController::class, 'adminIndex'])->name('doctors');
    Route::post('/doctors', [BacSiController::class, 'store'])->name('doctors.store');
    Route::put('/doctors/{id}', [BacSiController::class, 'update'])->name('doctors.update');
    Route::delete('/doctors/{id}', [BacSiController::class, 'destroy'])->name('doctors.destroy');

    // Quản lý Nhân sự (Lễ tân, Cận lâm sàng, Nhân viên khác)
    Route::get('/staffs', [NhanVienController::class, 'index'])->name('staffs');
    Route::post('/staffs', [NhanVienController::class, 'store'])->name('staffs.store');
    Route::put('/staffs/{id}', [NhanVienController::class, 'update'])->name('staffs.update');
    Route::post('/staffs/{id}/toggle', [NhanVienController::class, 'toggleStatus'])->name('staffs.toggle');
    Route::post('/staffs/{id}/account', [NhanVienController::class, 'createAccount'])->name('staffs.account');

    // Quản lý Tài khoản người dùng
    Route::get('/users', [AdminController::class, 'usersIndex'])->name('users');
    Route::get('/accounts', [AdminController::class, 'usersIndex'])->name('accounts');
    Route::post('/users', [AdminController::class, 'usersStore'])->name('users.store');
    Route::put('/users/{id}', [AdminController::class, 'usersUpdate'])->name('users.update');
    Route::post('/users/{id}/toggle', [AdminController::class, 'usersToggleStatus'])->name('users.toggle');

    // Quản lý Bệnh nhân
    Route::get('/patients', [AdminController::class, 'patientsIndex'])->name('patients');
    Route::get('/patients/{id}', [AdminController::class, 'patientsShow'])->name('patients.show');

    // Quản lý Danh mục Y tế tập trung (Chuyên khoa, Dịch vụ, Kho thuốc)
    Route::get('/medical-catalogs', [AdminController::class, 'medicalCatalogsIndex'])->name('medical-catalogs');
    Route::get('/catalogs', function() { return redirect()->route('admin.medical-catalogs'); })->name('catalogs');

    // Quản lý Chuyên khoa
    Route::get('/specialties', [AdminController::class, 'specialtiesIndex'])->name('specialties');
    Route::post('/specialties', [AdminController::class, 'specialtiesStore'])->name('specialties.store');
    Route::put('/specialties/{id}', [AdminController::class, 'specialtiesUpdate'])->name('specialties.update');

    // Quản lý Dịch vụ khám & Cận lâm sàng
    Route::get('/services', [AdminController::class, 'servicesIndex'])->name('services');
    Route::post('/services', [AdminController::class, 'servicesStore'])->name('services.store');
    Route::put('/services/{id}', [AdminController::class, 'servicesUpdate'])->name('services.update');

    // Quản lý kho Thuốc
    Route::get('/medicines', [ThuocController::class, 'index'])->name('medicines.index');
    Route::post('/medicines', [ThuocController::class, 'store'])->name('medicines.store');
    Route::put('/medicines/{id}', [ThuocController::class, 'update'])->name('medicines.update');
    Route::delete('/medicines/{id}', [ThuocController::class, 'destroy'])->name('medicines.destroy');

    // Quản lý Lịch làm việc & Ca khám toàn hệ thống
    Route::get('/schedules', [LichLamViecController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}', [LichLamViecController::class, 'show'])->name('schedules.show');
    Route::post('/schedules', [LichLamViecController::class, 'store'])->name('schedules.store');
    Route::put('/schedules/{id}', [LichLamViecController::class, 'update'])->name('schedules.update');
    Route::delete('/schedules/{id}', [LichLamViecController::class, 'destroy'])->name('schedules.destroy');
    Route::get('/attendance', [ChamCongController::class, 'index'])->name('attendance.index');
    Route::get('/payroll', [ChamCongController::class, 'adminPayrollPage'])->name('payroll.index');
    Route::post('/attendance/check-in', [ChamCongController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/attendance/check-out', [ChamCongController::class, 'checkOut'])->name('attendance.check-out');
    Route::get('/payroll-data', [ChamCongController::class, 'payroll'])->name('payroll.data');
    Route::post('/payroll/build-month', [ChamCongController::class, 'buildMonthlyPayroll'])->name('payroll.build-month');
    Route::post('/requests/{id}/approve', [ChamCongController::class, 'approveRequest'])->name('requests.approve');
    Route::post('/requests/{id}/reject', [ChamCongController::class, 'rejectRequest'])->name('requests.reject');
    Route::post('/ca-kham', [CaKhamController::class, 'store'])->name('ca-kham.store');
    Route::put('/ca-kham/{id}', [CaKhamController::class, 'update'])->name('ca-kham.update');

    // Quản lý Lịch hẹn & Lượt khám
    Route::get('/appointments', [LichHenController::class, 'index'])->name('appointments');
    Route::post('/appointments/{id}/status', [LichHenController::class, 'updateStatus'])->name('appointments.status');
    Route::get('/visits', [LuotKhamController::class, 'index'])->name('visits.index');

    // Quản lý Hóa đơn & Báo cáo tài chính
    Route::get('/invoices', [AdminController::class, 'invoicesIndex'])->name('invoices');
    Route::get('/reports', [AdminController::class, 'reportsIndex'])->name('reports');

    // Giám sát Vận hành Toàn viện (Tiếp đón & Hàng chờ + Cận lâm sàng)
    Route::get('/operations-monitor', [AdminController::class, 'operationsMonitorIndex'])->name('operations-monitor');

    // Giám sát Cận lâm sàng toàn viện (tương thích ngược)
    Route::get('/cls-monitor', [AdminController::class, 'clsMonitorIndex'])->name('cls-monitor');

    // Báo cáo & Giám sát Tiếp đón - Hàng chờ Toàn viện (tương thích ngược)
    Route::get('/reception-analytics', [AdminController::class, 'receptionAnalytics'])->name('reception-analytics');
    Route::get('/reception', function() { return redirect()->route('admin.operations-monitor', ['tab' => 'reception']); })->name('reception');
    Route::get('/queue', function() { return redirect()->route('admin.operations-monitor', ['tab' => 'reception']); })->name('queue');

    Route::get('/settings', function () { return redirect()->route('admin.dashboard'); })->name('settings');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Quản lý hồ sơ bệnh nhân (Xem chi tiết, danh sách, cập nhật)
    Route::get('/patients', [BenhNhanController::class, 'index'])->name('patients.index');
    Route::get('/patients/{id}', [BenhNhanController::class, 'show'])->name('patients.show');
    Route::put('/patients/{id}', [BenhNhanController::class, 'update'])->name('patients.update');

    // Xem chi tiết hồ sơ điều trị
    Route::get('/visits/{id}', [LuotKhamController::class, 'show'])->name('visits.show');
    Route::get('/prescriptions', [DonThuocController::class, 'index'])->name('prescriptions.index');
    Route::get('/prescriptions/{id}', [DonThuocController::class, 'show'])->name('prescriptions.show');
    Route::get('/service-requests/{id}', [ChiDinhDichVuController::class, 'show'])->name('service-requests.show');

    // Chấm công & Phê duyệt đơn chéo đồng nghiệp
    Route::post('/staff/requests/{id}/peer-confirm', [ChamCongController::class, 'peerConfirmRequest'])->name('staff.requests.peer-confirm');

    // AI Chatbot Trợ lý y tế thông minh (SmartCare AI Assistant)
    Route::get('/ai/conversations', [AiChatController::class, 'conversations'])->name('ai.conversations');
    Route::get('/ai/conversations/{id}', [AiChatController::class, 'show'])->name('ai.conversations.show');

    // Hệ thống thông báo SmartCare (Notifications)
    Route::get('/notifications', [ThongBaoController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [ThongBaoController::class, 'unreadCount'])->name('notifications.unreadCount');
    Route::post('/notifications/{id}/read', [ThongBaoController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('/notifications/read-all', [ThongBaoController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
});

// Endpoint gửi tin nhắn AI Chatbot (hỗ trợ cả khách và bệnh nhân, có giới hạn tốc độ chống spam)
Route::post('/ai/chat', [AiChatController::class, 'chat'])->middleware('throttle:20,1')->name('ai.chat');

require __DIR__.'/auth.php';