import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    ArrowRightLeft, 
    Check, 
    X, 
    AlertCircle, 
    CheckCircle2, 
    FileText, 
    CalendarClock,
    UserCheck,
    Send,
    Loader2
} from 'lucide-react';
import RequestModal, { ColleagueOption } from './RequestModal';
import axios from 'axios';

export interface ScheduleItem {
    MaLichLamViec: number;
    MaBacSi?: number;
    MaTaiKhoan?: number;
    NgayLamViec: string;
    GioBatDau: string;
    GioKetThuc: string;
    LoaiCa?: string;
    TrangThai: string;
    caKhams?: any[];
    assigned_count?: number;
    waiting_receive_count?: number;
    in_progress_count?: number;
    completed_count?: number;
}

export interface PeerRequestItem {
    MaDonTu: number;
    MaTaiKhoan: number;
    LoaiDon: string;
    NgayApDung: string;
    SoPhutXinPhep: number;
    TaiKhoanDoiCung?: number;
    LyDo: string;
    TrangThai: string;
    XacNhanDongNghiep?: boolean;
    GhiChuDongNghiep?: string;
    created_at?: string;
    taiKhoan?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        name?: string;
        vaiTro?: {
            TenVaiTro: string;
        };
        bacSi?: {
            HoTen: string;
            HocVi?: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
    };
    taiKhoanDoiCung?: any;
    lichLamViec?: ScheduleItem;
    lichDoiSang?: ScheduleItem;
}

