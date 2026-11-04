import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    Pill, 
    Printer, 
    Search, 
    Calendar, 
    User, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    FileText,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { patientNavItems } from './Dashboard';

interface ChiTietThuoc {
    MaChiTiet: number;
    MaThuoc: number;
    SoLuong: number;
    DonGia: number;
    ThanhTien?: number;
    CachDung?: string;
    thuoc?: {
        MaThuoc: number;
        TenThuoc: string;
        DonViTinh?: string;
        DangBaoChe?: string;
    };
}

interface DonThuocItem {
    MaDonThuoc: number;
    MaLuotKham: number;
    MaBacSi: number;
    NgayKeDon: string;
    TrangThai: string;
    GhiChu?: string;
    TongTienThuoc?: number;
    bacSi?: {
        MaBacSi: number;
        HoTen: string;
        HocVi?: string;
    };
    luotKham?: {
        MaLuotKham: number;
        ThoiGianTiepNhan: string;
        TrangThai: string;
        benhNhan?: {
            HoTen: string;
            SoDienThoai?: string;
            NgaySinh?: string;
            GioiTinh?: string;
        };
    };
    chiTietDonThuocs?: ChiTietThuoc[];
}

interface PrescriptionsProps {
    auth: any;
    prescriptions: DonThuocItem[];
}

