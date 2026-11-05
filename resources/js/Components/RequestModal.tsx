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
    colleagues?: ColleagueOption[];
    initialLoaiDon?: 'DI_MUON' | 'VE_SOM' | 'DOI_CA' | 'NGHI_PHEP';
    initialDate?: string;
    initialScheduleId?: number;
}

export default function RequestModal({ 
    isOpen, 
    onClose, 
    rolePrefix, 
    todaySchedule,
    colleagues = [],
    initialLoaiDon = 'VE_SOM',
    initialDate,
    initialScheduleId,
}: Props) {
    const [loaiDon, setLoaiDon] = useState<'DI_MUON' | 'VE_SOM' | 'DOI_CA' | 'NGHI_PHEP'>(initialLoaiDon);
    const [ngayApDung, setNgayApDung] = useState(initialDate || new Date().toISOString().slice(0, 10));
    const [soPhut, setSoPhut] = useState<number>(30);
    const [taiKhoanDoiCung, setTaiKhoanDoiCung] = useState<string | number>('');
    const [lyDo, setLyDo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (initialLoaiDon) setLoaiDon(initialLoaiDon);
        if (initialDate) setNgayApDung(initialDate);
    }, [initialLoaiDon, initialDate, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (loaiDon === 'DOI_CA' && !taiKhoanDoiCung) {
            setErrorMsg('Vui lòng chọn đồng nghiệp bạn đã thỏa thuận đổi ca ngoài thực tế.');
            return;
        }

        if (!lyDo.trim()) {
            setErrorMsg('Vui lòng nhập lý do cụ thể.');
            return;
        }

        setSubmitting(true);

        const scheduleId = initialScheduleId || todaySchedule?.MaLichLamViec || null;

        const payload: any = {
            LoaiDon: loaiDon,
            NgayApDung: ngayApDung,
            MaLichLamViec: scheduleId,
            SoPhutXinPhep: (loaiDon === 'DI_MUON' || loaiDon === 'VE_SOM') ? soPhut : 0,
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
                                {loaiDon === 'VE_SOM' ? 'Số phút xin về sớm tối đa' : 'Số phút xin đến muộn tối đa'}
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
                                    max={240}
                                    value={soPhut}
                                    onChange={(e) => setSoPhut(Number(e.target.value))}
                                    placeholder="Nhập số phút cụ thể"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                * Quẹt thẻ trong giới hạn {soPhut} phút sẽ được miễn phạt khi Admin duyệt. Phần vượt quá sẽ áp dụng chế tài tự động.
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
                            disabled={submitting}
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
