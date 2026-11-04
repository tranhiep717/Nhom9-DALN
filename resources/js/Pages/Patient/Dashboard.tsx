import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    CalendarClock, 
    Stethoscope, 
    Receipt,
    ChevronRight,
    MapPin,
    Clock,
    AlertCircle,
    LayoutDashboard,
    CalendarPlus,
    Calendar,
    Activity,
    History,
    Pill,
    CreditCard,
    UserCheck,
    CheckCircle2,
    XCircle,
    Users,
    FileText,
    ArrowRight
} from 'lucide-react';

interface PatientDashboardProps {
    auth: any;
    benhNhan: {
        MaBenhNhan: number;
        HoTen: string;
        SoDienThoai?: string;
        EmailLienHe?: string;
        GioiTinh?: string;
        NgaySinh?: string;
        DiaChi?: string;
    };
    upcomingAppointment?: {
        MaLichHen: number;
        TrangThai: string;
        LyDoKham?: string;
        caKham?: {
            GioBatDau: string;
            GioKetThuc: string;
            lichLamViec?: {
                NgayLamViec: string;
                bacSi?: {
                    HoTen: string;
                    HocVi?: string;
                    chuyenKhoa?: {
                        TenChuyenKhoa: string;
                    };
                };
            };
        };
    } | null;
    stats: {
        upcomingCount: number;
        completedVisits: number;
        prescriptionsCount: number;
        unpaidCount: number;
        unpaidDebt: number;
    };
    latestInvoice?: {
        MaHoaDon: number;
        NgayTao: string;
        TongTien: number;
        BenhNhanChiTra: number;
        DaThanhToan: number;
        ConLai: number;
        TrangThai: string;
    } | null;
    recentVisits?: Array<{
        MaLuotKham: number;
        ThoiGianTiepNhan: string;
        TrangThai: string;
        bacSi?: {
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
        phieuKham?: {
            ChanDoan?: string;
            TrieuChung?: string;
        };
    }>;
}

export const patientNavItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Đặt lịch khám', href: '/patient/book', icon: CalendarPlus },
    { name: 'Lịch hẹn của tôi', href: '/appointments', icon: Calendar },
    { name: 'Hồ sơ cá nhân', href: '/patient/profile', icon: UserCheck },
    { name: 'Lịch sử khám bệnh', href: '/patient/history', icon: History },
    { name: 'Đơn thuốc', href: '/patient/prescriptions', icon: Pill },
    { name: 'Viện phí & Hóa đơn', href: '/patient/billing', icon: CreditCard },
    { name: 'Đội ngũ Bác sĩ', href: '/patient/doctors', icon: Users },
    { name: 'Chuyên khoa', href: '/patient/specialties', icon: Stethoscope },
];

