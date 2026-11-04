import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, 
    Clock, 
    User, 
    Stethoscope, 
    XCircle, 
    CheckCircle2, 
    AlertCircle, 
    Filter,
    CalendarPlus,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { patientNavItems } from './Patient/Dashboard';

interface LichHenItem {
    MaLichHen: number;
    MaBenhNhan: number;
    MaCaKham: number;
    TrangThai: string;
    LyDoKham?: string;
    NgayDat?: string;
    caKham?: {
        MaCaKham: number;
        GioBatDau: string;
        GioKetThuc: string;
        TrangThai: string;
        lichLamViec?: {
            NgayLamViec: string;
            bacSi?: {
                MaBacSi: number;
                HoTen: string;
                HocVi?: string;
                chuyenKhoa?: {
                    MaChuyenKhoa: number;
                    TenChuyenKhoa: string;
                };
            };
        };
    };
}

interface AppointmentsProps {
    auth: any;
    appointments: LichHenItem[];
}

export default function Appointments({ auth, appointments = [] }: AppointmentsProps) {
    const [list, setList] = useState<LichHenItem[]>(appointments);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleCancel = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không? Sau khi hủy, khung giờ khám sẽ được giải phóng cho bệnh nhân khác.')) {
            return;
        }

        setCancellingId(id);
        setFeedback(null);

        try {
            const res = await axios.post(`/appointments/${id}/cancel`, {}, {
                headers: { Accept: 'application/json' },
            });

            if (res.data?.success) {
                setFeedback({ type: 'success', message: 'Hủy lịch hẹn thành công.' });
                setList((prev) =>
                    prev.map((item) =>
                        item.MaLichHen === id ? { ...item, TrangThai: 'DA_HUY' } : item
                    )
                );
            } else {
                setFeedback({ type: 'error', message: res.data?.message || 'Không thể hủy lịch hẹn.' });
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setCancellingId(null);
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

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        return timeStr.slice(0, 5);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CHO_XAC_NHAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Chờ xác nhận</span>;
            case 'DA_XAC_NHAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'DA_TIEP_NHAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">Đã tiếp nhận</span>;
            case 'HOAN_THANH':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Hoàn thành</span>;
            case 'DA_HUY':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Đã hủy</span>;
            default:
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    // Lọc danh sách theo tab
    const filteredAppointments = list.filter((item) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'UPCOMING') return item.TrangThai === 'CHO_XAC_NHAN' || item.TrangThai === 'DA_XAC_NHAN';
        if (statusFilter === 'RECEIVED') return item.TrangThai === 'DA_TIEP_NHAN';
        if (statusFilter === 'COMPLETED') return item.TrangThai === 'HOAN_THANH';
        if (statusFilter === 'CANCELLED') return item.TrangThai === 'DA_HUY';
        return true;
    });

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Lịch hẹn của tôi"
        >
            <Head title="Lịch hẹn khám - SmartCare" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh sách lịch hẹn khám bệnh</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Theo dõi tình trạng xác nhận, thời gian khám và chủ động quản lý lịch hẹn.
                        </p>
                    </div>

                    <Link
                        href="/patient/book"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        Đặt lịch mới
                    </Link>
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

                {/* Thanh bộ lọc theo trạng thái */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-fit">
                    {[
                        { id: 'ALL', label: 'Tất cả' },
                        { id: 'UPCOMING', label: 'Sắp tới' },
                        { id: 'RECEIVED', label: 'Đã tiếp nhận' },
                        { id: 'COMPLETED', label: 'Hoàn thành' },
                        { id: 'CANCELLED', label: 'Đã hủy' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-white text-teal-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Danh sách thẻ lịch hẹn */}
                {filteredAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAppointments.map((app) => {
                            const canCancel = app.TrangThai === 'CHO_XAC_NHAN' || app.TrangThai === 'DA_XAC_NHAN';
                            const doc = app.caKham?.lichLamViec?.bacSi;
                            const spec = doc?.chuyenKhoa;
                            const slot = app.caKham;
                            const workDay = app.caKham?.lichLamViec?.NgayLamViec;

                            return (
                                <div
                                    key={app.MaLichHen}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(app.TrangThai)}
                                            <span className="text-xs font-mono text-slate-400">
                                                Mã LH: #{app.MaLichHen}
                                            </span>
                                            {app.NgayDat && (
                                                <span className="text-xs text-slate-400">
                                                    (Đặt lúc: {formatDate(app.NgayDat)})
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">Bác sĩ phụ trách</p>
                                                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                                                    <Stethoscope className="w-4 h-4 text-teal-600" />
                                                    {doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Bác sĩ phòng khám'}
                                                </p>
                                                {spec?.TenChuyenKhoa && (
                                                    <p className="text-xs text-slate-500 pl-5.5 mt-0.5">
                                                        Chuyên khoa: <span className="font-semibold text-slate-700">{spec.TenChuyenKhoa}</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">Thời gian khám</p>
                                                <p className="text-sm font-bold text-teal-800 flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="w-4 h-4 text-teal-600" />
                                                    {formatTime(slot?.GioBatDau)} - {formatTime(slot?.GioKetThuc)}
                                                    <span className="text-slate-300 mx-1">|</span>
                                                    <Calendar className="w-4 h-4 text-teal-600" />
                                                    {formatDate(workDay)}
                                                </p>
                                            </div>

                                            {app.LyDoKham && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-xs text-slate-400 font-medium">Lý do khám / Triệu chứng</p>
                                                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                                                        {app.LyDoKham}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cột thao tác */}
                                    <div className="w-full md:w-48 shrink-0 flex flex-col justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                                        {canCancel ? (
                                            <button
                                                onClick={() => handleCancel(app.MaLichHen)}
                                                disabled={cancellingId === app.MaLichHen}
                                                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                {cancellingId === app.MaLichHen ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-rose-500" />
                                                )}
                                                Hủy lịch hẹn
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 text-center italic">
                                                {app.TrangThai === 'DA_HUY' ? 'Lịch đã bị hủy' : 'Không thể hủy lịch này'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Không tìm thấy lịch hẹn nào</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Bạn không có lịch hẹn nào thuộc trạng thái này. Đặt lịch khám mới để được ưu tiên phục vụ.
                        </p>
                        <div className="mt-5">
                            <Link
                                href="/patient/book"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                            >
                                <CalendarPlus className="w-4 h-4" />
                                Đặt lịch ngay
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
