import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    Building2,
    Settings,
    TrendingUp,
    Stethoscope,
    Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Quản lý Bác sĩ', href: '#', icon: Stethoscope },
        { name: 'Quản lý Chuyên khoa', href: '#', icon: Activity },
        { name: 'Quản lý Dịch vụ', href: '#', icon: Building2 },
        { name: 'Người dùng', href: '#', icon: Users },
        { name: 'Cấu hình hệ thống', href: '#', icon: Settings },
    ];

    const stats = [
        { title: 'Tổng lượt khám (tháng)', value: '1,245', icon: Users, color: 'text-primary', bg: 'bg-primary-light' },
        { title: 'Doanh thu tạm tính', value: '450 Tr', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Lịch khám mới', value: '128', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const data = [
        { name: 'T2', uv: 100 },
        { name: 'T3', uv: 120 },
        { name: 'T4', uv: 95 },
        { name: 'T5', uv: 140 },
        { name: 'T6', uv: 180 },
        { name: 'T7', uv: 210 },
        { name: 'CN', uv: 170 },
    ];

    return (
        <DashboardLayout
            role="admin"
            navItems={navItems}
            user={auth?.user}
            header="Quản trị Hệ thống"
        >
            <Head title="Admin Dashboard" />

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart area */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Thống kê lượt khám (7 ngày)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="uv" stroke="#123B64" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Config */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> Cấu hình nhanh</h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Mức tạm ứng tối thiểu</h4>
                                    <p className="text-xs text-gray-500">Áp dụng cho đặt lịch mới</p>
                                </div>
                                <input type="text" className="w-24 text-right rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-primary" defaultValue="100.000" />
                            </div>
                            <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Ngưỡng cảnh báo bỏ hẹn</h4>
                                    <p className="text-xs text-gray-500">Số lần bỏ hẹn tối đa cho phép</p>
                                </div>
                                <select className="w-24 rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-primary">
                                    <option value="2">2 lần</option>
                                    <option value="3" selected>3 lần</option>
                                    <option value="5">5 lần</option>
                                </select>
                            </div>
                            <button className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                Xem tất cả cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
