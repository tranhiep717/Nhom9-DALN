import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    CalendarClock, 
    CheckCircle2, 
    Search,
    LayoutDashboard,
    Calendar,
    CreditCard,
    FileText,
    Clock,
    UserCheck,
    XCircle
} from 'lucide-react';

export default function ReceptionistDashboard({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { name: 'Lịch hẹn', href: '/receptionist/queue', icon: Calendar },
        { name: 'Hàng chờ', href: '/receptionist/dashboard', icon: Users },
        { name: 'Thanh toán', href: '/receptionist/payment', icon: CreditCard },
        { name: 'Hồ sơ', href: '/receptionist/records', icon: FileText },
    ];

    const stats = [
        { title: 'Lịch hẹn hôm nay', value: '45', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Đã tiếp nhận', value: '30', icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-100' },
        { title: 'Chưa đến', value: '15', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const appointments = [
        { id: 'BOOK_827361', name: 'Nguyễn Văn An', time: '09:00', doctor: 'BS. Nguyễn Văn A', status: 'Chưa đến' },
        { id: 'BOOK_827362', name: 'Trần Thị Bình', time: '09:30', doctor: 'BS. Lê Văn C', status: 'Đã tiếp nhận' },
        { id: 'BOOK_827363', name: 'Lê Văn Cường', time: '10:00', doctor: 'BS. Trần Thị B', status: 'Chờ thanh toán' },
    ];

    return (
        <DashboardLayout
            role="receptionist"
            navItems={navItems}
            user={auth?.user}
            header="Bàn làm việc Lễ tân"
        >
            <Head title="Receptionist Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg}`}>
                                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Danh sách lịch hẹn hôm nay</h3>
                        
                        <div className="flex bg-white border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-64">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input type="text" placeholder="Tìm BN, Số điện thoại..." className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Giờ hẹn</th>
                                    <th className="px-6 py-4 font-medium">Mã lịch</th>
                                    <th className="px-6 py-4 font-medium">Bệnh nhân</th>
                                    <th className="px-6 py-4 font-medium">Bác sĩ khám</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {appointments.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {item.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-primary">{item.id}</td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.doctor}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                item.status === 'Chưa đến' ? 'bg-orange-100 text-orange-700' : 
                                                item.status === 'Đã tiếp nhận' ? 'bg-teal-100 text-teal-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status === 'Chưa đến' && (
                                                <div className="flex justify-end gap-2">
                                                    <button className="px-3 py-1.5 border border-red-200 text-red-600 rounded flex items-center gap-1 text-xs font-medium hover:bg-red-50">
                                                        <XCircle className="w-3.5 h-3.5" /> Bỏ hẹn
                                                    </button>
                                                    <button className="px-3 py-1.5 bg-primary text-white rounded flex items-center gap-1 text-xs font-medium hover:bg-primary-hover">
                                                        <UserCheck className="w-3.5 h-3.5" /> Tiếp nhận
                                                    </button>
                                                </div>
                                            )}
                                            {item.status === 'Chờ thanh toán' && (
                                                <Link href="/receptionist/payment" className="px-3 py-1.5 bg-blue-600 text-white rounded inline-flex items-center gap-1 text-xs font-medium hover:bg-blue-700">
                                                    Thanh toán
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
