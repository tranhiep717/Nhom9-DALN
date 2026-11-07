import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { HeartPulse, Building2, Pill, Sparkles } from 'lucide-react';
import { adminNavItems } from '@/constants/navigation';

import SpecialtiesTab, { SpecialtyData } from './Tabs/SpecialtiesTab';
import ServicesTab, { ServiceItem } from './Tabs/ServicesTab';
import MedicinesTab, { MedicineItem } from './Tabs/MedicinesTab';

interface MedicalCatalogsProps {
    auth: any;
    specialties: SpecialtyData[];
    services: ServiceItem[];
    medicines: MedicineItem[];
    initialTab?: string;
    filters?: any;
}

export default function MedicalCatalogs({
    auth,
    specialties = [],
    services = [],
    medicines = [],
    initialTab = 'specialties',
    filters = {},
}: MedicalCatalogsProps) {
    const [activeTab, setActiveTab] = useState<'specialties' | 'services' | 'medicines'>(
        (initialTab as any) || 'specialties'
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['specialties', 'services', 'medicines'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        }
    }, []);

    const handleSwitchTab = (tab: 'specialties' | 'services' | 'medicines') => {
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
            header="Quản lý Danh mục Y tế"
        >
            <Head title="Quản lý Danh mục Y tế - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner & Tab Switcher */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                Trung tâm Cấu hình Danh mục Khám chữa bệnh
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Quản lý Danh mục Y tế Toàn diện</h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Quản lý tập trung Chuyên khoa, Bảng giá Dịch vụ kỹ thuật và Kho Thuốc tân dược tại một giao diện duy nhất.
                            </p>
                        </div>
                    </div>

                    {/* Thanh Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
                        <button
                            onClick={() => handleSwitchTab('specialties')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'specialties'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <HeartPulse className={`w-4 h-4 ${activeTab === 'specialties' ? 'text-rose-500' : 'text-slate-300'}`} />
                            <span>1. Chuyên khoa</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'specialties' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {specialties.length}
                            </span>
                        </button>

                        <button
                            onClick={() => handleSwitchTab('services')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'services'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <Building2 className={`w-4 h-4 ${activeTab === 'services' ? 'text-indigo-600' : 'text-slate-300'}`} />
                            <span>2. Dịch vụ y tế</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'services' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {services.length}
                            </span>
                        </button>

                        <button
                            onClick={() => handleSwitchTab('medicines')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'medicines'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <Pill className={`w-4 h-4 ${activeTab === 'medicines' ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>3. Kho thuốc tân dược</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'medicines' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {medicines.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Nội dung Tab tương ứng */}
                <div className="transition-all duration-200">
                    {activeTab === 'specialties' && (
                        <SpecialtiesTab specialties={specialties} filters={filters?.specialties} />
                    )}

                    {activeTab === 'services' && (
                        <ServicesTab services={services} filters={filters?.services} />
                    )}

                    {activeTab === 'medicines' && (
                        <MedicinesTab medicines={medicines} filters={filters?.medicines} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
