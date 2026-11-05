import DashboardLayout from '@/Layouts/DashboardLayout';
import { NavItem } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    CalendarRange,
    CheckCircle2,
    Clock3,
    DollarSign,
    AlertTriangle,
    LogIn,
    LogOut,
    Calendar,
    Briefcase,
    TrendingUp,
    FileText,
    FilePlus2,
    CalendarX2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import RequestModal, { ColleagueOption } from '@/Components/RequestModal';

export interface AttendanceRecord {
    MaChamCong: number;
    NgayChamCong: string;
    LoaiCa?: string;
    GioCheckIn?: string;
    GioCheckOut?: string;
    TrangThai?: string;
    SoPhutTre?: number;
    SoPhutVeSom?: number;
    TienLuongCoBan?: number;
    PhuCapCa?: number;
    TienThuong?: number;
    TienPhat?: number;
    TongTien?: number;
    donTu?: {
        LoaiDon?: string;
        SoPhutDuocDuyet?: number;
        TrangThai?: string;
    };
}

export interface PayrollRecord {
    MaBangLuong: number;
    ThangNam: string;
    SoNgayLam: number;
    SoCaLam: number;
    TienLuongCoBan: number;
    PhuCapCa: number;
    TienThuong: number;
    TienPhat: number;
    TongTien: number;
    TrangThai: string;
}

export interface ScheduleRecord {
    MaLichLamViec?: number;
    NgayLamViec?: string;
    CaLamViec?: string;
    LoaiCa?: string;
    GioBatDau?: string;
    GioKetThuc?: string;
    GhiChu?: string;
}

export interface StaffRequestItem {
    MaDonTu: number;
    LoaiDon: string;
    NgayApDung: string;
    SoPhutXinPhep: number;
    SoPhutDuocDuyet: number;
    LyDo: string;
    TrangThai: string;
    GhiChuAdmin?: string;
    created_at?: string;
}

interface Props {
    auth: any;
    role: 'doctor' | 'receptionist' | 'cls';
    navItems: NavItem[];
    roleTitle: string;
    roleCode: string;
    month: string;
    todayRecord?: AttendanceRecord | null;
    todaySchedule?: ScheduleRecord | null;
    monthlyPayroll?: PayrollRecord | null;
    monthlyAttendance?: AttendanceRecord[];
    myRequests?: StaffRequestItem[];
    colleagues?: ColleagueOption[];
}

