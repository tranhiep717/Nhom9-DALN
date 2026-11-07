import { router } from '@inertiajs/react';
import { 
    Users, 
    CalendarClock, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    Search, 
    Filter, 
    Calendar,
    Stethoscope,
    Building2,
    Activity,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell,
    CartesianGrid,
    Legend
} from 'recharts';

export interface KPI {
    totalVisits: number;
    completedCount: number;
    activeCount: number;
    cancelledCount: number;
    bookedCount: number;
    walkinCount: number;
    completionRate: number;
    dropRate: number;
    bookedRate: number;
}

export interface VisitItem {
    MaLuotKham: number;
    SoPhieu: string;
    NgayKham: string;
    ThoiGianTiepNhan: string;
    LoaiHangDoi: string;
    MucUuTien: number;
    TrangThai: string;
    benh_nhan?: {
        MaBenhNhan: number;
        HoTen: string;
        SoDienThoai: string;
        GioiTinh?: string;
        NgaySinh?: string;
    };
    bac_si?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
    };
    chuyen_khoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
    nguoi_tiep_nhan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    };
    ca_kham?: {
        GioBatDau: string;
        GioKetThuc: string;
    };
}

export interface ReceptionAnalyticsTabProps {
    kpi: KPI;
    charts: {
        bySpecialty: Array<{ name: string; count: number }>;
        byDoctor: Array<{ name: string; count: number }>;
        byShift: Array<{ name: string; count: number }>;
        sourceDistribution: Array<{ name: string; value: number; color: string }>;
        statusDistribution: Array<{ name: string; value: number; color: string }>;
    };
    visits: {
        data: VisitItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    specialties?: Array<{ MaChuyenKhoa: number; TenChuyenKhoa: string }>;
    doctors?: Array<{ MaBacSi: number; HoTen: string; HocVi?: string }>;
    filters?: {
        time_range?: string;
        from_date?: string;
        to_date?: string;
        specialty_id?: number | null;
        doctor_id?: number | null;
        status?: string;
        source?: string;
        search?: string;
        per_page?: number;
    };
}

export default function ReceptionAnalyticsTab({
    kpi,
    charts,
    visits,
    specialties = [],
    doctors = [],
    filters = {}
}: ReceptionAnalyticsTabProps) {
    const [timeRange, setTimeRange] = useState(filters.time_range || 'all');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [specialtyId, setSpecialtyId] = useState(filters.specialty_id ? String(filters.specialty_id) : '');
    const [doctorId, setDoctorId] = useState(filters.doctor_id ? String(filters.doctor_id) : '');
    const [status, setStatus] = useState(filters.status || '');
    const [source, setSource] = useState(filters.source || '');
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    const getTargetRoute = () => {
        return window.location.pathname.includes('operations-monitor') 
            ? '/admin/operations-monitor' 
            : '/admin/reception-analytics';
    };

    const handleApplyFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'reception' } : {};

