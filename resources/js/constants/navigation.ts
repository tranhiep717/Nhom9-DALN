import {
    LayoutDashboard,
    Calendar,
    CreditCard,
    FileText,
    Stethoscope,
    FlaskConical,
    Activity,
    Wallet,
    KeyRound,
    Users,
    HeartPulse,
    DollarSign,
    Pill,
    Building2,
    CalendarClock,
    Receipt,
    BarChart3,
} from 'lucide-react';
import type React from 'react';

export interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

/**
 * Cấu hình menu chuẩn dùng chung cho tất cả các trang thuộc phân hệ Quản trị viên (Admin)
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
    { name: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tài khoản người dùng', href: '/admin/users', icon: KeyRound },
    { name: 'Quản lý Bệnh nhân', href: '/admin/patients', icon: Users },
    { name: 'Quản lý Bác sĩ', href: '/admin/doctors', icon: Stethoscope },
    { name: 'Quản lý Chuyên khoa', href: '/admin/specialties', icon: HeartPulse },
    { name: 'Lịch & Ca khám toàn viện', href: '/admin/schedules', icon: Calendar },
    { name: 'Chấm công & Lương', href: '/admin/payroll', icon: DollarSign },
    { name: 'Quản lý kho Thuốc', href: '/admin/medicines', icon: Pill },
    { name: 'Dịch vụ y tế', href: '/admin/services', icon: Building2 },
    { name: 'Giám sát Cận lâm sàng', href: '/admin/cls-monitor', icon: FlaskConical },
    { name: 'Giám sát Tiếp đón & Hàng chờ', href: '/admin/reception-analytics', icon: CalendarClock },
    { name: 'Hóa đơn & Viện phí', href: '/admin/invoices', icon: Receipt },
    { name: 'Báo cáo & Doanh thu', href: '/admin/reports', icon: BarChart3 },
];

export const adminNavItems = ADMIN_NAV_ITEMS;

/**
 * Cấu hình menu chuẩn dùng chung cho tất cả các trang thuộc phân hệ Lễ tân (Receptionist)
 * Tuyệt đối không khai báo lặp lại ở từng trang riêng biệt.
 */
export const RECEPTIONIST_NAV_ITEMS: NavItem[] = [
    {
        name: 'Tổng quan',
        href: '/receptionist/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Hàng chờ & Tiếp nhận',
        href: '/receptionist/queue',
        icon: Calendar,
    },
    {
        name: 'Thanh toán',
        href: '/receptionist/payment',
        icon: CreditCard,
    },
    {
        name: 'Hồ sơ bệnh nhân',
        href: '/receptionist/records',
        icon: FileText,
    },
    {
        name: 'Lịch trực ca',
        href: '/receptionist/schedule',
        icon: CalendarClock,
    },
    {
        name: 'Chấm công & Lương',
        href: '/receptionist/attendance',
        icon: Wallet,
    },
];

/**
 * Cấu hình menu chuẩn dùng chung cho tất cả các trang thuộc phân hệ Bác sĩ (Doctor)
 * Thống nhất trên Dashboard, Examine và Schedule, không khai báo rời rạc.
 */
export const DOCTOR_NAV_ITEMS: NavItem[] = [
    {
        name: 'Tổng quan',
        href: '/doctor/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Khám bệnh & CLS',
        href: '/doctor/examine',
        icon: Stethoscope,
    },
    {
        name: 'Bệnh nhân chờ CLS',
        href: '/doctor/cls-patients',
        icon: FlaskConical,
    },
    {
        name: 'Lịch làm việc',
        href: '/doctor/schedule',
        icon: Calendar,
    },
    {
        name: 'Chấm công & Lương',
        href: '/doctor/payroll',
        icon: Wallet,
    },
];

export const CLS_NAV_ITEMS: NavItem[] = [
    {
        name: 'Bàn làm việc CLS',
        href: '/cls/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Lịch làm việc',
        href: '/cls/schedule',
        icon: Calendar,
    },
    {
        name: 'Danh sách chỉ định',
        href: '/cls/requests',
        icon: FlaskConical,
    },
    {
        name: 'Bệnh nhân chờ thực hiện',
        href: '/cls/pending',
        icon: Stethoscope,
    },
    {
        name: 'Đang thực hiện',
        href: '/cls/processing',
        icon: Activity,
    },
    {
        name: 'Kết quả CLS',
        href: '/cls/results',
        icon: FileText,
    },
    {
        name: 'Chấm công & Lương',
        href: '/cls/attendance',
        icon: Wallet,
    },
];
