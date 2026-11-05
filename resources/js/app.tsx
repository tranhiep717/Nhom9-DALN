import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Giữ meta csrf-token và headers axios luôn đồng bộ tuyệt đối với session hiện tại trên mọi thao tác SPA
function syncCsrfToken(pageProps?: Record<string, unknown>) {
    const csrfToken = pageProps?.csrf_token as string | undefined;
    if (csrfToken && typeof document !== 'undefined') {
        const meta = document.head.querySelector('meta[name="csrf-token"]');
        if (meta) {
            meta.setAttribute('content', csrfToken);
        }
        if (typeof window !== 'undefined') {
            (window as unknown as { __csrfToken?: string }).__csrfToken = csrfToken;
            if (window.axios) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
            }
        }
    }
}

// Đồng bộ khi chuyển trang thành công (bao gồm cả redirects sau POST/PUT/DELETE có replace: true)
router.on('success', (event) => {
    syncCsrfToken(event.detail.page?.props as Record<string, unknown> | undefined);
});

router.on('navigate', (event) => {
    syncCsrfToken(event.detail.page?.props as Record<string, unknown> | undefined);
});

// Chặn modal iframe 419 mặc định của Inertia (hỗ trợ cả Inertia 1.x và Inertia 2.0 response wrapper)
router.on('invalid', (event) => {
    const rawDetail = event.detail as Record<string, unknown> | undefined;
    const innerResponse = rawDetail?.response as Record<string, unknown> | undefined;
    const httpResponse = (innerResponse?.response ?? innerResponse) as { status?: number } | undefined;
    const status = httpResponse?.status;

    if (status === 419) {
        event.preventDefault();
        window.location.reload();
        return false;
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
