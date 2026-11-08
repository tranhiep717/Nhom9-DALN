import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, 
    Filter, 
    Stethoscope, 
    Calendar, 
    Clock, 
    ChevronRight, 
    Award, 
    BookOpen, 
    Phone, 
    Mail,
    CheckCircle2,
    CalendarPlus
} from 'lucide-react';
import { useState } from 'react';
import { patientNavItems } from './Dashboard';

interface DoctorItem {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    SoNamKinhNghiem?: number;
    MoTa?: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
    MaChuyenKhoa?: number;
    chuyenKhoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
    lichLamViecs?: Array<{
        MaLichLamViec: number;
        NgayLamViec: string;
        caKhams?: Array<{
            MaCaKham: number;
            GioBatDau: string;
            GioKetThuc: string;
            TrangThai: string;
        }>;
        ca_khams?: Array<{
            MaCaKham: number;
            GioBatDau: string;
            GioKetThuc: string;
            TrangThai: string;
        }>;
    }>;
    lich_lam_viecs?: Array<{
        MaLichLamViec: number;
        NgayLamViec: string;
        caKhams?: Array<{
            MaCaKham: number;
            GioBatDau: string;
            GioKetThuc: string;
            TrangThai: string;
        }>;
        ca_khams?: Array<{
            MaCaKham: number;
            GioBatDau: string;
            GioKetThuc: string;
            TrangThai: string;
        }>;
    }>;
}

interface SpecialtyItem {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
}

interface PatientDoctorsProps {
    auth: any;
    doctors: DoctorItem[];
    chuyenKhoas: SpecialtyItem[];
    filters: {
        search?: string;
        specialty_id?: string;
    };
}

export default function Doctors({ auth, doctors = [], chuyenKhoas = [], filters = {} }: PatientDoctorsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [specialtyId, setSpecialtyId] = useState(filters.specialty_id || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/patient/doctors', {
            search: search || undefined,
            specialty_id: specialtyId || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSpecialtyChange = (newSpecId: string) => {
        setSpecialtyId(newSpecId);
        router.get('/patient/doctors', {
            search: search || undefined,
            specialty_id: newSpecId || undefined,
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
            header="Đội ngũ Bác sĩ"
        >
            <Head title="Đội ngũ Bác sĩ - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh sách Bác sĩ chuyên khoa</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Tra cứu đội ngũ y bác sĩ giàu kinh nghiệm, xem lịch khám và đặt hẹn trực tuyến nhanh chóng.
                    </p>
                </div>

                {/* Thanh tìm kiếm & lọc */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên bác sĩ, học vị..."
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

                    <div className="w-full sm:w-64 shrink-0">
                        <select
                            value={specialtyId}
                            onChange={(e) => handleSpecialtyChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả chuyên khoa</option>
                            {chuyenKhoas.map((ck) => (
                                <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                    {ck.TenChuyenKhoa}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Danh sách thẻ Bác sĩ */}
                {doctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => {
                            const specName = doctor.chuyenKhoa?.TenChuyenKhoa || 'Chuyên khoa tổng quát';
                            const title = doctor.HocVi ? `${doctor.HocVi}. ` : 'BS. ';

                            // Đếm ca khám khả dụng sắp tới
                            const schedulesList = doctor.lichLamViecs || doctor.lich_lam_viecs || [];
                            let upcomingSlotsCount = 0;
                            schedulesList.forEach((llv) => {
                                const slots = llv.caKhams || llv.ca_khams || [];
                                upcomingSlotsCount += slots.length;
                            });
                            const nextLlv = schedulesList[0];

                            return (
                                <div
                                    key={doctor.MaBacSi}
                                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xl shrink-0 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                                {doctor.HoTen.charAt(doctor.HoTen.lastIndexOf(' ') + 1) || 'BS'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-700 font-semibold text-xs rounded-full mb-1">
                                                    {specName}
                                                </span>
                                                <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                                                    {title}{doctor.HoTen}
                                                </h3>
                                                {doctor.SoNamKinhNghiem ? (
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                        <Award className="w-3.5 h-3.5 text-amber-500" />
                                                        {doctor.SoNamKinhNghiem} năm kinh nghiệm
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-600 mt-4 line-clamp-3 leading-relaxed">
                                            {doctor.MoTa || 'Bác sĩ chuyên khoa uy tín, tận tâm với người bệnh tại Hệ thống Y tế SmartCare.'}
                                        </p>

                                        {upcomingSlotsCount > 0 ? (
                                            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Có {upcomingSlotsCount} ca khám đang mở tiếp nhận</span>
                                                </div>
                                                {nextLlv && (
                                                    <p className="text-[11px] text-slate-500 font-medium pl-5.5">
                                                        Lịch gần nhất: <span className="font-bold text-slate-800">{nextLlv.NgayLamViec}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>Lịch khám tuần này đang cập nhật</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <Link
                                            href={`/patient/book?doctor_id=${doctor.MaBacSi}&specialty_id=${doctor.MaChuyenKhoa || ''}`}
                                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                                        >
                                            <CalendarPlus className="w-4 h-4" />
                                            Đặt lịch với Bác sĩ này
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <Stethoscope className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Không tìm thấy bác sĩ phù hợp</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Vui lòng thử đổi từ khóa tìm kiếm hoặc chọn chuyên khoa khác.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
