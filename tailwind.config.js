import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: '#123B64', // Navy blue
                    hover: '#0C2742',
                    light: '#F5F8FA',
                },
                teal: {
                    DEFAULT: '#008C95',
                    hover: '#006D74',
                    light: '#E0F2F2',
                },
                secondary: '#F5F8FA',
                dark: '#0f172a',
                darkblue: '#123B64',
            }
        },
    },

    plugins: [forms],
};
