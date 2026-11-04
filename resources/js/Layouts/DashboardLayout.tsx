import { Link, usePage } from '@inertiajs/react';
import { 
    Menu, X, Bell, User, LogOut, Settings, Stethoscope, ChevronDown, ShieldCheck
} from 'lucide-react';
import { useState, useRef, useEffect, PropsWithChildren } from 'react';
import AiChatWidget from '@/Components/AiChatWidget';
import NotificationDropdown from '@/Components/NotificationDropdown';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

interface DashboardLayoutProps {
    role: 'patient' | 'doctor' | 'receptionist' | 'admin' | 'cls';
    navItems: NavItem[];
    user?: any;
    header?: React.ReactNode;
}

export default function DashboardLayout({ role, navItems, user, header, children }: PropsWithChildren<DashboardLayoutProps>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { url, props } = usePage();
    const authUser = (props as any)?.auth?.user;

    const defaultName = role === 'doctor' ? 'Bác sĩ chuyên khoa' : 
                        role === 'receptionist' ? 'Nhân viên lễ tân' : 
                        role === 'cls' ? 'Kỹ thuật viên Cận lâm sàng' :
                        role === 'admin' ? 'Quản trị viên hệ thống' : 'Bệnh nhân SmartCare';
    const defaultCode = role === 'doctor' ? 'BS-SC' : 
                        role === 'receptionist' ? 'LT-SC' : 
                        role === 'cls' ? 'KTV-CLS' :
                        role === 'admin' ? 'ADMIN' : 'BN-SC';

    // Xác định tên và mã hiển thị an toàn từ prop user hoặc auth.user
    const currentObj = user || authUser;
    const displayName = currentObj?.name 
        || currentObj?.HoTen 
        || currentObj?.bac_si?.HoTen 
        || currentObj?.benh_nhan?.HoTen 
        || currentObj?.TenDangNhap 
        || defaultName;

    const displayCode = currentObj?.code 
        || (currentObj?.bac_si?.MaBacSi ? `BS${String(currentObj.bac_si.MaBacSi).padStart(3, '0')}` : null) 
        || (currentObj?.benh_nhan?.MaBenhNhan ? `BN${String(currentObj.benh_nhan.MaBenhNhan).padStart(6, '0')}` : null) 
        || defaultCode;

    const roleName = {
        patient: 'Bệnh nhân',
        doctor: 'Bác sĩ',
        receptionist: 'Lễ tân',
        cls: 'Cận lâm sàng',
        admin: 'Quản trị viên'
    }[role];

    const getLogoUrl = () => {
        if (role === 'admin' || authUser?.vai_tro?.TenVaiTro === 'QUAN_TRI_VIEN') return '/admin/dashboard';
        if (role === 'doctor' || authUser?.vai_tro?.TenVaiTro === 'BAC_SI') return '/doctor/dashboard';
        if (role === 'receptionist' || authUser?.vai_tro?.TenVaiTro === 'LE_TAN') return '/receptionist/dashboard';
        if (role === 'cls' || authUser?.vai_tro?.TenVaiTro === 'NHAN_VIEN_CAN_LAM_SANG') return '/cls/dashboard';
        if (role === 'patient' || authUser?.vai_tro?.TenVaiTro === 'BENH_NHAN') return '/dashboard';
        return '/';
    };

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setUserDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    <Link href={getLogoUrl()} className="flex items-center gap-2 text-primary" title="Bảng điều khiển">
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
                    <Link 
                        method="post" 
                        href={route('logout')} 
                        as="button" 
                        id="btn-sidebar-logout"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                    >
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
                        <NotificationDropdown />
                        
                        <div className="h-8 w-px bg-slate-200 mx-2"></div>
                        
                        {/* Profile User Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-3 cursor-pointer group focus:outline-none p-1 rounded-xl hover:bg-slate-50 transition-colors"
                                aria-label="Menu tài khoản"
                                id="btn-header-user-menu"
                            >
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors max-w-[160px] truncate">
                                        {displayName}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                        <span>{displayCode}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{roleName}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
                                    {(displayName.trim().charAt(0) || 'U').toUpperCase()}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${userDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                            </button>

                            {/* Dropdown Menu Header */}
                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Đang đăng nhập</div>
                                        <div className="text-sm font-bold text-slate-800 truncate mt-0.5">{displayName}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{displayCode} • {roleName}</div>
                                    </div>
                                    <div className="px-2 py-1">
                                        <Link 
                                            href={role === 'admin' ? '/admin/dashboard' : role === 'doctor' ? '/doctor/dashboard' : role === 'receptionist' ? '/receptionist/dashboard' : '/dashboard'}
                                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                            Bảng điều khiển
                                        </Link>
                                    </div>
                                    <div className="border-t border-slate-100 px-2 pt-1">
                                        <Link 
                                            method="post" 
                                            href={route('logout')} 
                                            as="button" 
                                            id="btn-header-logout"
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                                            onClick={() => setUserDropdownOpen(false)}
                                        >
                                            <LogOut className="w-4 h-4 text-red-500" />
                                            Đăng xuất
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                    {children}
                </div>

                {/* Trợ lý AI thông minh cho Bệnh nhân */}
                {role === 'patient' && <AiChatWidget />}
            </main>
        </div>
    );
}