export default function Dashboard({ 
    auth, 
    benhNhan, 
    upcomingAppointment, 
    stats, 
    latestInvoice, 
    recentVisits = [] 
}: PatientDashboardProps) {

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        return timeStr.slice(0, 5);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CHO_XAC_NHAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Chờ xác nhận</span>;
            case 'DA_XAC_NHAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'DA_TIEP_NHAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Đã tiếp nhận</span>;
            case 'DANG_KHAM':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Đang khám</span>;
            case 'HOAN_THANH':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Hoàn thành</span>;
            case 'DA_HUY':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Đã hủy</span>;
            case 'DA_THANH_TOAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
            case 'THANH_TOAN_MOT_PHAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Đã trả 1 phần</span>;
            case 'CHUA_THANH_TOAN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Chưa thanh toán</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const patientName = benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = benhNhan?.MaBenhNhan ? `BN${String(benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Tổng quan"
        >
            <Head title="Cổng Bệnh nhân - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Lời chào & Thao tác nhanh */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Mã bệnh nhân: {patientCode}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Xin chào, {patientName} 👋
                        </h1>
                        <p className="text-teal-100 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
                            Chào mừng bạn đến với Cổng thông tin y tế SmartCare. Bạn có thể theo dõi lịch hẹn, hồ sơ bệnh án, đơn thuốc và thanh toán viện phí trực tuyến tiện lợi.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <Link
                            href="/patient/book"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-teal-800 font-bold rounded-2xl shadow hover:bg-teal-50 transition-all hover:scale-105 active:scale-95"
                        >
                            <CalendarPlus className="w-5 h-5 text-teal-600" />
                            Đặt lịch khám mới
                        </Link>
                        <Link
                            href="/patient/profile"
                            className="inline-flex items-center gap-2 px-4 py-3 bg-teal-800/60 hover:bg-teal-800/80 text-white font-medium rounded-2xl border border-teal-400/30 transition-colors"
                        >
                            <UserCheck className="w-5 h-5" />
                            Hồ sơ cá nhân
                        </Link>
                    </div>
                </div>

                {/* Grid Thống kê */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch hẹn sắp tới</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.upcomingCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                <CalendarClock className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                            <Link href="/appointments" className="text-teal-600 font-semibold hover:underline inline-flex items-center">
                                Xem lịch hẹn <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lượt khám hoàn thành</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.completedVisits || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                            <Link href="/patient/history" className="text-blue-600 font-semibold hover:underline inline-flex items-center">
                                Xem lịch sử khám <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn thuốc đã cấp</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.prescriptionsCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Pill className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                            <Link href="/patient/prescriptions" className="text-purple-600 font-semibold hover:underline inline-flex items-center">
                                Xem đơn thuốc <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Viện phí chưa trả</p>
                                <p className={`text-xl font-black mt-1 ${stats?.unpaidDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatCurrency(stats?.unpaidDebt || 0)}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats?.unpaidDebt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <Receipt className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                            <Link href="/patient/billing" className="text-slate-700 font-semibold hover:underline inline-flex items-center">
                                Chi tiết hóa đơn ({stats?.unpaidCount || 0} chưa trả) <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2 Cột: Lịch hẹn sắp tới & Hóa đơn gần nhất */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột trái: Lịch hẹn sắp tới */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <CalendarClock className="w-5 h-5 text-teal-600" />
                                    Lịch hẹn gần nhất
                                </h2>
                                <Link href="/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                                    Xem tất cả
                                </Link>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between">
                                {upcomingAppointment ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(upcomingAppointment.TrangThai)}
                                            <span className="text-xs text-slate-400 font-mono">
                                                LH#{upcomingAppointment.MaLichHen}
                                            </span>
                                        </div>

                                        <div className="bg-teal-50/60 rounded-xl p-4 border border-teal-100/80 space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
                                                <Clock className="w-4 h-4 text-teal-600" />
                                                {formatTime(upcomingAppointment.caKham?.GioBatDau)} - {formatTime(upcomingAppointment.caKham?.GioKetThuc)}
                                                <span className="mx-1 text-slate-300">•</span>
                                                {formatDate(upcomingAppointment.caKham?.lichLamViec?.NgayLamViec)}
                                            </div>
                                            <div className="text-sm text-slate-700 font-medium flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-teal-600" />
                                                <span>
                                                    {upcomingAppointment.caKham?.lichLamViec?.bacSi?.HocVi ? `${upcomingAppointment.caKham?.lichLamViec?.bacSi?.HocVi}. ` : ''}
                                                    {upcomingAppointment.caKham?.lichLamViec?.bacSi?.HoTen || 'Bác sĩ chuyên khoa'}
                                                </span>
                                            </div>
                                            {upcomingAppointment.caKham?.lichLamViec?.bacSi?.chuyenKhoa?.TenChuyenKhoa && (
                                                <p className="text-xs text-slate-500 pl-6">
                                                    Chuyên khoa: <span className="font-medium text-slate-800">{upcomingAppointment.caKham.lichLamViec.bacSi.chuyenKhoa.TenChuyenKhoa}</span>
                                                </p>
                                            )}
                                        </div>

                                        {upcomingAppointment.LyDoKham && (
                                            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <span className="font-semibold text-slate-700">Lý do khám:</span> {upcomingAppointment.LyDoKham}
                                            </div>
                                        )}

                                        <div className="pt-2 flex gap-2">
                                            <Link
                                                href="/appointments"
                                                className="w-full text-center py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
                                            >
                                                Quản lý lịch hẹn
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4 flex flex-col items-center justify-center my-auto">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                            <Calendar className="w-7 h-7" />
                                        </div>
                                        <p className="font-bold text-slate-800 text-sm">Chưa có lịch hẹn nào sắp tới</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs mb-4">
                                            Đặt lịch trước để được ưu tiên tiếp nhận và chọn bác sĩ mong muốn.
                                        </p>
                                        <Link
                                            href="/patient/book"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors"
                                        >
                                            <CalendarPlus className="w-4 h-4" /> Đặt lịch ngay
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cột giữa & phải: Lượt khám gần đây & Hóa đơn gần đây */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Lượt khám gần đây */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-teal-600" />
                                    Lịch sử khám bệnh gần đây
                                </h2>
                                <Link href="/patient/history" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                                    Xem tất cả ({stats?.completedVisits || 0})
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {recentVisits.length > 0 ? (
                                    recentVisits.map((visit) => (
                                        <div key={visit.MaLuotKham} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(visit.TrangThai)}
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(visit.ThoiGianTiepNhan)}
                                                    </span>
                                                    <span className="text-xs font-mono text-slate-400">
                                                        | LK#{visit.MaLuotKham}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    Chẩn đoán: {visit.phieuKham?.ChanDoan || 'Đang khám / Chưa có kết luận'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Bác sĩ: <span className="font-medium text-slate-700">{visit.bacSi?.HoTen || 'Bác sĩ phòng khám'}</span>
                                                    {visit.bacSi?.chuyenKhoa?.TenChuyenKhoa && ` (${visit.bacSi.chuyenKhoa.TenChuyenKhoa})`}
                                                </p>
                                            </div>
                                            <Link
                                                href="/patient/history"
                                                className="shrink-0 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                Xem hồ sơ <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        Bạn chưa có lượt khám nào được ghi nhận trong hệ thống.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hóa đơn viện phí gần nhất */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-teal-600" />
                                    Hóa đơn viện phí gần nhất
                                </h2>
                                <Link href="/patient/billing" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                                    Xem tất cả hóa đơn
                                </Link>
                            </div>

                            {latestInvoice ? (
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">Hóa đơn #{latestInvoice.MaHoaDon}</span>
                                                {getStatusBadge(latestInvoice.TrangThai)}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">Ngày lập: {formatDate(latestInvoice.NgayTao)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Bệnh nhân cần trả</p>
                                            <p className="text-lg font-black text-teal-700">{formatCurrency(latestInvoice.BenhNhanChiTra)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 pt-4 text-center">
                                        <div className="p-2.5 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Tổng chi phí</p>
                                            <p className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(latestInvoice.TongTien)}</p>
                                        </div>
                                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                                            <p className="text-xs text-emerald-700">Đã thanh toán</p>
                                            <p className="text-sm font-bold text-emerald-800 mt-0.5">{formatCurrency(latestInvoice.DaThanhToan)}</p>
                                        </div>
                                        <div className={`p-2.5 rounded-xl ${latestInvoice.ConLai > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                                            <p className={`text-xs ${latestInvoice.ConLai > 0 ? 'text-rose-700' : 'text-slate-500'}`}>Còn nợ</p>
                                            <p className={`text-sm font-bold mt-0.5 ${latestInvoice.ConLai > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                                                {formatCurrency(latestInvoice.ConLai)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-sm">
                                    Không có phát sinh viện phí nào gần đây.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
