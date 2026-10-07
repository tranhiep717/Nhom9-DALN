import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Search, MapPin, Star, GraduationCap } from 'lucide-react';

export default function Doctors() {
    const doctors = [
        { id: 1, name: 'BS. Nguyễn Văn A', spec: 'Nội tổng quát', exp: '15 năm', ava: 'A', degree: 'Thạc sĩ - Bác sĩ' },
        { id: 2, name: 'BS. Trần Thị B', spec: 'Nhi khoa', exp: '10 năm', ava: 'B', degree: 'Bác sĩ CK I' },
        { id: 3, name: 'BS. Lê Văn C', spec: 'Tai mũi họng', exp: '12 năm', ava: 'C', degree: 'Tiến sĩ - Bác sĩ' },
        { id: 4, name: 'BS. Phạm Thị D', spec: 'Da liễu', exp: '8 năm', ava: 'D', degree: 'Bác sĩ CK I' },
        { id: 5, name: 'BS. Hoàng Văn E', spec: 'Sản phụ khoa', exp: '20 năm', ava: 'E', degree: 'Bác sĩ CK II' },
        { id: 6, name: 'BS. Vũ Thị F', spec: 'Thần kinh', exp: '14 năm', ava: 'F', degree: 'Thạc sĩ - Bác sĩ' },
        { id: 7, name: 'BS. Đặng Văn G', spec: 'Nội tổng quát', exp: '9 năm', ava: 'G', degree: 'Bác sĩ Đa khoa' },
        { id: 8, name: 'BS. Ngô Thị H', spec: 'Nhãn khoa', exp: '11 năm', ava: 'H', degree: 'Bác sĩ CK I' },
    ];

    return (
        <PublicLayout>
            <Head title="Danh sách Bác sĩ - SmartCare" />

            <div className="bg-primary-light/30 pt-12 pb-20 border-b border-primary-light/50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-darkblue mb-4">Đội ngũ Bác sĩ Chuyên gia</h1>
                        <p className="text-gray-600">
                            Các bác sĩ tại SmartCare đều được đào tạo bài bản, có nhiều năm kinh nghiệm tại các bệnh viện lớn, 
                            luôn tận tâm và đặt sức khỏe của bệnh nhân lên hàng đầu.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl">
                            <Search className="w-5 h-5 text-gray-400 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Tên bác sĩ, học vị..." 
                                className="w-full border-none focus:ring-0 bg-transparent text-gray-700 py-3"
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                            <select className="w-full border-none focus:ring-0 bg-transparent text-gray-700 py-3 appearance-none">
                                <option value="">Tất cả chuyên khoa</option>
                                <option value="noi">Nội tổng quát</option>
                                <option value="nhi">Nhi khoa</option>
                                <option value="tmh">Tai mũi họng</option>
                                <option value="dalieu">Da liễu</option>
                            </select>
                        </div>
                        <button className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors shrink-0">
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>

            <div className="py-16 bg-neutral">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {doctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-100 transition-all group flex flex-col h-full">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-3xl font-bold text-primary mb-4 group-hover:scale-110 transition-transform">
                                        {doctor.ava}
                                    </div>
                                    <h3 className="font-bold text-darkblue text-lg text-center leading-tight mb-1">{doctor.name}</h3>
                                    <p className="text-primary font-medium text-sm">{doctor.spec}</p>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-6 space-y-2 flex-1">
                                    <div className="flex items-start gap-2">
                                        <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <span>{doctor.degree}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Star className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <span>Kinh nghiệm: {doctor.exp}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Link href="/book" className="flex-1 block text-center py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors text-sm shadow-sm shadow-primary/20">
                                        Đặt lịch
                                    </Link>
                                    <button className="flex-1 block text-center py-2.5 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors text-sm">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <button className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                            Xem thêm bác sĩ
                        </button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
