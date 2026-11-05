import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    FlaskConical, 
    Search, 
    Filter, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    User, 
    Stethoscope, 
    FileText, 
    Eye, 
    X,
    Calendar,
    Activity,
    FileCheck2,
    DollarSign,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { adminNavItems } from '@/constants/navigation';
import AdminPagination from '@/Components/AdminPagination';
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

interface DichVuItem {
    MaDichVu: number;
    TenDichVu: string;
    DonGia: number;
    LoaiDichVu: string;
}

interface ClsOrderItem {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    MaBacSi: number;
    MaNhanVienThucHien?: number;
    TrangThai: string;
    KetQua?: string;
    KetLuan?: string;
    DonViDo?: string;
    KhoangThamChieu?: string;
    TepDinhKem?: string;
    NgayChiDinh: string;
    NgayThucHien?: string;
    ThoiGianXacNhan?: string;
    DonGia?: string | number;
    GhiChu?: string;
    dich_vu?: DichVuItem;
    bac_si?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
        chuyen_khoa?: {
            TenChuyenKhoa: string;
        };
    };
    nhan_vien_thuc_hien?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    };
    luot_kham?: {
        MaLuotKham: number;
        benh_nhan?: {
            MaBenhNhan: number;
            HoTen: string;
            SoDienThoai: string;
            NgaySinh?: string;
            GioiTinh?: string;
        };
    };
}

interface ClsMonitorProps {
    auth: any;
    orders: {
        data: ClsOrderItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    } | ClsOrderItem[];
    stats: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        cancelled: number;
        totalRevenue?: number;
        completionRate?: number;
    };
    charts?: {
        topServices: Array<{ name: string; count: number; revenue: number }>;
        topDoctors: Array<{ name: string; count: number }>;
        byType: Array<{ name: string; displayName?: string; value: number }>;
        statusDistribution: Array<{ name: string; value: number; color: string }>;
    };
    technicians: Array<{
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    }>;
    filters: {
        search?: string;
        status?: string;
        type?: string;
        date?: string;
        per_page?: number;
    };
}

