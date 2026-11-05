import DashboardLayout from '@/Layouts/DashboardLayout';
import { CLS_NAV_ITEMS } from '@/constants/navigation';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Eye, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface RequestItem {
    MaChiDinh: number;
    MaLuotKham: number;
    MaDichVu: number;
    MaBacSi: number;
    TrangThai: string;
    KetQua?: string;
    DonViDo?: string;
    NgayChiDinh: string;
    ThoiGianXacNhan?: string;
    dich_vu?: { MaDichVu: number; TenDichVu: string; };
    bac_si?: { MaBacSi: number; HoTen: string; HocVi?: string; };
    nhan_vien_thuc_hien?: { MaTaiKhoan: number; TenDangNhap: string; Email: string; };
    luot_kham?: { MaLuotKham: number; benh_nhan?: { MaBenhNhan: number; HoTen: string; SoDienThoai: string; } };
}

interface Props {
    auth: any;
    requests?: { data: RequestItem[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
    services?: Array<{ MaDichVu: number; TenDichVu: string; }>;
    filters?: { date?: string; service_id?: number | string | null; search?: string; per_page?: number | string | null; };
}

export default function CanLamSangResults({ auth, requests, services = [], filters = {} }: Props) {
    const [date, setDate] = useState(filters.date || '');
    const [serviceId, setServiceId] = useState(filters.service_id ? String(filters.service_id) : '');
    const [search, setSearch] = useState(filters.search || '');

    const requestList = requests?.data ?? [];
    const currentPage = requests?.current_page ?? 1;
    const lastPage = requests?.last_page ?? 1;

    const applyFilter = (next: { date?: string; service_id?: string; search?: string; page?: number; per_page?: number } = {}) => {
        router.get('/cls/results', {
            date: next.date !== undefined ? next.date : (date || undefined),
            service_id: next.service_id !== undefined ? next.service_id : (serviceId || undefined),
            search: next.search !== undefined ? next.search : (search || undefined),
            per_page: next.per_page ?? 10,
            page: next.page ?? 1,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <DashboardLayout role="cls" navItems={CLS_NAV_ITEMS} user={auth?.user} header="Kết quả CLS">
            <Head title="Kết quả CLS" />

            <div className="max-w-7xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày</label>
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
                                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ search: search }); }} className="pl-9 w-full rounded-xl border-slate-300 text-sm" placeholder="Mã BN, tên, SĐT, mã lần khám..." />
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
                                    <th className="px-4 py-3 text-left">Kết quả</th>
                                    <th className="px-4 py-3 text-left">Thực hiện</th>
                                    <th className="px-4 py-3 text-left">Thời gian</th>
                                    <th className="px-4 py-3 text-center">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requestList.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500"><AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" /> Không có kết quả CLS nào.</td></tr>
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
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-emerald-700">{item.KetQua || '---'}</div>
                                            {item.DonViDo && <div className="text-xs text-slate-500">{item.DonViDo}</div>}
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">{item.nhan_vien_thuc_hien?.TenDangNhap || '---'}</td>
                                        <td className="px-4 py-4 text-xs text-slate-500">{item.ThoiGianXacNhan ? item.ThoiGianXacNhan.substring(0,16).replace('T',' ') : item.NgayChiDinh?.substring(0,16).replace('T',' ')}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"><Eye className="w-3.5 h-3.5" /> Xem</button>
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
                            <button type="button" onClick={() => router.get('/cls/results', { page: currentPage - 1 }, { preserveState: true, preserveScroll: true })} disabled={currentPage <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Trước</button>
                            <button type="button" onClick={() => router.get('/cls/results', { page: currentPage + 1 }, { preserveState: true, preserveScroll: true })} disabled={currentPage >= lastPage} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
