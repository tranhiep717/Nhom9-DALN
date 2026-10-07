import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Calendar,
    LayoutDashboard,
    UserCircle,
    Activity,
    ClipboardPen,
    Stethoscope,
    Save,
    Pill
} from 'lucide-react';

export default function DoctorExamine({ auth }: any) {
    const navItems = [
        { name: 'Tổng quan', href: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'Lịch làm việc', href: '/doctor/schedule', icon: Calendar },
        { name: 'Khám bệnh', href: '/doctor/examine', icon: Stethoscope },
        { name: 'Bệnh nhân của tôi', href: '/doctor/patients', icon: UserCircle },
        { name: 'Thống kê', href: '/doctor/stats', icon: Activity },
    ];

    return (
        <DashboardLayout
            role="doctor"
            navItems={navItems}
            user={auth?.user}
            header="Khám bệnh"
        >
            <Head title="Examine - Doctor" />

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                {/* Left side: Patient info & History */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-primary text-white flex justify-between items-center">
                            <h3 className="font-bold">Thông tin bệnh nhân</h3>
                            <span className="bg-white/20 px-2 py-1 rounded text-xs">BN01</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <div className="w-14 h-14 bg-blue-100 text-primary font-bold text-xl rounded-full flex items-center justify-center">
                                    D
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Trần Văn D</h4>
                                    <p className="text-sm text-gray-500">Nam, 45 tuổi</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 pt-2">
                                <div className="flex justify-between"><span className="font-medium">Chiều cao:</span> <span>170 cm</span></div>
                                <div className="flex justify-between"><span className="font-medium">Cân nặng:</span> <span>68 kg</span></div>
                                <div className="flex justify-between"><span className="font-medium">Nhóm máu:</span> <span>O+</span></div>
                                <div className="flex justify-between"><span className="font-medium">Dị ứng:</span> <span className="text-red-500">Hải sản</span></div>
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <span className="font-medium text-orange-800 text-xs uppercase mb-1 block">Lý do khám</span>
                                    <span className="text-gray-800">Bệnh nhân kêu đau tức ngực trái kéo dài 2 ngày, kèm khó thở nhẹ.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Lịch sử khám gần đây</h3>
                        <div className="space-y-4">
                            <div className="pl-4 border-l-2 border-primary relative">
                                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                                <p className="text-xs font-bold text-gray-500 mb-1">10/05/2026</p>
                                <p className="text-sm font-medium text-gray-900">Kiểm tra huyết áp định kỳ</p>
                                <p className="text-sm text-gray-600 mt-1">Kết luận: Huyết áp ổn định.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Examination Form */}
                <div className="w-full lg:w-2/3 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-darkblue border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                            <ClipboardPen className="w-6 h-6 text-primary" /> Hồ sơ khám bệnh
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Triệu chứng lâm sàng</label>
                                <textarea rows={3} className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm" defaultValue="Đau ngực trái, mệt mỏi"></textarea>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chẩn đoán</label>
                                <textarea rows={2} className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm"></textarea>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2"><Pill className="w-5 h-5 text-teal-600" /> Kê đơn thuốc</h4>
                                    <button className="text-sm text-primary font-medium hover:underline">+ Thêm thuốc</button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                                        <div className="col-span-5"><input type="text" placeholder="Tên thuốc..." className="w-full text-sm rounded border-gray-300" defaultValue="Paracetamol 500mg" /></div>
                                        <div className="col-span-2"><input type="number" placeholder="SL" className="w-full text-sm rounded border-gray-300" defaultValue="10" /></div>
                                        <div className="col-span-4"><input type="text" placeholder="Cách dùng" className="w-full text-sm rounded border-gray-300" defaultValue="Ngày 2 viên, sau ăn" /></div>
                                        <div className="col-span-1 text-center"><button className="text-red-500 font-bold">X</button></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lời dặn của bác sĩ</label>
                                <textarea rows={2} className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm"></textarea>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                            <button className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Lưu nháp</button>
                            <button className="px-8 py-2.5 bg-primary rounded-xl text-white font-bold hover:bg-primary-hover flex items-center shadow-md">
                                Hoàn tất khám <Save className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
