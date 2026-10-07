import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Search, Calendar, FileText, Activity, HeartPulse, Stethoscope, Baby, Smile, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Welcome({ auth }: PageProps<{}>) {
    return (
        <PublicLayout>
            <Head title="Phòng khám thông minh SmartCare" />

            {/* B. Banner chính */}
            <section className="bg-primary-light/40 pt-10 pb-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-darkblue leading-tight mb-6 tracking-tight">
                                Chủ động đặt lịch, <br/>
                                <span className="text-primary">an tâm thăm khám</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 max-w-xl">
                                Nền tảng y tế thông minh SmartCare giúp bạn dễ dàng chọn bác sĩ, đặt lịch hẹn và theo dõi hồ sơ sức khỏe mọi lúc mọi nơi.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link 
                                    href="/book" 
                                    className="inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all"
                                >
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Đặt lịch khám
                                </Link>
                                <button className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-primary text-base font-medium rounded-xl text-primary bg-white hover:bg-primary-light/50 transition-all">
                                    <Search className="w-5 h-5 mr-2" />
                                    Tìm bác sĩ
                                </button>
                            </div>
                        </div>
                        <div className="hidden lg:flex justify-center relative">
                            {/* Abstract Medical Illustration placeholder */}
                            <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center border border-gray-100 overflow-hidden">
                                <div className="absolute top-4 left-4 w-20 h-20 bg-blue-100 rounded-2xl rotate-12 opacity-50"></div>
                                <div className="absolute bottom-4 right-4 w-24 h-24 bg-teal-100 rounded-full opacity-50"></div>
                                <HeartPulse className="w-32 h-32 text-primary mb-6 animate-pulse" />
                                <div className="text-center">
                                    <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                                    <div className="h-3 w-48 bg-gray-100 rounded mx-auto"></div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 w-max">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Đã xác nhận lịch hẹn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. Thanh tìm kiếm */}
            <section className="relative z-10 -mt-8 max-w-[1000px] mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-lg p-2 sm:p-3 flex flex-col sm:flex-row gap-2 border border-gray-100">
                    <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-transparent focus-within:border-primary focus-within:bg-white transition-all">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm bác sĩ, chuyên khoa, dịch vụ..."
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-700 py-3"
                        />
                    </div>
                    <button className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-medium transition-colors">
                        Tìm kiếm
                    </button>
                </div>
            </section>

            {/* D. Ba thẻ truy cập nhanh */}
            <section className="py-16 bg-neutral">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/book" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex items-center gap-4 hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-darkblue mb-1">Đặt lịch khám</h3>
                                <p className="text-sm text-gray-500">Chủ động chọn ngày giờ</p>
                            </div>
                        </Link>
                        <Link href="/appointments" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex items-center gap-4 hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-darkblue mb-1">Lịch hẹn của tôi</h3>
                                <p className="text-sm text-gray-500">Xem và quản lý lịch</p>
                            </div>
                        </Link>
                        <Link href="/records" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex items-center gap-4 hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-darkblue mb-1">Hồ sơ khám bệnh</h3>
                                <p className="text-sm text-gray-500">Tra cứu kết quả online</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* E. Danh mục chuyên khoa */}
            <section className="py-16 bg-white">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-darkblue mb-2">Chuyên khoa nổi bật</h2>
                            <p className="text-gray-600">Đội ngũ chuyên gia hàng đầu trong các lĩnh vực</p>
                        </div>
                        <a href="#" className="hidden sm:inline-flex items-center font-medium text-primary hover:text-primary-hover">
                            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                        {[
                            { name: 'Nội tổng quát', icon: Stethoscope, color: 'bg-blue-100 text-blue-600' },
                            { name: 'Nhi khoa', icon: Baby, color: 'bg-pink-100 text-pink-600' },
                            { name: 'Tai mũi họng', icon: Smile, color: 'bg-green-100 text-green-600' },
                            { name: 'Răng hàm mặt', icon: Smile, color: 'bg-purple-100 text-purple-600' },
                            { name: 'Da liễu', icon: Activity, color: 'bg-orange-100 text-orange-600' },
                            { name: 'Sản phụ khoa', icon: HeartPulse, color: 'bg-rose-100 text-rose-600' },
                        ].map((spec, i) => (
                            <Link href="#" key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-all group">
                                <div className={`w-16 h-16 rounded-2xl ${spec.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <spec.icon className="w-8 h-8" />
                                </div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{spec.name}</h4>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* F. Bác sĩ */}
            <section className="py-16 bg-neutral">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-darkblue mb-2">Bác sĩ nổi bật</h2>
                            <p className="text-gray-600">Được đào tạo chuyên sâu, tận tâm với bệnh nhân</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'BS. Nguyễn Văn A', spec: 'Nội tổng quát', exp: '15 năm', ava: 'A' },
                            { name: 'BS. Trần Thị B', spec: 'Nhi khoa', exp: '10 năm', ava: 'B' },
                            { name: 'BS. Lê Văn C', spec: 'Tai mũi họng', exp: '12 năm', ava: 'C' },
                            { name: 'BS. Phạm Thị D', spec: 'Da liễu', exp: '8 năm', ava: 'D' },
                        ].map((doctor, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 transition-all group flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-xl font-bold text-primary shrink-0 group-hover:scale-105 transition-transform">
                                        {doctor.ava}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-darkblue text-lg line-clamp-1">{doctor.name}</h4>
                                        <p className="text-sm text-primary font-medium">{doctor.spec}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mb-6 flex-1">
                                    <p className="mb-1">• Kinh nghiệm: {doctor.exp}</p>
                                    <p>• Lịch khám: Thứ 2 - Thứ 6</p>
                                </div>
                                <Link href="/book" className="w-full block text-center py-2.5 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors">
                                    Đặt lịch
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* G. Dịch vụ */}
            <section className="py-16 bg-white">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-darkblue mb-10 text-center">Các dịch vụ tiêu biểu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Khám tổng quát cơ bản', desc: 'Kiểm tra toàn diện các chỉ số sinh tồn và chức năng cơ quan.', price: '500.000đ' },
                            { name: 'Khám chuyên khoa', desc: 'Được thăm khám trực tiếp bởi bác sĩ chuyên khoa.', price: '300.000đ' },
                            { name: 'Gói tầm soát ung thư', desc: 'Xét nghiệm marker ung thư và chẩn đoán hình ảnh.', price: '2.500.000đ' },
                        ].map((srv, i) => (
                            <div key={i} className="border border-gray-200 rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all">
                                <h4 className="text-xl font-bold text-gray-800 mb-3">{srv.name}</h4>
                                <p className="text-gray-600 mb-4 h-12 line-clamp-2">{srv.desc}</p>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Giá minh họa</span>
                                        <span className="text-lg font-bold text-primary">{srv.price}</span>
                                    </div>
                                    <button className="text-primary font-medium hover:underline text-sm">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* H. Quy trình khám */}
            <section className="py-20 bg-darkblue text-white">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Quy trình khám bệnh 5 bước</h2>
                    <div className="relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-white/20 -translate-y-1/2"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                            {[
                                { step: '01', title: 'Đặt lịch', desc: 'Chọn bác sĩ, giờ khám trên ứng dụng' },
                                { step: '02', title: 'Tiếp nhận', desc: 'Đến quầy xác nhận tại phòng khám' },
                                { step: '03', title: 'Khám bác sĩ', desc: 'Thăm khám lâm sàng tại phòng' },
                                { step: '04', title: 'Chỉ định', desc: 'Thực hiện xét nghiệm nếu có' },
                                { step: '05', title: 'Hoàn tất', desc: 'Thanh toán và nhận kết quả online' },
                            ].map((item, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold border-4 border-darkblue shadow-xl mb-4">
                                        {item.step}
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                                    <p className="text-sm text-gray-300">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
