import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { Settings, Wrench } from 'lucide-react';
import { 
    LayoutDashboard,
    CalendarPlus,
    Calendar,
    Activity,
    History as HistoryIcon,
    Pill,
    CreditCard,
    TestTube2,
    Users,
    Stethoscope,
    Building2,
    FileText
} from 'lucide-react';

export default function Placeholder({ auth, role, title }: any) {
    let navItems: any[] = [];
    
    if (role === 'patient') {
        navItems = [
            { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Đặt lịch khám', href: '/book', icon: CalendarPlus },
            { name: 'Lịch hẹn', href: '/appointments', icon: Calendar },
            { name: 'Hồ sơ sức khỏe', href: '/patient/records', icon: Activity },
            { name: 'Lịch sử khám', href: '/patient/history', icon: HistoryIcon },
            { name: 'Kết quả xét nghiệm', href: '/patient/tests', icon: TestTube2 },
            { name: 'Đơn thuốc', href: '/patient/prescriptions', icon: Pill },
            { name: 'Hóa đơn & thanh toán', href: '/patient/billing', icon: CreditCard },
        ];
    } else if (role === 'doctor') {
        navItems = [
            { name: 'Tổng quan', href: '/doctor/dashboard', icon: LayoutDashboard },
            { name: 'Lịch làm việc', href: '/doctor/schedule', icon: Calendar },
            { name: 'Danh sách chờ khám', href: '/doctor/examine', icon: Users },
            { name: 'Bệnh nhân của tôi', href: '/doctor/patients', icon: Users },
            { name: 'Thống kê', href: '/doctor/stats', icon: Activity },
        ];
    } else if (role === 'receptionist') {
        navItems = [
            { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
            { name: 'Lịch hẹn', href: '/receptionist/queue', icon: Calendar },
            { name: 'Hàng chờ', href: '/receptionist/dashboard', icon: Users },
            { name: 'Thanh toán', href: '/receptionist/payment', icon: CreditCard },
            { name: 'Hồ sơ', href: '/receptionist/records', icon: FileText },
        ];
    } else if (role === 'admin') {
        navItems = [
            { name: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Quản lý Bác sĩ', href: '/admin/doctors', icon: Stethoscope },
            { name: 'Quản lý Chuyên khoa', href: '/admin/specialties', icon: Activity },
            { name: 'Quản lý Dịch vụ', href: '/admin/services', icon: Building2 },
            { name: 'Người dùng', href: '/admin/users', icon: Users },
            { name: 'Cấu hình hệ thống', href: '/admin/settings', icon: Settings },
        ];
    }

    return (
        <DashboardLayout
            role={role}
            navItems={navItems}
            user={auth?.user}
            header={title}
        >
            <Head title={`${title} - SmartCare`} />

            <div className="max-w-4xl mx-auto mt-20 text-center">
                <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                    <Wrench className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold text-darkblue mb-4">Giao diện đang được hoàn thiện</h2>
                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                    Tính năng <strong>{title}</strong> hiện đang trong quá trình phát triển và sẽ sớm ra mắt trong bản cập nhật tiếp theo.
                </p>
                <button 
                    onClick={() => window.history.back()}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Quay lại trang trước
                </button>
            </div>
        </DashboardLayout>
    );
}
