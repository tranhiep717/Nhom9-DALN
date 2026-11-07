import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import ClsMonitorTab, { ClsMonitorTabProps } from './Tabs/ClsMonitorTab';

export default function ClsMonitor(props: any) {
    return (
        <DashboardLayout role="admin" navItems={adminNavItems} header="Giám sát Cận lâm sàng">
            <Head title="Giám sát Cận lâm sàng - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <ClsMonitorTab {...props} />
            </div>
        </DashboardLayout>
    );
}
