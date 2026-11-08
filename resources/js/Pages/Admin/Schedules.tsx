import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Calendar, 
    Clock, 
    Search, 
    Plus, 
    User, 
    Stethoscope, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Users, 
    Trash2,
    CalendarPlus,
    Loader2,
    Phone,
    Mail,
    Award,
    Eye,
    Info,
    ExternalLink
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { adminNavItems } from '@/constants/navigation';

interface DoctorBrief {
    MaBacSi: number;
    MaTaiKhoan?: number;
    HoTen: string;
    HocVi?: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
    KinhNghiem?: number;
    MoTa?: string;
    chuyenKhoa?: {
        MaChuyenKhoa?: number;
        TenChuyenKhoa: string;
    };
    chuyen_khoa?: {
        MaChuyenKhoa?: number;
        TenChuyenKhoa: string;
    };
}

interface CaKhamItem {
    MaCaKham: number;
    MaLichLamViec: number;
    GioBatDau: string;
    GioKetThuc: string;
    SoLuongTiepNhan: number;
    TrangThai: string;
}

interface ScheduleItem {
    MaLichLamViec: number;
    MaBacSi?: number;
    MaTaiKhoan?: number;
    NgayLamViec: string;
    GioBatDau: string;
    GioKetThuc: string;
    LoaiCa?: string;
    TrangThai: string; // 'MO', 'DONG', 'CON_TRONG'
    SoLuongTiepNhan?: number;
    bacSi?: DoctorBrief;
    bac_si?: DoctorBrief;
    taiKhoan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email?: string;
        name?: string;
        HoTen?: string;
        vaiTro?: {
            MaVaiTro: number;
            TenVaiTro: string;
        };
        vai_tro?: {
            MaVaiTro: number;
            TenVaiTro: string;
        };
        nhanVien?: any;
        nhan_vien?: any;
    };
    tai_khoan?: any;
    caKhams?: CaKhamItem[];
    ca_khams?: CaKhamItem[];
}

interface StaffMember {
    MaTaiKhoan: number;
    HoTen?: string;
    name?: string;
    TenDangNhap?: string;
    Email?: string;
    TrangThai?: string;
    role?: 'CLS' | 'RECEPTION';
}

interface SchedulesProps {
    auth: any;
    schedules: ScheduleItem[];
    doctors: DoctorBrief[];
    staffGroups?: {
        cls?: StaffMember[];
        reception?: StaffMember[];
    };
    filters: {
        doctor_id?: string;
        date?: string;
        from_date?: string;
        to_date?: string;
        status?: string;
    };
}

