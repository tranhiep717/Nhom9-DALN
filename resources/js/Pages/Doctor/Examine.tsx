import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { DOCTOR_NAV_ITEMS } from '@/constants/navigation';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Calendar,
    LayoutDashboard,
    UserCircle,
    Activity,
    ClipboardPen,
    Stethoscope,
    Save,
    Pill,
    Clock,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Plus,
    Trash2,
    FileText,
    Check,
    Loader2,
    ShieldCheck,
    History,
    RefreshCw,
    User,
    Phone,
    MapPin,
    AlertTriangle,
    FlaskConical,
    Send,
    ArrowRight,
    Eye,
    Info,
    Sparkles,
    CheckSquare,
    Megaphone,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface BenhNhan {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    GioiTinh: string;
    NgaySinh?: string;
    DiaChi?: string;
}

interface PhieuKham {
    MaPhieuKham?: number;
    MaLuotKham?: number;
    TrieuChung: string;
    TienSuBenh?: string;
    KetQuaKham?: string;
    ChanDoan: string;
    ChanDoanBanDau?: string;
    ChanDoanSauCLS?: string;
    KetLuan?: string;
    HuongDieuTri?: string;
    LoiDanBacSi?: string;
    GhiChu?: string;
}

interface Thuoc {
    MaThuoc: number;
    TenThuoc: string;
    HoatChat?: string;
    HamLuong?: string;
    DonViTinh: string;
    DangBaoChe?: string;
    DonGia: number | string;
    ApDungBHYT?: boolean;
    SoLuongTon: number;
    HuongDanSuDung?: string;
}

interface ChiTietDonThuoc {
    MaChiTietDonThuoc?: number;
    MaThuoc: number;
    SoLuong: number;
    LieuDung: string;
    TanSuat: string;
    ThoiGianDung?: string;
    CachDung?: string;
    DonGia: number | string;
    ThanhTien?: number | string;
    thuoc?: Thuoc;
}

interface DonThuoc {
    MaDonThuoc: number;
    MaLuotKham: number;
    MaBacSi: number;
    NgayKeDon?: string;
    LoiDan?: string;
    TrangThai: string;
    GhiChu?: string;
    chiTietDonThuocs?: ChiTietDonThuoc[];
    TongTienThuoc?: number;
}

interface DichVu {
    MaDichVu: number;
    TenDichVu: string;
    DonGia: number | string;
    ApDungBHYT?: boolean;
    MoTa?: string;
}

interface ChiDinhDichVu {
    MaChiDinh: number;
    MaLuotKham: number;
    MaPhieuKham?: number;
    MaDichVu: number;
    MaBacSi: number;
    TrangThai: string;
    KetQua?: string;
    KetLuan?: string;
    DonViDo?: string;
    KhoangThamChieu?: string;
    TepDinhKem?: string;
    NgayChiDinh?: string;
    NgayThucHien?: string;
    ThoiGianXacNhan?: string;
    DonGia: number | string;
    GhiChu?: string;
    dichVu?: DichVu;
    nhanVienThucHien?: {
        MaTaiKhoan: number;
        TenDangNhap?: string;
        Email?: string;
        HoTen?: string;
    };
    call_count?: number;
    can_skip?: boolean;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
    };
}

interface LuotKham {
    MaLuotKham: number;
    MaBenhNhan: number;
    MaBacSi: number;
    MaLichHen?: number | null;
    ThoiGianTiepNhan: string;
    ThoiGianBatDauKham?: string;
    ThoiGianKetThucKham?: string;
    TrangThai: string;
    GhiChu?: string;
    SoPhieu?: string;
    STTTrongNgay?: number;
    LoaiHangDoi?: 'DAT_LICH' | 'TRUC_TIEP';
    MucUuTien?: number;
    NgayKham?: string;
    MaChuyenKhoa?: number;
    MaCaKham?: number;
    ThoiGianVaoHang?: string;
    ThoiGianGoiKham?: string;
    chuyenKhoa?: {
        MaChuyenKhoa: number;
        TenChuyenKhoa: string;
    };
    caKham?: {
        MaCaKham: number;
        GioBatDau: string;
        GioKetThuc: string;
    };
    benhNhan?: BenhNhan;
    lichHen?: {
        MaLichHen: number;
        LyDoKham?: string;
        TrangThai: string;
    };
    phieuKham?: PhieuKham;
    donThuoc?: DonThuoc;
    chiDinhDichVus?: ChiDinhDichVu[];
    call_count?: number;
    can_skip?: boolean;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
    };
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

interface Props {
    auth: any;
    visits: PaginatedData<LuotKham> | LuotKham[];
    selectedVisit?: LuotKham | null;
    patientHistory?: LuotKham[];
    availableMedicines: Thuoc[];
    availableServices: DichVu[];
    doctorShifts?: any[];
    stats: {
        totalToday: number;
        waiting: number;
        waitingInitial?: number;
        examining: number;
        waitingCls?: number;
        waitingReExam?: number;
        completed: number;
    };
    filters: {
        date?: string;
        status?: string;
        search?: string;
        shift_id?: number;
        specialty_id?: number;
        visit_id?: number;
        per_page?: number;
        page?: number;
    };
}

