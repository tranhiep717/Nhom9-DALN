import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { FileText, Clock, Calendar, AlertCircle, X, Send, Users, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export interface ColleagueOption {
    MaTaiKhoan: number;
    HoTen: string;
    TenDangNhap?: string;
    TenChuyenKhoa?: string;
    isSameSpecialty?: boolean;
    role?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    rolePrefix: 'doctor' | 'receptionist' | 'cls';
    todaySchedule?: any;
    selectedSchedule?: any;
    colleagues?: ColleagueOption[];
    initialLoaiDon?: 'DI_MUON' | 'VE_SOM' | 'DOI_CA' | 'NGHI_PHEP';
    initialDate?: string;
    initialScheduleId?: number;
}

function calculateExpectedTime(baseTimeStr?: string, minutes: number = 0, direction: 'add' | 'subtract' = 'add'): string {
    if (!baseTimeStr) return '';
    const parts = baseTimeStr.slice(0, 5).split(':').map(Number);
    if (isNaN(parts[0]) || isNaN(parts[1])) return '';
    let totalMins = parts[0] * 60 + parts[1];
    if (direction === 'add') {
        totalMins += minutes;
    } else {
        totalMins -= minutes;
    }
    if (totalMins < 0) totalMins = 0;
    if (totalMins >= 24 * 60) totalMins = 24 * 60 - 1;
    const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const m = (totalMins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

export default function RequestModal({ 
    isOpen, 
    onClose, 
    rolePrefix, 
    todaySchedule,
    selectedSchedule,
    colleagues = [],
    initialLoaiDon = 'VE_SOM',
    initialDate,
    initialScheduleId,
}: Props) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [loaiDon, setLoaiDon] = useState<'DI_MUON' | 'VE_SOM' | 'DOI_CA' | 'NGHI_PHEP'>(initialLoaiDon);
    const [ngayApDung, setNgayApDung] = useState(initialDate || todayStr);
    const [soPhut, setSoPhut] = useState<number>(30);
    const [taiKhoanDoiCung, setTaiKhoanDoiCung] = useState<string | number>('');
    const [lyDo, setLyDo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const targetShift = selectedSchedule || todaySchedule;

    useEffect(() => {
        if (initialLoaiDon) setLoaiDon(initialLoaiDon);
        if (initialDate) setNgayApDung(initialDate);
    }, [initialLoaiDon, initialDate, isOpen]);

    if (!isOpen) return null;

    const isShiftPastOrOngoing = () => {
        if (!targetShift) {
            return ngayApDung < todayStr;
        }
        const shiftDate = targetShift.NgayLamViec || ngayApDung;
        if (shiftDate < todayStr) return true;
        if (shiftDate === todayStr && targetShift.GioBatDau) {
            const now = new Date();
            const [h, m] = targetShift.GioBatDau.slice(0, 5).split(':').map(Number);
            const startTime = new Date();
            startTime.setHours(h, m, 0, 0);
            const cutoff = new Date(startTime.getTime() - 15 * 60 * 1000);
            return now >= cutoff;
        }
        return false;
    };

    const isBlocked = (loaiDon === 'DOI_CA' || loaiDon === 'DI_MUON') && isShiftPastOrOngoing();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (isBlocked) {
            setErrorMsg('Ca trực này đã bắt đầu hoặc đã qua. Không thể gửi yêu cầu đổi ca hoặc xin đi muộn.');
            return;
        }

        if (loaiDon === 'DOI_CA' && !taiKhoanDoiCung) {
            setErrorMsg('Vui lòng chọn đồng nghiệp bạn đã thỏa thuận đổi ca ngoài thực tế.');
            return;
        }

        if (!lyDo.trim()) {
            setErrorMsg('Vui lòng nhập lý do cụ thể.');
            return;
        }

        setSubmitting(true);

        const scheduleId = initialScheduleId || targetShift?.MaLichLamViec || null;

        const payload: any = {
            LoaiDon: loaiDon,
            NgayApDung: ngayApDung,
            MaLichLamViec: scheduleId,
            SoPhutXinPhep: (loaiDon === 'DI_MUON' || loaiDon === 'VE_SOM') ? Math.min(soPhut, 90) : 0,
            LyDo: lyDo.trim(),
        };

        if (loaiDon === 'DOI_CA') {
            payload.TaiKhoanDoiCung = Number(taiKhoanDoiCung);
        }

        try {
            const res = await axios.post(`/${rolePrefix}/requests`, payload);
            if (res.data?.success) {
                onClose();
                router.reload();
            } else {
                setErrorMsg(res.data?.message || 'Có lỗi xảy ra.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors)[0] : 'Không thể gửi đơn. Vui lòng thử lại.');
            setErrorMsg(String(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-lg">Tạo đơn nhân sự & Đổi ca</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Hộp thông tin ca trực đang thao tác */}
                    {targetShift && (
                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    Thông tin ca trực được chọn:
                                </span>
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    Mã ca #{targetShift.MaLichLamViec}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                                <div>
                                    <span className="text-slate-500">Ngày làm việc: </span>
                                    <strong className="text-slate-900">{targetShift.NgayLamViec}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500">Khung giờ: </span>
                                    <strong className="text-slate-900">
                                        {targetShift.GioBatDau?.slice(0, 5)} - {targetShift.GioKetThuc?.slice(0, 5)}
                                    </strong>
                                    {targetShift.LoaiCa && <span className="ml-1 text-slate-500">({targetShift.LoaiCa})</span>}
                                </div>
                            </div>

                            {/* Dự tính giờ vào ca đối với đi muộn */}
                            {loaiDon === 'DI_MUON' && targetShift.GioBatDau && (
                                <div className="pt-2 border-t border-indigo-100/80 text-emerald-800 text-[11px] flex items-center justify-between">
                                    <span>Giờ bắt đầu: <strong>{targetShift.GioBatDau.slice(0, 5)}</strong> (+{soPhut}p)</span>
                                    <span className="font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                        Check-in dự kiến: {calculateExpectedTime(targetShift.GioBatDau, soPhut, 'add')}
                                    </span>
                                </div>
                            )}

                            {/* Dự tính giờ về đối với về sớm */}
                            {loaiDon === 'VE_SOM' && targetShift.GioKetThuc && (
                                <div className="pt-2 border-t border-indigo-100/80 text-amber-800 text-[11px] flex items-center justify-between">
                                    <span>Giờ kết thúc: <strong>{targetShift.GioKetThuc.slice(0, 5)}</strong> (-{soPhut}p)</span>
                                    <span className="font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                                        Check-out dự kiến: {calculateExpectedTime(targetShift.GioKetThuc, soPhut, 'subtract')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cảnh báo ca đã qua / đang diễn ra */}
                    {isBlocked && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-bold block">Không thể gửi đơn cho ca trực này:</strong>
                                <span>Quy chế bệnh viện quy định không đổi ca hoặc xin đi muộn cho ca trực trong quá khứ hoặc ca đã/sắp bắt đầu (trước 15 phút). Vui lòng chọn ca trực tương lai.</span>
                            </div>
                        </div>
                    )}

                    {/* Loại đơn */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Loại đơn cần gửi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'DOI_CA', label: 'Xin đổi ca', desc: 'Đã thỏa thuận với đồng nghiệp' },
                                { key: 'VE_SOM', label: 'Xin về sớm', desc: 'Có việc đột xuất cuối ca' },
                                { key: 'DI_MUON', label: 'Xin đến muộn', desc: 'Có việc đột xuất đầu ca' },
                                { key: 'NGHI_PHEP', label: 'Xin nghỉ phép', desc: 'Nghỉ ca có lý do chính đáng' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setLoaiDon(item.key as any)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        loaiDon === item.key
                                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                    }`}
                                >
                                    <div className="font-bold text-sm">{item.label}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hộp cảnh báo quy trình đổi ca 2 bước */}
                    {loaiDon === 'DOI_CA' && (
                        <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                                Quy trình đổi ca 2 bước bảo đảm an toàn:
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                                <li>Bạn gửi đơn chọn đồng nghiệp đã thỏa thuận ngoài thực tế.</li>
                                <li>Đồng nghiệp đăng nhập SmartCare và bấm <strong className="text-slate-800">"Xác nhận đồng ý"</strong>.</li>
                                <li>Quản trị viên (Admin) thấy xác nhận của cả 2 bên và phê duyệt để hệ thống tự động hoán đổi lịch trực.</li>
                            </ol>
                        </div>
                    )}

                    {/* Đồng nghiệp đổi ca (Bắt buộc khi đổi ca) */}
                    {loaiDon === 'DOI_CA' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Đồng nghiệp thỏa thuận đổi ca <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <select
                                    value={taiKhoanDoiCung}
                                    onChange={(e) => setTaiKhoanDoiCung(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-white font-medium"
                                    required
                                >
                                    <option value="">-- Chọn đồng nghiệp đổi cùng --</option>
                                    {colleagues.map((col) => (
                                        <option key={col.MaTaiKhoan} value={col.MaTaiKhoan}>
                                            {col.HoTen} {col.TenChuyenKhoa ? `(${col.TenChuyenKhoa})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {colleagues.length === 0 && (
                                <p className="text-[11px] text-amber-600 mt-1">
                                    Không tìm thấy tài khoản đồng nghiệp cùng vai trò trong hệ thống.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Ngày áp dụng */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            {loaiDon === 'DOI_CA' ? 'Ngày ca trực của bạn muốn đổi' : 'Ngày áp dụng ca trực'}
                        </label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="date"
                                min={todayStr}
                                value={ngayApDung}
                                onChange={(e) => setNgayApDung(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Số phút xin phép (áp dụng cho Đi muộn & Về sớm) */}
                    {(loaiDon === 'DI_MUON' || loaiDon === 'VE_SOM') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                {loaiDon === 'VE_SOM' ? 'Số phút xin về sớm (tối đa 90p)' : 'Số phút xin đến muộn (tối đa 90p)'}
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                                {[15, 30, 45, 60, 90].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setSoPhut(mins)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            soPhut === mins
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {mins}p
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="number"
                                    min={5}
                                    max={90}
                                    value={soPhut}
                                    onChange={(e) => setSoPhut(Math.min(90, Math.max(5, Number(e.target.value))))}
                                    placeholder="Nhập số phút cụ thể (tối đa 90)"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none font-medium"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                * Giới hạn tối đa 90 phút. Quẹt thẻ trong giới hạn {soPhut} phút sẽ được miễn phạt khi Admin duyệt. Nếu vắng mặt trên 90 phút, vui lòng làm đơn Đổi ca hoặc Nghỉ phép.
                            </p>
                        </div>
                    )}

                    {/* Lý do */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Lý do xin phép <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={lyDo}
                            onChange={(e) => setLyDo(e.target.value)}
                            placeholder="Mô tả cụ thể lý do (thỏa thuận đổi ca, việc gia đình đột xuất...)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || isBlocked}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Đang gửi...' : loaiDon === 'DOI_CA' ? 'Gửi yêu cầu đổi ca' : 'Gửi đơn tới Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
