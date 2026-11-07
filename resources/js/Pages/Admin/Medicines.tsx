import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import MedicinesTab, { MedicineItem } from './Tabs/MedicinesTab';

interface MedicinesProps {
    auth: any;
    medicines: MedicineItem[];
    filters: {
        search?: string;
        dang_bao_che?: string;
        status?: string;
    };
}

export default function AdminMedicines({ auth, medicines = [], filters = {} }: MedicinesProps) {
    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
            user={{ name: auth?.user?.TenDangNhap || 'Quản trị viên', code: 'ADMIN' }}
            header="Quản lý kho Thuốc"
        >
            <Head title="Quản lý kho Thuốc - SmartCare Admin" />
            <div className="max-w-7xl mx-auto">
                <MedicinesTab medicines={medicines} filters={filters} />
            </div>
        </DashboardLayout>
    );
}
