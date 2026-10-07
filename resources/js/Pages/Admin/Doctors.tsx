import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    Building2,
    Settings,
    Stethoscope,
    Activity,
    Search,
    Plus,
    Edit,
    Trash2
} from 'lucide-react';

export default function AdminDoctors({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Quản lý Bác sĩ', href: '/admin/doctors', icon: Stethoscope },
        { name: 'Quản lý Chuyên khoa', href: '/admin/specialties', icon: Activity },
        { name: 'Quản lý Dịch vụ', href: '/admin/services', icon: Building2 },
        { name: 'Người dùng', href: '/admin/users', icon: Users },
        { name: 'Cấu hình hệ thống', href: '/admin/settings', icon: Settings },
    ];

    const doctors = [
        { id: 'BS001', name: 'BS. Nguyễn Văn A', spec: 'Nội tổng quát', email: 'nguyenvana@smartcare.vn', phone: '0901234567', status: 'Đang làm việc' },
        { id: 'BS002', name: 'BS. Trần Thị B', spec: 'Nhi khoa', email: 'tranthib@smartcare.vn', phone: '0987654321', status: 'Đang làm việc' },
        { id: 'BS003', name: 'BS. Lê Văn C', spec: 'Tai mũi họng', email: 'levanc@smartcare.vn', phone: '0912345678', status: 'Nghỉ phép' },
    ];

    return (
        <DashboardLayout
            role="admin"
            navItems={navItems}
            user={auth?.user}
            header="Quản lý Bác sĩ"
        >
            <Head title="Quản lý Bác sĩ - Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="flex bg-white border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-80">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input type="text" placeholder="Tìm kiếm bác sĩ..." className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full" />
                        </div>
                        
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover flex items-center justify-center shadow-sm">
                            <Plus className="w-5 h-5 mr-1" /> Thêm Bác sĩ mới
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Mã BS</th>
                                    <th className="px-6 py-4 font-medium">Họ và tên</th>
                                    <th className="px-6 py-4 font-medium">Chuyên khoa</th>
                                    <th className="px-6 py-4 font-medium">Liên hệ</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {doctors.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-medium">{doc.id}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center text-xs">
                                                {doc.name.charAt(4)}
                                            </div>
                                            {doc.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{doc.spec}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-900">{doc.phone}</p>
                                            <p className="text-gray-500 text-xs">{doc.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                doc.status === 'Đang làm việc' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
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
