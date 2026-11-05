import StaffAttendanceView, { AttendanceRecord, PayrollRecord, ScheduleRecord, StaffRequestItem } from '@/Components/StaffAttendanceView';
import { CLS_NAV_ITEMS } from '@/constants/navigation';

interface Props {
    auth: any;
    month: string;
    todayRecord?: AttendanceRecord | null;
    todaySchedule?: ScheduleRecord | null;
    monthlyPayroll?: PayrollRecord | null;
    monthlyAttendance?: AttendanceRecord[];
    myRequests?: StaffRequestItem[];
}

export default function CanLamSangAttendance(props: Props) {
    return (
        <StaffAttendanceView
            {...props}
            role="cls"
            navItems={CLS_NAV_ITEMS}
            roleTitle="Kỹ thuật viên Cận lâm sàng"
            roleCode="CLS-SC"
        />
    );
}
