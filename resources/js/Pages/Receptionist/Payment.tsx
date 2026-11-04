import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    CreditCard,
    FileText,
    Receipt,
    Printer,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    RefreshCw,
    Plus,
    XCircle,
    AlertCircle,
    Loader2,
    ShieldCheck,
    DollarSign,
    Check,
    ChevronRight,
    Eye,
    Tag,
    Building2,
    QrCode,
    AlertTriangle
} from 'lucide-react';

interface BenhNhan {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    GioiTinh: string;
    NgaySinh?: string;
    DiaChi?: string;
}

interface ChiTietHoaDon {
    MaChiTietHoaDon: number;
    MaHoaDon: number;
    LoaiChiPhi: string;
    NoiDung: string;
    SoLuong: number;
    DonGia: number | string;
    ThanhTien?: number | string;
    MaChiDinh?: number;
    MaChiTietDonThuoc?: number;
}

interface ThanhToan {
    MaThanhToan: number;
    MaHoaDon: number;
    SoTien: number | string;
    PhuongThucThanhToan: string;
    ThoiGianThanhToan?: string;
    TrangThai: string;
    MaGiaoDich?: string;
    GhiChu?: string;
    NgayTao?: string;
}

interface HoaDon {
    MaHoaDon: number;
    MaLuotKham: number;
    TongTien: number | string;
    GiamGia: number | string;
    BaoHiemChiTra: number | string;
    BenhNhanChiTra: number | string;
    TrangThai: string;
    NgayTao: string;
    GhiChu?: string;
    DaThanhToan?: number;
    ConLai?: number;
    luotKham?: {
        MaLuotKham: number;
        TrangThai: string;
        benhNhan?: BenhNhan;
        bacSi?: {
            MaBacSi: number;
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
    };
    chiTietHoaDons?: ChiTietHoaDon[];
    thanhToans?: ThanhToan[];
}

interface LuotKhamUnbilled {
    MaLuotKham: number;
    TrangThai: string;
    ThoiGianTiepNhan?: string;
    benhNhan?: BenhNhan;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
    };
    donThuoc?: {
        MaDonThuoc: number;
        TrangThai: string;
        chiTietDonThuocs?: Array<{
            MaChiTietDonThuoc: number;
            SoLuong: number;
            DonGia: number | string;
            thuoc?: { TenThuoc: string };
        }>;
    };
    chiDinhDichVus?: Array<{
        MaChiDinh: number;
        TrangThai: string;
        DonGia: number | string;
        dichVu?: { TenDichVu: string };
    }>;
}

interface Props {
    auth: any;
    invoices: HoaDon[];
    unbilledVisits: LuotKhamUnbilled[];
    stats: {
        todayRevenue: number;
        todayInvoices: number;
        unpaidCount: number;
        paidCount: number;
    };
    filters: {
        search?: string;
        date?: string;
        status?: string;
    };
}

