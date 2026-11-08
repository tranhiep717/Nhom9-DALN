import DashboardLayout from '@/Layouts/DashboardLayout';
import { adminNavItems } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    DollarSign,
    CalendarRange,
    CheckCircle2,
    AlertTriangle,
    Users,
    ArrowUpRight,
    Calculator,
    Clock,
    Search,
    Stethoscope,
    FlaskConical,
    Sparkles,
    FileText,
    Check,
    X,
    MessageSquare,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PayrollRecord {
    MaBangLuong: number;
    MaBacSi?: number | null;
    MaTaiKhoan?: number | null;
    ThangNam: string;
    SoNgayLam: number;
    SoCaLam: number;
    TienLuongCoBan: number;
    PhuCapCa: number;
    TienThuong: number;
    TienPhat: number;
    TongTien: number;
    TrangThai: string;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
        chuyenKhoa?: {
            TenChuyenKhoa: string;
        };
    };
    taiKhoan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        name?: string;
        vaiTro?: {
            TenVaiTro: string;
        };
    };
}

interface AttendanceLogRecord {
    MaChamCong: number;
    MaBacSi?: number | null;
    MaTaiKhoan?: number | null;
    NgayChamCong: string;
    LoaiCa?: string;
    GioCheckIn?: string;
    GioCheckOut?: string;
    TrangThai?: string;
    SoPhutTre?: number;
    SoPhutVeSom?: number;
    TienLuongCoBan?: number;
    PhuCapCa?: number;
    TienThuong?: number;
    TienPhat?: number;
    TongTien?: number;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
    };
    taiKhoan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        name?: string;
        vaiTro?: {
            TenVaiTro: string;
        };
    };
    donTu?: {
        LoaiDon?: string;
        SoPhutDuocDuyet?: number;
    };
    lichLamViec?: {
        GioBatDau?: string;
        GioKetThuc?: string;
    };
}

interface StaffRequest {
    MaDonTu: number;
    MaTaiKhoan: number;
    LoaiDon: string;
    NgayApDung: string;
    SoPhutXinPhep: number;
    SoPhutDuocDuyet: number;
    TaiKhoanDoiCung?: number | null;
    XacNhanDongNghiep?: boolean;
    NgayDongNghiepXacNhan?: string;
    GhiChuDongNghiep?: string;
    LyDo: string;
    TrangThai: string;
    GhiChuAdmin?: string;
    taiKhoan?: {
        TenDangNhap: string;
        name?: string;
        vaiTro?: {
            TenVaiTro: string;
        };
        bacSi?: {
            HoTen: string;
        };
        nhanVien?: {
            HoTen: string;
        };
    };
    taiKhoanDoiCung?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        name?: string;
        vaiTro?: {
            TenVaiTro: string;
        };
        bacSi?: {
            HoTen: string;
        };
        nhanVien?: {
            HoTen: string;
        };
    };
    lichLamViec?: {
        CaLamViec?: string;
        LoaiCa?: string;
        GioBatDau?: string;
        GioKetThuc?: string;
    };
    lichDoiSang?: {
        NgayLamViec?: string;
        CaLamViec?: string;
        LoaiCa?: string;
        GioBatDau?: string;
        GioKetThuc?: string;
    };
}

interface Props {
    auth: any;
    month: string;
    records: PayrollRecord[];
    attendanceRecords?: AttendanceLogRecord[];
    doctors: any[];
    staffAccounts?: any[];
    staffRequests?: StaffRequest[];
}

type RoleFilter = 'ALL' | 'BAC_SI' | 'NHAN_VIEN_CAN_LAM_SANG' | 'LE_TAN';
type ViewTab = 'PAYROLL' | 'ATTENDANCE' | 'REQUESTS';

