import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Stethoscope, 
    Search, 
    Filter, 
    Plus, 
    Edit, 
    Trash2, 
    Phone, 
    Mail, 
    Award, 
    CheckCircle2, 
    AlertCircle, 
    X,
    UserCheck,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { adminNavItems } from './Dashboard';

interface SpecialtyItem {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
}

interface DoctorItem {
    MaBacSi: number;
    MaTaiKhoan?: number;
    MaChuyenKhoa?: number;
    HoTen: string;
    HocVi?: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
    KinhNghiem?: number;
    MoTa?: string;
    TrangThai: string; // 'HOAT_DONG', 'DANG_LAM_VIEC', 'NGHI_PHEP', 'NGHI_VIEC'
    chuyen_khoa?: SpecialtyItem;
}

interface AdminDoctorsProps {
    auth: any;
    doctors: DoctorItem[];
    chuyenKhoas: SpecialtyItem[];
    filters: {
        search?: string;
        specialty_id?: string;
        status?: string;
    };
}

export default function AdminDoctors({ auth, doctors = [], chuyenKhoas = [], filters = {} }: AdminDoctorsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [specialtyFilter, setSpecialtyFilter] = useState(filters.specialty_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [doctorList, setDoctorList] = useState<DoctorItem[]>(doctors);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<DoctorItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [formData, setFormData] = useState({
        HoTen: '',
        HocVi: 'BS',
        MaChuyenKhoa: chuyenKhoas[0]?.MaChuyenKhoa || 1,
        SoDienThoai: '',
        EmailLienHe: '',
        KinhNghiem: 3,
        MoTa: '',
        TrangThai: 'HOAT_DONG',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/doctors', {
            search: search || undefined,
            specialty_id: specialtyFilter || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleOpenCreateModal = () => {
        setEditingDoctor(null);
        setFormData({
            HoTen: '',
            HocVi: 'BS',
            MaChuyenKhoa: chuyenKhoas[0]?.MaChuyenKhoa || 1,
            SoDienThoai: '',
            EmailLienHe: '',
            KinhNghiem: 3,
            MoTa: '',
            TrangThai: 'HOAT_DONG',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (doc: DoctorItem) => {
        setEditingDoctor(doc);
        setFormData({
            HoTen: doc.HoTen,
            HocVi: doc.HocVi || 'BS',
            MaChuyenKhoa: doc.MaChuyenKhoa || chuyenKhoas[0]?.MaChuyenKhoa || 1,
            SoDienThoai: doc.SoDienThoai || '',
            EmailLienHe: doc.EmailLienHe || '',
            KinhNghiem: doc.KinhNghiem || 1,
            MoTa: doc.MoTa || '',
            TrangThai: doc.TrangThai || 'HOAT_DONG',
        });
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            if (editingDoctor) {
                // Update
                const res = await axios.put(`/admin/doctors/${editingDoctor.MaBacSi}`, formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setDoctorList((prev) =>
                        prev.map((item) =>
                            item.MaBacSi === editingDoctor.MaBacSi ? res.data.data : item
                        )
                    );
                    setModalOpen(false);
                }
            } else {
                // Create
                const res = await axios.post('/admin/doctors', formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setDoctorList((prev) => [res.data.data, ...prev]);
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu bác sĩ.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (doc: DoctorItem) => {
        if (!confirm(`Bạn có chắc muốn chuyển Bác sĩ [${doc.HoTen}] sang trạng thái NGỪNG LÀM VIỆC? (Hồ sơ lịch sử khám vẫn được bảo toàn 100%)`)) {
            return;
        }

        setFeedback(null);
        try {
            const res = await axios.delete(`/admin/doctors/${doc.MaBacSi}`);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: res.data.message });
                setDoctorList((prev) =>
                    prev.map((item) =>
                        item.MaBacSi === doc.MaBacSi ? { ...item, TrangThai: 'NGHI_VIEC' } : item
                    )
                );
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái bác sĩ.';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'HOAT_DONG':
            case 'DANG_LAM_VIEC':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đang hoạt động</span>;
            case 'NGHI_PHEP':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Nghỉ phép</span>;
            case 'NGHI_VIEC':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Ngừng làm việc</span>;
            default:
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Bác sĩ"
        >
            <Head title="Quản lý Bác sĩ - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Đội ngũ Bác sĩ</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Phân công chuyên khoa, quản lý thông tin liên hệ và trạng thái công tác của bác sĩ.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Bác sĩ mới
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
                            placeholder="Tìm kiếm theo Tên, Học vị, SĐT, Email..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                        <select
                            value={specialtyFilter}
                            onChange={(e) => setSpecialtyFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả chuyên khoa</option>
                            {chuyenKhoas.map((ck) => (
                                <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                    {ck.TenChuyenKhoa}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="HOAT_DONG">Đang hoạt động</option>
                            <option value="NGHI_PHEP">Nghỉ phép</option>
                            <option value="NGHI_VIEC">Ngừng làm việc</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Bảng Bác sĩ */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã BS</th>
                                    <th className="px-6 py-4 font-semibold">Bác sĩ</th>
                                    <th className="px-6 py-4 font-semibold">Chuyên khoa</th>
                                    <th className="px-6 py-4 font-semibold">Liên hệ</th>
                                    <th className="px-6 py-4 font-semibold text-center">Kinh nghiệm</th>
                                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {doctorList.map((doc) => (
                                    <tr key={doc.MaBacSi} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-teal-700">
                                            #{doc.MaBacSi}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                                                    {doc.HoTen.charAt(doc.HoTen.lastIndexOf(' ') + 1) || 'BS'}
                                                </div>
                                                <div>
                                                    <p>{doc.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc.HoTen}</p>
                                                    <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{doc.MoTa || 'Bác sĩ chuyên khoa'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {doc.chuyen_khoa?.TenChuyenKhoa || 'Đa khoa'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-800 font-mono">{doc.SoDienThoai || '--'}</p>
                                            <p className="text-slate-400 text-[11px] font-mono">{doc.EmailLienHe || '--'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-slate-700">
                                                {doc.KinhNghiem ? `${doc.KinhNghiem} năm` : '--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(doc.TrangThai)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(doc)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa thông tin"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {doc.TrangThai !== 'NGHI_VIEC' && (
                                                    <button
                                                        onClick={() => handleDeactivate(doc)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Ngừng công tác"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Thêm / Sửa Bác sĩ */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingDoctor ? `Chỉnh sửa Bác sĩ #${editingDoctor.MaBacSi}` : 'Thêm Bác sĩ mới'}
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
                                    Họ và tên Bác sĩ <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.HoTen}
                                    onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Học vị
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.HocVi}
                                        onChange={(e) => setFormData({ ...formData, HocVi: e.target.value })}
                                        placeholder="ThS, BS.CKI, PGS.TS..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số năm kinh nghiệm
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.KinhNghiem}
                                        onChange={(e) => setFormData({ ...formData, KinhNghiem: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Chuyên khoa phụ trách <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.MaChuyenKhoa}
                                    onChange={(e) => setFormData({ ...formData, MaChuyenKhoa: Number(e.target.value) })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    {chuyenKhoas.map((ck) => (
                                        <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                            {ck.TenChuyenKhoa}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.SoDienThoai}
                                        onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
                                        placeholder="0912345678"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Email liên hệ
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.EmailLienHe}
                                        onChange={(e) => setFormData({ ...formData, EmailLienHe: e.target.value })}
                                        placeholder="doctor@smartcare.vn"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Mô tả chuyên môn
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.MoTa}
                                    onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                                    placeholder="Kinh nghiệm khám và điều trị..."
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Trạng thái công tác
                                </label>
                                <select
                                    value={formData.TrangThai}
                                    onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="HOAT_DONG">Đang hoạt động</option>
                                    <option value="NGHI_PHEP">Nghỉ phép</option>
                                    <option value="NGHI_VIEC">Ngừng làm việc</option>
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
                                    {editingDoctor ? 'Cập nhật' : 'Thêm bác sĩ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