interface Props {
    schedules: ScheduleItem[];
    rolePrefix: 'doctor' | 'receptionist' | 'cls';
    roleDisplayName: string;
    requestsForMe?: PeerRequestItem[];
    myRequests?: PeerRequestItem[];
    colleagues?: ColleagueOption[];
    filters?: {
        date?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function PersonalScheduleTimetable({
    schedules = [],
    rolePrefix,
    roleDisplayName,
    requestsForMe = [],
    myRequests = [],
    colleagues = [],
    filters = {},
}: Props) {
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const todayStr = new Date().toISOString().slice(0, 10);
    const [selectedDate, setSelectedDate] = useState<string>(filters.date || todayStr);

    // Xác định ngày bắt đầu của tuần (Thứ 2)
    const [weekStart, setWeekStart] = useState<Date>(() => {
        if (filters.from_date) return new Date(filters.from_date);
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // Modal đổi ca / xin phép
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoaiDon, setModalLoaiDon] = useState<'DI_MUON' | 'VE_SOM' | 'DOI_CA' | 'NGHI_PHEP'>('DOI_CA');
    const [modalDate, setModalDate] = useState<string>(todayStr);
    const [modalScheduleId, setModalScheduleId] = useState<number | undefined>(undefined);

    // State xử lý xác nhận đổi ca
    const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Tính toán 7 ngày trong tuần
    const weekDays = useMemo(() => {
        const days: { dateStr: string; dayName: string; dayNumber: string; isToday: boolean }[] = [];
        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        
        for (let i = 0; i < 7; i++) {
            const current = new Date(weekStart);
            current.setDate(weekStart.getDate() + i);
            const dateStr = current.toISOString().slice(0, 10);
            const dayNumber = current.getDate().toString().padStart(2, '0') + '/' + (current.getMonth() + 1).toString().padStart(2, '0');
            days.push({
                dateStr,
                dayName: dayNames[i],
                dayNumber,
                isToday: dateStr === todayStr,
            });
        }
        return days;
    }, [weekStart, todayStr]);

    const shiftDefinitions = [
        { key: 'sang', label: 'Ca sáng', time: '08:00 - 12:00', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'chieu', label: 'Ca chiều', time: '13:00 - 17:00', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
        { key: 'toi', label: 'Ca tối', time: '17:30 - 20:30', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
        { key: 'dem', label: 'Ca đêm', time: '19:00 - 23:00', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { key: 'ngay', label: 'Cả ngày', time: '08:00 - 17:00', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    ];

    const handleShiftWeek = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            setWeekStart(d);
            setSelectedDate(todayStr);

            router.get(window.location.pathname, {
                from_date: d.toISOString().slice(0, 10),
                to_date: new Date(d.getTime() + 6 * 86400000).toISOString().slice(0, 10),
            }, { preserveState: true, replace: true });
            return;
        }

        const newStart = new Date(weekStart);
        newStart.setDate(weekStart.getDate() + (direction === 'prev' ? -7 : 7));
        setWeekStart(newStart);

        const from = newStart.toISOString().slice(0, 10);
        const toDate = new Date(newStart);
        toDate.setDate(newStart.getDate() + 6);
        const to = toDate.toISOString().slice(0, 10);

        router.get(window.location.pathname, {
            from_date: from,
            to_date: to,
        }, { preserveState: true, replace: true });
    };

    // Đồng nghiệp xác nhận hoặc từ chối đổi ca
    const handlePeerConfirm = async (requestId: number, action: 'accept' | 'reject') => {
        setProcessingRequestId(requestId);
        setFeedback(null);
        try {
            const res = await axios.post(`/staff/requests/${requestId}/peer-confirm`, {
                action,
                note: action === 'accept' ? 'Tôi đã đồng ý đổi ca trực này.' : 'Tôi không tiện đổi ca lúc này.',
            });

            if (res.data?.success) {
                setFeedback({
                    type: 'success',
                    message: res.data.message || (action === 'accept' ? 'Đã xác nhận đồng ý đổi ca!' : 'Đã từ chối đổi ca.'),
                });
                router.reload();
            }
        } catch (err: any) {
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận đổi ca.',
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const openSwapForSchedule = (sch: ScheduleItem) => {
        setModalLoaiDon('DOI_CA');
        setModalDate(sch.NgayLamViec);
        setModalScheduleId(sch.MaLichLamViec);
        setModalOpen(true);
    };

    const openLeaveForSchedule = (sch: ScheduleItem, type: 'DI_MUON' | 'VE_SOM') => {
        setModalLoaiDon(type);
        setModalDate(sch.NgayLamViec);
        setModalScheduleId(sch.MaLichLamViec);
        setModalOpen(true);
    };

    // Lọc ca làm việc cho chế độ ngày
    const daySchedules = useMemo(() => {
        return schedules.filter((s) => s.NgayLamViec === selectedDate);
    }, [schedules, selectedDate]);

    return (
        <div className="space-y-6">
            {/* THÔNG BÁO FEEDBACK */}
            {feedback && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                        <span className="font-medium">{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* HỘP HỘP ĐỔI CA CHỜ TÔI XÁC NHẬN (PEER CONFIRMATION INBOX) */}
            {requestsForMe && requestsForMe.length > 0 && (
                <div className="rounded-3xl border-2 border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <div>
                                <h3 className="text-base font-black text-amber-950">
                                    Đơn xin đổi ca chờ bạn xác nhận ({requestsForMe.length})
                                </h3>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    Đồng nghiệp đã thỏa thuận ngoài thực tế và gửi yêu cầu đổi ca đến bạn. Vui lòng bấm xác nhận để chuyển đơn lên Admin phê duyệt.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requestsForMe.map((req) => {
                            const senderName = req.taiKhoan?.bacSi?.HoTen 
                                || req.taiKhoan?.name 
                                || req.taiKhoan?.TenDangNhap 
                                || `TK #${req.MaTaiKhoan}`;
                            const isProcessing = processingRequestId === req.MaDonTu;

                            return (
                                <div key={req.MaDonTu} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                                                {senderName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">{senderName}</div>
                                                <div className="text-[11px] text-slate-500">
                                                    {req.taiKhoan?.bacSi?.chuyenKhoa?.TenChuyenKhoa || 'Đồng nghiệp cùng phân hệ'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                            Đổi ca trực
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1 text-slate-700">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>Ngày ca trực đổi: <strong className="text-slate-900">{req.NgayApDung}</strong></span>
                                        </div>
                                        <div className="text-[11px] text-slate-600">
                                            <span className="font-semibold">Lý do:</span> {req.LyDo}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handlePeerConfirm(req.MaDonTu, 'reject')}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Đang gửi...' : 'Từ chối'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handlePeerConfirm(req.MaDonTu, 'accept')}
                                            className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            Xác nhận đồng ý đổi
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* THANH ĐIỀU KHIỂN & CHỌN CHẾ ĐỘ THỜI KHÓA BIỂU */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                                {roleDisplayName}
                            </span>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Thời khóa biểu ca làm việc</h2>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                            Xem lịch trực theo tuần hoặc ngày, chủ động gửi yêu cầu đổi ca trực hoặc xin phép khi có việc đột xuất.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Switch Tuần / Ngày */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'week'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Chế độ Tuần
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('day')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'day'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Chế độ Ngày
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setModalLoaiDon('DOI_CA');
                                setModalDate(todayStr);
                                setModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Xin đổi ca trực
                        </button>
                    </div>
                </div>

                {/* Điều hướng thời gian */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleShiftWeek('prev')}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Tuần trước"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleShiftWeek('today')}
                            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                        >
                            Hôm nay
                        </button>

                        <button
                            type="button"
                            onClick={() => handleShiftWeek('next')}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Tuần sau"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <span className="text-xs font-bold text-slate-700 ml-2">
                            {weekDays[0].dayNumber} - {weekDays[6].dayNumber} ({weekDays[0].dateStr.slice(0, 4)})
                        </span>
                    </div>

                    {viewMode === 'day' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Chọn ngày:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* CHẾ ĐỘ 1: THỜI KHÓA BIỂU MA TRẬN 7 NGÀY (WEEKLY GRID) */}
            {viewMode === 'week' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="w-36 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500 border-r border-slate-200">
                                        Ca trực
                                    </th>
                                    {weekDays.map((d) => (
                                        <th
                                            key={d.dateStr}
                                            className={`px-3 py-3 text-center border-r border-slate-200 last:border-r-0 ${
                                                d.isToday ? 'bg-indigo-50/70' : ''
                                            }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[11px] font-bold ${d.isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                    {d.dayName}
                                                </span>
                                                <span className={`text-sm font-black mt-0.5 ${d.isToday ? 'text-indigo-700 font-extrabold' : 'text-slate-900'}`}>
                                                    {d.dayNumber}
                                                </span>
                                                {d.isToday && (
                                                    <span className="mt-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                                                        Hôm nay
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shiftDefinitions.map((shiftDef) => (
                                    <tr key={shiftDef.key} className="border-b border-slate-100 last:border-b-0 align-top">
                                        {/* Cột tên ca trực */}
                                        <td className="px-4 py-3 bg-slate-50/60 border-r border-slate-200">
                                            <div className="font-bold text-xs text-slate-900">{shiftDef.label}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{shiftDef.time}</div>
                                        </td>

                                        {/* 7 cột ngày */}
                                        {weekDays.map((d) => {
                                            const myShiftsInSlot = schedules.filter((s) => {
                                                const matchDate = s.NgayLamViec === d.dateStr;
                                                const matchShift = (s.LoaiCa || 'custom').toLowerCase() === shiftDef.key;
                                                return matchDate && matchShift;
                                            });

                                            return (
                                                <td
                                                    key={d.dateStr}
                                                    className={`px-2 py-2 border-r border-slate-100 last:border-r-0 min-h-[90px] ${
                                                        d.isToday ? 'bg-indigo-50/30' : ''
                                                    }`}
                                                >
                                                    {myShiftsInSlot.length > 0 ? (
                                                        myShiftsInSlot.map((sch) => (
                                                            <div
                                                                key={sch.MaLichLamViec}
                                                                className={`rounded-2xl border p-2.5 shadow-xs space-y-1.5 ${shiftDef.tone}`}
                                                            >
                                                                <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}
                                                                    </span>
                                                                    <span className="text-[9px] opacity-70">#{sch.MaLichLamViec}</span>
                                                                </div>

                                                                {(sch.caKhams || []).length > 0 && (
                                                                    <div className="text-[10px] font-medium text-emerald-800">
                                                                        {sch.caKhams!.length} ca khám chỉ định
                                                                    </div>
                                                                )}

                                                                {sch.assigned_count !== undefined && (
                                                                    <div className="text-[10px] text-sky-800">
                                                                        {sch.assigned_count} chỉ định CLS
                                                                    </div>
                                                                )}

                                                                {/* Nút tác vụ đổi ca trực tiếp */}
                                                                <div className="pt-1.5 border-t border-black/10 flex items-center justify-between gap-1 text-[10px]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openSwapForSchedule(sch)}
                                                                        className="font-bold underline hover:opacity-80 flex items-center gap-0.5"
                                                                    >
                                                                        <ArrowRightLeft className="w-2.5 h-2.5" /> Đổi ca
                                                                    </button>

                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openLeaveForSchedule(sch, 'DI_MUON')}
                                                                            className="opacity-70 hover:opacity-100"
                                                                            title="Xin đi muộn"
                                                                        >
                                                                            Muộn
                                                                        </button>
                                                                        <span>•</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openLeaveForSchedule(sch, 'VE_SOM')}
                                                                            className="opacity-70 hover:opacity-100"
                                                                            title="Xin về sớm"
                                                                        >
                                                                            Sớm
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-full min-h-[60px] flex items-center justify-center text-[10px] text-slate-300">
                                                            --
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CHẾ ĐỘ 2: CHI TIẾT THEO NGÀY (DAILY VIEW) */}
            {viewMode === 'day' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-indigo-600" />
                            Chi tiết ca làm việc ngày: <span className="font-mono text-indigo-600">{selectedDate}</span>
                        </h3>
                        <span className="text-xs px-3 py-1 bg-slate-100 font-bold text-slate-700 rounded-full">
                            {daySchedules.length} ca trực
                        </span>
                    </div>

                    {daySchedules.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {daySchedules.map((sch) => (
                                <div key={sch.MaLichLamViec} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white">
                                            {sch.LoaiCa ? `Ca ${sch.LoaiCa}` : 'Ca chuẩn'}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">Mã ca: #{sch.MaLichLamViec}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-700 text-sm font-semibold font-mono">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        <span>{sch.GioBatDau?.slice(0, 5)} - {sch.GioKetThuc?.slice(0, 5)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-indigo-100">
                                        <button
                                            type="button"
                                            onClick={() => openSwapForSchedule(sch)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                            Xin đổi ca này
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openLeaveForSchedule(sch, 'VE_SOM')}
                                            className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                                        >
                                            Xin về sớm
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            <CalendarClock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            Bạn không có ca trực nào được phân công trong ngày {selectedDate}.
                        </div>
                    )}
                </div>
            )}

            {/* DANH SÁCH ĐƠN ĐỔI CA CỦA TÔI & TIẾN TRÌNH 2 BƯỚC */}
            {myRequests && myRequests.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-900 text-base">Đơn xin phép & Đổi ca đã gửi của bạn</h3>
                        </div>
                        <span className="text-xs text-slate-500">{myRequests.length} đơn</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead>
                                <tr className="text-left font-bold uppercase text-slate-400">
                                    <th className="py-2.5 px-3">Loại đơn</th>
                                    <th className="py-2.5 px-3">Ngày ca trực</th>
                                    <th className="py-2.5 px-3">Chi tiết / Đồng nghiệp đổi</th>
                                    <th className="py-2.5 px-3">Lý do</th>
                                    <th className="py-2.5 px-3">Trạng thái tiến trình</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {myRequests.map((r) => {
                                    return (
                                        <tr key={r.MaDonTu} className="hover:bg-slate-50">
                                            <td className="py-3 px-3 font-bold text-slate-900">
                                                {r.LoaiDon === 'DOI_CA' ? 'Xin đổi ca' : r.LoaiDon === 'VE_SOM' ? 'Xin về sớm' : r.LoaiDon === 'DI_MUON' ? 'Xin đến muộn' : 'Xin nghỉ phép'}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-slate-600">{r.NgayApDung}</td>
                                            <td className="py-3 px-3">
                                                {r.LoaiDon === 'DOI_CA' ? (
                                                    <span className="font-semibold text-indigo-700">
                                                        Đổi cùng: {r.taiKhoanDoiCung?.name || r.taiKhoanDoiCung?.TenDangNhap || `TK #${r.TaiKhoanDoiCung}`}
                                                    </span>
                                                ) : (
                                                    <span>{r.SoPhutXinPhep > 0 ? `${r.SoPhutXinPhep} phút` : '--'}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{r.LyDo}</td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                                    r.TrangThai === 'DA_DUYET'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : r.TrangThai === 'CHO_ADMIN_DUYET'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : r.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : r.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                        ? 'bg-slate-200 text-slate-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {r.TrangThai === 'DA_DUYET'
                                                        ? 'Đã duyệt hoàn tất'
                                                        : r.TrangThai === 'CHO_ADMIN_DUYET'
                                                        ? 'Đồng nghiệp đã OK • Chờ Admin duyệt'
                                                        : r.TrangThai === 'CHO_DONG_NGHIEP_XAC_NHAN'
                                                        ? 'Chờ đồng nghiệp bấm Đồng ý'
                                                        : r.TrangThai === 'DONG_NGHIEP_TU_CHOI'
                                                        ? 'Đồng nghiệp từ chối'
                                                        : 'Bị từ chối'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL GỬI ĐƠN TỪ / ĐỔI CA */}
            <RequestModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                rolePrefix={rolePrefix}
                colleagues={colleagues}
                initialLoaiDon={modalLoaiDon}
                initialDate={modalDate}
                initialScheduleId={modalScheduleId}
            />
        </div>
    );
}
