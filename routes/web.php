<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public & Patient routes
Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/book', function () {
    return Inertia::render('Book');
});

Route::get('/specialties', function () {
    return Inertia::render('Specialties/Index');
});

Route::get('/doctors', function () {
    return Inertia::render('Doctors/Index');
});

Route::get('/services', function () {
    return Inertia::render('Services/Index');
});

Route::get('/appointments', function () {
    return Inertia::render('Appointments');
});

Route::get('/dashboard', function () {
    return Inertia::render('Patient/Dashboard');
})->name('dashboard');

Route::get('/patient/history', function () {
    return Inertia::render('Patient/History');
})->name('patient.history');

Route::get('/patient/records', function () { return Inertia::render('Placeholder', ['role' => 'patient', 'title' => 'Hồ sơ sức khỏe']); });
Route::get('/patient/tests', function () { return Inertia::render('Placeholder', ['role' => 'patient', 'title' => 'Kết quả xét nghiệm']); });
Route::get('/patient/prescriptions', function () { return Inertia::render('Patient/Prescriptions'); });
Route::get('/patient/billing', function () { return Inertia::render('Placeholder', ['role' => 'patient', 'title' => 'Hóa đơn & thanh toán']); });

// Doctor Routes
Route::prefix('doctor')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Doctor/Dashboard'); })->name('doctor.dashboard');
    Route::get('/examine', function () { return Inertia::render('Doctor/Examine'); })->name('doctor.examine');
    Route::get('/schedule', function () { return Inertia::render('Doctor/Schedule'); });
    Route::get('/patients', function () { return Inertia::render('Placeholder', ['role' => 'doctor', 'title' => 'Bệnh nhân của tôi']); });
    Route::get('/stats', function () { return Inertia::render('Placeholder', ['role' => 'doctor', 'title' => 'Thống kê']); });
});

// Receptionist Routes
Route::prefix('receptionist')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Receptionist/Dashboard'); })->name('receptionist.dashboard');
    Route::get('/payment', function () { return Inertia::render('Receptionist/Payment'); })->name('receptionist.payment');
    Route::get('/queue', function () { return Inertia::render('Receptionist/Queue'); });
    Route::get('/records', function () { return Inertia::render('Placeholder', ['role' => 'receptionist', 'title' => 'Hồ sơ bệnh nhân']); });
});

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Admin/Dashboard'); })->name('admin.dashboard');
    Route::get('/doctors', function () { return Inertia::render('Admin/Doctors'); })->name('admin.doctors');
    Route::get('/specialties', function () { return Inertia::render('Placeholder', ['role' => 'admin', 'title' => 'Quản lý Chuyên khoa']); });
    Route::get('/services', function () { return Inertia::render('Placeholder', ['role' => 'admin', 'title' => 'Quản lý Dịch vụ']); });
    Route::get('/users', function () { return Inertia::render('Placeholder', ['role' => 'admin', 'title' => 'Quản lý Người dùng']); });
    Route::get('/settings', function () { return Inertia::render('Placeholder', ['role' => 'admin', 'title' => 'Cấu hình hệ thống']); });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
