import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function Login({
    status,
    canResetPassword,
    info,
}: {
    status?: string;
    canResetPassword: boolean;
    info?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Đăng nhập - SmartCare" />

            {/* Thanh điều hướng nhanh: Quay lại trang chủ hoặc chuyển sang Đăng ký */}
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Quay lại trang chủ
                </Link>

                <Link
                    href={route('register')}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    Đăng ký tài khoản
                </Link>
            </div>

            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">Đăng nhập tài khoản</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Đăng nhập để đặt lịch khám và tra cứu hồ sơ sức khỏe
                </p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    {status}
                </div>
            )}

            {info && (
                <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm flex items-center gap-2 font-medium">
                    <span>ℹ️</span>
                    <span>{info}</span>
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email hoặc Tên đăng nhập" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        placeholder="admin@smartcare.vn"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
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
                        autoComplete="current-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Ghi nhớ đăng nhập
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                        >
                            Quên mật khẩu?
                        </Link>
                    )}
                </div>

                <div className="mt-6">
                    <PrimaryButton className="w-full justify-center py-2.5 text-base font-semibold shadow-md" disabled={processing}>
                        {processing ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </PrimaryButton>
                </div>

                {/* Chuyển qua đăng ký tài khoản */}
                <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-600">
                        Chưa có tài khoản bệnh nhân?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
