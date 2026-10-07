import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Search, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Services() {
    const categories = ['Khám lâm sàng', 'Chẩn đoán hình ảnh', 'Xét nghiệm', 'Gói khám sức khỏe'];
    
    const services = [
        { id: 1, category: 'Khám lâm sàng', name: 'Khám Nội tổng quát', desc: 'Thăm khám ban đầu, đánh giá tổng thể chức năng các cơ quan.', price: '300.000đ', oldPrice: '400.000đ' },
        { id: 2, category: 'Khám lâm sàng', name: 'Khám Chuyên khoa (Có hẹn)', desc: 'Khám chuyên khoa sâu với bác sĩ được chọn theo yêu cầu.', price: '500.000đ', oldPrice: '' },
        { id: 3, category: 'Chẩn đoán hình ảnh', name: 'Siêu âm ổ bụng tổng quát', desc: 'Đánh giá các tạng trong ổ bụng: gan, mật, thận, lách, tụy.', price: '350.000đ', oldPrice: '' },
        { id: 4, category: 'Chẩn đoán hình ảnh', name: 'Chụp X-Quang ngực thẳng', desc: 'Kiểm tra tình trạng phổi, tim và lồng ngực.', price: '180.000đ', oldPrice: '' },
        { id: 5, category: 'Xét nghiệm', name: 'Xét nghiệm máu cơ bản (18 chỉ số)', desc: 'Đánh giá đường huyết, mỡ máu, chức năng gan thận.', price: '550.000đ', oldPrice: '700.000đ' },
        { id: 6, category: 'Gói khám sức khỏe', name: 'Gói Tầm soát ung thư VIP', desc: 'Tầm soát ung thư toàn diện bằng các kỹ thuật tiên tiến nhất.', price: '3.500.000đ', oldPrice: '4.200.000đ' },
    ];

    return (
        <PublicLayout>
            <Head title="Dịch vụ và Bảng giá - SmartCare" />

            {/* Header Section */}
            <div className="bg-primary-light/30 pt-12 pb-16">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-darkblue mb-4">Dịch vụ & Bảng giá tham khảo</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                        Minh bạch chi phí, đa dạng dịch vụ từ khám bệnh cơ bản đến tầm soát chuyên sâu.
                        Chi phí thực tế có thể thay đổi tùy tình trạng bệnh lý khi bác sĩ chỉ định.
                    </p>

                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-2 flex border border-gray-100">
                        <div className="flex-1 flex items-center px-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm dịch vụ, xét nghiệm, gói khám..." 
                                className="w-full border-none focus:ring-0 bg-transparent text-gray-700"
                            />
                        </div>
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-hover">
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="py-12 bg-white min-h-screen">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
                    
                    {/* Sidebar Categories */}
                    <div className="w-full md:w-1/4">
                        <div className="bg-gray-50 rounded-2xl p-4 sticky top-24 border border-gray-100">
                            <h3 className="font-bold text-darkblue mb-4 px-2">Danh mục Dịch vụ</h3>
                            <ul className="space-y-1">
                                <li className="bg-primary text-white rounded-xl px-4 py-2.5 font-medium cursor-pointer shadow-sm shadow-primary/20">
                                    Tất cả dịch vụ
                                </li>
                                {categories.map(cat => (
                                    <li key={cat} className="text-gray-600 hover:bg-gray-100 hover:text-primary rounded-xl px-4 py-2.5 font-medium cursor-pointer transition-colors">
                                        {cat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Service List */}
                    <div className="w-full md:w-3/4 space-y-6">
                        {services.map((srv) => (
                            <div key={srv.id} className="border border-gray-200 rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 bg-white group">
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">{srv.category}</div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{srv.name}</h4>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {srv.desc}
                                    </p>
                                    <ul className="text-sm text-gray-500 space-y-1">
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Kết quả trực tuyến</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Áp dụng BHYT</li>
                                    </ul>
                                </div>
                                <div className="sm:w-48 flex flex-col justify-center sm:items-end border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                                    <div className="text-sm text-gray-500 mb-1">Giá dự kiến</div>
                                    <div className="text-2xl font-bold text-orange-600 mb-1">{srv.price}</div>
                                    {srv.oldPrice && <div className="text-sm text-gray-400 line-through mb-4">{srv.oldPrice}</div>}
                                    
                                    <Link href="/book" className="w-full sm:w-auto px-4 py-2 bg-primary-light/20 text-primary border border-primary text-sm font-medium rounded-xl hover:bg-primary hover:text-white transition-colors text-center inline-block">
                                        Đặt lịch ngay
                                    </Link>
                                </div>
                            </div>
                        ))}

                        <div className="pt-8 flex justify-center">
                            <button className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                                Xem thêm dịch vụ <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
