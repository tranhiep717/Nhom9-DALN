import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, 
    Filter, 
    Calendar, 
    Stethoscope, 
    Pill, 
    TestTube2, 
    Receipt, 
    ChevronDown, 
    ChevronUp, 
    FileText, 
    User, 
    Clock, 
    Activity, 
    CheckCircle2, 
    AlertCircle,
    Download
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { patientNavItems } from './Dashboard';

interface VisitRecord {
    MaLuotKham: number;
    MaBenhNhan: number;
    MaBacSi: number;
    ThoiGianTiepNhan: string;
    TrangThai: string;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
        chuyenKhoa?: {
            MaChuyenKhoa: number;
            TenChuyenKhoa: string;
        };
    };
    phieuKham?: {
        MaPhieuKham: number;
        TrieuChung?: string;
        ChanDoan?: string;
        HuongDieuTri?: string;
        LoiDan?: string;
        LoiDanBacSi?: string;
        loi_dan_bac_si?: string;
        NgayKham?: string;
    };
    donThuoc?: {
        MaDonThuoc: number;
        NgayKeDon: string;
        GhiChu?: string;
        chiTietDonThuocs?: Array<{
            MaChiTiet: number;
            SoLuong: number;
            CachDung?: string;
            LieuDung?: string;
            lieu_dung?: string;
            thuoc?: {
                MaThuoc: number;
                TenThuoc: string;
                DonViTinh?: string;
                DangBaoChe?: string;
            };
        }>;
    };
    chiDinhDichVus?: Array<{
        MaChiDinh: number;
        KetQua?: string;
        TrangThai: string;
        dichVu?: {
            MaDichVu: number;
            TenDichVu: string;
            LoaiDichVu?: string;
        };
    }>;
    hoaDon?: {
        MaHoaDon: number;
        TongTien: number;
        BenhNhanChiTra: number;
        DaThanhToan: number;
        ConLai: number;
        TrangThai: string;
    };
}

