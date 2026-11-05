import DashboardLayout from '@/Layouts/DashboardLayout';
import QuickAttendanceCard from '@/Components/QuickAttendanceCard';
import { CLS_NAV_ITEMS } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import { 
    Activity, 
    Calendar, 
    LayoutDashboard, 
    FileText, 
    Search, 
    UserCheck, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    RefreshCw, 
    Loader2, 
    User,
    Phone,
    FlaskConical,
    Stethoscope,
    Edit3,
    Eye,
    Save,
    Play
} from 'lucide-react';
import React, { useState } from 'react';

interface Patient {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    GioiTinh?: 'NAM' | 'NU' | 'KHAC';
    NgaySinh?: string;
    DiaChi?: string;
}

interface Doctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
}

interface Service {
    MaDichVu: number;
    TenDichVu: string;
    DonGia: number;
    MoTa?: string;
}

interface ServiceRequest {
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
    DonGia: number;
    GhiChu?: string;
    dich_vu?: Service;
    dichVu?: Service;
    bac_si?: Doctor;
    bacSi?: Doctor;
    luot_kham?: {
        MaLuotKham: number;
        MaBenhNhan: number;
        MaBacSi: number;
        TrangThai: string;
        benh_nhan?: Patient;
    };
    luotKham?: {
        MaLuotKham: number;
        MaBenhNhan: number;
        MaBacSi: number;
        TrangThai: string;
        benh_nhan?: Patient;
    };
    nhan_vien_thuc_hien?: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
    };
}

interface Stats {
    totalToday: number;
    waitingReceive: number;
    processing: number;
    completedToday: number;
}

interface Filters {
    date?: string;
    status?: string | null;
    search?: string | null;
    service_id?: number | null;
    per_page?: number | string | null;
    page?: number | string | null;
}

interface CanLamSangProps {
    auth: any;
    requests: ServiceRequest[] | { data?: ServiceRequest[]; current_page?: number; last_page?: number; per_page?: number; total?: number; from?: number | null; to?: number | null };
    stats: Stats;
    services: Service[];
    filters: Filters;
}

