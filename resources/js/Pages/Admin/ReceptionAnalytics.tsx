import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { adminNavItems } from '@/constants/navigation';
import ReceptionAnalyticsTab, { KPI, VisitItem } from './Tabs/ReceptionAnalyticsTab';

interface ReceptionAnalyticsProps {
    auth: any;
    kpi: KPI;
    charts: {
        bySpecialty: Array<{ name: string; count: number }>;
        byDoctor: Array<{ name: string; count: number }>;
        byShift: Array<{ name: string; count: number }>;
        sourceDistribution: Array<{ name: string; value: number; color: string }>;
        statusDistribution: Array<{ name: string; value: number; color: string }>;
    };
    visits: {
        data: VisitItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    specialties: Array<{ MaChuyenKhoa: number; TenChuyenKhoa: string }>;
    doctors: Array<{ MaBacSi: number; HoTen: string; HocVi?: string }>;
    filters: {
        time_range?: string;
        from_date?: string;
        to_date?: string;
        specialty_id?: number | null;
        doctor_id?: number | null;
        status?: string;
        source?: string;
        search?: string;
        per_page?: number;
    };
}

export default function ReceptionAnalytics(props: ReceptionAnalyticsProps) {
    return (
        <DashboardLayout role="admin" navItems={adminNavItems} header="Giám sát Tiếp đón & Hàng chờ">
            <Head title="Giám sát & Thống kê Tiếp đón - Hàng chờ Toàn viện - SmartCare" />
            <div className="max-w-7xl mx-auto">
                <ReceptionAnalyticsTab {...props} />
            </div>
        </DashboardLayout>
    );
}
