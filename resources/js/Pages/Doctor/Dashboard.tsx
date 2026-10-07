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

export default function DoctorDashboard({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Lịch làm việc', href: '#', icon: Calendar },
        { name: 'Danh sách chờ khám', href: '/doctor/examine', icon: Users },
        { name: 'Bệnh nhân của tôi', href: '#', icon: UserCircle },
        { name: 'Thống kê', href: '#', icon: Activity },
    ];

    const stats = [
        { title: 'Lịch khám hôm nay', value: '12', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Đang chờ khám', value: '4', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Đã khám xong', value: '6', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100' },
    ];

    const queue = [
        { id: 'BN01', name: 'Trần Văn D', age: 45, time: '14:00', status: 'Đang chờ', reason: 'Đau tức ngực' },
        { id: 'BN02', name: 'Nguyễn Thị E', age: 32, time: '14:30', status: 'Đang chờ', reason: 'Kiểm tra huyết áp' },
        { id: 'BN03', name: 'Lê Văn F', age: 28, time: '15:00', status: 'Chưa đến', reason: 'Tái khám' },
    ];

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            user={auth?.user}
            header="Bàn làm việc Bác sĩ"
        >
            <Head title="Doctor Dashboard" />

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
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Danh sách bệnh nhân đang chờ</h3>
                        <Link href="/doctor/examine" className="text-primary hover:text-primary-hover font-medium text-sm">
                            Vào phòng khám →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Giờ hẹn</th>
                                    <th className="px-6 py-4 font-medium">Mã BN</th>
                                    <th className="px-6 py-4 font-medium">Họ và tên</th>
                                    <th className="px-6 py-4 font-medium">Tuổi</th>
                                    <th className="px-6 py-4 font-medium">Lý do khám</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {queue.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {item.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{item.id}</td>
                                        <td className="px-6 py-4 font-medium text-primary">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.age}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                item.status === 'Đang chờ' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href="/doctor/examine" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-hover shadow-sm">
                                                Khám ngay
                                            </Link>
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
