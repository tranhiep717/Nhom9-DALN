import DashboardLayout from '@/Layouts/DashboardLayout';
import { CLS_NAV_ITEMS } from '@/constants/navigation';
import { Head } from '@inertiajs/react';
import PersonalScheduleTimetable, { ScheduleItem, PeerRequestItem } from '@/Components/PersonalScheduleTimetable';
import { ColleagueOption } from '@/Components/RequestModal';

interface Props {
    auth: any;
    schedules?: ScheduleItem[];
    requestsForMe?: PeerRequestItem[];
    myRequests?: PeerRequestItem[];
    colleagues?: ColleagueOption[];
    filters?: {
        date?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function CanLamSangSchedule({ 
    auth, 
    schedules = [], 
    requestsForMe = [], 
    myRequests = [], 
    colleagues = [],
    filters = {} 
}: Props) {
    const userName = auth?.user?.name || auth?.user?.HoTen || auth?.user?.TenDangNhap || 'Kỹ thuật viên';
    const userCode = `CLS-${String(auth?.user?.MaTaiKhoan || '01').padStart(3, '0')}`;

    return (
        <DashboardLayout
            role="cls"
            navItems={CLS_NAV_ITEMS}
            user={{ name: userName, code: userCode }}
            header="Lịch làm việc Cận lâm sàng"
        >
            <Head title="Thời khóa biểu ca trực KTV Cận lâm sàng - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PersonalScheduleTimetable
                    schedules={schedules}
                    rolePrefix="cls"
                    roleDisplayName="Kỹ thuật viên Cận lâm sàng"
                    requestsForMe={requestsForMe}
                    myRequests={myRequests}
                    colleagues={colleagues}
                    filters={filters}
                />
            </div>
        </DashboardLayout>
    );
}
