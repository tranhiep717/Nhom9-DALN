import DashboardLayout from '@/Layouts/DashboardLayout';
import QuickAttendanceCard from '@/Components/QuickAttendanceCard';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    CalendarClock, 
    CheckCircle2, 
    Search,
    Clock,
    UserCheck,
    XCircle,
    Activity,
    DollarSign,
    Receipt
} from 'lucide-react';
import { useState } from 'react';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';

interface AppointmentItem {
    id: string;
    appointmentId: number;
    name: string;
    phone: string;
    time: string;
    doctor: string;
    status: string;
    rawStatus: string;
}

export interface ReceptionistDashboardProps {
    auth: any;
    stats?: {
        todayAppointments: number;
        notArrived: number;
        checkedIn: number;
        inProgressVisits: number;
        unpaidInvoices: number;
        todayRevenue: number;
    };
    appointments?: AppointmentItem[];
    role?: 'receptionist' | 'admin';
    navItems?: any[];
    queueUrl?: string;
    header?: string;
}

export default function ReceptionistDashboard({ 
    auth, 
    stats, 
    appointments = [],
    role = 'receptionist',
    navItems = RECEPTIONIST_NAV_ITEMS,
    queueUrl = '/receptionist/queue',
    header = 'Bàn làm việc Lễ tân'
}: ReceptionistDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const statCards = [
        { 
            title: 'Lịch hẹn hôm nay', 
            value: stats?.todayAppointments ?? 0, 
            sub: 'Tổng số lịch đăng ký trong ngày',
            icon: CalendarClock, 
            color: 'text-primary', 
            bg: 'bg-primary-light' 
        },
        { 
            title: 'Chờ tiếp nhận', 
            value: stats?.notArrived ?? 0, 
            sub: 'Bệnh nhân chưa đến check-in',
            icon: Clock, 
            color: 'text-orange-600', 
            bg: 'bg-orange-100' 
        },
        { 
            title: 'Đã tiếp nhận', 
            value: stats?.checkedIn ?? 0, 
            sub: 'Đã vào hàng chờ phòng khám',
            icon: UserCheck, 
            color: 'text-teal-600', 
            bg: 'bg-teal-100' 
        },
        { 
            title: 'Khám đang diễn ra', 
            value: stats?.inProgressVisits ?? 0, 
            sub: 'Bác sĩ đang thực hiện khám',
            icon: Activity, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-100' 
        },
        { 
            title: 'Hóa đơn còn nợ', 
            value: stats?.unpaidInvoices ?? 0, 
            sub: 'Chưa thanh toán hoặc nợ một phần',
            icon: Receipt, 
            color: 'text-rose-600', 
            bg: 'bg-rose-100' 
        },
        { 
            title: 'Doanh thu hôm nay', 
            value: formatCurrency(stats?.todayRevenue ?? 0), 
            sub: 'Thực thu giao dịch thành công',
            icon: DollarSign, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-100',
            isCurrency: true
        },
    ];

    const filteredAppointments = appointments.filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(q) || 
               item.phone.toLowerCase().includes(q) || 
               item.id.toLowerCase().includes(q) ||
               item.doctor.toLowerCase().includes(q);
    });

    const userName = auth?.user?.name || auth?.user?.TenDangNhap || (role === 'admin' ? 'Quản trị viên' : 'Nhân viên lễ tân');

    return (
        <DashboardLayout
            role={role}
            navItems={navItems}
            user={{ name: userName, code: role === 'admin' ? 'ADMIN' : 'LT001' }}
            header={header}
        >
            <Head title={`${header} - SmartCare`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 0. Chấm công nhanh ca trực hôm nay */}
                <QuickAttendanceCard
                    rolePrefix="receptionist"
                    todaySchedule={auth?.todaySchedule}
                    todayAttendance={auth?.todayAttendance}
                />

                {/* Thẻ thống kê 6 chỉ số */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {statCards.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                                    <p className={`font-extrabold text-gray-900 mt-2 ${stat.isCurrency ? 'text-2xl text-emerald-700' : 'text-3xl'}`}>
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 font-medium">
                                {stat.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bảng danh sách lịch hẹn hôm nay */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Danh sách tiếp nhận & lịch hẹn hôm nay</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Dữ liệu thực tế từ hệ thống tiếp nhận toàn viện</p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:w-64 shadow-sm focus-within:border-primary">
                                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0 my-auto" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm tên, SĐT, mã lịch..." 
                                    className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full outline-none placeholder:text-gray-400" 
                                />
                            </div>
                            <Link 
                                href={queueUrl} 
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shrink-0 shadow-sm"
                            >
                                <span>Quản lý hàng chờ</span>
                                <span>→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Thời gian</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Mã lịch</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Bệnh nhân</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Số điện thoại</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Bác sĩ khám</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>{item.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{item.id}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-600 text-xs font-mono">{item.phone}</td>
                                            <td className="px-6 py-4 text-gray-700">{item.doctor}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    item.rawStatus === 'DA_TIEP_NHAN' ? 'bg-teal-100 text-teal-800' : 
                                                    item.rawStatus === 'HOAN_THANH' ? 'bg-emerald-100 text-emerald-800' :
                                                    item.rawStatus === 'DA_HUY' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={queueUrl}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-primary/20 text-xs font-bold rounded-lg text-primary hover:bg-primary-light/50 transition-colors"
                                                >
                                                    Xem hàng chờ
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-8 h-8 text-slate-300" />
                                                <p className="font-medium text-slate-600">Không tìm thấy lịch hẹn nào hôm nay</p>
                                                <p className="text-xs text-slate-400">Dữ liệu sẽ tự động cập nhật khi có bệnh nhân đặt lịch hoặc tiếp nhận mới</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
