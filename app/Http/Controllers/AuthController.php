<?php

namespace App\Http\Controllers;

use App\Models\BenhNhan;
use App\Models\TaiKhoan;
use App\Models\VaiTro;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Hiển thị trang đăng ký
     */
    public function showRegister(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect($this->getRedirectUrlByRole(Auth::user()));
        }

        return Inertia::render('Auth/Register');
    }

    /**
     * Xử lý đăng ký tài khoản bệnh nhân mới
     * Sử dụng DB Transaction để đảm bảo tính toàn vẹn giữa bảng tai_khoan và benh_nhan.
     */
    public function register(Request $request)
    {
        // 1. Validation dữ liệu đầu vào
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:tai_khoan,Email'],
            'username' => ['nullable', 'string', 'max:100', 'unique:tai_khoan,TenDangNhap'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'name.required' => 'Vui lòng nhập họ và tên.',
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.unique' => 'Địa chỉ email này đã được sử dụng.',
            'username.unique' => 'Tên đăng nhập này đã được sử dụng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);

        // 2. Thực hiện transaction tạo tài khoản và hồ sơ bệnh nhân
        $taiKhoan = DB::transaction(function () use ($validated, $request) {
            // Lấy vai trò Bệnh nhân từ DB (xác minh động, không hardcode ID)
            $vaiTroBenhNhan = VaiTro::where('TenVaiTro', 'BENH_NHAN')->first();
            if (!$vaiTroBenhNhan) {
                throw new \RuntimeException('Không tìm thấy cấu hình vai trò BENH_NHAN trong hệ thống.');
            }
            $maVaiTro = $vaiTroBenhNhan->MaVaiTro;

            // Tên đăng nhập: nếu không nhập thì dùng email
            $tenDangNhap = !empty($validated['username']) ? $validated['username'] : $validated['email'];

            // A. Tạo tài khoản đăng nhập
            $taiKhoan = TaiKhoan::create([
                'MaVaiTro' => $maVaiTro,
                'TenDangNhap' => $tenDangNhap,
                'MatKhau' => Hash::make($validated['password']),
                'Email' => $validated['email'],
                'TrangThai' => 'HOAT_DONG',
                'NgayTao' => now(),
            ]);

            // B. Tạo hồ sơ bệnh nhân liên kết với tài khoản
            BenhNhan::create([
                'MaTaiKhoan' => $taiKhoan->MaTaiKhoan,
                'HoTen' => $validated['name'],
                'NgaySinh' => $request->input('date_of_birth'),
                'GioiTinh' => $request->input('gender'),
                'SoDienThoai' => $request->input('phone'),
                'DiaChi' => $request->input('address'),
                'EmailLienHe' => $validated['email'],
            ]);

            return $taiKhoan;
        });

        // 3. Tự động đăng nhập sau khi đăng ký thành công
        Auth::login($taiKhoan);
        $request->session()->regenerate();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đăng ký tài khoản thành công.',
                'user' => $taiKhoan->loadMissing(['vaiTro', 'benhNhan']),
                'redirect' => route('dashboard'),
            ], 201);
        }

        return redirect()->route('dashboard')->with('success', 'Đăng ký tài khoản thành công!');
    }

    /**
     * Hiển thị trang đăng nhập
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect($this->getRedirectUrlByRole(Auth::user()));
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => false,
            'status' => session('status'),
            'info' => session('info'),
        ]);
    }

    /**
     * Xử lý đăng nhập hệ thống
     * Hỗ trợ đăng nhập bằng Email hoặc Tên đăng nhập
     */
    public function login(Request $request)
    {
        // 1. Validation
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Vui lòng nhập email hoặc tên đăng nhập.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $loginInput = $credentials['email'];
        $password = $credentials['password'];
        $remember = $request->boolean('remember');

        // 2. Tìm tài khoản theo Email hoặc Tên đăng nhập
        $taiKhoan = TaiKhoan::with('vaiTro')
            ->where('Email', $loginInput)
            ->orWhere('TenDangNhap', $loginInput)
            ->first();

        // 3. Kiểm tra sự tồn tại của tài khoản
        if (!$taiKhoan) {
            throw ValidationException::withMessages([
                'email' => 'Thông tin đăng nhập hoặc mật khẩu không chính xác.',
            ]);
        }

        // 4. Kiểm tra trạng thái tài khoản
        if (strtoupper($taiKhoan->TrangThai) !== 'HOAT_DONG') {
            throw ValidationException::withMessages([
                'email' => 'Tài khoản của bạn đang bị khóa hoặc tạm dừng. Vui lòng liên hệ quản trị viên.',
            ]);
        }

        // 5. Kiểm tra mật khẩu
        if (!Hash::check($password, $taiKhoan->MatKhau)) {
            throw ValidationException::withMessages([
                'email' => 'Thông tin đăng nhập hoặc mật khẩu không chính xác.',
            ]);
        }

        // 6. Đăng nhập người dùng vào session
        Auth::login($taiKhoan, $remember);
        $request->session()->regenerate();

        // 7. Xác định trang chuyển hướng theo vai trò và intended URL
        $defaultUrl = $this->getRedirectUrlByRole($taiKhoan);
        $intendedUrl = $request->session()->pull('url.intended');

        // Logic phục hồi intended URL an toàn:
        // - Bệnh nhân: cho phép quay lại trang đặt lịch (/book) hoặc trang dự định
        // - Bác sĩ, Lễ tân, Quản trị viên: quay lại intended nếu thuộc phân hệ của họ, ngược lại ưu tiên Dashboard quản trị
        $redirectUrl = $defaultUrl;
        if ($intendedUrl) {
            if ($taiKhoan->isBenhNhan()) {
                $redirectUrl = $intendedUrl;
            } elseif ($taiKhoan->isQuanTriVien() && str_contains($intendedUrl, '/admin')) {
                $redirectUrl = $intendedUrl;
            } elseif ($taiKhoan->isBacSi() && str_contains($intendedUrl, '/doctor')) {
                $redirectUrl = $intendedUrl;
            } elseif ($taiKhoan->isLeTan() && str_contains($intendedUrl, '/receptionist')) {
                $redirectUrl = $intendedUrl;
            } elseif ($taiKhoan->isNhanVienCanLamSang() && str_contains($intendedUrl, '/cls')) {
                $redirectUrl = $intendedUrl;
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công.',
                'user' => $taiKhoan->loadMissing(['vaiTro', 'benhNhan', 'bacSi']),
                'role' => $taiKhoan->vaiTro?->TenVaiTro,
                'redirect' => $redirectUrl,
            ]);
        }

        return redirect()->to($redirectUrl);
    }

    /**
     * Xử lý đăng xuất khỏi hệ thống
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công.',
                'redirect' => url('/'),
            ]);
        }

        return redirect('/')
            ->withHeaders([
                'Cache-Control' => 'no-cache, no-store, max-age=0, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => 'Sun, 02 Jan 1990 00:00:00 GMT',
            ]);
    }

    /**
     * Lấy thông tin tài khoản hiện tại đang đăng nhập
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        $user->loadMissing(['vaiTro', 'benhNhan', 'bacSi.chuyenKhoa']);

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    /**
     * Xác định URL điều hướng dựa trên vai trò của tài khoản
     */
    protected function getRedirectUrlByRole(TaiKhoan $taiKhoan): string
    {
        $roleName = strtoupper($taiKhoan->vaiTro?->TenVaiTro ?? '');

        return match ($roleName) {
            'QUAN_TRI_VIEN' => route('admin.dashboard'),
            'BAC_SI' => route('doctor.dashboard'),
            'LE_TAN' => route('receptionist.dashboard'),
            'NHAN_VIEN_CAN_LAM_SANG' => route('cls.dashboard'),
            default => route('dashboard'), // BENH_NHAN
        };
    }
}
