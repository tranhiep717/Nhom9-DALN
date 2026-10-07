import { Link } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Menu, X, MessageCircle } from 'lucide-react';

export default function PublicLayout({ children }: PropsWithChildren) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        {/* Logo & Menu (Desktop) */}
                        <div className="flex items-center">
                            <div className="shrink-0 flex items-center">
                                <Link href="/" className="flex items-center gap-2">
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
                            <Link href={route('login')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                Đăng nhập
                            </Link>
                            <Link href={route('register')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                Đăng ký
                            </Link>
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
                        <div className="flex gap-4">
                            <Link href={route('login')} className="flex-1 flex justify-center py-2.5 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                                Đăng nhập
                            </Link>
                            <Link href={route('register')} className="flex-1 flex justify-center py-2.5 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                                Đăng ký
                            </Link>
                        </div>
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

            {/* AI Assistant Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {isChatOpen && (
                    <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-4 flex flex-col h-96">
                        <div className="bg-primary text-white p-4 flex justify-between items-center">
                            <span className="font-medium">Trợ lý ảo SmartCare</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 text-sm">
                            <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm inline-block max-w-[85%] mb-4 border border-gray-100 text-gray-700">
                                Chào bạn! Tôi là trợ lý ảo SmartCare. Tôi có thể giúp bạn hướng dẫn đặt lịch khám, tìm hiểu các chức năng của hệ thống. Vui lòng cho tôi biết bạn cần hỗ trợ gì?
                                <br/><br/>
                                <i>(Lưu ý: Tôi không chẩn đoán hay kê đơn thuốc).</i>
                            </div>
                        </div>
                        <div className="p-3 border-t border-gray-100 bg-white">
                            <input 
                                type="text" 
                                placeholder="Nhập câu hỏi..." 
                                className="w-full text-sm rounded-xl border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                disabled
                            />
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="h-14 w-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-primary/30"
                >
                    {isChatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
                </button>
            </div>
        </div>
    );
}
