<?php

namespace App\Http\Controllers;

use App\Models\ChiDinhDichVu;
use App\Models\ChiTietHoaDon;
use App\Models\DichVu;
use App\Models\DonThuoc;
use App\Models\HoaDon;
use App\Models\LuotKham;
use App\Models\ThanhToan;
use App\Models\Thuoc;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class HoaDonController extends Controller
{
    /**
     * 1. Danh sách hóa đơn (Dành cho Lễ tân / Thu ngân / Quản trị viên)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Phân quyền: Chỉ Lễ tân và Quản trị viên mới xem được toàn bộ danh sách hóa đơn thu ngân
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền truy cập quản lý hóa đơn thu ngân.'], 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50], true)) {
            $perPage = 10;
        }

        $unbilledPerPage = (int) $request->input('unbilled_per_page', 10);
        if (!in_array($unbilledPerPage, [10, 20, 50], true)) {
            $unbilledPerPage = 10;
        }

        $page = max(1, (int) $request->input('page', 1));
        $unbilledPage = max(1, (int) $request->input('unbilled_page', 1));

        $invoiceQuery = HoaDon::query()->with([
            'luotKham.benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,NgaySinh,DiaChi',
            'luotKham.bacSi:MaBacSi,HoTen',
            'chiTietHoaDons',
            'thanhToans',
        ]);

        if ($search = trim((string) $request->input('search', ''))) {
            $invoiceQuery->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('MaHoaDon', (int) $search)
                        ->orWhere('MaLuotKham', (int) $search)
                        ->orWhereHas('luotKham.benhNhan', function ($sub) use ($search) {
                            $sub->where('MaBenhNhan', (int) $search);
                        });
                }

                $q->orWhereHas('luotKham.benhNhan', function ($sub) use ($search) {
                    $sub->where('HoTen', 'like', "%{$search}%")
                        ->orWhere('SoDienThoai', 'like', "%{$search}%");
                });
            });
        }

        if ($date = $request->input('date')) {
            $invoiceQuery->whereDate('NgayTao', $date);
        }

        if ($status = $request->input('status')) {
            $invoiceQuery->where('TrangThai', $status);
        }

        $invoices = $invoiceQuery->orderBy('NgayTao', 'desc')->paginate($perPage, ['*'], 'page', $page)->withQueryString();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $invoices->items(),
                'total' => $invoices->total(),
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
            ]);
        }

        $today = now()->toDateString();
        $todayPayments = ThanhToan::whereDate('ThoiGianThanhToan', $today)
            ->where('TrangThai', 'DA_THANH_TOAN')
            ->sum('SoTien');

        $stats = [
            'todayRevenue' => (float) $todayPayments,
            'todayInvoices' => HoaDon::whereDate('NgayTao', $today)->count(),
            'unpaidCount' => HoaDon::whereIn('TrangThai', ['CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN'])->count(),
            'paidCount' => HoaDon::where('TrangThai', 'DA_THANH_TOAN')->count(),
        ];

        $unbilledQuery = LuotKham::query()->whereDoesntHave('hoaDon')
            ->whereIn('TrangThai', ['HOAN_THANH', 'DANG_KHAM'])
            ->with([
                'benhNhan:MaBenhNhan,HoTen,SoDienThoai,GioiTinh,SoTheBHYT,MucHuongBHYT',
                'bacSi:MaBacSi,HoTen',
                'donThuoc.chiTietDonThuocs.thuoc:MaThuoc,TenThuoc,DonGia,DonViTinh,ApDungBHYT',
                'chiDinhDichVus.dichVu:MaDichVu,TenDichVu,DonGia,ApDungBHYT',
            ]);

        if ($unbilledSearch = trim((string) $request->input('unbilled_search', ''))) {
            $unbilledQuery->where(function ($q) use ($unbilledSearch) {
                $q->where('MaLuotKham', (int) $unbilledSearch)
                    ->orWhereHas('benhNhan', function ($sub) use ($unbilledSearch) {
                        $sub->where('MaBenhNhan', (int) $unbilledSearch)
                            ->orWhere('HoTen', 'like', "%{$unbilledSearch}%")
                            ->orWhere('SoDienThoai', 'like', "%{$unbilledSearch}%");
                    });
            });
        }

        $unbilledVisits = $unbilledQuery->orderBy('ThoiGianTiepNhan', 'desc')->paginate($unbilledPerPage, ['*'], 'unbilled_page', $unbilledPage)->withQueryString();

        return Inertia::render('Receptionist/Payment', [
            'invoices' => $invoices,
            'unbilledVisits' => $unbilledVisits,
            'stats' => $stats,
            'filters' => [
                'search' => $request->input('search', ''),
                'date' => $request->input('date', ''),
                'status' => $request->input('status', ''),
                'per_page' => $perPage,
                'page' => $page,
                'unbilled_search' => $request->input('unbilled_search', ''),
                'unbilled_per_page' => $unbilledPerPage,
                'unbilled_page' => $unbilledPage,
            ],
        ]);
    }

    /**
     * 2. Xem chi tiết hóa đơn
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $invoice = HoaDon::with([
            'luotKham.benhNhan',
            'luotKham.bacSi.chuyenKhoa',
            'chiTietHoaDons.chiDinhDichVu.dichVu',
            'chiTietHoaDons.chiTietDonThuoc.thuoc',
            'thanhToans',
        ])->find($id);

        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn.'], 404);
        }

        // Bảo mật: Bệnh nhân chỉ được xem hóa đơn của chính mình
        if ($user && $user->isBenhNhan()) {
            if ($user->benhNhan?->MaBenhNhan !== $invoice->luotKham?->MaBenhNhan) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem hóa đơn của bệnh nhân khác.'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    /**
     * 3. Tạo hóa đơn từ lượt khám
     * - Tự động tổng hợp chi phí thuốc và dịch vụ từ cơ sở dữ liệu
     * - Đơn giá tuyệt đối lấy từ DB, không tin tưởng client
     * - Chặn tạo trùng hóa đơn cho cùng một lượt khám
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // 1. Phân quyền: Chỉ Lễ tân hoặc Admin mới có quyền lập hóa đơn
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền lập hóa đơn thu phí.'], 403);
        }

        $validated = $request->validate([
            'MaLuotKham' => ['required', 'exists:luot_kham,MaLuotKham'],
            'TienKham' => ['nullable', 'numeric', 'min:0'],
            'GiamGia' => ['nullable', 'numeric', 'min:0'],
            'BaoHiemChiTra' => ['nullable', 'numeric', 'min:0'],
            'GhiChu' => ['nullable', 'string', 'max:1000'],
        ], [
            'MaLuotKham.required' => 'Vui lòng chọn lượt khám cần lập hóa đơn.',
            'TienKham.min' => 'Tiền khám không được âm.',
            'GiamGia.min' => 'Giảm giá không được âm.',
            'BaoHiemChiTra.min' => 'Bảo hiểm chi trả không được âm.',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $user = $request->user();
            $maLuotKham = $validated['MaLuotKham'];

            // Khóa dòng lượt khám để chống race condition
            $luotKham = LuotKham::with([
                'benhNhan',
                'donThuoc.chiTietDonThuocs.thuoc',
                'chiDinhDichVus.dichVu',
            ])->lockForUpdate()->find($maLuotKham);

            if ($luotKham->TrangThai === 'DA_HUY') {
                throw ValidationException::withMessages([
                    'MaLuotKham' => 'Lượt khám đã bị hủy, không thể lập hóa đơn.',
                ]);
            }

            // Chặn tạo trùng hóa đơn cho cùng một lượt khám
            $existingInvoice = HoaDon::where('MaLuotKham', $maLuotKham)->lockForUpdate()->first();
            if ($existingInvoice) {
                throw ValidationException::withMessages([
                    'MaLuotKham' => "Lượt khám #{$maLuotKham} đã được lập hóa đơn trước đó (Mã HĐ: #{$existingInvoice->MaHoaDon}).",
                ]);
            }

            $items = [];
            $seenMedDetails = [];
            $seenServiceIds = [];

            $mucHuongBHYT = ($luotKham->CoBHYT || (!empty($luotKham->SoTheBHYT) && (int)($luotKham->MucHuongBHYT ?? 0) > 0)) 
                ? (int)($luotKham->MucHuongBHYT ?? 80) 
                : 0;

            // 1. Phí khám bệnh (nếu có truyền hoặc mặc định)
            $tienKham = (float)($validated['TienKham'] ?? 0);
            if ($tienKham > 0) {
                $items[] = [
                    'LoaiChiPhi' => 'KHAM',
                    'NoiDung' => 'Phí khám lâm sàng ban đầu',
                    'SoLuong' => 1,
                    'DonGia' => $tienKham,
                    'DuocBHYTChiTra' => ($mucHuongBHYT > 0),
                    'MaChiDinh' => null,
                    'MaChiTietDonThuoc' => null,
                ];
            }

            // 2. Chi phí Thuốc từ tất cả đơn thuốc hợp lệ của lượt khám (loại trừ đơn đã hủy)
            $activeDonThuocs = DonThuoc::where('MaLuotKham', $maLuotKham)
                ->where('TrangThai', '!=', 'DA_HUY')
                ->with('chiTietDonThuocs.thuoc')
                ->get();

            foreach ($activeDonThuocs as $donThuoc) {
                foreach ($donThuoc->chiTietDonThuocs as $ct) {
                    if (in_array($ct->MaChiTietDonThuoc, $seenMedDetails)) {
                        continue;
                    }
                    $seenMedDetails[] = $ct->MaChiTietDonThuoc;

                    $thuoc = $ct->thuoc ?? Thuoc::find($ct->MaThuoc);
                    $donGiaThuoc = ((float)$ct->DonGia > 0) ? (float)$ct->DonGia : ($thuoc ? (float)$thuoc->DonGia : 0);
                    $duocBHYT = ($thuoc ? (bool)$thuoc->ApDungBHYT : true) && ($mucHuongBHYT > 0);

                    $items[] = [
                        'LoaiChiPhi' => 'THUOC',
                        'NoiDung' => $thuoc ? $thuoc->TenThuoc : 'Thuốc điều trị',
                        'SoLuong' => (int)$ct->SoLuong,
                        'DonGia' => $donGiaThuoc,
                        'DuocBHYTChiTra' => $duocBHYT,
                        'MaChiDinh' => null,
                        'MaChiTietDonThuoc' => $ct->MaChiTietDonThuoc,
                    ];
                }
            }

            // 3. Chi phí Dịch vụ cận lâm sàng từ chỉ định hợp lệ (loại trừ dịch vụ đã hủy)
            $activeChiDinhs = ChiDinhDichVu::where('MaLuotKham', $maLuotKham)
                ->where('TrangThai', '!=', 'DA_HUY')
                ->with('dichVu')
                ->get();

            foreach ($activeChiDinhs as $cd) {
                if (in_array($cd->MaChiDinh, $seenServiceIds)) {
                    continue;
                }
                $seenServiceIds[] = $cd->MaChiDinh;

                $dichVu = $cd->dichVu ?? DichVu::find($cd->MaDichVu);
                $donGiaDV = ((float)$cd->DonGia > 0) ? (float)$cd->DonGia : ($dichVu ? (float)$dichVu->DonGia : 0);
                $duocBHYT = ($dichVu ? (bool)$dichVu->ApDungBHYT : true) && ($mucHuongBHYT > 0);

                $items[] = [
                    'LoaiChiPhi' => 'DICH_VU',
                    'NoiDung' => $dichVu ? $dichVu->TenDichVu : 'Dịch vụ kỹ thuật',
                    'SoLuong' => 1,
                    'DonGia' => $donGiaDV,
                    'DuocBHYTChiTra' => $duocBHYT,
                    'MaChiDinh' => $cd->MaChiDinh,
                    'MaChiTietDonThuoc' => null,
                ];
            }

            // Tính toán số tiền tự động: Tổng chi phí và phần BHYT chi trả
            $tongTien = 0;
            $autoBaoHiemChiTra = 0;

            foreach ($items as &$item) {
                $lineTotal = round($item['SoLuong'] * $item['DonGia'], 2);
                $tongTien += $lineTotal;

                if ($item['DuocBHYTChiTra'] && $mucHuongBHYT > 0) {
                    $lineBHYT = round($lineTotal * ($mucHuongBHYT / 100), 2);
                    $lineBN = round($lineTotal - $lineBHYT, 2);
                } else {
                    $lineBHYT = 0;
                    $lineBN = $lineTotal;
                }

                $item['TienBHYTChiTra'] = $lineBHYT;
                $item['TienBenhNhanChiTra'] = $lineBN;
                $autoBaoHiemChiTra += $lineBHYT;
            }
            unset($item);

            $tongTien = round($tongTien, 2);
            $giamGia = round((float)($validated['GiamGia'] ?? 0), 2);

            // Nếu người dùng có nhập tay số tiền BHYT thì ưu tiên giá trị nhập, ngược lại dùng số tiền tự động tính
            $baoHiem = array_key_exists('BaoHiemChiTra', $validated) && $validated['BaoHiemChiTra'] !== null
                ? round((float)$validated['BaoHiemChiTra'], 2)
                : round($autoBaoHiemChiTra, 2);

            if (($giamGia + $baoHiem) > $tongTien) {
                throw ValidationException::withMessages([
                    'GiamGia' => 'Tổng tiền giảm giá và bảo hiểm chi trả không được vượt quá tổng chi phí hóa đơn.',
                ]);
            }

            // Bảo đảm tuân thủ nghiêm ngặt ràng buộc MySQL: chk_hoadon_cong_no
            // BenhNhanChiTra = TongTien - GiamGia - BaoHiemChiTra
            $benhNhanChiTra = round($tongTien - $giamGia - $baoHiem, 2);
            $trangThai = ($benhNhanChiTra == 0) ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN';

            // Tạo Hóa Đơn với giá trị 0 trước để tránh xung đột trigger MySQL sp_cap_nhat_tong_hoa_don khi chèn từng dòng
            $hoaDon = HoaDon::create([
                'MaLuotKham' => $luotKham->MaLuotKham,
                'TongTien' => 0,
                'GiamGia' => 0,
                'BaoHiemChiTra' => 0,
                'BenhNhanChiTra' => 0,
                'TrangThai' => $trangThai,
                'MaTaiKhoanThu' => $user?->MaTaiKhoan,
                'NgayTao' => now(),
                'GhiChu' => $validated['GhiChu'] ?? null,
            ]);

            // Tạo từng Chi Tiết Hóa Đơn
            foreach ($items as $item) {
                ChiTietHoaDon::create([
                    'MaHoaDon' => $hoaDon->MaHoaDon,
                    'LoaiChiPhi' => $item['LoaiChiPhi'],
                    'NoiDung' => $item['NoiDung'],
                    'SoLuong' => $item['SoLuong'],
                    'DonGia' => $item['DonGia'],
                    'DuocBHYTChiTra' => $item['DuocBHYTChiTra'],
                    'TienBHYTChiTra' => $item['TienBHYTChiTra'],
                    'TienBenhNhanChiTra' => $item['TienBenhNhanChiTra'],
                    'MaChiDinh' => $item['MaChiDinh'],
                    'MaChiTietDonThuoc' => $item['MaChiTietDonThuoc'],
                ]);
            }

            // Cập nhật giá trị chốt sau khi toàn bộ chi tiết đã được ghi nhận đầy đủ
            DB::table('hoa_don')->where('MaHoaDon', $hoaDon->MaHoaDon)->update([
                'TongTien' => $tongTien,
                'GiamGia' => $giamGia,
                'BaoHiemChiTra' => $baoHiem,
                'BenhNhanChiTra' => $benhNhanChiTra,
            ]);
            $hoaDon->refresh();

            $loadedInvoice = $hoaDon->load([
                'luotKham.benhNhan',
                'chiTietHoaDons',
                'thanhToans',
            ]);

            // Kích hoạt thông báo cho Bệnh nhân
            NotificationService::sendToPatient(
                $luotKham->MaBenhNhan,
                'HOA_DON',
                'Hóa đơn viện phí mới',
                "Hóa đơn #{$hoaDon->MaHoaDon} đã được tạo với số tiền cần thanh toán: " . number_format($benhNhanChiTra) . " đ.",
                '/patient/billing'
            );

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', "Lập hóa đơn #{$hoaDon->MaHoaDon} thành công. Tổng tiền: " . number_format($benhNhanChiTra) . " đ.");
            }

            return response()->json([
                'success' => true,
                'message' => 'Lập hóa đơn thành công.',
                'data' => $loadedInvoice,
            ], 201);
        });
    }

    /**
     * 4. Ghi nhận thanh toán hóa đơn
     * - Hỗ trợ thanh toán toàn bộ hoặc thanh toán một phần
     * - Chặn thanh toán vượt quá số tiền còn nợ
     * - Chống race condition với lockForUpdate
     */
    public function pay(Request $request, int $id)
    {
        $user = $request->user();

        // Chỉ Lễ tân hoặc Admin mới được thu tiền
        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền thu tiền thanh toán.'], 403);
        }

        $validated = $request->validate([
            'SoTien' => ['required', 'numeric', 'gt:0'],
            'PhuongThucThanhToan' => ['required', 'string', 'in:TIEN_MAT,CHUYEN_KHOAN,THE'],
            'GhiChu' => ['nullable', 'string', 'max:500'],
            'MaGiaoDich' => ['nullable', 'string', 'max:100'],
        ], [
            'SoTien.required' => 'Vui lòng nhập số tiền thanh toán.',
            'SoTien.gt' => 'Số tiền thanh toán phải lớn hơn 0.',
            'PhuongThucThanhToan.required' => 'Vui lòng chọn phương thức thanh toán.',
            'PhuongThucThanhToan.in' => 'Phương thức thanh toán không hợp lệ (hỗ trợ TIEN_MAT, CHUYEN_KHOAN, THE).',
        ]);

        return DB::transaction(function () use ($id, $validated, $request) {
            $user = $request->user();
            $hoaDon = HoaDon::with('thanhToans')->lockForUpdate()->find($id);

            if (!$hoaDon) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn.'], 404);
            }

            if ($hoaDon->TrangThai === 'DA_HUY') {
                throw ValidationException::withMessages([
                    'SoTien' => 'Hóa đơn này đã bị hủy, không thể thực hiện thanh toán.',
                ]);
            }

            // 1. Kiểm tra Idempotency trước tiên: Nhận diện request trùng lặp qua MaGiaoDich (nếu client cung cấp)
            if (!empty($validated['MaGiaoDich'])) {
                $existingPayment = ThanhToan::where('MaGiaoDich', $validated['MaGiaoDich'])
                    ->lockForUpdate()
                    ->first();

                if ($existingPayment) {
                    // Kiểm tra an toàn: Chặn xung đột Idempotency Key
                    // 1a. Nếu MaGiaoDich thuộc về hóa đơn khác -> Từ chối ngay lập tức
                    if ($existingPayment->MaHoaDon != $hoaDon->MaHoaDon) {
                        throw ValidationException::withMessages([
                            'MaGiaoDich' => "Mã giao dịch '{$validated['MaGiaoDich']}' đã được sử dụng cho một hóa đơn khác (#HD{$existingPayment->MaHoaDon}). Không thể tái sử dụng.",
                        ]);
                    }

                    // 1b. Nếu cùng hóa đơn nhưng khác số tiền -> Từ chối ngay lập tức
                    if (abs((float)$existingPayment->SoTien - (float)$validated['SoTien']) > 0.01) {
                        throw ValidationException::withMessages([
                            'SoTien' => "Mã giao dịch '{$validated['MaGiaoDich']}' đã được xử lý trước đó với số tiền khác (" . number_format($existingPayment->SoTien) . " đ thay vì " . number_format($validated['SoTien']) . " đ).",
                        ]);
                    }

                    // 1c. Đúng cùng hóa đơn, cùng số tiền -> Request retry hợp lệ (Idempotent)
                    if ($request->header('X-Inertia')) {
                        return redirect()->back()->with('success', "Giao dịch thanh toán (Mã: {$existingPayment->MaGiaoDich}) đã được ghi nhận trước đó.");
                    }

                    return response()->json([
                        'success' => true,
                        'message' => 'Giao dịch thanh toán đã được xử lý trước đó (Idempotent request).',
                        'data' => [
                            'thanhToan' => $existingPayment,
                            'hoaDon' => $hoaDon->fresh(['thanhToans']),
                        ],
                    ], 200);
                }
            }

            // 2. Chặn thanh toán nếu hóa đơn đã được thanh toán đầy đủ (cho giao dịch mới)
            if ($hoaDon->TrangThai === 'DA_THANH_TOAN') {
                throw ValidationException::withMessages([
                    'SoTien' => 'Hóa đơn này đã được thanh toán đầy đủ.',
                ]);
            }

            // Tính số tiền đã thanh toán trước đó với lockForUpdate
            $daThanhToan = (float)ThanhToan::where('MaHoaDon', $hoaDon->MaHoaDon)
                ->where('TrangThai', 'DA_THANH_TOAN')
                ->lockForUpdate()
                ->sum('SoTien');

            $conNo = round((float)$hoaDon->BenhNhanChiTra - $daThanhToan, 2);
            $conNo = max(0, $conNo);

            $soTienThanhToan = round((float)$validated['SoTien'], 2);

            if ($soTienThanhToan > $conNo) {
                throw ValidationException::withMessages([
                    'SoTien' => "Số tiền thanh toán (" . number_format($soTienThanhToan) . " đ) vượt quá số tiền còn nợ (" . number_format($conNo) . " đ).",
                ]);
            }

            // Tạo mã giao dịch duy nhất nếu chưa có
            $maGiaoDich = !empty($validated['MaGiaoDich']) 
                ? $validated['MaGiaoDich'] 
                : ('TXN_' . $hoaDon->MaHoaDon . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)));

            // Ghi nhận bản ghi Thanh Toán
            $thanhToan = ThanhToan::create([
                'MaHoaDon' => $hoaDon->MaHoaDon,
                'SoTien' => $soTienThanhToan,
                'PhuongThucThanhToan' => $validated['PhuongThucThanhToan'],
                'ThoiGianThanhToan' => now(),
                'TrangThai' => 'DA_THANH_TOAN',
                'MaGiaoDich' => $maGiaoDich,
                'MaTaiKhoanThu' => $user?->MaTaiKhoan,
                'GhiChu' => $validated['GhiChu'] ?? 'Thu tiền thanh toán viện phí',
                'NgayTao' => now(),
            ]);

            // Cập nhật trạng thái Hóa Đơn và ghi nhận người thu
            $tongDaTraMoi = round($daThanhToan + $soTienThanhToan, 2);
            $hoaDonUpdateData = ['MaTaiKhoanThu' => $user?->MaTaiKhoan];
            if ($tongDaTraMoi >= (float)$hoaDon->BenhNhanChiTra) {
                $hoaDonUpdateData['TrangThai'] = 'DA_THANH_TOAN';
            } else {
                $hoaDonUpdateData['TrangThai'] = 'THANH_TOAN_MOT_PHAN';
            }
            $hoaDon->update($hoaDonUpdateData);

            // Kích hoạt thông báo cho Bệnh nhân
            $maBenhNhan = $hoaDon->luotKham?->MaBenhNhan;
            if ($maBenhNhan) {
                NotificationService::sendToPatient(
                    $maBenhNhan,
                    'THANH_TOAN',
                    'Thanh toán viện phí thành công',
                    "Giao dịch thanh toán " . number_format($soTienThanhToan) . " đ cho hóa đơn #{$hoaDon->MaHoaDon} đã thành công.",
                    '/patient/billing'
                );
            }

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', "Đã ghi nhận thanh toán " . number_format($soTienThanhToan) . " đ thành công.");
            }

            return response()->json([
                'success' => true,
                'message' => 'Ghi nhận thanh toán thành công.',
                'data' => [
                    'thanhToan' => $thanhToan,
                    'hoaDon' => $hoaDon->fresh(['thanhToans']),
                ],
            ]);
        });
    }

    /**
     * 5. Hủy hóa đơn
     */
    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        if (!$user || (!$user->isLeTan() && !$user->isQuanTriVien())) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy hóa đơn.'], 403);
        }

        return DB::transaction(function () use ($id, $request) {
            $hoaDon = HoaDon::lockForUpdate()->find($id);

            if (!$hoaDon) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy hóa đơn.'], 404);
            }

            if ($hoaDon->TrangThai === 'DA_HUY') {
                return response()->json(['success' => false, 'message' => 'Hóa đơn này đã được hủy trước đó.'], 422);
            }

            // Kiểm tra: nếu đã phát sinh thanh toán thành công thì không thể hủy trực tiếp
            $hasPaid = ThanhToan::where('MaHoaDon', $hoaDon->MaHoaDon)
                ->where('TrangThai', 'DA_THANH_TOAN')
                ->lockForUpdate()
                ->exists();

            if ($hasPaid) {
                throw ValidationException::withMessages([
                    'invoice' => 'Hóa đơn đã có giao dịch thanh toán thành công, không thể hủy trực tiếp.',
                ]);
            }

            $hoaDon->update(['TrangThai' => 'DA_HUY']);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', "Đã hủy hóa đơn #{$hoaDon->MaHoaDon}.");
            }

            return response()->json([
                'success' => true,
                'message' => 'Hủy hóa đơn thành công.',
                'data' => $hoaDon->fresh(),
            ]);
        });
    }

    /**
     * 6. Tra cứu hóa đơn của Bệnh nhân đang đăng nhập
     */
    public function patientInvoices(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isBenhNhan()) {
            return response()->json(['success' => false, 'message' => 'Tài khoản không phải là Bệnh nhân.'], 403);
        }

        $maBenhNhan = $user->benhNhan?->MaBenhNhan;
        if (!$maBenhNhan) {
            return response()->json(['success' => false, 'message' => 'Chưa có hồ sơ bệnh nhân.'], 404);
        }

        $invoices = HoaDon::whereHas('luotKham', function ($q) use ($maBenhNhan) {
            $q->where('MaBenhNhan', $maBenhNhan);
        })->with([
            'luotKham.bacSi:MaBacSi,HoTen',
            'chiTietHoaDons',
            'thanhToans',
        ])->orderBy('NgayTao', 'desc')->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $invoices,
                'total' => $invoices->count(),
            ]);
        }

        return Inertia::render('Patient/Billing', [
            'invoices' => $invoices,
        ]);
    }
}
