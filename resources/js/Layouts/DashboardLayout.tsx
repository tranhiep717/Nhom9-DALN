import { Link, usePage, router } from '@inertiajs/react';
import { 
    Menu, X, Bell, User, LogOut, Settings, Stethoscope, ChevronDown, ShieldCheck,
    Clock, AlertTriangle, CheckCircle2, LogIn, Loader2, Calendar
} from 'lucide-react';
import { useState, useRef, useEffect, PropsWithChildren } from 'react';
import axios from 'axios';
import AiChatWidget from '@/Components/AiChatWidget';
import NotificationDropdown from '@/Components/NotificationDropdown';
import { RECEPTIONIST_NAV_ITEMS, DOCTOR_NAV_ITEMS, NavItem } from '@/constants/navigation';

export type { NavItem };

interface DashboardLayoutProps {
    role: 'patient' | 'doctor' | 'receptionist' | 'admin' | 'cls';
    navItems?: NavItem[];
    user?: any;
    header?: React.ReactNode;
}

export default function DashboardLayout({ role, navItems, user, header, children }: PropsWithChildren<DashboardLayoutProps>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { url, props } = usePage();
    const authUser = (props as any)?.auth?.user;

    // Chuẩn hóa menu dùng chung cho Receptionist và Doctor
    const effectiveNavItems = (navItems && navItems.length > 0)
        ? navItems
        : (role === 'doctor' ? DOCTOR_NAV_ITEMS : (role === 'receptionist' ? RECEPTIONIST_NAV_ITEMS : (navItems || [])));

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
        || currentObj?.nhan_vien?.HoTen 
        || currentObj?.benh_nhan?.HoTen 
        || currentObj?.TenDangNhap 
        || defaultName;

    const displayCode = currentObj?.code 
        || (currentObj?.bac_si?.MaBacSi ? `BS${String(currentObj.bac_si.MaBacSi).padStart(3, '0')}` : null) 
        || (currentObj?.nhan_vien?.MaNhanVien ? `${currentObj.nhan_vien.LoaiNhanVien === 'LE_TAN' ? 'LT' : 'CLS'}${String(currentObj.nhan_vien.MaNhanVien).padStart(3, '0')}` : null) 
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

    // Kiểm tra trạng thái điểm danh vào ca trực của nhân viên
    const isStaff = role === 'doctor' || role === 'receptionist' || role === 'cls';
    const isAttendancePage = url.includes('/attendance');
    const todayAttendance = (props as any)?.auth?.todayAttendance;
    const todaySchedule = (props as any)?.auth?.todaySchedule;
    const hasCheckedIn = Boolean(todayAttendance?.GioCheckIn);
    const isBlockedByCheckIn = isStaff && !hasCheckedIn && !isAttendancePage;

    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const [checkInSuccess, setCheckInSuccess] = useState(false);

    const handleQuickCheckIn = async () => {
        setIsCheckingIn(true);
        setCheckInError(null);
        try {
            const rolePrefix = role === 'cls' ? 'cls' : role === 'doctor' ? 'doctor' : 'receptionist';
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const res = await axios.post(`/${rolePrefix}/attendance/check-in`, {
                NgayChamCong: dateStr,
                GioCheckIn: timeStr,
            }, {
                headers: { 'Accept': 'application/json' }
            });

            if (res.data?.success) {
                setCheckInSuccess(true);
                setTimeout(() => {
                    router.reload();
                }, 600);
            } else {
                setCheckInError(res.data?.message || 'Không thể điểm danh vào ca.');
            }
        } catch (err: any) {
            setCheckInError(err.response?.data?.message || 'Lỗi khi điểm danh vào ca. Vui lòng thử lại!');
        } finally {
            setIsCheckingIn(false);
        }
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
                    {effectiveNavItems.map((item) => {
                        const currentPath = url.split('?')[0];
                        const isActive = 
                            (item.href === '/' && currentPath === '/') ||
                            (item.href !== '/' && (
                                currentPath === item.href ||
                                currentPath.startsWith(item.href + '/') ||
                                (item.href === '/receptionist/payment' && currentPath.startsWith('/receptionist/invoices'))
                            ));
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

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gray-50 relative">
                    {/* Banner cảnh báo chưa vào ca */}
                    {isStaff && !hasCheckedIn && (
                        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                                        THÔNG BÁO VÀO CA BẮT BUỘC: Bạn chưa điểm danh vào ca trực hôm nay!
                                    </h4>
                                    <p className="text-xs text-amber-800 mt-0.5">
                                        Theo quy định, {roleName.toLowerCase()} cần điểm danh (Check-in) trước khi thực hiện các tác vụ khám bệnh, phát số, thu tiền hoặc thực hiện cận lâm sàng.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                <button
                                    onClick={handleQuickCheckIn}
                                    disabled={isCheckingIn}
                                    className="flex-1 md:flex-initial px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {isCheckingIn ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Đang vào ca...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-3.5 h-3.5" />
                                            Điểm danh vào ca ngay
                                        </>
                                    )}
                                </button>
                                <Link
                                    href={`/${role === 'cls' ? 'cls' : role}/attendance`}
                                    className="px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-xl border border-amber-200 transition-all flex items-center gap-1.5"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    Xem lịch trực
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Vùng nội dung chính - Nếu chưa vào ca thì làm mờ và khóa thao tác */}
                    <div className={isBlockedByCheckIn ? 'pointer-events-none filter blur-[1.5px] opacity-40 select-none transition-all' : 'transition-all'}>
                        {children}
                    </div>

                    {/* Modal khóa bắt buộc vào ca khi chưa điểm danh (và không phải đang ở trang chấm công) */}
                    {isBlockedByCheckIn && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <Clock className="w-8 h-8 animate-pulse" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    BẮT BUỘC ĐIỂM DANH VÀO CA
                                </h3>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    Xin chào <strong className="text-slate-800">{displayName}</strong> ({roleName}), hệ thống ghi nhận bạn chưa Check-in ca trực hôm nay. Để đảm bảo tính chính xác cho hồ sơ khám chữa bệnh và bảng lương, vui lòng xác nhận vào ca trước khi làm việc.
                                </p>

                                {todaySchedule && (
                                    <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                                        <div className="text-slate-500 font-medium">Lịch làm việc phân công hôm nay:</div>
                                        <div className="font-bold text-slate-800 text-sm">
                                            {todaySchedule.CaLamViec || 'Ca ngày'} ({todaySchedule.GioBatDau?.slice(0, 5) || '08:00'} - {todaySchedule.GioKetThuc?.slice(0, 5) || '17:00'})
                                        </div>
                                    </div>
                                )}

                                {checkInError && (
                                    <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                                        {checkInError}
                                    </div>
                                )}

                                {checkInSuccess && (
                                    <div className="mt-3 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-bold flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Điểm danh thành công! Đang tải lại dữ liệu ca trực...
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleQuickCheckIn}
                                        disabled={isCheckingIn || checkInSuccess}
                                        className="flex-1 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isCheckingIn ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang xác nhận...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="w-4 h-4" />
                                                Vào ca trực ngay
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href={`/${role === 'cls' ? 'cls' : role}/attendance`}
                                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Xem lịch trực
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Trợ lý AI thông minh cho Bệnh nhân */}
                {role === 'patient' && <AiChatWidget />}
            </main>
        </div>
    );
}
