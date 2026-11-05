import StaffAttendanceView, { AttendanceRecord, PayrollRecord, ScheduleRecord, StaffRequestItem } from '@/Components/StaffAttendanceView';
import { DOCTOR_NAV_ITEMS } from '@/constants/navigation';

interface Props {
    auth: any;
    month: string;
    todayRecord?: AttendanceRecord | null;
    todaySchedule?: ScheduleRecord | null;
    records?: PayrollRecord[];
    attendance?: AttendanceRecord[];
    doctor?: any;
    myRequests?: StaffRequestItem[];
    colleagues?: any[];
}

export default function DoctorPayroll({
    auth,
    month,
    todayRecord,
    todaySchedule,
    records = [],
    attendance = [],
    doctor,
    myRequests = [],
    colleagues = [],
}: Props) {
    const monthlyPayroll = records.length > 0 ? records[0] : null;

    return (
        <StaffAttendanceView
            auth={auth}
            role="doctor"
            navItems={DOCTOR_NAV_ITEMS}
            roleTitle={`Bác sĩ ${doctor?.HoTen || auth?.user?.TenDangNhap || ''}`}
            roleCode={doctor?.MaBacSi ? `BS${String(doctor.MaBacSi).padStart(3, '0')}` : 'BS-SC'}
            month={month}
            todayRecord={todayRecord}
            todaySchedule={todaySchedule}
            monthlyPayroll={monthlyPayroll}
            monthlyAttendance={attendance}
            myRequests={myRequests}
            colleagues={colleagues}
        />
    );
}
