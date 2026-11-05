import DashboardLayout from '@/Layouts/DashboardLayout';
import QuickAttendanceCard from '@/Components/QuickAttendanceCard';
import { DOCTOR_NAV_ITEMS } from '@/constants/navigation';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    CalendarClock, 
    CheckCircle2, 
    Clock,
    Activity,
    Stethoscope,
    ArrowRight,
    User,
} from 'lucide-react';

interface QueueItem {
    id: string;
    visitId: number;
    ticket?: string;
    stt?: number | string;
    shiftId?: number;
    name: string;
    age: number | string;
    gender?: string;
    time: string;
    status: string;
    rawStatus: string;
    reason: string;
    queueType?: string;
}

interface ActiveExamining {
    id: string;
    visitId: number;
    ticket: string;
    stt: number | string;
    shiftId?: number;
    name: string;
    age: number | string;
    gender?: string;
    time: string;
    reason: string;
    status: string;
}

interface DoctorDashboardProps {
    auth: any;
    doctor?: any;
    stats?: {
        todayAppointments: number;
        waitingPatients: number;
        inProgressVisits: number;
        completedVisits: number;
    };
    queue?: QueueItem[];
    activeExamining?: ActiveExamining | null;
}

export default function DoctorDashboard({ auth, doctor, stats, queue = [], activeExamining }: DoctorDashboardProps) {
    const statCards = [
        { 
            title: 'Lịch khám hôm nay', 
            value: stats?.todayAppointments ?? 0, 
            sub: 'Lịch hẹn đặt khám trong ngày',
            icon: CalendarClock, 
            color: 'text-primary', 
            bg: 'bg-primary-light' 
        },
        { 
            title: 'Bệnh nhân chờ khám', 
            value: stats?.waitingPatients ?? 0, 
            sub: 'Đang xếp hàng chờ vào khám',
            icon: Users, 
            color: 'text-orange-600', 
            bg: 'bg-orange-100' 
        },
        { 
            title: 'Lượt khám đang thực hiện', 
            value: stats?.inProgressVisits ?? 0, 
            sub: activeExamining ? `${activeExamining.name} (${activeExamining.ticket})` : 'Chưa có bệnh nhân',
            icon: Activity, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-100' 
        },
        { 
            title: 'Đã hoàn thành hôm nay', 
            value: stats?.completedVisits ?? 0, 
            sub: 'Hồ sơ bệnh án đã kết luận',
            icon: CheckCircle2, 
            color: 'text-teal-600', 
            bg: 'bg-teal-100' 
        },
    ];

    const doctorName = doctor?.HoTen || auth?.user?.bac_si?.HoTen || auth?.user?.TenDangNhap || 'Bác sĩ';
    const doctorCode = doctor?.MaBacSi ? `BS${String(doctor.MaBacSi).padStart(3, '0')}` : 'BS001';

    return (
        <DashboardLayout
            role="doctor"
            navItems={DOCTOR_NAV_ITEMS}
            user={{ name: doctorName, code: doctorCode }}
            header="Bàn làm việc Bác sĩ"
        >
            <Head title="Doctor Dashboard - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 0. Chấm công nhanh ca trực hôm nay */}
                <QuickAttendanceCard
                    rolePrefix="doctor"
                    todaySchedule={auth?.todaySchedule}
                    todayAttendance={auth?.todayAttendance}
                />

                {/* 1. Thẻ thống kê tổng quan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                                    <p className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 font-medium truncate">
                                {stat.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 2. Ca khám đang thực hiện (Nếu có - tách biệt rõ khỏi hàng chờ) */}
                {activeExamining && (
                    <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-white rounded-2xl border border-sky-200 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                                            Đang khám tại phòng
                                        </span>
                                        <span className="font-mono font-bold text-sm text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {activeExamining.ticket}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            STT: {activeExamining.stt}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mt-1">
                                        {activeExamining.name} <span className="text-sm font-normal text-gray-500">({activeExamining.gender}{activeExamining.age !== 'N/A' ? `, ${activeExamining.age} tuổi` : ''})</span>
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        <span className="font-semibold text-gray-700">Lý do/Triệu chứng:</span> {activeExamining.reason} &bull; <span className="font-semibold text-gray-700">Giờ vào khám:</span> {activeExamining.time}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <Link
                                    href={`/doctor/examine?visit_id=${activeExamining.visitId}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow"
                                >
                                    <span>Tiếp tục khám bệnh</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Bảng hàng chờ khám bệnh hôm nay (Tuân thủ FIFO ThoiGianVaoHang) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hàng chờ khám bệnh hôm nay ({queue.length} bệnh nhân)</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Thứ tự hàng đợi tuân thủ nguyên tắc FIFO theo thời gian tiếp nhận vào hàng (ThoiGianVaoHang tăng dần)</p>
                        </div>
                        <Link href="/doctor/examine" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-bold text-sm bg-primary-light/60 px-3.5 py-1.5 rounded-xl transition-colors">
                            <span>Vào phòng khám</span>
                            <span>→</span>
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Thời gian vào hàng</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Số phiếu & STT</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Mã BN</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Họ và tên</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tuổi</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Phân loại</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Triệu chứng / Lý do</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {queue.length > 0 ? (
                                    queue.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="font-mono font-semibold">{item.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-xs text-primary bg-primary-light/40 px-2 py-0.5 rounded w-fit">
                                                        {item.ticket || `#${item.visitId}`}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                        STT: {item.stt}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.id}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.age !== 'N/A' ? `${item.age} tuổi` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                                    item.queueType?.includes('P2')
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : item.queueType?.includes('P3')
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                    {item.queueType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{item.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    item.rawStatus === 'CHO_KHAM_LAI'
                                                        ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-400 font-bold'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/doctor/examine?visit_id=${item.visitId}`} 
                                                    className="inline-flex items-center justify-center px-3.5 py-1.5 border border-transparent text-xs font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-sm transition-all"
                                                >
                                                    Khám ngay
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="w-8 h-8 text-slate-300" />
                                                <p className="font-medium text-slate-600">Hiện không có bệnh nhân nào đang chờ khám</p>
                                                <p className="text-xs text-slate-400">Khi lễ tân tiếp nhận bệnh nhân vào hàng đợi, danh sách sẽ tự động cập nhật</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