export default function AdminPayroll({
    auth,
    month,
    records = [],
    attendanceRecords = [],
    doctors = [],
    staffAccounts = [],
    staffRequests = [],
}: Props) {
    const [selectedMonth, setSelectedMonth] = useState(month || new Date().toISOString().slice(0, 7));
    const [currentTab, setCurrentTab] = useState<ViewTab>('PAYROLL');
    const [activeRole, setActiveRole] = useState<RoleFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal Phê duyệt đơn
    const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
    const [approvedMinutes, setApprovedMinutes] = useState<number>(30);
    const [adminNote, setAdminNote] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    const pendingRequestsCount = useMemo(() => {
        return staffRequests.filter((r) => r.TrangThai === 'CHO_DUYET' || r.TrangThai === 'CHO_ADMIN_DUYET').length;
    }, [staffRequests]);

    const getStaffRole = (rec: PayrollRecord | AttendanceLogRecord): string => {
        if (rec.bacSi || rec.MaBacSi) return 'BAC_SI';
        const role = rec.taiKhoan?.vaiTro?.TenVaiTro;
        if (role) return role;
        return 'UNKNOWN';
    };

    const getStaffDisplayName = (rec: PayrollRecord | AttendanceLogRecord): string => {
        if (rec.bacSi?.HoTen) return rec.bacSi.HoTen;
        if (rec.taiKhoan?.name) return rec.taiKhoan.name;
        if (rec.taiKhoan?.TenDangNhap) return rec.taiKhoan.TenDangNhap;
        if (rec.MaBacSi) return `Bác sĩ #${rec.MaBacSi}`;
        if (rec.MaTaiKhoan) return `Nhân viên #${rec.MaTaiKhoan}`;
        return 'Nhân sự';
    };

    const getRoleBadge = (roleKey: string) => {
        switch (roleKey) {
            case 'BAC_SI':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Stethoscope className="w-3 h-3" />
                        Bác sĩ
                    </span>
                );
            case 'NHAN_VIEN_CAN_LAM_SANG':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FlaskConical className="w-3 h-3" />
                        Cận lâm sàng
                    </span>
                );
            case 'LE_TAN':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Users className="w-3 h-3" />
                        Lễ tân / Thu ngân
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        Nhân viên
                    </span>
                );
        }
    };

    const filteredRecords = useMemo(() => {
        return records.filter((rec) => {
            const role = getStaffRole(rec);
            if (activeRole !== 'ALL' && role !== activeRole) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const name = getStaffDisplayName(rec).toLowerCase();
                return name.includes(query);
            }
            return true;
        });
    }, [records, activeRole, searchQuery]);

    const totals = useMemo(() => {
        return filteredRecords.reduce(
            (acc, item) => {
                acc.base += Number(item.TienLuongCoBan || 0);
                acc.allowance += Number(item.PhuCapCa || 0);
                acc.bonus += Number(item.TienThuong || 0);
                acc.penalty += Number(item.TienPhat || 0);
                acc.total += Number(item.TongTien || 0);
                acc.shifts += Number(item.SoCaLam || 0);
                return acc;
            },
            { base: 0, allowance: 0, bonus: 0, penalty: 0, total: 0, shifts: 0 }
        );
    }, [filteredRecords]);

    const filteredAttendance = useMemo(() => {
        return attendanceRecords.filter((rec) => {
            const role = getStaffRole(rec);
            if (activeRole !== 'ALL' && role !== activeRole) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const name = getStaffDisplayName(rec).toLowerCase();
                return name.includes(query);
            }
            return true;
        });
    }, [attendanceRecords, activeRole, searchQuery]);

    const formatMoney = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

    const handleMonthChange = (value: string) => {
        setSelectedMonth(value);
        router.get('/admin/payroll', { month: value }, { preserveState: true, replace: true });
    };

    const handleCalculateMonthPayroll = async () => {
        setIsCalculating(true);
        setFeedback(null);

        try {
            const res = await axios.post('/admin/payroll/build-month', { month: selectedMonth });
            if (res.data?.success) {
                setFeedback({
                    type: 'success',
                    message: res.data?.message || `Đã tính toán và chốt bảng lương tháng ${selectedMonth} cho toàn viện thành công!`,
                });
                router.reload();
            } else {
                setFeedback({ type: 'error', message: res.data?.message || 'Không thể tính toán bảng lương.' });
            }
        } catch (err: any) {
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Không thể tính toán bảng lương. Vui lòng kiểm tra lại.',
            });
        } finally {
            setIsCalculating(false);
        }
    };

    const handleOpenApprovalModal = (req: StaffRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(req);
        setApprovalAction(action);
        setApprovedMinutes(req.SoPhutXinPhep || 30);
        setAdminNote(action === 'approve' ? 'Đồng ý phê duyệt.' : 'Không được chấp thuận do lịch trực đông bệnh nhân.');
    };

    const handleConfirmRequestAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !approvalAction) return;

        setSubmittingAction(true);
        const endpoint = `/admin/requests/${selectedRequest.MaDonTu}/${approvalAction}`;
        const payload = {
            SoPhutDuocDuyet: approvedMinutes,
            GhiChuAdmin: adminNote,
        };

        try {
            const res = await axios.post(endpoint, payload);
            if (res.data?.success) {
                setFeedback({
                    type: 'success',
                    message: res.data?.message || (approvalAction === 'approve' ? 'Phê duyệt đơn thành công!' : 'Đã từ chối đơn thành công.'),
                });
                setSelectedRequest(null);
                setApprovalAction(null);
                router.reload();
            } else {
                setFeedback({ type: 'error', message: res.data?.message || 'Có lỗi xảy ra.' });
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt đơn.';
            setFeedback({ type: 'error', message: String(msg) });
        } finally {
            setSubmittingAction(false);
        }
    };

    const formatLoaiDon = (loai: string) => {
        switch (loai) {
            case 'DOI_CA': return 'Xin đổi ca';
            case 'DI_MUON': return 'Xin đến muộn';
            case 'VE_SOM': return 'Xin về sớm';
            case 'NGHI_PHEP': return 'Xin nghỉ phép';
            default: return loai;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Chấm công & Bảng lương"
        >
            <Head title="Chấm công & Bảng lương - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">Quản lý Chấm công & Bảng lương</h1>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Toàn viện (Bác sĩ, CLS, Lễ tân)
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Chấm công ca trực nghiêm ngặt, xét duyệt đơn từ (đổi ca, đi muộn, về sớm) và tự động chốt lương minh bạch.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="text-sm text-slate-600 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <CalendarRange className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-700">Tháng:</span>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthChange(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                                />
                            </label>

                            <button
                                type="button"
                                disabled={isCalculating}
                                onClick={handleCalculateMonthPayroll}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                                <Calculator className="w-4 h-4" />
                                {isCalculating ? 'Đang chốt bảng lương...' : 'Chốt bảng lương tháng'}
                            </button>
                        </div>
                    </div>

                    {/* View Tabs: Bảng lương / Nhật ký ca trực / Duyệt đơn từ */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentTab('PAYROLL')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    currentTab === 'PAYROLL'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Bảng lương tháng ({records.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentTab('ATTENDANCE')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    currentTab === 'ATTENDANCE'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Nhật ký ca trực ({attendanceRecords.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentTab('REQUESTS')}
                                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    currentTab === 'REQUESTS'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Duyệt đơn từ nhân sự
                                {pendingRequestsCount > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Search and Role Filter */}
                        {currentTab !== 'REQUESTS' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                    {(['ALL', 'BAC_SI', 'NHAN_VIEN_CAN_LAM_SANG', 'LE_TAN'] as RoleFilter[]).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setActiveRole(r)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                activeRole === r
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {r === 'ALL' ? 'Tất cả' : r === 'BAC_SI' ? 'Bác sĩ' : r === 'NHAN_VIEN_CAN_LAM_SANG' ? 'CLS' : 'Lễ tân'}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-48"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Alert */}
                {feedback && (
                    <div
                        className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                    >
                        <span>{feedback.message}</span>
                        <button
                            type="button"
                            onClick={() => setFeedback(null)}
                            className="font-bold ml-4 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* 5 KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Lương cơ bản</span>
                            <DollarSign className="text-indigo-500 w-5 h-5" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900">{formatMoney(totals.base)}</div>
                        <div className="text-xs text-slate-400 mt-1">{totals.shifts} tổng ca đã làm</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Phụ cấp ca</span>
                            <ArrowUpRight className="text-emerald-500 w-5 h-5" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-emerald-600">{formatMoney(totals.allowance)}</div>
                        <div className="text-xs text-slate-400 mt-1">Phụ cấp ca trực chiều/tối/đêm</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Thưởng</span>
                            <Sparkles className="text-emerald-600 w-5 h-5" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-emerald-600">{formatMoney(totals.bonus)}</div>
                        <div className="text-xs text-slate-400 mt-1">Khen thưởng hiệu suất</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Tiền phạt</span>
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-amber-600">{formatMoney(totals.penalty)}</div>
                        <div className="text-xs text-slate-400 mt-1">Trừ đi muộn/về sớm không phép</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng tiền chi trả</span>
                            <CheckCircle2 className="text-indigo-600 w-5 h-5" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900">{formatMoney(totals.total)}</div>
                        <div className="text-xs text-slate-400 mt-1">{filteredRecords.length} nhân sự nhận lương</div>
                    </div>
                </div>

                {/* TAB 1: BẢNG LƯƠNG THÁNG */}
                {currentTab === 'PAYROLL' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-900">Bảng lương chi tiết tháng {selectedMonth}</h2>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                                {filteredRecords.length} nhân sự
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Nhân sự</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Vai trò</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Số ca</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Lương cơ bản</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Phụ cấp</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Thưởng</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Phạt</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Thực lĩnh</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.length > 0 ? (
                                        filteredRecords.map((record) => {
                                            const role = getStaffRole(record);
                                            const displayName = getStaffDisplayName(record);

                                            return (
                                                <tr key={record.MaBangLuong} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-slate-900">{displayName}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {record.bacSi?.chuyenKhoa?.TenChuyenKhoa ||
                                                                record.bacSi?.HocVi ||
                                                                `ID: ${record.MaBacSi ? `BS${record.MaBacSi}` : `TK${record.MaTaiKhoan}`}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">{getRoleBadge(role)}</td>
                                                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                                        {record.SoCaLam || 0} ca
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {formatMoney(record.TienLuongCoBan || 0)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-emerald-600 font-medium">
                                                        {formatMoney(record.PhuCapCa || 0)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-emerald-600 font-medium">
                                                        {formatMoney(record.TienThuong || 0)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-amber-600 font-medium">
                                                        {formatMoney(record.TienPhat || 0)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-black text-slate-900">
                                                        {formatMoney(record.TongTien || 0)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                            {record.TrangThai || 'HOAN_TAT'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-500">
                                                Chưa có dữ liệu bảng lương tháng {selectedMonth}. Hãy bấm nút "Chốt bảng lương tháng" để tự động tính toán.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: NHẬT KÝ CA TRỰC TOÀN VIỆN */}
                {currentTab === 'ATTENDANCE' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-900">Nhật ký chấm công ca trực toàn viện</h2>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                                {filteredAttendance.length} lượt chấm công
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Nhân sự</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Vai trò</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ngày</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ca</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Giờ vào</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Giờ ra</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Đi muộn</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Về sớm</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Lương ca</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAttendance.length > 0 ? (
                                        filteredAttendance.map((rec) => {
                                            const role = getStaffRole(rec);
                                            const displayName = getStaffDisplayName(rec);

                                            return (
                                                <tr key={rec.MaChamCong} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4 font-semibold text-slate-900 text-sm">
                                                        {displayName}
                                                    </td>
                                                    <td className="px-5 py-4">{getRoleBadge(role)}</td>
                                                    <td className="px-5 py-4 text-sm text-slate-600 font-mono">
                                                        {rec.NgayChamCong}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600 capitalize">
                                                        {rec.LoaiCa || 'Sáng'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-mono text-slate-700">
                                                        {rec.GioCheckIn || '--:--:--'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-mono text-slate-700">
                                                        {rec.GioCheckOut || '--:--:--'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm">
                                                        {rec.SoPhutTre && rec.SoPhutTre > 0 ? (
                                                            <span className="text-amber-600 font-medium">+{rec.SoPhutTre}p</span>
                                                        ) : (
                                                            <span className="text-emerald-600">Đúng giờ</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm">
                                                        {rec.SoPhutVeSom && rec.SoPhutVeSom > 0 ? (
                                                            <span className="text-rose-600 font-medium">-{rec.SoPhutVeSom}p</span>
                                                        ) : (
                                                            <span className="text-slate-400">--</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
                                                        {formatMoney(rec.TongTien || 0)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                rec.TrangThai?.includes('CO_PHEP')
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : rec.TrangThai === 'MUON'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : rec.TrangThai === 'VE_SOM'
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                            }`}
                                                        >
                                                            {rec.TrangThai === 'DI_MUON_CO_PHEP'
                                                                ? 'Muộn có phép'
                                                                : rec.TrangThai === 'VE_SOM_CO_PHEP'
                                                                ? 'Sớm có phép'
                                                                : rec.TrangThai === 'MUON'
                                                                ? 'Đi muộn'
                                                                : rec.TrangThai === 'VE_SOM'
                                                                ? 'Về sớm'
                                                                : 'Có mặt'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-500">
                                                Chưa có bản ghi chấm công ca trực nào trong tháng {selectedMonth}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: DUYỆT ĐƠN TỪ NHÂN SỰ */}
                {currentTab === 'REQUESTS' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-900">Danh sách Đơn xin phép & Đổi ca nhân sự</h2>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                                {staffRequests.length} đơn tổng cộng
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Nhân sự</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Loại đơn</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ca trực & Khung giờ</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Số phút xin</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Số phút duyệt</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Lý do & Chi tiết đổi</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Trạng thái</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase text-slate-500">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffRequests.length > 0 ? (
                                        staffRequests.map((req) => {
                                            const staffName = req.taiKhoan?.bacSi?.HoTen 
                                                || req.taiKhoan?.nhanVien?.HoTen 
                                                || req.taiKhoan?.name 
                                                || req.taiKhoan?.TenDangNhap 
                                                || `TK #${req.MaTaiKhoan}`;
                                            const colleagueName = req.taiKhoanDoiCung?.bacSi?.HoTen 
                                                || req.taiKhoanDoiCung?.nhanVien?.HoTen 
                                                || req.taiKhoanDoiCung?.name 
                                                || req.taiKhoanDoiCung?.TenDangNhap 
                                                || (req.TaiKhoanDoiCung ? `TK #${req.TaiKhoanDoiCung}` : '--');

                                            return (
                                                <tr key={req.MaDonTu} className="hover:bg-slate-50">
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-slate-900">
                                                            {staffName}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {req.taiKhoan?.vaiTro?.TenVaiTro === 'BAC_SI' ? 'Bác sĩ' : req.taiKhoan?.vaiTro?.TenVaiTro === 'LE_TAN' ? 'Lễ tân' : 'Cận lâm sàng'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
                                                        {formatLoaiDon(req.LoaiDon)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600 font-mono">
                                                        <div className="font-bold text-slate-900">{req.NgayApDung}</div>
                                                        {req.lichLamViec ? (
                                                            <div className="text-xs text-indigo-700 font-sans mt-0.5 font-medium">
                                                                {req.lichLamViec.CaLamViec || req.lichLamViec.LoaiCa ? `Ca ${req.lichLamViec.CaLamViec || req.lichLamViec.LoaiCa}: ` : ''}
                                                                {req.lichLamViec.GioBatDau?.slice(0, 5)} - {req.lichLamViec.GioKetThuc?.slice(0, 5)}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 font-sans mt-0.5">--</div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                        {req.SoPhutXinPhep > 0 ? `${req.SoPhutXinPhep} phút` : '--'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-bold text-indigo-600">
                                                        {req.TrangThai === 'DA_DUYET' ? `${req.SoPhutDuocDuyet} phút` : '--'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs">
                                                        <div>{req.LyDo}</div>
                                                        {req.LoaiDon === 'DOI_CA' && (
                                                            <div className="mt-1.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                                                                <div className="font-bold flex items-center justify-between">
                                                                    <span>Đổi với: {colleagueName}</span>
                                                                    {req.XacNhanDongNghiep ? (
                                                                        <span className="text-emerald-700 font-bold">✓ Đồng nghiệp OK</span>
                                                                    ) : (
                                                                        <span className="text-amber-700 font-bold">⏳ Chờ xác nhận</span>
                                                                    )}
                                                                </div>
                                                                {req.lichDoiSang && (
                                                                    <div className="text-slate-600 text-[10px]">
                                                                        Ca nhận đổi: {req.lichDoiSang.NgayLamViec} ({req.lichDoiSang.GioBatDau?.slice(0, 5)} - {req.lichDoiSang.GioKetThuc?.slice(0, 5)})
                                                                    </div>
                                                                )}
                                                                {req.GhiChuDongNghiep && (
                                                                    <div className="text-slate-500 italic mt-0.5">"{req.GhiChuDongNghiep}"</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {req.GhiChuAdmin && (
                                                            <div className="text-xs text-indigo-600 mt-1">Admin: {req.GhiChuAdmin}</div>
                                                        )}
                                                    </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            req.TrangThai === 'DA_DUYET'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : req.TrangThai === 'CHO_ADMIN_DUYET'
                                                                ? 'bg-violet-100 text-violet-700'
                                                                : req.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : req.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                                ? 'bg-slate-200 text-slate-700'
                                                                : req.TrangThai === 'ADMIN_TU_CHOI' || req.TrangThai === 'TU_CHOI'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {req.TrangThai === 'DA_DUYET'
                                                            ? 'Đã duyệt'
                                                            : req.TrangThai === 'CHO_ADMIN_DUYET'
                                                            ? 'Đồng nghiệp đã OK • Chờ Admin'
                                                            : req.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                            ? 'Chờ đồng nghiệp xác nhận'
                                                            : req.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                            ? 'Đồng nghiệp từ chối'
                                                            : req.TrangThai === 'ADMIN_TU_CHOI' || req.TrangThai === 'TU_CHOI'
                                                            ? 'Admin từ chối'
                                                            : 'Chờ duyệt'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {(req.TrangThai === 'CHO_DUYET' || req.TrangThai === 'CHO_ADMIN_DUYET') ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenApprovalModal(req, 'approve')}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                Duyệt
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenApprovalModal(req, 'reject')}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    ) : req.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN' ? (
                                                        <span className="text-xs text-amber-600 font-semibold italic">Đang chờ xác nhận từ đồng nghiệp</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">Đã hoàn tất</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500">
                                                Không có đơn từ nào cần xử lý.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Phê duyệt / Từ chối đơn của Admin */}
            {selectedRequest && approvalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {approvalAction === 'approve' ? 'Phê duyệt đơn nhân sự' : 'Từ chối đơn nhân sự'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setApprovalAction(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmRequestAction} className="p-6 space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-200">
                                <div>Nhân sự: <strong>{selectedRequest.taiKhoan?.bacSi?.HoTen || selectedRequest.taiKhoan?.nhanVien?.HoTen || selectedRequest.taiKhoan?.name || selectedRequest.taiKhoan?.TenDangNhap}</strong></div>
                                <div>Loại đơn: <strong>{formatLoaiDon(selectedRequest.LoaiDon)}</strong></div>
                                <div>Ngày áp dụng: <strong>{selectedRequest.NgayApDung}</strong></div>
                                {selectedRequest.lichLamViec && (
                                    <div className="text-indigo-700 font-medium">
                                        Khung giờ ca: <strong>{selectedRequest.lichLamViec.GioBatDau?.slice(0, 5)} - {selectedRequest.lichLamViec.GioKetThuc?.slice(0, 5)}</strong>
                                        {selectedRequest.lichLamViec.CaLamViec || selectedRequest.lichLamViec.LoaiCa ? ` (${selectedRequest.lichLamViec.CaLamViec || selectedRequest.lichLamViec.LoaiCa})` : ''}
                                    </div>
                                )}
                                {selectedRequest.LoaiDon === 'DOI_CA' && selectedRequest.taiKhoanDoiCung && (
                                    <div className="text-indigo-950 bg-indigo-50 p-2 rounded-xl mt-1 space-y-0.5">
                                        <div>Đồng nghiệp đổi cùng: <strong>{selectedRequest.taiKhoanDoiCung.bacSi?.HoTen || selectedRequest.taiKhoanDoiCung.nhanVien?.HoTen || selectedRequest.taiKhoanDoiCung.name || selectedRequest.taiKhoanDoiCung.TenDangNhap}</strong></div>
                                        <div>
                                            Xác nhận đồng nghiệp: {selectedRequest.XacNhanDongNghiep ? (
                                                <span className="text-emerald-700 font-bold">✓ Đã xác nhận đồng ý</span>
                                            ) : (
                                                <span className="text-amber-700 font-bold">⏳ Chờ xác nhận</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div>Lý do xin phép: <em>{selectedRequest.LyDo}</em></div>
                            </div>

                            {approvalAction === 'approve' && (selectedRequest.LoaiDon === 'DI_MUON' || selectedRequest.LoaiDon === 'VE_SOM') && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Số phút phê duyệt tối đa (tối đa 90p)
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[15, 30, 45, 60, 90, selectedRequest.SoPhutXinPhep].filter((v, i, a) => a.indexOf(v) === i && v <= 90 && v > 0).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setApprovedMinutes(m)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    approvedMinutes === m
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {m}p
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={90}
                                        value={approvedMinutes}
                                        onChange={(e) => setApprovedMinutes(Math.min(90, Math.max(0, Number(e.target.value))))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none font-medium"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Nhân sự được miễn phạt nếu quẹt thẻ trong giới hạn {approvedMinutes} phút (tối đa 90 phút). Vượt quá sẽ phạt phần thừa.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Ghi chú phản hồi của Quản trị viên
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Lời nhắn gửi nhân sự..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setApprovalAction(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 ${
                                        approvalAction === 'approve'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {submittingAction
                                        ? 'Đang xử lý...'
                                        : approvalAction === 'approve'
                                        ? 'Xác nhận Phê duyệt'
                                        : 'Xác nhận Từ chối'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
