import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Receipt, 
    Search, 
    Filter, 
    Calendar, 
    Eye, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    CreditCard, 
    X,
    User,
    Users,
    ShieldCheck
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { adminNavItems } from '@/constants/navigation';
import AdminPagination from '@/Components/AdminPagination';

interface ChiTietHoaDonItem {
    MaChiTiet: number;
    LoaiChiPhi: string;
    NoiDung: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
}

interface ThanhToanItem {
    MaThanhToan: number;
    SoTien: number;
    PhuongThucThanhToan: string;
    MaGiaoDich?: string;
    ThoiGianThanhToan: string;
    TrangThai: string;
    nguoiThu?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email?: string;
    };
}

interface InvoiceItem {
    MaHoaDon: number;
    MaLuotKham: number;
    NgayTao: string;
    TongTien: number;
    GiamGia: number;
    BaoHiemChiTra: number;
    BenhNhanChiTra: number;
    DaThanhToan: number;
    ConLai: number;
    TrangThai: string;
    nguoiThu?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email?: string;
    };
    luotKham?: {
        MaLuotKham: number;
        benhNhan?: {
            HoTen: string;
            SoDienThoai?: string;
        };
        bacSi?: {
            HoTen: string;
        };
        nguoiTiepNhan?: {
            MaTaiKhoan: number;
            TenDangNhap: string;
            Email?: string;
        };
    };
    chiTietHoaDons?: ChiTietHoaDonItem[];
    thanhToans?: ThanhToanItem[];
}

interface InvoicesProps {
    auth: any;
    invoices: InvoiceItem[];
    filters: {
        search?: string;
        status?: string;
        date?: string;
    };
}

