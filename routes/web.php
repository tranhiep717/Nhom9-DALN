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

// Doctor Routes
Route::prefix('doctor')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Doctor/Dashboard'); })->name('doctor.dashboard');
    Route::get('/examine', function () { return Inertia::render('Doctor/Examine'); })->name('doctor.examine');
});

// Receptionist Routes
Route::prefix('receptionist')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Receptionist/Dashboard'); })->name('receptionist.dashboard');
    Route::get('/payment', function () { return Inertia::render('Receptionist/Payment'); })->name('receptionist.payment');
});

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Admin/Dashboard'); })->name('admin.dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
