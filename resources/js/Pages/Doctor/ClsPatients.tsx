import DashboardLayout from '@/Layouts/DashboardLayout';
import { DOCTOR_NAV_ITEMS } from '@/constants/navigation';
import { Head, Link, router } from '@inertiajs/react';
import {
    FlaskConical,
    Search,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Phone,
    FileText,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Eye,
    RotateCcw,
    Stethoscope,
    Activity,
    Check,
    X,
    Filter
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

interface DichVu {
    MaDichVu: number;
    TenDichVu: string;
    DonGia?: number;
}

interface ChiDinhDichVu {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    TrangThai: string;
    KetQua?: string | null;
    KetLuan?: string | null;
    DonViDo?: string | null;
    KhoangThamChieu?: string | null;
    TepDinhKem?: string | null;
    NgayChiDinh?: string | null;
    NgayThucHien?: string | null;
    ThoiGianXacNhan?: string | null;
    DonGia: number | string;
    GhiChu?: string | null;
    dichVu?: DichVu;
    nhanVienThucHien?: {
        MaTaiKhoan: number;
        TenDangNhap?: string;
        Email?: string;
    };
}

interface BenhNhan {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    GioiTinh: string;
    NgaySinh?: string;
    DiaChi?: string;
}

interface LuotKham {
    MaLuotKham: number;
    MaBenhNhan: number;
    MaBacSi: number;
    ThoiGianTiepNhan: string;
    ThoiGianVaoHang?: string;
    TrangThai: string;
    SoPhieu?: string;
    STTTrongNgay?: number;
    LoaiHangDoi?: string;
    MucUuTien?: number;
    NgayKham?: string;
    MaChuyenKhoa?: number;
    MaCaKham?: number;
    benhNhan?: BenhNhan;
    caKham?: {
        MaCaKham: number;
        GioBatDau: string;
        GioKetThuc: string;
    };
    chuyenKhoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
    phieuKham?: {
        MaPhieuKham: number;
        TrieuChung?: string;
        ChanDoan?: string;
        ChanDoanBanDau?: string;
        ChanDoanSauCLS?: string;
    };
    chiDinhDichVus?: ChiDinhDichVu[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    auth: any;
    doctor?: any;
    visits: PaginatedData<LuotKham>;
    clsServices: Array<{ MaDichVu: number; TenDichVu: string }>;
    specialties: Array<{ MaChuyenKhoa: number; TenChuyenKhoa: string }>;
    clsStats: {
        total: number;
        waitingExec: number;
        inProgress: number;
        waitingResult: number;
        hasResultWaitingReturn: number;
        returnedToQueue: number;
    };
    filters: {
        date?: string;
        status?: string;
        search?: string;
        service_id?: string | number;
        specialty_id?: string | number;
        per_page?: number;
        page?: number;
    };
}

export default function ClsPatients({
    auth,
    doctor,
    visits,
    clsServices = [],
    specialties = [],
    clsStats,
    filters = {}
}: Props) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [filterDate, setFilterDate] = useState<string>(filters.date || todayStr);
    const [filterStatus, setFilterStatus] = useState<string>(filters.status || '');
    const [filterService, setFilterService] = useState<string>(filters.service_id ? String(filters.service_id) : '');
    const [filterSpecialty, setFilterSpecialty] = useState<string>(filters.specialty_id ? String(filters.specialty_id) : '');
    const [perPage, setPerPage] = useState<number>(filters.per_page || visits.per_page || 10);

    // Modal state for view details
    const [selectedVisitForModal, setSelectedVisitForModal] = useState<LuotKham | null>(null);
    const [confirmingReturnId, setConfirmingReturnId] = useState<number | null>(null);

    const doctorName = doctor?.HoTen || auth?.user?.bac_si?.HoTen || auth?.user?.TenDangNhap || 'Bác sĩ';
    const doctorCode = doctor?.MaBacSi ? `BS${String(doctor.MaBacSi).padStart(3, '0')}` : 'BS-SC';

    // Apply filters
    const handleApplyFilter = () => {
        router.get('/doctor/cls-patients', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            search: searchQuery || undefined,
            service_id: filterService || undefined,
            specialty_id: filterSpecialty || undefined,
            per_page: perPage,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilter = () => {
        setSearchQuery('');
        setFilterDate(todayStr);
        setFilterStatus('');
        setFilterService('');
        setFilterSpecialty('');
        setPerPage(10);
        router.get('/doctor/cls-patients', { date: todayStr, per_page: 10, page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > visits.last_page || newPage === visits.current_page) return;
        router.get('/doctor/cls-patients', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            search: searchQuery || undefined,
            service_id: filterService || undefined,
            specialty_id: filterSpecialty || undefined,
            per_page: perPage,
            page: newPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        router.get('/doctor/cls-patients', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            search: searchQuery || undefined,
            service_id: filterService || undefined,
            specialty_id: filterSpecialty || undefined,
            per_page: newPerPage,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Xác nhận bệnh nhân đã quay lại sau CLS
    const handleConfirmReturn = (visitId: number) => {
        if (!confirm('Xác nhận bệnh nhân đã hoàn thành CLS và có mặt tại phòng khám? Bệnh nhân sẽ được đưa vào hàng đợi tái khám theo thời gian quay lại thực tế.')) {
            return;
        }

        setConfirmingReturnId(visitId);
        router.post('/doctor/queue/cls-return', {
            MaLuotKham: visitId,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setConfirmingReturnId(null),
        });
    };

    // Helper tính tuổi
    const getAge = (dob?: string) => {
        if (!dob) return 'N/A';
        try {
            const birth = new Date(dob);
            const now = new Date();
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
                age--;
            }
            return age > 0 ? `${age} tuổi` : 'N/A';
        } catch {
            return 'N/A';
        }
    };

    // Helper trạng thái CLS tổng thể của lượt khám
    const getClsOverallStatus = (visit: LuotKham) => {
        if (visit.TrangThai === 'CHO_KHAM_LAI') {
            return {
                label: 'Đã quay lại hàng chờ khám',
                color: 'bg-teal-50 text-teal-700 border-teal-200',
                badge: 'Tái khám FIFO',
            };
        }

        const services = visit.chiDinhDichVus || [];
        if (services.length === 0) {
            return { label: 'Chưa có chỉ định', color: 'bg-gray-50 text-gray-600 border-gray-200', badge: 'Trống' };
        }

        const hasPending = services.some(s => ['YEU_CAU', 'CHO_THUC_HIEN'].includes(s.TrangThai));
        const hasInProgress = services.some(s => s.TrangThai === 'DANG_THUC_HIEN');
        const hasWaitingResult = services.some(s => s.TrangThai === 'CHO_KET_QUA');
        const allCompleted = services.every(s => ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'].includes(s.TrangThai));

        if (allCompleted) {
            return {
                label: 'Đã có kết quả (Chờ BN quay lại)',
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                badge: 'Sẵn sàng tái khám',
            };
        }
        if (hasWaitingResult) {
            return {
                label: 'Đã làm CLS, chờ trả kết quả',
                color: 'bg-purple-50 text-purple-700 border-purple-200',
                badge: 'Chờ KQ',
            };
        }
        if (hasInProgress) {
            return {
                label: 'Đang thực hiện CLS',
                color: 'bg-sky-50 text-sky-700 border-sky-200',
                badge: 'Đang làm',
            };
        }
        if (hasPending) {
            return {
                label: 'Chờ thực hiện CLS',
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                badge: 'Chờ phòng CLS',
            };
        }

        return {
            label: 'Đang cận lâm sàng',
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            badge: 'CLS',
        };
    };

    return (
        <DashboardLayout
            role="doctor"
            navItems={DOCTOR_NAV_ITEMS}
            user={{ name: doctorName, code: doctorCode }}
            header="Quản lý Bệnh nhân chờ Cận lâm sàng"
        >
            <Head title="Bệnh nhân chờ CLS - Bác sĩ SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Thẻ thống kê các giai đoạn CLS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng chỉ định CLS</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{clsStats.total}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Bệnh nhân cần làm CLS</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chờ thực hiện</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">{clsStats.waitingExec}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Chưa tiếp nhận tại phòng CLS</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đang làm & Chờ KQ</p>
                            <p className="text-2xl font-black text-purple-600 mt-1">
                                {(clsStats.inProgress || 0) + (clsStats.waitingResult || 0)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Đang chụp / chờ bác sĩ CLS ký</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã có kết quả</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{clsStats.hasResultWaitingReturn}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Chờ bệnh nhân quay lại bàn khám</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã vào hàng tái khám</p>
                            <p className="text-2xl font-black text-teal-600 mt-1">{clsStats.returnedToQueue}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Đang chờ gọi số theo FIFO</p>
                        </div>
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Thanh lọc và tìm kiếm */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Tìm kiếm */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Tên, SĐT, mã BN, số phiếu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Ngày khám */}
                        <div>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Giai đoạn CLS */}
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Tất cả giai đoạn CLS</option>
                                <option value="CHO_THUC_HIEN">Chờ thực hiện CLS</option>
                                <option value="DANG_THUC_HIEN">Đang thực hiện CLS</option>
                                <option value="CHO_KET_QUA">Đã làm, chờ kết quả</option>
                                <option value="DA_CO_KET_QUA">Đã có kết quả (Chờ BN quay lại)</option>
                                <option value="DA_QUAY_LAI">Đã quay lại hàng chờ tái khám</option>
                            </select>
                        </div>

                        {/* Loại dịch vụ CLS */}
                        <div>
                            <select
                                value={filterService}
                                onChange={(e) => setFilterService(e.target.value)}
                                className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Tất cả dịch vụ CLS</option>
                                {clsServices.map((s) => (
                                    <option key={s.MaDichVu} value={s.MaDichVu}>
                                        {s.TenDichVu}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Nút lọc & Làm mới */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleApplyFilter}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Lọc</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearFilter}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors"
                                title="Xóa bộ lọc"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Bảng danh sách bệnh nhân chờ CLS */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-bold text-gray-900">
                                Danh sách bệnh nhân thực hiện Cận lâm sàng ({visits.total} bệnh nhân)
                            </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Hiển thị:</span>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="text-xs rounded-lg border-gray-200 py-1 px-2 font-medium"
                            >
                                <option value={10}>10 bản ghi/trang</option>
                                <option value={20}>20 bản ghi/trang</option>
                                <option value={50}>50 bản ghi/trang</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                                    <th className="py-3 px-4">Số phiếu & Lượt</th>
                                    <th className="py-3 px-4">Bệnh nhân</th>
                                    <th className="py-3 px-4">Dịch vụ CLS chỉ định</th>
                                    <th className="py-3 px-4">Thời gian chỉ định</th>
                                    <th className="py-3 px-4">Trạng thái CLS</th>
                                    <th className="py-3 px-4">Thời gian hoàn thành</th>
                                    <th className="py-3 px-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {visits.data.length > 0 ? (
                                    visits.data.map((visit) => {
                                        const overallStatus = getClsOverallStatus(visit);
                                        const services = visit.chiDinhDichVus || [];
                                        const allDone = services.length > 0 && services.every(s => ['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'].includes(s.TrangThai));
                                        const canConfirmReturn = visit.TrangThai === 'CHO_KET_QUA' && allDone;
                                        const isReturned = visit.TrangThai === 'CHO_KHAM_LAI';

                                        // Lấy thời gian hoàn thành mới nhất
                                        const latestCompletedTime = services
                                            .map(s => s.ThoiGianXacNhan || s.NgayThucHien)
                                            .filter(Boolean)
                                            .sort()
                                            .reverse()[0];

                                        const firstOrderedTime = services[0]?.NgayChiDinh || visit.ThoiGianTiepNhan;

                                        return (
                                            <tr key={visit.MaLuotKham} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Số phiếu & Mã lượt */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                                            {visit.SoPhieu || `#${visit.MaLuotKham}`}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-gray-400">
                                                            STT: {visit.STTTrongNgay ?? '-'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        Mã lượt: #{visit.MaLuotKham}
                                                    </p>
                                                </td>

                                                {/* Thông tin bệnh nhân */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {visit.benhNhan?.HoTen}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                                                        <span className="font-mono text-primary font-medium">
                                                            BN{String(visit.benhNhan?.MaBenhNhan || '').padStart(3, '0')}
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span>{visit.benhNhan?.GioiTinh === 'NU' ? 'Nữ' : 'Nam'}</span>
                                                        <span>&bull;</span>
                                                        <span>{getAge(visit.benhNhan?.NgaySinh)}</span>
                                                    </div>
                                                    {visit.benhNhan?.SoDienThoai && (
                                                        <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{visit.benhNhan.SoDienThoai}</span>
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Dịch vụ CLS chỉ định */}
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-1 max-w-xs">
                                                        {services.map((s) => {
                                                            const isDone = ['DA_CO_KET_QUA', 'HOAN_THANH'].includes(s.TrangThai);
                                                            return (
                                                                <div 
                                                                    key={s.MaChiDinh}
                                                                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]"
                                                                >
                                                                    <span className="font-medium text-gray-800 truncate" title={s.dichVu?.TenDichVu}>
                                                                        {s.dichVu?.TenDichVu || 'Dịch vụ CLS'}
                                                                    </span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                                                        isDone 
                                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                                            : s.TrangThai === 'DANG_THUC_HIEN'
                                                                            ? 'bg-sky-100 text-sky-700'
                                                                            : 'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                        {isDone ? 'Đã có KQ' : s.TrangThai === 'DANG_THUC_HIEN' ? 'Đang làm' : 'Chờ làm'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>

                                                {/* Thời gian chuyển sang CLS */}
                                                <td className="py-3.5 px-4 font-mono text-gray-600">
                                                    {firstOrderedTime ? (
                                                        <>
                                                            <div className="font-bold text-gray-800">
                                                                {firstOrderedTime.split(' ')[1]?.slice(0, 5) || firstOrderedTime.slice(11, 16)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                {firstOrderedTime.split(' ')[0] || ''}
                                                            </div>
                                                        </>
                                                    ) : '-'}
                                                </td>

                                                {/* Trạng thái CLS */}
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${overallStatus.color}`}>
                                                        <span>{overallStatus.label}</span>
                                                    </span>
                                                </td>

                                                {/* Thời gian hoàn thành kết quả */}
                                                <td className="py-3.5 px-4 font-mono text-gray-600">
                                                    {latestCompletedTime ? (
                                                        <>
                                                            <div className="font-bold text-emerald-700">
                                                                {latestCompletedTime.split(' ')[1]?.slice(0, 5) || latestCompletedTime.slice(11, 16)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                {latestCompletedTime.split(' ')[0] || ''}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Chưa hoàn thành</span>
                                                    )}
                                                </td>

                                                {/* Thao tác */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Xem chi tiết kết quả */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedVisitForModal(visit)}
                                                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
                                                            title="Xem chi tiết kết quả CLS"
                                                        >
                                                            <Eye className="w-4 h-4 text-primary" />
                                                        </button>

                                                        {/* Nút xác nhận bệnh nhân đã quay lại */}
                                                        {canConfirmReturn && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirmReturn(visit.MaLuotKham)}
                                                                disabled={confirmingReturnId === visit.MaLuotKham}
                                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                                                title="Xác nhận bệnh nhân đã có mặt để khám lại"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Xác nhận quay lại</span>
                                                            </button>
                                                        )}

                                                        {/* Đã quay lại -> Nút vào khám ngay */}
                                                        {isReturned && (
                                                            <Link
                                                                href={`/doctor/examine?visit_id=${visit.MaLuotKham}`}
                                                                className="px-2.5 py-1.5 bg-primary-light hover:bg-primary-light/80 text-primary rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                            >
                                                                <Stethoscope className="w-3.5 h-3.5" />
                                                                <span>Vào khám lại</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400">
                                            <FlaskConical className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                            <p className="font-medium text-sm">Không tìm thấy bệnh nhân nào trong danh sách chờ CLS.</p>
                                            <p className="text-xs text-gray-400 mt-1">Thay đổi ngày hoặc bộ lọc để xem các lượt khám khác.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Phân trang server-side */}
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                        <div>
                            Hiển thị <strong className="font-bold text-gray-900">{visits.total > 0 ? (visits.from || 1) : 0}</strong> - <strong className="font-bold text-gray-900">{visits.to || 0}</strong> trong tổng số <strong className="font-bold text-gray-900">{visits.total}</strong> bệnh nhân
                        </div>

                        {visits.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(visits.current_page - 1)}
                                    disabled={visits.current_page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Trang trước</span>
                                </button>

                                <span className="px-3 py-1.5 rounded-lg bg-gray-50 font-bold text-gray-800 border border-gray-200">
                                    {visits.current_page} / {visits.last_page}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(visits.current_page + 1)}
                                    disabled={visits.current_page >= visits.last_page}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                                >
                                    <span>Trang sau</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Modal xem chi tiết kết quả CLS của bệnh nhân */}
                {selectedVisitForModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <FlaskConical className="w-5 h-5 text-primary" />
                                        <span>Chi tiết kết quả Cận lâm sàng</span>
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Bệnh nhân: <strong className="text-gray-800">{selectedVisitForModal.benhNhan?.HoTen}</strong> &bull; Số phiếu: <span className="font-mono font-bold text-primary">{selectedVisitForModal.SoPhieu}</span>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedVisitForModal(null)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Danh sách các chỉ định dịch vụ */}
                            <div className="space-y-4">
                                {(selectedVisitForModal.chiDinhDichVus || []).map((cd, idx) => (
                                    <div key={cd.MaChiDinh} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm text-gray-900">
                                                {idx + 1}. {cd.dichVu?.TenDichVu}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                ['DA_CO_KET_QUA', 'HOAN_THANH'].includes(cd.TrangThai)
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {cd.TrangThai}
                                            </span>
                                        </div>

                                        {cd.KetQua ? (
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                                                <p className="font-semibold text-gray-700">Kết quả đo lường:</p>
                                                <p className="text-gray-900 font-medium whitespace-pre-wrap">{cd.KetQua}</p>
                                                {cd.KetLuan && (
                                                    <p className="text-gray-800 mt-2 pt-2 border-t border-gray-100">
                                                        <strong className="text-primary">Kết luận:</strong> {cd.KetLuan}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Chưa cập nhật kết quả từ phòng cận lâm sàng.</p>
                                        )}

                                        <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono pt-1">
                                            <span>Chỉ định lúc: {cd.NgayChiDinh || '-'}</span>
                                            {cd.ThoiGianXacNhan && <span>Xác nhận kết quả: {cd.ThoiGianXacNhan}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedVisitForModal(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Đóng
                                </button>
                                <Link
                                    href={`/doctor/examine?visit_id=${selectedVisitForModal.MaLuotKham}`}
                                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                >
                                    <Stethoscope className="w-4 h-4" />
                                    <span>Vào hồ sơ khám</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
