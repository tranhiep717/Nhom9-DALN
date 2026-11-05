import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail = false,
    status,
    className = '',
}: {
    mustVerifyEmail?: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user as any;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user?.name || user?.HoTen || user?.TenDangNhap || '',
            email: user?.email || user?.Email || '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Thông tin tài khoản
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Cập nhật họ tên hiển thị và địa chỉ email liên hệ của bạn.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="username" value="Tên đăng nhập" />
                    <TextInput
                        id="username"
                        className="mt-1 block w-full bg-gray-50 text-gray-500 cursor-not-allowed"
                        value={user?.TenDangNhap || ''}
                        disabled
                    />
                    <p className="mt-1 text-xs text-gray-400">Tên đăng nhập hệ thống được quản lý bảo mật.</p>
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Họ và tên" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Địa chỉ Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Lưu thay đổi</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-emerald-600 font-medium">
                            Đã lưu thành công.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
