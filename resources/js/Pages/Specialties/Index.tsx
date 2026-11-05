import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Search, Stethoscope, Baby, Smile, Activity, HeartPulse, Brain, Eye } from 'lucide-react';

interface SpecialtyItem {
    MaChuyenKhoa?: number;
    TenChuyenKhoa?: string;
    MoTa?: string;
    bac_sis_count?: number;
    // Fallback fields:
    name?: string;
    desc?: string;
    icon?: any;
    color?: string;
    doctors?: number;
}

interface Props {
    chuyenKhoas?: SpecialtyItem[];
    filters?: {
        search?: string;
    };
}

const defaultSpecialties: SpecialtyItem[] = [
    { MaChuyenKhoa: 1, name: 'Nội tổng quát', desc: 'Khám và điều trị các bệnh lý nội khoa, kiểm tra sức khỏe tổng quát.', icon: Stethoscope, color: 'bg-blue-100 text-blue-600', doctors: 12 },
    { MaChuyenKhoa: 2, name: 'Nhi khoa', desc: 'Chăm sóc sức khỏe toàn diện cho trẻ sơ sinh, trẻ nhỏ và thiếu niên.', icon: Baby, color: 'bg-pink-100 text-pink-600', doctors: 8 },
    { MaChuyenKhoa: 3, name: 'Tai mũi họng', desc: 'Chẩn đoán và điều trị các bệnh lý về tai, mũi, họng và vùng đầu cổ.', icon: Smile, color: 'bg-green-100 text-green-600', doctors: 5 },
    { MaChuyenKhoa: 4, name: 'Da liễu', desc: 'Khám và điều trị các bệnh về da, tóc, móng và các bệnh lây truyền qua đường tình dục.', icon: Activity, color: 'bg-orange-100 text-orange-600', doctors: 6 },
    { MaChuyenKhoa: 5, name: 'Sản phụ khoa', desc: 'Chăm sóc sức khỏe sinh sản, theo dõi thai kỳ và điều trị bệnh phụ khoa.', icon: HeartPulse, color: 'bg-rose-100 text-rose-600', doctors: 10 },
    { MaChuyenKhoa: 6, name: 'Thần kinh', desc: 'Điều trị các bệnh lý về não, tủy sống, dây thần kinh và cơ bắp.', icon: Brain, color: 'bg-purple-100 text-purple-600', doctors: 4 },
    { MaChuyenKhoa: 7, name: 'Nhãn khoa', desc: 'Khám, đo thị lực và điều trị các bệnh lý về mắt.', icon: Eye, color: 'bg-teal-100 text-teal-600', doctors: 7 },
];

export default function Specialties({ chuyenKhoas: initialSpecialties, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/specialties', {
            search: search || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasBackendData = initialSpecialties && initialSpecialties.length > 0;
    const specialtyList = hasBackendData ? initialSpecialties : defaultSpecialties;

    return (
        <PublicLayout>
            <Head title="Danh sách Chuyên khoa - SmartCare" />

            <div className="bg-primary-light/30 pt-12 pb-20">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-darkblue mb-4">Danh sách Chuyên khoa</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-10">
                        SmartCare tự hào cung cấp dịch vụ y tế toàn diện với nhiều chuyên khoa đa dạng, 
                        được phụ trách bởi đội ngũ bác sĩ chuyên gia hàng đầu.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto bg-white rounded-full shadow-sm p-2 flex border border-gray-100">
                        <div className="flex-1 flex items-center px-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm chuyên khoa..." 
                                className="w-full border-none focus:ring-0 bg-transparent text-gray-700"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary-hover transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>

            <div className="py-16 bg-white">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {specialtyList.map((spec, i) => {
                            const specId = spec.MaChuyenKhoa || (i + 1);
                            const name = spec.TenChuyenKhoa || spec.name || 'Chuyên khoa';
                            const desc = spec.MoTa || spec.desc || '';
                            const docCount = spec.bac_sis_count ?? spec.doctors ?? 0;
                            const IconComponent = spec.icon || Stethoscope;
                            const colorClass = spec.color || 'bg-blue-100 text-blue-600';

                            return (
                                <div key={specId} className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white flex flex-col h-full group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass} group-hover:scale-110 transition-transform`}>
                                            <IconComponent className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-darkblue group-hover:text-primary transition-colors">
                                                {name}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {docCount > 0 ? `${docCount} Bác sĩ chuyên khoa` : 'Đang cập nhật bác sĩ'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm flex-1 mb-6 line-clamp-3">
                                        {desc}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Link 
                                            href={`/specialties/${specId}`}
                                            className="flex-1 text-center py-2.5 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors text-sm"
                                        >
                                            Chi tiết khoa
                                        </Link>
                                        <Link 
                                            href={`/doctors?specialty_id=${specId}`} 
                                            className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors text-sm"
                                        >
                                            Xem bác sĩ
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