export default function AdminInvoices({ auth, invoices = [], filters = {} }: InvoicesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

    const paginatedInvoices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return invoices.slice(start, start + pageSize);
    }, [invoices, currentPage, pageSize]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/invoices', {
            search: search || undefined,
            status: statusFilter || undefined,
            date: dateFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleOpenDetail = (inv: InvoiceItem) => {
        setSelectedInvoice(inv);
        setDetailModalOpen(true);
    };

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DA_THANH_TOAN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
            case 'THANH_TOAN_MOT_PHAN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Đã trả 1 phần</span>;
            case 'CHUA_THANH_TOAN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Chưa thanh toán</span>;
            case 'DA_HUY':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Đã hủy</span>;
            default:
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Hóa đơn"
        >
            <Head title="Quản lý Hóa đơn & Viện phí - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Hóa đơn viện phí Toàn viện</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Tra cứu toàn bộ hóa đơn viện phí, kiểm toán các phiếu thu và theo dõi công nợ điều trị.
                    </p>
                </div>

                {/* Thanh tìm kiếm & bộ lọc */}
                <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo Mã HĐ, Tên bệnh nhân, SĐT..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        />
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
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="DA_THANH_TOAN">Đã thanh toán</option>
                            <option value="THANH_TOAN_MOT_PHAN">Thanh toán 1 phần</option>
                            <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
                            <option value="DA_HUY">Đã hủy</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Bảng Hóa đơn */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã HĐ</th>
                                    <th className="px-6 py-4 font-semibold">Bệnh nhân</th>
                                    <th className="px-6 py-4 font-semibold">Bác sĩ khám</th>
                                    <th className="px-6 py-4 font-semibold text-right">Tổng chi phí</th>
                                    <th className="px-6 py-4 font-semibold text-right">BN Phải trả</th>
                                    <th className="px-6 py-4 font-semibold text-right">Đã thu</th>
                                    <th className="px-6 py-4 font-semibold text-right">Còn nợ</th>
                                    <th className="px-6 py-4 font-semibold">Thu ngân (Truy vết)</th>
                                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                                            Không tìm thấy hóa đơn nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedInvoices.map((inv) => {
                                    const bn = inv.luotKham?.benhNhan;
                                    const bs = inv.luotKham?.bacSi;
                                    const debt = Math.max(0, Number(inv.BenhNhanChiTra) - Number(inv.DaThanhToan));

                                    return (
                                        <tr key={inv.MaHoaDon} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-teal-700">
                                                #{inv.MaHoaDon}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                <p>{bn?.HoTen || 'Khách vãng lai'}</p>
                                                {bn?.SoDienThoai && (
                                                    <p className="text-[11px] text-slate-400 font-mono font-normal">{bn.SoDienThoai}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {bs?.HoTen || 'Bác sĩ phòng khám'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                                {formatCurrency(inv.TongTien)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                {formatCurrency(inv.BenhNhanChiTra)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                                {formatCurrency(inv.DaThanhToan)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${debt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {formatCurrency(debt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {inv.nguoiThu ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                                        {inv.nguoiThu.TenDangNhap}
                                                    </span>
                                                ) : inv.thanhToans?.[0]?.nguoiThu ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                                        {inv.thanhToans[0].nguoiThu.TenDangNhap}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(inv.TrangThai)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenDetail(inv)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Xem
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={invoices.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            {/* Modal Chi tiết Hóa đơn & Phiếu thu */}
            {detailModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 font-mono">
                                    Chi tiết Hóa đơn #{selectedInvoice.MaHoaDon}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Lập lúc: {formatDate(selectedInvoice.NgayTao)} • Lượt khám: #{selectedInvoice.MaLuotKham}
                                </p>
                            </div>
                            <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tổng quan tài chính */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-center text-xs">
                            <div>
                                <span className="text-slate-400 block">Tổng chi phí</span>
                                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{formatCurrency(selectedInvoice.TongTien)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">BHYT chi trả</span>
                                <span className="font-bold text-blue-700 text-sm mt-0.5 block">{formatCurrency(selectedInvoice.BaoHiemChiTra)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Giảm giá</span>
                                <span className="font-bold text-amber-700 text-sm mt-0.5 block">{formatCurrency(selectedInvoice.GiamGia)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">BN phải trả</span>
                                <span className="font-black text-teal-800 text-sm mt-0.5 block">{formatCurrency(selectedInvoice.BenhNhanChiTra)}</span>
                            </div>
                        </div>

                        {/* Chuỗi truy vết nghiệp vụ */}
                        <div className="bg-indigo-50/70 rounded-2xl border border-indigo-100 p-3.5 space-y-1.5 text-xs">
                            <div className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-indigo-600" />
                                Chuỗi truy vết nhân sự thực hiện
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-50">
                                    <span className="text-slate-400 block text-[10px]">1. Tiếp đón tại sảnh</span>
                                    <span className="font-bold text-slate-800 block mt-0.5">
                                        {selectedInvoice.luotKham?.nguoiTiepNhan?.TenDangNhap 
                                            ? `Lễ tân @${selectedInvoice.luotKham.nguoiTiepNhan.TenDangNhap}` 
                                            : 'Lễ tân tiếp nhận'}
                                    </span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-50">
                                    <span className="text-slate-400 block text-[10px]">2. Bác sĩ khám</span>
                                    <span className="font-bold text-slate-800 block mt-0.5">
                                        {selectedInvoice.luotKham?.bacSi?.HoTen || 'Bác sĩ phòng khám'}
                                    </span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-indigo-50">
                                    <span className="text-slate-400 block text-[10px]">3. Thu ngân thanh toán</span>
                                    <span className="font-bold text-teal-700 block mt-0.5">
                                        {selectedInvoice.nguoiThu?.TenDangNhap 
                                            ? `Lễ tân @${selectedInvoice.nguoiThu.TenDangNhap}` 
                                            : (selectedInvoice.thanhToans?.[0]?.nguoiThu?.TenDangNhap 
                                                ? `Lễ tân @${selectedInvoice.thanhToans[0].nguoiThu.TenDangNhap}` 
                                                : 'Chưa thu')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bảng chi tiết chi phí */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                Hạng mục chi phí ({selectedInvoice.chiTietHoaDons?.length || 0})
                            </h4>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3.5 py-2 font-semibold">Tên mục</th>
                                            <th className="px-3.5 py-2 font-semibold text-center">SL</th>
                                            <th className="px-3.5 py-2 font-semibold text-right">Đơn giá</th>
                                            <th className="px-3.5 py-2 font-semibold text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedInvoice.chiTietHoaDons?.map((ct) => (
                                            <tr key={ct.MaChiTiet}>
                                                <td className="px-3.5 py-2 font-medium text-slate-800">{ct.NoiDung}</td>
                                                <td className="px-3.5 py-2 text-center text-slate-600">{ct.SoLuong}</td>
                                                <td className="px-3.5 py-2 text-right font-mono text-slate-600">{formatCurrency(ct.DonGia)}</td>
                                                <td className="px-3.5 py-2 text-right font-mono font-bold text-slate-900">{formatCurrency(ct.ThanhTien)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Lịch sử phiếu thu */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Lịch sử giao dịch thu tiền ({selectedInvoice.thanhToans?.length || 0})
                            </h4>
                            <div className="space-y-2">
                                {selectedInvoice.thanhToans && selectedInvoice.thanhToans.length > 0 ? (
                                    selectedInvoice.thanhToans.map((tt) => (
                                        <div key={tt.MaThanhToan} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-bold text-emerald-950 font-mono">Phiếu thu #{tt.MaThanhToan}</span>
                                                {tt.MaGiaoDich && (
                                                    <span className="text-slate-500 font-mono text-[11px] ml-1.5">({tt.MaGiaoDich})</span>
                                                )}
                                                <p className="text-slate-400 text-[11px] mt-0.5">
                                                    PT: {tt.PhuongThucThanhToan} • Lúc: {formatDate(tt.ThoiGianThanhToan)}
                                                </p>
                                            </div>
                                            <span className="font-black text-emerald-700 text-sm font-mono">
                                                +{formatCurrency(tt.SoTien)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Chưa có giao dịch thu tiền nào cho hóa đơn này.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
