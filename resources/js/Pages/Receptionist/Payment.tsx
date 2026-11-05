import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';
import { 
    Users, 
    Calendar,
    CreditCard,
    Receipt,
    Printer,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    RefreshCw,
    Plus,
    XCircle,
    AlertCircle,
    Loader2,
    ShieldCheck,
    DollarSign,
    Check,
    ChevronRight,
    Eye,
    Tag,
    Building2,
    QrCode,
    AlertTriangle,
    LayoutList,
    LayoutGrid,
    Stethoscope,
    Pill,
    FlaskConical,
    User,
    ArrowRight
} from 'lucide-react';

interface BenhNhan {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    GioiTinh: string;
    NgaySinh?: string;
    DiaChi?: string;
    SoTheBHYT?: string;
    MucHuongBHYT?: number;
}

interface ChiTietHoaDon {
    MaChiTietHoaDon: number;
    MaHoaDon: number;
    LoaiChiPhi: string;
    NoiDung: string;
    SoLuong: number;
    DonGia: number | string;
    ThanhTien?: number | string;
    DuocBHYTChiTra?: boolean;
    TienBHYTChiTra?: number | string;
    TienBenhNhanChiTra?: number | string;
    MaChiDinh?: number;
    MaChiTietDonThuoc?: number;
}

interface ThanhToan {
    MaThanhToan: number;
    MaHoaDon: number;
    SoTien: number | string;
    PhuongThucThanhToan: string;
    ThoiGianThanhToan?: string;
    TrangThai: string;
    MaGiaoDich?: string;
    GhiChu?: string;
    NgayTao?: string;
}

