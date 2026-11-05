import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    CreditCard, 
    Receipt, 
    Calendar, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ArrowUpRight, 
    ShieldCheck, 
    FileText,
    ChevronDown,
    ChevronUp,
    Download
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { patientNavItems } from './Dashboard';

interface ChiTietHoaDonItem {
    MaChiTiet: number;
    MaHoaDon: number;
    LoaiDichVu: string; // 'KHAM_BENH', 'THUOC', 'CAN_LAM_SANG'
    TenMuc: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
}

interface ThanhToanItem {
    MaThanhToan: number;
    MaHoaDon: number;
    SoTien: number;
    PhuongThuc: string; // 'TIEN_MAT', 'CHUYEN_KHOAN', 'THE'
    MaGiaoDich?: string;
    NgayThanhToan: string;
    GhiChu?: string;
}

interface InvoiceRecord {
    MaHoaDon: number;
    MaLuotKham: number;
    NgayTao: string;
    TongTien: number;
    BHYTChiTra: number;
    MienGiam: number;
    BenhNhanChiTra: number;
    DaThanhToan: number;
    ConLai: number;
    TrangThai: string; // 'CHUA_THANH_TOAN', 'THANH_TOAN_MOT_PHAN', 'DA_THANH_TOAN', 'DA_HUY'
    luotKham?: {
        MaLuotKham: number;
        ThoiGianTiepNhan: string;
        bacSi?: {
            MaBacSi: number;
            HoTen: string;
        };
    };
    chiTietHoaDons?: ChiTietHoaDonItem[];
    thanhToans?: ThanhToanItem[];
}

interface PatientBillingProps {
    auth: any;
    invoices: InvoiceRecord[];
}

