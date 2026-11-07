import { useState, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Plus, 
    Edit, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Briefcase,
    FlaskConical,
    KeyRound,
    ShieldCheck,
    Lock,
    Unlock,
    UserPlus
} from 'lucide-react';
import axios from 'axios';
import AdminPagination from '@/Components/AdminPagination';

export interface TaiKhoanItem {
    MaTaiKhoan: number;
    TenDangNhap: string;
    Email: string;
    TrangThai: string;
}

export interface StaffItem {
    MaNhanVien: number;
    MaTaiKhoan?: number;
    HoTen: string;
    LoaiNhanVien: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
    CCCD?: string;
    NgaySinh?: string;
    GioiTinh: string;
    DiaChi?: string;
    NgayVaoLam?: string;
    GhiChu?: string;
    TrangThai: string;
    tai_khoan?: TaiKhoanItem;
}

export interface StaffStats {
    total: number;
    receptionists: number;
    clsStaff: number;
    withAccount: number;
    withoutAccount: number;
}

export interface StaffTabProps {
    staffs: StaffItem[];
    stats?: StaffStats;
    filters?: {
        search?: string;
        type?: string;
        status?: string;
        has_account?: string;
    };
}

function convertToUsername(str: string, type: string): string {
    const prefix = type === 'LE_TAN' ? 'letan_' : (type === 'CAN_LAM_SANG' ? 'cls_' : 'nv_');
    const slug = str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return `${prefix}${slug}`;
}

