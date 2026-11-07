import { useState, useMemo } from 'react';
import { 
    HeartPulse, 
    Search, 
    Plus, 
    Edit, 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    X,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import AdminPagination from '@/Components/AdminPagination';

export interface DoctorBrief {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    TrangThai: string;
}

export interface SpecialtyData {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
    MoTa?: string;
    TrangThai: string;
    bac_sis_count?: number;
    bacSis?: DoctorBrief[];
}

export interface SpecialtiesTabProps {
    specialties: SpecialtyData[];
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function SpecialtiesTab({ specialties = [], filters = {} }: SpecialtiesTabProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [specialtyList, setSpecialtyList] = useState<SpecialtyData[]>(specialties);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const filteredSpecialties = useMemo(() => {
        return specialtyList.filter((item) => {
            const matchesSearch = !search || 
                item.TenChuyenKhoa.toLowerCase().includes(search.toLowerCase()) ||
                (item.MoTa && item.MoTa.toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = !statusFilter || item.TrangThai === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [specialtyList, search, statusFilter]);

    const paginatedSpecialties = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSpecialties.slice(start, start + pageSize);
    }, [filteredSpecialties, currentPage, pageSize]);

    const [formData, setFormData] = useState({
        TenChuyenKhoa: '',
        MoTa: '',
        TrangThai: 'HOAT_DONG',
    });

    const handleOpenCreateModal = () => {
        setEditingSpecialty(null);
        setFormData({
            TenChuyenKhoa: '',
            MoTa: '',
            TrangThai: 'HOAT_DONG',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (spec: SpecialtyData) => {
        setEditingSpecialty(spec);
        setFormData({
            TenChuyenKhoa: spec.TenChuyenKhoa,
            MoTa: spec.MoTa || '',
            TrangThai: spec.TrangThai,
        });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            if (editingSpecialty) {
                const res = await axios.put(`/admin/specialties/${editingSpecialty.MaChuyenKhoa}`, formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setSpecialtyList((prev) =>
                        prev.map((item) =>
                            item.MaChuyenKhoa === editingSpecialty.MaChuyenKhoa ? res.data.data : item
                        )
                    );
                    setModalOpen(false);
                }
            } else {
                const res = await axios.post('/admin/specialties', formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setSpecialtyList((prev) => [...prev, res.data.data]);
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu chuyên khoa.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-rose-500" />
                        Danh mục Chuyên khoa Khám chữa bệnh
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Cấu hình các chuyên khoa y tế, quy mô bác sĩ và trạng thái hoạt động.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Chuyên khoa
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
                        placeholder="Tìm kiếm theo tên chuyên khoa, mô tả..."
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
                </div>
            </div>

            {/* Grid Chuyên khoa */}
            {paginatedSpecialties.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                    Không tìm thấy chuyên khoa nào phù hợp.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedSpecialties.map((spec) => {
                        const isWorking = spec.TrangThai === 'HOAT_DONG';

                        return (
                            <div
                                key={spec.MaChuyenKhoa}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base">
                                            <HeartPulse className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                            isWorking ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {isWorking ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">{spec.TenChuyenKhoa}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                            {spec.MoTa || 'Chẩn đoán và điều trị bệnh chuyên khoa.'}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
                                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Đội ngũ: <strong>{spec.bac_sis_count ?? spec.bacSis?.length ?? 0} Bác sĩ</strong></span>
                                    </div>
                                </div>

                                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        onClick={() => handleOpenEditModal(spec)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredSpecialties.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* Modal Thêm / Sửa Chuyên khoa */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingSpecialty ? `Chỉnh sửa Chuyên khoa #${editingSpecialty.MaChuyenKhoa}` : 'Thêm Chuyên khoa mới'}
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
                                    Tên Chuyên khoa <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.TenChuyenKhoa}
                                    onChange={(e) => setFormData({ ...formData, TenChuyenKhoa: e.target.value })}
                                    placeholder="Nội tổng quát, Tai mũi họng..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Mô tả chuyên khoa
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.MoTa}
                                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                                    placeholder="Mô tả chức năng khám và phạm vi điều trị..."
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
                                    {editingSpecialty ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
