import { Link } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    CalendarPlus, 
    Calendar, 
    Activity, 
    History, 
    TestTube, 
    Pill, 
    CreditCard, 
    Bell, 
    User, 
    Settings, 
    LogOut,
    Menu,
    X,
    Stethoscope
} from 'lucide-react';
import { useState, PropsWithChildren } from 'react';

export default function PatientLayout({ user, header, children }: PropsWithChildren<{ user?: any, header?: React.ReactNode }>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Dữ liệu người dùng mẫu theo yêu cầu
    const mockUser = user || { name: 'Nguyễn Văn An', code: 'BN000123' };

    const navItems = [
        { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Đặt lịch khám', href: '#', icon: CalendarPlus },
        { name: 'Lịch hẹn', href: '#', icon: Calendar },
        { name: 'Hồ sơ sức khỏe', href: '#', icon: Activity },
        { name: 'Lịch sử khám', href: '#', icon: History },
        { name: 'Kết quả xét nghiệm', href: '#', icon: TestTube },
        { name: 'Đơn thuốc', href: '#', icon: Pill },
        { name: 'Hóa đơn & thanh toán', href: '#', icon: CreditCard },
        { name: 'Thông báo', href: '#', icon: Bell },
        { name: 'Hồ sơ cá nhân', href: '/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
                    <Link href="/dashboard" className="flex items-center gap-2 text-blue-600">
                        <Stethoscope className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">SMART HOSPITAL</span>
                    </Link>
                    <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                window.location.pathname === item.href || (window.location.pathname === '/' && item.href === '/dashboard')
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${
                                window.location.pathname === item.href || (window.location.pathname === '/' && item.href === '/dashboard') ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 space-y-1">
                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        <Settings className="w-5 h-5 text-slate-400" />
                        Cài đặt
                    </Link>
                    <Link method="post" href={route('logout')} as="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-5 h-5 text-red-500" />
                        Đăng xuất
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden text-slate-500 hover:text-slate-700"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        {header && <div className="hidden sm:block">{header}</div>}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-50">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {mockUser.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Mã BN: {mockUser.code}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                {mockUser.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
