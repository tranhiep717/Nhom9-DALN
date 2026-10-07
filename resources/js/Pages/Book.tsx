import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, HeartPulse, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Book({ auth }: PageProps<{}>) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        specialty: '',
        doctor: '',
        date: '',
        time: '',
        reason: '',
    });

    const specialties = ['Nội tổng quát', 'Nhi khoa', 'Tai mũi họng', 'Da liễu', 'Sản phụ khoa'];
    const doctors = [
        { id: 1, name: 'BS. Nguyễn Văn A', spec: 'Nội tổng quát' },
        { id: 2, name: 'BS. Trần Thị B', spec: 'Nhi khoa' },
        { id: 3, name: 'BS. Lê Văn C', spec: 'Tai mũi họng' }
    ];
    const timeSlots = ['08:00 - 08:30', '09:00 - 09:30', '10:00 - 10:30', '14:00 - 14:30', '15:00 - 15:30'];

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate save to local storage
        const appointments = JSON.parse(localStorage.getItem('smartcare_appointments') || '[]');
        appointments.push({ ...formData, id: Date.now(), status: 'Chờ duyệt' });
        localStorage.setItem('smartcare_appointments', JSON.stringify(appointments));
        setStep(6); // Success step
    };

    return (
        <PublicLayout>
            <Head title="Đặt lịch khám - SmartCare" />

            <div className="bg-neutral min-h-screen py-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-darkblue mb-2">Đặt lịch khám bệnh</h1>
                        <p className="text-gray-600">Vui lòng điền thông tin để chúng tôi phục vụ bạn tốt nhất</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-8 relative">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                        <div className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                        
                        {[
                            { num: 1, label: 'Chuyên khoa' },
                            { num: 2, label: 'Bác sĩ & Lịch' },
                            { num: 3, label: 'Lý do khám' },
                            { num: 4, label: 'Xác nhận' },
                            { num: 5, label: 'Tạm ứng' }
                        ].map((s) => (
                            <div key={s.num} className="relative z-10 flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors ${step >= s.num ? 'bg-primary text-white border-primary-light' : 'bg-gray-100 text-gray-400 border-white'}`}>
                                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                                </div>
                                <span className={`absolute top-12 text-xs font-medium w-20 text-center ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Form Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 mt-16">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-darkblue mb-6 flex items-center"><HeartPulse className="mr-2 text-primary" /> Chọn chuyên khoa</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {specialties.map((spec) => (
                                        <button
                                            key={spec}
                                            onClick={() => {
                                                setFormData({ ...formData, specialty: spec });
                                                handleNext();
                                            }}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${formData.specialty === spec ? 'border-primary bg-primary-light/20 text-primary font-bold' : 'border-gray-100 hover:border-primary-light hover:bg-gray-50'}`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-darkblue mb-6 flex items-center"><User className="mr-2 text-primary" /> Chọn bác sĩ & Thời gian</h3>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bác sĩ</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {doctors.filter(d => !formData.specialty || d.spec === formData.specialty).map((doc) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => setFormData({ ...formData, doctor: doc.name })}
                                                className={`p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.doctor === doc.name ? 'border-primary bg-primary-light/20' : 'border-gray-100 hover:border-primary-light hover:bg-gray-50'}`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold">{doc.name.charAt(4)}</div>
                                                <div>
                                                    <div className={`font-bold ${formData.doctor === doc.name ? 'text-primary' : 'text-gray-800'}`}>{doc.name}</div>
                                                    <div className="text-sm text-gray-500">{doc.spec}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày khám</label>
                                        <input 
                                            type="date" 
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giờ khám</label>
                                        <select 
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm"
                                        >
                                            <option value="">-- Chọn giờ --</option>
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <button onClick={handlePrev} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Quay lại</button>
                                    <button 
                                        onClick={handleNext} 
                                        disabled={!formData.doctor || !formData.date || !formData.time}
                                        className="px-6 py-2.5 bg-primary rounded-xl text-white font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center"
                                    >
                                        Tiếp tục <ChevronRight className="w-5 h-5 ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-darkblue mb-6 flex items-center"><FileText className="mr-2 text-primary" /> Lý do khám</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Triệu chứng / Vấn đề sức khỏe</label>
                                    <textarea 
                                        rows={4}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Mô tả chi tiết triệu chứng của bạn để bác sĩ nắm rõ hơn..."
                                        className="w-full rounded-xl border-gray-300 focus:border-primary focus:ring-primary shadow-sm"
                                    ></textarea>
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <button onClick={handlePrev} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Quay lại</button>
                                    <button 
                                        onClick={handleNext} 
                                        disabled={!formData.reason}
                                        className="px-6 py-2.5 bg-primary rounded-xl text-white font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center"
                                    >
                                        Tiếp tục <ChevronRight className="w-5 h-5 ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-darkblue mb-6">Xác nhận thông tin đặt lịch</h3>
                                
                                <div className="bg-primary-light/20 rounded-xl p-6 border border-primary-light">
                                    <dl className="divide-y divide-gray-200">
                                        <div className="py-3 flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Chuyên khoa</dt>
                                            <dd className="text-sm font-bold text-gray-900">{formData.specialty}</dd>
                                        </div>
                                        <div className="py-3 flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Bác sĩ</dt>
                                            <dd className="text-sm font-bold text-gray-900">{formData.doctor}</dd>
                                        </div>
                                        <div className="py-3 flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Thời gian</dt>
                                            <dd className="text-sm font-bold text-gray-900">{formData.time} | {formData.date}</dd>
                                        </div>
                                        <div className="py-3 flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">Lý do khám</dt>
                                            <dd className="text-sm text-gray-900 text-right max-w-xs">{formData.reason}</dd>
                                        </div>
                                        <div className="py-3 flex justify-between bg-orange-50 -mx-6 px-6 mt-2 border-t-2 border-orange-200">
                                            <dt className="text-sm font-bold text-orange-800">Tạm ứng dự kiến</dt>
                                            <dd className="text-lg font-bold text-orange-600">100.000đ</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                                    <span className="font-bold">Chính sách tạm ứng:</span> Khoản tạm ứng 100.000đ để giữ chỗ, sẽ được khấu trừ vào tổng chi phí sau khi khám. Nếu bạn hủy lịch trước 24h, hệ thống sẽ hoàn tiền tự động.
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <button onClick={handlePrev} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Quay lại</button>
                                    <button 
                                        onClick={handleNext} 
                                        className="px-8 py-2.5 bg-primary rounded-xl text-white font-bold hover:bg-primary-hover flex items-center shadow-md"
                                    >
                                        Chuyển đến Tạm ứng <ChevronRight className="w-5 h-5 ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-darkblue mb-6">Tạm ứng qua VNPay (Demo)</h3>
                                
                                <div className="bg-white rounded-xl p-6 border border-gray-200 text-center mb-6">
                                    <div className="text-gray-500 mb-2">Số tiền cần thanh toán</div>
                                    <div className="text-3xl font-bold text-primary mb-4">100.000đ</div>
                                    <div className="text-sm text-gray-500">Mã đơn: BOOK_{Date.now().toString().slice(-6)}</div>
                                </div>

                                <div className="mt-4 p-4 bg-orange-50 text-orange-800 rounded-xl text-sm border border-orange-100 text-center">
                                    Đây là màn hình thanh toán mô phỏng. Bấm Xác nhận thanh toán để hoàn tất đặt lịch.
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <button onClick={handlePrev} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Hủy</button>
                                    <button 
                                        onClick={handleSubmit} 
                                        className="px-8 py-2.5 bg-green-600 rounded-xl text-white font-bold hover:bg-green-700 flex items-center shadow-md"
                                    >
                                        Thanh toán thành công <CheckCircle2 className="w-5 h-5 ml-2" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="text-center animate-in zoom-in py-10">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-darkblue mb-2">Đặt lịch & Tạm ứng thành công!</h3>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    Cảm ơn bạn đã tin tưởng SmartCare. Lịch hẹn của bạn đã được xác nhận (Mã: BOOK_{Date.now().toString().slice(-6)}).
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Link href="/" className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                                        Về trang chủ
                                    </Link>
                                    <Link href="/appointments" className="px-6 py-2.5 bg-primary rounded-xl text-white font-medium hover:bg-primary-hover">
                                        Xem lịch hẹn
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