export default function StaffTab({ staffs = [], stats, filters = {} }: StaffTabProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [accountFilter, setAccountFilter] = useState(filters.has_account || '');

    const [staffList, setStaffList] = useState<StaffItem[]>(staffs);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal cấp tài khoản nhanh
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [selectedStaffForAccount, setSelectedStaffForAccount] = useState<StaffItem | null>(null);
    const [accountFormData, setAccountFormData] = useState({
        username: '',
        password: 'SmartCare@2026',
        email: '',
    });

    const filteredStaffs = useMemo(() => {
        return staffList.filter((item) => {
            const matchesSearch = !search || 
                item.HoTen.toLowerCase().includes(search.toLowerCase()) ||
                (item.SoDienThoai && item.SoDienThoai.includes(search)) ||
                (item.CCCD && item.CCCD.includes(search)) ||
                (item.tai_khoan?.TenDangNhap && item.tai_khoan.TenDangNhap.toLowerCase().includes(search.toLowerCase()));
            const matchesType = !typeFilter || item.LoaiNhanVien === typeFilter;
            const matchesStatus = !statusFilter || item.TrangThai === statusFilter;
            const matchesAccount = !accountFilter || 
                (accountFilter === 'yes' ? Boolean(item.MaTaiKhoan) : !item.MaTaiKhoan);
            return matchesSearch && matchesType && matchesStatus && matchesAccount;
        });
    }, [staffList, search, typeFilter, statusFilter, accountFilter]);

    const paginatedStaffs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredStaffs.slice(start, start + pageSize);
    }, [filteredStaffs, currentPage, pageSize]);

    // Form state thêm / sửa nhân sự
    const [formData, setFormData] = useState({
        HoTen: '',
        LoaiNhanVien: 'LE_TAN',
        SoDienThoai: '',
        EmailLienHe: '',
        CCCD: '',
        NgaySinh: '',
        GioiTinh: 'NU',
        DiaChi: '',
        NgayVaoLam: new Date().toISOString().split('T')[0],
        GhiChu: '',
        TrangThai: 'DANG_LAM_VIEC',
        create_account: true,
        username: '',
        password: 'SmartCare@2026',
    });

    const handleOpenCreateModal = () => {
        setEditingStaff(null);
        setFormData({
            HoTen: '',
            LoaiNhanVien: 'LE_TAN',
            SoDienThoai: '',
            EmailLienHe: '',
            CCCD: '',
            NgaySinh: '',
            GioiTinh: 'NU',
            DiaChi: '',
            NgayVaoLam: new Date().toISOString().split('T')[0],
            GhiChu: '',
            TrangThai: 'DANG_LAM_VIEC',
            create_account: true,
            username: '',
            password: 'SmartCare@2026',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (staff: StaffItem) => {
        setEditingStaff(staff);
        setFormData({
            HoTen: staff.HoTen,
            LoaiNhanVien: staff.LoaiNhanVien,
            SoDienThoai: staff.SoDienThoai || '',
            EmailLienHe: staff.EmailLienHe || '',
            CCCD: staff.CCCD || '',
            NgaySinh: staff.NgaySinh || '',
            GioiTinh: staff.GioiTinh || 'NAM',
            DiaChi: staff.DiaChi || '',
            NgayVaoLam: staff.NgayVaoLam || '',
            GhiChu: staff.GhiChu || '',
            TrangThai: staff.TrangThai,
            create_account: false,
            username: '',
            password: '',
        });
        setModalOpen(true);
    };

    const handleNameChange = (name: string) => {
        const newUsername = convertToUsername(name, formData.LoaiNhanVien);
        const newEmail = name.trim() ? `${newUsername.replace('_', '.')}@smartcare.vn` : '';
        setFormData(prev => ({
            ...prev,
            HoTen: name,
            username: prev.create_account && !editingStaff ? newUsername : prev.username,
            EmailLienHe: prev.EmailLienHe === '' || prev.EmailLienHe.includes('@smartcare.vn') ? newEmail : prev.EmailLienHe,
        }));
    };

    const handleTypeChange = (type: string) => {
        const newUsername = convertToUsername(formData.HoTen, type);
        setFormData(prev => ({
            ...prev,
            LoaiNhanVien: type,
            username: prev.create_account && !editingStaff ? newUsername : prev.username,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            if (editingStaff) {
                const res = await axios.put(`/admin/staffs/${editingStaff.MaNhanVien}`, formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setStaffList(prev =>
                        prev.map(item => item.MaNhanVien === editingStaff.MaNhanVien ? res.data.data : item)
                    );
                    setModalOpen(false);
                }
            } else {
                const res = await axios.post('/admin/staffs', formData);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    setStaffList(prev => [res.data.data, ...prev]);
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ nhân viên.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (staff: StaffItem) => {
        const actionText = staff.TrangThai === 'DANG_LAM_VIEC' ? 'chuyển sang nghỉ việc' : 'kích hoạt lại làm việc';
        if (!confirm(`Bạn có chắc muốn ${actionText} cho nhân viên [${staff.HoTen}] không?`)) {
            return;
        }

        try {
            const res = await axios.post(`/admin/staffs/${staff.MaNhanVien}/toggle`);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: res.data.message });
                setStaffList(prev =>
                    prev.map(item => item.MaNhanVien === staff.MaNhanVien ? res.data.data : item)
                );
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể đổi trạng thái nhân viên.';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const handleOpenQuickAccount = (staff: StaffItem) => {
        setSelectedStaffForAccount(staff);
        setAccountFormData({
            username: convertToUsername(staff.HoTen, staff.LoaiNhanVien),
            password: 'SmartCare@2026',
            email: staff.EmailLienHe || `${convertToUsername(staff.HoTen, staff.LoaiNhanVien).replace('_', '.')}@smartcare.vn`,
        });
        setAccountModalOpen(true);
    };

    const handleCreateQuickAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaffForAccount) return;
        setSubmitting(true);

        try {
            const res = await axios.post(`/admin/staffs/${selectedStaffForAccount.MaNhanVien}/account`, accountFormData);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: res.data.message });
                setStaffList(prev =>
                    prev.map(item => item.MaNhanVien === selectedStaffForAccount.MaNhanVien ? res.data.data : item)
                );
                setAccountModalOpen(false);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể tạo tài khoản cho nhân viên.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const getDepartmentBadge = (type: string) => {
        switch (type) {
            case 'LE_TAN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-semibold rounded-xl text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                        Lễ tân tiếp đón
                    </span>
                );
            case 'CAN_LAM_SANG':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 font-semibold rounded-xl text-xs">
                        <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                        Cận lâm sàng & KTV
                    </span>
                );
            case 'DUOC_SI':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold rounded-xl text-xs">
                        Dược sĩ nhà thuốc
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 font-medium rounded-xl text-xs">
                        Hành chính
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Nhân sự Hành chính & Kỹ thuật
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý hồ sơ Lễ tân, Kỹ thuật viên Cận lâm sàng, Dược sĩ và cấp tài khoản đăng nhập.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm nhân viên mới
                </button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
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
                        placeholder="Tìm kiếm họ tên, SĐT, CCCD, tài khoản..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                    >
                        <option value="">Tất cả bộ phận</option>
                        <option value="LE_TAN">Lễ tân tiếp đón</option>
                        <option value="CAN_LAM_SANG">Cận lâm sàng & Xét nghiệm</option>
                        <option value="DUOC_SI">Dược sĩ</option>
                    </select>

                    <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                    >
                        <option value="">Tài khoản: Tất cả</option>
                        <option value="yes">Đã có tài khoản</option>
                        <option value="no">Chưa có tài khoản</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-5 py-4">Mã NV</th>
                                <th className="px-5 py-4">Nhân viên</th>
                                <th className="px-5 py-4">Bộ phận</th>
                                <th className="px-5 py-4">Liên hệ</th>
                                <th className="px-5 py-4">Tài khoản hệ thống</th>
                                <th className="px-5 py-4 text-center">Trạng thái</th>
                                <th className="px-5 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {paginatedStaffs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                                        Không tìm thấy hồ sơ nhân viên nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                paginatedStaffs.map((staff) => (
                                    <tr key={staff.MaNhanVien} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3.5 font-mono font-bold text-slate-400">
                                            #{staff.MaNhanVien}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {staff.HoTen.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{staff.HoTen}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono">
                                                        {staff.CCCD ? `CCCD: ${staff.CCCD}` : staff.GioiTinh === 'NU' ? 'Nữ' : 'Nam'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {getDepartmentBadge(staff.LoaiNhanVien)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-slate-800 font-medium">{staff.SoDienThoai || 'Chưa cập nhật'}</div>
                                            <div className="text-slate-500 text-[11px] font-mono">{staff.EmailLienHe}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {staff.tai_khoan ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-mono text-xs font-semibold">
                                                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>{staff.tai_khoan.TenDangNhap}</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenQuickAccount(staff)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                                                    Cấp tài khoản
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {staff.TrangThai === 'DANG_LAM_VIEC' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[11px]">
                                                    <ShieldCheck className="w-3 h-3" /> Đang làm việc
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 font-semibold rounded-full text-[11px]">
                                                    <Lock className="w-3 h-3" /> Đã nghỉ việc
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEditModal(staff)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa thông tin"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(staff)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        staff.TrangThai === 'DANG_LAM_VIEC'
                                                            ? 'text-rose-600 hover:bg-rose-50'
                                                            : 'text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    title={staff.TrangThai === 'DANG_LAM_VIEC' ? 'Cho nghỉ việc' : 'Kích hoạt lại'}
                                                >
                                                    {staff.TrangThai === 'DANG_LAM_VIEC' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <AdminPagination
                    currentPage={currentPage}
                    totalItems={filteredStaffs.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* Modal Thêm / Sửa Nhân viên */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingStaff ? `Chỉnh sửa nhân viên #${editingStaff.MaNhanVien}` : 'Thêm mới nhân viên'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Họ và tên nhân viên <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.HoTen}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ví dụ: Lê Thị Hoa"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Bộ phận / Chức vụ <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.LoaiNhanVien}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                                    >
                                        <option value="LE_TAN">Lễ tân tiếp đón</option>
                                        <option value="CAN_LAM_SANG">Cận lâm sàng & Xét nghiệm</option>
                                        <option value="DUOC_SI">Dược sĩ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Giới tính
                                    </label>
                                    <select
                                        value={formData.GioiTinh}
                                        onChange={(e) => setFormData(prev => ({ ...prev, GioiTinh: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    >
                                        <option value="NAM">Nam</option>
                                        <option value="NU">Nữ</option>
                                        <option value="KHAC">Khác</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.SoDienThoai}
                                        onChange={(e) => setFormData(prev => ({ ...prev, SoDienThoai: e.target.value }))}
                                        placeholder="0912..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Số CCCD
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.CCCD}
                                        onChange={(e) => setFormData(prev => ({ ...prev, CCCD: e.target.value }))}
                                        placeholder="001..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Email liên hệ
                                </label>
                                <input
                                    type="email"
                                    value={formData.EmailLienHe}
                                    onChange={(e) => setFormData(prev => ({ ...prev, EmailLienHe: e.target.value }))}
                                    placeholder="letan@smartcare.vn"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Trạng thái làm việc
                                </label>
                                <select
                                    value={formData.TrangThai}
                                    onChange={(e) => setFormData(prev => ({ ...prev, TrangThai: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                                >
                                    <option value="DANG_LAM_VIEC">Đang làm việc</option>
                                    <option value="NGHI_VIEC">Đã nghỉ việc</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-sm transition-all flex items-center gap-2"
                                >
                                    {submitting ? 'Đang lưu...' : (editingStaff ? 'Cập nhật hồ sơ' : 'Thêm nhân viên')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Account Modal */}
            {accountModalOpen && selectedStaffForAccount && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Cấp tài khoản đăng nhập</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Nhân sự: <strong>{selectedStaffForAccount.HoTen}</strong></p>
                            </div>
                            <button onClick={() => setAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateQuickAccount} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Tên đăng nhập <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountFormData.username}
                                    onChange={(e) => setAccountFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountFormData.password}
                                    onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAccountModalOpen(false)}
                                    className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-sm transition-all"
                                >
                                    {submitting ? 'Đang cấp...' : 'Xác nhận cấp tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
