import { Link, usePage } from '@inertiajs/react';
import { 
    Menu, X, Bell, User, LogOut, Settings, Stethoscope
} from 'lucide-react';
import { useState, PropsWithChildren } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface DashboardLayoutProps {
    role: 'patient' | 'doctor' | 'receptionist' | 'admin';
    navItems: NavItem[];
    user?: any;
    header?: React.ReactNode;
}

export default function DashboardLayout({ role, navItems, user, header, children }: PropsWithChildren<DashboardLayoutProps>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url } = usePage();

    const mockUser = user || { 
        name: role === 'doctor' ? 'BS. Nguyễn Văn A' : 
              role === 'receptionist' ? 'LT. Trần Thị B' : 
              role === 'admin' ? 'Quản trị viên' : 'BN. Nguyễn Văn An', 
        code: role === 'doctor' ? 'BS001' : 
              role === 'receptionist' ? 'LT001' : 
              role === 'admin' ? 'ADMIN' : 'BN000123'
    };

    const roleName = {
        patient: 'Bệnh nhân',
        doctor: 'Bác sĩ',
        receptionist: 'Lễ tân',
        admin: 'Quản trị viên'
    }[role];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <Stethoscope className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">SmartCare</span>
                    </Link>
                    <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phân hệ</div>
                    <div className="text-sm font-medium text-primary mt-1">{roleName}</div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = url.startsWith(item.href) && item.href !== '/' || (url === '/' && item.href === '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-primary-light text-primary font-medium'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${
                                    isActive ? 'text-primary' : 'text-slate-400'
                                }`} />
                                {item.name}
                            </Link>
                        );
                    })}
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

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden text-slate-500 hover:text-slate-700"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        {header && <div className="hidden sm:block text-lg font-medium text-gray-800">{header}</div>}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary-light/50">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">
                                    {mockUser.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {mockUser.code}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold border border-primary/20">
                                {mockUser.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                    {children}
                </div>
            </main>
        </div>
    );
}
