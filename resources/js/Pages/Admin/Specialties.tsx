import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import SpecialtiesTab, { SpecialtyData } from './Tabs/SpecialtiesTab';

interface SpecialtiesProps {
    auth: any;
    specialties: SpecialtyData[];
    filters: {
        search?: string;
        status?: string;
    };
}

export default function AdminSpecialties({ auth, specialties = [], filters = {} }: SpecialtiesProps) {
    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Chuyên khoa"
        >
            <Head title="Quản lý Chuyên khoa - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <SpecialtiesTab specialties={specialties} filters={filters} />
            </div>
        </DashboardLayout>
    );
}
