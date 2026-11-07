import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    const { props } = usePage();
    const authUser = (props as any)?.auth?.user;

    const getLogoUrl = () => {
        if (!authUser) return '/';
        const role = authUser.vai_tro?.TenVaiTro;
        if (role === 'QUAN_TRI_VIEN') return '/admin/dashboard';
        if (role === 'BAC_SI') return '/doctor/dashboard';
        if (role === 'LE_TAN') return '/receptionist/dashboard';
        return '/dashboard';
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/40 py-8 px-4 sm:px-6">
            <div className="mb-2">
                <Link href={getLogoUrl()} className="flex items-center gap-2.5 group">
                    <ApplicationLogo className="h-12 w-12 transition-transform group-hover:scale-105" />
                    <span className="text-2xl font-bold text-darkblue tracking-tight">SmartCare</span>
                </Link>
            </div>

            <div className="mt-4 w-full overflow-hidden bg-white px-6 py-6 shadow-xl shadow-slate-200/50 border border-slate-100 sm:max-w-md rounded-2xl">
                {children}
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Hệ thống Phòng khám Đa khoa SmartCare. All rights reserved.
            </div>
        </div>
    );
}