interface HoaDon {
    MaHoaDon: number;
    MaLuotKham: number;
    TongTien: number | string;
    GiamGia: number | string;
    BaoHiemChiTra: number | string;
    BenhNhanChiTra: number | string;
    TrangThai: string;
    NgayTao: string;
    GhiChu?: string;
    DaThanhToan?: number;
    ConLai?: number;
    luotKham?: {
        MaLuotKham: number;
        TrangThai: string;
        benhNhan?: BenhNhan;
        benh_nhan?: BenhNhan;
        bacSi?: {
            MaBacSi: number;
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
        bac_si?: {
            MaBacSi: number;
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
    };
    luot_kham?: {
        MaLuotKham: number;
        TrangThai: string;
        benhNhan?: BenhNhan;
        benh_nhan?: BenhNhan;
        bacSi?: {
            MaBacSi: number;
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
        bac_si?: {
            MaBacSi: number;
            HoTen: string;
            chuyenKhoa?: {
                TenChuyenKhoa: string;
            };
        };
    };
    chiTietHoaDons?: ChiTietHoaDon[];
    chi_tiet_hoa_dons?: ChiTietHoaDon[];
    thanhToans?: ThanhToan[];
    thanh_toans?: ThanhToan[];
}

interface LuotKhamUnbilled {
    MaLuotKham: number;
    TrangThai: string;
    ThoiGianTiepNhan?: string;
    CoBHYT?: boolean;
    SoTheBHYT?: string;
    MucHuongBHYT?: number;
    TuyenKCB?: string;
    benhNhan?: BenhNhan;
    benh_nhan?: BenhNhan;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
    };
    bac_si?: {
        MaBacSi: number;
        HoTen: string;
    };
    donThuoc?: {
        MaDonThuoc: number;
        TrangThai: string;
        chiTietDonThuocs?: Array<{
            MaChiTietDonThuoc: number;
            SoLuong: number;
            DonGia: number | string;
            thuoc?: { TenThuoc: string; ApDungBHYT?: boolean };
        }>;
        chi_tiet_don_thuocs?: Array<{
            MaChiTietDonThuoc: number;
            SoLuong: number;
            DonGia: number | string;
            thuoc?: { TenThuoc: string; ApDungBHYT?: boolean };
        }>;
    };
    don_thuoc?: {
        MaDonThuoc: number;
        TrangThai: string;
        chiTietDonThuocs?: Array<{
            MaChiTietDonThuoc: number;
            SoLuong: number;
            DonGia: number | string;
            thuoc?: { TenThuoc: string; ApDungBHYT?: boolean };
        }>;
        chi_tiet_don_thuocs?: Array<{
            MaChiTietDonThuoc: number;
            SoLuong: number;
            DonGia: number | string;
            thuoc?: { TenThuoc: string; ApDungBHYT?: boolean };
        }>;
    };
    chiDinhDichVus?: Array<{
        MaChiDinh: number;
        TrangThai: string;
        DonGia: number | string;
        dichVu?: { TenDichVu: string; ApDungBHYT?: boolean };
        dich_vu?: { TenDichVu: string; ApDungBHYT?: boolean };
    }>;
    chi_dinh_dich_vus?: Array<{
        MaChiDinh: number;
        TrangThai: string;
        DonGia: number | string;
        dichVu?: { TenDichVu: string; ApDungBHYT?: boolean };
        dich_vu?: { TenDichVu: string; ApDungBHYT?: boolean };
    }>;
}

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

interface Props {
    auth: any;
    invoices?: HoaDon[] | Paginated<HoaDon>;
    unbilledVisits?: LuotKhamUnbilled[] | Paginated<LuotKhamUnbilled>;
    stats: {
        todayRevenue: number;
        todayInvoices: number;
        unpaidCount: number;
        paidCount: number;
    };
    filters: {
        search?: string;
        date?: string;
        status?: string;
        per_page?: number | string;
        page?: number | string;
        unbilled_search?: string;
        unbilled_per_page?: number | string;
        unbilled_page?: number | string;
    };
}

export default function ReceptionistPayment({
    auth,
    invoices = [],
    unbilledVisits = [],
    stats = { todayRevenue: 0, todayInvoices: 0, unpaidCount: 0, paidCount: 0 },
    filters = {}
}: Props) {
    const { flash } = usePage<any>().props;

    const invoiceList = Array.isArray(invoices) ? invoices : invoices?.data ?? [];
    const invoicePagination = Array.isArray(invoices)
        ? { current_page: 1, last_page: 1, per_page: invoiceList.length || 10, total: invoiceList.length || 0, from: null, to: null }
        : (invoices ?? { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null });

    const unbilledList = Array.isArray(unbilledVisits) ? unbilledVisits : unbilledVisits?.data ?? [];
    const unbilledPagination = Array.isArray(unbilledVisits)
        ? { current_page: 1, last_page: 1, per_page: unbilledList.length || 10, total: unbilledList.length || 0, from: null, to: null }
        : (unbilledVisits ?? { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null });

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [filterDate, setFilterDate] = useState<string>(filters.date || '');
    const [filterStatus, setFilterStatus] = useState<string>(filters.status || '');
    const [perPage, setPerPage] = useState<number>(Number(filters.per_page) || 10);
    const [currentPage, setCurrentPage] = useState<number>(Number(filters.page) || 1);
    const [unbilledSearchQuery, setUnbilledSearchQuery] = useState<string>(filters.unbilled_search || '');
    const [unbilledPerPage, setUnbilledPerPage] = useState<number>(Number(filters.unbilled_per_page) || 10);
    const [unbilledPage, setUnbilledPage] = useState<number>(Number(filters.unbilled_page) || 1);

    // Active Tab in page: 'invoices' (Danh sách hóa đơn), 'unbilled' (Chờ lập hóa đơn)
    const [activeTab, setActiveTab] = useState<'invoices' | 'unbilled'>('invoices');

    // Modal: Xem chi tiết hóa đơn / In hóa đơn
    const [viewingInvoice, setViewingInvoice] = useState<HoaDon | null>(null);

    // Modal: Thu tiền thanh toán
    const [payingInvoice, setPayingInvoice] = useState<HoaDon | null>(null);
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payMethod, setPayMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE'>('TIEN_MAT');
    const [payNote, setPayNote] = useState<string>('');
    const [payTxnId, setPayTxnId] = useState<string>('');

    // Modal: Tạo hóa đơn mới cho Lượt khám
    const [creatingForVisit, setCreatingForVisit] = useState<LuotKhamUnbilled | null>(null);
    const [createTienKham, setCreateTienKham] = useState<number>(0);
    const [createGiamGia, setCreateGiamGia] = useState<number>(0);
    const [createBaoHiem, setCreateBaoHiem] = useState<number>(0);
    const [createNote, setCreateNote] = useState<string>('');

    // Loading states
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const handleApplyFilter = (next: Partial<{ search: string; date: string; status: string; per_page: number; page: number }> = {}) => {
        const query: Record<string, string | number | undefined> = {
            search: next.search !== undefined ? next.search : (searchQuery || undefined),
            date: next.date !== undefined ? next.date : (filterDate || undefined),
            status: next.status !== undefined ? next.status : (filterStatus || undefined),
            per_page: next.per_page ?? perPage,
            page: next.page ?? 1,
        };

        router.get('/receptionist/payment', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilter = () => {
        setSearchQuery('');
        setFilterDate('');
        setFilterStatus('');
        setPerPage(10);
        setCurrentPage(1);
        router.get('/receptionist/payment', { per_page: 10, page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > (invoicePagination.last_page ?? 1) || page === currentPage) return;
        setCurrentPage(page);
        handleApplyFilter({ page, per_page: perPage });
    };

    const handleApplyUnbilledFilter = (next: Partial<{ search: string; per_page: number; page: number }> = {}) => {
        const query: Record<string, string | number | undefined> = {
            unbilled_search: next.search !== undefined ? next.search : (unbilledSearchQuery || undefined),
            unbilled_per_page: next.per_page ?? unbilledPerPage,
            unbilled_page: next.page ?? 1,
        };

        router.get('/receptionist/payment', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetUnbilledFilter = () => {
        setUnbilledSearchQuery('');
        setUnbilledPerPage(10);
        setUnbilledPage(1);
        router.get('/receptionist/payment', { unbilled_search: undefined, unbilled_per_page: 10, unbilled_page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleUnbilledPageChange = (page: number) => {
        if (page < 1 || page > (unbilledPagination.last_page ?? 1) || page === unbilledPage) return;
        setUnbilledPage(page);
        handleApplyUnbilledFilter({ page, per_page: unbilledPerPage });
    };

    // Mở modal thu tiền
    const handleOpenPayModal = (inv: HoaDon) => {
        const conNo = inv.ConLai ?? Math.max(0, Number(inv.BenhNhanChiTra) - (inv.DaThanhToan || 0));
        setPayingInvoice(inv);
        setPayAmount(conNo);
        setPayMethod('TIEN_MAT');
        setPayNote('');
        // Tạo mã giao dịch duy nhất cho phiên thu tiền (chống duplicate / double submit)
        setPayTxnId('TXN_' + inv.MaHoaDon + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    };

    // Xác nhận thu tiền
    const handleSubmitPayment = () => {
        if (!payingInvoice || payAmount <= 0) return;

        setLoadingAction('pay');
        router.post(`/receptionist/invoices/${payingInvoice.MaHoaDon}/pay`, {
            SoTien: payAmount,
            PhuongThucThanhToan: payMethod,
            GhiChu: payNote || null,
            MaGiaoDich: payTxnId || null,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setPayingInvoice(null);
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Lỗi khi ghi nhận thanh toán.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Mở modal tạo hóa đơn (Tự động tính sẵn mức hưởng BHYT)
    const handleOpenCreateInvoiceModal = (visit: LuotKhamUnbilled) => {
        setCreatingForVisit(visit);
        setCreateTienKham(0);
        setCreateGiamGia(0);
        setCreateNote('');

        const patient = getPatient(visit);
        const hasBhyt = Boolean(visit.CoBHYT || visit.SoTheBHYT || patient?.SoTheBHYT);
        const mucHuong = hasBhyt ? Number(visit.MucHuongBHYT ?? patient?.MucHuongBHYT ?? 80) : 0;

        let medBhytEligible = 0;
        const rx = getPrescription(visit);
        if (rx && rx.TrangThai !== 'DA_HUY') {
            const details = getPrescriptionDetails(visit);
            details.forEach((ct: any) => {
                const line = Number(ct.SoLuong || 0) * Number(ct.DonGia || 0);
                const isBhyt = ct.thuoc ? (ct.thuoc.ApDungBHYT !== false) : true;
                if (isBhyt) medBhytEligible += line;
            });
        }

        let svcBhytEligible = 0;
        const services = getServices(visit);
        services.forEach((cd: any) => {
            if (cd && cd.TrangThai !== 'DA_HUY') {
                const line = Number(cd.DonGia || 0);
                const isBhyt = cd.dichVu ? (cd.dichVu.ApDungBHYT !== false) : true;
                if (isBhyt) svcBhytEligible += line;
            }
        });

        const initialAutoBhyt = mucHuong > 0 ? Math.round((medBhytEligible + svcBhytEligible) * (mucHuong / 100)) : 0;
        setCreateBaoHiem(initialAutoBhyt);
    };

    // Helper accessors for snake_case vs camelCase normalization
    const asArray = <T,>(value: T[] | Record<string, T> | null | undefined): T[] => {
        if (Array.isArray(value)) return value;
        if (!value) return [];
        return Object.values(value as Record<string, T>);
    };

    const getPatient = (visit: LuotKhamUnbilled | null | undefined): BenhNhan | undefined => {
        if (!visit) return undefined;
        return visit.benh_nhan || visit.benhNhan;
    };

    const getDoctor = (visit: LuotKhamUnbilled | null | undefined) => {
        if (!visit) return undefined;
        return visit.bac_si || visit.bacSi;
    };

    const getPrescription = (visit: LuotKhamUnbilled | null | undefined) => {
        if (!visit) return undefined;
        return visit.don_thuoc || visit.donThuoc;
    };

    const getPrescriptionDetails = (visit: LuotKhamUnbilled | null | undefined) => {
        const rx = getPrescription(visit);
        if (!rx) return [];
        return asArray(rx.chi_tiet_don_thuocs || rx.chiTietDonThuocs || []);
    };

    const getServices = (visit: LuotKhamUnbilled | null | undefined) => {
        if (!visit) return [];
        return asArray(visit.chi_dinh_dich_vus || visit.chiDinhDichVus || []);
    };

    const getActiveMedicineCount = (visit: LuotKhamUnbilled) => {
        const medicines = getPrescriptionDetails(visit);
        return medicines.filter((item: any) => item && item.TrangThai !== 'DA_HUY' && Number(item.SoLuong ?? 0) > 0).length;
    };

    const getActiveServiceCount = (visit: LuotKhamUnbilled) => {
        const services = getServices(visit);
        return services.filter((item: any) => item && item.TrangThai !== 'DA_HUY').length;
    };

    const getInvoiceVisit = (inv: HoaDon | null | undefined) => {
        if (!inv) return undefined;
        return inv.luotKham || inv.luot_kham;
    };

    const getInvoicePatient = (inv: HoaDon | null | undefined): BenhNhan | undefined => {
        const lk = getInvoiceVisit(inv);
        return lk?.benhNhan || lk?.benh_nhan;
    };

    const getInvoiceDoctor = (inv: HoaDon | null | undefined) => {
        const lk = getInvoiceVisit(inv);
        return lk?.bacSi || lk?.bac_si;
    };

    // Sub-filters & display mode for Unbilled Tab
    const [unbilledStatusFilter, setUnbilledStatusFilter] = useState<'ALL' | 'HOAN_THANH' | 'DANG_KHAM'>('ALL');
    const [unbilledViewMode, setUnbilledViewMode] = useState<'table' | 'grid'>('table');

    const filteredUnbilledList = useMemo(() => {
        if (unbilledStatusFilter === 'ALL') return unbilledList;
        return unbilledList.filter((item) => item.TrangThai === unbilledStatusFilter);
    }, [unbilledList, unbilledStatusFilter]);

    const unbilledCounts = useMemo(() => {
        const total = unbilledList.length;
        const completed = unbilledList.filter((item) => item.TrangThai === 'HOAN_THANH').length;
        const inProgress = unbilledList.filter((item) => item.TrangThai === 'DANG_KHAM').length;
        return { total, completed, inProgress };
    }, [unbilledList]);

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    // Tạm tính chi phí & Phân bổ BHYT trước khi tạo hóa đơn
    const estimatedCreateSummary = useMemo(() => {
        if (!creatingForVisit) {
            return {
                total: 0,
                patientPay: 0,
                medTotal: 0,
                svcTotal: 0,
                examCost: 0,
                bhytCoveredTotal: 0,
                selfPayTotal: 0,
                autoBhytAmount: 0,
                mucHuong: 0,
                soTheBhyt: '',
                hasBhyt: false,
            };
        }

        const patient = getPatient(creatingForVisit);
        const hasBhyt = Boolean(creatingForVisit.CoBHYT || creatingForVisit.SoTheBHYT || patient?.SoTheBHYT);
        const soTheBhyt = creatingForVisit.SoTheBHYT || patient?.SoTheBHYT || '';
        const mucHuong = hasBhyt ? Number(creatingForVisit.MucHuongBHYT ?? patient?.MucHuongBHYT ?? 80) : 0;

        let medTotal = 0;
        let medBhytEligible = 0;
        const rx = getPrescription(creatingForVisit);
        if (rx && rx.TrangThai !== 'DA_HUY') {
            const details = getPrescriptionDetails(creatingForVisit);
            details.forEach((ct: any) => {
                const line = Number(ct.SoLuong || 0) * Number(ct.DonGia || 0);
                medTotal += line;
                const isBhyt = ct.thuoc ? (ct.thuoc.ApDungBHYT !== false) : true;
                if (isBhyt) medBhytEligible += line;
            });
        }

        let svcTotal = 0;
        let svcBhytEligible = 0;
        const services = getServices(creatingForVisit);
        services.forEach((cd: any) => {
            if (cd && cd.TrangThai !== 'DA_HUY') {
                const line = Number(cd.DonGia || 0);
                svcTotal += line;
                const isBhyt = cd.dichVu ? (cd.dichVu.ApDungBHYT !== false) : true;
                if (isBhyt) svcBhytEligible += line;
            }
        });

        const examCost = Number(createTienKham) || 0;
        const examBhytEligible = hasBhyt ? examCost : 0;

        const bhytCoveredTotal = medBhytEligible + svcBhytEligible + examBhytEligible;
        const selfPayTotal = (medTotal - medBhytEligible) + (svcTotal - svcBhytEligible) + (examCost - examBhytEligible);
        const autoBhytAmount = mucHuong > 0 ? Math.round(bhytCoveredTotal * (mucHuong / 100)) : 0;

        const totalCost = examCost + medTotal + svcTotal;
        const patientPay = Math.max(0, totalCost - (Number(createGiamGia) || 0) - (Number(createBaoHiem) || 0));

        return {
            total: totalCost,
            patientPay,
            medTotal,
            svcTotal,
            examCost,
            bhytCoveredTotal,
            selfPayTotal,
            autoBhytAmount,
            mucHuong,
            soTheBhyt,
            hasBhyt,
        };
    }, [creatingForVisit, createTienKham, createGiamGia, createBaoHiem]);

    // Gửi tạo hóa đơn
    const handleSubmitCreateInvoice = () => {
        if (!creatingForVisit) return;

        setLoadingAction('createInvoice');
        router.post('/receptionist/invoices', {
            MaLuotKham: creatingForVisit.MaLuotKham,
            TienKham: createTienKham > 0 ? createTienKham : null,
            GiamGia: createGiamGia,
            BaoHiemChiTra: createBaoHiem,
            GhiChu: createNote || null,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setCreatingForVisit(null);
                setActiveTab('invoices');
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Lỗi khi lập hóa đơn.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // In hóa đơn
    const handlePrintInvoice = () => {
        window.print();
    };

    return (
        <DashboardLayout
            role="receptionist"
            navItems={RECEPTIONIST_NAV_ITEMS}
            user={auth?.user}
            header="Quản lý Hóa đơn & Thu phí"
        >
            <Head title="Hóa đơn & Thu phí - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. Flash Alerts */}
                {flash?.success && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <p className="text-sm font-medium text-rose-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* 2. Thẻ thống kê doanh thu & hóa đơn hôm nay */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh thu hôm nay</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                                {Number(stats.todayRevenue).toLocaleString('vi-VN')} đ
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hóa đơn hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{stats.todayInvoices}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chưa thu / Còn nợ</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1 font-mono">{stats.unpaidCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã hoàn tất thanh toán</p>
                            <p className="text-2xl font-bold text-sky-600 mt-1 font-mono">{stats.paidCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Thanh công cụ tìm kiếm, bộ lọc & chuyển Tab */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                                activeTab === 'invoices'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Receipt className="w-4 h-4" /> Danh sách hóa đơn ({invoiceList.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('unbilled')}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                                activeTab === 'unbilled'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Clock className="w-4 h-4" /> Chờ lập hóa đơn
                            {unbilledList.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-mono">
                                    {unbilledPagination.total}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Bộ lọc cho Tab Hóa đơn */}
                    {activeTab === 'invoices' && (
                        <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:justify-end">
                            <div className="relative min-w-[220px]">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, SĐT, hoặc Mã HĐ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="text-xs rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary"
                            />

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-xs rounded-xl border border-gray-200 py-2 px-3 bg-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
                                <option value="THANH_TOAN_MOT_PHAN">Thanh toán 1 phần</option>
                                <option value="DA_THANH_TOAN">Đã thanh toán</option>
                                <option value="DA_HUY">Đã hủy</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Hiển thị</label>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        const nextPerPage = Number(e.target.value);
                                        setPerPage(nextPerPage);
                                        handleApplyFilter({ per_page: nextPerPage, page: 1 });
                                    }}
                                    className="text-xs rounded-xl border border-gray-200 py-2 px-2 bg-white focus:outline-none focus:border-primary"
                                >
                                    {[10, 20, 50].map((value) => (
                                        <option key={value} value={value}>{value}/trang</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => handleApplyFilter()}
                                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover flex items-center gap-1.5 shadow-sm"
                            >
                                <Filter className="w-3.5 h-3.5" /> Lọc
                            </button>

                            {(filterDate || filterStatus || searchQuery) && (
                                <button
                                    onClick={handleResetFilter}
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
                                    title="Đặt lại bộ lọc"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'unbilled' && (
                        <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:justify-end">
                            <div className="relative min-w-[220px]">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm mã BN, tên, SĐT, mã lượt..."
                                    value={unbilledSearchQuery}
                                    onChange={(e) => setUnbilledSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyUnbilledFilter({ search: e.currentTarget.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Hiển thị</label>
                                <select
                                    value={unbilledPerPage}
                                    onChange={(e) => {
                                        const nextPerPage = Number(e.target.value);
                                        setUnbilledPerPage(nextPerPage);
                                        handleApplyUnbilledFilter({ per_page: nextPerPage, page: 1 });
                                    }}
                                    className="text-xs rounded-xl border border-gray-200 py-2 px-2 bg-white focus:outline-none focus:border-primary"
                                >
                                    {[10, 20, 50].map((value) => (
                                        <option key={value} value={value}>{value}/trang</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => handleApplyUnbilledFilter()}
                                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover flex items-center gap-1.5 shadow-sm"
                            >
                                <Filter className="w-3.5 h-3.5" /> Lọc
                            </button>

                            {unbilledSearchQuery && (
                                <button
                                    onClick={handleResetUnbilledFilter}
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
                                    title="Đặt lại bộ lọc"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. Nội dung Tab 1: Danh sách hóa đơn */}
                {activeTab === 'invoices' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Mã HĐ</th>
                                        <th className="px-5 py-3.5">Ngày lập</th>
                                        <th className="px-5 py-3.5">Bệnh nhân</th>
                                        <th className="px-5 py-3.5 text-right">Tổng chi phí</th>
                                        <th className="px-5 py-3.5 text-right">Miễn giảm / BHYT</th>
                                        <th className="px-5 py-3.5 text-right">Cần thanh toán</th>
                                        <th className="px-5 py-3.5 text-right">Đã thu</th>
                                        <th className="px-5 py-3.5 text-right">Còn nợ</th>
                                        <th className="px-5 py-3.5 text-center">Trạng thái</th>
                                        <th className="px-5 py-3.5 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoiceList.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-gray-400">
                                                <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm">Không tìm thấy hóa đơn nào phù hợp.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoiceList.map((inv) => {
                                            const conNo = inv.ConLai ?? Math.max(0, Number(inv.BenhNhanChiTra) - (inv.DaThanhToan || 0));
                                            const ngayTaoStr = inv.NgayTao ? new Date(inv.NgayTao).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';

                                            return (
                                                <tr key={inv.MaHoaDon} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-5 py-3.5 font-bold text-gray-900 font-mono">
                                                        #HD{inv.MaHoaDon}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-500">
                                                        {ngayTaoStr}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-gray-900">
                                                            {getInvoicePatient(inv)?.HoTen || 'Bệnh nhân'}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 font-mono">
                                                            {getInvoicePatient(inv)?.SoDienThoai || '--'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-gray-700">
                                                        {Number(inv.TongTien).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-gray-500 text-[11px]">
                                                        {(Number(inv.GiamGia) + Number(inv.BaoHiemChiTra)).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                                                        {Number(inv.BenhNhanChiTra).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-semibold">
                                                        {(inv.DaThanhToan || 0).toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                                                        {conNo.toLocaleString('vi-VN')} đ
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                            inv.TrangThai === 'DA_THANH_TOAN' ? 'bg-emerald-100 text-emerald-700' :
                                                            inv.TrangThai === 'THANH_TOAN_MOT_PHAN' ? 'bg-sky-100 text-sky-700' :
                                                            inv.TrangThai === 'DA_HUY' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {inv.TrangThai === 'DA_THANH_TOAN' ? 'Đã thanh toán' :
                                                             inv.TrangThai === 'THANH_TOAN_MOT_PHAN' ? 'TT 1 phần' :
                                                             inv.TrangThai === 'DA_HUY' ? 'Đã hủy' : 'Chưa thanh toán'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right space-x-2">
                                                        <button
                                                            onClick={() => setViewingInvoice(inv)}
                                                            className="px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                                                        </button>

                                                        {inv.TrangThai !== 'DA_THANH_TOAN' && inv.TrangThai !== 'DA_HUY' && conNo > 0 && (
                                                            <button
                                                                onClick={() => handleOpenPayModal(inv)}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" /> Thu tiền
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {invoicePagination.last_page > 1 && activeTab === 'invoices' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                        <span>Trang {invoicePagination.current_page}/{invoicePagination.last_page} • Tổng {invoicePagination.total} hóa đơn</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handlePageChange((invoicePagination.current_page ?? 1) - 1)} disabled={invoicePagination.current_page <= 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50">Trước</button>
                            <button type="button" onClick={() => handlePageChange((invoicePagination.current_page ?? 1) + 1)} disabled={invoicePagination.current_page >= invoicePagination.last_page} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}

                {/* 5. Nội dung Tab 2: Lượt khám chờ lập hóa đơn */}
                {activeTab === 'unbilled' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    Lượt khám đang chờ lập hóa đơn
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                        {unbilledPagination.total} lượt khám
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Danh sách bệnh nhân đã tiếp nhận vào phòng khám hoặc đã hoàn tất khám bệnh, sẵn sàng tổng hợp chi phí và lập hóa đơn thu tiền.
                                </p>
                            </div>

                            {/* View Switcher: Table vs Grid */}
                            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setUnbilledViewMode('table')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                                        unbilledViewMode === 'table'
                                            ? 'bg-white text-primary shadow-xs font-bold'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                    Dạng bảng ({unbilledPagination.total})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnbilledViewMode('grid')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                                        unbilledViewMode === 'grid'
                                            ? 'bg-white text-primary shadow-xs font-bold'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Dạng thẻ
                                </button>
                            </div>
                        </div>

                        {/* Status Filter Tabs / Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setUnbilledStatusFilter('ALL')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                    unbilledStatusFilter === 'ALL'
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                                }`}
                            >
                                <span>Tất cả</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    unbilledStatusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    {unbilledCounts.total}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setUnbilledStatusFilter('HOAN_THANH')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                    unbilledStatusFilter === 'HOAN_THANH'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã khám xong - Sẵn sàng lập HĐ</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    unbilledStatusFilter === 'HOAN_THANH' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-800'
                                }`}>
                                    {unbilledCounts.completed}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setUnbilledStatusFilter('DANG_KHAM')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                    unbilledStatusFilter === 'DANG_KHAM'
                                        ? 'bg-sky-600 text-white shadow-sm'
                                        : 'bg-sky-50 text-sky-700 hover:bg-sky-100/70'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Đang khám</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    unbilledStatusFilter === 'DANG_KHAM' ? 'bg-white/20 text-white' : 'bg-sky-200 text-sky-800'
                                }`}>
                                    {unbilledCounts.inProgress}
                                </span>
                            </button>
                        </div>

                        {/* View Mode: Table vs Grid */}
                        {filteredUnbilledList.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                                <h4 className="font-bold text-gray-700 text-sm">Không có lượt khám nào phù hợp bộ lọc!</h4>
                                <p className="text-xs text-gray-400 mt-1">
                                    {unbilledStatusFilter !== 'ALL' ? 'Hãy thử đổi sang bộ lọc "Tất cả" để kiểm tra danh sách đầy đủ.' : 'Hiện không có lượt khám nào chờ xuất hóa đơn.'}
                                </p>
                            </div>
                        ) : unbilledViewMode === 'table' ? (
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="px-4 py-3.5">Mã LK & Tiếp nhận</th>
                                            <th className="px-4 py-3.5">Bệnh nhân</th>
                                            <th className="px-4 py-3.5">Bác sĩ khám</th>
                                            <th className="px-4 py-3.5">Đơn thuốc & Dịch vụ CLS</th>
                                            <th className="px-4 py-3.5 text-center">Trạng thái khám</th>
                                            <th className="px-4 py-3.5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUnbilledList.map((visit) => {
                                            const patient = getPatient(visit);
                                            const doctor = getDoctor(visit);
                                            const medCount = getActiveMedicineCount(visit);
                                            const svcCount = getActiveServiceCount(visit);
                                            const timeStr = formatDateTime(visit.ThoiGianTiepNhan);

                                            return (
                                                <tr key={visit.MaLuotKham} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold font-mono text-primary text-sm">
                                                            #LK{visit.MaLuotKham}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3 text-gray-400" />
                                                            {timeStr}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                                {patient?.HoTen ? patient.HoTen.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-sm">
                                                                    {patient?.HoTen || 'Bệnh nhân chưa đặt tên'}
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                                        BN-{patient?.MaBenhNhan || '--'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{patient?.GioiTinh === 'NAM' ? 'Nam' : patient?.GioiTinh === 'NU' ? 'Nữ' : patient?.GioiTinh || '--'}</span>
                                                                    <span>•</span>
                                                                    <span>SĐT: <span className="font-mono">{patient?.SoDienThoai || 'Chưa cập nhật'}</span></span>
                                                                    <span>•</span>
                                                                    {visit.CoBHYT || visit.SoTheBHYT || patient?.SoTheBHYT ? (
                                                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                                            BHYT {visit.MucHuongBHYT ?? patient?.MucHuongBHYT ?? 80}%
                                                                        </span>
                                                                    ) : (
                                                                        <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">
                                                                            Tự túc
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2 text-gray-800">
                                                            <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <span className="font-semibold">
                                                                {doctor?.HoTen ? `BS. ${doctor.HoTen}` : <span className="text-gray-400 italic">Chưa phân công</span>}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {medCount > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                                                                    <Pill className="w-3 h-3 text-amber-600" />
                                                                    {medCount} thuốc
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-400">Không có thuốc</span>
                                                            )}
                                                            <span className="text-gray-300">•</span>
                                                            {svcCount > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium">
                                                                    <FlaskConical className="w-3 h-3 text-purple-600" />
                                                                    {svcCount} dịch vụ CLS
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-400">Không có CLS</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                            visit.TrangThai === 'HOAN_THANH'
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                                                        }`}>
                                                            {visit.TrangThai === 'HOAN_THANH' ? (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                    Đã khám xong
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                                                                    Đang khám
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenCreateInvoiceModal(visit)}
                                                            className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover inline-flex items-center gap-1.5 shadow-sm transition-all"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5" />
                                                            Lập hóa đơn
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Grid View */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredUnbilledList.map((visit) => {
                                    const patient = getPatient(visit);
                                    const doctor = getDoctor(visit);
                                    const medCount = getActiveMedicineCount(visit);
                                    const svcCount = getActiveServiceCount(visit);

                                    return (
                                        <div key={visit.MaLuotKham} className="border border-gray-200 rounded-2xl p-4 bg-white hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                                        LK #{visit.MaLuotKham}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        visit.TrangThai === 'HOAN_THANH' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                                                    }`}>
                                                        {visit.TrangThai === 'HOAN_THANH' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {visit.TrangThai === 'HOAN_THANH' ? 'Đã khám xong' : 'Đang khám'}
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                                                        {patient?.HoTen ? patient.HoTen.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h4 className="font-bold text-gray-900 text-sm truncate">
                                                                {patient?.HoTen || 'Bệnh nhân'}
                                                            </h4>
                                                            {visit.CoBHYT || visit.SoTheBHYT || patient?.SoTheBHYT ? (
                                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                                                    BHYT {visit.MucHuongBHYT ?? patient?.MucHuongBHYT ?? 80}%
                                                                </span>
                                                            ) : (
                                                                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded text-[10px]">
                                                                    Tự túc
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                            SĐT: {patient?.SoDienThoai || 'Chưa cập nhật'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                            <span>BS: <span className="font-semibold text-gray-800">{doctor?.HoTen || '--'}</span></span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-[11px] text-gray-600 pt-2 border-t border-gray-100">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">
                                                        <Pill className="w-3 h-3 text-amber-600" /> {medCount} thuốc
                                                    </span>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-medium">
                                                        <FlaskConical className="w-3 h-3 text-purple-600" /> {svcCount} dịch vụ
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenCreateInvoiceModal(visit)}
                                                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Receipt className="w-3.5 h-3.5" /> Lập hóa đơn ngay
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {unbilledPagination.last_page > 1 && activeTab === 'unbilled' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                        <span>Trang {unbilledPagination.current_page}/{unbilledPagination.last_page} • Tổng {unbilledPagination.total} lượt khám</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleUnbilledPageChange((unbilledPagination.current_page ?? 1) - 1)} disabled={unbilledPagination.current_page <= 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50">Trước</button>
                            <button type="button" onClick={() => handleUnbilledPageChange((unbilledPagination.current_page ?? 1) + 1)} disabled={unbilledPagination.current_page >= unbilledPagination.last_page} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: XEM CHI TIẾT & IN HÓA ĐƠN */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
                        {/* Header Printable */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Hóa đơn #{viewingInvoice.MaHoaDon}</h3>
                                    <p className="text-xs text-gray-500">Ngày lập: {viewingInvoice.NgayTao}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Thông tin bệnh nhân */}
                        <div className="bg-gray-50 p-4 rounded-xl text-xs grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-gray-500">Bệnh nhân:</p>
                                <p className="font-bold text-gray-900 text-sm">{getInvoicePatient(viewingInvoice)?.HoTen || 'Bệnh nhân'}</p>
                                <p className="text-gray-600">SĐT: {getInvoicePatient(viewingInvoice)?.SoDienThoai || '--'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Địa chỉ:</p>
                                <p className="text-gray-700">{getInvoicePatient(viewingInvoice)?.DiaChi || 'Chưa cập nhật'}</p>
                                <p className="text-gray-600">Bác sĩ khám: {getInvoiceDoctor(viewingInvoice)?.HoTen || '--'}</p>
                            </div>
                        </div>

                        {/* Danh sách chi tiết chi phí */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/70 text-gray-700 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Khoản mục</th>
                                        <th className="px-3 py-2.5">Nội dung</th>
                                        <th className="px-3 py-2.5 text-center">SL</th>
                                        <th className="px-3 py-2.5 text-right">Đơn giá</th>
                                        <th className="px-3 py-2.5 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {viewingInvoice.chiTietHoaDons?.map((ct, idx) => (
                                        <tr key={ct.MaChiTietHoaDon || idx}>
                                            <td className="px-3 py-2 text-gray-500 font-semibold">
                                                {ct.LoaiChiPhi === 'THUOC' ? '💊 Thuốc' :
                                                 ct.LoaiChiPhi === 'DICH_VU' ? '🔬 Cận lâm sàng' : '🩺 Khám bệnh'}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-gray-900">{ct.NoiDung}</td>
                                            <td className="px-3 py-2 text-center">{ct.SoLuong}</td>
                                            <td className="px-3 py-2 text-right font-mono">{Number(ct.DonGia).toLocaleString('vi-VN')} đ</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                                {Number(ct.ThanhTien || (ct.SoLuong * Number(ct.DonGia))).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/70 font-semibold border-t border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 text-right text-gray-600">Tổng cộng chi phí:</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                            {Number(viewingInvoice.TongTien).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    {Number(viewingInvoice.GiamGia) > 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-1.5 text-right text-gray-600">Giảm giá / Ưu đãi:</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-rose-600">
                                                - {Number(viewingInvoice.GiamGia).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    )}
                                    {Number(viewingInvoice.BaoHiemChiTra) > 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-1.5 text-right text-gray-600">Bảo hiểm chi trả:</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-blue-600">
                                                - {Number(viewingInvoice.BaoHiemChiTra).toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 border-gray-300 font-bold text-sm bg-white">
                                        <td colSpan={4} className="px-3 py-2.5 text-right text-gray-900">Bệnh nhân cần thanh toán:</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-primary font-black">
                                            {Number(viewingInvoice.BenhNhanChiTra).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    <tr className="bg-emerald-50 text-emerald-800">
                                        <td colSpan={4} className="px-3 py-2 text-right">Đã thanh toán:</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold">
                                            {(viewingInvoice.DaThanhToan || 0).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                    <tr className="bg-rose-50 text-rose-800 font-bold">
                                        <td colSpan={4} className="px-3 py-2 text-right">Còn nợ:</td>
                                        <td className="px-3 py-2 text-right font-mono text-rose-600 text-sm">
                                            {(viewingInvoice.ConLai ?? Math.max(0, Number(viewingInvoice.BenhNhanChiTra) - (viewingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Lịch sử thanh toán */}
                        {viewingInvoice.thanhToans && viewingInvoice.thanhToans.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-800 text-xs">Lịch sử thu tiền ({viewingInvoice.thanhToans.length} lần)</h4>
                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                                    {viewingInvoice.thanhToans.map((tt) => (
                                        <div key={tt.MaThanhToan} className="p-2.5 bg-gray-50 flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-emerald-700 font-mono">
                                                    +{Number(tt.SoTien).toLocaleString('vi-VN')} đ
                                                </span>
                                                <span className="text-gray-500 ml-2">
                                                    ({tt.PhuongThucThanhToan === 'TIEN_MAT' ? 'Tiền mặt' :
                                                      tt.PhuongThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Thẻ'})
                                                </span>
                                                {tt.MaGiaoDich && (
                                                    <span className="text-gray-400 font-mono ml-2">Mã GD: {tt.MaGiaoDich}</span>
                                                )}
                                            </div>
                                            <span className="text-gray-500 text-[11px]">{tt.ThoiGianThanhToan}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nút hành động */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handlePrintInvoice}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
                            >
                                <Printer className="w-4 h-4" /> In phiếu thu (Print)
                            </button>

                            <div className="flex gap-2">
                                {viewingInvoice.TrangThai !== 'DA_THANH_TOAN' && viewingInvoice.TrangThai !== 'DA_HUY' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const targetInv = viewingInvoice;
                                            setViewingInvoice(null);
                                            handleOpenPayModal(targetInv);
                                        }}
                                        className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                                    >
                                        <CreditCard className="w-4 h-4" /> Thu tiền ngay
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: GHI NHẬN THU TIỀN THANH TOÁN */}
            {payingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-gray-900 text-base">Thu tiền viện phí</h3>
                            </div>
                            <button onClick={() => setPayingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Hóa đơn:</span>
                                <span className="font-bold text-gray-900">#HD{payingInvoice.MaHoaDon}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Bệnh nhân:</span>
                                <span className="font-bold text-gray-900">{getInvoicePatient(payingInvoice)?.HoTen || 'Bệnh nhân'}</span>
                            </div>
                            <div className="flex justify-between border-t border-emerald-100 pt-1 mt-1 text-sm font-bold text-emerald-800">
                                <span>Số tiền còn nợ:</span>
                                <span className="font-mono">
                                    {(payingInvoice.ConLai ?? Math.max(0, Number(payingInvoice.BenhNhanChiTra) - (payingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Số tiền thực thu (VNĐ) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(Number(e.target.value))}
                                    className="w-full text-base font-bold font-mono text-gray-900 rounded-xl border-gray-200 py-2 px-3 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Phương thức thanh toán</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'TIEN_MAT', label: 'Tiền mặt' },
                                        { id: 'CHUYEN_KHOAN', label: 'Chuyển khoản' },
                                        { id: 'THE', label: 'Thẻ POS' }
                                    ].map((m) => (
                                        <button
                                            type="button"
                                            key={m.id}
                                            onClick={() => setPayMethod(m.id as any)}
                                            className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                                payMethod === m.id
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {payMethod !== 'TIEN_MAT' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mã tham chiếu / Mã giao dịch</label>
                                    <input
                                        type="text"
                                        placeholder="VD: FT260900123..."
                                        value={payTxnId}
                                        onChange={(e) => setPayTxnId(e.target.value)}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú thu tiền</label>
                                <input
                                    type="text"
                                    placeholder="Ghi chú thêm nếu có..."
                                    value={payNote}
                                    onChange={(e) => setPayNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPayingInvoice(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitPayment}
                                disabled={payAmount <= 0 || loadingAction === 'pay'}
                                className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                {loadingAction === 'pay' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Xác nhận thu tiền
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: LẬP HÓA ĐƠN CHO LƯỢT KHÁM */}
            {creatingForVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-gray-900 text-base">Lập hóa đơn viện phí</h3>
                            </div>
                            <button onClick={() => setCreatingForVisit(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-blue-50/60 p-3 rounded-xl text-xs space-y-1.5 border border-blue-100">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Lượt khám:</span>
                                <span className="font-bold text-gray-900">#LK{creatingForVisit.MaLuotKham}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bệnh nhân:</span>
                                <span className="font-bold text-gray-900">{getPatient(creatingForVisit)?.HoTen || 'Bệnh nhân'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bác sĩ khám:</span>
                                <span className="text-gray-700">{getDoctor(creatingForVisit)?.HoTen || '--'}</span>
                            </div>
                            <div className="flex justify-between border-t border-blue-100/80 pt-1">
                                <span className="text-gray-500">Chế độ BHYT:</span>
                                <span className="font-bold text-xs">
                                    {estimatedCreateSummary.hasBhyt ? (
                                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            Hưởng {estimatedCreateSummary.mucHuong}% (Thẻ: {estimatedCreateSummary.soTheBhyt || 'Có BHYT'})
                                        </span>
                                    ) : (
                                        <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                            Tự túc (Không áp dụng BHYT)
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Tổng quan chi phí tự động từ DB */}
                        <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-2 bg-gray-50">
                            <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Phân tích chi phí & Danh mục BHYT:</h4>
                            <div className="flex justify-between text-gray-600">
                                <span>1. Tiền thuốc (từ đơn thuốc):</span>
                                <span className="font-mono font-semibold">{(estimatedCreateSummary.medTotal || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>2. Cận lâm sàng & Kỹ thuật:</span>
                                <span className="font-mono font-semibold">{(estimatedCreateSummary.svcTotal || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 bg-emerald-50/80 p-2 rounded-lg font-medium border border-emerald-100">
                                <span>• BHYT thanh toán tự động ({estimatedCreateSummary.mucHuong}%):</span>
                                <span className="font-mono font-bold">{(estimatedCreateSummary.autoBhytAmount || 0).toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        {/* Form nhập thêm thông tin */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Phí khám lâm sàng ban đầu (nếu có thu thêm)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={createTienKham}
                                    onChange={(e) => setCreateTienKham(Number(e.target.value))}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Miễn giảm (VNĐ)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={createGiamGia}
                                        onChange={(e) => setCreateGiamGia(Number(e.target.value))}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold text-gray-700">Bảo hiểm chi trả (VNĐ)</label>
                                        <button
                                            type="button"
                                            onClick={() => setCreateBaoHiem(estimatedCreateSummary.autoBhytAmount)}
                                            className="text-[10px] text-primary hover:underline font-bold"
                                        >
                                            Tự tính
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        value={createBaoHiem}
                                        onChange={(e) => setCreateBaoHiem(Number(e.target.value))}
                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 font-mono font-bold text-emerald-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú hóa đơn</label>
                                <input
                                    type="text"
                                    placeholder="Ghi chú hóa đơn viện phí..."
                                    value={createNote}
                                    onChange={(e) => setCreateNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3"
                                />
                            </div>

                            {/* Tóm tắt thanh toán */}
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs space-y-1 mt-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tổng chi phí:</span>
                                    <span className="font-mono font-bold">{estimatedCreateSummary.total.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-emerald-800 font-bold text-sm pt-1 border-t border-emerald-200">
                                    <span>Bệnh nhân cần trả:</span>
                                    <span className="font-mono">{estimatedCreateSummary.patientPay.toLocaleString('vi-VN')} đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setCreatingForVisit(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitCreateInvoice}
                                disabled={loadingAction === 'createInvoice'}
                                className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                {loadingAction === 'createInvoice' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Xác nhận lập hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MẪU PHIẾU THU IN CHUYÊN NGHIỆP (@media print) */}
            {viewingInvoice && (
                <div id="printable-receipt" className="hidden print:block font-serif text-black p-4 text-xs">
                    {/* Header phòng khám chính thức (Không tự tạo địa chỉ/hotline giả định) */}
                    <div className="text-center border-b border-gray-400 pb-3 mb-4">
                        <h2 className="font-bold text-sm tracking-widest uppercase">Hệ Thống Quản Lý Phòng Khám Thông Minh SmartCare</h2>
                        <h1 className="font-bold text-base mt-2 uppercase">Phiếu Thu Viện Phí & Dịch Vụ Khám Chữa Bệnh</h1>
                        <p className="text-[11px] italic">Mã hóa đơn: #HD{viewingInvoice.MaHoaDon} - Lượt khám: #LK{viewingInvoice.MaLuotKham}</p>
                    </div>

                    {/* Thông tin bệnh nhân & lượt khám */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                        <div>
                            <p><span className="font-semibold">Họ tên người bệnh:</span> {getInvoicePatient(viewingInvoice)?.HoTen || '--'}</p>
                            <p><span className="font-semibold">Mã bệnh nhân:</span> #BN{getInvoicePatient(viewingInvoice)?.MaBenhNhan || '--'}</p>
                            <p><span className="font-semibold">Số điện thoại:</span> {getInvoicePatient(viewingInvoice)?.SoDienThoai || '--'}</p>
                            <p><span className="font-semibold">Địa chỉ:</span> {getInvoicePatient(viewingInvoice)?.DiaChi || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                            <p><span className="font-semibold">Bác sĩ khám:</span> {getInvoiceDoctor(viewingInvoice)?.HoTen || '--'}</p>
                            <p><span className="font-semibold">Chuyên khoa:</span> {viewingInvoice.luotKham?.bacSi?.chuyenKhoa?.TenChuyenKhoa || '--'}</p>
                            <p><span className="font-semibold">Ngày tạo HĐ:</span> {viewingInvoice.NgayTao}</p>
                            <p><span className="font-semibold">Ngày giờ in:</span> {new Date().toLocaleString('vi-VN')}</p>
                        </div>
                    </div>

                    {/* Bảng chi tiết chi phí */}
                    <table className="w-full border-collapse border border-gray-400 text-[10px] mb-4">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-1.5 text-center w-8">STT</th>
                                <th className="border border-gray-400 p-1.5 text-left w-24">Khoản mục</th>
                                <th className="border border-gray-400 p-1.5 text-left">Tên thuốc / Dịch vụ kỹ thuật</th>
                                <th className="border border-gray-400 p-1.5 text-center w-12">SL</th>
                                <th className="border border-gray-400 p-1.5 text-right w-20">Đơn giá</th>
                                <th className="border border-gray-400 p-1.5 text-right w-24">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewingInvoice.chiTietHoaDons?.map((ct, idx) => (
                                <tr key={ct.MaChiTietHoaDon || idx}>
                                    <td className="border border-gray-400 p-1.5 text-center">{idx + 1}</td>
                                    <td className="border border-gray-400 p-1.5 font-medium">
                                        {ct.LoaiChiPhi === 'THUOC' ? 'Thuốc điều trị' :
                                         ct.LoaiChiPhi === 'DICH_VU' ? 'Cận lâm sàng' : 'Khám lâm sàng'}
                                    </td>
                                    <td className="border border-gray-400 p-1.5 font-semibold">{ct.NoiDung}</td>
                                    <td className="border border-gray-400 p-1.5 text-center">{ct.SoLuong}</td>
                                    <td className="border border-gray-400 p-1.5 text-right">{Number(ct.DonGia).toLocaleString('vi-VN')} đ</td>
                                    <td className="border border-gray-400 p-1.5 text-right font-semibold">
                                        {(Number(ct.SoLuong) * Number(ct.DonGia)).toLocaleString('vi-VN')} đ
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-semibold">1. Tổng chi phí viện phí:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold">{Number(viewingInvoice.TongTien).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            {Number(viewingInvoice.BaoHiemChiTra) > 0 && (
                                <tr>
                                    <td colSpan={5} className="border border-gray-400 p-1.5 text-right">2. Bảo hiểm y tế thanh toán:</td>
                                    <td className="border border-gray-400 p-1.5 text-right">-{Number(viewingInvoice.BaoHiemChiTra).toLocaleString('vi-VN')} đ</td>
                                </tr>
                            )}
                            {Number(viewingInvoice.GiamGia) > 0 && (
                                <tr>
                                    <td colSpan={5} className="border border-gray-400 p-1.5 text-right">3. Miễn giảm / Hỗ trợ:</td>
                                    <td className="border border-gray-400 p-1.5 text-right">-{Number(viewingInvoice.GiamGia).toLocaleString('vi-VN')} đ</td>
                                </tr>
                            )}
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold uppercase">4. Bệnh nhân phải trả:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">{Number(viewingInvoice.BenhNhanChiTra).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold">5. ĐÃ THANH TOÁN THỰC TẾ:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">{(viewingInvoice.DaThanhToan || 0).toLocaleString('vi-VN')} đ</td>
                            </tr>
                            <tr>
                                <td colSpan={5} className="border border-gray-400 p-1.5 text-right font-bold text-gray-800">6. CÒN NỢ / CHƯA THANH TOÁN:</td>
                                <td className="border border-gray-400 p-1.5 text-right font-bold text-xs">
                                    {(viewingInvoice.ConLai ?? Math.max(0, Number(viewingInvoice.BenhNhanChiTra) - (viewingInvoice.DaThanhToan || 0))).toLocaleString('vi-VN')} đ
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Lịch sử thanh toán chi tiết nếu có */}
                    {viewingInvoice.thanhToans && viewingInvoice.thanhToans.length > 0 && (
                        <div className="mb-4 text-[10px]">
                            <p className="font-bold mb-1">Giao dịch đã thu tiền:</p>
                            <ul className="list-disc pl-5 space-y-0.5">
                                {viewingInvoice.thanhToans.map((tt) => (
                                    <li key={tt.MaThanhToan}>
                                        Ngày {tt.ThoiGianThanhToan} - Số tiền: <span className="font-bold">{Number(tt.SoTien).toLocaleString('vi-VN')} đ</span> ({tt.PhuongThucThanhToan}) {tt.MaGiaoDich ? `- Mã GD: ${tt.MaGiaoDich}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Phần ký nhận 2 bên */}
                    <div className="grid grid-cols-2 gap-4 text-center mt-6 text-[11px] pt-2">
                        <div>
                            <p className="font-bold uppercase">Người nộp tiền</p>
                            <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-medium text-gray-800">{viewingInvoice.luotKham?.benhNhan?.HoTen}</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase">Người thu tiền / Thu ngân</p>
                            <p className="text-[10px] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-medium text-gray-800">{auth?.user?.name || 'Thu ngân phòng khám'}</p>
                        </div>
                    </div>

                    <div className="text-center text-[10px] italic text-gray-500 mt-6 border-t border-gray-300 pt-2">
                        SmartCare xin chân thành cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ khám chữa bệnh!
                    </div>
                </div>
            )}

            {/* CSS CHUYÊN BIỆT CHO IN ẤN PRINT MEDIA (HỖ TRỢ KHỔ A4 / A5 VÀ HÓA ĐƠN DÀI NHIỀU TRANG) */}
            <style>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 12mm 15mm;
                    }
                    html, body {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible !important;
                    }
                    #printable-receipt {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        display: block !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        z-index: 999999 !important;
                    }
                    table, tr, td, th {
                        page-break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}
