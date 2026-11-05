import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { 
    Stethoscope, Users, Calendar, ArrowLeft, ChevronRight, 
    Award, Star, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface Doctor {
    MaBacSi: number;
    MaTaiKhoan?: number;
    MaChuyenKhoa: number;
    HoTen: string;
    HocVi?: string;
    KinhNghiem?: string;
    MoTa?: string;
    TrangThai?: string;
}

interface Specialty {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
    MoTa?: string;
    HinhAnh?: string;
    TrangThai?: string;
    bac_sis_count?: number;
    bac_sis?: Doctor[];
}

interface Props {
    chuyenKhoa?: Specialty;
}

export default function SpecialtyShow({ chuyenKhoa }: Props) {
    if (!chuyenKhoa) {
        return (
            <PublicLayout>
                <Head title="Không tìm thấy chuyên khoa - SmartCare" />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy chuyên khoa</h1>
                    <p className="text-gray-600 mb-6">Chuyên khoa yêu cầu không tồn tại hoặc tạm ngưng hoạt động.</p>
                    <Link
                        href="/specialties"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chuyên khoa
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const doctors = chuyenKhoa.bac_sis || [];
    const doctorCount = chuyenKhoa.bac_sis_count ?? doctors.length;

    return (
        <PublicLayout>
            <Head title={`Chuyên khoa ${chuyenKhoa.TenChuyenKhoa} - SmartCare`} />

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <Link href="/specialties" className="hover:text-primary transition-colors">Chuyên khoa</Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium truncate">{chuyenKhoa.TenChuyenKhoa}</span>
                    </nav>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-blue-900 to-indigo-900 text-white py-12">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-primary-light shrink-0 shadow-lg">
                            <Stethoscope className="w-10 h-10 md:w-12 md:h-12" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-sm font-medium mb-3">
                                <Users className="w-4 h-4" />
                                {doctorCount} Bác sĩ chuyên khoa
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                                Chuyên khoa {chuyenKhoa.TenChuyenKhoa}
                            </h1>
                            <p className="text-blue-100 text-base md:text-lg max-w-3xl mb-6 leading-relaxed">
                                {chuyenKhoa.MoTa || 'Cung cấp dịch vụ thăm khám, chẩn đoán và phác đồ điều trị chuyên sâu với trang thiết bị hiện đại cùng đội ngũ chuyên gia giàu kinh nghiệm.'}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <Link
                                    href={`/book?specialty_id=${chuyenKhoa.MaChuyenKhoa}`}
                                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Đặt lịch khám chuyên khoa này
                                </Link>
                                <Link
                                    href="/specialties"
                                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Tất cả chuyên khoa
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctors List Section */}
            <div className="py-14 bg-slate-50 min-h-[500px]">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Đội ngũ Bác sĩ Chuyên khoa
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Danh sách các bác sĩ giàu kinh nghiệm phụ trách chuyên khoa {chuyenKhoa.TenChuyenKhoa}
                            </p>
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                            Hiển thị {doctors.length} bác sĩ
                        </span>
                    </div>

                    {doctors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {doctors.map((doc) => (
                                <div
                                    key={doc.MaBacSi}
                                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-100 transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-xl bg-primary-light flex items-center justify-center text-2xl font-bold text-primary shrink-0 group-hover:scale-105 transition-transform">
                                                {doc.HoTen ? doc.HoTen.split(' ').pop()?.charAt(0) : 'B'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition-colors">
                                                    {doc.HocVi ? `${doc.HocVi} ` : ''}{doc.HoTen}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Đang nhận khám
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                                            {doc.KinhNghiem && (
                                                <div className="flex items-start gap-2">
                                                    <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1">{doc.KinhNghiem}</span>
                                                </div>
                                            )}
                                            {doc.MoTa && (
                                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                                    {doc.MoTa}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                                        <Link
                                            href={`/book?doctor_id=${doc.MaBacSi}&specialty_id=${chuyenKhoa.MaChuyenKhoa}`}
                                            className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover shadow-sm transition-colors"
                                        >
                                            Đặt lịch
                                        </Link>
                                        <Link
                                            href={`/doctors/${doc.MaBacSi}`}
                                            className="flex-1 text-center py-2.5 rounded-xl border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                                        >
                                            Xem chi tiết
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Đang cập nhật danh sách bác sĩ
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Chuyên khoa {chuyenKhoa.TenChuyenKhoa} đang được sắp xếp lịch công tác. Quý khách vui lòng liên hệ lễ tân để được phân bổ bác sĩ phù hợp.
                            </p>
                            <Link
                                href={`/book?specialty_id=${chuyenKhoa.MaChuyenKhoa}`}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                            >
                                <Calendar className="w-4 h-4" /> Đặt lịch khám tổng quát
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
