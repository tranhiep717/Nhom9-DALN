import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    CreditCard,
    FileText,
    Receipt,
    Printer,
    CheckCircle2
} from 'lucide-react';

export default function ReceptionistPayment({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { name: 'Lịch hẹn', href: '/receptionist/queue', icon: Calendar },
        { name: 'Hàng chờ', href: '/receptionist/dashboard', icon: Users },
        { name: 'Thanh toán', href: '/receptionist/payment', icon: CreditCard },
        { name: 'Hồ sơ', href: '/receptionist/records', icon: FileText },
    ];

    return (
        <DashboardLayout
            role="receptionist"
            navItems={navItems}
            user={auth?.user}
            header="Thanh toán & Hóa đơn"
        >
            <Head title="Thanh toán - Lễ tân" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                        <Receipt className="w-8 h-8 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Chi tiết thanh toán</h2>
                            <p className="text-gray-500 text-sm">Bệnh nhân: Lê Văn Cường - Mã HS: BN003</p>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Danh sách chi phí</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">1. Khám chuyên khoa Nhi</span>
                                    <span className="font-medium">300.000 đ</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">2. Xét nghiệm máu cơ bản</span>
                                    <span className="font-medium">150.000 đ</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">3. Siêu âm ổ bụng</span>
                                    <span className="font-medium">250.000 đ</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between items-center font-bold text-gray-900">
                                    <span>Tổng chi phí phát sinh</span>
                                    <span>700.000 đ</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-orange-600">
                                    <span>Trừ tạm ứng (Đã thanh toán lúc đặt lịch)</span>
                                    <span>- 100.000 đ</span>
                                </div>
                                <div className="flex justify-between items-center font-black text-primary text-xl mt-2 pt-2 border-t border-gray-300">
                                    <span>Số tiền cần thanh toán</span>
                                    <span>600.000 đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                                    <Printer className="w-5 h-5" /> In hóa đơn
                                </button>
                            </div>
                            <button className="w-full sm:w-auto px-8 py-2.5 bg-green-600 rounded-xl text-white font-bold hover:bg-green-700 flex items-center justify-center shadow-md">
                                Xác nhận thu tiền <CheckCircle2 className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
