import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import DoctorsTab, { DoctorItem, SpecialtyItem } from './Tabs/DoctorsTab';

interface AdminDoctorsProps {
    auth: any;
    doctors: DoctorItem[];
    chuyenKhoas: SpecialtyItem[];
    filters: {
        search?: string;
        specialty_id?: string;
        status?: string;
    };
}

export default function AdminDoctors({ auth, doctors = [], chuyenKhoas = [], filters = {} }: AdminDoctorsProps) {
    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý Bác sĩ"
        >
            <Head title="Quản lý Bác sĩ - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <DoctorsTab doctors={doctors} chuyenKhoas={chuyenKhoas} filters={filters} />
            </div>
        </DashboardLayout>
    );
}
