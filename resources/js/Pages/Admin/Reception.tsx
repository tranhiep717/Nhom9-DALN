import ReceptionistDashboard, { ReceptionistDashboardProps } from '@/Pages/Receptionist/Dashboard';
import { adminNavItems } from '@/constants/navigation';

export default function Reception(props: ReceptionistDashboardProps) {
    return (
        <ReceptionistDashboard
            {...props}
            role="admin"
            navItems={adminNavItems}
            queueUrl="/admin/queue"
            header="Bàn tiếp đón Lễ tân (Quản trị viên)"
        />
    );
}
