import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Users, 
    Search, 
    Filter, 
    Plus, 
    Edit, 
    Lock, 
    Unlock, 
    KeyRound, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle, 
    X,
    Eye,
    EyeOff,
    Loader2,
    Stethoscope,
    UserCheck,
    Briefcase,
    FlaskConical
} from 'lucide-react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { adminNavItems } from '@/constants/navigation';
import AdminPagination from '@/Components/AdminPagination';

interface RoleItem {
    MaVaiTro: number;
    TenVaiTro: string;
    MoTa?: string;
}

interface DoctorItem {
    MaBacSi: number;
    MaTaiKhoan?: number;
    HoTen: string;
    MaChuyenKhoa: number;
    EmailLienHe?: string;
    SoDienThoai?: string;
    chuyen_khoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
}

interface StaffItem {
    MaNhanVien: number;
    MaTaiKhoan?: number;
    HoTen: string;
    LoaiNhanVien: string;
    SoDienThoai?: string;
    EmailLienHe?: string;
}

interface AccountItem {
    MaTaiKhoan: number;
    TenDangNhap: string;
    Email: string;
    TrangThai: string; // 'HOAT_DONG', 'KHOA'
    NgayTao: string;
    vai_tro?: RoleItem;
    bac_si?: DoctorItem;
    nhan_vien?: StaffItem;
}

interface AccountsProps {
    auth: any;
    users: AccountItem[];
    roles: RoleItem[];
    unlinkedDoctors?: DoctorItem[];
    unlinkedStaff?: StaffItem[];
    filters: {
        search?: string;
        role_id?: string;
        status?: string;
    };
}

