import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import AiChatWidget from '@/Components/AiChatWidget';

export default function PublicLayout({ children }: PropsWithChildren) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const { props } = usePage();
    const authUser = (props as any)?.auth?.user;

    const getDashboardUrl = () => {
        if (!authUser) return '/';
        const role = authUser.vai_tro?.TenVaiTro;
        if (role === 'QUAN_TRI_VIEN') return '/admin/dashboard';
        if (role === 'BAC_SI') return '/doctor/dashboard';
        if (role === 'LE_TAN') return '/receptionist/dashboard';
        if (role === 'NHAN_VIEN_CAN_LAM_SANG') return '/cls/dashboard';
        return '/dashboard';
    };

    const getDisplayName = () => {
        if (!authUser) return '';
        return authUser.name || authUser.HoTen || authUser.bac_si?.HoTen || authUser.benh_nhan?.HoTen || authUser.TenDangNhap || 'Tài khoản';
    };

    return (
        <div className="min-h-screen bg-neutral">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        {/* Logo & Menu (Desktop) */}
                        <div className="flex items-center">
                            <div className="shrink-0 flex items-center">
                                <Link href={getDashboardUrl()} className="flex items-center gap-2">
                                    <ApplicationLogo className="block h-10 w-auto" />
                                    <span className="text-xl font-bold text-darkblue hidden sm:block">SmartCare</span>
                                </Link>
                            </div>
                            <div className="hidden lg:-my-px lg:ml-10 lg:flex lg:space-x-8">
                                <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-primary text-sm font-medium text-darkblue">
                                    Trang chủ
                                </Link>
                                <Link href="/specialties" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                                    Chuyên khoa
                                </Link>
                                <Link href="/doctors" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                                    Bác sĩ
                                </Link>
                                <Link href="/services" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                                    Dịch vụ
                                </Link>
                                <a href="#" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition duration-150 ease-in-out">
                                    Hướng dẫn khám
                                </a>
                            </div>
                        </div>

                        {/* Right side (Desktop) */}
                        <div className="hidden lg:flex lg:items-center lg:ml-6 gap-4">
                            {authUser ? (
                                <div className="flex items-center gap-3">
                                    <Link 
                                        href={getDashboardUrl()} 
                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-primary bg-primary-light/60 hover:bg-primary-light transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        <span>Bảng điều khiển</span>
                                        <span className="text-xs text-slate-500 font-normal">({getDisplayName()})</span>
                                    </Link>
                                    <Link
                                        method="post"
                                        href={route('logout')}
                                        as="button"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 text-red-500" />
                                        <span>Đăng xuất</span>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                        Đăng nhập
                                    </Link>
                                    <Link href={route('register')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                        Đăng ký
                                    </Link>
                                </>
                            )}
                            <Link
                                href="/book"
                                className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-[12px] text-white bg-primary hover:bg-primary-hover shadow-sm transition-all active:scale-95"
                            >
                                Đặt lịch khám
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="-mr-2 flex items-center lg:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                            >
                                {showingNavigationDropdown ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' lg:hidden border-t border-gray-100 bg-white absolute w-full'}>
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        <Link href="/" className="block pl-3 pr-4 py-2 border-l-4 border-primary text-base font-medium text-darkblue bg-primary-light/30">
                            Trang chủ
                        </Link>
                        <a href="#" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
                            Chuyên khoa
                        </a>
                        <a href="#" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
                            Bác sĩ
                        </a>
                        <a href="#" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
                            Dịch vụ
                        </a>
                        <a href="#" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
                            Hướng dẫn khám
                        </a>
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200 px-4 space-y-3">
                        <Link href="/book" className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-sm">
                            Đặt lịch khám
                        </Link>
                        {authUser ? (
                            <div className="space-y-2">
                                <Link 
                                    href={getDashboardUrl()} 
                                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-primary/30 rounded-xl text-base font-semibold text-primary bg-primary-light/40"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    <span>Bảng điều khiển ({getDisplayName()})</span>
                                </Link>
                                <Link 
                                    method="post" 
                                    href={route('logout')} 
                                    as="button" 
                                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-red-200 rounded-xl text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    <LogOut className="w-5 h-5 text-red-500" />
                                    <span>Đăng xuất</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <Link href={route('login')} className="flex-1 flex justify-center py-2.5 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    Đăng nhập
                                </Link>
                                <Link href={route('register')} className="flex-1 flex justify-center py-2.5 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-dark text-white pt-16 pb-8">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <ApplicationLogo className="block h-10 w-auto" />
                                <span className="text-xl font-bold text-white">SmartCare</span>
                            </Link>
                            <p className="text-sm text-gray-400 mb-4">
                                Đặt lịch thuận tiện – Chăm sóc chủ động.<br />
                                Nền tảng y tế thông minh, kết nối bác sĩ và bệnh nhân.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Khám bệnh</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Đặt lịch khám</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Chuyên khoa</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Danh sách bác sĩ</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Bảng giá dịch vụ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Hỗ trợ</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn đi khám</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Liên hệ (Minh họa)</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li>Hotline: 1900 1234</li>
                                <li>Email: support@smartcare-demo.vn</li>
                                <li>Địa chỉ: 123 Đường Demo, Quận 1, TP.HCM</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-400 text-center flex flex-col md:flex-row justify-between items-center">
                        <p>&copy; {new Date().getFullYear()} SmartCare. Prototype by Antigravity.</p>
                        <p className="mt-2 md:mt-0 text-xs">Dữ liệu và thông tin trên trang chỉ mang tính chất minh họa.</p>
                    </div>
                </div>
            </footer>

            {/* SmartCare AI Chatbot Assistant Widget */}
            <AiChatWidget />
        </div>
    );
}