export default function ReceptionistPayment({
    auth,
    invoices = [],
    unbilledVisits = [],
    stats = { todayRevenue: 0, todayInvoices: 0, unpaidCount: 0, paidCount: 0 },
    filters = {}
}: Props) {
    const { flash } = usePage<any>().props;

    const navItems = [
        { name: 'Tổng quan', href: '/receptionist/dashboard', icon: LayoutDashboard },
        { name: 'Hàng chờ tiếp nhận', href: '/receptionist/queue', icon: Calendar },
        { name: 'Hóa đơn & Thu phí', href: '/receptionist/payment', icon: CreditCard },
        { name: 'Hồ sơ', href: '/receptionist/records', icon: FileText },
    ];

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [filterDate, setFilterDate] = useState<string>(filters.date || '');
    const [filterStatus, setFilterStatus] = useState<string>(filters.status || '');

    // Active Tab in page: 'invoices' (Danh sách hóa đơn), 'unbilled' (Chờ lập hóa đơn)
    const [activeTab, setActiveTab] = useState<'invoices' | 'unbilled'>('invoices');

    // Modal: Xem chi tiết hóa đơn / In hóa đơn
    const [viewingInvoice, setViewingInvoice] = useState<HoaDon | null>(null);

    // Modal: Thu tiền thanh toán
    const [payingInvoice, setPayingInvoice] = useState<HoaDon | null>(null);
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payMethod, setPayMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE'>('TIEN_MAT');
    const [payNote, setPayNote] = useState<string>('');
    const [payTxnId, setPayTxnId] = useState<string>('');

    // Modal: Tạo hóa đơn mới cho Lượt khám
    const [creatingForVisit, setCreatingForVisit] = useState<LuotKhamUnbilled | null>(null);
    const [createTienKham, setCreateTienKham] = useState<number>(0);
    const [createGiamGia, setCreateGiamGia] = useState<number>(0);
    const [createBaoHiem, setCreateBaoHiem] = useState<number>(0);
    const [createNote, setCreateNote] = useState<string>('');

    // Loading states
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Áp dụng bộ lọc
    const handleApplyFilter = () => {
        router.get('/receptionist/payment', {
            search: searchQuery || undefined,
            date: filterDate || undefined,
            status: filterStatus || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Đặt lại bộ lọc
    const handleResetFilter = () => {
        setSearchQuery('');
        setFilterDate('');
        setFilterStatus('');
        router.get('/receptionist/payment', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Mở modal thu tiền
    const handleOpenPayModal = (inv: HoaDon) => {
        const conNo = inv.ConLai ?? Math.max(0, Number(inv.BenhNhanChiTra) - (inv.DaThanhToan || 0));
        setPayingInvoice(inv);
        setPayAmount(conNo);
        setPayMethod('TIEN_MAT');
        setPayNote('');
        // Tạo mã giao dịch duy nhất cho phiên thu tiền (chống duplicate / double submit)
        setPayTxnId('TXN_' + inv.MaHoaDon + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    };

    // Xác nhận thu tiền
    const handleSubmitPayment = () => {
        if (!payingInvoice || payAmount <= 0) return;

        setLoadingAction('pay');
        router.post(`/receptionist/invoices/${payingInvoice.MaHoaDon}/pay`, {
            SoTien: payAmount,
            PhuongThucThanhToan: payMethod,
            GhiChu: payNote || null,
            MaGiaoDich: payTxnId || null,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setPayingInvoice(null);
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Lỗi khi ghi nhận thanh toán.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Mở modal tạo hóa đơn
    const handleOpenCreateInvoiceModal = (visit: LuotKhamUnbilled) => {
        setCreatingForVisit(visit);
        setCreateTienKham(0);
        setCreateGiamGia(0);
        setCreateBaoHiem(0);
        setCreateNote('');
    };

    // Tạm tính chi phí trước khi tạo hóa đơn
    const estimatedCreateSummary = useMemo(() => {
        if (!creatingForVisit) return { total: 0, patientPay: 0, medTotal: 0, svcTotal: 0 };
        let medTotal = 0;
        if (creatingForVisit.donThuoc && creatingForVisit.donThuoc.TrangThai !== 'DA_HUY') {
            creatingForVisit.donThuoc.chiTietDonThuocs?.forEach(ct => {
                medTotal += (ct.SoLuong * Number(ct.DonGia));
            });
        }

        let svcTotal = 0;
        if (creatingForVisit.chiDinhDichVus) {
            creatingForVisit.chiDinhDichVus.forEach(cd => {
                if (cd.TrangThai !== 'DA_HUY') {
                    svcTotal += Number(cd.DonGia);
                }
            });
        }

        const totalCost = (Number(createTienKham) || 0) + medTotal + svcTotal;
        const finalTotal = totalCost > 0 ? totalCost : 100000; // Phí khám tối thiểu nếu trống
        const patientPay = Math.max(0, finalTotal - (Number(createGiamGia) || 0) - (Number(createBaoHiem) || 0));

        return {
            total: finalTotal,
            patientPay: patientPay,
            medTotal,
            svcTotal,
        };
    }, [creatingForVisit, createTienKham, createGiamGia, createBaoHiem]);

    // Gửi tạo hóa đơn
    const handleSubmitCreateInvoice = () => {
        if (!creatingForVisit) return;

        setLoadingAction('createInvoice');
        router.post('/receptionist/invoices', {
            MaLuotKham: creatingForVisit.MaLuotKham,
            TienKham: createTienKham > 0 ? createTienKham : null,
            GiamGia: createGiamGia,
            BaoHiemChiTra: createBaoHiem,
            GhiChu: createNote || null,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setCreatingForVisit(null);
                setActiveTab('invoices');
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Lỗi khi lập hóa đơn.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // In hóa đơn
    const handlePrintInvoice = () => {
        window.print();
    };

    return (
        <DashboardLayout
            role="receptionist"
            navItems={navItems}
            user={auth?.user}
            header="Quản lý Hóa đơn & Thu phí"
        >
            <Head title="Hóa đơn & Thu phí - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Flash Alerts */}
                {flash?.success && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <p className="text-sm font-medium text-rose-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* 2. Thẻ thống kê doanh thu & hóa đơn hôm nay */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh thu hôm nay</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                                {Number(stats.todayRevenue).toLocaleString('vi-VN')} đ
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hóa đơn hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{stats.todayInvoices}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chưa thu / Còn nợ</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">{stats.unpaidCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã hoàn tất thanh toán</p>
                            <p className="text-2xl font-bold text-sky-600 mt-1 font-mono">{stats.paidCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Thanh công cụ tìm kiếm, bộ lọc & chuyển Tab */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                                activeTab === 'invoices'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Receipt className="w-4 h-4" /> Danh sách hóa đơn ({invoices.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('unbilled')}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                                activeTab === 'unbilled'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Clock className="w-4 h-4" /> Chờ lập hóa đơn
                            {unbilledVisits.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-mono">
                                    {unbilledVisits.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Bộ lọc cho Tab Hóa đơn */}
                    {activeTab === 'invoices' && (
                        <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:justify-end">
                            <div className="relative min-w-[220px]">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, SĐT, hoặc Mã HĐ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="text-xs rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary"
                            />

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-xs rounded-xl border border-gray-200 py-2 px-3 bg-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
                                <option value="THANH_TOAN_MOT_PHAN">Thanh toán 1 phần</option>
                                <option value="DA_THANH_TOAN">Đã thanh toán</option>
                                <option value="DA_HUY">Đã hủy</option>
                            </select>

                            <button
                                onClick={handleApplyFilter}
                                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover flex items-center gap-1.5 shadow-sm"
                            >
                                <Filter className="w-3.5 h-3.5" /> Lọc
                            </button>

                            {(filterDate || filterStatus || searchQuery) && (
                                <button
                                    onClick={handleResetFilter}
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
                                    title="Đặt lại bộ lọc"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. Nội dung Tab 1: Danh sách hóa đơn */}
                {activeTab === 'invoices' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Mã HĐ</th>
                                        <th className="px-5 py-3.5">Ngày lập</th>
                                        <th className="px-5 py-3.5">Bệnh nhân</th>
                                        <th className="px-5 py-3.5 text-right">Tổng chi phí</th>
                                        <th className="px-5 py-3.5 text-right">Miễn giảm / BHYT</th>
                                        <th className="px-5 py-3.5 text-right">Cần thanh toán</th>
                                        <th className="px-5 py-3.5 text-right">Đã thu</th>
                                        <th className="px-5 py-3.5 text-right">Còn nợ</th>
                                        <th className="px-5 py-3.5 text-center">Trạng thái</th>
                                        <th className="px-5 py-3.5 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-gray-400">
                                                <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm">Không tìm thấy hóa đơn nào phù hợp.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => {
                                            const conNo = inv.ConLai ?? Math.max(0, Number(inv.BenhNhanChiTra) - (inv.DaThanhToan || 0));
                                            const ngayTaoStr = inv.NgayTao ? new Date(inv.NgayTao).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';

                                            return (
                                                <tr key={inv.MaHoaDon} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-5 py-3.5 font-bold text-gray-900 font-mono">
                                                        #HD{inv.MaHoaDon}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-500">
                                                        {ngayTaoStr}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-gray-900">
                                                            {inv.luotKham?.benhNhan?.HoTen || 'Bệnh nhân'}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 font-mono">
                                                            {inv.luotKham?.benhNhan?.SoDienThoai || '--'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-gray-700">
                                                        {Number(inv.TongTien).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-gray-500 text-[11px]">
                                                        {(Number(inv.GiamGia) + Number(inv.BaoHiemChiTra)).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                                                        {Number(inv.BenhNhanChiTra).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-semibold">
                                                        {(inv.DaThanhToan || 0).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                                                        {conNo.toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                            inv.TrangThai === 'DA_THANH_TOAN' ? 'bg-emerald-100 text-emerald-700' :
                                                            inv.TrangThai === 'THANH_TOAN_MOT_PHAN' ? 'bg-sky-100 text-sky-700' :
                                                            inv.TrangThai === 'DA_HUY' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {inv.TrangThai === 'DA_THANH_TOAN' ? 'Đã thanh toán' :
                                                             inv.TrangThai === 'THANH_TOAN_MOT_PHAN' ? 'TT 1 phần' :
                                                             inv.TrangThai === 'DA_HUY' ? 'Đã hủy' : 'Chưa thanh toán'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right space-x-2">
                                                        <button
                                                            onClick={() => setViewingInvoice(inv)}
                                                            className="px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                                                        </button>

                                                        {inv.TrangThai !== 'DA_THANH_TOAN' && inv.TrangThai !== 'DA_HUY' && conNo > 0 && (
                                                            <button
                                                                onClick={() => handleOpenPayModal(inv)}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" /> Thu tiền
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. Nội dung Tab 2: Lượt khám chờ lập hóa đơn */}
                {activeTab === 'unbilled' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Lượt khám đang chờ lập hóa đơn ({unbilledVisits.length})
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Danh sách bệnh nhân đã tiếp nhận vào phòng khám hoặc đã hoàn tất khám bệnh, sẵn sàng tổng hợp chi phí và lập hóa đơn thu tiền.
                            </p>
                        </div>

                        {unbilledVisits.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                                <h4 className="font-bold text-gray-700 text-sm">Tất cả lượt khám đã được lập hóa đơn!</h4>
                                <p className="text-xs text-gray-400 mt-1">Hiện không có lượt khám nào còn tồn đọng chưa xuất hóa đơn.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unbilledVisits.map((visit) => {
                                    const medCount = visit.donThuoc?.chiTietDonThuocs?.length || 0;
                                    const svcCount = visit.chiDinhDichVus?.length || 0;

                                    return (
                                        <div key={visit.MaLuotKham} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 hover:bg-white hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                        LK #{visit.MaLuotKham}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        visit.TrangThai === 'HOAN_THANH' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                                                    }`}>
                                                        {visit.TrangThai === 'HOAN_THANH' ? 'Đã khám xong' : 'Đang khám'}
                                                    </span>
                                                </div>

                                                <h4 className="font-bold text-gray-900 text-base mt-2">
                                                    {visit.benhNhan?.HoTen}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    SĐT: {visit.benhNhan?.SoDienThoai || 'Chưa cập nhật'}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Bác sĩ: <span className="font-semibold">{visit.bacSi?.HoTen || '--'}</span>
                                                </p>

                                                <div className="flex gap-2 text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-200">
                                                    <span>💊 {medCount} loại thuốc</span>
                                                    <span>•</span>
                                                    <span>🔬 {svcCount} dịch vụ</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleOpenCreateInvoiceModal(visit)}
                                                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Receipt className="w-3.5 h-3.5" /> Lập hóa đơn ngay
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL 1: XEM CHI TIẾT & IN HÓA ĐƠN */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
                        {/* Header Printable */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Hóa đơn #{viewingInvoice.MaHoaDon}</h3>
                                    <p className="text-xs text-gray-500">Ngày lập: {viewingInvoice.NgayTao}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Thông tin bệnh nhân */}
                        <div className="bg-gray-50 p-4 rounded-xl text-xs grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-gray-500">Bệnh nhân:</p>
                                <p className="font-bold text-gray-900 text-sm">{viewingInvoice.luotKham?.benhNhan?.HoTen}</p>
                                <p className="text-gray-600">SĐT: {viewingInvoice.luotKham?.benhNhan?.SoDienThoai}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Địa chỉ:</p>
                                <p className="text-gray-700">{viewingInvoice.luotKham?.benhNhan?.DiaChi || 'Chưa cập nhật'}</p>
                                <p className="text-gray-600">Bác sĩ khám: {viewingInvoice.luotKham?.bacSi?.HoTen || '--'}</p>
                            </div>
                        </div>

                        {/* Danh sách chi tiết chi phí */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/70 text-gray-700 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Khoản mục</th>
                                        <th className="px-3 py-2.5">Nội dung</th>
                                        <th className="px-3 py-2.5 text-center">SL</th>
                                        <th className="px-3 py-2.5 text-right">Đơn giá</th>
                                        <th className="px-3 py-2.5 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {viewingInvoice.chiTietHoaDons?.map((ct, idx) => (
                                        <tr key={ct.MaChiTietHoaDon || idx}>
                                            <td className="px-3 py-2 text-gray-500 font-semibold">
                                                {ct.LoaiChiPhi === 'THUOC' ? '💊 Thuốc' :
                                                 ct.LoaiChiPhi === 'DICH_VU' ? '🔬 Cận lâm sàng' : '🩺 Khám bệnh'}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-gray-900">{ct.NoiDung}</td>
                                            <td className="px-3 py-2 text-center">{ct.SoLuong}</td>
                                            <td className="px-3 py-2 text-right font-mono">{Number(ct.DonGia).toLocaleString('vi-VN')} đ</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                                {Number(ct.ThanhTien || (ct.SoLuong * Number(ct.DonGia))).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/70 font-semibold border-t border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 text-right text-gray-600">Tổng cộng chi phí:</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                            {Number(viewingInvoice.TongTien).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    {Number(viewingInvoice.GiamGia) > 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-1.5 text-right text-gray-600">Giảm giá / Ưu đãi:</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-rose-600">
                                                - {Number(viewingInvoice.GiamGia).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    )}
                                    {Number(viewingInvoice.BaoHiemChiTra) > 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-1.5 text-right text-gray-600">Bảo hiểm chi trả:</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-blue-600">
                                                - {Number(viewingInvoice.BaoHiemChiTra).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 border-gray-300 font-bold text-sm bg-white">
                                        <td colSpan={4} className="px-3 py-2.5 text-right text-gray-900">Bệnh nhân cần thanh toán:</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-primary font-black">
                                            {Number(viewingInvoice.BenhNhanChiTra).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    <tr className="bg-emerald-50 text-emerald-800">
                                        <td colSpan={4} className="px-3 py-2 text-right">Đã thanh toán:</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold">
                                            {(viewingInvoice.DaThanhToan || 0).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    <tr className="bg-rose-50 text-rose-800 font-bold">
                                        <td colSpan={4} className="px-3 py-2 text-right">Còn nợ:</td>
                                        <td className="px-3 py-2 text-right font-mono text-rose-600 text-sm">
                                            {(viewingInvoice.ConLai ?? Math.max(0, Number(viewingInvoice.BenhNhanChiTra) - (viewingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Lịch sử thanh toán */}
                        {viewingInvoice.thanhToans && viewingInvoice.thanhToans.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-xs">Lịch sử thu tiền ({viewingInvoice.thanhToans.length} lần)</h4>
                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                                    {viewingInvoice.thanhToans.map((tt) => (
                                        <div key={tt.MaThanhToan} className="p-2.5 bg-gray-50 flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-emerald-700 font-mono">
                                                    +{Number(tt.SoTien).toLocaleString('vi-VN')} đ
                                                </span>
                                                <span className="text-gray-500 ml-2">
                                                    ({tt.PhuongThucThanhToan === 'TIEN_MAT' ? 'Tiền mặt' :
                                                      tt.PhuongThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Thẻ'})
                                                </span>
                                                {tt.MaGiaoDich && (
                                                    <span className="text-gray-400 font-mono ml-2">Mã GD: {tt.MaGiaoDich}</span>
                                                )}
                                            </div>
                                            <span className="text-gray-500 text-[11px]">{tt.ThoiGianThanhToan}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nút hành động */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handlePrintInvoice}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
                            >
                                <Printer className="w-4 h-4" /> In phiếu thu (Print)
                            </button>

                            <div className="flex gap-2">
                                {viewingInvoice.TrangThai !== 'DA_THANH_TOAN' && viewingInvoice.TrangThai !== 'DA_HUY' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const targetInv = viewingInvoice;
                                            setViewingInvoice(null);
                                            handleOpenPayModal(targetInv);
                                        }}
                                        className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                                    >
                                        <CreditCard className="w-4 h-4" /> Thu tiền ngay
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: GHI NHẬN THU TIỀN THANH TOÁN */}
            {payingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-gray-900 text-base">Thu tiền viện phí</h3>
                            </div>
                            <button onClick={() => setPayingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Hóa đơn:</span>
                                <span className="font-bold text-gray-900">#HD{payingInvoice.MaHoaDon}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Bệnh nhân:</span>
                                <span className="font-bold text-gray-900">{payingInvoice.luotKham?.benhNhan?.HoTen}</span>
                            </div>
                            <div className="flex justify-between border-t border-emerald-100 pt-1 mt-1 text-sm font-bold text-emerald-800">
                                <span>Số tiền còn nợ:</span>
                                <span className="font-mono">
                                    {(payingInvoice.ConLai ?? Math.max(0, Number(payingInvoice.BenhNhanChiTra) - (payingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Số tiền thực thu (VNĐ) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(Number(e.target.value))}
                                    className="w-full text-base font-bold font-mono text-gray-900 rounded-xl border-gray-200 py-2 px-3 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Phương thức thanh toán</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'TIEN_MAT', label: 'Tiền mặt' },
                                        { id: 'CHUYEN_KHOAN', label: 'Chuyển khoản' },
                                        { id: 'THE', label: 'Thẻ POS' }
                                    ].map((m) => (
                                        <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => setPayMethod(m.id as any)}
                                            className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                                payMethod === m.id
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {payMethod !== 'TIEN_MAT' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mã tham chiếu / Mã giao dịch</label>
                                    <input
                                        type="text"
                                        placeholder="VD: FT260900123..."
                                        value={payTxnId}
                                        onChange={(e) => setPayTxnId(e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú thu tiền</label>
                                <input
                                    type="text"
                                    placeholder="Ghi chú thêm nếu có..."
                                    value={payNote}
                                    onChange={(e) => setPayNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPayingInvoice(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitPayment}
                                disabled={payAmount <= 0 || loadingAction === 'pay'}
                                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                {loadingAction === 'pay' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Xác nhận thu tiền
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: LẬP HÓA ĐƠN CHO LƯỢT KHÁM */}
            {creatingForVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-gray-900 text-base">Lập hóa đơn viện phí</h3>
                            </div>
                            <button onClick={() => setCreatingForVisit(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-blue-50/60 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Lượt khám:</span>
                                <span className="font-bold text-gray-900">#LK{creatingForVisit.MaLuotKham}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bệnh nhân:</span>
                                <span className="font-bold text-gray-900">{creatingForVisit.benhNhan?.HoTen}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bác sĩ:</span>
                                <span className="text-gray-700">{creatingForVisit.bacSi?.HoTen || '--'}</span>
                            </div>
                        </div>

                        {/* Tổng quan chi phí tự động từ DB */}
                        <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-2 bg-gray-50">
                            <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Chi phí tự động tổng hợp:</h4>
                            <div className="flex justify-between text-gray-600">
                                <span>1. Tiền thuốc (từ đơn thuốc):</span>
                                <span className="font-mono font-semibold">{(estimatedCreateSummary.medTotal || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>2. Cận lâm sàng & Kỹ thuật:</span>
                                <span className="font-mono font-semibold">{(estimatedCreateSummary.svcTotal || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        {/* Form nhập thêm thông tin */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Phí khám lâm sàng ban đầu (nếu có thu thêm)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={createTienKham}
                                    onChange={(e) => setCreateTienKham(Number(e.target.value))}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Miễn giảm (VNĐ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={createGiamGia}
                                        onChange={(e) => setCreateGiamGia(Number(e.target.value))}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bảo hiểm chi trả (VNĐ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={createBaoHiem}
                                        onChange={(e) => setCreateBaoHiem(Number(e.target.value))}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú hóa đơn</label>
                                <input
                                    type="text"
                                    placeholder="Ghi chú hóa đơn viện phí..."
                                    value={createNote}
                                    onChange={(e) => setCreateNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3"
                                />
                            </div>

                            {/* Tóm tắt thanh toán */}
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs space-y-1 mt-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tổng chi phí:</span>
                                    <span className="font-mono font-bold">{estimatedCreateSummary.total.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-emerald-800 font-bold text-sm pt-1 border-t border-emerald-200">
                                    <span>Bệnh nhân cần trả:</span>
                                    <span className="font-mono">{estimatedCreateSummary.patientPay.toLocaleString('vi-VN')} đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setCreatingForVisit(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitCreateInvoice}
                                disabled={loadingAction === 'createInvoice'}
                                className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                {loadingAction === 'createInvoice' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Xác nhận lập hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MẪU PHIẾU THU IN CHUYÊN NGHIỆP (@media print) */}
            {viewingInvoice && (
                <div id="printable-receipt" className="hidden print:block font-serif text-black p-4 text-xs">
                    {/* Header phòng khám chính thức (Không tự tạo địa chỉ/hotline giả định) */}
                    <div className="text-center border-b border-gray-400 pb-3 mb-4">
                        <h2 className="font-bold text-sm tracking-widest uppercase">Hệ Thống Quản Lý Phòng Khám Thông Minh SmartCare</h2>
                        <h1 className="font-bold text-base mt-2 uppercase">Phiếu Thu Viện Phí & Dịch Vụ Khám Chữa Bệnh</h1>
                        <p className="text-[11px] italic">Mã hóa đơn: #HD{viewingInvoice.MaHoaDon} - Lượt khám: #LK{viewingInvoice.MaLuotKham}</p>
                    </div>

                    {/* Thông tin bệnh nhân & lượt khám */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                        <div>
                            <p><span className="font-semibold">Họ tên người bệnh:</span> {viewingInvoice.luotKham?.benhNhan?.HoTen}</p>
                            <p><span className="font-semibold">Mã bệnh nhân:</span> #BN{viewingInvoice.luotKham?.benhNhan?.MaBenhNhan}</p>
                            <p><span className="font-semibold">Số điện thoại:</span> {viewingInvoice.luotKham?.benhNhan?.SoDienThoai || '--'}</p>
                            <p><span className="font-semibold">Địa chỉ:</span> {viewingInvoice.luotKham?.benhNhan?.DiaChi || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                            <p><span className="font-semibold">Bác sĩ khám:</span> {viewingInvoice.luotKham?.bacSi?.HoTen || '--'}</p>
                            <p><span className="font-semibold">Chuyên khoa:</span> {viewingInvoice.luotKham?.bacSi?.chuyenKhoa?.TenChuyenKhoa || '--'}</p>
                            <p><span className="font-semibold">Ngày tạo HĐ:</span> {viewingInvoice.NgayTao}</p>
                            <p><span className="font-semibold">Ngày giờ in:</span> {new Date().toLocaleString('vi-VN')}</p>
                        </div>
                    </div>

                    {/* Bảng chi tiết chi phí */}
                    <table className="w-full border-collapse border border-gray-400 text-[10px] mb-4">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-1.5 text-center w-8">STT</th>
                                <th className="border border-gray-400 p-1.5 text-left w-24">Khoản mục</th>
                                <th className="border border-gray-400 p-1.5 text-left">Tên thuốc / Dịch vụ kỹ thuật</th>
                                <th className="border border-gray-400 p-1.5 text-center w-12">SL</th>
                                <th className="border border-gray-400 p-1.5 text-right w-20">Đơn giá</th>
                                <th className="border border-gray-400 p-1.5 text-right w-24">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewingInvoice.chiTietHoaDons?.map((ct, idx) => (
                                <tr key={ct.MaChiTietHoaDon || idx}>
                                    <td className="border border-gray-400 p-1.5 text-center">{idx + 1}</td>
                                    <td className="border border-gray-400 p-1.5 font-medium">
                                        {ct.LoaiChiPhi === 'THUOC' ? 'Thuốc điều trị' :
                                         ct.LoaiChiPhi === 'DICH_VU' ? 'Cận lâm sàng' : 'Khám lâm sàng'}
                                    </td>
                                    <td className="border border-gray-400 p-1.5 font-semibold">{ct.NoiDung}</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{ct.SoLuong}</td>
                                    <td className="border border-gray-400 p-1.5 text-right">{Number(ct.DonGia).toLocaleString('vi-VN')} đ</td>
                                    <td className="border border-gray-400 p-1.5 text-right font-semibold">
                                        {(Number(ct.SoLuong) * Number(ct.DonGia)).toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-semibold">1. Tổng chi phí viện phí:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold">{Number(viewingInvoice.TongTien).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            {Number(viewingInvoice.BaoHiemChiTra) > 0 && (
                                <tr>
                                    <td colSpan={5} className="border border-gray-400 p-1.5 text-right">2. Bảo hiểm y tế thanh toán:</td>
                                    <td className="border border-gray-400 p-1.5 text-right">-{Number(viewingInvoice.BaoHiemChiTra).toLocaleString('vi-VN')} đ</td>
                                </tr>
                            )}
                            {Number(viewingInvoice.GiamGia) > 0 && (
                                <tr>
                                    <td colSpan={5} className="border border-gray-400 p-1.5 text-right">3. Miễn giảm / Hỗ trợ:</td>
                                    <td className="border border-gray-400 p-1.5 text-right">-{Number(viewingInvoice.GiamGia).toLocaleString('vi-VN')} đ</td>
                                </tr>
                            )}
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold uppercase">4. Bệnh nhân phải trả:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">{Number(viewingInvoice.BenhNhanChiTra).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold">5. ĐÃ THANH TOÁN THỰC TẾ:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">{(viewingInvoice.DaThanhToan || 0).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            <tr>
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold text-gray-800">6. CÒN NỢ / CHƯA THANH TOÁN:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">
                                    {(viewingInvoice.ConLai ?? Math.max(0, Number(viewingInvoice.BenhNhanChiTra) - (viewingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Lịch sử thanh toán chi tiết nếu có */}
                    {viewingInvoice.thanhToans && viewingInvoice.thanhToans.length > 0 && (
                        <div className="mb-4 text-[10px]">
                            <p className="font-bold mb-1">Giao dịch đã thu tiền:</p>
                            <ul className="list-disc pl-5 space-y-0.5">
                                {viewingInvoice.thanhToans.map((tt) => (
                                    <li key={tt.MaThanhToan}>
                                        Ngày {tt.ThoiGianThanhToan} - Số tiền: <span className="font-bold">{Number(tt.SoTien).toLocaleString('vi-VN')} đ</span> ({tt.PhuongThucThanhToan}) {tt.MaGiaoDich ? `- Mã GD: ${tt.MaGiaoDich}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Phần ký nhận 2 bên */}
                    <div className="grid grid-cols-2 gap-4 text-center mt-6 text-[11px] pt-2">
                        <div>
                            <p className="font-bold uppercase">Người nộp tiền</p>
                            <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-medium text-gray-800">{viewingInvoice.luotKham?.benhNhan?.HoTen}</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase">Người thu tiền / Thu ngân</p>
                            <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-medium text-gray-800">{auth?.user?.name || 'Thu ngân phòng khám'}</p>
                        </div>
                    </div>

                    <div className="text-center text-[10px] italic text-gray-500 mt-6 border-t border-gray-300 pt-2">
                        SmartCare xin chân thành cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ khám chữa bệnh!
                    </div>
                </div>
            )}

            {/* CSS CHUYÊN BIỆT CHO IN ẤN PRINT MEDIA (HỖ TRỢ KHỔ A4 / A5 VÀ HÓA ĐƠN DÀI NHIỀU TRANG) */}
            <style>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 12mm 15mm;
                    }
                    html, body {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible !important;
                    }
                    #printable-receipt {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        display: block !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        z-index: 999999 !important;
                    }
                    table, tr, td, th {
                        page-break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}
