import StaffAttendanceView, { AttendanceRecord, PayrollRecord, ScheduleRecord, StaffRequestItem } from '@/Components/StaffAttendanceView';
import { RECEPTIONIST_NAV_ITEMS } from '@/constants/navigation';

interface Props {
    auth: any;
    month: string;
    todayRecord?: AttendanceRecord | null;
    todaySchedule?: ScheduleRecord | null;
    monthlyPayroll?: PayrollRecord | null;
    monthlyAttendance?: AttendanceRecord[];
    myRequests?: StaffRequestItem[];
}

export default function ReceptionistAttendance(props: Props) {
    return (
        <StaffAttendanceView
            {...props}
            role="receptionist"
            navItems={RECEPTIONIST_NAV_ITEMS}
            roleTitle="Lễ tân / Thu ngân"
            roleCode="LT-SC"
        />
    );
}
