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
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { adminNavItems } from './Dashboard';

interface DoctorBrief {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    chuyenKhoa?: {
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
    MaBacSi: number;
    NgayLamViec: string;
    GioBatDau: string;
    GioKetThuc: string;
    TrangThai: string; // 'MO', 'DONG'
    bacSi?: DoctorBrief;
    caKhams?: CaKhamItem[];
}

interface SchedulesProps {
    auth: any;
    schedules: ScheduleItem[];
    doctors: DoctorBrief[];
    filters: {
        doctor_id?: string;
        date?: string;
        from_date?: string;
        to_date?: string;
        status?: string;
    };
}

export default function AdminSchedules({ auth, schedules = [], doctors = [], filters = {} }: SchedulesProps) {
    const [doctorFilter, setDoctorFilter] = useState(filters.doctor_id || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(schedules);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal thêm ca khám
    const [caModalOpen, setCaModalOpen] = useState(false);
    const [selectedScheduleForCa, setSelectedScheduleForCa] = useState<ScheduleItem | null>(null);

    // Form tạo lịch làm việc
    const [formData, setFormData] = useState({
        MaBacSi: doctors[0]?.MaBacSi || 1,
        NgayLamViec: new Date().toISOString().split('T')[0],
        GioBatDau: '08:00',
        GioKetThuc: '12:00',
        SoLuongTiepNhan: 10,
        TrangThai: 'MO',
    });

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
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
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
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Lịch làm việc & Ca khám Toàn viện</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Lên lịch công tác cho bác sĩ, phân chia khung giờ ca khám và điều phối tải tiếp nhận.
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

                {feedback && (
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Thanh tìm kiếm & bộ lọc */}
                <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-72">
                        <select
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả bác sĩ</option>
                            {doctors.map((d) => (
                                <option key={d.MaBacSi} value={d.MaBacSi}>
                                    {d.HocVi ? `${d.HocVi}. ` : 'BS. '}{d.HoTen} ({d.chuyenKhoa?.TenChuyenKhoa || 'Đa khoa'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="MO">Đang mở (MO)</option>
                            <option value="DONG">Đã đóng (DONG)</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Danh sách Lịch làm việc & Ca khám */}
                <div className="space-y-4">
                    {scheduleList.map((sch) => {
                        const doc = sch.bacSi;
                        const cas = sch.caKhams || [];
                        const isMo = sch.TrangThai === 'MO';

                        return (
                            <div
                                key={sch.MaLichLamViec}
                                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                                isMo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {isMo ? 'Đang mở' : 'Đã đóng'}
                                            </span>
                                            <span className="font-bold font-mono text-indigo-700 text-sm">
                                                Lịch #{sch.MaLichLamViec}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                • Ngày làm việc: <strong>{formatDate(sch.NgayLamViec)}</strong>
                                            </span>
                                        </div>

                                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Stethoscope className="w-4 h-4 text-teal-600" />
                                            {doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Bác sĩ phụ trách'}
                                            {doc?.chuyenKhoa?.TenChuyenKhoa && (
                                                <span className="text-xs font-normal text-slate-500">
                                                    ({doc.chuyenKhoa.TenChuyenKhoa})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-right text-xs">
                                            <span className="text-slate-400 block">Khung giờ làm việc</span>
                                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                                {sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleOpenAddCa(sch)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Thêm ca khám
                                        </button>
                                    </div>
                                </div>

                                {/* Danh sách ca khám trực thuộc */}
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Ca khám trực thuộc ({cas.length} ca)
                                    </p>
                                    {cas.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {cas.map((ca) => (
                                                <div
                                                    key={ca.MaCaKham}
                                                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1"
                                                >
                                                    <div className="flex justify-between items-center font-bold text-slate-900">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                                                            {ca.GioBatDau?.slice(0, 5)} - {ca.GioKetThuc?.slice(0, 5)}
                                                        </span>
                                                        <span className="font-mono text-slate-400">#{ca.MaCaKham}</span>
                                                    </div>
                                                    <p className="text-slate-500">
                                                        Tiếp nhận: <strong>{ca.SoLuongTiepNhan} người</strong>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">
                                            Chưa chia ca khám cụ thể trong lịch này. Nhấn "Thêm ca khám" để thiết lập.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Tạo Lịch làm việc mới */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                Tạo Lịch làm việc Bác sĩ mới
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Bác sĩ <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.MaBacSi}
                                    onChange={(e) => setFormData({ ...formData, MaBacSi: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    {doctors.map((d) => (
                                        <option key={d.MaBacSi} value={d.MaBacSi}>
                                            {d.HocVi ? `${d.HocVi}. ` : 'BS. '}{d.HoTen}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giờ bắt đầu *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.GioBatDau}
                                        onChange={(e) => setFormData({ ...formData, GioBatDau: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giờ kết thúc *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.GioKetThuc}
                                        onChange={(e) => setFormData({ ...formData, GioKetThuc: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
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
                        </form>
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
