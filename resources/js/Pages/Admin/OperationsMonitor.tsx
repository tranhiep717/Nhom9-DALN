import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CalendarClock, FlaskConical, Sparkles, Activity } from 'lucide-react';
import { adminNavItems } from '@/constants/navigation';

import ReceptionAnalyticsTab, { ReceptionAnalyticsTabProps } from './Tabs/ReceptionAnalyticsTab';
import ClsMonitorTab, { ClsMonitorTabProps } from './Tabs/ClsMonitorTab';

interface OperationsMonitorProps {
    auth: any;
    reception: ReceptionAnalyticsTabProps;
    cls: ClsMonitorTabProps;
    initialTab?: string;
}

export default function OperationsMonitor({
    auth,
    reception,
    cls,
    initialTab = 'reception',
}: OperationsMonitorProps) {
    const [activeTab, setActiveTab] = useState<'reception' | 'cls'>(
        (initialTab as any) || 'reception'
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['reception', 'cls'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        }
    }, []);

    const handleSwitchTab = (tab: 'reception' | 'cls') => {
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
            header="Giám sát Vận hành Toàn viện"
        >
            <Head title="Giám sát Vận hành Toàn viện - SmartCare Admin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner & Tab Switcher */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                Trung tâm Điều hành & Giám sát Vận hành Thời gian thực
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Giám sát Vận hành Toàn viện</h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Bao quát toàn bộ luồng tiếp đón bệnh nhân, lưu lượng hàng chờ khám và tiến độ thực hiện cận lâm sàng, xét nghiệm.
                            </p>
                        </div>
                    </div>

                    {/* Thanh Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
                        <button
                            onClick={() => handleSwitchTab('reception')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'reception'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <CalendarClock className={`w-4 h-4 ${activeTab === 'reception' ? 'text-indigo-600' : 'text-slate-300'}`} />
                            <span>1. Tiếp đón & Hàng chờ khám</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'reception' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {reception?.kpi?.totalVisits || 0} ca
                            </span>
                        </button>

                        <button
                            onClick={() => handleSwitchTab('cls')}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === 'cls'
                                    ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                            }`}
                        >
                            <FlaskConical className={`w-4 h-4 ${activeTab === 'cls' ? 'text-purple-600' : 'text-slate-300'}`} />
                            <span>2. Tiến độ Cận lâm sàng & Xét nghiệm</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                activeTab === 'cls' ? 'bg-indigo-100 text-indigo-900' : 'bg-black/30 text-white'
                            }`}>
                                {cls?.stats?.total || 0} mẫu
                            </span>
                        </button>
                    </div>
                </div>

                {/* Nội dung Tab tương ứng */}
                <div className="transition-all duration-200">
                    {activeTab === 'reception' && reception && (
                        <ReceptionAnalyticsTab {...reception} />
                    )}

                    {activeTab === 'cls' && cls && (
                        <ClsMonitorTab {...cls} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
