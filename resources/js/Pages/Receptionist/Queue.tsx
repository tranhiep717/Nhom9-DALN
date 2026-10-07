import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    CreditCard,
    FileText,
    Search,
    UserCheck,
    Megaphone,
    MoreHorizontal
} from 'lucide-react';

export default function Queue({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { name: 'Lịch hẹn', href: '/receptionist/queue', icon: Calendar },
        { name: 'Hàng chờ', href: '/receptionist/dashboard', icon: Users },
        { name: 'Thanh toán', href: '/receptionist/payment', icon: CreditCard },
        { name: 'Hồ sơ', href: '/receptionist/records', icon: FileText },
    ];

    const queueList = [
        { stt: 1, name: 'Nguyễn Văn An', room: 'P. Khám Nội 01', type: 'Khám theo yêu cầu', status: 'Đang khám' },
        { stt: 2, name: 'Trần Thị Bình', room: 'P. Khám Nội 01', type: 'Khám BHYT', status: 'Chờ khám' },
        { stt: 3, name: 'Lê Văn Cường', room: 'P. Khám Nhi 02', type: 'Khám theo yêu cầu', status: 'Chờ khám' },
        { stt: 4, name: 'Phạm Văn D', room: 'Phòng Xét Nghiệm', type: 'Lấy mẫu', status: 'Đang thực hiện' },
    ];

    return (
        <DashboardLayout
            role="receptionist"
            navItems={navItems}
            user={auth?.user}
            header="Quản lý Hàng chờ"
        >
            <Head title="Quản lý Hàng chờ - Lễ tân" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="flex gap-2">
                            <select className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-primary focus:border-primary bg-white">
                                <option value="all">Tất cả phòng khám</option>
                                <option value="noi01">Phòng Khám Nội 01</option>
                                <option value="nhi02">Phòng Khám Nhi 02</option>
                            </select>
                        </div>
                        
                        <div className="flex bg-white border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-64">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input type="text" placeholder="Tìm theo tên bệnh nhân..." className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full" />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-center w-20">STT</th>
                                    <th className="px-6 py-4 font-medium">Bệnh nhân</th>
                                    <th className="px-6 py-4 font-medium">Phòng / Khu vực</th>
                                    <th className="px-6 py-4 font-medium">Loại dịch vụ</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {queueList.map((q) => (
                                    <tr key={q.stt} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-black text-xl text-primary">{q.stt}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{q.name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{q.room}</td>
                                        <td className="px-6 py-4 text-gray-500">{q.type}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                q.status === 'Đang khám' || q.status === 'Đang thực hiện' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {q.status === 'Chờ khám' && (
                                                    <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex items-center gap-1 text-xs font-bold hover:bg-blue-100">
                                                        <Megaphone className="w-3.5 h-3.5" /> Gọi loa
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
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
