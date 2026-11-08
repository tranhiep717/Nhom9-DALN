import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Users, 
    Search, 
    Filter, 
    Eye, 
    Calendar, 
    Phone, 
    Mail, 
    MapPin, 
    Stethoscope, 
    Receipt, 
    Activity, 
    Clock, 
    X,
    FileText,
    Pill,
    CheckCircle2,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { adminNavItems } from '@/constants/navigation';
import AdminPagination from '@/Components/AdminPagination';

interface PatientItem {
    MaBenhNhan: number;
    MaTaiKhoan?: number;
    HoTen: string;
    NgaySinh?: string;
    GioiTinh?: string;
    SoDienThoai?: string;
    DiaChi?: string;
    EmailLienHe?: string;
    NgayTao?: string;
    tai_khoan?: {
        TenDangNhap: string;
        Email: string;
        TrangThai: string;
    };
    luot_khams_count?: number;
    lich_hens_count?: number;
}

interface PatientsProps {
    auth: any;
    patients: PatientItem[];
    filters: {
        search?: string;
        gender?: string;
    };
}

export default function Patients({ auth, patients = [], filters = {} }: PatientsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [genderFilter, setGenderFilter] = useState(filters.gender || '');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [patients]);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const paginatedPatients = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return patients.slice(start, start + pageSize);
    }, [patients, currentPage, pageSize]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/patients', {
            search: search || undefined,
            gender: genderFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleViewDetail = async (patientId: number) => {
        setLoadingDetail(true);
        setDetailModalOpen(true);
        setSelectedPatient(null);

        try {
            const res = await axios.get(`/admin/patients/${patientId}`);
            if (res.data?.success) {
                setSelectedPatient(res.data.data);
            }
        } catch (err) {
            alert('Không thể tải chi tiết hồ sơ bệnh nhân.');
        } finally {
            setLoadingDetail(false);
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

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Bệnh nhân"
        >
            <Head title="Quản lý Bệnh nhân - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Hồ sơ Bệnh nhân</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Tra cứu toàn bộ danh sách bệnh nhân, hồ sơ hành chính, lịch hẹn và tổng quan điều trị.
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
                            placeholder="Tìm theo Họ tên, SĐT, Email, Mã BN..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                        >
                            <option value="">Tất cả giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Lọc
                        </button>
                    </div>
                </form>

                {/* Danh sách Bệnh nhân */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Mã BN</th>
                                    <th className="px-6 py-4 font-semibold">Họ và tên</th>
                                    <th className="px-6 py-4 font-semibold">Giới tính / Ngày sinh</th>
                                    <th className="px-6 py-4 font-semibold">Số điện thoại</th>
                                    <th className="px-6 py-4 font-semibold">Tài khoản liên kết</th>
                                    <th className="px-6 py-4 font-semibold text-center">Lượt khám</th>
                                    <th className="px-6 py-4 font-semibold text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            Không tìm thấy hồ sơ bệnh nhân nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPatients.map((bn) => (
                                    <tr key={bn.MaBenhNhan} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-teal-700">
                                            #{bn.MaBenhNhan}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                                                    {bn.HoTen.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p>{bn.HoTen}</p>
                                                    {bn.EmailLienHe && (
                                                        <p className="text-[11px] text-slate-400 font-normal">{bn.EmailLienHe}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="font-semibold text-slate-800">{bn.GioiTinh || '--'}</span>
                                            <span className="text-slate-400 block text-[11px]">{formatDate(bn.NgaySinh)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-mono">
                                            {bn.SoDienThoai || '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {bn.tai_khoan ? (
                                                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                    {bn.tai_khoan.TenDangNhap}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Khách vãng lai</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                                                {bn.luot_khams_count || 0} lần
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewDetail(bn.MaBenhNhan)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Xem hồ sơ
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={patients.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            {/* Modal Chi tiết Hồ sơ Bệnh nhân */}
            {detailModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Hồ sơ bệnh nhân {selectedPatient ? `#${selectedPatient.MaBenhNhan} - ${selectedPatient.HoTen}` : ''}
                            </h3>
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p className="text-xs">Đang tải toàn bộ dữ liệu lịch sử bệnh nhân...</p>
                            </div>
                        ) : selectedPatient ? (
                            <div className="space-y-6">
                                {/* Thông tin hành chính */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                                    <div>
                                        <span className="text-slate-400 block">Số điện thoại:</span>
                                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedPatient.SoDienThoai || '--'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Giới tính / Ngày sinh:</span>
                                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedPatient.GioiTinh || '--'} ({formatDate(selectedPatient.NgaySinh)})</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Email:</span>
                                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedPatient.EmailLienHe || '--'}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-3">
                                        <span className="text-slate-400 block">Địa chỉ thường trú:</span>
                                        <span className="font-semibold text-slate-700 mt-0.5 block">{selectedPatient.DiaChi || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>

                                {/* Lịch sử các đợt khám bệnh */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-teal-600" />
                                        Lịch sử khám bệnh ({selectedPatient.luot_khams?.length || 0})
                                    </h4>

                                    {selectedPatient.luot_khams && selectedPatient.luot_khams.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedPatient.luot_khams.map((lk: any) => (
                                                <div key={lk.MaLuotKham} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-teal-800">
                                                            Đợt khám #{lk.MaLuotKham} • {formatDate(lk.ThoiGianTiepNhan)}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-slate-100 font-semibold rounded-md text-slate-700">
                                                            BS: {lk.bac_si?.HoTen || 'Bác sĩ phòng khám'}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700">
                                                        <span className="font-semibold text-slate-900">Chẩn đoán:</span> {lk.phieu_kham?.ChanDoan || 'Đang khám / Chưa có kết luận'}
                                                    </p>
                                                    {lk.phieu_kham?.TrieuChung && (
                                                        <p className="text-slate-500">
                                                            <span className="font-semibold">Triệu chứng:</span> {lk.phieu_kham.TrieuChung}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Bệnh nhân chưa có lượt khám nào.</p>
                                    )}
                                </div>

                                {/* Lịch sử hóa đơn viện phí */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-indigo-600" />
                                        Hóa đơn viện phí
                                    </h4>
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                                        {selectedPatient.luot_khams?.map((lk: any) => {
                                            if (!lk.hoa_don) return null;
                                            const hd = lk.hoa_don;
                                            return (
                                                <div key={hd.MaHoaDon} className="p-3.5 bg-white flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-bold font-mono text-slate-900">HĐ #{hd.MaHoaDon}</span>
                                                        <span className="text-slate-400 ml-2">({formatDate(hd.NgayTao)})</span>
                                                        <p className="text-slate-500 mt-0.5">Trạng thái: {hd.TrangThai}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900">{formatCurrency(hd.BenhNhanChiTra)}</p>
                                                        <p className="text-[11px] text-slate-400">Đã trả: {formatCurrency(hd.DaThanhToan)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