export default function AdminSchedules({ auth, schedules = [], doctors = [], staffGroups = {}, filters = {} }: SchedulesProps) {
    type ScheduleTab = 'doctor' | 'cls' | 'reception';

    const [doctorFilter, setDoctorFilter] = useState(filters.doctor_id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [fromDateFilter, setFromDateFilter] = useState(filters.from_date || '');
    const [toDateFilter, setToDateFilter] = useState(filters.to_date || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [activeScheduleTab, setActiveScheduleTab] = useState<ScheduleTab>('doctor');

    const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(schedules);

    useEffect(() => {
        setScheduleList(schedules);
    }, [schedules]);

    // Thống kê ca trực thực tế phục vụ KPI Quản trị
    const shiftStats = useMemo(() => {
        const total = scheduleList.length;
        const activeStaffCount = new Set(
            scheduleList.map(s => s.MaBacSi ? `bs_${s.MaBacSi}` : `tk_${s.MaTaiKhoan}`)
        ).size;
        const openShifts = scheduleList.filter(s => s.TrangThai === 'MO').length;
        const doctorShifts = scheduleList.filter(s => !!s.MaBacSi).length;
        const staffShifts = scheduleList.filter(s => !s.MaBacSi && !!s.MaTaiKhoan).length;

        return {
            total,
            activeStaffCount,
            openShifts,
            doctorShifts,
            staffShifts,
        };
    }, [scheduleList]);

    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Tự động đóng Toast notification sau 5 giây
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    // Modal thêm ca khám
    const [caModalOpen, setCaModalOpen] = useState(false);
    const [selectedScheduleForCa, setSelectedScheduleForCa] = useState<ScheduleItem | null>(null);

    // Modal xem chi tiết bác sĩ & ca trực
    const [viewingSchedule, setViewingSchedule] = useState<ScheduleItem | null>(null);

    // Helpers trích xuất quan hệ (hỗ trợ cả camelCase và snake_case từ Laravel)
    const getDoctor = (sch?: ScheduleItem | null): DoctorBrief | undefined => {
        if (!sch) return undefined;
        return sch.bacSi || (sch as any).bac_si;
    };

    const getStaff = (sch?: ScheduleItem | null) => {
        if (!sch) return undefined;
        return sch.taiKhoan || (sch as any).tai_khoan;
    };

    const getCaKhams = (sch?: ScheduleItem | null): CaKhamItem[] => {
        if (!sch) return [];
        return sch.caKhams || (sch as any).ca_khams || [];
    };

    const getDoctorSpec = (doc?: DoctorBrief | null): string => {
        if (!doc) return 'Đa khoa';
        return doc.chuyenKhoa?.TenChuyenKhoa || doc.chuyen_khoa?.TenChuyenKhoa || 'Đa khoa';
    };

    const getDoctorDisplayName = (doc?: DoctorBrief | null): string => {
        if (!doc?.HoTen) return 'Bác sĩ';
        const raw = doc.HoTen.trim();
        if (/^(BS|ThS|PGS|TS|Bác sĩ|GS)/i.test(raw)) {
            return raw;
        }
        const prefix = doc.HocVi ? `${doc.HocVi}. ` : 'BS. ';
        return `${prefix}${raw}`;
    };

    const getDoctorInitials = (doc?: DoctorBrief | null): string => {
        if (!doc?.HoTen) return 'BS';
        const clean = doc.HoTen.replace(/^(BS\.?|ThS\.?|PGS\.?|TS\.?|CK[12]\.?)\s*/gi, '').trim();
        const parts = clean.split(' ').filter(Boolean);
        if (parts.length > 0) {
            return parts[parts.length - 1][0].toUpperCase();
        }
        return 'BS';
    };

    // Form tạo lịch làm việc
    const fixedShiftOptions = [
        { key: 'custom', label: 'Khung tùy chỉnh', start: '', end: '', tone: 'bg-slate-100 text-slate-700', description: 'Điều chỉnh theo giờ riêng' },
        { key: 'sang', label: 'Ca sáng', start: '08:00', end: '12:00', tone: 'bg-emerald-100 text-emerald-700', description: '08:00 - 12:00' },
        { key: 'chieu', label: 'Ca chiều', start: '13:00', end: '17:00', tone: 'bg-sky-100 text-sky-700', description: '13:00 - 17:00' },
        { key: 'toi', label: 'Ca tối', start: '17:30', end: '20:30', tone: 'bg-violet-100 text-violet-700', description: '17:30 - 20:30' },
        { key: 'dem', label: 'Ca đêm', start: '19:00', end: '23:00', tone: 'bg-indigo-100 text-indigo-700', description: '19:00 - 23:00' },
        { key: 'ngay', label: 'Ca cả ngày', start: '08:00', end: '17:00', tone: 'bg-amber-100 text-amber-700', description: '08:00 - 17:00' },
    ];

    const [formData, setFormData] = useState({
        MaBacSi: doctors[0]?.MaBacSi ? Number(doctors[0].MaBacSi) : '',
        MaTaiKhoan: '' as string | number,
        NgayLamViec: new Date().toISOString().split('T')[0],
        LoaiCa: 'sang',
        GioBatDau: '08:00',
        GioKetThuc: '12:00',
        SoLuongTiepNhan: 10,
        TrangThai: 'MO',
    });
    const [selectedShiftKey, setSelectedShiftKey] = useState<string>('sang');

    const shiftLabelMap: Record<string, string> = {
        sang: 'Ca sáng',
        chieu: 'Ca chiều',
        toi: 'Ca tối',
        dem: 'Ca đêm',
        ngay: 'Ca cả ngày',
        custom: 'Khung tùy chỉnh',
    };

    const selectedDoctor = doctors.find((doctor) => doctor.MaBacSi === Number(formData.MaBacSi));
    const selectedShift = fixedShiftOptions.find((item) => item.key === selectedShiftKey) ?? fixedShiftOptions[1];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const assignmentSummary = `${selectedDoctor ? getDoctorDisplayName(selectedDoctor) : 'Chưa chọn bác sĩ'} • ${formatDate(formData.NgayLamViec)} • ${selectedShift.label}`;

    const applyFixedShift = (shiftKey: string) => {
        const selected = fixedShiftOptions.find((item) => item.key === shiftKey);
        if (!selected) return;

        let start = selected.start;
        let end = selected.end;

        // Tự động gán khung giờ chuẩn theo từng vai trò (Lễ tân ca sáng 07:00-12:00, chiều 12:30-17:30)
        if (activeScheduleTab === 'reception') {
            if (shiftKey === 'sang') { start = '07:00'; end = '12:00'; }
            else if (shiftKey === 'chieu') { start = '12:30'; end = '17:30'; }
        }

        setSelectedShiftKey(shiftKey);
        setFormData((prev) => ({
            ...prev,
            LoaiCa: shiftKey === 'custom' ? 'custom' : shiftKey,
            GioBatDau: start || prev.GioBatDau,
            GioKetThuc: end || prev.GioKetThuc,
        }));
    };

    // Form tạo ca khám
    const [caFormData, setCaFormData] = useState({
        GioBatDau: '08:00',
        GioKetThuc: '09:00',
        SoLuongTiepNhan: 5,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/schedules', {
            doctor_id: doctorFilter || undefined,
            date: dateFilter || undefined,
            from_date: fromDateFilter || undefined,
            to_date: toDateFilter || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleShiftDateRange = (direction: 'prev' | 'next') => {
        const baseDate = fromDateFilter || toDateFilter || dateFilter || new Date().toISOString().slice(0, 10);
        const current = new Date(baseDate);
        const offset = direction === 'prev' ? -7 : 7;
        current.setDate(current.getDate() + offset);

        const start = new Date(current);
        const end = new Date(current);
        end.setDate(end.getDate() + 6);

        setFromDateFilter(start.toISOString().slice(0, 10));
        setToDateFilter(end.toISOString().slice(0, 10));
        setDateFilter('');
    };

    const handleDeleteSchedule = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ca làm việc này không?')) return;
        try {
            const res = await axios.delete(`/admin/schedules/${id}`);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: 'Đã xóa ca làm việc thành công.' });
                setScheduleList((prev) => prev.filter((s) => s.MaLichLamViec !== id));
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Không thể xóa ca làm việc.' });
        }
    };

    const timetableDates = (() => {
        const explicitDates = new Set<string>();

        if (fromDateFilter || toDateFilter) {
            const startStr = fromDateFilter || toDateFilter;
            const endStr = toDateFilter || fromDateFilter;
            const start = new Date(startStr || new Date().toISOString().slice(0, 10));
            const end = new Date(endStr || startStr || new Date().toISOString().slice(0, 10));
            const safeStart = start > end ? end : start;
            const safeEnd = start > end ? start : end;

            const current = new Date(safeStart);
            while (current <= safeEnd) {
                explicitDates.add(current.toISOString().slice(0, 10));
                current.setDate(current.getDate() + 1);
            }
        } else if (dateFilter) {
            explicitDates.add(dateFilter);
        } else {
            scheduleList.forEach((sch) => explicitDates.add(sch.NgayLamViec));
        }

        return Array.from(explicitDates).sort();
    })();

    const scheduleTabs: { key: ScheduleTab; label: string; description: string; color: string }[] = [
        { key: 'doctor', label: 'Bác sĩ', description: 'Lịch làm việc chuyên môn', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        { key: 'cls', label: 'CLS', description: 'Lịch kỹ thuật viên cận lâm sàng', color: 'bg-sky-100 text-sky-700 border-sky-200' },
        { key: 'reception', label: 'Lễ tân', description: 'Lịch tiếp nhận và điều phối', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    ];

    const activeTabMeta = scheduleTabs.find((tab) => tab.key === activeScheduleTab) ?? scheduleTabs[0];
    const staffRoster = activeScheduleTab === 'cls'
        ? staffGroups.cls ?? []
        : activeScheduleTab === 'reception'
            ? staffGroups.reception ?? []
            : [];
    const activeRoleShiftMap: Record<'cls' | 'reception', Array<{ key: string; label: string; tone: string; time: string }>> = {
        cls: [
            { key: 'sang', label: 'Ca sáng', tone: 'bg-emerald-100 text-emerald-700', time: '07:30 - 12:00' },
            { key: 'chieu', label: 'Ca chiều', tone: 'bg-sky-100 text-sky-700', time: '13:00 - 17:30' },
            { key: 'dem', label: 'Ca đêm', tone: 'bg-indigo-100 text-indigo-700', time: '18:00 - 22:00' },
        ],
        reception: [
            { key: 'sang', label: 'Ca sáng', tone: 'bg-amber-100 text-amber-700', time: '07:00 - 12:00' },
            { key: 'chieu', label: 'Ca chiều', tone: 'bg-violet-100 text-violet-700', time: '12:30 - 17:30' },
            { key: 'toi', label: 'Ca tối', tone: 'bg-rose-100 text-rose-700', time: '18:00 - 21:30' },
        ],
    };

    const handleCreateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            const res = await axios.post('/admin/schedules', formData);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: res.data.message });
                setScheduleList((prev) => [res.data.data, ...prev]);
                setModalOpen(false);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 
                        (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : null) || 
                        'Có lỗi xảy ra khi tạo lịch làm việc.';
            setFeedback({ type: 'error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenAddCa = (schedule: ScheduleItem) => {
        setSelectedScheduleForCa(schedule);
        setCaFormData({
            GioBatDau: schedule.GioBatDau ? schedule.GioBatDau.slice(0, 5) : '08:00',
            GioKetThuc: schedule.GioKetThuc ? schedule.GioKetThuc.slice(0, 5) : '09:00',
            SoLuongTiepNhan: 5,
        });
        setCaModalOpen(true);
    };

    const handleCreateCaKham = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedScheduleForCa) return;

        setSubmitting(true);
        setFeedback(null);

        try {
            const res = await axios.post('/admin/ca-kham', {
                MaLichLamViec: selectedScheduleForCa.MaLichLamViec,
                ...caFormData,
            });

            if (res.data?.success) {
                setFeedback({ type: 'success', message: res.data.message });
                const newCa = res.data.data;
                setScheduleList((prev) =>
                    prev.map((sch) => {
                        if (sch.MaLichLamViec === selectedScheduleForCa.MaLichLamViec) {
                            return {
                                ...sch,
                                caKhams: [...(sch.caKhams || []), newCa],
                            };
                        }
                        return sch;
                    })
                );
                setCaModalOpen(false);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm ca khám.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Lịch làm việc"
        >
            <Head title="Quản lý Lịch & Ca khám - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý phân công ca làm việc</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Phân ca trực toàn viện (Bác sĩ, Kỹ thuật viên CLS, Lễ tân) theo thời khóa biểu ma trận, kiểm soát chồng lấn.
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        Tạo lịch làm việc mới
                    </button>
                </div>

                {/* 3 Thẻ KPI Thống kê Ca trực Toàn viện thay cho 3 thẻ text tĩnh */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng ca trực phân công</span>
                            <div className="mt-2 text-3xl font-black text-indigo-700">{shiftStats.total}</div>
                            <p className="mt-1 text-xs text-slate-400">
                                {shiftStats.doctorShifts} ca Bác sĩ • {shiftStats.staffShifts} ca KTV / Lễ tân
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Nhân sự có lịch trực</span>
                            <div className="mt-2 text-3xl font-black text-emerald-700">{shiftStats.activeStaffCount}</div>
                            <p className="mt-1 text-xs text-slate-400">
                                Nhân sự được điều phối trong hệ thống
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Ca trực đang mở nhận ca</span>
                            <div className="mt-2 text-3xl font-black text-teal-700">{shiftStats.openShifts}</div>
                            <p className="mt-1 text-xs text-slate-400">
                                Sẵn sàng tiếp nhận bệnh nhân khám
                            </p>
                        </div>
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Floating Toast Notification cho Admin */}
                {feedback && (
                    <div className="fixed top-6 right-6 z-50 max-w-md animate-in slide-in-from-top-4 fade-in duration-200">
                        <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 text-sm backdrop-blur-md ${
                            feedback.type === 'success' 
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20' 
                                : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
                        }`}>
                            {feedback.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 font-semibold leading-relaxed">
                                {feedback.message}
                            </div>
                            <button
                                type="button"
                                onClick={() => setFeedback(null)}
                                className="text-white/80 hover:text-white p-0.5 rounded-lg ml-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Thanh tìm kiếm & bộ lọc */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        {scheduleTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setActiveScheduleTab(tab.key);
                                    setDoctorFilter('');
                                }}
                                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                    activeScheduleTab === tab.key
                                        ? `${tab.color} shadow-sm`
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{activeTabMeta.description}</p>
                </div>

                <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            <div className="w-full sm:w-72">
                                <select
                                    value={doctorFilter}
                                    onChange={(e) => setDoctorFilter(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                                >
                                    <option value="">
                                        {activeScheduleTab === 'doctor' 
                                            ? 'Tất cả bác sĩ' 
                                            : activeScheduleTab === 'cls' 
                                            ? 'Tất cả nhân viên CLS' 
                                            : 'Tất cả nhân viên lễ tân'}
                                    </option>
                                    {activeScheduleTab === 'doctor' && doctors.map((d) => (
                                        <option key={d.MaBacSi} value={d.MaBacSi}>
                                            {getDoctorDisplayName(d)} ({getDoctorSpec(d)})
                                        </option>
                                    ))}
                                    {activeScheduleTab === 'cls' && (staffGroups.cls || []).map((s) => (
                                        <option key={s.MaTaiKhoan} value={s.MaTaiKhoan}>
                                            KTV. {s.name || s.HoTen || s.TenDangNhap}
                                        </option>
                                    ))}
                                    {activeScheduleTab === 'reception' && (staffGroups.reception || []).map((s) => (
                                        <option key={s.MaTaiKhoan} value={s.MaTaiKhoan}>
                                            Lễ tân. {s.name || s.HoTen || s.TenDangNhap}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm nhanh theo tên bác sĩ, KTV, hoặc chuyên khoa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleShiftDateRange('prev')}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700"
                            >
                                Tuần trước
                            </button>
                            <button
                                type="button"
                                onClick={() => handleShiftDateRange('next')}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700"
                            >
                                Tuần sau
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Ngày cụ thể</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setFromDateFilter('');
                                    setToDateFilter('');
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                value={fromDateFilter}
                                onChange={(e) => {
                                    setFromDateFilter(e.target.value);
                                    setDateFilter('');
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                value={toDateFilter}
                                onChange={(e) => {
                                    setToDateFilter(e.target.value);
                                    setDateFilter('');
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Trạng thái</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="MO">Đang mở (MO)</option>
                                <option value="DONG">Đã đóng (DONG)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Áp dụng lọc
                        </button>
                    </div>
                </form>

                {/* Thời khóa biểu theo ngày & ca */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Bảng điều khiển phân ca theo tab */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Thời khóa biểu phân ca</p>
                            <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                                Lịch làm việc theo ca: {activeTabMeta.label}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${activeTabMeta.color}`}>
                                {activeScheduleTab === 'doctor' 
                                    ? `${doctors.length} bác sĩ điều trị`
                                    : `${staffRoster.length} nhân sự ${activeTabMeta.label.toLowerCase()}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        MaBacSi: activeScheduleTab === 'doctor' ? (doctors[0]?.MaBacSi || '') : '',
                                        MaTaiKhoan: activeScheduleTab !== 'doctor' ? (staffRoster[0]?.MaTaiKhoan || '') : '',
                                    }));
                                    setModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Phân ca {activeTabMeta.label}
                            </button>
                        </div>
                    </div>

                    {(() => {
                        const shiftOrder = ['sang', 'chieu', 'toi', 'dem', 'ngay'];

                        return (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-700 min-w-[130px]">
                                                Ca làm việc
                                            </th>
                                            {timetableDates.map((date) => (
                                                <th key={date} className="border-b border-slate-200 px-3 py-3 text-center font-bold text-slate-700 min-w-[210px]">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] uppercase tracking-wide text-slate-500">Ngày</span>
                                                        <span className="text-slate-900 font-bold">{formatDate(date)}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shiftOrder.map((shiftKey) => {
                                            const label = shiftLabelMap[shiftKey] || 'Ca cố định';
                                            const shiftDefinition = fixedShiftOptions.find((item) => item.key === shiftKey) || fixedShiftOptions[1];
                                            return (
                                                <tr key={shiftKey} className="align-top border-b border-slate-200 last:border-b-0">
                                                    <td className="border-r border-slate-200 px-4 py-4 align-top bg-slate-50/70">
                                                        <div className="space-y-1">
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${shiftDefinition.tone}`}>
                                                                {label}
                                                            </span>
                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                {shiftDefinition.start || '--:--'} - {shiftDefinition.end || '--:--'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    {timetableDates.map((date) => {
                                                        // Lọc theo vai trò tab, bộ lọc dropdown và từ khóa tìm kiếm
                                                        const items = scheduleList.filter((sch) => {
                                                            const matchDate = sch.NgayLamViec === date;
                                                            const schLoaiCa = (sch.LoaiCa || 'custom').toLowerCase();
                                                            const matchShift = schLoaiCa === shiftKey || (schLoaiCa === 'ngay' && (shiftKey === 'sang' || shiftKey === 'chieu'));
                                                            if (!matchDate || !matchShift) return false;

                                                            // Lọc theo dropdown
                                                            if (doctorFilter) {
                                                                if (activeScheduleTab === 'doctor' && String(sch.MaBacSi) !== String(doctorFilter)) {
                                                                    return false;
                                                                }
                                                                if (activeScheduleTab !== 'doctor' && String(sch.MaTaiKhoan) !== String(doctorFilter)) {
                                                                    return false;
                                                                }
                                                            }

                                                            // Lọc theo vai trò tab & từ khóa
                                                            const term = searchTerm.trim().toLowerCase();
                                                            if (activeScheduleTab === 'doctor') {
                                                                const doc = getDoctor(sch);
                                                                const isDoc = Boolean(sch.MaBacSi || doc);
                                                                if (!isDoc) return false;
                                                                if (term) {
                                                                    const name = (doc?.HoTen || '').toLowerCase();
                                                                    const spec = getDoctorSpec(doc).toLowerCase();
                                                                    const code = doc?.MaBacSi ? `bs${doc.MaBacSi}` : '';
                                                                    return name.includes(term) || spec.includes(term) || code.includes(term);
                                                                }
                                                                return true;
                                                            }
                                                            if (activeScheduleTab === 'cls') {
                                                                const staffAccount = getStaff(sch);
                                                                const roleName = staffAccount?.vaiTro?.TenVaiTro || staffAccount?.vai_tro?.TenVaiTro;
                                                                const isCls = Boolean(
                                                                    roleName === 'NHAN_VIEN_CAN_LAM_SANG' ||
                                                                    (staffGroups.cls || []).some(c => c.MaTaiKhoan === sch.MaTaiKhoan)
                                                                );
                                                                if (!isCls) return false;
                                                                if (term) {
                                                                    const staff = staffAccount || (staffGroups.cls || []).find(s => s.MaTaiKhoan === sch.MaTaiKhoan);
                                                                    const name = (staff?.name || staff?.TenDangNhap || staff?.HoTen || '').toLowerCase();
                                                                    return name.includes(term);
                                                                }
                                                                return true;
                                                            }
                                                            if (activeScheduleTab === 'reception') {
                                                                const staffAccount = getStaff(sch);
                                                                const roleName = staffAccount?.vaiTro?.TenVaiTro || staffAccount?.vai_tro?.TenVaiTro;
                                                                const isRec = Boolean(
                                                                    roleName === 'LE_TAN' ||
                                                                    (staffGroups.reception || []).some(r => r.MaTaiKhoan === sch.MaTaiKhoan)
                                                                );
                                                                if (!isRec) return false;
                                                                if (term) {
                                                                    const staff = staffAccount || (staffGroups.reception || []).find(s => s.MaTaiKhoan === sch.MaTaiKhoan);
                                                                    const name = (staff?.name || staff?.TenDangNhap || staff?.HoTen || '').toLowerCase();
                                                                    return name.includes(term);
                                                                }
                                                                return true;
                                                            }
                                                            return true;
                                                        });

                                                        return (
                                                            <td key={`${date}-${shiftKey}`} className="border-r border-slate-200 px-3 py-3 align-top bg-white">
                                                                <div className="space-y-2 min-h-[110px]">
                                                                    {items.length > 0 ? (
                                                                        items.map((sch) => {
                                                                            if (activeScheduleTab === 'doctor') {
                                                                                const doc = getDoctor(sch);
                                                                                const initials = getDoctorInitials(doc);
                                                                                const docName = getDoctorDisplayName(doc);
                                                                                const specName = getDoctorSpec(doc);
                                                                                const caKhams = getCaKhams(sch);
                                                                                return (
                                                                                    <div 
                                                                                        key={sch.MaLichLamViec} 
                                                                                        onClick={() => setViewingSchedule(sch)}
                                                                                        className="group relative rounded-xl border border-indigo-200 bg-white hover:border-indigo-500 hover:shadow-md p-2.5 shadow-sm transition-all space-y-1.5 cursor-pointer"
                                                                                        title="Nhấn để xem chi tiết Bác sĩ & Ca trực"
                                                                                    >
                                                                                        <div className="flex items-start gap-2">
                                                                                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                                                                {initials}
                                                                                            </div>
                                                                                            <div className="min-w-0 flex-1">
                                                                                                <div 
                                                                                                    className="text-xs font-black text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors" 
                                                                                                    title={docName}
                                                                                                >
                                                                                                    {docName}
                                                                                                </div>
                                                                                                <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                                                                                                    {specName}
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className="text-[9px] text-slate-400 font-mono">#{sch.MaLichLamViec}</span>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100 font-mono">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <Clock className="w-3 h-3 text-indigo-500" />
                                                                                                {sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}
                                                                                            </span>
                                                                                            {caKhams.length > 0 && (
                                                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                                                                    {caKhams.length} ca khám
                                                                                                </span>
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between pt-1 text-[11px]">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => { 
                                                                                                    e.stopPropagation(); 
                                                                                                    handleOpenAddCa(sch);
                                                                                                }}
                                                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                                                                                                title="Thêm ca khám cho bác sĩ"
                                                                                            >
                                                                                                <Plus className="w-3 h-3" /> Ca khám
                                                                                            </button>
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setViewingSchedule(sch);
                                                                                                    }}
                                                                                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                                                                                                    title="Xem thông tin chi tiết Bác sĩ"
                                                                                                >
                                                                                                    <Eye className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => { 
                                                                                                        e.stopPropagation(); 
                                                                                                        handleDeleteSchedule(sch.MaLichLamViec); 
                                                                                                    }}
                                                                                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                                                                                    title="Xóa ca trực này"
                                                                                                >
                                                                                                    <Trash2 className="w-3 h-3" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            } else if (activeScheduleTab === 'cls') {
                                                                                const staff = getStaff(sch) || (staffGroups.cls || []).find(s => s.MaTaiKhoan === sch.MaTaiKhoan);
                                                                                const staffName = staff?.name || staff?.HoTen || staff?.TenDangNhap || 'Kỹ thuật viên';
                                                                                return (
                                                                                    <div 
                                                                                        key={sch.MaLichLamViec} 
                                                                                        onClick={() => setViewingSchedule(sch)}
                                                                                        className="group relative rounded-xl border border-sky-200 bg-white hover:border-sky-400 hover:shadow-md p-2.5 shadow-sm transition-all space-y-1.5 cursor-pointer"
                                                                                        title="Nhấn để xem chi tiết ca trực"
                                                                                    >
                                                                                        <div className="flex items-start gap-2">
                                                                                            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                                                                CLS
                                                                                            </div>
                                                                                            <div className="min-w-0 flex-1">
                                                                                                <div className="text-xs font-black text-slate-900 leading-tight truncate group-hover:text-sky-600 transition-colors" title={`KTV. ${staffName}`}>
                                                                                                    KTV. {staffName}
                                                                                                </div>
                                                                                                <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-[10px] font-bold text-sky-700 border border-sky-100">
                                                                                                    Xét nghiệm & CLS
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className="text-[9px] text-slate-400 font-mono">#{sch.MaLichLamViec}</span>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100 font-mono">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <Clock className="w-3 h-3 text-sky-500" />
                                                                                                {sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between pt-1">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setViewingSchedule(sch);
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-sky-600 p-0.5 rounded"
                                                                                                title="Xem chi tiết ca trực"
                                                                                            >
                                                                                                <Eye className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => { 
                                                                                                    e.stopPropagation(); 
                                                                                                    handleDeleteSchedule(sch.MaLichLamViec); 
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                                                                                title="Xóa ca trực này"
                                                                                            >
                                                                                                <Trash2 className="w-3 h-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            } else {
                                                                                const staff = getStaff(sch) || (staffGroups.reception || []).find(s => s.MaTaiKhoan === sch.MaTaiKhoan);
                                                                                const staffName = staff?.name || staff?.HoTen || staff?.TenDangNhap || 'Lễ tân';
                                                                                return (
                                                                                    <div 
                                                                                        key={sch.MaLichLamViec} 
                                                                                        onClick={() => setViewingSchedule(sch)}
                                                                                        className="group relative rounded-xl border border-amber-200 bg-white hover:border-amber-400 hover:shadow-md p-2.5 shadow-sm transition-all space-y-1.5 cursor-pointer"
                                                                                        title="Nhấn để xem chi tiết ca trực"
                                                                                    >
                                                                                        <div className="flex items-start gap-2">
                                                                                            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                                                                LT
                                                                                            </div>
                                                                                            <div className="min-w-0 flex-1">
                                                                                                <div className="text-xs font-black text-slate-900 leading-tight truncate group-hover:text-amber-600 transition-colors" title={`Lễ tân. ${staffName}`}>
                                                                                                    Lễ tân. {staffName}
                                                                                                </div>
                                                                                                <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-amber-800 border border-amber-100">
                                                                                                    Đón tiếp & Viện phí
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className="text-[9px] text-slate-400 font-mono">#{sch.MaLichLamViec}</span>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100 font-mono">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <Clock className="w-3 h-3 text-amber-500" />
                                                                                                {sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="flex items-center justify-between pt-1">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setViewingSchedule(sch);
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-amber-600 p-0.5 rounded"
                                                                                                title="Xem chi tiết ca trực"
                                                                                            >
                                                                                                <Eye className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => { 
                                                                                                    e.stopPropagation(); 
                                                                                                    handleDeleteSchedule(sch.MaLichLamViec); 
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                                                                                title="Xóa ca trực này"
                                                                                            >
                                                                                                <Trash2 className="w-3 h-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        })
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                applyFixedShift(shiftKey);
                                                                                setFormData(prev => ({
                                                                                    ...prev,
                                                                                    NgayLamViec: date,
                                                                                    LoaiCa: shiftKey,
                                                                                    GioBatDau: shiftDefinition.start || '08:00',
                                                                                    GioKetThuc: shiftDefinition.end || '12:00',
                                                                                    MaBacSi: activeScheduleTab === 'doctor' ? (doctors[0]?.MaBacSi || '') : '',
                                                                                    MaTaiKhoan: activeScheduleTab !== 'doctor' ? (staffRoster[0]?.MaTaiKhoan || '') : '',
                                                                                }));
                                                                                setModalOpen(true);
                                                                            }}
                                                                            className="flex h-full min-h-[90px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-[10px] font-medium text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition p-2"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5 mb-0.5 text-slate-400 group-hover:text-indigo-600" />
                                                                            + Phân ca
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Modal Tạo Lịch làm việc mới */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Phân công ca</p>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">
                                    Tạo lịch làm việc mới
                                </h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                        {activeScheduleTab === 'doctor' ? 'Bác sĩ điều trị' : (activeScheduleTab === 'cls' ? 'Kỹ thuật viên Cận lâm sàng' : 'Nhân viên Lễ tân')} <span className="text-rose-500">*</span>
                                    </label>
                                    {activeScheduleTab === 'doctor' ? (
                                        <select
                                            value={formData.MaBacSi}
                                            onChange={(e) => setFormData({ ...formData, MaBacSi: Number(e.target.value), MaTaiKhoan: '' })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                        >
                                            {doctors.map((d) => (
                                                <option key={d.MaBacSi} value={d.MaBacSi}>
                                                    {getDoctorDisplayName(d)} ({getDoctorSpec(d)})
                                                </option>
                                            ))}
                                        </select>
                                    ) : activeScheduleTab === 'cls' ? (
                                        <select
                                            value={formData.MaTaiKhoan}
                                            onChange={(e) => setFormData({ ...formData, MaTaiKhoan: Number(e.target.value), MaBacSi: '' })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                        >
                                            <option value="">-- Chọn kỹ thuật viên CLS --</option>
                                            {(staffGroups.cls || []).map((s) => (
                                                <option key={s.MaTaiKhoan} value={s.MaTaiKhoan}>
                                                    {s.HoTen || s.TenDangNhap} ({s.Email})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            value={formData.MaTaiKhoan}
                                            onChange={(e) => setFormData({ ...formData, MaTaiKhoan: Number(e.target.value), MaBacSi: '' })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                        >
                                            <option value="">-- Chọn nhân viên Lễ tân --</option>
                                            {(staffGroups.reception || []).map((s) => (
                                                <option key={s.MaTaiKhoan} value={s.MaTaiKhoan}>
                                                    {s.HoTen || s.TenDangNhap} ({s.Email})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                        Ngày làm việc <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.NgayLamViec}
                                        onChange={(e) => setFormData({ ...formData, NgayLamViec: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                        Chọn ca làm <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {fixedShiftOptions.map((shift) => {
                                            const isActive = selectedShiftKey === shift.key;
                                            return (
                                                <button
                                                    key={shift.key}
                                                    type="button"
                                                    onClick={() => applyFixedShift(shift.key)}
                                                    className={`text-left rounded-2xl border p-3 transition-all ${
                                                        isActive
                                                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${shift.tone}`}>
                                                            {shift.label}
                                                        </span>
                                                        {isActive && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                                    </div>
                                                    <p className="mt-2 text-sm font-bold text-slate-800">{shift.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                            Giờ bắt đầu *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.GioBatDau}
                                            onChange={(e) => {
                                                setSelectedShiftKey('custom');
                                                setFormData({ ...formData, GioBatDau: e.target.value });
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                            Giờ kết thúc *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.GioKetThuc}
                                            onChange={(e) => {
                                                setSelectedShiftKey('custom');
                                                setFormData({ ...formData, GioKetThuc: e.target.value });
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 h-fit">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tóm tắt</p>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                                        <p className="text-xs text-slate-500">Bác sĩ</p>
                                        <p className="mt-1 font-bold text-slate-900">{selectedDoctor ? getDoctorDisplayName(selectedDoctor) : 'Chưa chọn bác sĩ'}</p>
                                    </div>
                                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                                        <p className="text-xs text-slate-500">Ngày làm</p>
                                        <p className="mt-1 font-bold text-slate-900">{formatDate(formData.NgayLamViec)}</p>
                                    </div>
                                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                                        <p className="text-xs text-slate-500">Ca đã chọn</p>
                                        <p className="mt-1 font-bold text-slate-900">{selectedShift.label}</p>
                                        <p className="mt-1 text-sm text-slate-600">{formData.GioBatDau || '--'} - {formData.GioKetThuc || '--'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    <p className="font-bold">Lưu ý quan trọng</p>
                                    <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                                        <li>Mỗi bác sĩ chỉ được 1 ca trong 1 ngày.</li>
                                        <li>Ca chồng lấn sẽ bị hệ thống từ chối.</li>
                                        <li>Ca khám sẽ được mở sau khi lịch làm việc được lưu.</li>
                                    </ul>
                                </div>

                                <div className="pt-4 border-t border-slate-200 mt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                                    >
                                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Tạo lịch làm việc
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Xem chi tiết Bác sĩ & Ca trực */}
            {viewingSchedule && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100 shrink-0">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {viewingSchedule.MaBacSi || getDoctor(viewingSchedule) ? 'Thông tin Bác sĩ & Ca trực' : 'Thông tin Nhân sự & Ca trực'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">Lịch làm việc #{viewingSchedule.MaLichLamViec}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setViewingSchedule(null)} 
                                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chi tiết cho Bác sĩ */}
                        {(() => {
                            const doc = getDoctor(viewingSchedule);
                            const staff = getStaff(viewingSchedule);
                            const caKhams = getCaKhams(viewingSchedule);

                            if (viewingSchedule.MaBacSi || doc) {
                                const specName = getDoctorSpec(doc);
                                return (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 border border-indigo-100 flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shrink-0">
                                                {getDoctorInitials(doc)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-base font-black text-slate-900 leading-tight">
                                                        {getDoctorDisplayName(doc)}
                                                    </h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                                                        {specName}
                                                    </span>
                                                </div>
                                                {doc?.HocVi && (
                                                    <p className="text-xs font-semibold text-slate-600 mt-1">
                                                        Học vị: <span className="text-slate-800">{doc.HocVi}</span>
                                                    </p>
                                                )}
                                                {doc?.MaBacSi && (
                                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                        Mã bác sĩ: BS{String(doc.MaBacSi).padStart(3, '0')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Thông tin liên hệ */}
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                                <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Điện thoại liên hệ
                                                </span>
                                                <p className="font-bold text-slate-800 font-mono">
                                                    {doc?.SoDienThoai || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                                <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email liên hệ
                                                </span>
                                                <p className="font-bold text-slate-800 truncate" title={doc?.EmailLienHe}>
                                                    {doc?.EmailLienHe || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Kinh nghiệm & Giới thiệu */}
                                        {(doc?.KinhNghiem || doc?.MoTa) && (
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                                                <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                                                    <Award className="w-3.5 h-3.5 text-indigo-500" /> Chuyên môn & Kinh nghiệm
                                                </span>
                                                {doc?.KinhNghiem && (
                                                    <p className="font-semibold text-indigo-700">
                                                        {doc.KinhNghiem} năm kinh nghiệm chẩn đoán & điều trị
                                                    </p>
                                                )}
                                                {doc?.MoTa && (
                                                    <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
                                                        {doc.MoTa}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Thông tin ca trực */}
                                        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs">
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span className="flex items-center gap-1.5 text-indigo-900">
                                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                                    {formatDate(viewingSchedule.NgayLamViec)}
                                                </span>
                                                <span className="flex items-center gap-1 font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                    {viewingSchedule.GioBatDau?.slice(0, 5)} - {viewingSchedule.GioKetThuc?.slice(0, 5)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-indigo-100/70">
                                                <span>Trạng thái: <strong className="text-emerald-700 font-bold">{viewingSchedule.TrangThai || 'MỞ'}</strong></span>
                                                <span>Chỉ tiêu tiếp nhận: <strong>{viewingSchedule.SoLuongTiepNhan || 30} lượt</strong></span>
                                            </div>
                                        </div>

                                        {/* Danh sách ca khám con */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Khung giờ ca khám ({caKhams.length})
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const target = viewingSchedule;
                                                        setViewingSchedule(null);
                                                        handleOpenAddCa(target);
                                                    }}
                                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Thêm ca khám
                                                </button>
                                            </div>
                                            {caKhams.length > 0 ? (
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                    {caKhams.map((ca, idx) => (
                                                        <div 
                                                            key={ca.MaCaKham || idx} 
                                                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="font-mono font-bold text-slate-800">
                                                                    {ca.GioBatDau?.slice(0, 5)} - {ca.GioKetThuc?.slice(0, 5)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] text-slate-500">
                                                                    Tối đa: <strong className="text-slate-700">{ca.SoLuongTiepNhan}</strong>
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                                    {ca.TrangThai || 'CON_TRONG'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    Chưa phân chia ca khám con. Nhấn "+ Thêm ca khám" để tạo khung giờ hẹn.
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <a
                                                href="/admin/doctors"
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                            >
                                                Hồ sơ Bác sĩ tại Quản lý Bác sĩ <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setViewingSchedule(null)}
                                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // Chi tiết cho Nhân viên CLS / Lễ tân
                            const staffName = staff?.name || staff?.HoTen || staff?.TenDangNhap || 'Nhân sự';
                            const roleName = staff?.vaiTro?.TenVaiTro || staff?.vai_tro?.TenVaiTro || (activeScheduleTab === 'cls' ? 'Kỹ thuật viên CLS' : 'Lễ tân tiếp đón');
                            return (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 border border-sky-100 flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-lg font-black shadow-md shrink-0">
                                            {activeScheduleTab === 'cls' ? 'CLS' : 'LT'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-base font-black text-slate-900 leading-tight">
                                                    {staffName}
                                                </h4>
                                                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold border border-sky-200">
                                                    {roleName}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono mt-1">
                                                Tài khoản: @{staff?.TenDangNhap || staffName}
                                            </p>
                                            {staff?.Email && (
                                                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {staff.Email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thông tin ca trực */}
                                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2 text-xs">
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                            <span className="flex items-center gap-1.5 text-sky-900">
                                                <Calendar className="w-4 h-4 text-sky-600" />
                                                {formatDate(viewingSchedule.NgayLamViec)}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-100">
                                                <Clock className="w-3.5 h-3.5 text-sky-500" />
                                                {viewingSchedule.GioBatDau?.slice(0, 5)} - {viewingSchedule.GioKetThuc?.slice(0, 5)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-sky-100/70">
                                            <span>Trạng thái: <strong className="text-emerald-700 font-bold">{viewingSchedule.TrangThai || 'MỞ'}</strong></span>
                                            <span>Mã phân ca: #{viewingSchedule.MaLichLamViec}</span>
                                        </div>
                                    </div>

                                    {/* Actions footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <a
                                            href="/admin/staffs"
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline"
                                        >
                                            Đến Quản lý Nhân sự <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setViewingSchedule(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Modal Thêm Ca khám */}
            {caModalOpen && selectedScheduleForCa && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Thêm Ca khám mới</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Lịch #{selectedScheduleForCa.MaLichLamViec} ({selectedScheduleForCa.GioBatDau.slice(0, 5)} - {selectedScheduleForCa.GioKetThuc.slice(0, 5)})
                                </p>
                            </div>
                            <button onClick={() => setCaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCaKham} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giờ bắt đầu ca *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={caFormData.GioBatDau}
                                        onChange={(e) => setCaFormData({ ...caFormData, GioBatDau: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giờ kết thúc ca *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={caFormData.GioKetThuc}
                                        onChange={(e) => setCaFormData({ ...caFormData, GioKetThuc: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Số lượng tiếp nhận tối đa <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    value={caFormData.SoLuongTiepNhan}
                                    onChange={(e) => setCaFormData({ ...caFormData, SoLuongTiepNhan: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">Giới hạn số bệnh nhân được phép đặt lịch trong khung giờ này</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCaModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Lưu ca khám
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
