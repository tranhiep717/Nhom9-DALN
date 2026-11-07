import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Đăng ký tài khoản - SmartCare" />

            {/* Thanh điều hướng nhanh: Quay lại trang chủ hoặc chuyển sang Đăng nhập */}
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Quay lại trang chủ
                </Link>

                <Link
                    href={route('login')}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    <LogIn className="w-3.5 h-3.5" />
                    Đăng nhập
                </Link>
            </div>

            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">Đăng ký tài khoản mới</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Tạo tài khoản bệnh nhân để dễ dàng đặt lịch khám và xem kết quả y tế
                </p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Họ và tên" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        placeholder="nguyenvana@example.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Mật khẩu" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Xác nhận mật khẩu"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-6">
                    <PrimaryButton className="w-full justify-center py-2.5 text-base font-semibold shadow-md" disabled={processing}>
                        {processing ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
                    </PrimaryButton>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
