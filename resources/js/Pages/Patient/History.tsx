import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    LayoutDashboard,
    CalendarPlus,
    Calendar,
    Activity,
    History as HistoryIcon,
    Pill,
    CreditCard,
    TestTube2,
    Search,
    ChevronRight,
    FileText,
    Download
} from 'lucide-react';

export default function History({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Đặt lịch khám', href: '/book', icon: CalendarPlus },
        { name: 'Lịch hẹn', href: '/appointments', icon: Calendar },
        { name: 'Hồ sơ sức khỏe', href: '/patient/records', icon: Activity },
        { name: 'Lịch sử khám', href: '/patient/history', icon: HistoryIcon },
        { name: 'Kết quả xét nghiệm', href: '/patient/tests', icon: TestTube2 },
        { name: 'Đơn thuốc', href: '/patient/prescriptions', icon: Pill },
        { name: 'Hóa đơn & thanh toán', href: '/patient/billing', icon: CreditCard },
    ];

    const records = [
        {
            id: 'HS001',
            date: '15/09/2026',
            doctor: 'BS. Trần Thị B',
            specialty: 'Nội khoa',
            diagnosis: 'Viêm họng cấp',
            prescription: 'Có đơn thuốc (3 loại)',
            status: 'Hoàn thành'
        },
        {
            id: 'HS002',
            date: '01/06/2026',
            doctor: 'BS. Lê Văn C',
            specialty: 'Da liễu',
            diagnosis: 'Dị ứng da, phát ban',
            prescription: 'Có đơn thuốc (2 loại)',
            status: 'Hoàn thành'
        },
        {
            id: 'HS003',
            date: '10/02/2026',
            doctor: 'BS. Nguyễn Văn A',
            specialty: 'Tim mạch',
            diagnosis: 'Kiểm tra sức khỏe định kỳ',
            prescription: 'Không có',
            status: 'Hoàn thành'
        }
    ];

    return (
        <DashboardLayout
            role="patient"
            navItems={navItems}
            user={auth?.user}
            header="Lịch sử khám bệnh"
        >
            <Head title="Lịch sử khám - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Danh sách lần khám</h3>
                        
                        <div className="flex bg-white border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-64">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input type="text" placeholder="Tìm theo bệnh, bác sĩ..." className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full" />
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {records.map((record) => (
                            <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                            {record.status}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500">{record.date}</span>
                                        <span className="text-sm text-gray-400">| Mã HS: {record.id}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-primary mb-1">Chẩn đoán: {record.diagnosis}</h4>
                                    <p className="text-gray-600 text-sm">
                                        Khám với: <span className="font-medium text-gray-900">{record.doctor}</span> ({record.specialty})
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                                        <Pill className="w-4 h-4 text-gray-400" /> {record.prescription}
                                    </p>
                                </div>
                                <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-48">
                                    <button className="flex-1 py-2 bg-primary-light/50 text-primary hover:bg-primary-light font-medium rounded-lg text-sm transition-colors flex items-center justify-center">
                                        <FileText className="w-4 h-4 mr-2" /> Xem hồ sơ
                                    </button>
                                    <button className="flex-1 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center">
                                        <Download className="w-4 h-4 mr-2" /> Tải về
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
