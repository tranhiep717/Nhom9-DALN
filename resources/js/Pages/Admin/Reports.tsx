import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { 
    BarChart3, 
    Calendar, 
    Printer, 
    TrendingUp, 
    CreditCard, 
    Receipt, 
    Stethoscope, 
    Users, 
    ArrowUpRight,
    DollarSign,
    Filter
} from 'lucide-react';
import { useState } from 'react';
import { adminNavItems } from './Dashboard';

interface PaymentMethodSummary {
    PhuongThucThanhToan: string;
    total: number;
    count: number;
}

interface DoctorVisitSummary {
    MaBacSi: number;
    total_visits: number;
    bacSi?: {
        HoTen: string;
        HocVi?: string;
        chuyenKhoa?: {
            TenChuyenKhoa: string;
        };
    };
}

interface ReportsProps {
    auth: any;
    reports: {
        period?: string;
        fromDate: string;
        toDate: string;
        totalRevenue: number;
        totalDebt: number;
        byMethod: PaymentMethodSummary[];
        visitsByDoctor: DoctorVisitSummary[];
        totalVisits: number;
    };
    filters: {
        period?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function AdminReports({ auth, reports, filters }: ReportsProps) {
    const [fromDate, setFromDate] = useState(filters.from_date || reports.fromDate || '');
    const [toDate, setToDate] = useState(filters.to_date || reports.toDate || '');

    const handleSelectPeriod = (period: string) => {
        router.get('/admin/reports', {
            period,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/reports', {
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
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

    const getMethodName = (m?: string) => {
        switch (m) {
            case 'TIEN_MAT': return 'Tiền mặt tại quầy';
            case 'CHUYEN_KHOAN': return 'Chuyển khoản trực tuyến';
            case 'THE': return 'Thẻ tín dụng / POS';
            default: return m || 'Khác';
        }
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Báo cáo & Thống kê"
        >
            <Head title="Báo cáo Tài chính & Vận hành - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Báo cáo Tài chính & Hiệu suất Vận hành</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Tổng hợp doanh thu thực tế từ giao dịch thành công, công nợ viện phí và phân tích năng lực khám.
                        </p>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        In báo cáo
                    </button>
                </div>

                {/* Bộ lọc khoảng ngày & Kỳ báo cáo nhanh */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase mr-1">Kỳ báo cáo:</span>
                        {[
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'month', label: 'Tháng này' },
                            { id: 'quarter', label: 'Quý này' },
                            { id: 'year', label: 'Năm nay' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectPeriod(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    reports.period === p.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end pt-2 border-t border-slate-100">
                        <div className="flex-1 w-full sm:w-auto">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex-1 w-full sm:w-auto">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shrink-0"
                        >
                            Tùy chọn ngày
                        </button>
                    </form>
                </div>

                {/* 3 Thẻ tóm tắt báo cáo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-slate-500">Doanh thu thực thu</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-emerald-600 mt-2">
                            {formatCurrency(reports.totalRevenue)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Từ {formatDate(reports.fromDate)} đến {formatDate(reports.toDate)}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-slate-500">Công nợ viện phí</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-rose-600 mt-2">
                            {formatCurrency(reports.totalDebt)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Các khoản viện phí bệnh nhân chưa thanh toán</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-slate-500">Tổng số lượt khám</span>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-indigo-600 mt-2">
                            {reports.totalVisits} lượt
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Bệnh nhân tiếp nhận tại phòng khám</p>
                    </div>
                </div>

                {/* 2 Cột Báo cáo chi tiết: Phương thức thanh toán & Năng suất Bác sĩ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Phân loại theo phương thức thanh toán */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Cơ cấu Doanh thu theo Phương thức thanh toán
                        </h3>

                        <div className="divide-y divide-slate-100">
                            {reports.byMethod && reports.byMethod.length > 0 ? (
                                reports.byMethod.map((m) => (
                                    <div key={m.PhuongThucThanhToan} className="py-3.5 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                {getMethodName(m.PhuongThucThanhToan)}
                                            </p>
                                            <p className="text-slate-400 mt-0.5">{m.count} giao dịch thành công</p>
                                        </div>
                                        <span className="font-black font-mono text-emerald-600 text-base">
                                            {formatCurrency(m.total)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-4">Chưa có giao dịch thu tiền trong khoảng thời gian này.</p>
                            )}
                        </div>
                    </div>

                    {/* Lượt khám theo Bác sĩ */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            Năng suất khám chữa bệnh theo Bác sĩ
                        </h3>

                        <div className="divide-y divide-slate-100">
                            {reports.visitsByDoctor && reports.visitsByDoctor.length > 0 ? (
                                reports.visitsByDoctor.map((d) => (
                                    <div key={d.MaBacSi} className="py-3.5 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                {d.bacSi?.HocVi ? `${d.bacSi.HocVi}. ` : 'BS. '}{d.bacSi?.HoTen || 'Bác sĩ phòng khám'}
                                            </p>
                                            <p className="text-slate-400 mt-0.5">{d.bacSi?.chuyenKhoa?.TenChuyenKhoa || 'Đa khoa'}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-teal-50 text-teal-800 font-bold rounded-xl text-sm">
                                            {d.total_visits} lượt khám
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-4">Không có dữ liệu lượt khám trong kỳ báo cáo.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mẫu in báo cáo chuẩn y tế */}
            <div id="printable-report" className="hidden print:block font-serif text-slate-900 p-10 max-w-3xl mx-auto">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * { visibility: hidden; }
                        #printable-report, #printable-report * { visibility: visible; }
                        #printable-report { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 20mm;
                            font-size: 13pt;
                        }
                    }
                ` }} />
                <div className="space-y-6">
                    <div className="text-center border-b pb-4">
                        <h2 className="text-lg font-bold uppercase">HỆ THỐNG PHÒNG KHÁM THÔNG MINH SMARTCARE</h2>
                        <h1 className="text-2xl font-black uppercase mt-3">BÁO CÁO TÀI CHÍNH & VẬN HÀNH PHÒNG KHÁM</h1>
                        <p className="text-xs italic mt-1">Từ ngày {formatDate(reports.fromDate)} đến ngày {formatDate(reports.toDate)}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b py-2">
                            <span>1. Tổng doanh thu thực thu:</span>
                            <span className="font-bold">{formatCurrency(reports.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                            <span>2. Tổng công nợ viện phí chưa thu:</span>
                            <span className="font-bold">{formatCurrency(reports.totalDebt)}</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                            <span>3. Tổng số lượt tiếp nhận khám bệnh:</span>
                            <span className="font-bold">{reports.totalVisits} lượt</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 pt-12 text-center text-xs">
                        <div>
                            <p className="font-semibold">Người lập báo cáo</p>
                            <p className="italic text-slate-400 mt-1">(Ký và ghi rõ họ tên)</p>
                            <div className="h-16"></div>
                            <p className="font-bold">{auth?.user?.TenDangNhap || 'Quản trị viên'}</p>
                        </div>
                        <div>
                            <p className="italic">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                            <p className="font-semibold mt-1">Ban Giám đốc Phòng khám</p>
                            <p className="italic text-slate-400 mt-1">(Ký, đóng dấu)</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