export default function Billing({ auth, invoices = [] }: PatientBillingProps) {
    const asArray = <T,>(value: T | T[] | null | undefined): T[] => {
        if (Array.isArray(value)) return value;
        return value ? [value] : [];
    };

    const normalizeInvoiceItems = (items: any[] = []) => {
        return items.map((item: any) => {
            const name = item?.TenMuc ?? item?.NoiDung ?? item?.noi_dung ?? item?.chiDinhDichVu?.dichVu?.TenDichVu ?? item?.chiTietDonThuoc?.thuoc?.TenThuoc ?? 'Chi phí';
            const category = item?.LoaiDichVu ?? item?.LoaiChiPhi ?? item?.loai_chi_phi ?? item?.chiDinhDichVu?.dichVu?.LoaiDichVu ?? 'KHAC';
            const qty = Number(item?.SoLuong ?? item?.so_luong ?? 0);
            const unitPrice = Number(item?.DonGia ?? item?.don_gia ?? 0);
            const total = Number(item?.ThanhTien ?? item?.thanh_tien ?? (qty * unitPrice));

            return {
                ...item,
                MaChiTiet: item?.MaChiTiet ?? item?.MaChiTietHoaDon ?? item?.ma_chi_tiet_hoa_don ?? 0,
                TenMuc: name,
                LoaiDichVu: category,
                SoLuong: qty,
                DonGia: unitPrice,
                ThanhTien: total,
            };
        });
    };

    const normalizePayments = (items: any[] = []) => {
        return items.map((pt: any) => ({
            ...pt,
            MaThanhToan: pt?.MaThanhToan ?? pt?.ma_thanh_toan ?? 0,
            PhuongThuc: pt?.PhuongThuc ?? pt?.PhuongThucThanhToan ?? pt?.phuong_thuc_thanh_toan ?? 'KHAC',
            NgayThanhToan: pt?.NgayThanhToan ?? pt?.ThoiGianThanhToan ?? pt?.thoi_gian_thanh_toan ?? pt?.NgayTao ?? null,
        }));
    };

    const normalizedInvoices = useMemo(() => {
        return (invoices || []).map((inv: any) => ({
            ...inv,
            luotKham: inv?.luotKham ?? inv?.luot_kham,
            chiTietHoaDons: normalizeInvoiceItems(asArray(inv?.chiTietHoaDons ?? inv?.chi_tiet_hoa_dons)),
            thanhToans: normalizePayments(asArray(inv?.thanhToans ?? inv?.thanh_toans)),
            TongTien: Number(inv?.TongTien ?? inv?.tong_tien ?? 0),
            BHYTChiTra: Number(inv?.BHYTChiTra ?? inv?.BaoHiemChiTra ?? inv?.bao_hiem_chi_tra ?? 0),
            MienGiam: Number(inv?.MienGiam ?? inv?.GiamGia ?? inv?.giam_gia ?? 0),
            BenhNhanChiTra: Number(inv?.BenhNhanChiTra ?? inv?.benh_nhan_chi_tra ?? 0),
            DaThanhToan: Number(inv?.DaThanhToan ?? inv?.da_thanh_toan ?? 0),
            ConLai: Number(inv?.ConLai ?? inv?.con_lai ?? 0),
        }));
    }, [invoices]);

    const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(normalizedInvoices[0]?.MaHoaDon || null);

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DA_THANH_TOAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
            case 'THANH_TOAN_MOT_PHAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Đã trả 1 phần</span>;
            case 'CHUA_THANH_TOAN':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Chưa thanh toán</span>;
            case 'DA_HUY':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Đã hủy</span>;
            default:
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const getMethodName = (m?: string) => {
        switch (m) {
            case 'TIEN_MAT': return 'Tiền mặt';
            case 'CHUYEN_KHOAN': return 'Chuyển khoản ngân hàng';
            case 'THE': return 'Thẻ POS / Tín dụng';
            default: return m || 'Khác';
        }
    };

    // Tổng hợp số liệu công nợ toàn bộ
    const totalBilled = normalizedInvoices.reduce((acc, curr) => acc + Number(curr.BenhNhanChiTra || 0), 0);
    const totalPaid = normalizedInvoices.reduce((acc, curr) => acc + Number(curr.DaThanhToan || 0), 0);
    const totalDebt = normalizedInvoices.reduce((acc, curr) => {
        if (curr.TrangThai === 'DA_HUY') return acc;
        return acc + Math.max(0, Number(curr.BenhNhanChiTra || 0) - Number(curr.DaThanhToan || 0));
    }, 0);

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Viện phí & Hóa đơn"
        >
            <Head title="Viện phí & Hóa đơn - SmartCare" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý viện phí và hóa đơn thanh toán</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Tra cứu minh bạch toàn bộ chi phí khám bệnh, tiền thuốc, dịch vụ xét nghiệm và lịch sử nộp tiền.
                    </p>
                </div>

                {/* 3 Thẻ tóm tắt tài chính */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng viện phí phát sinh</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalBilled)}</p>
                        <p className="text-xs text-slate-400 mt-2">Tính trên {normalizedInvoices.length} hóa đơn</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đã thanh toán thành công</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
                        <p className="text-xs text-emerald-600/80 mt-2 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Có biên lai xác nhận
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className={`text-xs font-bold uppercase tracking-wider ${totalDebt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            Số tiền còn phải nộp
                        </p>
                        <p className={`text-2xl font-black mt-1 ${totalDebt > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatCurrency(totalDebt)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            {totalDebt > 0 ? 'Vui lòng thanh toán tại quầy thu ngân' : 'Bạn không còn dư nợ viện phí'}
                        </p>
                    </div>
                </div>

                {/* Danh sách các hóa đơn */}
                {normalizedInvoices.length > 0 ? (
                    <div className="space-y-4">
                        {normalizedInvoices.map((inv) => {
                            const isExpanded = expandedInvoiceId === inv.MaHoaDon;
                            const items = inv.chiTietHoaDons || [];
                            const payments = inv.thanhToans || [];
                            const debt = Math.max(0, Number(inv.BenhNhanChiTra) - Number(inv.DaThanhToan));

                            return (
                                <div
                                    key={inv.MaHoaDon}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                                >
                                    {/* Header hóa đơn */}
                                    <div
                                        onClick={() => toggleExpand(inv.MaHoaDon)}
                                        className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(inv.TrangThai)}
                                                <span className="font-bold font-mono text-teal-800 text-sm">
                                                    HÓA ĐƠN #{inv.MaHoaDon}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    • Ngày tạo: {formatDate(inv.NgayTao)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                Lượt khám: <span className="font-bold text-slate-800">#{inv.MaLuotKham}</span>
                                                {inv.luotKham?.bacSi?.HoTen && (
                                                    <span> • Bác sĩ: <span className="font-semibold text-slate-700">{inv.luotKham.bacSi.HoTen}</span></span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 block">Số tiền cần trả</span>
                                                <span className="text-lg font-black text-slate-900">{formatCurrency(inv.BenhNhanChiTra)}</span>
                                                {debt > 0 ? (
                                                    <span className="text-xs font-bold text-rose-600 block mt-0.5">
                                                        Còn nợ: {formatCurrency(debt)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                                                        Đã thanh toán đủ
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chi tiết hóa đơn khi mở rộng */}
                                    {isExpanded && (
                                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
                                            {/* Tổng quan bảng giá & giảm trừ */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-center text-xs">
                                                <div>
                                                    <span className="text-slate-400 block">Tổng chi phí</span>
                                                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{formatCurrency(inv.TongTien)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">BHYT chi trả</span>
                                                    <span className="font-bold text-blue-700 text-sm mt-0.5 block">{formatCurrency(inv.BHYTChiTra)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Miễn giảm</span>
                                                    <span className="font-bold text-amber-700 text-sm mt-0.5 block">{formatCurrency(inv.MienGiam)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Bệnh nhân phải trả</span>
                                                    <span className="font-black text-teal-800 text-sm mt-0.5 block">{formatCurrency(inv.BenhNhanChiTra)}</span>
                                                </div>
                                            </div>

                                            {/* Bảng chi tiết từng hạng mục */}
                                            {items.length > 0 && (
                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-700">
                                                        Bảng kê chi tiết chi phí ({items.length} mục)
                                                    </div>
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="border-b border-slate-100 text-slate-400">
                                                            <tr>
                                                                <th className="px-4 py-2.5 font-semibold">Hạng mục</th>
                                                                <th className="px-4 py-2.5 font-semibold">Phân loại</th>
                                                                <th className="px-4 py-2.5 font-semibold text-center">Số lượng</th>
                                                                <th className="px-4 py-2.5 font-semibold text-right">Đơn giá</th>
                                                                <th className="px-4 py-2.5 font-semibold text-right">Thành tiền</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {items.map((it: any) => (
                                                                <tr key={it.MaChiTiet} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-2.5 font-bold text-slate-800">{it.TenMuc}</td>
                                                                    <td className="px-4 py-2.5 text-slate-500">
                                                                        {it.LoaiDichVu === 'KHAM_BENH' ? 'Khám bệnh' :
                                                                         it.LoaiDichVu === 'THUOC' ? 'Thuốc điều trị' :
                                                                         it.LoaiDichVu === 'CAN_LAM_SANG' ? 'Xét nghiệm / CLS' : it.LoaiDichVu}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-center font-medium text-slate-700">{it.SoLuong}</td>
                                                                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">{formatCurrency(it.DonGia)}</td>
                                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(it.ThanhTien)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Lịch sử các lần thanh toán */}
                                            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                                    Lịch sử phiếu thu & thanh toán ({payments.length})
                                                </h4>

                                                {payments.length > 0 ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {payments.map((pt: any) => (
                                                            <div key={pt.MaThanhToan} className="py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold font-mono text-slate-800">
                                                                            Giao dịch #{pt.MaThanhToan}
                                                                        </span>
                                                                        {pt.MaGiaoDich && (
                                                                            <span className="text-slate-400 font-mono text-[11px]">
                                                                                ({pt.MaGiaoDich})
                                                                            </span>
                                                                        )}
                                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[11px]">
                                                                            {getMethodName(pt.PhuongThuc)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-400">
                                                                        Thời gian: {formatDate(pt.NgayThanhToan)}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-black text-emerald-600 text-sm font-mono">
                                                                        +{formatCurrency(pt.SoTien)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic py-2">
                                                        Chưa có giao dịch thanh toán nào được thực hiện cho hóa đơn này.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Chưa có hóa đơn viện phí nào</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Toàn bộ chi phí phát sinh sau các đợt khám bệnh sẽ được hiển thị tại đây một cách minh bạch.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
