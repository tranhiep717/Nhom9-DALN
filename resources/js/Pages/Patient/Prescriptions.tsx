import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
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
    Printer,
    Info
} from 'lucide-react';

export default function Prescriptions({ auth }: any) {
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

    const prescriptions = [
        {
            id: 'DT-2026-0915',
            date: '15/09/2026',
            doctor: 'BS. Trần Thị B',
            diagnosis: 'Viêm họng cấp',
            medicines: [
                { name: 'Augmentin 1g', amount: '14 viên', usage: 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn' },
                { name: 'Alphachoay', amount: '20 viên', usage: 'Ngậm dưới lưỡi, ngày 4 viên chia 2 lần' },
                { name: 'Loratadin 10mg', amount: '7 viên', usage: 'Ngày 1 viên trước khi ngủ' }
            ]
        },
        {
            id: 'DT-2026-0601',
            date: '01/06/2026',
            doctor: 'BS. Lê Văn C',
            diagnosis: 'Dị ứng da, phát ban',
            medicines: [
                { name: 'Telfast 180mg', amount: '10 viên', usage: 'Ngày 1 viên sau ăn sáng' },
                { name: 'Fucicort Cream 15g', amount: '1 tuýp', usage: 'Bôi lớp mỏng vùng da bệnh 2 lần/ngày' }
            ]
        }
    ];

    return (
        <DashboardLayout
            role="patient"
            navItems={navItems}
            user={auth?.user}
            header="Đơn thuốc của tôi"
        >
            <Head title="Đơn thuốc - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Danh sách đơn thuốc</h3>
                        
                        <div className="flex bg-white border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-64">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input type="text" placeholder="Tìm theo tên thuốc..." className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full" />
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {prescriptions.map((prescription) => (
                            <div key={prescription.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-primary text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Mã đơn: {prescription.id}</h4>
                                        <p className="text-primary-light text-sm">Chẩn đoán: {prescription.diagnosis}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm">Bác sĩ kê đơn: <span className="font-bold">{prescription.doctor}</span></div>
                                        <div className="text-sm text-primary-light">Ngày kê: {prescription.date}</div>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Tên thuốc</th>
                                                <th className="px-6 py-3 font-medium text-center">Số lượng</th>
                                                <th className="px-6 py-3 font-medium">Cách dùng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {prescription.medicines.map((med, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{med.name}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-teal-600">{med.amount}</td>
                                                    <td className="px-6 py-4 text-gray-600 whitespace-normal min-w-[200px]">{med.usage}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center text-orange-600 text-sm">
                                        <Info className="w-4 h-4 mr-1" /> Mua thuốc theo đúng đơn chỉ định.
                                    </div>
                                    <button className="flex items-center text-primary font-medium text-sm hover:underline">
                                        <Printer className="w-4 h-4 mr-1" /> In đơn thuốc
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
