<?php

namespace App\Http\Requests;

use App\Models\TaiKhoan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->getKey();

        return [
            'name' => ['nullable', 'string', 'max:100'],
            'TenDangNhap' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique(TaiKhoan::class, 'TenDangNhap')->ignore($userId, 'MaTaiKhoan'),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:100',
                Rule::unique(TaiKhoan::class, 'Email')->ignore($userId, 'MaTaiKhoan'),
            ],
        ];
    }

    /**
     * Tùy chỉnh thông báo lỗi tiếng Việt
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email không được để trống.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.unique' => 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.',
            'TenDangNhap.unique' => 'Tên đăng nhập này đã được sử dụng.',
            'name.max' => 'Họ và tên không được vượt quá 100 ký tự.',
        ];
    }
}
