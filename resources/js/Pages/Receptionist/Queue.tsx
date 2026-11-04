import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Users, 
    Calendar, 
    LayoutDashboard, 
    CreditCard, 
    FileText, 
    Search, 
    UserCheck, 
    Megaphone, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Filter, 
    RefreshCw, 
    Loader2, 
    ChevronRight,
    Stethoscope,
    Phone,
    User
} from 'lucide-react';
import { useState, useTransition } from 'react';

interface Patient {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    EmailLienHe?: string;
    GioiTinh: 'NAM' | 'NU' | 'KHAC';
    NgaySinh?: string;
}

interface Specialty {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
}

interface Doctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    MaChuyenKhoa: number;
    chuyen_khoa?: Specialty;
}

interface Visit {
    MaLuotKham: number;
    MaLichHen: number;
    TrangThai: 'CHO_KHAM' | 'DANG_KHAM' | 'HOAN_THANH' | 'DA_HUY';
    ThoiGianTiepNhan: string;
    ThoiGianBatDauKham?: string;
    ThoiGianKetThucKham?: string;
}

interface Appointment {
    MaLichHen: number;
    MaCaKham: number;
    MaBenhNhan: number;
    NgayDat: string;
    TrangThai: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DA_TIEP_NHAN' | 'HOAN_THANH' | 'DA_HUY';
    LyDoKham?: string;
    benh_nhan: Patient;
    ca_kham: {
        MaCaKham: number;
        GioBatDau: string;
        GioKetThuc: string;
        SoLuongTiepNhan: number;
        TrangThai: string;
        lich_lam_viec: {
            MaLichLamViec: number;
            MaBacSi: number;
            NgayLamViec: string;
            bac_si: Doctor;
        };
    };
    luot_kham?: Visit;
}

interface Stats {
    total_today: number;
    waiting_checkin: number;
    received: number;
    completed: number;
}

interface Filters {
    date?: string;
    doctor_id?: number | null;
    specialty_id?: number | null;
    status?: string | null;
    search?: string | null;
}

interface QueuePageProps {
    auth: any;
    appointments: Appointment[];
    doctors: Doctor[];
    specialties: Specialty[];
    stats: Stats;
    filters: Filters;
}