interface MedicalHistoryProps {
    auth: any;
    visits: VisitRecord[];
    filters: {
        search?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function MedicalHistory({ auth, visits = [], filters = {} }: MedicalHistoryProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const asArray = <T,>(value: T | T[] | null | undefined): T[] => {
        if (Array.isArray(value)) return value;
        return value ? [value] : [];
    };

    const normalizeVisit = (visit: any): VisitRecord => {
        const dt = visit?.donThuoc ?? visit?.don_thuoc;
        const serviceList = asArray(visit?.chiDinhDichVus ?? visit?.chi_dinh_dich_vus).map((cd: any) => ({
            ...cd,
            dichVu: cd?.dichVu ?? cd?.dich_vu,
            bacSi: cd?.bacSi ?? cd?.bac_si,
        }));
        const meds = asArray(dt?.chiTietDonThuocs ?? dt?.chi_tiet_don_thuocs).map((ct: any) => ({
            ...ct,
            CachDung: ct?.CachDung ?? ct?.LieuDung ?? ct?.lieu_dung ?? 'Theo chỉ định của bác sĩ',
            thuoc: ct?.thuoc ?? ct?.thuoc_info ?? ct?.thuocInfo,
        }));

        return {
            ...visit,
            bacSi: visit?.bacSi ?? visit?.bac_si,
            phieuKham: visit?.phieuKham ?? visit?.phieu_kham,
            donThuoc: dt ? { ...dt, chiTietDonThuocs: meds } : undefined,
            chiDinhDichVus: serviceList,
            hoaDon: visit?.hoaDon ?? visit?.hoa_don,
        };
    };

    const normalizedVisits = useMemo(() => (visits || []).map(normalizeVisit), [visits]);
    const [expandedVisitId, setExpandedVisitId] = useState<number | null>(normalizedVisits[0]?.MaLuotKham || null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/patient/history', {
            search: search || undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const toggleExpand = (id: number) => {
        setExpandedVisitId(expandedVisitId === id ? null : id);
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

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DANG_KHAM':
                return <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Đang khám</span>;
            case 'CHO_KET_QUA_CLS':
                return <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Chờ kết quả Cận lâm sàng</span>;
            case 'HOAN_THANH':
                return <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Hoàn thành</span>;
            case 'DA_HUY':
                return <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Đã hủy</span>;
            default:
                return <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Lịch sử khám bệnh"
        >
            <Head title="Lịch sử khám bệnh - SmartCare" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ lịch sử khám và điều trị</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Xem chi tiết chẩn đoán của bác sĩ, kết quả xét nghiệm, đơn thuốc và hồ sơ bệnh án theo từng đợt khám.
                    </p>
                </div>

                {/* Bộ lọc tìm kiếm & ngày tháng */}
                <form onSubmit={handleFilter} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                            Tìm kiếm từ khóa
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Chẩn đoán, triệu chứng, tên bác sĩ..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="w-full sm:w-44">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                        />
                    </div>

                    <div className="w-full sm:w-44">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shrink-0"
                    >
                        Lọc hồ sơ
                    </button>
                </form>

                {/* Danh sách các đợt khám */}
                {normalizedVisits.length > 0 ? (
                    <div className="space-y-4">
                        {normalizedVisits.map((visit) => {
                            const isExpanded = expandedVisitId === visit.MaLuotKham;
                            const doc = visit.bacSi;
                            const spec = doc?.chuyenKhoa;
                            const pk = visit.phieuKham;
                            const dt = visit.donThuoc;
                            const clss = visit.chiDinhDichVus || [];
                            const hd = visit.hoaDon;

                            return (
                                <div
                                    key={visit.MaLuotKham}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                                >
                                    {/* Header của đợt khám */}
                                    <div
                                        onClick={() => toggleExpand(visit.MaLuotKham)}
                                        className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2.5">
                                                {getStatusBadge(visit.TrangThai)}
                                                <span className="text-xs font-mono font-bold text-teal-700">
                                                    Đợt khám #{visit.MaLuotKham}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    • {formatDate(visit.ThoiGianTiepNhan)}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Chẩn đoán: <span className="text-teal-900">{pk?.ChanDoan || 'Đang cập nhật / Đang khám'}</span>
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Bác sĩ điều trị: <span className="font-semibold text-slate-700">{doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Bác sĩ phòng khám'}</span>
                                                {spec?.TenChuyenKhoa && ` (${spec.TenChuyenKhoa})`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <span className="text-xs text-slate-400 block">Dịch vụ & Thuốc</span>
                                                <span className="text-xs font-medium text-slate-700">
                                                    {clss.length} xét nghiệm • {dt?.chiTietDonThuocs?.length || 0} thuốc
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nội dung chi tiết mở rộng */}
                                    {isExpanded && (
                                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
                                            {/* 1. Phiếu khám bệnh */}
                                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                    <FileText className="w-4 h-4 text-teal-600" />
                                                    Kết quả thăm khám lâm sàng
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 block mb-1">Triệu chứng ban đầu:</span>
                                                        <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            {pk?.TrieuChung || 'Không ghi nhận triệu chứng đặc biệt'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-1">Chẩn đoán xác định:</span>
                                                        <p className="text-teal-950 font-bold bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                                                            {pk?.ChanDoan || 'Chưa có chẩn đoán cuối cùng'}
                                                        </p>
                                                    </div>
                                                    {pk?.HuongDieuTri && (
                                                        <div className="md:col-span-2">
                                                            <span className="text-slate-400 block mb-1">Hướng điều trị:</span>
                                                            <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                                {pk.HuongDieuTri}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {(pk?.LoiDan ?? pk?.LoiDanBacSi ?? pk?.loi_dan_bac_si) && (
                                                        <div className="md:col-span-2">
                                                            <span className="text-slate-400 block mb-1">Lời dặn của bác sĩ:</span>
                                                            <p className="text-amber-900 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
                                                                {pk?.LoiDan ?? pk?.LoiDanBacSi ?? pk?.loi_dan_bac_si}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 2. Dịch vụ cận lâm sàng & Xét nghiệm */}
                                            {clss.length > 0 && (
                                                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                        <TestTube2 className="w-4 h-4 text-indigo-600" />
                                                        Dịch vụ cận lâm sàng & Xét nghiệm ({clss.length})
                                                    </h4>
                                                    <div className="divide-y divide-slate-100">
                                                        {clss.map((cls) => (
                                                            <div key={cls.MaChiDinh} className="py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                                                <div>
                                                                    <p className="font-bold text-slate-800">
                                                                        {cls.dichVu?.TenDichVu || 'Dịch vụ xét nghiệm'}
                                                                    </p>
                                                                    <p className="text-slate-400">
                                                                        Phân loại: {cls.dichVu?.LoaiDichVu || 'Cận lâm sàng'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    {cls.KetQua ? (
                                                                        <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100 max-w-md text-left">
                                                                            <span className="font-bold">Kết quả: </span>
                                                                            {cls.KetQua}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-400 italic">Đang chờ thực hiện / Chưa có kết quả</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Đơn thuốc đi kèm */}
                                            {dt && dt.chiTietDonThuocs && dt.chiTietDonThuocs.length > 0 && (
                                                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                            <Pill className="w-4 h-4 text-purple-600" />
                                                            Đơn thuốc điều trị (Mã đơn: #{dt.MaDonThuoc})
                                                        </h4>
                                                        <Link
                                                            href="/patient/prescriptions"
                                                            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                                                        >
                                                            Xem trang đơn thuốc
                                                        </Link>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                                                <tr>
                                                                    <th className="px-3 py-2 font-semibold">Tên thuốc</th>
                                                                    <th className="px-3 py-2 font-semibold text-center">Số lượng</th>
                                                                    <th className="px-3 py-2 font-semibold">Cách dùng</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {dt.chiTietDonThuocs.map((ct) => (
                                                                    <tr key={ct.MaChiTiet}>
                                                                        <td className="px-3 py-2 font-bold text-slate-800">
                                                                            {ct.thuoc?.TenThuoc || 'Thuốc'}
                                                                            {ct.thuoc?.DangBaoChe && ` (${ct.thuoc.DangBaoChe})`}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center font-medium text-teal-700">
                                                                            {ct.SoLuong} {ct.thuoc?.DonViTinh || 'viên'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-slate-600">
                                                                            {ct.CachDung ?? ct.LieuDung ?? ct.lieu_dung ?? 'Theo chỉ định của bác sĩ'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 4. Tình trạng viện phí của đợt khám */}
                                            {hd && (
                                                <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                                                    hd.TrangThai === 'DA_THANH_TOAN'
                                                        ? 'bg-emerald-50/50 border-emerald-200'
                                                        : 'bg-rose-50 border-rose-200'
                                                }`}>
                                                    <div className="flex items-center gap-2.5">
                                                        {hd.TrangThai === 'DA_THANH_TOAN' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                                        ) : (
                                                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-slate-800">Hóa đơn #{hd.MaHoaDon}:</span>
                                                                <span className="font-semibold text-slate-900">{formatCurrency(hd.BenhNhanChiTra)}</span>
                                                                <span className="text-slate-500">| Đã trả: {formatCurrency(hd.DaThanhToan)}</span>
                                                                {hd.TrangThai === 'DA_THANH_TOAN' ? (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                        Đã thanh toán đủ
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                                                        Còn nợ: {formatCurrency(hd.ConLai)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {hd.TrangThai !== 'DA_THANH_TOAN' && (
                                                                <p className="text-[11px] text-rose-700 mt-1">
                                                                    Khoản viện phí lần khám này chưa được tất toán. Vui lòng thanh toán tại Quầy Thu ngân hoặc thanh toán trực tuyến.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href="/patient/billing"
                                                        className={`font-bold px-3.5 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap ${
                                                            hd.TrangThai === 'DA_THANH_TOAN'
                                                                ? 'text-teal-700 hover:text-teal-800 hover:bg-teal-50 border border-teal-200'
                                                                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                                                        }`}
                                                    >
                                                        {hd.TrangThai === 'DA_THANH_TOAN' ? 'Xem hóa đơn →' : 'Thanh toán ngay →'}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Không tìm thấy lượt khám nào</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Bạn chưa có dữ liệu khám bệnh hoặc bộ lọc thời gian hiện tại không có kết quả phù hợp.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
