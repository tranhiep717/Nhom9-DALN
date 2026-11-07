import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Stethoscope, Users, Sparkles, UserCheck } from 'lucide-react';
import { adminNavItems } from '@/constants/navigation';

import DoctorsTab, { DoctorItem, SpecialtyItem } from './Tabs/DoctorsTab';
import StaffTab, { StaffItem, StaffStats } from './Tabs/StaffTab';

interface StaffManagementProps {
    auth: any;
    doctors: DoctorItem[];
    chuyenKhoas: SpecialtyItem[];
    staffs: StaffItem[];
    stats?: StaffStats;
    initialTab?: string;
    filters?: any;
}

export default function StaffManagement({
    auth,
    doctors = [],
    chuyenKhoas = [],
    staffs = [],
    stats,
    initialTab = 'doctors',
    filters = {},
}: StaffManagementProps) {
    const [activeTab, setActiveTab] = useState<'doctors' | 'staffs'>(
        (initialTab as any) || 'doctors'
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['doctors', 'staffs'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        }
    }, []);

    const handleSwitchTab = (tab: 'doctors' | 'staffs') => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Nhân sự Toàn viện"
        >
            <Head title="Quản lý Nhân sự - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner & Tab Switcher */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                Phân hệ Quản trị Nhân sự & Cán bộ Toàn diện (HRM)
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Nhân sự & Đội ngũ Cán bộ</h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Quản lý tập trung Đội ngũ Bác sĩ chuyên khoa, Nhân viên Lễ tân, Kỹ thuật viên Cận lâm sàng và Dược sĩ.
                            </p>
                        </div>
                    </div>

                    {/* Thanh Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
                        <button
                            onClick={() => handleSwitchTab('doctors')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'doctors'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <Stethoscope className={`w-4 h-4 ${activeTab === 'doctors' ? 'text-indigo-600' : 'text-slate-300'}`} />
                            <span>1. Đội ngũ Bác sĩ</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'doctors' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {doctors.length}
                            </span>
                        </button>

                        <button
                            onClick={() => handleSwitchTab('staffs')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'staffs'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <UserCheck className={`w-4 h-4 ${activeTab === 'staffs' ? 'text-amber-500' : 'text-slate-300'}`} />
                            <span>2. Nhân sự & Hành chính</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'staffs' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {staffs.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Nội dung Tab tương ứng */}
                <div className="transition-all duration-200">
                    {activeTab === 'doctors' && (
                        <DoctorsTab doctors={doctors} chuyenKhoas={chuyenKhoas} filters={filters?.doctors} />
                    )}

                    {activeTab === 'staffs' && (
                        <StaffTab staffs={staffs} stats={stats} filters={filters?.staffs} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