export default function Queue({ auth, appointments = [], doctors = [], specialties = [], stats, filters }: QueuePageProps) {
    const navItems = [
        { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { name: 'Hàng chờ & Tiếp nhận', href: '/receptionist/queue', icon: Calendar },
        { name: 'Thanh toán', href: '/receptionist/payment', icon: CreditCard },
        { name: 'Hồ sơ bệnh nhân', href: '/receptionist/records', icon: FileText },
    ];

    // Local filter state
    const [filterDate, setFilterDate] = useState<string>(filters?.date || new Date().toISOString().split('T')[0]);
    const [filterDoctor, setFilterDoctor] = useState<string>(filters?.doctor_id ? String(filters.doctor_id) : '');
    const [filterSpecialty, setFilterSpecialty] = useState<string>(filters?.specialty_id ? String(filters.specialty_id) : '');
    const [filterStatus, setFilterStatus] = useState<string>(filters?.status || '');
    const [searchTerm, setSearchTerm] = useState<string>(filters?.search || '');

    // Processing states
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [callingSpeaker, setCallingSpeaker] = useState<number | null>(null);

    // Apply filters
    const applyFilters = (newFilters: Partial<Filters> = {}) => {
        const queryParams: any = {
            date: newFilters.date !== undefined ? newFilters.date : filterDate,
            doctor_id: newFilters.doctor_id !== undefined ? newFilters.doctor_id : filterDoctor,
            specialty_id: newFilters.specialty_id !== undefined ? newFilters.specialty_id : filterSpecialty,
            status: newFilters.status !== undefined ? newFilters.status : filterStatus,
            search: newFilters.search !== undefined ? newFilters.search : searchTerm,
        };

        // Remove empty values
        Object.keys(queryParams).forEach((key) => {
            if (!queryParams[key]) delete queryParams[key];
        });

        router.get('/receptionist/queue', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const resetFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setFilterDate(today);
        setFilterDoctor('');
        setFilterSpecialty('');
        setFilterStatus('');
        setSearchTerm('');
        router.get('/receptionist/queue', { date: today }, { preserveState: true });
    };

    // Tiếp nhận bệnh nhân
    const handleCheckIn = (appointment: Appointment) => {
        if (!confirm(`Xác nhận tiếp nhận bệnh nhân: ${appointment.benh_nhan.HoTen} vào hàng chờ khám?`)) {
            return;
        }

        setProcessingId(appointment.MaLichHen);
        setNotification(null);

        router.post('/receptionist/visits', {
            MaLichHen: appointment.MaLichHen,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Tiếp nhận thành công bệnh nhân ${appointment.benh_nhan.HoTen}. Lượt khám đã được tạo.`,
                });
                setProcessingId(null);
            },
            onError: (errors: any) => {
                const errorMsg = errors.MaLichHen || errors.message || 'Lỗi khi tiếp nhận bệnh nhân. Vui lòng thử lại.';
                setNotification({
                    type: 'error',
                    message: errorMsg,
                });
                setProcessingId(null);
            },
        });
    };

    // Giả lập gọi loa
    const handleCallSpeaker = (appointment: Appointment) => {
        setCallingSpeaker(appointment.MaLichHen);
        const speech = `Mời bệnh nhân ${appointment.benh_nhan.HoTen} vào ${appointment.ca_kham.lich_lam_viec.bac_si.HoTen}`;
        
        // Browser Speech Synthesis nếu hỗ trợ
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(speech);
            utterance.lang = 'vi-VN';
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
            setCallingSpeaker(null);
            setNotification({
                type: 'success',
                message: `Đã phát loa gọi: "${appointment.benh_nhan.HoTen}" vào phòng khám.`,
            });
        }, 1200);
    };

    // Render Badge trạng thái Lịch hẹn
    const renderAppointmentBadge = (status: string) => {
        switch (status) {
            case 'CHO_XAC_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Chờ xác nhận</span>;
            case 'DA_XAC_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'DA_TIEP_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Đã tiếp nhận</span>;
            case 'HOAN_THANH':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Hoàn thành</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Đã hủy</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    // Render Badge trạng thái Lượt khám
    const renderVisitBadge = (visit?: Visit) => {
        if (!visit) {
            return <span className="text-xs text-gray-400 italic">Chưa tiếp nhận</span>;
        }
        switch (visit.TrangThai) {
            case 'CHO_KHAM':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">Chờ khám (#{visit.MaLuotKham})</span>;
            case 'DANG_KHAM':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-700 animate-pulse">Đang khám (#{visit.MaLuotKham})</span>;
            case 'HOAN_THANH':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Đã xong (#{visit.MaLuotKham})</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Hủy khám</span>;
            default:
                return <span className="text-xs font-medium text-gray-600">{visit.TrangThai}</span>;
        }
    };

    return (
        <DashboardLayout
            role="receptionist"
            navItems={navItems}
            user={auth?.user}
            header="Quản lý Hàng chờ & Tiếp nhận"
        >
            <Head title="Hàng chờ & Tiếp nhận bệnh nhân - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. THÔNG BÁO FLASH TOAST */}
                {notification && (
                    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                        <button 
                            onClick={() => setNotification(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* 2. THẺ THỐNG KÊ NHANH HÔM NAY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng lịch hôm nay</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_today ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ tiếp nhận</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{stats?.waiting_checkin ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Đã tiếp nhận (Hàng chờ)</p>
                            <p className="text-2xl font-black text-teal-700 mt-1">{stats?.received ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã hoàn thành</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.completed ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Lọc Ngày */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày khám</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => {
                                    setFilterDate(e.target.value);
                                    applyFilters({ date: e.target.value });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Lọc Chuyên khoa */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Chuyên khoa</label>
                            <select
                                value={filterSpecialty}
                                onChange={(e) => {
                                    setFilterSpecialty(e.target.value);
                                    applyFilters({ specialty_id: e.target.value ? Number(e.target.value) : null });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả chuyên khoa</option>
                                {specialties.map((ck) => (
                                    <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                        {ck.TenChuyenKhoa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc Bác sĩ */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Bác sĩ phụ trách</label>
                            <select
                                value={filterDoctor}
                                onChange={(e) => {
                                    setFilterDoctor(e.target.value);
                                    applyFilters({ doctor_id: e.target.value ? Number(e.target.value) : null });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả bác sĩ</option>
                                {doctors.map((bs) => (
                                    <option key={bs.MaBacSi} value={bs.MaBacSi}>
                                        {bs.HocVi ? `${bs.HocVi}. ` : 'BS. '}{bs.HoTen}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc Trạng thái */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trạng thái hẹn</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="DA_XAC_NHAN">Đã xác nhận</option>
                                <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                                <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
                                <option value="HOAN_THANH">Đã hoàn thành</option>
                                <option value="DA_HUY">Đã hủy</option>
                            </select>
                        </div>

                        {/* Tìm kiếm tên / SĐT */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tìm bệnh nhân</label>
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    placeholder="Tên hoặc SĐT..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-sm rounded-xl border-slate-300 pr-9 focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-primary">
                                    <Search className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>Đang hiển thị <strong className="text-slate-800">{appointments.length}</strong> bệnh nhân trong danh sách</span>
                        <button 
                            type="button" 
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                {/* 4. BẢNG DANH SÁCH HÀNG CHỜ TIẾP NHẬN BỆNH NHÂN */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold text-center w-14">STT</th>
                                    <th className="px-5 py-3.5 font-bold">Mã LH</th>
                                    <th className="px-5 py-3.5 font-bold">Bệnh nhân</th>
                                    <th className="px-5 py-3.5 font-bold">Bác sĩ & Chuyên khoa</th>
                                    <th className="px-5 py-3.5 font-bold">Thời gian khám</th>
                                    <th className="px-5 py-3.5 font-bold">Trạng thái hẹn</th>
                                    <th className="px-5 py-3.5 font-bold">Lượt khám</th>
                                    <th className="px-5 py-3.5 font-bold text-center w-40">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Users className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                                                <p className="text-base font-bold text-slate-700">Không có bệnh nhân nào trong hàng chờ</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-sm">Không tìm thấy lịch hẹn phù hợp với điều kiện tìm kiếm hoặc ngày được chọn.</p>
                                                <button
                                                    onClick={resetFilters}
                                                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                                                >
                                                    Xem tất cả lịch hẹn hôm nay
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((app, index) => {
                                        const doc = app.ca_kham?.lich_lam_viec?.bac_si;
                                        const ck = doc?.chuyen_khoa;
                                        const timeSlot = `${app.ca_kham?.GioBatDau?.substring(0, 5)} - ${app.ca_kham?.GioKetThuc?.substring(0, 5)}`;
                                        const examDate = app.ca_kham?.lich_lam_viec?.NgayLamViec;
                                        const hasVisit = !!app.luot_kham;
                                        const canCheckIn = (app.TrangThai === 'DA_XAC_NHAN' || app.TrangThai === 'CHO_XAC_NHAN') && !hasVisit;
                                        const isProcessing = processingId === app.MaLichHen;
                                        const isCalling = callingSpeaker === app.MaLichHen;

                                        return (
                                            <tr key={app.MaLichHen} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-5 py-4 text-center font-black text-slate-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-4 font-bold text-primary">
                                                    #{app.MaLichHen}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                            {app.benh_nhan?.HoTen?.charAt(0) || 'BN'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight">{app.benh_nhan?.HoTen}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                {app.benh_nhan?.SoDienThoai || '---'}
                                                                {app.benh_nhan?.GioiTinh && ` • ${app.benh_nhan.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Chưa chỉ định'}
                                                        </p>
                                                        <p className="text-xs text-primary font-medium mt-0.5">
                                                            {ck?.TenChuyenKhoa || 'Đa khoa'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-xs">
                                                        <span className="font-bold text-slate-800">{timeSlot}</span>
                                                        <span className="text-slate-500 block mt-0.5">{examDate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {renderAppointmentBadge(app.TrangThai)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {renderVisitBadge(app.luot_kham)}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {canCheckIn ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCheckIn(app)}
                                                                disabled={isProcessing}
                                                                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                                            >
                                                                {isProcessing ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        Đang nhận...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="w-3.5 h-3.5" />
                                                                        Tiếp nhận
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : hasVisit ? (
                                                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Đã vào hàng chờ
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Không thể tiếp nhận</span>
                                                        )}

                                                        {/* Nút Gọi Loa cho bệnh nhân đã có lượt khám đang chờ */}
                                                        {hasVisit && app.luot_kham?.TrangThai === 'CHO_KHAM' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCallSpeaker(app)}
                                                                disabled={isCalling}
                                                                title="Gọi loa thông báo bệnh nhân vào khám"
                                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold flex items-center"
                                                            >
                                                                <Megaphone className={`w-3.5 h-3.5 ${isCalling ? 'animate-bounce text-primary' : ''}`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
