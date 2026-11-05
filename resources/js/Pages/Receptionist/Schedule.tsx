import DashboardLayout from '@/Layouts/DashboardLayout';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';
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

export default function ReceptionistSchedule({ 
    auth, 
    schedules = [], 
    requestsForMe = [], 
    myRequests = [], 
    colleagues = [],
    filters = {} 
}: Props) {
    const userName = auth?.user?.name || auth?.user?.HoTen || auth?.user?.TenDangNhap || 'Nhân viên Lễ tân';
    const userCode = `LT-${String(auth?.user?.MaTaiKhoan || '01').padStart(3, '0')}`;

    return (
        <DashboardLayout
            role="receptionist"
            navItems={RECEPTIONIST_NAV_ITEMS}
            user={{ name: userName, code: userCode }}
            header="Lịch làm việc Lễ tân"
        >
            <Head title="Thời khóa biểu ca trực Lễ tân - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PersonalScheduleTimetable
                    schedules={schedules}
                    rolePrefix="receptionist"
                    roleDisplayName="Nhân viên Tiếp đón & Lễ tân"
                    requestsForMe={requestsForMe}
                    myRequests={myRequests}
                    colleagues={colleagues}
                    filters={filters}
                />
            </div>
        </DashboardLayout>
    );
}
