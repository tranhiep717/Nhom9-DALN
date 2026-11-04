import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Building2, 
    Search, 
    Plus, 
    Edit, 
    TestTube2, 
    Activity, 
    CheckCircle2, 
    AlertCircle, 
    X,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { adminNavItems } from './Dashboard';

interface ServiceItem {
    MaDichVu: number;
    TenDichVu: string;
    DonGia: number;
    LoaiDichVu: string; // 'KHAM_BENH', 'XET_NGHIEM', 'CHAN_DOAN_HINH_ANH', 'THAM_DO_CHUC_NANG'
    MoTa?: string;
    TrangThai: string; // 'HOAT_DONG', 'NGUNG_HOAT_DONG'
}

interface ServicesProps {
    auth: any;
    services: ServiceItem[];
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function AdminServices({ auth, services = [], filters = {} }: ServicesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [serviceList, setServiceList] = useState<ServiceItem[]>(services);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [formData, setFormData] = useState({
        TenDichVu: '',
        DonGia: 150000,
        LoaiDichVu: 'XET_NGHIEM',
        MoTa: '',
        TrangThai: 'HOAT_DONG',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/services', {
            search: search || undefined,
            type: typeFilter || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

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
            case 'KHAM_BENH': return 'Khám bệnh chuyên khoa';
            case 'XET_NGHIEM': return 'Xét nghiệm huyết học / sinh hóa';
            case 'CHAN_DOAN_HINH_ANH': return 'Chẩn đoán hình ảnh (X-quang, Siêu âm, CT)';
            case 'THAM_DO_CHUC_NANG': return 'Thăm dò chức năng (Điện tim, Nội soi)';
            default: return type;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Dịch vụ"
        >
            <Head title="Quản lý Dịch vụ y tế - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh mục Dịch vụ Khám & Cận lâm sàng</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Thiết lập bảng giá dịch vụ kỹ thuật, xét nghiệm và thăm dò chức năng.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Dịch vụ mới
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
                <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm theo Tên dịch vụ, mô tả..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="HOAT_DONG">Đang hoạt động</option>
                            <option value="NGUNG_HOAT_DONG">Ngừng hoạt động</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Bảng Dịch vụ */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã DV</th>
                                    <th className="px-6 py-4 font-semibold">Tên dịch vụ</th>
                                    <th className="px-6 py-4 font-semibold">Phân loại</th>
                                    <th className="px-6 py-4 font-semibold text-right">Đơn giá niêm yết</th>
                                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {serviceList.map((svc) => (
                                    <tr key={svc.MaDichVu} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-teal-700">
                                            #{svc.MaDichVu}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <p className="text-sm">{svc.TenDichVu}</p>
                                            <p className="text-slate-400 font-normal text-[11px] truncate max-w-sm">{svc.MoTa || 'Dịch vụ y tế chuẩn kỹ thuật'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="font-semibold text-slate-800">{getTypeName(svc.LoaiDichVu)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-indigo-700">
                                            {formatCurrency(svc.DonGia)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {svc.TrangThai === 'HOAT_DONG' ? (
                                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Hoạt động</span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Ngừng cung cấp</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenEditModal(svc)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Sửa thông tin & Giá"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Thêm / Sửa Dịch vụ */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingService ? `Cập nhật dịch vụ #${editingService.MaDichVu}` : 'Thêm Dịch vụ mới'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Tên dịch vụ y tế <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.TenDichVu}
                                    onChange={(e) => setFormData({ ...formData, TenDichVu: e.target.value })}
                                    placeholder="Nội soi dạ dày, Tổng phân tích máu..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Đơn giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    required
                                    value={formData.DonGia}
                                    onChange={(e) => setFormData({ ...formData, DonGia: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Phân loại dịch vụ
                                </label>
                                <select
                                    value={formData.LoaiDichVu}
                                    onChange={(e) => setFormData({ ...formData, LoaiDichVu: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="KHAM_BENH">Khám bệnh chuyên khoa</option>
                                    <option value="XET_NGHIEM">Xét nghiệm</option>
                                    <option value="CHAN_DOAN_HINH_ANH">Chẩn đoán hình ảnh</option>
                                    <option value="THAM_DO_CHUC_NANG">Thăm dò chức năng</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Mô tả dịch vụ
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.MoTa}
                                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                                    placeholder="Quy trình thực hiện, thiết bị sử dụng..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Trạng thái
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
                                    {editingService ? 'Cập nhật' : 'Thêm dịch vụ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
