import { router } from '@inertiajs/react';
import { 
    FlaskConical, 
    Search, 
    Filter, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    Eye, 
    X,
    Calendar,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid
} from 'recharts';

export interface DichVuItem {
    MaDichVu: number;
    TenDichVu: string;
    LoaiDichVu: string;
    DonGia: number;
}

export interface ClsOrderItem {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    MaBacSi: number;
    MaNhanVienThucHien?: number;
    TrangThai: string;
    KetQua?: string;
    KetLuan?: string;
    DonViDo?: string;
    KhoangThamChieu?: string;
    TepDinhKem?: string;
    NgayChiDinh: string;
    NgayThucHien?: string;
    ThoiGianXacNhan?: string;
    DonGia?: string | number;
    GhiChu?: string;
    dich_vu?: DichVuItem;
    bac_si?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
    };
    nhan_vien_thuc_hien?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    };
    luot_kham?: {
        MaLuotKham: number;
        benh_nhan?: {
            MaBenhNhan: number;
            HoTen: string;
            SoDienThoai: string;
            NgaySinh?: string;
            GioiTinh?: string;
        };
    };
}

export interface ClsMonitorTabProps {
    orders?: {
        data: ClsOrderItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    } | ClsOrderItem[];
    stats?: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        cancelled: number;
        totalRevenue?: number;
        completionRate?: number;
    };
    charts?: {
        topServices: Array<{ name: string; count: number; revenue: number }>;
        topDoctors: Array<{ name: string; count: number }>;
        byType: Array<{ name: string; displayName?: string; value: number }>;
        statusDistribution: Array<{ name: string; value: number; color: string }>;
    };
    technicians?: Array<{
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    }>;
    filters?: {
        search?: string;
        status?: string;
        type?: string;
        date?: string;
        per_page?: number;
    };
}

