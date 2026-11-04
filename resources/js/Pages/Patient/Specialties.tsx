import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, 
    Stethoscope, 
    Users, 
    ArrowRight, 
    CalendarPlus,
    Activity,
    HeartPulse
} from 'lucide-react';
import { useState } from 'react';
import { patientNavItems } from './Dashboard';

interface SpecialtyDoctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
}

interface SpecialtyData {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
    MoTa?: string;
    bac_sis_count?: number;
    bacSis?: SpecialtyDoctor[];
}

interface PatientSpecialtiesProps {
    auth: any;
    specialties: SpecialtyData[];
    filters: {
        search?: string;
    };
}

export default function Specialties({ auth, specialties = [], filters = {} }: PatientSpecialtiesProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/patient/specialties', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Chuyên khoa"
        >
            <Head title="Danh mục Chuyên khoa - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh mục Chuyên khoa khám chữa bệnh</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Hệ thống phòng khám đa chuyên khoa với đội ngũ bác sĩ uy tín và trang thiết bị hiện đại.
                    </p>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm chuyên khoa theo tên hoặc dịch vụ..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Grid Chuyên khoa */}
                {specialties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {specialties.map((spec) => (
                            <div
                                key={spec.MaChuyenKhoa}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                            <HeartPulse className="w-6 h-6" />
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-full">
                                            <Users className="w-3 h-3" />
                                            {spec.bac_sis_count ?? spec.bacSis?.length ?? 0} Bác sĩ
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-lg mt-4 group-hover:text-teal-700 transition-colors">
                                        {spec.TenChuyenKhoa}
                                    </h3>

                                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                                        {spec.MoTa || 'Chẩn đoán, điều trị chuyên sâu với phác đồ hiện đại và an toàn.'}
                                    </p>

                                    {spec.bacSis && spec.bacSis.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 mb-1.5">Bác sĩ phụ trách:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {spec.bacSis.slice(0, 3).map((bs) => (
                                                    <span
                                                        key={bs.MaBacSi}
                                                        className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md"
                                                    >
                                                        {bs.HocVi ? `${bs.HocVi}. ` : 'BS. '}{bs.HoTen}
                                                    </span>
                                                ))}
                                                {spec.bacSis.length > 3 && (
                                                    <span className="text-xs text-slate-400 self-center">
                                                        +{spec.bacSis.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <Link
                                        href={`/patient/doctors?specialty_id=${spec.MaChuyenKhoa}`}
                                        className="text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
                                    >
                                        Xem bác sĩ
                                    </Link>
                                    <Link
                                        href={`/patient/book?specialty_id=${spec.MaChuyenKhoa}`}
                                        className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                                    >
                                        <CalendarPlus className="w-3.5 h-3.5" />
                                        Đặt lịch khám
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Không tìm thấy chuyên khoa nào</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Vui lòng thử lại với từ khóa tìm kiếm khác.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
