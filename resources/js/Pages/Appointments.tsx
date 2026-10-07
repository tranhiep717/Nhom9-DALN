import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState, useEffect } from 'react';
import { Calendar, User, Clock, FileText, AlertCircle, XCircle } from 'lucide-react';

export default function Appointments({ auth }: PageProps<{}>) {
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('smartcare_appointments') || '[]');
        setAppointments(data.reverse());
    }, []);

    const cancelAppointment = (id: number) => {
        if(confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
            const updated = appointments.map(app => app.id === id ? { ...app, status: 'Đã hủy' } : app);
            setAppointments(updated);
            localStorage.setItem('smartcare_appointments', JSON.stringify(updated.reverse()));
        }
    };

    return (
        <PublicLayout>
            <Head title="Lịch hẹn của tôi - SmartCare" />

            <div className="bg-neutral min-h-screen py-10">
                <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-darkblue mb-2">Lịch hẹn của tôi</h1>
                        <p className="text-gray-600">Quản lý các lịch khám bạn đã đặt</p>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Bạn chưa có lịch hẹn nào</h3>
                            <p className="text-gray-500 mb-6">Hãy đặt lịch khám để chúng tôi chăm sóc sức khỏe cho bạn.</p>
                            <Link href="/book" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover">
                                Đặt lịch ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((app) => (
                                <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${app.status === 'Chờ duyệt' ? 'bg-orange-100 text-orange-700' : app.status === 'Đã hủy' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {app.status}
                                            </span>
                                            <span className="text-sm text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-1" /> Mã LH: #{app.id.toString().slice(-6)}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Chuyên khoa / Bác sĩ</p>
                                                <p className="font-bold text-darkblue flex items-center"><User className="w-4 h-4 mr-1 text-primary" /> {app.doctor} ({app.specialty})</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Thời gian khám</p>
                                                <p className="font-bold text-darkblue flex items-center"><Calendar className="w-4 h-4 mr-1 text-primary" /> {app.time} | {app.date}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="text-sm text-gray-500 mb-1">Lý do khám</p>
                                                <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{app.reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:w-48 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-3">
                                        <button disabled className="w-full py-2 bg-primary-light/50 text-primary font-medium rounded-lg text-sm disabled:opacity-50 flex items-center justify-center">
                                            <FileText className="w-4 h-4 mr-1" /> Chi tiết
                                        </button>
                                        {app.status === 'Chờ duyệt' && (
                                            <button 
                                                onClick={() => cancelAppointment(app.id)}
                                                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" /> Hủy lịch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
