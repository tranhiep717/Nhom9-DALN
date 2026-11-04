import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    ShieldCheck, 
    Save, 
    CheckCircle2, 
    AlertCircle,
    UserCheck,
    CreditCard,
    Key
} from 'lucide-react';
import { useState } from 'react';
import { patientNavItems } from './Dashboard';

interface PatientProfileProps {
    auth: any;
    benhNhan: {
        MaBenhNhan: number;
        HoTen: string;
        NgaySinh?: string;
        GioiTinh?: string;
        SoDienThoai?: string;
        DiaChi?: string;
        EmailLienHe?: string;
    };
    account: {
        MaTaiKhoan: number;
        TenDangNhap: string;
        Email: string;
        TrangThai: string;
        VaiTro?: string;
    };
}

export default function Profile({ auth, benhNhan, account }: PatientProfileProps) {
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        HoTen: benhNhan?.HoTen || '',
        NgaySinh: benhNhan?.NgaySinh ? benhNhan.NgaySinh.split('T')[0] : '',
        GioiTinh: benhNhan?.GioiTinh || 'Nam',
        SoDienThoai: benhNhan?.SoDienThoai || '',
        DiaChi: benhNhan?.DiaChi || '',
        EmailLienHe: benhNhan?.EmailLienHe || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFlashMessage(null);

        put('/patient/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setFlashMessage({
                    type: 'success',
                    text: 'Cập nhật thông tin hồ sơ bệnh nhân thành công!',
                });
            },
            onError: (err) => {
                const firstErr = Object.values(err)[0] as string;
                setFlashMessage({
                    type: 'error',
                    text: firstErr || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.',
                });
            },
        });
    };

    const patientName = benhNhan?.HoTen || auth?.user?.TenDangNhap || 'Bệnh nhân';
    const patientCode = benhNhan?.MaBenhNhan ? `BN${String(benhNhan.MaBenhNhan).padStart(6, '0')}` : 'BN000000';

    return (
        <DashboardLayout
            role="patient"
            navItems={patientNavItems}
            user={{ name: patientName, code: patientCode }}
            header="Hồ sơ cá nhân"
        >
            <Head title="Hồ sơ cá nhân - SmartCare" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hồ sơ thông tin bệnh nhân</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Quản lý và cập nhật thông tin liên hệ, hành chính để phòng khám tiếp nhận và liên lạc chính xác.
                    </p>
                </div>

                {flashMessage && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                        flashMessage.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        {flashMessage.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{flashMessage.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cột trái: Thẻ tóm tắt tài khoản */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
                            <div className="w-20 h-20 mx-auto rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-black mb-3 border-4 border-teal-50">
                                {patientName.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="font-bold text-slate-900 text-lg">{patientName}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{patientCode}</p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left">
                                <div className="text-xs">
                                    <span className="text-slate-400 block">Tài khoản liên kết:</span>
                                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                        <Key className="w-3.5 h-3.5 text-slate-400" />
                                        {account?.TenDangNhap}
                                    </span>
                                </div>
                                <div className="text-xs">
                                    <span className="text-slate-400 block">Email tài khoản:</span>
                                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {account?.Email}
                                    </span>
                                </div>
                                <div className="text-xs">
                                    <span className="text-slate-400 block">Trạng thái:</span>
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-0.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        {account?.TrangThai === 'HOAT_DONG' ? 'Đang hoạt động' : account?.TrangThai}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl border border-amber-200/70 p-4 text-xs text-amber-900 space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                Lưu ý bảo mật
                            </div>
                            <p className="leading-relaxed">
                                Mã hồ sơ y tế ({patientCode}) và tên tài khoản được liên kết cố định để đảm bảo tính toàn vẹn của hồ sơ bệnh án và lịch sử điều trị.
                            </p>
                        </div>
                    </div>

                    {/* Cột phải: Form cập nhật thông tin */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-teal-600" />
                                Thông tin cá nhân
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={data.HoTen}
                                            onChange={(e) => setData('HoTen', e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                                                errors.HoTen ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-teal-500'
                                            }`}
                                        />
                                    </div>
                                    {errors.HoTen && <p className="text-xs text-rose-600 mt-1">{errors.HoTen}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Ngày sinh
                                        </label>
                                        <div className="relative">
                                            <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                value={data.NgaySinh}
                                                onChange={(e) => setData('NgaySinh', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                                                    errors.NgaySinh ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-teal-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.NgaySinh && <p className="text-xs text-rose-600 mt-1">{errors.NgaySinh}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Giới tính
                                        </label>
                                        <select
                                            value={data.GioiTinh}
                                            onChange={(e) => setData('GioiTinh', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none bg-white"
                                        >
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                        {errors.GioiTinh && <p className="text-xs text-rose-600 mt-1">{errors.GioiTinh}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="tel"
                                                value={data.SoDienThoai}
                                                onChange={(e) => setData('SoDienThoai', e.target.value)}
                                                placeholder="0912345678"
                                                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                                                    errors.SoDienThoai ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-teal-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.SoDienThoai && <p className="text-xs text-rose-600 mt-1">{errors.SoDienThoai}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Email liên hệ
                                        </label>
                                        <div className="relative">
                                            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="email"
                                                value={data.EmailLienHe}
                                                onChange={(e) => setData('EmailLienHe', e.target.value)}
                                                placeholder="patient@example.com"
                                                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                                                    errors.EmailLienHe ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-teal-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.EmailLienHe && <p className="text-xs text-rose-600 mt-1">{errors.EmailLienHe}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Địa chỉ thường trú
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                                        <textarea
                                            rows={2}
                                            value={data.DiaChi}
                                            onChange={(e) => setData('DiaChi', e.target.value)}
                                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                                                errors.DiaChi ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-teal-500'
                                            }`}
                                        />
                                    </div>
                                    {errors.DiaChi && <p className="text-xs text-rose-600 mt-1">{errors.DiaChi}</p>}
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                                    >
                                        <Save className="w-4 h-4" />
                                        {processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
