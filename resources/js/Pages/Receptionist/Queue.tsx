import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';
import { 
    Users, 
    Calendar, 
    FileText, 
    Search, 
    UserCheck, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    RefreshCw, 
    Loader2, 
    Phone, 
    User, 
    PlusCircle, 
    X, 
    Ticket, 
    Tag, 
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    AlertTriangle,
    Check,
    UserPlus,
    Building2,
    CalendarClock,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';

interface Patient {
    MaBenhNhan: number;
    HoTen: string;
    SoDienThoai: string;
    EmailLienHe?: string;
    GioiTinh: 'NAM' | 'NU' | 'KHAC';
    NgaySinh?: string;
    DiaChi?: string;
    SoTheBHYT?: string;
    MucHuongBHYT?: number;
}

interface Specialty {
    MaChuyenKhoa: number;
    TenChuyenKhoa: string;
}

interface Doctor {
    MaBacSi: number;
    HoTen: string;
    HocVi?: string;
    MaChuyenKhoa: number;
    chuyen_khoa?: Specialty;
}

interface Shift {
    MaCaKham: number;
    GioBatDau: string;
    GioKetThuc: string;
    SoLuongTiepNhan?: number;
    TrangThai?: string;
    lich_lam_viec?: {
        MaLichLamViec: number;
        MaBacSi: number;
        NgayLamViec: string;
        bac_si?: Doctor;
    };
    lichLamViec?: {
        MaLichLamViec: number;
        MaBacSi: number;
        NgayLamViec: string;
        bac_si?: Doctor;
    };
}

interface Visit {
    MaLuotKham: number;
    MaBenhNhan: number;
    MaBacSi?: number;
    MaLichHen?: number;
    SoPhieu?: string;
    STTTrongNgay?: number;
    LoaiHangDoi?: 'DAT_LICH' | 'TRUC_TIEP' | 'CAP_CUU' | string;
    MucUuTien?: number;
    NgayKham?: string;
    MaChuyenKhoa?: number;
    MaCaKham?: number;
    ThoiGianVaoHang?: string;
    ThoiGianGoiKham?: string;
    call_count?: number;
    can_skip?: boolean;
    TrangThai: 'CHO_KHAM' | 'DANG_KHAM' | 'CHO_KET_QUA' | 'CHO_KHAM_LAI' | 'HOAN_THANH' | 'DA_HUY' | 'BO_LUOT';
    ThoiGianTiepNhan: string;
    ThoiGianBatDauKham?: string;
    ThoiGianKetThucKham?: string;
    GhiChu?: string;
    benh_nhan?: Patient;
    benhNhan?: Patient;
    chuyen_khoa?: Specialty;
    chuyenKhoa?: Specialty;
    ca_kham?: Shift;
    caKham?: Shift;
    bac_si?: Doctor;
    bacSi?: Doctor;
    unpaid_debt?: number;
    unpaidDebt?: number;
}

interface Appointment {
    MaLichHen: number;
    MaCaKham: number;
    MaBenhNhan: number;
    NgayDat: string;
    TrangThai: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DA_TIEP_NHAN' | 'HOAN_THANH' | 'DA_HUY';
    LyDoKham?: string;
    benh_nhan: Patient;
    ca_kham: {
        MaCaKham: number;
        GioBatDau: string;
        GioKetThuc: string;
        SoLuongTiepNhan: number;
        TrangThai: string;
        lich_lam_viec: {
            MaLichLamViec: number;
            MaBacSi: number;
            NgayLamViec: string;
            bac_si: Doctor;
        };
    };
    luot_kham?: Visit;
}

interface Stats {
    total_today: number;
    waiting_checkin: number;
    received: number;
    completed: number;
    active_in_queue?: number;
    booked_count?: number;
    walkin_count?: number;
    chartStats?: {
        statusDistribution: Array<{ name: string; status: string; value: number; color: string }>;
        priorityDistribution: Array<{ name: string; value: number; color: string }>;
        totalVisits: number;
        totalP2: number;
        totalP3: number;
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

interface Filters {
    date?: string;
    doctor_id?: number | null;
    specialty_id?: number | null;
    shift_id?: number | null;
    status?: string | null;
    search?: string | null;
    per_page?: number;
    page?: number;
}

export interface QueuePageProps {
    auth: any;
    appointments: Appointment[];
    activeQueue?: PaginatedData<Visit> | Visit[];
    availablePatients?: Patient[];
    availableShifts?: Shift[];
    doctors: Doctor[];
    specialties: Specialty[];
    stats: Stats;
    filters: Filters;
    role?: 'receptionist' | 'admin' | 'doctor';
    navItems?: any[];
    queueUrl?: string;
    deskUrl?: string;
}

export default function Queue({ 
    auth, 
    appointments = [], 
    activeQueue,
    availablePatients = [],
    availableShifts = [],
    doctors = [], 
    specialties = [], 
    stats, 
    filters,
    role = 'receptionist',
    navItems = RECEPTIONIST_NAV_ITEMS,
    queueUrl = '/receptionist/queue',
    deskUrl = '/receptionist/dashboard',
}: QueuePageProps) {
    // Trích xuất danh sách lượt khám và metadata phân trang
    const queueList: Visit[] = useMemo(() => {
        if (!activeQueue) return [];
        if (Array.isArray(activeQueue)) return activeQueue;
        return activeQueue.data || [];
    }, [activeQueue]);

    const pagination = useMemo(() => {
        if (!activeQueue || Array.isArray(activeQueue)) {
            return {
                current_page: 1,
                last_page: 1,
                from: queueList.length > 0 ? 1 : 0,
                to: queueList.length,
                total: queueList.length,
                per_page: 10,
            };
        }
        return {
            current_page: activeQueue.current_page || 1,
            last_page: activeQueue.last_page || 1,
            from: activeQueue.from,
            to: activeQueue.to,
            total: activeQueue.total ?? 0,
            per_page: activeQueue.per_page || 10,
        };
    }, [activeQueue, queueList.length]);

    // Tab state: 'hybrid_queue' (hàng đợi khám thông minh) hoặc 'appointments' (lịch hẹn chờ tiếp nhận)
    const [activeTab, setActiveTab] = useState<'hybrid_queue' | 'appointments'>('hybrid_queue');

    // Local filter state
    const [filterDate, setFilterDate] = useState<string>(filters?.date || new Date().toISOString().split('T')[0]);
    const [filterDoctor, setFilterDoctor] = useState<string>(filters?.doctor_id ? String(filters.doctor_id) : '');
    const [filterSpecialty, setFilterSpecialty] = useState<string>(filters?.specialty_id ? String(filters.specialty_id) : '');
    const [filterStatus, setFilterStatus] = useState<string>(filters?.status || '');
    const [searchTerm, setSearchTerm] = useState<string>(filters?.search || '');
    const [perPage, setPerPage] = useState<number>(filters?.per_page || pagination.per_page || 10);

    // Processing states
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal tiếp nhận trực tiếp (Walk-in P3)
    const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
    const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);

    // Patient search state inside modal
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>(availablePatients);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [newPatientError, setNewPatientError] = useState<string | null>(null);

    // New patient form fields
    const [newPatientForm, setNewPatientForm] = useState({
        HoTen: '',
        SoDienThoai: '',
        GioiTinh: 'NAM' as 'NAM' | 'NU' | 'KHAC',
        NgaySinh: '',
        DiaChi: '',
        EmailLienHe: '',
        SoTheBHYT: '',
        MucHuongBHYT: 80,
    });

    // Walk-in form fields
    const [walkInForm, setWalkInForm] = useState({
        MaChuyenKhoa: '',
        MaCaKham: '',
        GhiChu: '',
        CoBHYT: false,
        SoTheBHYT: '',
        MucHuongBHYT: 80,
        TuyenKCB: 'DUNG_TUYEN',
    });

    // Modal tiếp nhận lịch hẹn online và bổ sung BHYT tại quầy
    const [intakeModalAppointment, setIntakeModalAppointment] = useState<Appointment | null>(null);
    const [intakeBhytForm, setIntakeBhytForm] = useState({
        CoBHYT: false,
        SoTheBHYT: '',
        MucHuongBHYT: 80,
        TuyenKCB: 'DUNG_TUYEN',
    });

    const handleSelectPatient = (p: Patient | null) => {
        setSelectedPatient(p);
        if (p) {
            const hasBhyt = Boolean(p.SoTheBHYT || (p as any).so_the_bhyt);
            setWalkInForm(prev => ({
                ...prev,
                CoBHYT: hasBhyt,
                SoTheBHYT: p.SoTheBHYT || (p as any).so_the_bhyt || '',
                MucHuongBHYT: Number(p.MucHuongBHYT || (p as any).muc_huong_bhyt || 80),
                TuyenKCB: 'DUNG_TUYEN',
            }));
        }
    };

    // Helper tính tuổi từ ngày sinh
    const calculateAge = (dobString?: string) => {
        if (!dobString) return null;
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return null;
        const diff = Date.now() - dob.getTime();
        const ageDt = new Date(diff);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    // Helper định dạng tiền tệ
    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    // Debounced search bệnh nhân qua API
    useEffect(() => {
        if (!showWalkInModal || showNewPatientForm) return;

        const timer = setTimeout(async () => {
            if (!patientSearchTerm.trim()) {
                setPatientSearchResults(availablePatients.slice(0, 15));
                return;
            }

            setIsSearchingPatients(true);
            try {
                const res = await axios.get(`/receptionist/patients/search?q=${encodeURIComponent(patientSearchTerm)}`);
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setPatientSearchResults(res.data.data);
                }
            } catch (err) {
                console.error('Error searching patients:', err);
            } finally {
                setIsSearchingPatients(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [patientSearchTerm, showWalkInModal, showNewPatientForm, availablePatients]);

    // Lọc danh sách Ca khám hôm nay theo Chuyên khoa đã chọn
    const filteredShifts = useMemo(() => {
        if (!walkInForm.MaChuyenKhoa) return availableShifts;
        const ckId = Number(walkInForm.MaChuyenKhoa);
        return availableShifts.filter((shift) => {
            const shiftCkId = shift.lich_lam_viec?.bac_si?.MaChuyenKhoa 
                || shift.lichLamViec?.bac_si?.MaChuyenKhoa
                || shift.lich_lam_viec?.bac_si?.chuyen_khoa?.MaChuyenKhoa
                || shift.lichLamViec?.bac_si?.chuyen_khoa?.MaChuyenKhoa;
            return shiftCkId === ckId;
        });
    }, [availableShifts, walkInForm.MaChuyenKhoa]);

    // Apply filters (reset về trang 1 khi thay đổi điều kiện lọc)
    const applyFilters = (newFilters: Partial<Filters> = {}) => {
        const queryParams: any = {
            date: newFilters.date !== undefined ? newFilters.date : filterDate,
            doctor_id: newFilters.doctor_id !== undefined ? newFilters.doctor_id : filterDoctor,
            specialty_id: newFilters.specialty_id !== undefined ? newFilters.specialty_id : filterSpecialty,
            status: newFilters.status !== undefined ? newFilters.status : filterStatus,
            search: newFilters.search !== undefined ? newFilters.search : searchTerm,
            per_page: newFilters.per_page !== undefined ? newFilters.per_page : perPage,
            page: 1,
        };

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                delete queryParams[key];
            }
        });

        router.get(queueUrl, queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.last_page || newPage === pagination.current_page) return;
        const queryParams: any = {
            date: filterDate,
            doctor_id: filterDoctor,
            specialty_id: filterSpecialty,
            status: filterStatus,
            search: searchTerm,
            per_page: perPage,
            page: newPage,
        };

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                delete queryParams[key];
            }
        });

        router.get(queueUrl, queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        const queryParams: any = {
            date: filterDate,
            doctor_id: filterDoctor,
            specialty_id: filterSpecialty,
            status: filterStatus,
            search: searchTerm,
            per_page: newPerPage,
            page: 1,
        };

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                delete queryParams[key];
            }
        });

        router.get(queueUrl, queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setFilterDate(today);
        setFilterDoctor('');
        setFilterSpecialty('');
        setFilterStatus('');
        setSearchTerm('');
        setPerPage(10);
        router.get(queueUrl, { date: today, per_page: 10, page: 1 }, { preserveState: true });
    };

    // Làm mới dữ liệu đồng bộ với Bác sĩ
    const handleRefreshData = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    // Auto-refresh nhẹ mỗi 25s khi tab đang hiển thị
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && !showWalkInModal && processingId === null) {
                router.reload({
                    only: ['activeQueue', 'stats', 'appointments'],
                });
            }
        }, 25000);
        return () => clearInterval(interval);
    }, [showWalkInModal, processingId]);

    // Mở Modal tiếp nhận bệnh nhân có lịch hẹn (P2) để kiểm tra & cập nhật BHYT
    const handleOpenIntakeModal = (appointment: Appointment) => {
        const bn = appointment.benh_nhan;
        const hasBhyt = Boolean(bn?.SoTheBHYT || (bn as any)?.so_the_bhyt);
        setIntakeBhytForm({
            CoBHYT: hasBhyt,
            SoTheBHYT: bn?.SoTheBHYT || (bn as any)?.so_the_bhyt || '',
            MucHuongBHYT: Number(bn?.MucHuongBHYT || (bn as any)?.muc_huong_bhyt || 80),
            TuyenKCB: 'DUNG_TUYEN',
        });
        setIntakeModalAppointment(appointment);
    };

    // Xác nhận tiếp nhận lịch hẹn vào hàng đợi P2
    const handleConfirmAppointmentIntake = () => {
        if (!intakeModalAppointment) return;

        setProcessingId(intakeModalAppointment.MaLichHen);
        setNotification(null);

        router.post('/receptionist/visits', {
            MaLichHen: intakeModalAppointment.MaLichHen,
            CoBHYT: intakeBhytForm.CoBHYT,
            SoTheBHYT: intakeBhytForm.CoBHYT ? (intakeBhytForm.SoTheBHYT ? intakeBhytForm.SoTheBHYT.trim().toUpperCase() : null) : null,
            MucHuongBHYT: intakeBhytForm.CoBHYT ? Number(intakeBhytForm.MucHuongBHYT || 80) : 0,
            TuyenKCB: intakeBhytForm.CoBHYT ? intakeBhytForm.TuyenKCB : 'KHONG_BHYT',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Tiếp nhận thành công bệnh nhân ${intakeModalAppointment.benh_nhan.HoTen}. Đã cấp số phiếu P2 vào hàng đợi chung.`,
                });
                setProcessingId(null);
                setIntakeModalAppointment(null);
                setActiveTab('hybrid_queue');
            },
            onError: (errors: any) => {
                const errorMsg = errors.MaLichHen || errors.message || Object.values(errors)[0] || 'Lỗi khi tiếp nhận bệnh nhân. Vui lòng thử lại.';
                setNotification({
                    type: 'error',
                    message: String(errorMsg),
                });
                setProcessingId(null);
            },
        });
    };

    // Tạo hồ sơ bệnh nhân mới từ quầy Lễ tân
    const handleCreateNewPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreatingPatient) return;
        setNewPatientError(null);
        setIsCreatingPatient(true);

        try {
            const res = await axios.post('/receptionist/patients', newPatientForm, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = res.data;
            if (data?.success && data?.data) {
                handleSelectPatient(data.data);
                setShowNewPatientForm(false);
                setNewPatientForm({
                    HoTen: '',
                    SoDienThoai: '',
                    GioiTinh: 'NAM',
                    NgaySinh: '',
                    DiaChi: '',
                    EmailLienHe: '',
                    SoTheBHYT: '',
                    MucHuongBHYT: 80,
                });
                setNotification({
                    type: 'success',
                    message: `Đã tạo hồ sơ bệnh nhân mới: ${data.data.HoTen} (Mã: BN${data.data.MaBenhNhan}).`,
                });
            } else {
                setNewPatientError(data?.message || 'Lỗi khi tạo hồ sơ bệnh nhân mới.');
            }
        } catch (err: any) {
            const resData = err.response?.data;
            if (resData?.errors) {
                const firstError = Object.values(resData.errors)[0];
                setNewPatientError(Array.isArray(firstError) ? firstError[0] : String(firstError));
            } else if (resData?.message) {
                setNewPatientError(resData.message);
            } else {
                setNewPatientError('Lỗi kết nối máy chủ khi tạo hồ sơ bệnh nhân.');
            }
        } finally {
            setIsCreatingPatient(false);
        }
    };

    // Xử lý nộp form Tiếp nhận trực tiếp (P3)
    const handleRegisterWalkIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) {
            alert('Vui lòng tìm kiếm và chọn chính xác bệnh nhân tiếp nhận.');
            return;
        }
        if (!walkInForm.MaChuyenKhoa || !walkInForm.MaCaKham) {
            alert('Vui lòng chọn đầy đủ Chuyên khoa và Ca khám.');
            return;
        }

        setIsSubmittingWalkIn(true);
        setNotification(null);

        router.post('/receptionist/visits', {
            MaBenhNhan: Number(selectedPatient.MaBenhNhan),
            MaChuyenKhoa: Number(walkInForm.MaChuyenKhoa),
            MaCaKham: Number(walkInForm.MaCaKham),
            CoBHYT: Boolean(walkInForm.CoBHYT),
            SoTheBHYT: walkInForm.CoBHYT ? (walkInForm.SoTheBHYT ? walkInForm.SoTheBHYT.trim().toUpperCase() : null) : null,
            MucHuongBHYT: walkInForm.CoBHYT ? Number(walkInForm.MucHuongBHYT || 80) : 0,
            TuyenKCB: walkInForm.CoBHYT ? (walkInForm.TuyenKCB || 'DUNG_TUYEN') : 'KHONG_BHYT',
            GhiChu: walkInForm.GhiChu || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                const debt = Number((selectedPatient as any)?.unpaid_debt || (selectedPatient as any)?.unpaidDebt || 0);
                const debtNotice = debt > 0 ? ` ⚠️ Lưu ý: Bệnh nhân còn nợ viện phí lần trước (${formatCurrency(debt)}). Vui lòng đôn đốc thanh toán.` : '';

                setShowWalkInModal(false);
                setSelectedPatient(null);
                setWalkInForm({
                    MaChuyenKhoa: '',
                    MaCaKham: '',
                    GhiChu: '',
                    CoBHYT: false,
                    SoTheBHYT: '',
                    MucHuongBHYT: 80,
                    TuyenKCB: 'DUNG_TUYEN',
                });
                setNotification({
                    type: debt > 0 ? 'warning' : 'success',
                    message: `Tiếp nhận bệnh nhân trực tiếp (P3) thành công! Số phiếu khám đã được cấp tự động theo thuật toán Hybrid Queue.${debtNotice}`,
                });
                setIsSubmittingWalkIn(false);
                setActiveTab('hybrid_queue');
            },
            onError: (errors: any) => {
                setIsSubmittingWalkIn(false);
                const errorMsg = errors.MaBenhNhan || errors.MaCaKham || errors.message || Object.values(errors)[0] || 'Lỗi khi tiếp nhận bệnh nhân vãng lai.';
                setNotification({
                    type: 'error',
                    message: String(errorMsg),
                });
            }
        });
    };

    // Xác nhận bỏ lượt thủ công sau đủ 3 lần gọi
    const handleSkipPatient = (visit: Visit) => {
        const name = visit.benh_nhan?.HoTen || visit.benhNhan?.HoTen || '';
        if (!confirm(`Xác nhận bỏ lượt cho bệnh nhân ${name} (Số phiếu: ${visit.SoPhieu || `#${visit.MaLuotKham}`}) sau 3 lần gọi không có mặt?`)) {
            return;
        }

        router.post('/receptionist/queue/skip-patient', {
            MaLuotKham: visit.MaLuotKham,
            LyDo: 'Gọi 3 lần không có mặt',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Đã xác nhận bỏ lượt khám #${visit.MaLuotKham} thành công.`,
                });
            },
        });
    };

    // Tiếp nhận bệnh nhân quay lại sau cận lâm sàng
    const handleRecordClsReturn = (visit: Visit) => {
        router.post('/receptionist/queue/cls-return', {
            MaLuotKham: visit.MaLuotKham,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: `Tiếp nhận bệnh nhân quay lại sau CLS thành công! Bệnh nhân đã được xếp vào hàng chờ theo thời điểm hiện tại.`,
                });
            },
        });
    };

    // Render Badge trạng thái Lịch hẹn
    const renderAppointmentBadge = (status: string) => {
        switch (status) {
            case 'CHO_XAC_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Chờ tiếp nhận</span>;
            case 'DA_XAC_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'DA_TIEP_NHAN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Đã tiếp nhận</span>;
            case 'HOAN_THANH':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Hoàn thành</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Đã hủy</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    // Render Badge trạng thái Lượt khám
    const renderVisitStatusBadge = (status: string) => {
        switch (status) {
            case 'CHO_KHAM':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ khám</span>;
            case 'DANG_KHAM':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 animate-pulse">Đang khám</span>;
            case 'CHO_KET_QUA':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">Chờ KQ CLS</span>;
            case 'CHO_KHAM_LAI':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 ring-1 ring-teal-400">Chờ khám lại</span>;
            case 'BO_LUOT':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Bỏ lượt</span>;
            case 'HOAN_THANH':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Đã xong</span>;
            case 'DA_HUY':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Đã hủy</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    // Dữ liệu biểu đồ từ props backend
    const chartStats = stats?.chartStats;
    const statusData = chartStats?.statusDistribution || [];
    const priorityData = chartStats?.priorityDistribution || [];
    const totalVisitsCount = chartStats?.totalVisits ?? pagination.total;

    return (
        <DashboardLayout
            role={role}
            navItems={navItems}
            user={auth?.user}
            header={role === 'admin' ? "Quản lý Hàng chờ & Gọi số (Quản trị viên)" : "Quản lý Hàng chờ & Tiếp nhận (Hybrid Queue)"}
        >
            <Head title={role === 'admin' ? "Hàng chờ & Gọi số (Admin) - SmartCare" : "Hàng chờ & Tiếp nhận bệnh nhân - SmartCare"} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 1. THÔNG BÁO FLASH TOAST */}
                {notification && (
                    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : notification.type === 'warning'
                            ? 'bg-amber-50 border border-amber-200 text-amber-800'
                            : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : notification.type === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
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

                {/* 2. THẺ THỐNG KÊ NHANH HÔM NAY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng lịch hẹn hôm nay</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_today ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Lịch chờ tiếp nhận</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{stats?.waiting_checkin ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">Đang trong hàng đợi</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-2xl font-black text-primary">{stats?.active_in_queue ?? pagination.total}</p>
                                <span className="text-xs text-slate-500 font-semibold">
                                    ({stats?.booked_count ?? 0} P2 / {stats?.walkin_count ?? 0} P3)
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã hoàn thành khám</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.completed ?? 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. KHU VỰC 2 BIỂU ĐỒ LỄ TÂN (TÁCH BIỆT - KHÔNG CHỒNG LẤN - RESPONSIVE) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* BIỂU ĐỒ 1: THỐNG KÊ LƯỢT TIẾP NHẬN THEO TRẠNG THÁI */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Tiếp nhận theo trạng thái khám</h4>
                                    <p className="text-xs text-slate-400">Phân bố lượt khám theo tiến trình thực tế</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Tổng: {totalVisitsCount} lượt
                            </span>
                        </div>

                        {totalVisitsCount === 0 ? (
                            <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Clock className="w-8 h-8 text-slate-300 mb-1" />
                                <p className="text-xs font-semibold text-slate-500">Chưa có lượt tiếp nhận nào hôm nay</p>
                                <p className="text-[11px] text-slate-400">Biểu đồ sẽ tự cập nhật khi bệnh nhân vào hàng đợi</p>
                            </div>
                        ) : (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                        <XAxis 
                                            dataKey="name" 
                                            tick={{ fontSize: 11, fill: '#64748B' }} 
                                            interval={0}
                                            angle={-15}
                                            textAnchor="end"
                                        />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0F172A', 
                                                color: '#fff', 
                                                borderRadius: '10px', 
                                                fontSize: '12px',
                                                border: 'none' 
                                            }}
                                            formatter={(value: any) => [`${value} lượt`, 'Số lượng']}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* BIỂU ĐỒ 2: THỐNG KÊ TỶ LỆ BỆNH NHÂN THEO LOẠI (P2 VS P3) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                    <PieChartIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Cơ cấu loại tiếp nhận (P2 / P3)</h4>
                                    <p className="text-xs text-slate-400">Tỷ lệ Lịch hẹn trước (P2) vs Khám trực tiếp (P3)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold">
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> P2: {chartStats?.totalP2 ?? 0}
                                </span>
                                <span className="inline-flex items-center gap-1 text-purple-700">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> P3: {chartStats?.totalP3 ?? 0}
                                </span>
                            </div>
                        </div>

                        {totalVisitsCount === 0 ? (
                            <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Users className="w-8 h-8 text-slate-300 mb-1" />
                                <p className="text-xs font-semibold text-slate-500">Chưa có dữ liệu phân loại P2/P3</p>
                                <p className="text-[11px] text-slate-400">Hiển thị tỷ lệ khi tiếp nhận lượt khám mới</p>
                            </div>
                        ) : (
                            <div className="h-56 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={priorityData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={6}
                                            dataKey="value"
                                        >
                                            {priorityData.map((entry, index) => (
                                                <Cell key={`pie-cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0F172A', 
                                                color: '#fff', 
                                                borderRadius: '10px', 
                                                fontSize: '12px',
                                                border: 'none' 
                                            }}
                                            formatter={(value: any, name: any) => [`${value} lượt`, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. THANH CÔNG CỤ TÌM KIẾM, BỘ LỌC & NÚT TIẾP NHẬN TRỰC TIẾP */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('hybrid_queue')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                                    activeTab === 'hybrid_queue'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                Hàng đợi khám hiện tại ({pagination.total})
                            </button>
                            <button
                                onClick={() => setActiveTab('appointments')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                                    activeTab === 'appointments'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Lịch hẹn chờ tiếp nhận ({appointments.filter(a => a.TrangThai === 'DA_XAC_NHAN' || a.TrangThai === 'CHO_XAC_NHAN').length})
                            </button>
                        </div>

                        {/* Nút Tiếp nhận trực tiếp (Walk-in P3) & Nút làm mới */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRefreshData}
                                disabled={isRefreshing}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                                title="Đồng bộ dữ liệu thời gian thực từ bác sĩ & hàng đợi"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                                <span className="hidden sm:inline">Làm mới</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowWalkInModal(true);
                                    setSelectedPatient(null);
                                    setShowNewPatientForm(false);
                                    setPatientSearchTerm('');
                                }}
                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tiếp nhận bệnh nhân trực tiếp (P3)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
                        {/* Lọc Ngày */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày khám</label>
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

                        {/* Lọc Chuyên khoa */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Chuyên khoa</label>
                            <select
                                value={filterSpecialty}
                                onChange={(e) => {
                                    setFilterSpecialty(e.target.value);
                                    applyFilters({ specialty_id: e.target.value ? Number(e.target.value) : null });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả chuyên khoa</option>
                                {specialties.map((ck) => (
                                    <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                        {ck.TenChuyenKhoa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc Bác sĩ */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Bác sĩ phụ trách</label>
                            <select
                                value={filterDoctor}
                                onChange={(e) => {
                                    setFilterDoctor(e.target.value);
                                    applyFilters({ doctor_id: e.target.value ? Number(e.target.value) : null });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả bác sĩ</option>
                                {doctors.map((bs) => (
                                    <option key={bs.MaBacSi} value={bs.MaBacSi}>
                                        {bs.HocVi ? `${bs.HocVi}. ` : 'BS. '}{bs.HoTen}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc Trạng thái */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trạng thái</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="CHO_KHAM">Chờ khám</option>
                                <option value="DANG_KHAM">Đang khám</option>
                                <option value="CHO_KET_QUA">Chờ KQ CLS</option>
                                <option value="CHO_KHAM_LAI">Chờ khám lại</option>
                                <option value="HOAN_THANH">Đã hoàn thành</option>
                                <option value="BO_LUOT">Bỏ lượt</option>
                            </select>
                        </div>

                        {/* Tìm kiếm tên / SĐT */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tìm bệnh nhân / Số phiếu</label>
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    type="text"
                                    placeholder="Tên, SĐT, hoặc số phiếu..."
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

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>
                            {activeTab === 'hybrid_queue' 
                                ? <>Đang hiển thị <strong className="text-slate-800">{pagination.total > 0 ? `${pagination.from || 1} - ${pagination.to || pagination.total}` : '0'}</strong> trên tổng số <strong className="text-slate-800">{pagination.total}</strong> lượt trong hàng đợi hôm nay</>
                                : <>Đang hiển thị <strong className="text-slate-800">{appointments.length}</strong> lịch hẹn</>}
                        </span>
                        <button 
                            type="button" 
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                {/* 5. NỘI DUNG THEO TAB */}
                {activeTab === 'hybrid_queue' ? (
                    /* TAB 1: BẢNG HÀNG ĐỢI KHÁM HIỆN TẠI (HYBRID QUEUE) */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-slate-900 text-sm">
                                    Hàng đợi khám thông minh – FIFO chung theo thời gian tiếp nhận / quay lại
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                FIFO chung: P2 (Đặt lịch) &amp; P3 (Trực tiếp) chung hàng đợi • Bác sĩ trực tiếp gọi khám
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 font-bold text-center w-28">Số phiếu</th>
                                        <th className="px-5 py-3.5 font-bold">Bệnh nhân</th>
                                        <th className="px-5 py-3.5 font-bold">Chuyên khoa & Bác sĩ</th>
                                        <th className="px-5 py-3.5 font-bold">Ca khám</th>
                                        <th className="px-5 py-3.5 font-bold text-center">Phân loại & Ưu tiên</th>
                                        <th className="px-5 py-3.5 font-bold">Giờ vào hàng</th>
                                        <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                                        <th className="px-5 py-3.5 font-bold text-center w-36">Tiến độ gọi & Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {queueList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-14 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Ticket className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                                                    <p className="text-base font-bold text-slate-700">Hàng đợi khám đang trống</p>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">Chưa có bệnh nhân nào được tiếp nhận vào hàng đợi hôm nay.</p>
                                                    <button
                                                        onClick={() => {
                                                             setShowWalkInModal(true);
                                                             setSelectedPatient(null);
                                                             setShowNewPatientForm(false);
                                                        }}
                                                        className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                                                    >
                                                        Tiếp nhận bệnh nhân trực tiếp ngay
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        queueList.map((item) => {
                                            const patient = item.benh_nhan || item.benhNhan;
                                            const specialty = item.chuyen_khoa || item.chuyenKhoa;
                                            const shift = item.ca_kham || item.caKham;
                                            const doctor = item.bac_si || item.bacSi || shift?.lich_lam_viec?.bac_si || shift?.lichLamViec?.bac_si;
                                            const age = calculateAge(patient?.NgaySinh);
                                            const timeIn = item.ThoiGianVaoHang 
                                                ? new Date(item.ThoiGianVaoHang).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                                : item.ThoiGianTiepNhan 
                                                    ? new Date(item.ThoiGianTiepNhan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : '--:--';

                                            // Xác định chính xác loại hàng đợi P2 hay P3 theo LoaiHangDoi
                                            const isP2 = item.LoaiHangDoi === 'DAT_LICH' 
                                                || (!item.LoaiHangDoi && (item.MucUuTien === 2 || !!item.MaLichHen || (item.SoPhieu && item.SoPhieu.startsWith('A-'))));
                                            const isP3 = item.LoaiHangDoi === 'TRUC_TIEP' 
                                                || (!item.LoaiHangDoi && !isP2 && (item.MucUuTien === 3 || !item.MaLichHen));
                                            const isP1 = item.LoaiHangDoi === 'CAP_CUU' || (!item.LoaiHangDoi && item.MucUuTien === 1);

                                            return (
                                                <tr key={item.MaLuotKham} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-mono font-black text-sm rounded-lg border border-blue-200 shadow-sm">
                                                                {item.SoPhieu || `#${item.MaLuotKham}`}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-mono font-semibold mt-0.5">
                                                                STT: {item.STTTrongNgay != null ? item.STTTrongNgay : '---'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                                                {patient?.HoTen?.charAt(0) || 'BN'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 leading-tight">
                                                                    {patient?.HoTen || 'Chưa cập nhật tên'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    {patient?.SoDienThoai || '---'}
                                                                    {patient?.GioiTinh && ` • ${patient.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}`}
                                                                    {age ? ` • ${age} tuổi` : ''}
                                                                </p>
                                                                {Number(item.unpaid_debt || (item as any).unpaidDebt || 0) > 0 && (
                                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                        <span>Nợ viện phí: {formatCurrency(item.unpaid_debt || (item as any).unpaidDebt)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {specialty?.TenChuyenKhoa || 'Đa khoa'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {doctor?.HoTen ? `BS: ${doctor.HoTen}` : 'Chờ phân bác sĩ'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="text-xs">
                                                            {shift?.GioBatDau && shift?.GioKetThuc ? (
                                                                <span className="font-bold text-slate-800">
                                                                    {shift.GioBatDau.substring(0, 5)} - {shift.GioKetThuc.substring(0, 5)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">---</span>
                                                            )}
                                                            <span className="text-slate-500 block mt-0.5">
                                                                Ca #{item.MaCaKham || shift?.MaCaKham || '---'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        {isP1 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                                P1 Khẩn cấp
                                                            </span>
                                                        ) : isP2 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                                                P2 Đặt lịch
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                                <Tag className="w-3 h-3 text-purple-600" />
                                                                P3 Trực tiếp
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1 text-xs text-slate-600">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{timeIn}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {renderVisitStatusBadge(item.TrangThai)}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Lễ tân chỉ theo dõi số lần gọi của Bác sĩ (0/3, 1/3, 2/3, 3/3) */}
                                                            {['CHO_KHAM', 'CHO_KHAM_LAI'].includes(item.TrangThai) && (
                                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                                    (item.call_count || 0) >= 3 
                                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                                                        : (item.call_count || 0) > 0
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    Gọi: {item.call_count || 0}/3
                                                                </span>
                                                            )}

                                                            {/* Nút Bỏ lượt nếu bệnh nhân đã được gọi đủ 3 lần mà không có mặt */}
                                                            {item.can_skip && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSkipPatient(item)}
                                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                                    title="Xác nhận bỏ lượt sau 3 lần gọi không có mặt"
                                                                >
                                                                    Bỏ lượt
                                                                </button>
                                                            )}

                                                            {/* Nút Tiếp nhận quay lại CLS (chỉ khi có kết quả CLS) */}
                                                            {item.TrangThai === 'CHO_KET_QUA' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRecordClsReturn(item)}
                                                                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                                    title="Xác nhận bệnh nhân đã có đầy đủ kết quả CLS và quay lại quầy"
                                                                >
                                                                    Nhận lại CLS
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

                        {/* THANH PHÂN TRANG CHO HÀNG ĐỢI (PHASE 13) */}
                        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <span>
                                    Hiển thị <strong className="text-slate-900 font-bold">{pagination.total > 0 ? (pagination.from || 1) : 0}</strong> - <strong className="text-slate-900 font-bold">{pagination.to || 0}</strong> trên tổng số <strong className="text-slate-900 font-bold">{pagination.total}</strong> bản ghi
                                </span>
                                <div className="flex items-center gap-1.5 ml-2">
                                    <span className="text-slate-500">Số bản ghi:</span>
                                    <select
                                        value={perPage}
                                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                        className="text-xs rounded-lg border-slate-300 py-1 px-2 focus:ring-primary focus:border-primary bg-white font-medium"
                                    >
                                        <option value={10}>10 / trang</option>
                                        <option value={20}>20 / trang</option>
                                        <option value={50}>50 / trang</option>
                                    </select>
                                </div>
                            </div>

                            {pagination.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page <= 1}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-all shadow-xs"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Trang trước</span>
                                    </button>

                                    <div className="flex items-center gap-1 mx-1">
                                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => {
                                            if (
                                                p === 1 || 
                                                p === pagination.last_page || 
                                                Math.abs(p - pagination.current_page) <= 1
                                            ) {
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => handlePageChange(p)}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                                            p === pagination.current_page
                                                                ? 'bg-primary text-white shadow-xs'
                                                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            } else if (
                                                (p === 2 && pagination.current_page > 3) || 
                                                (p === pagination.last_page - 1 && pagination.current_page < pagination.last_page - 2)
                                            ) {
                                                return <span key={p} className="text-slate-400 px-0.5">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page >= pagination.last_page}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-all shadow-xs"
                                    >
                                        <span className="hidden sm:inline">Trang sau</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* TAB 2: BẢNG LỊCH HẸN CHỜ TIẾP NHẬN */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-slate-900 text-sm">
                                    Danh sách lịch hẹn bệnh nhân chờ tiếp nhận vào hàng đợi
                                </h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 font-bold text-center w-14">STT</th>
                                        <th className="px-5 py-3.5 font-bold">Mã LH</th>
                                        <th className="px-5 py-3.5 font-bold">Bệnh nhân</th>
                                        <th className="px-5 py-3.5 font-bold">Bác sĩ & Chuyên khoa</th>
                                        <th className="px-5 py-3.5 font-bold">Thời gian khám</th>
                                        <th className="px-5 py-3.5 font-bold">Trạng thái hẹn</th>
                                        <th className="px-5 py-3.5 font-bold">Lượt khám</th>
                                        <th className="px-5 py-3.5 font-bold text-center w-44">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-14 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Users className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                                                    <p className="text-base font-bold text-slate-700">Không có lịch hẹn nào</p>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">Không tìm thấy lịch hẹn phù hợp với điều kiện tìm kiếm hoặc ngày được chọn.</p>
                                                    <button
                                                        onClick={resetFilters}
                                                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                                                    >
                                                        Xem tất cả lịch hẹn hôm nay
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        appointments.map((app, index) => {
                                            const doc = app.ca_kham?.lich_lam_viec?.bac_si;
                                            const ck = doc?.chuyen_khoa;
                                            const timeSlot = `${app.ca_kham?.GioBatDau?.substring(0, 5)} - ${app.ca_kham?.GioKetThuc?.substring(0, 5)}`;
                                            const examDate = app.ca_kham?.lich_lam_viec?.NgayLamViec;
                                            const hasVisit = !!app.luot_kham;
                                            const canCheckIn = (app.TrangThai === 'DA_XAC_NHAN' || app.TrangThai === 'CHO_XAC_NHAN') && !hasVisit;
                                            const isProcessing = processingId === app.MaLichHen;

                                            return (
                                                <tr key={app.MaLichHen} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-5 py-4 text-center font-black text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-primary">
                                                        #{app.MaLichHen}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                                {app.benh_nhan?.HoTen?.charAt(0) || 'BN'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 leading-tight">{app.benh_nhan?.HoTen}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                                    {app.benh_nhan?.SoDienThoai || '---'}
                                                                    {app.benh_nhan?.GioiTinh && ` • ${app.benh_nhan.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div>
                                                            <p className="font-medium text-slate-800">
                                                                {doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Chưa chỉ định'}
                                                            </p>
                                                            <p className="text-xs text-primary font-medium mt-0.5">
                                                                {ck?.TenChuyenKhoa || 'Đa khoa'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-800">{timeSlot}</span>
                                                            <span className="text-slate-500 block mt-0.5">{examDate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {renderAppointmentBadge(app.TrangThai)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {hasVisit ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                {app.luot_kham?.SoPhieu ? `${app.luot_kham.SoPhieu}` : `#${app.luot_kham?.MaLuotKham}`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Chưa tiếp nhận</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        {canCheckIn ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenIntakeModal(app)}
                                                                disabled={isProcessing}
                                                                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                                            >
                                                                {isProcessing ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        Đang tiếp nhận...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="w-3.5 h-3.5" />
                                                                        Xác nhận đến & Tiếp nhận (P2)
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : hasVisit ? (
                                                            <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Đã vào hàng đợi
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Không thể tiếp nhận</span>
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

                {/* 6. MODAL TIẾP NHẬN TRỰC TIẾP (WALK-IN P3) THIẾT KẾ MỚI */}
                {showWalkInModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                        <PlusCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">Tiếp nhận bệnh nhân trực tiếp (P3)</h3>
                                        <p className="text-xs text-slate-500">Tìm kiếm hồ sơ có sẵn hoặc đăng ký mới cho bệnh nhân vãng lai</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowWalkInModal(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Badge phân loại bắt buộc P3 */}
                            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-purple-600" />
                                    <div>
                                        <p className="text-xs font-bold text-purple-900">Phân loại hàng đợi chuẩn: P3 - Khám trực tiếp</p>
                                        <p className="text-[11px] text-purple-700">Xếp chung hàng đợi với P2 theo thời gian tiếp nhận (FIFO)</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-[11px] font-bold rounded-md">
                                    P3 Standard
                                </span>
                            </div>

                            {/* BƯỚC 1: TÌM KIẾM HOẶC TẠO MỚI HỒ SƠ BỆNH NHÂN */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase">
                                        1. Hồ sơ Bệnh nhân <span className="text-rose-500">*</span>
                                    </label>
                                    {!selectedPatient && !showNewPatientForm && (
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPatientForm(true)}
                                            className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Đăng ký bệnh nhân mới
                                        </button>
                                    )}
                                </div>

                                {selectedPatient ? (
                                    /* THẺ THÔNG TIN BỆNH NHÂN ĐÃ CHỌN */
                                    <div className="space-y-2">
                                        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-sm">
                                                    {selectedPatient.HoTen.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-slate-900 text-sm">{selectedPatient.HoTen}</h4>
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-200 text-teal-800">
                                                            BN#{selectedPatient.MaBenhNhan}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        SĐT: <strong className="text-slate-800">{selectedPatient.SoDienThoai}</strong>
                                                        {selectedPatient.GioiTinh && ` • ${selectedPatient.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'}`}
                                                        {selectedPatient.NgaySinh && ` • ${selectedPatient.NgaySinh}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectPatient(null)}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                                            >
                                                Đổi bệnh nhân
                                            </button>
                                        </div>

                                        {Number((selectedPatient as any).unpaid_debt || (selectedPatient as any).unpaidDebt || 0) > 0 && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                    <div>
                                                        <span className="font-bold">⚠️ Cảnh báo công nợ:</span> Bệnh nhân còn nợ viện phí lần khám trước: <strong className="text-rose-700">{formatCurrency((selectedPatient as any).unpaid_debt || (selectedPatient as any).unpaidDebt)}</strong>.
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/receptionist/payment?search=${selectedPatient.SoDienThoai || selectedPatient.MaBenhNhan}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shrink-0 shadow-sm transition-colors"
                                                >
                                                    Thu nợ ngay &rarr;
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : showNewPatientForm ? (
                                    /* FORM ĐĂNG KÝ HỒ SƠ BỆNH NHÂN MỚI TẠI CHỖ */
                                    <form onSubmit={handleCreateNewPatient} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                <UserPlus className="w-4 h-4 text-teal-600" />
                                                Tạo hồ sơ bệnh nhân vãng lai mới
                                            </h5>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNewPatientForm(false);
                                                    setNewPatientError(null);
                                                }}
                                                className="text-xs text-slate-500 hover:text-slate-800"
                                            >
                                                Quay lại tìm kiếm
                                            </button>
                                        </div>

                                        {newPatientError && (
                                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                <span>{newPatientError}</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Họ và tên <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="VD: Nguyễn Văn A"
                                                    value={newPatientForm.HoTen}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, HoTen: e.target.value })}
                                                    className="w-full text-xs rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Số điện thoại <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    required
                                                    placeholder="VD: 0912345678"
                                                    value={newPatientForm.SoDienThoai}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, SoDienThoai: e.target.value })}
                                                    className="w-full text-xs rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Giới tính <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    value={newPatientForm.GioiTinh}
                                                    onChange={(e: any) => setNewPatientForm({ ...newPatientForm, GioiTinh: e.target.value })}
                                                    className="w-full text-xs rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="NAM">Nam</option>
                                                    <option value="NU">Nữ</option>
                                                    <option value="KHAC">Khác</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Ngày sinh
                                                </label>
                                                <input
                                                    type="date"
                                                    value={newPatientForm.NgaySinh}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, NgaySinh: e.target.value })}
                                                    className="w-full text-xs rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                Địa chỉ cư trú
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                                                value={newPatientForm.DiaChi}
                                                onChange={(e) => setNewPatientForm({ ...newPatientForm, DiaChi: e.target.value })}
                                                className="w-full text-xs rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Mã thẻ BHYT (nếu có)
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={15}
                                                    placeholder="VD: GD4797931..."
                                                    value={newPatientForm.SoTheBHYT}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, SoTheBHYT: e.target.value.toUpperCase() })}
                                                    className="w-full text-xs font-mono font-bold rounded-xl border-slate-300 focus:ring-primary focus:border-primary uppercase"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                                                    Mức hưởng BHYT
                                                </label>
                                                <select
                                                    value={newPatientForm.MucHuongBHYT}
                                                    onChange={(e) => setNewPatientForm({ ...newPatientForm, MucHuongBHYT: Number(e.target.value) })}
                                                    className="w-full text-xs font-bold rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                                >
                                                    <option value={80}>80% - Học sinh, SV, LĐ phổ thông</option>
                                                    <option value={95}>95% - Hộ cận nghèo, thân nhân</option>
                                                    <option value={100}>100% - Trẻ &lt; 6t, hộ nghèo, người có công</option>
                                                    <option value={0}>0% - Khám dịch vụ tự túc</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPatientForm(false)}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isCreatingPatient}
                                                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                {isCreatingPatient ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        Lưu hồ sơ & Chọn
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Ô TÌM KIẾM BỆNH NHÂN CÓ DEBOUNCE */
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Nhập tên, số điện thoại hoặc mã bệnh nhân (VD: 0912..., Trần Văn...)"
                                                value={patientSearchTerm}
                                                onChange={(e) => setPatientSearchTerm(e.target.value)}
                                                className="w-full text-xs rounded-xl border-slate-300 pr-9 focus:ring-primary focus:border-primary shadow-sm"
                                                autoFocus
                                            />
                                            <div className="absolute right-3 top-2.5 text-slate-400">
                                                {isSearchingPatients ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                ) : (
                                                    <Search className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Danh sách kết quả tìm kiếm */}
                                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                                            {patientSearchResults.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-500">
                                                    <p className="font-medium">Không tìm thấy bệnh nhân phù hợp</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPatientForm(true)}
                                                        className="mt-1.5 text-teal-600 font-bold hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Tạo hồ sơ bệnh nhân mới ngay
                                                    </button>
                                                </div>
                                            ) : (
                                                patientSearchResults.map((p) => {
                                                    const age = calculateAge(p.NgaySinh);
                                                    return (
                                                        <button
                                                            key={p.MaBenhNhan}
                                                            type="button"
                                                            onClick={() => handleSelectPatient(p)}
                                                            className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                                                                    {p.HoTen.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary flex items-center">
                                                                        {p.HoTen}
                                                                        {Number((p as any).unpaid_debt || (p as any).unpaidDebt || 0) > 0 && (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 ml-1.5">
                                                                                Nợ: {formatCurrency((p as any).unpaid_debt || (p as any).unpaidDebt)}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500">
                                                                        SĐT: {p.SoDienThoai} • {p.GioiTinh === 'NAM' ? 'Nam' : 'Nữ'} {age ? `• ${age} tuổi` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                                                Chọn
                                                            </span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BƯỚC 2: THÔNG TIN BẢO HIỂM Y TẾ & CHUYÊN KHOA TIẾP NHẬN */}
                            <form onSubmit={handleRegisterWalkIn} className="space-y-4 pt-2 border-t border-slate-100">
                                {/* Khối BHYT */}
                                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-blue-900 flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={walkInForm.CoBHYT}
                                                onChange={(e) => setWalkInForm({ ...walkInForm, CoBHYT: e.target.checked })}
                                                className="rounded border-blue-300 text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span>Bệnh nhân có sử dụng Thẻ Bảo hiểm Y tế (BHYT)</span>
                                        </label>
                                        {walkInForm.CoBHYT && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                Được BHYT hỗ trợ
                                            </span>
                                        )}
                                    </div>

                                    {walkInForm.CoBHYT && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-100">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Mã số thẻ BHYT</label>
                                                <input
                                                    type="text"
                                                    maxLength={15}
                                                    placeholder="VD: GD4797931..."
                                                    value={walkInForm.SoTheBHYT}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, SoTheBHYT: e.target.value.toUpperCase() })}
                                                    className="w-full text-xs font-mono font-bold rounded-xl border-slate-300 py-1.5 px-2.5 uppercase"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Mức hưởng BHYT</label>
                                                <select
                                                    value={walkInForm.MucHuongBHYT}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, MucHuongBHYT: Number(e.target.value) })}
                                                    className="w-full text-xs font-bold rounded-xl border-slate-300 py-1.5 px-2.5"
                                                >
                                                    <option value={80}>80% - Học sinh, SV, LĐ phổ thông</option>
                                                    <option value={95}>95% - Hộ cận nghèo, thân nhân</option>
                                                    <option value={100}>100% - Trẻ &lt; 6t, hộ nghèo, người có công</option>
                                                    <option value={0}>0% - Khám dịch vụ theo yêu cầu</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Tuyến khám chữa bệnh</label>
                                                <select
                                                    value={walkInForm.TuyenKCB}
                                                    onChange={(e) => setWalkInForm({ ...walkInForm, TuyenKCB: e.target.value })}
                                                    className="w-full text-xs rounded-xl border-slate-300 py-1.5 px-2.5"
                                                >
                                                    <option value="DUNG_TUYEN">Đúng tuyến đăng ký</option>
                                                    <option value="TRAI_TUYEN">Trái tuyến / Chuyển viện</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        2. Chuyên khoa tiếp nhận <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={walkInForm.MaChuyenKhoa}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, MaChuyenKhoa: e.target.value, MaCaKham: '' })}
                                        className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                        required
                                    >
                                        <option value="">-- Chọn chuyên khoa khám --</option>
                                        {specialties.map((ck) => (
                                            <option key={ck.MaChuyenKhoa} value={ck.MaChuyenKhoa}>
                                                {ck.TenChuyenKhoa}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        3. Ca khám hôm nay <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={walkInForm.MaCaKham}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, MaCaKham: e.target.value })}
                                        className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                        required
                                        disabled={!walkInForm.MaChuyenKhoa}
                                    >
                                        <option value="">
                                            {!walkInForm.MaChuyenKhoa 
                                                ? '-- Vui lòng chọn chuyên khoa trước --' 
                                                : filteredShifts.length === 0 
                                                    ? '-- Không có ca khám nào mở hôm nay cho chuyên khoa này --' 
                                                    : '-- Chọn ca khám --'}
                                        </option>
                                        {filteredShifts.map((shift) => {
                                            const docName = shift.lich_lam_viec?.bac_si?.HoTen || shift.lichLamViec?.bac_si?.HoTen || 'Bác sĩ trực';
                                            return (
                                                <option key={shift.MaCaKham} value={shift.MaCaKham}>
                                                    Ca #{shift.MaCaKham}: {shift.GioBatDau?.substring(0, 5)} - {shift.GioKetThuc?.substring(0, 5)} (BS: {docName})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        4. Triệu chứng lâm sàng / Lý do đến khám
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ví dụ: Đau đầu 2 ngày, sốt nhẹ, ho có đờm..."
                                        value={walkInForm.GhiChu}
                                        onChange={(e) => setWalkInForm({ ...walkInForm, GhiChu: e.target.value })}
                                        className="w-full text-sm rounded-xl border-slate-300 focus:ring-primary focus:border-primary"
                                    />
                                </div>

                                {/* HỘP XÁC NHẬN THÔNG TIN TRƯỚC KHI CẤP SỐ (CONFIRMATION BOX) */}
                                {selectedPatient && walkInForm.MaChuyenKhoa && walkInForm.MaCaKham && (
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                                        <div className="font-bold text-slate-800 flex items-center gap-1.5 text-primary">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Xác nhận thông tin cấp số khám trực tiếp:
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                                            <div>Bệnh nhân: <strong className="text-slate-900">{selectedPatient.HoTen}</strong></div>
                                            <div>Số điện thoại: <strong className="text-slate-900">{selectedPatient.SoDienThoai}</strong></div>
                                            <div>Chuyên khoa: <strong className="text-slate-900">{specialties.find(c => c.MaChuyenKhoa === Number(walkInForm.MaChuyenKhoa))?.TenChuyenKhoa}</strong></div>
                                            <div>Phân loại: <strong className="text-purple-700">P3 - Khám trực tiếp</strong></div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowWalkInModal(false)}
                                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingWalkIn || !selectedPatient || !walkInForm.MaCaKham}
                                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                                    >
                                        {isSubmittingWalkIn ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang cấp số...
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="w-4 h-4" />
                                                Xác nhận & Cấp số phiếu P3
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Modal tiếp nhận lịch hẹn Online & Bổ sung BHYT tại quầy */}
                {intakeModalAppointment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <UserCheck className="w-5 h-5 text-primary" />
                                        Tiếp nhận Lịch hẹn & Xác minh BHYT
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Xác nhận bệnh nhân đã có mặt tại quầy và cấp số thứ tự P2 vào hàng đợi chung
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIntakeModalAppointment(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="my-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                                    <strong className="text-sm font-bold text-slate-900">
                                        {intakeModalAppointment.benh_nhan.HoTen}
                                    </strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Số điện thoại:</span>
                                    <span className="font-mono font-semibold text-slate-700">
                                        {intakeModalAppointment.benh_nhan.SoDienThoai || '---'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Bác sĩ khám:</span>
                                    <span className="font-semibold text-slate-800">
                                        {intakeModalAppointment.ca_kham?.lich_lam_viec?.bac_si?.HoTen || 'Bác sĩ chuyên khoa'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Khung giờ:</span>
                                    <span className="font-mono text-slate-700 font-bold">
                                        {intakeModalAppointment.ca_kham?.GioBatDau?.slice(0, 5)} - {intakeModalAppointment.ca_kham?.GioKetThuc?.slice(0, 5)}
                                    </span>
                                </div>
                                {intakeModalAppointment.LyDoKham && (
                                    <div className="pt-1 border-t border-blue-200/60 text-slate-600">
                                        Lý do khám: <em>"{intakeModalAppointment.LyDoKham}"</em>
                                    </div>
                                )}
                            </div>

                            {/* Form BHYT */}
                            <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={intakeBhytForm.CoBHYT}
                                            onChange={(e) => setIntakeBhytForm(prev => ({ ...prev, CoBHYT: e.target.checked }))}
                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                        />
                                        <span>Áp dụng Bảo hiểm Y tế (BHYT)</span>
                                    </label>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${intakeBhytForm.CoBHYT ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                        {intakeBhytForm.CoBHYT ? 'BHYT Đúng quy chuẩn' : 'Khám tự túc'}
                                    </span>
                                </div>

                                {intakeBhytForm.CoBHYT && (
                                    <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                Số thẻ BHYT (15 ký tự)
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={15}
                                                value={intakeBhytForm.SoTheBHYT}
                                                onChange={(e) => {
                                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                    let rate = intakeBhytForm.MucHuongBHYT;
                                                    if (val.startsWith('CC') || val.startsWith('TE')) rate = 100;
                                                    else if (val.startsWith('HT') || val.startsWith('TC') || val.startsWith('CN')) rate = 95;
                                                    else rate = 80;

                                                    setIntakeBhytForm(prev => ({
                                                        ...prev,
                                                        SoTheBHYT: val,
                                                        MucHuongBHYT: rate,
                                                    }));
                                                }}
                                                placeholder="VD: DN4010123456789"
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                    Mức hưởng
                                                </label>
                                                <select
                                                    value={intakeBhytForm.MucHuongBHYT}
                                                    onChange={(e) => setIntakeBhytForm(prev => ({ ...prev, MucHuongBHYT: Number(e.target.value) }))}
                                                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none"
                                                >
                                                    <option value={80}>80% (Chuẩn)</option>
                                                    <option value={95}>95% (Cận nghèo)</option>
                                                    <option value={100}>100% (Đặc cách)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                                    Tuyến KCB
                                                </label>
                                                <select
                                                    value={intakeBhytForm.TuyenKCB}
                                                    onChange={(e) => setIntakeBhytForm(prev => ({ ...prev, TuyenKCB: e.target.value }))}
                                                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none"
                                                >
                                                    <option value="DUNG_TUYEN">Đúng tuyến</option>
                                                    <option value="TRAI_TUYEN">Trái tuyến</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIntakeModalAppointment(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmAppointmentIntake}
                                    disabled={processingId === intakeModalAppointment.MaLichHen}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {processingId === intakeModalAppointment.MaLichHen ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tiếp nhận...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="w-4 h-4" />
                                            Xác nhận đến & Cấp số phiếu P2
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