export default function ClsMonitor({ auth, orders, stats, charts, technicians = [], filters = {} }: ClsMonitorProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [selectedOrder, setSelectedOrder] = useState<ClsOrderItem | null>(null);

    const orderList: ClsOrderItem[] = useMemo(() => {
        if (!orders) return [];
        if (Array.isArray(orders)) return orders;
        return orders.data || [];
    }, [orders]);

    const pagination = useMemo(() => {
        if (!orders || Array.isArray(orders)) {
            return {
                current_page: 1,
                last_page: 1,
                total: orderList.length,
                from: 1,
                to: orderList.length,
            };
        }
        return orders;
    }, [orders, orderList]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/admin/cls-monitor', {
            search: search || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            date: dateFilter || undefined,
            page: 1,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setDateFilter('');
        router.get('/admin/cls-monitor', {}, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/admin/cls-monitor', {
            ...filters,
            page,
        }, { preserveState: true });
    };

    const handlePageSizeChange = (per_page: number) => {
        router.get('/admin/cls-monitor', {
            ...filters,
            per_page,
            page: 1,
        }, { preserveState: true });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CHO_TIEP_NHAN':
            case 'CHO_THUC_HIEN':
                return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Clock className="w-3 h-3" /> Chờ thực hiện</span>;
            case 'DA_TIEP_NHAN':
            case 'DANG_THUC_HIEN':
                return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"><Activity className="w-3 h-3 animate-spin" /> Đang xét nghiệm</span>;
            case 'DA_CO_KET_QUA':
            case 'HOAN_THANH':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Đã có kết quả</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"><X className="w-3 h-3" /> Đã hủy</span>;
            default:
                return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{status}</span>;
        }
    };

    const pieColors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <DashboardLayout role="admin" navItems={adminNavItems}>
            <Head title="Báo cáo & Giám sát Cận lâm sàng Toàn viện - SmartCare" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <FlaskConical className="w-7 h-7 text-indigo-600" />
                            Báo cáo & Giám sát Cận lâm sàng (CLS)
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Phân tích năng lực thực hiện, doanh thu kỹ thuật CLS, chỉ định của bác sĩ và kiểm soát kết quả toàn viện.
                        </p>
                    </div>
                </div>

                {/* KPI Cards (4 Thẻ bao gồm Doanh thu CLS) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng chỉ định CLS</span>
                            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{stats.total}</div>
                        <p className="mt-1 text-xs text-slate-400">Tất cả yêu cầu xét nghiệm toàn hệ thống</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Doanh thu kỹ thuật CLS</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-2xl font-black text-emerald-700">{formatCurrency(stats.totalRevenue || 0)}</div>
                        <p className="mt-1 text-xs text-emerald-600 font-semibold">Doanh thu từ các ca đã có kết quả</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Đã có kết quả</span>
                            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl"><FileCheck2 className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-teal-700">{stats.completed}</div>
                        <p className="mt-1 text-xs text-teal-600 font-semibold">Tỷ lệ hoàn tất: {stats.completionRate || 0}%</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ thực hiện</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-4 h-4" /></span>
                        </div>
                        <div className="mt-3 text-3xl font-black text-amber-700">{stats.pending}</div>
                        <p className="mt-1 text-xs text-slate-400">Bệnh nhân đang chờ lấy mẫu / đo đạc</p>
                    </div>
                </div>

                {/* Hàng Biểu đồ 1: Top Dịch vụ phát sinh & Doanh thu theo dịch vụ */}
                {charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        Top Dịch vụ CLS được chỉ định nhiều nhất
                                    </h2>
                                    <p className="text-xs text-slate-400">Xếp hạng các kỹ thuật xét nghiệm & chẩn đoán hình ảnh phổ biến</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.topServices} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                            formatter={(val: any, name: any) => [name === 'revenue' ? formatCurrency(val) : `${val} ca`, name === 'revenue' ? 'Doanh thu' : 'Số ca']}
                                        />
                                        <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-teal-600" />
                                        Cơ cấu Phân loại Kỹ thuật CLS
                                    </h2>
                                    <p className="text-xs text-slate-400">Tỷ trọng Xét nghiệm vs Chẩn đoán hình ảnh vs Thăm dò chức năng</p>
                                </div>
                            </div>
                            <div className="h-64 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.byType}
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="displayName"
                                        >
                                            {charts.byType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                            formatter={(val: any) => [`${val} chỉ định`, 'Số lượng']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hàng Biểu đồ 2: Bác sĩ chỉ định & Phân bố trạng thái */}
                {charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-teal-600" />
                                        Bác sĩ có số lượng chỉ định CLS nhiều nhất
                                    </h2>
                                    <p className="text-xs text-slate-400">Thống kê lưu lượng chỉ định phát sinh từ các Bác sĩ khám</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.topDoctors} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                            formatter={(val: any) => [`${val} chỉ định`, 'Bác sĩ']}
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
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        Tỷ lệ Trạng thái Xử lý CLS
                                    </h2>
                                    <p className="text-xs text-slate-400">Tiến độ hoàn tất trả kết quả cho phòng khám</p>
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
                                                <Cell key={`cell-status-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 12, color: '#fff', border: 'none', fontSize: 12 }}
                                            formatter={(val: any) => [`${val} ca`, 'Trạng thái']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tên bệnh nhân, mã CLS, tên dịch vụ..."
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Trạng thái</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="COMPLETED">Đã có kết quả (Thành công)</option>
                                <option value="PENDING">Chờ thực hiện / chờ tiếp nhận</option>
                                <option value="DANG_THUC_HIEN">Đang xét nghiệm</option>
                                <option value="DA_HUY">Đã hủy</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày chỉ định</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                                <Filter className="w-3.5 h-3.5" /> Lọc
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Bảng Kiểm soát & Đối soát Cận lâm sàng Toàn viện */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-indigo-600" />
                                Danh sách Đối soát & Truy vết Chỉ định Cận lâm sàng
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Giám sát {pagination.total} ca xét nghiệm, đơn giá thực thu và nhân viên chịu trách nhiệm kỹ thuật.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Mã CLS</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Bệnh nhân</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Dịch vụ Cận lâm sàng</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Đơn giá</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Bác sĩ chỉ định</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">KTV thực hiện</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider">Thời gian</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Trạng thái</th>
                                    <th className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orderList.length > 0 ? (
                                    orderList.map((order) => (
                                        <tr key={order.MaChiDinh} className="hover:bg-slate-50/80 transition">
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    #CLS{order.MaChiDinh}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">{order.luot_kham?.benh_nhan?.HoTen || 'Bệnh nhân'}</div>
                                                <div className="text-xs text-slate-500 font-mono">{order.luot_kham?.benh_nhan?.SoDienThoai || 'N/A'}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold text-slate-900">{order.dich_vu?.TenDichVu || `Dịch vụ #${order.MaDichVu}`}</div>
                                                <div className="text-xs text-slate-400">{order.dich_vu?.LoaiDichVu || 'XÉT NGHIỆM'}</div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                                                {formatCurrency(Number(order.DonGia || order.dich_vu?.DonGia || 0))}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-800">
                                                <span className="font-semibold">{order.bac_si?.HocVi ? `${order.bac_si.HocVi} ` : ''}{order.bac_si?.HoTen || 'Bác sĩ trực'}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs">
                                                {order.nhan_vien_thuc_hien ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                                                        <span className="font-bold text-slate-800">{order.nhan_vien_thuc_hien.TenDangNhap}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Chưa phân công</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                <div>{order.NgayChiDinh?.substring(0, 10)}</div>
                                                <div className="text-slate-400">{order.NgayChiDinh?.substring(11, 16)}</div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {getStatusBadge(order.TrangThai)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Xem
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FlaskConical className="w-8 h-8 text-slate-300" />
                                                <p className="font-semibold text-slate-600">Không tìm thấy chỉ định CLS nào</p>
                                                <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc tìm kiếm để xem tất cả bản ghi.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Phân trang */}
                    <AdminPagination
                        currentPage={pagination.current_page || 1}
                        totalItems={pagination.total || 0}
                        pageSize={(pagination as any).per_page || 10}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>

                {/* Modal Chi tiết kết quả CLS */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <FlaskConical className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Chi tiết Chỉ định & Kết quả CLS #{selectedOrder.MaChiDinh}</h3>
                                    <p className="text-xs text-slate-400">Dịch vụ: {selectedOrder.dich_vu?.TenDichVu}</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-slate-400 font-medium">Bệnh nhân</p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrder.luot_kham?.benh_nhan?.HoTen || 'N/A'}</p>
                                        <p className="text-slate-500 font-mono mt-0.5">{selectedOrder.luot_kham?.benh_nhan?.SoDienThoai}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium">Đơn giá kỹ thuật</p>
                                        <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatCurrency(Number(selectedOrder.DonGia || selectedOrder.dich_vu?.DonGia || 0))}</p>
                                        <p className="text-slate-500 mt-0.5">{selectedOrder.dich_vu?.LoaiDichVu}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium">Bác sĩ chỉ định</p>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedOrder.bac_si?.HoTen || 'Bác sĩ khám'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium">Kỹ thuật viên thực hiện</p>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedOrder.nhan_vien_thuc_hien?.TenDangNhap || 'Chưa ghi nhận'}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-2xl p-4">
                                    <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-indigo-600" /> Kết quả & Kết luận chuyên môn
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-slate-400 block font-medium">Kết quả xét nghiệm:</span>
                                            <div className="mt-1 p-3 bg-slate-50 rounded-xl text-slate-800 font-mono text-xs whitespace-pre-wrap">
                                                {selectedOrder.KetQua || 'Chưa có kết quả phân tích.'}
                                            </div>
                                        </div>
                                        {selectedOrder.KetLuan && (
                                            <div>
                                                <span className="text-slate-400 block font-medium">Kết luận của KTV:</span>
                                                <div className="mt-1 p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold">
                                                    {selectedOrder.KetLuan}
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.GhiChu && (
                                            <div>
                                                <span className="text-slate-400 block font-medium">Ghi chú lâm sàng:</span>
                                                <p className="mt-1 text-slate-700 italic">{selectedOrder.GhiChu}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                                >
                                    Đóng cửa sổ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
