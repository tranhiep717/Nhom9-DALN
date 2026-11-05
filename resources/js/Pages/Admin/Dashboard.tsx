import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    Building2,
    Settings,
    TrendingUp,
    Stethoscope,
    Activity,
    Receipt,
    CreditCard,
    KeyRound,
    Pill,
    HeartPulse,
    BarChart3,
    ArrowUpRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    FlaskConical,
    UserCheck,
    CalendarClock
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { ADMIN_NAV_ITEMS, adminNavItems } from '@/constants/navigation';
export { ADMIN_NAV_ITEMS, adminNavItems };

interface AdminDashboardProps {
    auth: any;
    stats: {
        totalPatients: number;
        activeDoctors: number;
        totalAccounts: number;
        totalAppointments: number;
        todayAppointments: number;
        completedVisits: number;
        paidInvoicesCount: number;
        unpaidInvoicesCount: number;
        actualRevenue: number;
        totalDebt: number;
        visitsChart: Array<{ date: string; name: string; visits: number }>;
        appointmentStats: Array<{ name: string; value: number; color: string }>;
        revenueChart: Array<{ name: string; revenue: number }>;
        patientRatio: Array<{ name: string; value: number; color: string }>;
    };
}

export default function AdminDashboard({ auth, stats }: AdminDashboardProps) {
    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const adminUser = auth?.user || { name: 'Quản trị viên', code: 'ADMIN' };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: adminUser.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản trị Hệ thống"
        >
            <Head title="Bảng điều khiển Quản trị - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner Chào mừng */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold mb-3 text-indigo-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            Trung tâm giám sát y tế & tài chính toàn diện
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Bảng điều khiển Trung tâm Quản trị
                        </h1>
                        <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
                            Theo dõi thời gian thực dữ liệu khám chữa bệnh, chỉ số bệnh nhân, công suất bác sĩ và luồng doanh thu thực thu chuẩn xác từ giao dịch thanh toán.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <Link
                            href="/admin/reports"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-md"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Báo cáo tài chính
                        </Link>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 text-sm transition-colors"
                        >
                            <KeyRound className="w-4 h-4" />
                            Tài khoản ({stats?.totalAccounts || 0})
                        </Link>
                    </div>
                </div>

                {/* 4 Chỉ số Tài chính & Vận hành cốt lõi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu thực thu</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">
                                    {formatCurrency(stats?.actualRevenue)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Tính từ các giao dịch thanh toán thành công
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công nợ viện phí</p>
                                <p className="text-2xl font-black text-rose-600 mt-1">
                                    {formatCurrency(stats?.totalDebt)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Receipt className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            {stats?.unpaidInvoicesCount || 0} hóa đơn chưa thu xong
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lịch hẹn hôm nay</p>
                                <p className="text-2xl font-black text-indigo-600 mt-1">
                                    {stats?.todayAppointments || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Tổng {stats?.totalAppointments || 0} lịch hẹn trong hệ thống
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt khám hoàn thành</p>
                                <p className="text-2xl font-black text-teal-600 mt-1">
                                    {stats?.completedVisits || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            {stats?.totalPatients || 0} bệnh nhân • {stats?.activeDoctors || 0} bác sĩ đang trực
                        </p>
                    </div>
                </div>

                {/* 2 Cột Biểu đồ: Lượt khám 7 ngày & Doanh thu 6 tháng */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Biểu đồ lượt khám 7 ngày */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Xu hướng lượt khám 7 ngày gần nhất</h3>
                                <p className="text-xs text-slate-400">Số lượng bệnh nhân tiếp nhận theo ngày</p>
                            </div>
                            <span className="p-2 bg-slate-50 rounded-xl text-slate-600">
                                <Activity className="w-5 h-5 text-teal-600" />
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.visitsChart || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                                        labelStyle={{ color: '#94A3B8' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="visits" 
                                        name="Lượt khám"
                                        stroke="#0D9488" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#0D9488' }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Biểu đồ doanh thu thực thu 6 tháng */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Doanh thu thực thu 6 tháng gần nhất</h3>
                                <p className="text-xs text-slate-400">Chỉ tính giao dịch thanh toán thành công (VNĐ)</p>
                            </div>
                            <span className="p-2 bg-slate-50 rounded-xl text-slate-600">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.revenueChart || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickFormatter={(v) => `${v / 1000000}M`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                                        formatter={(val: any) => [formatCurrency(val), 'Doanh thu']}
                                    />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2 Cột Biểu đồ: Lịch hẹn theo trạng thái & Tỷ lệ bệnh nhân */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trạng thái Lịch hẹn */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Cơ cấu Lịch hẹn theo trạng thái</h3>
                                <p className="text-xs text-slate-400">Tỷ lệ xử lý các lịch hẹn trên hệ thống</p>
                            </div>
                            <span className="p-2 bg-slate-50 rounded-xl text-slate-600">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </span>
                        </div>

                        <div className="space-y-3 pt-2">
                            {stats?.appointmentStats?.map((item) => {
                                const total = stats.totalAppointments || 1;
                                const percent = Math.round((item.value / total) * 100);
                                return (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-700">{item.name}</span>
                                            <span className="text-slate-900 font-mono">{item.value} ({percent}%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${percent}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cơ cấu Bệnh nhân */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Tăng trưởng bệnh nhân</h3>
                                <p className="text-xs text-slate-400">Bệnh nhân mới đăng ký trong tháng vs Bệnh nhân cũ</p>
                            </div>
                            <span className="p-2 bg-slate-50 rounded-xl text-slate-600">
                                <Users className="w-5 h-5 text-teal-600" />
                            </span>
                        </div>

                        <div className="h-48 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.patientRatio || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats?.patientRatio?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center text-xs">
                            <div className="p-3 bg-teal-50 rounded-2xl">
                                <p className="text-teal-700 font-medium">Bệnh nhân mới tháng này</p>
                                <p className="text-lg font-black text-teal-900 mt-1">{stats?.patientRatio?.[0]?.value || 0}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl">
                                <p className="text-slate-600 font-medium">Bệnh nhân đã đăng ký trước</p>
                                <p className="text-lg font-black text-slate-800 mt-1">{stats?.patientRatio?.[1]?.value || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