export default function StaffAttendanceView({
    auth,
    role,
    navItems,
    roleTitle,
    roleCode,
    month,
    todayRecord,
    todaySchedule,
    monthlyPayroll,
    monthlyAttendance = [],
    myRequests = [],
    colleagues = [],
}: Props) {
    const [selectedMonth, setSelectedMonth] = useState(month || new Date().toISOString().slice(0, 7));
    const [loadingAction, setLoadingAction] = useState<'check-in' | 'check-out' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const userName = auth?.user?.name || auth?.user?.TenDangNhap || roleTitle;
    const rolePrefix = role === 'doctor' ? 'doctor' : role === 'cls' ? 'cls' : 'receptionist';

    const hasSchedule = !!todaySchedule;
    const hasCheckedIn = !!todayRecord?.GioCheckIn;
    const hasCheckedOut = !!todayRecord?.GioCheckOut;

    const totals = useMemo(() => {
        if (monthlyPayroll) {
            return {
                workDays: monthlyPayroll.SoNgayLam || 0,
                base: Number(monthlyPayroll.TienLuongCoBan || 0),
                allowance: Number(monthlyPayroll.PhuCapCa || 0),
                bonus: Number(monthlyPayroll.TienThuong || 0),
                penalty: Number(monthlyPayroll.TienPhat || 0),
                total: Number(monthlyPayroll.TongTien || 0),
            };
        }
        return monthlyAttendance.reduce(
            (acc, item) => {
                acc.workDays += 1;
                acc.base += Number(item.TienLuongCoBan || 0);
                acc.allowance += Number(item.PhuCapCa || 0);
                acc.bonus += Number(item.TienThuong || 0);
                acc.penalty += Number(item.TienPhat || 0);
                acc.total += Number(item.TongTien || 0);
                return acc;
            },
            { workDays: 0, base: 0, allowance: 0, bonus: 0, penalty: 0, total: 0 }
        );
    }, [monthlyPayroll, monthlyAttendance]);

    const formatMoney = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

    const handleMonthChange = (value: string) => {
        setSelectedMonth(value);
        const path = role === 'doctor' ? '/doctor/payroll' : `/${rolePrefix}/attendance`;
        router.get(path, { month: value }, { preserveState: true, replace: true });
    };

    const handleAttendanceAction = async (action: 'check-in' | 'check-out') => {
        if (!hasSchedule) {
            setFeedback({
                type: 'error',
                message: 'Hôm nay bạn không có ca làm việc nào được phân công. Không thể điểm danh!',
            });
            return;
        }

        const time = new Date().toTimeString().slice(0, 8);
        const today = new Date().toISOString().slice(0, 10);

        const payload = {
            NgayChamCong: today,
            ...(action === 'check-in' ? { GioCheckIn: time } : { GioCheckOut: time }),
        };

        setLoadingAction(action);
        setFeedback(null);

        try {
            const res = await axios.post(`/${rolePrefix}/attendance/${action}`, payload);
            if (res.data?.success) {
                setFeedback({
                    type: 'success',
                    message: res.data?.message || (action === 'check-in' ? 'Check-in thành công! Chúc bạn ca trực thuận lợi.' : 'Check-out hoàn tất ca trực! Cảm ơn bạn.'),
                });
                router.reload();
            } else {
                setFeedback({ type: 'error', message: res.data?.message || 'Có lỗi xảy ra.' });
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : 'Có lỗi xảy ra, vui lòng thử lại.');
            setFeedback({ type: 'error', message: String(msg) });
        } finally {
            setLoadingAction(null);
        }
    };

    const formatLoaiDon = (loai: string) => {
        switch (loai) {
            case 'DOI_CA': return 'Xin đổi ca';
            case 'DI_MUON': return 'Xin đến muộn';
            case 'VE_SOM': return 'Xin về sớm';
            case 'NGHI_PHEP': return 'Xin nghỉ phép';
            default: return loai;
        }
    };

    return (
        <DashboardLayout
            role={role}
            navItems={navItems}
            user={{ name: userName, code: roleCode }}
            header="Chấm công & Bảng lương"
        >
            <Head title={`Chấm công & Lương - ${roleTitle}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner Thông tin cá nhân & Bộ lọc tháng */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">Chấm công & Bảng lương</h1>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {roleTitle}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Điểm danh ca trực hàng ngày, ghi nhận giờ làm và theo dõi chế độ phụ cấp ca trực minh bạch.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRequestModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                            >
                                <FilePlus2 className="w-4 h-4" />
                                Làm đơn xin phép / Đổi ca
                            </button>

                            <label className="text-sm text-slate-600 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <CalendarRange className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-700">Tháng:</span>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthChange(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Feedback Alert */}
                {feedback && (
                    <div
                        className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                    >
                        <span>{feedback.message}</span>
                        <button
                            type="button"
                            onClick={() => setFeedback(null)}
                            className="font-bold ml-4 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Card Chấm công hôm nay */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-indigo-200 text-xs font-semibold">
                                <Clock3 className="w-3.5 h-3.5" />
                                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <h2 className="text-xl font-bold">Điểm danh ca làm việc hôm nay</h2>
                            <p className="text-indigo-200 text-sm max-w-xl">
                                {hasSchedule ? (
                                    <span>
                                        Lịch làm việc: <strong>{todaySchedule.CaLamViec || 'Ca ngày'}</strong> ({todaySchedule.GioBatDau?.slice(0, 5) || '08:00'} - {todaySchedule.GioKetThuc?.slice(0, 5) || '17:00'})
                                    </span>
                                ) : (
                                    <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                                        <CalendarX2 className="w-4 h-4" />
                                        Hôm nay bạn không có ca làm việc nào được phân công trong hệ thống.
                                    </span>
                                )}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/15">
                                    <div className="text-xs text-indigo-200">Giờ Check-in</div>
                                    <div className="text-lg font-bold font-mono">
                                        {todayRecord?.GioCheckIn || '--:--:--'}
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/15">
                                    <div className="text-xs text-indigo-200">Giờ Check-out</div>
                                    <div className="text-lg font-bold font-mono">
                                        {todayRecord?.GioCheckOut || '--:--:--'}
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/15">
                                    <div className="text-xs text-indigo-200">Trạng thái ca</div>
                                    <div className="text-sm font-bold flex items-center gap-1.5 pt-1">
                                        {todayRecord ? (
                                            todayRecord.TrangThai === 'DI_MUON_CO_PHEP' ? (
                                                <span className="text-sky-300">Đi muộn có phép (Miễn phạt)</span>
                                            ) : todayRecord.TrangThai === 'VE_SOM_CO_PHEP' ? (
                                                <span className="text-sky-300">Về sớm có phép (Miễn phạt)</span>
                                            ) : todayRecord.TrangThai === 'MUON' ? (
                                                <span className="text-amber-300">Đi muộn ({todayRecord.SoPhutTre || 0}p)</span>
                                            ) : todayRecord.TrangThai === 'VE_SOM' ? (
                                                <span className="text-rose-300">Về sớm ({todayRecord.SoPhutVeSom || 0}p)</span>
                                            ) : (
                                                <span className="text-emerald-300">Đúng giờ</span>
                                            )
                                        ) : (
                                            <span className="text-slate-400">Chưa điểm danh</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
                            <button
                                type="button"
                                disabled={!hasSchedule || hasCheckedIn || loadingAction === 'check-in'}
                                onClick={() => handleAttendanceAction('check-in')}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                                    !hasSchedule
                                        ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                                        : hasCheckedIn
                                        ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                            >
                                <LogIn className="w-4 h-4" />
                                {loadingAction === 'check-in'
                                    ? 'Đang xử lý...'
                                    : hasCheckedIn
                                    ? 'Đã Check-in'
                                    : 'Check-in ngay'}
                            </button>

                            <button
                                type="button"
                                disabled={!hasSchedule || !hasCheckedIn || hasCheckedOut || loadingAction === 'check-out'}
                                onClick={() => handleAttendanceAction('check-out')}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                                    !hasSchedule || !hasCheckedIn || hasCheckedOut
                                        ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30'
                                }`}
                            >
                                <LogOut className="w-4 h-4" />
                                {loadingAction === 'check-out'
                                    ? 'Đang xử lý...'
                                    : hasCheckedOut
                                    ? 'Đã Check-out'
                                    : 'Check-out ca'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 5 Thẻ Thống kê Lương tháng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                            <span>Số ca làm việc</span>
                            <Briefcase className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900">{totals.workDays} ca</div>
                        <div className="text-xs text-slate-400 mt-1">Trong tháng {selectedMonth}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                            <span>Lương cơ bản</span>
                            <DollarSign className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-900">{formatMoney(totals.base)}</div>
                        <div className="text-xs text-slate-400 mt-1">Mức chuẩn theo quy định</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                            <span>Phụ cấp ca</span>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-emerald-600">{formatMoney(totals.allowance)}</div>
                        <div className="text-xs text-slate-400 mt-1">Ca chiều/tối/đêm</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                            <span>Phạt trễ / Về sớm</span>
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-amber-600">{formatMoney(totals.penalty)}</div>
                        <div className="text-xs text-slate-400 mt-1">Quy chế nhân văn &gt;15p</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-sm">
                            <span>Thực lĩnh ước tính</span>
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="mt-3 text-2xl font-black text-indigo-600">{formatMoney(totals.total)}</div>
                        <div className="text-xs text-slate-400 mt-1">
                            {monthlyPayroll ? `Trạng thái: ${monthlyPayroll.TrangThai}` : 'Tạm tính'}
                        </div>
                    </div>
                </div>

                {/* Bảng Nhật ký chấm công trong tháng */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-bold text-slate-900">Nhật ký chấm công tháng {selectedMonth}</h2>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                            {monthlyAttendance.length} lượt chấm công
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ngày</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ca</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Check-in</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Check-out</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Đi muộn</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Về sớm</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Lương ca</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Phạt</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Tổng ca</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {monthlyAttendance.length > 0 ? (
                                    monthlyAttendance.map((rec) => (
                                        <tr key={rec.MaChamCong} className="hover:bg-slate-50">
                                            <td className="px-5 py-4 font-semibold text-slate-900 text-sm">
                                                {rec.NgayChamCong}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600 capitalize">
                                                {rec.LoaiCa || 'Sáng'}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-mono text-slate-700">
                                                {rec.GioCheckIn || '--:--:--'}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-mono text-slate-700">
                                                {rec.GioCheckOut || '--:--:--'}
                                            </td>
                                            <td className="px-5 py-4 text-sm">
                                                {rec.SoPhutTre && rec.SoPhutTre > 0 ? (
                                                    <span className="text-amber-600 font-medium">+{rec.SoPhutTre}p</span>
                                                ) : (
                                                    <span className="text-emerald-600">Đúng giờ</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm">
                                                {rec.SoPhutVeSom && rec.SoPhutVeSom > 0 ? (
                                                    <span className="text-rose-600 font-medium">-{rec.SoPhutVeSom}p</span>
                                                ) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {formatMoney(rec.TienLuongCoBan || 0)}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-amber-600 font-medium">
                                                {formatMoney(rec.TienPhat || 0)}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-slate-900">
                                                {formatMoney(rec.TongTien || 0)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        rec.TrangThai?.includes('CO_PHEP')
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : rec.TrangThai === 'MUON'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : rec.TrangThai === 'VE_SOM'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                                >
                                                    {rec.TrangThai === 'DI_MUON_CO_PHEP'
                                                        ? 'Muộn có phép'
                                                        : rec.TrangThai === 'VE_SOM_CO_PHEP'
                                                        ? 'Sớm có phép'
                                                        : rec.TrangThai === 'MUON'
                                                        ? 'Đi muộn'
                                                        : rec.TrangThai === 'VE_SOM'
                                                        ? 'Về sớm'
                                                        : 'Có mặt'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-500">
                                            Chưa có dữ liệu chấm công cho tháng {selectedMonth}. Hãy bấm Check-in khi bắt đầu ca trực!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bảng Đơn từ của tôi */}
                {myRequests.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-900">Đơn từ xin phép & Đổi ca của tôi</h2>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                                {myRequests.length} đơn đã gửi
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Loại đơn</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Ngày áp dụng</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Số phút xin</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Số phút duyệt</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Lý do</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Trạng thái</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase text-slate-500">Phản hồi Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {myRequests.map((req) => (
                                        <tr key={req.MaDonTu} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 text-sm font-bold text-slate-900">
                                                {formatLoaiDon(req.LoaiDon)}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600 font-mono">
                                                {req.NgayApDung}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-slate-700">
                                                {req.SoPhutXinPhep > 0 ? `${req.SoPhutXinPhep} phút` : '--'}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-bold text-indigo-600">
                                                {req.TrangThai === 'DA_DUYET' ? `${req.SoPhutDuocDuyet} phút` : '--'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600 max-w-xs truncate">
                                                {req.LyDo}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        req.TrangThai === 'DA_DUYET'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : req.TrangThai === 'CHO_ADMIN_DUYET'
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : req.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : req.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                            ? 'bg-slate-200 text-slate-700'
                                                            : req.TrangThai === 'TU_CHOI' || req.TrangThai === 'ADMIN_TU_CHOI'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {req.TrangThai === 'DA_DUYET'
                                                        ? 'Đã duyệt'
                                                        : req.TrangThai === 'CHO_ADMIN_DUYET'
                                                        ? 'Đồng nghiệp đã OK • Chờ Admin'
                                                        : req.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                        ? 'Chờ đồng nghiệp bấm OK'
                                                        : req.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                        ? 'Đồng nghiệp từ chối'
                                                        : req.TrangThai === 'TU_CHOI' || req.TrangThai === 'ADMIN_TU_CHOI'
                                                        ? 'Từ chối'
                                                        : 'Chờ duyệt'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-500">
                                                {req.GhiChuAdmin || '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <RequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                rolePrefix={rolePrefix}
                todaySchedule={todaySchedule}
                colleagues={colleagues}
            />
        </DashboardLayout>
    );
}
