import DashboardLayout from '@/Layouts/DashboardLayout';
import { CLS_NAV_ITEMS } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import { Activity, AlertCircle, Clock, Eye, Play, Search } from 'lucide-react';
import { useState } from 'react';

interface RequestItem {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    MaBacSi: number;
    TrangThai: string;
    NgayChiDinh: string;
    NgayThucHien?: string;
    dich_vu?: { MaDichVu: number; TenDichVu: string; };
    bac_si?: { MaBacSi: number; HoTen: string; HocVi?: string; };
    luot_kham?: { MaLuotKham: number; benh_nhan?: { MaBenhNhan: number; HoTen: string; SoDienThoai: string; } };
}

interface Props {
    auth: any;
    requests?: { data: RequestItem[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
    services?: Array<{ MaDichVu: number; TenDichVu: string; }>;
    filters?: { date?: string; service_id?: number | string | null; search?: string; per_page?: number | string | null; };
}

export default function CanLamSangProcessing({ auth, requests, services = [], filters = {} }: Props) {
    const [date, setDate] = useState(filters.date || '');
    const [serviceId, setServiceId] = useState(filters.service_id ? String(filters.service_id) : '');
    const [search, setSearch] = useState(filters.search || '');

    const applyFilter = (next: { date?: string; service_id?: string; search?: string; page?: number; per_page?: number } = {}) => {
        router.get('/cls/processing', {
            date: next.date !== undefined ? next.date : (date || undefined),
            service_id: next.service_id !== undefined ? next.service_id : (serviceId || undefined),
            search: next.search !== undefined ? next.search : (search || undefined),
            per_page: next.per_page ?? 10,
            page: next.page ?? 1,
        }, { preserveState: true, preserveScroll: true });
    };

    const requestList = requests?.data ?? [];
    const currentPage = requests?.current_page ?? 1;
    const lastPage = requests?.last_page ?? 1;

    return (
        <DashboardLayout role="cls" navItems={CLS_NAV_ITEMS} user={auth?.user} header="Đang thực hiện CLS">
            <Head title="Đang thực hiện CLS" />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày chỉ định</label>
                            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); applyFilter({ date: e.target.value }); }} className="w-full rounded-xl border-slate-300 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dịch vụ</label>
                            <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); applyFilter({ service_id: e.target.value }); }} className="w-full rounded-xl border-slate-300 text-sm">
                                <option value="">Tất cả dịch vụ</option>
                                {services.map((svc) => <option key={svc.MaDichVu} value={svc.MaDichVu}>{svc.TenDichVu}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ search: search }); }} className="pl-9 w-full rounded-xl border-slate-300 text-sm" placeholder="Mã BN, tên, SĐT, mã lượt..." />
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
                                    <th className="px-4 py-3 text-left">Thời gian bắt đầu</th>
                                    <th className="px-4 py-3 text-left">Tình trạng</th>
                                    <th className="px-4 py-3 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requestList.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" /> Không có chỉ định đang thực hiện.</td></tr>
                                ) : requestList.map((item) => (
                                    <tr key={item.MaChiDinh} className="hover:bg-slate-50">
                                        <td className="px-4 py-4 font-bold text-primary">#{item.MaChiDinh}</td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-900">{item.luot_kham?.benh_nhan?.HoTen || '---'}</div>
                                            <div className="text-xs text-slate-500">{item.luot_kham?.benh_nhan?.SoDienThoai || '---'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-slate-800">{item.dich_vu?.TenDichVu || '---'}</div>
                                            <div className="text-xs text-slate-500">Mã lượt #{item.MaLuotKham}</div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-500">{item.NgayThucHien ? item.NgayThucHien.substring(0,16).replace('T',' ') : '---'}</td>
                                        <td className="px-4 py-4"><span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">{item.TrangThai}</span></td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button type="button" onClick={() => router.post(`/cls/requests/${item.MaChiDinh}/start`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"><Play className="w-3.5 h-3.5" /> Tiếp tục</button>
                                                <button type="button" onClick={() => router.post(`/cls/requests/${item.MaChiDinh}/result`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"><Eye className="w-3.5 h-3.5" /> Kết quả</button>
                                            </div>
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
                            <button type="button" onClick={() => router.get('/cls/processing', { page: currentPage - 1 }, { preserveState: true, preserveScroll: true })} disabled={currentPage <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Trước</button>
                            <button type="button" onClick={() => router.get('/cls/processing', { page: currentPage + 1 }, { preserveState: true, preserveScroll: true })} disabled={currentPage >= lastPage} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
