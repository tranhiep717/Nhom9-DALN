import { useState, useMemo } from 'react';
import { 
    Building2, 
    Search, 
    Plus, 
    Edit, 
    CheckCircle2, 
    AlertCircle, 
    X,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import AdminPagination from '@/Components/AdminPagination';

export interface ServiceItem {
    MaDichVu: number;
    TenDichVu: string;
    DonGia: number;
    LoaiDichVu: string; // 'KHAM_BENH', 'XET_NGHIEM', 'CHAN_DOAN_HINH_ANH', 'THAM_DO_CHUC_NANG'
    MoTa?: string;
    TrangThai: string; // 'HOAT_DONG', 'NGUNG_HOAT_DONG'
}

export interface ServicesTabProps {
    services: ServiceItem[];
    filters?: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function ServicesTab({ services = [], filters = {} }: ServicesTabProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [serviceList, setServiceList] = useState<ServiceItem[]>(services);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const filteredServices = useMemo(() => {
        return serviceList.filter((item) => {
            const matchesSearch = !search || 
                item.TenDichVu.toLowerCase().includes(search.toLowerCase()) ||
                (item.MoTa && item.MoTa.toLowerCase().includes(search.toLowerCase()));
            const matchesType = !typeFilter || item.LoaiDichVu === typeFilter;
            const matchesStatus = !statusFilter || item.TrangThai === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [serviceList, search, typeFilter, statusFilter]);

    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredServices.slice(start, start + pageSize);
    }, [filteredServices, currentPage, pageSize]);

    const [formData, setFormData] = useState({
        TenDichVu: '',
        DonGia: 150000,
        LoaiDichVu: 'XET_NGHIEM',
        MoTa: '',
        TrangThai: 'HOAT_DONG',
    });

    const handleOpenCreateModal = () => {
        setEditingService(null);
        setFormData({
            TenDichVu: '',
            DonGia: 150000,
            LoaiDichVu: 'XET_NGHIEM',
            MoTa: '',
            TrangThai: 'HOAT_DONG',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (svc: ServiceItem) => {
        setEditingService(svc);
        setFormData({
            TenDichVu: svc.TenDichVu,
            DonGia: svc.DonGia,
            LoaiDichVu: svc.LoaiDichVu,
            MoTa: svc.MoTa || '',
            TrangThai: svc.TrangThai,
        });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            if (editingService) {
                const res = await axios.put(`/admin/services/${editingService.MaDichVu}`, formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setServiceList((prev) =>
                        prev.map((item) =>
                            item.MaDichVu === editingService.MaDichVu ? res.data.data : item
                        )
                    );
                    setModalOpen(false);
                }
            } else {
                const res = await axios.post('/admin/services', formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setServiceList((prev) => [...prev, res.data.data]);
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu dịch vụ.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'KHAM_BENH': return 'Khám bệnh';
            case 'XET_NGHIEM': return 'Xét nghiệm';
            case 'CHAN_DOAN_HINH_ANH': return 'Chẩn đoán hình ảnh';
            case 'THAM_DO_CHUC_NANG': return 'Thăm dò chức năng';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'KHAM_BENH': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'XET_NGHIEM': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'CHAN_DOAN_HINH_ANH': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'THAM_DO_CHUC_NANG': return 'bg-teal-50 text-teal-700 border-teal-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Danh mục Dịch vụ Khám & Cận lâm sàng
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Thiết lập bảng giá dịch vụ kỹ thuật, xét nghiệm và thăm dò chức năng.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Dịch vụ
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Thanh tìm kiếm & bộ lọc */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo tên dịch vụ, mô tả..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">Tất cả loại dịch vụ</option>
                        <option value="KHAM_BENH">Khám bệnh</option>
                        <option value="XET_NGHIEM">Xét nghiệm</option>
                        <option value="CHAN_DOAN_HINH_ANH">Chẩn đoán hình ảnh</option>
                        <option value="THAM_DO_CHUC_NANG">Thăm dò chức năng</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="HOAT_DONG">Đang hoạt động</option>
                        <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                    </select>
                </div>
            </div>

            {/* Bảng Dịch vụ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Mã</th>
                                <th className="px-5 py-4">Tên Dịch vụ</th>
                                <th className="px-5 py-4">Phân loại</th>
                                <th className="px-5 py-4 text-right">Đơn giá</th>
                                <th className="px-5 py-4 text-center">Trạng thái</th>
                                <th className="px-5 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedServices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                        Không tìm thấy dịch vụ nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                paginatedServices.map((svc) => (
                                    <tr key={svc.MaDichVu} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">
                                            #{svc.MaDichVu}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-slate-900">{svc.TenDichVu}</div>
                                            {svc.MoTa && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{svc.MoTa}</div>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getTypeColor(svc.LoaiDichVu)}`}>
                                                {getTypeName(svc.LoaiDichVu)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                                            {formatCurrency(svc.DonGia)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                                                svc.TrangThai === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {svc.TrangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleOpenEditModal(svc)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors"
                                            >
                                                <Edit className="w-3.5 h-3.5" /> Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredServices.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* Modal Thêm / Sửa Dịch vụ */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingService ? `Chỉnh sửa Dịch vụ #${editingService.MaDichVu}` : 'Thêm Dịch vụ mới'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Tên Dịch vụ <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.TenDichVu}
                                    onChange={(e) => setFormData({ ...formData, TenDichVu: e.target.value })}
                                    placeholder="Xét nghiệm máu tổng quát..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Đơn giá (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={1000}
                                        value={formData.DonGia}
                                        onChange={(e) => setFormData({ ...formData, DonGia: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Phân loại <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.LoaiDichVu}
                                        onChange={(e) => setFormData({ ...formData, LoaiDichVu: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                    >
                                        <option value="KHAM_BENH">Khám bệnh</option>
                                        <option value="XET_NGHIEM">Xét nghiệm</option>
                                        <option value="CHAN_DOAN_HINH_ANH">CĐ hình ảnh</option>
                                        <option value="THAM_DO_CHUC_NANG">Thăm dò chức năng</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Mô tả dịch vụ
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.MoTa}
                                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                                    placeholder="Mô tả kỹ thuật, hướng dẫn chuẩn bị..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Trạng thái hoạt động
                                </label>
                                <select
                                    value={formData.TrangThai}
                                    onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="HOAT_DONG">Đang hoạt động</option>
                                    <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingService ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
