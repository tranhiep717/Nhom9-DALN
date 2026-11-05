import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Pill, 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    X,
    Package,
    Tag,
    Loader2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { adminNavItems } from '@/constants/navigation';
import AdminPagination from '@/Components/AdminPagination';

interface MedicineItem {
    MaThuoc: number;
    TenThuoc: string;
    HoatChat?: string;
    DonViTinh?: string;
    DangBaoChe?: string;
    GiaBan: number;
    SoLuongTon: number;
    TrangThai: string; // 'HOAT_DONG', 'NGUNG_SU_DUNG'
}

interface MedicinesProps {
    auth: any;
    medicines: MedicineItem[];
    filters: {
        search?: string;
        dang_bao_che?: string;
        status?: string;
    };
}

export default function AdminMedicines({ auth, medicines = [], filters = {} }: MedicinesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [dosageFilter, setDosageFilter] = useState(filters.dang_bao_che || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [medList, setMedList] = useState<MedicineItem[]>(medicines);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingMed, setEditingMed] = useState<MedicineItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const paginatedMedicines = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return medList.slice(start, start + pageSize);
    }, [medList, currentPage, pageSize]);

    const [formData, setFormData] = useState({
        TenThuoc: '',
        HoatChat: '',
        DonViTinh: 'Viên',
        DangBaoChe: 'Viên nén',
        GiaBan: 5000,
        SoLuongTon: 100,
        TrangThai: 'HOAT_DONG',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/medicines', {
            search: search || undefined,
            dang_bao_che: dosageFilter || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleOpenCreateModal = () => {
        setEditingMed(null);
        setFormData({
            TenThuoc: '',
            HoatChat: '',
            DonViTinh: 'Viên',
            DangBaoChe: 'Viên nén',
            GiaBan: 5000,
            SoLuongTon: 100,
            TrangThai: 'HOAT_DONG',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (med: MedicineItem) => {
        setEditingMed(med);
        setFormData({
            TenThuoc: med.TenThuoc,
            HoatChat: med.HoatChat || '',
            DonViTinh: med.DonViTinh || 'Viên',
            DangBaoChe: med.DangBaoChe || 'Viên nén',
            GiaBan: med.GiaBan,
            SoLuongTon: med.SoLuongTon,
            TrangThai: med.TrangThai,
        });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            if (editingMed) {
                const res = await axios.put(`/admin/medicines/${editingMed.MaThuoc}`, formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setMedList((prev) =>
                        prev.map((item) =>
                            item.MaThuoc === editingMed.MaThuoc ? res.data.data : item
                        )
                    );
                    setModalOpen(false);
                }
            } else {
                const res = await axios.post('/admin/medicines', formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setMedList((prev) => [res.data.data, ...prev]);
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thuốc.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý kho Thuốc"
        >
            <Head title="Quản lý kho Thuốc - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh mục & Tồn kho Thuốc</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Quản lý giá niêm yết, số lượng tồn kho dược phẩm và trạng thái lưu hành.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nhập thuốc mới
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
                            placeholder="Tìm kiếm theo Tên thuốc, Hoạt chất..."
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
                            <option value="NGUNG_SU_DUNG">Ngừng sử dụng</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Bảng Thuốc */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã</th>
                                    <th className="px-6 py-4 font-semibold">Tên thuốc & Hoạt chất</th>
                                    <th className="px-6 py-4 font-semibold">Dạng / Đơn vị</th>
                                    <th className="px-6 py-4 font-semibold text-right">Đơn giá bán</th>
                                    <th className="px-6 py-4 font-semibold text-center">Tồn kho</th>
                                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedMedicines.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Không tìm thấy loại thuốc nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedMedicines.map((med) => (
                                    <tr key={med.MaThuoc} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-teal-700">
                                            #{med.MaThuoc}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <p className="text-sm">{med.TenThuoc}</p>
                                            <p className="text-slate-400 font-normal text-[11px]">{med.HoatChat || 'Không ghi rõ hoạt chất'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="font-semibold text-slate-800">{med.DangBaoChe || 'Viên'}</span>
                                            <span className="text-slate-400 block text-[11px]">ĐVT: {med.DonViTinh || 'viên'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                            {formatCurrency(med.GiaBan ?? (med as any).DonGia ?? 0)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                                med.SoLuongTon > 10 ? 'bg-emerald-100 text-emerald-800' : med.SoLuongTon > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {med.SoLuongTon} {med.DonViTinh || 'viên'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {med.TrangThai === 'HOAT_DONG' || med.TrangThai === 'CON_HANG' ? (
                                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Hoạt động</span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Ngừng dùng</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenEditModal(med)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Sửa thông tin & Giá"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={medList.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            {/* Modal Thêm / Sửa Thuốc */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingMed ? `Cập nhật thuốc #${editingMed.MaThuoc}` : 'Thêm thuốc mới vào kho'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Tên biệt dược / Tên thuốc <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.TenThuoc}
                                    onChange={(e) => setFormData({ ...formData, TenThuoc: e.target.value })}
                                    placeholder="Paracetamol 500mg, Augmentin 1g..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Hoạt chất chính
                                </label>
                                <input
                                    type="text"
                                    value={formData.HoatChat}
                                    onChange={(e) => setFormData({ ...formData, HoatChat: e.target.value })}
                                    placeholder="Paracetamol, Amoxicillin + Clavulanic acid..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Đơn vị tính
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.DonViTinh}
                                        onChange={(e) => setFormData({ ...formData, DonViTinh: e.target.value })}
                                        placeholder="Viên, Vỉ, Chai, Gói..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Dạng bào chế
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.DangBaoChe}
                                        onChange={(e) => setFormData({ ...formData, DangBaoChe: e.target.value })}
                                        placeholder="Viên nén, Viên nang, Siro..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Đơn giá bán (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={formData.GiaBan}
                                        onChange={(e) => setFormData({ ...formData, GiaBan: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số lượng tồn kho <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={formData.SoLuongTon}
                                        onChange={(e) => setFormData({ ...formData, SoLuongTon: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
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
                                    <option value="NGUNG_SU_DUNG">Ngừng sử dụng</option>
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
                                    {editingMed ? 'Cập nhật' : 'Thêm vào kho'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