export default function CanLamSangDashboard({ auth, requests = [], stats, services = [], filters }: CanLamSangProps) {
    const navItems = CLS_NAV_ITEMS;

    const paginatedRequests = Array.isArray(requests) ? { data: requests, current_page: 1, last_page: 1, per_page: requests.length || 10, total: requests.length || 0, from: requests.length ? 1 : 0, to: requests.length || 0 } : (requests || { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
    const requestItems = paginatedRequests.data ?? [];

    // Local filters
    const [filterDate, setFilterDate] = useState<string>(filters?.date || new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<string>(filters?.status || '');
    const [filterService, setFilterService] = useState<string>(filters?.service_id ? String(filters.service_id) : '');
    const [searchTerm, setSearchTerm] = useState<string>(filters?.search || '');
    const [perPage, setPerPage] = useState<number>(Number(filters?.per_page) || paginatedRequests.per_page || 10);

    // Processing / Modal states
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);

    // Form kết quả
    const [resultForm, setResultForm] = useState({
        KetQua: '',
        KetLuan: '',
        DonViDo: '',
        KhoangThamChieu: '',
        GhiChu: '',
    });
    const [resultErrors, setResultErrors] = useState<Record<string, string>>({});

    const applyFilters = (newFilters: Partial<Filters> = {}) => {
        const queryParams: any = {
            date: newFilters.date !== undefined ? newFilters.date : filterDate,
            status: newFilters.status !== undefined ? newFilters.status : filterStatus,
            service_id: newFilters.service_id !== undefined ? newFilters.service_id : filterService,
            search: newFilters.search !== undefined ? newFilters.search : searchTerm,
            per_page: newFilters.per_page !== undefined ? newFilters.per_page : perPage,
            page: 1,
        };

        Object.keys(queryParams).forEach((k) => {
            if (queryParams[k] === '' || queryParams[k] === null || queryParams[k] === undefined) delete queryParams[k];
        });

        router.get('/cls/dashboard', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > (paginatedRequests.last_page ?? 1) || newPage === paginatedRequests.current_page) return;
        router.get('/cls/dashboard', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            service_id: filterService || undefined,
            search: searchTerm || undefined,
            per_page: perPage,
            page: newPage,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const resetFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setFilterDate(today);
        setFilterStatus('');
        setFilterService('');
        setSearchTerm('');
        setPerPage(10);
        router.get('/cls/dashboard', { date: today, per_page: 10, page: 1 }, { preserveState: true });
    };

    // Tiếp nhận chỉ định
    const handleReceive = (item: ServiceRequest) => {
        const patientName = (item.luot_kham || item.luotKham)?.benh_nhan?.HoTen || 'Bệnh nhân';
        const serviceName = (item.dich_vu || item.dichVu)?.TenDichVu || 'Dịch vụ';
        if (!confirm(`Xác nhận tiếp nhận chỉ định [${serviceName}] của bệnh nhân ${patientName}?`)) {
            return;
        }

        setProcessingId(item.MaChiDinh);
        router.post(`/cls/requests/${item.MaChiDinh}/receive`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Đã tiếp nhận chỉ định [${item.dich_vu?.TenDichVu}].`,
                });
                setProcessingId(null);
            },
            onError: (err: any) => {
                setNotification({
                    type: 'error',
                    message: err.message || 'Lỗi khi tiếp nhận chỉ định.',
                });
                setProcessingId(null);
            },
        });
    };

    // Bắt đầu thực hiện
    const handleStart = (item: ServiceRequest) => {
        setProcessingId(item.MaChiDinh);
        router.post(`/cls/requests/${item.MaChiDinh}/start`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Bắt đầu thực hiện dịch vụ [${item.dich_vu?.TenDichVu}].`,
                });
                setProcessingId(null);
            },
            onError: (err: any) => {
                setNotification({
                    type: 'error',
                    message: err.message || 'Lỗi khi bắt đầu thực hiện.',
                });
                setProcessingId(null);
            },
        });
    };

    // Mở modal nhập kết quả
    const handleOpenResultModal = (item: ServiceRequest) => {
        setSelectedRequest(item);
        setResultForm({
            KetQua: item.KetQua || '',
            KetLuan: item.KetLuan || '',
            DonViDo: item.DonViDo || '',
            KhoangThamChieu: item.KhoangThamChieu || '',
            GhiChu: item.GhiChu || '',
        });
        setResultErrors({});
        setResultModalOpen(true);
    };

    // Lưu kết quả
    const handleSaveResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        if (!resultForm.KetQua.trim()) {
            setResultErrors({ KetQua: 'Vui lòng nhập kết quả thực hiện dịch vụ.' });
            return;
        }

        setProcessingId(selectedRequest.MaChiDinh);
        router.post(`/cls/requests/${selectedRequest.MaChiDinh}/result`, resultForm, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Cập nhật và xác nhận kết quả [${selectedRequest.dich_vu?.TenDichVu}] thành công.`,
                });
                setResultModalOpen(false);
                setSelectedRequest(null);
                setProcessingId(null);
            },
            onError: (errors: any) => {
                setResultErrors(errors);
                setProcessingId(null);
            },
        });
    };

    // Render Badge trạng thái
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'CHO_TIEP_NHAN':
            case 'CHO_THUC_HIEN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ tiếp nhận</span>;
            case 'DA_TIEP_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Đã tiếp nhận</span>;
            case 'DANG_THUC_HIEN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 animate-pulse">Đang thực hiện</span>;
            case 'DA_CO_KET_QUA':
            case 'HOAN_THANH':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã có kết quả</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Đã hủy</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const scheduleSummary = {
        todayAssigned: requestItems.length,
        waitingReceive: requestItems.filter((item) => item.TrangThai === 'CHO_TIEP_NHAN' || item.TrangThai === 'CHO_THUC_HIEN').length,
        inProgress: requestItems.filter((item) => item.TrangThai === 'DANG_THUC_HIEN' || item.TrangThai === 'DA_TIEP_NHAN').length,
        completed: requestItems.filter((item) => item.TrangThai === 'DA_CO_KET_QUA' || item.TrangThai === 'HOAN_THANH').length,
    };

    const activeServices = Array.from(new Map(requestItems.map((item) => [item.MaDichVu, (item.dich_vu || item.dichVu)?.TenDichVu || 'Dịch vụ'])).entries()).slice(0, 4);

    return (
        <DashboardLayout
            role="cls"
            navItems={navItems}
            user={auth?.user}
            header="Bàn làm việc Cận lâm sàng & Xét nghiệm"
        >
            <Head title="Cận lâm sàng & Xét nghiệm - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 0. Chấm công nhanh ca trực hôm nay */}
                <QuickAttendanceCard
                    rolePrefix="cls"
                    todaySchedule={auth?.todaySchedule}
                    todayAttendance={auth?.todayAttendance}
                />

                {/* 1. Flash Toast */}
                {notification && (
                    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                        <button 
                            onClick={() => setNotification(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* 2. Thẻ thống kê hôm nay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng chỉ định hôm nay</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalToday ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <FlaskConical className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ tiếp nhận</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{stats?.waitingReceive ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Đang thực hiện</p>
                            <p className="text-2xl font-black text-purple-700 mt-1">{stats?.processing ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã có kết quả</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.completedToday ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Tóm tắt lịch trực & dịch vụ trong ngày */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase">
                                <Calendar className="w-4 h-4" />
                                Lịch trực hôm nay
                            </div>
                            <div className="mt-3 text-lg font-black text-slate-900">{scheduleSummary.todayAssigned} chỉ định</div>
                            <p className="text-xs text-slate-500 mt-1">Dữ liệu thực tế từ ngày {filterDate}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-amber-50 p-4">
                            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase">
                                <Clock className="w-4 h-4" />
                                Ca đang xử lý
                            </div>
                            <div className="mt-3 text-lg font-black text-amber-700">{scheduleSummary.waitingReceive} chờ tiếp nhận</div>
                            <p className="text-xs text-amber-600 mt-1">{scheduleSummary.inProgress} đang thực hiện</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4">
                            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase">
                                <CheckCircle2 className="w-4 h-4" />
                                Dịch vụ phân công
                            </div>
                            <div className="mt-3 text-lg font-black text-emerald-700">{activeServices.length} loại</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {activeServices.map(([id, serviceName]) => (
                                    <span key={id} className="text-[10px] px-2 py-1 rounded-full bg-white text-slate-700 border border-slate-200">{serviceName}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Bộ lọc & tìm kiếm */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày chỉ định</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => {
                                    setFilterDate(e.target.value);
                                    applyFilters({ date: e.target.value });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dịch vụ kỹ thuật</label>
                            <select
                                value={filterService}
                                onChange={(e) => {
                                    setFilterService(e.target.value);
                                    applyFilters({ service_id: e.target.value ? Number(e.target.value) : null });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả dịch vụ</option>
                                {services.map((svc) => (
                                    <option key={svc.MaDichVu} value={svc.MaDichVu}>
                                        {svc.TenDichVu}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trạng thái xử lý</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHO_TIEP_NHAN">Chờ tiếp nhận</option>
                                <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                                <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                                <option value="DA_CO_KET_QUA">Đã có kết quả</option>
                                <option value="DA_HUY">Đã hủy</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tìm bệnh nhân</label>
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    placeholder="Mã BN, tên, SĐT, mã lượt, số phiếu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-sm rounded-xl border-slate-300 pr-9 focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-primary">
                                    <Search className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
                        <span>Đang hiển thị <strong className="text-slate-800">{paginatedRequests.total ?? requestItems.length}</strong> chỉ định cận lâm sàng</span>
                        <div className="flex items-center gap-3">
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const nextPerPage = Number(e.target.value);
                                    setPerPage(nextPerPage);
                                    applyFilters({ per_page: nextPerPage, page: 1 });
                                }}
                                className="rounded-lg border-slate-300 text-xs px-2 py-1.5"
                            >
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                                <option value={50}>50 / trang</option>
                            </select>
                            <button 
                                type="button" 
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Bảng danh sách chỉ định */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold text-center w-14">STT</th>
                                    <th className="px-5 py-3.5 font-bold">Mã CĐ</th>
                                    <th className="px-5 py-3.5 font-bold">Bệnh nhân</th>
                                    <th className="px-5 py-3.5 font-bold">Dịch vụ chỉ định</th>
                                    <th className="px-5 py-3.5 font-bold">Bác sĩ chỉ định</th>
                                    <th className="px-5 py-3.5 font-bold">Thời gian</th>
                                    <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                                    <th className="px-5 py-3.5 font-bold">Kết quả</th>
                                    <th className="px-5 py-3.5 font-bold text-center w-40">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requestItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <FlaskConical className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                                                <p className="text-base font-bold text-slate-700">Không có chỉ định nào phù hợp</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-sm">Chưa có chỉ định cận lâm sàng nào trong ngày hoặc theo bộ lọc hiện tại.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requestItems.map((item, index) => {
                                        const bn = item.luot_kham?.benh_nhan || item.luotKham?.benh_nhan;
                                        const bs = item.bac_si || item.bacSi;
                                        const svc = item.dich_vu || item.dichVu;
                                        const isWaitingReceive = item.TrangThai === 'CHO_TIEP_NHAN' || item.TrangThai === 'CHO_THUC_HIEN';
                                        const isReceived = item.TrangThai === 'DA_TIEP_NHAN';
                                        const isProcessing = item.TrangThai === 'DANG_THUC_HIEN';
                                        const isCompleted = item.TrangThai === 'DA_CO_KET_QUA' || item.TrangThai === 'HOAN_THANH';
                                        const isBusy = processingId === item.MaChiDinh;

                                        return (
                                            <tr key={item.MaChiDinh} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-5 py-4 text-center font-black text-slate-400">
                                                    {((paginatedRequests.current_page ?? 1) - 1) * (paginatedRequests.per_page ?? 10) + index + 1}
                                                </td>
                                                <td className="px-5 py-4 font-bold text-primary">
                                                    #{item.MaChiDinh}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                                                            {bn?.HoTen?.charAt(0) || 'BN'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight">{bn?.HoTen || 'Bệnh nhân'}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                {bn?.SoDienThoai || '---'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-800">{item.dich_vu?.TenDichVu}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Lượt khám #{item.MaLuotKham}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-slate-700">
                                                        {bs?.HocVi ? `${bs.HocVi}. ` : 'BS. '}{bs?.HoTen || 'Bác sĩ'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-500">
                                                    {item.NgayChiDinh?.substring(0, 16).replace('T', ' ')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {renderStatusBadge(item.TrangThai)}
                                                </td>
                                                <td className="px-5 py-4 max-w-[200px] truncate text-xs text-slate-600">
                                                    {item.KetQua ? (
                                                        <span className="font-medium text-emerald-700" title={item.KetQua}>
                                                            {item.KetQua} {item.DonViDo && `(${item.DonViDo})`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Chưa có</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isWaitingReceive && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleReceive(item)}
                                                                disabled={isBusy}
                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                                            >
                                                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                                Tiếp nhận
                                                            </button>
                                                        )}

                                                        {isReceived && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStart(item)}
                                                                disabled={isBusy}
                                                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                                            >
                                                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                                                Bắt đầu
                                                            </button>
                                                        )}

                                                        {(isProcessing || isReceived) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenResultModal(item)}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                Nhập kết quả
                                                            </button>
                                                        )}

                                                        {isCompleted && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenResultModal(item)}
                                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                Xem / Sửa
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {(paginatedRequests.last_page ?? 1) > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                        <span>
                            Hiển thị <strong className="text-slate-800">{paginatedRequests.total ? (paginatedRequests.from ?? 1) : 0}</strong> - <strong className="text-slate-800">{paginatedRequests.total ? (paginatedRequests.to ?? requestItems.length) : 0}</strong> trên <strong className="text-slate-800">{paginatedRequests.total ?? 0}</strong> chỉ định
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handlePageChange((paginatedRequests.current_page ?? 1) - 1)}
                                disabled={(paginatedRequests.current_page ?? 1) <= 1}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Trang trước
                            </button>
                            <span className="font-bold text-slate-800">{paginatedRequests.current_page ?? 1}/{paginatedRequests.last_page ?? 1}</span>
                            <button
                                type="button"
                                onClick={() => handlePageChange((paginatedRequests.current_page ?? 1) + 1)}
                                disabled={(paginatedRequests.current_page ?? 1) >= (paginatedRequests.last_page ?? 1)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Trang sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL NHẬP KẾT QUẢ CẬN LÂM SÀNG */}
            {resultModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Cập nhật kết quả cận lâm sàng
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Chỉ định #{selectedRequest.MaChiDinh} — Lượt khám #{selectedRequest.MaLuotKham}
                                </p>
                            </div>
                            <button
                                onClick={() => setResultModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Thông tin dịch vụ & Bệnh nhân */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                            <div>
                                <span className="text-slate-500 block">Dịch vụ:</span>
                                <span className="font-bold text-slate-800 text-sm block mt-0.5">
                                    {selectedRequest.dich_vu?.TenDichVu}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Bệnh nhân:</span>
                                <span className="font-bold text-slate-800 text-sm block mt-0.5">
                                    {(selectedRequest.luot_kham || selectedRequest.luotKham)?.benh_nhan?.HoTen}
                                </span>
                            </div>
                        </div>

                        {/* Form nhập kết quả */}
                        <form onSubmit={handleSaveResult} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Kết quả thực hiện / Giá trị đo được <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={resultForm.KetQua}
                                    onChange={(e) => setResultForm({ ...resultForm, KetQua: e.target.value })}
                                    placeholder="Nhập chi tiết các chỉ số hoặc mô tả hình ảnh..."
                                    className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary shadow-sm"
                                />
                                {resultErrors.KetQua && (
                                    <p className="text-xs text-rose-500 mt-1">{resultErrors.KetQua}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Đơn vị đo (nếu có)
                                    </label>
                                    <input
                                        type="text"
                                        value={resultForm.DonViDo}
                                        onChange={(e) => setResultForm({ ...resultForm, DonViDo: e.target.value })}
                                        placeholder="VD: mg/dL, mmol/L, %"
                                        className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Khoảng tham chiếu
                                    </label>
                                    <input
                                        type="text"
                                        value={resultForm.KhoangThamChieu}
                                        onChange={(e) => setResultForm({ ...resultForm, KhoangThamChieu: e.target.value })}
                                        placeholder="VD: 70 - 110 mg/dL"
                                        className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Kết luận / Nhận xét chuyên môn
                                </label>
                                <textarea
                                    rows={2}
                                    value={resultForm.KetLuan}
                                    onChange={(e) => setResultForm({ ...resultForm, KetLuan: e.target.value })}
                                    placeholder="Nhận xét của kỹ thuật viên / bác sĩ đọc kết quả..."
                                    className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Ghi chú thêm
                                </label>
                                <input
                                    type="text"
                                    value={resultForm.GhiChu}
                                    onChange={(e) => setResultForm({ ...resultForm, GhiChu: e.target.value })}
                                    placeholder="Ghi chú về mẫu bệnh phẩm, máy đo..."
                                    className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary shadow-sm"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setResultModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingId !== null}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {processingId !== null ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Xác nhận & Hoàn thành kết quả
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
