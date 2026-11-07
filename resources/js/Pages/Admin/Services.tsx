import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import ServicesTab, { ServiceItem } from './Tabs/ServicesTab';

interface ServicesProps {
    auth: any;
    services: ServiceItem[];
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function AdminServices({ auth, services = [], filters = {} }: ServicesProps) {
    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Dịch vụ"
        >
            <Head title="Quản lý Dịch vụ y tế - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <ServicesTab services={services} filters={filters} />
            </div>
        </DashboardLayout>
    );
}
