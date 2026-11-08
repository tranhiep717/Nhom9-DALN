import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { 
    Calendar, Clock, Award, Briefcase, Mail, Phone, 
    ArrowLeft, CheckCircle2, Stethoscope, ChevronRight, AlertCircle 
} from 'lucide-react';

interface CaKham {
    MaCaKham: number;
    TenCa: string;
    GioBatDau: string;
    GioKetThuc: string;
    TrangThai: string;
    SoLuongToiDa?: number;
    SoLuongDaDat?: number;
}

interface LichLamViec {
    MaLichLamViec: number;
    NgayLamViec: string;
    TrangThai: string;
    caKhams?: CaKham[];
    ca_khams?: CaKham[];
}

interface ChuyenKhoa {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
    MoTa?: string;
}

interface Doctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    KinhNghiem?: string;
    MoTa?: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
    TrangThai?: string;
    chuyen_khoa?: ChuyenKhoa;
    lich_lam_viec?: LichLamViec[];
}

interface Props {
    doctor?: Doctor;
}

export default function DoctorShow({ doctor }: Props) {
    if (!doctor) {
        return (
            <PublicLayout>
                <Head title="Không tìm thấy bác sĩ - SmartCare" />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin bác sĩ</h1>
                    <p className="text-gray-600 mb-6">Bác sĩ yêu cầu không tồn tại hoặc đã ngừng công tác.</p>
                    <Link
                        href="/doctors"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bác sĩ
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const upcomingSchedules = (doctor.lich_lam_viec || (doctor as any).lich_lam_viecs || []).filter(
        (s: any) => s.TrangThai === 'MO' || s.TrangThai === 'CON_TRONG' || s.TrangThai === 'HOAT_DONG'
    );

    return (
        <PublicLayout>
            <Head title={`${doctor.HocVi ? doctor.HocVi + ' ' : ''}${doctor.HoTen} - SmartCare`} />

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <Link href="/doctors" className="hover:text-primary transition-colors">Đội ngũ bác sĩ</Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium truncate">{doctor.HoTen}</span>
                    </nav>
                </div>
            </div>

            {/* Hero Profile Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-primary text-white py-12">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 flex items-center justify-center text-5xl md:text-6xl font-bold text-white shadow-xl">
                                {doctor.HoTen ? doctor.HoTen.split(' ').pop()?.charAt(0) : 'B'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-md" title="Đang làm việc">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Doctor Quick Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-sm font-medium mb-3">
                                <Stethoscope className="w-4 h-4" />
                                {doctor.chuyen_khoa?.TenChuyenKhoa || 'Bác sĩ Đa khoa'}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                                {doctor.HocVi ? `${doctor.HocVi} ` : ''}{doctor.HoTen}
                            </h1>
                            <p className="text-blue-100 text-base md:text-lg max-w-2xl mb-6">
                                {doctor.MoTa || 'Bác sĩ chuyên khoa tại Hệ thống Y tế Thông minh SmartCare, cam kết mang đến dịch vụ khám và điều trị chất lượng cao.'}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <Link
                                    href={`/book?doctor_id=${doctor.MaBacSi}${doctor.chuyen_khoa?.MaChuyenKhoa ? `&specialty_id=${doctor.chuyen_khoa.MaChuyenKhoa}` : ''}`}
                                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Đặt lịch khám với Bác sĩ
                                </Link>
                                <Link
                                    href="/doctors"
                                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Xem danh sách bác sĩ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Details */}
            <div className="py-12 bg-slate-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Col: Details & Schedule */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Academic & Experience Card */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Award className="w-6 h-6 text-primary" />
                                    Học vị & Quá trình công tác
                                </h2>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <Award className="w-5 h-5 text-primary mt-1 shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500 font-medium">Học vị / Học hàm</div>
                                            <div className="text-base font-semibold text-gray-900">
                                                {doctor.HocVi || 'Bác sĩ Chuyên khoa'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <Briefcase className="w-5 h-5 text-primary mt-1 shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500 font-medium">Kinh nghiệm chuyên môn</div>
                                            <div className="text-base font-semibold text-gray-900">
                                                {doctor.KinhNghiem || 'Nhiều năm kinh nghiệm trong khám và điều trị'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <Stethoscope className="w-5 h-5 text-primary mt-1 shrink-0" />
                                        <div>
                                            <div className="text-sm text-gray-500 font-medium">Chuyên khoa</div>
                                            <div className="text-base font-semibold text-gray-900">
                                                {doctor.chuyen_khoa?.TenChuyenKhoa || 'Đa khoa'}
                                            </div>
                                            {doctor.chuyen_khoa?.MoTa && (
                                                <p className="text-sm text-gray-600 mt-1">{doctor.chuyen_khoa.MoTa}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Working Shifts / Schedules Card */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-primary" />
                                    Lịch khám bệnh dự kiến
                                </h2>

                                {upcomingSchedules.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingSchedules.map((schedule: any) => {
                                            const shifts = schedule.caKhams || schedule.ca_khams || [];
                                            return (
                                                <div key={schedule.MaLichLamViec} className="p-4 rounded-xl border border-slate-200 hover:border-primary/50 transition-colors">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-primary" />
                                                            {formatDate(schedule.NgayLamViec)}
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                            Đang nhận hẹn
                                                        </span>
                                                    </div>

                                                    {shifts.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {shifts.map((shift: any) => (
                                                                <div key={shift.MaCaKham} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-sm">
                                                                    <div>
                                                                        <span className="font-medium text-gray-800">
                                                                            {shift.TenCa || `Ca ${formatTime(shift.GioBatDau)} - ${formatTime(shift.GioKetThuc)}`}
                                                                        </span>
                                                                        <span className="text-gray-500 ml-2">
                                                                            ({shift.TrangThai === 'CON_TRONG' ? 'Còn chỗ' : 'Hết chỗ'})
                                                                        </span>
                                                                    </div>
                                                                    <Link
                                                                        href={`/book?doctor_id=${doctor.MaBacSi}&shift_id=${shift.MaCaKham}`}
                                                                        className="text-xs font-semibold text-primary hover:text-primary-hover underline"
                                                                    >
                                                                        Chọn ca
                                                                    </Link>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">Ca khám đang được cập nhật</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-center">
                                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                        <p className="font-medium">Chưa có lịch khám trực tuyến trong các ngày tới</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Quý khách có thể đặt lịch khám chung với chuyên khoa hoặc liên hệ hotline phòng khám để được hỗ trợ.
                                        </p>
                                        <Link
                                            href={`/book?doctor_id=${doctor.MaBacSi}`}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                                        >
                                            <Calendar className="w-4 h-4" /> Đặt lịch khám ưu tiên
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Contact & Info */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-gray-900 text-lg mb-4">Thông tin liên hệ</h3>
                                <div className="space-y-3 text-sm">
                                    {doctor.EmailLienHe && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Mail className="w-4 h-4 text-primary shrink-0" />
                                            <span className="truncate">{doctor.EmailLienHe}</span>
                                        </div>
                                    )}
                                    {doctor.SoDienThoai && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone className="w-4 h-4 text-primary shrink-0" />
                                            <span>{doctor.SoDienThoai}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                                        <span>Phòng khám Đa khoa SmartCare</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <Link
                                        href={`/book?doctor_id=${doctor.MaBacSi}${doctor.chuyen_khoa?.MaChuyenKhoa ? `&specialty_id=${doctor.chuyen_khoa.MaChuyenKhoa}` : ''}`}
                                        className="w-full block text-center py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-sm transition-colors"
                                    >
                                        Đặt lịch khám ngay
                                    </Link>
                                </div>
                            </div>

                            {/* Specialty Card Link */}
                            {doctor.chuyen_khoa && (
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                                    <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                                        Chuyên khoa trực thuộc
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                        {doctor.chuyen_khoa.TenChuyenKhoa}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                        {doctor.chuyen_khoa.MoTa || 'Xem toàn bộ dịch vụ và các bác sĩ cùng chuyên khoa.'}
                                    </p>
                                    <Link
                                        href={`/specialties/${doctor.chuyen_khoa.MaChuyenKhoa}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                                    >
                                        Xem chi tiết chuyên khoa <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
