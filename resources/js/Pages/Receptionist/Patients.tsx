import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';
import {
    FileText,
    Search,
    User,
    Phone,
    MapPin,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    RefreshCw,
    X,
    Clock,
    Activity,
    ShieldCheck,
    CheckCircle2,
    CalendarClock,
    Loader2,
} from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Patient {
    MaBenhNhan: number;
    HoTen: string;
    GioiTinh: 'Nam' | 'Nu' | 'Khac' | string | null;
    NgaySinh: string | null;
    SoDienThoai: string | null;
    DiaChi: string | null;
    EmailLienHe: string | null;
    MaTaiKhoan: number | null;
}

interface VisitSummary {
    MaLuotKham: number;
    ThoiGianTiepNhan: string;
    TrangThai: string;
    SoPhieu: string | null;
    STTTrongNgay: number | null;
    LoaiHangDoi: string | null;
    LyDoKham: string | null;
}

interface AppointmentSummary {
    MaLichHen: number;
    NgayHen: string;
    TrangThai: string;
    GhiChu: string | null;
}

interface PatientDetail extends Patient {
    taiKhoan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
        TrangThai: string;
    } | null;
    luotKhams?: VisitSummary[];
    lichHens?: AppointmentSummary[];
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface PaginatedPatients extends PaginationMeta {
    data: Patient[];
    path: string;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface PatientsProps {
    auth: { user: any };
    patients: PaginatedPatients;
    filters: {
        search: string;
        per_page: number;
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

function calcAge(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
        const birth = new Date(dateStr);
        if (isNaN(birth.getTime())) return '';
        const age = new Date().getFullYear() - birth.getFullYear();
        return `(${age} tuổi)`;
    } catch {
        return '';
    }
}

function genderLabel(g: Patient['GioiTinh']): { text: string; cls: string } {
    const val = (g || '').toUpperCase();
    if (val === 'NAM') return { text: 'Nam', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (val === 'NU' || val === 'NỮ')  return { text: 'Nữ', cls: 'bg-pink-100 text-pink-700 border-pink-200' };
    return { text: 'Khác', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function patientCode(id: number): string {
    return `BN${String(id).padStart(6, '0')}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReceptionistPatients({ auth, patients, filters }: PatientsProps) {
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Chi tiết bệnh nhân (Modal)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [detailData, setDetailData] = useState<PatientDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Điều hướng có giữ filter
    const navigate = useCallback((params: Record<string, string | number>) => {
        router.get('/receptionist/records', params as any, {
            preserveState: true,
            preserveScroll: false,
            replace: true,
        });
    }, []);

    const handleSearch = (value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({ search: value, per_page: perPage, page: 1 });
        }, 400);
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        navigate({ search: searchInput, per_page: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        navigate({ search: searchInput, per_page: perPage, page });
    };

    const handleReset = () => {
        setSearchInput('');
        setPerPage(10);
        navigate({ search: '', per_page: 10, page: 1 });
    };

    // Mở chi tiết hồ sơ bệnh nhân
    const handleOpenDetail = async (p: Patient) => {
        setSelectedPatient(p);
        setDetailData(p as PatientDetail);
        setIsLoadingDetail(true);

        try {
            const res = await axios.get(`/receptionist/records/${p.MaBenhNhan}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (res.data?.success && res.data?.data) {
                setDetailData(res.data.data);
            }
        } catch {
            // Giữ lại dữ liệu hàng nếu có lỗi mạng
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedPatient(null);
        setDetailData(null);
    };

    const { data: patientList, current_page, last_page, from, to, total, per_page: activePP } = patients;

    // Phân trang
    const pageButtons = (() => {
        const pages: (number | '...')[] = [];
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current_page > 3) pages.push('...');
            const start = Math.max(2, current_page - 1);
            const end = Math.min(last_page - 1, current_page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current_page < last_page - 2) pages.push('...');
            pages.push(last_page);
        }
        return pages;
    })();

    return (
        <>
            <Head title="Hồ sơ bệnh nhân – SmartCare" />
            <DashboardLayout role="receptionist" navItems={RECEPTIONIST_NAV_ITEMS} user={auth.user}>

                {/* ── Header ── */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Hồ sơ bệnh nhân
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tra cứu, xem thông tin chi tiết và lịch sử khám của bệnh nhân
                        </p>
                    </div>

                    <button
                        onClick={() => router.visit('/receptionist/queue')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
                    >
                        <CalendarClock className="w-4 h-4" />
                        Đến quầy tiếp nhận
                    </button>
                </div>

                {/* ── Thanh tìm kiếm & bộ lọc ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        {/* Ô tìm kiếm */}
                        <div className="relative flex-1 min-w-0 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Tìm theo tên bệnh nhân, số điện thoại hoặc mã bệnh nhân..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                        </div>

                        {/* Chọn số dòng hiển thị */}
                        <div className="flex items-center gap-2 shrink-0">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</label>
                            <select
                                value={activePP}
                                onChange={e => handlePerPageChange(Number(e.target.value))}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                {[10, 20, 50].map(n => (
                                    <option key={n} value={n}>{n} bản ghi/trang</option>
                                ))}
                            </select>
                        </div>

                        {/* Nút reset */}
                        {(searchInput || activePP !== 10) && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition shrink-0"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Đặt lại
                            </button>
                        )}
                    </div>

                    {/* Thống kê tổng */}
                    <div className="mt-3 text-xs text-gray-500">
                        {total > 0
                            ? <>Đang hiển thị <span className="font-semibold text-gray-800">{from}–{to}</span> trong tổng số <span className="font-semibold text-gray-800">{total}</span> hồ sơ</>
                            : 'Không tìm thấy hồ sơ nào khớp với từ khóa tìm kiếm.'}
                    </div>
                </div>

                {/* ── Bảng danh sách bệnh nhân ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {patientList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <User className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-base font-semibold text-gray-700">Không tìm thấy bệnh nhân</p>
                            <p className="text-sm mt-1 text-gray-500">
                                {searchInput
                                    ? `Không có kết quả nào khớp với "${searchInput}"`
                                    : 'Chưa có hồ sơ bệnh nhân nào trong hệ thống.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50/75 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Mã BN</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                                        <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Giới tính</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Ngày sinh</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Số điện thoại</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                        <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {patientList.map(p => {
                                        const gender = genderLabel(p.GioiTinh);
                                        return (
                                            <tr key={p.MaBenhNhan} className="hover:bg-slate-50/60 transition-colors">
                                                {/* Mã BN */}
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-block bg-primary/10 text-primary font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                                                        {patientCode(p.MaBenhNhan)}
                                                    </span>
                                                </td>

                                                {/* Họ tên */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                            {p.HoTen ? p.HoTen.charAt(0).toUpperCase() : 'B'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{p.HoTen}</div>
                                                            {p.EmailLienHe && (
                                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {p.EmailLienHe}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Giới tính */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${gender.cls}`}>
                                                        {gender.text}
                                                    </span>
                                                </td>

                                                {/* Ngày sinh */}
                                                <td className="px-4 py-3.5 text-gray-600">
                                                    <div className="font-medium text-gray-800">{formatDate(p.NgaySinh)}</div>
                                                    <div className="text-xs text-gray-400">{calcAge(p.NgaySinh)}</div>
                                                </td>

                                                {/* Số điện thoại */}
                                                <td className="px-4 py-3.5">
                                                    {p.SoDienThoai ? (
                                                        <div className="flex items-center gap-1.5 text-gray-800 font-medium font-mono text-xs">
                                                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            {p.SoDienThoai}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>

                                                {/* Địa chỉ */}
                                                <td className="px-4 py-3.5">
                                                    {p.DiaChi ? (
                                                        <div className="flex items-start gap-1.5 text-gray-600 max-w-xs">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-1 text-xs">{p.DiaChi}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>

                                                {/* Nút xem chi tiết */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        onClick={() => handleOpenDetail(p)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 rounded-lg text-xs font-medium transition"
                                                        title="Xem hồ sơ chi tiết"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Phân trang ── */}
                    {last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3.5 border-t border-gray-100 bg-gray-50/50 gap-3">
                            <div className="text-xs text-gray-500">
                                Trang <span className="font-semibold text-gray-700">{current_page}</span> / {last_page}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={current_page === 1}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-600"
                                    title="Trang đầu"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(current_page - 1)}
                                    disabled={current_page === 1}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-600"
                                    title="Trang trước"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {pageButtons.map((btn, i) =>
                                    btn === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400 select-none">…</span>
                                    ) : (
                                        <button
                                            key={btn}
                                            onClick={() => handlePageChange(btn as number)}
                                            className={`min-w-[2.25rem] h-9 px-3 rounded-lg text-xs font-semibold transition ${
                                                btn === current_page
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {btn}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => handlePageChange(current_page + 1)}
                                    disabled={current_page === last_page}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-600"
                                    title="Trang sau"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(last_page)}
                                    disabled={current_page === last_page}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-600"
                                    title="Trang cuối"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── MODAL CHI TIẾT HỒ SƠ BỆNH NHÂN ── */}
                {selectedPatient && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
                            {/* Modal Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Chi tiết hồ sơ bệnh nhân</h3>
                                        <p className="text-xs text-gray-500">
                                            Mã định danh: <span className="font-mono font-bold text-primary">{patientCode(selectedPatient.MaBenhNhan)}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseDetail}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                                {isLoadingDetail && (
                                    <div className="flex items-center justify-center gap-2 py-4 text-primary text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang tải thông tin mở rộng...</span>
                                    </div>
                                )}

                                {/* Thông tin cá nhân */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-primary" />
                                        Thông tin nhân thân
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <span className="text-xs text-gray-500">Họ và tên:</span>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedPatient.HoTen}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Giới tính:</span>
                                            <p className="mt-0.5">
                                                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${genderLabel(selectedPatient.GioiTinh).cls}`}>
                                                    {genderLabel(selectedPatient.GioiTinh).text}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Ngày sinh:</span>
                                            <p className="text-sm font-medium text-gray-800 mt-0.5">
                                                {formatDate(selectedPatient.NgaySinh)} {calcAge(selectedPatient.NgaySinh)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Số điện thoại:</span>
                                            <p className="text-sm font-mono font-semibold text-gray-800 mt-0.5">
                                                {selectedPatient.SoDienThoai || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-xs text-gray-500">Email liên hệ:</span>
                                            <p className="text-sm text-gray-800 mt-0.5">{selectedPatient.EmailLienHe || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-xs text-gray-500">Địa chỉ thường trú:</span>
                                            <p className="text-sm text-gray-800 mt-0.5">{selectedPatient.DiaChi || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trạng thái tài khoản */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                        Tài khoản người dùng
                                    </h4>
                                    <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                        {detailData?.taiKhoan ? (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                                    Tên đăng nhập: <span className="font-mono">{detailData.taiKhoan.TenDangNhap}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Email: {detailData.taiKhoan.Email} | Trạng thái: {detailData.taiKhoan.TrangThai}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">
                                                Bệnh nhân chưa tạo hoặc chưa liên kết tài khoản trực tuyến (khách vãng lai tại quầy).
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lịch sử khám gần nhất */}
                                {detailData?.luotKhams && detailData.luotKhams.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-primary" />
                                            Lịch sử khám bệnh gần đây
                                        </h4>
                                        <div className="space-y-2">
                                            {detailData.luotKhams.map(lk => (
                                                <div key={lk.MaLuotKham} className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-800">Lượt khám #{lk.MaLuotKham}</span>
                                                        {lk.SoPhieu && (
                                                            <span className="ml-2 font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                                {lk.SoPhieu}
                                                            </span>
                                                        )}
                                                        <p className="text-gray-500 mt-0.5">{formatDateTime(lk.ThoiGianTiepNhan)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-2 py-1 bg-white rounded border border-gray-200 font-medium text-gray-700">
                                                            {lk.TrangThai}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={handleCloseDetail}
                                    className="px-4 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => {
                                        handleCloseDetail();
                                        router.visit('/receptionist/queue');
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition shadow-sm"
                                >
                                    <CalendarClock className="w-4 h-4" />
                                    Tiếp nhận vào hàng chờ
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </DashboardLayout>
        </>
    );
}
