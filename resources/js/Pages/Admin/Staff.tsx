import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import StaffTab, { StaffItem, StaffStats } from './Tabs/StaffTab';

interface AdminStaffProps {
    auth: any;
    staffs: StaffItem[];
    stats: StaffStats;
    filters: {
        search?: string;
        type?: string;
        status?: string;
        has_account?: string;
    };
}

export default function Staff({ auth, staffs = [], stats, filters = {} }: AdminStaffProps) {
    return (
        <DashboardLayout role="admin" navItems={adminNavItems} header="Quản lý Nhân sự">
            <Head title="Quản lý Nhân sự - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <StaffTab staffs={staffs} stats={stats} filters={filters} />
            </div>
        </DashboardLayout>
    );
}
