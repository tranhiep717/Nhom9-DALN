import DashboardLayout from '@/Layouts/DashboardLayout';
import { DOCTOR_NAV_ITEMS } from '@/constants/navigation';
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
        doctor_id?: string;
    };
}

export default function DoctorSchedule({ 
    auth, 
    schedules = [], 
    requestsForMe = [], 
    myRequests = [], 
    colleagues = [],
    filters = {} 
}: Props) {
    const doctorName = auth?.user?.bac_si?.HoTen || auth?.user?.bacSi?.HoTen || auth?.user?.TenDangNhap || 'Bác sĩ';
    const doctorCode = auth?.user?.bac_si?.MaBacSi 
        ? `BS${String(auth.user.bac_si.MaBacSi).padStart(3, '0')}` 
        : (auth?.user?.bacSi?.MaBacSi ? `BS${String(auth.user.bacSi.MaBacSi).padStart(3, '0')}` : 'BS-SC');

    return (
        <DashboardLayout
            role="doctor"
            navItems={DOCTOR_NAV_ITEMS}
            user={{ name: doctorName, code: doctorCode }}
            header="Lịch làm việc Bác sĩ"
        >
            <Head title="Thời khóa biểu ca trực Bác sĩ - SmartCare" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PersonalScheduleTimetable
                    schedules={schedules}
                    rolePrefix="doctor"
                    roleDisplayName="Bác sĩ điều trị"
                    requestsForMe={requestsForMe}
                    myRequests={myRequests}
                    colleagues={colleagues}
                    filters={filters}
                />
            </div>
        </DashboardLayout>
    );
}
