import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

// Helper đọc CSRF token mới nhất từ bộ nhớ toàn cục hoặc DOM thẻ meta
export function getLatestCsrfToken(): string | null {
    if (typeof window !== 'undefined' && (window as unknown as { __csrfToken?: string }).__csrfToken) {
        return (window as unknown as { __csrfToken?: string }).__csrfToken || null;
    }
    if (typeof document !== 'undefined') {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
    }
    return null;
}

// Tự động gắn X-CSRF-TOKEN cập nhật mới nhất cho mọi request axios
window.axios.interceptors.request.use((config) => {
    const token = getLatestCsrfToken();
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

// Interceptor xử lý lỗi 419 (Page Expired / CSRF mismatch) và 401 (Unauthenticated)
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            console.warn('[Security] CSRF token mismatch / Phiên làm việc đã hết hạn (419). Tự động làm mới trang...');
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } else if (error.response?.status === 401) {
            console.warn('[Security] Phiên đăng nhập chưa được xác thực hoặc đã kết thúc (401).');
        }
        return Promise.reject(error);
    }
);
