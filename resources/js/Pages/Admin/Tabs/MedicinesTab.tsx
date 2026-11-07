import { useState, useMemo } from 'react';
import { 
    Pill, 
    Search, 
    Plus, 
    Edit, 
    AlertCircle, 
    CheckCircle2, 
    X,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import AdminPagination from '@/Components/AdminPagination';

export interface MedicineItem {
    MaThuoc: number;
    TenThuoc: string;
    HoatChat?: string;
    DonViTinh?: string;
    DangBaoChe?: string;
    GiaBan: number;
    SoLuongTon: number;
    TrangThai: string; // 'HOAT_DONG', 'NGUNG_SU_DUNG'
}

export interface MedicinesTabProps {
    medicines: MedicineItem[];
    filters?: {
        search?: string;
        dang_bao_che?: string;
        status?: string;
    };
}

export default function MedicinesTab({ medicines = [], filters = {} }: MedicinesTabProps) {
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

    const filteredMedicines = useMemo(() => {
        return medList.filter((item) => {
            const matchesSearch = !search || 
                item.TenThuoc.toLowerCase().includes(search.toLowerCase()) ||
                (item.HoatChat && item.HoatChat.toLowerCase().includes(search.toLowerCase()));
            const matchesDosage = !dosageFilter || item.DangBaoChe === dosageFilter;
            const matchesStatus = !statusFilter || item.TrangThai === statusFilter;
            return matchesSearch && matchesDosage && matchesStatus;
        });
    }, [medList, search, dosageFilter, statusFilter]);

    const paginatedMedicines = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMedicines.slice(start, start + pageSize);
    }, [filteredMedicines, currentPage, pageSize]);

    const [formData, setFormData] = useState({
        TenThuoc: '',
        HoatChat: '',
        DonViTinh: 'Viên',
        DangBaoChe: 'Viên nén',
        GiaBan: 5000,
        SoLuongTon: 100,
        TrangThai: 'HOAT_DONG',
    });

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-emerald-600" />
                        Danh mục & Kho Dược phẩm
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý giá niêm yết, số lượng tồn kho dược phẩm và trạng thái lưu hành.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Thuốc mới
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
                        placeholder="Tìm kiếm theo Tên thuốc, Hoạt chất..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                    <select
                        value={dosageFilter}
                        onChange={(e) => setDosageFilter(e.target.value)}
                        className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">Tất cả dạng bào chế</option>
                        <option value="Viên nén">Viên nén</option>
                        <option value="Viên nang">Viên nang</option>
                        <option value="Siro">Siro</option>
                        <option value="Dung dịch">Dung dịch</option>
                        <option value="Thuốc mỡ">Thuốc mỡ</option>
                        <option value="Bột pha hỗn dịch">Bột pha</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="HOAT_DONG">Đang lưu hành</option>
                        <option value="NGUNG_SU_DUNG">Ngừng sử dụng</option>
                    </select>
                </div>
            </div>

            {/* Bảng Thuốc */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Mã</th>
                                <th className="px-5 py-4">Tên Thuốc / Hoạt chất</th>
                                <th className="px-5 py-4">Dạng / ĐVT</th>
                                <th className="px-5 py-4 text-right">Đơn giá</th>
                                <th className="px-5 py-4 text-center">Tồn kho</th>
                                <th className="px-5 py-4 text-center">Trạng thái</th>
                                <th className="px-5 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedMedicines.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                        Không tìm thấy thuốc nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                paginatedMedicines.map((med) => (
                                    <tr key={med.MaThuoc} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">
                                            #{med.MaThuoc}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-slate-900">{med.TenThuoc}</div>
                                            {med.HoatChat && <div className="text-xs text-slate-400 mt-0.5">{med.HoatChat}</div>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {med.DangBaoChe || 'Khác'} ({med.DonViTinh || 'Đơn vị'})
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                                            {formatCurrency(med.GiaBan)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                                                med.SoLuongTon > 50 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : med.SoLuongTon > 0 
                                                        ? 'bg-amber-100 text-amber-800' 
                                                        : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {med.SoLuongTon}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                                                med.TrangThai === 'HOAT_DONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {med.TrangThai === 'HOAT_DONG' ? 'Lưu hành' : 'Ngừng'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleOpenEditModal(med)}
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
                    totalItems={filteredMedicines.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* Modal Thêm / Sửa Thuốc */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingMed ? `Chỉnh sửa Thuốc #${editingMed.MaThuoc}` : 'Nhập Thuốc mới'}
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
                                    Tên thuốc biệt dược <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.TenThuoc}
                                    onChange={(e) => setFormData({ ...formData, TenThuoc: e.target.value })}
                                    placeholder="Paracetamol 500mg, Panadol Extra..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Hoạt chất chính & Hàm lượng
                                </label>
                                <input
                                    type="text"
                                    value={formData.HoatChat}
                                    onChange={(e) => setFormData({ ...formData, HoatChat: e.target.value })}
                                    placeholder="Paracetamol 500mg, Caffeine 65mg..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Đơn vị tính <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.DonViTinh}
                                        onChange={(e) => setFormData({ ...formData, DonViTinh: e.target.value })}
                                        placeholder="Viên, Gói, Chai..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Dạng bào chế <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.DangBaoChe}
                                        onChange={(e) => setFormData({ ...formData, DangBaoChe: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                    >
                                        <option value="Viên nén">Viên nén</option>
                                        <option value="Viên nang">Viên nang</option>
                                        <option value="Siro">Siro</option>
                                        <option value="Dung dịch">Dung dịch</option>
                                        <option value="Thuốc mỡ">Thuốc mỡ</option>
                                        <option value="Bột pha hỗn dịch">Bột pha</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giá bán (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={500}
                                        value={formData.GiaBan}
                                        onChange={(e) => setFormData({ ...formData, GiaBan: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số lượng tồn kho <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={formData.SoLuongTon}
                                        onChange={(e) => setFormData({ ...formData, SoLuongTon: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Trạng thái lưu hành
                                </label>
                                <select
                                    value={formData.TrangThai}
                                    onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="HOAT_DONG">Đang lưu hành</option>
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
                                    {editingMed ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