export default function ClsMonitorTab({
    orders,
    stats,
    charts,
    technicians = [],
    filters = {}
}: ClsMonitorTabProps) {
    const orderList: ClsOrderItem[] = useMemo(() => {
        if (!orders) return [];
        if (Array.isArray(orders)) return orders;
        return orders.data || [];
    }, [orders]);

    const isPaginated = orders && !Array.isArray(orders);
    const paginationMeta = isPaginated ? orders : null;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [selectedOrder, setSelectedOrder] = useState<ClsOrderItem | null>(null);

    const getTargetRoute = () => {
        return window.location.pathname.includes('operations-monitor') 
            ? '/admin/operations-monitor' 
            : '/admin/cls-monitor';
    };

    const handleApplyFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'cls' } : {};

        router.get(baseRoute, {
            ...extraParam,
            search: search || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            date: dateFilter || undefined,
            page: 1,
        }, { preserveState: true });
    };

    const handleResetFilter = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setDateFilter('');
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'cls' } : {};
        router.get(baseRoute, { ...extraParam, page: 1 });
    };

    const handlePageChange = (page: number) => {
        const baseRoute = getTargetRoute();
        const extraParam = baseRoute.includes('operations-monitor') ? { tab: 'cls' } : {};
        router.get(baseRoute, {
            ...filters,
            ...extraParam,
            page,
        }, { preserveState: true });
    };

    const formatCurrency = (amount?: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'CHO_THUC_HIEN':
            case 'CHO_TIEP_NHAN':
            case 'DA_TIEP_NHAN':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Chờ thực hiện</span>;
            case 'DANG_THUC_HIEN':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đang xét nghiệm</span>;
            case 'DA_CO_KET_QUA':
            case 'HOAN_THANH':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Có kết quả</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Đã hủy</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{st}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-indigo-600" />
                        Giám sát Tiến độ Cận lâm sàng & Xét nghiệm
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Theo dõi chỉ định X-quang, Siêu âm, Xét nghiệm huyết học, thời gian trả kết quả và kỹ thuật viên thực hiện.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tìm kiếm chỉ định</label>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                            <input 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tên bệnh nhân, mã chỉ định, tên kỹ thuật..."
                                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border-slate-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Phân loại kỹ thuật</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                        >
                            <option value="">Tất cả phân loại</option>
                            <option value="XET_NGHIEM">Xét nghiệm</option>
                            <option value="CHAN_DOAN_HINH_ANH">Chẩn đoán hình ảnh</option>
                            <option value="THAM_DO_CHUC_NANG">Thăm dò chức năng</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Trạng thái xử lý</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full text-xs rounded-xl border-slate-300 py-2 bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="CHO_THUC_HIEN">Chờ thực hiện</option>
                            <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                            <option value="DA_CO_KET_QUA">Đã có kết quả</option>
                            <option value="DA_HUY">Đã hủy</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="flex-1 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Filter className="w-3.5 h-3.5" /> Lọc
                        </button>
                        <button
                            type="button"
                            onClick={handleResetFilter}
                            className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng chỉ định</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total || orderList.length}</div>
                    <span className="text-[10px] text-slate-500">Toàn bộ yêu cầu CLS</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Chờ tiếp nhận / Làm</span>
                    <div className="text-2xl font-black text-amber-700 mt-1">{stats?.pending || 0}</div>
                    <span className="text-[10px] text-amber-600">Bệnh nhân đang chờ</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Đang thực hiện</span>
                    <div className="text-2xl font-black text-blue-700 mt-1">{stats?.processing || 0}</div>
                    <span className="text-[10px] text-blue-600">Đang chạy mẫu / chụp</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Đã trả kết quả</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{stats?.completed || 0}</div>
                    <span className="text-[10px] text-emerald-600">Tỷ lệ xong {stats?.completionRate || 0}%</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Danh sách mẫu chỉ định Cận lâm sàng</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Hiển thị {orderList.length} chỉ định</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Mã CĐ</th>
                                <th className="px-4 py-3">Bệnh nhân</th>
                                <th className="px-4 py-3">Dịch vụ kỹ thuật</th>
                                <th className="px-4 py-3">Bác sĩ chỉ định</th>
                                <th className="px-4 py-3 text-right">Chi phí</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orderList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                                        Không tìm thấy chỉ định Cận lâm sàng nào.
                                    </td>
                                </tr>
                            ) : (
                                orderList.map((item) => (
                                    <tr key={item.MaChiDinh} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                                            #{item.MaChiDinh}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.luot_kham?.benh_nhan?.HoTen || 'Bệnh nhân'}</div>
                                            <div className="text-[11px] text-slate-400 font-mono">{item.luot_kham?.benh_nhan?.SoDienThoai}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{item.dich_vu?.TenDichVu || 'Dịch vụ'}</div>
                                            <div className="text-[10px] text-slate-400">{item.dich_vu?.LoaiDichVu}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-700">{item.bac_si?.HoTen || 'Bác sĩ'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                                            {formatCurrency(item.DonGia || item.dich_vu?.DonGia)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(item.TrangThai)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(item)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {paginationMeta && paginationMeta.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div>Trang {paginationMeta.current_page} / {paginationMeta.last_page}</div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={paginationMeta.current_page <= 1}
                                onClick={() => handlePageChange(paginationMeta.current_page - 1)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={paginationMeta.current_page >= paginationMeta.last_page}
                                onClick={() => handlePageChange(paginationMeta.current_page + 1)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Chi tiết Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Chi tiết Chỉ định CLS #{selectedOrder.MaChiDinh}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.dich_vu?.TenDichVu}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bệnh nhân:</span>
                                    <span className="font-bold text-slate-900">{selectedOrder.luot_kham?.benh_nhan?.HoTen}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Số điện thoại:</span>
                                    <span className="font-mono text-slate-700">{selectedOrder.luot_kham?.benh_nhan?.SoDienThoai}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bác sĩ chỉ định:</span>
                                    <span className="font-medium text-slate-800">{selectedOrder.bac_si?.HoTen}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Trạng thái:</span>
                                    <span>{getStatusBadge(selectedOrder.TrangThai)}</span>
                                </div>
                            </div>

                            {selectedOrder.KetQua && (
                                <div className="border border-indigo-100 bg-indigo-50/30 p-3 rounded-xl">
                                    <span className="font-bold text-indigo-900 block mb-1">Kết quả đo lường:</span>
                                    <p className="text-slate-800 font-mono whitespace-pre-wrap">{selectedOrder.KetQua}</p>
                                </div>
                            )}

                            {selectedOrder.KetLuan && (
                                <div className="border border-emerald-100 bg-emerald-50/30 p-3 rounded-xl">
                                    <span className="font-bold text-emerald-900 block mb-1">Kết luận chẩn đoán:</span>
                                    <p className="text-slate-800 whitespace-pre-wrap">{selectedOrder.KetLuan}</p>
                                </div>
                            )}

                            {selectedOrder.GhiChu && (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <span className="text-slate-500 block mb-0.5">Ghi chú:</span>
                                    <p className="text-slate-700">{selectedOrder.GhiChu}</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
