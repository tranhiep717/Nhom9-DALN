import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    CalendarClock, 
    Stethoscope, 
    TestTube2, 
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
    CreditCard
} from 'lucide-react';

export default function Dashboard({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Đặt lịch khám', href: '/book', icon: CalendarPlus },
        { name: 'Lịch hẹn', href: '/appointments', icon: Calendar },
        { name: 'Hồ sơ sức khỏe', href: '/patient/records', icon: Activity },
        { name: 'Lịch sử khám', href: '/patient/history', icon: History },
        { name: 'Kết quả xét nghiệm', href: '/patient/tests', icon: TestTube2 },
        { name: 'Đơn thuốc', href: '/patient/prescriptions', icon: Pill },
        { name: 'Hóa đơn & thanh toán', href: '/patient/billing', icon: CreditCard },
    ];

    // Dữ liệu mẫu (Mock data)
    const stats = [
        { title: 'Lịch hẹn sắp tới', value: '01', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Lần khám gần nhất', value: '15/09', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-100' },
        { title: 'Kết quả xét nghiệm', value: '2 Mới', icon: TestTube2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'Hóa đơn chưa thanh toán', value: '0 VNĐ', icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-100' },
    ];

    const upcomingAppointment = {
        doctor: 'BS. Nguyễn Văn A',
        specialty: 'Tim mạch',
        date: '05/10/2026',
        time: '09:00',
        room: '302 - Tầng 3',
        status: 'Đã xác nhận'
    };

    const recentHistory = [
        { id: 1, date: '15/09/2026', doctor: 'BS. Trần Thị B', specialty: 'Nội khoa', diagnosis: 'Viêm họng cấp', status: 'Hoàn thành' },
        { id: 2, date: '01/06/2026', doctor: 'BS. Lê Văn C', specialty: 'Da liễu', diagnosis: 'Dị ứng da', status: 'Hoàn thành' },
        { id: 3, date: '10/02/2026', doctor: 'BS. Nguyễn Văn A', specialty: 'Tim mạch', diagnosis: 'Kiểm tra định kỳ', status: 'Hoàn thành' },
    ];

    return (
        <DashboardLayout
            role="patient"
            navItems={navItems}
            user={auth?.user}
            header="Tổng quan"
        >
            <Head title="Dashboard - Bệnh nhân" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Welcome message */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Xin chào, Nguyễn Văn An 👋</h1>
                    <p className="text-slate-500 mt-1">Chúc bạn một ngày tốt lành. Đây là tổng quan tình trạng sức khỏe của bạn.</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Upcoming Appointment */}
                    <div className="lg:col-span-1 space-y-6">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Lịch hẹn sắp tới</h3>
                                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</Link>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900">{upcomingAppointment.doctor}</p>
                                            <p className="text-sm text-slate-500 mt-0.5">{upcomingAppointment.specialty}</p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                            {upcomingAppointment.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="font-medium text-slate-900">{upcomingAppointment.time}</p>
                                            <p className="text-sm">{upcomingAppointment.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="font-medium text-slate-900">Phòng khám {upcomingAppointment.room}</p>
                                            <p className="text-sm">Tòa nhà A, SMART HOSPITAL</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                    <button className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                                        Đổi lịch
                                    </button>
                                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-200">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* AI Assistant Banner */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-indigo-100" />
                                    <h4 className="font-bold">AI Medical Assistant</h4>
                                </div>
                                <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
                                    Kết quả xét nghiệm máu (15/09) của bạn đã có. AI phát hiện chỉ số Glucose hơi cao. Vui lòng xem chi tiết.
                                </p>
                                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm w-full">
                                    Xem phân tích AI
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Lịch sử khám gần đây</h3>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Ngày</th>
                                                <th className="px-6 py-4 font-medium">Bác sĩ</th>
                                                <th className="px-6 py-4 font-medium">Chuyên khoa</th>
                                                <th className="px-6 py-4 font-medium">Chẩn đoán</th>
                                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-900 font-medium">{item.date}</td>
                                                    <td className="px-6 py-4 text-slate-600">{item.doctor}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                                            {item.specialty}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{item.diagnosis}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                                                            Chi tiết <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t border-slate-100 text-center">
                                    <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                        Xem toàn bộ lịch sử
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
