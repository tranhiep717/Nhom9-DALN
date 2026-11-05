import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
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
    RotateCcw,
    FileSpreadsheet,
    ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { adminNavItems } from '@/constants/navigation';
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

interface KPI {
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

interface VisitItem {
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

interface ReceptionAnalyticsProps {
    auth: any;
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
    specialties: Array<{ MaChuyenKhoa: number; TenChuyenKhoa: string }>;
    doctors: Array<{ MaBacSi: number; HoTen: string; HocVi?: string }>;
    filters: {
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

export default function ReceptionAnalytics({
    auth,
    kpi,
    charts,
    visits,
    specialties = [],
    doctors = [],
    filters = {}
}: ReceptionAnalyticsProps) {
    const [timeRange, setTimeRange] = useState(filters.time_range || 'all');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [specialtyId, setSpecialtyId] = useState(filters.specialty_id ? String(filters.specialty_id) : '');
    const [doctorId, setDoctorId] = useState(filters.doctor_id ? String(filters.doctor_id) : '');
    const [status, setStatus] = useState(filters.status || '');
    const [source, setSource] = useState(filters.source || '');
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    const handleApplyFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/admin/reception-analytics', {
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
        router.get('/admin/reception-analytics', { time_range: 'all', page: 1, per_page: 10 });
    };

    const handlePageChange = (page: number) => {
        router.get('/admin/reception-analytics', {
            ...filters,
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
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Chờ kết quả CLS</span>;
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
        <DashboardLayout role="admin" navItems={adminNavItems}>
            <Head title="Giám sát & Thống kê Tiếp đón - Hàng chờ Toàn viện - SmartCare" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <CalendarClock className="w-7 h-7 text-indigo-600" />
                            Giám sát Tiếp đón & Hàng chờ Toàn viện
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Báo cáo phân tích thời gian thực: lưu lượng tiếp nhận, cơ cấu đặt hẹn (P2) vs vãng lai (P3), năng suất bác sĩ và truy vết đối soát.
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

                {/* 5 Thẻ KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiếp nhận</span>
                            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{kpi.totalVisits}</div>
                        <p className="mt-1 text-xs text-slate-400">Số ca vào quy trình khám</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">P2: Đặt lịch trước</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CalendarClock className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-emerald-700">{kpi.bookedCount}</div>
                        <p className="mt-1 text-xs text-emerald-600 font-semibold">{kpi.bookedRate}% tổng lượt tiếp nhận</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">P3: Đến trực tiếp</span>
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><UserCheck className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-purple-700">{kpi.walkinCount}</div>
                        <p className="mt-1 text-xs text-slate-400">Bệnh nhân vãng lai quầy tiếp đón</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Đã hoàn thành</span>
                            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle2 className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-teal-700">{kpi.completedCount}</div>
                        <p className="mt-1 text-xs text-teal-600 font-semibold">Tỷ lệ xong: {kpi.completionRate}%</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Bỏ lượt / Hủy ca</span>
                            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl"><XCircle className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-rose-700">{kpi.cancelledCount}</div>
                        <p className="mt-1 text-xs text-rose-600 font-semibold">Tỷ lệ vắng: {kpi.dropRate}%</p>
                    </div>
                </div>

                {/* Hàng Biểu đồ 1: Chuyên khoa + Cơ cấu nguồn P2/P3 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                    Lưu lượng Tiếp nhận theo Chuyên khoa
                                </h2>
                                <p className="text-xs text-slate-400">Số lượng bệnh nhân phân bổ vào từng chuyên khoa khám</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.bySpecialty} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }} 
                                        formatter={(val: any) => [`${val} lượt`, 'Tiếp nhận']}
                                    />
                                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <CalendarClock className="w-5 h-5 text-emerald-600" />
                                    Cơ cấu Nguồn Tiếp đón
                                </h2>
                                <p className="text-xs text-slate-400">Tỷ lệ đặt lịch trước qua Web/App vs đến quầy trực tiếp</p>
                            </div>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.sourceDistribution}
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {charts.sourceDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                        formatter={(val: any) => [`${val} ca`, 'Số lượng']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Hàng Biểu đồ 2: Top Bác sĩ + Phân bổ Trạng thái */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-teal-600" />
                                    Top Bác sĩ Tiếp nhận nhiều ca nhất
                                </h2>
                                <p className="text-xs text-slate-400">Năng suất tiếp đón và khám bệnh của các Bác sĩ</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.byDoctor} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                        formatter={(val: any) => [`${val} ca khám`, 'Bác sĩ']}
                                    />
                                    <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                    Cơ cấu Trạng thái Toàn hệ thống
                                </h2>
                                <p className="text-xs text-slate-400">Phân bổ tỷ lệ các ca theo từng bước trong quy trình khám</p>
                            </div>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.statusDistribution}
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {charts.statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-st-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                        formatter={(val: any) => [`${val} ca`, 'Tỷ trọng']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bảng Kiểm soát & Đối soát Toàn viện (Audit Trail) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Danh sách Đối soát & Truy vết Tiếp đón Toàn viện
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Hiển thị đầy đủ {visits.total} lượt khám thực tế trong cơ sở dữ liệu kèm dấu vết Lễ tân tiếp nhận.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium">Bản ghi/trang:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    router.get('/admin/reception-analytics', {
                                        ...filters,
                                        per_page: Number(e.target.value),
                                        page: 1,
                                    }, { preserveState: true });
                                }}
                                className="text-xs rounded-xl border-slate-300 py-1.5 px-3 bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Số phiếu / Mã</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Bệnh nhân</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Giờ tiếp nhận</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Chuyên khoa</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Bác sĩ phụ trách</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Hình thức</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Nhân sự tiếp nhận</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visits.data && visits.data.length > 0 ? (
                                    visits.data.map((item) => (
                                        <tr key={item.MaLuotKham} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    {item.SoPhieu || `#LK${item.MaLuotKham}`}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">{item.benh_nhan?.HoTen || 'Bệnh nhân'}</div>
                                                <div className="text-xs text-slate-500 font-mono">{item.benh_nhan?.SoDienThoai || 'N/A'}</div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-600">
                                                <div>{item.ThoiGianTiepNhan ? item.ThoiGianTiepNhan.substring(11, 16) : '--:--'}</div>
                                                <div className="text-slate-400">{item.NgayKham || item.ThoiGianTiepNhan?.substring(0, 10)}</div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                                                {item.chuyen_khoa?.TenChuyenKhoa || 'Nội tổng quát'}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-800">
                                                <span className="font-semibold">{item.bac_si?.HocVi ? `${item.bac_si.HocVi} ` : ''}{item.bac_si?.HoTen || 'Bác sĩ trực'}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs">
                                                {item.LoaiHangDoi === 'DAT_LICH' || item.MucUuTien === 2 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        P2 Đặt lịch
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        P3 Vãng lai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs">
                                                {item.nguoi_tiep_nhan ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                                                        <span className="font-bold text-slate-800">{item.nguoi_tiep_nhan.TenDangNhap}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Hệ thống (Web/Kiosk)</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {getStatusBadge(item.TrangThai)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-8 h-8 text-slate-300" />
                                                <p className="font-semibold text-slate-600">Không tìm thấy lượt khám nào khớp bộ lọc</p>
                                                <p className="text-xs text-slate-400">Hãy chuyển sang "Tất cả dữ liệu" hoặc nới rộng khoảng ngày tìm kiếm.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Phân trang */}
                    {visits.last_page > 1 && (
                        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs">
                            <span className="text-slate-500">
                                Đang xem dòng {visits.from || 0} đến {visits.to || 0} trong tổng số {visits.total} lượt khám
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(visits.current_page - 1)}
                                    disabled={visits.current_page <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 font-bold text-slate-800">
                                    Trang {visits.current_page} / {visits.last_page}
                                </span>
                                <button
                                    onClick={() => handlePageChange(visits.current_page + 1)}
                                    disabled={visits.current_page >= visits.last_page}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
