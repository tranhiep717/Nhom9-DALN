import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    CalendarClock, 
    CheckCircle2, 
    Clock,
    LayoutDashboard,
    Calendar,
    UserCircle,
    Activity
} from 'lucide-react';

interface QueueItem {
    id: string;
    visitId: number;
    name: string;
    age: number | string;
    time: string;
    status: string;
    rawStatus: string;
    reason: string;
}

interface DoctorDashboardProps {
    auth: any;
    doctor?: any;
    stats?: {
        todayAppointments: number;
        waitingPatients: number;
        inProgressVisits: number;
        completedVisits: number;
    };
    queue?: QueueItem[];
}

export default function DoctorDashboard({ auth, doctor, stats, queue = [] }: DoctorDashboardProps) {
    const navItems = [
        { name: 'Tổng quan', href: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Lịch làm việc', href: '/doctor/schedule', icon: Calendar },
        { name: 'Danh sách chờ khám', href: '/doctor/examine', icon: Users },
        { name: 'Khám bệnh & Kê đơn', href: '/doctor/examine', icon: Activity },
    ];

    const statCards = [
        { 
            title: 'Lịch khám hôm nay', 
            value: stats?.todayAppointments ?? 0, 
            sub: 'Lịch hẹn đặt khám trong ngày',
            icon: CalendarClock, 
            color: 'text-primary', 
            bg: 'bg-primary-light' 
        },
        { 
            title: 'Bệnh nhân chờ khám', 
            value: stats?.waitingPatients ?? 0, 
            sub: 'Đang xếp hàng chờ vào khám',
            icon: Users, 
            color: 'text-orange-600', 
            bg: 'bg-orange-100' 
        },
        { 
            title: 'Lượt khám đang thực hiện', 
            value: stats?.inProgressVisits ?? 0, 
            sub: `${stats?.completedVisits ?? 0} ca đã hoàn thành`,
            icon: Activity, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-100' 
        },
        { 
            title: 'Đã hoàn thành hôm nay', 
            value: stats?.completedVisits ?? 0, 
            sub: 'Hồ sơ bệnh án đã kết luận',
            icon: CheckCircle2, 
            color: 'text-teal-600', 
            bg: 'bg-teal-100' 
        },
    ];

    const doctorName = doctor?.HoTen || auth?.user?.bac_si?.HoTen || auth?.user?.TenDangNhap || 'Bác sĩ';
    const doctorCode = doctor?.MaBacSi ? `BS${String(doctor.MaBacSi).padStart(3, '0')}` : 'BS001';

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            user={{ name: doctorName, code: doctorCode }}
            header="Bàn làm việc Bác sĩ"
        >
            <Head title="Doctor Dashboard - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                                    <p className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
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

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hàng chờ khám bệnh hôm nay</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Dữ liệu thời gian thực được đồng bộ trực tiếp từ phòng tiếp nhận</p>
                        </div>
                        <Link href="/doctor/examine" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-bold text-sm bg-primary-light/60 px-3.5 py-1.5 rounded-xl transition-colors">
                            <span>Vào phòng khám</span>
                            <span>→</span>
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Thời gian</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Mã BN</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Họ và tên</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tuổi</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Triệu chứng / Lý do</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {queue.length > 0 ? (
                                    queue.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>{item.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.id}</td>
                                            <td className="px-6 py-4 font-bold text-primary">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.age}</td>
                                            <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{item.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    item.rawStatus === 'DANG_KHAM' 
                                                        ? 'bg-indigo-100 text-indigo-700 animate-pulse' 
                                                        : item.rawStatus === 'CHO_KHAM'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/doctor/examine?visit_id=${item.visitId}`} 
                                                    className="inline-flex items-center justify-center px-3.5 py-1.5 border border-transparent text-xs font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-sm transition-all"
                                                >
                                                    {item.rawStatus === 'DANG_KHAM' ? 'Tiếp tục khám' : 'Khám ngay'}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-8 h-8 text-slate-300" />
                                                <p className="font-medium text-slate-600">Hiện chưa có bệnh nhân nào trong hàng chờ hôm nay</p>
                                                <p className="text-xs text-slate-400">Khi lễ tân tiếp nhận bệnh nhân, danh sách sẽ tự động hiển thị tại đây</p>
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
