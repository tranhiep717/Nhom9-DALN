import DashboardLayout from '@/Layouts/DashboardLayout';
import { CLS_NAV_ITEMS } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, Clock3, FlaskConical, Search, UserCheck } from 'lucide-react';
import { useState } from 'react';

interface Service { MaDichVu: number; TenDichVu: string; }
interface Patient { MaBenhNhan: number; HoTen: string; SoDienThoai: string; }
interface RequestItem {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    MaBacSi: number;
    TrangThai: string;
    NgayChiDinh: string;
    dich_vu?: Service;
    bac_si?: { MaBacSi: number; HoTen: string; HocVi?: string; };
    luot_kham?: { MaLuotKham: number; benh_nhan?: Patient; };
}

interface Props {
    auth: any;
    requests?: { data: RequestItem[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
    services?: Service[];
    filters?: { date?: string; service_id?: number | string | null; search?: string; per_page?: number | string | null; };
}

export default function CanLamSangPending({ auth, requests, services = [], filters = {} }: Props) {
    const [date, setDate] = useState<string>(filters.date || '');
    const [serviceId, setServiceId] = useState<string>(filters.service_id ? String(filters.service_id) : '');
    const [search, setSearch] = useState<string>(filters.search || '');
    const [perPage, setPerPage] = useState<number>(Number(filters.per_page) || 10);

    const requestList = requests?.data ?? [];
    const currentPage = requests?.current_page ?? 1;
    const lastPage = requests?.last_page ?? 1;

    const applyFilter = (next: Partial<{ date: string; service_id: string; search: string; per_page: number; page: number }> = {}) => {
        const query: any = {
            date: next.date !== undefined ? next.date : (date || undefined),
            service_id: next.service_id !== undefined ? next.service_id : (serviceId || undefined),
            search: next.search !== undefined ? next.search : (search || undefined),
            per_page: next.per_page ?? perPage,
            page: next.page ?? 1,
        };

        router.get('/cls/pending', query, { preserveState: true, preserveScroll: true });
    };

    const handlePage = (page: number) => {
        if (page < 1 || page > lastPage || page === currentPage) return;
        applyFilter({ page, per_page: perPage });
    };

    const renderStatus = (status: string) => {
        const map: Record<string, string> = {
            CHO_TIEP_NHAN: 'Chờ tiếp nhận',
            CHO_THUC_HIEN: 'Chờ thực hiện',
            DA_TIEP_NHAN: 'Đã tiếp nhận',
            DANG_THUC_HIEN: 'Đang thực hiện',
            DA_CO_KET_QUA: 'Đã có kết quả',
            HOAN_THANH: 'Hoàn thành',
            DA_HUY: 'Đã hủy',
        };
        return map[status] || status;
    };

    return (
        <DashboardLayout role="cls" navItems={CLS_NAV_ITEMS} user={auth?.user} header="Bệnh nhân chờ thực hiện CLS">
            <Head title="Bệnh nhân chờ thực hiện CLS" />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày chỉ định</label>
                            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); applyFilter({ date: e.target.value }); }} className="w-full rounded-xl border-slate-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dịch vụ</label>
                            <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); applyFilter({ service_id: e.target.value }); }} className="w-full rounded-xl border-slate-300 text-sm">
                                <option value="">Tất cả dịch vụ</option>
                                {services.map((service) => <option key={service.MaDichVu} value={service.MaDichVu}>{service.TenDichVu}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ search: e.currentTarget.value }); }} className="pl-9 w-full rounded-xl border-slate-300 text-sm" placeholder="Mã BN, tên, SĐT, mã lượt, mã chỉ định..." />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left">Mã CĐ</th>
                                    <th className="px-4 py-3 text-left">Bệnh nhân</th>
                                    <th className="px-4 py-3 text-left">Dịch vụ</th>
                                    <th className="px-4 py-3 text-left">Bác sĩ chỉ định</th>
                                    <th className="px-4 py-3 text-left">Thời gian</th>
                                    <th className="px-4 py-3 text-left">Trạng thái</th>
                                    <th className="px-4 py-3 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requestList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                            Không có chỉ định nào đang chờ thực hiện.
                                        </td>
                                    </tr>
                                ) : requestList.map((item) => (
                                    <tr key={item.MaChiDinh} className="hover:bg-slate-50">
                                        <td className="px-4 py-4 font-bold text-primary">#{item.MaChiDinh}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-900">{item.luot_kham?.benh_nhan?.HoTen || '---'}</div>
                                            <div className="text-xs text-slate-500">Mã BN: {item.luot_kham?.benh_nhan ? item.luot_kham.benh_nhan.MaBenhNhan : '---'} • {item.luot_kham?.benh_nhan?.SoDienThoai || '---'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-slate-800">{item.dich_vu?.TenDichVu || '---'}</div>
                                            <div className="text-xs text-slate-500">Mã lượt #{item.MaLuotKham}</div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">{item.bac_si?.HoTen || '---'}</td>
                                        <td className="px-4 py-4 text-xs text-slate-500">{item.NgayChiDinh ? item.NgayChiDinh.substring(0, 16).replace('T', ' ') : '---'}</td>
                                        <td className="px-4 py-4"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{renderStatus(item.TrangThai)}</span></td>
                                        <td className="px-4 py-4 text-center">
                                            <button type="button" onClick={() => router.post(`/cls/requests/${item.MaChiDinh}/receive`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"><UserCheck className="w-3.5 h-3.5" /> Tiếp nhận</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {lastPage > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex justify-between items-center text-xs text-slate-600">
                        <span>Trang {currentPage}/{lastPage}</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handlePage(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Trước</button>
                            <button type="button" onClick={() => handlePage(currentPage + 1)} disabled={currentPage >= lastPage} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