export default function DoctorExamine({
    auth,
    visits: rawVisits,
    selectedVisit: rawInitialSelectedVisit,
    patientHistory: rawPatientHistory = [],
    availableMedicines = [],
    availableServices = [],
    doctorShifts = [],
    stats = { totalToday: 0, waiting: 0, examining: 0, waitingCls: 0, waitingReExam: 0, completed: 0 },
    filters = {}
}: Props) {
    const { flash } = usePage<any>().props;

    // Helper chuẩn hóa quan hệ giữa camelCase và snake_case từ Eloquent
    const normalizeVisit = (v: any): LuotKham => {
        if (!v) return v;
        const donThuocRaw = v.donThuoc || v.don_thuoc;
        return {
            ...v,
            benhNhan: v.benhNhan || v.benh_nhan,
            phieuKham: v.phieuKham || v.phieu_kham,
            donThuoc: donThuocRaw ? {
                ...donThuocRaw,
                chiTietDonThuocs: (donThuocRaw.chiTietDonThuocs || donThuocRaw.chi_tiet_don_thuocs || []).map((ct: any) => ({
                    ...ct,
                    thuoc: ct.thuoc,
                })),
            } : undefined,
            chiDinhDichVus: (v.chiDinhDichVus || v.chi_dinh_dich_vus || []).map((cd: any) => ({
                ...cd,
                dichVu: cd.dichVu || cd.dich_vu,
                nhanVienThucHien: cd.nhanVienThucHien || cd.nhan_vien_thuc_hien,
                bacSi: cd.bacSi || cd.bac_si,
            })),
            lichHen: v.lichHen || v.lich_hen,
            bacSi: v.bacSi || v.bac_si,
        };
    };

    const visitsList = useMemo(() => {
        if (!rawVisits) return [];
        const list = Array.isArray(rawVisits) ? rawVisits : (rawVisits.data || []);
        return list.map(normalizeVisit);
    }, [rawVisits]);

    const pagination = useMemo(() => {
        if (!rawVisits || Array.isArray(rawVisits)) {
            return {
                current_page: 1,
                last_page: 1,
                from: visitsList.length > 0 ? 1 : 0,
                to: visitsList.length,
                total: visitsList.length,
                per_page: 10,
            };
        }
        return {
            current_page: rawVisits.current_page || 1,
            last_page: rawVisits.last_page || 1,
            from: rawVisits.from,
            to: rawVisits.to,
            total: rawVisits.total ?? 0,
            per_page: rawVisits.per_page || 10,
        };
    }, [rawVisits, visitsList.length]);

    const initialSelectedVisit = useMemo(() => rawInitialSelectedVisit ? normalizeVisit(rawInitialSelectedVisit) : null, [rawInitialSelectedVisit]);
    const patientHistory = useMemo(() => rawPatientHistory.map(normalizeVisit), [rawPatientHistory]);

    const navItems = DOCTOR_NAV_ITEMS;

    // Local selected visit
    const [selectedVisitId, setSelectedVisitId] = useState<number | null>(
        initialSelectedVisit?.MaLuotKham ?? (visitsList.length > 0 ? visitsList[0].MaLuotKham : null)
    );

    const activeVisit = useMemo(() => {
        if (initialSelectedVisit && initialSelectedVisit.MaLuotKham === selectedVisitId) {
            return initialSelectedVisit;
        }
        return visitsList.find(v => v.MaLuotKham === selectedVisitId) || initialSelectedVisit || null;
    }, [visitsList, selectedVisitId, initialSelectedVisit]);

    // Active Tab: 'clinical' (Khám bệnh & Cận lâm sàng) hoặc 'prescriptions' (Danh mục thuốc & Kê đơn)
    const [activeTab, setActiveTab] = useState<'clinical' | 'prescriptions'>('clinical');

    // Filter states
    const [filterDate, setFilterDate] = useState<string>(filters.date || '');
    const [filterStatus, setFilterStatus] = useState<string>(filters.status || '');
    const [filterShift, setFilterShift] = useState<string>(filters.shift_id ? String(filters.shift_id) : '');
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [perPage, setPerPage] = useState<number>(filters.per_page || pagination.per_page || 10);

    // Form: Phiếu khám 2 giai đoạn (Khám ban đầu và Kết luận sau CLS)
    const [phieuKhamForm, setPhieuKhamForm] = useState({
        // Giai đoạn 1: Khám ban đầu
        TrieuChung: activeVisit?.phieuKham?.TrieuChung || activeVisit?.lichHen?.LyDoKham || '',
        TienSuBenh: activeVisit?.phieuKham?.TienSuBenh || '',
        KetQuaKham: activeVisit?.phieuKham?.KetQuaKham || '',
        ChanDoanBanDau: activeVisit?.phieuKham?.ChanDoanBanDau || activeVisit?.phieuKham?.ChanDoan || '',
        
        // Giai đoạn 2: Kết luận sau CLS / Kết luận cuối
        ChanDoanSauCLS: activeVisit?.phieuKham?.ChanDoanSauCLS || '',
        KetLuan: activeVisit?.phieuKham?.KetLuan || '',
        HuongDieuTri: activeVisit?.phieuKham?.HuongDieuTri || '',
        LoiDanBacSi: activeVisit?.phieuKham?.LoiDanBacSi || '',
        GhiChu: activeVisit?.phieuKham?.GhiChu || '',
    });

    // Cập nhật state khi activeVisit thay đổi
    React.useEffect(() => {
        if (activeVisit) {
            setPhieuKhamForm({
                TrieuChung: activeVisit.phieuKham?.TrieuChung || activeVisit.lichHen?.LyDoKham || activeVisit.GhiChu || '',
                TienSuBenh: activeVisit.phieuKham?.TienSuBenh || '',
                KetQuaKham: activeVisit.phieuKham?.KetQuaKham || '',
                ChanDoanBanDau: activeVisit.phieuKham?.ChanDoanBanDau || activeVisit.phieuKham?.ChanDoan || '',
                
                ChanDoanSauCLS: activeVisit.phieuKham?.ChanDoanSauCLS || '',
                KetLuan: activeVisit.phieuKham?.KetLuan || '',
                HuongDieuTri: activeVisit.phieuKham?.HuongDieuTri || '',
                LoiDanBacSi: activeVisit.phieuKham?.LoiDanBacSi || '',
                GhiChu: activeVisit.phieuKham?.GhiChu || '',
            });
        }
    }, [
        activeVisit?.MaLuotKham,
        activeVisit?.phieuKham?.MaPhieuKham,
        activeVisit?.phieuKham?.ChanDoan,
        activeVisit?.phieuKham?.ChanDoanBanDau,
        activeVisit?.phieuKham?.ChanDoanSauCLS,
        activeVisit?.phieuKham?.KetLuan,
        activeVisit?.phieuKham?.TrieuChung,
        activeVisit?.phieuKham?.TienSuBenh,
        activeVisit?.phieuKham?.KetQuaKham,
        activeVisit?.phieuKham?.HuongDieuTri,
        activeVisit?.phieuKham?.LoiDanBacSi,
        activeVisit?.phieuKham?.GhiChu
    ]);

    // Tự động làm mới danh sách hàng chờ mỗi 30 giây để cập nhật bệnh nhân lễ tân vừa tiếp nhận
    React.useEffect(() => {
        const timer = setInterval(() => {
            router.reload({
                only: ['visits', 'stats'],
            });
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    // UI Loading & Action States
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

    // Form: Chỉ định dịch vụ CLS
    const [selectedServiceId, setSelectedServiceId] = useState<number | string>('');
    const [serviceNote, setServiceNote] = useState<string>('');
    const [stagedServices, setStagedServices] = useState<Array<{
        MaDichVu: number;
        TenDichVu: string;
        DonGia: number;
        GhiChu?: string;
    }>>([]);

    // Modal kết quả dịch vụ (dành cho bác sĩ xem hoặc cập nhật nhanh)
    const [resultModalService, setResultModalService] = useState<ChiDinhDichVu | null>(null);
    const [resultText, setResultText] = useState<string>('');

    // Form: Kê đơn thuốc
    const [medicineSearch, setMedicineSearch] = useState<string>('');
    const [selectedMedId, setSelectedMedId] = useState<number | string>('');
    const [medQuantity, setMedQuantity] = useState<number>(1);
    const [medDosage, setMedDosage] = useState<string>('1 viên/lần');
    const [medFrequency, setMedFrequency] = useState<string>('2 lần/ngày');
    const [medDuration, setMedDuration] = useState<string>('5 ngày');
    const [medUsage, setMedUsage] = useState<string>('Uống sau khi ăn no');
    const [prescriptionAdvice, setPrescriptionAdvice] = useState<string>('');
    const [prescriptionNote, setPrescriptionNote] = useState<string>('');
    
    // Staged items cho đơn thuốc mới
    const [stagedItems, setStagedItems] = useState<Array<{
        MaThuoc: number;
        TenThuoc: string;
        HamLuong?: string;
        DonViTinh: string;
        SoLuongTon: number;
        DonGia: number;
        SoLuong: number;
        LieuDung: string;
        TanSuat: string;
        ThoiGianDung: string;
        CachDung: string;
    }>>([]);

    // Kiểm tra số lượng dịch vụ CLS chưa có kết quả
    const pendingServices = useMemo(() => {
        if (!activeVisit?.chiDinhDichVus) return [];
        return activeVisit.chiDinhDichVus.filter(
            item => !['DA_CO_KET_QUA', 'HOAN_THANH', 'DA_HUY'].includes(item.TrangThai)
        );
    }, [activeVisit?.chiDinhDichVus]);

    // Kiểm tra số lượng dịch vụ CLS đã có kết quả
    const completedServices = useMemo(() => {
        if (!activeVisit?.chiDinhDichVus) return [];
        return activeVisit.chiDinhDichVus.filter(
            item => ['DA_CO_KET_QUA', 'HOAN_THANH'].includes(item.TrangThai)
        );
    }, [activeVisit?.chiDinhDichVus]);

    // Tính tuổi từ ngày sinh
    const calculateAge = (dobString?: string) => {
        if (!dobString) return null;
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return null;
        const diff = Date.now() - dob.getTime();
        const ageDt = new Date(diff);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    // Áp dụng bộ lọc hàng chờ (reset về trang 1 khi lọc)
    const handleApplyFilter = () => {
        router.get('/doctor/examine', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            shift_id: filterShift || undefined,
            search: searchQuery || undefined,
            per_page: perPage,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Đặt lại bộ lọc
    const handleResetFilter = () => {
        setFilterDate('');
        setFilterStatus('');
        setFilterShift('');
        setSearchQuery('');
        setPerPage(10);
        router.get('/doctor/examine', { per_page: 10, page: 1 }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.last_page || newPage === pagination.current_page) return;
        router.get('/doctor/examine', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            shift_id: filterShift || undefined,
            search: searchQuery || undefined,
            visit_id: activeVisit?.MaLuotKham,
            per_page: perPage,
            page: newPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        router.get('/doctor/examine', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            shift_id: filterShift || undefined,
            search: searchQuery || undefined,
            visit_id: activeVisit?.MaLuotKham,
            per_page: newPerPage,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Chuyển chọn lượt khám
    const handleSelectVisit = (visit: LuotKham) => {
        setSelectedVisitId(visit.MaLuotKham);
        setStagedServices([]);
        setStagedItems([]);
        router.get('/doctor/examine', {
            date: filterDate || undefined,
            status: filterStatus || undefined,
            search: searchQuery || undefined,
            visit_id: visit.MaLuotKham,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Bắt đầu khám bệnh / Tiếp tục khám lại
    const handleStartExamine = () => {
        if (!activeVisit) return;
        setLoadingAction('start');
        router.post(`/doctor/visits/${activeVisit.MaLuotKham}/start`, {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setLoadingAction(null),
        });
    };

    // Gọi bệnh nhân tiếp theo từ hàng đợi Hybrid Queue (FIFO chung theo thời gian vào hàng)
    const handleCallNextPatient = () => {
        const activeExamining = visitsList.find(v => v.TrangThai === 'DANG_KHAM');
        if (activeExamining) {
            alert(`Bác sĩ đang có ca khám #${activeExamining.MaLuotKham} (${activeExamining.benhNhan?.HoTen}) chưa hoàn tất. Vui lòng hoàn thành ca khám hoặc chuyển sang cận lâm sàng trước khi gọi bệnh nhân tiếp theo.`);
            return;
        }

        setLoadingAction('callNext');
        router.post('/doctor/queue/call-next', {
            MaCaKham: filterShift ? Number(filterShift) : undefined,
        }, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: (page: any) => {
                const flash = page?.props?.flash;
                const successMsg = flash?.success;
                if (successMsg && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(successMsg);
                    utterance.lang = 'vi-VN';
                    window.speechSynthesis.speak(utterance);
                }
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Phát loa gọi bệnh nhân và ghi vết lượt gọi (Call history chống trùng lặp)
    const handleRecordCall = (v: LuotKham, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLoadingAction(`call_${v.MaLuotKham}`);
        const name = v.benhNhan?.HoTen || 'Bệnh nhân';
        const ticket = v.SoPhieu ? `số phiếu ${v.SoPhieu}` : '';
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Mời bệnh nhân ${name}, ${ticket}, vào phòng khám`);
            utterance.lang = 'vi-VN';
            window.speechSynthesis.speak(utterance);
        }
        const token = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        router.post('/doctor/queue/call-speaker', {
            MaLuotKham: v.MaLuotKham,
            Token: token,
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingAction(null),
        });
    };

    // Xác nhận bỏ lượt thủ công sau khi đã phát loa đủ 3 lần
    const handleSkipPatient = (v: LuotKham, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm(`Xác nhận bỏ lượt cho bệnh nhân ${v.benhNhan?.HoTen || ''} (Số phiếu: ${v.SoPhieu || `#${v.MaLuotKham}`}) sau 3 lần gọi không có mặt?`)) {
            return;
        }
        setLoadingAction(`skip_${v.MaLuotKham}`);
        router.post('/doctor/queue/skip-patient', {
            MaLuotKham: v.MaLuotKham,
            LyDo: 'Gọi 3 lần không có mặt',
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingAction(null),
        });
    };

    // Tiếp nhận bệnh nhân quay lại sau cận lâm sàng (CLS Return)
    const handleRecordClsReturn = (v: LuotKham, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setLoadingAction(`cls_return_${v.MaLuotKham}`);
        router.post('/doctor/queue/cls-return', {
            MaLuotKham: v.MaLuotKham,
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingAction(null),
        });
    };

    // Lưu thông tin khám ban đầu (Giai đoạn 1)
    const handleSaveInitialExam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVisit) return;

        const errors: Record<string, string> = {};
        if (!phieuKhamForm.TrieuChung.trim()) {
            errors.TrieuChung = 'Vui lòng nhập triệu chứng lâm sàng.';
        }
        if (!phieuKhamForm.ChanDoanBanDau.trim()) {
            errors.ChanDoanBanDau = 'Vui lòng nhập chẩn đoán sơ bộ ban đầu.';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setLoadingAction('saveInitial');
        router.post(`/doctor/visits/${activeVisit.MaLuotKham}/phieu-kham`, {
            TrieuChung: phieuKhamForm.TrieuChung,
            TienSuBenh: phieuKhamForm.TienSuBenh,
            KetQuaKham: phieuKhamForm.KetQuaKham,
            ChanDoanBanDau: phieuKhamForm.ChanDoanBanDau,
            // Giữ nguyên các thông tin kết luận nếu đã có
            ChanDoanSauCLS: phieuKhamForm.ChanDoanSauCLS,
            KetLuan: phieuKhamForm.KetLuan,
            HuongDieuTri: phieuKhamForm.HuongDieuTri,
            LoiDanBacSi: phieuKhamForm.LoiDanBacSi,
            GhiChu: phieuKhamForm.GhiChu,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: (err) => setFormErrors(err),
            onFinish: () => setLoadingAction(null),
        });
    };

    // Lưu kết luận khám sau CLS / Kết luận điều trị (Giai đoạn 2)
    const handleSaveConclusion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVisit) return;

        const errors: Record<string, string> = {};
        if (!phieuKhamForm.ChanDoanSauCLS.trim()) {
            errors.ChanDoanSauCLS = 'Vui lòng nhập chẩn đoán xác định sau cận lâm sàng.';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setLoadingAction('saveConclusion');
        router.post(`/doctor/visits/${activeVisit.MaLuotKham}/phieu-kham`, {
            // Bảo toàn chẩn đoán ban đầu tuyệt đối
            TrieuChung: phieuKhamForm.TrieuChung,
            TienSuBenh: phieuKhamForm.TienSuBenh,
            KetQuaKham: phieuKhamForm.KetQuaKham,
            ChanDoanBanDau: phieuKhamForm.ChanDoanBanDau,
            // Cập nhật kết luận sau CLS
            ChanDoanSauCLS: phieuKhamForm.ChanDoanSauCLS,
            KetLuan: phieuKhamForm.KetLuan,
            HuongDieuTri: phieuKhamForm.HuongDieuTri,
            LoiDanBacSi: phieuKhamForm.LoiDanBacSi,
            GhiChu: phieuKhamForm.GhiChu,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: (err) => setFormErrors(err),
            onFinish: () => setLoadingAction(null),
        });
    };

    // Thêm dịch vụ vào danh sách chờ chỉ định (staged)
    const handleStageService = () => {
        if (!selectedServiceId) return;
        const s = availableServices.find(x => x.MaDichVu === Number(selectedServiceId));
        if (!s) return;
        if (stagedServices.some(item => item.MaDichVu === s.MaDichVu)) {
            alert('Dịch vụ này đã có trong danh sách chuẩn bị chỉ định.');
            return;
        }
        setStagedServices([...stagedServices, {
            MaDichVu: s.MaDichVu,
            TenDichVu: s.TenDichVu,
            DonGia: Number(s.DonGia),
            GhiChu: serviceNote || undefined,
        }]);
        setSelectedServiceId('');
        setServiceNote('');
    };

    const handleRemoveStagedService = (maDichVu: number) => {
        setStagedServices(stagedServices.filter(s => s.MaDichVu !== maDichVu));
    };

    // Gửi chỉ định dịch vụ
    const handleAddServiceRequest = () => {
        if (!activeVisit) return;

        let itemsToSend: Array<{ MaDichVu: number; GhiChu?: string }> = [];
        if (stagedServices.length > 0) {
            itemsToSend = stagedServices.map(s => ({ MaDichVu: s.MaDichVu, GhiChu: s.GhiChu }));
        } else if (selectedServiceId) {
            itemsToSend = [{ MaDichVu: Number(selectedServiceId), GhiChu: serviceNote || undefined }];
        } else {
            return;
        }

        setLoadingAction('addService');
        router.post('/doctor/service-requests', {
            MaLuotKham: activeVisit.MaLuotKham,
            items: itemsToSend,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedServiceId('');
                setServiceNote('');
                setStagedServices([]);
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Lưu kết quả chỉ định dịch vụ (nếu bác sĩ cập nhật nhanh)
    const handleSaveServiceResult = () => {
        if (!resultModalService || !resultText.trim()) return;

        setLoadingAction('saveResult');
        router.post(`/doctor/service-requests/${resultModalService.MaChiDinh}/result`, {
            KetQua: resultText.trim(),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setResultModalService(null);
                setResultText('');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Danh sách thuốc được lọc theo tìm kiếm
    const filteredMedicines = useMemo(() => {
        if (!medicineSearch.trim()) return availableMedicines;
        const q = medicineSearch.toLowerCase();
        return availableMedicines.filter(m => 
            m.TenThuoc.toLowerCase().includes(q) || 
            (m.HoatChat && m.HoatChat.toLowerCase().includes(q)) ||
            (m.HamLuong && m.HamLuong.toLowerCase().includes(q)) ||
            String(m.MaThuoc).includes(q)
        );
    }, [availableMedicines, medicineSearch]);

    // Chọn thuốc từ danh mục để điền nhanh vào form kê đơn
    const handleSelectMedicineFromCatalog = (med: Thuoc) => {
        setSelectedMedId(med.MaThuoc);
        if (med.HuongDanSuDung) {
            setMedUsage(med.HuongDanSuDung);
        }
    };

    // Thêm thuốc vào danh sách tạm (staging)
    const handleAddStagedMedicine = () => {
        if (!selectedMedId) return;
        const med = availableMedicines.find(m => m.MaThuoc === Number(selectedMedId));
        if (!med) return;

        if (medQuantity <= 0) {
            alert('Số lượng thuốc phải lớn hơn 0.');
            return;
        }

        if (med.SoLuongTon < medQuantity) {
            alert(`Thuốc [${med.TenThuoc}] chỉ còn tồn ${med.SoLuongTon} ${med.DonViTinh} trong kho.`);
            return;
        }

        const existingIdx = stagedItems.findIndex(i => i.MaThuoc === med.MaThuoc);
        if (existingIdx >= 0) {
            const totalQty = stagedItems[existingIdx].SoLuong + medQuantity;
            if (med.SoLuongTon < totalQty) {
                alert(`Tổng số lượng kê (${totalQty}) vượt quá tồn kho (${med.SoLuongTon}).`);
                return;
            }
            const updated = [...stagedItems];
            updated[existingIdx].SoLuong = totalQty;
            setStagedItems(updated);
        } else {
            setStagedItems([
                ...stagedItems,
                {
                    MaThuoc: med.MaThuoc,
                    TenThuoc: med.TenThuoc,
                    HamLuong: med.HamLuong,
                    DonViTinh: med.DonViTinh,
                    SoLuongTon: med.SoLuongTon,
                    DonGia: Number(med.DonGia),
                    SoLuong: medQuantity,
                    LieuDung: medDosage,
                    TanSuat: medFrequency,
                    ThoiGianDung: medDuration,
                    CachDung: medUsage,
                }
            ]);
        }

        setSelectedMedId('');
        setMedQuantity(1);
    };

    // Xóa thuốc khỏi danh sách tạm
    const handleRemoveStagedItem = (index: number) => {
        setStagedItems(stagedItems.filter((_, i) => i !== index));
    };

    // Tính tổng tiền thuốc staged tạm tính
    const stagedTotal = useMemo(() => {
        return stagedItems.reduce((acc, item) => acc + (item.DonGia * item.SoLuong), 0);
    }, [stagedItems]);

    // Gửi đơn thuốc lên backend
    const handleSubmitPrescription = () => {
        if (!activeVisit || stagedItems.length === 0) return;

        setLoadingAction('submitPrescription');
        router.post('/doctor/prescriptions', {
            MaLuotKham: activeVisit.MaLuotKham,
            LoiDan: prescriptionAdvice || null,
            GhiChu: prescriptionNote || null,
            items: stagedItems.map(item => ({
                MaThuoc: item.MaThuoc,
                SoLuong: item.SoLuong,
                LieuDung: item.LieuDung,
                TanSuat: item.TanSuat,
                ThoiGianDung: item.ThoiGianDung,
                CachDung: item.CachDung,
            })),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setStagedItems([]);
                setPrescriptionAdvice('');
                setPrescriptionNote('');
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Lỗi khi tạo đơn thuốc.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    // Hủy đơn thuốc hiện có
    const handleCancelPrescription = (donThuocId: number) => {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn thuốc này? Số lượng thuốc sẽ được hoàn trả lại vào tồn kho.')) {
            return;
        }

        setLoadingAction('cancelPrescription');
        router.post(`/doctor/prescriptions/${donThuocId}/cancel`, {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setLoadingAction(null),
        });
    };

    // Hoàn thành lượt khám
    const handleCompleteExamine = () => {
        if (!activeVisit) return;

        // Kiểm tra xem đã có chẩn đoán chưa (ban đầu hoặc sau CLS)
        const hasDiagnosis = activeVisit.phieuKham?.ChanDoan?.trim() || 
                             activeVisit.phieuKham?.ChanDoanBanDau?.trim() || 
                             activeVisit.phieuKham?.ChanDoanSauCLS?.trim();

        if (!hasDiagnosis) {
            alert('Vui lòng lưu thông tin khám và chẩn đoán trước khi hoàn tất!');
            setShowCompleteModal(false);
            return;
        }

        // Kiểm tra xem còn dịch vụ CLS nào chưa có kết quả không
        if (pendingServices.length > 0) {
            alert(`Lượt khám vẫn còn ${pendingServices.length} chỉ định cận lâm sàng chưa có kết quả! Không thể hoàn tất.`);
            setShowCompleteModal(false);
            return;
        }

        setLoadingAction('complete');
        router.post(`/doctor/visits/${activeVisit.MaLuotKham}/complete`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowCompleteModal(false);
            },
            onError: (err) => {
                alert(Object.values(err)[0] || 'Không thể hoàn thành lượt khám.');
            },
            onFinish: () => setLoadingAction(null),
        });
    };

    const isVisitCompleted = activeVisit?.TrangThai === 'HOAN_THANH';
    const isVisitCancelled = activeVisit?.TrangThai === 'DA_HUY';
    const isVisitReadonly = isVisitCompleted || isVisitCancelled;

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            user={auth?.user}
            header="Bàn làm việc Bác sĩ – Khám bệnh & Cận lâm sàng"
        >
            <Head title="Khám bệnh - Bác sĩ" />

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

                {/* 2. Thống kê nhanh hôm nay - Phân rã trạng thái độc lập, khớp 100% với CSDL */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tổng tiếp nhận</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.totalToday}</p>
                        </div>
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Chờ khám lần đầu</p>
                            <p className="text-xl font-bold text-amber-600 mt-0.5">
                                {stats.waitingInitial ?? (stats.waiting - (stats.waitingReExam || 0))}
                            </p>
                        </div>
                        <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đang khám</p>
                            <p className="text-xl font-bold text-sky-600 mt-0.5">{stats.examining}</p>
                        </div>
                        <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đang làm CLS</p>
                            <p className="text-xl font-bold text-purple-600 mt-0.5">{stats.waitingCls ?? 0}</p>
                        </div>
                        <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Chờ khám lại CLS</p>
                            <p className="text-xl font-bold text-teal-600 mt-0.5">{stats.waitingReExam ?? 0}</p>
                        </div>
                        <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đã hoàn thành</p>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.completed}</p>
                        </div>
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. Thanh tìm kiếm & bộ lọc hàng chờ */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, SĐT, mã BN (BNxxx) hoặc số phiếu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHO_KHAM">Chờ khám</option>
                                <option value="DANG_KHAM">Đang khám</option>
                                <option value="CHO_KET_QUA">Chờ kết quả CLS</option>
                                <option value="CHO_KHAM_LAI">Chờ khám lại (Đã có KQ)</option>
                                <option value="HOAN_THANH">Đã hoàn thành</option>
                            </select>
                        </div>

                        {doctorShifts && doctorShifts.length > 0 && (
                            <div className="w-full sm:w-auto">
                                <select
                                    value={filterShift}
                                    onChange={(e) => setFilterShift(e.target.value)}
                                    className="w-full text-sm rounded-xl border border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">Tất cả ca khám</option>
                                    {doctorShifts.map((s: any) => (
                                        <option key={s.MaCaKham} value={s.MaCaKham}>
                                            Ca #{s.MaCaKham} ({s.GioBatDau?.substring(0, 5)} - {s.GioKetThuc?.substring(0, 5)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            onClick={handleApplyFilter}
                            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover flex items-center gap-1.5 shadow-sm"
                        >
                            <Filter className="w-4 h-4" /> Lọc
                        </button>

                        {(filterDate || filterStatus || filterShift || searchQuery) && (
                            <button
                                onClick={handleResetFilter}
                                className="px-3 py-2 text-gray-500 hover:text-gray-800 text-sm font-medium hover:bg-gray-100 rounded-xl flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" /> Đặt lại
                            </button>
                        )}
                    </div>

                    {/* Nút Gọi bệnh nhân tiếp theo theo cơ chế Hybrid Queue */}
                    <div className="w-full md:w-auto flex justify-end">
                        <button
                            onClick={handleCallNextPatient}
                            disabled={loadingAction === 'callNext' || visitsList.some(v => v.TrangThai === 'DANG_KHAM')}
                            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                            title={visitsList.some(v => v.TrangThai === 'DANG_KHAM') 
                                ? "Bác sĩ đang có ca khám chưa hoàn tất. Vui lòng hoàn thành hoặc chỉ định CLS trước khi gọi ca tiếp theo." 
                                : "Tự động gọi bệnh nhân tiếp theo theo thứ tự FIFO chung (P2/P3 xếp chung, theo thời gian vào hàng)"}
                        >
                            {loadingAction === 'callNext' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Megaphone className="w-4 h-4" />
                            )}
                            Gọi bệnh nhân tiếp theo
                        </button>
                    </div>
                </div>

                {/* 4. Nội dung chính: Cột trái (Hàng chờ + BN + Lịch sử) | Cột phải (Hồ sơ khám 2 giai đoạn + CLS + Kê đơn) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CỘT TRÁI (4 cols): Danh sách bệnh nhân & Chi tiết BN & Lịch sử */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 4.1 Danh sách lượt khám hàng chờ */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>Danh sách bệnh nhân</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                        {stats.waiting ?? 0} đang chờ
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => router.reload({ only: ['visits', 'stats'] })}
                                    className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-primary transition-colors text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
                                    title="Làm mới hàng chờ thời gian thực"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Làm mới</span>
                                </button>
                            </div>

                            <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto">
                                {visitsList.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <User className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm">Không có lượt khám nào phù hợp</p>
                                    </div>
                                ) : (
                                    visitsList.map((v) => {
                                        const isSelected = v.MaLuotKham === activeVisit?.MaLuotKham;
                                        const age = calculateAge(v.benhNhan?.NgaySinh);
                                        const queueTime = v.ThoiGianVaoHang || v.ThoiGianTiepNhan;
                                        const timeStr = queueTime ? new Date(queueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

                                        // Phân loại P2/P3 chính xác theo LoaiHangDoi
                                        const isP2 = v.LoaiHangDoi === 'DAT_LICH' 
                                            || (!v.LoaiHangDoi && (v.MucUuTien === 2 || !!v.MaLichHen || (v.SoPhieu && v.SoPhieu.startsWith('A-'))));
                                        const isP3 = v.LoaiHangDoi === 'TRUC_TIEP' 
                                            || (!v.LoaiHangDoi && !isP2 && (v.MucUuTien === 3 || !v.MaLichHen));

                                        return (
                                            <div
                                                key={v.MaLuotKham}
                                                onClick={() => handleSelectVisit(v)}
                                                className={`p-3 transition-all cursor-pointer hover:bg-blue-50/50 ${
                                                    isSelected ? 'bg-blue-50/80 border-l-4 border-primary' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="inline-flex flex-col items-start">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-xs rounded-md shadow-xs">
                                                                {v.SoPhieu || `#${v.MaLuotKham}`}
                                                            </span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <span className="text-[10px] text-gray-500 font-mono font-semibold">
                                                                    STT: {v.STTTrongNgay != null ? v.STTTrongNgay : '---'}
                                                                </span>
                                                                {(v.caKham?.MaCaKham || v.MaCaKham) && (
                                                                    <span className="text-[9px] px-1 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                                                                        Ca {v.caKham?.MaCaKham || v.MaCaKham}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="font-semibold text-gray-900 text-sm">
                                                            {v.benhNhan?.HoTen || 'Bệnh nhân'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            #{v.MaLuotKham}
                                                        </span>
                                                        {isP2 ? (
                                                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded">
                                                                P2 Đặt lịch
                                                            </span>
                                                        ) : isP3 ? (
                                                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold rounded">
                                                                P3 Trực tiếp
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ml-1 ${
                                                        v.TrangThai === 'DANG_KHAM' ? 'bg-sky-100 text-sky-700 animate-pulse' :
                                                        v.TrangThai === 'CHO_KHAM' ? 'bg-amber-100 text-amber-700' :
                                                        v.TrangThai === 'CHO_KET_QUA' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                        v.TrangThai === 'CHO_KHAM_LAI' ? 'bg-teal-100 text-teal-800 font-bold ring-1 ring-teal-400 animate-bounce' :
                                                        v.TrangThai === 'HOAN_THANH' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {v.TrangThai === 'DANG_KHAM' ? 'Đang khám' :
                                                         v.TrangThai === 'CHO_KHAM' ? 'Chờ khám' :
                                                         v.TrangThai === 'CHO_KET_QUA' ? 'Chờ KQ CLS' :
                                                         v.TrangThai === 'CHO_KHAM_LAI' ? 'Chờ khám lại' :
                                                         v.TrangThai === 'HOAN_THANH' ? 'Đã xong' : v.TrangThai}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 flex-wrap gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{v.benhNhan?.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}{age ? `, ${age} tuổi` : ''}</span>
                                                        {['CHO_KHAM', 'CHO_KHAM_LAI'].includes(v.TrangThai) && (
                                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                (v.call_count || 0) >= 3 
                                                                    ? 'bg-rose-100 text-rose-700 font-extrabold' 
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                Gọi: {v.call_count || 0}/3
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {/* Nút phát loa gọi cá nhân */}
                                                        {['CHO_KHAM', 'CHO_KHAM_LAI'].includes(v.TrangThai) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleRecordCall(v, e)}
                                                                disabled={loadingAction === `call_${v.MaLuotKham}`}
                                                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-semibold transition-all inline-flex items-center gap-0.5"
                                                                title="Phát loa gọi bệnh nhân này và ghi nhận lượt gọi"
                                                            >
                                                                <Megaphone className="w-2.5 h-2.5" />
                                                                Gọi loa
                                                            </button>
                                                        )}

                                                        {/* Nút bỏ lượt thủ công sau đủ 3 lần gọi */}
                                                        {v.can_skip && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleSkipPatient(v, e)}
                                                                disabled={loadingAction === `skip_${v.MaLuotKham}`}
                                                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold transition-all"
                                                                title="Bệnh nhân vắng mặt sau 3 lần gọi -> Xác nhận bỏ lượt"
                                                            >
                                                                Bỏ lượt
                                                            </button>
                                                        )}

                                                        {/* Nút tiếp nhận lại sau CLS nếu đang chờ kết quả */}
                                                        {v.TrangThai === 'CHO_KET_QUA' && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleRecordClsReturn(v, e)}
                                                                disabled={loadingAction === `cls_return_${v.MaLuotKham}`}
                                                                className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-[10px] font-bold transition-all"
                                                                title="Ghi nhận bệnh nhân đã có kết quả và quay lại phòng khám"
                                                            >
                                                                Vào hàng khám lại
                                                            </button>
                                                        )}

                                                        <span className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                                                            <Clock className="w-3 h-3 text-gray-400" /> Vào hàng: {timeStr}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Phân trang danh sách hàng chờ Bác sĩ (PHASE 13) */}
                            <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2 text-xs text-gray-500">
                                <div className="flex items-center justify-between">
                                    <span>
                                        Hiển thị <strong className="text-gray-800 font-bold">{pagination.total > 0 ? (pagination.from || 1) : 0}</strong> - <strong className="text-gray-800 font-bold">{pagination.to || 0}</strong> / <strong className="text-gray-800 font-bold">{pagination.total}</strong>
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-gray-400">Xem:</span>
                                        <select
                                            value={perPage}
                                            onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                            className="text-[11px] rounded border-gray-200 py-0.5 px-1 bg-white font-medium focus:ring-primary focus:border-primary"
                                        >
                                            <option value={10}>10/trang</option>
                                            <option value={20}>20/trang</option>
                                            <option value={50}>50/trang</option>
                                        </select>
                                    </div>
                                </div>

                                {pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => handlePageChange(pagination.current_page - 1)}
                                            disabled={pagination.current_page <= 1}
                                            className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px] font-medium"
                                        >
                                            <ChevronLeft className="w-3 h-3" />
                                            <span>Trước</span>
                                        </button>

                                        <span className="text-[11px] font-semibold text-gray-700">
                                            Trang {pagination.current_page} / {pagination.last_page}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handlePageChange(pagination.current_page + 1)}
                                            disabled={pagination.current_page >= pagination.last_page}
                                            className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px] font-medium"
                                        >
                                            <span>Sau</span>
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4.2 Thẻ thông tin bệnh nhân đang chọn */}
                        {activeVisit ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-3.5 bg-primary text-white flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <h3 className="font-bold text-sm">Hồ sơ người khám</h3>
                                        {activeVisit.SoPhieu && (
                                            <div className="inline-flex items-center gap-1.5 bg-white text-primary px-2.5 py-0.5 rounded font-mono font-bold text-xs shadow-sm">
                                                <span>{activeVisit.SoPhieu}</span>
                                                {activeVisit.STTTrongNgay != null && (
                                                    <span className="text-[10px] text-primary/70 font-semibold border-l border-primary/20 pl-1.5">
                                                        STT: {activeVisit.STTTrongNgay}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {activeVisit.LoaiHangDoi === 'DAT_LICH' && (
                                            <span className="bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                P2 Đặt lịch
                                            </span>
                                        )}
                                        {activeVisit.LoaiHangDoi === 'TRUC_TIEP' && (
                                            <span className="bg-purple-400/30 text-purple-100 border border-purple-300/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                P3 Trực tiếp
                                            </span>
                                        )}
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
                                            BN #{activeVisit.benhNhan?.MaBenhNhan}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3 text-sm">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div className="w-12 h-12 bg-primary/10 text-primary font-bold text-lg rounded-full flex items-center justify-center shrink-0">
                                            {activeVisit.benhNhan?.HoTen ? activeVisit.benhNhan.HoTen.charAt(0).toUpperCase() : 'B'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-gray-900 text-base truncate">
                                                {activeVisit.benhNhan?.HoTen}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {activeVisit.benhNhan?.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}
                                                {calculateAge(activeVisit.benhNhan?.NgaySinh) ? `, ${calculateAge(activeVisit.benhNhan?.NgaySinh)} tuổi` : ''}
                                                {activeVisit.benhNhan?.NgaySinh ? ` (NS: ${activeVisit.benhNhan.NgaySinh})` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {(activeVisit.chuyenKhoa || activeVisit.caKham) && (
                                        <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            {activeVisit.chuyenKhoa && (
                                                <span>Khoa: <strong className="text-gray-800">{activeVisit.chuyenKhoa.TenChuyenKhoa}</strong></span>
                                            )}
                                            {activeVisit.caKham && (
                                                <span>Ca: <strong className="text-gray-800">{activeVisit.caKham.GioBatDau?.substring(0, 5)} - {activeVisit.caKham.GioKetThuc?.substring(0, 5)}</strong></span>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{activeVisit.benhNhan?.SoDienThoai || 'Chưa cập nhật SĐT'}</span>
                                        </div>
                                        {activeVisit.benhNhan?.DiaChi && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{activeVisit.benhNhan.DiaChi}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(activeVisit.lichHen?.LyDoKham || activeVisit.GhiChu) && (
                                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                                            <span className="font-semibold text-amber-800 uppercase block mb-0.5">Lý do đến khám:</span>
                                            <span className="text-gray-800">{activeVisit.lichHen?.LyDoKham || activeVisit.GhiChu}</span>
                                        </div>
                                    )}

                                    {/* Nút hành động Bắt đầu khám / Tiếp tục khám lại */}
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        {activeVisit.TrangThai === 'CHO_KHAM' && (
                                            <button
                                                onClick={handleStartExamine}
                                                disabled={loadingAction === 'start'}
                                                className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                                            >
                                                {loadingAction === 'start' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Stethoscope className="w-4 h-4" />
                                                )}
                                                Bắt đầu khám bệnh
                                            </button>
                                        )}

                                        {activeVisit.TrangThai === 'CHO_KET_QUA' && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
                                                    <Clock className="w-4 h-4 text-amber-600 animate-spin" /> Đang chờ kết quả cận lâm sàng
                                                </div>
                                                <p className="text-[11px] text-amber-700 text-center">
                                                    Bệnh nhân đang làm xét nghiệm tại phòng CLS ({completedServices.length}/{activeVisit.chiDinhDichVus?.length || 0} dịch vụ đã xong).
                                                </p>
                                            </div>
                                        )}

                                        {activeVisit.TrangThai === 'CHO_KHAM_LAI' && (
                                            <div className="space-y-2">
                                                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-center">
                                                    <p className="text-xs font-bold text-teal-800 flex items-center justify-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4 text-teal-600" /> Đã có đầy đủ kết quả CLS!
                                                    </p>
                                                    <p className="text-[11px] text-teal-700 mt-0.5">Bác sĩ hãy nhấn tiếp tục khám để đưa ra kết luận.</p>
                                                </div>
                                                <button
                                                    onClick={handleStartExamine}
                                                    disabled={loadingAction === 'start'}
                                                    className="w-full py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                                                >
                                                    {loadingAction === 'start' ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4" />
                                                    )}
                                                    TIẾP TỤC KHÁM VÀ KẾT LUẬN
                                                </button>
                                            </div>
                                        )}

                                        {activeVisit.TrangThai === 'DANG_KHAM' && (
                                            <div className="flex items-center justify-center gap-2 p-2 bg-sky-50 text-sky-700 rounded-xl text-xs font-semibold">
                                                <Stethoscope className="w-4 h-4 animate-pulse" /> Đang trong phiên khám bệnh
                                            </div>
                                        )}

                                        {activeVisit.TrangThai === 'HOAN_THANH' && (
                                            <div className="flex items-center justify-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                                                <ShieldCheck className="w-4 h-4" /> Đã hoàn thành & khóa hồ sơ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* 4.3 Lịch sử khám trước đây của bệnh nhân */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" /> Lịch sử khám trước đây
                            </h3>

                            {patientHistory.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Bệnh nhân chưa có lịch sử khám trước đây tại hệ thống.</p>
                            ) : (
                                <div className="space-y-3">
                                    {patientHistory.map((hist) => {
                                        const histDate = hist.ThoiGianTiepNhan ? new Date(hist.ThoiGianTiepNhan).toLocaleDateString('vi-VN') : '';
                                        return (
                                            <div key={hist.MaLuotKham} className="pl-3 border-l-2 border-primary/40 relative text-xs space-y-1">
                                                <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1"></div>
                                                <div className="flex items-center justify-between text-gray-500 font-semibold">
                                                    <span>{histDate}</span>
                                                    <span>BS: {hist.bacSi?.HoTen || 'Bác sĩ'}</span>
                                                </div>
                                                <p className="font-medium text-gray-900">
                                                    Chẩn đoán: {hist.phieuKham?.ChanDoanSauCLS || hist.phieuKham?.ChanDoan || 'Không ghi nhận chẩn đoán'}
                                                </p>
                                                {hist.donThuoc && (
                                                    <p className="text-gray-500">
                                                        Đơn thuốc: {hist.donThuoc.chiTietDonThuocs?.map(c => c.thuoc?.TenThuoc).join(', ') || 'Đã kê đơn'}
                                                    </p>
                                                )}
                                                {hist.chiDinhDichVus && hist.chiDinhDichVus.length > 0 && (
                                                    <p className="text-gray-500">
                                                        Cận lâm sàng: {hist.chiDinhDichVus.map(c => c.dichVu?.TenDichVu).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI (8 cols): Bàn làm việc Bác sĩ (Tabs: 1. Khám bệnh & CLS | 2. Danh mục thuốc & Kê đơn) */}
                    <div className="lg:col-span-8 space-y-6">
                        {!activeVisit ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                                <Stethoscope className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                <h3 className="text-lg font-bold text-gray-700">Chưa chọn lượt khám nào</h3>
                                <p className="text-sm mt-1">Vui lòng chọn một bệnh nhân từ danh sách hàng chờ bên trái để bắt đầu khám bệnh.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Tab Navigation */}
                                <div className="border-b border-gray-100 px-6 pt-4 flex flex-wrap gap-6 bg-gray-50/50">
                                    <button
                                        onClick={() => setActiveTab('clinical')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                                            activeTab === 'clinical'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <ClipboardPen className="w-4 h-4" /> 1. Hồ sơ Khám bệnh & Cận lâm sàng (CLS)
                                        {(activeVisit.phieuKham?.ChanDoanBanDau || activeVisit.phieuKham?.ChanDoanSauCLS) && (
                                            <Check className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('prescriptions')}
                                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                                            activeTab === 'prescriptions'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <Pill className="w-4 h-4" /> 2. Danh mục Thuốc & Kê đơn thuốc
                                        {activeVisit.donThuoc && activeVisit.donThuoc.TrangThai !== 'DA_HUY' && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                                Đã kê #{activeVisit.donThuoc.MaDonThuoc}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Banner cảnh báo lượt khám đã hoàn thành */}
                                {isVisitReadonly && (
                                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-800 font-medium">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Lượt khám này đã {isVisitCompleted ? 'hoàn thành' : 'bị hủy'}. Toàn bộ hồ sơ, kết quả CLS và đơn thuốc đã được khóa lưu trữ (chế độ chỉ đọc).</span>
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* TAB 1: KHÁM BỆNH & CẬN LÂM SÀNG (KHU VỰC A, B, C XUYÊN SUỐT) */}
                                    {activeTab === 'clinical' && (
                                        <div className="space-y-8">
                                            {/* ======================================================== */}
                                            {/* KHU VỰC A: PHIẾU KHÁM BAN ĐẦU (GIAI ĐOẠN 1) */}
                                            {/* ======================================================== */}
                                            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-5 rounded-2xl border border-blue-100 space-y-4">
                                                <div className="flex items-center justify-between border-b border-blue-100/80 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                                            A
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-sm">
                                                                Khu vực A – Khám lâm sàng ban đầu (Giai đoạn 1)
                                                            </h4>
                                                            <p className="text-[11px] text-gray-500">
                                                                Ghi nhận triệu chứng, tiền sử, khám thực thể và chẩn đoán sơ bộ trước khi chỉ định CLS
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {activeVisit.phieuKham?.ChanDoanBanDau && (
                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu khám ban đầu
                                                        </span>
                                                    )}
                                                </div>

                                                <form onSubmit={handleSaveInitialExam} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Triệu chứng lâm sàng <span className="text-rose-500">*</span>
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.TrieuChung}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, TrieuChung: e.target.value })}
                                                                placeholder="Triệu chứng cơ năng, lời kể của bệnh nhân (VD: Đau thượng vị, sốt nhẹ...)"
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                            {formErrors.TrieuChung && (
                                                                <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.TrieuChung}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Tiền sử bệnh & Dị ứng thuốc
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.TienSuBenh}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, TienSuBenh: e.target.value })}
                                                                placeholder="Tiền sử bệnh mạn tính, tiền sử phẫu thuật, dị ứng thuốc..."
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Khám thực thể / Khám lâm sàng
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.KetQuaKham}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, KetQuaKham: e.target.value })}
                                                                placeholder="Mạch, huyết áp, nhiệt độ, tim phổi, bụng mềm..."
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Chẩn đoán ban đầu / Sơ bộ <span className="text-rose-500">*</span>
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.ChanDoanBanDau}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, ChanDoanBanDau: e.target.value })}
                                                                placeholder="Chẩn đoán sơ bộ ban đầu (VD: Theo dõi viêm dạ dày cấp / Nghi trào ngược...)"
                                                                className="w-full text-xs rounded-xl border-blue-300 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm font-semibold text-gray-900 disabled:bg-gray-50"
                                                            />
                                                            {formErrors.ChanDoanBanDau && (
                                                                <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.ChanDoanBanDau}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {!isVisitReadonly && (
                                                        <div className="flex justify-end pt-1">
                                                            <button
                                                                type="submit"
                                                                disabled={loadingAction === 'saveInitial'}
                                                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                                                            >
                                                                {loadingAction === 'saveInitial' ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Save className="w-3.5 h-3.5" />
                                                                )}
                                                                Lưu thông tin khám ban đầu
                                                            </button>
                                                        </div>
                                                    )}
                                                </form>
                                            </div>

                                            {/* ======================================================== */}
                                            {/* KHU VỰC B: DANH SÁCH CHỈ ĐỊNH VÀ KẾT QUẢ CLS */}
                                            {/* ======================================================== */}
                                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                                            B
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-sm">
                                                                Khu vực B – Chỉ định Cận lâm sàng & Kết quả từ Kỹ thuật viên CLS ({activeVisit.chiDinhDichVus?.length || 0})
                                                            </h4>
                                                            <p className="text-[11px] text-gray-500">
                                                                Bác sĩ theo dõi tiến độ thực hiện và kết quả đo đạc từ phòng cận lâm sàng
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {activeVisit.chiDinhDichVus && activeVisit.chiDinhDichVus.length > 0 && (
                                                        <span className="text-xs text-gray-600 font-medium">
                                                            Đã có KQ: <strong className="text-emerald-700">{completedServices.length}</strong> / {activeVisit.chiDinhDichVus.length}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Bảng danh sách chỉ định CLS */}
                                                {(!activeVisit.chiDinhDichVus || activeVisit.chiDinhDichVus.length === 0) ? (
                                                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-500">
                                                        <FlaskConical className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                                                        Bệnh nhân chưa có chỉ định cận lâm sàng nào. Nếu không cần làm CLS, bác sĩ có thể chuyển trực tiếp xuống <strong>Khu vực C</strong> để kết luận và điều trị.
                                                    </div>
                                                ) : (
                                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                                                                <tr>
                                                                    <th className="px-3 py-2.5">Mã CĐ</th>
                                                                    <th className="px-3 py-2.5">Dịch vụ kỹ thuật</th>
                                                                    <th className="px-3 py-2.5">Trạng thái</th>
                                                                    <th className="px-3 py-2.5">KTV Thực hiện</th>
                                                                    <th className="px-3 py-2.5">Kết quả & Đơn vị</th>
                                                                    <th className="px-3 py-2.5">Tham chiếu / Kết luận KTV</th>
                                                                    <th className="px-3 py-2.5 text-right">Đơn giá</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {activeVisit.chiDinhDichVus.map((item) => (
                                                                    <tr key={item.MaChiDinh} className="hover:bg-gray-50/70 transition-colors">
                                                                        <td className="px-3 py-3 font-mono font-bold text-gray-500">
                                                                            #{item.MaChiDinh}
                                                                        </td>
                                                                        <td className="px-3 py-3">
                                                                            <span className="font-bold text-gray-900 block">{item.dichVu?.TenDichVu}</span>
                                                                            {item.GhiChu && (
                                                                                <span className="text-[11px] text-gray-500">Ghi chú: {item.GhiChu}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-3">
                                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                                (item.TrangThai === 'DA_CO_KET_QUA' || item.TrangThai === 'HOAN_THANH') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                                                item.TrangThai === 'DANG_THUC_HIEN' ? 'bg-purple-100 text-purple-800' :
                                                                                item.TrangThai === 'DA_TIEP_NHAN' ? 'bg-blue-100 text-blue-800' :
                                                                                item.TrangThai === 'DA_HUY' ? 'bg-rose-100 text-rose-700' :
                                                                                'bg-amber-100 text-amber-800'
                                                                            }`}>
                                                                                {item.TrangThai === 'DA_CO_KET_QUA' || item.TrangThai === 'HOAN_THANH' ? '✓ Đã có kết quả' :
                                                                                 item.TrangThai === 'DANG_THUC_HIEN' ? 'Đang thực hiện' :
                                                                                 item.TrangThai === 'DA_TIEP_NHAN' ? 'Đã tiếp nhận' :
                                                                                 item.TrangThai === 'DA_HUY' ? 'Đã hủy' : 'Chờ tiếp nhận'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-3 text-gray-600">
                                                                            {item.nhanVienThucHien?.HoTen || item.nhanVienThucHien?.TenDangNhap || (item.NgayThucHien ? 'KTV CLS' : '--')}
                                                                        </td>
                                                                        <td className="px-3 py-3">
                                                                            {item.KetQua ? (
                                                                                <div className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                                                                                    {item.KetQua} {item.DonViDo && <span className="text-gray-600 font-normal">({item.DonViDo})</span>}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-gray-400 italic">Đang chờ KTV nhập</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-3">
                                                                            {item.KhoangThamChieu && (
                                                                                <div className="text-[11px] text-gray-500">
                                                                                    TC: <span className="font-mono">{item.KhoangThamChieu}</span>
                                                                                </div>
                                                                            )}
                                                                            {item.KetLuan && (
                                                                                <div className="text-[11px] font-semibold text-gray-800 italic">
                                                                                    KL: {item.KetLuan}
                                                                                </div>
                                                                            )}
                                                                            {!item.KhoangThamChieu && !item.KetLuan && (
                                                                                <span className="text-gray-400 italic text-[11px]">--</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-right font-mono font-semibold text-gray-700">
                                                                            {Number(item.DonGia).toLocaleString('vi-VN')} đ
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {/* Form tạo chỉ định dịch vụ mới */}
                                                {!isVisitReadonly && (
                                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                                        <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                                            <Plus className="w-3.5 h-3.5 text-primary" /> Chỉ định thêm dịch vụ kỹ thuật mới
                                                        </h5>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn dịch vụ kỹ thuật từ danh mục</label>
                                                                <select
                                                                    value={selectedServiceId}
                                                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                                >
                                                                    <option value="">-- Chọn dịch vụ cận lâm sàng --</option>
                                                                    {availableServices.map((s) => (
                                                                        <option key={s.MaDichVu} value={s.MaDichVu}>
                                                                            {s.TenDichVu} — ({Number(s.DonGia).toLocaleString('vi-VN')} đ)
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú lâm sàng cho KTV</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="VD: Kiểm tra kỹ vùng hạ sườn..."
                                                                    value={serviceNote}
                                                                    onChange={(e) => setServiceNote(e.target.value)}
                                                                    className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Danh sách dịch vụ chuẩn bị chỉ định (staged) */}
                                                        {stagedServices.length > 0 && (
                                                            <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs font-bold text-blue-900 uppercase">
                                                                        Danh sách chuẩn bị chỉ định ({stagedServices.length} dịch vụ)
                                                                    </span>
                                                                    <span className="text-xs font-bold text-primary font-mono">
                                                                        Tổng: {stagedServices.reduce((sum, item) => sum + Number(item.DonGia), 0).toLocaleString('vi-VN')} đ
                                                                    </span>
                                                                </div>
                                                                <div className="divide-y divide-gray-100 text-xs">
                                                                    {stagedServices.map((st) => (
                                                                        <div key={st.MaDichVu} className="py-1.5 flex justify-between items-center">
                                                                            <div>
                                                                                <span className="font-semibold text-gray-800">{st.TenDichVu}</span>
                                                                                {st.GhiChu && (
                                                                                    <span className="text-gray-500 text-[11px] block">Ghi chú: {st.GhiChu}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="font-medium text-gray-700 font-mono">{Number(st.DonGia).toLocaleString('vi-VN')} đ</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveStagedService(st.MaDichVu)}
                                                                                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                                                                                >
                                                                                    Xóa
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end gap-2 pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={handleStageService}
                                                                disabled={!selectedServiceId}
                                                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                Thêm vào danh sách chọn
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleAddServiceRequest}
                                                                disabled={(!selectedServiceId && stagedServices.length === 0) || loadingAction === 'addService'}
                                                                className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                                            >
                                                                {loadingAction === 'addService' ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Send className="w-3.5 h-3.5" />
                                                                )}
                                                                {stagedServices.length > 0 
                                                                    ? `Gửi chỉ định (${stagedServices.length} dịch vụ)` 
                                                                    : 'Chỉ định ngay'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ======================================================== */}
                                            {/* KHU VỰC C: KHÁM LẠI & KẾT LUẬN SAU CLS (GIAI ĐOẠN 2) */}
                                            {/* ======================================================== */}
                                            <div className="bg-gradient-to-r from-teal-50/60 to-emerald-50/40 p-5 rounded-2xl border border-teal-200 space-y-4">
                                                <div className="flex items-center justify-between border-b border-teal-200/80 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                                            C
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-sm">
                                                                Khu vực C – Khám lại & Kết luận sau Cận lâm sàng (Giai đoạn 2)
                                                            </h4>
                                                            <p className="text-[11px] text-gray-500">
                                                                Đưa ra chẩn đoán xác định sau khi có kết quả CLS. Chẩn đoán ban đầu được bảo toàn nguyên vẹn.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {activeVisit.phieuKham?.ChanDoanSauCLS && (
                                                        <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã có kết luận sau CLS
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Nút hành động TIẾP TỤC KHÁM VÀ KẾT LUẬN khi lượt khám ở trạng thái CHO_KHAM_LAI */}
                                                {activeVisit.TrangThai === 'CHO_KHAM_LAI' && (
                                                    <div className="p-4 bg-teal-100/70 border border-teal-300 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
                                                        <div>
                                                            <p className="text-xs font-bold text-teal-900">
                                                                ✓ Bệnh nhân đã hoàn thành toàn bộ chỉ định cận lâm sàng!
                                                            </p>
                                                            <p className="text-[11px] text-teal-800 mt-0.5">
                                                                Mời bệnh nhân quay lại phòng khám và nhấn nút bên phải để tiếp tục phiên khám.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleStartExamine}
                                                            disabled={loadingAction === 'start'}
                                                            className="px-5 py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 flex items-center gap-1.5 shadow-md disabled:opacity-50"
                                                        >
                                                            {loadingAction === 'start' ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Stethoscope className="w-4 h-4" />
                                                            )}
                                                            TIẾP TỤC KHÁM VÀ KẾT LUẬN
                                                        </button>
                                                    </div>
                                                )}

                                                <form onSubmit={handleSaveConclusion} className="space-y-4">
                                                    {/* Hiển thị đối chiếu: Chẩn đoán ban đầu (Bảo toàn) & Chẩn đoán sau CLS */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-white/80 p-3 rounded-xl border border-gray-200">
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                                                Chẩn đoán ban đầu (Đã lưu tại Giai đoạn 1)
                                                            </label>
                                                            <p className="text-xs font-semibold text-gray-800 italic">
                                                                {phieuKhamForm.ChanDoanBanDau || '(Chưa ghi chẩn đoán ban đầu)'}
                                                            </p>
                                                            <span className="text-[10px] text-gray-400 block mt-1">
                                                                * Được bảo toàn vĩnh viễn, không bị ghi đè bởi kết luận sau CLS.
                                                            </span>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Chẩn đoán xác định sau CLS <span className="text-rose-500">*</span>
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.ChanDoanSauCLS}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, ChanDoanSauCLS: e.target.value })}
                                                                placeholder="Chẩn đoán xác định sau khi đối chiếu kết quả xét nghiệm / hình ảnh..."
                                                                className="w-full text-xs rounded-xl border-teal-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-sm font-semibold text-gray-900 disabled:bg-gray-50"
                                                            />
                                                            {formErrors.ChanDoanSauCLS && (
                                                                <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.ChanDoanSauCLS}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Kết luận chuyên môn
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.KetLuan}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, KetLuan: e.target.value })}
                                                                placeholder="Kết luận tình trạng bệnh..."
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Hướng điều trị
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.HuongDieuTri}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, HuongDieuTri: e.target.value })}
                                                                placeholder="Kê đơn điều trị ngoại trú / Chuyển tuyến..."
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                                Lời dặn của Bác sĩ
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                disabled={isVisitReadonly}
                                                                value={phieuKhamForm.LoiDanBacSi}
                                                                onChange={(e) => setPhieuKhamForm({ ...phieuKhamForm, LoiDanBacSi: e.target.value })}
                                                                placeholder="Chế độ nghỉ ngơi, hẹn tái khám sau 7 ngày..."
                                                                className="w-full text-xs rounded-xl border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:bg-gray-50"
                                                            />
                                                        </div>
                                                    </div>

                                                    {!isVisitReadonly && (
                                                        <div className="flex justify-between items-center pt-2">
                                                            <p className="text-[11px] text-teal-800 font-medium">
                                                                Sau khi lưu kết luận, bác sĩ có thể chuyển sang <strong>Tab 2 (Kê đơn thuốc)</strong> hoặc hoàn tất buổi khám.
                                                            </p>
                                                            <button
                                                                type="submit"
                                                                disabled={loadingAction === 'saveConclusion'}
                                                                className="px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                                                            >
                                                                {loadingAction === 'saveConclusion' ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Save className="w-3.5 h-3.5" />
                                                                )}
                                                                Lưu kết luận khám & điều trị
                                                            </button>
                                                        </div>
                                                    )}
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: DANH MỤC THUỐC & KÊ ĐƠN (KHU VỰC D) */}
                                    {activeTab === 'prescriptions' && (
                                        <div className="space-y-6">
                                            {/* Đơn thuốc đã tạo thành công cho lượt khám */}
                                            {activeVisit.donThuoc && activeVisit.donThuoc.TrangThai !== 'DA_HUY' ? (
                                                <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl p-5 space-y-4">
                                                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                                <Pill className="w-4 h-4 text-emerald-600" />
                                                                Đơn thuốc chính thức số #{activeVisit.donThuoc.MaDonThuoc}
                                                            </h4>
                                                            {activeVisit.donThuoc.LoiDan && (
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    Lời dặn bác sĩ: <span className="font-semibold text-gray-800">{activeVisit.donThuoc.LoiDan}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {!isVisitReadonly && (
                                                            <button
                                                                onClick={() => handleCancelPrescription(activeVisit.donThuoc!.MaDonThuoc)}
                                                                disabled={loadingAction === 'cancelPrescription'}
                                                                className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {loadingAction === 'cancelPrescription' ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-3 h-3" />
                                                                )}
                                                                Hủy đơn thuốc & hoàn kho
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-white/80 text-gray-600 font-semibold border-b border-gray-100">
                                                                <tr>
                                                                    <th className="px-3 py-2">STT</th>
                                                                    <th className="px-3 py-2">Tên thuốc & Hoạt chất</th>
                                                                    <th className="px-3 py-2">Số lượng</th>
                                                                    <th className="px-3 py-2">Cách dùng / Liều lượng</th>
                                                                    <th className="px-3 py-2 text-right">Đơn giá</th>
                                                                    <th className="px-3 py-2 text-right">Thành tiền</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                                {activeVisit.donThuoc.chiTietDonThuocs?.map((ct, idx) => {
                                                                    const tt = Number(ct.ThanhTien || (ct.SoLuong * Number(ct.DonGia)));
                                                                    return (
                                                                        <tr key={ct.MaChiTietDonThuoc || idx}>
                                                                            <td className="px-3 py-2.5 text-gray-400 font-mono">{idx + 1}</td>
                                                                            <td className="px-3 py-2.5 font-bold text-gray-900">
                                                                                {ct.thuoc?.TenThuoc}
                                                                                {ct.thuoc?.HamLuong && <span className="text-gray-500 font-normal ml-1">({ct.thuoc.HamLuong})</span>}
                                                                                {ct.thuoc?.HoatChat && (
                                                                                    <span className="block text-[11px] text-gray-500 font-normal">
                                                                                        HC: {ct.thuoc.HoatChat}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 font-semibold text-gray-800">
                                                                                {ct.SoLuong} {ct.thuoc?.DonViTinh}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-gray-600">
                                                                                {ct.LieuDung}, {ct.TanSuat}
                                                                                {ct.CachDung ? ` (${ct.CachDung})` : ''}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right font-mono text-gray-600">
                                                                                {Number(ct.DonGia).toLocaleString('vi-VN')} đ
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right font-bold text-emerald-700 font-mono">
                                                                                {tt.toLocaleString('vi-VN')} đ
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="border-t-2 border-emerald-200 font-bold bg-white">
                                                                    <td colSpan={5} className="px-3 py-2.5 text-right text-gray-700">Tổng tiền thuốc:</td>
                                                                    <td className="px-3 py-2.5 text-right text-emerald-700 font-mono text-sm">
                                                                        {(activeVisit.donThuoc.TongTienThuoc || activeVisit.donThuoc.chiTietDonThuocs?.reduce((a, b) => a + (b.SoLuong * Number(b.DonGia)), 0) || 0).toLocaleString('vi-VN')} đ
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* ======================================================== */}
                                            {/* KHU VỰC D: DANH MỤC THUỐC THẬT TỪ DATABASE & KÊ ĐƠN */}
                                            {/* ======================================================== */}
                                            {(!activeVisit.donThuoc || activeVisit.donThuoc.TrangThai === 'DA_HUY') && !isVisitReadonly && (
                                                <div className="space-y-6">
                                                    {/* Bảng danh mục thuốc đang hoạt động từ DB */}
                                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                                                    D
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 text-sm">
                                                                        Khu vực D – Danh mục thuốc khả dụng trong kho ({availableMedicines.length} loại thuốc)
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-500">
                                                                        Dữ liệu trực tiếp từ cơ sở dữ liệu SmartCare. Bác sĩ có thể tìm kiếm và chọn nhanh để kê đơn.
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Search Box cho danh mục thuốc */}
                                                            <div className="relative min-w-[260px]">
                                                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Tìm theo tên thuốc, hoạt chất, hàm lượng..."
                                                                    value={medicineSearch}
                                                                    onChange={(e) => setMedicineSearch(e.target.value)}
                                                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Bảng danh mục thuốc */}
                                                        <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 sticky top-0 z-10">
                                                                    <tr>
                                                                        <th className="px-3 py-2">Mã</th>
                                                                        <th className="px-3 py-2">Tên thuốc</th>
                                                                        <th className="px-3 py-2">Hoạt chất & Hàm lượng</th>
                                                                        <th className="px-3 py-2">ĐVT</th>
                                                                        <th className="px-3 py-2 text-right">Đơn giá</th>
                                                                        <th className="px-3 py-2 text-center">Tồn kho</th>
                                                                        <th className="px-3 py-2 text-right">Thao tác</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {filteredMedicines.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={7} className="px-3 py-6 text-center text-gray-400 italic">
                                                                                Không tìm thấy thuốc phù hợp với từ khóa "{medicineSearch}"
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        filteredMedicines.map((m) => {
                                                                            const isOutOfStock = m.SoLuongTon <= 0;
                                                                            const isCurrentSelected = Number(selectedMedId) === m.MaThuoc;
                                                                            return (
                                                                                <tr 
                                                                                    key={m.MaThuoc} 
                                                                                    className={`hover:bg-blue-50/40 transition-colors ${
                                                                                        isCurrentSelected ? 'bg-blue-50 font-medium' : ''
                                                                                    }`}
                                                                                >
                                                                                    <td className="px-3 py-2 font-mono text-gray-500">#{m.MaThuoc}</td>
                                                                                    <td className="px-3 py-2 font-bold text-gray-900">
                                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                                            <span>{m.TenThuoc}</span>
                                                                                            {m.ApDungBHYT !== false ? (
                                                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">BHYT</span>
                                                                                            ) : (
                                                                                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">Tự túc</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-gray-600">
                                                                                        {m.HoatChat || '--'} {m.HamLuong && <span className="text-gray-500">({m.HamLuong})</span>}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-gray-700 font-medium">{m.DonViTinh}</td>
                                                                                    <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">
                                                                                        {Number(m.DonGia).toLocaleString('vi-VN')} đ
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-center">
                                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                                            isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                                                                        }`}>
                                                                                            {m.SoLuongTon}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={isOutOfStock}
                                                                                            onClick={() => handleSelectMedicineFromCatalog(m)}
                                                                                            className="px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-hover disabled:opacity-30 shadow-sm"
                                                                                        >
                                                                                            {isCurrentSelected ? 'Đang chọn' : 'Chọn kê'}
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Khối cấu hình liều lượng & thêm vào đơn */}
                                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                                                    <Plus className="w-3.5 h-3.5 text-primary" /> Thiết lập liều dùng cho thuốc đang chọn
                                                                </h5>
                                                                {selectedMedId && (
                                                                    <span className="text-xs font-semibold text-primary">
                                                                        Thuốc: {availableMedicines.find(m => m.MaThuoc === Number(selectedMedId))?.TenThuoc}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-gray-200">
                                                                <div className="md:col-span-4">
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thuốc đã chọn</label>
                                                                    <select
                                                                        value={selectedMedId}
                                                                        onChange={(e) => setSelectedMedId(e.target.value)}
                                                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                                    >
                                                                        <option value="">-- Chọn thuốc từ kho --</option>
                                                                        {availableMedicines.map((m) => (
                                                                            <option key={m.MaThuoc} value={m.MaThuoc} disabled={m.SoLuongTon <= 0}>
                                                                                {m.TenThuoc} {m.HamLuong ? `(${m.HamLuong})` : ''} - Tồn: {m.SoLuongTon} {m.DonViTinh} ({Number(m.DonGia).toLocaleString('vi-VN')} đ)
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Số lượng</label>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={medQuantity}
                                                                        onChange={(e) => setMedQuantity(Number(e.target.value))}
                                                                        className="w-full text-xs rounded-xl border-gray-200 py-2 px-2.5 focus:outline-none focus:border-primary"
                                                                    />
                                                                </div>

                                                                <div className="md:col-span-3">
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Liều & Tần suất</label>
                                                                    <input
                                                                        type="text"
                                                                        value={medDosage}
                                                                        onChange={(e) => setMedDosage(e.target.value)}
                                                                        placeholder="VD: 1 viên/lần"
                                                                        className="w-full text-xs rounded-xl border-gray-200 py-1.5 px-2 mb-1"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={medFrequency}
                                                                        onChange={(e) => setMedFrequency(e.target.value)}
                                                                        placeholder="VD: 2 lần/ngày"
                                                                        className="w-full text-xs rounded-xl border-gray-200 py-1.5 px-2"
                                                                    />
                                                                </div>

                                                                <div className="md:col-span-3 flex flex-col justify-between">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Cách dùng</label>
                                                                        <input
                                                                            type="text"
                                                                            value={medUsage}
                                                                            onChange={(e) => setMedUsage(e.target.value)}
                                                                            placeholder="Uống sau ăn no"
                                                                            className="w-full text-xs rounded-xl border-gray-200 py-1.5 px-2"
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddStagedMedicine}
                                                                        disabled={!selectedMedId}
                                                                        className="mt-2 w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-1 disabled:opacity-40 shadow-sm"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" /> Thêm vào đơn
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Danh sách thuốc đang gom (staged) */}
                                                            {stagedItems.length > 0 && (
                                                                <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                                                                    <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 font-bold text-xs text-emerald-900 flex justify-between items-center">
                                                                        <span>Danh sách thuốc chuẩn bị kê ({stagedItems.length} loại)</span>
                                                                        <span className="text-emerald-700 font-mono text-sm">
                                                                            Tạm tính: {stagedTotal.toLocaleString('vi-VN')} đ
                                                                        </span>
                                                                    </div>

                                                                    <div className="divide-y divide-gray-100">
                                                                        {stagedItems.map((item, idx) => (
                                                                            <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-gray-50/50">
                                                                                <div>
                                                                                    <span className="font-bold text-gray-900">{item.TenThuoc}</span>
                                                                                    {item.HamLuong && <span className="text-gray-500 font-normal ml-1">({item.HamLuong})</span>}
                                                                                    <span className="text-gray-600 ml-2 font-semibold">x {item.SoLuong} {item.DonViTinh}</span>
                                                                                    <p className="text-gray-500 text-[11px] mt-0.5">
                                                                                        {item.LieuDung}, {item.TanSuat} — {item.CachDung}
                                                                                    </p>
                                                                                </div>

                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="font-semibold text-gray-800 font-mono">
                                                                                        {(item.DonGia * item.SoLuong).toLocaleString('vi-VN')} đ
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveStagedItem(idx)}
                                                                                        className="text-rose-500 hover:text-rose-700 p-1"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 space-y-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Lời dặn chung của bác sĩ khi dùng đơn thuốc này..."
                                                                            value={prescriptionAdvice}
                                                                            onChange={(e) => setPrescriptionAdvice(e.target.value)}
                                                                            className="w-full text-xs rounded-xl border-gray-200 py-2 px-3 focus:outline-none focus:border-primary"
                                                                        />

                                                                        <div className="flex justify-end pt-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleSubmitPrescription}
                                                                                disabled={loadingAction === 'submitPrescription'}
                                                                                className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-md disabled:opacity-50"
                                                                            >
                                                                                {loadingAction === 'submitPrescription' ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                ) : (
                                                                                    <Save className="w-4 h-4" />
                                                                                )}
                                                                                Xác nhận kê đơn thuốc & Trừ kho
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ACTION FOOTER: HOÀN TẤT BUỔI KHÁM (KHU VỰC E) */}
                                {!isVisitReadonly && (
                                    <div className="p-6 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-xs text-gray-600 space-y-1">
                                            {pendingServices.length > 0 ? (
                                                <span className="text-rose-700 flex items-center gap-1.5 font-bold">
                                                    <AlertCircle className="w-4 h-4 text-rose-600" />
                                                    Còn {pendingServices.length} chỉ định CLS chưa có kết quả (Chưa thể hoàn tất)
                                                </span>
                                            ) : activeVisit.phieuKham?.ChanDoanSauCLS || activeVisit.phieuKham?.ChanDoan ? (
                                                <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    Đã sẵn sàng hoàn tất lượt khám (Chẩn đoán: {activeVisit.phieuKham.ChanDoanSauCLS || activeVisit.phieuKham.ChanDoan})
                                                </span>
                                            ) : (
                                                <span className="text-amber-700 flex items-center gap-1.5 font-bold">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                    Cần lưu thông tin khám & chẩn đoán trước khi hoàn thành
                                                </span>
                                            )}
                                            <p className="text-[11px] text-gray-500">
                                                Khi hoàn tất, lượt khám sẽ được chuyển sang bộ phận Thu ngân thanh toán và lưu trữ hồ sơ.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowCompleteModal(true)}
                                            disabled={loadingAction === 'complete' || pendingServices.length > 0}
                                            className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Hoàn tất buổi khám bệnh
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: Xác nhận hoàn thành lượt khám */}
            {showCompleteModal && activeVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="font-bold text-gray-900 text-lg">Xác nhận hoàn thành khám bệnh</h3>
                            <p className="text-xs text-gray-600">
                                Bệnh nhân: <span className="font-bold text-gray-900">{activeVisit.benhNhan?.HoTen}</span> (Mã LK: #{activeVisit.MaLuotKham})
                            </p>
                            <p className="text-xs text-gray-500">
                                Chẩn đoán kết luận: <span className="font-semibold text-gray-800">{activeVisit.phieuKham?.ChanDoanSauCLS || activeVisit.phieuKham?.ChanDoan || phieuKhamForm.ChanDoanSauCLS || phieuKhamForm.ChanDoanBanDau}</span>
                            </p>
                            <p className="text-[11px] text-gray-400">
                                Sau khi hoàn tất, hồ sơ bệnh án, đơn thuốc và các chỉ định cận lâm sàng sẽ được đóng và khóa chỉnh sửa theo quy định.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowCompleteModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={handleCompleteExamine}
                                disabled={loadingAction === 'complete'}
                                className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                            >
                                {loadingAction === 'complete' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Đồng ý hoàn tất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