function convertToUsername(str: string): string {
    return str
        .toLowerCase()
        .replace(/^(bs\.|bs|bác sĩ|ths\.|ths|ts\.|ts|ck1|ck2)\s+/gi, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

export default function Accounts({ auth, users = [], roles = [], unlinkedDoctors = [], unlinkedStaff = [], filters = {} }: AccountsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [accountList, setAccountList] = useState<AccountItem[]>(users);
    const [availableDoctors, setAvailableDoctors] = useState<DoctorItem[]>(unlinkedDoctors);
    const [availableStaff, setAvailableStaff] = useState<StaffItem[]>(unlinkedStaff);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const paginatedAccounts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return accountList.slice(start, start + pageSize);
    }, [accountList, currentPage, pageSize]);

    // Form state
    const [formData, setFormData] = useState({
        TenDangNhap: '',
        Email: '',
        MatKhau: '',
        MaVaiTro: roles[0]?.MaVaiTro || 3,
        TrangThai: 'HOAT_DONG',
        MaBacSi: '' as number | string,
        MaNhanVien: '' as number | string,
    });

    const isDoctorRole = useMemo(() => {
        const selectedRole = roles.find(r => r.MaVaiTro === Number(formData.MaVaiTro));
        return selectedRole?.TenVaiTro === 'BAC_SI' || Number(formData.MaVaiTro) === 2;
    }, [formData.MaVaiTro, roles]);

    const isReceptionistRole = useMemo(() => {
        const selectedRole = roles.find(r => r.MaVaiTro === Number(formData.MaVaiTro));
        return selectedRole?.TenVaiTro === 'LE_TAN' || Number(formData.MaVaiTro) === 4;
    }, [formData.MaVaiTro, roles]);

    const isClsRole = useMemo(() => {
        const selectedRole = roles.find(r => r.MaVaiTro === Number(formData.MaVaiTro));
        return selectedRole?.TenVaiTro === 'NHAN_VIEN_CAN_LAM_SANG' || Number(formData.MaVaiTro) === 5;
    }, [formData.MaVaiTro, roles]);

    const isStaffRole = isReceptionistRole || isClsRole;

    const doctorOptions = useMemo(() => {
        if (editingAccount && editingAccount.bac_si) {
            const exists = availableDoctors.some(d => d.MaBacSi === editingAccount.bac_si?.MaBacSi);
            if (!exists) {
                return [editingAccount.bac_si, ...availableDoctors];
            }
        }
        return availableDoctors;
    }, [availableDoctors, editingAccount]);

    const staffOptions = useMemo(() => {
        let targetType = '';
        if (isReceptionistRole) targetType = 'LE_TAN';
        else if (isClsRole) targetType = 'CAN_LAM_SANG';

        const list = targetType ? availableStaff.filter(s => s.LoaiNhanVien === targetType) : availableStaff;
        if (editingAccount && editingAccount.nhan_vien) {
            const exists = list.some(s => s.MaNhanVien === editingAccount.nhan_vien?.MaNhanVien);
            if (!exists) {
                return [editingAccount.nhan_vien, ...list];
            }
        }
        return list;
    }, [availableStaff, editingAccount, isReceptionistRole, isClsRole]);

    const currentAdminId = auth?.user?.MaTaiKhoan;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', {
            search: search || undefined,
            role_id: roleFilter || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleOpenCreateModal = () => {
        setEditingAccount(null);
        setFormData({
            TenDangNhap: '',
            Email: '',
            MatKhau: '',
            MaVaiTro: roles.find(r => r.TenVaiTro === 'BAC_SI')?.MaVaiTro || roles[0]?.MaVaiTro || 2,
            TrangThai: 'HOAT_DONG',
            MaBacSi: '',
            MaNhanVien: '',
        });
        setModalOpen(true);
    };

    const handleOpenEditModal = (acc: AccountItem) => {
        setEditingAccount(acc);
        setFormData({
            TenDangNhap: acc.TenDangNhap,
            Email: acc.Email,
            MatKhau: '',
            MaVaiTro: acc.vai_tro?.MaVaiTro || roles[0]?.MaVaiTro || 3,
            TrangThai: acc.TrangThai,
            MaBacSi: acc.bac_si?.MaBacSi || '',
            MaNhanVien: acc.nhan_vien?.MaNhanVien || '',
        });
        setModalOpen(true);
    };

    const handleDoctorSelect = (docIdStr: string) => {
        const docId = docIdStr ? Number(docIdStr) : '';
        const selectedDoc = doctorOptions.find(d => d.MaBacSi === docId);

        let newEmail = formData.Email;
        let newUsername = formData.TenDangNhap;

        if (selectedDoc && !editingAccount) {
            if (!newEmail || newEmail.includes('@smartcare.vn')) {
                newEmail = selectedDoc.EmailLienHe || `bacsi.${convertToUsername(selectedDoc.HoTen)}@smartcare.vn`;
            }
            if (!newUsername || newUsername.startsWith('bacsi_')) {
                newUsername = `bacsi_${convertToUsername(selectedDoc.HoTen)}`;
            }
        }

        setFormData(prev => ({
            ...prev,
            MaBacSi: docId,
            Email: newEmail,
            TenDangNhap: newUsername,
        }));
    };

    const handleStaffSelect = (staffIdStr: string) => {
        const staffId = staffIdStr ? Number(staffIdStr) : '';
        const selectedStaff = staffOptions.find(s => s.MaNhanVien === staffId);

        let newEmail = formData.Email;
        let newUsername = formData.TenDangNhap;

        if (selectedStaff && !editingAccount) {
            const prefix = selectedStaff.LoaiNhanVien === 'LE_TAN' ? 'letan_' : 'cls_';
            const slug = selectedStaff.HoTen
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            if (!newUsername || newUsername.startsWith('letan_') || newUsername.startsWith('cls_')) {
                newUsername = `${prefix}${slug}`;
            }
            if (!newEmail || newEmail.includes('@smartcare.vn')) {
                newEmail = selectedStaff.EmailLienHe || `${newUsername.replace('_', '.')}@smartcare.vn`;
            }
        }

        setFormData(prev => ({
            ...prev,
            MaNhanVien: staffId,
            Email: newEmail,
            TenDangNhap: newUsername,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            const payload = {
                ...formData,
                MaBacSi: formData.MaBacSi ? Number(formData.MaBacSi) : null,
                MaNhanVien: formData.MaNhanVien ? Number(formData.MaNhanVien) : null,
            };

            if (editingAccount) {
                // Update
                const res = await axios.put(`/admin/users/${editingAccount.MaTaiKhoan}`, payload);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    const updatedAcc: AccountItem = res.data.data;
                    setAccountList((prev) =>
                        prev.map((item) =>
                            item.MaTaiKhoan === editingAccount.MaTaiKhoan ? updatedAcc : item
                        )
                    );
                    if (payload.MaBacSi) {
                        setAvailableDoctors((prev) => prev.filter(d => d.MaBacSi !== payload.MaBacSi));
                    }
                    if (payload.MaNhanVien) {
                        setAvailableStaff((prev) => prev.filter(s => s.MaNhanVien !== payload.MaNhanVien));
                    }
                    setModalOpen(false);
                }
            } else {
                // Create
                const res = await axios.post('/admin/users', payload);
                if (res.data?.success) {
                    setFeedback({ type: 'success', message: res.data.message });
                    const newAcc: AccountItem = res.data.data;
                    setAccountList((prev) => [newAcc, ...prev]);
                    if (payload.MaBacSi) {
                        setAvailableDoctors((prev) => prev.filter(d => d.MaBacSi !== payload.MaBacSi));
                    }
                    if (payload.MaNhanVien) {
                        setAvailableStaff((prev) => prev.filter(s => s.MaNhanVien !== payload.MaNhanVien));
                    }
                    setModalOpen(false);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu tài khoản.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (acc: AccountItem) => {
        if (acc.MaTaiKhoan === currentAdminId) {
            alert('Bạn không thể tự khóa tài khoản của chính mình.');
            return;
        }

        const actionText = acc.TrangThai === 'HOAT_DONG' ? 'khóa' : 'mở khóa';
        if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản [${acc.TenDangNhap}] không?`)) {
            return;
        }

        setFeedback(null);
        try {
            const res = await axios.post(`/admin/users/${acc.MaTaiKhoan}/toggle`);
            if (res.data?.success) {
                const newStatus = res.data.data.TrangThai;
                setFeedback({ type: 'success', message: res.data.message });
                setAccountList((prev) =>
                    prev.map((item) =>
                        item.MaTaiKhoan === acc.MaTaiKhoan ? { ...item, TrangThai: newStatus } : item
                    )
                );
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản.';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const getRoleBadge = (roleName?: string) => {
        switch (roleName) {
            case 'QUAN_TRI_VIEN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800">Quản trị viên</span>;
            case 'BAC_SI':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Bác sĩ</span>;
            case 'LE_TAN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Lễ tân</span>;
            case 'NHAN_VIEN_CAN_LAM_SANG':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-100 text-teal-800">Cận lâm sàng</span>;
            case 'BENH_NHAN':
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Bệnh nhân</span>;
            default:
                return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{roleName || 'Chưa phân'}</span>;
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Tài khoản"
        >
            <Head title="Quản lý Tài khoản - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Tài khoản & Phân quyền</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Kiểm soát tài khoản đăng nhập, cấp quyền vai trò và bảo vệ tính an toàn của hệ thống.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo tài khoản mới
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
                            placeholder="Tìm kiếm theo Tên đăng nhập, Email, ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả vai trò</option>
                            {roles.map((r) => (
                                <option key={r.MaVaiTro} value={r.MaVaiTro}>
                                    {r.TenVaiTro}
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
                            <option value="KHOA">Đã khóa</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Bảng danh sách tài khoản */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã TK</th>
                                    <th className="px-6 py-4 font-semibold">Tên đăng nhập</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Vai trò</th>
                                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold">Ngày tạo</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Không tìm thấy tài khoản nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAccounts.map((acc) => {
                                    const isSelf = acc.MaTaiKhoan === currentAdminId;
                                    const isLocked = acc.TrangThai === 'KHOA';

                                    return (
                                        <tr key={acc.MaTaiKhoan} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-500">
                                                #{acc.MaTaiKhoan}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {acc.TenDangNhap.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-slate-900">{acc.TenDangNhap}</span>
                                                            {isSelf && (
                                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                                                                    (Bạn)
                                                                </span>
                                                            )}
                                                        </div>
                                                        {acc.vai_tro?.TenVaiTro === 'BAC_SI' && (
                                                            acc.bac_si ? (
                                                                <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                                                                    <Stethoscope className="w-3 h-3 text-emerald-600 shrink-0" />
                                                                    <span>[BS{acc.bac_si.MaBacSi}] {acc.bac_si.HoTen} ({acc.bac_si.chuyen_khoa?.TenChuyenKhoa || 'Chuyên khoa'})</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] font-medium text-amber-600 flex items-center gap-1 mt-0.5">
                                                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                                                    <span>Chưa gán bác sĩ cụ thể</span>
                                                                </div>
                                                            )
                                                        )}

                                                        {acc.vai_tro?.TenVaiTro === 'LE_TAN' && (
                                                            acc.nhan_vien ? (
                                                                <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1 mt-0.5">
                                                                    <Briefcase className="w-3 h-3 text-amber-600 shrink-0" />
                                                                    <span>[LT{acc.nhan_vien.MaNhanVien}] {acc.nhan_vien.HoTen}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] font-medium text-amber-600 flex items-center gap-1 mt-0.5">
                                                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                                                    <span>Chưa gán hồ sơ Lễ tân</span>
                                                                </div>
                                                            )
                                                        )}

                                                        {acc.vai_tro?.TenVaiTro === 'NHAN_VIEN_CAN_LAM_SANG' && (
                                                            acc.nhan_vien ? (
                                                                <div className="text-[11px] font-medium text-blue-700 flex items-center gap-1 mt-0.5">
                                                                    <FlaskConical className="w-3 h-3 text-blue-600 shrink-0" />
                                                                    <span>[CLS{acc.nhan_vien.MaNhanVien}] {acc.nhan_vien.HoTen}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] font-medium text-amber-600 flex items-center gap-1 mt-0.5">
                                                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                                                    <span>Chưa gán hồ sơ KTV CLS</span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono">
                                                {acc.Email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(acc.vai_tro?.TenVaiTro)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isLocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 font-semibold rounded-full">
                                                        <Lock className="w-3 h-3" /> Đã khóa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                                                        <ShieldCheck className="w-3 h-3" /> Hoạt động
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {formatDate(acc.NgayTao)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(acc)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleStatus(acc)}
                                                        disabled={isSelf}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isSelf 
                                                                ? 'text-slate-300 cursor-not-allowed' 
                                                                : isLocked 
                                                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                                                : 'text-rose-600 hover:bg-rose-50'
                                                        }`}
                                                        title={isSelf ? 'Không thể tự khóa' : isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                    >
                                                        {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={accountList.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            {/* Modal Tạo / Sửa tài khoản */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingAccount ? `Chỉnh sửa tài khoản #${editingAccount.MaTaiKhoan}` : 'Tạo tài khoản người dùng mới'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {!editingAccount && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Tên đăng nhập <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.TenDangNhap}
                                        onChange={(e) => setFormData({ ...formData, TenDangNhap: e.target.value })}
                                        placeholder="username"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.Email}
                                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                    placeholder="user@smartcare.vn"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    {editingAccount ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo *'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingAccount}
                                    minLength={6}
                                    value={formData.MatKhau}
                                    onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Vai trò hệ thống <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.MaVaiTro}
                                    onChange={(e) => {
                                        const newRoleId = Number(e.target.value);
                                        const roleObj = roles.find(r => r.MaVaiTro === newRoleId);
                                        const isDoc = roleObj?.TenVaiTro === 'BAC_SI' || newRoleId === 2;
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            MaVaiTro: newRoleId,
                                            MaBacSi: isDoc ? prev.MaBacSi : '',
                                        }));
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                                >
                                    {roles.map((r) => (
                                        <option key={r.MaVaiTro} value={r.MaVaiTro}>
                                            {r.TenVaiTro} ({r.MoTa || 'Hệ thống'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* DROPDOWN CHỌN GÁN BÁC SĨ CỤ THỂ KHI VAI TRÒ LÀ BÁC SĨ */}
                            {isDoctorRole && (
                                <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-200/90 rounded-2xl p-4 space-y-2.5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-indigo-950 uppercase flex items-center gap-1.5">
                                            <Stethoscope className="w-4 h-4 text-indigo-600" />
                                            Gán hồ sơ Bác sĩ cụ thể
                                        </label>
                                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                            {doctorOptions.length} bác sĩ trong viện
                                        </span>
                                    </div>

                                    <select
                                        value={formData.MaBacSi || ''}
                                        onChange={(e) => handleDoctorSelect(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                                    >
                                        <option value="">-- Chọn Bác sĩ chưa có tài khoản đăng nhập --</option>
                                        {doctorOptions.map((doc) => (
                                            <option key={doc.MaBacSi} value={doc.MaBacSi}>
                                                [BS{doc.MaBacSi}] {doc.HoTen} - {doc.chuyen_khoa?.TenChuyenKhoa || 'Chuyên khoa'}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-[11px] text-indigo-800/90 leading-relaxed flex items-start gap-1">
                                        <span className="shrink-0">💡</span>
                                        <span>
                                            Khi chọn bác sĩ, tài khoản này sẽ được gắn trực tiếp vào hồ sơ bác sĩ. Khi bác sĩ đăng nhập sẽ tự động nhận diện lịch khám, ca trực và danh sách bệnh nhân của mình.
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* DROPDOWN CHỌN GÁN NHÂN VIÊN LỄ TÂN / CLS CỤ THỂ */}
                            {isStaffRole && (
                                <div className="bg-gradient-to-br from-amber-50/80 to-indigo-50/50 border border-amber-200/90 rounded-2xl p-4 space-y-2.5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                                            {isReceptionistRole ? <Briefcase className="w-4 h-4 text-amber-600" /> : <FlaskConical className="w-4 h-4 text-blue-600" />}
                                            {isReceptionistRole ? 'Gán hồ sơ Nhân viên Lễ tân' : 'Gán hồ sơ Kỹ thuật viên CLS'}
                                        </label>
                                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                            {staffOptions.length} nhân sự khả dụng
                                        </span>
                                    </div>

                                    <select
                                        value={formData.MaNhanVien || ''}
                                        onChange={(e) => handleStaffSelect(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none bg-white font-medium text-slate-800"
                                    >
                                        <option value="">-- Chọn nhân viên chưa có tài khoản trong viện --</option>
                                        {staffOptions.map((st) => (
                                            <option key={st.MaNhanVien} value={st.MaNhanVien}>
                                                [#{st.MaNhanVien}] {st.HoTen} ({st.LoaiNhanVien === 'LE_TAN' ? 'Lễ tân' : 'Cận lâm sàng'})
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-[11px] text-amber-900/90 leading-relaxed flex items-start gap-1">
                                        <span className="shrink-0">💡</span>
                                        <span>
                                            Khi chọn nhân viên, tài khoản sẽ liên kết với hồ sơ nhân sự, hiển thị họ tên thật trên hệ thống và các hóa đơn, phiếu kết quả xét nghiệm.
                                        </span>
                                    </p>
                                </div>
                            )}

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
                                    <option value="KHOA">Khóa tài khoản</option>
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
                                    {editingAccount ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