        router.get(baseRoute, {
            ...extraParam,
            time_range: timeRange,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
            specialty_id: specialtyId || undefined,
            doctor_id: doctorId || undefined,
            status: status || undefined,
            source: source || undefined,
            search: search || undefined,
            per_page: perPage,
            page: 1,
        }, { preserveState: true });
    };

    const handleResetFilter = () => {
        setTimeRange('all');
        setFromDate('');
        setToDate('');
        setSpecialtyId('');
        setDoctorId('');
        setStatus('');
        setSource('');
        setSearch('');
        setPerPage(10);
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'reception' } : {};
        router.get(baseRoute, { ...extraParam, time_range: 'all', page: 1, per_page: 10 });
    };

    const handlePageChange = (page: number) => {
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'reception' } : {};
        router.get(baseRoute, {
            ...filters,
            ...extraParam,
            page,
        }, { preserveState: true });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'CHO_KHAM':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Chờ khám</span>;
            case 'DANG_KHAM':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Activity className="w-3 h-3 animate-spin" /> Đang khám</span>;
            case 'CHO_KET_QUA':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Chờ KQ Cận lâm sàng</span>;
            case 'CHO_KHAM_LAI':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800"><CheckCircle2 className="w-3 h-3" /> Chờ khám lại</span>;
            case 'HOAN_THANH':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Hoàn thành</span>;
            case 'BO_LUOT':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Bỏ lượt / Hủy</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{st}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-indigo-600" />
                        Giám sát Tiếp đón & Luồng Hàng chờ
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Báo cáo phân tích thời gian thực: lưu lượng tiếp nhận, đặt hẹn (P2) vs vãng lai (P3), năng suất bác sĩ.
                    </p>
                </div>
            </div>

            {/* Bộ lọc linh hoạt */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <form onSubmit={handleApplyFilter} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-600" /> Thời gian:
                        </span>
                        {[
                            { id: 'all', label: 'Tất cả dữ liệu' },
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'week', label: 'Tuần này' },
                            { id: 'month', label: 'Tháng này' },
                            { id: 'custom', label: 'Tùy chọn ngày' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setTimeRange(tab.id);
                                }}
                                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                                    timeRange === tab.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}

                        {timeRange === 'custom' && (
                            <div className="flex items-center gap-2 ml-auto">
                                <input 
                                    type="date" 
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="text-xs rounded-lg border-slate-300 py-1 px-2"
                                />
                                <span className="text-xs text-slate-400">đến</span>
                                <input 
                                    type="date" 
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="text-xs rounded-lg border-slate-300 py-1 px-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Hàng lọc tiêu chí chi tiết */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Chuyên khoa</label>
                            <select 
                                value={specialtyId}
                                onChange={(e) => setSpecialtyId(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                            >
                                <option value="">Tất cả chuyên khoa</option>
                                {specialties.map((s) => (
                                    <option key={s.MaChuyenKhoa} value={s.MaChuyenKhoa}>{s.TenChuyenKhoa}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Bác sĩ khám</label>
                            <select 
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                            >
                                <option value="">Tất cả bác sĩ</option>
                                {doctors.map((d) => (
                                    <option key={d.MaBacSi} value={d.MaBacSi}>{d.HocVi ? `${d.HocVi} ` : ''}{d.HoTen}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Nguồn tiếp đón</label>
                            <select 
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                            >
                                <option value="">Tất cả nguồn</option>
                                <option value="DAT_LICH">P2: Đặt lịch trước (Web/App)</option>
                                <option value="TRUC_TIEP">P3: Tiếp nhận trực tiếp (Vãng lai)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Trạng thái khám</label>
                            <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHO_KHAM">Chờ khám</option>
                                <option value="DANG_KHAM">Đang khám</option>
                                <option value="CHO_KET_QUA">Chờ KQ Cận lâm sàng</option>
                                <option value="CHO_KHAM_LAI">Chờ khám lại</option>
                                <option value="HOAN_THANH">Đã hoàn thành</option>
                                <option value="BO_LUOT">Bỏ lượt / Hủy</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Tìm kiếm bệnh nhân</label>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tên, SĐT, số phiếu..."
                                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={handleResetFilter}
                            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" /> Áp dụng bộ lọc
                        </button>
                    </div>
                </form>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng tiếp nhận</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{kpi?.totalVisits || 0}</div>
                    <span className="text-[10px] text-slate-500">Lượt đăng ký khám</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Khám xong</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{kpi?.completedCount || 0}</div>
                    <span className="text-[10px] font-semibold text-emerald-600">Đạt {kpi?.completionRate || 0}%</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Đang phục vụ</span>
                    <div className="text-2xl font-black text-blue-700 mt-1">{kpi?.activeCount || 0}</div>
                    <span className="text-[10px] text-blue-600">Đang khám / chờ CLS</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Đặt hẹn trước (P2)</span>
                    <div className="text-2xl font-black text-indigo-700 mt-1">{kpi?.bookedCount || 0}</div>
                    <span className="text-[10px] font-semibold text-indigo-600">Tỷ lệ {kpi?.bookedRate || 0}%</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Vãng lai (P3)</span>
                    <div className="text-2xl font-black text-amber-700 mt-1">{kpi?.walkinCount || 0}</div>
                    <span className="text-[10px] text-amber-600">Tiếp nhận tại quầy</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Bỏ lượt / Hủy</span>
                    <div className="text-2xl font-black text-rose-700 mt-1">{kpi?.cancelledCount || 0}</div>
                    <span className="text-[10px] font-semibold text-rose-600">Tỷ lệ {kpi?.dropRate || 0}%</span>
                </div>
            </div>

            {/* Biểu đồ phân tích */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Phân bố theo Chuyên khoa */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        Lưu lượng khám theo Chuyên khoa
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts?.bySpecialty || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Số lượt khám" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Phân bố theo Bác sĩ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        Năng suất khám theo Bác sĩ
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts?.byDoctor || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} name="Số ca đã tiếp nhận" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bảng Nhật ký Tiếp đón chi tiết */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Danh sách lượt khám & Truy vết thời gian thực</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Hiển thị {visits?.data?.length || 0} trên tổng số {visits?.total || 0} lượt khám</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Số phiếu</th>
                                <th className="px-4 py-3">Bệnh nhân</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3">Phân luồng</th>
                                <th className="px-4 py-3">Bác sĩ / Khoa</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(!visits?.data || visits.data.length === 0) ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        Không tìm thấy lượt tiếp nhận nào trong khoảng thời gian này.
                                    </td>
                                </tr>
                            ) : (
                                visits.data.map((v) => (
                                    <tr key={v.MaLuotKham} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                                            {v.SoPhieu || `#${v.MaLuotKham}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{v.benh_nhan?.HoTen || 'Bệnh nhân'}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">{v.benh_nhan?.SoDienThoai}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[11px]">
                                            <div>{v.NgayKham}</div>
                                            <div className="text-slate-400">{v.ThoiGianTiepNhan ? v.ThoiGianTiepNhan.substring(0, 5) : '--:--'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {v.LoaiHangDoi === 'DAT_LICH' ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    P2 Đặt lịch
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                                    P3 Vãng lai
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{v.bac_si?.HoTen || 'Chưa phân BS'}</div>
                                            <div className="text-[11px] text-slate-400">{v.chuyen_khoa?.TenChuyenKhoa}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(v.TrangThai)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {visits && visits.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div>Trang {visits.current_page} / {visits.last_page}</div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={visits.current_page <= 1}
                                onClick={() => handlePageChange(visits.current_page - 1)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={visits.current_page >= visits.last_page}
                                onClick={() => handlePageChange(visits.current_page + 1)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
