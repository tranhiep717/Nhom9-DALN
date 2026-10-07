import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    LayoutDashboard,
    Calendar,
    Activity,
    UserCircle,
    Stethoscope,
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';

export default function Schedule({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Lịch làm việc', href: '/doctor/schedule', icon: Calendar },
        { name: 'Khám bệnh', href: '/doctor/examine', icon: Stethoscope },
        { name: 'Bệnh nhân của tôi', href: '/doctor/patients', icon: UserCircle },
        { name: 'Thống kê', href: '/doctor/stats', icon: Activity },
    ];

    const timeSlots = [
        { time: '08:00 - 09:00', status: 'full', count: 4, type: 'Khám bệnh' },
        { time: '09:00 - 10:00', status: 'full', count: 4, type: 'Khám bệnh' },
        { time: '10:00 - 11:00', status: 'available', count: 2, type: 'Khám bệnh' },
        { time: '11:00 - 12:00', status: 'available', count: 1, type: 'Khám bệnh' },
        { time: '13:30 - 14:30', status: 'meeting', count: 0, type: 'Giao ban khoa' },
        { time: '14:30 - 15:30', status: 'full', count: 4, type: 'Khám bệnh' },
        { time: '15:30 - 16:30', status: 'available', count: 3, type: 'Khám bệnh' },
        { time: '16:30 - 17:30', status: 'off', count: 0, type: 'Nghỉ' },
    ];

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            user={auth?.user}
            header="Lịch làm việc cá nhân"
        >
            <Head title="Lịch làm việc - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Thứ 3, 10 Tháng 10, 2026</h3>
                        <div className="flex gap-2">
                            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Hôm nay</button>
                            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {timeSlots.map((slot, index) => (
                            <div key={index} className={`border rounded-xl p-4 flex flex-col justify-between h-32 transition-transform hover:-translate-y-1 ${
                                slot.status === 'full' ? 'bg-red-50 border-red-200' :
                                slot.status === 'meeting' ? 'bg-purple-50 border-purple-200' :
                                slot.status === 'off' ? 'bg-gray-100 border-gray-300 opacity-70' :
                                'bg-green-50 border-green-200'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center text-sm font-bold text-gray-700">
                                        <Clock className="w-4 h-4 mr-1" /> {slot.time}
                                    </div>
                                    {slot.status === 'full' && <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm animate-pulse"></span>}
                                    {slot.status === 'available' && <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>}
                                    {slot.status === 'meeting' && <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></span>}
                                </div>
                                <div>
                                    <div className={`font-bold text-lg ${
                                        slot.status === 'full' ? 'text-red-700' :
                                        slot.status === 'meeting' ? 'text-purple-700' :
                                        slot.status === 'off' ? 'text-gray-500' :
                                        'text-green-700'
                                    }`}>
                                        {slot.type}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {slot.count > 0 ? `${slot.count} Bệnh nhân đặt` : 'Không có bệnh nhân'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