export default function Prescriptions({ auth, prescriptions = [] }: PrescriptionsProps) {
    const [search, setSearch] = useState('');
    const [selectedPrintDon, setSelectedPrintDon] = useState<DonThuocItem | null>(null);

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

    const handlePrint = (don: DonThuocItem) => {
        setSelectedPrintDon(don);
        setTimeout(() => {
            window.print();
        }, 200);
    };

    // Lọc theo từ khóa tên thuốc
    const filteredPrescriptions = prescriptions.filter((don) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const hasMed = don.chiTietDonThuocs?.some((ct) =>
            ct.thuoc?.TenThuoc?.toLowerCase().includes(q)
        );
        const hasDoc = don.bacSi?.HoTen?.toLowerCase().includes(q);
        const hasCode = String(don.MaDonThuoc).includes(q);
        return hasMed || hasDoc || hasCode;
    });

    const patientName = auth?.user?.benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = auth?.user?.benhNhan?.MaBenhNhan ? `BN${String(auth.user.benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Đơn thuốc của tôi"
        >
            <Head title="Đơn thuốc của tôi - SmartCare" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Danh sách đơn thuốc điều trị</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Tra cứu chi tiết liều lượng, cách dùng và in đơn thuốc bác sĩ đã kê toa.
                        </p>
                    </div>

                    <div className="w-full sm:w-72">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên thuốc, mã đơn..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Danh sách các đơn thuốc */}
                {filteredPrescriptions.length > 0 ? (
                    <div className="space-y-6">
                        {filteredPrescriptions.map((don) => {
                            const doc = don.bacSi;
                            const items = don.chiTietDonThuocs || [];
                            const totalAmount = don.TongTienThuoc ?? items.reduce((acc, curr) => acc + (curr.ThanhTien || (curr.SoLuong * curr.DonGia)), 0);

                            return (
                                <div
                                    key={don.MaDonThuoc}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                                >
                                    {/* Header đơn thuốc */}
                                    <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold font-mono">
                                                    ĐƠN THUỐC #{don.MaDonThuoc}
                                                </span>
                                                <span className="text-xs text-teal-200">
                                                    Ngày kê: {formatDate(don.NgayKeDon)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-teal-50 flex items-center gap-2 pt-1">
                                                <User className="w-4 h-4 text-teal-300" />
                                                Bác sĩ kê đơn: {doc?.HocVi ? `${doc.HocVi}. ` : 'BS. '}{doc?.HoTen || 'Bác sĩ phụ trách'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <span className="text-xs text-teal-200 block">Tổng tiền thuốc</span>
                                                <span className="text-lg font-black text-white">{formatCurrency(totalAmount)}</span>
                                            </div>
                                            <button
                                                onClick={() => handlePrint(don)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold rounded-xl text-xs transition-colors shadow-sm"
                                            >
                                                <Printer className="w-4 h-4 text-teal-700" />
                                                In đơn thuốc
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bảng chi tiết thuốc */}
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">STT</th>
                                                        <th className="px-4 py-3 font-semibold">Tên thuốc / Quy cách</th>
                                                        <th className="px-4 py-3 font-semibold text-center">Số lượng</th>
                                                        <th className="px-4 py-3 font-semibold text-right">Đơn giá</th>
                                                        <th className="px-4 py-3 font-semibold text-right">Thành tiền</th>
                                                        <th className="px-4 py-3 font-semibold">Cách dùng / Liều lượng</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs">
                                                    {items.map((item, idx) => (
                                                        <tr key={item.MaChiTiet} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="font-bold text-slate-900 block text-sm">
                                                                    {item.thuoc?.TenThuoc || 'Tên thuốc'}
                                                                </span>
                                                                {item.thuoc?.DangBaoChe && (
                                                                    <span className="text-slate-400">
                                                                        Dạng: {item.thuoc.DangBaoChe}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold text-teal-700">
                                                                {item.SoLuong} {item.thuoc?.DonViTinh || 'viên'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-600 font-mono">
                                                                {formatCurrency(item.DonGia)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                                                                {formatCurrency(item.ThanhTien || (item.SoLuong * item.DonGia))}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-700 font-medium">
                                                                {item.CachDung || 'Uống theo hướng dẫn của bác sĩ'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {don.GhiChu && (
                                            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                                                <span className="font-bold">Ghi chú của bác sĩ:</span> {don.GhiChu}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                            <Pill className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Không có đơn thuốc nào</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Bạn chưa có đơn thuốc nào được kê hoặc từ khóa tìm kiếm không khớp với tên thuốc nào.
                        </p>
                    </div>
                )}
            </div>

            {/* MẪU IN ĐƠN THUỐC CHUẨN Y TẾ KHI GỌI WINDOW.PRINT */}
            <div id="printable-prescription" className="hidden print:block font-serif text-slate-900 p-8 max-w-2xl mx-auto">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * { visibility: hidden; }
                        #printable-prescription, #printable-prescription * { visibility: visible; }
                        #printable-prescription { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 20mm;
                            font-size: 13pt;
                            line-height: 1.5;
                        }
                    }
                ` }} />
                {selectedPrintDon && (
                    <div className="space-y-6">
                        <div className="text-center border-b pb-4">
                            <h2 className="text-xl font-bold uppercase tracking-wider">HỆ THỐNG PHÒNG KHÁM THÔNG MINH SMARTCARE</h2>
                            <p className="text-xs italic mt-1">Địa chỉ: 123 Đường Sức Khỏe, Quận Y Tế, TP. Hồ Chí Minh - Hotline: 1900 8888</p>
                            <h1 className="text-2xl font-black uppercase mt-4">ĐƠN THUỐC ĐIỀU TRỊ</h1>
                            <p className="text-xs font-mono">Mã đơn: #{selectedPrintDon.MaDonThuoc} • Ngày kê: {formatDate(selectedPrintDon.NgayKeDon)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                            <div><span className="font-semibold">Họ và tên bệnh nhân:</span> {patientName}</div>
                            <div><span className="font-semibold">Mã bệnh nhân:</span> {patientCode}</div>
                            <div><span className="font-semibold">Bác sĩ kê đơn:</span> {selectedPrintDon.bacSi?.HoTen || 'Bác sĩ phụ trách'}</div>
                            <div><span className="font-semibold">Mã lượt khám:</span> #{selectedPrintDon.MaLuotKham}</div>
                        </div>

                        <div>
                            <h3 className="font-bold text-sm uppercase mb-3">Chỉ định dùng thuốc:</h3>
                            <ol className="list-decimal pl-5 space-y-3 text-sm">
                                {selectedPrintDon.chiTietDonThuocs?.map((ct, idx) => (
                                    <li key={ct.MaChiTiet} className="pl-1">
                                        <div className="flex justify-between font-bold">
                                            <span>{ct.thuoc?.TenThuoc} {ct.thuoc?.DangBaoChe ? `(${ct.thuoc.DangBaoChe})` : ''}</span>
                                            <span>Số lượng: {ct.SoLuong} {ct.thuoc?.DonViTinh || 'viên'}</span>
                                        </div>
                                        <p className="text-xs italic text-slate-700">Cách dùng: {ct.CachDung || 'Theo hướng dẫn'}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {selectedPrintDon.GhiChu && (
                            <div className="border-t pt-3 text-xs italic">
                                <span className="font-bold not-italic">Lời dặn:</span> {selectedPrintDon.GhiChu}
                            </div>
                        )}

                        <div className="grid grid-cols-2 pt-8 text-center text-xs">
                            <div>
                                <p className="font-semibold">Bệnh nhân / Người nhà</p>
                                <p className="italic text-slate-400 mt-1">(Ký và ghi rõ họ tên)</p>
                            </div>
                            <div>
                                <p className="italic">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                                <p className="font-semibold mt-1">Bác sĩ điều trị</p>
                                <p className="italic text-slate-400 mt-1">(Ký, đóng dấu và ghi rõ họ tên)</p>
                                <div className="h-16"></div>
                                <p className="font-bold">{selectedPrintDon.bacSi?.HocVi ? `${selectedPrintDon.bacSi.HocVi}. ` : 'BS. '}{selectedPrintDon.bacSi?.HoTen}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
