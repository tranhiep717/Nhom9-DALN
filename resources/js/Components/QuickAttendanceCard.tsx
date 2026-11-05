import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Clock3, LogIn, LogOut, AlertCircle, CheckCircle2, CalendarX2, FilePlus2 } from 'lucide-react';
import RequestModal from '@/Components/RequestModal';

interface Props {
    rolePrefix: 'doctor' | 'receptionist' | 'cls';
    todaySchedule?: {
        MaLichLamViec?: number;
        LoaiCa?: string;
        CaLamViec?: string;
        GioBatDau?: string;
        GioKetThuc?: string;
        PhongLamViec?: string;
    } | null;
    todayAttendance?: {
        MaChamCong?: number;
        GioCheckIn?: string;
        GioCheckOut?: string;
        TrangThai?: string;
        SoPhutTre?: number;
        SoPhutVeSom?: number;
        TongTien?: number;
        donTu?: {
            LoaiDon?: string;
            SoPhutDuocDuyet?: number;
            TrangThai?: string;
        };
    } | null;
}

export default function QuickAttendanceCard({ rolePrefix, todaySchedule, todayAttendance }: Props) {
    const [loadingAction, setLoadingAction] = useState<'check-in' | 'check-out' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const hasSchedule = !!todaySchedule;
    const hasCheckedIn = !!todayAttendance?.GioCheckIn;
    const hasCheckedOut = !!todayAttendance?.GioCheckOut;

    const handleAction = async (action: 'check-in' | 'check-out') => {
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
            const msg = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : 'Không thể thực hiện. Vui lòng thử lại.');
            setFeedback({ type: 'error', message: String(msg) });
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Thông tin ca trực hôm nay */}
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Điểm danh ca trực hôm nay
                        </span>
                        {hasSchedule ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Có lịch phân ca
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                Không có ca (Nghỉ)
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-3">
                        {hasSchedule ? (
                            <h3 className="text-lg font-black text-slate-900">
                                {todaySchedule.CaLamViec || 'Ca ngày tiêu chuẩn'} ({todaySchedule.GioBatDau?.slice(0, 5) || '08:00'} - {todaySchedule.GioKetThuc?.slice(0, 5) || '17:00'})
                            </h3>
                        ) : (
                            <h3 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                                <CalendarX2 className="w-5 h-5 text-slate-400" />
                                Hôm nay bạn không có ca làm việc nào được phân công.
                            </h3>
                        )}
                    </div>

                    {/* Huy hiệu giờ vào / giờ ra */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-medium">
                            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Vào ca:</span>
                            <strong className="font-mono text-slate-900">
                                {todayAttendance?.GioCheckIn || '--:--:--'}
                            </strong>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-medium">
                            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ra ca:</span>
                            <strong className="font-mono text-slate-900">
                                {todayAttendance?.GioCheckOut || '--:--:--'}
                            </strong>
                        </div>

                        {todayAttendance && (
                            <div className="flex items-center gap-1.5 text-xs">
                                {todayAttendance.TrangThai === 'DI_MUON_CO_PHEP' && (
                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                        Đi muộn có phép (Miễn phạt)
                                    </span>
                                )}
                                {todayAttendance.TrangThai === 'VE_SOM_CO_PHEP' && (
                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                        Về sớm có phép (Miễn phạt)
                                    </span>
                                )}
                                {todayAttendance.TrangThai === 'MUON' && (
                                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                        Đi muộn ({todayAttendance.SoPhutTre || 0} phút)
                                    </span>
                                )}
                                {todayAttendance.TrangThai === 'VE_SOM' && (
                                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                        Về sớm ({todayAttendance.SoPhutVeSom || 0} phút)
                                    </span>
                                )}
                                {todayAttendance.TrangThai === 'CO_MAT' && (
                                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Đúng giờ
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Các nút bấm hành động */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <FilePlus2 className="w-4 h-4 text-indigo-600" />
                        Làm đơn xin phép / Đổi ca
                    </button>

                    <button
                        type="button"
                        disabled={!hasSchedule || hasCheckedIn || loadingAction === 'check-in'}
                        onClick={() => handleAction('check-in')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            !hasSchedule
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : hasCheckedIn
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        }`}
                    >
                        <LogIn className="w-4 h-4" />
                        {loadingAction === 'check-in'
                            ? 'Đang xử lý...'
                            : hasCheckedIn
                            ? 'Đã Check-in'
                            : 'Check-in vào ca'}
                    </button>

                    <button
                        type="button"
                        disabled={!hasSchedule || !hasCheckedIn || hasCheckedOut || loadingAction === 'check-out'}
                        onClick={() => handleAction('check-out')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            !hasSchedule || !hasCheckedIn || hasCheckedOut
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                        }`}
                    >
                        <LogOut className="w-4 h-4" />
                        {loadingAction === 'check-out'
                            ? 'Đang xử lý...'
                            : hasCheckedOut
                            ? 'Đã Check-out'
                            : 'Check-out kết thúc ca'}
                    </button>
                </div>
            </div>

            {/* Thông báo phản hồi */}
            {feedback && (
                <div
                    className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                >
                    <span>{feedback.message}</span>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="font-bold text-slate-400 hover:text-slate-600 ml-3"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Modal Làm đơn */}
            <RequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                rolePrefix={rolePrefix}
                todaySchedule={todaySchedule}
            />
        </div>
    );
}
