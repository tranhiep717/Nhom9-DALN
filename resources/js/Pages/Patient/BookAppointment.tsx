import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    HeartPulse, 
    FileText, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    ArrowLeft,
    CalendarPlus,
    Check,
    Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { patientNavItems } from './Dashboard';

interface Specialty {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
}

interface Doctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    MaChuyenKhoa?: number;
    chuyenKhoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
}

interface CaKhamSlot {
    MaCaKham: number;
    MaLichLamViec: number;
    GioBatDau: string;
    GioKetThuc: string;
    SoLuongTiepNhan: number;
    SoLuongDaDat: number;
    SoLuongConNhan: number;
    TrangThai: string;
    KhaDung: boolean;
}

interface BookAppointmentProps {
    auth: any;
    specialties: Specialty[];
    doctors: Doctor[];
    preselectedDoctorId?: string | number;
    preselectedSpecialtyId?: string | number;
    unpaidDebt?: number;
    unpaidCount?: number;
}

export default function BookAppointment({
    auth,
    specialties = [],
    doctors = [],
    preselectedDoctorId,
    preselectedSpecialtyId,
    unpaidDebt = 0,
    unpaidCount = 0,
}: BookAppointmentProps) {
    const today = new Date().toISOString().split('T')[0];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const [selectedSpecialty, setSelectedSpecialty] = useState<string | number>(preselectedSpecialtyId || '');
    const [selectedDoctor, setSelectedDoctor] = useState<string | number>(preselectedDoctorId || '');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [caKhams, setCaKhams] = useState<CaKhamSlot[]>([]);
    const [selectedCaKham, setSelectedCaKham] = useState<CaKhamSlot | null>(null);
    const [reason, setReason] = useState<string>('');

    // BHYT state
    const patientBhyt = auth?.user?.benh_nhan?.SoTheBHYT || '';
    const [useBhyt, setUseBhyt] = useState<boolean>(Boolean(patientBhyt));
    const [soTheBHYT, setSoTheBHYT] = useState<string>(patientBhyt);
    const [mucHuongBHYT, setMucHuongBHYT] = useState<number>(auth?.user?.benh_nhan?.MucHuongBHYT || 80);
    
    const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<any | null>(null);

    // Khi thay đổi Bác sĩ hoặc Ngày, tự động fetch ca khám
    useEffect(() => {
        if (!selectedDoctor || !selectedDate) {
            setCaKhams([]);
            setSelectedCaKham(null);
            return;
        }

        const fetchSlots = async () => {
            setLoadingSlots(true);
            setErrorMessage(null);
            try {
                const res = await axios.get('/ca-kham', {
                    params: {
                        doctor_id: selectedDoctor,
                        date: selectedDate,
                    },
                    headers: { Accept: 'application/json' },
                });

                if (res.data?.success) {
                    setCaKhams(res.data.data || []);
                } else {
                    setCaKhams([]);
                }
            } catch (err: any) {
                setCaKhams([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDoctor, selectedDate]);

    // Lọc danh sách bác sĩ theo chuyên khoa
    const filteredDoctors = selectedSpecialty
        ? doctors.filter((doc) => String(doc.MaChuyenKhoa) === String(selectedSpecialty))
        : doctors;

    const handleSpecialtyChange = (specId: string) => {
        setSelectedSpecialty(specId);
        // Nếu bác sĩ hiện tại không thuộc chuyên khoa mới thì reset
        if (selectedDoctor) {
            const doc = doctors.find((d) => String(d.MaBacSi) === String(selectedDoctor));
            if (doc && specId && String(doc.MaChuyenKhoa) !== String(specId)) {
                setSelectedDoctor('');
            }
        }
    };

    const handleDoctorChange = (docId: string) => {
        setSelectedDoctor(docId);
        // Tự động chọn chuyên khoa của bác sĩ đó
        const doc = doctors.find((d) => String(d.MaBacSi) === String(docId));
        if (doc?.MaChuyenKhoa) {
            setSelectedSpecialty(doc.MaChuyenKhoa);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!selectedCaKham) {
            setErrorMessage('Vui lòng chọn ca khám còn chỗ trống.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post('/appointments', {
                MaCaKham: selectedCaKham.MaCaKham,
                LyDoKham: reason.trim() || 'Khám bệnh theo yêu cầu',
                CoBHYT: useBhyt,
                SoTheBHYT: useBhyt && soTheBHYT ? soTheBHYT.trim().toUpperCase() : null,
                MucHuongBHYT: useBhyt ? mucHuongBHYT : 0,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            if (res.data?.success) {
                setSuccessData(res.data.data);
            } else {
                setErrorMessage(res.data?.message || 'Không thể đặt lịch hẹn.');
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setErrorMessage('Phiên đăng nhập đã hết hạn. Đang chuyển hướng về trang đăng nhập...');
                setTimeout(() => {
                    router.visit('/login');
                }, 1200);
                return;
            }
            const msg = err.response?.data?.message || 
                        (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : null) || 
                        'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.';
            setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    const chosenDoctorObj = doctors.find((d) => String(d.MaBacSi) === String(selectedDoctor));
    const chosenSpecialtyObj = specialties.find((s) => String(s.MaChuyenKhoa) === String(selectedSpecialty));

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Đặt lịch khám"
        >
            <Head title="Đặt lịch khám bệnh - SmartCare" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đặt lịch khám bệnh trực tuyến</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Chủ động chọn bác sĩ, ngày khám và khung giờ phù hợp. Hệ thống sẽ tự động xác nhận và chuẩn bị ca khám.
                    </p>
                </div>

                {/* Banner Cảnh báo nếu bệnh nhân còn nợ viện phí lần khám trước */}
                {Number(unpaidDebt) > 0 && !successData && (
                    <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-950 text-sm">
                                    Lưu ý viện phí lần khám trước ({unpaidCount || 1} khoản chưa thanh toán)
                                </p>
                                <p className="text-amber-800 text-xs mt-0.5">
                                    Hệ thống ghi nhận bạn còn khoản nợ viện phí <strong className="font-bold text-amber-950">{formatCurrency(Number(unpaidDebt))}</strong>. Bạn vẫn được quyền đặt lịch khám mới bình thường, tuy nhiên vui lòng thanh toán khoản nợ này tại Quầy Thu ngân khi đến phòng khám.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/patient/billing"
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 whitespace-nowrap shadow-sm"
                        >
                            Xem khoản nợ &rarr;
                        </Link>
                    </div>
                )}

                {/* Màn hình thành công */}
                {successData ? (
                    <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-sm space-y-6 animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-10 h-10" />
                        </div>
                        <div>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-full mb-2">
                                Đặt lịch thành công
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Lịch hẹn của bạn đã được ghi nhận!
                            </h2>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                Mã lịch hẹn: <span className="font-mono font-bold text-slate-900">#{successData?.MaLichHen || ''}</span>. 
                                Vui lòng đến đúng giờ để được tiếp nhận nhanh chóng.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3 text-sm border border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Bác sĩ:</span>
                                <span className="font-bold text-slate-900">{chosenDoctorObj?.HoTen || 'Bác sĩ phòng khám'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Chuyên khoa:</span>
                                <span className="font-medium text-slate-800">{chosenSpecialtyObj?.TenChuyenKhoa || 'Đa khoa'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Ngày khám:</span>
                                <span className="font-bold text-teal-700">{selectedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Khung giờ:</span>
                                <span className="font-bold text-teal-700">
                                    {selectedCaKham ? `${selectedCaKham.GioBatDau.slice(0, 5)} - ${selectedCaKham.GioKetThuc.slice(0, 5)}` : '--'}
                                </span>
                            </div>
                            {reason && (
                                <div className="pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block mb-1">Lý do khám:</span>
                                    <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100">
                                        "{reason}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {Number(unpaidDebt) > 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl max-w-md mx-auto text-xs text-amber-900 text-left flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-bold text-amber-950 mb-0.5">Lưu ý thanh toán viện phí:</strong>
                                    Bạn có khoản nợ viện phí lần trước ({formatCurrency(Number(unpaidDebt))}). Vui lòng thanh toán tại Quầy Thu ngân khi đến phòng khám để thuận tiện cho việc nhận thuốc và thực hiện xét nghiệm.
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <Link
                                href="/appointments"
                                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                            >
                                Xem lịch hẹn của tôi
                            </Link>
                            <button
                                onClick={() => {
                                    setSuccessData(null);
                                    setSelectedCaKham(null);
                                    setReason('');
                                }}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                            >
                                Đặt thêm lịch khác
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form đặt lịch 4 bước */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Bước 1: Chọn Chuyên khoa & Bác sĩ */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                                Chọn Chuyên khoa & Bác sĩ
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                        Chuyên khoa
                                    </label>
                                    <select
                                        value={selectedSpecialty}
                                        onChange={(e) => handleSpecialtyChange(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                                    >
                                        <option value="">-- Tất cả chuyên khoa --</option>
                                        {specialties.map((s) => (
                                            <option key={s.MaChuyenKhoa} value={s.MaChuyenKhoa}>
                                                {s.TenChuyenKhoa}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                        Bác sĩ điều trị <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={selectedDoctor}
                                        onChange={(e) => handleDoctorChange(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                                    >
                                        <option value="">-- Chọn bác sĩ phụ trách --</option>
                                        {filteredDoctors.map((d) => (
                                            <option key={d.MaBacSi} value={d.MaBacSi}>
                                                {d.HocVi ? `${d.HocVi}. ` : 'BS. '}{d.HoTen} {d.chuyenKhoa ? `(${d.chuyenKhoa.TenChuyenKhoa})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bước 2: Chọn Ngày khám & Ca khám */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                                Chọn Ngày & Khung giờ khám
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                        Ngày khám <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedCaKham(null);
                                        }}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Chỉ chọn từ ngày hôm nay trở đi</p>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                        Ca khám khả dụng <span className="text-rose-500">*</span>
                                    </label>

                                    {!selectedDoctor ? (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                            Vui lòng chọn Bác sĩ trước để tải danh sách ca khám.
                                        </div>
                                    ) : loadingSlots ? (
                                        <div className="p-6 bg-slate-50 rounded-xl text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                            Đang kiểm tra ca khám khả dụng...
                                        </div>
                                    ) : caKhams.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {caKhams.map((slot) => {
                                                const isSelected = selectedCaKham?.MaCaKham === slot.MaCaKham;
                                                const isAvailable = slot.KhaDung && slot.SoLuongConNhan > 0;

                                                return (
                                                    <button
                                                        key={slot.MaCaKham}
                                                        type="button"
                                                        disabled={!isAvailable}
                                                        onClick={() => setSelectedCaKham(slot)}
                                                        className={`p-3 rounded-xl border text-left transition-all relative ${
                                                            isSelected
                                                                ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-600 font-bold'
                                                                : isAvailable
                                                                ? 'border-slate-200 hover:border-teal-400 hover:bg-slate-50 bg-white text-slate-800'
                                                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                                        }`}
                                                    >
                                                        <div className="text-sm flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {slot.GioBatDau.slice(0, 5)} - {slot.GioKetThuc.slice(0, 5)}
                                                        </div>
                                                        <div className="text-xs mt-1">
                                                            {isAvailable ? (
                                                                <span className="text-emerald-600 font-medium">
                                                                    Còn {slot.SoLuongConNhan} chỗ
                                                                </span>
                                                            ) : (
                                                                <span className="text-rose-500">Hết chỗ</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                            Bác sĩ chưa có ca khám nào được mở trong ngày này. Vui lòng chọn ngày khác hoặc bác sĩ khác.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bước 3: Lý do khám / Triệu chứng */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                                Triệu chứng & Lý do khám
                            </h2>

                            <div>
                                <textarea
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Mô tả triệu chứng (ví dụ: sốt nhẹ, đau họng 2 ngày nay, tái khám sau 1 tuần...)"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Thông tin này giúp bác sĩ chuẩn bị trước hồ sơ và phương án khám phù hợp.
                                </p>
                            </div>
                        </div>

                        {/* Bước 4: Thông tin Bảo hiểm Y tế (BHYT) */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                                    Thông tin Bảo hiểm Y tế (BHYT)
                                </h2>
                                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={useBhyt}
                                        onChange={(e) => setUseBhyt(e.target.checked)}
                                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                                    />
                                    <span>Áp dụng BHYT cho ca khám này</span>
                                </label>
                            </div>

                            {useBhyt ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                            Số thẻ BHYT (15 ký tự) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={15}
                                            value={soTheBHYT}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                setSoTheBHYT(val);
                                                if (val.startsWith('CC') || val.startsWith('TE')) {
                                                    setMucHuongBHYT(100);
                                                } else if (val.startsWith('HT') || val.startsWith('TC') || val.startsWith('CN')) {
                                                    setMucHuongBHYT(95);
                                                } else {
                                                    setMucHuongBHYT(80);
                                                }
                                            }}
                                            placeholder="Ví dụ: DN4010123456789"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-wide focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none uppercase"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Chuẩn 15 ký tự: 2 chữ cái đầu + 13 chữ số</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                            Mức hưởng BHYT dự kiến
                                        </label>
                                        <select
                                            value={mucHuongBHYT}
                                            onChange={(e) => setMucHuongBHYT(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white font-semibold text-teal-800"
                                        >
                                            <option value={80}>Hưởng 80% (Người lao động, BH tự nguyện chuẩn)</option>
                                            <option value={95}>Hưởng 95% (Hộ cận nghèo, bảo trợ xã hội)</option>
                                            <option value={100}>Hưởng 100% (Trẻ em &lt; 6 tuổi, sĩ quan, người có công)</option>
                                        </select>
                                        <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                            Bệnh viện/phòng khám sẽ đối chiếu thẻ thật và CCCD khi tiếp nhận tại quầy.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                    Không áp dụng BHYT. Viện phí sẽ tính theo đơn giá khám dịch vụ tự túc thông thường.
                                </p>
                            )}
                        </div>

                        {/* Bước 5: Tóm tắt & Nút xác nhận */}
                        <div className="p-6 bg-teal-900 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-teal-300 uppercase font-semibold">Tóm tắt lịch hẹn</p>
                                <p className="text-base font-bold mt-1">
                                    {chosenDoctorObj ? `${chosenDoctorObj.HocVi ? `${chosenDoctorObj.HocVi}. ` : 'BS. '}${chosenDoctorObj.HoTen}` : 'Chưa chọn bác sĩ'}
                                    {selectedDate ? ` • ${selectedDate}` : ''}
                                    {selectedCaKham ? ` (${selectedCaKham.GioBatDau.slice(0, 5)} - ${selectedCaKham.GioKetThuc.slice(0, 5)})` : ''}
                                </p>
                                <p className="text-xs text-teal-200 mt-0.5">
                                    {chosenSpecialtyObj?.TenChuyenKhoa || 'Chuyên khoa tổng quát'}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedCaKham}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 disabled:hover:bg-teal-400 text-teal-950 font-black rounded-2xl text-sm transition-all shadow-md shrink-0"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang xác nhận...
                                    </>
                                ) : (
                                    <>
                                        <CalendarPlus className="w-4 h-4" />
                                        Xác nhận đặt lịch
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}
